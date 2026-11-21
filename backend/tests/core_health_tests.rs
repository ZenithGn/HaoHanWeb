use std::collections::HashMap;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use axum::body::Body;
use axum::extract::State;
use axum::http::{HeaderValue, Method, Request, StatusCode, header};
use axum::middleware::from_fn_with_state;
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::{Json, Router};
use http_body_util::BodyExt;
use jsonwebtoken::{Algorithm, EncodingKey, Header};
use serde::Serialize;
use serde_json::{Value, json};
use sqlx::Row;
use tower::ServiceExt;

use haohan_backend::config::{AppEnv, Config};
use haohan_backend::db::Db;
use haohan_backend::error::AppError;
use haohan_backend::extract::{AuthUser, BotToken, GameServerToken};
use haohan_backend::middleware::rate_limit::{RateLimiter, rate_limit_middleware};
use haohan_backend::router::{apply_http_layers, build_router};
use haohan_backend::state::{AppState, SharedState};

async fn response_json(resp: axum::response::Response) -> (StatusCode, Value) {
    let status = resp.status();
    let bytes = resp.into_body().collect().await.unwrap().to_bytes();
    let val = serde_json::from_slice(&bytes).unwrap_or(Value::Null);
    (status, val)
}

fn temp_db_path(name: &str) -> std::path::PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    std::env::temp_dir()
        .join(format!("haohan_test_{name}_{nanos}"))
        .join("test.db")
}

#[test]
fn config_production_requires_jwt_secret_and_game_server_token() {
    let missing_jwt = Config::from_pairs([
        ("APP_ENV", "production"),
        ("GAME_SERVER_TOKEN", "prod-token"),
    ]);
    assert!(missing_jwt.is_err());

    let missing_game = Config::from_pairs([("APP_ENV", "production"), ("JWT_SECRET", "prod-jwt")]);
    assert!(missing_game.is_err());

    let empty_jwt = Config::from_pairs([
        ("APP_ENV", "production"),
        ("JWT_SECRET", "   "),
        ("GAME_SERVER_TOKEN", "prod-token"),
    ]);
    assert!(empty_jwt.is_err());

    let valid = Config::from_pairs([
        ("APP_ENV", "production"),
        ("JWT_SECRET", "prod-jwt-secret"),
        ("GAME_SERVER_TOKEN", "prod-game-token"),
        (
            "FRONTEND_URL",
            "https://web.haohansmp.io.vn/, https://preview.haohansmp.io.vn",
        ),
        ("DISCORD_BOT_TOKEN", "Bot my-secret-bot-token"),
        ("DISCORD_SUPPORTERS_CHANNEL_ID", "123456"),
    ])
    .expect("valid production config");

    assert_eq!(valid.app_env, AppEnv::Production);
    assert_eq!(
        valid.frontend_urls,
        vec![
            "https://web.haohansmp.io.vn",
            "https://preview.haohansmp.io.vn"
        ]
    );
    assert_eq!(
        valid.cors_origin_strings(),
        vec![
            "https://web.haohansmp.io.vn",
            "https://preview.haohansmp.io.vn"
        ]
    );
    assert_eq!(
        valid.discord_bot_token.as_deref(),
        Some("my-secret-bot-token")
    );
    assert_eq!(valid.discord_donation_channel_id.as_deref(), Some("123456"));

    let debug_str = format!("{valid:?}");
    assert!(!debug_str.contains("prod-jwt-secret"));
    assert!(!debug_str.contains("prod-game-token"));
    assert!(!debug_str.contains("my-secret-bot-token"));
}

#[test]
fn config_dev_includes_localhost_cors_and_defaults() {
    let dev = Config::from_pairs(HashMap::<&str, &str>::new()).expect("dev defaults");
    assert_eq!(dev.app_env, AppEnv::Development);
    assert_eq!(dev.port, 3001);
    assert_eq!(dev.bind_addr, "0.0.0.0:3001");
    assert_eq!(dev.cors_origin_strings(), vec!["http://localhost:3000"]);
}

