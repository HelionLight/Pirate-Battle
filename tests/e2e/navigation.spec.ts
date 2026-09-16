import { expect, test } from '@playwright/test';
import { openApp } from '../helpers';

test.describe('main menu navigation', () => {
  test.beforeEach(async ({ page }) => openApp(page));

  test('shows all primary destinations', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Options', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Controls', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ranking', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Match History', exact: true })).toBeVisible();
  });

  for (const destination of [
    ['Controls', 'Controls'], ['Options', 'Options'], ['Ranking', 'Ranking'], ['Match History', 'Match History'],
  ] as const) {
    test(`opens and returns from ${destination[0]}`, async ({ page }) => {
      await page.getByRole('button', { name: destination[0], exact: true }).click();
      await expect(page.getByRole('heading', { name: destination[1], exact: true })).toBeVisible();
      await page.getByRole('button', { name: /Back to (main )?menu|Back$/ }).click();
      await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
    });
  }
  test('moves keyboard focus to the active screen heading', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main h1')).toBeFocused();
    await page.getByRole('button', { name: 'Options', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Options', exact: true })).toBeFocused();
  });
});
