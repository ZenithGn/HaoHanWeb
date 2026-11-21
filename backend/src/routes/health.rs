use axum::Json;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use serde_json::json;

pub async fn health_check() -> impl IntoResponse {
    (StatusCode::OK, Json(json!({ "status": "ok" })))
}