#[tokio::test]
async fn db_in_memory_migrations_and_strict_constraints() {
    let db = Db::connect_in_memory().await.expect("in-memory db");

    // card_details must NOT exist (scratch cards completely removed)
    let card_table: Option<String> = sqlx::query_scalar(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'card_details'",
    )
    .fetch_optional(&db.read)
    .await
    .unwrap();
    assert!(card_table.is_none());

    // Insert valid web player via write pool, read back via read pool (shared in-memory db)
    sqlx::query(
        "INSERT INTO players (username, email, uuid, kind, password_hash, total_donated) \
         VALUES ('Steve', 'steve@example.com', '8667ba71-b85a-4004-af54-457a9734eed7', 'web', '$argon2id$v=19$m=19456,t=2,p=1$abc$def', 50000)",
    )
    .execute(&db.write)
    .await
    .unwrap();

    let row =
        sqlx::query("SELECT id, username, total_donated FROM players WHERE username = 'steve'")
            .fetch_one(&db.read)
            .await
            .unwrap();
    let player_id: i64 = row.try_get("id").unwrap();
    let username: String = row.try_get("username").unwrap();
    let total_donated: i64 = row.try_get("total_donated").unwrap();
    assert_eq!(username, "Steve");
    assert_eq!(total_donated, 50_000);

    // Case-insensitive uniqueness on username and email
    let dup_user = sqlx::query(
        "INSERT INTO players (username, email, kind, password_hash) VALUES ('STEVE', 'other@example.com', 'web', 'h')",
    )
    .execute(&db.write)
    .await;
    assert!(dup_user.is_err());

    let dup_email = sqlx::query(
        "INSERT INTO players (username, email, kind, password_hash) VALUES ('Alex', 'STEVE@EXAMPLE.COM', 'web', 'h')",
    )
    .execute(&db.write)
    .await;
    assert!(dup_email.is_err());

    // Ghost accounts allow NULL email and NULL password_hash, but web requires password_hash
    sqlx::query(
        "INSERT INTO players (username, kind, password_hash) VALUES ('GhostOne', 'ghost', NULL)",
    )
    .execute(&db.write)
    .await
    .unwrap();
    sqlx::query(
        "INSERT INTO players (username, kind, password_hash) VALUES ('GhostTwo', 'ghost', NULL)",
    )
    .execute(&db.write)
    .await
    .unwrap();

    let bad_web = sqlx::query(
        "INSERT INTO players (username, kind, password_hash) VALUES ('BadWeb', 'web', NULL)",
    )
    .execute(&db.write)
    .await;
    assert!(bad_web.is_err());

    let bad_ghost = sqlx::query(
        "INSERT INTO players (username, kind, password_hash) VALUES ('BadGhost', 'ghost', 'hash')",
    )
    .execute(&db.write)
    .await;
    assert!(bad_ghost.is_err());

    let long_name = sqlx::query("INSERT INTO players (username, kind, password_hash) VALUES ('TooLongPlayerName', 'ghost', NULL)")
        .execute(&db.write)
        .await;
    assert!(long_name.is_err());

    // Donations only allow method = 'PAYOS'
    sqlx::query(
        "INSERT INTO donations (player_id, method, amount, tx_ref) VALUES (?1, 'PAYOS', 50000, '123456')",
    )
    .bind(player_id)
    .execute(&db.write)
    .await
    .unwrap();

    let bad_method = sqlx::query(
        "INSERT INTO donations (player_id, method, amount, tx_ref) VALUES (?1, 'CARD', 50000, 'CD_123')",
    )
    .bind(player_id)
    .execute(&db.write)
    .await;
    assert!(bad_method.is_err());

    // Outbox kind constraint
    sqlx::query("INSERT INTO outbox (kind, payload) VALUES ('rcon', 'say hi')")
        .execute(&db.write)
        .await
        .unwrap();
    let bad_outbox = sqlx::query("INSERT INTO outbox (kind, payload) VALUES ('sms', 'hi')")
        .execute(&db.write)
        .await;
    assert!(bad_outbox.is_err());

    // Cascade delete from player to donations
    sqlx::query("DELETE FROM players WHERE id = ?1")
        .bind(player_id)
        .execute(&db.write)
        .await
        .unwrap();
    let remaining_donations: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM donations")
        .fetch_one(&db.read)
        .await
        .unwrap();
    assert_eq!(remaining_donations, 0);
}

