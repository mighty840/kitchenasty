import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import prisma from './db.js';
import { emailLogger } from './logger.js';

let cachedTransporter: Transporter | null = null;
let cachedFrom: string = '';
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getMailConfig(): Promise<{ transporter: Transporter; from: string }> {
  const now = Date.now();
  if (cachedTransporter && now < cacheExpiry) {
    return { transporter: cachedTransporter, from: cachedFrom };
  }

  let host = process.env.SMTP_HOST || 'localhost';
  let port = parseInt(process.env.SMTP_PORT || '1025');
  let secure = false;
  let user = process.env.SMTP_USER;
  let pass = process.env.SMTP_PASS;
  let senderName = 'KitchenAsty';
  let senderEmail = 'noreply@kitchenasty.com';
  let requireTLS = false;

  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
    const mail = (settings?.mailSettings as Record<string, any>) || {};
    if (mail.smtpHost) host = mail.smtpHost;
    if (mail.smtpPort) port = mail.smtpPort;
    if (mail.smtpUser) user = mail.smtpUser;
    if (mail.smtpPass) pass = mail.smtpPass;
    if (mail.senderName) senderName = mail.senderName;
    if (mail.senderEmail) senderEmail = mail.senderEmail;
    if (mail.encryption === 'ssl') secure = true;
    if (mail.encryption === 'tls') requireTLS = true;
  } catch {
    // DB unavailable — fall back to env vars
  }

  const from = process.env.EMAIL_FROM || `${senderName} <${senderEmail}>`;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user ? { user, pass } : undefined,
    ...(requireTLS ? { requireTLS: true } : {}),
  });

  cachedTransporter = transporter;
  cachedFrom = from;
  cacheExpiry = now + CACHE_TTL;

  return { transporter, from };
}

/** Invalidate the cached transporter (e.g. after settings update). */
export function invalidateMailCache(): void {
  cachedTransporter = null;
  cacheExpiry = 0;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  if (process.env.NODE_ENV === 'test') return;

  try {
    const { transporter, from } = await getMailConfig();
    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  } catch (err) {
    emailLogger.error({ err }, 'Failed to send email');
  }
}

// Email Templates

export function orderConfirmationEmail(order: {
  orderNumber: string;
  orderType: string;
  total: number;
  items: { name: string; quantity: number; subtotal: number }[];
}): { subject: string; html: string } {
  const itemRows = order.items.map((i) =>
    `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.quantity}x ${i.name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${i.subtotal.toFixed(2)}</td></tr>`
  ).join('');

  return {
    subject: `Order Confirmed - #${order.orderNumber}`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:sans-serif">
        <div style="background:#f97316;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0">
          <h1 style="margin:0;font-size:24px">KitchenAsty</h1>
        </div>
        <div style="padding:24px;background:white;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <h2 style="margin:0 0 8px">Order Confirmed!</h2>
          <p style="color:#6b7280;margin:0 0 16px">Thank you for your order <strong>#${order.orderNumber}</strong>.</p>
          <p style="margin:0 0 16px">Type: <strong>${order.orderType}</strong></p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
            <thead><tr><th style="padding:8px;text-align:left;border-bottom:2px solid #e5e7eb">Item</th><th style="padding:8px;text-align:right;border-bottom:2px solid #e5e7eb">Price</th></tr></thead>
            <tbody>${itemRows}</tbody>
            <tfoot><tr><td style="padding:8px;font-weight:bold">Total</td><td style="padding:8px;text-align:right;font-weight:bold;color:#f97316">$${order.total.toFixed(2)}</td></tr></tfoot>
          </table>
          <p style="color:#6b7280;font-size:14px">We'll notify you when your order status changes.</p>
        </div>
      </div>
    `,
  };
}

export function orderStatusEmail(order: {
  orderNumber: string;
  status: string;
}): { subject: string; html: string } {
  const statusMessages: Record<string, string> = {
    CONFIRMED: 'Your order has been confirmed and will be prepared soon.',
    PREPARING: 'Your order is now being prepared!',
    READY: 'Your order is ready!',
    OUT_FOR_DELIVERY: 'Your order is on its way!',
    DELIVERED: 'Your order has been delivered. Enjoy!',
    PICKED_UP: 'Your order has been picked up. Enjoy!',
    CANCELLED: 'Your order has been cancelled.',
  };

  return {
    subject: `Order #${order.orderNumber} - ${order.status.replace(/_/g, ' ')}`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:sans-serif">
        <div style="background:#f97316;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0">
          <h1 style="margin:0;font-size:24px">KitchenAsty</h1>
        </div>
        <div style="padding:24px;background:white;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <h2 style="margin:0 0 8px">Order Update</h2>
          <p style="color:#6b7280;margin:0 0 16px">Order <strong>#${order.orderNumber}</strong></p>
          <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin-bottom:16px">
            <p style="margin:0;font-size:18px;font-weight:bold">${order.status.replace(/_/g, ' ')}</p>
            <p style="margin:8px 0 0;color:#6b7280">${statusMessages[order.status] || 'Your order status has been updated.'}</p>
          </div>
        </div>
      </div>
    `,
  };
}

export function staffInvitationEmail(invite: {
  email: string;
  role: string;
  inviteLink: string;
}): { subject: string; html: string } {
  return {
    subject: 'You\'re Invited to Join KitchenAsty',
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:sans-serif">
        <div style="background:#f97316;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0">
          <h1 style="margin:0;font-size:24px">KitchenAsty</h1>
        </div>
        <div style="padding:24px;background:white;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <h2 style="margin:0 0 8px">You're Invited!</h2>
          <p style="color:#6b7280;margin:0 0 16px">You've been invited to join the KitchenAsty team as <strong>${invite.role.replace(/_/g, ' ')}</strong>.</p>
          <div style="text-align:center;margin:24px 0">
            <a href="${invite.inviteLink}" style="display:inline-block;background:#f97316;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Accept Invitation</a>
          </div>
          <p style="color:#6b7280;font-size:14px">This invitation expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  };
}

export function reservationConfirmationEmail(reservation: {
  date: string;
  time: string;
  partySize: number;
  locationName: string;
}): { subject: string; html: string } {
  return {
    subject: `Reservation Confirmed - ${reservation.locationName}`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:sans-serif">
        <div style="background:#f97316;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0">
          <h1 style="margin:0;font-size:24px">KitchenAsty</h1>
        </div>
        <div style="padding:24px;background:white;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <h2 style="margin:0 0 16px">Reservation Confirmed!</h2>
          <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin-bottom:16px">
            <p style="margin:0 0 8px"><strong>Location:</strong> ${reservation.locationName}</p>
            <p style="margin:0 0 8px"><strong>Date:</strong> ${reservation.date}</p>
            <p style="margin:0 0 8px"><strong>Time:</strong> ${reservation.time}</p>
            <p style="margin:0"><strong>Party Size:</strong> ${reservation.partySize} guests</p>
          </div>
          <p style="color:#6b7280;font-size:14px">We look forward to seeing you!</p>
        </div>
      </div>
    `,
  };
}
