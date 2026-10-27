import { createHash, timingSafeEqual } from 'node:crypto';
import prisma from './db.js';

export interface PayUConfig {
  posId: string;
  clientSecret: string;
  secondKey: string;
  baseUrl: string;
}

interface PayUOrderInput {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customerIp: string;
  continueUrl: string;
  notifyUrl: string;
  buyer?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  };
}

interface PayUOrderResponse {
  status?: { statusCode?: string; statusDesc?: string };
  redirectUri?: string;
  orderId?: string;
}

export async function getPayUConfig(): Promise<PayUConfig> {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
  const payment = (settings?.paymentSettings as Record<string, unknown> | null) ?? {};
  const posId = (payment.payuPosId as string) || process.env.PAYU_POS_ID || '';
  const clientSecret = (payment.payuClientSecret as string) || process.env.PAYU_CLIENT_SECRET || '';
  const secondKey = (payment.payuSecondKey as string) || process.env.PAYU_SECOND_KEY || '';
  const sandbox = typeof payment.payuSandbox === 'boolean'
    ? payment.payuSandbox
    : process.env.PAYU_SANDBOX !== 'false';

  return {
    posId,
    clientSecret,
    secondKey,
    baseUrl: sandbox ? 'https://secure.snd.payu.com' : 'https://secure.payu.com',
  };
}

async function getAccessToken(config: PayUConfig): Promise<string> {
  if (!config.posId || !config.clientSecret) {
    throw new Error('PayU POS ID and client secret are not configured');
  }

  const response = await fetch(`${config.baseUrl}/pl/standard/user/oauth/authorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.posId,
      client_secret: config.clientSecret,
    }),
  });
  const data = await response.json() as { access_token?: string; error_description?: string };

  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || `PayU authentication failed (${response.status})`);
  }
  return data.access_token;
}

export async function createPayUOrder(input: PayUOrderInput): Promise<{ id: string; redirectUrl: string }> {
  const config = await getPayUConfig();
  const accessToken = await getAccessToken(config);
  const totalAmount = String(Math.round(input.amount * 100));

  const response = await fetch(`${config.baseUrl}/api/v2_1/orders`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      continueUrl: input.continueUrl,
      notifyUrl: input.notifyUrl,
      customerIp: input.customerIp,
      merchantPosId: config.posId,
      description: `KitchenAsty order ${input.orderNumber}`,
      extOrderId: input.orderId,
      currencyCode: input.currency.toUpperCase(),
      totalAmount,
      products: [{
        name: `Order ${input.orderNumber}`,
        unitPrice: totalAmount,
        quantity: '1',
      }],
      ...(input.buyer && { buyer: input.buyer }),
    }),
  });

  const acceptedStatus = [200, 201, 302].includes(response.status);
  const responseText = await response.text();
  let data: PayUOrderResponse = {};
  if (responseText) {
    try {
      data = JSON.parse(responseText) as PayUOrderResponse;
    } catch {
      if (!acceptedStatus) {
        throw new Error(`PayU order creation failed (${response.status})`);
      }
    }
  }

  const redirectUrl = data.redirectUri || response.headers.get('location') || '';
  if (!acceptedStatus || !data.orderId || !redirectUrl) {
    const message = data.status?.statusDesc || data.status?.statusCode;
    throw new Error(message || `PayU order creation failed (${response.status})`);
  }

  return { id: data.orderId, redirectUrl };
}

export function verifyPayUSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secondKey: string,
): boolean {
  if (!signatureHeader || !secondKey) return false;

  const fields = Object.fromEntries(
    signatureHeader.split(';').map((part) => {
      const separator = part.indexOf('=');
      return separator < 0
        ? ['', '']
        : [part.slice(0, separator).trim().toLowerCase(), part.slice(separator + 1).trim()];
    }).filter(([key]) => key),
  );
  const algorithm = fields.algorithm?.toUpperCase();
  const digestAlgorithms: Record<string, string> = {
    MD5: 'md5',
    'SHA-256': 'sha256',
    'SHA-384': 'sha384',
    'SHA-512': 'sha512',
  };
  const digestAlgorithm = algorithm ? digestAlgorithms[algorithm] : undefined;
  const signature = fields.signature;
  if (!digestAlgorithm || !signature || !/^[a-f\d]+$/i.test(signature)) return false;

  const expected = createHash(digestAlgorithm).update(rawBody + secondKey, 'utf8').digest();
  const received = Buffer.from(signature, 'hex');
  return received.length === expected.length && timingSafeEqual(received, expected);
}
