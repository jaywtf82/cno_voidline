#!/bin/bash
set -euo pipefail

GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
NC="\033[0m"

log() { echo -e "${GREEN}[ok]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
err() { echo -e "${RED}[err]${NC} $1"; }

log "C/No Voidline local setup starting"

# Check dependencies
command -v node >/dev/null 2>&1 || { err "Node.js required"; exit 1; }
command -v npm >/dev/null 2>&1 || { err "npm required"; exit 1; }
command -v docker >/dev/null 2>&1 || { err "Docker required"; exit 1; }

# Ensure Docker daemon is running
if ! docker info >/dev/null 2>&1; then
  warn "Docker daemon not running. Attempting to start..."
  if command -v colima >/dev/null 2>&1; then
    colima start >/dev/null 2>&1 || true
  elif command -v systemctl >/dev/null 2>&1; then
    sudo systemctl start docker >/dev/null 2>&1 || true
  elif command -v service >/dev/null 2>&1; then
    sudo service docker start >/dev/null 2>&1 || true
  elif [[ "${OSTYPE:-}" == darwin* ]]; then
    open --background -a Docker >/dev/null 2>&1 || true
  fi

  # Wait for Docker to be responsive
  until docker info >/dev/null 2>&1; do
    sleep 1
    printf '.'
  done
  printf '\n'

  if ! docker info >/dev/null 2>&1; then
    err "Unable to connect to Docker daemon. Please start Docker manually."
    exit 1
  fi
fi

# Install dependencies if missing
if [ ! -d node_modules ]; then
  log "Installing npm dependencies"
  npm ci
fi

# Start PostgreSQL container if not running
DB_CONTAINER="voidline-db"
if ! docker ps --format '{{.Names}}' | grep -q "^$DB_CONTAINER$"; then
  if docker ps -a --format '{{.Names}}' | grep -q "^$DB_CONTAINER$"; then
    log "Starting existing PostgreSQL container"
    docker start "$DB_CONTAINER" >/dev/null
  else
    log "Launching PostgreSQL container"
    docker run -d --name "$DB_CONTAINER" -e POSTGRES_DB=voidline -e POSTGRES_USER=voidline -e POSTGRES_PASSWORD=voidline -p 5432:5432 postgres:15-alpine >/dev/null
  fi
fi

# Wait for PostgreSQL to be ready
log "Waiting for PostgreSQL"
until docker exec "$DB_CONTAINER" pg_isready -U voidline >/dev/null 2>&1; do
  sleep 1
  printf '.'
done
printf '\n'

# Create .env.local if missing
if [ ! -f .env.local ]; then
  log "Creating .env.local"
  cat > .env.local <<'EOV'
NODE_ENV=development
DATABASE_URL=postgresql://voidline:voidline@localhost:5432/voidline
VITE_DEPLOYMENT_TARGET=local
VITE_STORAGE_BACKEND=postgresql
EOV
fi

# Export environment variables
set -a
. ./.env.local
set +a

# Run database migrations
log "Running database migrations"
npm run db:push >/dev/null

log "Starting development server"
npm run dev
