pub mod cleanup;
pub mod outbox_worker;
pub mod snapshot_builder;
pub mod status_poller;
pub mod supporters_refresher;

use tokio::task::JoinHandle;

use crate::state::SharedState;

/// Spawns all background Tokio tasks, honoring `state.shutdown` for graceful shutdown.
pub fn spawn_background_tasks(state: SharedState) -> Vec<JoinHandle<()>> {
    let mut handles = vec![
        tokio::spawn(status_poller::run_status_poller(state.clone())),
        tokio::spawn(status_poller::run_status_logger(state.clone())),
        tokio::spawn(snapshot_builder::run_snapshot_builder(state.clone())),
        tokio::spawn(outbox_worker::run_outbox_worker(state.clone())),
        tokio::spawn(cleanup::run_cleanup_loop(state.clone())),
    ];

    if state.cfg.discord_donation_auto_refresh {
        handles.push(tokio::spawn(
            supporters_refresher::run_supporters_refresher(state),
        ));
    }

    handles
}
