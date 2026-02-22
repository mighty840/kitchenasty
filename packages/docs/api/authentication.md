# 🔐 Authentication API

## 📝 Customer Registration

```
POST /api/auth/customer/register
```

**Request:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword",
  "phone": "+1234567890"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "token": "eyJhbG...",
    "customer": {
      "id": "cuid",
      "name": "Jane Doe",
      "email": "jane@example.com"
    }
  }
}
```

## 🔑 Customer Login

```
POST /api/auth/customer/login
```

**Request:**

```json
{
  "email": "jane@example.com",
  "password": "securepassword"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "token": "eyJhbG...",
    "customer": {
      "id": "cuid",
      "name": "Jane Doe",
      "email": "jane@example.com"
    }
  }
}
```

## 👨‍💼 Staff Login

```
POST /api/auth/staff/login
```

**Request:**

```json
{
  "email": "admin@kitchenasty.com",
  "password": "admin123"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "token": "eyJhbG...",
    "user": {
      "id": "cuid",
      "name": "Admin",
      "email": "admin@kitchenasty.com",
      "role": "SUPER_ADMIN"
    }
  }
}
```

## 👥 Staff Registration

```
POST /api/auth/staff/register
Authorization: Bearer <super-admin-token>
```

Only Super Admins can create new staff accounts.

**Request:**

```json
{
  "name": "New Staff",
  "email": "staff@kitchenasty.com",
  "password": "password123",
  "role": "STAFF",
  "locationId": "location-id"
}
```

## 👤 Get Current User

```
GET /api/auth/me
Authorization: Bearer <token>
```

Returns the currently authenticated user (staff or customer).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "email": "user@example.com",
    "name": "User Name",
    "type": "staff",
    "role": "MANAGER"
  }
}
```

## 🔵 Google OAuth

```
GET /api/auth/google
```

Redirects the user to Google's OAuth consent screen. After approval, redirects to `/api/auth/google/callback` which issues a JWT token.

Only available when `GOOGLE_CLIENT_ID` is configured.

## 🔷 Facebook OAuth

```
GET /api/auth/facebook
```

Redirects the user to Facebook's login dialog. After approval, redirects to `/api/auth/facebook/callback` which issues a JWT token.

Only available when `FACEBOOK_APP_ID` is configured.

## ⚠️ Error Cases

| Scenario | Status | Error |
|----------|--------|-------|
| ❌ Invalid credentials | `401` | Invalid email or password |
| 📧 Email already exists | `400` | Email already registered |
| 📋 Missing required fields | `400` | Validation error message |
| 🚫 Unauthorized staff registration | `403` | Forbidden |
