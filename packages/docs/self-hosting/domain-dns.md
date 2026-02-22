# 🌐 Domain & DNS

This page explains how to point your domain name to your KitchenAsty server.

## 📋 What You Need

- 🌐 A registered domain name (e.g., `yourdomain.com`)
- 🖥️ Your server's public IP address (e.g., `203.0.113.50`)
- 🔧 Access to your domain registrar's DNS settings

## 1️⃣ Step 1: Access Your DNS Settings

Log in to your domain registrar (Namecheap, Cloudflare, GoDaddy, Google Domains, etc.) and navigate to the DNS management page for your domain.

## 2️⃣ Step 2: Create DNS Records

Add the following **A records** pointing to your server's IP address:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `admin` | `203.0.113.50` | 300 |
| A | `order` | `203.0.113.50` | 300 |
| A | `api` | `203.0.113.50` | 300 |

This creates three subdomains:
- 🔧 `admin.yourdomain.com` — Admin Dashboard
- 🛒 `order.yourdomain.com` — Customer Storefront
- 🔌 `api.yourdomain.com` — API Server

::: tip ☁️ Using Cloudflare?
If you use Cloudflare as your DNS provider, you get free DDoS protection and caching. Set the **Proxy status** to "Proxied" (orange cloud icon) for the `admin` and `order` subdomains. For the `api` subdomain, you may want to keep it "DNS only" (grey cloud) to avoid issues with WebSocket connections, unless you configure Cloudflare WebSocket support.
:::

## 3️⃣ Step 3: Verify DNS Propagation

DNS changes can take anywhere from a few minutes to 48 hours to propagate, though it's usually under 10 minutes.

Check propagation from your server:

```bash
# Check admin subdomain
dig admin.yourdomain.com +short
# Should return: 203.0.113.50

# Check order subdomain
dig order.yourdomain.com +short
# Should return: 203.0.113.50

# Check API subdomain
dig api.yourdomain.com +short
# Should return: 203.0.113.50
```

If `dig` is not installed:

```bash
sudo apt install -y dnsutils
```

You can also check propagation from external tools:
- 🔍 [dnschecker.org](https://dnschecker.org)
- 🌍 [whatsmydns.net](https://www.whatsmydns.net)

## 🔀 Alternative: Single Domain with Path-Based Routing

If you prefer not to use subdomains, you can use a single domain with path-based routing:

| Path | Service |
|------|---------|
| 🛒 `yourdomain.com/` | Customer Storefront |
| 🔧 `yourdomain.com/admin/` | Admin Dashboard |
| 🔌 `yourdomain.com/api/` | API Server |

In this case, create a single A record:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `203.0.113.50` | 300 |

The reverse proxy configuration (next step) will handle routing by path instead of subdomain.

## 📖 Registrar-Specific Instructions

### 🟢 Namecheap

1. Log in to Namecheap → **Domain List** → **Manage** next to your domain
2. Click **Advanced DNS**
3. Click **Add New Record** for each A record above
4. Set **Type** to `A Record`, **Host** to the subdomain name, **Value** to your IP

### ☁️ Cloudflare

1. Log in to Cloudflare → Select your domain
2. Go to **DNS** → **Records**
3. Click **Add Record** for each entry above

### 🔵 GoDaddy

1. Log in to GoDaddy → **My Products** → **DNS** next to your domain
2. Click **Add** in the Records section
3. Select **A** type, enter the subdomain in **Name**, your IP in **Value**

### 🔴 Google Domains (now Squarespace)

1. Log in to [domains.google.com](https://domains.google.com)
2. Click your domain → **DNS** in the left sidebar
3. Scroll to **Custom records** → Click **Manage custom records**
4. Add each A record

## ➡️ Next Step

Once DNS is propagating, continue to **[Reverse Proxy & SSL](/self-hosting/reverse-proxy-ssl)** to enable HTTPS.
