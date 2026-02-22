# 🏆 Loyalty API

## 💰 Get Balance

```
GET /api/loyalty/balance
Authorization: Bearer <customer-token>
```

Returns the customer's current loyalty point balance.

**Response:**

```json
{
  "success": true,
  "data": {
    "points": 450,
    "transactions": [
      {
        "id": "cuid",
        "type": "EARN",
        "points": 50,
        "description": "Order #KA-20250615-001",
        "createdAt": "2025-06-15T12:00:00Z"
      }
    ]
  }
}
```

## 🎁 Redeem Points

```
POST /api/loyalty/redeem
Authorization: Bearer <customer-token>
```

**Request:**

```json
{
  "points": 100,
  "orderId": "order-id"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "remainingPoints": 350,
    "transaction": {
      "id": "cuid",
      "type": "REDEEM",
      "points": -100,
      "description": "Redeemed for order"
    }
  }
}
```

## ⚙️ Adjust Points (Admin)

```
POST /api/loyalty/customers/:id/adjust
Authorization: Bearer <manager-token>
```

**Request:**

```json
{
  "points": 50,
  "description": "Compensation for delayed order"
}
```

Use negative values to deduct points.

**Response:**

```json
{
  "success": true,
  "data": {
    "newBalance": 500,
    "transaction": {
      "id": "cuid",
      "type": "ADJUST",
      "points": 50,
      "description": "Compensation for delayed order"
    }
  }
}
```

## 🔒 Permissions Summary

| Action | Required Role |
|--------|--------------|
| 💰 Get balance | Authenticated customer |
| 🎁 Redeem points | Authenticated customer |
| ⚙️ Adjust points | Manager, Super Admin |

## ⚠️ Error Cases

| Scenario | Status | Error |
|----------|--------|-------|
| ❌ Insufficient points | `400` | Not enough loyalty points |
| 🔍 Customer not found | `404` | Customer not found |
| ⚠️ Invalid points value | `400` | Points must be a positive number |
