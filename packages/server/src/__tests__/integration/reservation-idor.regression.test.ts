/**
 * Regression tests for object-level authorization on reservations.
 *
 * Place this file at: packages/server/src/__tests__/integration/reservation-idor.regression.test.ts
 * (the relative imports below assume that directory).
 *
 * Covers `GET /api/reservations/:id`, which was authenticated but never checked ownership:
 * any logged-in customer could read any other customer's reservation, including the booking
 * customer's name, e-mail and phone number (CWE-639, OWASP API1:2023). The fix mirrors the
 * ownership check `getOrder` already carries in order.controller.ts, plus an explicit
 * null-principal branch. The cases around it pin down the behaviour the fix must NOT change:
 * the owner and staff still get 200, the sibling write routes stay staff-only, and
 * `/my-reservations` stays scoped to the caller.
 *
 * The second case — 'denies a different customer' — fails by design on <= 0.3.0: on
 * unpatched code the endpoint answers 200 with the other customer's contact details.
 *
 * Contributed for inclusion in the project by Nirut Tangprasitti, SOSECURE Co., Ltd.,
 * from the private report of 2026-07-28.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { generateToken } from '../../middleware/auth.js';

vi.mock('../../lib/db.js', () => {
  const mockPrisma = {
    location: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    order: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    table: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    reservation: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn(), groupBy: vi.fn(), aggregate: vi.fn() },
    user: { findUnique: vi.fn() },
    customer: { findUnique: vi.fn() },
  };
  return { default: mockPrisma, prisma: mockPrisma };
});

import prisma from '../../lib/db.js';
const mockedPrisma = vi.mocked(prisma);

const app = createApp();

const staffToken = generateToken({ id: '1', email: 'admin@test.com', type: 'staff', role: 'SUPER_ADMIN' });
const ownerToken = generateToken({ id: 'cust-1', email: 'alice@test.com', type: 'customer' });
const otherCustomerToken = generateToken({ id: 'cust-2', email: 'bob@test.com', type: 'customer' });
// Structurally valid token that carries no principal id. `authenticate` always assigns
// req.user, so this is the closest thing to a missing principal that can reach the handler
// over HTTP: req.user is truthy but req.user.id is undefined. The handler must fail closed
// — it must not answer 200 and must not throw. Whether that lands as 401 (a stricter
// `authenticate`) or 403 (the ownership guard) is an implementation choice, so both are
// accepted; only 200/500 are regressions.
const noPrincipalToken = generateToken({ email: 'ghost@test.com', type: 'customer' } as any);

// Shaped like the `include` block of getReservation: customer (id/name/email/phone),
// location (id/name), table (id/name/capacity). Owned by cust-1.
const sampleReservation = {
  id: 'res-1',
  customerId: 'cust-1',
  locationId: 'loc-1',
  tableId: null,
  date: new Date('2026-03-15'),
  time: '19:00',
  partySize: 4,
  status: 'PENDING',
  comment: 'window seat, anniversary',
  customer: { id: 'cust-1', name: 'Alice', email: 'alice@test.com', phone: '+49-170-1234567' },
  location: { id: 'loc-1', name: 'Downtown Kitchen' },
  table: null,
};

// Shaped like the `include` block of getOrder. Owned by cust-1.
const sampleOrder = {
  id: 'ord-1',
  orderNumber: 'KA-ABC-123',
  customerId: 'cust-1',
  status: 'PENDING',
  total: 29.98,
  customer: { id: 'cust-1', name: 'Alice', email: 'alice@test.com', phone: '+49-170-1234567' },
  location: { id: 'loc-1', name: 'Downtown Kitchen' },
  items: [],
};

/** Every channel the body could come out through, as one string. */
function wire(res: { text?: string; body?: unknown }): string {
  return `${res.text ?? ''}${JSON.stringify(res.body ?? {})}`;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Reservation object-level authorization - Regression Tests', () => {
  describe('GET /api/reservations/:id', () => {
    it('lets the owning customer read their own reservation', async () => {
      mockedPrisma.reservation.findUnique.mockResolvedValueOnce(sampleReservation as any);

      const res = await request(app)
        .get('/api/reservations/res-1')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('res-1');
      expect(res.body.data.customerId).toBe('cust-1');
    });

    it('denies a different customer and leaks no contact details', async () => {
      mockedPrisma.reservation.findUnique.mockResolvedValueOnce(sampleReservation as any);

      const res = await request(app)
        .get('/api/reservations/res-1')
        .set('Authorization', `Bearer ${otherCustomerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.data).toBeUndefined();
      // The status alone is not the property under test — the owner's PII must be absent
      // from the response no matter how it is shaped.
      const serialized = wire(res);
      expect(serialized).not.toContain(sampleReservation.customer.email);
      expect(serialized).not.toContain(sampleReservation.customer.phone);
      expect(serialized).not.toContain(sampleReservation.comment);
    });

    it('lets staff read any reservation', async () => {
      mockedPrisma.reservation.findUnique.mockResolvedValueOnce(sampleReservation as any);

      const res = await request(app)
        .get('/api/reservations/res-1')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('res-1');
      expect(res.body.data.customer.email).toBe('alice@test.com');
    });

    it('returns 401 without auth and never queries the reservation', async () => {
      const res = await request(app).get('/api/reservations/res-1');

      expect(res.status).toBe(401);
      expect(mockedPrisma.reservation.findUnique).not.toHaveBeenCalled();
    });

    it('returns 404 for an unknown id without disclosing any reservation data', async () => {
      mockedPrisma.reservation.findUnique.mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/api/reservations/bad-id')
        .set('Authorization', `Bearer ${otherCustomerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.data).toBeUndefined();
      const serialized = wire(res);
      expect(serialized).not.toContain(sampleReservation.customer.email);
      expect(serialized).not.toContain(sampleReservation.customer.phone);
    });

    it('fails closed for a token that carries no principal id (never 200, never 500)', async () => {
      mockedPrisma.reservation.findUnique.mockResolvedValueOnce(sampleReservation as any);

      const res = await request(app)
        .get('/api/reservations/res-1')
        .set('Authorization', `Bearer ${noPrincipalToken}`);

      expect([401, 403]).toContain(res.status);
      expect(res.body.data).toBeUndefined();
      const serialized = wire(res);
      expect(serialized).not.toContain(sampleReservation.customer.email);
      expect(serialized).not.toContain(sampleReservation.customer.phone);
    });
  });

  describe('PATCH /api/reservations/:id', () => {
    it('denies a customer updating a reservation and never writes', async () => {
      const res = await request(app)
        .patch('/api/reservations/res-1')
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .send({ status: 'CANCELLED' });

      expect(res.status).toBe(403);
      expect(mockedPrisma.reservation.update).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/reservations/:id', () => {
    it('denies a customer deleting a reservation and never writes', async () => {
      const res = await request(app)
        .delete('/api/reservations/res-1')
        .set('Authorization', `Bearer ${otherCustomerToken}`);

      expect(res.status).toBe(403);
      expect(mockedPrisma.reservation.delete).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/reservations/my-reservations', () => {
    it('scopes the list to the calling customer', async () => {
      mockedPrisma.reservation.findMany.mockResolvedValueOnce([]);
      mockedPrisma.reservation.count.mockResolvedValueOnce(0);

      const res = await request(app)
        .get('/api/reservations/my-reservations')
        .set('Authorization', `Bearer ${otherCustomerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
      // Extra filters may be added later; the property under test is only that the caller's
      // id is always part of the WHERE clause.
      expect(mockedPrisma.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ customerId: 'cust-2' }) })
      );
    });
  });

  describe('GET /api/reservations', () => {
    it('denies a customer the staff listing and never queries reservations', async () => {
      const res = await request(app)
        .get('/api/reservations')
        .set('Authorization', `Bearer ${otherCustomerToken}`);

      expect(res.status).toBe(403);
      expect(mockedPrisma.reservation.findMany).not.toHaveBeenCalled();
    });
  });
});

/**
 * The same bug class on orders was already fixed (`getOrder` compares `order.customerId`
 * to `req.user.id`), but that guard currently has no test. These two cases pass on 0.3.0
 * as-is — they are here to keep the existing fix from silently regressing, not to
 * demonstrate a defect.
 */
describe('Order object-level authorization - guards the already-shipped fix', () => {
  describe('GET /api/orders/:id', () => {
    it('lets the owning customer read their own order', async () => {
      mockedPrisma.order.findUnique.mockResolvedValueOnce(sampleOrder as any);

      const res = await request(app)
        .get('/api/orders/ord-1')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('ord-1');
    });

    it('denies a different customer and leaks no contact details', async () => {
      mockedPrisma.order.findUnique.mockResolvedValueOnce(sampleOrder as any);

      const res = await request(app)
        .get('/api/orders/ord-1')
        .set('Authorization', `Bearer ${otherCustomerToken}`);

      expect(res.status).toBe(403);
      const serialized = wire(res);
      expect(serialized).not.toContain(sampleOrder.customer.email);
      expect(serialized).not.toContain(sampleOrder.customer.phone);
      expect(serialized).not.toContain(sampleOrder.orderNumber);
    });
  });
});
