# 🔒 Middleware

The Express server uses several middleware layers for security, authentication, and request processing.

## 📚 Middleware Stack

Applied in order in `app.ts`:

1. 🪖 **Helmet** — Security headers
2. 🌐 **CORS** — Cross-origin request handling
3. 📋 **Morgan** — HTTP request logging (disabled in test)
4. 🚦 **Rate Limiter** — Request throttling (disabled in test)
5. 📨 **Raw Body** — For Stripe webhooks (`/api/payments/webhook`)
6. 📝 **JSON Parser** — `express.json()`
7. 🔗 **URL-Encoded Parser** — `express.urlencoded()`
8. 🔑 **Passport** — OAuth initialization
9. 📁 **Static Files** — Serve `/uploads/` directory

## 🔐 Authentication Middleware

Defined in `packages/server/src/middleware/auth.ts`:

### `authenticate`

Requires a valid JWT Bearer token. Decodes the token and attaches the user to `req.user`.

```typescript
// Rejects with 401 if token is missing or invalid
router.get('/me', authenticate, getMe);
```

### `optionalAuth`

Parses the JWT if present but does **not** reject unauthenticated requests. Used for endpoints that support both authenticated and guest users.

```typescript
// Allows guest checkout
router.post('/orders', optionalAuth, createOrder);
```

### `requireStaff`

Checks that `req.user.type === 'staff'`. Rejects customers with 403.

```typescript
router.get('/orders', authenticate, requireStaff, listOrders);
```

### `requireRole(...roles)`

Higher-order middleware that checks if the user's role is in the allowed list.

```typescript
// Only SUPER_ADMIN and MANAGER can create menu items
router.post('/items', authenticate, requireStaff, requireRole('SUPER_ADMIN', 'MANAGER'), createMenuItem);
```

## 🎫 Token Generation

```typescript
function generateToken(payload: JwtPayload): string
```

Creates a JWT with the configured `JWT_SECRET` and `JWT_EXPIRES_IN`.

The payload includes:

| Field | Type | Description |
|-------|------|------------|
| `id` | string | User or customer ID |
| `email` | string | Email address |
| `type` | `"staff"` or `"customer"` | Account type |
| `role` | Role enum | Only for staff |

## 📤 Upload Middleware

Defined in `packages/server/src/middleware/upload.ts`:

Uses [Multer](https://github.com/expressjs/multer) for multipart file uploads:

- 💾 **Storage**: Disk storage in `uploads/` directory
- 🏷️ **Filenames**: UUID-based to prevent collisions
- 🖼️ **File filter**: JPEG, PNG, WebP, GIF only
- 📏 **Size limit**: 5 MB

```typescript
router.post('/items/:id/image', authenticate, requireStaff, upload.single('image'), uploadMenuItemImage);
```

## 🚦 Rate Limiting

Uses [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit):

| Setting | Value |
|---------|-------|
| Window | 15 minutes |
| Max requests | 100 per IP |
| Headers | Standard `RateLimit-*` |
| Skip | Test environment |
