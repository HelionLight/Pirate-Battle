# Pirate Battle

## Setup

Requirements: Node.js 20+ and npm. Install dependencies and start the development server:

```bash
npm ci
npm run dev
```

The production build is static and can be previewed with:

```bash
npm run build
npm run preview
```

## Controls and gameplay

Keyboard controls are shown in the Controls screen. `W/S` or `Up/Down` moves the ship, `A/D` or `Left/Right` rotates it, `Space` fires forward, and `Q/E` fire the left and right broadsides. `Escape` or the Pause button pauses the active match. Touch controls are available in the game screen on mobile.

Options persist locally. Match duration is constrained to 60-180 seconds; enemy spawn time must be positive and is validated by the Options screen. A completed match is stored locally and is registered through the mocked REST API. Abandoned matches are not registered.

## Verification commands

```bash
npm run typecheck
npm run build
npm run test:e2e:desktop
npm run test:e2e:mobile
npm run test:visual
```

Playwright starts the Vite server automatically. HTML reports are written by Playwright when requested with `--reporter=html`; traces are captured automatically on retries. Visual baselines are updated deliberately with `npm run test:e2e:update`.

Architecture decisions are documented in [ARCHITECTURE.md](ARCHITECTURE.md), and the performance measurement procedure is in [PERFORMANCE.md](PERFORMANCE.md).
The test strategy, coverage matrix, reproducibility commands, and latest verified results are documented in [TESTING.md](TESTING.md).

## Deployment

This repository includes [vercel.json](vercel.json) for a static Vercel deployment. Use `npm ci` as the install command, `npm run build` as the build command, and `dist` as the output directory. The deployed URL must be recorded here after publishing; this workspace does not contain hosting credentials.

For a published static demo with the mocked ranking/history API, set the build environment variable `VITE_ENABLE_MSW=true`. The default is `false`; this keeps production builds free to use a real API when one is provided.

## Mock API Scenarios

In development, MSW intercepts only `/api/ranking`, `/api/history`, and `/api/matches`. The default scenario is `success`; mock data and delays are deterministic.

Select a scenario with the `mockScenario` URL parameter, for example `?mockScenario=latency`, or persist one from the browser console and refresh:

```ts
localStorage.setItem('pirate-battle:mock-scenario', 'error-5xx')
```

Available scenarios are `success`, `empty`, `latency`, `out-of-order`, `timeout`, `network-error`, `error-4xx`, `error-5xx`, `registration-timeout`, `registration-network-error`, `registration-error-4xx`, `registration-error-5xx`, and `registration-recovery`.

For future automated tests, `setMockScenario(...)`, `getMockScenario()`, and `resetMockScenario()` are exported by `src/mocks/scenarioState.ts`. Reset returns to `success`, clears only mock request/registration state, and does not touch game options or completed-match storage.

To reset manually, remove the URL parameter or run `localStorage.removeItem('pirate-battle:mock-scenario')` and refresh.

## Reproducing failure scenarios

Open the app with `?mockScenario=<scenario>`, for example `/?mockScenario=registration-recovery`. Ranking/history failures affect only their data views; gameplay remains available. Registration failures leave a pending local record and the Result screen exposes Retry Sync. Refreshing the page runs the pending-match bootstrap again.

## Delivery notes

The repository contains source, lockfile, assets, MSW handlers, Playwright E2E tests, visual baselines, and the architecture/performance documentation. Capture and attach a machine-specific performance report before claiming the 60 FPS and memory targets described in the challenge.
