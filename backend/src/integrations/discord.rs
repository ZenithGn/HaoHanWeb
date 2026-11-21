use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;

use moka::future::Cache;
use reqwest::header::AUTHORIZATION;
use serde::Deserialize;
use serde_json::{Value, json};
use time::OffsetDateTime;
use time::format_description::well_known::Rfc3339;
use url::Url;

use crate::config::Config;

pub const DEFAULT_DISCORD_OAUTH_AUTHORIZE_URL: &str = "https://discord.com/api/oauth2/authorize";
pub const DEFAULT_DISCORD_API_BASE: &str = "https://discord.com/api/v10";

#[derive(Debug, Clone)]
pub enum DiscordApiError {
    NotInServer,
    Message(String),
}

#[derive(Debug, Clone, Deserialize)]
pub struct DiscordUserProfile {
    pub id: String,
    pub username: String,
    pub avatar: Option<String>,
}

#[derive(Debug, Deserialize)]
struct DiscordTokenResponse {
    access_token: String,
}

#[derive(Debug, Deserialize)]
struct DiscordGuildRole {
    id: String,
    name: String,
}

#[derive(Debug, Deserialize)]
struct DiscordGuildMember {
    #[serde(default)]
    roles: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct DiscordClient {
    oauth_authorize_url: String,
    api_base: String,
    guild_roles_cache: Cache<(String, String), Arc<HashMap<String, String>>>,
}

impl Default for DiscordClient {
    fn default() -> Self {
        Self::new()
    }
}

impl DiscordClient {
    /// Creates a Discord client targeting production Discord OAuth2 and REST v10 endpoints.
    pub fn new() -> Self {
        Self::with_bases(
            DEFAULT_DISCORD_OAUTH_AUTHORIZE_URL,
            DEFAULT_DISCORD_API_BASE,
        )
    }

    /// Creates a Discord client with custom OAuth authorize and API base URLs for local mock tests.
    /// Uses an internal `moka` cache keyed by `(api_base, guild_id)` with 10m TTL.
    pub fn with_bases(oauth_authorize_url: impl Into<String>, api_base: impl Into<String>) -> Self {
        let guild_roles_cache = Cache::builder()
            .max_capacity(256)
            .time_to_live(Duration::from_secs(600))
            .build();
        Self {
            oauth_authorize_url: oauth_authorize_url.into(),
            api_base: api_base.into().trim_end_matches('/').to_string(),
            guild_roles_cache,
        }
    }

    /// Builds the Discord OAuth2 authorization URL with optional `state` JWT.
    pub fn authorize_url(&self, cfg: &Config, state: Option<&str>) -> anyhow::Result<String> {
        let mut parsed = Url::parse(&self.oauth_authorize_url)?;
        {
            let mut query = parsed.query_pairs_mut();
            query.append_pair("client_id", cfg.discord_client_id.as_deref().unwrap_or(""));
            query.append_pair(
                "redirect_uri",
                cfg.discord_redirect_uri.as_deref().unwrap_or(""),
            );
            query.append_pair("response_type", "code");
            query.append_pair("scope", "identify");
            if let Some(st) = state.filter(|s| !s.is_empty()) {
                query.append_pair("state", st);
            }
        }
        Ok(parsed.to_string())
    }

    /// Exchanges an OAuth2 authorization `code` for a Discord user `access_token`.
    pub async fn exchange_code(
        &self,
        http: &reqwest::Client,
        cfg: &Config,
        code: &str,
    ) -> Result<String, DiscordApiError> {
        let url = format!("{}/oauth2/token", self.api_base);
        let resp = http
            .post(&url)
            .form(&[
                ("client_id", cfg.discord_client_id.as_deref().unwrap_or("")),
                (
                    "client_secret",
                    cfg.discord_client_secret.as_deref().unwrap_or(""),
                ),
                ("grant_type", "authorization_code"),
                ("code", code),
                (
                    "redirect_uri",
                    cfg.discord_redirect_uri.as_deref().unwrap_or(""),
                ),
            ])
            .send()
            .await
            .map_err(|e| DiscordApiError::Message(format!("Lỗi xác thực Discord: {e}")))?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(DiscordApiError::Message(format!(
                "Lỗi xác thực Discord: {body}"
            )));
        }

        let token_data: DiscordTokenResponse = resp.json().await.map_err(|e| {
            DiscordApiError::Message(format!("Lỗi xác thực Discord: invalid token JSON: {e}"))
        })?;
        Ok(token_data.access_token)
    }

    /// Fetches the authenticated Discord user profile via `/users/@me`.
    pub async fn fetch_user_profile(
        &self,
        http: &reqwest::Client,
        access_token: &str,
    ) -> Result<DiscordUserProfile, DiscordApiError> {
        let url = format!("{}/users/@me", self.api_base);
        let resp = http
            .get(&url)
            .header(AUTHORIZATION, format!("Bearer {access_token}"))
            .send()
            .await
            .map_err(|e| {
                DiscordApiError::Message(format!("Lỗi lấy thông tin người dùng Discord: {e}"))
            })?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(DiscordApiError::Message(format!(
                "Lỗi lấy thông tin người dùng Discord: {body}"
            )));
        }

