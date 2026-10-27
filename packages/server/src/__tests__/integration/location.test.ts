import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { generateToken } from '../../middleware/auth.js';

// Mock the Prisma client
vi.mock('../../lib/db.js', () => {
  const mockPrisma = {
    location: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    order: {
      count: vi.fn(),
    },
    deliveryZone: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: { findUnique: vi.fn() },
    customer: { findUnique: vi.fn() },
  };
  return { default: mockPrisma, prisma: mockPrisma };
});

import prisma from '../../lib/db.js';
const mockedPrisma = vi.mocked(prisma);

const app = createApp();

const adminToken = generateToken({ id: '1', email: 'admin@test.com', type: 'staff', role: 'SUPER_ADMIN' });
const managerToken = generateToken({ id: '2', email: 'mgr@test.com', type: 'staff', role: 'MANAGER' });
const staffToken = generateToken({ id: '3', email: 'staff@test.com', type: 'staff', role: 'STAFF' });
const customerToken = generateToken({ id: '4', email: 'cust@test.com', type: 'customer' });

const sampleLocation = {
  id: 'loc-1',
  name: 'Downtown Kitchen',
  slug: 'downtown',
  description: 'Flagship',
  phone: '555-1234',
  email: 'dt@test.com',
  address: '123 Main St',
  city: 'San Francisco',
  state: 'CA',
  postalCode: '94102',
  country: 'US',
  lat: null,
  lng: null,
  image: null,
  isActive: true,
  deliveryEnabled: true,
  pickupEnabled: true,
  minOrderDelivery: 15,
  minOrderPickup: 0,
  deliveryLeadTime: 30,
  pickupLeadTime: 15,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Location API - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================
  // LIST
  // ============================================================
  describe('GET /api/locations', () => {
    it('returns paginated list of locations (no auth required)', async () => {
      mockedPrisma.location.findMany.mockResolvedValue([sampleLocation] as any);
      mockedPrisma.location.count.mockResolvedValue(1);

      const res = await request(app).get('/api/locations');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Downtown Kitchen');
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(1);
    });

    it('supports pagination params', async () => {
      mockedPrisma.location.findMany.mockResolvedValue([]);
      mockedPrisma.location.count.mockResolvedValue(0);

      const res = await request(app).get('/api/locations?page=2&limit=5');

      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(2);
      expect(res.body.pagination.limit).toBe(5);
    });
  });

  // ============================================================
  // GET
  // ============================================================
  describe('GET /api/locations/:id', () => {
    it('returns location by id', async () => {
      mockedPrisma.location.findUnique.mockResolvedValue({ ...sampleLocation, operatingHours: [], deliveryZones: [], tables: [] } as any);

      const res = await request(app).get('/api/locations/loc-1');

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Downtown Kitchen');
    });

    it('returns 404 for unknown id', async () => {
      mockedPrisma.location.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/locations/unknown');

      expect(res.status).toBe(404);
    });
  });

  // ============================================================
  // CREATE
  // ============================================================
  describe('POST /api/locations', () => {
    const newLocation = {
      name: 'Uptown Spot',
      slug: 'uptown',
      address: '456 High St',
      city: 'San Francisco',
      postalCode: '94110',
    };

    it('requires authentication', async () => {
      const res = await request(app).post('/api/locations').send(newLocation);
      expect(res.status).toBe(401);
    });

    it('requires SUPER_ADMIN or MANAGER role', async () => {
      const res = await request(app)
        .post('/api/locations')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(newLocation);
      expect(res.status).toBe(403);
    });

    it('rejects customer token', async () => {
      const res = await request(app)
        .post('/api/locations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(newLocation);
      expect(res.status).toBe(403);
    });

    it('returns 409 for duplicate slug', async () => {
      mockedPrisma.location.findUnique.mockResolvedValue(sampleLocation as any);

      const res = await request(app)
        .post('/api/locations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newLocation);

      expect(res.status).toBe(409);
    });

    it('creates location with MANAGER token', async () => {
      mockedPrisma.location.findUnique.mockResolvedValue(null);
      mockedPrisma.location.create.mockResolvedValue({ id: 'loc-2', ...newLocation } as any);

      const res = await request(app)
        .post('/api/locations')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(newLocation);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('validates slug format', async () => {
      const res = await request(app)
        .post('/api/locations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...newLocation, slug: 'INVALID SLUG!' });

      expect(res.status).toBe(400);
    });

    it.each(['', 'contact@example.com'])('accepts optional email %j when creating a location', async (email) => {
      mockedPrisma.location.findUnique.mockResolvedValue(null);
      mockedPrisma.location.create.mockResolvedValue({
        ...sampleLocation, email, isBusy: false, busyMessage: null,
      });

      const res = await request(app)
        .post('/api/locations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...newLocation, email });

      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe(email);
      expect(mockedPrisma.location.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ email }),
      }));
    });

    it('rejects a malformed non-empty email when creating a location', async () => {
      const res = await request(app)
        .post('/api/locations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...newLocation, email: 'invalid-email' });

      expect(res.status).toBe(400);
      expect(res.body.error).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: ['email'] }),
      ]));
      expect(mockedPrisma.location.create).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // UPDATE
  // ============================================================
  describe('PATCH /api/locations/:id', () => {
    it.each(['', 'contact@example.com'])('accepts optional email %j when updating a location', async (email) => {
      mockedPrisma.location.findUnique.mockResolvedValue({
        ...sampleLocation, isBusy: false, busyMessage: null,
      });
      mockedPrisma.location.update.mockResolvedValue({
        ...sampleLocation, email, isBusy: false, busyMessage: null,
      });

      const res = await request(app)
        .patch('/api/locations/loc-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email });

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(email);
      expect(mockedPrisma.location.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ email }),
      }));
    });

    it('rejects a malformed non-empty email when updating a location', async () => {
      const res = await request(app)
        .patch('/api/locations/loc-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'invalid-email' });

      expect(res.status).toBe(400);
      expect(res.body.error).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: ['email'] }),
      ]));
      expect(mockedPrisma.location.update).not.toHaveBeenCalled();
    });

    it('updates location name', async () => {
      mockedPrisma.location.findUnique.mockResolvedValue(sampleLocation as any);
      mockedPrisma.location.update.mockResolvedValue({ ...sampleLocation, name: 'Updated Name' } as any);

      const res = await request(app)
        .patch('/api/locations/loc-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
    });

    it('returns 404 for unknown id', async () => {
      mockedPrisma.location.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/locations/unknown')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test' });

      expect(res.status).toBe(404);
    });
  });

  // ============================================================
  // DELETE
  // ============================================================
  describe('DELETE /api/locations/:id', () => {
    it('requires SUPER_ADMIN role', async () => {
      const res = await request(app)
        .delete('/api/locations/loc-1')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(403);
    });

    it('returns 404 for unknown id', async () => {
      mockedPrisma.location.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/locations/unknown')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('returns 409 if location has orders', async () => {
      mockedPrisma.location.findUnique.mockResolvedValue(sampleLocation as any);
      mockedPrisma.order.count.mockResolvedValue(5);

      const res = await request(app)
        .delete('/api/locations/loc-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(409);
    });

    it('deletes location with no orders', async () => {
      mockedPrisma.location.findUnique.mockResolvedValue(sampleLocation as any);
      mockedPrisma.order.count.mockResolvedValue(0);
      mockedPrisma.location.delete.mockResolvedValue(sampleLocation as any);

      const res = await request(app)
        .delete('/api/locations/loc-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Location deleted');
    });
  });

  // ============================================================
  // DELIVERY ZONES
  // ============================================================
  describe('GET /api/locations/:locationId/delivery-zones', () => {
    it('returns zones for a location', async () => {
      mockedPrisma.location.findUnique.mockResolvedValue(sampleLocation as any);
      mockedPrisma.deliveryZone.findMany.mockResolvedValue([
        { id: 'z1', name: 'Zone 1', charge: 3.99, minOrder: 15, isActive: true },
      ] as any);

      const res = await request(app).get('/api/locations/loc-1/delivery-zones');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Zone 1');
    });

    it('returns 404 for unknown location', async () => {
      mockedPrisma.location.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/locations/unknown/delivery-zones');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/locations/:locationId/delivery-zones', () => {
    it('creates a delivery zone', async () => {
      mockedPrisma.location.findUnique.mockResolvedValue(sampleLocation as any);
      mockedPrisma.deliveryZone.create.mockResolvedValue({
        id: 'z2',
        locationId: 'loc-1',
        name: 'Zone 2',
        charge: 5.99,
        minOrder: 25,
        isActive: true,
      } as any);

      const res = await request(app)
        .post('/api/locations/loc-1/delivery-zones')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Zone 2', charge: 5.99, minOrder: 25 });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Zone 2');
    });
  });

  describe('DELETE /api/locations/:locationId/delivery-zones/:zoneId', () => {
    it('deletes a delivery zone', async () => {
      mockedPrisma.deliveryZone.findFirst.mockResolvedValue({ id: 'z1', locationId: 'loc-1' } as any);
      mockedPrisma.deliveryZone.delete.mockResolvedValue({} as any);

      const res = await request(app)
        .delete('/api/locations/loc-1/delivery-zones/z1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('returns 404 for zone not in location', async () => {
      mockedPrisma.deliveryZone.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/locations/loc-1/delivery-zones/unknown')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
