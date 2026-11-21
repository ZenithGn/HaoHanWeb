use std::collections::{HashMap, HashSet};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use anyhow::bail;
use bytes::Bytes;
use serde::Serialize;
use serde_json::Value;
use sqlx::Row;
use time::OffsetDateTime;
use time::format_description::well_known::Rfc3339;

use crate::db::cache::{
    CachedDiscordProfile, SUPPORTERS_DISCORD_CACHE_KEY, SUPPORTERS_REFRESH_COOLDOWN_KEY,
    get_discord_profiles, get_kv, minotar_avatar_url, query_leaderboards,
    query_success_donations_grouped, set_kv, upsert_discord_profile,
};
use crate::db::donations::ImmediateTx;
use crate::domain::supporters_parser::{
    DiscordMessageInput, MentionProfile, ParsedSupportersPayload, SupporterEntry,
    SupporterPageSummary, build_supporters_payload, manual_messages_input, merge_supporters,
};
use crate::error::AppError;
use crate::state::AppState;

pub const DEFAULT_DISCORD_API_BASE: &str = "https://discord.com/api/v10";
pub const DISCORD_CACHE_TTL_SECS: i64 = 24 * 3600;
pub const DISCORD_PROFILE_TTL_SECS: i64 = 6 * 3600;
pub const REFRESH_COOLDOWN_SECS: i64 = 60;
pub const MAX_MESSAGES_TO_SCAN: usize = 500;

/// Optional axum `Extension` used by integration tests to override Discord REST API base URL.
#[derive(Debug, Clone)]
pub struct DiscordApiBaseUrl(pub String);

#[derive(Debug, Clone, Serialize)]
pub struct SupportersResponse {
    pub supporters: Vec<SupporterEntry>,
    pub pages: Vec<SupporterPageSummary>,
    pub source: String,
    pub updated_at: String,
    pub cache: String,
}

fn now_unix_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}

fn now_iso8601() -> String {
    OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .unwrap_or_else(|_| "1970-01-01T00:00:00Z".to_string())
}

fn discord_configured(state: &AppState) -> bool {
    state
        .cfg
        .discord_bot_token
        .as_deref()
        .map(str::trim)
        .is_some_and(|s| !s.is_empty())
        && state
            .cfg
            .discord_donation_channel_id
            .as_deref()
            .map(str::trim)
            .is_some_and(|s| !s.is_empty())
}

fn discord_avatar_url(id: &str, avatar_hash: Option<&str>) -> String {
    match avatar_hash.map(str::trim).filter(|s| !s.is_empty()) {
        Some(hash) => {
            let ext = if hash.starts_with("a_") { "gif" } else { "png" };
            format!("https://cdn.discordapp.com/avatars/{id}/{hash}.{ext}?size=96")
        }
        None => {
            let idx = (id.parse::<u64>().unwrap_or(0) >> 22) % 6;
            format!("https://cdn.discordapp.com/embed/avatars/{idx}.png")
        }
    }
}

fn discord_banner_url(id: &str, banner_hash: Option<&str>) -> Option<String> {
    banner_hash
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|hash| {
            let ext = if hash.starts_with("a_") { "gif" } else { "png" };
            format!("https://cdn.discordapp.com/banners/{id}/{hash}.{ext}?size=512")
        })
}

fn non_empty_json_str<'a>(val: &'a Value, key: &str) -> Option<&'a str> {
    val.get(key)
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|s| !s.is_empty())
}

fn cached_profile_from_discord_json(
    id: &str,
    json: &Value,
    fetched_at: i64,
) -> CachedDiscordProfile {
    let display_name = non_empty_json_str(json, "global_name")
        .or_else(|| non_empty_json_str(json, "username"))
        .map(ToString::to_string);
    let avatar_url = Some(discord_avatar_url(id, non_empty_json_str(json, "avatar")));
    let banner_url = discord_banner_url(id, non_empty_json_str(json, "banner"));
    let accent_color = json.get("accent_color").and_then(Value::as_i64);

    CachedDiscordProfile {
        discord_id: id.to_string(),
        display_name,
        avatar_url,
        banner_url,
        accent_color,
        fetched_at,
    }
}

