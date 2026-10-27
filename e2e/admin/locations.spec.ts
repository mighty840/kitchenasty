import { test, expect } from './fixtures.js';

test.describe('Admin Locations Page', () => {
  test('navigates to locations page via sidebar', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Locations' }).click();
    await expect(page).toHaveURL('/locations');
    await expect(page.getByRole('heading', { name: 'Locations' })).toBeVisible();
  });

  test('displays Add Location button', async ({ page }) => {
    await page.goto('/locations');
    await expect(page.getByRole('link', { name: 'Add Location' })).toBeVisible();
  });

  test('navigates to new location form', async ({ page }) => {
    await page.goto('/locations');
    await page.getByRole('link', { name: 'Add Location' }).click();
    await expect(page).toHaveURL('/locations/new');
    await expect(page.getByRole('heading', { name: 'New Location' })).toBeVisible();
  });

  test('new location form has all sections', async ({ page }) => {
    await page.goto('/locations/new');

    // Sections (using heading level 3)
    await expect(page.getByText('Basic Information')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Address' })).toBeVisible();
    await expect(page.getByText('Service Settings')).toBeVisible();
    await expect(page.getByText('Operating Hours')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Delivery Zones' })).toBeVisible();
  });

  test('new location form has required fields', async ({ page }) => {
    await page.goto('/locations/new');

    await expect(page.getByText('Name *')).toBeVisible();
    await expect(page.getByText('Slug *')).toBeVisible();
    await expect(page.getByText('Street Address *')).toBeVisible();
    await expect(page.getByText('City *')).toBeVisible();
    await expect(page.getByText('Postal Code *')).toBeVisible();
  });

  test('auto-generates slug from name', async ({ page }) => {
    await page.goto('/locations/new');

    // Fill the name input (first text input in the Basic Information section)
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('Downtown Kitchen');

    // Slug input is the second text input
    const slugInput = page.locator('input[type="text"]').nth(1);
    await expect(slugInput).toHaveValue('downtown-kitchen');

    await nameInput.fill('G\u00f3rnicza');
    await expect(slugInput).toHaveValue('gornicza');

    await nameInput.fill('\u0141\u00f3d\u017a');
    await expect(slugInput).toHaveValue('lodz');
  });

  test('shows all days in operating hours', async ({ page }) => {
    await page.goto('/locations/new');

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    for (const day of days) {
      await expect(page.getByText(day)).toBeVisible();
    }
  });

  test('can add delivery zones', async ({ page }) => {
    await page.goto('/locations/new');

    await page.getByText('+ Add Zone').click();
    await expect(page.getByPlaceholder('Zone name')).toBeVisible();

    await page.getByText('+ Add Zone').click();
    const zoneInputs = page.getByPlaceholder('Zone name');
    expect(await zoneInputs.count()).toBe(2);
  });

  test('can remove delivery zones', async ({ page }) => {
    await page.goto('/locations/new');

    await page.getByText('+ Add Zone').click();
    await expect(page.getByPlaceholder('Zone name')).toBeVisible();

    await page.getByText('Remove').click();
    await expect(page.getByPlaceholder('Zone name')).not.toBeVisible();
  });

  test('back button navigates to location list', async ({ page }) => {
    await page.goto('/locations/new');
    await page.getByText('Back to Locations').click();
    await expect(page).toHaveURL('/locations');
  });

  test('sidebar highlights active Locations link', async ({ page }) => {
    await page.goto('/locations');
    const locLink = page.getByRole('link', { name: 'Locations' });
    // The active link should have the primary color class
    await expect(locLink).toHaveCSS('border-right-style', 'solid');
  });
});
