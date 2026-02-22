# 🔌 API Overview

KitchenAsty exposes a RESTful JSON API at `/api/`.

## 🌐 Base URL

```
http://localhost:3000/api
```

## 🔐 Authentication

Protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Obtain a token via the [Authentication](/api/authentication) endpoints.

## 📦 Response Format

All responses follow a consistent shape:

### ✅ Success

```json
{
  "success": true,
  "data": { ... }
}
```

### 📄 Success with Pagination

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### ❌ Error

```json
{
  "success": false,
  "error": "Description of the error"
}
```

## 📑 Pagination

List endpoints support pagination via query parameters:

| Parameter | Description | Default |
|-----------|------------|---------|
| `page` | Page number | `1` |
| `limit` | Items per page | `20` |

## 🔢 Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | ✅ Success |
| `201` | ✅ Created |
| `400` | ⚠️ Bad request (validation error) |
| `401` | 🔒 Unauthorized (missing or invalid token) |
| `403` | 🚫 Forbidden (insufficient permissions) |
| `404` | 🔍 Not found |
| `429` | ⏱️ Too many requests (rate limited) |
| `500` | 💥 Internal server error |

## ⏱️ Rate Limiting

All `/api/` endpoints are rate-limited:

- **100 requests** per **15-minute window** per IP address
- Returns `429` with a JSON error when exceeded
- Standard `RateLimit-*` headers are included in responses

## 📚 OpenAPI / Swagger

Interactive API documentation is available at:

- 🖥️ **Swagger UI**: http://localhost:3000/api/docs
- 📋 **OpenAPI JSON**: http://localhost:3000/api/openapi.json

## 💚 Health Check

```
GET /api/health
```

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2025-01-01T00:00:00.000Z",
    "version": "1.0.0"
  }
}
```
