import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/db.js', () => ({
  default: {
    siteSettings: { findUnique: vi.fn() },
  },
}));

import prisma from '../../lib/db.js';
import { createPayUOrder } from '../../lib/payu.js';

const mockedPrisma = vi.mocked(prisma);
const mockedFetch = () => vi.mocked(fetch);

describe('createPayUOrder', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    mockedPrisma.siteSettings.findUnique.mockResolvedValue({
      paymentSettings: {
        payuPosId: 'sandbox-pos',
        payuClientSecret: 'client-secret',
        payuSecondKey: 'second-key',
        payuSandbox: true,
      },
    } as never);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('authenticates with PayU Europe and creates an order without following its redirect', async () => {
    mockedFetch()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'access-token' })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        status: { statusCode: 'SUCCESS' },
        orderId: 'payu-order-1',
        redirectUri: 'https://secure.snd.payu.com/pay/order-1',
      }), { status: 302 }));

    const result = await createPayUOrder({
      orderId: 'local-order-1',
      orderNumber: 'KA-123',
      amount: 32.38,
      currency: 'eur',
      customerIp: '127.0.0.1',
      continueUrl: 'https://shop.example/order/local-order-1?payu=return',
      notifyUrl: 'https://shop.example/api/payments/payu/notify',
    });

    expect(result).toEqual({
      id: 'payu-order-1',
      redirectUrl: 'https://secure.snd.payu.com/pay/order-1',
    });
    expect(mockedFetch()).toHaveBeenNthCalledWith(
      1,
      'https://secure.snd.payu.com/pl/standard/user/oauth/authorize',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: 'sandbox-pos',
          client_secret: 'client-secret',
        }),
      }),
    );
    expect(mockedFetch()).toHaveBeenNthCalledWith(
      2,
      'https://secure.snd.payu.com/api/v2_1/orders',
      expect.objectContaining({
        method: 'POST',
        redirect: 'manual',
        headers: {
          Authorization: 'Bearer access-token',
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"totalAmount":"3238"'),
      }),
    );
  });

  it('uses the redirect Location header when PayU returns it separately', async () => {
    mockedFetch()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'access-token' })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        status: { statusCode: 'SUCCESS' },
        orderId: 'payu-order-2',
      }), {
        status: 302,
        headers: { location: 'https://secure.snd.payu.com/pay/order-2' },
      }));

    await expect(createPayUOrder({
      orderId: 'local-order-2',
      orderNumber: 'KA-456',
      amount: 10,
      currency: 'pln',
      customerIp: '127.0.0.1',
      continueUrl: 'https://shop.example/order/local-order-2',
      notifyUrl: 'https://shop.example/api/payments/payu/notify',
    })).resolves.toMatchObject({
      id: 'payu-order-2',
      redirectUrl: 'https://secure.snd.payu.com/pay/order-2',
    });
  });
});
