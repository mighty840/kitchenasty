# 💳 Payments

KitchenAsty supports **Stripe**, **PayPal**, **PayU Europe**, and **Cash**.

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

## 🇪🇺 PayU Europe

KitchenAsty uses the PayU Europe REST API v2.1 and redirects buyers to PayU's hosted payment page.

Configure the integration in **Admin → Settings → Payment Gateways** with the POS ID, client secret, and second key from the PayU POS. Keep sandbox mode enabled while testing. The POS ID is also used as the OAuth `client_id`.

Payment methods are available only when explicitly enabled in **Admin → Settings → Payment Gateways**. Missing enable flags default to disabled; environment credentials alone never enable a provider.

Set `PAYU_POS_ID`, `PAYU_CLIENT_SECRET`, and `PAYU_SECOND_KEY` as server environment variables instead if you manage credentials outside the admin settings. `PAYU_SANDBOX` defaults to `true`; set it to `false` only for production. Database settings take precedence over environment values.

Set `PUBLIC_URL` or `STOREFRONT_URL` to the public storefront URL for the post-payment return. Set `PAYU_NOTIFY_URL` to the full public callback URL, or set `BASE_URL` to the public API base URL. PayU payment creation is rejected if neither callback setting is present; the callback must be reachable by PayU.

Configure PayU to send order and refund notifications to:

```text
https://api.your-domain.com/api/payments/payu/notify
```

The server verifies the `OpenPayu-Signature` (or `X-OpenPayU-Signature`) header using the PayU second key before updating payment status. PayU notifications are asynchronous and may be retried, so the callback is idempotent.

The checkout flow creates a KitchenAsty order, calls `POST /api/payments/payu/create`, then redirects the buyer to the returned PayU URL. Payment completion is recorded only after a verified PayU notification.
