# 🔐 Environment Variables

All server configuration is managed through environment variables in `packages/server/.env`.

## ⚙️ Core

| Variable | Description | Default | Required |
|----------|------------|---------|----------|
| `PORT` | API server port | `3000` | No |
| `NODE_ENV` | Environment (`development`, `production`, `test`) | `development` | No |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:5173,http://localhost:5174` | Yes |
| `DATABASE_URL` | PostgreSQL connection string | — | Yes |

The server uses pretty-printed logs in `development`, JSON logs in `production`, and silent application logging in `test`. `LOG_LEVEL` overrides the default level (`debug` in development, `info` in production), except in test mode where logs remain silent. The same Docker image supports all three modes; Compose reads `NODE_ENV` from the shell or root `.env` and defaults to `development`. Running the image directly defaults to `production`.

## 🔑 Authentication

| Variable | Description | Default | Required |
|----------|------------|---------|----------|
| `JWT_SECRET` | Secret key for signing JWT tokens | — | Yes |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` | No |

## 💳 Payments

| Variable | Description | Default | Required |
|----------|------------|---------|----------|
| `STRIPE_SECRET_KEY` | Stripe secret API key (`sk_test_...` or `sk_live_...`) | — | No |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) | — | No |
| `PAYPAL_CLIENT_ID` | PayPal REST API client ID | — | No |
| `PAYPAL_CLIENT_SECRET` | PayPal REST API secret | — | No |
| `PAYU_POS_ID` | PayU Europe POS ID (also used as OAuth client ID) | — | No |
| `PAYU_CLIENT_SECRET` | PayU Europe OAuth client secret | — | No |
| `PAYU_SECOND_KEY` | PayU Europe key used to verify notifications | — | No |
| `PAYU_SANDBOX` | Use the PayU sandbox (`false` selects production) | `true` | No |
| `PAYU_NOTIFY_URL` | Public full URL for the PayU notification endpoint | — | No |

## 🔗 Social Login

| Variable | Description | Default | Required |
|----------|------------|---------|----------|
| `BASE_URL` | Public base URL for OAuth callbacks | `http://localhost:3000` | No |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID | — | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 client secret | — | No |
| `FACEBOOK_APP_ID` | Facebook app ID | — | No |
| `FACEBOOK_APP_SECRET` | Facebook app secret | — | No |

## 📧 Email

| Variable | Description | Default | Required |
|----------|------------|---------|----------|
| `SMTP_HOST` | SMTP server hostname | — | No |
| `SMTP_PORT` | SMTP server port | `587` | No |
| `SMTP_USER` | SMTP username | — | No |
| `SMTP_PASS` | SMTP password | — | No |
| `EMAIL_FROM` | Default "from" address | — | No |

## 📄 Example `.env` File

```dotenv
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173,http://localhost:5174

DATABASE_URL=postgresql://kitchenasty:kitchenasty@localhost:5432/kitchenasty

# Required. The server refuses to start without it. Generate with: openssl rand -hex 32
JWT_SECRET=
JWT_EXPIRES_IN=7d

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYU_POS_ID=
PAYU_CLIENT_SECRET=
PAYU_SECOND_KEY=
PAYU_SANDBOX=true
PAYU_NOTIFY_URL=
```

::: tip
In Docker Compose, the database host should be `postgres` (the service name), not `localhost`.
:::
