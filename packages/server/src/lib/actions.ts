import { sendEmail } from './email.js';
import { automationLogger } from './logger.js';

interface Action {
  type: string;
  [key: string]: unknown;
}

export async function executeAction(
  action: Action,
  data: Record<string, unknown>
): Promise<void> {
  switch (action.type) {
    case 'email':
      await handleEmailAction(action, data);
      break;
    case 'webhook':
      await handleWebhookAction(action, data);
      break;
    case 'sms':
      await handleSmsAction(action, data);
      break;
    default:
      automationLogger.warn({ actionType: action.type }, 'Unknown action type');
  }
}

async function handleEmailAction(
  action: Action,
  data: Record<string, unknown>
): Promise<void> {
  const to = resolveRecipient(action.to as string, data);
  if (!to) return;

  const subject = interpolateTemplate(action.subject as string || 'Notification', data);
  const html = interpolateTemplate(action.body as string || action.template as string || '', data);

  await sendEmail({ to, subject, html });
}

async function handleWebhookAction(
  action: Action,
  data: Record<string, unknown>
): Promise<void> {
  const url = action.url as string;
  if (!url) return;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (err) {
    automationLogger.error({ err, url }, 'Webhook action failed');
  }
}

async function handleSmsAction(
  action: Action,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const { sendSMS } = await import('./sms.js');
    const to = resolveRecipient(action.to as string, data);
    if (!to) return;

    const body = interpolateTemplate(action.body as string || '', data);
    await sendSMS(to, body);
  } catch (err) {
    automationLogger.error({ err }, 'SMS action failed');
  }
}

function resolveRecipient(to: string | undefined, data: Record<string, unknown>): string | null {
  if (!to) return null;

  if (to === 'customer') {
    const order = data.order as Record<string, unknown> | undefined;
    if (order) {
      const customer = order.customer as Record<string, unknown> | undefined;
      if (customer?.email) return customer.email as string;
      if (order.guestEmail) return order.guestEmail as string;
      if (customer?.phone) return customer.phone as string;
    }
    return null;
  }

  // Direct email/phone
  return to;
}

function interpolateTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match, path: string) => {
    const value = path.split('.').reduce((current: unknown, key: string) => {
      if (current && typeof current === 'object') {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, data);
    return value != null ? String(value) : '';
  });
}
