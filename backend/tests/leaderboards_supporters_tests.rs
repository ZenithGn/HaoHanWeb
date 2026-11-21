use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

use axum::body::Body;
use axum::extract::{Extension, Path as AxumPath, Query, State};
use axum::http::{Method, Request, StatusCode, header};
use axum::routing::get;
use axum::{Json, Router};
use http_body_util::BodyExt;
use serde::Deserialize;
use serde_json::{Value, json};
use sqlx::Row;
use tokio::net::TcpListener;
use tower::ServiceExt;

use haohan_backend::config::Config;
use haohan_backend::db::Db;
use haohan_backend::router::build_router;
use haohan_backend::services::supporters::{
    DiscordApiBaseUrl, rebuild_leaderboards_snapshot, rebuild_supporters_snapshot,
};
use haohan_backend::state::{AppState, SharedState};

async fn response_json(resp: axum::response::Response) -> (StatusCode, Value) {
    let status = resp.status();
    let bytes = resp.into_body().collect().await.unwrap().to_bytes();
    let val = serde_json::from_slice(&bytes).unwrap_or(Value::Null);
    (status, val)
}

#[derive(Clone, Default)]
struct MockDiscordState {
    channel_calls: Arc<AtomicUsize>,
    user_calls: Arc<AtomicUsize>,
}

#[derive(Deserialize)]
struct MessagesParams {
    before: Option<String>,
}

async fn spawn_mock_discord_server(
    mock_state: MockDiscordState,
) -> (String, tokio::task::JoinHandle<()>) {
    let app = Router::new()
        .route(
            "/channels/{channel_id}/messages",
            get(
                |State(st): State<MockDiscordState>, Query(params): Query<MessagesParams>| async move {
                    st.channel_calls.fetch_add(1, Ordering::SeqCst);
                    if params.before.is_none() {
                        Json(json!([
                            {
                                "id": "200",
                                "content": "Trang 1\n<@111222333> | MockHero - 300,000 VND\n@GuestOne - 50k",
                                "mentions": [
                                    {
                                        "id": "111222333",
                                        "username": "mockuser",
                                        "global_name": "Mock Hero",
                                        "avatar": "hash_avatar_1"
                                    }
                                ]
                            }
                        ]))
                    } else {
                        Json(json!([]))
                    }
                },
            ),
        )
        .route(
            "/users/{user_id}",
            get(
                |State(st): State<MockDiscordState>, AxumPath(user_id): AxumPath<String>| async move {
                    st.user_calls.fetch_add(1, Ordering::SeqCst);
                    Json(json!({
                        "id": user_id,
                        "username": "mockuser",
                        "global_name": "Mock Hero",
                        "avatar": "a_animated_hash",
                        "banner": "banner_hash_1",
                        "accent_color": 16_753_920
                    }))
                },
            ),
        )
        .with_state(mock_state);

    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    let handle = tokio::spawn(async move {
        let _ = axum::serve(listener, app).await;
    });
    (format!("http://{addr}"), handle)
}

#[tokio::test]
async fn leaderboards_top_10_donors_and_playtime_with_minotar_fallback_and_cache_headers() {
    let db = Db::connect_in_memory().await.unwrap();

    // Seed 12 players with donations & playtime + 1 zero player
    for i in 1..=12 {
        let avatar = if i == 12 {
            Some("https://res.cloudinary.com/demo/image/upload/top.png")
        } else {
            None
        };
        sqlx::query(
            "INSERT INTO players (username, uuid, kind, password_hash, total_donated, play_time, role, avatar_url) \
             VALUES (?1, ?2, 'ghost', NULL, ?3, ?4, ?5, ?6)",
        )
        .bind(format!("Player{i:02}"))
        .bind(format!("uuid-{i:02}"))
        .bind(i * 10_000)
        .bind(i * 600)
        .bind(if i == 12 { "Donator" } else { "Members" })
        .bind(avatar)
        .execute(&db.write)
        .await
        .unwrap();
    }

    sqlx::query(
        "INSERT INTO players (username, uuid, kind, password_hash, total_donated, play_time) \
         VALUES ('ZeroPlayer', 'uuid-zero', 'ghost', NULL, 0, 0)",
    )
    .execute(&db.write)
    .await
    .unwrap();

    let state: SharedState = AppState::new(Config::for_test(), db).unwrap();
    rebuild_leaderboards_snapshot(&state).await.unwrap();

    let app = build_router(state);
    let resp = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/leaderboards")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(
        resp.headers()
            .get(header::CACHE_CONTROL)
            .and_then(|v| v.to_str().ok()),
        Some("public, max-age=15, s-maxage=30")
    );

    let (status, body) = response_json(resp).await;
    assert_eq!(status, StatusCode::OK);

    let donors = body["top_donors"].as_array().unwrap();
    assert_eq!(donors.len(), 10);
    assert_eq!(donors[0]["username"], "Player12");
    assert_eq!(donors[0]["total_donated"], json!(120_000));
    assert!(donors[0]["total_donated"].is_i64());
    assert_eq!(
        donors[0]["avatar_url"],
        "https://res.cloudinary.com/demo/image/upload/top.png"
    );
    assert_eq!(donors[1]["username"], "Player11");
    assert_eq!(
        donors[1]["avatar_url"],
        "https://minotar.net/avatar/Player11/120"
    );

    let playtime = body["top_playtime"].as_array().unwrap();
    assert_eq!(playtime.len(), 10);
    assert_eq!(playtime[0]["username"], "Player12");
    assert_eq!(playtime[0]["play_time"], json!(7200));
    assert_eq!(playtime[9]["username"], "Player03");
}

