import { NextFunction, Request, Response } from 'express';
import prisma from './db.js';

export const paymentMethodNames = ['cash', 'stripe', 'paypal', 'payu'] as const;
export type PaymentMethodName = typeof paymentMethodNames[number];
export type PaymentMethodAvailability = Record<PaymentMethodName, boolean>;

export async function getPaymentMethodAvailability(): Promise<PaymentMethodAvailability> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: 'default' },
  });
  const configured = settings?.paymentSettings as Record<string, unknown> | null;

  return {
    cash: configured?.cashEnabled === true,
    stripe: configured?.stripeEnabled === true,
    paypal: configured?.paypalEnabled === true,
    payu: configured?.payuEnabled === true,
  };
}

export async function isPaymentMethodEnabled(method: PaymentMethodName): Promise<boolean> {
  const availability = await getPaymentMethodAvailability();
  return availability[method];
}

export function requirePaymentMethodEnabled(method: PaymentMethodName) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    void getPaymentMethodAvailability()
      .then((availability) => {
        if (!availability[method]) {
          res.status(403).json({ success: false, error: `${method} payments are disabled` });
          return;
        }
        next();
      })
      .catch(next);
  };
}