async fn fetch_discord_user_raw(
    state: &AppState,
    api_base: &str,
    bot_token: &str,
    user_id: &str,
) -> Option<Value> {
    let url = format!("{}/users/{user_id}", api_base.trim_end_matches('/'));
    let resp = state
        .http
        .get(&url)
        .header("Authorization", format!("Bot {bot_token}"))
        .timeout(Duration::from_secs(10))
        .send()
        .await;

    match resp {
        Ok(r) if r.status().is_success() => r.json::<Value>().await.ok(),
        Ok(r) => {
            tracing::warn!(user_id = %user_id, status = %r.status(), "Discord user fetch failed");
            None
        }
        Err(err) => {
            tracing::warn!(user_id = %user_id, error = %err, "Discord user fetch request failed");
            None
        }
    }
}

/// Resolves Discord profiles for `discord_ids` using `discord_profiles` table (6h TTL)
/// and Discord Bot API for missing or stale entries.
async fn resolve_discord_profiles(
    state: &AppState,
    api_base: &str,
    discord_ids: &[String],
    allow_network: bool,
) -> HashMap<String, CachedDiscordProfile> {
    let mut unique_ids = Vec::new();
    let mut seen = HashSet::new();
    for id in discord_ids {
        let trimmed = id.trim();
        if !trimmed.is_empty() && seen.insert(trimmed.to_string()) {
            unique_ids.push(trimmed.to_string());
        }
    }

    let mut profiles = match get_discord_profiles(&state.db.read, &unique_ids).await {
        Ok(map) => map,
        Err(err) => {
            tracing::warn!(error = %err, "Failed to query cached discord_profiles");
            HashMap::new()
        }
    };

    if !allow_network {
        return profiles;
    }

    let Some(bot_token) = state
        .cfg
        .discord_bot_token
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
    else {
        return profiles;
    };

    let now = now_unix_secs();
    for id in unique_ids {
        let fresh = profiles
            .get(&id)
            .is_some_and(|p| now.saturating_sub(p.fetched_at) < DISCORD_PROFILE_TTL_SECS);
        if fresh {
            continue;
        }

        if let Some(json) = fetch_discord_user_raw(state, api_base, bot_token, &id).await {
            let profile = cached_profile_from_discord_json(&id, &json, now);
            if let Err(err) = upsert_discord_profile(&state.db.write, &profile).await {
                tracing::warn!(discord_id = %id, error = %err, "Failed to cache discord_profile");
            }
            profiles.insert(id, profile);
        }
    }

    profiles
}

