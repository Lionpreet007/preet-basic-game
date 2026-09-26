# Implementation Plan: Flappy Kiro

## Overview

This plan builds Flappy Kiro incrementally as a zero-build, dependency-free HTML/CSS/JavaScript game rendered on an HTML5 Canvas, driven by a `requestAnimationFrame` loop. Work is organized by **feature area** rather than pure layering: each main task groups the pure simulation-core functions with the impure shell code (renderer, input, storage) that brings that feature to life. Within each feature, core logic is implemented first so it can be validated by property-based tests (fast-check, minimum 100 generated inputs) and example unit tests, then wired into the canvas/input/storage shell.

The nine feature tasks map onto the design's pure-core-plus-impure-shell architecture:

1. **Project structure and configuration system** — scaffold, `CONFIG` constants, coordinate convention.
2. **Player physics and rendering** — physics core (gravity, cap, flap) plus the blue caped Character rendering.
3. **Pipe generation and management** — obstacle generation, leftward movement, and off-screen pruning, plus obstacle rendering.
4. **Background cloud system** — light-green background and white cloud shapes.
5. **Core game loop and state management** — the master `step` transition function and the `requestAnimationFrame` loop.
6. **Input handling and game flow** — mouse/touch/keyboard intents, Ready → Running → Game_Over flow, and phase overlays.
7. **Scoring and persistence** — scoring core, Score_Display, and the `localStorage` storage adapter.
8. **Error handling and validation** — high-score parsing, storage failure handling, dt clamping, and input coalescing.
9. **Testing and polish** — property/unit/integration test suites and optional audio/sprite polish (optional).

Every property test uses fast-check with a minimum of 100 generated inputs and is tagged `// Feature: flappy-kiro, Property {number}: {property_text}`. Each task references the specific requirement clauses it satisfies and, where applicable, the specific correctness property from the design document.

## Tasks

- [ ] 1. Project structure and configuration system
  - [ ] 1.1 Create project scaffold
    - Create `index.html` with a `<canvas>` element and a module `<script>` tag; create the `src/` directory with `src/core/` and `src/shell/` subfolders
    - Add `package.json` with Vitest + fast-check as dev dependencies and a single-run (not watch) `test` script
    - _Requirements: 1.1_

  - [ ] 1.2 Implement the configuration system
    - Create `src/config.js` exporting the `CONFIG` constants object (PLAY_WIDTH/HEIGHT, GRAVITY, MAX_FALL_SPEED, FLAP_VELOCITY, CHAR_X/WIDTH/HEIGHT, OBSTACLE_WIDTH, SCROLL_SPEED, OBSTACLE_SPACING, GAP_HEIGHT, GAP_CENTER_MIN/MAX_FRAC, SCORE_BAND_TOP_FRAC, HS_STORAGE_KEY, MAX_DT)
    - Document the coordinate convention (origin top-left, +y down, upward velocity negative) in the core entry module
    - _Requirements: 1.4, 3.1, 3.2, 3.3, 3.4_

- [ ] 2. Player physics and rendering
  - [ ] 2.1 Implement physics core
    - Implement `applyPhysics(ch, dt)` in `src/core/physics.js`: `vy' = min(vy + GRAVITY*dt, MAX_FALL_SPEED)`, `y' = y + vy'*dt`; return a new Character (no mutation)
    - Implement `applyFlap(ch)`: return a new Character with `vy = FLAP_VELOCITY`
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 2.2 Implement Character rendering
    - In `src/shell/renderer.js`, draw the Character as a blue Superman-style avatar that includes a cape, positioned with its horizontal center in the leftmost 40% band (CHAR_X)
    - _Requirements: 1.3, 1.4_

  - [ ]* 2.3 Write property tests for physics
    - **Property 1: Fall speed is capped** — Validates Requirements 2.2
    - **Property 2: Gravity increases downward velocity below the cap** — Validates Requirements 2.1
    - **Property 3: Flap sets a fixed upward velocity** — Validates Requirements 2.3
    - fast-check, min 100 runs; tag each `// Feature: flappy-kiro, Property {number}: {property_text}`

  - [ ]* 2.4 Write unit tests for physics edge cases
    - Flap immediately after a fast fall sets `vy = -400` regardless of prior velocity
    - _Requirements: 2.3_