        resp.json::<DiscordUserProfile>().await.map_err(|e| {
            DiscordApiError::Message(format!(
                "Lỗi lấy thông tin người dùng Discord: invalid JSON: {e}"
            ))
        })
    }

    /// Fetches a Discord user's profile via Bot token (used by `/api/auth/discord/sync`).
    pub async fn fetch_user_profile_by_bot(
        &self,
        http: &reqwest::Client,
        cfg: &Config,
        discord_user_id: &str,
    ) -> Option<DiscordUserProfile> {
        let bot_token = cfg.discord_bot_token.as_deref().filter(|s| !s.is_empty())?;
        let url = format!("{}/users/{discord_user_id}", self.api_base);
        let resp = http
            .get(&url)
            .header(AUTHORIZATION, format!("Bot {bot_token}"))
            .send()
            .await
            .ok()?;

        if !resp.status().is_success() {
            return None;
        }

        resp.json::<DiscordUserProfile>().await.ok()
    }

    /// Checks guild membership and resolves the member's Discord role names.
    /// Fetches guild roles (cached 10m per `(api_base, guild_id)`) and member details concurrently.
    pub async fn fetch_guild_member_roles(
        &self,
        http: &reqwest::Client,
        cfg: &Config,
        discord_user_id: &str,
    ) -> Result<Vec<String>, DiscordApiError> {
        let (Some(bot_token), Some(guild_id)) = (
            cfg.discord_bot_token.as_deref().filter(|s| !s.is_empty()),
            cfg.discord_guild_id.as_deref().filter(|s| !s.is_empty()),
        ) else {
            tracing::warn!(
                "Discord BOT_TOKEN or GUILD_ID missing; bypassing guild check and returning Members."
            );
            return Ok(vec!["Members".to_string()]);
        };

        let roles_fut = self.fetch_guild_role_map(http, bot_token, guild_id);
        let member_fut = self.fetch_member_role_ids(http, bot_token, guild_id, discord_user_id);

        let (role_map_opt, member_role_ids) = tokio::try_join!(roles_fut, member_fut)?;

        let Some(role_map) = role_map_opt else {
            return Ok(vec!["Members".to_string()]);
        };

        Ok(member_role_ids
            .into_iter()
            .filter_map(|role_id| role_map.get(&role_id).cloned())
            .collect())
    }

    async fn fetch_guild_role_map(
        &self,
        http: &reqwest::Client,
        bot_token: &str,
        guild_id: &str,
    ) -> Result<Option<Arc<HashMap<String, String>>>, DiscordApiError> {
        let cache_key = (self.api_base.clone(), guild_id.to_string());
        if let Some(cached) = self.guild_roles_cache.get(&cache_key).await {
            return Ok(Some(cached));
        }

        let url = format!("{}/guilds/{guild_id}/roles", self.api_base);
        let resp = match http
            .get(&url)
            .header(AUTHORIZATION, format!("Bot {bot_token}"))
            .timeout(Duration::from_secs(10))
            .send()
            .await
        {
            Ok(resp) => resp,
            Err(err) => {
                tracing::error!(error = %err, "Failed to fetch Discord guild roles");
                return Ok(None);
            }
        };

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            tracing::error!(body = %body, "Failed to fetch Discord guild roles");
            return Ok(None);
        }

        let Ok(roles) = resp.json::<Vec<DiscordGuildRole>>().await else {
            tracing::error!("Invalid JSON from Discord guild roles endpoint");
            return Ok(None);
        };

        let map: Arc<HashMap<String, String>> =
            Arc::new(roles.into_iter().map(|r| (r.id, r.name)).collect());
        self.guild_roles_cache.insert(cache_key, map.clone()).await;
        Ok(Some(map))
    }

    async fn fetch_member_role_ids(
        &self,
        http: &reqwest::Client,
        bot_token: &str,
        guild_id: &str,
        discord_user_id: &str,
    ) -> Result<Vec<String>, DiscordApiError> {
        let url = format!(
            "{}/guilds/{guild_id}/members/{discord_user_id}",
            self.api_base
        );
        let resp = http
            .get(&url)
            .header(AUTHORIZATION, format!("Bot {bot_token}"))
            .timeout(Duration::from_secs(10))
            .send()
            .await
            .map_err(|e| {
                DiscordApiError::Message(format!("Lỗi kiểm tra thành viên server Discord: {e}"))
            })?;

        if resp.status().as_u16() == 404 {
            return Err(DiscordApiError::NotInServer);
        }

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(DiscordApiError::Message(format!(
                "Lỗi kiểm tra thành viên server Discord: {body}"
            )));
        }

        let member: DiscordGuildMember = resp.json().await.map_err(|e| {
            DiscordApiError::Message(format!(
                "Lỗi kiểm tra thành viên server Discord: invalid JSON: {e}"
            ))
        })?;
        Ok(member.roles)
    }
}

/// Builds the Discord CDN avatar URL (or deterministic default embed avatar when `avatar_hash` is absent).
pub fn build_discord_avatar_url(discord_id: &str, avatar_hash: Option<&str>) -> String {
    match avatar_hash.map(str::trim).filter(|h| !h.is_empty()) {
        Some(hash) => format!("https://cdn.discordapp.com/avatars/{discord_id}/{hash}.png"),
        None => {
            let id_num: u64 = discord_id.parse().unwrap_or(0);
            let index = (id_num >> 22) % 6;
            format!("https://cdn.discordapp.com/embed/avatars/{index}.png")
        }
    }
}

/// Builds the Discord webhook embed payload for `notify_new_user`, matching `DiscordService.notify_new_user`.
pub fn build_new_user_webhook_payload(username: &str, uuid: Option<&str>) -> Value {
    let timestamp = OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .unwrap_or_default();
    let uuid_display = uuid.filter(|u| !u.is_empty()).unwrap_or("Chưa liên kết");

    json!({
        "embeds": [
            {
                "title": "🎉 Thành viên mới đăng ký!",
                "description": format!(
                    "Chào mừng **{username}** đã đăng ký tài khoản thành công trên hệ thống Web Portal."
                ),
                "color": 3_447_003,
                "fields": [
                    { "name": "Tên nhân vật", "value": username, "inline": true },
                    { "name": "UUID", "value": uuid_display, "inline": true }
                ],
                "timestamp": timestamp
            }
        ]
    })
}
