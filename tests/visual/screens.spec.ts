import { expect, test } from '@playwright/test';
import { finishTestMatch, openApp, startGame } from '../helpers';

async function stabilize(page: Parameters<typeof openApp>[0]): Promise<void> {
  await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; }' });
}

test.describe('desktop visual regression', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 500, 'Desktop-only baselines.');

  test('captures menu, options, controls, ranking, and history', async ({ page }) => {
    await openApp(page);
    await stabilize(page);
    await expect(page).toHaveScreenshot('main-menu.png', { fullPage: true, maxDiffPixelRatio: 0.02 });
    await page.getByRole('button', { name: 'Options', exact: true }).click();
    await expect(page).toHaveScreenshot('options.png', { fullPage: true, maxDiffPixelRatio: 0.02 });
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await page.getByRole('button', { name: 'Controls', exact: true }).click();
    await expect(page).toHaveScreenshot('controls.png', { fullPage: true, maxDiffPixelRatio: 0.02 });
    await page.getByRole('button', { name: 'Back to main menu' }).click();
    await page.getByRole('button', { name: 'Ranking', exact: true }).click();
    await expect(page.getByRole('cell', { name: '#1', exact: true })).toBeVisible();
    await expect(page).toHaveScreenshot('ranking.png', { fullPage: true, maxDiffPixelRatio: 0.02 });
    await page.getByRole('button', { name: 'Back to menu', exact: true }).click();
    await page.getByRole('button', { name: 'Match History', exact: true }).click();
    await expect(page.getByRole('columnheader', { name: 'End Reason' })).toBeVisible();
    await expect(page).toHaveScreenshot('history.png', { fullPage: true, maxDiffPixelRatio: 0.02 });
  });

  test('captures game, pause, and result', async ({ page }) => {
    await startGame(page);
    await stabilize(page);
    await expect(page.locator('.game-host canvas')).toBeVisible();
    await expect(page).toHaveScreenshot('game.png', { fullPage: true, maxDiffPixelRatio: 0.03 });
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await expect(page.getByText(/Paused/)).toBeVisible();
    await expect(page).toHaveScreenshot('pause.png', { fullPage: true, maxDiffPixelRatio: 0.03 });
    await page.getByRole('button', { name: 'Resume', exact: true }).click();
    await finishTestMatch(page, 'time', 4_500);
    await expect(page).toHaveScreenshot('result.png', { fullPage: true, maxDiffPixelRatio: 0.02 });
  });
});

test.describe('mobile visual regression', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 500, 'Mobile-only baselines.');

  test('captures responsive menu, controls, game, and result', async ({ page }) => {
    await openApp(page);
    await stabilize(page);
    await expect(page).toHaveScreenshot('mobile-main-menu.png', { fullPage: true, maxDiffPixelRatio: 0.02 });
    await page.getByRole('button', { name: 'Controls', exact: true }).click();
    await expect(page).toHaveScreenshot('mobile-controls.png', { fullPage: true, maxDiffPixelRatio: 0.02 });
    await page.getByRole('button', { name: 'Back to main menu' }).click();
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(page.locator('.game-host canvas')).toBeVisible();
    await expect(page).toHaveScreenshot('mobile-game.png', { fullPage: true, maxDiffPixelRatio: 0.03 });
    await finishTestMatch(page, 'player_destroyed', 4_500);
    await expect(page).toHaveScreenshot('mobile-result.png', { fullPage: true, maxDiffPixelRatio: 0.02 });
  });
});