async fn fetch_discord_channel_messages(
    state: &AppState,
    api_base: &str,
) -> anyhow::Result<Vec<DiscordMessageInput>> {
    let bot_token = state
        .cfg
        .discord_bot_token
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .ok_or_else(|| anyhow::anyhow!("DISCORD_BOT_TOKEN not configured"))?;
    let channel_id = state
        .cfg
        .discord_donation_channel_id
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .ok_or_else(|| anyhow::anyhow!("DISCORD_DONATION_CHANNEL_ID not configured"))?;

    let base = api_base.trim_end_matches('/');
    let mut messages = Vec::new();
    let mut before: Option<String> = None;
    let mut memo_profiles: HashMap<String, CachedDiscordProfile> = HashMap::new();

    while messages.len() < MAX_MESSAGES_TO_SCAN {
        let limit = (MAX_MESSAGES_TO_SCAN - messages.len()).min(100);
        let mut req = state
            .http
            .get(format!("{base}/channels/{channel_id}/messages"))
            .header("Authorization", format!("Bot {bot_token}"))
            .query(&[("limit", limit.to_string())])
            .timeout(Duration::from_secs(12));
        if let Some(ref b) = before {
            req = req.query(&[("before", b.as_str())]);
        }

        let resp = req.send().await?;
        let status = resp.status();
        if !status.is_success() {
            let body = resp.text().await.unwrap_or_default();
            bail!("Discord API {status}: {body}");
        }

        let batch: Vec<Value> = resp.json().await?;
        if batch.is_empty() {
            break;
        }

        // Collect all mention IDs in this batch and warm/resolve profiles.
        let mention_ids: Vec<String> = batch
            .iter()
            .filter_map(|m| m.get("mentions").and_then(Value::as_array))
            .flatten()
            .filter_map(|mention| non_empty_json_str(mention, "id").map(ToString::to_string))
            .filter(|id| !memo_profiles.contains_key(id))
            .collect();
        if !mention_ids.is_empty() {
            let fetched = resolve_discord_profiles(state, api_base, &mention_ids, true).await;
            memo_profiles.extend(fetched);
        }

        for msg in &batch {
            let content = msg
                .get("content")
                .and_then(Value::as_str)
                .unwrap_or("")
                .to_string();

            let mut mentions = Vec::new();
            if let Some(raw_mentions) = msg.get("mentions").and_then(Value::as_array) {
                for mention in raw_mentions {
                    let Some(id) = non_empty_json_str(mention, "id") else {
                        continue;
                    };
                    let profile = memo_profiles.get(id);
                    let name = non_empty_json_str(mention, "global_name")
                        .or_else(|| non_empty_json_str(mention, "username"))
                        .or_else(|| profile.and_then(|p| p.display_name.as_deref()))
                        .unwrap_or(id)
                        .to_string();
                    let avatar_url =
                        profile
                            .and_then(|p| p.avatar_url.clone())
                            .unwrap_or_else(|| {
                                discord_avatar_url(id, non_empty_json_str(mention, "avatar"))
                            });
                    let banner_url = profile.and_then(|p| p.banner_url.clone());
                    let accent_color = profile.and_then(|p| p.accent_color);

                    mentions.push(MentionProfile {
                        discord_id: id.to_string(),
                        name,
                        avatar_url: Some(avatar_url),
                        banner_url,
                        accent_color,
                    });
                }
            }

            messages.push(DiscordMessageInput { content, mentions });
        }

        before = batch
            .last()
            .and_then(|m| non_empty_json_str(m, "id"))
            .map(ToString::to_string);
        if before.is_none() {
            break;
        }
    }

    Ok(messages)
}

/// Refreshes the Discord channel supporters list (or manual fallback when unconfigured)
/// and writes it into `kv_cache` (`supporters:discord`).
pub async fn refresh_discord_supporters_cache(
    state: &AppState,
    discord_api_base: Option<&str>,
) -> ParsedSupportersPayload {
    let api_base = discord_api_base
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or(DEFAULT_DISCORD_API_BASE);

    let payload = if discord_configured(state) {
        match fetch_discord_channel_messages(state, api_base).await {
            Ok(messages) => build_supporters_payload(&messages, "discord", now_iso8601()),
            Err(err) => {
                tracing::error!(error = %err, "Discord donation supporters refresh failed");
                read_kv_supporters(state)
                    .await
                    .map(|(p, _)| p)
                    .unwrap_or_else(|| {
                        build_supporters_payload(&manual_messages_input(), "manual", now_iso8601())
                    })
            }
        }
    } else {
        build_supporters_payload(&manual_messages_input(), "manual", now_iso8601())
    };

    if let Ok(bytes) = serde_json::to_vec(&payload)
        && let Err(err) = set_kv(
            &state.db.write,
            SUPPORTERS_DISCORD_CACHE_KEY,
            &bytes,
            now_unix_secs(),
        )
        .await
    {
        tracing::warn!(error = %err, "Failed to persist supporters:discord into kv_cache");
    }

    payload
}

async fn read_kv_supporters(state: &AppState) -> Option<(ParsedSupportersPayload, i64)> {
    let entry = get_kv(&state.db.read, SUPPORTERS_DISCORD_CACHE_KEY)
        .await
        .ok()
        .flatten()?;
    let parsed = serde_json::from_slice::<ParsedSupportersPayload>(&entry.value).ok()?;
    Some((parsed, entry.updated_at))
}

