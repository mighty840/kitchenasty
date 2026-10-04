import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/db.js';
import { emitNewOrder, emitOrderStatusUpdate } from '../lib/socket.js';
import { isPointInPolygon } from '../lib/geo.js';
import { isAfterCutoff } from '../lib/cutoff.js';
import { sendEmail, orderConfirmationEmail, orderStatusEmail } from '../lib/email.js';
import { auditLog } from '../lib/audit.js';
import { resolveCoupon, CouponError } from './coupon.controller.js';
import { getStripe } from '../lib/stripe.js';

const orderItemOptionSchema = z.object({
  menuOptionValueId: z.string().min(1),
  // Accepted for older clients but ignored: name, value and price come from the menu.
  name: z.string().optional(),
  value: z.string().optional(),
  priceModifier: z.number().optional(),
});

const orderItemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().min(1),
  comment: z.string().optional(),
  options: z.array(orderItemOptionSchema).optional(),
  // ISO date (YYYY-MM-DD) of the weekday this line is for. Used by the
  // storefront's weekly-order flow — missing means the order's
  // scheduledAt / tomorrow.
  forDate: z.string().optional(),
});

const createOrderSchema = z.object({
  orderType: z.enum(['DELIVERY', 'PICKUP']),
  items: z.array(orderItemSchema).min(1),
  comment: z.string().optional(),
  scheduledAt: z.string().optional(),
  couponCode: z.string().optional(),
  address: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }).optional(),
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
  loyaltyPointsRedeem: z.number().int().min(0).optional(),
});

