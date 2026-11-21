pub mod donations;
pub mod outbox;
pub mod players;

use std::path::Path;
use std::str::FromStr;
use std::time::Duration;

use anyhow::Context;
use sqlx::SqlitePool;
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions, SqliteSynchronous};

#[derive(Clone)]
pub struct Db {
    pub read: SqlitePool,
    pub write: SqlitePool,
}

impl Db {
    /// Connects to a file-backed SQLite database in WAL mode with separate write (1) and
    /// read-only (`max(4, cpus * 2)`) connection pools, creating parent directories and
    /// applying embedded migrations. Delegates to `connect_in_memory()` for `:memory:` URLs.
    pub async fn connect(database_url: &str) -> anyhow::Result<Self> {
        if is_in_memory_url(database_url) {
            return Self::connect_in_memory().await;
        }

        if let Some(parent) = extract_sqlite_parent_dir(database_url)
            && !parent.as_os_str().is_empty()
        {
            std::fs::create_dir_all(&parent).with_context(|| {
                format!(
                    "Failed to create SQLite parent directory: {}",
                    parent.display()
                )
            })?;
        }

        let write_opts = SqliteConnectOptions::from_str(database_url)
            .with_context(|| format!("Invalid DATABASE_URL: {database_url}"))?
            .create_if_missing(true)
            .journal_mode(SqliteJournalMode::Wal)
            .synchronous(SqliteSynchronous::Normal)
            .foreign_keys(true)
            .busy_timeout(Duration::from_secs(5))
            .pragma("cache_size", "-65536")
            .pragma("mmap_size", "268435456")
            .pragma("temp_store", "MEMORY")
            .pragma("wal_autocheckpoint", "1000");

        let write = SqlitePoolOptions::new()
            .max_connections(1)
            .connect_with(write_opts)
            .await
            .context("Failed to open SQLite write pool")?;

        sqlx::migrate!("./migrations")
            .run(&write)
            .await
            .context("Failed to run SQLite migrations")?;

        let read_opts = SqliteConnectOptions::from_str(database_url)
            .with_context(|| format!("Invalid DATABASE_URL: {database_url}"))?
            .read_only(true)
            .foreign_keys(true)
            .busy_timeout(Duration::from_secs(5))
            .pragma("cache_size", "-65536")
            .pragma("mmap_size", "268435456")
            .pragma("temp_store", "MEMORY");

        let read_conns = (num_cpus::get() * 2).max(4) as u32;
        let read = SqlitePoolOptions::new()
            .max_connections(read_conns)
            .connect_with(read_opts)
            .await
            .context("Failed to open SQLite read pool")?;

        Ok(Self { read, write })
    }

    /// Connects to a single-connection `:memory:` SQLite database and shares that pool across
    /// both `read` and `write` so integration tests operate on the same in-memory instance.
    pub async fn connect_in_memory() -> anyhow::Result<Self> {
        let opts = SqliteConnectOptions::from_str("sqlite::memory:")?
            .foreign_keys(true)
            .busy_timeout(Duration::from_secs(5))
            .pragma("temp_store", "MEMORY");

        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect_with(opts)
            .await
            .context("Failed to open in-memory SQLite pool")?;

        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .context("Failed to run SQLite migrations in memory")?;

        Ok(Self {
            read: pool.clone(),
            write: pool,
        })
    }

    pub async fn close(&self) {
        self.read.close().await;
        self.write.close().await;
    }
}

fn is_in_memory_url(url: &str) -> bool {
    let trimmed = url.trim();
    trimmed == ":memory:"
        || trimmed.starts_with("sqlite::memory:")
        || trimmed.contains("mode=memory")
}

fn extract_sqlite_parent_dir(url: &str) -> Option<std::path::PathBuf> {
    let without_query = url.split('?').next().unwrap_or(url);
    let path_str = without_query
        .strip_prefix("sqlite://")
        .or_else(|| without_query.strip_prefix("sqlite:"))
        .unwrap_or(without_query);

    if path_str.is_empty() || path_str == ":memory:" {
        return None;
    }

    Path::new(path_str)
        .parent()
        .map(std::path::Path::to_path_buf)
}
