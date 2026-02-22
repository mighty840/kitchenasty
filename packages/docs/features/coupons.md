# 🏷️ Coupons

Staff can create discount coupons that customers apply at checkout.

![Admin Coupons](/screenshots/admin-coupons.png)

## 🎫 Coupon Types

| Type | Behavior |
|------|---------|
| `PERCENTAGE` | 📊 Discount by percentage (e.g., 10% off) |
| `FIXED` | 💵 Discount by a fixed amount (e.g., $5 off) |
| `FREE_DELIVERY` | 🚚 Waive the delivery fee |

## 📝 Coupon Fields

| Field | Description |
|-------|------------|
| `code` | Unique coupon code (e.g., `WELCOME10`) |
| `type` | `PERCENTAGE`, `FIXED`, or `FREE_DELIVERY` |
| `value` | Discount amount or percentage |
| `minOrder` | Minimum order subtotal to qualify |
| `maxDiscount` | Cap for percentage discounts |
| `usageLimit` | Maximum total uses (null = unlimited) |
| `usageCount` | Current number of uses |
| `perCustomer` | Maximum uses per customer (default: 1) |
| `startsAt` | Start date (optional) |
| `expiresAt` | Expiration date (optional) |
| `isActive` | Enable/disable the coupon |

## ✅ Validation Rules

When a customer applies a coupon, the system checks:

1. 🔍 **Code exists** and is active
2. 📅 **Date range** — current time is between `startsAt` and `expiresAt`
3. 🔢 **Usage limit** — `usageCount` < `usageLimit`
4. 👤 **Per-customer limit** — customer hasn't exceeded `perCustomer` uses
5. 💰 **Minimum order** — cart subtotal ≥ `minOrder`

If validation fails, the API returns a descriptive error message.

## 🛒 Applying at Checkout

```
POST /api/coupons/validate
{
  "code": "WELCOME10",
  "orderTotal": 25.00
}
```

Returns the discount amount if valid. The coupon is linked to the order when it's created.

## 🔐 Permissions

| Action | Who Can Do It |
|--------|--------------|
| ✅ Validate coupon | Anyone |
| 📋 List coupons | Staff |
| ✏️ Create/update coupons | Staff |
| 🗑️ Delete coupons | Manager, Super Admin |

## 📡 API

See [Coupons API](/api/coupons) for the complete endpoint reference.
