# 🛡️ CORS & Security

KitchenAsty includes several security measures out of the box.

## 🌐 CORS

Cross-Origin Resource Sharing is configured via the `CORS_ORIGINS` environment variable:

```dotenv
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

The server parses this comma-separated list and allows requests from those origins with `credentials: true`.

In production, set this to your actual domain(s):

```dotenv
CORS_ORIGINS=https://admin.yourrestaurant.com,https://order.yourrestaurant.com
```

## 🪖 Helmet

[Helmet](https://helmetjs.github.io/) sets various HTTP security headers:

- 🔒 `X-Content-Type-Options: nosniff`
- 🖼️ `X-Frame-Options: SAMEORIGIN`
- 🔐 `Strict-Transport-Security` (in production)
- 📜 Content Security Policy headers
- And more

Helmet is enabled by default with standard settings.

## 🚦 Rate Limiting

API endpoints are rate-limited to prevent abuse:

| Setting | Value |
|---------|-------|
| Window | 15 minutes |
| Max requests per IP | 100 |
| Headers | Standard (`RateLimit-*`) |
| Response on limit | `429 Too Many Requests` |

```json
{
  "success": false,
  "error": "Too many requests, please try again later."
}
```

Rate limiting is disabled in the `test` environment to avoid interfering with automated tests.

## 📋 Request Logging

HTTP request logging uses [Morgan](https://github.com/expressjs/morgan) in `dev` format. Logging is disabled in the `test` environment.

## 🔐 Production Security Tips

- 🔑 Set a strong, unique `JWT_SECRET` (at least 32 characters)
- 🔒 Use HTTPS in production — terminate TLS at your reverse proxy (nginx, Cloudflare, etc.)
- 🌐 Restrict `CORS_ORIGINS` to your actual frontend domains
- 📦 Keep dependencies updated with `npm audit`
- 🚦 Consider increasing rate limits for high-traffic locations or adding per-user limits
- 🧱 Use a web application firewall (WAF) for additional protection