#[tokio::test]
async fn supporters_donations_combines_manual_fallback_with_db_success_and_cached_profiles() {
    let db = Db::connect_in_memory().await.unwrap();
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    // Seed 2 players + cached discord_profile for one
    let steve_id = sqlx::query_scalar::<_, i64>(
        "INSERT INTO players (username, kind, password_hash) VALUES ('SteveDB', 'ghost', NULL) RETURNING id",
    )
    .fetch_one(&db.write)
    .await
    .unwrap();

    let discord_player_id = sqlx::query_scalar::<_, i64>(
        "INSERT INTO players (username, kind, password_hash, discord_id) \
         VALUES ('DiscordDonor', 'discord', NULL, '777888999') RETURNING id",
    )
    .fetch_one(&db.write)
    .await
    .unwrap();

    sqlx::query(
        "INSERT INTO discord_profiles (discord_id, display_name, avatar_url, banner_url, accent_color, fetched_at) \
         VALUES ('777888999', 'Cached Display', 'https://cdn.example/ava.png', 'https://cdn.example/ban.png', 255, ?1)",
    )
    .bind(now)
    .execute(&db.write)
    .await
    .unwrap();

    // Insert 2 SUCCESS donations for SteveDB, 1 PENDING, 1 FAILED, and 1 SUCCESS for DiscordDonor
    sqlx::query(
        "INSERT INTO donations (player_id, method, amount, tx_ref, status) VALUES \
         (?1, 'PAYOS', 150000, 'tx1', 'SUCCESS'), \
         (?1, 'PAYOS', 50000, 'tx2', 'SUCCESS'), \
         (?1, 'PAYOS', 999000, 'tx3', 'PENDING'), \
         (?1, 'PAYOS', 888000, 'tx4', 'FAILED'), \
         (?2, 'PAYOS', 500000, 'tx5', 'SUCCESS')",
    )
    .bind(steve_id)
    .bind(discord_player_id)
    .execute(&db.write)
    .await
    .unwrap();

    let state: SharedState = AppState::new(Config::for_test(), db).unwrap();
    let app = build_router(state);

    let resp = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/supporters/donations")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(
        resp.headers()
            .get(header::CACHE_CONTROL)
            .and_then(|v| v.to_str().ok()),
        Some("public, max-age=15, s-maxage=30")
    );

    let (status, body) = response_json(resp).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["source"], "manual+database");
    assert_eq!(body["cache"], "fallback");
    assert_eq!(body["pages"].as_array().unwrap().len(), 2);

    let supporters = body["supporters"].as_array().unwrap();
    // Pico from manual (3,550,000) + DiscordDonor (500,000) + JUnLI (400,000) + SteveDB (200,000) ...
    assert_eq!(supporters[0]["username"], "PicoXSVipMax");
    assert_eq!(supporters[1]["display_name"], "Cached Display");
    assert_eq!(supporters[1]["username"], "DiscordDonor");
    assert_eq!(supporters[1]["amount"], json!(500_000));
    assert_eq!(supporters[1]["avatar_url"], "https://cdn.example/ava.png");
    assert_eq!(supporters[1]["banner_url"], "https://cdn.example/ban.png");
    assert_eq!(supporters[1]["accent_color"], json!(255));

    let steve_entry = supporters
        .iter()
        .find(|s| s["username"] == "SteveDB")
        .expect("SteveDB must be present");
    assert_eq!(steve_entry["amount"], json!(200_000));
    assert_eq!(steve_entry["entries"], json!(2));
    assert_eq!(
        steve_entry["avatar_url"],
        "https://minotar.net/avatar/SteveDB/120"
    );
}

