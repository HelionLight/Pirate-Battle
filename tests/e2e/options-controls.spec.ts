import { expect, test } from '@playwright/test';
import { openApp } from '../helpers';

test('documents keyboard, simultaneous, and touch controls', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Controls', exact: true }).click();
  await expect(page.locator('dt', { hasText: 'Forward' })).toBeVisible();
  await expect(page.locator('dt', { hasText: 'Backward' })).toBeVisible();
  await expect(page.locator('dt', { hasText: 'Rotate left' })).toBeVisible();
  await expect(page.locator('dt', { hasText: 'Rotate right' })).toBeVisible();
  await expect(page.locator('dt', { hasText: 'Front shot' }).first()).toBeVisible();
  await expect(page.locator('dt', { hasText: 'Left broadside' }).first()).toBeVisible();
  await expect(page.locator('dt', { hasText: 'Right broadside' }).first()).toBeVisible();
  await expect(page.getByText(/sail, rotate, and fire at the same time/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Touch', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back to main menu', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
});

test('validates and persists options', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  const duration = page.getByLabel('Match duration (seconds)');
  const interval = page.getByLabel('Enemy spawn interval (seconds)');
  await duration.fill('30');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Match duration must be between 60 and 180 seconds.')).toBeVisible();
  await duration.fill('150');
  await interval.fill('2.5');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Options saved.');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(duration).toHaveValue('150');
  await expect(interval).toHaveValue('2.5');
});