function generateOrderNumber(): string {
  const prefix = 'KA';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function createOrder(req: Request, res: Response): Promise<void> {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors });
    return;
  }

  const { orderType, items, comment, scheduledAt, address, guestName, guestEmail, guestPhone, loyaltyPointsRedeem, couponCode } = parsed.data;

  if (orderType === 'DELIVERY' && !address) {
    res.status(400).json({ success: false, error: 'Delivery address is required' });
    return;
  }

  // Get customer ID from auth if available
  const customerId = (req as any).user?.type === 'customer' ? (req as any).user.id : null;

  // Guest checkout: require name + email if not authenticated
  if (!customerId) {
    if (!guestName || !guestEmail) {
      res.status(400).json({ success: false, error: 'Guest name and email are required for guest checkout' });
      return;
    }
  }

  // Validate scheduledAt
  if (scheduledAt) {
    const scheduled = new Date(scheduledAt);
    const now = new Date();
    const minTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 min in future
    const maxTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days out

    if (isNaN(scheduled.getTime())) {
      res.status(400).json({ success: false, error: 'Invalid scheduledAt date' });
      return;
    }
    if (scheduled < minTime) {
      res.status(400).json({ success: false, error: 'Scheduled time must be at least 30 minutes in the future' });
      return;
    }
    if (scheduled > maxTime) {
      res.status(400).json({ success: false, error: 'Scheduled time cannot be more than 7 days in the future' });
      return;
    }
  }

  // Get first location as default (for now)
  const location = await prisma.location.findFirst({
    where: { isActive: true },
    include: { operatingHours: true },
  });
  if (!location) {
    res.status(400).json({ success: false, error: 'No active location found' });
    return;
  }

  // Check busy mode
  if (location.isBusy) {
    res.status(400).json({
      success: false,
      error: location.busyMessage || 'This location is currently not accepting orders. Please try again later.',
    });
    return;
  }

  // Validate scheduledAt is within operating hours
  if (scheduledAt && location.operatingHours.length > 0) {
    const scheduled = new Date(scheduledAt);
    const dayOfWeek = scheduled.getDay();
    const timeStr = `${String(scheduled.getHours()).padStart(2, '0')}:${String(scheduled.getMinutes()).padStart(2, '0')}`;
    const dayHours = location.operatingHours.find((h) => h.dayOfWeek === dayOfWeek);
    if (!dayHours || dayHours.isClosed) {
      res.status(400).json({ success: false, error: 'Location is closed on the scheduled day' });
      return;
    }
    if (timeStr < dayHours.openTime || timeStr >= dayHours.closeTime) {
      res.status(400).json({ success: false, error: `Scheduled time must be within operating hours (${dayHours.openTime} - ${dayHours.closeTime})` });
      return;
    }
  }

  // Delivery zone enforcement
  let deliveryFee = 0;
  if (orderType === 'DELIVERY') {
    if (address?.lat != null && address?.lng != null) {
      const zones = await prisma.deliveryZone.findMany({
        where: { locationId: location.id, isActive: true },
        orderBy: { charge: 'asc' },
      });

      let matchedZone = null;
      for (const zone of zones) {
        if (zone.boundaries && Array.isArray(zone.boundaries)) {
          if (isPointInPolygon(address.lat, address.lng, zone.boundaries as [number, number][])) {
            matchedZone = zone;
            break;
          }
        }
      }

      if (zones.length > 0 && !matchedZone) {
        res.status(400).json({ success: false, error: 'Delivery address is outside our delivery zones' });
        return;
      }

      if (matchedZone) {
        deliveryFee = matchedZone.charge;
        if (scheduledAt && isAfterCutoff(new Date(), new Date(scheduledAt), matchedZone.cutoffTime)) {
          res.status(400).json({
            success: false,
            error: `Orders for this delivery slot are locked. The cutoff for ${matchedZone.name} is ${matchedZone.cutoffTime} the day before delivery.`,
            code: 'CUTOFF_PASSED',
          });
          return;
        }
      } else {
        deliveryFee = 4.99; // Fallback if no zones configured
      }
    } else {
      // No coordinates provided — use fallback or first zone's charge
      const defaultZone = await prisma.deliveryZone.findFirst({
        where: { locationId: location.id, isActive: true },
        orderBy: { charge: 'asc' },
      });
      deliveryFee = defaultZone ? defaultZone.charge : 4.99;
    }
  }

  // Fetch menu items to validate and get prices
  const menuItemIds = items.map((i) => i.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds } },
    include: {
      options: { include: { values: true } },
    },
  });

  const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));

  // Validate all items exist and are active
  for (const item of items) {
    const menuItem = menuItemMap.get(item.menuItemId);
    if (!menuItem) {
      res.status(400).json({ success: false, error: `Menu item not found: ${item.menuItemId}` });
      return;
    }
    if (!menuItem.isActive) {
      res.status(400).json({ success: false, error: `Menu item is not available: ${menuItem.name}` });
      return;
    }
    if (menuItem.trackStock && menuItem.stockQty < item.quantity) {
      res.status(400).json({ success: false, error: `Insufficient stock for: ${menuItem.name}` });
      return;
    }
    const valueIds = new Set(menuItem.options.flatMap((o) => o.values.map((v) => v.id)));
    const badOption = (item.options || []).find((opt) => !valueIds.has(opt.menuOptionValueId));
    if (badOption) {
      res.status(400).json({ success: false, error: `Invalid option for: ${menuItem.name}` });
      return;
    }
  }

  // Lock-in cutoff — items for a forDate D must be placed before this
  // clock time on D-1 (server-local). Past it, the kitchen has already
  // started prep for tomorrow and we refuse the line. Defaults to 21:00
  // when the admin hasn't configured a cutoff.
  let cutoffHour = 21;
  let cutoffMinute = 0;
  {
    const siteSettings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
    const order = (siteSettings?.orderSettings as Record<string, unknown> | null) ?? null;
    const raw = (order?.lockInCutoff as string | undefined) ?? '21:00';
    const m = /^(\d{2}):(\d{2})$/.exec(raw);
    if (m) {
      cutoffHour = parseInt(m[1], 10);
      cutoffMinute = parseInt(m[2], 10);
    }
  }

  // Calculate totals
  let subtotal = 0;
  let orderItemsData: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    comment?: string;
    forDate?: Date;
    options: { create: Array<{ menuOptionValueId: string; name: string; value: string; priceModifier: number }> };
  }>;
  try {
    orderItemsData = items.map((item) => {
    const menuItem = menuItemMap.get(item.menuItemId)!;
    let unitPrice = menuItem.price;

    // Price options from the menu, never from the request body.
    const optionsData = (item.options || []).map((opt) => {
      const option = menuItem.options.find((o) => o.values.some((v) => v.id === opt.menuOptionValueId))!;
      const value = option.values.find((v) => v.id === opt.menuOptionValueId)!;
      unitPrice += value.priceModifier;
      return {
        menuOptionValueId: value.id,
        name: option.name,
        value: value.name,
        priceModifier: value.priceModifier,
      };
    });

    const itemSubtotal = unitPrice * item.quantity;
    subtotal += itemSubtotal;

    // Validate forDate: YYYY-MM-DD, parsable, in the future-ish, no
    // more than 14 days out, and not past the lock-in cutoff on D-1.
    let forDate: Date | undefined;
    if (item.forDate) {
      const parsed = new Date(item.forDate);
      if (isNaN(parsed.getTime())) {
        throw new Error(`Invalid forDate "${item.forDate}"`);
      }
      const maxOut = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      if (parsed > maxOut) {
        throw new Error('forDate is more than 14 days out');
      }
      // Cutoff: build the deadline (cutoffHour:cutoffMinute on the day
      // BEFORE forDate, in server-local time) and refuse anything past it.
      const deadline = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
      deadline.setDate(deadline.getDate() - 1);
      deadline.setHours(cutoffHour, cutoffMinute, 0, 0);
      if (Date.now() > deadline.getTime()) {
        const hhmm = `${String(cutoffHour).padStart(2, '0')}:${String(cutoffMinute).padStart(2, '0')}`;
        throw new Error(`Lock-in for ${item.forDate} has passed (cutoff was ${hhmm} the day before)`);
      }
      forDate = parsed;
    }

    return {
      menuItemId: item.menuItemId,
      name: menuItem.name,
      quantity: item.quantity,
      unitPrice,
      subtotal: itemSubtotal,
      comment: item.comment,
      forDate,
      options: { create: optionsData },
    };
  });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err?.message ?? 'Invalid order item' });
    return;
  }

  // Loyalty points redemption
  let loyaltyDiscount = 0;
  if (loyaltyPointsRedeem && loyaltyPointsRedeem > 0 && customerId) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer || customer.loyaltyPoints < loyaltyPointsRedeem) {
      res.status(400).json({ success: false, error: 'Insufficient loyalty points' });
      return;
    }
    // 100 points = $1
    loyaltyDiscount = loyaltyPointsRedeem / 100;
  }

  // Promo code — resolved via the shared coupon helper so the validate
  // endpoint and createOrder always agree. resolveCoupon throws
  // CouponError (HTTP-friendly) on bad/expired/used-up codes; we map
  // that to a 400 inline. FREE_DELIVERY coupons set freeDelivery and
  // zero the deliveryFee below; everything else returns a flat discount.
  let couponDiscount = 0;
  let couponId: string | null = null;
  let couponZeroesDelivery = false;
  if (couponCode) {
    try {
      const resolved = await resolveCoupon(couponCode, subtotal);
      couponDiscount = resolved.discount;
      couponId = resolved.coupon.id;
      couponZeroesDelivery = resolved.coupon.type === 'FREE_DELIVERY';
    } catch (err) {
      if (err instanceof CouponError) {
        res.status(err.statusCode).json({ success: false, error: err.message });
        return;
      }
      throw err;
    }
  }

  // Check minimum order for delivery zone
  if (orderType === 'DELIVERY' && address?.lat != null && address?.lng != null) {
    const zones = await prisma.deliveryZone.findMany({
      where: { locationId: location.id, isActive: true },
    });
    for (const zone of zones) {
      if (zone.boundaries && Array.isArray(zone.boundaries)) {
        if (isPointInPolygon(address.lat, address.lng, zone.boundaries as [number, number][])) {
          if (subtotal < zone.minOrder) {
            res.status(400).json({
              success: false,
              error: `Mindestbestellwert für diese Lieferzone: ${zone.minOrder.toFixed(2)} €`,
            });
            return;
          }
          break;
        }
      }
    }
  }

  const TAX_RATE = 0.08;
  const tax = subtotal * TAX_RATE;

  // Inka corporate allowance — when the customer's company defines an
  // allowance per weekday, deduct it day-by-day from each line's
  // forDate (Sat/Sun pay full price). Caps at the day's subtotal so we
  // never go negative. Skipped entirely for guests + customers without
  // a matched company.
  let companyAllowance = 0;
  if (customerId) {
    const me = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { company: { select: { allowancePerWeekdayCents: true } } },
    });
    const perDayEur = (me?.company?.allowancePerWeekdayCents ?? 0) / 100;
    if (perDayEur > 0) {
      // Group line subtotals by ISO date (yyyy-mm-dd) of forDate;
      // lines without forDate fall back to the order's scheduledAt or
      // tomorrow so single-day legacy orders still get credit.
      const fallbackDate = scheduledAt ? new Date(scheduledAt) : (() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d;
      })();
      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      const dayDow = (k: string) => new Date(k + 'T12:00:00Z').getUTCDay(); // 0 Sun..6 Sat

      const dayTotals = new Map<string, number>();
      for (const line of orderItemsData) {
        const dateKey = fmt(line.forDate ?? fallbackDate);
        dayTotals.set(dateKey, (dayTotals.get(dateKey) ?? 0) + line.subtotal);
      }
      for (const [date, dayTotal] of dayTotals) {
        const dow = dayDow(date);
        if (dow === 0 || dow === 6) continue; // Sat / Sun — no allowance
        companyAllowance += Math.min(dayTotal, perDayEur);
      }
    }
  }

  // FREE_DELIVERY coupons zero the delivery fee instead of carrying a
  // discount amount; everything else flows through `discount` together
  // with the loyalty deduction. Keeping the two in one bucket matches
  // the existing receipt UI; if we split them later, both signals are
  // recoverable from couponId + loyaltyPointsRedeem.
  const effectiveDeliveryFee = couponZeroesDelivery ? 0 : deliveryFee;
  const discountTotal = loyaltyDiscount + couponDiscount;
  // Clamp at zero (stacked coupon + loyalty + allowance can exceed the
  // order value) and round to cents so a fully-discounted order is an
  // exact 0 the payment layer can special-case, not float dust.
  const total = Math.max(
    0,
    Math.round((subtotal + tax + effectiveDeliveryFee - discountTotal - companyAllowance) * 100) / 100,
  );

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      customerId,
      locationId: location.id,
      orderType,
      subtotal,
      tax,
      deliveryFee: effectiveDeliveryFee,
      discount: discountTotal,
      companyAllowance,
      total,
      comment,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      couponId,
      guestName: customerId ? undefined : guestName,
      guestEmail: customerId ? undefined : guestEmail,
      guestPhone: customerId ? undefined : guestPhone,
      items: { create: orderItemsData },
    },
    include: {
      items: { include: { options: true } },
      customer: { select: { id: true, name: true, email: true } },
    },
  });

  // Decrement stock for tracked items
  for (const item of items) {
    const menuItem = menuItemMap.get(item.menuItemId)!;
    if (menuItem.trackStock) {
      await prisma.menuItem.update({
        where: { id: item.menuItemId },
        data: { stockQty: { decrement: item.quantity } },
      });
    }
  }

  // Earn loyalty points (1 point per $1 spent)
  if (customerId) {
    const pointsEarned = Math.floor(subtotal);
    if (pointsEarned > 0) {
      await prisma.customer.update({
        where: { id: customerId },
        data: { loyaltyPoints: { increment: pointsEarned } },
      });
      await prisma.loyaltyTransaction.create({
        data: {
          customerId,
          type: 'EARN',
          points: pointsEarned,
          description: `Earned from order #${order.orderNumber}`,
          orderId: order.id,
        },
      });
    }

    // Redeem loyalty points
    if (loyaltyPointsRedeem && loyaltyPointsRedeem > 0) {
      await prisma.customer.update({
        where: { id: customerId },
        data: { loyaltyPoints: { decrement: loyaltyPointsRedeem } },
      });
      await prisma.loyaltyTransaction.create({
        data: {
          customerId,
          type: 'REDEEM',
          points: -loyaltyPointsRedeem,
          description: `Redeemed on order #${order.orderNumber}`,
          orderId: order.id,
        },
      });
    }
  }

  // Increment coupon usage so single-use codes can't be reused. Done
  // outside the customer-only block above because guest orders count
  // too.
  if (couponId) {
    await prisma.coupon.update({ where: { id: couponId }, data: { usageCount: { increment: 1 } } });
  }

  // Send confirmation email
  const recipientEmail = order.customer?.email || guestEmail;
  if (recipientEmail) {
    const emailContent = orderConfirmationEmail({
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      total: order.total,
      items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, subtotal: i.subtotal })),
    });
    sendEmail({ to: recipientEmail, ...emailContent }).catch(() => {});
  }

  emitNewOrder({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    orderType: order.orderType,
  });

  // Emit event for automation rules
  try {
    const { appEvents } = await import('../lib/events.js');
    appEvents.emit('order.created', { order });
  } catch {}

  res.status(201).json({ success: true, data: order });
}

