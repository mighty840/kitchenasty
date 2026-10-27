import { test, expect } from '@playwright/test';

test('checkout uses item-specific tax and automatic packaging surcharges', async ({ page }) => {
  const base = {
    slug: 'item', description: null, image: null, isActive: true, trackStock: false,
    stockQty: 0, category: { id: 'cat', name: 'Food' }, options: [], allergens: [],
    _count: { options: 0, allergens: 0, mealtimes: 0 },
  };
  const items = [
    { ...base, id: 'pizza', name: 'Test Pizza', price: 10, taxRate: 7, surchargeEnabled: true, surchargeAmount: 0.5 },
    { ...base, id: 'drink', name: 'Test Drink', price: 3, taxRate: 19, surchargeEnabled: false, surchargeAmount: 5 },
  ];
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/settings') {
      await route.fulfill({ json: { success: true, data: null } });
    } else if (path === '/api/menu/items') {
      await route.fulfill({ json: { success: true, data: items, pagination: { page: 1, totalPages: 1 } } });
    } else if (path.startsWith('/api/menu/items/')) {
      await route.fulfill({ json: { success: true, data: items.find((item) => path.endsWith(item.id)) } });
    } else {
      await route.fulfill({ json: { success: true, data: [] } });
    }
  });
  await page.goto('/menu');
  await page.getByRole('button', { name: /Test Pizza/ }).click();
  await expect(page.getByText('Includes 7% tax')).toBeVisible();
  await expect(page.getByText('Packaging/container surcharge: +$0.50 / unit')).toBeVisible();
  await page.getByRole('button', { name: /Add to Cart.*10.50/ }).click();
  await expect(page.getByRole('heading', { name: 'Your Cart' })).toBeVisible();
  await expect(page.getByText('$10.50', { exact: true }).first()).toBeVisible();
  await page.getByLabel('Close cart').click();
  await page.getByRole('button', { name: /Test Drink/ }).click();
  await expect(page.getByText('Includes 19% tax')).toBeVisible();
  await page.getByRole('button', { name: /Add to Cart.*3.00/ }).click();
  await page.getByRole('link', { name: 'Checkout', exact: true }).click();
  await expect(page.getByRole('button', { name: /Place Order.*18.49/ })).toBeVisible();
  await page.getByRole('button', { name: 'Pickup', exact: true }).click();
  await expect(page.getByRole('button', { name: /Place Order.*13.50/ })).toBeVisible();
  const summary = page.getByRole('heading', { name: 'Order Summary' }).locator('..');
  await expect(summary.getByText('Subtotal', { exact: true }).locator('..')
    .getByText('$13.50', { exact: true })).toBeVisible();
  await expect(summary.getByText('Included tax', { exact: true })).toBeVisible();
  await expect(summary.getByText('$1.13', { exact: true })).toBeVisible();
});
