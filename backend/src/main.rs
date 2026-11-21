#[cfg(not(target_env = "msvc"))]
#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

use std::net::SocketAddr;

use anyhow::Context;
use tokio::net::TcpListener;
use tokio_util::sync::CancellationToken;
use tracing_subscriber::EnvFilter;

use haohan_backend::config::Config;
use haohan_backend::db::Db;
use haohan_backend::router::build_router;
use haohan_backend::state::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    let cfg = Config::from_env().context("Failed to load application configuration")?;
    init_tracing(&cfg);

    let db = Db::connect(&cfg.database_url)
        .await
        .context("Failed to initialize SQLite database")?;

    let state = AppState::new(cfg.clone(), db)?;
    let app = build_router(state.clone());

    let listener = TcpListener::bind(&cfg.bind_addr)
        .await
        .with_context(|| format!("Failed to bind HTTP listener on {}", cfg.bind_addr))?;

    tracing::info!(
        bind_addr = %cfg.bind_addr,
        env = ?cfg.app_env,
        "HaoHanWeb Rust backend listening"
    );

    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .with_graceful_shutdown(shutdown_signal(state.shutdown.clone()))
    .await
    .context("HTTP server terminated unexpectedly")?;

    state.db.close().await;
    tracing::info!("Server shutdown complete");
    Ok(())
}

fn init_tracing(cfg: &Config) {
    let filter =
        EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info,sqlx=warn"));

    if cfg.is_production() {
        tracing_subscriber::fmt()
            .with_env_filter(filter)
            .json()
            .init();
    } else {
        tracing_subscriber::fmt().with_env_filter(filter).init();
    }
}

async fn shutdown_signal(shutdown: CancellationToken) {
    let ctrl_c = async {
        if let Err(err) = tokio::signal::ctrl_c().await {
            tracing::error!(error = %err, "Failed to install Ctrl+C signal handler");
        }
    };

    #[cfg(unix)]
    let terminate = async {
        match tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()) {
            Ok(mut sig) => {
                sig.recv().await;
            }
            Err(err) => {
                tracing::error!(error = %err, "Failed to install SIGTERM signal handler");
            }
        }
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }

    tracing::info!("Shutdown signal received, draining connections...");
    shutdown.cancel();
}
