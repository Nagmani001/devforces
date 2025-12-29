#!/usr/bin/env bash

# problems :
# socket closed unexpectedly
# after migration step : Error: P1001: Can't reach database server at `localhost:5432` , where is this comming from

cleanup() {
  echo '🔴 - Cleaning up...'
  if [ ! -z "$BACKEND_PID" ]; then
    kill $BACKEND_PID || true
  fi
  sleep 5
  docker compose -f /home/nagmani/root/projects/devforces/docker/docker-compose-test.yml down
}

trap cleanup EXIT

echo "Starting auxilary services"
docker compose -f /home/nagmani/root/projects/devforces/docker/docker-compose-test.yml up -d

echo '🟡 - Waiting for database to be ready...'
/home/nagmani/root/projects/devforces/apps/backend/src/scripts/wait-for-it.sh localhost:5432 -- echo "database has started"

echo '🟡 - Waiting for redis to be ready...'
/home/nagmani/root/projects/devforces/apps/backend/src/scripts/wait-for-it.sh localhost:6379 -- echo "redis has started"

echo "Applying migration"
prisma migrate deploy --schema /home/nagmani/root/projects/devforces/packages/db/prisma/schema.prisma

echo "Building backend"
pnpm build

echo '🟡 - Starting backend server...'
pnpm start &
BACKEND_PID=$!

echo '🟡 - Waiting for backend to be ready...'
/home/nagmani/root/projects/devforces/apps/backend/src/scripts/wait-for-it.sh localhost:3001 -- echo "backend has started"

echo "Run integration test"
pnpm run test

echo "take down all services"
docker compose down