export async function listOrders(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;
  const status = req.query.status as string | undefined;
  const orderType = req.query.orderType as string | undefined;

  const includeItems = req.query.includeItems === 'true';

  const where: Record<string, unknown> = {};
  if (status) {
    const statuses = status.split(',').map((s) => s.trim()).filter(Boolean);
    where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
  }
  if (orderType) where.orderType = orderType;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        location: { select: { id: true, name: true } },
        _count: { select: { items: true } },
        ...(includeItems ? { items: { include: { options: true } } } : {}),
      },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    success: true,
    data: orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getOrder(req: Request<{ id: string }>, res: Response): Promise<void> {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      location: { select: { id: true, name: true } },
      items: {
        include: {
          menuItem: { select: { id: true, name: true, image: true, slug: true } },
          options: true,
        },
      },
    },
  });

  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }

  // optionalAuth — req.user is undefined for guest fetches. Guests get
  // here via the confirmation page polling /orders/:id with no token;
  // we let that through because the cuid id is unguessable enough to
  // act as a bearer for the customer who placed the order. Logged-in
  // staff/customers still get their normal access check.
  const user = req.user;
  if (user && user.type !== 'staff' && order.customerId !== user.id) {
    res.status(403).json({ success: false, error: 'Access denied' });
    return;
  }

  res.json({ success: true, data: order });
}

