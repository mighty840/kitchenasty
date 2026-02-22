# 🐳 Docker Deployment

## 🏭 Production Docker Compose

For production, create a `docker-compose.prod.yml` or modify the default:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: kitchenasty
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: kitchenasty
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U kitchenasty"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  server:
    build:
      context: .
      dockerfile: packages/server/Dockerfile
    environment:
      PORT: 3000
      NODE_ENV: production
      DATABASE_URL: postgresql://kitchenasty:${DB_PASSWORD}@postgres:5432/kitchenasty
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGINS: https://admin.yourdomain.com,https://order.yourdomain.com
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
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
    ports:
      - "5173:80"
    depends_on:
      - server
    restart: unless-stopped

  storefront:
    build:
      context: .
      dockerfile: packages/storefront/Dockerfile
    ports:
      - "5174:80"
    depends_on:
      - server
    restart: unless-stopped

volumes:
  pgdata:
  uploads:
```

## ✅ Environment Checklist

Before deploying to production, ensure:

- [ ] 🔑 `JWT_SECRET` is a strong, unique random string (32+ chars)
- [ ] 🔐 `DB_PASSWORD` is a strong password
- [ ] 🌐 `CORS_ORIGINS` lists only your actual domains
- [ ] ⚙️ `NODE_ENV` is set to `production`
- [ ] 💳 Stripe keys are live keys (not test keys)
- [ ] 🔔 Webhook secret matches your Stripe dashboard

## 💾 Volumes

| Volume | Purpose |
|--------|---------|
| `pgdata` | PostgreSQL data — persists database across restarts |
| `uploads` | Uploaded images — persists menu item images |

::: warning
Losing the `pgdata` volume means losing all data. Back up regularly.
:::

## 🔒 Reverse Proxy & SSL

In production, place an nginx reverse proxy or Cloudflare in front to handle:

- 🔐 TLS termination (HTTPS)
- 🌐 Domain routing (admin.yourdomain.com → admin container, etc.)
- ⚡ Static asset caching

Example nginx config:

```nginx
server {
    listen 443 ssl;
    server_name order.yourdomain.com;

    ssl_certificate /etc/ssl/certs/yourdomain.pem;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;

    location / {
        proxy_pass http://localhost:5174;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🏥 Health Checks

The API server exposes a health endpoint:

```
GET /api/health
```

Use this for container orchestration health checks and uptime monitoring.
