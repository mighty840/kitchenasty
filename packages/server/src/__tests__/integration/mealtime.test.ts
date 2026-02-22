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
        reservation: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
        coupon: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
        review: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn(), aggregate: vi.fn() },
        user: { findUnique: vi.fn() },
        customer: { findUnique: vi.fn() },
        category: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
        automationRule: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
        mealtime: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
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

const sampleMealtime = {
    id: 'mt-1',
    name: 'Breakfast',
    startTime: '06:00',
    endTime: '11:00',
    days: [1, 2, 3, 4, 5],
    isActive: true,
    locationId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { menuItems: 5 },
};

const validCreateBody = {
    name: 'Breakfast',
    startTime: '06:00',
    endTime: '11:00',
    days: [1, 2, 3, 4, 5],
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Mealtime API', () => {
    describe('GET /api/menu/mealtimes', () => {
        it('returns list without authentication (public endpoint)', async () => {
            mockedPrisma.mealtime.findMany.mockResolvedValueOnce([sampleMealtime] as any);

            const res = await request(app).get('/api/menu/mealtimes');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].name).toBe('Breakfast');
        });

        it('filters by locationId query param', async () => {
            mockedPrisma.mealtime.findMany.mockResolvedValueOnce([sampleMealtime] as any);

            const res = await request(app).get('/api/menu/mealtimes?locationId=loc-1');

            expect(res.status).toBe(200);
            expect(mockedPrisma.mealtime.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { locationId: 'loc-1' } }),
            );
        });
    });

    describe('POST /api/menu/mealtimes', () => {
        it('returns 401 without authentication', async () => {
            const res = await request(app)
                .post('/api/menu/mealtimes')
                .send(validCreateBody);
            expect(res.status).toBe(401);
        });

        it('returns 403 for customer token', async () => {
            const res = await request(app)
                .post('/api/menu/mealtimes')
                .set('Authorization', `Bearer ${customerToken}`)
                .send(validCreateBody);
            expect(res.status).toBe(403);
        });

        it('returns 403 for STAFF token', async () => {
            const res = await request(app)
                .post('/api/menu/mealtimes')
                .set('Authorization', `Bearer ${staffToken}`)
                .send(validCreateBody);
            expect(res.status).toBe(403);
        });

        it('returns 400 for missing name', async () => {
            const res = await request(app)
                .post('/api/menu/mealtimes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ startTime: '06:00', endTime: '11:00', days: [1] });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('returns 400 for invalid startTime format', async () => {
            const res = await request(app)
                .post('/api/menu/mealtimes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Bad', startTime: 'invalid', endTime: '11:00', days: [1] });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('returns 400 for empty days array', async () => {
            const res = await request(app)
                .post('/api/menu/mealtimes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Bad', startTime: '06:00', endTime: '11:00', days: [] });
            expect(res.status).toBe(400);
        });

        it('creates mealtime with MANAGER token', async () => {
            mockedPrisma.mealtime.create.mockResolvedValueOnce(sampleMealtime as any);

            const res = await request(app)
                .post('/api/menu/mealtimes')
                .set('Authorization', `Bearer ${managerToken}`)
                .send(validCreateBody);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('Breakfast');
        });

        it('creates mealtime with SUPER_ADMIN token', async () => {
            mockedPrisma.mealtime.create.mockResolvedValueOnce(sampleMealtime as any);

            const res = await request(app)
                .post('/api/menu/mealtimes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(validCreateBody);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        });
    });

    describe('PATCH /api/menu/mealtimes/:id', () => {
        it('returns 401 without authentication', async () => {
            const res = await request(app)
                .patch('/api/menu/mealtimes/mt-1')
                .send({ name: 'Updated' });
            expect(res.status).toBe(401);
        });

        it('returns 403 for STAFF token', async () => {
            const res = await request(app)
                .patch('/api/menu/mealtimes/mt-1')
                .set('Authorization', `Bearer ${staffToken}`)
                .send({ name: 'Updated' });
            expect(res.status).toBe(403);
        });

        it('returns 404 for non-existent mealtime', async () => {
            mockedPrisma.mealtime.findUnique.mockResolvedValueOnce(null);

            const res = await request(app)
                .patch('/api/menu/mealtimes/bad-id')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Updated' });

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });

        it('returns 400 for invalid startTime format', async () => {
            const res = await request(app)
                .patch('/api/menu/mealtimes/mt-1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ startTime: 'not-a-time' });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('updates mealtime name with MANAGER token', async () => {
            mockedPrisma.mealtime.findUnique.mockResolvedValueOnce(sampleMealtime as any);
            mockedPrisma.mealtime.update.mockResolvedValueOnce({ ...sampleMealtime, name: 'Brunch' } as any);

            const res = await request(app)
                .patch('/api/menu/mealtimes/mt-1')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ name: 'Brunch' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('Brunch');
        });

        it('partial update — only isActive field', async () => {
            mockedPrisma.mealtime.findUnique.mockResolvedValueOnce(sampleMealtime as any);
            mockedPrisma.mealtime.update.mockResolvedValueOnce({ ...sampleMealtime, isActive: false } as any);

            const res = await request(app)
                .patch('/api/menu/mealtimes/mt-1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isActive: false });

            expect(res.status).toBe(200);
            expect(res.body.data.isActive).toBe(false);
        });
    });

    describe('DELETE /api/menu/mealtimes/:id', () => {
        it('returns 401 without authentication', async () => {
            const res = await request(app).delete('/api/menu/mealtimes/mt-1');
            expect(res.status).toBe(401);
        });

        it('returns 403 for MANAGER (SUPER_ADMIN only)', async () => {
            const res = await request(app)
                .delete('/api/menu/mealtimes/mt-1')
                .set('Authorization', `Bearer ${managerToken}`);
            expect(res.status).toBe(403);
        });

        it('returns 403 for STAFF', async () => {
            const res = await request(app)
                .delete('/api/menu/mealtimes/mt-1')
                .set('Authorization', `Bearer ${staffToken}`);
            expect(res.status).toBe(403);
        });

        it('returns 404 for non-existent mealtime', async () => {
            mockedPrisma.mealtime.findUnique.mockResolvedValueOnce(null);

            const res = await request(app)
                .delete('/api/menu/mealtimes/bad-id')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });

        it('deletes mealtime successfully', async () => {
            mockedPrisma.mealtime.findUnique.mockResolvedValueOnce(sampleMealtime as any);
            mockedPrisma.mealtime.delete.mockResolvedValueOnce(sampleMealtime as any);

            const res = await request(app)
                .delete('/api/menu/mealtimes/mt-1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Mealtime deleted');
        });
    });
});
