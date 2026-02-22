import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { generateToken } from '../../middleware/auth.js';

vi.mock('../../lib/db.js', () => {
  const mockPrisma = {
    location: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    order: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    orderItem: { count: vi.fn() },
    menuItem: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    payment: { findFirst: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
    deliveryZone: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    table: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    reservation: { count: vi.fn() },
    user: { findUnique: vi.fn() },
    customer: { findUnique: vi.fn() },
    category: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
  };
  return { default: mockPrisma, prisma: mockPrisma };
});

vi.mock('../../lib/stripe.js', () => {
  const mockStripe = {
    paymentIntents: {
      create: vi.fn().mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret_abc',
      }),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  };
  return {
    default: mockStripe,
    getStripe: vi.fn().mockResolvedValue(mockStripe),
  };
});

import prisma from '../../lib/db.js';
import stripe from '../../lib/stripe.js';
const mockedPrisma = vi.mocked(prisma);
const mockedStripe = vi.mocked(stripe);

const app = createApp();

const staffToken = generateToken({ id: '3', email: 'staff@test.com', type: 'staff', role: 'STAFF' });
const customerToken = generateToken({ id: 'cust-1', email: 'customer@test.com', type: 'customer' });

const sampleOrder = {
  id: 'order-1',
  orderNumber: 'KA-ABC-123',
  total: 32.38,
  status: 'PENDING',
};

describe('Payment API - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================
  // CREATE PAYMENT INTENT
  // ============================================================
  describe('POST /api/payments/create-intent', () => {
    it('creates a Stripe payment intent', async () => {
      mockedPrisma.order.findUnique.mockResolvedValue(sampleOrder as any);
      mockedPrisma.payment.findFirst.mockResolvedValue(null);
      mockedPrisma.payment.create.mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/payments/create-intent')
        .send({ orderId: 'order-1' });

      expect(res.status).toBe(200);
      expect(res.body.data.clientSecret).toBe('pi_test_123_secret_abc');
    });

    it('requires orderId', async () => {
      const res = await request(app).post('/api/payments/create-intent').send({});
      expect(res.status).toBe(400);
    });

    it('returns 404 for unknown order', async () => {
      mockedPrisma.order.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/payments/create-intent')
        .send({ orderId: 'unknown' });

      expect(res.status).toBe(404);
    });

    it('returns 409 if order already paid', async () => {
      mockedPrisma.order.findUnique.mockResolvedValue(sampleOrder as any);
      mockedPrisma.payment.findFirst.mockResolvedValue({ id: 'pay-1', status: 'COMPLETED' } as any);

      const res = await request(app)
        .post('/api/payments/create-intent')
        .send({ orderId: 'order-1' });

      expect(res.status).toBe(409);
    });
  });

  // ============================================================
  // CASH PAYMENT
  // ============================================================
  describe('POST /api/payments/cash', () => {
    it('requires staff authentication', async () => {
      const res = await request(app).post('/api/payments/cash').send({ orderId: 'order-1' });
      expect(res.status).toBe(401);
    });

    it('rejects customer access', async () => {
      const res = await request(app)
        .post('/api/payments/cash')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId: 'order-1' });
      expect(res.status).toBe(403);
    });

    it('creates cash payment record', async () => {
      mockedPrisma.order.findUnique.mockResolvedValue(sampleOrder as any);
      mockedPrisma.payment.create.mockResolvedValue({
        id: 'pay-1',
        orderId: 'order-1',
        method: 'CASH',
        status: 'PENDING',
        amount: 32.38,
      } as any);

      const res = await request(app)
        .post('/api/payments/cash')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ orderId: 'order-1' });

      expect(res.status).toBe(201);
      expect(res.body.data.method).toBe('CASH');
    });

    it('requires orderId', async () => {
      const res = await request(app)
        .post('/api/payments/cash')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('returns 404 for unknown order', async () => {
      mockedPrisma.order.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/payments/cash')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ orderId: 'unknown' });

      expect(res.status).toBe(404);
    });
  });
});
