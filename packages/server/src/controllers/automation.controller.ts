import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../lib/db.js';
import { auditLog } from '../lib/audit.js';

const VALID_EVENTS = ['order.created', 'order.statusChanged', 'reservation.created', 'review.submitted'];

const createRuleSchema = z.object({
  name: z.string().min(1),
  event: z.string().refine((e) => VALID_EVENTS.includes(e), { message: `Event must be one of: ${VALID_EVENTS.join(', ')}` }),
  conditions: z.record(z.unknown()).nullable().optional(),
  actions: z.array(z.object({
    type: z.enum(['email', 'webhook', 'sms']),
  }).passthrough()).min(1),
  isActive: z.boolean().default(true),
});

const updateRuleSchema = createRuleSchema.partial();

export async function listAutomationRules(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  const [rules, total] = await Promise.all([
    prisma.automationRule.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.automationRule.count(),
  ]);

  res.json({
    success: true,
    data: rules,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getAutomationRule(req: Request<{ id: string }>, res: Response): Promise<void> {
  const rule = await prisma.automationRule.findUnique({ where: { id: req.params.id } });
  if (!rule) {
    res.status(404).json({ success: false, error: 'Automation rule not found' });
    return;
  }
  res.json({ success: true, data: rule });
}

export async function createAutomationRule(req: Request, res: Response): Promise<void> {
  const parsed = createRuleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors });
    return;
  }

  const { conditions, ...rest } = parsed.data;
  const rule = await prisma.automationRule.create({
    data: {
      ...rest,
      conditions: conditions === null ? Prisma.JsonNull : (conditions as Prisma.InputJsonValue) ?? undefined,
      actions: rest.actions as Prisma.InputJsonValue,
    },
  });
  auditLog(req, { action: 'create', entity: 'AutomationRule', entityId: rule.id, details: { name: rule.name } });
  res.status(201).json({ success: true, data: rule });
}

export async function updateAutomationRule(req: Request<{ id: string }>, res: Response): Promise<void> {
  const parsed = updateRuleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors });
    return;
  }

  const existing = await prisma.automationRule.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Automation rule not found' });
    return;
  }

  const { conditions, actions, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest };
  if (conditions !== undefined) {
    updateData.conditions = conditions === null ? Prisma.JsonNull : (conditions as Prisma.InputJsonValue);
  }
  if (actions !== undefined) {
    updateData.actions = actions as Prisma.InputJsonValue;
  }
  const rule = await prisma.automationRule.update({
    where: { id: req.params.id },
    data: updateData,
  });

  auditLog(req, { action: 'update', entity: 'AutomationRule', entityId: req.params.id, details: updateData });

  res.json({ success: true, data: rule });
}

export async function deleteAutomationRule(req: Request<{ id: string }>, res: Response): Promise<void> {
  const existing = await prisma.automationRule.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Automation rule not found' });
    return;
  }

  await prisma.automationRule.delete({ where: { id: req.params.id } });
  auditLog(req, { action: 'delete', entity: 'AutomationRule', entityId: req.params.id, details: { name: existing.name } });
  res.json({ success: true, message: 'Automation rule deleted' });
}
