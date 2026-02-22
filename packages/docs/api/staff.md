# 👥 Staff API

## 📋 List Staff

```
GET /api/staff?page=1&limit=20&role=MANAGER&search=john&isActive=true
Authorization: Bearer <manager-or-admin-token>
```

Requires **MANAGER** or **SUPER_ADMIN** role.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | 📄 Page number (default: 1) |
| `limit` | number | 📊 Items per page (default: 20, max: 50) |
| `role` | string | 🏷️ Filter by role: `SUPER_ADMIN`, `MANAGER`, `STAFF` |
| `search` | string | 🔍 Search by name or email (case-insensitive) |
| `isActive` | string | ✅ Filter by active status: `true` or `false` |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "email": "staff@example.com",
      "name": "Jane Doe",
      "role": "STAFF",
      "phone": null,
      "isActive": true,
      "locationId": "cuid",
      "location": { "id": "cuid", "name": "Downtown" },
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

## 🔍 Get Staff Member

```
GET /api/staff/:id
Authorization: Bearer <manager-or-admin-token>
```

Requires **MANAGER** or **SUPER_ADMIN** role.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "email": "staff@example.com",
    "name": "Jane Doe",
    "role": "STAFF",
    "phone": null,
    "isActive": true,
    "locationId": "cuid",
    "location": { "id": "cuid", "name": "Downtown" },
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

## ✏️ Update Staff Member

```
PATCH /api/staff/:id
Authorization: Bearer <super-admin-token>
```

Requires **SUPER_ADMIN** role. Cannot change your own role.

**Request:**

```json
{
  "name": "Jane Smith",
  "role": "MANAGER",
  "phone": "+1234567890",
  "locationId": "cuid",
  "isActive": true
}
```

All fields are optional.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "email": "staff@example.com",
    "name": "Jane Smith",
    "role": "MANAGER",
    "phone": "+1234567890",
    "isActive": true,
    "locationId": "cuid",
    "location": { "id": "cuid", "name": "Downtown" }
  }
}
```

## 🚫 Deactivate Staff Member

```
DELETE /api/staff/:id
Authorization: Bearer <super-admin-token>
```

Requires **SUPER_ADMIN** role. Sets `isActive` to `false`. Cannot deactivate yourself.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": { "message": "Staff member deactivated" }
}
```

## 📨 Invite Staff

```
POST /api/staff/invite
Authorization: Bearer <super-admin-token>
```

Requires **SUPER_ADMIN** role. Creates a single-use invite token and sends an email.

**Request:**

```json
{
  "email": "newstaff@example.com",
  "name": "Optional Name",
  "role": "STAFF"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `email` | ✅ Yes | Email address for the invitation |
| `name` | ❌ No | Pre-filled name suggestion |
| `role` | ❌ No | Role to assign (default: `STAFF`) |

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "email": "newstaff@example.com",
    "role": "STAFF",
    "expiresAt": "2025-01-08T00:00:00.000Z"
  }
}
```

## 🔗 Validate Invite Token

```
GET /api/staff/invite/:token
```

**Public endpoint** — no authentication required.

Returns the invite details if the token is valid, unused, and not expired.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "email": "newstaff@example.com",
    "role": "STAFF"
  }
}
```

## ✅ Accept Invite

```
POST /api/staff/accept-invite
```

**Public endpoint** — no authentication required.

Creates a new user account and returns a JWT.

**Request:**

```json
{
  "token": "hex-invite-token",
  "name": "Jane Doe",
  "password": "securepassword"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "token": "eyJhbG...",
    "user": {
      "id": "cuid",
      "email": "newstaff@example.com",
      "name": "Jane Doe",
      "role": "STAFF"
    }
  }
}
```

## ⚠️ Error Cases

| Scenario | Status | Error |
|----------|--------|-------|
| 🔒 Not authenticated | `401` | Authentication required |
| 🚫 Insufficient role | `403` | Insufficient permissions |
| 🔍 Staff not found | `404` | Staff member not found |
| 📧 Email already exists (invite) | `409` | A user with this email already exists |
| 🔗 Token already used | `400` | This invite has already been used |
| ⏰ Token expired | `400` | This invite has expired |
| 🚫 Self-demotion | `400` | Cannot change your own role |
| 🚫 Self-deactivation | `400` | Cannot deactivate your own account |
