import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/db.js';
import { auditLog } from '../lib/audit.js';

const createCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().optional(),
  image: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  parentId: z.string().optional(),
  locationId: z.string().optional(),
});

const updateCategorySchema = createCategorySchema.partial().omit({ slug: true });

export async function listCategories(req: Request, res: Response): Promise<void> {
  const locationId = req.query.locationId as string | undefined;

  const where: Record<string, unknown> = {};
  if (locationId) where.locationId = locationId;

  const categories = await prisma.category.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      children: {
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      },
      _count: { select: { menuItems: true } },
    },
  });

  res.json({ success: true, data: categories });
}

export async function getCategory(req: Request<{ id: string }>, res: Response): Promise<void> {
  const { id } = req.params;

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      children: { orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
      parent: true,
      menuItems: {
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: { _count: { select: { options: true } } },
      },
    },
  });

  if (!category) {
    res.status(404).json({ success: false, error: 'Category not found' });
    return;
  }

  res.json({ success: true, data: category });
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors });
    return;
  }

  const existing = await prisma.category.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    res.status(409).json({ success: false, error: 'A category with this slug already exists' });
    return;
  }

  if (parsed.data.parentId) {
    const parent = await prisma.category.findUnique({ where: { id: parsed.data.parentId } });
    if (!parent) {
      res.status(400).json({ success: false, error: 'Parent category not found' });
      return;
    }
  }

  const category = await prisma.category.create({
    data: parsed.data,
    include: { parent: true },
  });

  auditLog(req, { action: 'create', entity: 'Category', entityId: category.id, details: { name: category.name } });

  res.status(201).json({ success: true, data: category });
}

export async function updateCategory(req: Request<{ id: string }>, res: Response): Promise<void> {
  const { id } = req.params;
  const parsed = updateCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors });
    return;
  }

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Category not found' });
    return;
  }

  if (parsed.data.parentId) {
    if (parsed.data.parentId === id) {
      res.status(400).json({ success: false, error: 'Category cannot be its own parent' });
      return;
    }
    const parent = await prisma.category.findUnique({ where: { id: parsed.data.parentId } });
    if (!parent) {
      res.status(400).json({ success: false, error: 'Parent category not found' });
      return;
    }
  }

  const category = await prisma.category.update({
    where: { id },
    data: parsed.data,
    include: { parent: true },
  });

  auditLog(req, { action: 'update', entity: 'Category', entityId: id, details: parsed.data });

  res.json({ success: true, data: category });
}

export async function deleteCategory(req: Request<{ id: string }>, res: Response): Promise<void> {
  const { id } = req.params;

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Category not found' });
    return;
  }

  const itemCount = await prisma.menuItem.count({ where: { categoryId: id } });
  if (itemCount > 0) {
    res.status(409).json({
      success: false,
      error: 'Cannot delete category with menu items. Move or delete items first.',
    });
    return;
  }

  const childCount = await prisma.category.count({ where: { parentId: id } });
  if (childCount > 0) {
    res.status(409).json({
      success: false,
      error: 'Cannot delete category with subcategories. Move or delete subcategories first.',
    });
    return;
  }

  await prisma.category.delete({ where: { id } });
  auditLog(req, { action: 'delete', entity: 'Category', entityId: id, details: { name: existing.name } });
  res.json({ success: true, message: 'Category deleted' });
}
