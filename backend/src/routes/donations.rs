use axum::body::Bytes;
use axum::extract::{Extension, Query, State};
use axum::http::{HeaderMap, HeaderValue, StatusCode, header};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::Deserialize;
use serde_json::{Map, Value, json};
use time::OffsetDateTime;
use time::macros::format_description;
use url::form_urlencoded;

use crate::db::donations::{find_by_tx_ref, insert_pending_payos, mark_failed_if_pending};
use crate::domain::payos_crypto::{
    payos_transfer_description, sign_payos_data_map, verify_webhook_signature,
};
use crate::error::AppError;
use crate::extract::AuthUser;
use crate::integrations::payos::{PayOsBaseUrl, PayOsClient};
use crate::services::donations::{complete_payos_donation, next_order_code};
use crate::state::SharedState;

pub fn router() -> Router<SharedState> {
    Router::new()
        .route("/api/donate", post(legacy_mock_donate))
        .route("/api/donations/payos/create", post(payos_create))
        .route("/donate", get(payos_return))
        .route("/api/donations/payos/webhook", post(payos_webhook))
        .route("/api/test/payos-signature", post(test_payos_signature))
}

#[derive(Deserialize, Default)]
struct LegacyDonateRequest {
    name: Option<String>,
}

pub async fn legacy_mock_donate(body: Bytes) -> Result<impl IntoResponse, AppError> {
    let req: LegacyDonateRequest = if body.iter().all(|b| b.is_ascii_whitespace()) {
        LegacyDonateRequest::default()
    } else {
        serde_json::from_slice(&body)
            .map_err(|_| AppError::BadRequest("Dữ liệu JSON không hợp lệ!".to_string()))?
    };

    let name = req
        .name
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or("Unknown Player");

    Ok((
        StatusCode::OK,
        Json(json!({
            "success": true,
            "name": name,
            "message": format!("Cổng thanh toán thử nghiệm. Cảm ơn {name} đã ủng hộ!")
        })),
    ))
}

#[derive(Deserialize)]
pub struct PayOsCreateRequest {
    amount: Option<Value>,
    message: Option<String>,
    lang: Option<String>,
}

fn parse_i64_value(val: Option<&Value>) -> i64 {
    match val {
        Some(Value::Number(n)) => n
            .as_i64()
            .or_else(|| n.as_f64().map(|f| f as i64))
            .unwrap_or(0),
        Some(Value::String(s)) => s.trim().parse::<i64>().unwrap_or(0),
        _ => 0,
    }
}

fn sanitize_lang(raw: Option<&str>) -> String {
    let candidate = raw.map(str::trim).unwrap_or("");
    if !candidate.is_empty()
        && candidate.len() <= 16
        && candidate
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
    {
        candidate.to_string()
    } else {
        "vi".to_string()
    }
}

fn resolve_public_api_base(state: &SharedState, headers: &HeaderMap) -> String {
    if let Some(configured) = state
        .cfg
        .public_api_url
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        return configured.trim_end_matches('/').to_string();
    }

    let host = headers
        .get("x-forwarded-host")
        .or_else(|| headers.get(header::HOST))
        .and_then(|v| v.to_str().ok())
        .and_then(|raw| raw.split(',').next())
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or("localhost:3001");

    let proto = headers
        .get("x-forwarded-proto")
        .and_then(|v| v.to_str().ok())
        .and_then(|raw| raw.split(',').next())
        .map(str::trim)
        .filter(|s| matches!(s.to_ascii_lowercase().as_str(), "http" | "https"))
        .map(str::to_ascii_lowercase)
        .unwrap_or_else(|| {
            if state.cfg.is_production() {
                "https".to_string()
            } else {
                "http".to_string()
            }
        });

    format!("{proto}://{host}")
}

