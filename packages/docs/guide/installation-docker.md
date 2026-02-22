# 🐳 Install with Docker

The fastest way to get KitchenAsty running. Docker Compose starts the API server, admin dashboard, storefront, and PostgreSQL in one command.

## 1. 📥 Clone the Repository

```bash
git clone https://github.com/kitchenasty/kitchenasty.git
cd kitchenasty
```

## 2. ⚙️ Configure Environment

```bash
cp packages/server/.env.example packages/server/.env
```

Edit `packages/server/.env` and set at minimum:

```dotenv
DATABASE_URL=postgresql://kitchenasty:kitchenasty@postgres:5432/kitchenasty
JWT_SECRET=your-random-secret-here
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

See [Environment Variables](/configuration/environment-variables) for the full reference.

## 3. 🚀 Start Services

```bash
docker compose up --build
```

This starts:

| Service | URL |
|---------|-----|
| API Server | http://localhost:3000 |
| Admin Dashboard | http://localhost:5173 |
| Storefront | http://localhost:5174 |
| PostgreSQL | localhost:5432 |

## 4. 🗄️ Run Migrations & Seed

In a separate terminal, run the database setup inside the server container:

```bash
docker compose exec server npx prisma migrate deploy --schema ../../prisma/schema.prisma
docker compose exec server npx tsx ../../prisma/seed.ts
```

## 5. ✅ Access the Platform

### 🛠️ Admin Dashboard

- URL: http://localhost:5173
- Email: `admin@kitchenasty.com`
- Password: `admin123`

### 🛍️ Storefront

- URL: http://localhost:5174
- Register a new customer account or browse as a guest

### 📖 API Documentation

- Swagger UI: http://localhost:3000/api/docs
- OpenAPI spec: http://localhost:3000/api/openapi.json

## 🛑 Stopping

```bash
docker compose down
```

To also remove the database volume:

```bash
docker compose down -v
```

## 🔄 Rebuilding

After pulling changes:

```bash
docker compose up --build
```

## 🔍 Troubleshooting

### 🚧 Port conflicts

If ports 3000, 5173, 5174, or 5432 are in use, edit `docker-compose.yml` and change the host port mappings (left side of the colon).

### 🔌 Database connection refused

The server waits for PostgreSQL to be healthy before starting. If you still see connection errors, check that the `DATABASE_URL` in your `.env` uses `postgres` (the Docker service name) as the host, not `localhost`.
