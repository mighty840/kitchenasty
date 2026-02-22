# 🐳 Docker Compose Production

This page explains how to configure and run KitchenAsty in production using Docker Compose.

## 1️⃣ Step 1: Clone the Repository

```bash
cd /home/kitchenasty
git clone https://github.com/kitchenasty/kitchenasty.git
cd kitchenasty
```

## 2️⃣ Step 2: Create the Environment File

Create a `.env` file in the project root. Docker Compose will automatically read variables from it.

```bash
nano .env
```

Paste the following, replacing the placeholder values:

```dotenv
# ── 🗄️ Database ──────────────────────────────────────────
# Use a strong, random password (at least 20 characters)
DB_PASSWORD=CHANGE_ME_to_a_random_password_here

# ── 🔐 Authentication ────────────────────────────────────
# Generate with: openssl rand -base64 32
JWT_SECRET=CHANGE_ME_to_a_random_secret_here

# ── 🌐 Domains ───────────────────────────────────────────
# Replace with your actual domain names
ADMIN_DOMAIN=admin.yourdomain.com
STOREFRONT_DOMAIN=order.yourdomain.com
API_DOMAIN=api.yourdomain.com

# ── 🔗 CORS ──────────────────────────────────────────────
CORS_ORIGINS=https://admin.yourdomain.com,https://order.yourdomain.com

# ── 💳 Stripe (optional — skip if using cash only) ──────
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# ── 📧 Email (optional) ─────────────────────────────────
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@yourdomain.com

# ── 🔵 Social Login (optional) ──────────────────────────
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
```

::: tip 🔑 Generating Random Secrets
Run this command on your server to generate a strong random string:
```bash
openssl rand -base64 32
```
Use the output for `DB_PASSWORD` and `JWT_SECRET`. Never reuse the same secret for both.
:::

## 3️⃣ Step 3: Create the Production Compose File

Create `docker-compose.prod.yml`:

```bash
nano docker-compose.prod.yml
```

Paste the following:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: kitchenasty-db
    environment:
      POSTGRES_USER: kitchenasty
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: kitchenasty
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U kitchenasty"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    # Do NOT expose port 5432 — only internal Docker network access

  server:
    build:
      context: .
      dockerfile: packages/server/Dockerfile
    container_name: kitchenasty-server
    environment:
      PORT: 3000
      NODE_ENV: production
      DATABASE_URL: postgresql://kitchenasty:${DB_PASSWORD}@postgres:5432/kitchenasty
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: 7d
      CORS_ORIGINS: ${CORS_ORIGINS}
      BASE_URL: https://${API_DOMAIN}
      STOREFRONT_URL: https://${STOREFRONT_DOMAIN}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      EMAIL_FROM: ${EMAIL_FROM}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      FACEBOOK_APP_ID: ${FACEBOOK_APP_ID}
      FACEBOOK_APP_SECRET: ${FACEBOOK_APP_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - uploads:/app/uploads
    restart: unless-stopped

  admin:
    build:
      context: .
      dockerfile: packages/admin/Dockerfile
    container_name: kitchenasty-admin
    depends_on:
      - server
    restart: unless-stopped

  storefront:
    build:
      context: .
      dockerfile: packages/storefront/Dockerfile
    container_name: kitchenasty-storefront
    depends_on:
      - server
    restart: unless-stopped

volumes:
  pgdata:
  uploads:

networks:
  default:
    name: kitchenasty
```

::: warning 🔒 Security
Notice that no service exposes ports to the host. The reverse proxy (set up in the next step) connects to the Docker network directly. This means the database, API, and frontends are not directly accessible from the internet.
:::

## 4️⃣ Step 4: Build and Start

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

The `-d` flag runs containers in the background (detached mode).

Check that all containers are running:

```bash
docker compose -f docker-compose.prod.yml ps
```

Expected output:

```
NAME                    STATUS              PORTS
kitchenasty-db          running (healthy)
kitchenasty-server      running
kitchenasty-admin       running
kitchenasty-storefront  running
```

## 5️⃣ Step 5: Run Database Migrations and Seed

```bash
# Apply database migrations
docker compose -f docker-compose.prod.yml exec server \
  npx prisma migrate deploy --schema ../../prisma/schema.prisma

# Seed initial data (admin user, sample menu)
docker compose -f docker-compose.prod.yml exec server \
  npx tsx ../../prisma/seed.ts
```

After seeding, you can log in with:

- 👨‍💼 **Admin**: `admin@kitchenasty.com` / `admin123`
- 👤 **Customer**: `customer@example.com` / `customer123`

::: danger 🚨 Change Default Passwords
After first login, immediately change the default admin password through the admin panel or by updating the database directly.
:::

## 6️⃣ Step 6: Verify

Test that the API is responding:

```bash
# From the server (using Docker network)
docker compose -f docker-compose.prod.yml exec server \
  wget -qO- http://localhost:3000/api/health

# Expected: {"status":"ok"}
```

## 📋 Viewing Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f server

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail 100 server
```

## ⏹️ Stopping and Starting

```bash
# Stop all services (keeps data)
docker compose -f docker-compose.prod.yml down

# Start again
docker compose -f docker-compose.prod.yml up -d

# Restart a single service
docker compose -f docker-compose.prod.yml restart server
```

## ➡️ Next Step

Continue to **[Domain & DNS](/self-hosting/domain-dns)** to point your domain to the server.
