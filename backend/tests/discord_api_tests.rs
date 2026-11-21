use std::collections::HashMap;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};

use axum::body::Body;
use axum::extract::{Path, State as AxumState};
use axum::http::{HeaderMap, Method, Request, StatusCode, header};
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::{Form, Json, Router};
use http_body_util::BodyExt;
use serde_json::{Value, json};
use sqlx::Row;
use tokio::net::TcpListener;
use tokio::sync::Mutex;
use tower::ServiceExt;

use haohan_backend::config::Config;
use haohan_backend::db::Db;
use haohan_backend::domain::jwt;
use haohan_backend::integrations::cloudinary::CloudinaryClient;
use haohan_backend::integrations::discord::DiscordClient;
use haohan_backend::router::apply_http_layers;
use haohan_backend::routes;
use haohan_backend::state::{AppState, SharedState};

#[derive(Clone)]
struct MockExternalState {
    user_id: Arc<Mutex<String>>,
    username: Arc<Mutex<String>>,
    avatar: Arc<Mutex<Option<String>>>,
    in_server: Arc<AtomicBool>,
    member_roles: Arc<Mutex<Vec<String>>>,
    cloudinary_should_fail: Arc<AtomicBool>,
    cloudinary_secret: String,
    roles_fetch_count: Arc<AtomicUsize>,
    member_fetch_count: Arc<AtomicUsize>,
    cloudinary_upload_count: Arc<AtomicUsize>,
}

impl MockExternalState {
    fn new(cloudinary_secret: &str) -> Self {
        Self {
            user_id: Arc::new(Mutex::new("749112696191975434".to_string())),
            username: Arc::new(Mutex::new("PicoUser".to_string())),
            avatar: Arc::new(Mutex::new(Some("avatarhash123".to_string()))),
            in_server: Arc::new(AtomicBool::new(true)),
            member_roles: Arc::new(Mutex::new(vec![
                "role_mem".to_string(),
                "role_cb".to_string(),
            ])),
            cloudinary_should_fail: Arc::new(AtomicBool::new(false)),
            cloudinary_secret: cloudinary_secret.to_string(),
            roles_fetch_count: Arc::new(AtomicUsize::new(0)),
            member_fetch_count: Arc::new(AtomicUsize::new(0)),
            cloudinary_upload_count: Arc::new(AtomicUsize::new(0)),
        }
    }
}

