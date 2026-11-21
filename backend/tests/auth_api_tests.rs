use axum::body::Body;
use axum::http::{Method, Request, StatusCode, header};
use http_body_util::BodyExt;
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use sqlx::Row;
use tower::ServiceExt;

use haohan_backend::config::Config;
use haohan_backend::db::Db;
use haohan_backend::domain::jwt;
use haohan_backend::router::build_router;
use haohan_backend::state::AppState;

async fn setup_app(rate_limit: bool) -> (haohan_backend::state::SharedState, axum::Router) {
    let mut cfg = Config::for_test();
    cfg.rate_limit_enabled = rate_limit;
    let db = Db::connect_in_memory().await.unwrap();
    let state = AppState::new(cfg, db).unwrap();
    let app = build_router(state.clone());
    (state, app)
}

async fn post_json(
    app: &axum::Router,
    uri: &str,
    token: Option<&str>,
    body: Value,
) -> (StatusCode, Value) {
    let mut builder = Request::builder()
        .method(Method::POST)
        .uri(uri)
        .header(header::CONTENT_TYPE, "application/json");
    if let Some(tok) = token {
        builder = builder.header(header::AUTHORIZATION, format!("Bearer {tok}"));
    }
    let req = builder.body(Body::from(body.to_string())).unwrap();
    let resp = app.clone().oneshot(req).await.unwrap();
    let status = resp.status();
    let bytes = resp.into_body().collect().await.unwrap().to_bytes();
    let json = serde_json::from_slice(&bytes).unwrap_or(Value::Null);
    (status, json)
}

fn make_authme_sha256(password: &str, salt: &str) -> String {
    let first = hex::encode(Sha256::digest(password.as_bytes()));
    let second = hex::encode(Sha256::digest(format!("{first}{salt}").as_bytes()));
    format!("$SHA${salt}${second}")
}

