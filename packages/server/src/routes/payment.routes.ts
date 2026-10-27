import { Router } from 'express';
import express from 'express';
import { optionalAuth, authenticate, requireStaff } from '../middleware/auth.js';
import { createPaymentIntent, createCheckoutSession, handleWebhook, markCashPayment, createPayPalPayment, capturePayPalPayment, createPayUPayment, handlePayUNotification, getAvailablePaymentMethods } from '../controllers/payment.controller.js';
import { requirePaymentMethodEnabled } from '../lib/payment-methods.js';

const router = Router();

router.get('/methods', getAvailablePaymentMethods);

// Stripe webhook needs raw body
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// PaymentIntent (mobile app — flutter_stripe PaymentSheet)
router.post('/create-intent', optionalAuth, requirePaymentMethodEnabled('stripe'), createPaymentIntent);

// Checkout Session (website — hosted Stripe page)
router.post('/create-checkout-session', optionalAuth, requirePaymentMethodEnabled('stripe'), createCheckoutSession);

// Mark cash payment (staff only)
router.post('/cash', authenticate, requireStaff, markCashPayment);

// PayPal
router.post('/paypal/create', optionalAuth, requirePaymentMethodEnabled('paypal'), createPayPalPayment);
router.post('/paypal/capture', optionalAuth, capturePayPalPayment);

// PayU notification request bodies are parsed as raw bytes before JSON middleware.
router.post('/payu/create', optionalAuth, requirePaymentMethodEnabled('payu'), createPayUPayment);
router.post('/payu/notify', handlePayUNotification);

export default router;
