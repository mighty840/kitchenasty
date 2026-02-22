# 💳 Payments API

## 💰 Create Stripe Payment Intent

```
POST /api/payments/create-intent
Authorization: Bearer <token> (optional)
```

**Request:**

```json
{
  "orderId": "order-id"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_xxx"
  }
}
```

Use the `clientSecret` with Stripe.js on the frontend to complete payment.

## 🔔 Stripe Webhook

```
POST /api/payments/webhook
Content-Type: application/json (raw body)
```

Called by Stripe when a payment event occurs. The endpoint verifies the webhook signature using `STRIPE_WEBHOOK_SECRET`.

Handled events:

- ✅ `payment_intent.succeeded` — Marks the payment as completed and updates the order.

::: warning
This endpoint expects a raw request body (not JSON-parsed). It is registered before the JSON body parser in the middleware stack.
:::

## 💵 Mark Cash Payment

```
POST /api/payments/cash
Authorization: Bearer <staff-token>
```

**Request:**

```json
{
  "orderId": "order-id",
  "amount": 34.45
}
```

Staff marks that cash has been received for an order.

## 🅿️ Create PayPal Payment

```
POST /api/payments/paypal/create
Authorization: Bearer <token> (optional)
```

**Request:**

```json
{
  "orderId": "order-id"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "paypalOrderId": "PAYPAL-ORDER-ID"
  }
}
```

## ✅ Capture PayPal Payment

```
POST /api/payments/paypal/capture
Authorization: Bearer <token> (optional)
```

**Request:**

```json
{
  "paypalOrderId": "PAYPAL-ORDER-ID"
}
```

Called after the customer approves payment on PayPal.

## 🔒 Permissions Summary

| Action | Required Role |
|--------|--------------|
| 💳 Create Stripe intent | Customer or guest |
| 🔔 Stripe webhook | Stripe (signature verified) |
| 💵 Mark cash payment | Staff |
| 🅿️ Create/capture PayPal | Customer or guest |