pub async fn payos_create(
    State(state): State<SharedState>,
    user: AuthUser,
    payos_override: Option<Extension<PayOsBaseUrl>>,
    headers: HeaderMap,
    Json(req): Json<PayOsCreateRequest>,
) -> Result<impl IntoResponse, AppError> {
    let amount = parse_i64_value(req.amount.as_ref());
    if amount < 2000 {
        return Err(AppError::BadRequest(
            "Số tiền ủng hộ tối thiểu là 2.000 VND.".to_string(),
        ));
    }

    let message = req
        .message
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(ToString::to_string);
    let lang = sanitize_lang(req.lang.as_deref());
    let order_code = next_order_code();

    let api_base = resolve_public_api_base(&state, &headers);
    let return_url = format!("{api_base}/donate?lang={lang}&orderCode={order_code}");
    let cancel_url = format!("{return_url}&cancel=true");
    let description = payos_transfer_description(order_code, &user.username);

    let payos = PayOsClient::from_state(&state, payos_override.as_ref().map(|e| e.0.0.as_str()));
    let res = payos
        .create_payment_link(
            order_code,
            amount,
            &description,
            &return_url,
            &cancel_url,
            &user.username,
        )
        .await;

    let is_ok = res
        .get("code")
        .is_some_and(|c| c.as_str() == Some("00") || c.as_i64() == Some(0));

    if is_ok {
        let data = res.get("data").and_then(Value::as_object);
        let checkout_url = data
            .and_then(|d| d.get("checkoutUrl"))
            .and_then(Value::as_str)
            .ok_or_else(|| {
                AppError::Unprocessable("Không thể tạo phiên ủng hộ: Thiếu checkoutUrl".to_string())
            })?;
        let qr_code = data
            .and_then(|d| d.get("qrCode"))
            .and_then(Value::as_str)
            .unwrap_or("");

        insert_pending_payos(
            &state.db.write,
            user.id,
            amount,
            &order_code.to_string(),
            message.as_deref(),
        )
        .await?;

        Ok((
            StatusCode::OK,
            Json(json!({
                "message": "Tạo liên kết thanh toán thành công!",
                "checkoutUrl": checkout_url,
                "qrCode": qr_code,
                "orderCode": order_code,
                "amount": amount
            })),
        ))
    } else {
        let desc = res
            .get("desc")
            .and_then(Value::as_str)
            .unwrap_or("PayOS request failed");
        Err(AppError::Unprocessable(format!(
            "Không thể tạo phiên ủng hộ: {desc}"
        )))
    }
}

#[derive(Deserialize, Default)]
pub struct DonateReturnQuery {
    #[serde(rename = "orderCode")]
    pub order_code: Option<String>,
    pub lang: Option<String>,
    pub status: Option<String>,
    pub code: Option<String>,
    pub id: Option<String>,
    pub cancel: Option<String>,
}

fn is_truthy(val: Option<&str>) -> bool {
    matches!(
        val.map(str::trim)
            .unwrap_or("")
            .to_ascii_lowercase()
            .as_str(),
        "1" | "true" | "yes" | "t" | "on"
    )
}

pub async fn payos_return(
    State(state): State<SharedState>,
    payos_override: Option<Extension<PayOsBaseUrl>>,
    Query(query): Query<DonateReturnQuery>,
) -> Result<Response, AppError> {
    let order_code = query.order_code.as_deref().map(str::trim).unwrap_or("");

    let mut payment_status = query.status.as_deref().unwrap_or("").trim().to_string();

    if !order_code.is_empty() {
        let donation = find_by_tx_ref(&state.db.read, order_code).await?;
        let payos =
            PayOsClient::from_state(&state, payos_override.as_ref().map(|e| e.0.0.as_str()));
        let payment = payos.get_payment_request(order_code).await;
        let payment_data = payment.get("data").and_then(Value::as_object);

        if let Some(remote_status) = payment_data
            .and_then(|d| d.get("status"))
            .and_then(Value::as_str)
            .map(str::trim)
            .filter(|s| !s.is_empty())
        {
            payment_status = remote_status.to_string();
        }

        if donation.as_ref().is_some_and(|d| d.status == "PENDING")
            && payment_status.eq_ignore_ascii_case("PAID")
        {
            let paid_amount = payment_data
                .and_then(|d| d.get("amount"))
                .map(|v| parse_i64_value(Some(v)))
                .filter(|&a| a > 0);
            complete_payos_donation(&state, order_code, paid_amount).await?;
        }
    }

    let raw_status = query.status.as_deref().map(str::trim).unwrap_or("");
    let donate_status =
        if is_truthy(query.cancel.as_deref()) || raw_status.eq_ignore_ascii_case("CANCELLED") {
            "cancel"
        } else if payment_status.eq_ignore_ascii_case("PAID")
            || raw_status.eq_ignore_ascii_case("PAID")
            || query.code.as_deref().map(str::trim) == Some("00")
        {
            "success"
        } else if !raw_status.is_empty() {
            raw_status
        } else {
            "pending"
        };

    let mut ser = form_urlencoded::Serializer::new(String::new());
    ser.append_pair("donate_status", donate_status);
    if let Some(ref s) = query.status {
        ser.append_pair("status", s);
    }
    if let Some(ref oc) = query.order_code {
        ser.append_pair("orderCode", oc);
    }
    if let Some(ref c) = query.code {
        ser.append_pair("code", c);
    }
    if let Some(ref id) = query.id {
        ser.append_pair("id", id);
    }
    if let Some(ref cancel) = query.cancel {
        ser.append_pair("cancel", cancel);
    }

    let lang = sanitize_lang(query.lang.as_deref());
    let frontend = state.cfg.primary_frontend_url().trim_end_matches('/');
    let redirect_target = format!("{frontend}/{lang}?{}#donate", ser.finish());
    let location = HeaderValue::from_str(&redirect_target)
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Invalid redirect URI: {e}")))?;

    Ok((StatusCode::FOUND, [(header::LOCATION, location)]).into_response())
}

