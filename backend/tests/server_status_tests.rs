use axum::body::Body;
use axum::http::{Method, Request, StatusCode, header};
use bytes::Bytes;
use http_body_util::BodyExt;
use serde_json::{Value, json};
use sqlx::Row;
use tokio::io::{AsyncRead, AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;
use tower::ServiceExt;

use haohan_backend::config::Config;
use haohan_backend::db::Db;
use haohan_backend::integrations::minecraft_ping::{
    MinecraftServerStatus, encode_varint, ping_server, ping_server_checked, read_varint,
};
use haohan_backend::router::build_router;
use haohan_backend::state::{AppState, SharedState};

async fn response_json(resp: axum::response::Response) -> (StatusCode, Value) {
    let status = resp.status();
    let bytes = resp.into_body().collect().await.unwrap().to_bytes();
    let val = serde_json::from_slice(&bytes).unwrap_or(Value::Null);
    (status, val)
}

async fn read_packet_string<R: AsyncRead + Unpin>(reader: &mut R) -> String {
    let len = read_varint(reader).await.unwrap() as usize;
    let mut buf = vec![0u8; len];
    reader.read_exact(&mut buf).await.unwrap();
    String::from_utf8(buf).unwrap()
}

#[tokio::test]
async fn slp_ping_parses_mock_tcp_server_response_and_handles_offline() {
    let sample_json = json!({
        "version": { "name": "Paper 1.20.4", "protocol": 765 },
        "players": {
            "max": 100,
            "online": 2,
            "sample": [
                { "name": "Steve", "id": "8667ba71-b85a-4004-af54-457a9734eed7" },
                { "name": "Alex", "id": "ec561538-f3fd-461d-aff5-086b22154bce" }
            ]
        },
        "description": { "text": "HaoHan SMP Survival" }
    })
    .to_string();

    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let port = listener.local_addr().unwrap().port();

    let server_json = sample_json.clone();
    let server_task = tokio::spawn(async move {
        let (mut socket, _) = listener.accept().await.unwrap();
        // Packet 1: Handshake
        let _hs_len = read_varint(&mut socket).await.unwrap();
        let hs_id = read_varint(&mut socket).await.unwrap();
        assert_eq!(hs_id, 0x00);
        let proto = read_varint(&mut socket).await.unwrap();
        assert_eq!(proto, 765);
        let host = read_packet_string(&mut socket).await;
        assert_eq!(host, "127.0.0.1");
        let mut port_buf = [0u8; 2];
        socket.read_exact(&mut port_buf).await.unwrap();
        assert_eq!(u16::from_be_bytes(port_buf), port);
        let next_state = read_varint(&mut socket).await.unwrap();
        assert_eq!(next_state, 1);

        // Packet 2: Status Request
        let req_len = read_varint(&mut socket).await.unwrap();
        assert_eq!(req_len, 1);
        let req_id = read_varint(&mut socket).await.unwrap();
        assert_eq!(req_id, 0x00);

        // Write Status Response: VarInt(PacketLen) + VarInt(0x00) + VarInt(JsonLen) + JSON
        let json_bytes = server_json.as_bytes();
        let mut inner = Vec::new();
        encode_varint(0x00, &mut inner);
        encode_varint(json_bytes.len() as u32, &mut inner);
        inner.extend_from_slice(json_bytes);

        let mut frame = Vec::new();
        encode_varint(inner.len() as u32, &mut frame);
        frame.extend_from_slice(&inner);
        socket.write_all(&frame).await.unwrap();
        socket.flush().await.unwrap();
    });

    let status = ping_server("127.0.0.1", port).await;
    server_task.await.unwrap();

    assert!(status.online);
    assert_eq!(status.online_players, 2);
    assert_eq!(status.max_players, 100);
    assert_eq!(status.motd, "HaoHan SMP Survival");
    assert_eq!(status.version, "Paper 1.20.4");
    assert_eq!(status.players_list, vec!["Steve", "Alex"]);
    assert_eq!(status.tps, 20.0);

    // Oversized JSON (> 64KB) must be rejected cleanly by cap
    let cap_listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let cap_port = cap_listener.local_addr().unwrap().port();
    let cap_task = tokio::spawn(async move {
        let (mut socket, _) = cap_listener.accept().await.unwrap();
        let mut sink = [0u8; 256];
        let _ = socket.read(&mut sink).await;
        let mut inner = Vec::new();
        encode_varint(0x00, &mut inner);
        encode_varint((65 * 1024) as u32, &mut inner);
        let mut frame = Vec::new();
        encode_varint(inner.len() as u32, &mut frame);
        frame.extend_from_slice(&inner);
        let _ = socket.write_all(&frame).await;
    });
    assert!(ping_server_checked("127.0.0.1", cap_port).await.is_err());
    cap_task.await.unwrap();

    // Closed port returns offline fallback cleanly
    let closed_listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let closed_port = closed_listener.local_addr().unwrap().port();
    drop(closed_listener);
    let offline = ping_server("127.0.0.1", closed_port).await;
    assert_eq!(offline, MinecraftServerStatus::offline());
}

#[tokio::test]
async fn get_server_status_serves_arcswap_snapshot_with_cache_headers() {
    let db = Db::connect_in_memory().await.unwrap();
    let state: SharedState = AppState::new(Config::for_test(), db).unwrap();
    let app = build_router(state.clone());

    // Default offline snapshot
    let resp = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/server/status")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        resp.headers()
            .get(header::CACHE_CONTROL)
            .and_then(|v| v.to_str().ok()),
        Some("public, max-age=5, s-maxage=10")
    );
    let (status, body) = response_json(resp).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["online"], false);
    assert_eq!(body["motd"], "Server is offline");

    // Store updated online snapshot
    let updated = serde_json::to_vec(&MinecraftServerStatus {
        online: true,
        online_players: 12,
        max_players: 100,
        motd: "HaoHan SMP".to_string(),
        version: "1.20.4".to_string(),
        players_list: vec!["Steve".to_string()],
        tps: 20.0,
    })
    .unwrap();
    state.status.store(Bytes::from(updated).into());

    let (status, body) = response_json(
        app.oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/server/status")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["online"], true);
    assert_eq!(body["online_players"], 12);
    assert_eq!(body["players_list"], json!(["Steve"]));
}

