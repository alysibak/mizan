#!/bin/sh
set -eu

DB_URL="${DATABASE_URL:-file:/data/mizan.db}"
case "$DB_URL" in
  file:*)
    DATA_DIR=$(dirname "${DB_URL#file:}")
    mkdir -p "$DATA_DIR"
    ;;
esac

echo "Applying database migrations..."
node ./scripts/migrate.cjs

echo "Starting Mizan on 0.0.0.0:${PORT:-3000}"
exec node server.js
