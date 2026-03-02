import { test, expect } from '@playwright/test';

test.describe('Storefront Locations Page', () => {
  test('displays locations page heading', async ({ page }) => {
    await page.goto('/locations');
    await expect(page.getByRole('heading', { name: 'Our Locations' })).toBeVisible();
  });

  test('displays locations description', async ({ page }) => {
    await page.goto('/locations');
    await expect(page.getByText('Find a KitchenAsty near you')).toBeVisible();
  });

  test('navigating to locations from header', async ({ page }) => {
    await page.goto('/');
    // Retry the click in case the template swap detaches the nav element
    await expect(async () => {
      await page.getByRole('navigation').getByRole('link', { name: 'Locations' }).click();
      await expect(page).toHaveURL('/locations', { timeout: 2000 });
    }).toPass({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Our Locations' })).toBeVisible();
  });
});