async fn spawn_mock_external_server(mock_state: MockExternalState) -> String {
    let app = Router::new()
        .route(
            "/api/v10/oauth2/token",
            post(|Form(params): Form<HashMap<String, String>>| async move {
                if params.get("code").map(String::as_str) == Some("bad_code") {
                    return (
                        StatusCode::BAD_REQUEST,
                        Json(json!({ "error": "invalid_grant" })),
                    );
                }
                (
                    StatusCode::OK,
                    Json(json!({ "access_token": "mock_access_token_xyz" })),
                )
            }),
        )
        .route(
            "/api/v10/users/@me",
            get(|AxumState(st): AxumState<MockExternalState>| async move {
                let id = st.user_id.lock().await.clone();
                let username = st.username.lock().await.clone();
                let avatar = st.avatar.lock().await.clone();
                Json(json!({
                    "id": id,
                    "username": username,
                    "avatar": avatar,
                }))
            }),
        )
        .route(
            "/api/v10/users/{uid}",
            get(
                |AxumState(st): AxumState<MockExternalState>, Path(uid): Path<String>| async move {
                    let username = st.username.lock().await.clone();
                    let avatar = st.avatar.lock().await.clone();
                    Json(json!({
                        "id": uid,
                        "username": username,
                        "avatar": avatar,
                    }))
                },
            ),
        )
        .route(
            "/api/v10/guilds/{gid}/roles",
            get(|AxumState(st): AxumState<MockExternalState>| async move {
                st.roles_fetch_count.fetch_add(1, Ordering::SeqCst);
                Json(json!([
                    { "id": "role_mem", "name": "members" },
                    { "id": "role_don", "name": "Donator" },
                    { "id": "role_cb", "name": "cán bộ" }
                ]))
            }),
        )
        .route(
            "/api/v10/guilds/{gid}/members/{uid}",
            get(|AxumState(st): AxumState<MockExternalState>| async move {
                st.member_fetch_count.fetch_add(1, Ordering::SeqCst);
                if !st.in_server.load(Ordering::SeqCst) {
                    return (
                        StatusCode::NOT_FOUND,
                        Json(json!({ "code": 10007, "message": "Unknown Member" })),
                    )
                        .into_response();
                }
                let roles = st.member_roles.lock().await.clone();
                (StatusCode::OK, Json(json!({ "roles": roles }))).into_response()
            }),
        )
        .route(
            "/v1_1/{cloud}/image/upload",
            post(
                |AxumState(st): AxumState<MockExternalState>,
                 Form(params): Form<HashMap<String, String>>| async move {
                    st.cloudinary_upload_count.fetch_add(1, Ordering::SeqCst);
                    if st.cloudinary_should_fail.load(Ordering::SeqCst) {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(json!({ "error": "cloudinary outage" })),
                        )
                            .into_response();
                    }

                    let folder = params.get("folder").cloned().unwrap_or_default();
                    let ts = params.get("timestamp").cloned().unwrap_or_default();
                    let sig = params.get("signature").cloned().unwrap_or_default();
                    let expected =
                        CloudinaryClient::sign_upload_params(&folder, &ts, &st.cloudinary_secret);
                    assert_eq!(folder, "haohan_avatars");
                    assert_eq!(sig, expected, "Cloudinary SHA1 signature mismatch");

                    (
                        StatusCode::OK,
                        Json(json!({
                            "secure_url": "https://res.cloudinary.com/demo/image/upload/haohan_avatars/ok.png"
                        })),
                    )
                        .into_response()
                },
            ),
        )
        .with_state(mock_state);

    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });
    format!("http://{addr}")
}

fn test_config_with_discord(rate_limit: bool) -> Config {
    let mut cfg = Config::for_test();
    cfg.rate_limit_enabled = rate_limit;
    cfg.discord_client_id = Some("mock_client_id".to_string());
    cfg.discord_client_secret = Some("mock_client_secret".to_string());
    cfg.discord_redirect_uri = Some("http://localhost:3000/vi/discord/callback".to_string());
    cfg.discord_bot_token = Some("mock_bot_token".to_string());
    cfg.discord_guild_id = Some("guild_12345".to_string());
    cfg.cloudinary_cloud_name = Some("demo_cloud".to_string());
    cfg.cloudinary_api_key = Some("cloud_key".to_string());
    cfg.cloudinary_api_secret = Some("cloud_secret".to_string());
    cfg
}

async fn setup_discord_app(cfg: Config, mock_base: &str) -> (SharedState, axum::Router) {
    let db = Db::connect_in_memory().await.unwrap();
    let state = AppState::new(cfg.clone(), db).unwrap();
    let discord = DiscordClient::with_bases(
        format!("{mock_base}/oauth2/authorize"),
        format!("{mock_base}/api/v10"),
    );
    let cloudinary = CloudinaryClient::with_url(format!("{mock_base}/v1_1"));
    let router = Router::new()
        .merge(routes::discord::routes_with_clients(
            &cfg, discord, cloudinary,
        ))
        .with_state(state.clone());
    (state, apply_http_layers(router, &cfg))
}

async fn send_json(
    app: &axum::Router,
    method: Method,
    uri: &str,
    bearer: Option<&str>,
    body: Option<Value>,
) -> (StatusCode, HeaderMap, Value) {
    let mut builder = Request::builder().method(method).uri(uri);
    if let Some(tok) = bearer {
        builder = builder.header(header::AUTHORIZATION, format!("Bearer {tok}"));
    }
    let req = if let Some(b) = body {
        builder
            .header(header::CONTENT_TYPE, "application/json")
            .body(Body::from(b.to_string()))
            .unwrap()
    } else {
        builder.body(Body::empty()).unwrap()
    };
    let resp = app.clone().oneshot(req).await.unwrap();
    let status = resp.status();
    let headers = resp.headers().clone();
    let bytes = resp.into_body().collect().await.unwrap().to_bytes();
    let val = serde_json::from_slice(&bytes).unwrap_or(Value::Null);
    (status, headers, val)
}

