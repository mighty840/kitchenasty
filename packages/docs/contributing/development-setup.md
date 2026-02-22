# 🛠️ Development Setup

## 📋 Prerequisites

- 🟢 Node.js 22+
- 🐘 PostgreSQL 16+
- 🔀 Git

## 📥 Clone & Install

```bash
git clone https://github.com/kitchenasty/kitchenasty.git
cd kitchenasty
npm ci
```

## 🗄️ Database Setup

```bash
# Create database
createdb kitchenasty

# Configure connection
cp packages/server/.env.example packages/server/.env
# Edit .env with your PostgreSQL credentials

# Generate Prisma client
npx -w packages/server prisma generate --schema ../../prisma/schema.prisma

# Run migrations
npx -w packages/server prisma migrate dev --schema ../../prisma/schema.prisma

# Seed data
npx tsx prisma/seed.ts
```

## 🚀 Start Dev Servers

```bash
# Build shared types first
npm run build -w packages/shared

# Start all services (3 terminals)
npm run dev:server      # API on :3000
npm run dev:admin       # Admin on :5173
npm run dev:storefront  # Storefront on :5174
```

## 🧰 Useful Dev Tools

### 🔎 Prisma Studio

```bash
npx -w packages/server prisma studio --schema ../../prisma/schema.prisma
```

Opens a database browser at http://localhost:5555.

### 📚 Swagger UI

API documentation is available at http://localhost:3000/api/docs when the server is running.

### 📬 Mailhog (Email Testing)

```bash
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

Configure `SMTP_HOST=localhost` and `SMTP_PORT=1025` to capture emails at http://localhost:8025.

## ✏️ Editor Setup

- 📝 Use TypeScript strict mode (configured in `tsconfig.json`)
- 🧩 Install recommended VS Code extensions: ESLint, Prettier, Prisma
- 📄 The project uses `.ts` and `.tsx` files exclusively
