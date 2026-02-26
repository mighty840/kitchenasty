# 🚀 Introduction

KitchenAsty is a self-hosted, open-source restaurant ordering platform built with a modern TypeScript stack. It gives restaurant owners full control over online ordering, kitchen operations, reservations, and customer engagement — without monthly SaaS fees.

![KitchenAsty Storefront](/screenshots/storefront-home.png)

## ✨ Key Features

- 🛒 **Online Ordering** — Delivery & pickup with guest checkout and scheduled orders
- 🍳 **Kitchen Display** — Real-time order board powered by Socket.IO
- 📍 **Multi-Location** — Independent menus, hours, delivery zones, and staff per location
- 💳 **Payments** — Stripe, PayPal, and cash with webhook-driven status updates
- 📅 **Reservations** — Table booking with availability checks and party size validation
- ⭐ **Reviews & Ratings** — Customer reviews with staff moderation
- 🎁 **Loyalty Program** — Points-based earn/redeem system
- 🏷️ **Coupons** — Percentage, fixed, and free-delivery discounts
- ⚡ **Automation** — Event-driven rules for email, webhooks, and SMS notifications
- 📊 **Analytics** — Revenue, order, and customer stats with date-range charts
- 🌍 **Internationalization** — 6 languages out of the box (EN, ES, FR, DE, IT, PT)
- 🛠️ **Admin Dashboard** — Full back-office for managing every aspect of the platform

![Admin Dashboard](/screenshots/admin-dashboard.png)

## 🏗️ Architecture Overview

KitchenAsty is a monorepo with four packages:

```
kitchenasty/
├── packages/server      # Express + Prisma REST API
├── packages/admin       # React admin dashboard (Vite)
├── packages/storefront  # React customer-facing app (Vite)
├── packages/shared      # Shared types and utilities
└── prisma/              # Database schema and seeds
```

| Layer | Technology |
|-------|-----------|
| API Server | Node.js 22, Express, TypeScript |
| Database | PostgreSQL 16 with Prisma ORM |
| Real-Time | Socket.IO |
| Admin UI | React 18, Vite, Tailwind CSS, Recharts |
| Storefront | React 18, Vite, Tailwind CSS, i18next |
| Payments | Stripe, PayPal |
| Auth | JWT, Passport.js (Google & Facebook OAuth) |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions |

## 🌐 Live Demo

Want to try it before installing? Check out the **[live demo](https://demo.kitchenasty.com)** — no setup required.

- Storefront: [demo.kitchenasty.com](https://demo.kitchenasty.com)
- Admin: [demo.kitchenasty.com/admin](https://demo.kitchenasty.com/admin/) (login: `admin@kitchenasty.com` / `admin123`)

The demo resets every 2 hours and is rate-limited. See the [Live Demo](/guide/live-demo) page for details.

## 👉 Next Steps

- 📋 [Requirements](/guide/requirements) — What you need before installing
- 🐳 [Install with Docker](/guide/installation-docker) — Fastest way to get running
- 🔧 [Install Manually](/guide/installation-manual) — For development or custom setups
