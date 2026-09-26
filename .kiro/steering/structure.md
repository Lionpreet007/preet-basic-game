# Project Structure

## Top-level layout

```
.
├── index.html            # Entry point: <canvas> + module <script>
├── package.json          # Dev deps (Vitest, fast-check) and the test script
├── src/                  # Game source (ES modules)
│   ├── config.js         # CONFIG constants object; coordinate convention
│   ├── main.js           # Bootstrap + requestAnimationFrame loop
│   ├── core/             # Pure simulation core (no DOM / IO / randomness)
│   └── shell/            # Impure shell (canvas, input, storage, real time)
├── assets/               # Game audio and sprites (jump.wav, game_over.wav, ghosty.png)
├── img/                  # Screenshots and images (example-ui.png)
├── .kiro/                # Kiro specs and steering
│   ├── specs/            # Feature specs (requirements, design, tasks)
│   └── steering/         # Steering docs (this folder)
├── README.md
└── LICENCE.md
```

## Architecture: pure core, impure shell

The game separates a **pure simulation core** from a **thin I/O + rendering shell**.

### `src/core/` — pure, testable

Given the current `GameState` and a `dt`, produces the next `GameState`. No DOM, no `localStorage`, no timers, no randomness except through an injected `Rng`. Suggested modules:

- `physics.js` — `applyPhysics`, `applyFlap`
- `obstacles.js` — `moveObstacles`, `pruneObstacles`, `maybeSpawn`
- `collision.js` — `rectsOverlap`, `detectCollision`
- `scoring.js` — `updateScoring`
- `highscore.js` — `parseHighScore`
- `step.js` — the master `step(state, dt, intents, rng)` transition function

### `src/shell/` — impure

Owns the canvas, the loop, event listeners, and storage. Reads real time, gathers input intents, calls the core `step()`, then renders and persists side effects. Suggested modules:

- `renderer.js` — draws background, clouds, obstacles, character, score, overlays
- `input.js` — mouse/touch/keyboard → coalesced flap/restart intents
- `storage.js` — `readHighScore`, `writeHighScore` (localStorage wrapper)

## Data flow

Input handler → intents → `step()` (core) → new `GameState` → renderer (draw) and storage (persist high-score changes). The rAF loop in `main.js` orchestrates: drain intents, call `step`, persist on change, render, schedule next frame.

## Conventions

- Place pure logic in `core/` and everything with side effects in `shell/`; never import shell modules from core.
- Implement core logic first, validate it with property/unit tests, then wire it into the shell.
- Test files live alongside the code they cover (or under a `test/`/`__tests__/` folder consistent with the existing setup).
