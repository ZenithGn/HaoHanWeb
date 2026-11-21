-- ==========================================
-- HaoHanWeb Initial SQLite Schema (STRICT + WAL)
-- ==========================================

-- ============ players ============
CREATE TABLE players (
    id             INTEGER PRIMARY KEY,
    username       TEXT    NOT NULL COLLATE NOCASE,
    email          TEXT    COLLATE NOCASE,
    uuid           TEXT,
    kind           TEXT    NOT NULL DEFAULT 'web'
                           CHECK (kind IN ('web', 'ghost', 'discord')),
    password_hash  TEXT,
    discord_id     TEXT,
    avatar_url     TEXT,
    total_donated  INTEGER NOT NULL DEFAULT 0 CHECK (total_donated >= 0),
    role           TEXT    NOT NULL DEFAULT 'default',
    is_linked      INTEGER NOT NULL DEFAULT 0 CHECK (is_linked IN (0, 1)),
    play_time      INTEGER NOT NULL DEFAULT 0 CHECK (play_time >= 0),
    created_at     INTEGER NOT NULL DEFAULT (unixepoch()),
    CHECK (length(username) BETWEEN 1 AND 16),
    CHECK ((kind = 'web') = (password_hash IS NOT NULL))
) STRICT;

CREATE UNIQUE INDEX ux_players_username ON players (username);
CREATE UNIQUE INDEX ux_players_uuid     ON players (uuid)       WHERE uuid IS NOT NULL;
CREATE UNIQUE INDEX ux_players_email    ON players (email)      WHERE email IS NOT NULL;
CREATE UNIQUE INDEX ux_players_discord  ON players (discord_id) WHERE discord_id IS NOT NULL;
CREATE INDEX ix_players_top_donated  ON players (total_donated DESC) WHERE total_donated > 0;
CREATE INDEX ix_players_top_playtime ON players (play_time DESC)     WHERE play_time > 0;

-- ============ donations (PAYOS only; scratch cards removed) ============
CREATE TABLE donations (
    id          INTEGER PRIMARY KEY,
    player_id   INTEGER NOT NULL REFERENCES players (id) ON DELETE CASCADE,
    method      TEXT    NOT NULL CHECK (method IN ('PAYOS')),
    amount      INTEGER NOT NULL CHECK (amount >= 0),
    tx_ref      TEXT    NOT NULL UNIQUE,
    message     TEXT,
    status      TEXT    NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
    created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
) STRICT;

CREATE INDEX ix_donations_player         ON donations (player_id);
CREATE INDEX ix_donations_pending_age    ON donations (created_at)        WHERE status = 'PENDING';
CREATE INDEX ix_donations_success_player ON donations (player_id, amount) WHERE status = 'SUCCESS';

-- ============ bans ============
CREATE TABLE bans (
    id                INTEGER PRIMARY KEY,
    player_uuid       TEXT    NOT NULL,
    admin_identifier  TEXT    NOT NULL,
    reason            TEXT    NOT NULL,
    banned_at         INTEGER NOT NULL DEFAULT (unixepoch()),
    expires_at        INTEGER,
    status            TEXT    NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'LIFTED'))
) STRICT;

CREATE INDEX ix_bans_uuid_status ON bans (player_uuid, status);

-- ============ server_status_logs ============
CREATE TABLE server_status_logs (
    id              INTEGER PRIMARY KEY,
    online_players  INTEGER NOT NULL DEFAULT 0 CHECK (online_players >= 0),
    max_players     INTEGER NOT NULL DEFAULT 20 CHECK (max_players >= 0),
    tps             REAL    NOT NULL DEFAULT 20.0 CHECK (tps BETWEEN 0 AND 20),
    recorded_at     INTEGER NOT NULL DEFAULT (unixepoch())
) STRICT;

CREATE INDEX ix_status_logs_time ON server_status_logs (recorded_at);

-- ============ discord_profiles ============
CREATE TABLE discord_profiles (
    discord_id    TEXT    PRIMARY KEY,
    display_name  TEXT,
    avatar_url    TEXT,
    banner_url    TEXT,
    accent_color  INTEGER,
    fetched_at    INTEGER NOT NULL
) STRICT, WITHOUT ROWID;

-- ============ kv_cache ============
CREATE TABLE kv_cache (
    key         TEXT    PRIMARY KEY,
    value       BLOB    NOT NULL,
    updated_at  INTEGER NOT NULL
) STRICT, WITHOUT ROWID;

-- ============ outbox ============
CREATE TABLE outbox (
    id               INTEGER PRIMARY KEY,
    kind             TEXT    NOT NULL CHECK (kind IN ('rcon', 'discord_webhook')),
    payload          TEXT    NOT NULL,
    attempts         INTEGER NOT NULL DEFAULT 0,
    next_attempt_at  INTEGER NOT NULL DEFAULT (unixepoch()),
    last_error       TEXT,
    status           TEXT    NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'DONE', 'DEAD')),
    created_at       INTEGER NOT NULL DEFAULT (unixepoch())
) STRICT;

CREATE INDEX ix_outbox_due ON outbox (next_attempt_at) WHERE status = 'PENDING';
