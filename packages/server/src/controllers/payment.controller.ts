import { Request, Response } from 'express';
import { getStripe } from '../lib/stripe.js';
import prisma from '../lib/db.js';
import { resolveCurrency } from '@kitchenasty/shared';
import { createPayPalOrder, capturePayPalOrder } from '../lib/paypal.js';
import { createPayUOrder, getPayUConfig, verifyPayUSignature } from '../lib/payu.js';
import logger from '../lib/logger.js';
import { getPaymentMethodAvailability } from '../lib/payment-methods.js';

async function getCurrency(): Promise<string> {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
  return resolveCurrency(settings?.generalSettings as Record<string, any> | null).code.toLowerCase();
}

export async function getAvailablePaymentMethods(_req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: await getPaymentMethodAvailability() });
}

export async function createPaymentIntent(req: Request, res: Response): Promise<void> {
  const { orderId } = req.body;

  if (!orderId) {
    res.status(400).json({ success: false, error: 'orderId is required' });
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: { select: { email: true, name: true } } },
  });
  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }

  // Check if order already has a completed payment
  const existingPayment = await prisma.payment.findFirst({
    where: { orderId, status: 'COMPLETED' },
  });
  if (existingPayment) {
    res.status(409).json({ success: false, error: 'Order already paid' });
    return;
  }

  // Use the registered customer's email when present, fall back to the
  // guest-checkout email — both produce Stripe receipt emails + show up
  // attached to the PaymentIntent in the dashboard.
  const receiptEmail = order.customer?.email ?? order.guestEmail ?? undefined;

  try {
    const stripe = await getStripe();
    const currency = await getCurrency();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // cents
      currency,
      receipt_email: receiptEmail,
      // Let Stripe pick which payment methods to surface — covers cards,
      // Apple Pay and Google Pay on PaymentSheet without extra config.
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customer?.name ?? order.guestName ?? '',
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        method: 'STRIPE',
        status: 'PENDING',
        amount: order.total,
        transactionId: paymentIntent.id,
      },
    });

    res.json({
      success: true,
      data: { clientSecret: paymentIntent.client_secret },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Payment creation failed' });
  }
}