fn value_to_tx_ref(val: Option<&Value>) -> String {
    match val {
        Some(Value::String(s)) => s.trim().to_string(),
        Some(Value::Number(n)) => n.to_string(),
        _ => String::new(),
    }
}

pub async fn payos_webhook(
    State(state): State<SharedState>,
    body: Bytes,
) -> Result<impl IntoResponse, AppError> {
    let payload: Value = serde_json::from_slice(&body)
        .map_err(|_| AppError::BadRequest("Invalid JSON payload".to_string()))?;

    let checksum_key = state
        .cfg
        .payos_checksum_key
        .as_deref()
        .filter(|s| !s.is_empty())
        .ok_or_else(|| AppError::UnauthorizedMsg("Invalid Webhook Signature".to_string()))?;

    if !verify_webhook_signature(checksum_key, &payload) {
        return Err(AppError::UnauthorizedMsg(
            "Invalid Webhook Signature".to_string(),
        ));
    }

    let data = payload.get("data").and_then(Value::as_object);
    let order_code = value_to_tx_ref(data.and_then(|d| d.get("orderCode")));
    let amount = parse_i64_value(data.and_then(|d| d.get("amount")));
    let paid_amount = (amount > 0).then_some(amount);

    let success = payload
        .get("success")
        .and_then(Value::as_bool)
        .unwrap_or(false)
        || payload
            .get("code")
            .is_some_and(|c| c.as_str() == Some("00") || c.as_i64() == Some(0));

    if !order_code.is_empty() {
        if success {
            let updated = complete_payos_donation(&state, &order_code, paid_amount).await?;
            if updated {
                tracing::info!(order_code = %order_code, "PayOS webhook completed donation");
            }
        } else {
            let failed = mark_failed_if_pending(&state.db.write, &order_code).await?;
            if failed {
                tracing::info!(order_code = %order_code, "PayOS webhook marked donation FAILED");
            }
        }
    }

    Ok((StatusCode::OK, Json(json!({ "success": true }))))
}

#[derive(Deserialize, Default)]
struct TestPayOsSigRequest {
    #[serde(rename = "orderCode")]
    order_code: Option<Value>,
    amount: Option<Value>,
    description: Option<String>,
}

pub async fn test_payos_signature(
    State(state): State<SharedState>,
    body: Bytes,
) -> Result<impl IntoResponse, AppError> {
    if state.cfg.is_production() {
        return Err(AppError::Forbidden(
            "Only available in development environment".to_string(),
        ));
    }

    let req: TestPayOsSigRequest = if body.iter().all(|b| b.is_ascii_whitespace()) {
        TestPayOsSigRequest::default()
    } else {
        serde_json::from_slice(&body)
            .map_err(|_| AppError::BadRequest("Invalid JSON payload".to_string()))?
    };

    let order_code = parse_i64_value(req.order_code.as_ref());
    let amount = parse_i64_value(req.amount.as_ref());
    let description = req
        .description
        .as_deref()
        .filter(|s| !s.is_empty())
        .unwrap_or("Nap game test");

    let dt_fmt = format_description!("[year]-[month]-[day] [hour]:[minute]:[second]");
    let tx_dt = OffsetDateTime::now_utc()
        .format(dt_fmt)
        .unwrap_or_else(|_| "2026-01-01 00:00:00".to_string());

    let mut data = Map::new();
    data.insert("orderCode".into(), json!(order_code));
    data.insert("amount".into(), json!(amount));
    data.insert("description".into(), json!(description));
    data.insert("accountNumber".into(), json!("123456789"));
    data.insert("reference".into(), json!("test_ref"));
    data.insert("transactionDateTime".into(), json!(tx_dt));

    let checksum_key = state
        .cfg
        .payos_checksum_key
        .as_deref()
        .unwrap_or("your_payos_checksum_key");
    let signature = sign_payos_data_map(checksum_key, &data);

    Ok((
        StatusCode::OK,
        Json(json!({
            "success": true,
            "code": "00",
            "data": data,
            "signature": signature
        })),
    ))
}
