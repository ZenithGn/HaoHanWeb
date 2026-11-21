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

/// Fetches a player by primary key `id` inside an open write transaction.
pub async fn find_by_id_tx(
    tx: &mut Transaction<'_, Sqlite>,
    id: i64,
) -> Result<Option<PlayerRow>, sqlx::Error> {
    let sql = format!("SELECT {PLAYER_COLUMNS} FROM players WHERE id = ?1");
    sqlx::query_as::<_, PlayerRow>(&sql)
        .bind(id)
        .fetch_optional(&mut **tx)
        .await
}

/// Fetches a player by `uuid` inside an open write transaction.
pub async fn find_by_uuid_tx(
    tx: &mut Transaction<'_, Sqlite>,
    uuid: &str,
) -> Result<Option<PlayerRow>, sqlx::Error> {
    let sql = format!("SELECT {PLAYER_COLUMNS} FROM players WHERE uuid = ?1");
    sqlx::query_as::<_, PlayerRow>(&sql)
        .bind(uuid)
        .fetch_optional(&mut **tx)
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

/// Fetches a player by `discord_id`.
pub async fn find_by_discord_id(
    pool: &SqlitePool,
    discord_id: &str,
) -> Result<Option<PlayerRow>, sqlx::Error> {
    let sql = format!("SELECT {PLAYER_COLUMNS} FROM players WHERE discord_id = ?1");
    sqlx::query_as::<_, PlayerRow>(&sql)
        .bind(discord_id)
        .fetch_optional(pool)
        .await
}

/// Fetches a player by `discord_id` inside an open write transaction.
pub async fn find_by_discord_id_tx(
    tx: &mut Transaction<'_, Sqlite>,
    discord_id: &str,
) -> Result<Option<PlayerRow>, sqlx::Error> {
    let sql = format!("SELECT {PLAYER_COLUMNS} FROM players WHERE discord_id = ?1");
    sqlx::query_as::<_, PlayerRow>(&sql)
        .bind(discord_id)
        .fetch_optional(&mut **tx)
        .await
}

/// Finds a distinct player record with an existing Minecraft `uuid` matching either
/// `current_username` (`COLLATE NOCASE`) or `discord_id`, used during Discord linking merge.
pub async fn find_minecraft_merge_candidate_tx(
    tx: &mut Transaction<'_, Sqlite>,
    exclude_player_id: i64,
    current_username: &str,
    discord_id: &str,
) -> Result<Option<PlayerRow>, sqlx::Error> {
    let sql = format!(
        "SELECT {PLAYER_COLUMNS} FROM players \
         WHERE id != ?1 AND uuid IS NOT NULL AND (username = ?2 OR discord_id = ?3) \
         LIMIT 1"
    );
    sqlx::query_as::<_, PlayerRow>(&sql)
        .bind(exclude_player_id)
        .bind(current_username)
        .bind(discord_id)
        .fetch_optional(&mut **tx)
        .await
}

/// Returns `true` if any player has the given `username` (`COLLATE NOCASE`) inside a transaction.
pub async fn username_exists_tx(
    tx: &mut Transaction<'_, Sqlite>,
    username: &str,
) -> Result<bool, sqlx::Error> {
    let exists: i64 =
        sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM players WHERE username = ?1)")
            .bind(username)
            .fetch_one(&mut **tx)
            .await?;
    Ok(exists != 0)
}

