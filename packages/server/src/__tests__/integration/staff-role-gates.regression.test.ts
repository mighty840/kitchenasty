/**
 * Write routes behind the admin UI's Design, Legal, Settings and Coupons pages accepted any
 * staff token, while the UI only shows those pages to MANAGER and SUPER_ADMIN. A STAFF account
 * calling the API directly could rewrite storefront branding and legal pages, manage the
 * gallery and media library, or create coupons. These routes now require MANAGER or above.
 *
 * Every STAFF case fails on unpatched code (the request gets past the role check).
 *
 * Found while reviewing a private report by kta1kri.
 */
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { generateToken } from '../../middleware/auth.js';

vi.mock('../../lib/db.js', () => {
  // Every model method resolves to a stub row; the role check must reject before any of it runs.
  const model = () => new Proxy({}, { get: () => vi.fn().mockResolvedValue({ id: 'stub' }) });
  const mockPrisma = new Proxy({}, { get: () => model() });
  return { default: mockPrisma, prisma: mockPrisma };
});

const app = createApp();
const staffToken = generateToken({ id: 'staff-1', email: 'staff@test.com', type: 'staff', role: 'STAFF' });
const managerToken = generateToken({ id: 'mgr-1', email: 'manager@test.com', type: 'staff', role: 'MANAGER' });

const routes: Array<[string, string]> = [
  ['put', '/api/settings'],
  ['post', '/api/settings/logo'],
  ['post', '/api/settings/favicon'],
  ['post', '/api/gallery'],
  ['patch', '/api/gallery/g-1'],
  ['delete', '/api/gallery/g-1'],
  ['post', '/api/media/upload'],
  ['delete', '/api/media/m-1'],
  ['post', '/api/legal/cookie-categories'],
  ['patch', '/api/legal/cookie-categories/c-1'],
  ['delete', '/api/legal/cookie-categories/c-1'],
  ['put', '/api/legal/imprint'],
  ['post', '/api/coupons'],
  ['patch', '/api/coupons/cp-1'],
];

describe('MANAGER+ write routes', () => {
  it.each(routes)('%s %s rejects STAFF with 403', async (method, url) => {
    const res = await (request(app) as any)[method](url).set('Authorization', `Bearer ${staffToken}`).send({});
    expect(res.status).toBe(403);
  });

  it('still lets MANAGER update site settings', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ siteName: 'Kitchen' });
    expect(res.status).toBe(200);
  });
});
