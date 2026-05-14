import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../lib/db.js';

const createReservationSchema = z.object({
  locationId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  partySize: z.number().int().min(1).max(50),
  comment: z.string().optional(),
});

const updateReservationSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED']).optional(),
  tableId: z.string().nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  partySize: z.number().int().min(1).max(50).optional(),
  comment: z.string().nullable().optional(),
});

export async function createReservation(req: Request, res: Response): Promise<void> {
  const parsed = createReservationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors });
    return;
  }

  const { locationId, date, time, partySize, comment } = parsed.data;
  const customerId = (req as any).user?.id;

  if (!customerId) {
    res.status(401).json({ success: false, error: 'Authentication required for reservations' });
    return;
  }

  // Verify location exists and is active
  const location = await prisma.location.findUnique({ where: { id: locationId } });
  if (!location || !location.isActive) {
    res.status(400).json({ success: false, error: 'Location not found or inactive' });
    return;
  }

  const reservation = await prisma.reservation.create({
    data: {
      customerId,
      locationId,
      date: new Date(date),
      time,
      partySize,
      comment,
    },
    include: {
      location: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true, email: true } },
      table: true,
    },
  });

  // Emit event for automation rules
  try {
    const { appEvents } = await import('../lib/events.js');
    appEvents.emit('reservation.created', { reservation });
  } catch {}

  res.status(201).json({ success: true, data: reservation });
}

export async function listReservations(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;
  const status = req.query.status as string | undefined;
  const locationId = req.query.locationId as string | undefined;
  const date = req.query.date as string | undefined;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (locationId) where.locationId = locationId;
  if (date) where.date = new Date(date);

  const [reservations, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        location: { select: { id: true, name: true } },
        table: { select: { id: true, name: true, capacity: true } },
      },
    }),
    prisma.reservation.count({ where }),
  ]);

  res.json({
    success: true,
    data: reservations,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getReservation(req: Request<{ id: string }>, res: Response): Promise<void> {
  const { id } = req.params;

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      location: { select: { id: true, name: true } },
      table: { select: { id: true, name: true, capacity: true } },
    },
  });

  if (!reservation) {
    res.status(404).json({ success: false, error: 'Reservation not found' });
    return;
  }

  res.json({ success: true, data: reservation });
}

export async function updateReservation(req: Request<{ id: string }>, res: Response): Promise<void> {
  const { id } = req.params;
  const parsed = updateReservationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors });
    return;
  }

  const existing = await prisma.reservation.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Reservation not found' });
    return;
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) data.status = parsed.data.status;
  if (parsed.data.tableId !== undefined) data.tableId = parsed.data.tableId;
  if (parsed.data.date !== undefined) data.date = new Date(parsed.data.date);
  if (parsed.data.time !== undefined) data.time = parsed.data.time;
  if (parsed.data.partySize !== undefined) data.partySize = parsed.data.partySize;
  if (parsed.data.comment !== undefined) data.comment = parsed.data.comment;

  const reservation = await prisma.reservation.update({
    where: { id },
    data,
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      location: { select: { id: true, name: true } },
      table: { select: { id: true, name: true, capacity: true } },
    },
  });

  res.json({ success: true, data: reservation });
}

export async function deleteReservation(req: Request<{ id: string }>, res: Response): Promise<void> {
  const { id } = req.params;

  const existing = await prisma.reservation.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Reservation not found' });
    return;
  }

  await prisma.reservation.delete({ where: { id } });
  res.json({ success: true, message: 'Reservation deleted' });
}

