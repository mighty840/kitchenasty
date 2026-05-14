import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/db.js';

const CATEGORIES = ['FOOD', 'INTERIOR', 'GARDEN', 'EVENTS'] as const;

const createSchema = z.object({
  url: z.string().url().max(2048),
  alt: z.string().min(1).max(200),
  category: z.enum(CATEGORIES),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

export async function listPublicGallery(req: Request, res: Response): Promise<void> {
  const category = req.query.category as string | undefined;
  const where: Record<string, unknown> = { isActive: true };
  if (category && (CATEGORIES as readonly string[]).includes(category)) {
    where.category = category;
  }

  const images = await prisma.galleryImage.findMany({
    where,
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  res.json({ success: true, data: images });
}

export async function listAllGallery(_req: Request, res: Response): Promise<void> {
  const images = await prisma.galleryImage.findMany({
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  res.json({ success: true, data: images });
}

export async function createGalleryImage(req: Request, res: Response): Promise<void> {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors });
    return;
  }

  const image = await prisma.galleryImage.create({
    data: {
      url: parsed.data.url,
      alt: parsed.data.alt,
      category: parsed.data.category,
      sortOrder: parsed.data.sortOrder ?? 0,
      isActive: parsed.data.isActive ?? true,
    },
  });

  res.status(201).json({ success: true, data: image });
}

export async function updateGalleryImage(req: Request<{ id: string }>, res: Response): Promise<void> {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors });
    return;
  }

  const existing = await prisma.galleryImage.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Image not found' });
    return;
  }

  const image = await prisma.galleryImage.update({
    where: { id: req.params.id },
    data: parsed.data,
  });

  res.json({ success: true, data: image });
}

export async function deleteGalleryImage(req: Request<{ id: string }>, res: Response): Promise<void> {
  const existing = await prisma.galleryImage.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Image not found' });
    return;
  }

  await prisma.galleryImage.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Image deleted' });
}
