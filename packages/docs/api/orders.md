# 📦 Orders API

## ➕ Create Order

```
POST /api/orders
Authorization: Bearer <token> (optional — guest checkout supported)
```

**Request (authenticated customer):**

```json
{
  "locationId": "location-id",
  "orderType": "DELIVERY",
  "addressId": "address-id",
  "items": [
    {
      "menuItemId": "item-id",
      "quantity": 2,
      "comment": "No onions",
      "options": [
        { "menuOptionValueId": "option-value-id" }
      ]
    }
  ],
  "tip": 5.00,
  "couponCode": "WELCOME10",
  "scheduledAt": "2025-06-15T18:00:00Z",
  "paymentMethod": "STRIPE"
}
```

**Request (guest checkout):**

```json
{
  "locationId": "location-id",
  "orderType": "PICKUP",
  "guestName": "John Doe",
  "guestEmail": "john@example.com",
  "guestPhone": "+1234567890",
  "items": [
    {
      "menuItemId": "item-id",
      "quantity": 1
    }
  ],
  "paymentMethod": "CASH"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "orderNumber": "KA-20250615-001",
    "status": "PENDING",
    "orderType": "DELIVERY",
    "subtotal": 25.98,
    "deliveryFee": 3.99,
    "tax": 2.08,
    "discount": 2.60,
    "tip": 5.00,
    "total": 34.45,
    "items": [...]
  }
}
```

## 📋 List Orders (Staff)

```
GET /api/orders?page=1&limit=20
Authorization: Bearer <staff-token>
```

Returns all orders with pagination. Staff only.

## 🛍️ List Customer Orders

```
GET /api/orders/my-orders
Authorization: Bearer <customer-token>
```

Returns orders for the authenticated customer.

## 🔍 Get Order

```
GET /api/orders/:id
Authorization: Bearer <token>
```

Returns full order details with items, options, and payment info.

## 🔄 Update Order Status

```
PATCH /api/orders/:id/status
Authorization: Bearer <staff-token>
```

**Request:**

```json
{
  "status": "CONFIRMED"
}
```

**Valid transitions:**

| From | To |
|------|-----|
| `PENDING` | ✅ `CONFIRMED`, ❌ `CANCELLED` |
| `CONFIRMED` | 🍳 `PREPARING`, ❌ `CANCELLED` |
| `PREPARING` | ✅ `READY`, ❌ `CANCELLED` |
| `READY` | 🚚 `OUT_FOR_DELIVERY`, ✅ `DELIVERED`, 🏃 `PICKED_UP`, ❌ `CANCELLED` |
| `OUT_FOR_DELIVERY` | ✅ `DELIVERED`, ❌ `CANCELLED` |

## ⚠️ Error Cases

| Scenario | Status | Error |
|----------|--------|-------|
| 🍽️ Invalid menu item | `400` | Menu item not found |
| 🏪 Location inactive | `400` | Location is not active |
| 💰 Below minimum order | `400` | Order below minimum |
| 🎟️ Invalid coupon | `400` | Coupon validation error |
| 🔄 Invalid status transition | `400` | Invalid status transition |
| 🔍 Order not found | `404` | Order not found |
