import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';

vi.mock('../../lib/db.js', () => {
  const mockPrisma = {
    siteSettings: { findUnique: vi.fn() },
    order: { findUnique: vi.fn(), updateMany: vi.fn() },
    payment: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    user: { findUnique: vi.fn() },
    customer: { findUnique: vi.fn() },
  };
  return { default: mockPrisma, prisma: mockPrisma };
});

vi.mock('../../lib/stripe.js', () => ({
  getStripe: vi.fn(),
  default: {},
}));

vi.mock('../../lib/paypal.js', () => ({
  createPayPalOrder: vi.fn(),
  capturePayPalOrder: vi.fn(),
}));

vi.mock('../../lib/payu.js', () => ({
  createPayUOrder: vi.fn(),
  getPayUConfig: vi.fn().mockResolvedValue({
    posId: 'sandbox-pos',
    clientSecret: 'client-secret',
    secondKey: 'second-key',
    baseUrl: 'https://secure.snd.payu.com',
  }),
  verifyPayUSignature: vi.fn().mockReturnValue(true),
}));

import prisma from '../../lib/db.js';
import { createPayUOrder, verifyPayUSignature } from '../../lib/payu.js';

const mockedPrisma = vi.mocked(prisma);
const mockedCreatePayUOrder = vi.mocked(createPayUOrder);
const mockedVerifySignature = vi.mocked(verifyPayUSignature);
const app = createApp();

const sampleOrder = {
  id: 'order-1',
  orderNumber: 'KA-ABC-123',
  total: 32.38,
  guestName: 'Guest Customer',
  guestEmail: 'guest@example.com',
  guestPhone: '+48123456789',
  customer: null,
};

describe('PayU Europe payments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('BASE_URL', 'https://api.example.test');
    mockedPrisma.siteSettings.findUnique.mockResolvedValue({
      generalSettings: { defaultCurrency: 'EUR' },
      paymentSettings: { payuEnabled: true },
    } as never);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('creates a hosted PayU order and stores its pending payment', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue(sampleOrder as never);
    mockedPrisma.payment.findFirst.mockResolvedValue(null);
    mockedPrisma.payment.create.mockResolvedValue({} as never);
    mockedCreatePayUOrder.mockResolvedValue({
      id: 'payu-order-1',
      redirectUrl: 'https://secure.snd.payu.com/pay/order-1',
    });

    const response = await request(app)
      .post('/api/payments/payu/create')
      .send({ orderId: sampleOrder.id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      url: 'https://secure.snd.payu.com/pay/order-1',
      payuOrderId: 'payu-order-1',
    });
    expect(mockedCreatePayUOrder).toHaveBeenCalledWith(expect.objectContaining({
      orderId: 'order-1',
      orderNumber: 'KA-ABC-123',
      amount: 32.38,
      currency: 'eur',
      notifyUrl: expect.stringMatching(/\/api\/payments\/payu\/notify$/),
      continueUrl: expect.stringMatching(/\/order\/order-1\?payu=return$/),
      buyer: expect.objectContaining({
        email: 'guest@example.com',
        firstName: 'Guest',
        lastName: 'Customer',
      }),
    }));
    expect(mockedPrisma.payment.create).toHaveBeenCalledWith({
      data: {
        orderId: 'order-1',
        method: 'PAYU',
        status: 'PENDING',
        amount: 32.38,
        transactionId: 'payu-order-1',
        metadata: { redirectUrl: 'https://secure.snd.payu.com/pay/order-1' },
      },
    });
  });

  it('does not create PayU orders when the provider is disabled', async () => {
    mockedPrisma.siteSettings.findUnique.mockResolvedValue({
      paymentSettings: { payuEnabled: false },
    } as never);

    const response = await request(app)
      .post('/api/payments/payu/create')
      .send({ orderId: sampleOrder.id });

    expect(response.status).toBe(403);
    expect(mockedPrisma.order.findUnique).not.toHaveBeenCalled();
    expect(mockedCreatePayUOrder).not.toHaveBeenCalled();
  });

  it('reuses the existing hosted URL for an order with a pending PayU payment', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue(sampleOrder as never);
    mockedPrisma.payment.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'payment-1',
        transactionId: 'payu-order-1',
        metadata: { redirectUrl: 'https://secure.snd.payu.com/pay/order-1' },
      } as never);

    const response = await request(app)
      .post('/api/payments/payu/create')
      .send({ orderId: sampleOrder.id });

    expect(response.status).toBe(200);
    expect(response.body.data.url).toBe('https://secure.snd.payu.com/pay/order-1');
    expect(mockedCreatePayUOrder).not.toHaveBeenCalled();
    expect(mockedPrisma.payment.create).not.toHaveBeenCalled();
  });

  it('marks a PayU payment completed only after a verified notification', async () => {
    const payment = {
      id: 'payment-1',
      orderId: 'order-1',
      method: 'PAYU',
      status: 'PENDING',
      transactionId: 'payu-order-1',
    };
    mockedPrisma.payment.findFirst.mockResolvedValue(payment as never);

    const body = { order: { orderId: 'payu-order-1', status: 'COMPLETED' } };
    const response = await request(app)
      .post('/api/payments/payu/notify')
      .set('OpenPayu-Signature', 'sender=checkout;signature=valid;algorithm=MD5;content=DOCUMENT')
      .send(body);

    expect(response.status).toBe(200);
    expect(mockedVerifySignature).toHaveBeenCalledWith(
      JSON.stringify(body),
      'sender=checkout;signature=valid;algorithm=MD5;content=DOCUMENT',
      'second-key',
    );
    expect(mockedPrisma.payment.update).toHaveBeenCalledWith({
      where: { id: 'payment-1' },
      data: { status: 'COMPLETED' },
    });
    expect(mockedPrisma.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'order-1', status: 'PENDING' },
      data: { status: 'CONFIRMED' },
    });
  });

  it('rejects notifications with an invalid signature without changing payment state', async () => {
    mockedVerifySignature.mockReturnValue(false);
    const response = await request(app)
      .post('/api/payments/payu/notify')
      .set('X-OpenPayU-Signature', 'sender=checkout;signature=invalid;algorithm=MD5;content=DOCUMENT')
      .send({ order: { orderId: 'payu-order-1', status: 'COMPLETED' } });

    expect(response.status).toBe(401);
    expect(mockedPrisma.payment.findFirst).not.toHaveBeenCalled();
    expect(mockedPrisma.order.updateMany).not.toHaveBeenCalled();
  });
});
