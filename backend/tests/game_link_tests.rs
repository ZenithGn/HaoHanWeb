use std::time::Duration;

use axum::body::Body;
use axum::http::{Method, Request, StatusCode, header};
use http_body_util::BodyExt;
use serde_json::{Value, json};
use sqlx::Row;
use tower::ServiceExt;

use haohan_backend::config::Config;
use haohan_backend::db::Db;
use haohan_backend::domain::jwt;
use haohan_backend::router::build_router;
use haohan_backend::state::{AppState, SharedState};

async fn setup_app(rate_limit: bool) -> (SharedState, axum::Router) {
    let mut cfg = Config::for_test();
    cfg.rate_limit_enabled = rate_limit;
    let db = Db::connect_in_memory().await.unwrap();
    let state = AppState::new(cfg, db).unwrap();
    let app = build_router(state.clone());
    (state, app)
}

async fn request_json(
    app: &axum::Router,
    uri: &str,
    bearer: Option<&str>,
    game_token: Option<&str>,
    body: Value,
) -> (StatusCode, Value) {
    let mut builder = Request::builder()
        .method(Method::POST)
        .uri(uri)
        .header(header::CONTENT_TYPE, "application/json");
    if let Some(tok) = bearer {
        builder = builder.header(header::AUTHORIZATION, format!("Bearer {tok}"));
    }
    if let Some(gt) = game_token {
        builder = builder.header("x-game-server-token", gt);
    }
    let req = builder.body(Body::from(body.to_string())).unwrap();
    let resp = app.clone().oneshot(req).await.unwrap();
    let status = resp.status();
    let bytes = resp.into_body().collect().await.unwrap().to_bytes();
    let val = serde_json::from_slice(&bytes).unwrap_or(Value::Null);
    (status, val)
}

async fn insert_web_user(
    state: &SharedState,
    username: &str,
    email: &str,
    uuid: &str,
) -> (i64, String) {
    let id: i64 = sqlx::query_scalar(
        "INSERT INTO players (username, email, uuid, kind, password_hash, total_donated, is_linked, play_time) \
         VALUES (?1, ?2, ?3, 'web', 'hash_placeholder', 0, 0, 0) RETURNING id",
    )
    .bind(username)
    .bind(email)
    .bind(uuid)
    .fetch_one(&state.db.write)
    .await
    .unwrap();

    let tok = jwt::encode_session_token(&state.cfg.jwt_secret, id).unwrap();
    (id, tok)
}

#[tokio::test]
async fn generate_link_code_auth_validation_and_single_use_link() {
    let (state, app) = setup_app(false).await;
    let game_token = state.cfg.game_server_token.clone();

    // Unauthorized game server -> 401
    let (st, j) = request_json(
        &app,
        "/api/game/generate-link-code",
        None,
        Some("wrong"),
        json!({ "username": "Steve", "uuid": "11111111-1111-3111-8111-111111111111" }),
    )
    .await;
    assert_eq!(st, StatusCode::UNAUTHORIZED);
    assert_eq!(j["error"], "Unauthorized Game Server");

    // Missing username/uuid -> 400
    let (st, j) = request_json(
        &app,
        "/api/game/generate-link-code",
        None,
        Some(&game_token),
        json!({ "username": "  ", "uuid": "" }),
    )
    .await;
    assert_eq!(st, StatusCode::BAD_REQUEST);
    assert_eq!(j["error"], "Username và UUID không được để trống!");

    // Valid code generation
    let target_uuid = "aaaaaaaa-bbbb-3ccc-8ddd-eeeeeeeeeeee";
    let (st, j) = request_json(
        &app,
        "/api/game/generate-link-code",
        None,
        Some(&game_token),
        json!({ "username": "Steve", "uuid": target_uuid }),
    )
    .await;
    assert_eq!(st, StatusCode::OK);
    assert_eq!(j["message"], "Mã liên kết được sinh thành công!");
    let code = j["code"].as_str().unwrap().to_string();
    assert_eq!(code.len(), 6);
    assert!(state.link_codes.get(&code).await.is_some());

    let (user_id, user_tok) = insert_web_user(
        &state,
        "Steve",
        "steve@example.com",
        "00000000-0000-3000-8000-000000000001",
    )
    .await;

    // Unauthenticated link -> 401
    let (st, _) = request_json(&app, "/api/auth/link", None, None, json!({ "code": code })).await;
    assert_eq!(st, StatusCode::UNAUTHORIZED);

    // Empty code -> 400
    let (st, j) = request_json(
        &app,
        "/api/auth/link",
        Some(&user_tok),
        None,
        json!({ "code": "   " }),
    )
    .await;
    assert_eq!(st, StatusCode::BAD_REQUEST);
    assert_eq!(j["error"], "Vui lòng cung cấp mã liên kết!");

    // Unknown code -> 400
    let (st, j) = request_json(
        &app,
        "/api/auth/link",
        Some(&user_tok),
        None,
        json!({ "code": "ZZZZZZ" }),
    )
    .await;
    assert_eq!(st, StatusCode::BAD_REQUEST);
    assert_eq!(j["error"], "Mã liên kết không hợp lệ hoặc đã hết hạn!");

    // Valid link using lowercase + whitespace padded code
    let notified = state.invalidate.notified();
    let (st, j) = request_json(
        &app,
        "/api/auth/link",
        Some(&user_tok),
        None,
        json!({ "code": format!("  {} ", code.to_ascii_lowercase()) }),
    )
    .await;
    assert_eq!(st, StatusCode::OK);
    assert_eq!(j["message"], "Liên kết tài khoản game thành công!");
    assert_eq!(j["user"]["id"], user_id);
    assert_eq!(j["user"]["uuid"], target_uuid);
    assert_eq!(j["user"]["is_linked"], 1);
    assert_eq!(j["user"]["total_donated"], 0);
    assert_eq!(j["user"]["play_time"], 0);

    tokio::time::timeout(Duration::from_millis(200), notified)
        .await
        .expect("state.invalidate should fire on successful link");

    // Reusing consumed code must fail -> 400
    let (st, j) = request_json(
        &app,
        "/api/auth/link",
        Some(&user_tok),
        None,
        json!({ "code": code }),
    )
    .await;
    assert_eq!(st, StatusCode::BAD_REQUEST);
    assert_eq!(j["error"], "Mã liên kết không hợp lệ hoặc đã hết hạn!");
}

