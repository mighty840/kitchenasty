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
        customer: { findUnique: vi.fn(), update: vi.fn() },
        category: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
        automationRule: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
        loyaltyTransaction: { findMany: vi.fn(), create: vi.fn() },
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

const sampleCustomer = {
    id: 'cust-1',
    email: 'customer@test.com',
    name: 'John Doe',
    loyaltyPoints: 500,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const sampleTransaction = {
    id: 'txn-1',
    customerId: 'cust-1',
    type: 'EARN',
    points: 50,
    description: 'Order #KA-ABC-123',
    orderId: 'order-1',
    order: { orderNumber: 'KA-ABC-123' },
    createdAt: new Date(),
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Loyalty API', () => {
    describe('GET /api/loyalty/balance', () => {
        it('returns 401 without authentication', async () => {
            const res = await request(app).get('/api/loyalty/balance');
            expect(res.status).toBe(401);
        });

        it('returns 404 for non-existent customer', async () => {
            mockedPrisma.customer.findUnique.mockResolvedValueOnce(null);
            const res = await request(app)
                .get('/api/loyalty/balance')
                .set('Authorization', `Bearer ${customerToken}`);
            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });

        it('returns balance and transactions for customer', async () => {
            mockedPrisma.customer.findUnique.mockResolvedValueOnce({ loyaltyPoints: 500 } as any);
            mockedPrisma.loyaltyTransaction.findMany.mockResolvedValueOnce([sampleTransaction] as any);
            const res = await request(app)
                .get('/api/loyalty/balance')
                .set('Authorization', `Bearer ${customerToken}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.points).toBe(500);
            expect(res.body.data.dollarValue).toBe(5);
            expect(res.body.data.transactions).toHaveLength(1);
        });

        it('returns zero balance correctly', async () => {
            mockedPrisma.customer.findUnique.mockResolvedValueOnce({ loyaltyPoints: 0 } as any);
            mockedPrisma.loyaltyTransaction.findMany.mockResolvedValueOnce([]);
            const res = await request(app)
                .get('/api/loyalty/balance')
                .set('Authorization', `Bearer ${customerToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.points).toBe(0);
            expect(res.body.data.dollarValue).toBe(0);
            expect(res.body.data.transactions).toHaveLength(0);
        });
    });

    describe('POST /api/loyalty/redeem', () => {
        it('returns 401 without authentication', async () => {
            const res = await request(app)
                .post('/api/loyalty/redeem')
                .send({ points: 100 });
            expect(res.status).toBe(401);
        });

        it('returns 400 for invalid points (non-integer)', async () => {
            const res = await request(app)
                .post('/api/loyalty/redeem')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ points: 10.5 });
            expect(res.status).toBe(400);
        });

        it('returns 400 for zero points', async () => {
            const res = await request(app)
                .post('/api/loyalty/redeem')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ points: 0 });
            expect(res.status).toBe(400);
        });

        it('returns 400 for negative points', async () => {
            const res = await request(app)
                .post('/api/loyalty/redeem')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ points: -10 });
            expect(res.status).toBe(400);
        });

        it('returns 400 for missing points field', async () => {
            const res = await request(app)
                .post('/api/loyalty/redeem')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({});
            expect(res.status).toBe(400);
        });

        it('returns 404 for non-existent customer', async () => {
            mockedPrisma.customer.findUnique.mockResolvedValueOnce(null);
            const res = await request(app)
                .post('/api/loyalty/redeem')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ points: 100 });
            expect(res.status).toBe(404);
        });

        it('returns 400 for insufficient points', async () => {
            mockedPrisma.customer.findUnique.mockResolvedValueOnce(sampleCustomer as any);
            const res = await request(app)
                .post('/api/loyalty/redeem')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ points: 1000 });
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Insufficient');
        });

        it('redeems points successfully', async () => {
            mockedPrisma.customer.findUnique.mockResolvedValueOnce(sampleCustomer as any);
            mockedPrisma.customer.update.mockResolvedValueOnce({ ...sampleCustomer, loyaltyPoints: 400 } as any);
            const redeemTxn = { id: 'txn-2', customerId: 'cust-1', type: 'REDEEM', points: -100, description: 'Points redeemed', createdAt: new Date() };
            mockedPrisma.loyaltyTransaction.create.mockResolvedValueOnce(redeemTxn as any);
            const res = await request(app)
                .post('/api/loyalty/redeem')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ points: 100 });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.redeemed).toBe(100);
            expect(res.body.data.remaining).toBe(400);
        });

        it('redeems all points (exact balance)', async () => {
            mockedPrisma.customer.findUnique.mockResolvedValueOnce(sampleCustomer as any);
            mockedPrisma.customer.update.mockResolvedValueOnce({ ...sampleCustomer, loyaltyPoints: 0 } as any);
            mockedPrisma.loyaltyTransaction.create.mockResolvedValueOnce({ id: 'txn-3', type: 'REDEEM', points: -500 } as any);
            const res = await request(app)
                .post('/api/loyalty/redeem')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ points: 500 });
            expect(res.status).toBe(200);
            expect(res.body.data.redeemed).toBe(500);
            expect(res.body.data.remaining).toBe(0);
        });
    });

    describe('POST /api/loyalty/customers/:id/adjust', () => {
        it('returns 401 without authentication', async () => {
            const res = await request(app)
                .post('/api/loyalty/customers/cust-1/adjust')
                .send({ points: 100 });
            expect(res.status).toBe(401);
        });

        it('returns 403 for customers', async () => {
            const res = await request(app)
                .post('/api/loyalty/customers/cust-1/adjust')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ points: 100 });
            expect(res.status).toBe(403);
        });

        it('returns 403 for regular staff', async () => {
            const res = await request(app)
                .post('/api/loyalty/customers/cust-1/adjust')
                .set('Authorization', `Bearer ${staffToken}`)
                .send({ points: 100 });
            expect(res.status).toBe(403);
        });

        it('returns 400 for invalid points (non-integer)', async () => {
            const res = await request(app)
                .post('/api/loyalty/customers/cust-1/adjust')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ points: 10.5 });
            expect(res.status).toBe(400);
        });

        it('returns 400 for missing points field', async () => {
            const res = await request(app)
                .post('/api/loyalty/customers/cust-1/adjust')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});
            expect(res.status).toBe(400);
        });

        it('returns 404 for non-existent customer', async () => {
            mockedPrisma.customer.findUnique.mockResolvedValueOnce(null);
            const res = await request(app)
                .post('/api/loyalty/customers/bad-id/adjust')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ points: 100 });
            expect(res.status).toBe(404);
            expect(res.body.error).toContain('Customer not found');
        });

        it('returns 400 when adjustment would result in negative balance', async () => {
            mockedPrisma.customer.findUnique.mockResolvedValueOnce(sampleCustomer as any);
            const res = await request(app)
                .post('/api/loyalty/customers/cust-1/adjust')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ points: -600 });
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('negative balance');
        });

        it('adds points successfully', async () => {
            mockedPrisma.customer.findUnique.mockResolvedValueOnce(sampleCustomer as any);
            mockedPrisma.customer.update.mockResolvedValueOnce({ ...sampleCustomer, loyaltyPoints: 600 } as any);
            const adjustTxn = { id: 'txn-4', customerId: 'cust-1', type: 'ADJUST', points: 100, description: 'Manual adjustment', createdAt: new Date() };
            mockedPrisma.loyaltyTransaction.create.mockResolvedValueOnce(adjustTxn as any);
            const res = await request(app)
                .post('/api/loyalty/customers/cust-1/adjust')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ points: 100 });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.points).toBe(600);
        });

        it('subtracts points successfully', async () => {
            mockedPrisma.customer.findUnique.mockResolvedValueOnce(sampleCustomer as any);
            mockedPrisma.customer.update.mockResolvedValueOnce({ ...sampleCustomer, loyaltyPoints: 300 } as any);
            mockedPrisma.loyaltyTransaction.create.mockResolvedValueOnce({ id: 'txn-5', type: 'ADJUST', points: -200 } as any);
            const res = await request(app)
                .post('/api/loyalty/customers/cust-1/adjust')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ points: -200 });
            expect(res.status).toBe(200);
            expect(res.body.data.points).toBe(300);
        });

        it('allows manager to adjust points', async () => {
            mockedPrisma.customer.findUnique.mockResolvedValueOnce(sampleCustomer as any);
            mockedPrisma.customer.update.mockResolvedValueOnce({ ...sampleCustomer, loyaltyPoints: 550 } as any);
            mockedPrisma.loyaltyTransaction.create.mockResolvedValueOnce({ id: 'txn-6', type: 'ADJUST', points: 50 } as any);
            const res = await request(app)
                .post('/api/loyalty/customers/cust-1/adjust')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ points: 50 });
            expect(res.status).toBe(200);
            expect(res.body.data.points).toBe(550);
        });

        it('uses custom description when provided', async () => {
            mockedPrisma.customer.findUnique.mockResolvedValueOnce(sampleCustomer as any);
            mockedPrisma.customer.update.mockResolvedValueOnce({ ...sampleCustomer, loyaltyPoints: 700 } as any);
            const adjustTxn = { id: 'txn-7', type: 'ADJUST', points: 200, description: 'Birthday bonus' };
            mockedPrisma.loyaltyTransaction.create.mockResolvedValueOnce(adjustTxn as any);
            const res = await request(app)
                .post('/api/loyalty/customers/cust-1/adjust')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ points: 200, description: 'Birthday bonus' });
            expect(res.status).toBe(200);
        });
    });
});