#[tokio::test]
async fn sync_playtime_handles_auth_single_batch_ghost_and_discord_link_backfill() {
    let db = Db::connect_in_memory().await.unwrap();
    let cfg = Config::for_test();
    let server_token = cfg.game_server_token.clone();

    // Seed: (1) existing discord user without uuid yet, (2) existing web user with uuid
    sqlx::query(
        "INSERT INTO players (username, kind, password_hash, discord_id, uuid, is_linked, play_time) \
         VALUES ('DiscordOnly', 'discord', NULL, '999888777', NULL, 0, 100)",
    )
    .execute(&db.write)
    .await
    .unwrap();

    sqlx::query(
        "INSERT INTO players (username, email, uuid, kind, password_hash, is_linked, play_time) \
         VALUES ('Steve', 'steve@example.com', 'uuid-steve-1', 'web', '$argon2id$h', 1, 200)",
    )
    .execute(&db.write)
    .await
    .unwrap();

    let state: SharedState = AppState::new(cfg, db).unwrap();
    let app = build_router(state.clone());

    // Missing token -> 401
    let (status, _) = response_json(
        app.clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/api/game/sync-playtime")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(r#"{"uuid":"u1","playtime":10}"#))
                    .unwrap(),
            )
            .await
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);

    // Empty players -> 400
    let (status, body) = response_json(
        app.clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/api/game/sync-playtime")
                    .header("x-game-server-token", &server_token)
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(r#"{"players":[]}"#))
                    .unwrap(),
            )
            .await
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["error"], "Không tìm thấy dữ liệu người chơi!");

    // Single player payload with playtime_seconds creating a ghost profile
    let (status, body) = response_json(
        app.clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/api/game/sync-playtime")
                    .header("x-game-server-token", &server_token)
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        r#"{"uuid":"uuid-alex-1","username":"Alex","playtime_seconds":3600}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["processed_players"], 1);
    assert_eq!(body["errors"], json!([]));

    let alex_row = sqlx::query(
        "SELECT kind, password_hash, play_time FROM players WHERE uuid = 'uuid-alex-1'",
    )
    .fetch_one(&state.db.read)
    .await
    .unwrap();
    assert_eq!(alex_row.try_get::<String, _>("kind").unwrap(), "ghost");
    assert!(
        alex_row
            .try_get::<Option<String>, _>("password_hash")
            .unwrap()
            .is_none()
    );
    assert_eq!(alex_row.try_get::<i64, _>("play_time").unwrap(), 3600);

    // Batch payload: updates Steve by uuid, backfills uuid + sets is_linked=1 on DiscordOnly,
    // creates another ghost with generated name when username absent, and records 1 invalid error (>16 chars)
    let (status, body) = response_json(
        app.oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/game/sync-playtime")
                .header("x-game-server-token", &server_token)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "players": [
                            { "uuid": "uuid-steve-1", "username": "Steve", "playtime": 7200 },
                            { "uuid": "uuid-discord-1", "username": "DiscordOnly", "playtime_seconds": 1800 },
                            { "uuid": "uuid-anon-1", "playtime": 900 },
                            { "uuid": "uuid-toolong-1", "username": "ThisUsernameIsWayTooLong", "playtime": 500 }
                        ]
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["processed_players"], 3);
    assert_eq!(body["errors"].as_array().unwrap().len(), 1);

    let steve_time: i64 =
        sqlx::query_scalar("SELECT play_time FROM players WHERE username = 'Steve'")
            .fetch_one(&state.db.read)
            .await
            .unwrap();
    assert_eq!(steve_time, 7200);

    let discord_row = sqlx::query(
        "SELECT uuid, is_linked, play_time FROM players WHERE username = 'DiscordOnly'",
    )
    .fetch_one(&state.db.read)
    .await
    .unwrap();
    assert_eq!(
        discord_row
            .try_get::<Option<String>, _>("uuid")
            .unwrap()
            .as_deref(),
        Some("uuid-discord-1")
    );
    assert_eq!(discord_row.try_get::<i64, _>("is_linked").unwrap(), 1);
    assert_eq!(discord_row.try_get::<i64, _>("play_time").unwrap(), 1800);

    let anon_name: String =
        sqlx::query_scalar("SELECT username FROM players WHERE uuid = 'uuid-anon-1'")
            .fetch_one(&state.db.read)
            .await
            .unwrap();
    assert!(anon_name.starts_with("Player_"));
    assert!(anon_name.len() <= 16);
}
