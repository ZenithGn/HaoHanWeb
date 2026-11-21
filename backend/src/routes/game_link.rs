use std::time::Duration;

use axum::extract::State;
use axum::http::StatusCode;
use axum::middleware::from_fn_with_state;
use axum::response::IntoResponse;
use axum::routing::post;
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::config::Config;
use crate::db::players::{self, PlayerRow};
use crate::domain::link_code::generate_link_code;
use crate::error::AppError;
use crate::extract::{AuthUser, GameServerToken};
use crate::middleware::rate_limit::{RateLimiter, rate_limit_middleware};
use crate::state::{LinkCodeData, SharedState};

#[derive(Debug, Deserialize)]
pub struct GenerateLinkCodeRequest {
    #[serde(default)]
    pub username: Option<String>,
    #[serde(default)]
    pub uuid: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct LinkGameAccountRequest {
    #[serde(default)]
    pub code: Option<String>,
}

#[derive(Debug, Serialize)]
struct LinkedUserDto {
    id: i64,
    username: String,
    uuid: Option<String>,
    is_linked: i64,
    total_donated: i64,
    play_time: i64,
}

impl From<PlayerRow> for LinkedUserDto {
    fn from(p: PlayerRow) -> Self {
        Self {
            id: p.id,
            username: p.username,
            uuid: p.uuid,
            is_linked: p.is_linked,
            total_donated: p.total_donated,
            play_time: p.play_time,
        }
    }
}

/// Mounts game account linking endpoints with per-IP rate limiting on `/api/auth/link`.
pub fn router(cfg: &Config) -> Router<SharedState> {
    let link_limiter = RateLimiter::new(cfg.rate_limit_enabled, 10, Duration::from_secs(60));

    Router::new()
        .route(
            "/api/game/generate-link-code",
            post(generate_link_code_handler),
        )
        .route(
            "/api/auth/link",
            post(link_game_account).layer(from_fn_with_state(link_limiter, rate_limit_middleware)),
        )
}

/// `POST /api/game/generate-link-code`: generates a 5-minute single-use 6-char code for `/link`.
pub async fn generate_link_code_handler(
    _game_server: GameServerToken,
    State(state): State<SharedState>,
    Json(req): Json<GenerateLinkCodeRequest>,
) -> Result<impl IntoResponse, AppError> {
    let username = req.username.as_deref().map(str::trim).unwrap_or("");
    let uuid = req.uuid.as_deref().map(str::trim).unwrap_or("");

    if username.is_empty() || uuid.is_empty() {
        return Err(AppError::BadRequest(
            "Username và UUID không được để trống!".to_string(),
        ));
    }

    let mut code = generate_link_code();
    for _ in 0..8 {
        if !state.link_codes.contains_key(&code) {
            break;
        }
        code = generate_link_code();
    }

    state
        .link_codes
        .insert(
            code.clone(),
            LinkCodeData {
                username: username.to_string(),
                uuid: uuid.to_string(),
            },
        )
        .await;

    Ok((
        StatusCode::OK,
        Json(json!({
            "code": code,
            "message": "Mã liên kết được sinh thành công!",
        })),
    ))
}

/// `POST /api/auth/link`: atomically consumes the link code and links/merges the game profile.
pub async fn link_game_account(
    auth_user: AuthUser,
    State(state): State<SharedState>,
    Json(req): Json<LinkGameAccountRequest>,
) -> Result<impl IntoResponse, AppError> {
    let code = req
        .code
        .as_deref()
        .map(|s| s.trim().to_ascii_uppercase())
        .unwrap_or_default();

    if code.is_empty() {
        return Err(AppError::BadRequest(
            "Vui lòng cung cấp mã liên kết!".to_string(),
        ));
    }

    let Some(game_data) = state.link_codes.remove(&code).await else {
        return Err(AppError::BadRequest(
            "Mã liên kết không hợp lệ hoặc đã hết hạn!".to_string(),
        ));
    };

    let mut tx = state.db.write.begin_with("BEGIN IMMEDIATE").await?;
    let outcome = link_in_tx(&mut tx, auth_user.id, &game_data).await;

    let updated = match outcome {
        Ok(player) => player,
        Err(err) => {
            let _ = tx.rollback().await;
            return Err(err);
        }
    };

    tx.commit().await?;
    state.invalidate.notify_one();

    Ok((
        StatusCode::OK,
        Json(json!({
            "message": "Liên kết tài khoản game thành công!",
            "user": LinkedUserDto::from(updated),
        })),
    ))
}

async fn link_in_tx(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    user_id: i64,
    game_data: &LinkCodeData,
) -> Result<PlayerRow, AppError> {
    let current_user = players::find_by_id_tx(tx, user_id)
        .await?
        .ok_or(AppError::Unauthorized)?;

    let by_uuid = players::find_by_uuid_tx(tx, &game_data.uuid).await?;
    let by_username = players::find_by_username_tx(tx, &game_data.username).await?;

    let target = by_uuid.or_else(|| by_username.clone());

    match target {
        Some(found) if found.id == current_user.id => {
            players::set_game_uuid_linked_tx(tx, current_user.id, &game_data.uuid)
                .await
                .map_err(map_link_tx_error)
        }
        Some(ghost) if ghost.kind == "ghost" => {
            if let Some(other_by_name) = by_username
                && other_by_name.id != current_user.id
                && other_by_name.id != ghost.id
                && other_by_name.kind != "ghost"
            {
                return Err(AppError::Conflict(
                    "Tài khoản game này đã được liên kết với một tài khoản web khác!".to_string(),
                ));
            }

            let new_total_donated = current_user
                .total_donated
                .checked_add(ghost.total_donated)
                .ok_or_else(|| {
                    AppError::Unprocessable(
                        "Lỗi trong quá trình gộp tài khoản: total_donated overflow".to_string(),
                    )
                })?;

            let new_role = if current_user.role == "default" {
                ghost.role.clone()
            } else {
                current_user.role.clone()
            };
            let new_play_time = current_user.play_time.max(ghost.play_time);
            let new_discord_id = current_user
                .discord_id
                .as_deref()
                .filter(|s| !s.is_empty())
                .map(str::to_string)
                .or(ghost.discord_id);
            let new_avatar_url = current_user
                .avatar_url
                .as_deref()
                .filter(|s| !s.is_empty())
                .map(str::to_string)
                .or(ghost.avatar_url);

            // Safe merge order: move donations -> delete ghost first -> update current user.
            players::transfer_donations_tx(tx, ghost.id, current_user.id)
                .await
                .map_err(map_link_tx_error)?;
            players::delete_player_tx(tx, ghost.id)
                .await
                .map_err(map_link_tx_error)?;
            players::apply_game_link_merge_tx(
                tx,
                current_user.id,
                &game_data.uuid,
                &game_data.username,
                new_total_donated,
                &new_role,
                new_play_time,
                new_discord_id.as_deref(),
                new_avatar_url.as_deref(),
            )
            .await
            .map_err(map_link_tx_error)
        }
        Some(_) => Err(AppError::Conflict(
            "Tài khoản game này đã được liên kết với một tài khoản web khác!".to_string(),
        )),
        None => players::set_game_uuid_linked_tx(tx, current_user.id, &game_data.uuid)
            .await
            .map_err(map_link_tx_error),
    }
}

fn map_link_tx_error(err: sqlx::Error) -> AppError {
    AppError::Unprocessable(format!("Lỗi trong quá trình gộp tài khoản: {err}"))
}