async fn build_db_donation_supporters(
    state: &AppState,
    api_base: &str,
    allow_profile_network: bool,
) -> Vec<SupporterEntry> {
    let grouped = match query_success_donations_grouped(&state.db.read).await {
        Ok(rows) => rows,
        Err(err) => {
            tracing::warn!(error = %err, "Could not query database donation supporters");
            return Vec::new();
        }
    };

    let discord_ids: Vec<String> = grouped
        .iter()
        .filter_map(|r| r.discord_id.as_deref())
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(ToString::to_string)
        .collect();

    let profiles =
        resolve_discord_profiles(state, api_base, &discord_ids, allow_profile_network).await;

    grouped
        .into_iter()
        .map(|row| {
            let discord_id = row
                .discord_id
                .as_deref()
                .map(str::trim)
                .filter(|s| !s.is_empty())
                .map(ToString::to_string);
            let profile = discord_id.as_deref().and_then(|id| profiles.get(id));

            let display_name = profile
                .and_then(|p| p.display_name.clone())
                .filter(|s| !s.trim().is_empty())
                .unwrap_or_else(|| row.username.clone());

            let avatar_url = profile
                .and_then(|p| p.avatar_url.clone())
                .or_else(|| row.avatar_url.filter(|s| !s.trim().is_empty()))
                .or_else(|| Some(minotar_avatar_url(&row.username)));

            let banner_url = profile.and_then(|p| p.banner_url.clone());
            let accent_color = profile.and_then(|p| p.accent_color);

            SupporterEntry {
                display_name,
                username: row.username.clone(),
                minecraft_name: Some(row.username),
                discord_id,
                role: "Donator".to_string(),
                amount: row.amount,
                entries: row.entries,
                avatar_url,
                banner_url,
                accent_color,
            }
        })
        .collect()
}

pub async fn build_supporters_response(
    state: &AppState,
    base_payload: ParsedSupportersPayload,
    cache_label: &str,
    discord_api_base: Option<&str>,
    allow_profile_network: bool,
) -> SupportersResponse {
    let api_base = discord_api_base
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or(DEFAULT_DISCORD_API_BASE);

    let db_supporters = build_db_donation_supporters(state, api_base, allow_profile_network).await;
    let mut combined = base_payload.supporters;
    combined.extend(db_supporters);
    let merged = merge_supporters(combined);

    let source = if base_payload.source.contains("database") {
        base_payload.source
    } else {
        format!("{}+database", base_payload.source)
    };

    SupportersResponse {
        supporters: merged,
        pages: base_payload.pages,
        source,
        updated_at: base_payload.updated_at,
        cache: cache_label.to_string(),
    }
}

/// Rebuilds the `state.leaderboards` `ArcSwap<Bytes>` snapshot from SQLite read pool.
pub async fn rebuild_leaderboards_snapshot(state: &AppState) -> Result<Bytes, AppError> {
    let snapshot = query_leaderboards(&state.db.read).await?;
    let vec = serde_json::to_vec(&snapshot).map_err(|e| {
        AppError::Internal(anyhow::anyhow!("Failed to serialize leaderboards: {e}"))
    })?;
    let bytes = Bytes::from(vec);
    state.leaderboards.store(bytes.clone().into());
    Ok(bytes)
}

/// Rebuilds the `state.supporters` `ArcSwap<Bytes>` snapshot using `kv_cache` (or `MANUAL_MESSAGES`
/// fallback) combined with SQLite `GROUP BY` `donations` and cached `discord_profiles`.
pub async fn rebuild_supporters_snapshot(
    state: &AppState,
    discord_api_base: Option<&str>,
    allow_profile_network: bool,
) -> Result<Bytes, AppError> {
    let (base_payload, cache_label) = match read_kv_supporters(state).await {
        Some((payload, _updated_at)) => (payload, "hit"),
        None => (
            build_supporters_payload(&manual_messages_input(), "manual", now_iso8601()),
            "fallback",
        ),
    };

    let response = build_supporters_response(
        state,
        base_payload,
        cache_label,
        discord_api_base,
        allow_profile_network,
    )
    .await;

    let vec = serde_json::to_vec(&response)
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to serialize supporters: {e}")))?;
    let bytes = Bytes::from(vec);
    state.supporters.store(bytes.clone().into());
    Ok(bytes)
}