#[tokio::test]
async fn db_file_wal_mode_creates_parent_dir_and_separates_read_write_pools() {
    let db_path = temp_db_path("wal");
    let parent_dir = db_path.parent().unwrap().to_path_buf();
    let url = format!("sqlite://{}", db_path.to_string_lossy().replace('\\', "/"));

    let db = Db::connect(&url).await.expect("connect file-backed db");

    let mode: String = sqlx::query_scalar("PRAGMA journal_mode;")
        .fetch_one(&db.write)
        .await
        .unwrap();
    assert_eq!(mode.to_ascii_lowercase(), "wal");

    let fk: i64 = sqlx::query_scalar("PRAGMA foreign_keys;")
        .fetch_one(&db.read)
        .await
        .unwrap();
    assert_eq!(fk, 1);

    // Read-only pool rejects writes
    let write_on_read_pool = sqlx::query(
        "INSERT INTO players (username, kind, password_hash) VALUES ('ReadOnly', 'ghost', NULL)",
    )
    .execute(&db.read)
    .await;
    assert!(write_on_read_pool.is_err());

    db.close().await;
    let _ = std::fs::remove_dir_all(parent_dir);
}

#[tokio::test]
async fn health_check_and_cors_headers() {
    let db = Db::connect_in_memory().await.unwrap();
    let state = AppState::new(Config::for_test(), db).unwrap();
    let app = build_router(state);

    let resp = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/up")
                .header(header::ORIGIN, "http://localhost:3000")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert!(resp.headers().contains_key("x-request-id"));
    assert_eq!(
        resp.headers().get(header::ACCESS_CONTROL_ALLOW_ORIGIN),
        Some(&HeaderValue::from_static("http://localhost:3000"))
    );
    let (status, json) = response_json(resp).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(json["status"], "ok");

    // Disallowed origin must not receive Access-Control-Allow-Origin
    let disallowed = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/up")
                .header(header::ORIGIN, "https://evil.example.com")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(disallowed.status(), StatusCode::OK);
    assert!(
        !disallowed
            .headers()
            .contains_key(header::ACCESS_CONTROL_ALLOW_ORIGIN)
    );
}

#[tokio::test]
async fn router_enforces_64kb_body_limit() {
    let cfg = Config::for_test();
    let app = apply_http_layers(
        Router::new().route(
            "/test-limit",
            post(|body: axum::body::Bytes| async move { format!("len={}", body.len()) }),
        ),
        &cfg,
    );

    let ok_resp = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/test-limit")
                .body(Body::from(vec![b'a'; 1024]))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(ok_resp.status(), StatusCode::OK);

    // Without Content-Length header (streaming / oneshot Body::from)
    let too_big_no_cl = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/test-limit")
                .body(Body::from(vec![b'a'; 70 * 1024]))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(too_big_no_cl.status(), StatusCode::PAYLOAD_TOO_LARGE);

    // With explicit Content-Length header
    let too_big_with_cl = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/test-limit")
                .header(header::CONTENT_LENGTH, (70 * 1024).to_string())
                .body(Body::from(vec![b'a'; 70 * 1024]))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(too_big_with_cl.status(), StatusCode::PAYLOAD_TOO_LARGE);
}

