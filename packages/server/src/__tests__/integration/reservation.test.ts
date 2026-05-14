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
    deliveryZone: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    table: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    reservation: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn(), groupBy: vi.fn(), aggregate: vi.fn() },
    $queryRaw: vi.fn(),
    user: { findUnique: vi.fn() },
    customer: { findUnique: vi.fn() },
    category: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
  };
  return { default: mockPrisma, prisma: mockPrisma };
});

vi.mock('../../lib/stripe.js', () => ({
  default: {
    paymentIntents: { create: vi.fn() },
    webhooks: { constructEvent: vi.fn() },
  },
}));

import prisma from '../../lib/db.js';
const mockedPrisma = vi.mocked(prisma);

const app = createApp();

const staffToken = generateToken({ id: '1', email: 'admin@test.com', type: 'staff', role: 'SUPER_ADMIN' });
const customerToken = generateToken({ id: 'cust-1', email: 'customer@test.com', type: 'customer' });

const sampleLocation = { id: 'loc-1', name: 'Downtown Kitchen', isActive: true };
const sampleReservation = {
  id: 'res-1',
  customerId: 'cust-1',
  locationId: 'loc-1',
  date: new Date('2026-03-15'),
  time: '19:00',
  partySize: 4,
  status: 'PENDING',
  comment: null,
  customer: { id: 'cust-1', name: 'John', email: 'john@test.com', phone: null },
  location: { id: 'loc-1', name: 'Downtown Kitchen' },
  table: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Reservation API', () => {
  describe('POST /api/reservations', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).post('/api/reservations').send({
        locationId: 'loc-1', date: '2026-03-15', time: '19:00', partySize: 4,
      });
      expect(res.status).toBe(401);
    });

    it('returns 400 for invalid data', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ locationId: '', date: 'bad', time: '19', partySize: 0 });
      expect(res.status).toBe(400);
    });

    it('returns 400 for inactive location', async () => {
      mockedPrisma.location.findUnique.mockResolvedValueOnce({ ...sampleLocation, isActive: false } as any);
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ locationId: 'loc-1', date: '2026-03-15', time: '19:00', partySize: 4 });
      expect(res.status).toBe(400);
    });

    it('creates reservation successfully', async () => {
      mockedPrisma.location.findUnique.mockResolvedValueOnce(sampleLocation as any);
      mockedPrisma.reservation.create.mockResolvedValueOnce(sampleReservation as any);
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ locationId: 'loc-1', date: '2026-03-15', time: '19:00', partySize: 4 });
      expect(res.status).toBe(201);
      expect(res.body.data.partySize).toBe(4);
    });
  });

  describe('GET /api/reservations', () => {
    it('returns 403 for non-staff', async () => {
      const res = await request(app)
        .get('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    it('returns paginated list for staff', async () => {
      mockedPrisma.reservation.findMany.mockResolvedValueOnce([sampleReservation] as any);
      mockedPrisma.reservation.count.mockResolvedValueOnce(1);
      const res = await request(app)
        .get('/api/reservations')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination.total).toBe(1);
    });
  });

  describe('GET /api/reservations/my-reservations', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/reservations/my-reservations');
      expect(res.status).toBe(401);
    });

    it('returns customer reservations', async () => {
      mockedPrisma.reservation.findMany.mockResolvedValueOnce([sampleReservation] as any);
      mockedPrisma.reservation.count.mockResolvedValueOnce(1);
      const res = await request(app)
        .get('/api/reservations/my-reservations')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/reservations/:id', () => {
    it('returns 404 for not found', async () => {
      mockedPrisma.reservation.findUnique.mockResolvedValueOnce(null);
      const res = await request(app)
        .get('/api/reservations/bad-id')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(404);
    });

    it('returns reservation detail', async () => {
      mockedPrisma.reservation.findUnique.mockResolvedValueOnce(sampleReservation as any);
      const res = await request(app)
        .get('/api/reservations/res-1')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('res-1');
    });
  });

  describe('PATCH /api/reservations/:id', () => {
    it('returns 403 for non-staff', async () => {
      const res = await request(app)
        .patch('/api/reservations/res-1')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'CONFIRMED' });
      expect(res.status).toBe(403);
    });

    it('returns 404 if not found', async () => {
      mockedPrisma.reservation.findUnique.mockResolvedValueOnce(null);
      const res = await request(app)
        .patch('/api/reservations/bad-id')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'CONFIRMED' });
      expect(res.status).toBe(404);
    });

    it('updates status successfully', async () => {
      mockedPrisma.reservation.findUnique.mockResolvedValueOnce(sampleReservation as any);
      mockedPrisma.reservation.update.mockResolvedValueOnce({ ...sampleReservation, status: 'CONFIRMED' } as any);
      const res = await request(app)
        .patch('/api/reservations/res-1')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'CONFIRMED' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CONFIRMED');
    });
  });

  describe('DELETE /api/reservations/:id', () => {
    it('returns 404 if not found', async () => {
      mockedPrisma.reservation.findUnique.mockResolvedValueOnce(null);
      const res = await request(app)
        .delete('/api/reservations/bad-id')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(404);
    });

    it('deletes reservation', async () => {
      mockedPrisma.reservation.findUnique.mockResolvedValueOnce(sampleReservation as any);
      mockedPrisma.reservation.delete.mockResolvedValueOnce(sampleReservation as any);
      const res = await request(app)
        .delete('/api/reservations/res-1')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/reservations/analytics', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/reservations/analytics');
      expect(res.status).toBe(401);
    });

    it('returns 403 for non-staff', async () => {
      const res = await request(app)
        .get('/api/reservations/analytics')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    it('returns analytics shape for staff', async () => {
      (mockedPrisma as any).$queryRaw
        .mockResolvedValueOnce([{ date: '2026-03-10', reservations: 2n, guests: 6n }])           // dailyRows
        .mockResolvedValueOnce([{ dow: 5, reservations: 2n, guests: 6n }])                       // dowRows
        .mockResolvedValueOnce([{ hour: 19, reservations: 2n }])                                 // hourlyRows
        .mockResolvedValueOnce([{ bucket: '1-2d', count: 2n }]);                                 // leadTimeRows
      mockedPrisma.reservation.groupBy
        .mockResolvedValueOnce([{ partySize: 4, _count: 2 }] as any)                             // partySizeRows
        .mockResolvedValueOnce([{ status: 'PENDING', _count: 2 }] as any);                       // statusRows
      mockedPrisma.reservation.aggregate.mockResolvedValueOnce({
        _count: 2,
        _sum: { partySize: 8 },
        _avg: { partySize: 4 },
      } as any);
      mockedPrisma.reservation.count.mockResolvedValueOnce(0);                                   // completedCount

      const res = await request(app)
        .get('/api/reservations/analytics?days=30')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary).toMatchObject({
        totalReservations: 2,
        totalGuests: 8,
        avgPartySize: 4,
        completionRate: 0,
      });
      expect(res.body.data.dailyBookings).toEqual([{ date: '2026-03-10', reservations: 2, guests: 6 }]);
      expect(res.body.data.dayOfWeekDistribution).toEqual([{ dow: 5, reservations: 2, guests: 6 }]);
      expect(res.body.data.partySizeDistribution).toEqual([{ partySize: 4, count: 2 }]);
      expect(res.body.data.statusDistribution).toEqual([{ status: 'PENDING', count: 2 }]);
      expect(res.body.data.hourlyDistribution).toEqual([{ hour: 19, reservations: 2 }]);
      // leadTimeBuckets always returns 5 buckets, with counts filled in
      expect(res.body.data.leadTimeBuckets).toHaveLength(5);
      expect(res.body.data.leadTimeBuckets.find((b: any) => b.bucket === '1-2d').count).toBe(2);
    });
  });

  describe('GET /api/reservations/availability', () => {
    it('returns 400 without required params', async () => {
      const res = await request(app).get('/api/reservations/availability');
      expect(res.status).toBe(400);
    });

    it('returns time slots', async () => {
      mockedPrisma.table.findMany.mockResolvedValueOnce([
        { id: 'table-1', name: 'T1', capacity: 4, isActive: true },
      ] as any);
      mockedPrisma.reservation.findMany.mockResolvedValueOnce([]);
      const res = await request(app)
        .get('/api/reservations/availability?locationId=loc-1&date=2026-03-15&partySize=2');
      expect(res.status).toBe(200);
      expect(res.body.data.slots).toBeDefined();
      expect(res.body.data.slots.length).toBeGreaterThan(0);
      expect(res.body.data.slots[0]).toHaveProperty('time');
      expect(res.body.data.slots[0]).toHaveProperty('available');
    });
  });
});
