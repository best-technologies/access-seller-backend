#!/usr/bin/env bash
# Start local PostgreSQL, fixing stale postmaster.pid after reboot.
# Usage: ./scripts/start-postgres.sh   or   npm run db:start

set -e
PORT="${PGPORT:-5432}"
HOST="${PGHOST:-127.0.0.1}"

# Already running?
if psql -h "$HOST" -p "$PORT" -d postgres -tAc "SELECT 1" 2>/dev/null | grep -q 1; then
  echo "PostgreSQL is already running on $HOST:$PORT"
  exit 0
fi

# Resolve Homebrew prefix (Intel: /usr/local, Apple Silicon: /opt/homebrew)
BREW_PREFIX="${HOMEBREW_PREFIX:-$(brew --prefix 2>/dev/null || echo /usr/local)}"
DATA_DIR="$BREW_PREFIX/var/postgresql@17"
PID_FILE="$DATA_DIR/postmaster.pid"

if [[ -f "$PID_FILE" ]]; then
  PID=$(head -1 "$PID_FILE" 2>/dev/null)
  if [[ -n "$PID" ]]; then
    if ! ps -p "$PID" -o comm= 2>/dev/null | grep -q postgres; then
      echo "Removing stale postmaster.pid (PID $PID is not postgres)"
      rm -f "$PID_FILE"
    fi
  fi
fi

echo "Starting PostgreSQL..."
brew services start postgresql@17

for i in {1..15}; do
  if psql -h "$HOST" -p "$PORT" -d postgres -tAc "SELECT 1" 2>/dev/null | grep -q 1; then
    echo "PostgreSQL is running on $HOST:$PORT"
    exit 0
  fi
  sleep 1
done

echo "PostgreSQL did not become ready in time. Check: brew services list"
exit 1
