import { Request, Response } from 'express';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import prisma from '../lib/db.js';

const updateSettingsSchema = z.object({
  siteName: z.string().min(1).optional(),
  siteTitle: z.string().min(1).optional(),
  colorPrimary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  colorSecondary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  darkMode: z.enum(['light', 'dark', 'system']).optional(),
  storefrontTemplate: z.string().optional(),
  heroSection: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    ctaPrimaryText: z.string().optional(),
    ctaPrimaryLink: z.string().optional(),
    ctaSecondaryText: z.string().optional(),
    ctaSecondaryLink: z.string().optional(),
    backgroundImage: z.string().optional(),
  }).optional(),
  featuresSection: z.array(z.object({
    icon: z.string(),
    title: z.string(),
    description: z.string(),
  })).optional(),
  ctaSection: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    buttonText: z.string().optional(),
    buttonLink: z.string().optional(),
  }).optional(),
});

async function getOrCreateSettings() {
  let settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
  if (!settings) {
    settings = await prisma.siteSettings.create({ data: { id: 'default' } });
  }
  return settings;
}

export async function getSettings(_req: Request, res: Response): Promise<void> {
  const settings = await getOrCreateSettings();
  res.json({ success: true, data: settings });
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
  const parsed = updateSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors });
    return;
  }

  await getOrCreateSettings();

  const settings = await prisma.siteSettings.update({
    where: { id: 'default' },
    data: parsed.data,
  });

  res.json({ success: true, data: settings });
}

export async function uploadLogo(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file uploaded' });
    return;
  }

  await getOrCreateSettings();

  const logoPath = `/uploads/${req.file.filename}`;
  const settings = await prisma.siteSettings.update({
    where: { id: 'default' },
    data: { logo: logoPath },
  });

  res.json({ success: true, data: settings });
}

export async function uploadFavicon(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file uploaded' });
    return;
  }

  await getOrCreateSettings();

  const faviconPath = `/uploads/${req.file.filename}`;
  const settings = await prisma.siteSettings.update({
    where: { id: 'default' },
    data: { favicon: faviconPath },
  });

  res.json({ success: true, data: settings });
}

// ============================================================
// SECRET MASKING UTILITIES
// ============================================================

function maskSecret(value: string | undefined | null): string {
  if (!value || value.length < 8) return value ? '••••••••' : '';
  return value.slice(0, 4) + '...' + value.slice(-4);
}

function isMasked(value: string | undefined | null): boolean {
  return typeof value === 'string' && value.includes('...');
}

function preserveIfMasked(newVal: string | undefined | null, existingVal: string | undefined | null): string | undefined | null {
  if (isMasked(newVal)) return existingVal;
  return newVal;
}

// ============================================================
// GENERIC SETTINGS GROUP HELPERS
// ============================================================

type SettingsField =
  | 'generalSettings'
  | 'orderSettings'
  | 'reservationSettings'
  | 'mailSettings'
  | 'paymentSettings'
  | 'reviewSettings'
  | 'advancedSettings';

async function getSettingsGroup(field: SettingsField): Promise<Record<string, any>> {
  const settings = await getOrCreateSettings();
  return (settings[field] as Record<string, any>) || {};
}

async function updateSettingsGroup(field: SettingsField, data: Record<string, any>): Promise<Record<string, any>> {
  await getOrCreateSettings();
  const updated = await prisma.siteSettings.update({
    where: { id: 'default' },
    data: { [field]: data },
  });
  return (updated[field] as Record<string, any>) || {};
}

// ============================================================
// ZOD SCHEMAS FOR SETTINGS GROUPS
// ============================================================

const generalSettingsSchema = z.object({
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  timezone: z.string().optional(),
  distanceUnit: z.enum(['km', 'mi']).optional(),
  defaultCurrency: z.string().max(3).optional(),
  currencySymbol: z.string().max(5).optional(),
  currencyPosition: z.enum(['before', 'after']).optional(),
  googleMapsApiKey: z.string().optional(),
});

const orderSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  minOrderDelivery: z.number().min(0).optional(),
  minOrderPickup: z.number().min(0).optional(),
  deliveryLeadTime: z.number().min(0).optional(),
  pickupLeadTime: z.number().min(0).optional(),
  enableFutureOrdering: z.boolean().optional(),
  enableTipping: z.boolean().optional(),
  tipOptions: z.array(z.number()).optional(),
  taxRate: z.number().min(0).max(100).optional(),
});

const reservationSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  timeInterval: z.number().min(1).optional(),
  stayTime: z.number().min(1).optional(),
  maxAdvanceBookingDays: z.number().min(1).optional(),
  minCancellationNoticeHours: z.number().min(0).optional(),
  autoConfirm: z.boolean().optional(),
});

const mailSettingsSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  senderName: z.string().optional(),
  senderEmail: z.string().email().optional().or(z.literal('')),
  encryption: z.enum(['none', 'tls', 'ssl']).optional(),
});

const paymentSettingsSchema = z.object({
  stripeEnabled: z.boolean().optional(),
  stripePublishableKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  stripeWebhookSecret: z.string().optional(),
  paypalEnabled: z.boolean().optional(),
  paypalClientId: z.string().optional(),
  paypalClientSecret: z.string().optional(),
  paypalSandbox: z.boolean().optional(),
  cashEnabled: z.boolean().optional(),
});

const reviewSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  requireOrder: z.boolean().optional(),
  autoApprove: z.boolean().optional(),
  minimumRating: z.number().min(1).max(5).optional(),
});

const advancedSettingsSchema = z.object({
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().optional(),
  enableRateLimiting: z.boolean().optional(),
});

// ============================================================
// GENERAL SETTINGS
// ============================================================

export async function getGeneralSettings(_req: Request, res: Response): Promise<void> {
  const data = await getSettingsGroup('generalSettings');
  res.json({ success: true, data });
}

export async function updateGeneralSettings(req: Request, res: Response): Promise<void> {
  const parsed = generalSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors });
    return;
  }
  const data = await updateSettingsGroup('generalSettings', parsed.data);
  res.json({ success: true, data });
}

// ============================================================
// ORDER SETTINGS
// ============================================================

export async function getOrderSettings(_req: Request, res: Response): Promise<void> {
  const data = await getSettingsGroup('orderSettings');
  res.json({ success: true, data });
}

export async function updateOrderSettings(req: Request, res: Response): Promise<void> {
  const parsed = orderSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors });
    return;
  }
  const data = await updateSettingsGroup('orderSettings', parsed.data);
  res.json({ success: true, data });
}

// ============================================================
// RESERVATION SETTINGS
// ============================================================

export async function getReservationSettings(_req: Request, res: Response): Promise<void> {
  const data = await getSettingsGroup('reservationSettings');
  res.json({ success: true, data });
}

export async function updateReservationSettings(req: Request, res: Response): Promise<void> {
  const parsed = reservationSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors });
    return;
  }
  const data = await updateSettingsGroup('reservationSettings', parsed.data);
  res.json({ success: true, data });
}

// ============================================================
// MAIL SETTINGS
// ============================================================

export async function getMailSettings(_req: Request, res: Response): Promise<void> {
  const data = await getSettingsGroup('mailSettings');
  res.json({
    success: true,
    data: {
      ...data,
      smtpPass: maskSecret(data.smtpPass),
    },
  });
}

export async function updateMailSettings(req: Request, res: Response): Promise<void> {
  const parsed = mailSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors });
    return;
  }

  const existing = await getSettingsGroup('mailSettings');
  const mergedData = {
    ...parsed.data,
    smtpPass: preserveIfMasked(parsed.data.smtpPass, existing.smtpPass),
  };

  const data = await updateSettingsGroup('mailSettings', mergedData);
  res.json({
    success: true,
    data: { ...data, smtpPass: maskSecret(data.smtpPass) },
  });
}

