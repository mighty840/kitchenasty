# 🎟️ Coupons API

## ✅ Validate Coupon

```
POST /api/coupons/validate
```

Public. Validates a coupon code and returns the discount.

**Request:**

```json
{
  "code": "WELCOME10",
  "orderTotal": 25.00
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "coupon": {
      "id": "cuid",
      "code": "WELCOME10",
      "type": "PERCENTAGE",
      "value": 10,
      "maxDiscount": 5.00
    },
    "discount": 2.50
  }
}
```

**Error Response (invalid coupon):**

```json
{
  "success": false,
  "error": "Coupon has expired"
}
```

## 📋 List Coupons

```
GET /api/coupons
Authorization: Bearer <staff-token>
```

Staff only. Returns all coupons with pagination.

## 🔍 Get Coupon

```
GET /api/coupons/:id
Authorization: Bearer <staff-token>
```

## ➕ Create Coupon

```
POST /api/coupons
Authorization: Bearer <staff-token>
```

**Request:**

```json
{
  "code": "SUMMER20",
  "type": "PERCENTAGE",
  "value": 20,
  "minOrder": 30.00,
  "maxDiscount": 10.00,
  "usageLimit": 100,
  "perCustomer": 1,
  "startsAt": "2025-06-01T00:00:00Z",
  "expiresAt": "2025-08-31T23:59:59Z",
  "isActive": true
}
```

## ✏️ Update Coupon

```
PATCH /api/coupons/:id
Authorization: Bearer <staff-token>
```

## 🗑️ Delete Coupon

```
DELETE /api/coupons/:id
Authorization: Bearer <manager-token>
```

Manager or Super Admin only.

## 🔒 Permissions Summary

| Action | Required Role |
|--------|--------------|
| ✅ Validate coupon | Public |
| 📋 List / get coupons | Staff |
| ➕ Create / update coupons | Staff |
| 🗑️ Delete coupons | Manager, Super Admin |