#[tokio::test]
async fn discord_url_and_login_url_contracts() {
    let mock_state = MockExternalState::new("cloud_secret");
    let mock_base = spawn_mock_external_server(mock_state).await;
    let cfg = test_config_with_discord(false);
    let (state, app) = setup_discord_app(cfg, &mock_base).await;

    let user_id: i64 = sqlx::query_scalar(
        "INSERT INTO players (username, email, uuid, kind, password_hash) \
         VALUES ('UrlUser', 'url@example.com', '11111111-1111-3111-8111-111111111111', 'web', 'h') \
         RETURNING id",
    )
    .fetch_one(&state.db.write)
    .await
    .unwrap();
    let tok = jwt::encode_session_token(&state.cfg.jwt_secret, user_id).unwrap();

    // Unauthenticated /url -> 401
    let (st, _, _) = send_json(&app, Method::GET, "/api/auth/discord/url", None, None).await;
    assert_eq!(st, StatusCode::UNAUTHORIZED);

    // GET /url with query ?token=...
    let (st, hdrs, j) = send_json(
        &app,
        Method::GET,
        &format!("/api/auth/discord/url?token={tok}"),
        None,
        None,
    )
    .await;
    assert_eq!(st, StatusCode::OK);
    assert_eq!(
        hdrs.get(header::CACHE_CONTROL)
            .and_then(|v| v.to_str().ok()),
        Some("no-store")
    );
    let parsed = url::Url::parse(j["url"].as_str().unwrap()).unwrap();
    let state_param = parsed
        .query_pairs()
        .find(|(k, _)| k == "state")
        .map(|(_, v)| v.to_string())
        .unwrap();
    let claims = jwt::decode_discord_state(
        &state.cfg.jwt_secret,
        &state_param,
        jwt::PURPOSE_DISCORD_LINK,
    )
    .unwrap();
    assert_eq!(claims.user_id, Some(user_id));

    // POST /url with JSON body { token } (like HomeClient.js)
    let (st, hdrs, j) = send_json(
        &app,
        Method::POST,
        "/api/auth/discord/url",
        None,
        Some(json!({ "token": tok })),
    )
    .await;
    assert_eq!(st, StatusCode::OK);
    assert_eq!(
        hdrs.get(header::CACHE_CONTROL)
            .and_then(|v| v.to_str().ok()),
        Some("no-store")
    );
    assert!(j["url"].as_str().unwrap().contains("scope=identify"));

    // GET /api/auth/discord/login-url (public, no-store, atob()-compatible payload)
    let (st, hdrs, j) =
        send_json(&app, Method::GET, "/api/auth/discord/login-url", None, None).await;
    assert_eq!(st, StatusCode::OK);
    assert_eq!(
        hdrs.get(header::CACHE_CONTROL)
            .and_then(|v| v.to_str().ok()),
        Some("no-store")
    );
    let login_url = url::Url::parse(j["url"].as_str().unwrap()).unwrap();
    let login_state = login_url
        .query_pairs()
        .find(|(k, _)| k == "state")
        .map(|(_, v)| v.to_string())
        .unwrap();
    let payload_b64 = login_state.split('.').nth(1).unwrap();
    let payload_bytes = decode_base64url(payload_b64);
    let payload_json: Value = serde_json::from_slice(&payload_bytes).unwrap();
    assert_eq!(payload_json["purpose"], "discord_login");
    assert!(payload_json.get("user_id").is_none());
}

