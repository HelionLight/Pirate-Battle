import { expect, type Page } from '@playwright/test';

export async function openApp(page: Page, scenario = 'success'): Promise<void> {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(`/?e2e=1&mockScenario=${scenario}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
}

export async function startGame(page: Page, scenario = 'success'): Promise<void> {
  await openApp(page, scenario);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('.game-host canvas')).toBeVisible();
  await expect(page.getByLabel('Player health')).toBeVisible();
}

export async function sendKeyboardInput(page: Page, code: string, pressed = true): Promise<void> {
  await page.evaluate(({ eventCode, active }) => {
    const event = new KeyboardEvent(active ? 'keydown' : 'keyup', { code: eventCode, bubbles: true, cancelable: true });
    window.dispatchEvent(event);
  }, { eventCode: code, active: pressed });
}

export async function finishTestMatch(page: Page, endReason: 'time' | 'player_destroyed' = 'time', score = 4_500): Promise<void> {
  await page.waitForFunction(() => Boolean(window.__pirateBattleTest));
  await page.waitForFunction(() => window.__pirateBattleTest?.snapshot().status === 'running', { timeout: 10_000 });
  await page.evaluate(({ endReason, score: finalScore }) => window.__pirateBattleTest?.finishMatch(endReason, finalScore), { endReason, score });
  await page.waitForFunction(() => document.body.innerText.includes('Match Finished'), { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Match Finished', exact: true })).toBeVisible({ timeout: 15_000 });
}

export async function snapshot(page: Page): Promise<{ matchId: string; status: string; score: number; playerX: number | null; playerY: number | null; playerProjectiles: number }> {
  return page.evaluate(() => {
    const value = window.__pirateBattleTest?.snapshot();
    if (!value) throw new Error('E2E game bridge is unavailable.');
    return value;
  });
}
