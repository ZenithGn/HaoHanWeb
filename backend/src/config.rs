use std::collections::HashMap;
use std::fmt;

use anyhow::{Result, bail};
use axum::http::HeaderValue;

const DEFAULT_DEV_JWT_SECRET: &str = "super_secret_jwt_key_987";
const DEFAULT_DEV_GAME_SERVER_TOKEN: &str = "super_secure_server_token_123";
const DEFAULT_FRONTEND_FALLBACK: &str = "https://web.haohansmp.io.vn";
const DEFAULT_DEV_CORS_ORIGIN: &str = "http://localhost:3000";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AppEnv {
    Development,
    Production,
    Test,
}

impl AppEnv {
    pub fn parse(raw: &str) -> Self {
        match raw.trim().to_ascii_lowercase().as_str() {
            "production" | "prod" => Self::Production,
            "test" => Self::Test,
            _ => Self::Development,
        }
    }

    pub fn is_production(self) -> bool {
        self == Self::Production
    }
}

#[derive(Clone)]
pub struct Config {
    pub app_env: AppEnv,
    pub port: u16,
    pub bind_addr: String,
    pub database_url: String,
    pub frontend_urls: Vec<String>,
    pub public_api_url: Option<String>,
    pub jwt_secret: String,
    pub game_server_token: String,

    // Discord
    pub discord_client_id: Option<String>,
    pub discord_client_secret: Option<String>,
    pub discord_redirect_uri: Option<String>,
    pub discord_bot_token: Option<String>,
    pub discord_guild_id: Option<String>,
    pub discord_webhook_url: Option<String>,
    pub discord_donation_channel_id: Option<String>,
    pub discord_donation_auto_refresh: bool,
    pub discord_donation_refresh_interval_seconds: u64,

    // PayOS (scratch cards removed)
    pub payos_client_id: Option<String>,
    pub payos_api_key: Option<String>,
    pub payos_checksum_key: Option<String>,

    // Minecraft
    pub minecraft_host: String,
    pub minecraft_port: u16,
    pub rcon_host: String,
    pub rcon_port: u16,
    pub rcon_password: Option<String>,
    pub status_poll_interval_seconds: u64,

    // Cloudinary
    pub cloudinary_cloud_name: Option<String>,
    pub cloudinary_api_key: Option<String>,
    pub cloudinary_api_secret: Option<String>,

    // HTTP & security controls
    pub rate_limit_enabled: bool,
    pub body_limit_bytes: usize,
    pub request_timeout_secs: u64,
}

impl fmt::Debug for Config {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Config")
            .field("app_env", &self.app_env)
            .field("port", &self.port)
            .field("bind_addr", &self.bind_addr)
            .field("database_url", &self.database_url)
            .field("frontend_urls", &self.frontend_urls)
            .field("public_api_url", &self.public_api_url)
            .field("jwt_secret", &"[REDACTED]")
            .field("game_server_token", &"[REDACTED]")
            .field("discord_client_id", &self.discord_client_id)
            .field(
                "discord_client_secret",
                &self.discord_client_secret.as_ref().map(|_| "[REDACTED]"),
            )
            .field("discord_redirect_uri", &self.discord_redirect_uri)
            .field(
                "discord_bot_token",
                &self.discord_bot_token.as_ref().map(|_| "[REDACTED]"),
            )
            .field("discord_guild_id", &self.discord_guild_id)
            .field(
                "discord_webhook_url",
                &self.discord_webhook_url.as_ref().map(|_| "[REDACTED]"),
            )
            .field(
                "discord_donation_channel_id",
                &self.discord_donation_channel_id,
            )
            .field(
                "discord_donation_auto_refresh",
                &self.discord_donation_auto_refresh,
            )
            .field(
                "discord_donation_refresh_interval_seconds",
                &self.discord_donation_refresh_interval_seconds,
            )
            .field("payos_client_id", &self.payos_client_id)
            .field(
                "payos_api_key",
                &self.payos_api_key.as_ref().map(|_| "[REDACTED]"),
            )
            .field(
                "payos_checksum_key",
                &self.payos_checksum_key.as_ref().map(|_| "[REDACTED]"),
            )
            .field("minecraft_host", &self.minecraft_host)
            .field("minecraft_port", &self.minecraft_port)
            .field("rcon_host", &self.rcon_host)
            .field("rcon_port", &self.rcon_port)
            .field(
                "rcon_password",
                &self.rcon_password.as_ref().map(|_| "[REDACTED]"),
            )
            .field(
                "status_poll_interval_seconds",
                &self.status_poll_interval_seconds,
            )
            .field("cloudinary_cloud_name", &self.cloudinary_cloud_name)
            .field("cloudinary_api_key", &self.cloudinary_api_key)
            .field(
                "cloudinary_api_secret",
                &self.cloudinary_api_secret.as_ref().map(|_| "[REDACTED]"),
            )
            .field("rate_limit_enabled", &self.rate_limit_enabled)
            .field("body_limit_bytes", &self.body_limit_bytes)
            .field("request_timeout_secs", &self.request_timeout_secs)
            .finish()
    }
}

