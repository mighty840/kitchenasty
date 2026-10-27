import { afterEach, describe, expect, it, vi } from 'vitest';

const { pinoMock } = vi.hoisted(() => ({
  pinoMock: vi.fn(() => ({ child: vi.fn() })),
}));

vi.mock('pino', () => ({ default: pinoMock }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  vi.resetModules();
});

describe('logger environment configuration', () => {
  it.each([
    ['development', 'debug', true],
    ['production', 'info', false],
    ['test', 'silent', false],
    [undefined, 'debug', true],
  ] as const)('configures NODE_ENV=%s', async (environment, level, pretty) => {
    vi.stubEnv('NODE_ENV', environment);
    vi.stubEnv('LOG_LEVEL', undefined);

    await import('../../lib/logger.js');

    expect(pinoMock).toHaveBeenCalledWith({
      level,
      ...(pretty ? {
        transport: { target: 'pino-pretty', options: { colorize: true } },
      } : {}),
    });
  });

  it.each([
    ['development', 'warn'],
    ['production', 'warn'],
    ['test', 'silent'],
  ])('handles LOG_LEVEL in %s', async (environment, level) => {
    vi.stubEnv('NODE_ENV', environment);
    vi.stubEnv('LOG_LEVEL', 'warn');

    await import('../../lib/logger.js');

    expect(pinoMock).toHaveBeenCalledWith(expect.objectContaining({ level }));
  });
});