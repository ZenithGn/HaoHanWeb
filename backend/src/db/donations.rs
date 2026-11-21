use sqlx::pool::PoolConnection;
use sqlx::{Row, Sqlite, SqliteConnection, SqlitePool};

/// Single-writer `BEGIN IMMEDIATE` transaction guard for SQLite WAL correctness.
pub struct ImmediateTx {
    conn: Option<PoolConnection<Sqlite>>,
}

impl ImmediateTx {
    pub async fn begin(pool: &SqlitePool) -> Result<Self, sqlx::Error> {
        let mut conn = pool.acquire().await?;
        sqlx::query("BEGIN IMMEDIATE").execute(&mut *conn).await?;
        Ok(Self { conn: Some(conn) })
    }

    pub fn conn(&mut self) -> &mut SqliteConnection {
        self.conn.as_mut().expect("transaction already finalized")
    }

    pub async fn commit(mut self) -> Result<(), sqlx::Error> {
        if let Some(mut conn) = self.conn.take() {
            sqlx::query("COMMIT").execute(&mut *conn).await?;
        }
        Ok(())
    }

    pub async fn rollback(mut self) -> Result<(), sqlx::Error> {
        if let Some(mut conn) = self.conn.take() {
            sqlx::query("ROLLBACK").execute(&mut *conn).await?;
        }
        Ok(())
    }
}

impl Drop for ImmediateTx {
    fn drop(&mut self) {
        if let Some(mut conn) = self.conn.take()
            && let Ok(handle) = tokio::runtime::Handle::try_current()
        {
            handle.spawn(async move {
                let _ = sqlx::query("ROLLBACK").execute(&mut *conn).await;
            });
        }
    }
}

#[derive(Debug, Clone)]
pub struct DonationRecord {
    pub id: i64,
    pub player_id: i64,
    pub method: String,
    pub amount: i64,
    pub tx_ref: String,
    pub message: Option<String>,
    pub status: String,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone)]
pub struct CompletedDonationRow {
    pub id: i64,
    pub player_id: i64,
    pub amount: i64,
    pub method: String,
    pub message: Option<String>,
}

pub async fn insert_pending_payos(
    pool: &SqlitePool,
    player_id: i64,
    amount: i64,
    tx_ref: &str,
    message: Option<&str>,
) -> Result<i64, sqlx::Error> {
    sqlx::query_scalar::<_, i64>(
        "INSERT INTO donations (player_id, method, amount, tx_ref, message, status) \
         VALUES (?1, 'PAYOS', ?2, ?3, ?4, 'PENDING') \
         RETURNING id",
    )
    .bind(player_id)
    .bind(amount)
    .bind(tx_ref)
    .bind(message)
    .fetch_one(pool)
    .await
}

pub async fn find_by_tx_ref(
    pool: &SqlitePool,
    tx_ref: &str,
) -> Result<Option<DonationRecord>, sqlx::Error> {
    let row = sqlx::query(
        "SELECT id, player_id, method, amount, tx_ref, message, status, created_at, updated_at \
         FROM donations WHERE tx_ref = ?1",
    )
    .bind(tx_ref)
    .fetch_optional(pool)
    .await?;

    let Some(row) = row else {
        return Ok(None);
    };

    Ok(Some(DonationRecord {
        id: row.try_get("id")?,
        player_id: row.try_get("player_id")?,
        method: row.try_get("method")?,
        amount: row.try_get("amount")?,
        tx_ref: row.try_get("tx_ref")?,
        message: row.try_get("message")?,
        status: row.try_get("status")?,
        created_at: row.try_get("created_at")?,
        updated_at: row.try_get("updated_at")?,
    }))
}

pub async fn mark_pending_success_in_tx(
    conn: &mut SqliteConnection,
    tx_ref: &str,
    paid_amount: Option<i64>,
) -> Result<Option<CompletedDonationRow>, sqlx::Error> {
    let amount_override = paid_amount.filter(|&a| a > 0);
    let row = sqlx::query(
        "UPDATE donations \
         SET status = 'SUCCESS', amount = COALESCE(?2, amount), updated_at = unixepoch() \
         WHERE tx_ref = ?1 AND status = 'PENDING' \
         RETURNING id, player_id, amount, method, message",
    )
    .bind(tx_ref)
    .bind(amount_override)
    .fetch_optional(conn)
    .await?;

    let Some(row) = row else {
        return Ok(None);
    };

    Ok(Some(CompletedDonationRow {
        id: row.try_get("id")?,
        player_id: row.try_get("player_id")?,
        amount: row.try_get("amount")?,
        method: row.try_get("method")?,
        message: row.try_get("message")?,
    }))
}

pub async fn increment_player_donated_in_tx(
    conn: &mut SqliteConnection,
    player_id: i64,
    amount: i64,
) -> Result<String, sqlx::Error> {
    sqlx::query_scalar::<_, String>(
        "UPDATE players SET total_donated = total_donated + ?1 WHERE id = ?2 RETURNING username",
    )
    .bind(amount)
    .bind(player_id)
    .fetch_one(conn)
    .await
}

pub async fn mark_failed_if_pending(pool: &SqlitePool, tx_ref: &str) -> Result<bool, sqlx::Error> {
    let res = sqlx::query(
        "UPDATE donations \
         SET status = 'FAILED', updated_at = unixepoch() \
         WHERE tx_ref = ?1 AND status = 'PENDING'",
    )
    .bind(tx_ref)
    .execute(pool)
    .await?;

    Ok(res.rows_affected() > 0)
}
