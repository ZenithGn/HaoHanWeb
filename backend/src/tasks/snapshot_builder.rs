use std::time::Duration;

use tokio::time::{Instant, MissedTickBehavior};

use crate::services::supporters::{rebuild_leaderboards_snapshot, rebuild_supporters_snapshot};
use crate::state::SharedState;

const DEBOUNCE_WINDOW: Duration = Duration::from_secs(2);
const FALLBACK_TTL: Duration = Duration::from_secs(60);

pub async fn rebuild_all_snapshots(state: &SharedState) {
    if let Err(err) = rebuild_leaderboards_snapshot(state).await {
        tracing::warn!(error = %err, "Failed to rebuild leaderboards snapshot");
    }
    if let Err(err) = rebuild_supporters_snapshot(state, None, true).await {
        tracing::warn!(error = %err, "Failed to rebuild supporters snapshot");
    }
}

pub async fn run_snapshot_builder(state: SharedState) {
    rebuild_all_snapshots(&state).await;

    let mut fallback = tokio::time::interval_at(Instant::now() + FALLBACK_TTL, FALLBACK_TTL);
    fallback.set_missed_tick_behavior(MissedTickBehavior::Skip);

    loop {
        tokio::select! {
            _ = state.shutdown.cancelled() => {
                tracing::info!("snapshot_builder shutting down");
                break;
            }
            _ = state.invalidate.notified() => {
                // Debounce bursts of invalidations (e.g. donation + playtime sync) for 2 seconds.
                let debounce_deadline = Instant::now() + DEBOUNCE_WINDOW;
                loop {
                    tokio::select! {
                        _ = state.shutdown.cancelled() => {
                            tracing::info!("snapshot_builder shutting down during debounce");
                            return;
                        }
                        _ = tokio::time::sleep_until(debounce_deadline) => {
                            break;
                        }
                        _ = state.invalidate.notified() => {
                            // Coalesce additional invalidations inside the 2s window.
                        }
                    }
                }
                rebuild_all_snapshots(&state).await;
                fallback.reset();
            }
            _ = fallback.tick() => {
                rebuild_all_snapshots(&state).await;
            }
        }
    }
}
