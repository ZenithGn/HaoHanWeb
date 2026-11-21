use axum::extract::FromRequestParts;
use axum::http::request::Parts;

use crate::error::AppError;
use crate::extract::constant_time_eq;
use crate::state::SharedState;

pub const GAME_SERVER_TOKEN_HEADER: &str = "x-game-server-token";

#[derive(Debug, Clone, Copy)]
pub struct GameServerToken;

impl FromRequestParts<SharedState> for GameServerToken {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &SharedState,
    ) -> Result<Self, Self::Rejection> {
        let provided = parts
            .headers
            .get(GAME_SERVER_TOKEN_HEADER)
            .and_then(|v| v.to_str().ok())
            .map(str::trim)
            .unwrap_or("");

        if constant_time_eq(provided, &state.cfg.game_server_token) {
            Ok(Self)
        } else {
            Err(AppError::UnauthorizedMsg(
                "Unauthorized Game Server".to_string(),
            ))
        }
    }
}
