# Performance Validation

## Reference procedure

Run the optimized build with `npm run build`, serve it with `npm run preview`, and execute the game in Chromium at 1280x720. Use the default 120-second match and record a three-minute stress run with the browser Performance panel or a Playwright performance trace.

Record:

- average FPS and the 95th percentile frame interval;
- active enemy and projectile counts during the run;
- browser version, operating system, viewport, device pixel ratio, and match options;
- heap snapshots after five start/play/exit cycles, comparing the final snapshot with the first.

The target is 60 FPS. A frame interval near 16.7 ms is expected; investigate sustained intervals above 20 ms or continuously growing heap usage.

## Architecture factors that support the target

The simulation uses delta time, bounded active enemy counts, projectile lifetime/range cleanup, throttled React HUD updates, cached Pixi assets, and explicit teardown of ticker/listener/entity resources. These are implementation safeguards, not substitutes for measuring on the reference machine.

## Current evidence status

Build and E2E validation are automated. A local machine-specific FPS and heap report still needs to be captured and attached to the delivery. Do not claim a 60 FPS or memory result without recording the environment and raw measurements.
