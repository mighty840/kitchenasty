/**
 * Regression tests for the order binding in `POST /api/payments/paypal/capture`.
 *
 * The handler took `paypalOrderId` and `orderId` as two independent body fields, captured
 * the PayPal order, then set whatever `orderId` the caller named to CONFIRMED. Nothing tied
 * the two together, so an anonymous guest could pay for a cheap order and confirm an
 * expensive one (CWE-639 / CWE-345). The fix derives the order from the payment row that
 * `createPayPalPayment` stored for that PayPal order and rejects a mismatched `orderId`
 * before anything is captured.
 *
 * 'rejects a capture for a different order' fails on unpatched code: it answers 200 and
 * confirms order-expensive.
 *
 * Reported privately by kta1kri.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';

vi.mock('../../lib/db.js', () => {
  const mockPrisma = {
    order: { findUnique: vi.fn(), update: vi.fn() },
    payment: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    user: { findUnique: vi.fn() },
    customer: { findUnique: vi.fn() },
  };
  return { default: mockPrisma, prisma: mockPrisma };
});

vi.mock('../../lib/paypal.js', () => ({
  createPayPalOrder: vi.fn(),
  capturePayPalOrder: vi.fn(),
}));

import prisma from '../../lib/db.js';
import { capturePayPalOrder } from '../../lib/paypal.js';
const mockedPrisma = vi.mocked(prisma);
const mockedCapture = vi.mocked(capturePayPalOrder);

const app = createApp();

// PENDING payment row created by /paypal/create for the cheap order.
const cheapPayment = {
  id: 'pay-1',
  orderId: 'order-cheap',
  method: 'PAYPAL',
  status: 'PENDING',
  amount: 1.5,
  transactionId: 'PAYPAL-CHEAP',
};

describe('POST /api/payments/paypal/capture - order binding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCapture.mockResolvedValue({ status: 'COMPLETED', id: 'PAYPAL-CHEAP' });
  });

  it('rejects a capture for a different order without capturing', async () => {
    mockedPrisma.payment.findFirst.mockResolvedValue(cheapPayment as any);

    const res = await request(app)
      .post('/api/payments/paypal/capture')
      .send({ paypalOrderId: 'PAYPAL-CHEAP', orderId: 'order-expensive' });

    expect(res.status).toBe(400);
    expect(mockedCapture).not.toHaveBeenCalled();
    expect(mockedPrisma.order.update).not.toHaveBeenCalled();
    expect(mockedPrisma.payment.update).not.toHaveBeenCalled();
  });

  it('returns 404 for an unknown PayPal order without capturing', async () => {
    mockedPrisma.payment.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/payments/paypal/capture')
      .send({ paypalOrderId: 'PAYPAL-UNKNOWN', orderId: 'order-expensive' });

    expect(res.status).toBe(404);
    expect(mockedCapture).not.toHaveBeenCalled();
    expect(mockedPrisma.order.update).not.toHaveBeenCalled();
  });

  it('confirms the order the payment belongs to', async () => {
    mockedPrisma.payment.findFirst.mockResolvedValue(cheapPayment as any);

    const res = await request(app)
      .post('/api/payments/paypal/capture')
      .send({ paypalOrderId: 'PAYPAL-CHEAP', orderId: 'order-cheap' });

    expect(res.status).toBe(200);
    expect(mockedCapture).toHaveBeenCalledWith('PAYPAL-CHEAP');
    expect(mockedPrisma.payment.update).toHaveBeenCalledWith({
      where: { id: 'pay-1' },
      data: { status: 'COMPLETED' },
    });
    expect(mockedPrisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-cheap' },
      data: { status: 'CONFIRMED' },
    });
  });

  it('derives the order from the payment when orderId is omitted', async () => {
    mockedPrisma.payment.findFirst.mockResolvedValue(cheapPayment as any);

    const res = await request(app)
      .post('/api/payments/paypal/capture')
      .send({ paypalOrderId: 'PAYPAL-CHEAP' });

    expect(res.status).toBe(200);
    expect(mockedPrisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-cheap' },
      data: { status: 'CONFIRMED' },
    });
  });

  it('does not capture again once the payment is completed', async () => {
    mockedPrisma.payment.findFirst.mockResolvedValue({ ...cheapPayment, status: 'COMPLETED' } as any);

    const res = await request(app)
      .post('/api/payments/paypal/capture')
      .send({ paypalOrderId: 'PAYPAL-CHEAP', orderId: 'order-cheap' });

    expect(res.status).toBe(409);
    expect(mockedCapture).not.toHaveBeenCalled();
    expect(mockedPrisma.order.update).not.toHaveBeenCalled();
  });
});
