import { expect, test } from '@playwright/test';
import { finishTestMatch, openApp, sendKeyboardInput, snapshot, startGame } from '../helpers';

test('renders the Pixi game, accepts keyboard input, and supports simultaneous firing', async ({ page }) => {
  await startGame(page);
  const canvas = page.locator('.game-host canvas');
  expect(await canvas.evaluate((element) => element.width)).toBeGreaterThan(0);
  await expect(page.getByText(/^Score:/)).toBeVisible();
  await expect(page.getByLabel('Remaining time')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();

  const before = await snapshot(page);
  await sendKeyboardInput(page, 'KeyW', true);
  await sendKeyboardInput(page, 'Space', true);
  await page.waitForTimeout(250);
  const after = await snapshot(page);
  await sendKeyboardInput(page, 'KeyW', false);
  await sendKeyboardInput(page, 'Space', false);
  expect(after.playerY).not.toBe(before.playerY);
  expect(after.playerProjectiles).toBeGreaterThan(0);

  for (const key of ['KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyQ', 'KeyE']) {
    await sendKeyboardInput(page, key, true);
    await sendKeyboardInput(page, key, false);
  }
});

test('pauses and resumes timer progression', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => localStorage.setItem('pirate-battle:options', JSON.stringify({ matchDurationSeconds: 120, enemySpawnIntervalSeconds: 180 })));
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('.game-host canvas')).toBeVisible();
  await expect(page.getByLabel('Player health')).toBeVisible();
  const timer = page.getByLabel('Remaining time');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.waitForFunction(() => document.body.innerText.includes('Paused'), { timeout: 15_000 });
  await expect(page.getByText(/Paused/)).toBeVisible({ timeout: 15_000 });
  const pausedTime = await timer.textContent();
  await page.waitForTimeout(1_100);
  await expect(timer).toHaveText(pausedTime ?? '');
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.waitForFunction(() => !document.body.innerText.includes('Paused'), { timeout: 15_000 });
  await expect(page.getByText(/Paused/)).toHaveCount(0);
  await expect.poll(() => timer.textContent()).not.toBe(pausedTime);
});

test('shows result, saves, restarts cleanly, and returns to menu', async ({ page }) => {
  await startGame(page);
  const first = await snapshot(page);
  await finishTestMatch(page, 'time', 4_500);
  await expect(page.getByText('Time expired', { exact: true })).toBeVisible();
  await expect(page.getByText('Final Score', { exact: true })).toBeVisible();
  await expect(page.getByText('Result saved', { exact: true })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Play Again', exact: true }).click();
  await expect(page.locator('.game-host canvas')).toBeVisible();
  const restarted = await snapshot(page);
  expect(restarted.matchId).not.toBe(first.matchId);
  expect(restarted.score).toBe(0);
  await page.getByRole('button', { name: 'Exit to menu', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
});

test('supports player-destroyed result', async ({ page }) => {
  await startGame(page);
  await finishTestMatch(page, 'player_destroyed');
  await expect(page.getByText('Player destroyed', { exact: true })).toBeVisible();
});