#[tokio::test]
async fn link_merges_ghost_profile_transfers_donations_and_deletes_ghost_safely() {
    let (state, app) = setup_app(false).await;
    let game_token = state.cfg.game_server_token.clone();

    let (web_id, web_tok) = insert_web_user(
        &state,
        "WebHero",
        "hero@example.com",
        "11111111-1111-3111-8111-111111111111",
    )
    .await;

    sqlx::query("UPDATE players SET total_donated = 50000, play_time = 1200 WHERE id = ?1")
        .bind(web_id)
        .execute(&state.db.write)
        .await
        .unwrap();

    // Seed a Ghost profile with same game UUID, different username, donations, role & discord_id
    let game_uuid = "99999999-8888-3777-8666-555555555555";
    let ghost_id: i64 = sqlx::query_scalar(
        "INSERT INTO players (username, uuid, kind, password_hash, discord_id, avatar_url, total_donated, role, play_time) \
         VALUES ('GameHero', ?1, 'ghost', NULL, '749112696191975434', 'https://cdn.example/avatar.png', 150000, 'Donator', 7200) \
         RETURNING id",
    )
    .bind(game_uuid)
    .fetch_one(&state.db.write)
    .await
    .unwrap();

    sqlx::query(
        "INSERT INTO donations (player_id, method, amount, tx_ref, status) \
         VALUES (?1, 'PAYOS', 100000, 'TX_GHOST_1', 'SUCCESS'), (?1, 'PAYOS', 50000, 'TX_GHOST_2', 'SUCCESS')",
    )
    .bind(ghost_id)
    .execute(&state.db.write)
    .await
    .unwrap();

    let (st, j) = request_json(
        &app,
        "/api/game/generate-link-code",
        None,
        Some(&game_token),
        json!({ "username": "GameHero", "uuid": game_uuid }),
    )
    .await;
    assert_eq!(st, StatusCode::OK);
    let code = j["code"].as_str().unwrap().to_string();

    let (st, j) = request_json(
        &app,
        "/api/auth/link",
        Some(&web_tok),
        None,
        json!({ "code": code }),
    )
    .await;
    assert_eq!(st, StatusCode::OK);
    assert_eq!(j["user"]["id"], web_id);
    assert_eq!(j["user"]["username"], "GameHero");
    assert_eq!(j["user"]["uuid"], game_uuid);
    assert_eq!(j["user"]["is_linked"], 1);
    assert_eq!(j["user"]["total_donated"], 200_000);
    assert_eq!(j["user"]["play_time"], 7200);

    // Ghost row is deleted
    let ghost_exists: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM players WHERE id = ?1")
        .bind(ghost_id)
        .fetch_one(&state.db.read)
        .await
        .unwrap();
    assert_eq!(ghost_exists, 0);

    // Donations belong to web_id now
    let transferred: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM donations WHERE player_id = ?1")
            .bind(web_id)
            .fetch_one(&state.db.read)
            .await
            .unwrap();
    assert_eq!(transferred, 2);

    // Merged player fields in DB
    let merged = sqlx::query(
        "SELECT username, uuid, total_donated, role, play_time, discord_id, avatar_url, is_linked \
         FROM players WHERE id = ?1",
    )
    .bind(web_id)
    .fetch_one(&state.db.read)
    .await
    .unwrap();
    assert_eq!(merged.try_get::<String, _>("username").unwrap(), "GameHero");
    assert_eq!(merged.try_get::<String, _>("uuid").unwrap(), game_uuid);
    assert_eq!(merged.try_get::<i64, _>("total_donated").unwrap(), 200_000);
    assert_eq!(merged.try_get::<String, _>("role").unwrap(), "Donator");
    assert_eq!(merged.try_get::<i64, _>("play_time").unwrap(), 7200);
    assert_eq!(
        merged
            .try_get::<Option<String>, _>("discord_id")
            .unwrap()
            .as_deref(),
        Some("749112696191975434")
    );
    assert_eq!(
        merged
            .try_get::<Option<String>, _>("avatar_url")
            .unwrap()
            .as_deref(),
        Some("https://cdn.example/avatar.png")
    );
    assert_eq!(merged.try_get::<i64, _>("is_linked").unwrap(), 1);
}

