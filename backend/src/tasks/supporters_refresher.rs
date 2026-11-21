use std::time::Duration;

use tokio::time::MissedTickBehavior;

use crate::services::supporters::{rebuild_supporters_snapshot, refresh_discord_supporters_cache};
use crate::state::SharedState;

pub async fn run_supporters_refresher(state: SharedState) {
    let interval_secs = state.cfg.discord_donation_refresh_interval_seconds.max(1);
    let mut ticker = tokio::time::interval(Duration::from_secs(interval_secs));
    ticker.set_missed_tick_behavior(MissedTickBehavior::Skip);

    loop {
        tokio::select! {
            _ = state.shutdown.cancelled() => {
                tracing::info!("supporters_refresher shutting down");
                break;
            }
            _ = ticker.tick() => {
                let _ = refresh_discord_supporters_cache(&state, None).await;
                if let Err(err) = rebuild_supporters_snapshot(&state, None, true).await {
                    tracing::warn!(error = %err, "Failed to rebuild supporters snapshot after scheduled refresh");
                }
            }
        }
    }
}
