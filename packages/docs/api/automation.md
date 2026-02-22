# 🤖 Automation API

## 📋 List Rules

```
GET /api/automation-rules
Authorization: Bearer <manager-token>
```

Returns all automation rules.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "name": "Order Confirmation Email",
      "event": "order.statusChanged",
      "conditions": { "status": "CONFIRMED" },
      "actions": [
        {
          "type": "email",
          "template": "orderConfirmation",
          "to": "customer"
        }
      ],
      "isActive": true
    }
  ]
}
```

## 🔍 Get Rule

```
GET /api/automation-rules/:id
Authorization: Bearer <manager-token>
```

## ➕ Create Rule

```
POST /api/automation-rules
Authorization: Bearer <manager-token>
```

**Request:**

```json
{
  "name": "New Order Webhook",
  "event": "order.created",
  "conditions": null,
  "actions": [
    {
      "type": "webhook",
      "url": "https://hooks.example.com/new-order",
      "method": "POST"
    }
  ],
  "isActive": true
}
```

## ✏️ Update Rule

```
PATCH /api/automation-rules/:id
Authorization: Bearer <manager-token>
```

## 🗑️ Delete Rule

```
DELETE /api/automation-rules/:id
Authorization: Bearer <super-admin-token>
```

## 📡 Event Reference

| Event | Fires When |
|-------|-----------|
| 📦 `order.created` | New order is placed |
| 🔄 `order.statusChanged` | Order status is updated |
| 📅 `reservation.created` | New reservation is submitted |
| ⭐ `review.submitted` | Customer submits a review |

## ⚡ Action Reference

### 📧 Email Action

```json
{
  "type": "email",
  "to": "customer",
  "subject": "Your order is confirmed",
  "template": "orderConfirmation"
}
```

### 🌐 Webhook Action

```json
{
  "type": "webhook",
  "url": "https://example.com/hook",
  "method": "POST"
}
```

The full event data is sent as the request body.

### 📱 SMS Action

```json
{
  "type": "sms",
  "to": "customer",
  "message": "Your order #{{order.orderNumber}} is ready!"
}
```

## 🔒 Permissions Summary

| Action | Required Role |
|--------|--------------|
| 📋 List / get rules | Manager, Super Admin |
| ➕ Create / update rules | Manager, Super Admin |
| 🗑️ Delete rules | Super Admin |
