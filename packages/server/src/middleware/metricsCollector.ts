import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/db.js';
import { metricsLogger } from '../lib/logger.js';

const CUID_OR_UUID = /[a-z0-9]{20,}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

function normalizePath(path: string): string {
  return path.replace(CUID_OR_UUID, ':id');
}

export function metricsCollector(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const path = normalizePath(req.path);
    if (path === '/api/health') return;

    const responseTime = Date.now() - start;

    prisma.apiMetric.create({
      data: {
        method: req.method,
        path,
        statusCode: res.statusCode,
        responseTime,
        requestId: String(req.id),
        userId: req.user?.id,
        userType: req.user?.type,
      },
    }).catch((err) => {
      metricsLogger.error({ err }, 'Failed to record API metric');
    });
  });

  next();
}
