import { test, expect, type Page } from '@playwright/test';
import en from '../../packages/admin/src/i18n/locales/en.json';
import es from '../../packages/admin/src/i18n/locales/es.json';
import fr from '../../packages/admin/src/i18n/locales/fr.json';
import de from '../../packages/admin/src/i18n/locales/de.json';
import it from '../../packages/admin/src/i18n/locales/it.json';
import pt from '../../packages/admin/src/i18n/locales/pt.json';
import pl from '../../packages/admin/src/i18n/locales/pl.json';
import ru from '../../packages/admin/src/i18n/locales/ru.json';

async function authenticate(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'i18n-test-token');
  });
  await page.route('**/api/auth/me', (route) => route.fulfill({
    json: {
      success: true,
      data: { user: { id: 'staff-1', name: 'Test Admin', email: 'admin@example.com', role: 'SUPER_ADMIN' } },
    },
  }));
  await page.route('**/api/dashboard', (route) => route.fulfill({
    json: { success: true, data: { pendingOrders: 0 } },
  }));
}

test('login translations update in every language without resetting form state', async ({ page }) => {
  await page.goto('/');
  const email = page.locator('input[type="email"]');
  await email.fill('staff@example.com');

  for (const [code, locale] of Object.entries({ en, es, fr, de, it, pt, pl, ru })) {
    await page.locator('select').first().selectOption(code);
    await expect(page.getByRole('heading', { name: locale.pages.login.sign_in, exact: true })).toBeVisible();
    await expect(email).toHaveValue('staff@example.com');
    await expect(page.locator('html')).toHaveAttribute('lang', code);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('language'))).toBe(code);
  }

  await page.reload();
  await expect(page.getByRole('heading', { name: ru.pages.login.sign_in, exact: true })).toBeVisible();
});

test('location form and weekdays update while unsaved input is preserved', async ({ page }) => {
  await authenticate(page);
  await page.goto('/locations/new');
  const name = page.locator('main input[type="text"]').first();
  await name.fill('Unsaved restaurant');
  await expect(page.getByText(en.days.sunday, { exact: true })).toBeVisible();

  for (const [code, locale] of Object.entries({ pl, ru, en })) {
    await page.locator('header select').selectOption(code);
    await expect(page.getByRole('heading', { name: locale.pages.location_form.new_location, exact: true })).toBeVisible();
    await expect(page.getByText(locale.days.sunday, { exact: true })).toBeVisible();
    await expect(name).toHaveValue('Unsaved restaurant');
  }
});

test('nested star rating accessibility text reacts to language changes', async ({ page }) => {
  await authenticate(page);
  await page.route('**/api/reviews?*', (route) => route.fulfill({
    json: {
      success: true,
      data: [{
        id: 'review-1',
        rating: 4,
        comment: 'Sample review',
        isApproved: true,
        createdAt: '2026-01-01T12:00:00Z',
        customer: { id: 'customer-1', name: 'Sample Customer' },
        location: { id: 'location-1', name: 'Sample Restaurant' },
      }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    },
  }));
  await page.goto('/reviews');
  await expect(page.getByLabel(en.a11y.ratingOutOfFive.replace('{{rating}}', '4'), { exact: true })).toBeVisible();
  await page.locator('header select').selectOption('pl');
  await expect(page.getByLabel(pl.a11y.ratingOutOfFive.replace('{{rating}}', '4'), { exact: true })).toBeVisible();
});

test('status helper uses the component translation function', async ({ page }) => {
  await authenticate(page);
  await page.route('**/api/orders/order-1', (route) => route.fulfill({
    json: {
      success: true,
      data: {
        id: 'order-1',
        orderNumber: 'TEST-1',
        orderType: 'PICKUP',
        status: 'PENDING',
        subtotal: 10,
        tax: 0,
        deliveryFee: 0,
        discount: 0,
        total: 10,
        comment: null,
        scheduledAt: null,
        createdAt: '2026-01-01T12:00:00Z',
        customer: null,
        location: { id: 'location-1', name: 'Sample Restaurant' },
        items: [],
      },
    },
  }));
  await page.goto('/orders/order-1');
  await expect(page.locator('main').getByText(en.status.pending, { exact: true }).first()).toBeVisible();
  await page.locator('header select').selectOption('ru');
  await expect(page.locator('main').getByText(ru.status.pending, { exact: true }).first()).toBeVisible();
});

test('nested reservation empty state updates when language changes', async ({ page }) => {
  await authenticate(page);
  await page.route('**/api/locations', (route) => route.fulfill({
    json: { success: true, data: [] },
  }));
  await page.route('**/api/reservations/analytics?*', (route) => route.fulfill({
    json: {
      success: true,
      data: {
        summary: {
          totalReservations: 0,
          totalGuests: 0,
          avgPartySize: 0,
          completionRate: 0,
          rangeStart: '2026-01-01',
          rangeEnd: '2026-01-31',
        },
        dailyBookings: [],
        dayOfWeekDistribution: [],
        partySizeDistribution: [],
        statusDistribution: [],
        hourlyDistribution: [],
        leadTimeBuckets: [],
      },
    },
  }));
  await page.goto('/reservations/trends');
  await expect(page.getByText(en.pages.reservation_trends.no_reservations_in_this_window, { exact: true }).first()).toBeVisible();
  await page.locator('header select').selectOption('pl');
  await expect(page.getByText(pl.pages.reservation_trends.no_reservations_in_this_window, { exact: true }).first()).toBeVisible();
});
