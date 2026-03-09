import { Request } from 'express';
import prisma from './db.js';
import logger from './logger.js';

interface AuditOptions {
  action: 'create' | 'update' | 'delete';
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
}

export function auditLog(req: Request, opts: AuditOptions): void {
  if (!req.user) return;

  try {
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;

    prisma.auditLog.create({
      data: {
        userId: req.user.id,
        userEmail: req.user.email,
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId,
        details: opts.details as any ?? undefined,
        ipAddress,
        requestId: String(req.id),
      },
    }).catch((err) => {
      logger.error({ err }, 'Failed to write audit log');
    });
  } catch (err) {
    logger.error({ err }, 'Failed to write audit log');
  }
}
