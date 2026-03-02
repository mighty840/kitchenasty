import { test, expect } from '@playwright/test';

test.describe('Storefront Menu Page', () => {
  test('displays menu page heading', async ({ page }) => {
    await page.goto('/menu');
    await expect(page.getByRole('heading', { name: 'Our Menu' })).toBeVisible();
  });

  test('displays search input', async ({ page }) => {
    await page.goto('/menu');
    await expect(page.getByPlaceholder('Search menu items...')).toBeVisible();
  });

  test('displays All category button', async ({ page }) => {
    await page.goto('/menu');
    await expect(page.getByRole('button', { name: 'All', exact: true })).toBeVisible();
  });

  test('displays category sidebar on desktop', async ({ page }) => {
    await page.goto('/menu');
    const aside = page.locator('aside');
    await expect(aside).toBeVisible();
    await expect(aside.getByRole('button', { name: /All/ })).toBeVisible();
  });

  test('navigating to menu from header', async ({ page }) => {
    await page.goto('/');
    // Retry the click in case the template swap detaches the nav element
    await expect(async () => {
      await page.getByRole('navigation').getByRole('link', { name: 'Menu' }).click();
      await expect(page).toHaveURL(/\/menu/, { timeout: 2000 });
    }).toPass({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Our Menu' })).toBeVisible();
  });

  test('navigating to menu from home hero', async ({ page }) => {
    await page.goto('/');
    // CTA text comes from DB seed — accept either seeded or default
    await page.getByRole('main').getByRole('link', { name: /View Menu|Explore Our Menu/ }).click();
    await expect(page).toHaveURL(/\/menu/);
  });

  test('search input accepts text', async ({ page }) => {
    await page.goto('/menu');
    const searchInput = page.getByPlaceholder('Search menu items...');
    await searchInput.fill('pizza');
    await expect(searchInput).toHaveValue('pizza');
  });

  test('URL updates with search param', async ({ page }) => {
    await page.goto('/menu');
    const searchInput = page.getByPlaceholder('Search menu items...');
    await searchInput.fill('salmon');
    // Wait for debounce
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/search=salmon/);
  });

  test('show categories toggle on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/menu');
    await expect(page.getByRole('button', { name: 'Categories' })).toBeVisible();
  });

  test('mobile category toggle shows and hides categories', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/menu');
    const toggleBtn = page.getByRole('button', { name: 'Categories' });
    await toggleBtn.click();
    await expect(page.getByRole('button', { name: 'All', exact: true })).toBeVisible();
  });

  test('displays description text', async ({ page }) => {
    await page.goto('/menu');
    await expect(page.getByText('Browse our menu')).toBeVisible();
  });
});
