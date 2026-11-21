use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use jsonwebtoken::{Algorithm, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use sqlx::Row;

use crate::error::AppError;
use crate::extract::extract_authorization_token;
use crate::state::{AppState, SharedState};

#[derive(Debug, Serialize, Deserialize)]
pub struct SessionClaims {
    pub user_id: i64,
    pub exp: usize,
    #[serde(default)]
    pub purpose: Option<String>,
}

#[derive(Debug, Clone)]
pub struct AuthUser {
    pub id: i64,
    pub username: String,
    pub email: Option<String>,
    pub uuid: Option<String>,
    pub kind: String,
    pub discord_id: Option<String>,
    pub avatar_url: Option<String>,
    pub total_donated: i64,
    pub role: String,
    pub is_linked: i64,
    pub play_time: i64,
}

impl FromRequestParts<SharedState> for AuthUser {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &SharedState,
    ) -> Result<Self, Self::Rejection> {
        let token = extract_authorization_token(&parts.headers).ok_or(AppError::Unauthorized)?;
        authenticate_token(state, token).await
    }
}

pub async fn authenticate_token(state: &AppState, token: &str) -> Result<AuthUser, AppError> {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.validate_exp = true;

    let decoded = jsonwebtoken::decode::<SessionClaims>(
        token,
        &DecodingKey::from_secret(state.cfg.jwt_secret.as_bytes()),
        &validation,
    )
    .map_err(|_| AppError::Unauthorized)?;

    if decoded.claims.purpose.is_some() {
        return Err(AppError::Unauthorized);
    }

    let row = sqlx::query(
        "SELECT id, username, email, uuid, kind, discord_id, avatar_url, total_donated, role, is_linked, play_time \
         FROM players WHERE id = ?1",
    )
    .bind(decoded.claims.user_id)
    .fetch_optional(&state.db.read)
    .await?
    .ok_or(AppError::Unauthorized)?;

    Ok(AuthUser {
        id: row.try_get("id")?,
        username: row.try_get("username")?,
        email: row.try_get("email")?,
        uuid: row.try_get("uuid")?,
        kind: row.try_get("kind")?,
        discord_id: row.try_get("discord_id")?,
        avatar_url: row.try_get("avatar_url")?,
        total_donated: row.try_get("total_donated")?,
        role: row.try_get("role")?,
        is_linked: row.try_get("is_linked")?,
        play_time: row.try_get("play_time")?,
    })
}
