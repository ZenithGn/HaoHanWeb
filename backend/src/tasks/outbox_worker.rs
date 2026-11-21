use std::time::{Duration, SystemTime, UNIX_EPOCH};

use sqlx::Row;

use crate::db::outbox::{KIND_DISCORD_WEBHOOK, KIND_RCON, is_valid_rcon_username};
use crate::integrations::rcon::{RconClient, RconError};
use crate::state::{AppState, SharedState};

const POLL_INTERVAL: Duration = Duration::from_secs(5);
const DEAD_LETTER_AGE_SECS: i64 = 24 * 3600;

fn now_unix_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}

/// Exponential backoff delays (5s, 30s, 2m, 10m, 1h).
pub fn next_backoff_secs(attempts_after_failure: i64) -> i64 {
    match attempts_after_failure {
        1 => 5,
        2 => 30,
        3 => 120,
        4 => 600,
        _ => 3600,
    }
}

/// Validates that an RCON command queued in `outbox` contains no control characters
/// and only targets a safe `[A-Za-z0-9_]` Minecraft username.
pub fn validate_rcon_outbox_command(payload: &str) -> Result<(), &'static str> {
    if payload.chars().any(char::is_control) {
        return Err("RCON command contains control characters");
    }

    if let Some(rest) = payload.strip_prefix("lp user ") {
        let mut parts = rest.split(' ');
        let username = parts.next().unwrap_or("");
        let tail = parts.collect::<Vec<_>>().join(" ");
        if is_valid_rcon_username(username) && tail == "parent add vip" {
            return Ok(());
        }
        return Err("Unsafe or malformed LuckPerms RCON command");
    }

    if let Some(rest) = payload.strip_prefix("say ") {
        let username = rest.split(' ').next().unwrap_or("");
        if is_valid_rcon_username(username) {
            return Ok(());
        }
        return Err("Unsafe Minecraft username in RCON say command");
    }

    Err("Unrecognized RCON command template")
}

#[derive(Debug)]
struct OutboxRow {
    id: i64,
    kind: String,
    payload: String,
    attempts: i64,
    created_at: i64,
}

async fn mark_outbox_done(state: &AppState, id: i64, new_attempts: i64) -> anyhow::Result<()> {
    sqlx::query(
        "UPDATE outbox SET status = 'DONE', attempts = ?1, last_error = NULL WHERE id = ?2",
    )
    .bind(new_attempts)
    .bind(id)
    .execute(&state.db.write)
    .await?;
    Ok(())
}

async fn mark_outbox_dead(
    state: &AppState,
    id: i64,
    new_attempts: i64,
    err: &str,
) -> anyhow::Result<()> {
    sqlx::query("UPDATE outbox SET status = 'DEAD', attempts = ?1, last_error = ?2 WHERE id = ?3")
        .bind(new_attempts)
        .bind(err)
        .bind(id)
        .execute(&state.db.write)
        .await?;
    Ok(())
}

async fn mark_outbox_retry_or_dead(
    state: &AppState,
    row: &OutboxRow,
    now: i64,
    err: &str,
) -> anyhow::Result<()> {
    let new_attempts = row.attempts + 1;
    let age_secs = now.saturating_sub(row.created_at);

    if age_secs >= DEAD_LETTER_AGE_SECS {
        tracing::warn!(
            outbox_id = row.id,
            kind = %row.kind,
            attempts = new_attempts,
            error = %err,
            "Outbox item exceeded 24h TTL, marking DEAD"
        );
        mark_outbox_dead(state, row.id, new_attempts, err).await
    } else {
        let delay = next_backoff_secs(new_attempts);
        let next_attempt_at = now.saturating_add(delay);
        tracing::warn!(
            outbox_id = row.id,
            kind = %row.kind,
            attempts = new_attempts,
            retry_in_secs = delay,
            error = %err,
            "Outbox delivery failed; scheduled retry"
        );
        sqlx::query(
            "UPDATE outbox SET attempts = ?1, next_attempt_at = ?2, last_error = ?3 WHERE id = ?4",
        )
        .bind(new_attempts)
        .bind(next_attempt_at)
        .bind(err)
        .bind(row.id)
        .execute(&state.db.write)
        .await?;
        Ok(())
    }
}

