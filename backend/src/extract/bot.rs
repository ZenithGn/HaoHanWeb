use axum::extract::FromRequestParts;
use axum::http::request::Parts;

use crate::error::AppError;
use crate::extract::{constant_time_eq, extract_authorization_token};
use crate::state::SharedState;

#[derive(Debug, Clone, Copy)]
pub struct BotToken;

impl FromRequestParts<SharedState> for BotToken {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &SharedState,
    ) -> Result<Self, Self::Rejection> {
        let provided = extract_authorization_token(&parts.headers).unwrap_or("");

        if constant_time_eq(provided, &state.cfg.game_server_token) {
            Ok(Self)
        } else {
            Err(AppError::UnauthorizedMsg(
                "Unauthorized Bot/Server".to_string(),
            ))
        }
    }
}
