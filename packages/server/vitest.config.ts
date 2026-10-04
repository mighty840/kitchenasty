import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Set before dotenv runs, so a developer's local .env never decides the test secret.
    env: { JWT_SECRET: 'vitest-jwt-secret' },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
