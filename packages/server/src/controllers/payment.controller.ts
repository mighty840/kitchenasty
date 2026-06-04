import { Request, Response } from 'express';
import { getStripe } from '../lib/stripe.js';
import prisma from '../lib/db.js';
import { createPayPalOrder, capturePayPalOrder } from '../lib/paypal.js';

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
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // cents
      currency: 'eur',
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

    const lineItems = order.items.map((it) => ({
      price_data: {
        currency: 'eur',
        product_data: { name: it.name },
        unit_amount: Math.round(it.unitPrice * 100),
      },
      quantity: it.quantity,
    }));

    if (order.deliveryFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: 'Delivery fee' },
          unit_amount: Math.round(order.deliveryFee * 100),
        },
        quantity: 1,
      });
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
    const paypalOrder = await createPayPalOrder(order.total, order.orderNumber);

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

  if (!paypalOrderId || !orderId) {
    res.status(400).json({ success: false, error: 'paypalOrderId and orderId are required' });
    return;
  }

  try {
    const result = await capturePayPalOrder(paypalOrderId);

    if (result.status === 'COMPLETED') {
      await prisma.payment.updateMany({
        where: { transactionId: paypalOrderId },
        data: { status: 'COMPLETED' },
      });

      await prisma.order.update({
        where: { id: orderId },
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
