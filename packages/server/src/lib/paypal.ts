import prisma from './db.js';

async function getPayPalConfig(): Promise<{ clientId: string; clientSecret: string; baseUrl: string }> {
  let clientId = process.env.PAYPAL_CLIENT_ID || '';
  let clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
  let sandbox = process.env.PAYPAL_SANDBOX === 'true';

  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
    const payment = (settings?.paymentSettings as Record<string, any>) || {};
    if (payment.paypalClientId) clientId = payment.paypalClientId;
    if (payment.paypalClientSecret) clientSecret = payment.paypalClientSecret;
    if (payment.paypalSandbox !== undefined) sandbox = payment.paypalSandbox;
  } catch {
    // DB unavailable — fall back to env vars
  }

  const baseUrl = sandbox
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

  return { clientId, clientSecret, baseUrl };
}

async function getAccessToken(): Promise<{ token: string; baseUrl: string }> {
  const { clientId, clientSecret, baseUrl } = await getPayPalConfig();

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json() as { access_token: string };
  return { token: data.access_token, baseUrl };
}

export async function createPayPalOrder(amount: number, orderNumber: string, currency = 'USD'): Promise<{ id: string; approvalUrl: string }> {
  const { token: accessToken, baseUrl } = await getAccessToken();

  const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: orderNumber,
        amount: {
          currency_code: currency.toUpperCase(),
          value: amount.toFixed(2),
        },
      }],
    }),
  });

  const data = await res.json() as { id: string; links: Array<{ rel: string; href: string }> };
  const approvalUrl = data.links?.find((l: any) => l.rel === 'approve')?.href || '';

  return { id: data.id, approvalUrl };
}

export async function capturePayPalOrder(paypalOrderId: string): Promise<{ status: string; id: string }> {
  const { token: accessToken, baseUrl } = await getAccessToken();

  const res = await fetch(`${baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await res.json() as { status: string; id: string };
  return data;
}