/// Lists existing usernames sharing a case-insensitive prefix (`LIKE prefix% ESCAPE '\'`).
pub async fn list_usernames_with_prefix_tx(
    tx: &mut Transaction<'_, Sqlite>,
    prefix: &str,
) -> Result<Vec<String>, sqlx::Error> {
    let mut escaped = String::with_capacity(prefix.len() + 4);
    for ch in prefix.chars() {
        if matches!(ch, '\\' | '%' | '_') {
            escaped.push('\\');
        }
        escaped.push(ch);
    }
    escaped.push('%');

    sqlx::query_scalar("SELECT username FROM players WHERE username LIKE ?1 ESCAPE '\\'")
        .bind(escaped)
        .fetch_all(&mut **tx)
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

/// Transfers all donations belonging to `from_player_id` to `to_player_id` inside a transaction.
pub async fn transfer_donations_tx(
    tx: &mut Transaction<'_, Sqlite>,
    from_player_id: i64,
    to_player_id: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE donations SET player_id = ?1 WHERE player_id = ?2")
        .bind(to_player_id)
        .bind(from_player_id)
        .execute(&mut **tx)
        .await?;
    Ok(())
}

/// Deletes a player record inside a transaction (used to free UNIQUE constraints before updating target).
pub async fn delete_player_tx(
    tx: &mut Transaction<'_, Sqlite>,
    player_id: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM players WHERE id = ?1")
        .bind(player_id)
        .execute(&mut **tx)
        .await?;
    Ok(())
}

/// Sets `uuid` and `is_linked = 1` on a player during in-game account linking.
pub async fn set_game_uuid_linked_tx(
    tx: &mut Transaction<'_, Sqlite>,
    player_id: i64,
    uuid: &str,
) -> Result<PlayerRow, sqlx::Error> {
    let sql = format!(
        "UPDATE players SET uuid = ?1, is_linked = 1 WHERE id = ?2 RETURNING {PLAYER_COLUMNS}"
    );
    sqlx::query_as::<_, PlayerRow>(&sql)
        .bind(uuid)
        .bind(player_id)
        .fetch_one(&mut **tx)
        .await
}

/// Updates a player with merged ghost profile stats after the ghost record has been deleted.
#[allow(clippy::too_many_arguments)]
pub async fn apply_game_link_merge_tx(
    tx: &mut Transaction<'_, Sqlite>,
    player_id: i64,
    uuid: &str,
    username: &str,
    total_donated: i64,
    role: &str,
    play_time: i64,
    discord_id: Option<&str>,
    avatar_url: Option<&str>,
) -> Result<PlayerRow, sqlx::Error> {
    let sql = format!(
        "UPDATE players \
         SET uuid = ?1, username = ?2, total_donated = ?3, role = ?4, play_time = ?5, \
             discord_id = ?6, avatar_url = ?7, is_linked = 1 \
         WHERE id = ?8 \
         RETURNING {PLAYER_COLUMNS}"
    );
    sqlx::query_as::<_, PlayerRow>(&sql)
        .bind(uuid)
        .bind(username)
        .bind(total_donated)
        .bind(role)
        .bind(play_time)
        .bind(discord_id)
        .bind(avatar_url)
        .bind(player_id)
        .fetch_one(&mut **tx)
        .await
}

/// Updates Discord link fields for an existing player inside a transaction.
#[allow(clippy::too_many_arguments)]
pub async fn update_discord_link_tx(
    tx: &mut Transaction<'_, Sqlite>,
    player_id: i64,
    discord_id: &str,
    avatar_url: &str,
    role: &str,
    total_donated: i64,
    play_time: i64,
    is_linked: i64,
) -> Result<PlayerRow, sqlx::Error> {
    let sql = format!(
        "UPDATE players \
         SET discord_id = ?1, avatar_url = ?2, role = ?3, total_donated = ?4, play_time = ?5, is_linked = ?6 \
         WHERE id = ?7 \
         RETURNING {PLAYER_COLUMNS}"
    );
    sqlx::query_as::<_, PlayerRow>(&sql)
        .bind(discord_id)
        .bind(avatar_url)
        .bind(role)
        .bind(total_donated)
        .bind(play_time)
        .bind(is_linked)
        .bind(player_id)
        .fetch_one(&mut **tx)
        .await
}

/// Updates a player's Discord role and avatar URL during manual sync.
pub async fn update_discord_sync(
    pool: &SqlitePool,
    player_id: i64,
    role: &str,
    avatar_url: Option<&str>,
) -> Result<PlayerRow, sqlx::Error> {
    let sql = format!(
        "UPDATE players SET role = ?1, avatar_url = ?2 WHERE id = ?3 RETURNING {PLAYER_COLUMNS}"
    );
    sqlx::query_as::<_, PlayerRow>(&sql)
        .bind(role)
        .bind(avatar_url)
        .bind(player_id)
        .fetch_one(pool)
        .await
}

/// Updates only a player's role (used by bot role-update webhook).
pub async fn update_role(
    pool: &SqlitePool,
    player_id: i64,
    role: &str,
) -> Result<PlayerRow, sqlx::Error> {
    let sql = format!("UPDATE players SET role = ?1 WHERE id = ?2 RETURNING {PLAYER_COLUMNS}");
    sqlx::query_as::<_, PlayerRow>(&sql)
        .bind(role)
        .bind(player_id)
        .fetch_one(pool)
        .await
}

/// Updates an existing player logging in via Discord (`ghost` rows are promoted to `discord`).
pub async fn update_existing_discord_login_tx(
    tx: &mut Transaction<'_, Sqlite>,
    player_id: i64,
    promote_ghost: bool,
    role: &str,
    avatar_url: &str,
    is_linked: i64,
) -> Result<PlayerRow, sqlx::Error> {
    let sql = if promote_ghost {
        format!(
            "UPDATE players \
             SET kind = 'discord', password_hash = NULL, role = ?1, avatar_url = ?2, is_linked = ?3 \
             WHERE id = ?4 \
             RETURNING {PLAYER_COLUMNS}"
        )
    } else {
        format!(
            "UPDATE players \
             SET role = ?1, avatar_url = ?2, is_linked = ?3 \
             WHERE id = ?4 \
             RETURNING {PLAYER_COLUMNS}"
        )
    };
    sqlx::query_as::<_, PlayerRow>(&sql)
        .bind(role)
        .bind(avatar_url)
        .bind(is_linked)
        .bind(player_id)
        .fetch_one(&mut **tx)
        .await
}

/// Claims a `kind = 'ghost'` player row as a `kind = 'discord'` account.
pub async fn claim_ghost_as_discord_tx(
    tx: &mut Transaction<'_, Sqlite>,
    player_id: i64,
    discord_id: &str,
    avatar_url: &str,
    role: &str,
    is_linked: i64,
) -> Result<Option<PlayerRow>, sqlx::Error> {
    let sql = format!(
        "UPDATE players \
         SET kind = 'discord', password_hash = NULL, discord_id = ?1, avatar_url = ?2, role = ?3, is_linked = ?4 \
         WHERE id = ?5 AND kind = 'ghost' \
         RETURNING {PLAYER_COLUMNS}"
    );
    sqlx::query_as::<_, PlayerRow>(&sql)
        .bind(discord_id)
        .bind(avatar_url)
        .bind(role)
        .bind(is_linked)
        .bind(player_id)
        .fetch_optional(&mut **tx)
        .await
}

/// Inserts a new `kind = 'discord'` player row and returns the created record.
pub async fn insert_discord_player_tx(
    tx: &mut Transaction<'_, Sqlite>,
    username: &str,
    uuid: &str,
    discord_id: &str,
    avatar_url: &str,
    role: &str,
) -> Result<PlayerRow, sqlx::Error> {
    let sql = format!(
        "INSERT INTO players (username, uuid, kind, password_hash, discord_id, avatar_url, role, is_linked) \
         VALUES (?1, ?2, 'discord', NULL, ?3, ?4, ?5, 0) \
         RETURNING {PLAYER_COLUMNS}"
    );
    sqlx::query_as::<_, PlayerRow>(&sql)
        .bind(username)
        .bind(uuid)
        .bind(discord_id)
        .bind(avatar_url)
        .bind(role)
        .fetch_one(&mut **tx)
        .await
}
