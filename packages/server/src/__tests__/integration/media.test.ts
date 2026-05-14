import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { generateToken } from '../../middleware/auth.js';

vi.mock('../../lib/db.js', () => {
  const mockPrisma = {
    mediaAsset: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), delete: vi.fn(), count: vi.fn() },
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

// Silence the fs.unlink call in deleteMedia — file may not exist in tests
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    promises: {
      ...actual.promises,
      unlink: vi.fn().mockResolvedValue(undefined),
    },
  };
});

import prisma from '../../lib/db.js';
const mockedPrisma = vi.mocked(prisma);

const app = createApp();

const staffToken = generateToken({ id: 'user-1', email: 'admin@test.com', type: 'staff', role: 'SUPER_ADMIN' });
const customerToken = generateToken({ id: 'cust-1', email: 'customer@test.com', type: 'customer' });

const sampleAsset = {
  id: 'media-1',
  filename: 'abc.jpg',
  originalName: 'photo.jpg',
  url: '/uploads/abc.jpg',
  mimeType: 'image/jpeg',
  size: 12345,
  uploadedById: 'user-1',
  createdAt: new Date(),
  uploadedBy: { id: 'user-1', name: 'Admin' },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Media API', () => {
  describe('GET /api/media', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/media');
      expect(res.status).toBe(401);
    });

    it('returns 403 for non-staff', async () => {
      const res = await request(app)
        .get('/api/media')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    it('returns paginated list for staff', async () => {
      mockedPrisma.mediaAsset.findMany.mockResolvedValueOnce([sampleAsset] as any);
      mockedPrisma.mediaAsset.count.mockResolvedValueOnce(1);
      const res = await request(app)
        .get('/api/media')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].url).toBe('/uploads/abc.jpg');
      expect(res.body.pagination).toMatchObject({ page: 1, total: 1, totalPages: 1 });
    });
  });

  describe('POST /api/media/upload', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app)
        .post('/api/media/upload')
        .attach('file', Buffer.from('fake-png-bytes'), { filename: 'test.png', contentType: 'image/png' });
      expect(res.status).toBe(401);
    });

    it('returns 403 for non-staff', async () => {
      const res = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${customerToken}`)
        .attach('file', Buffer.from('fake-png-bytes'), { filename: 'test.png', contentType: 'image/png' });
      expect(res.status).toBe(403);
    });

    it('returns 400 when no file is attached', async () => {
      const res = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('DELETE /api/media/:id', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).delete('/api/media/media-1');
      expect(res.status).toBe(401);
    });

    it('returns 403 for non-staff', async () => {
      const res = await request(app)
        .delete('/api/media/media-1')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });

    it('returns 404 when not found', async () => {
      mockedPrisma.mediaAsset.findUnique.mockResolvedValueOnce(null);
      const res = await request(app)
        .delete('/api/media/bad-id')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(404);
    });

    it('deletes asset successfully', async () => {
      mockedPrisma.mediaAsset.findUnique.mockResolvedValueOnce(sampleAsset as any);
      mockedPrisma.mediaAsset.delete.mockResolvedValueOnce(sampleAsset as any);
      const res = await request(app)
        .delete('/api/media/media-1')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(200);
      expect(mockedPrisma.mediaAsset.delete).toHaveBeenCalledWith({ where: { id: 'media-1' } });
    });
  });
});