#[tokio::test]
async fn register_validation_new_user_and_ghost_claim() {
    let (state, app) = setup_app(false).await;

    // 1. Blank fields -> 400
    let (st, j) = post_json(
        &app,
        "/api/auth/register",
        None,
        json!({ "username": "  ", "email": "a@b.com", "password": "secret123" }),
    )
    .await;
    assert_eq!(st, StatusCode::BAD_REQUEST);
    assert_eq!(
        j["error"],
        "Tên nhân vật, email và mật khẩu không được để trống!"
    );

    // 2. Username > 16 chars -> 400
    let (st, j) = post_json(
        &app,
        "/api/auth/register",
        None,
        json!({ "username": "TooLongPlayerName", "email": "a@b.com", "password": "secret123" }),
    )
    .await;
    assert_eq!(st, StatusCode::BAD_REQUEST);
    assert_eq!(j["error"], "Tên nhân vật không được vượt quá 16 ký tự!");

    // 3. Password < 6 chars -> 400
    let (st, j) = post_json(
        &app,
        "/api/auth/register",
        None,
        json!({ "username": "Steve", "email": "a@b.com", "password": "12345" }),
    )
    .await;
    assert_eq!(st, StatusCode::BAD_REQUEST);
    assert_eq!(j["error"], "Mật khẩu phải từ 6 ký tự trở lên!");

    // 4. Invalid email -> 422
    let (st, _) = post_json(
        &app,
        "/api/auth/register",
        None,
        json!({ "username": "Steve", "email": "not-an-email", "password": "secret123" }),
    )
    .await;
    assert_eq!(st, StatusCode::UNPROCESSABLE_ENTITY);

    // 5. Register new user "Notch" -> 201 Created + Offline UUID v3 + Argon2id + outbox
    let (st, j) = post_json(
        &app,
        "/api/auth/register",
        None,
        json!({ "username": "Notch", "email": "notch@example.com", "password": "secret123" }),
    )
    .await;
    assert_eq!(st, StatusCode::CREATED);
    assert_eq!(j["message"], "Đăng ký tài khoản thành công!");
    assert_eq!(j["user"]["username"], "Notch");
    assert_eq!(j["user"]["email"], "notch@example.com");
    assert_eq!(j["user"]["uuid"], "b50ad385-829d-3141-a216-7e7d7539ba7f");
    assert_eq!(j["user"]["is_linked"], 0);
    assert_eq!(j["user"]["role"], "default");
    assert_eq!(j["user"]["play_time"], 0);

    let token = j["token"].as_str().expect("token");
    assert!(jwt::decode_session_token(&state.cfg.jwt_secret, token).is_some());

    let stored = sqlx::query("SELECT kind, password_hash FROM players WHERE username = 'Notch'")
        .fetch_one(&state.db.read)
        .await
        .unwrap();
    let kind: String = stored.try_get("kind").unwrap();
    let hash: String = stored.try_get("password_hash").unwrap();
    assert_eq!(kind, "web");
    assert!(hash.starts_with("$argon2id$"));

    let outbox_row = sqlx::query("SELECT kind, payload FROM outbox ORDER BY id DESC LIMIT 1")
        .fetch_one(&state.db.read)
        .await
        .unwrap();
    let ob_kind: String = outbox_row.try_get("kind").unwrap();
    let ob_payload: String = outbox_row.try_get("payload").unwrap();
    assert_eq!(ob_kind, "discord_webhook");
    let embed: Value = serde_json::from_str(&ob_payload).unwrap();
    assert_eq!(embed["embeds"][0]["title"], "🎉 Thành viên mới đăng ký!");
    assert_eq!(embed["embeds"][0]["fields"][0]["value"], "Notch");
    assert_eq!(
        embed["embeds"][0]["fields"][1]["value"],
        "b50ad385-829d-3141-a216-7e7d7539ba7f"
    );

    // 6. Duplicate email (case-insensitive) -> 400
    let (st, j) = post_json(
        &app,
        "/api/auth/register",
        None,
        json!({ "username": "Alex", "email": "NOTCH@example.com", "password": "secret123" }),
    )
    .await;
    assert_eq!(st, StatusCode::BAD_REQUEST);
    assert_eq!(j["error"], "Địa chỉ email này đã được sử dụng!");

    // 7. Duplicate username (case-insensitive) -> 400
    let (st, j) = post_json(
        &app,
        "/api/auth/register",
        None,
        json!({ "username": "notch", "email": "other@example.com", "password": "secret123" }),
    )
    .await;
    assert_eq!(st, StatusCode::BAD_REQUEST);
    assert_eq!(j["error"], "Tên nhân vật đã được đăng ký tài khoản web!");

    // 8. Claim existing Ghost profile -> 200 OK
    sqlx::query(
        "INSERT INTO players (username, uuid, kind, password_hash, total_donated, play_time, role) \
         VALUES ('GhostAlex', '11111111-2222-3333-8444-555555555555', 'ghost', NULL, 100000, 7200, 'Donator')",
    )
    .execute(&state.db.write)
    .await
    .unwrap();

    let (st, j) = post_json(
        &app,
        "/api/auth/register",
        None,
        json!({ "username": "ghostalex", "email": "alex@example.com", "password": "secret123" }),
    )
    .await;
    assert_eq!(st, StatusCode::OK);
    assert_eq!(
        j["message"],
        "Đăng ký tài khoản web thành công (Liên kết tài khoản game có sẵn)!"
    );
    assert_eq!(j["user"]["username"], "GhostAlex");
    assert_eq!(j["user"]["email"], "alex@example.com");
    assert_eq!(j["user"]["uuid"], "11111111-2222-3333-8444-555555555555");
    assert_eq!(j["user"]["role"], "Donator");
    assert_eq!(j["user"]["is_linked"], 0);
    assert_eq!(j["user"]["play_time"], 7200);
}