async fn send_discord_webhook(
    state: &AppState,
    webhook_url: &str,
    payload: &str,
) -> Result<(), String> {
    let body: serde_json::Value = serde_json::from_str(payload)
        .map_err(|e| format!("Invalid discord webhook JSON payload: {e}"))?;

    let resp = state
        .http
        .post(webhook_url)
        .json(&body)
        .timeout(Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| format!("Discord webhook request error: {e}"))?;

    if resp.status().is_success() {
        Ok(())
    } else {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        Err(format!("Discord webhook HTTP {status}: {text}"))
    }
}

/// Processes all currently due `PENDING` outbox entries once.
pub async fn process_due_outbox_once(
    state: &AppState,
    rcon: &mut RconClient,
    webhook_url_override: Option<&str>,
) -> anyhow::Result<usize> {
    let now = now_unix_secs();
    let rows = sqlx::query(
        "SELECT id, kind, payload, attempts, created_at \
         FROM outbox \
         WHERE status = 'PENDING' AND next_attempt_at <= ?1 \
         ORDER BY id ASC \
         LIMIT 50",
    )
    .bind(now)
    .fetch_all(&state.db.read)
    .await?;

    let mut processed = 0usize;
    let webhook_url = webhook_url_override
        .or(state.cfg.discord_webhook_url.as_deref())
        .map(str::trim)
        .filter(|s| !s.is_empty());

    for raw in rows {
        let item = OutboxRow {
            id: raw.try_get("id")?,
            kind: raw.try_get("kind")?,
            payload: raw.try_get("payload")?,
            attempts: raw.try_get("attempts")?,
            created_at: raw.try_get("created_at")?,
        };

        let attempt_now = now_unix_secs();
        match item.kind.as_str() {
            KIND_RCON => {
                if let Err(guard_err) = validate_rcon_outbox_command(&item.payload) {
                    tracing::error!(
                        outbox_id = item.id,
                        error = %guard_err,
                        "Rejecting unsafe RCON command in outbox"
                    );
                    mark_outbox_dead(state, item.id, item.attempts + 1, guard_err).await?;
                    processed += 1;
                    continue;
                }

                if !rcon.is_configured() {
                    tracing::debug!(
                        outbox_id = item.id,
                        "RCON password not configured; marking outbox item DONE"
                    );
                    mark_outbox_done(state, item.id, item.attempts + 1).await?;
                    processed += 1;
                    continue;
                }

                match rcon.execute(&item.payload).await {
                    Ok(_) => {
                        mark_outbox_done(state, item.id, item.attempts + 1).await?;
                    }
                    Err(RconError::NotConfigured) => {
                        mark_outbox_done(state, item.id, item.attempts + 1).await?;
                    }
                    Err(err) => {
                        mark_outbox_retry_or_dead(state, &item, attempt_now, &err.to_string())
                            .await?;
                    }
                }
            }
            KIND_DISCORD_WEBHOOK => {
                let Some(url) = webhook_url else {
                    tracing::debug!(
                        outbox_id = item.id,
                        "DISCORD_WEBHOOK_URL not configured; marking outbox item DONE"
                    );
                    mark_outbox_done(state, item.id, item.attempts + 1).await?;
                    processed += 1;
                    continue;
                };

                match send_discord_webhook(state, url, &item.payload).await {
                    Ok(()) => {
                        mark_outbox_done(state, item.id, item.attempts + 1).await?;
                    }
                    Err(err) => {
                        mark_outbox_retry_or_dead(state, &item, attempt_now, &err).await?;
                    }
                }
            }
            other => {
                tracing::error!(outbox_id = item.id, kind = %other, "Unknown outbox kind");
                mark_outbox_dead(state, item.id, item.attempts + 1, "Unknown outbox kind").await?;
            }
        }

        processed += 1;
    }

    Ok(processed)
}

pub async fn run_outbox_worker(state: SharedState) {
    let mut rcon = RconClient::new(
        &state.cfg.rcon_host,
        state.cfg.rcon_port,
        state.cfg.rcon_password.clone().unwrap_or_default(),
    );

    loop {
        if let Err(err) = process_due_outbox_once(&state, &mut rcon, None).await {
            tracing::error!(error = %err, "outbox_worker iteration failed");
        }

        tokio::select! {
            _ = state.shutdown.cancelled() => {
                tracing::info!("outbox_worker flushing due items before shutdown");
                let _ = process_due_outbox_once(&state, &mut rcon, None).await;
                rcon.disconnect().await;
                break;
            }
            _ = state.outbox_wake.notified() => {}
            _ = tokio::time::sleep(POLL_INTERVAL) => {}
        }
    }
}