- [ ] 3. Pipe generation and management
  - [ ] 3.1 Implement obstacle movement and pruning
    - Implement `moveObstacles(obs, dt)` in `src/core/obstacles.js`: decrease each obstacle `x` by `SCROLL_SPEED*dt`, preserving count and order
    - Implement `pruneObstacles(obs)`: keep only obstacles with `x + width >= 0`
    - _Requirements: 3.1, 3.5_

  - [ ] 3.2 Implement obstacle generation
    - Implement `maybeSpawn(state, dt, rng)` in `src/core/obstacles.js`: track `distanceSinceLastSpawn`; spawn a new pair at the right edge when the 200-400 px spacing threshold is reached
    - Draw `gapCenterY` from the 10-90% band, clamped so the full gap fits the Play_Area; `gapHeight = GAP_HEIGHT` (>= 1.5 * CHAR_HEIGHT); assign monotonically increasing `id`; use the injected `Rng` for deterministic tests
    - _Requirements: 3.2, 3.3, 3.4_

  - [ ] 3.3 Implement obstacle-pair rendering
    - In `src/shell/renderer.js`, draw each Obstacle_Pair as green top and bottom rectangles separated by the Gap (top/bottom Rects derived per the data model)
    - _Requirements: 1.5_

  - [ ]* 3.4 Write property tests for obstacle management
    - **Property 5: Obstacles scroll leftward at the configured speed** — Validates Requirements 3.1
    - **Property 6: Generated gaps satisfy size and placement constraints** — Validates Requirements 3.3, 3.4
    - **Property 7: Consecutive spawn spacing stays within bounds** — Validates Requirements 3.2
    - **Property 8: Off-screen obstacles are pruned** — Validates Requirements 3.5
    - fast-check, min 100 runs; tag each `// Feature: flappy-kiro, Property {number}: {property_text}`

- [ ] 4. Background cloud system
  - [ ] 4.1 Implement background and cloud rendering
    - In `src/shell/renderer.js`, fill the Play_Area with the light-green background, then draw one or more white cloud shapes in the background band (drawn before obstacles and Character)
    - _Requirements: 1.1, 1.2_

  - [ ]* 4.2 Write mock-context rendering checks for background
    - Assert against a recording 2D context: background fill color and at least one cloud drawn
    - _Requirements: 1.1, 1.2_

- [ ] 5. Core game loop and state management
  - [ ] 5.1 Implement the master `step` transition function
    - Implement `step(state, dt, intents, rng)` in `src/core/step.js`
    - Ready: on `intents.flap`, return a fresh Running state (character reset, score 0); ignore other intents
    - Running: apply flap (if any), physics, move/spawn/prune obstacles, update scoring, then detect collision and transition to Game_Over (freeze obstacles, update high score = max(prev, score))
    - Game_Over: do not move obstacles or apply physics
    - _Requirements: 2.7, 4.1, 4.2, 4.3, 4.4, 5.5, 6.1, 7.5_

  - [ ] 5.2 Implement collision detection
    - Implement `rectsOverlap(a, b)` in `src/core/collision.js`: AABB overlap with >= 1px threshold (strict inequality on extents)
    - Implement `detectCollision(ch, obs, playHeight)`: true on any obstacle overlap, Ground contact (`bottom >= playHeight`), or Ceiling contact (`top <= 0`); derive Character/obstacle Rects per the data model
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 5.3 Implement the requestAnimationFrame loop and bootstrap
    - Implement the rAF loop in `src/main.js`: drain input intents, call `step`, persist high score on change, call `render`, schedule next frame
    - On load: set phase to Ready before first render; wire the core `step` to real-time frames
    - _Requirements: 4.4, 7.1_

  - [ ]* 5.4 Write property tests for state transitions
    - **Property 9: Collision is detected exactly on bounding-region overlap** — Validates Requirements 4.1, 4.2, 4.3
    - **Property 12: Reset to Ready zeroes the score and clears obstacles** — Validates Requirements 7.3, 5.2
    - **Property 13: High score is the running maximum** — Validates Requirements 6.1
    - fast-check, min 100 runs; tag each `// Feature: flappy-kiro, Property {number}: {property_text}`

  - [ ]* 5.5 Write unit tests for collision boundaries and transitions
    - 1px overlap collides; a 0px shared-edge touch does not; Ground/Ceiling contact ends the game
    - Ready->Running on flap; Game_Over->Ready on restart
    - _Requirements: 4.1, 4.2, 4.3, 7.2, 7.3_

- [ ] 6. Checkpoint - Ensure all core tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Input handling and game flow
  - [ ] 7.1 Implement the input handler
    - Implement `src/shell/input.js`: `mousedown`+`mouseup` within canvas, `touchstart` tap, and `keydown` Space each enqueue exactly one flap intent; `preventDefault` on Space and touch
    - The same intents serve as start input (Ready) and restart input (Game_Over); intents are queued and drained once per frame
    - _Requirements: 2.4, 2.5, 2.6, 7.2, 7.3, 7.5_

  - [ ] 7.2 Implement game-flow overlays and wiring
    - In `src/shell/renderer.js`, draw the start instruction overlay (Ready) and the game-over + restart instruction overlay (Game_Over, remains visible until Ready)
    - Wire the input handler into the loop so flap/restart intents drive Ready → Running → Game_Over → Ready transitions
    - _Requirements: 4.5, 7.1, 7.4_

  - [ ]* 7.3 Write mock-based tests for input and flow
    - Simulated `mousedown`/`mouseup`, `touchstart`, and `keydown` Space each enqueue exactly one flap intent
    - **Property 4: Flap is ignored outside the Running state** — Validates Requirements 2.7, 7.5
    - fast-check for Property 4 (min 100 runs), tagged `// Feature: flappy-kiro, Property 4: ...`
    - _Requirements: 2.4, 2.5, 2.6_

