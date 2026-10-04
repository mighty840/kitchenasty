/**
 * Regression tests for the stored extension of uploaded files.
 *
 * The upload middleware checked the client-supplied mimetype but kept the extension from the
 * client's filename. A staff user could upload `x.html` declared as image/png, and
 * express.static would serve it from /uploads as text/html: stored XSS on the API origin.
 * The fix derives the extension from the (already allow-listed) mimetype.
 *
 * Both cases fail on unpatched code: the stored filename ends in .html / .svg.
 *
 * Reported privately by kta1kri.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import request from 'supertest';
import { createApp } from '../../app.js';
import { generateToken } from '../../middleware/auth.js';

vi.mock('../../lib/db.js', () => {
  const mockPrisma = {
    mediaAsset: { create: vi.fn() },
    user: { findUnique: vi.fn() },
    customer: { findUnique: vi.fn() },
  };
  return { default: mockPrisma, prisma: mockPrisma };
});

import prisma from '../../lib/db.js';
const mockedPrisma = vi.mocked(prisma);

const app = createApp();
const staffToken = generateToken({ id: 'user-1', email: 'staff@test.com', type: 'staff', role: 'STAFF' });
const uploadsDir = path.resolve(process.cwd(), 'uploads');

function storedFilename(): string {
  return (mockedPrisma.mediaAsset.create.mock.calls[0][0] as any).data.filename;
}

describe('POST /api/media/upload - stored extension', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await fs.mkdir(uploadsDir, { recursive: true });
    mockedPrisma.mediaAsset.create.mockImplementation((args: any) => Promise.resolve({ id: 'media-1', ...args.data }) as any);
  });

  afterEach(async () => {
    for (const call of mockedPrisma.mediaAsset.create.mock.calls) {
      await fs.unlink(path.join(uploadsDir, (call[0] as any).data.filename)).catch(() => {});
    }
  });

  it.each([
    ['x.html', 'image/png', '.png'],
    ['x.svg', 'image/jpeg', '.jpg'],
  ])('stores %s declared as %s with extension %s', async (filename, contentType, ext) => {
    const res = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${staffToken}`)
      .attach('file', Buffer.from('<script>alert(1)</script>'), { filename, contentType });

    expect(res.status).toBe(201);
    expect(path.extname(storedFilename())).toBe(ext);
  });

  it('still rejects a non-image mimetype', async () => {
    const res = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${staffToken}`)
      .attach('file', Buffer.from('<script>alert(1)</script>'), { filename: 'x.html', contentType: 'text/html' });

    expect(res.status).not.toBe(201);
    expect(mockedPrisma.mediaAsset.create).not.toHaveBeenCalled();
  });
});