export async function listCustomerReservations(req: Request, res: Response): Promise<void> {
  const customerId = req.user?.id;
  if (!customerId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  const where = { customerId };

  const [reservations, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ date: 'desc' }, { time: 'desc' }],
      include: {
        location: { select: { id: true, name: true } },
        table: { select: { id: true, name: true, capacity: true } },
      },
    }),
    prisma.reservation.count({ where }),
  ]);

  res.json({
    success: true,
    data: reservations,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getReservationAnalytics(req: Request, res: Response): Promise<void> {
  const days = Math.min(365, Math.max(7, parseInt(req.query.days as string) || 30));
  const locationId = req.query.locationId as string | undefined;

  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + days);
  endDate.setHours(23, 59, 59, 999);

  const locationFilter = locationId ? Prisma.sql`AND "locationId" = ${locationId}` : Prisma.empty;
  const where: Prisma.ReservationWhereInput = {
    date: { gte: startDate, lte: endDate },
    ...(locationId ? { locationId } : {}),
  };

  const [
    dailyRows,
    dowRows,
    partySizeRows,
    statusRows,
    hourlyRows,
    leadTimeRows,
    summaryAgg,
    completedCount,
  ] = await Promise.all([
    prisma.$queryRaw<{ date: string; reservations: bigint; guests: bigint }[]>(
      Prisma.sql`
        SELECT
          TO_CHAR("date", 'YYYY-MM-DD') AS date,
          COUNT(*)::bigint AS reservations,
          COALESCE(SUM("partySize"), 0)::bigint AS guests
        FROM "reservations"
        WHERE "date" >= ${startDate} AND "date" <= ${endDate} ${locationFilter}
        GROUP BY "date"
        ORDER BY "date"
      `
    ),
    prisma.$queryRaw<{ dow: number; reservations: bigint; guests: bigint }[]>(
      Prisma.sql`
        SELECT
          EXTRACT(DOW FROM "date")::int AS dow,
          COUNT(*)::bigint AS reservations,
          COALESCE(SUM("partySize"), 0)::bigint AS guests
        FROM "reservations"
        WHERE "date" >= ${startDate} AND "date" <= ${endDate} ${locationFilter}
        GROUP BY EXTRACT(DOW FROM "date")
        ORDER BY dow
      `
    ),
    prisma.reservation.groupBy({
      by: ['partySize'],
      where,
      _count: true,
      orderBy: { partySize: 'asc' },
    }),
    prisma.reservation.groupBy({
      by: ['status'],
      where,
      _count: true,
    }),
    prisma.$queryRaw<{ hour: number; reservations: bigint }[]>(
      Prisma.sql`
        SELECT
          SPLIT_PART("time", ':', 1)::int AS hour,
          COUNT(*)::bigint AS reservations
        FROM "reservations"
        WHERE "date" >= ${startDate} AND "date" <= ${endDate} ${locationFilter}
        GROUP BY SPLIT_PART("time", ':', 1)::int
        ORDER BY hour
      `
    ),
    prisma.$queryRaw<{ bucket: string; count: bigint }[]>(
      Prisma.sql`
        SELECT
          CASE
            WHEN ("date"::date - "createdAt"::date) <= 0 THEN 'same-day'
            WHEN ("date"::date - "createdAt"::date) BETWEEN 1 AND 2 THEN '1-2d'
            WHEN ("date"::date - "createdAt"::date) BETWEEN 3 AND 7 THEN '3-7d'
            WHEN ("date"::date - "createdAt"::date) BETWEEN 8 AND 14 THEN '8-14d'
            ELSE '15d+'
          END AS bucket,
          COUNT(*)::bigint AS count
        FROM "reservations"
        WHERE "date" >= ${startDate} AND "date" <= ${endDate} ${locationFilter}
        GROUP BY bucket
      `
    ),
    prisma.reservation.aggregate({
      where,
      _count: true,
      _sum: { partySize: true },
      _avg: { partySize: true },
    }),
    prisma.reservation.count({
      where: { ...where, status: { in: ['COMPLETED', 'SEATED'] } },
    }),
  ]);

  const totalReservations = summaryAgg._count;
  const completionRate = totalReservations > 0 ? completedCount / totalReservations : 0;

  const bucketOrder = ['same-day', '1-2d', '3-7d', '8-14d', '15d+'];
  const leadTimeMap = new Map(leadTimeRows.map((r) => [r.bucket, Number(r.count)]));
  const leadTimeBuckets = bucketOrder.map((bucket) => ({
    bucket,
    count: leadTimeMap.get(bucket) ?? 0,
  }));

  res.json({
    success: true,
    data: {
      summary: {
        totalReservations,
        totalGuests: Number(summaryAgg._sum.partySize ?? 0),
        avgPartySize: Number((summaryAgg._avg.partySize ?? 0).toFixed(2)),
        completionRate: Number(completionRate.toFixed(4)),
        rangeStart: startDate.toISOString(),
        rangeEnd: endDate.toISOString(),
      },
      dailyBookings: dailyRows.map((d) => ({
        date: d.date,
        reservations: Number(d.reservations),
        guests: Number(d.guests),
      })),
      dayOfWeekDistribution: dowRows.map((d) => ({
        dow: d.dow,
        reservations: Number(d.reservations),
        guests: Number(d.guests),
      })),
      partySizeDistribution: partySizeRows.map((d) => ({
        partySize: d.partySize,
        count: d._count,
      })),
      statusDistribution: statusRows.map((d) => ({
        status: d.status,
        count: d._count,
      })),
      hourlyDistribution: hourlyRows.map((d) => ({
        hour: d.hour,
        reservations: Number(d.reservations),
      })),
      leadTimeBuckets,
    },
  });
}

export async function checkAvailability(req: Request, res: Response): Promise<void> {
  const { locationId, date, partySize } = req.query;

  if (!locationId || !date) {
    res.status(400).json({ success: false, error: 'locationId and date are required' });
    return;
  }

  const parsedSize = parseInt(partySize as string) || 2;

  // Get all tables at this location that can fit the party
  const tables = await prisma.table.findMany({
    where: {
      locationId: locationId as string,
      isActive: true,
      capacity: { gte: parsedSize },
    },
    orderBy: { capacity: 'asc' },
  });

  // Get existing reservations for that date at that location (non-cancelled)
  const existingReservations = await prisma.reservation.findMany({
    where: {
      locationId: locationId as string,
      date: new Date(date as string),
      status: { not: 'CANCELLED' },
    },
    select: { time: true, tableId: true },
  });

  // Generate time slots (e.g., 11:00 to 21:00, every 30 min)
  const slots: { time: string; available: boolean }[] = [];
  for (let h = 11; h <= 21; h++) {
    for (const m of ['00', '30']) {
      const time = `${String(h).padStart(2, '0')}:${m}`;
      // A slot is available if there are tables not reserved at that time
      const reservedTableIds = existingReservations
        .filter((r) => r.time === time && r.tableId)
        .map((r) => r.tableId);
      const availableTables = tables.filter((t) => !reservedTableIds.includes(t.id));
      slots.push({ time, available: availableTables.length > 0 });
    }
  }

  res.json({ success: true, data: { slots, totalTables: tables.length } });
}
