import { test, expect } from '@playwright/test';

test('admin can save a per-item tax rate and enable or disable a surcharge', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'pricing-test');
    localStorage.setItem('language', 'en');
  });
  let item = {
    id: 'item', name: 'Test Pizza', slug: 'test-pizza', description: '', price: 10,
    taxRate: 8, surchargeEnabled: false, surchargeAmount: 0, isActive: true,
    sortOrder: 0, trackStock: false, stockQty: 0, categoryId: 'cat',
    options: [], allergens: [], mealtimes: [],
  };
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me') {
      await route.fulfill({ json: { success: true, data: { user: { id: 'admin', name: 'Admin', email: 'admin@test.com', role: 'SUPER_ADMIN' } } } });
    } else if (path === '/api/menu/items/item') {
      if (route.request().method() === 'PATCH') {
        item = { ...item, ...route.request().postDataJSON() };
      }
      await route.fulfill({ json: { success: true, data: item } });
    } else if (path === '/api/menu/categories') {
      await route.fulfill({ json: { success: true, data: [{ id: 'cat', name: 'Food' }] } });
    } else {
      await route.fulfill({ json: { success: true, data: [], pagination: { page: 1, totalPages: 1 } } });
    }
  });
  await page.goto('/menu/items/item');
  await expect(page.getByLabel('Tax rate (%)', { exact: true })).toHaveValue('8');
  await expect(page.getByText('Prices and option modifiers include this tax. Packaging surcharges are not taxed.')).toBeVisible();
  await expect(page.getByLabel('Surcharge per unit (not taxed)', { exact: true })).not.toBeVisible();
  await page.getByLabel('Tax rate (%)', { exact: true }).fill('7');
  await page.getByLabel('Charge a surcharge (packaging/container)', { exact: true }).check();
  await page.getByLabel('Surcharge per unit (not taxed)', { exact: true }).fill('0.5');
  await page.getByRole('button', { name: 'Update Item', exact: true }).click();
  await expect(page).toHaveURL(/\/menu\/items$/);
  expect(item).toMatchObject({ taxRate: 7, surchargeEnabled: true, surchargeAmount: 0.5 });
  await page.goto('/menu/items/item');
  await expect(page.getByLabel('Tax rate (%)', { exact: true })).toHaveValue('7');
  await expect(page.getByLabel('Surcharge per unit (not taxed)', { exact: true })).toHaveValue('0.5');
  await page.getByLabel('Charge a surcharge (packaging/container)', { exact: true }).uncheck();
  await page.getByRole('button', { name: 'Update Item', exact: true }).click();
  await expect(page).toHaveURL(/\/menu\/items$/);
  expect(item).toMatchObject({ taxRate: 7, surchargeEnabled: false, surchargeAmount: 0.5 });
});
