import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/db.js', () => ({ default: {} }));

import { verifyPayUSignature } from '../../lib/payu.js';

describe('verifyPayUSignature', () => {
  it('verifies the signature over the exact notification body and second key', () => {
    const body = '{ "order": { "status": "COMPLETED" } }';
    const secondKey = 'test-second-key';
    const signature = createHash('md5').update(body + secondKey).digest('hex');

    expect(verifyPayUSignature(
      body,
      `sender=checkout;signature=${signature};algorithm=MD5;content=DOCUMENT`,
      secondKey,
    )).toBe(true);
  });

  it('rejects a changed body, key, or unsupported signature algorithm', () => {
    const body = '{"order":{"status":"COMPLETED"}}';
    const signature = createHash('md5').update(body + 'second-key').digest('hex');

    expect(verifyPayUSignature(
      `${body} `,
      `signature=${signature};algorithm=MD5`,
      'second-key',
    )).toBe(false);
    expect(verifyPayUSignature(
      body,
      `signature=${signature};algorithm=SHA-1`,
      'second-key',
    )).toBe(false);
    expect(verifyPayUSignature(body, undefined, 'second-key')).toBe(false);
  });
});
