use std::time::Duration;

use sqlx::SqlitePool;
use tokio::time::MissedTickBehavior;

use crate::state::SharedState;

const CLEANUP_INTERVAL: Duration = Duration::from_secs(24 * 3600);
const STALE_PENDING_DONATION_SECS: i64 = 2 * 24 * 3600;
const STALE_DONE_OUTBOX_SECS: i64 = 7 * 24 * 3600;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CleanupReport {
    pub deleted_pending_donations: u64,
    pub deleted_done_outbox: u64,
}

pub async fn run_cleanup_once(pool: &SqlitePool) -> anyhow::Result<CleanupReport> {
    let pending_res = sqlx::query(
        "DELETE FROM donations WHERE status = 'PENDING' AND created_at < unixepoch() - ?1",
    )
    .bind(STALE_PENDING_DONATION_SECS)
    .execute(pool)
    .await?;

    let outbox_res =
        sqlx::query("DELETE FROM outbox WHERE status = 'DONE' AND created_at < unixepoch() - ?1")
            .bind(STALE_DONE_OUTBOX_SECS)
            .execute(pool)
            .await?;

    sqlx::query("PRAGMA optimize").execute(pool).await?;

    let report = CleanupReport {
        deleted_pending_donations: pending_res.rows_affected(),
        deleted_done_outbox: outbox_res.rows_affected(),
    };

    tracing::info!(
        deleted_pending_donations = report.deleted_pending_donations,
        deleted_done_outbox = report.deleted_done_outbox,
        "Database cleanup and PRAGMA optimize completed"
    );

    Ok(report)
}

pub async fn run_cleanup_loop(state: SharedState) {
    let mut ticker = tokio::time::interval(CLEANUP_INTERVAL);
    ticker.set_missed_tick_behavior(MissedTickBehavior::Skip);

    loop {
        tokio::select! {
            _ = state.shutdown.cancelled() => {
                tracing::info!("cleanup task shutting down");
                break;
            }
            _ = ticker.tick() => {
                if let Err(err) = run_cleanup_once(&state.db.write).await {
                    tracing::error!(error = %err, "Periodic cleanup failed");
                }
            }
        }
    }
}
