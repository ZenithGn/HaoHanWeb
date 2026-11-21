#!/usr/bin/env sh
set -eu

DB_URL="${DATABASE_URL:-sqlite:///data/haohan.db}"
DB_PATH="${DB_URL#sqlite://}"
DB_PATH="${DB_PATH#sqlite:}"
DB_PATH="${DB_PATH%%\?*}"

if [ -n "$DB_PATH" ] && [ "$DB_PATH" != ":memory:" ]; then
    mkdir -p "$(dirname "$DB_PATH")"
fi

if [ -n "${LITESTREAM_REPLICA_URL:-}" ]; then
    litestream restore -if-db-not-exists -if-replica-exists -config /etc/litestream.yml "$DB_PATH"
    exec litestream replicate -config /etc/litestream.yml -exec "/usr/local/bin/haohan-backend"
fi

exec /usr/local/bin/haohan-backend
