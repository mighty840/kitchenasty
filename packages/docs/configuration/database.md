# 🗄️ Database

KitchenAsty uses **PostgreSQL 16** with **Prisma ORM** for schema management, migrations, and queries.

## 🔌 Connection

Set the connection string in your `.env`:

```dotenv
DATABASE_URL=postgresql://user:password@host:5432/kitchenasty
```

## 📐 Prisma Schema

The schema lives at `prisma/schema.prisma` in the repository root. It defines 20+ models across domains like users, menu, orders, payments, reservations, and more.

See [Database Schema](/architecture/database-schema) for the full model reference.

## 🔄 Migrations

### 🆕 Generate a migration after schema changes

```bash
npx -w packages/server prisma migrate dev --schema ../../prisma/schema.prisma --name describe_your_change
```

### 🚀 Deploy migrations in production

```bash
npx -w packages/server prisma migrate deploy --schema ../../prisma/schema.prisma
```

### ⚡ Push schema without migrations (development)

```bash
npx -w packages/server prisma db push --schema ../../prisma/schema.prisma
```

## 🌱 Seeding

The seed script at `prisma/seed.ts` creates:

- 👤 A Super Admin user (`admin@kitchenasty.com` / `admin123`)
- 📍 A sample location with operating hours
- 🍽️ Menu categories and items with options
- 🪑 Tables for reservations
- ⚠️ Sample allergens

Run the seed:

```bash
npx tsx prisma/seed.ts
```

## 🔍 Prisma Studio

Browse and edit data with the built-in GUI:

```bash
npx -w packages/server prisma studio --schema ../../prisma/schema.prisma
```

Opens at http://localhost:5555.

## 🗑️ Reset

Drop all data and re-run migrations + seed:

```bash
npx -w packages/server prisma migrate reset --schema ../../prisma/schema.prisma
```

::: warning
This permanently deletes all data. Only use in development.
:::