fn decode_base64url(input: &str) -> Vec<u8> {
    let mut out = Vec::new();
    let mut buf: u32 = 0;
    let mut bits: u8 = 0;
    for b in input.bytes() {
        let val = match b {
            b'A'..=b'Z' => b - b'A',
            b'a'..=b'z' => b - b'a' + 26,
            b'0'..=b'9' => b - b'0' + 52,
            b'-' | b'+' => 62,
            b'_' | b'/' => 63,
            b'=' => break,
            _ => continue,
        };
        buf = (buf << 6) | u32::from(val);
        bits += 6;
        if bits >= 8 {
            bits -= 8;
            out.push(((buf >> bits) & 0xff) as u8);
        }
    }
    out
}

#[tokio::test]
async fn discord_callback_links_merges_ghost_detects_409_and_handles_cloudinary_fallback() {
    let mock_state = MockExternalState::new("cloud_secret");
    let mock_base = spawn_mock_external_server(mock_state.clone()).await;
    let cfg = test_config_with_discord(false);
    let (state, app) = setup_discord_app(cfg, &mock_base).await;

    let web_id: i64 = sqlx::query_scalar(
        "INSERT INTO players (username, email, uuid, kind, password_hash, total_donated, play_time) \
         VALUES ('WebUser', 'web@example.com', '11111111-1111-3111-8111-111111111111', 'web', 'h', 25000, 500) \
         RETURNING id",
    )
    .fetch_one(&state.db.write)
    .await
    .unwrap();
    let link_state = jwt::encode_discord_link_state(&state.cfg.jwt_secret, web_id).unwrap();

    // Missing code -> 400
    let (st, _, j) = send_json(
        &app,
        Method::POST,
        "/api/auth/discord/callback",
        None,
        Some(json!({ "code": "  ", "state": link_state })),
    )
    .await;
    assert_eq!(st, StatusCode::BAD_REQUEST);
    assert_eq!(j["error"], "Không tìm thấy mã xác thực OAuth!");

    // Login state token rejected as link fallback auth -> 401
    let bad_purpose_state = jwt::encode_discord_login_state(&state.cfg.jwt_secret).unwrap();
    let (st, _, _) = send_json(
        &app,
        Method::POST,
        "/api/auth/discord/callback",
        None,
        Some(json!({ "code": "valid_code", "state": bad_purpose_state })),
    )
    .await;
    assert_eq!(st, StatusCode::UNAUTHORIZED);

    // User not in Discord server -> 403
    mock_state.in_server.store(false, Ordering::SeqCst);
    let (st, _, j) = send_json(
        &app,
        Method::POST,
        "/api/auth/discord/callback",
        None,
        Some(json!({ "code": "valid_code", "state": link_state })),
    )
    .await;
    assert_eq!(st, StatusCode::FORBIDDEN);
    assert_eq!(
        j["error"],
        "Bạn phải tham gia server Discord của Hảo Hán SMP trước khi liên kết!"
    );

    // Seed a Minecraft ghost with matching discord_id and uuid IS NOT NULL + donation
    mock_state.in_server.store(true, Ordering::SeqCst);
    let ghost_id: i64 = sqlx::query_scalar(
        "INSERT INTO players (username, uuid, kind, password_hash, discord_id, total_donated, play_time) \
         VALUES ('McGhost', '99999999-8888-3777-8666-555555555555', 'ghost', NULL, '749112696191975434', 75000, 4200) \
         RETURNING id",
    )
    .fetch_one(&state.db.write)
    .await
    .unwrap();
    sqlx::query(
        "INSERT INTO donations (player_id, method, amount, tx_ref, status) \
         VALUES (?1, 'PAYOS', 75000, 'TX_DC_GHOST', 'SUCCESS')",
    )
    .bind(ghost_id)
    .execute(&state.db.write)
    .await
    .unwrap();

    // Successful callback using state fallback auth + Cloudinary upload + Ghost merge
    let (st, _, j) = send_json(
        &app,
        Method::POST,
        "/api/auth/discord/callback",
        None,
        Some(json!({ "code": "valid_code", "state": link_state })),
    )
    .await;
    assert_eq!(st, StatusCode::OK);
    assert_eq!(j["message"], "Liên kết Discord thành công!");
    assert_eq!(j["user"]["id"], web_id);
    assert_eq!(j["user"]["username"], "McGhost");
    assert_eq!(j["user"]["uuid"], "99999999-8888-3777-8666-555555555555");
    assert_eq!(j["user"]["is_linked"], 1);
    assert_eq!(j["user"]["discord_id"], "749112696191975434");
    assert_eq!(j["user"]["role"], "Cán Bộ");
    assert_eq!(
        j["user"]["avatar_url"],
        "https://res.cloudinary.com/demo/image/upload/haohan_avatars/ok.png"
    );
    assert_eq!(j["user"]["play_time"], 4200);
    assert!(
        jwt::decode_session_token(&state.cfg.jwt_secret, j["token"].as_str().unwrap()).is_some()
    );

    // Ghost deleted, donations transferred, total_donated summed
    let ghost_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM players WHERE id = ?1")
        .bind(ghost_id)
        .fetch_one(&state.db.read)
        .await
        .unwrap();
    assert_eq!(ghost_count, 0);
    let donated_sum: i64 = sqlx::query_scalar("SELECT total_donated FROM players WHERE id = ?1")
        .bind(web_id)
        .fetch_one(&state.db.read)
        .await
        .unwrap();
    assert_eq!(donated_sum, 100_000);

    // Second web user trying to link same Discord ID -> 409 Conflict
    let other_id: i64 = sqlx::query_scalar(
        "INSERT INTO players (username, email, uuid, kind, password_hash) \
         VALUES ('OtherWeb', 'other@example.com', '22222222-2222-3222-8222-222222222222', 'web', 'h') \
         RETURNING id",
    )
    .fetch_one(&state.db.write)
    .await
    .unwrap();
    let other_tok = jwt::encode_session_token(&state.cfg.jwt_secret, other_id).unwrap();
    let (st, _, j) = send_json(
        &app,
        Method::POST,
        "/api/auth/discord/callback",
        Some(&other_tok),
        Some(json!({ "code": "valid_code" })),
    )
    .await;
    assert_eq!(st, StatusCode::CONFLICT);
    assert_eq!(
        j["error"],
        "Tài khoản Discord này đã được liên kết với một tài khoản web khác!"
    );

    // Cloudinary outage fallback uses Discord CDN URL (and embed avatar when avatar hash is None)
    mock_state
        .cloudinary_should_fail
        .store(true, Ordering::SeqCst);
    *mock_state.user_id.lock().await = "20971520".to_string(); // (20971520 >> 22) % 6 == 5
    *mock_state.avatar.lock().await = None;
    let (st, _, j) = send_json(
        &app,
        Method::POST,
        "/api/auth/discord/callback",
        Some(&other_tok),
        Some(json!({ "code": "valid_code" })),
    )
    .await;
    assert_eq!(st, StatusCode::OK);
    assert_eq!(
        j["user"]["avatar_url"],
        "https://cdn.discordapp.com/embed/avatars/5.png"
    );
}