#[tokio::test]
async fn rate_limiter_tracks_xff_ips_and_supports_disabling() {
    let limiter = RateLimiter::new(true, 2, Duration::from_secs(60));
    let app = Router::new()
        .route("/limited", get(|| async { StatusCode::OK }))
        .layer(from_fn_with_state(limiter, rate_limit_middleware));

    // First 2 requests for IP 203.0.113.10 pass
    for _ in 0..2 {
        let resp = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/limited")
                    .header("x-forwarded-for", "203.0.113.10, 10.0.0.1")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
    }

    // 3rd request from same IP is blocked with 429 + Retry-After
    let blocked = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/limited")
                .header("x-forwarded-for", "203.0.113.10, 10.0.0.1")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert!(blocked.headers().contains_key(header::RETRY_AFTER));
    let (status, json) = response_json(blocked).await;
    assert_eq!(status, StatusCode::TOO_MANY_REQUESTS);
    assert!(json["error"].as_str().is_some());

    // Different IP still succeeds
    let other_ip = app
        .oneshot(
            Request::builder()
                .uri("/limited")
                .header("x-forwarded-for", "198.51.100.42")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(other_ip.status(), StatusCode::OK);

    // Disabled limiter allows arbitrary bursts
    let disabled = RateLimiter::new(false, 1, Duration::from_secs(60));
    let open_app = Router::new()
        .route("/limited", get(|| async { StatusCode::OK }))
        .layer(from_fn_with_state(disabled, rate_limit_middleware));

    for _ in 0..5 {
        let resp = open_app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/limited")
                    .header("x-forwarded-for", "203.0.113.10")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
    }
}

#[derive(Serialize)]
struct TestClaims<'a> {
    user_id: i64,
    exp: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    purpose: Option<&'a str>,
}

