# 🖥️ Self-Hosting Overview

KitchenAsty is designed to be self-hosted on your own server or cloud instance. This guide walks you through everything you need to go from a blank server to a fully running restaurant ordering platform with HTTPS, backups, and monitoring.

## 🎯 What You Will Set Up

By the end of this guide, you will have:

- 🚀 A production server running KitchenAsty (API, Admin Dashboard, Storefront)
- 🗄️ PostgreSQL database with automatic backups
- 🔒 HTTPS with free SSL certificates from Let's Encrypt
- 🔀 A reverse proxy routing traffic to each service
- 🛡️ Firewall rules protecting your server
- ♻️ Automatic container restarts on failure
- 📦 A process for updating to new versions

## 🏗️ Architecture Overview

```
                    Internet
                       │
                       ▼
              ┌────────────────┐
              │   Your Domain  │
              │  (Cloudflare   │
              │   or direct)   │
              └───────┬────────┘
                      │
                      ▼
              ┌────────────────┐
              │ Reverse Proxy  │
              │ (Caddy/Nginx)  │
              │   + SSL/TLS    │
              └───────┬────────┘
                      │
        ┌─────────────┼──────────────┐
        │             │              │
        ▼             ▼              ▼
   ┌─────────┐  ┌──────────┐  ┌──────────┐
   │  Admin   │  │Storefront│  │   API    │
   │  :5173   │  │  :5174   │  │  :3000   │
   └─────────┘  └──────────┘  └──────────┘
                                    │
                                    ▼
                             ┌──────────┐
                             │PostgreSQL│
                             │  :5432   │
                             └──────────┘
```

## ☁️ Hosting Options

You can host KitchenAsty on any Linux server. Here are some popular choices:

| Provider | Smallest Plan | Approximate Cost | Notes |
|----------|--------------|------------------|-------|
| [Hetzner](https://www.hetzner.com/cloud) | CX22 (2 vCPU, 4 GB) | ~$5/month | 💎 Excellent value, EU and US locations |
| [DigitalOcean](https://www.digitalocean.com) | Basic Droplet (1 vCPU, 2 GB) | $6/month | 📖 Simple interface, good docs |
| [Linode (Akamai)](https://www.linode.com) | Nanode (1 vCPU, 2 GB) | $5/month | ⚡ Solid performance |
| [Vultr](https://www.vultr.com) | Cloud Compute (1 vCPU, 2 GB) | $6/month | 🌍 Global locations |
| [AWS Lightsail](https://aws.amazon.com/lightsail) | 2 GB instance | $10/month | ☁️ AWS ecosystem |
| Home server / Raspberry Pi 5 | — | Electricity cost | 🏠 Needs port forwarding and dynamic DNS |

::: tip 💡 Recommendation
For a single-location restaurant, a **2 GB RAM / 1 vCPU** server is sufficient. If you expect heavy traffic or run multiple locations, choose **4 GB RAM / 2 vCPU** or higher.
:::

## 🌐 Domain Names

You will need a domain name (e.g., `yourdomain.com`). We recommend setting up three subdomains:

| Subdomain | Purpose |
|-----------|---------|
| 🔧 `admin.yourdomain.com` | Admin Dashboard (staff-only) |
| 🛒 `order.yourdomain.com` | Customer Storefront |
| 🔌 `api.yourdomain.com` | API Server (optional — can be proxied via `/api/` paths) |

You can purchase a domain from any registrar (Namecheap, Cloudflare Registrar, Google Domains, GoDaddy, etc.).

## 📖 Guide Structure

Follow these pages in order:

1. 🖥️ **[Server Setup](/self-hosting/server-setup)** — Provision a server, install Docker, and configure the firewall
2. 🐳 **[Docker Compose Production](/self-hosting/docker-compose)** — Configure and launch all KitchenAsty services
3. 🌐 **[Domain & DNS](/self-hosting/domain-dns)** — Point your domain to the server
4. 🔒 **[Reverse Proxy & SSL](/self-hosting/reverse-proxy-ssl)** — Set up Caddy or Nginx with automatic HTTPS
5. 💾 **[Backups](/self-hosting/backups)** — Automate database and file backups
6. 🔧 **[Maintenance](/self-hosting/maintenance)** — Updates, monitoring, and troubleshooting
