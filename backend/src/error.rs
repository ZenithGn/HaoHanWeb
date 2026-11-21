use axum::Json;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde_json::json;

#[derive(thiserror::Error, Debug)]
pub enum AppError {
    #[error("{0}")]
    BadRequest(String),
    #[error("Unauthorized")]
    Unauthorized,
    #[error("{0}")]
    UnauthorizedMsg(String),
    #[error("{0}")]
    Forbidden(String),
    #[error("{0}")]
    NotFound(String),
    #[error("{0}")]
    Conflict(String),
    #[error("{0}")]
    Unprocessable(String),
    #[error("{0}")]
    TooManyRequests(String),
    #[error(transparent)]
    Internal(#[from] anyhow::Error),
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        tracing::error!(error = %err, "Database query failed");
        Self::Internal(err.into())
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        match self {
            Self::BadRequest(msg) => {
                (StatusCode::BAD_REQUEST, Json(json!({ "error": msg }))).into_response()
            }
            Self::Unauthorized => (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "error": "Unauthorized" })),
            )
                .into_response(),
            Self::UnauthorizedMsg(msg) => {
                (StatusCode::UNAUTHORIZED, Json(json!({ "error": msg }))).into_response()
            }
            Self::Forbidden(msg) => {
                (StatusCode::FORBIDDEN, Json(json!({ "error": msg }))).into_response()
            }
            Self::NotFound(msg) => {
                (StatusCode::NOT_FOUND, Json(json!({ "error": msg }))).into_response()
            }
            Self::Conflict(msg) => {
                (StatusCode::CONFLICT, Json(json!({ "error": msg }))).into_response()
            }
            Self::Unprocessable(msg) => (
                StatusCode::UNPROCESSABLE_ENTITY,
                Json(json!({ "error": msg })),
            )
                .into_response(),
            Self::TooManyRequests(msg) => {
                (StatusCode::TOO_MANY_REQUESTS, Json(json!({ "error": msg }))).into_response()
            }
            Self::Internal(err) => {
                tracing::error!(error = %err, "Internal server error");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({ "error": "Internal server error" })),
                )
                    .into_response()
            }
        }
    }
}
