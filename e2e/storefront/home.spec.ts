import { test, expect } from '@playwright/test';

test.describe('Storefront Home Page', () => {
  test('loads the storefront home page', async ({ page }) => {
    await page.goto('/');
    // Title comes from DB seed — accept either seeded or default
    await expect(page).toHaveTitle(/Saffron & Sage|KitchenAsty/);
  });

  test('displays header with brand name', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header');
    await expect(header).toBeVisible();
    // Brand name comes from DB seed
    await expect(header).toContainText(/Saffron & Sage|KitchenAsty/);
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
    const heroHeading = page.locator('h1').first();
    await expect(heroHeading).toBeVisible();
    const text = await heroHeading.textContent();
    // Accept seeded or default hero titles
    expect(
      text === 'Order Delicious Food Online' ||
      text === 'Delicious food, delivered to your door' ||
      text === 'Modern Mediterranean, Rooted in Tradition'
    ).toBeTruthy();
  });

  test('displays hero CTA buttons', async ({ page }) => {
    await page.goto('/');
    // CTA text comes from DB seed — accept either seeded or default
    await expect(page.getByRole('link', { name: /View Menu|Explore Our Menu/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Find Location|Reserve a Table/ })).toBeVisible();
  });

  test('displays feature cards', async ({ page }) => {
    await page.goto('/');
    // Features come from DB seed — accept either seeded or default
    await expect(page.getByText(/Farm-to-Table|Fast Delivery/)).toBeVisible();
    await expect(page.getByText(/Seasonal Specials|Easy Ordering/)).toBeVisible();
    await expect(page.getByText(/Dine In or Deliver|Table Reservations/)).toBeVisible();
  });

  test('displays footer with links', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(/Saffron & Sage|KitchenAsty/);
    await expect(footer).toContainText('Quick Links');
    await expect(footer).toContainText('Account');
  });

  test('displays sign up CTA section', async ({ page }) => {
    await page.goto('/');
    // CTA heading and button come from DB seed — accept either seeded or default
    await expect(page.getByRole('heading', { name: /Ready to (Order|Experience)/ })).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: /Create Account|Order Now/ })).toBeVisible();
  });

  test('Login and Sign Up links visible when not authenticated', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header');
    await expect(header.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Sign Up' })).toBeVisible();
  });
});
