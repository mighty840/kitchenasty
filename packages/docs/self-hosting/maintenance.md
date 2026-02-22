# 🔧 Maintenance

This page covers day-to-day maintenance tasks: updating to new versions, monitoring server health, and troubleshooting common issues.

## 🔄 Updating KitchenAsty

When a new version is released, follow these steps to update:

### 1️⃣ Step 1: Back Up First

```bash
/home/kitchenasty/backup.sh
```

### 2️⃣ Step 2: Pull the Latest Code

```bash
cd /home/kitchenasty/kitchenasty
git pull origin main
```

### 3️⃣ Step 3: Rebuild and Restart

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

### 4️⃣ Step 4: Run Migrations

If the update includes database changes:

```bash
docker compose -f docker-compose.prod.yml exec server \
  npx prisma migrate deploy --schema ../../prisma/schema.prisma
```

### 5️⃣ Step 5: Verify

```bash
# Check all containers are healthy
docker compose -f docker-compose.prod.yml ps

# Check the API
curl -s https://api.yourdomain.com/api/health
```

::: tip ⚡ Zero-Downtime Updates
Docker Compose rebuilds and restarts containers one at a time. The downtime is typically under 30 seconds. For true zero-downtime deployments, consider using Docker Swarm or Kubernetes with rolling updates.
:::

## 📊 Monitoring

### 📈 Basic Monitoring with Docker

```bash
# Container status and resource usage
docker stats --no-stream

# Check container health
docker compose -f docker-compose.prod.yml ps

# View recent logs
docker compose -f docker-compose.prod.yml logs --tail 50 server
```

### 💽 Disk Space

```bash
# Check overall disk usage
df -h

# Check Docker disk usage
docker system df

# Clean up unused Docker images (reclaim disk space)
docker system prune -f
```

::: warning ⚠️
Run `docker system prune` periodically (e.g., monthly) to reclaim disk space from old images. Add the `-a` flag to also remove unused images, but this means the next `docker compose up --build` will take longer.
:::

### 🗄️ Database Size

```bash
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U kitchenasty -c "SELECT pg_size_pretty(pg_database_size('kitchenasty'));"
```

### 🌐 Uptime Monitoring (External)

Use a free uptime monitoring service to get notified if your site goes down:

- 🤖 [UptimeRobot](https://uptimerobot.com) — free for up to 50 monitors
- 🍃 [Freshping](https://www.freshworks.com/website-monitoring/) — free tier available
- 🏠 [Uptime Kuma](https://github.com/louislam/uptime-kuma) — self-hosted alternative

Set up a monitor that checks `https://api.yourdomain.com/api/health` every 5 minutes.

## 🖥️ Server Maintenance

### 🔒 Ubuntu Security Updates

If you set up unattended upgrades during [Server Setup](/self-hosting/server-setup), security patches are applied automatically. To manually check:

```bash
sudo apt update && sudo apt upgrade -y
```

### 🐳 Docker Updates

```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

### 🔐 SSL Certificate Renewal

If using **Caddy**: certificates renew automatically. No action needed.

If using **Nginx + Certbot**: renewal is automatic via systemd timer. To verify:

```bash
sudo certbot renew --dry-run
```

## 🔧 Troubleshooting

### 🚫 Container Won't Start

```bash
# Check logs for the failing container
docker compose -f docker-compose.prod.yml logs server

# Common causes:
# - Database not ready: wait for postgres healthcheck
# - Missing environment variable: check .env file
# - Port conflict: check if another process uses the port
```

### 🗄️ Database Connection Errors

```bash
# Verify PostgreSQL is running
docker compose -f docker-compose.prod.yml ps postgres

# Test connection from the server container
docker compose -f docker-compose.prod.yml exec server \
  npx prisma db execute --stdin --schema ../../prisma/schema.prisma <<< "SELECT 1;"
```

### 🔴 "502 Bad Gateway" from Reverse Proxy

This means the reverse proxy can't reach the backend container.

```bash
# Check if containers are running
docker compose -f docker-compose.prod.yml ps

# Check if the port is listening
curl http://127.0.0.1:3000/api/health
curl http://127.0.0.1:5173
curl http://127.0.0.1:5174
```

### 💾 Out of Memory

If the server is running out of memory:

```bash
# Check memory usage
free -h

# Check per-container usage
docker stats --no-stream
```

Solutions:
- ⬆️ Upgrade your server to a larger plan
- 💽 Add swap space as a temporary measure:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 🐌 Slow Performance

1. 📊 **Check if the server is overloaded**: `top` or `htop`
2. 🗄️ **Check database performance**: slow queries may need indexing
3. 💽 **Check disk I/O**: `iostat -x 1` (install with `sudo apt install sysstat`)
4. 📈 **Consider scaling**: see the [Scaling](/deployment/scaling) guide

### 🔑 Resetting Admin Password

If you've lost access to the admin account:

```bash
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U kitchenasty -c "
    UPDATE users SET password = '\$2a\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
    WHERE email = 'admin@kitchenasty.com';
  "
```

This resets the password to `admin123`. **Change it immediately after logging in.**

## 📋 Docker Compose Commands Cheat Sheet

| Command | What It Does |
|---------|-------------|
| ▶️ `docker compose -f docker-compose.prod.yml up -d` | Start all services |
| ⏹️ `docker compose -f docker-compose.prod.yml down` | Stop all services |
| 🔄 `docker compose -f docker-compose.prod.yml restart server` | Restart one service |
| 📋 `docker compose -f docker-compose.prod.yml logs -f server` | Follow logs |
| 📊 `docker compose -f docker-compose.prod.yml ps` | Show service status |
| 🐚 `docker compose -f docker-compose.prod.yml exec server sh` | Shell into a container |
| 🔨 `docker compose -f docker-compose.prod.yml up --build -d` | Rebuild and restart |
| 🧹 `docker system prune -f` | Clean up unused images/containers |
