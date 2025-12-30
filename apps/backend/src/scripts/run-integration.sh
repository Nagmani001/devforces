#!/usr/bin/env bash

# TODO:
# socket closed unexpectedly
# after migration step : Error: P1001: Can't reach database server at `localhost:5432` , where is this comming from

cleanup() {
  echo '🔴 - Cleaning up...'
  if [ ! -z "$BACKEND_PID" ]; then
    kill $BACKEND_PID || true
  fi
  sleep 5
  docker compose -f /"$PROJECT_ROOT/docker/docker-compose-test.yml" down
}

trap cleanup EXIT

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

echo "Starting auxilary services"
docker compose -f "$PROJECT_ROOT/docker/docker-compose-test.yml" up -d --wait

echo '🟡 - Waiting for database to be ready...'
$PROJECT_ROOT/apps/backend/src/scripts/wait-for-it.sh localhost:5432 -- echo "database has started"

echo '🟡 - Waiting for redis to be ready...'
$PROJECT_ROOT/apps/backend/src/scripts/wait-for-it.sh localhost:6379 -- echo "redis has started"

echo "Applying migration"
DATABASE_URL="postgresql://postgres:nagmani@localhost:5432/postgres" pnpm dlx prisma@6.3.0 migrate dev --name init --schema "$PROJECT_ROOT/packages/db/prisma/schema.prisma"

echo "Generate Client"
pnpm dlx prisma@6.3.0 generate --schema "$PROJECT_ROOT/packages/db/prisma/schema.prisma"

echo "Building backend"
pnpm build

echo '🟡 - Starting backend server...'
pnpm start &
BACKEND_PID=$!

echo '🟡 - Waiting for backend to be ready...'
$PROJECT_ROOT/apps/backend/src/scripts/wait-for-it.sh localhost:3001 -- echo "backend has started"

echo "Run integration test"
pnpm run test

echo "take down all services"
docker compose down
