use std::sync::OnceLock;
use std::time::Duration;

use axum::extract::State;
use axum::http::StatusCode;
use axum::middleware::from_fn_with_state;
use axum::response::{IntoResponse, Response};
use axum::routing::post;
use axum::{Json, Router};
use regex::Regex;
use serde::Deserialize;
use serde_json::json;

use crate::config::Config;
use crate::db::players::{self, PlayerRow, UserDto};
use crate::domain::{jwt, offline_uuid, password};
use crate::error::AppError;
use crate::extract::AuthUser;
use crate::integrations::discord::build_new_user_webhook_payload;
use crate::middleware::rate_limit::{RateLimiter, rate_limit_middleware};
use crate::state::SharedState;

static EMAIL_REGEX: OnceLock<Regex> = OnceLock::new();

fn is_valid_email(email: &str) -> bool {
    if email.len() > 255 || email.chars().any(char::is_control) {
        return false;
    }
    let re = EMAIL_REGEX.get_or_init(|| {
        Regex::new(r"^[^\s@]+@[^\s@]+\.[^\s@]+$").expect("valid email regex pattern")
    });
    re.is_match(email)
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    #[serde(default)]
    pub username: Option<String>,
    #[serde(default)]
    pub email: Option<String>,
    #[serde(default)]
    pub password: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    #[serde(default)]
    pub username: Option<String>,
    #[serde(default)]
    pub password: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProfileRequest {
    #[serde(default)]
    pub current_password: Option<String>,
    #[serde(default)]
    pub email: Option<String>,
    #[serde(default)]
    pub new_password: Option<String>,
}

/// Mounts authentication endpoints with per-IP rate limiting on `register` and `login`.
pub fn router(cfg: &Config) -> Router<SharedState> {
    let register_limiter = RateLimiter::new(cfg.rate_limit_enabled, 10, Duration::from_secs(60));
    let login_limiter = RateLimiter::new(cfg.rate_limit_enabled, 10, Duration::from_secs(60));

    Router::new()
        .route(
            "/api/auth/register",
            post(register).layer(from_fn_with_state(register_limiter, rate_limit_middleware)),
        )
        .route(
            "/api/auth/login",
            post(login).layer(from_fn_with_state(login_limiter, rate_limit_middleware)),
        )
        .route("/api/auth/update-profile", post(update_profile))
}

/// `POST /api/auth/register`: registers a new web player or claims an existing ghost profile.
pub async fn register(
    State(state): State<SharedState>,
    Json(req): Json<RegisterRequest>,
) -> Result<Response, AppError> {
    let username = req.username.as_deref().map(str::trim).unwrap_or("");
    let email = req.email.as_deref().map(str::trim).unwrap_or("");
    let raw_password = req.password.as_deref().unwrap_or("");

    if username.is_empty() || email.is_empty() || raw_password.trim().is_empty() {
        return Err(AppError::BadRequest(
            "Tên nhân vật, email và mật khẩu không được để trống!".to_string(),
        ));
    }

    if username.chars().count() > 16 {
        return Err(AppError::BadRequest(
            "Tên nhân vật không được vượt quá 16 ký tự!".to_string(),
        ));
    }

    if raw_password.chars().count() < 6 {
        return Err(AppError::BadRequest(
            "Mật khẩu phải từ 6 ký tự trở lên!".to_string(),
        ));
    }

    if !is_valid_email(email) {
        return Err(AppError::Unprocessable(
            "Email không đúng định dạng".to_string(),
        ));
    }

    // Hash password off the SQLite write transaction lock.
    let hashed_pw = password::hash_password(raw_password.to_string()).await?;
    let generated_uuid = offline_uuid::offline_uuid(username);

    let mut tx = state.db.write.begin_with("BEGIN IMMEDIATE").await?;

    let outcome = register_in_tx(&mut tx, username, email, &generated_uuid, &hashed_pw).await;

    let (player, claimed_ghost) = match outcome {
        Ok(res) => res,
        Err(err) => {
            let _ = tx.rollback().await;
            return Err(err);
        }
    };

    tx.commit().await?;
    state.outbox_wake.notify_one();

    let token = jwt::encode_session_token(&state.cfg.jwt_secret, player.id)?;
    let (status, message) = if claimed_ghost {
        (
            StatusCode::OK,
            "Đăng ký tài khoản web thành công (Liên kết tài khoản game có sẵn)!",
        )
    } else {
        (StatusCode::CREATED, "Đăng ký tài khoản thành công!")
    };

    Ok((
        status,
        Json(json!({
            "message": message,
            "token": token,
            "user": UserDto::from(player),
        })),
    )
        .into_response())
}

async fn register_in_tx(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    username: &str,
    email: &str,
    generated_uuid: &str,
    hashed_pw: &str,
) -> Result<(PlayerRow, bool), AppError> {
    if players::email_exists_non_ghost_tx(tx, email, None).await? {
        return Err(AppError::BadRequest(
            "Địa chỉ email này đã được sử dụng!".to_string(),
        ));
    }

    let existing = players::find_by_username_tx(tx, username).await?;
    let (player, claimed_ghost) = match existing {
        Some(existing_player) => {
            if existing_player.kind != "ghost" {
                return Err(AppError::BadRequest(
                    "Tên nhân vật đã được đăng ký tài khoản web!".to_string(),
                ));
            }
            let claimed = players::claim_ghost_as_web_tx(tx, existing_player.id, email, hashed_pw)
                .await
                .map_err(map_register_db_error)?
                .ok_or_else(|| {
                    AppError::BadRequest("Tên nhân vật đã được đăng ký tài khoản web!".to_string())
                })?;
            (claimed, true)
        }
        None => {
            let created =
                players::insert_web_player_tx(tx, username, email, generated_uuid, hashed_pw)
                    .await
                    .map_err(map_register_db_error)?;
            (created, false)
        }
    };

    let webhook_payload =
        build_new_user_webhook_payload(&player.username, player.uuid.as_deref()).to_string();
    players::enqueue_outbox_tx(tx, "discord_webhook", &webhook_payload).await?;

    Ok((player, claimed_ghost))
}

fn map_register_db_error(err: sqlx::Error) -> AppError {
    if players::is_unique_violation_for(&err, "players.email") {
        return AppError::BadRequest("Địa chỉ email này đã được sử dụng!".to_string());
    }
    if players::is_unique_violation_for(&err, "players.username") {
        return AppError::BadRequest("Tên nhân vật đã được đăng ký tài khoản web!".to_string());
    }
    if players::is_unique_violation_for(&err, "players.uuid") {
        return AppError::Unprocessable("UUID đã tồn tại trong hệ thống!".to_string());
    }
    AppError::from(err)
}

/// `POST /api/auth/login`: authenticates by email or username, transparently upgrading legacy `$SHA$` hashes.
pub async fn login(
    State(state): State<SharedState>,
    Json(req): Json<LoginRequest>,
) -> Result<impl IntoResponse, AppError> {
    let username_or_email = req.username.as_deref().map(str::trim).unwrap_or("");
    let raw_password = req.password.as_deref().unwrap_or("");

    if username_or_email.is_empty() || raw_password.trim().is_empty() {
        return Err(AppError::BadRequest(
            "Tên nhân vật/Email và mật khẩu không được để trống!".to_string(),
        ));
    }

    let player = if username_or_email.contains('@') {
        players::find_by_email(&state.db.read, username_or_email).await?
    } else {
        players::find_by_username(&state.db.read, username_or_email).await?
    };

    let Some(player) = player else {
        return Err(AppError::UnauthorizedMsg(
            "Tên đăng nhập hoặc mật khẩu không chính xác!".to_string(),
        ));
    };

    if player.kind != "web" {
        return Err(AppError::UnauthorizedMsg(
            "Tên đăng nhập hoặc mật khẩu không chính xác!".to_string(),
        ));
    }

    let Some(stored_hash) = player.password_hash.clone() else {
        return Err(AppError::UnauthorizedMsg(
            "Tên đăng nhập hoặc mật khẩu không chính xác!".to_string(),
        ));
    };

    let verify = password::verify_password(raw_password.to_string(), stored_hash).await?;
    if !verify.valid {
        return Err(AppError::UnauthorizedMsg(
            "Tên đăng nhập hoặc mật khẩu không chính xác!".to_string(),
        ));
    }

    if verify.needs_rehash {
        let upgraded_hash = password::hash_password(raw_password.to_string()).await?;
        players::update_password_hash(&state.db.write, player.id, &upgraded_hash).await?;
    }

    let token = jwt::encode_session_token(&state.cfg.jwt_secret, player.id)?;

    Ok((
        StatusCode::OK,
        Json(json!({
            "message": "Đăng nhập thành công!",
            "token": token,
            "user": UserDto::from(player),
        })),
    ))
}

/// `POST /api/auth/update-profile`: verifies `current_password` and updates email and/or password.
pub async fn update_profile(
    auth_user: AuthUser,
    State(state): State<SharedState>,
    Json(req): Json<UpdateProfileRequest>,
) -> Result<impl IntoResponse, AppError> {
    let current_password = req.current_password.as_deref().unwrap_or("");
    if current_password.trim().is_empty() {
        return Err(AppError::BadRequest(
            "Vui lòng nhập mật khẩu hiện tại để xác thực thay đổi!".to_string(),
        ));
    }

    let player = players::find_by_id(&state.db.read, auth_user.id)
        .await?
        .ok_or(AppError::Unauthorized)?;

    if player.kind != "web" {
        return Err(AppError::UnauthorizedMsg(
            "Mật khẩu hiện tại không chính xác!".to_string(),
        ));
    }

    let Some(stored_hash) = player.password_hash.clone() else {
        return Err(AppError::UnauthorizedMsg(
            "Mật khẩu hiện tại không chính xác!".to_string(),
        ));
    };

    let verify =
        password::verify_password(current_password.to_string(), stored_hash.clone()).await?;
    if !verify.valid {
        return Err(AppError::UnauthorizedMsg(
            "Mật khẩu hiện tại không chính xác!".to_string(),
        ));
    }

    let mut target_email = player.email.clone();
    if let Some(new_email) = req
        .email
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        && player.email.as_deref() != Some(new_email)
    {
        if !is_valid_email(new_email) {
            return Err(AppError::BadRequest(
                "Email không đúng định dạng!".to_string(),
            ));
        }

        if players::email_exists_non_ghost(&state.db.read, new_email, Some(player.id)).await? {
            return Err(AppError::BadRequest(
                "Địa chỉ email này đã được sử dụng!".to_string(),
            ));
        }

        target_email = Some(new_email.to_string());
    }

    let mut target_hash = stored_hash;
    if let Some(new_pw) = req.new_password.as_deref().filter(|s| !s.trim().is_empty()) {
        if new_pw.chars().count() < 6 {
            return Err(AppError::BadRequest(
                "Mật khẩu mới phải từ 6 ký tự trở lên!".to_string(),
            ));
        }
        target_hash = password::hash_password(new_pw.to_string()).await?;
    }

    let updated = players::update_profile(
        &state.db.write,
        player.id,
        target_email.as_deref(),
        &target_hash,
    )
    .await
    .map_err(|err| {
        if players::is_unique_violation_for(&err, "players.email") {
            AppError::BadRequest("Địa chỉ email này đã được sử dụng!".to_string())
        } else {
            AppError::from(err)
        }
    })?;

    Ok((
        StatusCode::OK,
        Json(json!({
            "message": "Cập nhật thông tin tài khoản thành công!",
            "user": UserDto::from(updated),
        })),
    ))
}