fn sign_test_jwt(secret: &str, user_id: i64, exp: usize, purpose: Option<&str>) -> String {
    jsonwebtoken::encode(
        &Header::new(Algorithm::HS256),
        &TestClaims {
            user_id,
            exp,
            purpose,
        },
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .unwrap()
}

#[tokio::test]
async fn extractors_authenticate_game_server_bot_and_auth_user() {
    let db = Db::connect_in_memory().await.unwrap();
    sqlx::query(
        "INSERT INTO players (id, username, email, uuid, kind, password_hash, total_donated, is_linked, play_time) \
         VALUES (42, 'Notch', 'notch@example.com', 'b50ad385-829d-3141-a216-7e7d7539ba7f', 'web', 'hash', 150000, 1, 3600)",
    )
    .execute(&db.write)
    .await
    .unwrap();

    let cfg = Config::for_test();
    let state: SharedState = AppState::new(cfg.clone(), db).unwrap();

    let app = Router::new()
        .route(
            "/game",
            get(|_tok: GameServerToken| async { Json(json!({ "ok": true })) }),
        )
        .route(
            "/bot",
            get(|_tok: BotToken| async { Json(json!({ "ok": true })) }),
        )
        .route(
            "/me",
            get(|user: AuthUser| async move {
                Json(json!({
                    "id": user.id,
                    "username": user.username,
                    "is_linked": user.is_linked,
                    "total_donated": user.total_donated
                }))
            }),
        )
        .route(
            "/err/{code}",
            get(
                |axum::extract::Path(code): axum::extract::Path<u16>,
                 State(_state): State<SharedState>| async move {
                    let err = match code {
                        400 => AppError::BadRequest("bad".into()),
                        401 => AppError::Unauthorized,
                        403 => AppError::Forbidden("forbidden".into()),
                        404 => AppError::NotFound("not found".into()),
                        409 => AppError::Conflict("conflict".into()),
                        422 => AppError::Unprocessable("unprocessable".into()),
                        _ => AppError::Internal(anyhow::anyhow!("sensitive db secret details")),
                    };
                    err.into_response()
                },
            ),
        )
        .with_state(state);

    // GameServerToken checks
    let (status, json) = response_json(
        app.clone()
            .oneshot(Request::builder().uri("/game").body(Body::empty()).unwrap())
            .await
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(json["error"], "Unauthorized Game Server");

    let (status, _) = response_json(
        app.clone()
            .oneshot(
                Request::builder()
                    .uri("/game")
                    .header("x-game-server-token", "wrong-token")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);

    let (status, json) = response_json(
        app.clone()
            .oneshot(
                Request::builder()
                    .uri("/game")
                    .header("x-game-server-token", &cfg.game_server_token)
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(json["ok"], true);

    // BotToken checks
    let (status, json) = response_json(
        app.clone()
            .oneshot(Request::builder().uri("/bot").body(Body::empty()).unwrap())
            .await
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(json["error"], "Unauthorized Bot/Server");

    let (status, _) = response_json(
        app.clone()
            .oneshot(
                Request::builder()
                    .uri("/bot")
                    .header(
                        header::AUTHORIZATION,
                        format!("Bearer {}", cfg.game_server_token),
                    )
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::OK);

    let (status, _) = response_json(
        app.clone()
            .oneshot(
                Request::builder()
                    .uri("/bot")
                    .header(header::AUTHORIZATION, &cfg.game_server_token)
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::OK);

    // AuthUser checks
    let now_secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as usize;

    let valid_jwt = sign_test_jwt(&cfg.jwt_secret, 42, now_secs + 3600, None);
    let (status, json) = response_json(
        app.clone()
            .oneshot(
                Request::builder()
                    .uri("/me")
                    .header(header::AUTHORIZATION, format!("Bearer {valid_jwt}"))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(json["id"], 42);
    assert_eq!(json["username"], "Notch");
    assert_eq!(json["is_linked"], 1);
    assert_eq!(json["total_donated"], 150_000);

    // Raw token without Bearer prefix also works
    let (status, _) = response_json(
        app.clone()
            .oneshot(
                Request::builder()
                    .uri("/me")
                    .header(header::AUTHORIZATION, &valid_jwt)
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::OK);

    // Expired JWT -> 401
    let expired_jwt = sign_test_jwt(&cfg.jwt_secret, 42, now_secs.saturating_sub(120), None);
    let (status, json) = response_json(
        app.clone()
            .oneshot(
                Request::builder()
                    .uri("/me")
                    .header(header::AUTHORIZATION, format!("Bearer {expired_jwt}"))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(json["error"], "Unauthorized");

    // OAuth state token rejected as session bearer -> 401
    let state_jwt = sign_test_jwt(&cfg.jwt_secret, 42, now_secs + 600, Some("discord_link"));
    let (status, _) = response_json(
        app.clone()
            .oneshot(
                Request::builder()
                    .uri("/me")
                    .header(header::AUTHORIZATION, format!("Bearer {state_jwt}"))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);

    // Unknown player -> 401
    let unknown_jwt = sign_test_jwt(&cfg.jwt_secret, 9999, now_secs + 3600, None);
    let (status, _) = response_json(
        app.clone()
            .oneshot(
                Request::builder()
                    .uri("/me")
                    .header(header::AUTHORIZATION, format!("Bearer {unknown_jwt}"))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);

    // AppError status code & internal error redaction checks
    for (code, expected) in [
        (400u16, StatusCode::BAD_REQUEST),
        (401, StatusCode::UNAUTHORIZED),
        (403, StatusCode::FORBIDDEN),
        (404, StatusCode::NOT_FOUND),
        (409, StatusCode::CONFLICT),
        (422, StatusCode::UNPROCESSABLE_ENTITY),
    ] {
        let (st, j) = response_json(
            app.clone()
                .oneshot(
                    Request::builder()
                        .uri(format!("/err/{code}"))
                        .body(Body::empty())
                        .unwrap(),
                )
                .await
                .unwrap(),
        )
        .await;
        assert_eq!(st, expected);
        assert!(j["error"].as_str().is_some());
    }

    let (st, j) = response_json(
        app.oneshot(
            Request::builder()
                .uri("/err/500")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap(),
    )
    .await;
    assert_eq!(st, StatusCode::INTERNAL_SERVER_ERROR);
    assert_eq!(j["error"], "Internal server error");
}
