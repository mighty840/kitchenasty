import { Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../lib/db.js';
import { generateToken } from '../middleware/auth.js';
import { sendEmail, staffInvitationEmail } from '../lib/email.js';
import { auditLog } from '../lib/audit.js';

// ============================================================
// LIST STAFF
// ============================================================

export async function listStaff(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const role = req.query.role as string | undefined;
  const search = req.query.search as string | undefined;
  const isActive = req.query.isActive as string | undefined;

  const where: any = {};
  if (role && ['SUPER_ADMIN', 'MANAGER', 'STAFF'].includes(role)) {
    where.role = role;
  }
  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [staff, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        locationId: true,
        location: { select: { id: true, name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    success: true,
    data: staff,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// ============================================================
// GET STAFF
// ============================================================

export async function getStaff(req: Request<{ id: string }>, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      isActive: true,
      locationId: true,
      location: { select: { id: true, name: true } },
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    res.status(404).json({ success: false, error: 'Staff member not found' });
    return;
  }

  res.json({ success: true, data: user });
}

// ============================================================
// UPDATE STAFF
// ============================================================

const updateStaffSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['SUPER_ADMIN', 'MANAGER', 'STAFF']).optional(),
  phone: z.string().nullable().optional(),
  locationId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function updateStaff(req: Request<{ id: string }>, res: Response): Promise<void> {
  const parsed = updateStaffSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors });
    return;
  }

  const targetId = req.params.id;

  // Prevent self-demotion
  if (req.user!.id === targetId && parsed.data.role && parsed.data.role !== req.user!.role) {
    res.status(400).json({ success: false, error: 'Cannot change your own role' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { id: targetId } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Staff member not found' });
    return;
  }

  const user = await prisma.user.update({
    where: { id: targetId },
    data: parsed.data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      isActive: true,
      locationId: true,
      location: { select: { id: true, name: true } },
    },
  });

  auditLog(req, { action: 'update', entity: 'Staff', entityId: targetId, details: parsed.data });

  res.json({ success: true, data: user });
}

// ============================================================
// DEACTIVATE STAFF
// ============================================================

export async function deactivateStaff(req: Request<{ id: string }>, res: Response): Promise<void> {
  const targetId = req.params.id;

  // Prevent self-deactivation
  if (req.user!.id === targetId) {
    res.status(400).json({ success: false, error: 'Cannot deactivate your own account' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { id: targetId } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Staff member not found' });
    return;
  }

  await prisma.user.update({
    where: { id: targetId },
    data: { isActive: false },
  });

  auditLog(req, { action: 'update', entity: 'Staff', entityId: targetId, details: { isActive: false } });

  res.json({ success: true, data: { message: 'Staff member deactivated' } });
}

// ============================================================
// INVITE STAFF
// ============================================================

const inviteStaffSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'MANAGER', 'STAFF']).optional(),
});

export async function inviteStaff(req: Request, res: Response): Promise<void> {
  const parsed = inviteStaffSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors });
    return;
  }

  const { email, role } = parsed.data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    res.status(409).json({ success: false, error: 'A user with this email already exists' });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invite = await prisma.inviteToken.create({
    data: {
      token,
      email,
      role: role || 'STAFF',
      invitedBy: req.user!.id,
      expiresAt,
    },
  });

  // Send invitation email
  const adminUrl = process.env.ADMIN_URL || 'http://localhost:5173';
  const inviteLink = `${adminUrl}/accept-invite?token=${token}`;
  const emailContent = staffInvitationEmail({ email, role: role || 'STAFF', inviteLink });
  await sendEmail({ to: email, ...emailContent });

  auditLog(req, { action: 'create', entity: 'Staff', entityId: invite.id, details: { email, role: role || 'STAFF' } });

  res.status(201).json({
    success: true,
    data: {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
    },
  });
}

// ============================================================
// VALIDATE INVITE TOKEN
// ============================================================

export async function validateInviteToken(req: Request<{ token: string }>, res: Response): Promise<void> {
  const invite = await prisma.inviteToken.findUnique({
    where: { token: req.params.token },
  });

  if (!invite) {
    res.status(404).json({ success: false, error: 'Invalid invite token' });
    return;
  }

  if (invite.usedAt) {
    res.status(400).json({ success: false, error: 'This invite has already been used' });
    return;
  }

  if (invite.expiresAt < new Date()) {
    res.status(400).json({ success: false, error: 'This invite has expired' });
    return;
  }

  res.json({
    success: true,
    data: {
      email: invite.email,
      role: invite.role,
    },
  });
}

// ============================================================
// ACCEPT INVITE
// ============================================================

const acceptInviteSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1),
  password: z.string().min(6),
});

export async function acceptInvite(req: Request, res: Response): Promise<void> {
  const parsed = acceptInviteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors });
    return;
  }

  const { token, name, password } = parsed.data;

  const invite = await prisma.inviteToken.findUnique({ where: { token } });
  if (!invite) {
    res.status(404).json({ success: false, error: 'Invalid invite token' });
    return;
  }

  if (invite.usedAt) {
    res.status(400).json({ success: false, error: 'This invite has already been used' });
    return;
  }

  if (invite.expiresAt < new Date()) {
    res.status(400).json({ success: false, error: 'This invite has expired' });
    return;
  }

  // Check if email already taken
  const existingUser = await prisma.user.findUnique({ where: { email: invite.email } });
  if (existingUser) {
    res.status(409).json({ success: false, error: 'A user with this email already exists' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const [user] = await prisma.$transaction([
    prisma.user.create({
      data: {
        email: invite.email,
        password: hashedPassword,
        name,
        role: invite.role,
      },
      select: { id: true, email: true, name: true, role: true },
    }),
    prisma.inviteToken.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    }),
  ]);

  const jwt = generateToken({
    id: user.id,
    email: user.email,
    type: 'staff',
    role: user.role,
  });

  res.status(201).json({ success: true, data: { token: jwt, user } });
}
