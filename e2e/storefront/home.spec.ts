import { test, expect } from '@playwright/test';

test.describe('Storefront Home Page', () => {
  test('loads the storefront home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('KitchenAsty - Order Online');
  });

  test('displays header with brand name', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header).toContainText('KitchenAsty');
  });

  test('displays desktop navigation links', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Locations' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Menu' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Reservations' })).toBeVisible();
  });

  test('displays hero section with heading', async ({ page }) => {
    await page.goto('/');
    // The hero title comes from DB settings if seeded, otherwise falls back to the i18n default
    const heroHeading = page.locator('h1').first();
    await expect(heroHeading).toBeVisible();
    const text = await heroHeading.textContent();
    expect(
      text === 'Order Delicious Food Online' ||
      text === 'Delicious food, delivered to your door'
    ).toBeTruthy();
  });

  test('displays hero CTA buttons', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'View Menu' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Find Location' })).toBeVisible();
  });

  test('displays feature cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Fast Delivery')).toBeVisible();
    await expect(page.getByText('Easy Ordering')).toBeVisible();
    await expect(page.getByText('Table Reservations')).toBeVisible();
  });

  test('displays footer with links', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('KitchenAsty');
    await expect(footer).toContainText('Quick Links');
    await expect(footer).toContainText('Account');
  });

  test('displays sign up CTA section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Ready to Order?' })).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: 'Create Account' })).toBeVisible();
  });

  test('Login and Sign Up links visible when not authenticated', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header');
    await expect(header.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Sign Up' })).toBeVisible();
  });
});
