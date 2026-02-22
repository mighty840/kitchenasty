import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { generateToken } from '../../middleware/auth.js';

vi.mock('../../lib/db.js', () => {
    const mockPrisma = {
        location: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
        order: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
        orderItem: { count: vi.fn() },
        menuItem: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), count: vi.fn() },
        deliveryZone: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
        table: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
        reservation: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
        coupon: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
        review: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn(), aggregate: vi.fn() },
        user: { findUnique: vi.fn() },
        customer: { findUnique: vi.fn() },
        category: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
        automationRule: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
        mealtime: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
        allergen: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
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

const adminToken = generateToken({ id: '1', email: 'admin@test.com', type: 'staff', role: 'SUPER_ADMIN' });
const managerToken = generateToken({ id: '2', email: 'manager@test.com', type: 'staff', role: 'MANAGER' });
const staffToken = generateToken({ id: '3', email: 'staff@test.com', type: 'staff', role: 'STAFF' });
const customerToken = generateToken({ id: 'cust-1', email: 'customer@test.com', type: 'customer' });

const sampleAllergen = {
    id: 'alg-1',
    name: 'Gluten',
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { menuItems: 5 },
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Allergen API', () => {
    describe('GET /api/menu/allergens', () => {
        it('returns list without authentication (public endpoint)', async () => {
            mockedPrisma.allergen.findMany.mockResolvedValueOnce([sampleAllergen] as any);

            const res = await request(app).get('/api/menu/allergens');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].name).toBe('Gluten');
        });

        it('returns allergens sorted by name', async () => {
            const allergens = [
                { id: 'alg-2', name: 'Dairy', _count: { menuItems: 3 } },
                { id: 'alg-1', name: 'Gluten', _count: { menuItems: 5 } },
            ];
            mockedPrisma.allergen.findMany.mockResolvedValueOnce(allergens as any);

            const res = await request(app).get('/api/menu/allergens');

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(2);
            expect(mockedPrisma.allergen.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ orderBy: { name: 'asc' } }),
            );
        });
    });

    describe('POST /api/menu/allergens', () => {
        it('returns 401 without authentication', async () => {
            const res = await request(app)
                .post('/api/menu/allergens')
                .send({ name: 'Peanuts' });
            expect(res.status).toBe(401);
        });

        it('returns 403 for customer token', async () => {
            const res = await request(app)
                .post('/api/menu/allergens')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ name: 'Peanuts' });
            expect(res.status).toBe(403);
        });

        it('returns 403 for STAFF token', async () => {
            const res = await request(app)
                .post('/api/menu/allergens')
                .set('Authorization', `Bearer ${staffToken}`)
                .send({ name: 'Peanuts' });
            expect(res.status).toBe(403);
        });

        it('returns 400 for missing name', async () => {
            const res = await request(app)
                .post('/api/menu/allergens')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('returns 400 for empty name', async () => {
            const res = await request(app)
                .post('/api/menu/allergens')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: '' });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('returns 409 for duplicate allergen name', async () => {
            mockedPrisma.allergen.findUnique.mockResolvedValueOnce(sampleAllergen as any);

            const res = await request(app)
                .post('/api/menu/allergens')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Gluten' });

            expect(res.status).toBe(409);
            expect(res.body.success).toBe(false);
        });

        it('creates allergen with MANAGER token', async () => {
            mockedPrisma.allergen.findUnique.mockResolvedValueOnce(null);
            mockedPrisma.allergen.create.mockResolvedValueOnce({ id: 'alg-3', name: 'Peanuts' } as any);

            const res = await request(app)
                .post('/api/menu/allergens')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ name: 'Peanuts' });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('Peanuts');
        });

        it('creates allergen with SUPER_ADMIN token', async () => {
            mockedPrisma.allergen.findUnique.mockResolvedValueOnce(null);
            mockedPrisma.allergen.create.mockResolvedValueOnce({ id: 'alg-4', name: 'Soy' } as any);

            const res = await request(app)
                .post('/api/menu/allergens')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Soy' });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        });
    });

    describe('DELETE /api/menu/allergens/:id', () => {
        it('returns 401 without authentication', async () => {
            const res = await request(app).delete('/api/menu/allergens/alg-1');
            expect(res.status).toBe(401);
        });

        it('returns 403 for MANAGER (SUPER_ADMIN only)', async () => {
            const res = await request(app)
                .delete('/api/menu/allergens/alg-1')
                .set('Authorization', `Bearer ${managerToken}`);
            expect(res.status).toBe(403);
        });

        it('returns 403 for STAFF', async () => {
            const res = await request(app)
                .delete('/api/menu/allergens/alg-1')
                .set('Authorization', `Bearer ${staffToken}`);
            expect(res.status).toBe(403);
        });

        it('returns 404 for non-existent allergen', async () => {
            mockedPrisma.allergen.findUnique.mockResolvedValueOnce(null);

            const res = await request(app)
                .delete('/api/menu/allergens/bad-id')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });

        it('deletes allergen successfully', async () => {
            mockedPrisma.allergen.findUnique.mockResolvedValueOnce(sampleAllergen as any);
            mockedPrisma.allergen.delete.mockResolvedValueOnce(sampleAllergen as any);

            const res = await request(app)
                .delete('/api/menu/allergens/alg-1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Allergen deleted');
        });
    });
});
