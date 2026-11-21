use axum::Router;
use axum::extract::{Extension, Query, State};
use axum::http::{StatusCode, header};
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use bytes::Bytes;
use serde::Deserialize;

use crate::error::AppError;
use crate::services::supporters::{
    DiscordApiBaseUrl, force_refresh_supporters, rebuild_supporters_snapshot,
};
use crate::state::SharedState;

pub fn router() -> Router<SharedState> {
    Router::new().route("/api/supporters/donations", get(get_supporters_donations))
}

#[derive(Debug, Deserialize, Default)]
pub struct SupportersQuery {
    pub refresh: Option<String>,
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

fn is_uninitialized_supporters_snapshot(bytes: &[u8]) -> bool {
    const MARKER: &[u8] = br#""updated_at":"""#;
    bytes.windows(MARKER.len()).any(|window| window == MARKER)
}

pub async fn get_supporters_donations(
    State(state): State<SharedState>,
    discord_override: Option<Extension<DiscordApiBaseUrl>>,
    Query(query): Query<SupportersQuery>,
) -> Result<Response, AppError> {
    let api_base = discord_override.as_ref().map(|ext| ext.0.0.as_str());

    if is_truthy(query.refresh.as_deref()) {
        match force_refresh_supporters(&state, api_base).await {
            Ok(bytes) => {
                return Ok((
                    StatusCode::OK,
                    [
                        (header::CONTENT_TYPE, "application/json"),
                        (header::CACHE_CONTROL, "no-store"),
                    ],
                    bytes,
                )
                    .into_response());
            }
            Err(err) => {
                let mut resp = err.into_response();
                resp.headers_mut().insert(
                    header::CACHE_CONTROL,
                    axum::http::HeaderValue::from_static("no-store"),
                );
                return Ok(resp);
            }
        }
    }

    let snapshot = state.supporters.load_full();
    let body = if is_uninitialized_supporters_snapshot(snapshot.as_ref()) {
        rebuild_supporters_snapshot(&state, api_base, api_base.is_some()).await?
    } else {
        Bytes::clone(&snapshot)
    };

    Ok((
        StatusCode::OK,
        [
            (header::CONTENT_TYPE, "application/json"),
            (header::CACHE_CONTROL, "public, max-age=15, s-maxage=30"),
        ],
        body,
    )
        .into_response())
}
