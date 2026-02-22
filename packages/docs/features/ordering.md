# 📦 Ordering

The ordering system supports delivery and pickup, guest checkout, scheduled orders, and a complete status lifecycle.

![Admin Orders](/screenshots/admin-orders.png)

## 🚚 Order Types

| Type | Description |
|------|------------|
| `DELIVERY` | 🏠 Order delivered to customer's address |
| `PICKUP` | 🏪 Customer picks up from location |

Each location can independently enable/disable delivery and pickup, and set minimum order amounts and lead times.

## 🔄 Order Status Lifecycle

```
PENDING → CONFIRMED → PREPARING → READY → DELIVERED / PICKED_UP
                                        ↘ CANCELLED (from any status)
```

| Status | Description |
|--------|------------|
| `PENDING` | ⏳ Order placed, awaiting confirmation |
| `CONFIRMED` | ✅ Staff confirmed the order |
| `PREPARING` | 🍳 Kitchen is preparing the order |
| `READY` | 🔔 Order is ready for pickup or delivery |
| `OUT_FOR_DELIVERY` | 🚗 Delivery driver is on the way (delivery only) |
| `DELIVERED` | 📬 Order delivered to customer |
| `PICKED_UP` | 🤝 Customer picked up the order |
| `CANCELLED` | ❌ Order cancelled |

Staff update order status via `PATCH /api/orders/:id/status`.

## 👤 Guest Checkout

Customers can place orders without registering. Guest orders include:

- 📛 `guestName` — Customer name
- 📧 `guestEmail` — Email for notifications
- 📱 `guestPhone` — Phone number

The `optionalAuth` middleware allows both authenticated and guest orders on the same endpoint.

## 📅 Scheduled Orders

Set `scheduledAt` to a future datetime when creating an order. The kitchen can see scheduled orders and prepare them ahead of time.

![Storefront Menu](/screenshots/storefront-menu.png)

## 💰 Order Totals

| Field | Description |
|-------|------------|
| `subtotal` | Sum of item prices × quantities |
| `deliveryFee` | Based on delivery zone |
| `tax` | Calculated tax amount |
| `discount` | Coupon discount (if applied) |
| `tip` | Optional customer tip |
| `total` | Final total |

## 🏷️ Coupons

Apply a coupon code at checkout. The coupon is validated against:

- 📅 Expiration date
- 🔢 Usage limits (total and per-customer)
- 💵 Minimum order amount
- ✅ Active status

See [Coupons](/features/coupons) for details.

## 📡 Real-Time Updates

When an order is created or its status changes, a Socket.IO event is emitted. See [Kitchen Display](/features/kitchen-display) and [Real-Time Events](/architecture/real-time-events).

## 🔗 API

See [Orders API](/api/orders) for the complete endpoint reference.
