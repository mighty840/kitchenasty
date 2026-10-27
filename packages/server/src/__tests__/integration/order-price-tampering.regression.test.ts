/**
 * Regression tests for option pricing in `POST /api/orders`.
 *
 * createOrder added each option's client-supplied `priceModifier` to the unit price without
 * looking it up, so a guest could send a large negative modifier and pay about a cent for a
 * real order (CWE-602 / CWE-472). The fix resolves every `menuOptionValueId` against the
 * item's own options from the database and uses the stored name, value and price.
 *
 * 'ignores a client-supplied priceModifier' fails on unpatched code: the order is created at
 * 0.01 per pizza.
 *
 * Reported privately by kta1kri.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';

vi.mock('../../lib/db.js', () => {
  const mockPrisma = {
    location: { findFirst: vi.fn(), findUnique: vi.fn() },
    order: { create: vi.fn() },
    menuItem: { findMany: vi.fn(), update: vi.fn() },
    deliveryZone: { findMany: vi.fn(), findFirst: vi.fn() },
    user: { findUnique: vi.fn() },
    customer: { findUnique: vi.fn(), update: vi.fn() },
    automationRule: { findMany: vi.fn() },
  };
  return { default: mockPrisma, prisma: mockPrisma };
});

import prisma from '../../lib/db.js';
const mockedPrisma = vi.mocked(prisma);

const app = createApp();

const location = { id: 'loc-1', name: 'Downtown', isActive: true, isBusy: false, busyMessage: null, operatingHours: [] };
const pizza = {
  id: 'item-1',
  name: 'Margherita Pizza',
  price: 15,
  taxRate: 8,
  surchargeEnabled: false,
  surchargeAmount: 0,
  isActive: true,
  trackStock: false,
  stockQty: 0,
  options: [
    { id: 'opt-size', name: 'Size', values: [{ id: 'val-large', name: 'Large', priceModifier: 4 }] },
  ],
};
const otherItemValue = 'val-belongs-to-another-item';

function orderWith(option: Record<string, unknown>) {
  return {
    orderType: 'PICKUP',
    guestName: 'Guest',
    guestEmail: 'guest@test.com',
    items: [{ menuItemId: 'item-1', quantity: 2, options: [option] }],
  };
}

describe('POST /api/orders - option pricing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPrisma.menuItem.findMany.mockResolvedValue([pizza] as any);
    mockedPrisma.location.findFirst.mockResolvedValue(location as any);
    mockedPrisma.order.create.mockImplementation((args: any) => Promise.resolve({ ...args.data, id: 'order-1', orderNumber: 'KA-TEST', items: [] }) as any);
    mockedPrisma.automationRule.findMany.mockResolvedValue([]);
  });

  it('ignores a client-supplied priceModifier and uses the menu price', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send(orderWith({ menuOptionValueId: 'val-large', name: 'x', value: 'x', priceModifier: -14.99 }));

    expect(res.status).toBe(201);
    const data = mockedPrisma.order.create.mock.calls[0][0].data as any;
    const item = data.items.create[0];
    expect(item.unitPrice).toBe(19);
    expect(item.subtotal).toBe(38);
    expect(data.subtotal).toBe(38);
    expect(item.options.create[0]).toEqual({
      menuOptionValueId: 'val-large',
      name: 'Size',
      value: 'Large',
      priceModifier: 4,
    });
  });

  it('accepts an option sent with only its id', async () => {
    const res = await request(app).post('/api/orders').send(orderWith({ menuOptionValueId: 'val-large' }));

    expect(res.status).toBe(201);
    const data = mockedPrisma.order.create.mock.calls[0][0].data as any;
    expect(data.items.create[0].unitPrice).toBe(19);
  });

  it.each(['PICKUP', 'DELIVERY'])('calculates mixed taxes and per-unit surcharges for %s', async (orderType) => {
    mockedPrisma.menuItem.findMany.mockResolvedValue([
      { ...pizza, taxRate: 7, surchargeEnabled: true, surchargeAmount: 0.5 },
      { ...pizza, id: 'drink', price: 3, taxRate: 19, options: [] },
      { ...pizza, id: 'water', price: 1, taxRate: 0, surchargeAmount: 20, options: [] },
    ] as any);
    mockedPrisma.deliveryZone.findFirst.mockResolvedValue(null);
    const res = await request(app).post('/api/orders').send({
      orderType,
      guestName: 'Guest',
      guestEmail: 'guest@test.com',
      address: orderType === 'DELIVERY'
        ? { line1: '123 Main St', city: 'City', state: 'ST', zip: '12345' }
        : undefined,
      items: [
        { menuItemId: pizza.id, quantity: 2, taxRate: 0, surchargeAmount: 0, options: [
          { menuOptionValueId: 'val-large', priceModifier: -100 },
        ] },
        { menuItemId: 'drink', quantity: 1 },
        { menuItemId: 'water', quantity: 1 },
      ],
    });

    expect(res.status).toBe(201);
    const data = mockedPrisma.order.create.mock.calls[0][0].data;
    expect(data.subtotal).toBe(43);
    expect(data.tax).toBe(2.97);
    expect(data.total).toBe(orderType === 'DELIVERY' ? 47.99 : 43);
    expect(data.items?.create).toEqual([
      expect.objectContaining({ unitPrice: 19.5, subtotal: 39, taxRate: 7, surchargeAmount: 0.5 }),
      expect.objectContaining({ unitPrice: 3, subtotal: 3, taxRate: 19, surchargeAmount: 0 }),
      expect.objectContaining({ unitPrice: 1, subtotal: 1, taxRate: 0, surchargeAmount: 0 }),
    ]);
  });

  it('extracts 8% included tax without increasing the menu total', async () => {
    const res = await request(app).post('/api/orders')
      .send(orderWith({ menuOptionValueId: 'val-large' }));
    expect(res.status).toBe(201);
    const data = mockedPrisma.order.create.mock.calls[0][0].data;
    expect(data.tax).toBe(2.81);
    expect(data.total).toBe(38);
  });

  it('rejects an option value that does not belong to the item', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send(orderWith({ menuOptionValueId: otherItemValue, name: 'x', value: 'x', priceModifier: 0 }));

    expect(res.status).toBe(400);
    expect(mockedPrisma.order.create).not.toHaveBeenCalled();
  });
});
