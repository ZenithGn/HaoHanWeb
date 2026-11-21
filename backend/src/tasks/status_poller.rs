use std::time::Duration;

use bytes::Bytes;
use tokio::time::{Instant, MissedTickBehavior};

use crate::integrations::minecraft_ping::{MinecraftServerStatus, ping_server};
use crate::state::SharedState;

const STATUS_LOG_INTERVAL: Duration = Duration::from_secs(600);

pub async fn poll_status_once(state: &SharedState) {
    let status = ping_server(&state.cfg.minecraft_host, state.cfg.minecraft_port).await;
    if let Ok(json_bytes) = serde_json::to_vec(&status) {
        state.status.store(Bytes::from(json_bytes).into());
    }
}

pub async fn log_status_snapshot_once(state: &SharedState) -> anyhow::Result<()> {
    let raw = state.status.load_full();
    let snapshot: MinecraftServerStatus = serde_json::from_slice(&raw)?;
    let online_players = snapshot.online_players.max(0);
    let max_players = snapshot.max_players.max(0);
    let tps = snapshot.tps.clamp(0.0, 20.0);

    sqlx::query(
        "INSERT INTO server_status_logs (online_players, max_players, tps) VALUES (?1, ?2, ?3)",
    )
    .bind(online_players)
    .bind(max_players)
    .bind(tps)
    .execute(&state.db.write)
    .await?;

    Ok(())
}

pub async fn run_status_poller(state: SharedState) {
    let poll_secs = state.cfg.status_poll_interval_seconds.max(1);
    let mut ticker = tokio::time::interval(Duration::from_secs(poll_secs));
    ticker.set_missed_tick_behavior(MissedTickBehavior::Skip);

    loop {
        tokio::select! {
            _ = state.shutdown.cancelled() => {
                tracing::info!("status_poller shutting down");
                break;
            }
            _ = ticker.tick() => {
                poll_status_once(&state).await;
            }
        }
    }
}

pub async fn run_status_logger(state: SharedState) {
    let start = Instant::now() + STATUS_LOG_INTERVAL;
    let mut ticker = tokio::time::interval_at(start, STATUS_LOG_INTERVAL);
    ticker.set_missed_tick_behavior(MissedTickBehavior::Skip);

    loop {
        tokio::select! {
            _ = state.shutdown.cancelled() => {
                tracing::info!("status_logger shutting down");
                break;
            }
            _ = ticker.tick() => {
                if let Err(err) = log_status_snapshot_once(&state).await {
                    tracing::warn!(error = %err, "Failed to log server status snapshot");
                }
            }
        }
    }
}
