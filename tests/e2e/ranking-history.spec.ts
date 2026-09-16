import { expect, test } from '@playwright/test';
import { finishTestMatch, openApp, startGame } from '../helpers';

test('paginates ranking and history', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Ranking', exact: true }).click();
  await expect(page.getByRole('cell', { name: '#1', exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByText('Page 2')).toBeVisible();
  await page.getByRole('button', { name: 'Back to menu', exact: true }).click();

  await page.getByRole('button', { name: 'Match History', exact: true }).click();
  await expect(page.getByRole('columnheader', { name: 'End Reason', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByText('Page 2')).toBeVisible();
});

test('shows success registration in history and ranking without duplicates', async ({ page }) => {
  await startGame(page);
  await finishTestMatch(page, 'time', 4_500);
  await expect(page.getByText('Result saved', { exact: true })).toBeVisible({ timeout: 10_000 });
  const records = await page.evaluate(() => JSON.parse(localStorage.getItem('pirate-battle:completed-matches:v1') ?? '{}')) as { matches?: unknown[] };
  expect(records.matches).toHaveLength(1);
  await page.getByRole('button', { name: 'Main Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Match History', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Time Expired', exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Back to menu', exact: true }).click();
  await page.getByRole('button', { name: 'Ranking', exact: true }).click();
  await expect(page.getByRole('cell', { name: '4500', exact: true }).first()).toBeVisible();
});

for (const [scenario, expected] of [
  ['empty', /No ranking entries yet/],
  ['latency', /Loading ranking/],
  ['network-error', /Could not load ranking/],
  ['error-4xx', /Could not load ranking/],
  ['error-5xx', /Could not load ranking/],
] as const) {
  test(`handles ${scenario} ranking scenario`, async ({ page }) => {
    await openApp(page, scenario);
    await page.getByRole('button', { name: 'Ranking', exact: true }).click();
    await expect(page.getByText(expected)).toBeVisible({ timeout: 12_000 });
  });
}

test('recovers registration without duplicate records', async ({ page }) => {
  await startGame(page, 'registration-recovery');
  await finishTestMatch(page, 'time', 4_400);
  await expect(page.getByRole('heading', { name: 'Match Finished', exact: true })).toBeVisible();
  await expect(page.getByText('Result saved', { exact: true })).toBeVisible({ timeout: 12_000 });
  const records = await page.evaluate(() => JSON.parse(localStorage.getItem('pirate-battle:completed-matches:v1') ?? '{}')) as { matches?: unknown[] };
  expect(records.matches).toHaveLength(1);
});
