use std::collections::VecDeque;
use std::net::{IpAddr, SocketAddr};
use std::sync::Arc;
use std::time::{Duration, Instant};

use axum::extract::{ConnectInfo, Request, State};
use axum::http::HeaderMap;
use axum::http::HeaderValue;
use axum::http::header::RETRY_AFTER;
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use moka::future::Cache;
use tokio::sync::Mutex;

use crate::error::AppError;

#[derive(Clone)]
pub struct RateLimiter {
    enabled: bool,
    max_requests: u32,
    window: Duration,
    buckets: Cache<String, Arc<Mutex<VecDeque<Instant>>>>,
}

impl RateLimiter {
    pub fn new(enabled: bool, max_requests: u32, window: Duration) -> Self {
        let buckets = Cache::builder()
            .max_capacity(50_000)
            .time_to_idle(window.saturating_mul(2).max(Duration::from_secs(60)))
            .build();

        Self {
            enabled,
            max_requests: max_requests.max(1),
            window,
            buckets,
        }
    }

    pub fn is_enabled(&self) -> bool {
        self.enabled
    }

    pub async fn check(&self, key: &str) -> Result<(), u64> {
        if !self.enabled {
            return Ok(());
        }

        let bucket = self
            .buckets
            .get_with(key.to_string(), async {
                Arc::new(Mutex::new(VecDeque::new()))
            })
            .await;

        let now = Instant::now();
        let mut guard = bucket.lock().await;

        while let Some(&oldest) = guard.front() {
            if now.duration_since(oldest) >= self.window {
                guard.pop_front();
            } else {
                break;
            }
        }

        if guard.len() >= self.max_requests as usize {
            let retry_after = guard
                .front()
                .map(|&oldest| {
                    (oldest + self.window)
                        .saturating_duration_since(now)
                        .as_secs()
                        .max(1)
                })
                .unwrap_or(1);
            return Err(retry_after);
        }

        guard.push_back(now);
        Ok(())
    }
}

pub fn extract_client_ip(headers: &HeaderMap, connect_info: Option<SocketAddr>) -> String {
    if let Some(xff) = headers.get("x-forwarded-for").and_then(|v| v.to_str().ok())
        && let Some(first) = xff.split(',').map(str::trim).find(|part| !part.is_empty())
    {
        if let Ok(ip) = first.parse::<IpAddr>() {
            return ip.to_string();
        }
        return first.to_string();
    }

    if let Some(xri) = headers.get("x-real-ip").and_then(|v| v.to_str().ok()) {
        let trimmed = xri.trim();
        if !trimmed.is_empty() {
            if let Ok(ip) = trimmed.parse::<IpAddr>() {
                return ip.to_string();
            }
            return trimmed.to_string();
        }
    }

    if let Some(addr) = connect_info {
        return addr.ip().to_string();
    }

    "unknown".to_string()
}

pub async fn rate_limit_middleware(
    State(limiter): State<RateLimiter>,
    req: Request,
    next: Next,
) -> Response {
    if !limiter.is_enabled() {
        return next.run(req).await;
    }

    let connect_info = req
        .extensions()
        .get::<ConnectInfo<SocketAddr>>()
        .map(|ci| ci.0);
    let client_ip = extract_client_ip(req.headers(), connect_info);

    match limiter.check(&client_ip).await {
        Ok(()) => next.run(req).await,
        Err(retry_after) => {
            let mut resp =
                AppError::TooManyRequests("Quá nhiều yêu cầu, vui lòng thử lại sau!".to_string())
                    .into_response();
            if let Ok(val) = HeaderValue::from_str(&retry_after.to_string()) {
                resp.headers_mut().insert(RETRY_AFTER, val);
            }
            resp
        }
    }
}
