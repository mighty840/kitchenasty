import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { generateToken } from '../../middleware/auth.js';

vi.mock('../../lib/db.js', () => {
  const mockPrisma = {
    galleryImage: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    user: { findUnique: vi.fn() },
    customer: { findUnique: vi.fn() },
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

const sampleImage = {
  id: 'img-1',
  url: 'https://example.com/photo.jpg',
  alt: 'Test photo',
  category: 'FOOD',
  sortOrder: 0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Gallery API', () => {
  describe('GET /api/gallery (public)', () => {
    it('returns active images without auth', async () => {
      mockedPrisma.galleryImage.findMany.mockResolvedValueOnce([sampleImage] as any);
      const res = await request(app).get('/api/gallery');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].category).toBe('FOOD');
      // Verify only active images are returned
      const where = mockedPrisma.galleryImage.findMany.mock.calls[0][0]?.where;
      expect(where).toMatchObject({ isActive: true });
    });

    it('filters by category', async () => {
      mockedPrisma.galleryImage.findMany.mockResolvedValueOnce([sampleImage] as any);
      const res = await request(app).get('/api/gallery?category=FOOD');
      expect(res.status).toBe(200);
      const where = mockedPrisma.galleryImage.findMany.mock.calls[0][0]?.where;
      expect(where).toMatchObject({ isActive: true, category: 'FOOD' });
    });

    it('ignores invalid category filter', async () => {
      mockedPrisma.galleryImage.findMany.mockResolvedValueOnce([] as any);
      const res = await request(app).get('/api/gallery?category=BOGUS');
      expect(res.status).toBe(200);
      const where = mockedPrisma.galleryImage.findMany.mock.calls[0][0]?.where;
      expect(where).toMatchObject({ isActive: true });
      expect((where as any).category).toBeUndefined();
    });
  });

  describe('GET /api/gallery/admin', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/gallery/admin');
      expect(res.status).toBe(401);
    });

    it('returns 403 for non-staff', async () => {
      const res = await request(app)
        .get('/api/gallery/admin')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    it('returns full list (including hidden) for staff', async () => {
      mockedPrisma.galleryImage.findMany.mockResolvedValueOnce([
        sampleImage,
        { ...sampleImage, id: 'img-2', isActive: false },
      ] as any);
      const res = await request(app)
        .get('/api/gallery/admin')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      // No isActive filter on admin endpoint
      const where = mockedPrisma.galleryImage.findMany.mock.calls[0][0]?.where;
      expect(where).toBeUndefined();
    });
  });

  describe('POST /api/gallery', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).post('/api/gallery').send({
        url: 'https://example.com/x.jpg', alt: 'x', category: 'FOOD',
      });
      expect(res.status).toBe(401);
    });

    it('returns 403 for non-staff', async () => {
      const res = await request(app)
        .post('/api/gallery')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ url: 'https://example.com/x.jpg', alt: 'x', category: 'FOOD' });
      expect(res.status).toBe(403);
    });

    it('returns 400 for invalid url', async () => {
      const res = await request(app)
        .post('/api/gallery')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ url: 'not-a-url', alt: 'x', category: 'FOOD' });
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid category', async () => {
      const res = await request(app)
        .post('/api/gallery')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ url: 'https://example.com/x.jpg', alt: 'x', category: 'BOGUS' });
      expect(res.status).toBe(400);
    });

    it('creates image successfully', async () => {
      mockedPrisma.galleryImage.create.mockResolvedValueOnce(sampleImage as any);
      const res = await request(app)
        .post('/api/gallery')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ url: 'https://example.com/photo.jpg', alt: 'Test photo', category: 'FOOD' });
      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe('img-1');
    });
  });

  describe('PATCH /api/gallery/:id', () => {
    it('returns 403 for non-staff', async () => {
      const res = await request(app)
        .patch('/api/gallery/img-1')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ alt: 'updated' });
      expect(res.status).toBe(403);
    });

    it('returns 404 when not found', async () => {
      mockedPrisma.galleryImage.findUnique.mockResolvedValueOnce(null);
      const res = await request(app)
        .patch('/api/gallery/bad-id')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ alt: 'updated' });
      expect(res.status).toBe(404);
    });

    it('updates fields successfully', async () => {
      mockedPrisma.galleryImage.findUnique.mockResolvedValueOnce(sampleImage as any);
      mockedPrisma.galleryImage.update.mockResolvedValueOnce({ ...sampleImage, alt: 'updated' } as any);
      const res = await request(app)
        .patch('/api/gallery/img-1')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ alt: 'updated' });
      expect(res.status).toBe(200);
      expect(res.body.data.alt).toBe('updated');
    });
  });

  describe('DELETE /api/gallery/:id', () => {
    it('returns 403 for non-staff', async () => {
      const res = await request(app)
        .delete('/api/gallery/img-1')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    it('returns 404 when not found', async () => {
      mockedPrisma.galleryImage.findUnique.mockResolvedValueOnce(null);
      const res = await request(app)
        .delete('/api/gallery/bad-id')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(404);
    });

    it('deletes image', async () => {
      mockedPrisma.galleryImage.findUnique.mockResolvedValueOnce(sampleImage as any);
      mockedPrisma.galleryImage.delete.mockResolvedValueOnce(sampleImage as any);
      const res = await request(app)
        .delete('/api/gallery/img-1')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(200);
    });
  });
});
