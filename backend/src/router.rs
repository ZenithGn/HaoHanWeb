use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Duration;

use axum::Router;
use axum::extract::DefaultBodyLimit;
use axum::http::{HeaderValue, Method, Request, StatusCode};
use axum::routing::get;
use tower_http::compression::CompressionLayer;
use tower_http::cors::{AllowOrigin, Any, CorsLayer};
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::request_id::{
    MakeRequestId, PropagateRequestIdLayer, RequestId, SetRequestIdLayer,
};
use tower_http::timeout::TimeoutLayer;
use tower_http::trace::TraceLayer;

use crate::routes;
use crate::state::SharedState;

#[derive(Clone, Default)]
struct AtomicRequestId {
    counter: std::sync::Arc<AtomicU64>,
}

impl MakeRequestId for AtomicRequestId {
    fn make_request_id<B>(&mut self, _request: &Request<B>) -> Option<RequestId> {
        let seq = self.counter.fetch_add(1, Ordering::Relaxed) + 1;
        let value = HeaderValue::from_str(&format!("req-{seq}")).ok()?;
        Some(RequestId::new(value))
    }
}

pub fn build_router(state: SharedState) -> Router {
    let cfg = state.cfg.clone();
    let app = Router::new()
        .route("/up", get(routes::health::health_check))
        .merge(routes::auth::router(&cfg))
        .with_state(state);

    apply_http_layers(app, &cfg)
}

pub fn apply_http_layers(router: Router, cfg: &crate::config::Config) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(AllowOrigin::list(cfg.cors_header_values()))
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::PATCH,
            Method::DELETE,
            Method::OPTIONS,
            Method::HEAD,
        ])
        .allow_headers(Any);

    let body_limit = cfg.body_limit_bytes;
    let request_timeout = Duration::from_secs(cfg.request_timeout_secs);

    router
        .layer(CompressionLayer::new())
        .layer(DefaultBodyLimit::max(body_limit))
        .layer(RequestBodyLimitLayer::new(body_limit))
        .layer(TimeoutLayer::with_status_code(
            StatusCode::REQUEST_TIMEOUT,
            request_timeout,
        ))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .layer(PropagateRequestIdLayer::x_request_id())
        .layer(SetRequestIdLayer::x_request_id(AtomicRequestId::default()))
}
