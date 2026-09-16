# Testing Guide

## Test stack

Playwright runs the real Vite application in Chromium. MSW intercepts the REST API at the network boundary, Axios performs the requests, and TanStack Query manages remote data state. The gameplay tests use the real Pixi simulation and real keyboard/pointer events. The development-only `?e2e=1` bridge exposes read-only snapshots and a controlled match-finish action for deterministic end-of-match flows; it does not replace movement, collision, weapon, enemy, or pause rules.

The configured projects are:

- `chromium`: desktop viewport at 1280x720.
- `mobile-chromium`: Pixel 5 emulation with touch viewport.

Each helper clears local storage before opening the app, so options and completed matches do not leak between tests.

## Commands

```bash
npm run typecheck
npm run test:e2e:desktop
npm run test:e2e:mobile
npm run test:visual
npm run test:e2e:report
```

To update visual baselines deliberately:

```bash
npm run test:e2e:update
```

To run one slice while debugging:

```bash
npx playwright test tests/e2e/gameplay.spec.ts --project=chromium --workers=1 --reporter=line
```

`playwright.config.ts` starts Vite automatically on port 4173. Screenshots are captured on failures. Traces are captured on the first retry; use `--trace=on` when a complete trace is required for a local investigation. The HTML report is written to `playwright-report/` by `test:e2e:report`.

## Coverage matrix

| Area | Covered by | Current coverage |
|---|---|---|
| Menu navigation | `tests/e2e/navigation.spec.ts` | Destinations, return actions, screen-heading focus |
| Options | `tests/e2e/foundation.spec.ts`, `tests/e2e/options-controls.spec.ts` | Validation, save, persistence after navigation |
| Controls | `tests/e2e/options-controls.spec.ts` | Keyboard, simultaneous actions, touch-control presentation |
| Pixi startup and input | `tests/e2e/gameplay.spec.ts` | Canvas, asset-backed game startup, movement, simultaneous firing |
| Pause and resume | `tests/e2e/gameplay.spec.ts` | Timer suspension, resume progression, deterministic startup |
| Match results | `tests/e2e/gameplay.spec.ts` | Time end, player destruction, save state, clean restart, return to menu |
| Ranking/history | `tests/e2e/ranking-history.spec.ts` | Pagination, empty/error scenarios, registration, ranking/history consistency |
| Registration recovery | `tests/e2e/ranking-history.spec.ts` | Retry after first network failure and no duplicate local record |
| Responsive UI | `tests/e2e` with mobile project | Full E2E suite on mobile Chromium |
| Visual regression | `tests/visual/screens.spec.ts` | Desktop menu/game/pause/result/data screens and mobile menu/controls/game/result baselines |

The current E2E suite does not yet provide isolated assertions for every internal combat invariant, such as exact island collision geometry, every weapon cooldown boundary, or independent Chaser/Shooter decision timing. Those invariants are implemented in the game systems and should be added as focused browser scenarios before claiming exhaustive gameplay coverage.

## Network scenarios

Use `?mockScenario=<scenario>` to reproduce deterministic API behavior. The available scenarios are documented in the README and include empty data, latency, out-of-order responses, network failures, HTTP 4xx/5xx responses, registration timeout/failure, and registration recovery. A pending match remains in local storage and can be retried from the Result screen or after refresh.

## Latest verified run

The following green validation commands were executed locally on 2026-09-15:

- `npm run typecheck`: passed.
- `npx playwright test tests/e2e --project=chromium --project=mobile-chromium --workers=1 --reporter=line`: 42 passed.
- `npx playwright test tests/visual --project=chromium --project=mobile-chromium --workers=1 --reporter=line`: 3 passed, 3 skipped by the desktop/mobile describe filters.
- `npx playwright test --workers=1 --reporter=html`: 45 passed, 3 skipped; HTML report refreshed in `playwright-report/`.
- `npm run build`: passed.

The final report was generated serially with one worker to avoid resource contention between visual and mobile browser contexts. Future failure traces are retained by `trace: 'retain-on-failure'` in `playwright.config.ts`.

The production build still emits a bundle-size warning for the main JavaScript chunk. It is non-blocking but should be considered if performance work continues.

## Failure artifacts

Do not commit transient `test-results/` output as test evidence unless it contains a deliberately selected trace or report. For a submission artifact, run the HTML reporter and preserve the generated `playwright-report/` directory, plus any failure trace required to explain a defect. Visual PNGs under `tests/visual/screens.spec.ts-snapshots/` are versioned baselines and are part of the source delivery.
