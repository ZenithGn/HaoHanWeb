use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

use crate::db::donations::{
    ImmediateTx, increment_player_donated_in_tx, mark_pending_success_in_tx,
};
use crate::db::outbox::{
    KIND_DISCORD_WEBHOOK, KIND_RCON, build_donation_webhook_payload, enqueue_in_tx,
    is_valid_rcon_username,
};
use crate::error::AppError;
use crate::state::AppState;

static ORDER_CODE_SEQ: AtomicU64 = AtomicU64::new(0);

/// Generates a collision-safe positive PayOS `orderCode` strictly below JavaScript `2^53 - 1`.
pub fn next_order_code() -> i64 {
    let unix_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64;
    let seq = (ORDER_CODE_SEQ.fetch_add(1, Ordering::Relaxed) % 1000) as i64;
    unix_ms.saturating_mul(1000).saturating_add(seq)
}

/// Atomically completes a pending PayOS donation inside a single `BEGIN IMMEDIATE` transaction,
/// incrementing `players.total_donated` and enqueueing RCON + Discord webhook outbox items.
/// Returns `Ok(true)` if this caller transitioned `PENDING -> SUCCESS`, or `Ok(false)` if already
/// finalized or missing.
pub async fn complete_payos_donation(
    state: &AppState,
    tx_ref: &str,
    paid_amount: Option<i64>,
) -> Result<bool, AppError> {
    let tx = ImmediateTx::begin(&state.db.write)
        .await
        .map_err(anyhow::Error::from)?;
    let mut tx = tx;

    let result: Result<bool, AppError> = async {
        let Some(completed) = mark_pending_success_in_tx(tx.conn(), tx_ref, paid_amount).await?
        else {
            return Ok(false);
        };

        let username =
            increment_player_donated_in_tx(tx.conn(), completed.player_id, completed.amount)
                .await?;

        if is_valid_rcon_username(&username) {
            let vip_cmd = format!("lp user {username} parent add vip");
            let say_cmd = format!(
                "say {username} da donate thanh cong {} VND! Cam on ban!",
                completed.amount
            );
            enqueue_in_tx(tx.conn(), KIND_RCON, &vip_cmd).await?;
            enqueue_in_tx(tx.conn(), KIND_RCON, &say_cmd).await?;
        } else {
            tracing::warn!(
                player_id = completed.player_id,
                username = %username,
                "Skipping RCON outbox commands due to unsafe Minecraft username characters"
            );
        }

        let webhook_json = build_donation_webhook_payload(
            &username,
            completed.amount,
            &completed.method,
            completed.message.as_deref(),
        );
        enqueue_in_tx(tx.conn(), KIND_DISCORD_WEBHOOK, &webhook_json).await?;

        Ok(true)
    }
    .await;

    match result {
        Ok(transitioned) => {
            tx.commit().await.map_err(anyhow::Error::from)?;
            if transitioned {
                state.outbox_wake.notify_one();
                state.invalidate.notify_one();
            }
            Ok(transitioned)
        }
        Err(err) => {
            let _ = tx.rollback().await;
            Err(err)
        }
    }
}
