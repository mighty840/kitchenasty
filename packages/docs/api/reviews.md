# ⭐ Reviews API

## 🌐 List Public Reviews

```
GET /api/reviews/location/:locationId
```

Public. Returns approved reviews for a location.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "rating": 5,
      "comment": "Amazing food and fast delivery!",
      "isApproved": true,
      "createdAt": "2025-06-15T12:00:00Z",
      "customer": {
        "name": "Jane Doe"
      }
    }
  ]
}
```

## ✍️ Submit Review

```
POST /api/reviews
Authorization: Bearer <customer-token>
```

**Request:**

```json
{
  "locationId": "location-id",
  "orderId": "order-id",
  "rating": 5,
  "comment": "Amazing food and fast delivery!"
}
```

**Response:** `201 Created`

Reviews are created with `isApproved: false` and must be moderated by staff.

## 📋 List All Reviews (Staff)

```
GET /api/reviews
Authorization: Bearer <staff-token>
```

Returns all reviews including unapproved ones.

## ✅ Moderate Review

```
PATCH /api/reviews/:id
Authorization: Bearer <staff-token>
```

**Request:**

```json
{
  "isApproved": true
}
```

## 🗑️ Delete Review

```
DELETE /api/reviews/:id
Authorization: Bearer <manager-token>
```

Manager or Super Admin only.

## 🔒 Permissions Summary

| Action | Required Role |
|--------|--------------|
| 🌐 View public reviews | Public |
| ✍️ Submit review | Authenticated customer |
| 📋 List all reviews | Staff |
| ✅ Moderate review | Staff |
| 🗑️ Delete review | Manager, Super Admin |