/// Checks and atomically records the 60s global cooldown for `?refresh=true` inside `kv_cache`.
/// Returns `Ok(())` if refresh is permitted, or `Err(retry_after_secs)` if cooling down.
pub async fn try_acquire_refresh_cooldown(state: &AppState) -> Result<(), AppError> {
    let now = now_unix_secs();
    let mut tx = ImmediateTx::begin(&state.db.write)
        .await
        .map_err(anyhow::Error::from)?;

    let res: Result<Option<i64>, AppError> = async {
        let last_ts: Option<i64> = sqlx::query("SELECT value FROM kv_cache WHERE key = ?1")
            .bind(SUPPORTERS_REFRESH_COOLDOWN_KEY)
            .fetch_optional(tx.conn())
            .await?
            .and_then(|row| row.try_get::<Vec<u8>, _>("value").ok())
            .and_then(|bytes| String::from_utf8(bytes).ok())
            .and_then(|s| s.trim().parse::<i64>().ok());

        if let Some(prev) = last_ts {
            let elapsed = now.saturating_sub(prev);
            if elapsed < REFRESH_COOLDOWN_SECS {
                return Ok(Some((REFRESH_COOLDOWN_SECS - elapsed).max(1)));
            }
        }

        sqlx::query(
            "INSERT INTO kv_cache (key, value, updated_at) VALUES (?1, ?2, ?3) \
             ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
        )
        .bind(SUPPORTERS_REFRESH_COOLDOWN_KEY)
        .bind(now.to_string().into_bytes())
        .bind(now)
        .execute(tx.conn())
        .await?;

        Ok(None)
    }
    .await;

    match res {
        Ok(None) => {
            tx.commit().await.map_err(anyhow::Error::from)?;
            Ok(())
        }
        Ok(Some(retry_after)) => {
            let _ = tx.rollback().await;
            Err(AppError::TooManyRequests(format!(
                "Vui lòng đợi {retry_after} giây trước khi làm mới lại!"
            )))
        }
        Err(err) => {
            let _ = tx.rollback().await;
            Err(err)
        }
    }
}

/// Checks if the cached `kv_cache` Discord supporters entry is missing, expired (>24h),
/// or stale (Discord configured while cache is `manual`, or entries lack `avatar_url`).
pub async fn is_supporters_kv_stale(state: &AppState) -> bool {
    let Some((payload, updated_at)) = read_kv_supporters(state).await else {
        return true;
    };
    let age = now_unix_secs().saturating_sub(updated_at);
    if age >= DISCORD_CACHE_TTL_SECS {
        return true;
    }
    if discord_configured(state) && payload.source == "manual" {
        return true;
    }
    !payload.supporters.is_empty()
        && payload
            .supporters
            .iter()
            .all(|s| s.avatar_url.as_deref().is_none_or(str::is_empty))
}

/// Force-refreshes Discord supporters + merges DB donations + updates `state.supporters`.
pub async fn force_refresh_supporters(
    state: &AppState,
    discord_api_base: Option<&str>,
) -> Result<Bytes, AppError> {
    try_acquire_refresh_cooldown(state).await?;

    let base_payload = refresh_discord_supporters_cache(state, discord_api_base).await;
    let response =
        build_supporters_response(state, base_payload, "hit", discord_api_base, true).await;

    let vec = serde_json::to_vec(&response)
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to serialize supporters: {e}")))?;
    let bytes = Bytes::from(vec);
    state.supporters.store(bytes.clone().into());
    Ok(bytes)
}