export async function sendTestEmail(req: Request, res: Response): Promise<void> {
  const { to } = req.body;
  if (!to || typeof to !== 'string') {
    res.status(400).json({ success: false, error: 'Recipient email (to) is required' });
    return;
  }

  const mail = await getSettingsGroup('mailSettings');
  const host = mail.smtpHost || process.env.SMTP_HOST || 'localhost';
  const port = mail.smtpPort || parseInt(process.env.SMTP_PORT || '1025');
  const user = mail.smtpUser || process.env.SMTP_USER;
  const pass = mail.smtpPass || process.env.SMTP_PASS;
  const senderName = mail.senderName || 'KitchenAsty';
  const senderEmail = mail.senderEmail || 'noreply@kitchenasty.com';
  const encryption = mail.encryption || 'none';

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: encryption === 'ssl',
      auth: user ? { user, pass } : undefined,
      ...(encryption === 'tls' ? { requireTLS: true } : {}),
    });

    await transporter.sendMail({
      from: `${senderName} <${senderEmail}>`,
      to,
      subject: 'KitchenAsty — Test Email',
      html: '<div style="font-family:sans-serif;padding:20px"><h2>Test Email</h2><p>If you received this, your mail settings are configured correctly.</p></div>',
    });

    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to send test email' });
  }
}

// ============================================================
// PAYMENT SETTINGS
// ============================================================

export async function getPaymentSettings(_req: Request, res: Response): Promise<void> {
  const data = await getSettingsGroup('paymentSettings');
  res.json({
    success: true,
    data: {
      ...data,
      stripeSecretKey: maskSecret(data.stripeSecretKey),
      stripeWebhookSecret: maskSecret(data.stripeWebhookSecret),
      paypalClientSecret: maskSecret(data.paypalClientSecret),
    },
  });
}

export async function updatePaymentSettings(req: Request, res: Response): Promise<void> {
  const parsed = paymentSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors });
    return;
  }

  const existing = await getSettingsGroup('paymentSettings');
  const mergedData = {
    ...parsed.data,
    stripeSecretKey: preserveIfMasked(parsed.data.stripeSecretKey, existing.stripeSecretKey),
    stripeWebhookSecret: preserveIfMasked(parsed.data.stripeWebhookSecret, existing.stripeWebhookSecret),
    paypalClientSecret: preserveIfMasked(parsed.data.paypalClientSecret, existing.paypalClientSecret),
  };

  const data = await updateSettingsGroup('paymentSettings', mergedData);
  res.json({
    success: true,
    data: {
      ...data,
      stripeSecretKey: maskSecret(data.stripeSecretKey),
      stripeWebhookSecret: maskSecret(data.stripeWebhookSecret),
      paypalClientSecret: maskSecret(data.paypalClientSecret),
    },
  });
}

// ============================================================
// REVIEW SETTINGS
// ============================================================

export async function getReviewSettings(_req: Request, res: Response): Promise<void> {
  const data = await getSettingsGroup('reviewSettings');
  res.json({ success: true, data });
}

export async function updateReviewSettings(req: Request, res: Response): Promise<void> {
  const parsed = reviewSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors });
    return;
  }
  const data = await updateSettingsGroup('reviewSettings', parsed.data);
  res.json({ success: true, data });
}

// ============================================================
// ADVANCED SETTINGS
// ============================================================

export async function getAdvancedSettings(_req: Request, res: Response): Promise<void> {
  const data = await getSettingsGroup('advancedSettings');
  res.json({ success: true, data });
}

export async function updateAdvancedSettings(req: Request, res: Response): Promise<void> {
  const parsed = advancedSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors });
    return;
  }
  const data = await updateSettingsGroup('advancedSettings', parsed.data);
  res.json({ success: true, data });
}