#[tokio::test]
async fn discord_sync_role_update_and_moka_roles_cache() {
    let mock_state = MockExternalState::new("cloud_secret");
    let mock_base = spawn_mock_external_server(mock_state.clone()).await;
    let cfg = test_config_with_discord(false);
    let (state, app) = setup_discord_app(cfg, &mock_base).await;

    let unlinked_id: i64 = sqlx::query_scalar(
        "INSERT INTO players (username, email, uuid, kind, password_hash) \
         VALUES ('NoDiscord', 'nd@example.com', '11111111-1111-3111-8111-111111111111', 'web', 'h') \
         RETURNING id",
    )
    .fetch_one(&state.db.write)
    .await
    .unwrap();
    let unlinked_tok = jwt::encode_session_token(&state.cfg.jwt_secret, unlinked_id).unwrap();

    // Sync before linking Discord -> 400
    let (st, _, j) = send_json(
        &app,
        Method::POST,
        "/api/auth/discord/sync",
        Some(&unlinked_tok),
        None,
    )
    .await;
    assert_eq!(st, StatusCode::BAD_REQUEST);
    assert_eq!(j["error"], "Tài khoản chưa được liên kết với Discord!");

    // Link Discord ID to user
    sqlx::query("UPDATE players SET discord_id = '749112696191975434' WHERE id = ?1")
        .bind(unlinked_id)
        .execute(&state.db.write)
        .await
        .unwrap();

    // Left Discord server -> 403
    mock_state.in_server.store(false, Ordering::SeqCst);
    let (st, _, j) = send_json(
        &app,
        Method::POST,
        "/api/auth/discord/sync",
        Some(&unlinked_tok),
        None,
    )
    .await;
    assert_eq!(st, StatusCode::FORBIDDEN);
    assert_eq!(
        j["error"],
        "Không thể tìm thấy bạn trong server Discord của Hảo Hán SMP. Hãy chắc chắn bạn đã tham gia server!"
    );

    // Rejoin server -> sync succeeds (1st guild roles API call)
    mock_state.in_server.store(true, Ordering::SeqCst);
    *mock_state.member_roles.lock().await = vec!["role_don".to_string()];
    let (st, _, j) = send_json(
        &app,
        Method::POST,
        "/api/auth/discord/sync",
        Some(&unlinked_tok),
        None,
    )
    .await;
    assert_eq!(st, StatusCode::OK);
    assert_eq!(j["message"], "Đồng bộ thông tin Discord thành công!");
    assert_eq!(j["user"]["role"], "Donator");
    assert_eq!(
        j["user"]["avatar_url"],
        "https://res.cloudinary.com/demo/image/upload/haohan_avatars/ok.png"
    );
    let roles_calls_after_sync = mock_state.roles_fetch_count.load(Ordering::SeqCst);
    assert!(
        (1..=2).contains(&roles_calls_after_sync),
        "expected 1 or 2 roles fetches after 404 short-circuit + sync, got {roles_calls_after_sync}"
    );

    // Bot role-update unauthorized -> 401
    let (st, _, j) = send_json(
        &app,
        Method::POST,
        "/api/discord/role-update",
        Some("wrong_bot_token"),
        Some(json!({ "discord_id": "749112696191975434" })),
    )
    .await;
    assert_eq!(st, StatusCode::UNAUTHORIZED);
    assert_eq!(j["error"], "Unauthorized Bot/Server");

    let bot_tok = state.cfg.game_server_token.clone();

    // Missing discord_id -> 400
    let (st, _, j) = send_json(
        &app,
        Method::POST,
        "/api/discord/role-update",
        Some(&bot_tok),
        Some(json!({ "discord_id": "" })),
    )
    .await;
    assert_eq!(st, StatusCode::BAD_REQUEST);
    assert_eq!(j["error"], "Thiếu discord_id!");

    // Unknown discord_id -> 404
    let (st, _, j) = send_json(
        &app,
        Method::POST,
        "/api/discord/role-update",
        Some(&bot_tok),
        Some(json!({ "discord_id": "0000000000" })),
    )
    .await;
    assert_eq!(st, StatusCode::NOT_FOUND);
    assert_eq!(
        j["error"],
        "Không tìm thấy người chơi liên kết với Discord ID này!"
    );

    // Role update with explicit roles array
    let (st, _, j) = send_json(
        &app,
        Method::POST,
        "/api/discord/role-update",
        Some(&bot_tok),
        Some(json!({ "discord_id": "749112696191975434", "roles": ["Members", "Helper"] })),
    )
    .await;
    assert_eq!(st, StatusCode::OK);
    assert_eq!(j["player"]["role"], "Helper");

    // Role update without roles array fetches via Bot API and hits cached guild roles
    *mock_state.member_roles.lock().await = vec!["role_cb".to_string()];
    let (st, _, j) = send_json(
        &app,
        Method::POST,
        "/api/discord/role-update",
        Some(&bot_tok),
        Some(json!({ "discord_id": "749112696191975434" })),
    )
    .await;
    assert_eq!(st, StatusCode::OK);
    assert_eq!(j["player"]["role"], "Cán Bộ");
    assert_eq!(
        mock_state.roles_fetch_count.load(Ordering::SeqCst),
        roles_calls_after_sync
    );
    assert_eq!(mock_state.member_fetch_count.load(Ordering::SeqCst), 3);

    // Missing bot_token/guild_id falls back to ["Members"]
    let mut cfg_no_bot = test_config_with_discord(false);
    cfg_no_bot.discord_bot_token = None;
    cfg_no_bot.discord_guild_id = None;
    let discord_no_bot = DiscordClient::with_bases(
        format!("{mock_base}/oauth2/authorize"),
        format!("{mock_base}/api/v10"),
    );
    let fallback_roles = discord_no_bot
        .fetch_guild_member_roles(&state.http, &cfg_no_bot, "749112696191975434")
        .await
        .unwrap();
    assert_eq!(fallback_roles, vec!["Members".to_string()]);
}