#[tokio::test]
async fn link_returns_409_when_game_account_owned_by_another_non_ghost() {
    let (state, app) = setup_app(false).await;
    let game_token = state.cfg.game_server_token.clone();

    let (_user1_id, user1_tok) = insert_web_user(
        &state,
        "PlayerOne",
        "p1@example.com",
        "11111111-1111-3111-8111-111111111111",
    )
    .await;

    let other_uuid = "22222222-2222-3222-8222-222222222222";
    let (_user2_id, _user2_tok) =
        insert_web_user(&state, "PlayerTwo", "p2@example.com", other_uuid).await;

    let (st, j) = request_json(
        &app,
        "/api/game/generate-link-code",
        None,
        Some(&game_token),
        json!({ "username": "PlayerTwo", "uuid": other_uuid }),
    )
    .await;
    assert_eq!(st, StatusCode::OK);
    let code = j["code"].as_str().unwrap().to_string();

    let (st, j) = request_json(
        &app,
        "/api/auth/link",
        Some(&user1_tok),
        None,
        json!({ "code": code }),
    )
    .await;
    assert_eq!(st, StatusCode::CONFLICT);
    assert_eq!(
        j["error"],
        "Tài khoản game này đã được liên kết với một tài khoản web khác!"
    );

    // Code was consumed on attempt
    let (st, _) = request_json(
        &app,
        "/api/auth/link",
        Some(&user1_tok),
        None,
        json!({ "code": code }),
    )
    .await;
    assert_eq!(st, StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn link_enforces_10_per_minute_rate_limit_when_enabled() {
    let (state, app) = setup_app(true).await;
    let (_id, tok) = insert_web_user(
        &state,
        "RateUser",
        "rate@example.com",
        "33333333-3333-3333-8333-333333333333",
    )
    .await;

    for _ in 0..10 {
        let req = Request::builder()
            .method(Method::POST)
            .uri("/api/auth/link")
            .header(header::CONTENT_TYPE, "application/json")
            .header(header::AUTHORIZATION, format!("Bearer {tok}"))
            .header("x-forwarded-for", "203.0.113.88")
            .body(Body::from(json!({ "code": "AAAAAA" }).to_string()))
            .unwrap();
        let resp = app.clone().oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    }

    let req = Request::builder()
        .method(Method::POST)
        .uri("/api/auth/link")
        .header(header::CONTENT_TYPE, "application/json")
        .header(header::AUTHORIZATION, format!("Bearer {tok}"))
        .header("x-forwarded-for", "203.0.113.88")
        .body(Body::from(json!({ "code": "AAAAAA" }).to_string()))
        .unwrap();
    let resp = app.oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::TOO_MANY_REQUESTS);
}
