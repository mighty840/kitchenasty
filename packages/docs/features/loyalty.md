# 🎁 Loyalty Program

KitchenAsty includes a points-based loyalty program where customers earn points on purchases and redeem them for discounts.

![Admin Loyalty](/screenshots/admin-loyalty.png)

## 💎 How Points Work

| Action | Points |
|--------|--------|
| 🛒 Place an order | Earn points based on order total |
| 🎁 Redeem points | Deduct points for a discount |
| 🔧 Admin adjustment | Staff can manually add or remove points |

Points are tracked on the `Customer` model (`loyaltyPoints` field) and each transaction is recorded in the `LoyaltyTransaction` table.

## 📊 Transaction Types

| Type | Description |
|------|------------|
| `EARN` | ⬆️ Points earned from an order |
| `REDEEM` | ⬇️ Points spent for a discount |
| `ADJUST` | 🔧 Manual adjustment by staff |

Each transaction records the points amount, a description, and optionally links to an order.

## 👤 Customer Endpoints

### 💰 Check Balance

```
GET /api/loyalty/balance
Authorization: Bearer <customer-token>
```

Returns the customer's current point balance.

### 🎁 Redeem Points

```
POST /api/loyalty/redeem
Authorization: Bearer <customer-token>

{
  "points": 100,
  "orderId": "order-id"
}
```

Deducts points from the customer's balance.

## 🛠️ Admin Endpoints

### 🔧 Adjust Points

```
POST /api/loyalty/customers/:id/adjust
Authorization: Bearer <staff-token>

{
  "points": 50,
  "description": "Compensation for delayed order"
}
```

Adds or removes points. Use negative values to deduct.

## 🔐 Permissions

| Action | Who Can Do It |
|--------|--------------|
| 💰 Check balance | Authenticated customers |
| 🎁 Redeem points | Authenticated customers |
| 🔧 Adjust points | Manager, Super Admin |

## 📡 API

See [Loyalty API](/api/loyalty) for the complete endpoint reference.