export async function listCustomerOrders(req: Request, res: Response): Promise<void> {
  const customerId = req.user?.id;
  if (!customerId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  const where = { customerId };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        location: { select: { id: true, name: true } },
        // Include line items so the mobile + storefront receipts show
        // the dish name + image instead of an empty placeholder. menuItem
        // needs `image` here too — without it the InkRemotePhoto on
        // /history falls back to the striped placeholder.
        items: {
          include: {
            menuItem: { select: { id: true, name: true, image: true, slug: true } },
          },
        },
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    success: true,
    data: orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function updateOrderStatus(req: Request<{ id: string }>, res: Response): Promise<void> {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'PICKED_UP', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: { select: { email: true } } },
  });
  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status },
    include: {
      items: { include: { options: true } },
    },
  });

  auditLog(req, { action: 'update', entity: 'Order', entityId: id, details: { status, previousStatus: order.status } });

  emitOrderStatusUpdate({
    id: updated.id,
    orderNumber: updated.orderNumber,
    status: updated.status,
    orderType: updated.orderType,
    customerId: updated.customerId,
  });

  // Send status update email
  const recipientEmail = order.customer?.email || order.guestEmail;
  if (recipientEmail) {
    const emailContent = orderStatusEmail({ orderNumber: order.orderNumber, status });
    sendEmail({ to: recipientEmail, ...emailContent }).catch(() => {});
  }

  // Emit event for automation rules
  try {
    const { appEvents } = await import('../lib/events.js');
    appEvents.emit('order.statusChanged', { order: updated, previousStatus: order.status });
  } catch {}

  res.json({ success: true, data: updated });
}

