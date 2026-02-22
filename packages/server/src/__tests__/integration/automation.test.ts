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

const sampleRule = {
    id: 'rule-1',
    name: 'Order confirmation email',
    event: 'order.created',
    conditions: null,
    actions: [{ type: 'email', template: 'orderConfirmation', to: 'customer' }],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const validCreateBody = {
    name: 'Order confirmation email',
    event: 'order.created',
    actions: [{ type: 'email', template: 'orderConfirmation', to: 'customer' }],
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Automation Rules API', () => {
    describe('GET /api/automation-rules', () => {
        it('returns 401 without authentication', async () => {
            const res = await request(app).get('/api/automation-rules');
            expect(res.status).toBe(401);
        });

        it('returns 403 for customers', async () => {
            const res = await request(app)
                .get('/api/automation-rules')
                .set('Authorization', `Bearer ${customerToken}`);
            expect(res.status).toBe(403);
        });

        it('returns 403 for regular staff', async () => {
            const res = await request(app)
                .get('/api/automation-rules')
                .set('Authorization', `Bearer ${staffToken}`);
            expect(res.status).toBe(403);
        });

        it('returns paginated list for admin', async () => {
            mockedPrisma.automationRule.findMany.mockResolvedValueOnce([sampleRule] as any);
            mockedPrisma.automationRule.count.mockResolvedValueOnce(1);
            const res = await request(app)
                .get('/api/automation-rules')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.pagination.total).toBe(1);
        });

        it('returns paginated list for manager', async () => {
            mockedPrisma.automationRule.findMany.mockResolvedValueOnce([sampleRule] as any);
            mockedPrisma.automationRule.count.mockResolvedValueOnce(1);
            const res = await request(app)
                .get('/api/automation-rules')
                .set('Authorization', `Bearer ${managerToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });

        it('respects page and limit query params', async () => {
            mockedPrisma.automationRule.findMany.mockResolvedValueOnce([]);
            mockedPrisma.automationRule.count.mockResolvedValueOnce(25);
            const res = await request(app)
                .get('/api/automation-rules?page=2&limit=10')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.pagination.page).toBe(2);
            expect(res.body.pagination.limit).toBe(10);
            expect(res.body.pagination.totalPages).toBe(3);
        });
    });

    describe('GET /api/automation-rules/:id', () => {
        it('returns 401 without authentication', async () => {
            const res = await request(app).get('/api/automation-rules/rule-1');
            expect(res.status).toBe(401);
        });

        it('returns 404 for non-existent rule', async () => {
            mockedPrisma.automationRule.findUnique.mockResolvedValueOnce(null);
            const res = await request(app)
                .get('/api/automation-rules/bad-id')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });

        it('returns rule for authorized user', async () => {
            mockedPrisma.automationRule.findUnique.mockResolvedValueOnce(sampleRule as any);
            const res = await request(app)
                .get('/api/automation-rules/rule-1')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('Order confirmation email');
        });
    });

    describe('POST /api/automation-rules', () => {
        it('returns 403 for customers', async () => {
            const res = await request(app)
                .post('/api/automation-rules')
                .set('Authorization', `Bearer ${customerToken}`)
                .send(validCreateBody);
            expect(res.status).toBe(403);
        });

        it('returns 403 for regular staff', async () => {
            const res = await request(app)
                .post('/api/automation-rules')
                .set('Authorization', `Bearer ${staffToken}`)
                .send(validCreateBody);
            expect(res.status).toBe(403);
        });

        it('returns 400 for missing name', async () => {
            const res = await request(app)
                .post('/api/automation-rules')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ event: 'order.created', actions: [{ type: 'email' }] });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('returns 400 for invalid event', async () => {
            const res = await request(app)
                .post('/api/automation-rules')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Test', event: 'invalid.event', actions: [{ type: 'email' }] });
            expect(res.status).toBe(400);
        });

        it('returns 400 for invalid action type', async () => {
            const res = await request(app)
                .post('/api/automation-rules')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Test', event: 'order.created', actions: [{ type: 'invalid' }] });
            expect(res.status).toBe(400);
        });

        it('returns 400 for empty actions array', async () => {
            const res = await request(app)
                .post('/api/automation-rules')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Test', event: 'order.created', actions: [] });
            expect(res.status).toBe(400);
        });

        it('creates rule successfully', async () => {
            mockedPrisma.automationRule.create.mockResolvedValueOnce(sampleRule as any);
            const res = await request(app)
                .post('/api/automation-rules')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(validCreateBody);
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('Order confirmation email');
        });

        it('creates rule with explicit null conditions', async () => {
            mockedPrisma.automationRule.create.mockResolvedValueOnce(sampleRule as any);
            const res = await request(app)
                .post('/api/automation-rules')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ ...validCreateBody, conditions: null });
            expect(res.status).toBe(201);
        });

        it('creates rule with conditions object', async () => {
            const ruleWithConditions = { ...sampleRule, conditions: { status: 'CONFIRMED' } };
            mockedPrisma.automationRule.create.mockResolvedValueOnce(ruleWithConditions as any);
            const res = await request(app)
                .post('/api/automation-rules')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ ...validCreateBody, conditions: { status: 'CONFIRMED' } });
            expect(res.status).toBe(201);
            expect(res.body.data.conditions).toEqual({ status: 'CONFIRMED' });
        });
    });

    describe('PATCH /api/automation-rules/:id', () => {
        it('returns 404 if rule not found', async () => {
            mockedPrisma.automationRule.findUnique.mockResolvedValueOnce(null);
            const res = await request(app)
                .patch('/api/automation-rules/bad-id')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Updated rule' });
            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });

        it('updates rule name', async () => {
            mockedPrisma.automationRule.findUnique.mockResolvedValueOnce(sampleRule as any);
            mockedPrisma.automationRule.update.mockResolvedValueOnce({ ...sampleRule, name: 'Updated rule' } as any);
            const res = await request(app)
                .patch('/api/automation-rules/rule-1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Updated rule' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('Updated rule');
        });

        it('updates isActive flag', async () => {
            mockedPrisma.automationRule.findUnique.mockResolvedValueOnce(sampleRule as any);
            mockedPrisma.automationRule.update.mockResolvedValueOnce({ ...sampleRule, isActive: false } as any);
            const res = await request(app)
                .patch('/api/automation-rules/rule-1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isActive: false });
            expect(res.status).toBe(200);
            expect(res.body.data.isActive).toBe(false);
        });

        it('updates conditions to null', async () => {
            mockedPrisma.automationRule.findUnique.mockResolvedValueOnce({ ...sampleRule, conditions: { status: 'CONFIRMED' } } as any);
            mockedPrisma.automationRule.update.mockResolvedValueOnce({ ...sampleRule, conditions: null } as any);
            const res = await request(app)
                .patch('/api/automation-rules/rule-1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ conditions: null });
            expect(res.status).toBe(200);
        });

        it('allows manager to update rules', async () => {
            mockedPrisma.automationRule.findUnique.mockResolvedValueOnce(sampleRule as any);
            mockedPrisma.automationRule.update.mockResolvedValueOnce({ ...sampleRule, name: 'Manager update' } as any);
            const res = await request(app)
                .patch('/api/automation-rules/rule-1')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ name: 'Manager update' });
            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe('Manager update');
        });
    });

    describe('DELETE /api/automation-rules/:id', () => {
        it('returns 403 for manager (admin only)', async () => {
            const res = await request(app)
                .delete('/api/automation-rules/rule-1')
                .set('Authorization', `Bearer ${managerToken}`);
            expect(res.status).toBe(403);
        });

        it('returns 403 for regular staff', async () => {
            const res = await request(app)
                .delete('/api/automation-rules/rule-1')
                .set('Authorization', `Bearer ${staffToken}`);
            expect(res.status).toBe(403);
        });

        it('returns 404 if rule not found', async () => {
            mockedPrisma.automationRule.findUnique.mockResolvedValueOnce(null);
            const res = await request(app)
                .delete('/api/automation-rules/bad-id')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });

        it('deletes rule successfully', async () => {
            mockedPrisma.automationRule.findUnique.mockResolvedValueOnce(sampleRule as any);
            mockedPrisma.automationRule.delete.mockResolvedValueOnce(sampleRule as any);
            const res = await request(app)
                .delete('/api/automation-rules/rule-1')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Automation rule deleted');
        });
    });
});
