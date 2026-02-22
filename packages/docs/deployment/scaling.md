# 📈 Scaling

Strategies for scaling KitchenAsty beyond a single server.

## 🖥️ Multiple API Server Instances

Run multiple instances of the API server behind a load balancer (nginx, HAProxy, or a cloud load balancer).

```
                    ┌─── Server 1 (:3000)
Load Balancer ──────┼─── Server 2 (:3001)
                    └─── Server 3 (:3002)
```

All instances connect to the same PostgreSQL database.

## 🔴 Redis Adapter for Socket.IO

When running multiple server instances, Socket.IO events need to be shared across instances. Use the Redis adapter:

```bash
npm install @socket.io/redis-adapter redis
```

```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

This ensures that events emitted on one server instance are delivered to clients connected to any instance.

## 🗄️ Database Connection Pooling

For high-traffic deployments, use [PgBouncer](https://www.pgbouncer.org/) as a connection pooler in front of PostgreSQL:

```
Server instances → PgBouncer → PostgreSQL
```

Update the `DATABASE_URL` to point to PgBouncer instead of PostgreSQL directly.

## 🌐 CDN for Static Assets

Serve the admin and storefront static builds from a CDN:

1. Build the frontends: `npm run build`
2. Upload `packages/admin/dist/` and `packages/storefront/dist/` to your CDN
3. Configure the CDN to serve `index.html` for all routes (SPA fallback)

## 📌 Session Stickiness

If not using the Redis adapter for Socket.IO, you'll need sticky sessions to ensure WebSocket connections stay with the same server instance. Most load balancers support this via cookies or IP hashing.

With the Redis adapter, sticky sessions are not required.

## 📖 Database Read Replicas

For read-heavy workloads, set up PostgreSQL read replicas and configure Prisma to route reads to replicas:

```
Write queries → Primary
Read queries  → Replica(s)
```

This is an advanced configuration typically needed only at very high traffic levels.