#[tokio::test]
async fn login_with_argon2id_legacy_sha_upgrade_and_kind_guards() {
    let (state, app) = setup_app(false).await;

    // Register normal Argon2id user
    let (st, _) = post_json(
        &app,
        "/api/auth/register",
        None,
        json!({ "username": "Steve", "email": "steve@example.com", "password": "password123" }),
    )
    .await;
    assert_eq!(st, StatusCode::CREATED);

    // Seed legacy AuthMe $SHA$ user, a ghost user, and a discord user
    let legacy_hash = make_authme_sha256("legacyPass99", "0123456789abcdef");
    sqlx::query(
        "INSERT INTO players (username, email, uuid, kind, password_hash) \
         VALUES ('LegacyUser', 'legacy@example.com', '22222222-2222-3333-8444-555555555555', 'web', ?1)",
    )
    .bind(&legacy_hash)
    .execute(&state.db.write)
    .await
    .unwrap();

    sqlx::query(
        "INSERT INTO players (username, kind, password_hash) VALUES ('GhostOnly', 'ghost', NULL)",
    )
    .execute(&state.db.write)
    .await
    .unwrap();

    sqlx::query(
        "INSERT INTO players (username, kind, password_hash, discord_id) \
         VALUES ('DiscordOnly', 'discord', NULL, '999888777')",
    )
    .execute(&state.db.write)
    .await
    .unwrap();

    // Blank credentials -> 400
    let (st, j) = post_json(
        &app,
        "/api/auth/login",
        None,
        json!({ "username": "", "password": "" }),
    )
    .await;
    assert_eq!(st, StatusCode::BAD_REQUEST);
    assert_eq!(
        j["error"],
        "Tên nhân vật/Email và mật khẩu không được để trống!"
    );

    // Login by username case-insensitive
    let (st, j) = post_json(
        &app,
        "/api/auth/login",
        None,
        json!({ "username": "STEVE", "password": "password123" }),
    )
    .await;
    assert_eq!(st, StatusCode::OK);
    assert_eq!(j["message"], "Đăng nhập thành công!");
    assert_eq!(j["user"]["username"], "Steve");

    // Login by email case-insensitive
    let (st, j) = post_json(
        &app,
        "/api/auth/login",
        None,
        json!({ "username": "STEVE@EXAMPLE.COM", "password": "password123" }),
    )
    .await;
    assert_eq!(st, StatusCode::OK);
    assert_eq!(j["user"]["email"], "steve@example.com");

    // Wrong password -> 401
    let (st, j) = post_json(
        &app,
        "/api/auth/login",
        None,
        json!({ "username": "Steve", "password": "wrong" }),
    )
    .await;
    assert_eq!(st, StatusCode::UNAUTHORIZED);
    assert_eq!(j["error"], "Tên đăng nhập hoặc mật khẩu không chính xác!");

    // Reject ghost and discord accounts -> 401
    for blocked_user in ["GhostOnly", "DiscordOnly"] {
        let (st, j) = post_json(
            &app,
            "/api/auth/login",
            None,
            json!({ "username": blocked_user, "password": "anypassword" }),
        )
        .await;
        assert_eq!(st, StatusCode::UNAUTHORIZED);
        assert_eq!(j["error"], "Tên đăng nhập hoặc mật khẩu không chính xác!");
    }

    // Legacy $SHA$ login succeeds AND transparently upgrades DB password_hash to Argon2id
    let (st, j) = post_json(
        &app,
        "/api/auth/login",
        None,
        json!({ "username": "LegacyUser", "password": "legacyPass99" }),
    )
    .await;
    assert_eq!(st, StatusCode::OK);
    assert_eq!(j["user"]["username"], "LegacyUser");

    let upgraded_hash: String =
        sqlx::query_scalar("SELECT password_hash FROM players WHERE username = 'LegacyUser'")
            .fetch_one(&state.db.read)
            .await
            .unwrap();
    assert!(
        upgraded_hash.starts_with("$argon2id$"),
        "expected transparent upgrade to Argon2id, got {upgraded_hash}"
    );

    // Subsequent login uses the upgraded Argon2id hash
    let (st, _) = post_json(
        &app,
        "/api/auth/login",
        None,
        json!({ "username": "legacy@example.com", "password": "legacyPass99" }),
    )
    .await;
    assert_eq!(st, StatusCode::OK);
}

