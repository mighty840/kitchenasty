# 🔧 Install Manually

For local development or environments where Docker is not available.

## 1. 📥 Clone & Install Dependencies

```bash
git clone https://github.com/kitchenasty/kitchenasty.git
cd kitchenasty
npm ci
```

## 2. 🗄️ Set Up PostgreSQL

Create a database and user:

```sql
CREATE USER kitchenasty WITH PASSWORD 'kitchenasty';
CREATE DATABASE kitchenasty OWNER kitchenasty;
```

## 3. ⚙️ Configure Environment

```bash
cp packages/server/.env.example packages/server/.env
```

Edit `packages/server/.env`:

```dotenv
DATABASE_URL=postgresql://kitchenasty:kitchenasty@localhost:5432/kitchenasty
JWT_SECRET=your-random-secret-here
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

## 4. 🔄 Generate Prisma Client & Migrate

```bash
npx -w packages/server prisma generate --schema ../../prisma/schema.prisma
npx -w packages/server prisma migrate deploy --schema ../../prisma/schema.prisma
```

## 5. 🌱 Seed the Database

```bash
npx tsx prisma/seed.ts
```

This creates a default admin user, sample location, categories, menu items, and tables.

## 6. 📦 Build Shared Package

The shared package must be built before the frontends can import its types:

```bash
npm run build -w packages/shared
```

## 7. 🚀 Start Development Servers

Open three terminals:

```bash
# Terminal 1 — API server
npm run dev:server

# Terminal 2 — Admin dashboard
npm run dev:admin

# Terminal 3 — Storefront
npm run dev:storefront
```

| Service | URL |
|---------|-----|
| API Server | http://localhost:3000 |
| Admin Dashboard | http://localhost:5173 |
| Storefront | http://localhost:5174 |

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@kitchenasty.com | admin123 |

## 🧰 Useful Commands

```bash
# Open Prisma Studio (database GUI)
npx -w packages/server prisma studio --schema ../../prisma/schema.prisma

# Reset database (drops all data)
npx -w packages/server prisma migrate reset --schema ../../prisma/schema.prisma

# Run all tests
npm test
```
