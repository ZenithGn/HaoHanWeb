use std::time::{SystemTime, UNIX_EPOCH};

use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

pub use crate::extract::auth_user::SessionClaims;

pub const SESSION_TTL_SECS: usize = 24 * 3600;
pub const DISCORD_STATE_TTL_SECS: usize = 10 * 60;
pub const PURPOSE_DISCORD_LINK: &str = "discord_link";
pub const PURPOSE_DISCORD_LOGIN: &str = "discord_login";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DiscordStateClaims {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_id: Option<i64>,
    pub purpose: String,
    pub exp: usize,
}

fn current_unix_secs() -> usize {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as usize)
        .unwrap_or(0)
}

/// Signs a 24-hour HS256 session JWT matching `extract::auth_user::SessionClaims`.
pub fn encode_session_token(secret: &str, user_id: i64) -> anyhow::Result<String> {
    encode_session_token_with_exp(secret, user_id, current_unix_secs() + SESSION_TTL_SECS)
}

/// Signs an HS256 session JWT with an explicit expiration timestamp.
pub fn encode_session_token_with_exp(
    secret: &str,
    user_id: i64,
    exp: usize,
) -> anyhow::Result<String> {
    let claims = SessionClaims {
        user_id,
        exp,
        purpose: None,
    };
    jsonwebtoken::encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| anyhow::anyhow!("Failed to encode session JWT: {e}"))
}

/// Decodes and validates an HS256 session JWT, rejecting OAuth state tokens (`purpose` set).
pub fn decode_session_token(secret: &str, token: &str) -> Option<SessionClaims> {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.validate_exp = true;
    let decoded = jsonwebtoken::decode::<SessionClaims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )
    .ok()?;
    if decoded.claims.purpose.is_some() {
        return None;
    }
    Some(decoded.claims)
}

/// Signs a 10-minute Discord OAuth state JWT for linking an existing user.
pub fn encode_discord_link_state(secret: &str, user_id: i64) -> anyhow::Result<String> {
    encode_discord_state_with_exp(
        secret,
        Some(user_id),
        PURPOSE_DISCORD_LINK,
        current_unix_secs() + DISCORD_STATE_TTL_SECS,
    )
}

/// Signs a 10-minute Discord OAuth state JWT for direct Discord login.
pub fn encode_discord_login_state(secret: &str) -> anyhow::Result<String> {
    encode_discord_state_with_exp(
        secret,
        None,
        PURPOSE_DISCORD_LOGIN,
        current_unix_secs() + DISCORD_STATE_TTL_SECS,
    )
}

/// Signs an HS256 Discord OAuth state JWT with explicit fields.
pub fn encode_discord_state_with_exp(
    secret: &str,
    user_id: Option<i64>,
    purpose: &str,
    exp: usize,
) -> anyhow::Result<String> {
    let claims = DiscordStateClaims {
        user_id,
        purpose: purpose.to_string(),
        exp,
    };
    jsonwebtoken::encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| anyhow::anyhow!("Failed to encode Discord state JWT: {e}"))
}

/// Decodes and validates an HS256 Discord OAuth state JWT, ensuring `purpose` matches `expected_purpose`.
pub fn decode_discord_state(
    secret: &str,
    token: &str,
    expected_purpose: &str,
) -> Option<DiscordStateClaims> {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.validate_exp = true;
    let decoded = jsonwebtoken::decode::<DiscordStateClaims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )
    .ok()?;
    if decoded.claims.purpose != expected_purpose {
        return None;
    }
    Some(decoded.claims)
}
