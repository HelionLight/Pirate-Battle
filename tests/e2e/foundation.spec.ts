import { expect, test } from '@playwright/test';

test('shows the main menu and saves options', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();

  await page.getByRole('button', { name: 'Options' }).click();
  await page.getByLabel('Match duration (seconds)').fill('150');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('status')).toHaveText('Options saved.');
  await expect(page.evaluate(() => localStorage.getItem('pirate-battle:options'))).resolves.toContain('150');
});
