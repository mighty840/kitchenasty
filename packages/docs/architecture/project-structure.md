# 🏗️ Project Structure

KitchenAsty is organized as an npm workspaces monorepo.

## 📂 Directory Tree

```
kitchenasty/
├── packages/
│   ├── server/          # Express API server
│   │   ├── src/
│   │   │   ├── controllers/    # Route handlers
│   │   │   ├── middleware/     # Auth, upload, etc.
│   │   │   ├── routes/         # Express router definitions
│   │   │   ├── lib/            # Utilities (events, passport, openapi)
│   │   │   ├── __tests__/      # Unit and integration tests
│   │   │   └── app.ts          # Express app setup
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── admin/           # React admin dashboard
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── pages/          # Page components (routes)
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── lib/            # API client, utilities
│   │   │   └── App.tsx         # Root component with routing
│   │   ├── Dockerfile
│   │   ├── nginx.conf
│   │   └── package.json
│   │
│   ├── storefront/      # React customer-facing app
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── pages/          # Page components
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── i18n/           # Internationalization config + locales
│   │   │   ├── lib/            # API client, cart state
│   │   │   └── App.tsx         # Root component
│   │   ├── Dockerfile
│   │   ├── nginx.conf
│   │   └── package.json
│   │
│   ├── shared/          # Shared types and utilities
│   │   ├── src/
│   │   │   ├── types/          # TypeScript interfaces
│   │   │   └── index.ts        # Public API
│   │   └── package.json
│   │
│   └── docs/            # This documentation site (VitePress)
│
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seed script
│
├── e2e/                 # Playwright E2E tests
│
├── .github/
│   └── workflows/
│       └── ci.yml       # GitHub Actions CI pipeline
│
├── docker-compose.yml   # Full-stack Docker setup
├── package.json         # Root workspace config
└── tsconfig.json        # Base TypeScript config
```

## 📦 Package Responsibilities

| Package | Purpose | Port |
|---------|---------|------|
| `packages/server` | REST API, WebSocket server, business logic | 3000 |
| `packages/admin` | Staff dashboard for managing the restaurant | 5173 |
| `packages/storefront` | Customer-facing ordering and reservation app | 5174 |
| `packages/shared` | TypeScript types shared between packages | — |
| `packages/docs` | Developer documentation (VitePress) | 5175 |

## 🔧 Key Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Workspace definitions and root scripts |
| `tsconfig.json` | Base TypeScript compiler options |
| `docker-compose.yml` | Multi-container Docker setup |
| `prisma/schema.prisma` | Database schema (Prisma) |
| `.github/workflows/ci.yml` | CI pipeline (lint, test, build) |
| `playwright.config.ts` | E2E test configuration |