impl Config {
    pub fn from_env() -> Result<Self> {
        Self::from_lookup(|k| std::env::var(k).ok())
    }

    pub fn from_pairs<'a>(pairs: impl IntoIterator<Item = (&'a str, &'a str)>) -> Result<Self> {
        let map: HashMap<String, String> = pairs
            .into_iter()
            .map(|(k, v)| (k.to_string(), v.to_string()))
            .collect();
        Self::from_lookup(|k| map.get(k).cloned())
    }

    pub fn from_lookup<F>(get: F) -> Result<Self>
    where
        F: Fn(&str) -> Option<String>,
    {
        let non_empty = |key: &str| -> Option<String> {
            get(key)
                .map(|v| v.trim().to_string())
                .filter(|v| !v.is_empty())
        };

        let env_raw = non_empty("APP_ENV")
            .or_else(|| non_empty("RAILS_ENV"))
            .unwrap_or_else(|| "development".to_string());
        let app_env = AppEnv::parse(&env_raw);

        let jwt_secret = match non_empty("JWT_SECRET") {
            Some(v) => v,
            None if app_env.is_production() => {
                bail!("JWT_SECRET is required when APP_ENV=production")
            }
            None => DEFAULT_DEV_JWT_SECRET.to_string(),
        };

        let game_server_token = match non_empty("GAME_SERVER_TOKEN") {
            Some(v) => v,
            None if app_env.is_production() => {
                bail!("GAME_SERVER_TOKEN is required when APP_ENV=production")
            }
            None => DEFAULT_DEV_GAME_SERVER_TOKEN.to_string(),
        };

        let port: u16 = match non_empty("PORT") {
            Some(p) => p
                .parse()
                .map_err(|e| anyhow::anyhow!("Invalid PORT '{p}': {e}"))?,
            None => 3001,
        };

        let bind_addr = non_empty("BIND_ADDR").unwrap_or_else(|| format!("0.0.0.0:{port}"));
        let database_url =
            non_empty("DATABASE_URL").unwrap_or_else(|| "sqlite://data/haohan.db".to_string());

        let frontend_urls = non_empty("FRONTEND_URL")
            .map(|raw| {
                raw.split(',')
                    .map(|part| part.trim().trim_end_matches('/').to_string())
                    .filter(|part| !part.is_empty())
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();

        let public_api_url =
            non_empty("PUBLIC_API_URL").map(|u| u.trim_end_matches('/').to_string());

        let discord_bot_token = non_empty("DISCORD_BOT_TOKEN").map(|tok| {
            if tok
                .get(..4)
                .is_some_and(|prefix| prefix.eq_ignore_ascii_case("bot "))
            {
                tok[4..].trim().to_string()
            } else {
                tok
            }
        });

        let discord_donation_channel_id = non_empty("DISCORD_DONATION_CHANNEL_ID")
            .or_else(|| non_empty("DISCORD_SUPPORTERS_CHANNEL_ID"));

        let discord_donation_auto_refresh = non_empty("DISCORD_DONATION_AUTO_REFRESH")
            .is_some_and(|v| matches!(v.to_ascii_lowercase().as_str(), "1" | "true" | "yes"));

        let discord_donation_refresh_interval_seconds = parse_u64_or(
            &non_empty("DISCORD_DONATION_REFRESH_INTERVAL_SECONDS"),
            86_400,
        )?;

        let minecraft_host = non_empty("MINECRAFT_HOST").unwrap_or_else(|| "127.0.0.1".to_string());
        let minecraft_port = parse_u16_or(&non_empty("MINECRAFT_PORT"), 25_565)?;
        let rcon_host = non_empty("RCON_HOST").unwrap_or_else(|| "127.0.0.1".to_string());
        let rcon_port = parse_u16_or(&non_empty("RCON_PORT"), 25_575)?;
        let status_poll_interval_seconds =
            parse_u64_or(&non_empty("STATUS_POLL_INTERVAL_SECONDS"), 10)?.max(1);

        let rate_limit_enabled = non_empty("RATE_LIMIT_ENABLED")
            .map(|v| !matches!(v.to_ascii_lowercase().as_str(), "0" | "false" | "no"))
            .unwrap_or(true);

        Ok(Self {
            app_env,
            port,
            bind_addr,
            database_url,
            frontend_urls,
            public_api_url,
            jwt_secret,
            game_server_token,
            discord_client_id: non_empty("DISCORD_CLIENT_ID"),
            discord_client_secret: non_empty("DISCORD_CLIENT_SECRET"),
            discord_redirect_uri: non_empty("DISCORD_REDIRECT_URI"),
            discord_bot_token,
            discord_guild_id: non_empty("DISCORD_GUILD_ID"),
            discord_webhook_url: non_empty("DISCORD_WEBHOOK_URL"),
            discord_donation_channel_id,
            discord_donation_auto_refresh,
            discord_donation_refresh_interval_seconds,
            payos_client_id: non_empty("PAYOS_CLIENT_ID"),
            payos_api_key: non_empty("PAYOS_API_KEY"),
            payos_checksum_key: non_empty("PAYOS_CHECKSUM_KEY"),
            minecraft_host,
            minecraft_port,
            rcon_host,
            rcon_port,
            rcon_password: non_empty("RCON_PASSWORD"),
            status_poll_interval_seconds,
            cloudinary_cloud_name: non_empty("CLOUDINARY_CLOUD_NAME"),
            cloudinary_api_key: non_empty("CLOUDINARY_API_KEY"),
            cloudinary_api_secret: non_empty("CLOUDINARY_API_SECRET"),
            rate_limit_enabled,
            body_limit_bytes: 64 * 1024,
            request_timeout_secs: 15,
        })
    }

    pub fn for_test() -> Self {
        Self::from_pairs([
            ("APP_ENV", "test"),
            ("JWT_SECRET", "test_jwt_secret_key"),
            ("GAME_SERVER_TOKEN", "test_game_server_token"),
            ("FRONTEND_URL", "http://localhost:3000"),
            ("RATE_LIMIT_ENABLED", "false"),
        ])
        .expect("default test config must be valid")
    }

    pub fn is_production(&self) -> bool {
        self.app_env.is_production()
    }

    pub fn primary_frontend_url(&self) -> &str {
        self.frontend_urls
            .first()
            .map(String::as_str)
            .unwrap_or(DEFAULT_FRONTEND_FALLBACK)
    }

    pub fn cors_origin_strings(&self) -> Vec<String> {
        let mut origins = self.frontend_urls.clone();
        if !self.is_production() && !origins.iter().any(|o| o == DEFAULT_DEV_CORS_ORIGIN) {
            origins.push(DEFAULT_DEV_CORS_ORIGIN.to_string());
        }
        origins
    }

    pub fn cors_header_values(&self) -> Vec<HeaderValue> {
        self.cors_origin_strings()
            .into_iter()
            .filter_map(|origin| match HeaderValue::from_str(&origin) {
                Ok(val) => Some(val),
                Err(err) => {
                    tracing::warn!(origin = %origin, error = %err, "Ignoring invalid CORS origin");
                    None
                }
            })
            .collect()
    }
}

fn parse_u16_or(val: &Option<String>, default: u16) -> Result<u16> {
    match val {
        Some(raw) => raw
            .parse()
            .map_err(|e| anyhow::anyhow!("Invalid u16 value '{raw}': {e}")),
        None => Ok(default),
    }
}

fn parse_u64_or(val: &Option<String>, default: u64) -> Result<u64> {
    match val {
        Some(raw) => raw
            .parse()
            .map_err(|e| anyhow::anyhow!("Invalid u64 value '{raw}': {e}")),
        None => Ok(default),
    }
}