- [ ] 8. Scoring and persistence
  - [ ] 8.1 Implement scoring core
    - Implement `updateScoring(ch, obs)` in `src/core/scoring.js`: count unscored pairs whose center the Character's center has passed; mark them `scored` and return `{ obstacles, gained }`; award at most one point per pair per session
    - _Requirements: 5.1, 5.4_

  - [ ] 8.2 Implement the storage adapter
    - Implement `readHighScore(storage)` and `writeHighScore(storage, value)` in `src/shell/storage.js`: read `HS_STORAGE_KEY` through `parseHighScore` (0 on failure); wrap `setItem` in try/catch returning `false` on failure without throwing
    - Wire high-score read on load (before first render) and write-on-change into the loop
    - _Requirements: 5.2, 6.1, 6.2, 6.3, 6.6_

  - [ ] 8.3 Implement Score_Display rendering
    - In `src/shell/renderer.js`, draw the Score_Display text in the lower 15% band showing the current Score and High_Score as two distinct labeled values
    - _Requirements: 1.6, 5.3, 6.6_

  - [ ]* 8.4 Write property tests for scoring
    - **Property 10: Passing a pair scores exactly once** — Validates Requirements 5.1, 5.4
    - **Property 11: A crashed-into pair awards no point** — Validates Requirements 5.5
    - fast-check, min 100 runs; tag each `// Feature: flappy-kiro, Property {number}: {property_text}`

  - [ ]* 8.5 Write unit and mock-based tests for scoring and storage
    - Scoring boundary: Character center exactly at a pair center
    - Storage: returns 0 when empty and on garbage; persists on change; does not throw when `setItem` throws
    - _Requirements: 5.1, 6.2, 6.4, 6.5, 6.7_

- [ ] 9. Testing and polish
  - [ ] 9.1 Implement high-score parsing and error handling
    - Implement `parseHighScore(raw)` in `src/core/highscore.js`: return the value only when `raw` parses as a non-negative integer; otherwise 0 (handles `null`, empty, non-numeric, negative, floating-point, overflowing values)
    - Clamp frame delta `dt = clamp((now - last) / 1000, 0, MAX_DT)` in the loop; ensure input intents are coalesced/drained once per frame
    - _Requirements: 6.4, 6.5, 6.7_

  - [ ]* 9.2 Write property test for high-score parsing
    - **Property 14: High-score parsing yields a non-negative integer or zero** — Validates Requirements 6.4, 6.5
    - fast-check, min 100 runs; tag `// Feature: flappy-kiro, Property 14: ...`

  - [ ]* 9.3 Write mock-loop integration and rendering tests
    - Mocked `requestAnimationFrame` advancing fixed deltas: Running progresses physics; Game_Over freezes obstacles
    - Mock-context checks: character in leftmost 40% band, score text in lower 15% band, correct overlay per phase
    - _Requirements: 1.4, 1.6, 4.4, 4.5, 7.1, 7.4_

  - [ ]* 9.4 Wire optional audio and sprite polish
    - Best-effort optional audio (`assets/jump.wav` on flap, `assets/game_over.wav` on Game_Over) wrapped in try/catch so it never blocks a state transition; optional `assets/ghosty.png` sprite polish
    - _Requirements: (robustness)_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; they are visually distinguished in the UI. Core implementation tasks are never optional. All test sub-tasks under task 9 (9.2, 9.3) and the optional audio/sprite polish (9.4) are marked `*`, as are the test sub-tasks folded alongside feature tasks (e.g., 2.3, 2.4, 3.4, 4.2, 5.4, 5.5, 7.3, 8.4, 8.5).
- Each property test uses fast-check with a minimum of 100 generated inputs and is tagged `// Feature: flappy-kiro, Property {number}: {property_text}`. All 14 correctness properties from the design are covered: Properties 1-3 (task 2), Property 4 (task 7), Properties 5-8 (task 3), Properties 9, 12, 13 (task 5), Properties 10-11 (task 8), and Property 14 (task 9).
- Tasks are grouped by feature area rather than pure layering; within each feature the pure simulation core is implemented before the impure shell code that renders it, and property/unit tests validate the core early.
- Each task references specific requirement clauses and, where applicable, a specific correctness property from the design document for traceability.
- Checkpoints (tasks 6 and 10) ensure incremental validation. Property tests validate universal correctness properties; unit and mock-based tests cover examples, edge cases, and shell integration.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "3.1", "3.2", "5.2", "8.1", "9.1"] },
    { "id": 3, "tasks": ["2.3", "2.4", "3.4", "8.4", "9.2", "5.1"] },
    { "id": 4, "tasks": ["2.2", "3.3", "4.1", "8.2", "5.4"] },
    { "id": 5, "tasks": ["5.3", "8.3", "7.1", "5.5"] },
    { "id": 6, "tasks": ["8.5", "7.2", "4.2"] },
    { "id": 7, "tasks": ["7.3", "9.4"] },
    { "id": 8, "tasks": ["9.3"] }
  ]
}
```
