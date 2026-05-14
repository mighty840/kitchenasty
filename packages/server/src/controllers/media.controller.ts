import { Request, Response } from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import prisma from '../lib/db.js';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

export async function uploadMedia(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file provided' });
    return;
  }

  const userId = (req as any).user?.id ?? null;

  const asset = await prisma.mediaAsset.create({
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedById: userId,
    },
  });

  res.status(201).json({ success: true, data: asset });
}

export async function listMedia(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.mediaAsset.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { uploadedBy: { select: { id: true, name: true } } },
    }),
    prisma.mediaAsset.count(),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function deleteMedia(req: Request<{ id: string }>, res: Response): Promise<void> {
  const asset = await prisma.mediaAsset.findUnique({ where: { id: req.params.id } });
  if (!asset) {
    res.status(404).json({ success: false, error: 'Media not found' });
    return;
  }

  const filePath = path.join(UPLOADS_DIR, asset.filename);
  try {
    await fs.unlink(filePath);
  } catch {
    // file may already be gone — keep going to remove the DB row
  }

  await prisma.mediaAsset.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Media deleted' });
}
