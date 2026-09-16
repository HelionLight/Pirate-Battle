# Pirate Battle Architecture

## Runtime boundaries

React owns screen navigation, forms, HUD snapshots, result state, and remote data views. PixiJS owns the active simulation and its display tree. `GameController` is the boundary: it receives input, advances the simulation from ticker time, and emits throttled HUD updates and one final `MatchResult`.

The simulation is divided into focused systems:

- `GameMap` defines the arena and island colliders.
- `InputSystem` tracks keyboard and pointer actions only while gameplay is mounted.
- `WeaponSystem` and `ProjectileSystem` handle cooldowns, movement, lifetime, range, and one-hit projectile removal.
- `SpawnSystem` selects safe spawn positions and enforces interval, distance, and active-entity limits.
- `CollisionSystem` constrains ships and removes projectiles at arena or island boundaries.
- Enemy entities own movement and attack behavior; `GameController` resolves damage and scoring.
- `ExplosionSystem` and `AudioManager` provide combat feedback without owning game rules.

## Lifecycle

A game screen creates one controller, awaits asset loading, initializes Pixi display objects, then attaches input and the ticker. The canvas is exposed only after initialization completes, so user actions cannot race startup. Unmounting destroys listeners, ticker callbacks, entities, textures/display references, audio, and resize observation. React Strict Mode therefore performs a complete mount/unmount cycle safely.

The simulation uses ticker delta time rather than frame counts. Pausing stops the ticker and clears active input. Resuming starts from a clean input state and ignores the first ticker tick, preventing movement or firing from accumulating during a pause. Visibility changes use the same pause path.

React receives HUD updates at a bounded cadence and at important transitions. Continuous entity state remains in Pixi/game objects, avoiding React renders on every frame.

## Configuration and persistence

Gameplay values are centralized in `src/game/config/gameConfig.ts`. Options are validated and stored locally. `GameController.startNewMatch()` copies the current options into `matchConfiguration`, so a match retains the configuration that started it even if the user changes Options later.

Completed matches are stored in `src/persistence/matchStorage.ts` with an idempotent `matchId` and `pending`/`confirmed` sync state. `matchSync.ts` retries transient registration failures, marks confirmed records locally, invalidates ranking/history queries, and preserves pending records across refresh.

## Remote data

Axios owns HTTP calls. TanStack Query owns ranking/history cache, loading, errors, pagination, background refresh, and invalidation. MSW intercepts the same REST contracts in development and Playwright, with deterministic scenarios for latency, out-of-order responses, network errors, HTTP failures, and registration recovery.

## Testing and observability

Playwright runs desktop Chromium and mobile Chromium E2E suites plus visual baselines. The development-only `?e2e=1` bridge observes snapshots and requests a controlled match finish; it does not replace gameplay rules or production controls. Visual baselines live beside `tests/visual/screens.spec.ts` and are updated deliberately with `npm run test:e2e:update`.

## Known delivery boundary

The application is a static Vite build and is ready for Vercel, Netlify, or Cloudflare Pages. A public URL must be created outside this workspace and recorded in the README after deployment.
