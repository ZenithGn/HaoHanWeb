use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use axum::body::Body;
use axum::extract::{Extension, Path as AxumPath, State};
use axum::http::{HeaderMap, Method, Request, StatusCode, header};
use axum::routing::{get, post};
use axum::{Json, Router};
use http_body_util::BodyExt;
use jsonwebtoken::{Algorithm, EncodingKey, Header};
use serde::Serialize;
use serde_json::{Map, Value, json};
use sqlx::Row;
use tokio::net::TcpListener;
use tokio::sync::Mutex;
use tower::ServiceExt;

use haohan_backend::config::Config;
use haohan_backend::db::Db;
use haohan_backend::domain::payos_crypto::{sign_payment_request, sign_payos_data_map};
use haohan_backend::integrations::payos::PayOsBaseUrl;
use haohan_backend::router::build_router;
use haohan_backend::state::{AppState, SharedState};

const TEST_CHECKSUM: &str = "payos_test_checksum_key_123";

#[derive(Serialize)]
struct Claims {
    user_id: i64,
    exp: usize,
}

fn test_jwt(secret: &str, user_id: i64) -> String {
    let exp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as usize
        + 3600;
    jsonwebtoken::encode(
        &Header::new(Algorithm::HS256),
        &Claims { user_id, exp },
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .unwrap()
}

fn test_config(app_env: &str, public_api_url: Option<&str>) -> Config {
    let mut pairs = vec![
        ("APP_ENV", app_env),
        ("JWT_SECRET", "test_jwt_secret_key"),
        ("GAME_SERVER_TOKEN", "test_game_server_token"),
        ("FRONTEND_URL", "http://localhost:3000"),
        ("RATE_LIMIT_ENABLED", "false"),
        ("PAYOS_CLIENT_ID", "test_client_id"),
        ("PAYOS_API_KEY", "test_api_key"),
        ("PAYOS_CHECKSUM_KEY", TEST_CHECKSUM),
    ];
    if let Some(url) = public_api_url {
        pairs.push(("PUBLIC_API_URL", url));
    }
    Config::from_pairs(pairs).unwrap()
}

async fn seed_player(db: &Db, username: &str) -> i64 {
    sqlx::query_scalar::<_, i64>(
        "INSERT INTO players (username, email, kind, password_hash, total_donated) \
         VALUES (?1, ?2, 'web', '$argon2id$v=19$m=19456,t=2,p=1$abc$def', 0) \
         RETURNING id",
    )
    .bind(username)
    .bind(format!("{username}@example.com"))
    .fetch_one(&db.write)
    .await
    .unwrap()
}

async fn response_json(resp: axum::response::Response) -> (StatusCode, Value) {
    let status = resp.status();
    let bytes = resp.into_body().collect().await.unwrap().to_bytes();
    let val = serde_json::from_slice(&bytes).unwrap_or(Value::Null);
    (status, val)
}

#[derive(Clone, Default)]
struct MockPayOsState {
    create_requests: Arc<Mutex<Vec<Value>>>,
    payment_status: Arc<Mutex<String>>,
    payment_amount: Arc<Mutex<i64>>,
}

async fn spawn_mock_payos_server(
    mock_state: MockPayOsState,
) -> (String, tokio::task::JoinHandle<()>) {
    let app = Router::new()
        .route(
            "/v2/payment-requests",
            post(
                |State(st): State<MockPayOsState>, headers: HeaderMap, Json(body): Json<Value>| async move {
                    assert_eq!(
                        headers.get("x-client-id").and_then(|v| v.to_str().ok()),
                        Some("test_client_id")
                    );
                    assert_eq!(
                        headers.get("x-api-key").and_then(|v| v.to_str().ok()),
                        Some("test_api_key")
                    );
                    st.create_requests.lock().await.push(body.clone());
                    let order_code = body["orderCode"].as_i64().unwrap_or(0);
                    Json(json!({
                        "code": "00",
                        "desc": "success",
                        "data": {
                            "checkoutUrl": format!("https://pay.payos.vn/web/{order_code}"),
                            "qrCode": format!("000201010212{order_code}")
                        }
                    }))
                },
            ),
        )
        .route(
            "/v2/payment-requests/{order_code}",
            get(
                |State(st): State<MockPayOsState>, AxumPath(order_code): AxumPath<String>| async move {
                    let status = st.payment_status.lock().await.clone();
                    let amount = *st.payment_amount.lock().await;
                    Json(json!({
                        "code": "00",
                        "data": {
                            "orderCode": order_code.parse::<i64>().unwrap_or(0),
                            "amount": amount,
                            "status": status
                        }
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
    (format!("http://{addr}/v2/payment-requests"), handle)
}

#[tokio::test]
async fn legacy_mock_donate_works_with_name_and_default() {
    let db = Db::connect_in_memory().await.unwrap();
    let state = AppState::new(test_config("test", None), db).unwrap();
    let app = build_router(state);

    let (status, body) = response_json(
        app.clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/api/donate")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(r#"{"name":"Steve"}"#))
                    .unwrap(),
            )
            .await
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["success"], true);
    assert_eq!(body["name"], "Steve");
    assert_eq!(
        body["message"],
        "Cổng thanh toán thử nghiệm. Cảm ơn Steve đã ủng hộ!"
    );

    let (status, body) = response_json(
        app.oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/donate")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["name"], "Unknown Player");
}

#[tokio::test]
async fn payos_create_validates_auth_min_amount_and_persists_pending_donation() {
    let db = Db::connect_in_memory().await.unwrap();
    let player_id = seed_player(&db, "Steve_VN").await;
    let cfg = test_config("test", None);
    let jwt = test_jwt(&cfg.jwt_secret, player_id);
    let state: SharedState = AppState::new(cfg, db).unwrap();

    let mock_state = MockPayOsState::default();
    let (mock_url, server_handle) = spawn_mock_payos_server(mock_state.clone()).await;
    let app = build_router(state.clone()).layer(Extension(PayOsBaseUrl(mock_url)));

    // Unauthorized without token
    let (status, _) = response_json(
        app.clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/api/donations/payos/create")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(r#"{"amount":50000}"#))
                    .unwrap(),
            )
            .await
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);

    // Amount < 2000 -> 400
    let (status, body) = response_json(
        app.clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/api/donations/payos/create")
                    .header(header::AUTHORIZATION, format!("Bearer {jwt}"))
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(r#"{"amount":1500}"#))
                    .unwrap(),
            )
            .await
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["error"], "Số tiền ủng hộ tối thiểu là 2.000 VND.");

    // Valid creation using Host header fallback for returnUrl/cancelUrl
    let (status, body) = response_json(
        app.oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/donations/payos/create")
                .header(header::AUTHORIZATION, format!("Bearer {jwt}"))
                .header(header::HOST, "api.haohansmp.local")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    r#"{"amount":50000,"message":"Ung ho server","lang":"vi"}"#,
                ))
                .unwrap(),
        )
        .await
        .unwrap(),
    )
    .await;

    assert_eq!(status, StatusCode::OK);
    let order_code = body["orderCode"].as_i64().unwrap();
    assert!(order_code > 0);
    assert!(order_code < 9_007_199_254_740_991);
    assert_eq!(body["amount"], 50_000);
    assert_eq!(
        body["checkoutUrl"],
        format!("https://pay.payos.vn/web/{order_code}")
    );
    assert!(body["qrCode"].as_str().is_some());

    // Verify request sent to PayOS mock
    let sent = mock_state.create_requests.lock().await;
    assert_eq!(sent.len(), 1);
    let req_body = &sent[0];
    let expected_return =
        format!("http://api.haohansmp.local/donate?lang=vi&orderCode={order_code}");
    let expected_cancel = format!("{expected_return}&cancel=true");
    assert_eq!(req_body["returnUrl"], expected_return);
    assert_eq!(req_body["cancelUrl"], expected_cancel);
    let desc = req_body["description"].as_str().unwrap();
    assert!(desc.len() <= 25);
    let expected_sig = sign_payment_request(
        TEST_CHECKSUM,
        50_000,
        &expected_cancel,
        desc,
        order_code,
        &expected_return,
    );
    assert_eq!(req_body["signature"], expected_sig);

    // Verify DB record
    let row = sqlx::query(
        "SELECT player_id, method, amount, status, message FROM donations WHERE tx_ref = ?1",
    )
    .bind(order_code.to_string())
    .fetch_one(&state.db.read)
    .await
    .unwrap();
    assert_eq!(row.try_get::<i64, _>("player_id").unwrap(), player_id);
    assert_eq!(row.try_get::<String, _>("method").unwrap(), "PAYOS");
    assert_eq!(row.try_get::<i64, _>("amount").unwrap(), 50_000);
    assert_eq!(row.try_get::<String, _>("status").unwrap(), "PENDING");
    assert_eq!(
        row.try_get::<Option<String>, _>("message")
            .unwrap()
            .as_deref(),
        Some("Ung ho server")
    );

    server_handle.abort();
}

#[tokio::test]
async fn payos_webhook_rejects_invalid_signature_and_handles_concurrent_duplicates_atomically() {
    let db = Db::connect_in_memory().await.unwrap();
    let player_id = seed_player(&db, "Steve").await;
    let state: SharedState = AppState::new(test_config("test", None), db).unwrap();

    sqlx::query(
        "INSERT INTO donations (player_id, method, amount, tx_ref, message, status) \
         VALUES (?1, 'PAYOS', 50000, '1730000123001', 'For VIP', 'PENDING')",
    )
    .bind(player_id)
    .execute(&state.db.write)
    .await
    .unwrap();

    let app = build_router(state.clone());

    // Invalid signature -> 401
    let (status, err_json) = response_json(
        app.clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/api/donations/payos/webhook")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        r#"{"code":"00","success":true,"data":{"orderCode":1730000123001,"amount":50000},"signature":"deadbeef"}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(err_json["error"], "Invalid Webhook Signature");

    // Build validly signed webhook payload
    let mut data_map = Map::new();
    data_map.insert("orderCode".into(), json!(1_730_000_123_001_i64));
    data_map.insert("amount".into(), json!(75_000));
    data_map.insert("description".into(), json!("GD123001 UH HHSMP Steve"));
    let sig = sign_payos_data_map(TEST_CHECKSUM, &data_map);
    let webhook_body = json!({
        "code": "00",
        "desc": "success",
        "success": true,
        "data": data_map,
        "signature": sig
    })
    .to_string();

    // Fire 8 concurrent duplicate webhook requests
    let mut handles = Vec::new();
    for _ in 0..8 {
        let app_clone = app.clone();
        let body_clone = webhook_body.clone();
        handles.push(tokio::spawn(async move {
            let resp = app_clone
                .oneshot(
                    Request::builder()
                        .method(Method::POST)
                        .uri("/api/donations/payos/webhook")
                        .header(header::CONTENT_TYPE, "application/json")
                        .body(Body::from(body_clone))
                        .unwrap(),
                )
                .await
                .unwrap();
            response_json(resp).await
        }));
    }

    for h in handles {
        let (status, json) = h.await.unwrap();
        assert_eq!(status, StatusCode::OK);
        assert_eq!(json["success"], true);
    }

    // Player total_donated must be credited ONCE (75,000, not 8 * 75,000)
    let total_donated: i64 = sqlx::query_scalar("SELECT total_donated FROM players WHERE id = ?1")
        .bind(player_id)
        .fetch_one(&state.db.read)
        .await
        .unwrap();
    assert_eq!(total_donated, 75_000);

    let donation_status: String =
        sqlx::query_scalar("SELECT status FROM donations WHERE tx_ref = '1730000123001'")
            .fetch_one(&state.db.read)
            .await
            .unwrap();
    assert_eq!(donation_status, "SUCCESS");

    // Outbox must contain exactly 2 RCON commands and 1 Discord webhook
    let outbox_rows = sqlx::query("SELECT kind, payload FROM outbox ORDER BY id ASC")
        .fetch_all(&state.db.read)
        .await
        .unwrap();
    assert_eq!(outbox_rows.len(), 3);
    assert_eq!(outbox_rows[0].try_get::<String, _>("kind").unwrap(), "rcon");
    assert_eq!(
        outbox_rows[0].try_get::<String, _>("payload").unwrap(),
        "lp user Steve parent add vip"
    );
    assert_eq!(outbox_rows[1].try_get::<String, _>("kind").unwrap(), "rcon");
    assert_eq!(
        outbox_rows[1].try_get::<String, _>("payload").unwrap(),
        "say Steve da donate thanh cong 75000 VND! Cam on ban!"
    );
    assert_eq!(
        outbox_rows[2].try_get::<String, _>("kind").unwrap(),
        "discord_webhook"
    );
    let embed: Value =
        serde_json::from_str(&outbox_rows[2].try_get::<String, _>("payload").unwrap()).unwrap();
    assert_eq!(embed["embeds"][0]["title"], "💖 Có người quyên góp mới!");
}

#[tokio::test]
async fn payos_webhook_marks_failed_when_not_successful() {
    let db = Db::connect_in_memory().await.unwrap();
    let player_id = seed_player(&db, "Alex").await;
    let state: SharedState = AppState::new(test_config("test", None), db).unwrap();

    sqlx::query(
        "INSERT INTO donations (player_id, method, amount, tx_ref, status) \
         VALUES (?1, 'PAYOS', 50000, '999000111', 'PENDING')",
    )
    .bind(player_id)
    .execute(&state.db.write)
    .await
    .unwrap();

    let mut data_map = Map::new();
    data_map.insert("orderCode".into(), json!(999_000_111_i64));
    data_map.insert("amount".into(), json!(50_000));
    let sig = sign_payos_data_map(TEST_CHECKSUM, &data_map);

    let app = build_router(state.clone());
    let (status, body) = response_json(
        app.oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/donations/payos/webhook")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "code": "01",
                        "success": false,
                        "data": data_map,
                        "signature": sig
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
    assert_eq!(body["success"], true);

    let donation_status: String =
        sqlx::query_scalar("SELECT status FROM donations WHERE tx_ref = '999000111'")
            .fetch_one(&state.db.read)
            .await
            .unwrap();
    assert_eq!(donation_status, "FAILED");

    let outbox_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM outbox")
        .fetch_one(&state.db.read)
        .await
        .unwrap();
    assert_eq!(outbox_count, 0);
}

#[tokio::test]
async fn donate_return_verifies_paid_status_completes_atomically_and_redirects_302() {
    let db = Db::connect_in_memory().await.unwrap();
    let player_id = seed_player(&db, "Notch").await;
    let state: SharedState = AppState::new(test_config("test", None), db).unwrap();

    sqlx::query(
        "INSERT INTO donations (player_id, method, amount, tx_ref, status) \
         VALUES (?1, 'PAYOS', 100000, '555666777', 'PENDING')",
    )
    .bind(player_id)
    .execute(&state.db.write)
    .await
    .unwrap();

    let mock_state = MockPayOsState {
        payment_status: Arc::new(Mutex::new("PAID".to_string())),
        payment_amount: Arc::new(Mutex::new(100_000)),
        ..Default::default()
    };
    let (mock_url, server_handle) = spawn_mock_payos_server(mock_state.clone()).await;
    let app = build_router(state.clone()).layer(Extension(PayOsBaseUrl(mock_url)));

    let resp = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/donate?lang=vi&orderCode=555666777&status=PAID&code=00")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(resp.status(), StatusCode::FOUND);
    let location = resp
        .headers()
        .get(header::LOCATION)
        .unwrap()
        .to_str()
        .unwrap();
    assert!(location.starts_with("http://localhost:3000/vi?"));
    assert!(location.contains("donate_status=success"));
    assert!(location.contains("orderCode=555666777"));
    assert!(location.ends_with("#donate"));

    // Subsequent webhook for the same orderCode must NOT double-credit
    let mut data_map = Map::new();
    data_map.insert("orderCode".into(), json!(555_666_777_i64));
    data_map.insert("amount".into(), json!(100_000));
    let sig = sign_payos_data_map(TEST_CHECKSUM, &data_map);
    let (wh_status, _) = response_json(
        app.clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/api/donations/payos/webhook")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        json!({
                            "code": "00",
                            "success": true,
                            "data": data_map,
                            "signature": sig
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap(),
    )
    .await;
    assert_eq!(wh_status, StatusCode::OK);

    let total_donated: i64 = sqlx::query_scalar("SELECT total_donated FROM players WHERE id = ?1")
        .bind(player_id)
        .fetch_one(&state.db.read)
        .await
        .unwrap();
    assert_eq!(total_donated, 100_000);

    // Cancel flow redirects with donate_status=cancel
    *mock_state.payment_status.lock().await = "CANCELLED".to_string();
    let cancel_resp = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/donate?lang=en&orderCode=888888&cancel=true&status=CANCELLED")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(cancel_resp.status(), StatusCode::FOUND);
    let cancel_loc = cancel_resp
        .headers()
        .get(header::LOCATION)
        .unwrap()
        .to_str()
        .unwrap();
    assert!(cancel_loc.starts_with("http://localhost:3000/en?"));
    assert!(cancel_loc.contains("donate_status=cancel"));
    assert!(cancel_loc.ends_with("#donate"));

    server_handle.abort();
}

#[tokio::test]
async fn rcon_username_guard_skips_unsafe_usernames_in_outbox() {
    let db = Db::connect_in_memory().await.unwrap();
    let player_id = sqlx::query_scalar::<_, i64>(
        "INSERT INTO players (username, kind, password_hash, total_donated) \
         VALUES ('bad.user', 'discord', NULL, 0) RETURNING id",
    )
    .fetch_one(&db.write)
    .await
    .unwrap();
    let state: SharedState = AppState::new(test_config("test", None), db).unwrap();

    sqlx::query(
        "INSERT INTO donations (player_id, method, amount, tx_ref, status) \
         VALUES (?1, 'PAYOS', 20000, '777111222', 'PENDING')",
    )
    .bind(player_id)
    .execute(&state.db.write)
    .await
    .unwrap();

    let mut data_map = Map::new();
    data_map.insert("orderCode".into(), json!(777_111_222_i64));
    data_map.insert("amount".into(), json!(20_000));
    let sig = sign_payos_data_map(TEST_CHECKSUM, &data_map);

    let app = build_router(state.clone());
    let (status, _) = response_json(
        app.oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/donations/payos/webhook")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({ "code": "00", "success": true, "data": data_map, "signature": sig })
                        .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::OK);

    let rcon_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM outbox WHERE kind = 'rcon'")
        .fetch_one(&state.db.read)
        .await
        .unwrap();
    assert_eq!(rcon_count, 0);

    let webhook_count: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM outbox WHERE kind = 'discord_webhook'")
            .fetch_one(&state.db.read)
            .await
            .unwrap();
    assert_eq!(webhook_count, 1);
}

#[tokio::test]
async fn test_payos_signature_works_in_dev_and_returns_403_in_production() {
    let db_dev = Db::connect_in_memory().await.unwrap();
    let player_id = seed_player(&db_dev, "DevUser").await;
    sqlx::query(
        "INSERT INTO donations (player_id, method, amount, tx_ref, status) \
         VALUES (?1, 'PAYOS', 30000, '424242', 'PENDING')",
    )
    .bind(player_id)
    .execute(&db_dev.write)
    .await
    .unwrap();

    let dev_app = build_router(AppState::new(test_config("development", None), db_dev).unwrap());
    let (status, sig_body) = response_json(
        dev_app
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/api/test/payos-signature")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        r#"{"orderCode":424242,"amount":30000,"description":"Test helper"}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(sig_body["code"], "00");

    // Generated payload must be accepted by webhook
    let (wh_status, wh_body) = response_json(
        dev_app
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/api/donations/payos/webhook")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(sig_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap(),
    )
    .await;
    assert_eq!(wh_status, StatusCode::OK);
    assert_eq!(wh_body["success"], true);

    // Production returns 403
    let db_prod = Db::connect_in_memory().await.unwrap();
    let prod_app = build_router(AppState::new(test_config("production", None), db_prod).unwrap());
    let (prod_status, prod_body) = response_json(
        prod_app
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/api/test/payos-signature")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(r#"{"orderCode":1,"amount":2000}"#))
                    .unwrap(),
            )
            .await
            .unwrap(),
    )
    .await;
    assert_eq!(prod_status, StatusCode::FORBIDDEN);
    assert_eq!(
        prod_body["error"],
        "Only available in development environment"
    );
}
