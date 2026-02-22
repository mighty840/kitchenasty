import { test, expect } from './fixtures.js';

test.describe('Kitchen Display', () => {
  test('loads the kitchen display page', async ({ page }) => {
    await page.goto('/kitchen');
    await expect(page.getByText('Kitchen Display')).toBeVisible();
  });

  test('displays four status columns', async ({ page }) => {
    await page.goto('/kitchen');
    await expect(page.getByRole('heading', { name: 'New' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Confirmed' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Preparing' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ready' })).toBeVisible();
  });

  test('has refresh button', async ({ page }) => {
    await page.goto('/kitchen');
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();
  });

  test('shows connection status', async ({ page }) => {
    await page.goto('/kitchen');
    // Should show either Live or Disconnected
    const statusText = page.getByText(/Live|Disconnected/);
    await expect(statusText).toBeVisible();
  });

  test('sidebar has kitchen link', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Kitchen' })).toBeVisible();
  });
});
