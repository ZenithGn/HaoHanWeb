use axum::extract::State;
use axum::http::{StatusCode, header};
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::{Json, Router};
use bytes::Bytes;
use serde::Deserialize;
use serde_json::{Value, json};
use sqlx::Row;

use crate::db::donations::ImmediateTx;
use crate::error::AppError;
use crate::extract::GameServerToken;
use crate::state::SharedState;

pub fn router() -> Router<SharedState> {
    Router::new()
        .route("/api/server/status", get(get_server_status))
        .route("/api/game/sync-playtime", post(sync_playtime))
}

pub async fn get_server_status(State(state): State<SharedState>) -> impl IntoResponse {
    let body = state.status.load_full();
    (
        [
            (header::CONTENT_TYPE, "application/json"),
            (header::CACHE_CONTROL, "public, max-age=5, s-maxage=10"),
        ],
        Bytes::clone(&body),
    )
}

#[derive(Debug, Deserialize)]
pub struct PlaytimePlayerInput {
    pub uuid: Option<String>,
    pub username: Option<String>,
    pub playtime: Option<Value>,
    pub playtime_seconds: Option<Value>,
}

#[derive(Debug, Deserialize)]
pub struct SyncPlaytimePayload {
    pub players: Option<Vec<PlaytimePlayerInput>>,
    pub uuid: Option<String>,
    pub username: Option<String>,
    pub playtime: Option<Value>,
    pub playtime_seconds: Option<Value>,
}

fn parse_playtime_value(val: Option<&Value>) -> Option<i64> {
    match val {
        Some(Value::Number(n)) => n.as_i64().or_else(|| n.as_f64().map(|f| f as i64)),
        Some(Value::String(s)) => s.trim().parse::<i64>().ok(),
        _ => None,
    }
}

pub async fn sync_playtime(
    State(state): State<SharedState>,
    _server: GameServerToken,
    Json(req): Json<SyncPlaytimePayload>,
) -> Result<impl IntoResponse, AppError> {
    let players_list = match req.players {
        Some(list) => list,
        None => {
            let has_identity = req
                .uuid
                .as_deref()
                .map(str::trim)
                .is_some_and(|s| !s.is_empty())
                || req
                    .username
                    .as_deref()
                    .map(str::trim)
                    .is_some_and(|s| !s.is_empty());
            let has_playtime = req.playtime.is_some() || req.playtime_seconds.is_some();

            if has_identity && has_playtime {
                vec![PlaytimePlayerInput {
                    uuid: req.uuid,
                    username: req.username,
                    playtime: req.playtime,
                    playtime_seconds: req.playtime_seconds,
                }]
            } else {
                Vec::new()
            }
        }
    };

    if players_list.is_empty() {
        return Err(AppError::BadRequest(
            "Không tìm thấy dữ liệu người chơi!".to_string(),
        ));
    }

    let mut tx = ImmediateTx::begin(&state.db.write)
        .await
        .map_err(anyhow::Error::from)?;

    let mut updated_count: i64 = 0;
    let mut errors: Vec<String> = Vec::new();

    let tx_outcome: Result<(), AppError> = async {
        for item in players_list {
            let p_uuid = item
                .uuid
                .as_deref()
                .map(str::trim)
                .filter(|s| !s.is_empty())
                .map(ToString::to_string);
            let p_username = item
                .username
                .as_deref()
                .map(str::trim)
                .filter(|s| !s.is_empty())
                .map(ToString::to_string);
            let p_playtime =
                parse_playtime_value(item.playtime.as_ref().or(item.playtime_seconds.as_ref()));

            if (p_uuid.is_none() && p_username.is_none()) || p_playtime.is_none() {
                continue;
            }

            let playtime = p_playtime.expect("checked is_some");
            if playtime < 0 {
                let label = p_username
                    .as_deref()
                    .or(p_uuid.as_deref())
                    .unwrap_or("unknown");
                errors.push(format!("Invalid negative playtime for {label}"));
                continue;
            }

            // Look up by UUID first, then username (COLLATE NOCASE).
            let existing = if let Some(ref uuid) = p_uuid {
                sqlx::query("SELECT id, uuid, discord_id FROM players WHERE uuid = ?1")
                    .bind(uuid)
                    .fetch_optional(tx.conn())
                    .await?
            } else {
                None
            };

            let existing = match existing {
                Some(row) => Some(row),
                None => {
                    if let Some(ref username) = p_username {
                        sqlx::query("SELECT id, uuid, discord_id FROM players WHERE username = ?1")
                            .bind(username)
                            .fetch_optional(tx.conn())
                            .await?
                    } else {
                        None
                    }
                }
            };

            if let Some(row) = existing {
                let player_id: i64 = row.try_get("id")?;
                let current_uuid: Option<String> = row.try_get("uuid")?;
                let discord_id: Option<String> = row.try_get("discord_id")?;

                let should_backfill_uuid = current_uuid
                    .as_deref()
                    .map(str::trim)
                    .is_none_or(str::is_empty)
                    && p_uuid.is_some();

                let res = if should_backfill_uuid {
                    let set_linked = discord_id
                        .as_deref()
                        .map(str::trim)
                        .is_some_and(|s| !s.is_empty());
                    sqlx::query(
                        "UPDATE players \
                         SET play_time = ?1, \
                             uuid = ?2, \
                             is_linked = CASE WHEN ?3 THEN 1 ELSE is_linked END \
                         WHERE id = ?4",
                    )
                    .bind(playtime)
                    .bind(p_uuid.as_deref())
                    .bind(set_linked)
                    .bind(player_id)
                    .execute(tx.conn())
                    .await
                } else {
                    sqlx::query("UPDATE players SET play_time = ?1 WHERE id = ?2")
                        .bind(playtime)
                        .bind(player_id)
                        .execute(tx.conn())
                        .await
                };

                match res {
                    Ok(_) => updated_count += 1,
                    Err(err) => {
                        let label = p_username
                            .as_deref()
                            .or(p_uuid.as_deref())
                            .unwrap_or("unknown");
                        errors.push(format!("Error updating profile for {label}: {err}"));
                    }
                }
            } else {
                let ghost_username = p_username
                    .clone()
                    .unwrap_or_else(|| format!("Player_{:08x}", rand::random::<u32>()));

                let res = sqlx::query(
                    "INSERT INTO players (username, uuid, kind, password_hash, play_time) \
                     VALUES (?1, ?2, 'ghost', NULL, ?3)",
                )
                .bind(&ghost_username)
                .bind(p_uuid.as_deref())
                .bind(playtime)
                .execute(tx.conn())
                .await;

                match res {
                    Ok(_) => updated_count += 1,
                    Err(err) => {
                        errors.push(format!(
                            "Error creating profile for {}: {err}",
                            p_username.as_deref().unwrap_or(&ghost_username)
                        ));
                    }
                }
            }
        }

        Ok(())
    }
    .await;

    match tx_outcome {
        Ok(()) => {
            tx.commit().await.map_err(anyhow::Error::from)?;
            if updated_count > 0 {
                state.invalidate.notify_one();
            }
            Ok((
                StatusCode::OK,
                Json(json!({
                    "message": "Đồng bộ thời gian chơi thành công!",
                    "processed_players": updated_count,
                    "errors": errors
                })),
            ))
        }
        Err(err) => {
            let _ = tx.rollback().await;
            Err(err)
        }
    }
}
