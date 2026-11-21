pub mod auth_user;
pub mod bot;
pub mod game_server;

use axum::http::HeaderMap;
use axum::http::header::AUTHORIZATION;
use subtle::ConstantTimeEq;

pub use auth_user::{AuthUser, SessionClaims, authenticate_token};
pub use bot::BotToken;
pub use game_server::GameServerToken;

pub fn constant_time_eq(provided: &str, expected: &str) -> bool {
    if provided.is_empty() || expected.is_empty() {
        return false;
    }
    provided.as_bytes().ct_eq(expected.as_bytes()).into()
}

pub fn extract_authorization_token(headers: &HeaderMap) -> Option<&str> {
    let raw = headers.get(AUTHORIZATION)?.to_str().ok()?.trim();
    if raw.is_empty() {
        return None;
    }

    if raw
        .get(..6)
        .is_some_and(|prefix| prefix.eq_ignore_ascii_case("bearer"))
    {
        let rest = &raw[6..];
        if rest.is_empty() {
            return None;
        }
        if rest.starts_with(char::is_whitespace) {
            let token = rest.trim();
            return if token.is_empty() { None } else { Some(token) };
        }
    }

    raw.split_ascii_whitespace()
        .last()
        .filter(|tok| !tok.is_empty())
}
