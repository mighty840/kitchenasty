import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/db.js';
import { auditLog } from '../lib/audit.js';

const createCouponSchema = z.object({
  code: z.string().min(1).max(50),
  type: z.enum(['PERCENTAGE', 'FIXED', 'FREE_DELIVERY']),
  value: z.number().min(0),
  minOrder: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).nullable().optional(),
  usageLimit: z.number().int().min(1).nullable().optional(),
  perCustomer: z.number().int().min(1).optional(),
  startsAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

const updateCouponSchema = createCouponSchema.partial();

export async function createCoupon(req: Request, res: Response): Promise<void> {
  const parsed = createCouponSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors });
    return;
  }

  const { startsAt, expiresAt, ...rest } = parsed.data;

  // Check code uniqueness
  const existing = await prisma.coupon.findUnique({ where: { code: rest.code.toUpperCase() } });
  if (existing) {
    res.status(409).json({ success: false, error: 'Coupon code already exists' });
    return;
  }

  const coupon = await prisma.coupon.create({
    data: {
      ...rest,
      code: rest.code.toUpperCase(),
      startsAt: startsAt ? new Date(startsAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  auditLog(req, { action: 'create', entity: 'Coupon', entityId: coupon.id, details: { code: coupon.code } });

  res.status(201).json({ success: true, data: coupon });
}

export async function listCoupons(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.coupon.count(),
  ]);

  res.json({
    success: true,
    data: coupons,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getCoupon(req: Request<{ id: string }>, res: Response): Promise<void> {
  const coupon = await prisma.coupon.findUnique({ where: { id: req.params.id } });
  if (!coupon) {
    res.status(404).json({ success: false, error: 'Coupon not found' });
    return;
  }
  res.json({ success: true, data: coupon });
}

export async function updateCoupon(req: Request<{ id: string }>, res: Response): Promise<void> {
  const parsed = updateCouponSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors });
    return;
  }

  const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Coupon not found' });
    return;
  }

  const { startsAt, expiresAt, code, ...rest } = parsed.data;
  const data: Record<string, unknown> = { ...rest };
  if (code !== undefined) data.code = code.toUpperCase();
  if (startsAt !== undefined) data.startsAt = startsAt ? new Date(startsAt) : null;
  if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null;

  const coupon = await prisma.coupon.update({
    where: { id: req.params.id },
    data,
  });

  auditLog(req, { action: 'update', entity: 'Coupon', entityId: req.params.id, details: data });

  res.json({ success: true, data: coupon });
}

export async function deleteCoupon(req: Request<{ id: string }>, res: Response): Promise<void> {
  const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Coupon not found' });
    return;
  }

  await prisma.coupon.delete({ where: { id: req.params.id } });
  auditLog(req, { action: 'delete', entity: 'Coupon', entityId: req.params.id, details: { code: existing.code } });
  res.json({ success: true, message: 'Coupon deleted' });
}

export async function validateCoupon(req: Request, res: Response): Promise<void> {
  const { code, subtotal } = req.body;

  if (!code) {
    res.status(400).json({ success: false, error: 'Coupon code is required' });
    return;
  }

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon) {
    res.status(404).json({ success: false, error: 'Invalid coupon code' });
    return;
  }

  if (!coupon.isActive) {
    res.status(400).json({ success: false, error: 'Coupon is not active' });
    return;
  }

  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) {
    res.status(400).json({ success: false, error: 'Coupon is not yet valid' });
    return;
  }
  if (coupon.expiresAt && now > coupon.expiresAt) {
    res.status(400).json({ success: false, error: 'Coupon has expired' });
    return;
  }

  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    res.status(400).json({ success: false, error: 'Coupon usage limit reached' });
    return;
  }

  const orderSubtotal = subtotal || 0;
  if (orderSubtotal < coupon.minOrder) {
    res.status(400).json({ success: false, error: `Minimum order amount is $${coupon.minOrder.toFixed(2)}` });
    return;
  }

  // Calculate discount
  let discount = 0;
  if (coupon.type === 'PERCENTAGE') {
    discount = orderSubtotal * (coupon.value / 100);
    if (coupon.maxDiscount !== null) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else if (coupon.type === 'FIXED') {
    discount = coupon.value;
  }
  // FREE_DELIVERY discount is applied at checkout level

  res.json({
    success: true,
    data: {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount: Math.round(discount * 100) / 100,
      freeDelivery: coupon.type === 'FREE_DELIVERY',
    },
  });
}
