use serde::Serialize;
use sqlx::{Sqlite, SqlitePool, Transaction};

pub const PLAYER_COLUMNS: &str = "id, username, email, uuid, kind, password_hash, discord_id, avatar_url, total_donated, role, is_linked, play_time, created_at";

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct PlayerRow {
    pub id: i64,
    pub username: String,
    pub email: Option<String>,
    pub uuid: Option<String>,
    pub kind: String,
    pub password_hash: Option<String>,
    pub discord_id: Option<String>,
    pub avatar_url: Option<String>,
    pub total_donated: i64,
    pub role: String,
    pub is_linked: i64,
    pub play_time: i64,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct UserDto {
    pub id: i64,
    pub username: String,
    pub email: Option<String>,
    pub uuid: Option<String>,
    pub role: String,
    pub is_linked: i64,
    pub discord_id: Option<String>,
    pub avatar_url: Option<String>,
    pub play_time: i64,
}

impl From<PlayerRow> for UserDto {
    fn from(p: PlayerRow) -> Self {
        Self {
            id: p.id,
            username: p.username,
            email: p.email,
            uuid: p.uuid,
            role: p.role,
            is_linked: p.is_linked,
            discord_id: p.discord_id,
            avatar_url: p.avatar_url,
            play_time: p.play_time,
        }
    }
}

/// Checks if a `sqlx::Error` is a SQLite UNIQUE constraint violation referencing `column_hint`.
pub fn is_unique_violation_for(err: &sqlx::Error, column_hint: &str) -> bool {
    let Some(db_err) = err.as_database_error() else {
        return false;
    };
    db_err.is_unique_violation() && db_err.message().contains(column_hint)
}

/// Fetches a player by primary key `id`.
pub async fn find_by_id(pool: &SqlitePool, id: i64) -> Result<Option<PlayerRow>, sqlx::Error> {
    let sql = format!("SELECT {PLAYER_COLUMNS} FROM players WHERE id = ?1");
    sqlx::query_as::<_, PlayerRow>(&sql)
        .bind(id)
        .fetch_optional(pool)
        .await
}

/// Fetches a player by `username` using the `COLLATE NOCASE` unique index.
pub async fn find_by_username(
    pool: &SqlitePool,
    username: &str,
) -> Result<Option<PlayerRow>, sqlx::Error> {
    let sql = format!("SELECT {PLAYER_COLUMNS} FROM players WHERE username = ?1");
    sqlx::query_as::<_, PlayerRow>(&sql)
        .bind(username)
        .fetch_optional(pool)
        .await
}

/// Fetches a player by `username` inside an open write transaction.
pub async fn find_by_username_tx(
    tx: &mut Transaction<'_, Sqlite>,
    username: &str,
) -> Result<Option<PlayerRow>, sqlx::Error> {
    let sql = format!("SELECT {PLAYER_COLUMNS} FROM players WHERE username = ?1");
    sqlx::query_as::<_, PlayerRow>(&sql)
        .bind(username)
        .fetch_optional(&mut **tx)
        .await
}

/// Fetches a player by `email` using the `COLLATE NOCASE` unique index.
pub async fn find_by_email(
    pool: &SqlitePool,
    email: &str,
) -> Result<Option<PlayerRow>, sqlx::Error> {
    let sql = format!("SELECT {PLAYER_COLUMNS} FROM players WHERE email = ?1");
    sqlx::query_as::<_, PlayerRow>(&sql)
        .bind(email)
        .fetch_optional(pool)
        .await
}

/// Returns `true` if another non-ghost player already owns `email` (`COLLATE NOCASE`).
pub async fn email_exists_non_ghost(
    pool: &SqlitePool,
    email: &str,
    exclude_id: Option<i64>,
) -> Result<bool, sqlx::Error> {
    let exists: i64 = match exclude_id {
        Some(id) => {
            sqlx::query_scalar(
                "SELECT EXISTS(SELECT 1 FROM players WHERE email = ?1 AND kind != 'ghost' AND id != ?2)",
            )
            .bind(email)
            .bind(id)
            .fetch_one(pool)
            .await?
        }
        None => {
            sqlx::query_scalar(
                "SELECT EXISTS(SELECT 1 FROM players WHERE email = ?1 AND kind != 'ghost')",
            )
            .bind(email)
            .fetch_one(pool)
            .await?
        }
    };
    Ok(exists != 0)
}

/// Checks non-ghost email uniqueness inside an open write transaction.
pub async fn email_exists_non_ghost_tx(
    tx: &mut Transaction<'_, Sqlite>,
    email: &str,
    exclude_id: Option<i64>,
) -> Result<bool, sqlx::Error> {
    let exists: i64 = match exclude_id {
        Some(id) => {
            sqlx::query_scalar(
                "SELECT EXISTS(SELECT 1 FROM players WHERE email = ?1 AND kind != 'ghost' AND id != ?2)",
            )
            .bind(email)
            .bind(id)
            .fetch_one(&mut **tx)
            .await?
        }
        None => {
            sqlx::query_scalar(
                "SELECT EXISTS(SELECT 1 FROM players WHERE email = ?1 AND kind != 'ghost')",
            )
            .bind(email)
            .fetch_one(&mut **tx)
            .await?
        }
    };
    Ok(exists != 0)
}

/// Claims a `kind = 'ghost'` player row as a registered `kind = 'web'` account.
pub async fn claim_ghost_as_web_tx(
    tx: &mut Transaction<'_, Sqlite>,
    player_id: i64,
    email: &str,
    password_hash: &str,
) -> Result<Option<PlayerRow>, sqlx::Error> {
    let sql = format!(
        "UPDATE players \
         SET email = ?1, kind = 'web', password_hash = ?2, is_linked = 0 \
         WHERE id = ?3 AND kind = 'ghost' \
         RETURNING {PLAYER_COLUMNS}"
    );
    sqlx::query_as::<_, PlayerRow>(&sql)
        .bind(email)
        .bind(password_hash)
        .bind(player_id)
        .fetch_optional(&mut **tx)
        .await
}

/// Inserts a new `kind = 'web'` player row and returns the created record.
pub async fn insert_web_player_tx(
    tx: &mut Transaction<'_, Sqlite>,
    username: &str,
    email: &str,
    uuid: &str,
    password_hash: &str,
) -> Result<PlayerRow, sqlx::Error> {
    let sql = format!(
        "INSERT INTO players (username, email, uuid, kind, password_hash, is_linked) \
         VALUES (?1, ?2, ?3, 'web', ?4, 0) \
         RETURNING {PLAYER_COLUMNS}"
    );
    sqlx::query_as::<_, PlayerRow>(&sql)
        .bind(username)
        .bind(email)
        .bind(uuid)
        .bind(password_hash)
        .fetch_one(&mut **tx)
        .await
}

/// Updates a web player's stored password hash (used when transparently upgrading legacy `$SHA$` hashes).
pub async fn update_password_hash(
    pool: &SqlitePool,
    player_id: i64,
    password_hash: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE players SET password_hash = ?1 WHERE id = ?2 AND kind = 'web'")
        .bind(password_hash)
        .bind(player_id)
        .execute(pool)
        .await?;
    Ok(())
}

/// Updates email and password hash for an authenticated web player.
pub async fn update_profile(
    pool: &SqlitePool,
    player_id: i64,
    email: Option<&str>,
    password_hash: &str,
) -> Result<PlayerRow, sqlx::Error> {
    let sql = format!(
        "UPDATE players SET email = ?1, password_hash = ?2 WHERE id = ?3 RETURNING {PLAYER_COLUMNS}"
    );
    sqlx::query_as::<_, PlayerRow>(&sql)
        .bind(email)
        .bind(password_hash)
        .bind(player_id)
        .fetch_one(pool)
        .await
}

/// Enqueues an outbox job (such as `discord_webhook`) inside the caller's write transaction.
pub async fn enqueue_outbox_tx(
    tx: &mut Transaction<'_, Sqlite>,
    kind: &str,
    payload: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query("INSERT INTO outbox (kind, payload) VALUES (?1, ?2)")
        .bind(kind)
        .bind(payload)
        .execute(&mut **tx)
        .await?;
    Ok(())
}