#[tokio::test]
async fn supporters_refresh_fetches_mock_discord_api_caches_kv_and_enforces_60s_cooldown() {
    let db = Db::connect_in_memory().await.unwrap();
    let cfg = Config::from_pairs([
        ("APP_ENV", "test"),
        ("JWT_SECRET", "test_jwt"),
        ("GAME_SERVER_TOKEN", "test_gst"),
        ("RATE_LIMIT_ENABLED", "false"),
        ("DISCORD_BOT_TOKEN", "Bot mock_bot_token"),
        ("DISCORD_DONATION_CHANNEL_ID", "123456789"),
    ])
    .unwrap();

    // Seed a DB donor with discord_id whose profile is stale (7h old) so it refetches on refresh
    let stale_ts = (SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64)
        - (7 * 3600);
    let p_id = sqlx::query_scalar::<_, i64>(
        "INSERT INTO players (username, kind, password_hash, discord_id) \
         VALUES ('MockHero', 'discord', NULL, '111222333') RETURNING id",
    )
    .fetch_one(&db.write)
    .await
    .unwrap();
    sqlx::query(
        "INSERT INTO discord_profiles (discord_id, display_name, avatar_url, fetched_at) \
         VALUES ('111222333', 'Old Name', 'https://old.example/a.png', ?1)",
    )
    .bind(stale_ts)
    .execute(&db.write)
    .await
    .unwrap();
    sqlx::query(
        "INSERT INTO donations (player_id, method, amount, tx_ref, status) \
         VALUES (?1, 'PAYOS', 100000, 'tx_mock_1', 'SUCCESS')",
    )
    .bind(p_id)
    .execute(&db.write)
    .await
    .unwrap();

    let state: SharedState = AppState::new(cfg, db).unwrap();
    let mock_state = MockDiscordState::default();
    let (mock_url, server_handle) = spawn_mock_discord_server(mock_state.clone()).await;

    let app = build_router(state.clone()).layer(Extension(DiscordApiBaseUrl(mock_url.clone())));

    // 1. Force refresh via ?refresh=true -> hits mock Discord API, returns Cache-Control: no-store
    let resp = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/supporters/donations?refresh=true")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        resp.headers()
            .get(header::CACHE_CONTROL)
            .and_then(|v| v.to_str().ok()),
        Some("no-store")
    );
    let (status, body) = response_json(resp).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["source"], "discord+database");
    assert_eq!(body["cache"], "hit");

    // MockHero from channel (300k) merged with DB (100k) by matching discord_id "111222333" -> 400k
    let supporters = body["supporters"].as_array().unwrap();
    assert_eq!(supporters.len(), 2);
    assert_eq!(supporters[0]["display_name"], "Mock Hero");
    assert_eq!(supporters[0]["discord_id"], "111222333");
    assert_eq!(supporters[0]["amount"], json!(400_000));
    assert_eq!(supporters[0]["entries"], json!(2));
    assert_eq!(
        supporters[0]["avatar_url"],
        "https://cdn.discordapp.com/avatars/111222333/a_animated_hash.gif?size=96"
    );

    let channel_calls_after_first = mock_state.channel_calls.load(Ordering::SeqCst);
    let user_calls_after_first = mock_state.user_calls.load(Ordering::SeqCst);
    assert_eq!(channel_calls_after_first, 2); // page 1 + empty page 2
    assert_eq!(user_calls_after_first, 1); // profile cached and reused!

    // Verify kv_cache contains supporters:discord
    let kv_row = sqlx::query("SELECT value FROM kv_cache WHERE key = 'supporters:discord'")
        .fetch_one(&state.db.read)
        .await
        .unwrap();
    let kv_json: Value =
        serde_json::from_slice(&kv_row.try_get::<Vec<u8>, _>("value").unwrap()).unwrap();
    assert_eq!(kv_json["source"], "discord");

    // 2. Immediate second ?refresh=true hits 60s cooldown -> 429 + no-store + zero Discord calls
    let resp2 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/supporters/donations?refresh=true")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        resp2
            .headers()
            .get(header::CACHE_CONTROL)
            .and_then(|v| v.to_str().ok()),
        Some("no-store")
    );
    assert_eq!(resp2.status(), StatusCode::TOO_MANY_REQUESTS);
    assert_eq!(
        mock_state.channel_calls.load(Ordering::SeqCst),
        channel_calls_after_first
    );

    // 3. Normal GET serves snapshot from ArcSwap RAM + rebuild_supporters_snapshot uses cached 6h profile without Discord HTTP
    let resp3 = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/supporters/donations")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        resp3
            .headers()
            .get(header::CACHE_CONTROL)
            .and_then(|v| v.to_str().ok()),
        Some("public, max-age=15, s-maxage=30")
    );
    assert_eq!(resp3.status(), StatusCode::OK);
    rebuild_supporters_snapshot(&state, Some(&mock_url), true)
        .await
        .unwrap();
    assert_eq!(
        mock_state.user_calls.load(Ordering::SeqCst),
        user_calls_after_first
    );

    server_handle.abort();
}
