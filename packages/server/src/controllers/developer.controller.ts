import { Request, Response } from 'express';
import prisma from '../lib/db.js';

// ============================================================
// GET METRICS SUMMARY
// ============================================================

export async function getMetrics(req: Request, res: Response): Promise<void> {
  const hours = Math.min(168, Math.max(1, parseInt(req.query.hours as string) || 24));
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const metrics = await prisma.apiMetric.findMany({
    where: { createdAt: { gte: since } },
    select: {
      statusCode: true,
      responseTime: true,
      createdAt: true,
    },
  });

  const totalRequests = metrics.length;
  const avgResponseTime = totalRequests > 0
    ? Math.round(metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests)
    : 0;
  const errorCount = metrics.filter((m) => m.statusCode >= 500).length;
  const errorRate = totalRequests > 0 ? ((errorCount / totalRequests) * 100).toFixed(2) : '0.00';

  const durationMinutes = hours * 60;
  const requestsPerMinute = totalRequests > 0 ? (totalRequests / durationMinutes).toFixed(2) : '0.00';

  // Hourly breakdown
  const hourlyMap = new Map<string, { count: number; errors: number; totalTime: number }>();
  for (const m of metrics) {
    const hour = new Date(m.createdAt);
    hour.setMinutes(0, 0, 0);
    const key = hour.toISOString();
    const existing = hourlyMap.get(key) || { count: 0, errors: 0, totalTime: 0 };
    existing.count++;
    if (m.statusCode >= 500) existing.errors++;
    existing.totalTime += m.responseTime;
    hourlyMap.set(key, existing);
  }

  const hourly = Array.from(hourlyMap.entries())
    .map(([hour, data]) => ({
      hour,
      requests: data.count,
      errors: data.errors,
      avgResponseTime: Math.round(data.totalTime / data.count),
    }))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  res.json({
    success: true,
    data: {
      summary: {
        totalRequests,
        avgResponseTime,
        errorCount,
        errorRate: parseFloat(errorRate),
        requestsPerMinute: parseFloat(requestsPerMinute),
      },
      hourly,
    },
  });
}

// ============================================================
// GET ENDPOINT METRICS
// ============================================================

export async function getEndpointMetrics(req: Request, res: Response): Promise<void> {
  const hours = Math.min(168, Math.max(1, parseInt(req.query.hours as string) || 24));
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const metrics = await prisma.apiMetric.findMany({
    where: { createdAt: { gte: since } },
    select: {
      method: true,
      path: true,
      statusCode: true,
      responseTime: true,
    },
  });

  // Aggregate by method+path
  const endpointMap = new Map<string, { method: string; path: string; times: number[]; errors: number }>();
  for (const m of metrics) {
    const key = `${m.method} ${m.path}`;
    const existing = endpointMap.get(key) || { method: m.method, path: m.path, times: [], errors: 0 };
    existing.times.push(m.responseTime);
    if (m.statusCode >= 500) existing.errors++;
    endpointMap.set(key, existing);
  }

  const endpoints = Array.from(endpointMap.values())
    .map((e) => {
      const sorted = e.times.sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      return {
        method: e.method,
        path: e.path,
        count: e.times.length,
        avgResponseTime: Math.round(e.times.reduce((s, t) => s + t, 0) / e.times.length),
        p95ResponseTime: sorted[p95Index] || 0,
        errors: e.errors,
      };
    })
    .sort((a, b) => b.count - a.count);

  res.json({ success: true, data: endpoints });
}

// ============================================================
// GET AUDIT LOGS
// ============================================================

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const entity = req.query.entity as string | undefined;
  const action = req.query.action as string | undefined;
  const search = req.query.search as string | undefined;

  const where: any = {};
  if (entity) where.entity = entity;
  if (action) where.action = action;
  if (search) {
    where.OR = [
      { userEmail: { contains: search, mode: 'insensitive' } },
      { entityId: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
