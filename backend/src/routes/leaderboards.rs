use axum::Router;
use axum::extract::State;
use axum::http::header;
use axum::response::IntoResponse;
use axum::routing::get;
use bytes::Bytes;

use crate::state::SharedState;

pub fn router() -> Router<SharedState> {
    Router::new().route("/api/leaderboards", get(get_leaderboards))
}

pub async fn get_leaderboards(State(state): State<SharedState>) -> impl IntoResponse {
    let body = state.leaderboards.load_full();
    (
        [
            (header::CONTENT_TYPE, "application/json"),
            (header::CACHE_CONTROL, "public, max-age=15, s-maxage=30"),
        ],
        Bytes::clone(&body),
    )
}
