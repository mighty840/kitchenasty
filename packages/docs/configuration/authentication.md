# 🔑 Authentication

KitchenAsty uses **JWT (JSON Web Tokens)** for stateless authentication.

## ⚙️ Configuration

```dotenv
JWT_SECRET=your-random-secret-here
JWT_EXPIRES_IN=7d
```

- 🔐 `JWT_SECRET` — Used to sign and verify tokens. Must be a strong, random string in production.
- ⏱️ `JWT_EXPIRES_IN` — Token lifetime. Accepts values like `7d`, `24h`, `3600` (seconds).

## 🎫 Token Format

Tokens are issued on login and included in the `Authorization` header:

```
Authorization: Bearer <token>
```

The JWT payload contains:

```json
{
  "id": "cuid",
  "email": "user@example.com",
  "type": "staff",
  "role": "SUPER_ADMIN"
}
```

`type` is either `"staff"` (User model) or `"customer"` (Customer model).

## 👥 Roles

| Role | Description | Permissions |
|------|-------------|------------|
| `SUPER_ADMIN` | Full access | Everything including delete operations and staff management |
| `MANAGER` | Location management | Create/edit menu, orders, locations, coupons, automation |
| `STAFF` | Day-to-day operations | View and update orders, reservations, reviews |

## 🔒 Middleware

Four middleware functions control access:

| Middleware | Effect |
|-----------|--------|
| `authenticate` | Requires a valid JWT. Rejects with 401 if missing or invalid. |
| `optionalAuth` | Parses JWT if present but does not reject unauthenticated requests. Used for guest checkout. |
| `requireStaff` | Requires `type: "staff"`. Rejects customers with 403. |
| `requireRole(...roles)` | Requires the user's role to be one of the specified roles. Rejects with 403. |

### 📝 Example route protection

```typescript
// Any authenticated user
router.get('/me', authenticate, getMe);

// Staff only
router.get('/orders', authenticate, requireStaff, listOrders);

// Manager or Super Admin
router.post('/items', authenticate, requireStaff, requireRole('SUPER_ADMIN', 'MANAGER'), createMenuItem);
```

## 🔗 Social Login

See [Social Login](/configuration/social-login) for Google and Facebook OAuth configuration.
