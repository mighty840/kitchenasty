import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { generateToken } from '../../middleware/auth.js';

// Mock the Prisma client
vi.mock('../../lib/db.js', () => {
  const mockPrisma = {
    location: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    order: { count: vi.fn() },
    deliveryZone: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    user: { findUnique: vi.fn() },
    customer: { findUnique: vi.fn() },
    category: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    menuItem: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    allergen: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
    mealtime: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    orderItem: { count: vi.fn() },
  };
  return { default: mockPrisma, prisma: mockPrisma };
});

import prisma from '../../lib/db.js';
const mockedPrisma = vi.mocked(prisma);

const app = createApp();

const adminToken = generateToken({ id: '1', email: 'admin@test.com', type: 'staff', role: 'SUPER_ADMIN' });
const managerToken = generateToken({ id: '2', email: 'mgr@test.com', type: 'staff', role: 'MANAGER' });
const staffToken = generateToken({ id: '3', email: 'staff@test.com', type: 'staff', role: 'STAFF' });

const sampleCategory = {
  id: 'cat-1',
  name: 'Appetizers',
  slug: 'appetizers',
  description: 'Starters',
  image: null,
  sortOrder: 0,
  isActive: true,
  parentId: null,
  locationId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const sampleMenuItem = {
  id: 'item-1',
  name: 'Caesar Salad',
  slug: 'caesar-salad',
  description: 'Classic caesar',
  price: 12.99,
  taxRate: 8,
  surchargeEnabled: false,
  surchargeAmount: 0,
  image: null,
  isActive: true,
  sortOrder: 0,
  trackStock: false,
  stockQty: 0,
  orderType: null,
  categoryId: 'cat-1',
  locationId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Menu API - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================
  // CATEGORIES
  // ============================================================
  describe('GET /api/menu/categories', () => {
    it('returns list of categories (no auth required)', async () => {
      mockedPrisma.category.findMany.mockResolvedValue([{ ...sampleCategory, children: [], _count: { menuItems: 3 } }] as any);

      const res = await request(app).get('/api/menu/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Appetizers');
    });
  });

  describe('GET /api/menu/categories/:id', () => {
    it('returns category with children and items', async () => {
      mockedPrisma.category.findUnique.mockResolvedValue({
        ...sampleCategory,
        children: [],
        parent: null,
        menuItems: [],
      } as any);

      const res = await request(app).get('/api/menu/categories/cat-1');

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Appetizers');
    });

    it('returns 404 for unknown id', async () => {
      mockedPrisma.category.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/menu/categories/unknown');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/menu/categories', () => {
    const newCategory = { name: 'Desserts', slug: 'desserts' };

    it('requires authentication', async () => {
      const res = await request(app).post('/api/menu/categories').send(newCategory);
      expect(res.status).toBe(401);
    });

    it('requires MANAGER+ role', async () => {
      const res = await request(app)
        .post('/api/menu/categories')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(newCategory);
      expect(res.status).toBe(403);
    });

    it('creates category with MANAGER token', async () => {
      mockedPrisma.category.findUnique.mockResolvedValue(null);
      mockedPrisma.category.create.mockResolvedValue({ id: 'cat-2', ...newCategory, parent: null } as any);

      const res = await request(app)
        .post('/api/menu/categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(newCategory);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('returns 409 for duplicate slug', async () => {
      mockedPrisma.category.findUnique.mockResolvedValue(sampleCategory as any);

      const res = await request(app)
        .post('/api/menu/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newCategory);

      expect(res.status).toBe(409);
    });

    it('validates slug format', async () => {
      const res = await request(app)
        .post('/api/menu/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test', slug: 'INVALID SLUG!' });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/menu/categories/:id', () => {
    it('updates category name', async () => {
      mockedPrisma.category.findUnique.mockResolvedValue(sampleCategory as any);
      mockedPrisma.category.update.mockResolvedValue({ ...sampleCategory, name: 'Starters', parent: null } as any);

      const res = await request(app)
        .patch('/api/menu/categories/cat-1')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Starters' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Starters');
    });

    it('returns 404 for unknown id', async () => {
      mockedPrisma.category.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/menu/categories/unknown')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test' });

      expect(res.status).toBe(404);
    });

    it('rejects self-referencing parent', async () => {
      mockedPrisma.category.findUnique.mockResolvedValue(sampleCategory as any);

      const res = await request(app)
        .patch('/api/menu/categories/cat-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ parentId: 'cat-1' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/menu/categories/:id', () => {
    it('requires SUPER_ADMIN role', async () => {
      const res = await request(app)
        .delete('/api/menu/categories/cat-1')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(403);
    });

    it('returns 409 if category has items', async () => {
      mockedPrisma.category.findUnique.mockResolvedValue(sampleCategory as any);
      mockedPrisma.menuItem.count.mockResolvedValue(5);

      const res = await request(app)
        .delete('/api/menu/categories/cat-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(409);
    });

    it('deletes empty category', async () => {
      mockedPrisma.category.findUnique.mockResolvedValue(sampleCategory as any);
      mockedPrisma.menuItem.count.mockResolvedValue(0);
      mockedPrisma.category.count.mockResolvedValue(0);
      mockedPrisma.category.delete.mockResolvedValue(sampleCategory as any);

      const res = await request(app)
        .delete('/api/menu/categories/cat-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Category deleted');
    });
  });

  // ============================================================
  // MENU ITEMS
  // ============================================================
  describe('GET /api/menu/items', () => {
    it('returns paginated list of items', async () => {
      mockedPrisma.menuItem.findMany.mockResolvedValue([{
        ...sampleMenuItem,
        category: { id: 'cat-1', name: 'Appetizers' },
        _count: { options: 1, allergens: 2, mealtimes: 1 },
      }] as any);
      mockedPrisma.menuItem.count.mockResolvedValue(1);

      const res = await request(app).get('/api/menu/items');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Caesar Salad');
      expect(res.body.pagination.total).toBe(1);
    });
  });

  describe('GET /api/menu/items/:id', () => {
    it('returns item with options, allergens, mealtimes', async () => {
      mockedPrisma.menuItem.findUnique.mockResolvedValue({
        ...sampleMenuItem,
        category: { id: 'cat-1', name: 'Appetizers' },
        options: [],
        allergens: [],
        mealtimes: [],
      } as any);

      const res = await request(app).get('/api/menu/items/item-1');

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Caesar Salad');
      expect(res.body.data.price).toBe(12.99);
      expect(res.body.data.taxRate).toBe(8);
      expect(res.body.data.surchargeEnabled).toBe(false);
      expect(res.body.data.surchargeAmount).toBe(0);
    });

    it('returns 404 for unknown id', async () => {
      mockedPrisma.menuItem.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/menu/items/unknown');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/menu/items', () => {
    const newItem = {
      name: 'Garlic Bread',
      slug: 'garlic-bread',
      price: 6.99,
      categoryId: 'cat-1',
    };

    it('requires authentication', async () => {
      const res = await request(app).post('/api/menu/items').send(newItem);
      expect(res.status).toBe(401);
    });

    it('creates item with MANAGER token', async () => {
      mockedPrisma.menuItem.findUnique.mockResolvedValue(null);
      mockedPrisma.category.findUnique.mockResolvedValue(sampleCategory as any);
      mockedPrisma.menuItem.create.mockResolvedValue({
        id: 'item-2',
        ...newItem,
        category: { id: 'cat-1', name: 'Appetizers' },
        options: [],
        allergens: [],
        mealtimes: [],
      } as any);

      const res = await request(app)
        .post('/api/menu/items')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(newItem);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(mockedPrisma.menuItem.create.mock.calls[0][0].data).toEqual(expect.objectContaining({
        taxRate: 8, surchargeEnabled: false, surchargeAmount: 0,
      }));
    });

    it('returns 409 for duplicate slug', async () => {
      mockedPrisma.menuItem.findUnique.mockResolvedValue(sampleMenuItem as any);

      const res = await request(app)
        .post('/api/menu/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newItem);

      expect(res.status).toBe(409);
    });

    it('returns 400 for invalid category', async () => {
      mockedPrisma.menuItem.findUnique.mockResolvedValue(null);
      mockedPrisma.category.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/menu/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newItem);

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/menu/items/:id', () => {
    it('updates an individual tax rate and surcharge', async () => {
      const pricing = { taxRate: 19, surchargeEnabled: true, surchargeAmount: 0.5 };
      mockedPrisma.menuItem.findUnique.mockResolvedValue(sampleMenuItem as any);
      mockedPrisma.menuItem.update.mockResolvedValue({ ...sampleMenuItem, ...pricing } as any);
      const res = await request(app).patch('/api/menu/items/item-1')
        .set('Authorization', `Bearer ${managerToken}`).send(pricing);
      expect(res.status).toBe(200);
      expect(mockedPrisma.menuItem.update.mock.calls[0][0].data).toEqual(expect.objectContaining(pricing));
    });

    it.each([
      { taxRate: -1 }, { taxRate: 101 }, { taxRate: '7' },
      { surchargeAmount: -0.01 }, { surchargeEnabled: 'true' },
    ])('rejects invalid pricing %j', async (pricing) => {
      const res = await request(app).patch('/api/menu/items/item-1')
        .set('Authorization', `Bearer ${managerToken}`).send(pricing);
      expect(res.status).toBe(400);
      expect(mockedPrisma.menuItem.update).not.toHaveBeenCalled();
    });

    it('updates item price', async () => {
      mockedPrisma.menuItem.findUnique.mockResolvedValue(sampleMenuItem as any);
      mockedPrisma.menuItem.update.mockResolvedValue({
        ...sampleMenuItem,
        price: 14.99,
        category: { id: 'cat-1', name: 'Appetizers' },
        options: [],
        allergens: [],
        mealtimes: [],
      } as any);

      const res = await request(app)
        .patch('/api/menu/items/item-1')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ price: 14.99 });

      expect(res.status).toBe(200);
      expect(res.body.data.price).toBe(14.99);
      const data = mockedPrisma.menuItem.update.mock.calls[0][0].data;
      expect(data).not.toHaveProperty('taxRate');
      expect(data).not.toHaveProperty('surchargeEnabled');
      expect(data).not.toHaveProperty('surchargeAmount');
    });

    it('returns 404 for unknown id', async () => {
      mockedPrisma.menuItem.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/menu/items/unknown')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/menu/items/:id', () => {
    it('requires SUPER_ADMIN role', async () => {
      const res = await request(app)
        .delete('/api/menu/items/item-1')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(403);
    });

    it('returns 409 if item has orders', async () => {
      mockedPrisma.menuItem.findUnique.mockResolvedValue(sampleMenuItem as any);
      mockedPrisma.orderItem.count.mockResolvedValue(10);

      const res = await request(app)
        .delete('/api/menu/items/item-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(409);
    });

    it('deletes item with no orders', async () => {
      mockedPrisma.menuItem.findUnique.mockResolvedValue(sampleMenuItem as any);
      mockedPrisma.orderItem.count.mockResolvedValue(0);
      mockedPrisma.menuItem.delete.mockResolvedValue(sampleMenuItem as any);

      const res = await request(app)
        .delete('/api/menu/items/item-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Menu item deleted');
    });
  });

  // ============================================================
  // ALLERGENS
  // ============================================================
  describe('GET /api/menu/allergens', () => {
    it('returns list of allergens', async () => {
      mockedPrisma.allergen.findMany.mockResolvedValue([
        { id: 'a1', name: 'Gluten', _count: { menuItems: 5 } },
        { id: 'a2', name: 'Dairy', _count: { menuItems: 3 } },
      ] as any);

      const res = await request(app).get('/api/menu/allergens');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('POST /api/menu/allergens', () => {
    it('creates an allergen', async () => {
      mockedPrisma.allergen.findUnique.mockResolvedValue(null);
      mockedPrisma.allergen.create.mockResolvedValue({ id: 'a3', name: 'Nuts' } as any);

      const res = await request(app)
        .post('/api/menu/allergens')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Nuts' });

      expect(res.status).toBe(201);
    });

    it('returns 409 for duplicate name', async () => {
      mockedPrisma.allergen.findUnique.mockResolvedValue({ id: 'a1', name: 'Gluten' } as any);

      const res = await request(app)
        .post('/api/menu/allergens')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Gluten' });

      expect(res.status).toBe(409);
    });
  });

  // ============================================================
  // MEALTIMES
  // ============================================================
  describe('GET /api/menu/mealtimes', () => {
    it('returns list of mealtimes', async () => {
      mockedPrisma.mealtime.findMany.mockResolvedValue([
        { id: 'm1', name: 'Breakfast', startTime: '06:00', endTime: '11:00', days: [1, 2, 3, 4, 5], isActive: true, _count: { menuItems: 8 } },
      ] as any);

      const res = await request(app).get('/api/menu/mealtimes');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Breakfast');
    });
  });

  describe('POST /api/menu/mealtimes', () => {
    it('creates a mealtime', async () => {
      mockedPrisma.mealtime.create.mockResolvedValue({
        id: 'm2',
        name: 'Lunch',
        startTime: '11:00',
        endTime: '15:00',
        days: [0, 1, 2, 3, 4, 5, 6],
        isActive: true,
      } as any);

      const res = await request(app)
        .post('/api/menu/mealtimes')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Lunch', startTime: '11:00', endTime: '15:00', days: [0, 1, 2, 3, 4, 5, 6] });

      expect(res.status).toBe(201);
    });

    it('validates time format', async () => {
      const res = await request(app)
        .post('/api/menu/mealtimes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Bad', startTime: 'invalid', endTime: '15:00', days: [1] });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/menu/mealtimes/:id', () => {
    it('requires SUPER_ADMIN', async () => {
      const res = await request(app)
        .delete('/api/menu/mealtimes/m1')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(403);
    });

    it('deletes a mealtime', async () => {
      mockedPrisma.mealtime.findUnique.mockResolvedValue({ id: 'm1' } as any);
      mockedPrisma.mealtime.delete.mockResolvedValue({} as any);

      const res = await request(app)
        .delete('/api/menu/mealtimes/m1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });
});