#[tokio::test]
async fn update_profile_validations_and_updates() {
    let (state, app) = setup_app(false).await;

    let (st, j) = post_json(
        &app,
        "/api/auth/register",
        None,
        json!({ "username": "PlayerOne", "email": "p1@example.com", "password": "oldPassword1" }),
    )
    .await;
    assert_eq!(st, StatusCode::CREATED);
    let token = j["token"].as_str().unwrap().to_string();

    // Register a second user to test email conflict
    let (st, _) = post_json(
        &app,
        "/api/auth/register",
        None,
        json!({ "username": "PlayerTwo", "email": "p2@example.com", "password": "password123" }),
    )
    .await;
    assert_eq!(st, StatusCode::CREATED);

    // Unauthenticated -> 401
    let (st, _) = post_json(
        &app,
        "/api/auth/update-profile",
        None,
        json!({ "current_password": "oldPassword1" }),
    )
    .await;
    assert_eq!(st, StatusCode::UNAUTHORIZED);

    // Blank current_password -> 400
    let (st, j) = post_json(
        &app,
        "/api/auth/update-profile",
        Some(&token),
        json!({ "current_password": "  ", "email": "new@example.com" }),
    )
    .await;
    assert_eq!(st, StatusCode::BAD_REQUEST);
    assert_eq!(
        j["error"],
        "Vui lòng nhập mật khẩu hiện tại để xác thực thay đổi!"
    );

    // Wrong current_password -> 401
    let (st, j) = post_json(
        &app,
        "/api/auth/update-profile",
        Some(&token),
        json!({ "current_password": "wrongPassword" }),
    )
    .await;
    assert_eq!(st, StatusCode::UNAUTHORIZED);
    assert_eq!(j["error"], "Mật khẩu hiện tại không chính xác!");

    // Discord-only user cannot update profile via password -> 401
    let discord_id: i64 = sqlx::query_scalar(
        "INSERT INTO players (username, kind, password_hash, discord_id) \
         VALUES ('DiscordUser', 'discord', NULL, '555666777') RETURNING id",
    )
    .fetch_one(&state.db.write)
    .await
    .unwrap();
    let discord_tok = jwt::encode_session_token(&state.cfg.jwt_secret, discord_id).unwrap();
    let (st, j) = post_json(
        &app,
        "/api/auth/update-profile",
        Some(&discord_tok),
        json!({ "current_password": "anything" }),
    )
    .await;
    assert_eq!(st, StatusCode::UNAUTHORIZED);
    assert_eq!(j["error"], "Mật khẩu hiện tại không chính xác!");

    // Bad email format -> 400
    let (st, j) = post_json(
        &app,
        "/api/auth/update-profile",
        Some(&token),
        json!({ "current_password": "oldPassword1", "email": "bad-email" }),
    )
    .await;
    assert_eq!(st, StatusCode::BAD_REQUEST);
    assert_eq!(j["error"], "Email không đúng định dạng!");

    // Duplicate email -> 400
    let (st, j) = post_json(
        &app,
        "/api/auth/update-profile",
        Some(&token),
        json!({ "current_password": "oldPassword1", "email": "P2@EXAMPLE.COM" }),
    )
    .await;
    assert_eq!(st, StatusCode::BAD_REQUEST);
    assert_eq!(j["error"], "Địa chỉ email này đã được sử dụng!");

    // Short new_password -> 400
    let (st, j) = post_json(
        &app,
        "/api/auth/update-profile",
        Some(&token),
        json!({ "current_password": "oldPassword1", "new_password": "123" }),
    )
    .await;
    assert_eq!(st, StatusCode::BAD_REQUEST);
    assert_eq!(j["error"], "Mật khẩu mới phải từ 6 ký tự trở lên!");

    // Valid update of both email and password -> 200 OK
    let (st, j) = post_json(
        &app,
        "/api/auth/update-profile",
        Some(&token),
        json!({
            "current_password": "oldPassword1",
            "email": "p1_new@example.com",
            "new_password": "newPassword2"
        }),
    )
    .await;
    assert_eq!(st, StatusCode::OK);
    assert_eq!(j["message"], "Cập nhật thông tin tài khoản thành công!");
    assert_eq!(j["user"]["email"], "p1_new@example.com");

    // Old password rejected, new password accepted
    let (st, _) = post_json(
        &app,
        "/api/auth/login",
        None,
        json!({ "username": "PlayerOne", "password": "oldPassword1" }),
    )
    .await;
    assert_eq!(st, StatusCode::UNAUTHORIZED);

    let (st, _) = post_json(
        &app,
        "/api/auth/login",
        None,
        json!({ "username": "p1_new@example.com", "password": "newPassword2" }),
    )
    .await;
    assert_eq!(st, StatusCode::OK);
}

#[tokio::test]
async fn auth_endpoints_enforce_10_per_minute_rate_limit_when_enabled() {
    let (_state, app) = setup_app(true).await;

    for i in 0..10 {
        let req = Request::builder()
            .method(Method::POST)
            .uri("/api/auth/login")
            .header(header::CONTENT_TYPE, "application/json")
            .header("x-forwarded-for", "198.51.100.77")
            .body(Body::from(
                json!({ "username": format!("user{i}"), "password": "secret123" }).to_string(),
            ))
            .unwrap();
        let resp = app.clone().oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
    }

    let blocked = Request::builder()
        .method(Method::POST)
        .uri("/api/auth/login")
        .header(header::CONTENT_TYPE, "application/json")
        .header("x-forwarded-for", "198.51.100.77")
        .body(Body::from(
            json!({ "username": "user10", "password": "secret123" }).to_string(),
        ))
        .unwrap();
    let resp = app.oneshot(blocked).await.unwrap();
    assert_eq!(resp.status(), StatusCode::TOO_MANY_REQUESTS);
    assert!(resp.headers().contains_key(header::RETRY_AFTER));
}
