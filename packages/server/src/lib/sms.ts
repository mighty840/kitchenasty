import { smsLogger } from './logger.js';

let twilioClient: any = null;

function getClient() {
  if (twilioClient) return twilioClient;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return null;
  }

  try {
    // Dynamic import to avoid requiring twilio when not configured
    const twilio = require('twilio');
    twilioClient = twilio(accountSid, authToken);
    return twilioClient;
  } catch {
    smsLogger.warn('Twilio package not installed. SMS sending disabled.');
    return null;
  }
}

export async function sendSMS(to: string, body: string): Promise<void> {
  if (process.env.NODE_ENV === 'test') return;

  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  if (!fromNumber) {
    smsLogger.warn('TWILIO_FROM_NUMBER not configured. SMS not sent.');
    return;
  }

  const client = getClient();
  if (!client) {
    smsLogger.warn('Twilio not configured. SMS not sent.');
    return;
  }

  try {
    await client.messages.create({
      body,
      from: fromNumber,
      to,
    });
  } catch (err) {
    smsLogger.error({ err }, 'Failed to send SMS');
  }
}
