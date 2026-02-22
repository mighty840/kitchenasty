# 🧪 Testing

KitchenAsty has three levels of testing: unit, integration, and end-to-end.

## 📁 Test Structure

```
packages/server/src/__tests__/
├── unit/           # Unit tests (no database)
└── integration/    # Integration tests (uses database)

e2e/                # Playwright E2E tests
```

## ▶️ Running Tests

```bash
# All tests (unit + integration)
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests
npm run test:e2e

# Shared package tests
npm run test -w packages/shared

# Server unit tests
npm run test:unit -w packages/server

# Server integration tests
npm run test:integration -w packages/server
```

## 🔧 Test Frameworks

| Level | Framework | Location |
|-------|-----------|----------|
| 🧩 Unit | Vitest | `packages/server/src/__tests__/unit/` |
| 🔗 Integration | Vitest | `packages/server/src/__tests__/integration/` |
| 📦 Shared | Vitest | `packages/shared/src/__tests__/` |
| 🌐 E2E | Playwright | `e2e/` |

## ✍️ Writing Tests

### 🧩 Unit Tests

Unit tests cover individual functions without external dependencies:

```typescript
import { describe, it, expect } from 'vitest';
import { calculateTotal } from '../utils';

describe('calculateTotal', () => {
  it('sums items correctly', () => {
    const items = [
      { quantity: 2, unitPrice: 10.00 },
      { quantity: 1, unitPrice: 5.00 },
    ];
    expect(calculateTotal(items)).toBe(25.00);
  });
});
```

### 🔗 Integration Tests

Integration tests use a real PostgreSQL database:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../../app';
import request from 'supertest';

describe('POST /api/auth/customer/register', () => {
  const app = createApp();

  it('creates a new customer', async () => {
    const res = await request(app)
      .post('/api/auth/customer/register')
      .send({ name: 'Test', email: 'test@example.com', password: 'pass123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });
});
```

### 🌐 E2E Tests

Playwright tests exercise the full stack through the browser:

```typescript
import { test, expect } from '@playwright/test';

test('customer can place an order', async ({ page }) => {
  await page.goto('http://localhost:5174');
  // Navigate, add items, checkout...
  await expect(page.locator('.order-confirmation')).toBeVisible();
});
```

## 🔄 CI Pipeline

Tests run automatically on every push and pull request. See [CI/CD](/deployment/ci-cd) for the pipeline configuration.

The CI runs:

1. 📝 TypeScript type checking
2. 🧩 Unit tests
3. 🔗 Integration tests
4. 🌐 E2E tests (with a PostgreSQL service container)
5. 🔒 Security audit
