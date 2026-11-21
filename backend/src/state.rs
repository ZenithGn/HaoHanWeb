use std::sync::Arc;
use std::time::Duration;

use arc_swap::ArcSwap;
use bytes::Bytes;
use moka::future::Cache;
use serde::{Deserialize, Serialize};
use tokio::sync::Notify;
use tokio_util::sync::CancellationToken;

use crate::config::Config;
use crate::db::Db;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LinkCodeData {
    pub username: String,
    pub uuid: String,
}

pub type SharedState = Arc<AppState>;

pub struct AppState {
    pub cfg: Config,
    pub db: Db,
    pub http: reqwest::Client,
    pub link_codes: Cache<String, LinkCodeData>,
    pub status: ArcSwap<Bytes>,
    pub leaderboards: ArcSwap<Bytes>,
    pub supporters: ArcSwap<Bytes>,
    pub invalidate: Notify,
    pub outbox_wake: Notify,
    pub shutdown: CancellationToken,
}

impl AppState {
    pub fn new(cfg: Config, db: Db) -> anyhow::Result<SharedState> {
        let http = reqwest::Client::builder()
            .pool_idle_timeout(Duration::from_secs(90))
            .tcp_nodelay(true)
            .connect_timeout(Duration::from_secs(5))
            .timeout(Duration::from_secs(10))
            .gzip(true)
            .build()?;

        let link_codes = Cache::builder()
            .max_capacity(10_000)
            .time_to_live(Duration::from_secs(300))
            .build();

        let default_status = Bytes::from_static(
            br#"{"online":false,"online_players":0,"max_players":20,"motd":"Server is offline","version":"Unknown","players_list":[],"tps":0.0}"#,
        );
        let default_leaderboards = Bytes::from_static(br#"{"top_donors":[],"top_playtime":[]}"#);
        let default_supporters = Bytes::from_static(
            br#"{"supporters":[],"pages":[],"source":"manual+database","updated_at":"","cache":"fallback"}"#,
        );

        Ok(Arc::new(Self {
            cfg,
            db,
            http,
            link_codes,
            status: ArcSwap::from_pointee(default_status),
            leaderboards: ArcSwap::from_pointee(default_leaderboards),
            supporters: ArcSwap::from_pointee(default_supporters),
            invalidate: Notify::new(),
            outbox_wake: Notify::new(),
            shutdown: CancellationToken::new(),
        }))
    }
}