/// Customer-initiated cancellation. Only allowed while every item is
/// still pre-lock-in (i.e. the kitchen hasn't started prep yet). If the
/// order was paid via Stripe, the PaymentIntent is fully refunded in the
/// same call. Post-lock-in cancellation with a partial-refund fee is
/// tracked separately on the Inka roadmap.
///
/// Auth shape mirrors getOrder: optionalAuth. Guests can cancel orders
/// they placed by hitting this endpoint with the cuid id from their
/// confirmation page — the id is unguessable enough to act as a bearer.
/// Logged-in staff/customers go through a normal access check.
export async function cancelOrder(req: Request<{ id: string }>, res: Response): Promise<void> {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      payments: true,
    },
  });
  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }

  const user = req.user;
  if (user && user.type !== 'staff' && order.customerId !== user.id) {
    res.status(403).json({ success: false, error: 'Access denied' });
    return;
  }

  if (order.status === 'CANCELLED') {
    res.status(409).json({ success: false, error: 'Order is already cancelled' });
    return;
  }
  if (order.status === 'DELIVERED' || order.status === 'PICKED_UP') {
    res.status(409).json({ success: false, error: 'Order is already complete' });
    return;
  }

  // Lock-in cutoff lookup — same shape as createOrder. Default 21:00.
  let cutoffTime = '21:00';
  {
    const siteSettings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
    const orderSettings = (siteSettings?.orderSettings as Record<string, unknown> | null) ?? null;
    const raw = orderSettings?.lockInCutoff;
    if (typeof raw === 'string' && /^(\d{2}):(\d{2})$/.test(raw)) {
      cutoffTime = raw;
    }
  }

  // For every line that has a forDate, check that we're still before
  // that day's cutoff. Lines without forDate (legacy) are evaluated
  // against the order's scheduledAt or today+1.
  const now = new Date();
  const datesToCheck: Date[] = [];
  for (const item of order.items) {
    if (item.forDate) {
      datesToCheck.push(new Date(item.forDate));
    } else if (order.scheduledAt) {
      datesToCheck.push(new Date(order.scheduledAt));
    }
  }
  if (datesToCheck.length === 0) {
    // No date hints — treat the order as immediately past-cutoff to be
    // safe. The customer can still ask staff to cancel via the admin.
    res.status(409).json({
      success: false,
      error: 'This order can no longer be cancelled. Please contact us if you need help.',
    });
    return;
  }
  const anyPastCutoff = datesToCheck.some((d) => isAfterCutoff(now, d, cutoffTime));
  if (anyPastCutoff) {
    res.status(409).json({
      success: false,
      error: 'Lock-in for this order has passed. Cancellation with a small fee is coming soon — please contact us in the meantime.',
    });
    return;
  }

  // Issue a full refund on every Payment row that has a Stripe
  // transactionId. Payment records without a transactionId are likely
  // pending PaymentIntents the user never finished; nothing to refund.
  let refundedCents = 0;
  for (const payment of order.payments) {
    if (!payment.transactionId) continue;
    try {
      const stripe = await getStripe();
      const refund = await stripe.refunds.create({
        payment_intent: payment.transactionId,
        reason: 'requested_by_customer',
        metadata: { orderId: order.id, source: 'customer_cancel' },
      });
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'REFUNDED', metadata: { ...(payment.metadata as object ?? {}), refundId: refund.id } },
      });
      refundedCents += Math.round((refund.amount ?? 0));
    } catch (err) {
      // Refund failed — leave the Payment row alone and surface the
      // error. The order has NOT been cancelled.
      const message = err instanceof Error ? err.message : 'Refund failed';
      res.status(502).json({ success: false, error: `Refund failed: ${message}` });
      return;
    }
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: 'CANCELLED' },
    include: {
      items: { include: { menuItem: { select: { id: true, name: true, image: true, slug: true } }, options: true } },
      payments: true,
    },
  });

  auditLog(req, {
    action: 'update',
    entity: 'Order',
    entityId: order.id,
    details: { previousStatus: order.status, newStatus: 'CANCELLED', refundedCents },
  });

  emitOrderStatusUpdate({
    id: updated.id,
    orderNumber: updated.orderNumber,
    status: updated.status,
    orderType: updated.orderType,
    customerId: updated.customerId,
  });

  res.json({ success: true, data: updated });
}
