/**
 * The JWT signing secret must fail closed. The server used to fall back to a constant
 * published in the repo, and the shipped compose file and .env.example set another one, so
 * anyone could mint an admin token for a deployment that kept the defaults (CWE-798 /
 * CWE-1188). Reported privately by kta1kri.
 */
import { describe, it, expect } from 'vitest';
import { resolveJwtSecret } from '../../middleware/auth.js';

describe('resolveJwtSecret', () => {
  it('returns a configured secret', () => {
    expect(resolveJwtSecret({ JWT_SECRET: 'a1b2c3d4e5f6' })).toBe('a1b2c3d4e5f6');
  });

  it('throws when the secret is unset outside tests', () => {
    expect(() => resolveJwtSecret({ NODE_ENV: 'production' })).toThrow(/not set/);
    expect(() => resolveJwtSecret({ NODE_ENV: 'development', JWT_SECRET: '  ' })).toThrow(/not set/);
  });

  it.each([
    'dev-secret-change-me',
    'change-this-to-a-random-secret',
    'your-random-secret-here',
    'CHANGE_ME_to_a_random_secret_here',
  ])('throws on the shipped placeholder %s', (secret) => {
    expect(() => resolveJwtSecret({ JWT_SECRET: secret, NODE_ENV: 'test' })).toThrow(/placeholder/);
  });

  it('has no fallback under NODE_ENV=test', () => {
    expect(() => resolveJwtSecret({ NODE_ENV: 'test' })).toThrow(/not set/);
  });
});