#[tokio::test]
async fn discord_login_creates_unique_user_claims_ghost_and_logs_in_existing() {
    let mock_state = MockExternalState::new("cloud_secret");
    let mock_base = spawn_mock_external_server(mock_state.clone()).await;
    let cfg = test_config_with_discord(false);
    let (state, app) = setup_discord_app(cfg, &mock_base).await;

    // Missing code -> 400
    let (st, _, j) = send_json(
        &app,
        Method::POST,
        "/api/auth/discord/login",
        None,
        Some(json!({ "code": "" })),
    )
    .await;
    assert_eq!(st, StatusCode::BAD_REQUEST);
    assert_eq!(j["error"], "Không tìm thấy mã xác thực OAuth!");

    // Invalid state -> 400
    let link_state = jwt::encode_discord_link_state(&state.cfg.jwt_secret, 1).unwrap();
    let (st, _, j) = send_json(
        &app,
        Method::POST,
        "/api/auth/discord/login",
        None,
        Some(json!({ "code": "ok", "state": link_state })),
    )
    .await;
    assert_eq!(st, StatusCode::BAD_REQUEST);
    assert_eq!(j["error"], "State không hợp lệ!");

    // Not in server -> 403
    let valid_login_state = jwt::encode_discord_login_state(&state.cfg.jwt_secret).unwrap();
    mock_state.in_server.store(false, Ordering::SeqCst);
    let (st, _, j) = send_json(
        &app,
        Method::POST,
        "/api/auth/discord/login",
        None,
        Some(json!({ "code": "ok", "state": valid_login_state })),
    )
    .await;
    assert_eq!(st, StatusCode::FORBIDDEN);
    assert_eq!(
        j["error"],
        "Bạn phải tham gia server Discord của Hảo Hán SMP trước khi đăng nhập!"
    );

    // Long Discord username colliding with existing web user -> 11 chars + 4 hex <= 16 chars
    mock_state.in_server.store(true, Ordering::SeqCst);
    *mock_state.user_id.lock().await = "111222333444".to_string();
    *mock_state.username.lock().await = "SuperLongDiscordPlayerName".to_string();

    sqlx::query(
        "INSERT INTO players (username, email, uuid, kind, password_hash) \
         VALUES ('SuperLongDiscord', 'taken@example.com', '33333333-3333-3333-8333-333333333333', 'web', 'h')",
    )
    .execute(&state.db.write)
    .await
    .unwrap();

    let (st, _, j) = send_json(
        &app,
        Method::POST,
        "/api/auth/discord/login",
        None,
        Some(json!({ "code": "ok", "state": valid_login_state })),
    )
    .await;
    assert_eq!(st, StatusCode::OK);
    assert_eq!(j["message"], "Đăng nhập bằng Discord thành công!");
    let generated_name = j["user"]["username"].as_str().unwrap().to_string();
    assert!(generated_name.starts_with("SuperLongDi"));
    assert_eq!(generated_name.len(), 15);
    assert_eq!(j["user"]["is_linked"], 0);
    assert_eq!(j["user"]["role"], "Cán Bộ");

    let row =
        sqlx::query("SELECT kind, password_hash FROM players WHERE discord_id = '111222333444'")
            .fetch_one(&state.db.read)
            .await
            .unwrap();
    assert_eq!(row.try_get::<String, _>("kind").unwrap(), "discord");
    assert!(
        row.try_get::<Option<String>, _>("password_hash")
            .unwrap()
            .is_none()
    );

    // Outbox has notify_new_user embed
    let outbox_count: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM outbox WHERE kind = 'discord_webhook'")
            .fetch_one(&state.db.read)
            .await
            .unwrap();
    assert_eq!(outbox_count, 1);

    // Subsequent login with same discord_id updates role/avatar without adding another outbox row
    *mock_state.member_roles.lock().await = vec!["role_mem".to_string()];
    let (st, _, j) = send_json(
        &app,
        Method::POST,
        "/api/auth/discord/login",
        None,
        Some(json!({ "code": "ok" })),
    )
    .await;
    assert_eq!(st, StatusCode::OK);
    assert_eq!(j["user"]["username"], generated_name);
    assert_eq!(j["user"]["role"], "Members");
    let outbox_count_after: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM outbox WHERE kind = 'discord_webhook'")
            .fetch_one(&state.db.read)
            .await
            .unwrap();
    assert_eq!(outbox_count_after, 1);

    // Ghost claim via Discord login matching username
    sqlx::query(
        "INSERT INTO players (username, uuid, kind, password_hash, total_donated, play_time) \
         VALUES ('GhostDiscord', '44444444-4444-3444-8444-444444444444', 'ghost', NULL, 50000, 900)",
    )
    .execute(&state.db.write)
    .await
    .unwrap();
    *mock_state.user_id.lock().await = "555666777888".to_string();
    *mock_state.username.lock().await = "GhostDiscord".to_string();
    *mock_state.member_roles.lock().await = vec!["role_don".to_string()];

    let (st, _, j) = send_json(
        &app,
        Method::POST,
        "/api/auth/discord/login",
        None,
        Some(json!({ "code": "ok", "state": valid_login_state })),
    )
    .await;
    assert_eq!(st, StatusCode::OK);
    assert_eq!(j["user"]["username"], "GhostDiscord");
    assert_eq!(j["user"]["is_linked"], 1);
    assert_eq!(j["user"]["role"], "Donator");
    assert_eq!(j["user"]["play_time"], 900);
}

#[tokio::test]
async fn discord_login_and_callback_enforce_20_per_minute_rate_limit() {
    let mock_state = MockExternalState::new("cloud_secret");
    let mock_base = spawn_mock_external_server(mock_state).await;
    let cfg = test_config_with_discord(true);
    let (_state, app) = setup_discord_app(cfg, &mock_base).await;

    for uri in ["/api/auth/discord/login", "/api/auth/discord/callback"] {
        for _ in 0..20 {
            let req = Request::builder()
                .method(Method::POST)
                .uri(uri)
                .header(header::CONTENT_TYPE, "application/json")
                .header("x-forwarded-for", "198.51.100.200")
                .body(Body::from(json!({ "code": "" }).to_string()))
                .unwrap();
            let resp = app.clone().oneshot(req).await.unwrap();
            assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
        }

        let blocked = Request::builder()
            .method(Method::POST)
            .uri(uri)
            .header(header::CONTENT_TYPE, "application/json")
            .header("x-forwarded-for", "198.51.100.200")
            .body(Body::from(json!({ "code": "" }).to_string()))
            .unwrap();
        let resp = app.clone().oneshot(blocked).await.unwrap();
        assert_eq!(resp.status(), StatusCode::TOO_MANY_REQUESTS);
    }
}
