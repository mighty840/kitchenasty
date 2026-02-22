# 🔒 Reverse Proxy & SSL

A reverse proxy sits between the internet and your KitchenAsty containers. It handles HTTPS encryption, routes requests to the correct service, and provides a professional setup with proper SSL certificates.

We cover two options: **Caddy** (easiest, recommended) and **Nginx + Certbot** (most common). Choose one.

---

## 🅰️ Option A: Caddy (Recommended)

[Caddy](https://caddyserver.com) is a modern web server that automatically obtains and renews SSL certificates from Let's Encrypt. It requires almost no configuration.

### ✨ Why Caddy?

- 🔒 **Automatic HTTPS** — no manual certificate setup or renewal cron jobs
- 📝 **Simple configuration** — a few lines vs. hundreds for Nginx
- ⚡ **HTTP/2 and HTTP/3** out of the box
- 🔄 **Automatic redirects** — HTTP to HTTPS happens automatically

### 📦 Install Caddy

On your server:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudflare.com/cloudflare/d/deb/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg 2>/dev/null || true
curl -1sLf 'https://dl.cloudflare.com/cloudflare/d/deb/config.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list > /dev/null 2>&1 || true

# Use the official Caddy install method
sudo apt install -y caddy 2>/dev/null || {
  # Fallback: install from official Caddy repo
  curl -1sLf 'https://dl.cloudflare.com/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudflare.com/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
  sudo apt update && sudo apt install -y caddy
}
```

Or use the simplest method:

```bash
sudo apt update
sudo apt install -y caddy
```

::: tip 💡
If `apt install caddy` isn't available on your distro, download the binary from [caddyserver.com/download](https://caddyserver.com/download).
:::

### ⚙️ Configure Caddy

Edit the Caddyfile:

```bash
sudo nano /etc/caddy/Caddyfile
```

Replace the contents with:

```caddyfile
# Admin Dashboard
admin.yourdomain.com {
    reverse_proxy kitchenasty-admin:80
}

# Customer Storefront
order.yourdomain.com {
    reverse_proxy kitchenasty-storefront:80
}

# API Server
api.yourdomain.com {
    reverse_proxy kitchenasty-server:3000
}
```

That's the entire configuration. Caddy will:
1. 🔒 Automatically obtain SSL certificates from Let's Encrypt
2. 🔄 Redirect HTTP to HTTPS
3. ♻️ Renew certificates before they expire
4. ⚡ Enable HTTP/2

### 🔗 Connect Caddy to Docker Network

Caddy needs to reach the Docker containers. The easiest way is to add Caddy to the same Docker network:

```bash
# Connect Caddy to the KitchenAsty Docker network
docker network connect kitchenasty caddy 2>/dev/null || true
```

However, since Caddy is installed as a system service (not a container), you need to expose the container ports on localhost instead. Update your `docker-compose.prod.yml` to expose ports on `127.0.0.1` only (not publicly):

```yaml
  server:
    # ... existing config ...
    ports:
      - "127.0.0.1:3000:3000"

  admin:
    # ... existing config ...
    ports:
      - "127.0.0.1:5173:80"

  storefront:
    # ... existing config ...
    ports:
      - "127.0.0.1:5174:80"
```

Then update the Caddyfile to use `localhost` instead of container names:

```caddyfile
# Admin Dashboard
admin.yourdomain.com {
    reverse_proxy localhost:5173
}

# Customer Storefront
order.yourdomain.com {
    reverse_proxy localhost:5174
}

# API Server — includes WebSocket support
api.yourdomain.com {
    reverse_proxy localhost:3000
}
```

### 🚀 Start Caddy

```bash
sudo systemctl enable caddy
sudo systemctl restart caddy

# Check status
sudo systemctl status caddy
```

### ✅ Verify HTTPS

Wait 30-60 seconds for certificates to be issued, then visit:

- 🔒 `https://admin.yourdomain.com` — should show the Admin login
- 🔒 `https://order.yourdomain.com` — should show the Storefront
- 🔒 `https://api.yourdomain.com/api/health` — should return `{"status":"ok"}`

### 📋 Caddy Logs

```bash
sudo journalctl -u caddy -f
```

---

## 🅱️ Option B: Nginx + Certbot

If you prefer Nginx (the industry standard) or already have it installed, follow this section.

### 📦 Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

### 🔒 Install Certbot

Certbot automates Let's Encrypt certificate issuance and renewal.

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### ⚙️ Create Nginx Configuration

First, expose the Docker container ports on `127.0.0.1` only. Edit `docker-compose.prod.yml`:

```yaml
  server:
    ports:
      - "127.0.0.1:3000:3000"
  admin:
    ports:
      - "127.0.0.1:5173:80"
  storefront:
    ports:
      - "127.0.0.1:5174:80"
```

Restart Docker Compose:

```bash
docker compose -f docker-compose.prod.yml up -d
```

Now create the Nginx site configs:

```bash
sudo nano /etc/nginx/sites-available/kitchenasty
```

Paste the following:

```nginx
# ── Admin Dashboard ─────────────────────────────────
server {
    listen 80;
    server_name admin.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy API requests to the backend
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy uploaded images
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
    }

    # WebSocket support for Socket.IO (kitchen display, live orders)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }
}

# ── Customer Storefront ─────────────────────────────
server {
    listen 80;
    server_name order.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5174;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }
}

# ── API Server (optional dedicated subdomain) ───────
server {
    listen 80;
    server_name api.yourdomain.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }
}
```

### ✅ Enable the Site

```bash
# Enable the config
sudo ln -s /etc/nginx/sites-available/kitchenasty /etc/nginx/sites-enabled/

# Remove the default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test the configuration
sudo nginx -t
# Should say: syntax is ok / test is successful

# Reload Nginx
sudo systemctl reload nginx
```

### 🔐 Obtain SSL Certificates

Run Certbot to automatically get certificates and modify the Nginx config for HTTPS:

```bash
sudo certbot --nginx \
  -d admin.yourdomain.com \
  -d order.yourdomain.com \
  -d api.yourdomain.com \
  --non-interactive \
  --agree-tos \
  --email your-email@example.com
```

Certbot will:
1. ✅ Verify you own each domain (via HTTP challenge)
2. 🔒 Obtain certificates from Let's Encrypt
3. ⚙️ Modify the Nginx config to use HTTPS
4. 🔄 Add automatic HTTP-to-HTTPS redirects

### ♻️ Verify Automatic Renewal

Certbot sets up a systemd timer for automatic renewal. Verify it's active:

```bash
sudo systemctl status certbot.timer

# Test renewal (dry run)
sudo certbot renew --dry-run
```

Let's Encrypt certificates are valid for 90 days. Certbot renews them automatically when they have less than 30 days remaining.

### ✅ Verify HTTPS

Visit your sites in a browser:

- 🔒 `https://admin.yourdomain.com`
- 🔒 `https://order.yourdomain.com`
- 🔒 `https://api.yourdomain.com/api/health`

You should see a padlock icon in the address bar.

---

## 🔗 Updating CORS After SSL Setup

Now that your sites use HTTPS, update the `CORS_ORIGINS` in your `.env` file:

```dotenv
CORS_ORIGINS=https://admin.yourdomain.com,https://order.yourdomain.com
```

Then restart the API server:

```bash
docker compose -f docker-compose.prod.yml restart server
```

## 🔧 Troubleshooting

### ❌ "Connection refused" errors

Ensure the Docker containers are running and ports are exposed on `127.0.0.1`:

```bash
docker compose -f docker-compose.prod.yml ps
curl http://127.0.0.1:3000/api/health
```

### 🔐 Certificate issuance fails

- ✅ Ensure DNS records point to your server (check with `dig admin.yourdomain.com`)
- ✅ Ensure ports 80 and 443 are open in the firewall (`sudo ufw status`)
- ✅ Ensure no other process is using port 80 (`sudo lsof -i :80`)

### 🔌 WebSocket connections fail

If the kitchen display or live order tracking doesn't work, verify the `/socket.io/` proxy block is present in your config and includes the `Upgrade` and `Connection` headers.

## ➡️ Next Step

Continue to **[Backups](/self-hosting/backups)** to set up automatic database backups.
