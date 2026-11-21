use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};

pub const SUPPORTERS_DISCORD_CACHE_KEY: &str = "supporters:discord";
pub const SUPPORTERS_REFRESH_COOLDOWN_KEY: &str = "supporters:refresh_cooldown";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct TopDonorRow {
    pub username: String,
    pub uuid: Option<String>,
    pub total_donated: i64,
    pub role: String,
    pub avatar_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct TopPlaytimeRow {
    pub username: String,
    pub uuid: Option<String>,
    pub play_time: i64,
    pub role: String,
    pub avatar_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct LeaderboardsSnapshot {
    pub top_donors: Vec<TopDonorRow>,
    pub top_playtime: Vec<TopPlaytimeRow>,
}

pub fn minotar_avatar_url(username: &str) -> String {
    format!("https://minotar.net/avatar/{username}/120")
}

fn resolve_avatar(avatar_url: Option<String>, username: &str) -> String {
    avatar_url
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| minotar_avatar_url(username))
}

pub async fn query_leaderboards(pool: &SqlitePool) -> Result<LeaderboardsSnapshot, sqlx::Error> {
    let donor_rows = sqlx::query(
        "SELECT username, uuid, total_donated, role, avatar_url \
         FROM players \
         WHERE total_donated > 0 \
         ORDER BY total_donated DESC, id ASC \
         LIMIT 10",
    )
    .fetch_all(pool)
    .await?;

    let mut top_donors = Vec::with_capacity(donor_rows.len());
    for row in donor_rows {
        let username: String = row.try_get("username")?;
        let avatar_url = resolve_avatar(row.try_get("avatar_url")?, &username);
        top_donors.push(TopDonorRow {
            username,
            uuid: row.try_get("uuid")?,
            total_donated: row.try_get("total_donated")?,
            role: row.try_get("role")?,
            avatar_url,
        });
    }

    let playtime_rows = sqlx::query(
        "SELECT username, uuid, play_time, role, avatar_url \
         FROM players \
         WHERE play_time > 0 \
         ORDER BY play_time DESC, id ASC \
         LIMIT 10",
    )
    .fetch_all(pool)
    .await?;

    let mut top_playtime = Vec::with_capacity(playtime_rows.len());
    for row in playtime_rows {
        let username: String = row.try_get("username")?;
        let avatar_url = resolve_avatar(row.try_get("avatar_url")?, &username);
        top_playtime.push(TopPlaytimeRow {
            username,
            uuid: row.try_get("uuid")?,
            play_time: row.try_get("play_time")?,
            role: row.try_get("role")?,
            avatar_url,
        });
    }

    Ok(LeaderboardsSnapshot {
        top_donors,
        top_playtime,
    })
}

#[derive(Debug, Clone)]
pub struct KvCacheEntry {
    pub value: Vec<u8>,
    pub updated_at: i64,
}

pub async fn get_kv(pool: &SqlitePool, key: &str) -> Result<Option<KvCacheEntry>, sqlx::Error> {
    let row = sqlx::query("SELECT value, updated_at FROM kv_cache WHERE key = ?1")
        .bind(key)
        .fetch_optional(pool)
        .await?;

    let Some(row) = row else {
        return Ok(None);
    };

    Ok(Some(KvCacheEntry {
        value: row.try_get("value")?,
        updated_at: row.try_get("updated_at")?,
    }))
}

pub async fn set_kv(
    pool: &SqlitePool,
    key: &str,
    value: &[u8],
    updated_at: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO kv_cache (key, value, updated_at) VALUES (?1, ?2, ?3) \
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    )
    .bind(key)
    .bind(value)
    .bind(updated_at)
    .execute(pool)
    .await?;

    Ok(())
}

#[derive(Debug, Clone)]
pub struct CachedDiscordProfile {
    pub discord_id: String,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    pub banner_url: Option<String>,
    pub accent_color: Option<i64>,
    pub fetched_at: i64,
}

pub async fn get_discord_profiles(
    pool: &SqlitePool,
    discord_ids: &[String],
) -> Result<HashMap<String, CachedDiscordProfile>, sqlx::Error> {
    if discord_ids.is_empty() {
        return Ok(HashMap::new());
    }

    let placeholders: String = (1..=discord_ids.len())
        .map(|i| format!("?{i}"))
        .collect::<Vec<_>>()
        .join(", ");
    let sql = format!(
        "SELECT discord_id, display_name, avatar_url, banner_url, accent_color, fetched_at \
         FROM discord_profiles WHERE discord_id IN ({placeholders})"
    );

    let mut query = sqlx::query(&sql);
    for id in discord_ids {
        query = query.bind(id);
    }

    let rows = query.fetch_all(pool).await?;
    let mut out = HashMap::with_capacity(rows.len());
    for row in rows {
        let profile = CachedDiscordProfile {
            discord_id: row.try_get("discord_id")?,
            display_name: row.try_get("display_name")?,
            avatar_url: row.try_get("avatar_url")?,
            banner_url: row.try_get("banner_url")?,
            accent_color: row.try_get("accent_color")?,
            fetched_at: row.try_get("fetched_at")?,
        };
        out.insert(profile.discord_id.clone(), profile);
    }
    Ok(out)
}

pub async fn upsert_discord_profile(
    pool: &SqlitePool,
    profile: &CachedDiscordProfile,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO discord_profiles \
         (discord_id, display_name, avatar_url, banner_url, accent_color, fetched_at) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6) \
         ON CONFLICT(discord_id) DO UPDATE SET \
           display_name = excluded.display_name, \
           avatar_url = excluded.avatar_url, \
           banner_url = excluded.banner_url, \
           accent_color = excluded.accent_color, \
           fetched_at = excluded.fetched_at",
    )
    .bind(&profile.discord_id)
    .bind(profile.display_name.as_deref())
    .bind(profile.avatar_url.as_deref())
    .bind(profile.banner_url.as_deref())
    .bind(profile.accent_color)
    .bind(profile.fetched_at)
    .execute(pool)
    .await?;

    Ok(())
}

#[derive(Debug, Clone)]
pub struct DbDonationAggregate {
    pub player_id: i64,
    pub username: String,
    pub discord_id: Option<String>,
    pub avatar_url: Option<String>,
    pub amount: i64,
    pub entries: i64,
}

pub async fn query_success_donations_grouped(
    pool: &SqlitePool,
) -> Result<Vec<DbDonationAggregate>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT p.id, p.username, p.discord_id, p.avatar_url, \
                SUM(d.amount) AS amount, COUNT(*) AS entries \
         FROM donations d \
         JOIN players p ON p.id = d.player_id \
         WHERE d.status = 'SUCCESS' \
         GROUP BY p.id",
    )
    .fetch_all(pool)
    .await?;

    let mut out = Vec::with_capacity(rows.len());
    for row in rows {
        out.push(DbDonationAggregate {
            player_id: row.try_get("id")?,
            username: row.try_get("username")?,
            discord_id: row.try_get("discord_id")?,
            avatar_url: row.try_get("avatar_url")?,
            amount: row.try_get("amount")?,
            entries: row.try_get("entries")?,
        });
    }
    Ok(out)
}