/// Creates a Stripe Checkout Session for the order. The customer is
/// redirected to Stripe's hosted page (cards + Apple Pay + Google Pay +
/// Klarna + SEPA come for free), and Stripe redirects back to the
/// order-confirmation page on success.
///
/// We attach `orderId` to BOTH the session metadata and the underlying
/// payment intent so the existing `payment_intent.succeeded` webhook
/// path still flips Order.status — the new `checkout.session.completed`
/// case below is just a belt-and-braces.
export async function createCheckoutSession(req: Request, res: Response): Promise<void> {
  const { orderId } = req.body;
  if (!orderId) {
    res.status(400).json({ success: false, error: 'orderId is required' });
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: { select: { email: true } },
      items: true,
    },
  });
  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }
  const existingPayment = await prisma.payment.findFirst({
    where: { orderId, status: 'COMPLETED' },
  });
  if (existingPayment) {
    res.status(409).json({ success: false, error: 'Order already paid' });
    return;
  }

  const publicUrl = process.env.PUBLIC_URL || 'https://inka.kitchenasty.com';
  const customerEmail = order.customer?.email ?? order.guestEmail ?? undefined;

  try {
    const stripe = await getStripe();
    const currency = await getCurrency();

    let lineItems = order.items.map((it) => ({
      price_data: {
        currency,
        product_data: { name: it.name },
        unit_amount: Math.round(it.unitPrice * 100),
      },
      quantity: it.quantity,
    }));

    if (order.deliveryFee > 0) {
      lineItems.push({
        price_data: {
          currency,
          product_data: { name: 'Delivery fee' },
          unit_amount: Math.round(order.deliveryFee * 100),
        },
        quantity: 1,
      });
    }

    const lineItemsTotal = lineItems.reduce((sum, item) =>
      sum + item.price_data.unit_amount * item.quantity, 0);
    // Honor saved totals for discounts and legacy tax-exclusive orders.
    if (lineItemsTotal !== Math.round(order.total * 100)) {
      lineItems = [{
        price_data: {
          currency,
          product_data: { name: `Order ${order.orderNumber}` },
          unit_amount: Math.round(order.total * 100),
        },
        quantity: 1,
      }];
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${publicUrl}/order/${order.id}?paid=true`,
      cancel_url: `${publicUrl}/checkout`,
      customer_email: customerEmail,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
      payment_intent_data: {
        receipt_email: customerEmail,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
        },
      },
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        method: 'STRIPE',
        status: 'PENDING',
        amount: order.total,
        transactionId: session.id,
      },
    });

    res.json({
      success: true,
      data: { url: session.url, sessionId: session.id },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Checkout session creation failed' });
  }
}

export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    res.status(500).json({ success: false, error: 'Webhook secret not configured' });
    return;
  }

  let event;
  try {
    const stripe = await getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    res.status(400).json({ success: false, error: `Webhook error: ${err.message}` });
    return;
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;

      if (orderId) {
        // Update payment status
        await prisma.payment.updateMany({
          where: { transactionId: paymentIntent.id },
          data: { status: 'COMPLETED' },
        });

        // Update order status to confirmed
        await prisma.order.update({
          where: { id: orderId },
          data: { status: 'CONFIRMED' },
        });
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      await prisma.payment.updateMany({
        where: { transactionId: paymentIntent.id },
        data: { status: 'FAILED' },
      });
      break;
    }

    case 'checkout.session.completed': {
      // Stripe Checkout (hosted) finished. payment_intent.succeeded also
      // fires for the same flow, but the session event lets us mark the
      // Payment row (whose transactionId is the session.id) as completed
      // and gives us a second chance to flip Order.status.
      const session = event.data.object as { id: string; payment_status?: string; metadata?: { orderId?: string } };
      const orderId = session.metadata?.orderId;
      if (orderId && session.payment_status === 'paid') {
        await prisma.payment.updateMany({
          where: { transactionId: session.id },
          data: { status: 'COMPLETED' },
        });
        await prisma.order.update({
          where: { id: orderId },
          data: { status: 'CONFIRMED' },
        });
      }
      break;
    }
  }

  res.json({ received: true });
}

export async function markCashPayment(req: Request, res: Response): Promise<void> {
  const { orderId } = req.body;

  if (!orderId) {
    res.status(400).json({ success: false, error: 'orderId is required' });
    return;
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      method: 'CASH',
      status: 'PENDING',
      amount: order.total,
    },
  });

  res.status(201).json({ success: true, data: payment });
}

export async function createPayPalPayment(req: Request, res: Response): Promise<void> {
  const { orderId } = req.body;

  if (!orderId) {
    res.status(400).json({ success: false, error: 'orderId is required' });
    return;
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }
  const existingPayment = await prisma.payment.findFirst({
    where: { orderId, status: 'COMPLETED' },
  });
  if (existingPayment) {
    res.status(409).json({ success: false, error: 'Order already paid' });
    return;
  }

  try {
    const paypalOrder = await createPayPalOrder(order.total, order.orderNumber, await getCurrency());

    await prisma.payment.create({
      data: {
        orderId: order.id,
        method: 'PAYPAL',
        status: 'PENDING',
        amount: order.total,
        transactionId: paypalOrder.id,
      },
    });

    res.json({
      success: true,
      data: { paypalOrderId: paypalOrder.id, approvalUrl: paypalOrder.approvalUrl },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'PayPal order creation failed' });
  }
}

export async function capturePayPalPayment(req: Request, res: Response): Promise<void> {
  const { paypalOrderId, orderId } = req.body;

  if (!paypalOrderId) {
    res.status(400).json({ success: false, error: 'paypalOrderId is required' });
    return;
  }

  // The order to confirm comes from the payment row createPayPalPayment stored for this
  // PayPal order, never from the request body. Look it up before capturing so a mismatched
  // request never moves money.
  const payment = await prisma.payment.findFirst({
    where: { transactionId: paypalOrderId, method: 'PAYPAL' },
  });
  if (!payment) {
    res.status(404).json({ success: false, error: 'Payment not found' });
    return;
  }

  if (orderId && orderId !== payment.orderId) {
    res.status(400).json({ success: false, error: 'PayPal order does not belong to this order' });
    return;
  }

  if (payment.status === 'COMPLETED') {
    res.status(409).json({ success: false, error: 'Order already paid' });
    return;
  }

  try {
    const result = await capturePayPalOrder(paypalOrderId);

    if (result.status === 'COMPLETED') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'COMPLETED' },
      });

      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'CONFIRMED' },
      });

      res.json({ success: true, data: { status: 'COMPLETED' } });
    } else {
      res.status(400).json({ success: false, error: 'PayPal capture failed', data: result });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'PayPal capture failed' });
  }
}

export async function createPayUPayment(req: Request, res: Response): Promise<void> {
  const { orderId } = req.body;
  if (!orderId) {
    res.status(400).json({ success: false, error: 'orderId is required' });
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: { select: { email: true, name: true, phone: true } } },
  });
  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }
  if (order.customerId && req.user?.id !== order.customerId) {
    res.status(403).json({ success: false, error: 'Order does not belong to this customer' });
    return;
  }

  const existingPayment = await prisma.payment.findFirst({
    where: { orderId, status: 'COMPLETED' },
  });
  if (existingPayment) {
    res.status(409).json({ success: false, error: 'Order already paid' });
    return;
  }

  const pendingPayment = await prisma.payment.findFirst({
    where: { orderId, method: 'PAYU', status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });
  if (pendingPayment) {
    const metadata = pendingPayment.metadata as Record<string, unknown> | null;
    if (typeof metadata?.redirectUrl !== 'string') {
      res.status(409).json({ success: false, error: 'A PayU payment is already pending for this order' });
      return;
    }
    res.json({
      success: true,
      data: { url: metadata.redirectUrl, payuOrderId: pendingPayment.transactionId },
    });
    return;
  }

  const publicUrl = (process.env.PUBLIC_URL || process.env.STOREFRONT_URL || 'http://localhost:5174')
    .replace(/\/+$/, '');
  const buyerName = order.customer?.name ?? order.guestName ?? '';
  const [firstName, ...lastNameParts] = buyerName.trim().split(/\s+/);

  try {
    const notifyUrl = process.env.PAYU_NOTIFY_URL
      || (process.env.BASE_URL
        ? `${process.env.BASE_URL.replace(/\/+$/, '')}/api/payments/payu/notify`
        : '');
    if (!notifyUrl) {
      throw new Error('Set PAYU_NOTIFY_URL or BASE_URL to a publicly reachable API URL');
    }

    const payuOrder = await createPayUOrder({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.total,
      currency: await getCurrency(),
      customerIp: req.ip || req.socket.remoteAddress || '127.0.0.1',
      continueUrl: `${publicUrl}/order/${encodeURIComponent(order.id)}?payu=return`,
      notifyUrl,
      buyer: {
        email: order.customer?.email ?? order.guestEmail ?? undefined,
        phone: order.customer?.phone ?? order.guestPhone ?? undefined,
        firstName: firstName || undefined,
        lastName: lastNameParts.join(' ') || undefined,
      },
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        method: 'PAYU',
        status: 'PENDING',
        amount: order.total,
        transactionId: payuOrder.id,
        metadata: { redirectUrl: payuOrder.redirectUrl },
      },
    });

    res.json({ success: true, data: { url: payuOrder.redirectUrl, payuOrderId: payuOrder.id } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'PayU order creation failed' });
  }
}

export async function handlePayUNotification(req: Request, res: Response): Promise<void> {
  const rawBody = Buffer.isBuffer(req.body)
    ? req.body.toString('utf8')
    : typeof req.body === 'string' ? req.body : '';
  if (!rawBody) {
    res.status(400).json({ success: false, error: 'PayU notification body is required' });
    return;
  }

  let config;
  try {
    config = await getPayUConfig();
  } catch (err) {
    logger.error({ err }, 'Unable to load PayU notification settings');
    res.status(500).json({ success: false, error: 'PayU notification settings unavailable' });
    return;
  }
  if (!config.secondKey) {
    res.status(500).json({ success: false, error: 'PayU second key is not configured' });
    return;
  }

  const signature = req.header('openpayu-signature') || req.header('x-openpayu-signature');
  if (!verifyPayUSignature(rawBody, signature, config.secondKey)) {
    res.status(401).json({ success: false, error: 'Invalid PayU notification signature' });
    return;
  }

  let notification: {
    order?: { orderId?: string; status?: string };
    orderId?: string;
    refund?: { status?: string };
  };
  try {
    notification = JSON.parse(rawBody);
  } catch {
    res.status(400).json({ success: false, error: 'Invalid PayU notification JSON' });
    return;
  }

  const payuOrderId = notification.order?.orderId || notification.orderId;
  if (!payuOrderId) {
    res.status(400).json({ success: false, error: 'PayU notification has no order ID' });
    return;
  }

  try {
    const payment = await prisma.payment.findFirst({
      where: { transactionId: payuOrderId, method: 'PAYU' },
    });
    if (!payment) {
      logger.warn({ payuOrderId }, 'Received PayU notification for an unknown payment');
      res.status(200).json({ received: true });
      return;
    }

    const refundStatus = notification.refund?.status?.toUpperCase();
    if (refundStatus === 'FINALIZED') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'REFUNDED' },
      });
    } else if (!notification.refund) {
      const orderStatus = notification.order?.status?.toUpperCase();
      if (orderStatus === 'COMPLETED') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'COMPLETED' },
        });
        await prisma.order.updateMany({
          where: { id: payment.orderId, status: 'PENDING' },
          data: { status: 'CONFIRMED' },
        });
      } else if (orderStatus === 'CANCELED' && payment.status !== 'COMPLETED') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        });
      } else if (!['PENDING', 'WAITING_FOR_CONFIRMATION', 'COMPLETED', 'CANCELED'].includes(orderStatus || '')) {
        logger.warn({ payuOrderId, orderStatus }, 'Received PayU notification with an unsupported status');
      }
    }
  } catch (err) {
    logger.error({ err, payuOrderId }, 'Failed to process PayU notification');
    res.status(500).json({ success: false, error: 'PayU notification processing failed' });
    return;
  }

  res.status(200).json({ received: true });
}
