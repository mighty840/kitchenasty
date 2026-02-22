# 📋 Requirements

## 🐳 Docker Installation (Recommended)

| Requirement | Minimum Version |
|------------|----------------|
| Docker | 24+ |
| Docker Compose | v2+ |

That's it — Docker handles everything else.

## 🔧 Manual Installation

| Requirement | Minimum Version | Notes |
|------------|----------------|-------|
| Node.js | 22+ | LTS recommended |
| npm | 10+ | Comes with Node.js 22 |
| PostgreSQL | 16+ | 15 may work but is untested |
| Git | 2.x | For cloning the repo |

## 🔌 Optional Services

| Service | Purpose |
|---------|---------|
| Stripe account | 💳 Credit card payments |
| PayPal developer account | 💰 PayPal payments |
| Google Cloud project | 🔑 Google OAuth social login |
| Facebook developer app | 🔑 Facebook social login |
| SMTP server | 📧 Transactional email (Mailhog for development) |

## 💻 Hardware

KitchenAsty is lightweight. For a single-location restaurant:

- 🖥️ **CPU**: 1 core
- 🧠 **RAM**: 1 GB
- 💾 **Disk**: 1 GB + space for uploaded images

For multi-location deployments, see the [Scaling](/deployment/scaling) guide.
