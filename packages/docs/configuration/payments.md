# 💳 Payments

KitchenAsty supports three payment methods: **Stripe**, **PayPal**, and **Cash**.

## 💰 Stripe

### 🛠️ Setup

1. Create a [Stripe account](https://dashboard.stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Set environment variables:

```dotenv
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 🔔 Webhooks

Stripe notifies KitchenAsty of payment status changes via webhooks.

1. In the Stripe Dashboard, go to **Developers → Webhooks**
2. Add an endpoint: `https://your-domain.com/api/payments/webhook`
3. Select the event `payment_intent.succeeded`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

For local development, use the [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

### 🔄 Payment Flow

1. Client calls `POST /api/payments/create-intent` with the order ID
2. Server creates a Stripe PaymentIntent and returns the `clientSecret`
3. Client uses Stripe.js to confirm the payment
4. Stripe sends a webhook to `/api/payments/webhook`
5. Server updates the payment and order status

## 🅿️ PayPal

### 🛠️ Setup

1. Create a [PayPal developer account](https://developer.paypal.com)
2. Create a REST API app in the developer dashboard
3. Set environment variables:

```dotenv
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_CLIENT_SECRET=your-client-secret
```

### 🔄 Payment Flow

1. Client calls `POST /api/payments/paypal/create` with the order ID
2. Server creates a PayPal order and returns the PayPal order ID
3. Client redirects to PayPal for approval
4. Client calls `POST /api/payments/paypal/capture` after approval
5. Server captures the payment and updates order status

## 💵 Cash

Cash payments are recorded by staff:

1. Customer places an order with cash payment method
2. Staff marks the payment as received via `POST /api/payments/cash`
3. Order status is updated accordingly

No external configuration is required for cash payments.
