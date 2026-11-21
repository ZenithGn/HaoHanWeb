use std::collections::HashSet;
use std::time::Duration;

use axum::body::Bytes;
use axum::extract::{Extension, Query, State};
use axum::http::{HeaderMap, StatusCode, header};
use axum::middleware::from_fn_with_state;
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::{Json, Router};
use rand::Rng;
use serde::Deserialize;
use serde_json::json;

use crate::config::Config;
use crate::db::players::{self, PlayerRow, UserDto};
use crate::domain::{jwt, offline_uuid, roles};
use crate::error::AppError;
use crate::extract::{AuthUser, BotToken, authenticate_token, extract_authorization_token};
use crate::integrations::cloudinary::CloudinaryClient;
use crate::integrations::discord::{
    DiscordApiError, DiscordClient, build_discord_avatar_url, build_new_user_webhook_payload,
};
use crate::middleware::rate_limit::{RateLimiter, rate_limit_middleware};
use crate::state::{AppState, SharedState};

#[derive(Debug, Default, Deserialize)]
pub struct TokenParam {
    #[serde(default)]
    pub token: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct DiscordCallbackRequest {
    #[serde(default)]
    pub code: Option<String>,
    #[serde(default)]
    pub state: Option<String>,
    #[serde(default)]
    pub token: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct DiscordLoginRequest {
    #[serde(default)]
    pub code: Option<String>,
    #[serde(default)]
    pub state: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct DiscordRoleUpdateRequest {
    #[serde(default)]
    pub discord_id: Option<String>,
    #[serde(default)]
    pub roles: Option<Vec<String>>,
}

/// Mounts Discord OAuth, sync, login and bot role-update routes using production external URLs.
pub fn router(cfg: &Config) -> Router<SharedState> {
    routes_with_clients(cfg, DiscordClient::new(), CloudinaryClient::new())
}

/// Mounts Discord routes with injected `DiscordClient` and `CloudinaryClient` instances
/// so integration tests can route external HTTP requests to a local mock server.
pub fn routes_with_clients(
    cfg: &Config,
    discord: DiscordClient,
    cloudinary: CloudinaryClient,
) -> Router<SharedState> {
    let callback_limiter = RateLimiter::new(cfg.rate_limit_enabled, 20, Duration::from_secs(60));
    let login_limiter = RateLimiter::new(cfg.rate_limit_enabled, 20, Duration::from_secs(60));

    Router::new()
        .route("/api/auth/discord/url", get(discord_url).post(discord_url))
        .route(
            "/api/auth/discord/callback",
            post(discord_callback)
                .layer(from_fn_with_state(callback_limiter, rate_limit_middleware)),
        )
        .route("/api/auth/discord/sync", post(discord_sync))
        .route("/api/discord/role-update", post(discord_role_update))
        .route("/api/auth/discord/login-url", get(discord_login_url))
        .route(
            "/api/auth/discord/login",
            post(discord_login).layer(from_fn_with_state(login_limiter, rate_limit_middleware)),
        )
        .layer(Extension(discord))
        .layer(Extension(cloudinary))
}

fn no_store_json(status: StatusCode, body: serde_json::Value) -> impl IntoResponse {
    (status, [(header::CACHE_CONTROL, "no-store")], Json(body))
}

async fn resolve_user_from_header_or_token(
    state: &AppState,
    headers: &HeaderMap,
    fallback_token: Option<&str>,
) -> Option<PlayerRow> {
    if let Some(tok) = extract_authorization_token(headers)
        && let Ok(auth) = authenticate_token(state, tok).await
        && let Ok(Some(player)) = players::find_by_id(&state.db.read, auth.id).await
    {
        return Some(player);
    }

    let raw = fallback_token.map(str::trim).filter(|s| !s.is_empty())?;
    let tok = raw
        .get(..7)
        .filter(|p| p.eq_ignore_ascii_case("bearer "))
        .map(|_| raw[7..].trim())
        .unwrap_or(raw);
    if tok.is_empty() {
        return None;
    }

    let auth = authenticate_token(state, tok).await.ok()?;
    players::find_by_id(&state.db.read, auth.id).await.ok()?
}

/// `GET/POST /api/auth/discord/url`: returns a Discord OAuth URL with a 10-minute `discord_link` state JWT.
pub async fn discord_url(
    State(state): State<SharedState>,
    Extension(discord): Extension<DiscordClient>,
    headers: HeaderMap,
    Query(query): Query<TokenParam>,
    body: Bytes,
) -> Result<impl IntoResponse, AppError> {
    let body_token = if body.is_empty() {
        None
    } else {
        serde_json::from_slice::<TokenParam>(&body)
            .ok()
            .and_then(|p| p.token)
    };
    let fallback_token = query.token.as_deref().or(body_token.as_deref());

    let user = resolve_user_from_header_or_token(&state, &headers, fallback_token)
        .await
        .ok_or(AppError::Unauthorized)?;

    let state_jwt = jwt::encode_discord_link_state(&state.cfg.jwt_secret, user.id)?;
    let url = discord.authorize_url(&state.cfg, Some(&state_jwt))?;

    Ok(no_store_json(StatusCode::OK, json!({ "url": url })))
}

/// `GET /api/auth/discord/login-url`: returns a public Discord OAuth URL with `purpose: "discord_login"`.
pub async fn discord_login_url(
    State(state): State<SharedState>,
    Extension(discord): Extension<DiscordClient>,
) -> Result<impl IntoResponse, AppError> {
    let state_jwt = jwt::encode_discord_login_state(&state.cfg.jwt_secret)?;
    let url = discord.authorize_url(&state.cfg, Some(&state_jwt))?;

    Ok(no_store_json(StatusCode::OK, json!({ "url": url })))
}

/// `POST /api/auth/discord/callback`: completes Discord OAuth linking for an authenticated user.
pub async fn discord_callback(
    State(state): State<SharedState>,
    Extension(discord): Extension<DiscordClient>,
    Extension(cloudinary): Extension<CloudinaryClient>,
    headers: HeaderMap,
    Json(req): Json<DiscordCallbackRequest>,
) -> Result<impl IntoResponse, AppError> {
    let code = req.code.as_deref().map(str::trim).unwrap_or("");
    if code.is_empty() {
        return Err(AppError::BadRequest(
            "Không tìm thấy mã xác thực OAuth!".to_string(),
        ));
    }

    let mut current_user =
        resolve_user_from_header_or_token(&state, &headers, req.token.as_deref()).await;

    if current_user.is_none()
        && let Some(state_str) = req
            .state
            .as_deref()
            .map(str::trim)
            .filter(|s| !s.is_empty())
        && let Some(claims) =
            jwt::decode_discord_state(&state.cfg.jwt_secret, state_str, jwt::PURPOSE_DISCORD_LINK)
        && let Some(uid) = claims.user_id
    {
        current_user = players::find_by_id(&state.db.read, uid).await?;
    }

    let current_user = current_user.ok_or(AppError::Unauthorized)?;

    let access_token = discord
        .exchange_code(&state.http, &state.cfg, code)
        .await
        .map_err(|e| map_discord_link_err(e, true))?;
    let profile = discord
        .fetch_user_profile(&state.http, &access_token)
        .await
        .map_err(|e| map_discord_link_err(e, true))?;
    let discord_roles = discord
        .fetch_guild_member_roles(&state.http, &state.cfg, &profile.id)
        .await
        .map_err(|e| map_discord_link_err(e, true))?;

    let discord_avatar_url = build_discord_avatar_url(&profile.id, profile.avatar.as_deref());
    let avatar_url = cloudinary
        .upload_image(&state.http, &state.cfg, &discord_avatar_url)
        .await;
    let highest_role = roles::determine_highest_role(&discord_roles);

    let mut tx = state.db.write.begin_with("BEGIN IMMEDIATE").await?;
    let outcome = callback_merge_in_tx(
        &mut tx,
        current_user.id,
        &profile.id,
        &avatar_url,
        highest_role,
    )
    .await;

    let updated = match outcome {
        Ok(p) => p,
        Err(err) => {
            let _ = tx.rollback().await;
            return Err(err);
        }
    };

    tx.commit().await?;
    state.invalidate.notify_one();

    let token = jwt::encode_session_token(&state.cfg.jwt_secret, updated.id)?;

    Ok((
        StatusCode::OK,
        Json(json!({
            "message": "Liên kết Discord thành công!",
            "token": token,
            "user": UserDto::from(updated),
        })),
    ))
}

async fn callback_merge_in_tx(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    user_id: i64,
    discord_id: &str,
    avatar_url: &str,
    highest_role: &str,
) -> Result<PlayerRow, AppError> {
    let current_user = players::find_by_id_tx(tx, user_id)
        .await?
        .ok_or(AppError::Unauthorized)?;

    if let Some(existing_discord) = players::find_by_discord_id_tx(tx, discord_id).await?
        && existing_discord.id != current_user.id
        && existing_discord.kind != "ghost"
    {
        return Err(AppError::Conflict(
            "Tài khoản Discord này đã được liên kết với một tài khoản web khác!".to_string(),
        ));
    }

    let minecraft_player = players::find_minecraft_merge_candidate_tx(
        tx,
        current_user.id,
        &current_user.username,
        discord_id,
    )
    .await?;

    if let Some(mc_player) = minecraft_player {
        if mc_player.kind != "ghost" {
            return Err(AppError::Conflict(
                "Tài khoản Discord này đã được liên kết với một tài khoản web khác!".to_string(),
            ));
        }

        let game_username = mc_player.username;
        let game_uuid = mc_player.uuid.unwrap_or_default();
        let new_total_donated = current_user
            .total_donated
            .checked_add(mc_player.total_donated)
            .ok_or_else(|| {
                AppError::Unprocessable("Lỗi liên kết Discord: total_donated overflow".to_string())
            })?;
        let new_play_time = current_user.play_time.max(mc_player.play_time);

        players::transfer_donations_tx(tx, mc_player.id, current_user.id).await?;
        players::delete_player_tx(tx, mc_player.id).await?;

        return players::apply_game_link_merge_tx(
            tx,
            current_user.id,
            &game_uuid,
            &game_username,
            new_total_donated,
            highest_role,
            new_play_time,
            Some(discord_id),
            Some(avatar_url),
        )
        .await
        .map_err(|e| AppError::Unprocessable(format!("Lỗi liên kết Discord: {e}")));
    }

    // Also clean up any uuid-less ghost holding this discord_id so ux_players_discord stays valid.
    let mut new_total_donated = current_user.total_donated;
    let mut new_play_time = current_user.play_time;
    if let Some(ghost_discord) = players::find_by_discord_id_tx(tx, discord_id).await?
        && ghost_discord.id != current_user.id
        && ghost_discord.kind == "ghost"
    {
        new_total_donated = new_total_donated
            .checked_add(ghost_discord.total_donated)
            .ok_or_else(|| {
                AppError::Unprocessable("Lỗi liên kết Discord: total_donated overflow".to_string())
            })?;
        new_play_time = new_play_time.max(ghost_discord.play_time);
        players::transfer_donations_tx(tx, ghost_discord.id, current_user.id).await?;
        players::delete_player_tx(tx, ghost_discord.id).await?;
    }

    let is_linked = if current_user.uuid.as_deref().is_some_and(|u| !u.is_empty()) {
        1
    } else {
        0
    };

    players::update_discord_link_tx(
        tx,
        current_user.id,
        discord_id,
        avatar_url,
        highest_role,
        new_total_donated,
        new_play_time,
        is_linked,
    )
    .await
    .map_err(|e| AppError::Unprocessable(format!("Lỗi liên kết Discord: {e}")))
}

/// `POST /api/auth/discord/sync`: refreshes role and Cloudinary avatar from Discord for the logged-in user.
pub async fn discord_sync(
    auth_user: AuthUser,
    State(state): State<SharedState>,
    Extension(discord): Extension<DiscordClient>,
    Extension(cloudinary): Extension<CloudinaryClient>,
) -> Result<impl IntoResponse, AppError> {
    let discord_id = auth_user
        .discord_id
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .ok_or_else(|| {
            AppError::BadRequest("Tài khoản chưa được liên kết với Discord!".to_string())
        })?;

    let roles_fut = discord.fetch_guild_member_roles(&state.http, &state.cfg, discord_id);
    let profile_fut = async {
        Ok::<_, DiscordApiError>(
            discord
                .fetch_user_profile_by_bot(&state.http, &state.cfg, discord_id)
                .await,
        )
    };

    let (discord_roles, bot_profile) = tokio::try_join!(roles_fut, profile_fut).map_err(|err| {
        match err {
            DiscordApiError::NotInServer => AppError::Forbidden(
                "Không thể tìm thấy bạn trong server Discord của Hảo Hán SMP. Hãy chắc chắn bạn đã tham gia server!".to_string(),
            ),
            DiscordApiError::Message(msg) => AppError::Unprocessable(format!("Lỗi đồng bộ: {msg}")),
        }
    })?;

    let highest_role = roles::determine_highest_role(&discord_roles);
    let mut avatar_url = auth_user.avatar_url.clone();

    if let Some(profile) = bot_profile {
        let discord_avatar_url = build_discord_avatar_url(discord_id, profile.avatar.as_deref());
        avatar_url = Some(
            cloudinary
                .upload_image(&state.http, &state.cfg, &discord_avatar_url)
                .await,
        );
    }

    let updated = players::update_discord_sync(
        &state.db.write,
        auth_user.id,
        highest_role,
        avatar_url.as_deref(),
    )
    .await
    .map_err(|e| AppError::Unprocessable(format!("Lỗi đồng bộ: {e}")))?;

    state.invalidate.notify_one();

    Ok((
        StatusCode::OK,
        Json(json!({
            "message": "Đồng bộ thông tin Discord thành công!",
            "user": UserDto::from(updated),
        })),
    ))
}

/// `POST /api/discord/role-update`: bot webhook updating a linked player's highest role.
pub async fn discord_role_update(
    _bot: BotToken,
    State(state): State<SharedState>,
    Extension(discord): Extension<DiscordClient>,
    Json(req): Json<DiscordRoleUpdateRequest>,
) -> Result<impl IntoResponse, AppError> {
    let discord_id = req.discord_id.as_deref().map(str::trim).unwrap_or("");
    if discord_id.is_empty() {
        return Err(AppError::BadRequest("Thiếu discord_id!".to_string()));
    }

    let player = players::find_by_discord_id(&state.db.read, discord_id)
        .await?
        .ok_or_else(|| {
            AppError::NotFound("Không tìm thấy người chơi liên kết với Discord ID này!".to_string())
        })?;

    let role_names = match req.roles {
        Some(list) => list,
        None => discord
            .fetch_guild_member_roles(&state.http, &state.cfg, discord_id)
            .await
            .map_err(|err| {
                let msg = match err {
                    DiscordApiError::NotInServer => "NOT_IN_SERVER".to_string(),
                    DiscordApiError::Message(m) => m,
                };
                AppError::Unprocessable(format!("Lỗi lấy roles của member: {msg}"))
            })?,
    };

    let highest_role = roles::determine_highest_role(&role_names);
    let updated = players::update_role(&state.db.write, player.id, highest_role).await?;
    state.invalidate.notify_one();

    Ok((
        StatusCode::OK,
        Json(json!({
            "message": "Cập nhật role thành công!",
            "player": {
                "id": updated.id,
                "username": updated.username,
                "role": updated.role,
            }
        })),
    ))
}

/// `POST /api/auth/discord/login`: authenticates, claims a matching ghost, or registers a new Discord player.
pub async fn discord_login(
    State(state): State<SharedState>,
    Extension(discord): Extension<DiscordClient>,
    Extension(cloudinary): Extension<CloudinaryClient>,
    Json(req): Json<DiscordLoginRequest>,
) -> Result<impl IntoResponse, AppError> {
    let code = req.code.as_deref().map(str::trim).unwrap_or("");
    if code.is_empty() {
        return Err(AppError::BadRequest(
            "Không tìm thấy mã xác thực OAuth!".to_string(),
        ));
    }

    if let Some(state_str) = req
        .state
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        && jwt::decode_discord_state(&state.cfg.jwt_secret, state_str, jwt::PURPOSE_DISCORD_LOGIN)
            .is_none()
    {
        return Err(AppError::BadRequest("State không hợp lệ!".to_string()));
    }

    let access_token = discord
        .exchange_code(&state.http, &state.cfg, code)
        .await
        .map_err(|e| map_discord_link_err(e, false))?;
    let profile = discord
        .fetch_user_profile(&state.http, &access_token)
        .await
        .map_err(|e| map_discord_link_err(e, false))?;
    let discord_roles = discord
        .fetch_guild_member_roles(&state.http, &state.cfg, &profile.id)
        .await
        .map_err(|e| map_discord_link_err(e, false))?;

    let discord_avatar_url = build_discord_avatar_url(&profile.id, profile.avatar.as_deref());
    let avatar_url = cloudinary
        .upload_image(&state.http, &state.cfg, &discord_avatar_url)
        .await;
    let highest_role = roles::determine_highest_role(&discord_roles);

    let mut tx = state.db.write.begin_with("BEGIN IMMEDIATE").await?;
    let outcome = discord_login_in_tx(
        &mut tx,
        &profile.id,
        &profile.username,
        &avatar_url,
        highest_role,
    )
    .await;

    let (player, created_new) = match outcome {
        Ok(res) => res,
        Err(err) => {
            let _ = tx.rollback().await;
            return Err(err);
        }
    };

    tx.commit().await?;
    state.invalidate.notify_one();
    if created_new {
        state.outbox_wake.notify_one();
    }

    let token = jwt::encode_session_token(&state.cfg.jwt_secret, player.id)?;

    Ok((
        StatusCode::OK,
        Json(json!({
            "message": "Đăng nhập bằng Discord thành công!",
            "token": token,
            "user": UserDto::from(player),
        })),
    ))
}

async fn discord_login_in_tx(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    discord_id: &str,
    discord_username: &str,
    avatar_url: &str,
    highest_role: &str,
) -> Result<(PlayerRow, bool), AppError> {
    if let Some(existing) = players::find_by_discord_id_tx(tx, discord_id).await? {
        let promote_ghost = existing.kind == "ghost";
        let is_linked = if promote_ghost {
            if existing.uuid.as_deref().is_some_and(|u| !u.is_empty()) {
                1
            } else {
                0
            }
        } else {
            existing.is_linked
        };
        let updated = players::update_existing_discord_login_tx(
            tx,
            existing.id,
            promote_ghost,
            highest_role,
            avatar_url,
            is_linked,
        )
        .await
        .map_err(|e| AppError::Unprocessable(format!("Lỗi đăng nhập Discord: {e}")))?;
        return Ok((updated, false));
    }

    let cleaned_name = discord_username.trim();
    let base_name: String = if cleaned_name.is_empty() {
        "DiscordUser".to_string()
    } else {
        cleaned_name.chars().take(16).collect()
    };

    if let Some(existing_by_name) = players::find_by_username_tx(tx, &base_name).await?
        && existing_by_name.kind == "ghost"
    {
        let is_linked = if existing_by_name
            .uuid
            .as_deref()
            .is_some_and(|u| !u.is_empty())
        {
            1
        } else {
            0
        };
        let claimed = players::claim_ghost_as_discord_tx(
            tx,
            existing_by_name.id,
            discord_id,
            avatar_url,
            highest_role,
            is_linked,
        )
        .await
        .map_err(|e| AppError::Unprocessable(format!("Lỗi đăng nhập Discord: {e}")))?
        .ok_or_else(|| {
            AppError::Unprocessable("Lỗi đăng nhập Discord: ghost claim failed".to_string())
        })?;
        return Ok((claimed, false));
    }

    let final_username = generate_unique_discord_username_tx(tx, &base_name).await?;
    let generated_uuid = offline_uuid::offline_uuid(&final_username);
    let created = players::insert_discord_player_tx(
        tx,
        &final_username,
        &generated_uuid,
        discord_id,
        avatar_url,
        highest_role,
    )
    .await
    .map_err(|e| AppError::Unprocessable(format!("Lỗi đăng nhập Discord: {e}")))?;

    let webhook_payload =
        build_new_user_webhook_payload(&created.username, created.uuid.as_deref()).to_string();
    players::enqueue_outbox_tx(tx, "discord_webhook", &webhook_payload).await?;

    Ok((created, true))
}

async fn generate_unique_discord_username_tx(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    raw_username: &str,
) -> Result<String, AppError> {
    let base: String = raw_username.chars().take(16).collect();
    if !players::username_exists_tx(tx, &base).await? {
        return Ok(base);
    }

    let prefix: String = base.chars().take(11).collect();
    let taken_lower: HashSet<String> = players::list_usernames_with_prefix_tx(tx, &prefix)
        .await?
        .into_iter()
        .map(|s| s.to_lowercase())
        .collect();

    for _ in 0..32 {
        let suffix: u16 = rand::rngs::OsRng.r#gen();
        let candidate = format!("{prefix}{suffix:04x}");
        if !taken_lower.contains(&candidate.to_lowercase())
            && !players::username_exists_tx(tx, &candidate).await?
        {
            return Ok(candidate);
        }
    }

    Err(AppError::Unprocessable(
        "Lỗi đăng nhập Discord: không thể tạo tên người dùng duy nhất".to_string(),
    ))
}

fn map_discord_link_err(err: DiscordApiError, is_link_flow: bool) -> AppError {
    match err {
        DiscordApiError::NotInServer => {
            if is_link_flow {
                AppError::Forbidden(
                    "Bạn phải tham gia server Discord của Hảo Hán SMP trước khi liên kết!"
                        .to_string(),
                )
            } else {
                AppError::Forbidden(
                    "Bạn phải tham gia server Discord của Hảo Hán SMP trước khi đăng nhập!"
                        .to_string(),
                )
            }
        }
        DiscordApiError::Message(msg) => {
            if is_link_flow {
                AppError::Unprocessable(format!("Lỗi liên kết Discord: {msg}"))
            } else {
                AppError::Unprocessable(format!("Lỗi đăng nhập Discord: {msg}"))
            }
        }
    }
}
