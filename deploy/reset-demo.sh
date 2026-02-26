#!/bin/bash
# Reset the KitchenAsty demo database.
# Intended to run as a cron job every 2 hours.
set -euo pipefail

cd /opt/kitchenasty

echo "[$(date)] Resetting demo database..."

# Drop and recreate the database
docker compose -f docker-compose.demo.yml exec -T postgres \
  psql -U kitchenasty -d postgres -c 'DROP DATABASE IF EXISTS kitchenasty;'
docker compose -f docker-compose.demo.yml exec -T postgres \
  psql -U kitchenasty -d postgres -c 'CREATE DATABASE kitchenasty OWNER kitchenasty;'

# Restart the server so Prisma reconnects
docker compose -f docker-compose.demo.yml restart server

# Wait for server to be ready
sleep 5

# Run migrations and seed
docker compose -f docker-compose.demo.yml exec -T server \
  npx prisma migrate deploy --schema prisma/schema.prisma
docker compose -f docker-compose.demo.yml exec -T server \
  npx tsx prisma/seed.ts

echo "[$(date)] Demo reset complete."
