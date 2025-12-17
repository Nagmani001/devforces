#!/usr/bin/env bash

docker compose up -d
echo '🟡 - Waiting for database to be ready...'
./wait-for-it.sh localhost:5432 -- echo "database has started"
npx prisma migrate dev --name init
npm run test
docker compose down
