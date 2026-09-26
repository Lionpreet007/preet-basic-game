# Flappy Kiro — Domain Patterns

Domain guidance for implementing the Flappy Kiro game. These patterns extend the
architecture in `structure.md` and `tech.md`: pure simulation core, impure shell,
delta-time physics, injected RNG. Follow them when touching gameplay logic.

## Game state management

- The game is a state machine with three phases: `Ready`, `Running`, `GameOver`.
  Model the whole world as a single immutable `GameState` object; `step(state, dt, intents, rng)`
  returns the *next* state rather than mutating in place.
- Phase drives behavior in `step()`:
  - **Ready** — no gravity, no obstacle movement; a `flap` intent transitions to `Running`
    with a fresh world (character reset, score 0). Show the start overlay.
  - **Running** — apply flap → physics → move/spawn/prune obstacles → scoring → collision.
    A detected collision transitions to `GameOver` within the same update cycle.
  - **GameOver** — freeze physics and obstacle movement; a `restart` intent returns to `Ready`.
    Keep the game-over/restart overlay visible until the phase leaves `GameOver`.
- Transitions happen only inside `step()` (the core). The shell never mutates phase directly;
  it only supplies intents and reads the resulting state.
- Order within a Running step matters: consume flap before physics; run scoring before the
  collision check so a pair crashed into before its center is never scored.
- Keep transient bookkeeping (`distanceSinceLastSpawn`, `nextObstacleId`, per-pair `scored`
  flag) inside `GameState` so the core stays deterministic and testable.

## Score persistence

- Current `score` lives in `GameState` and resets to 0 on entry to `Ready`.
- `highScore = max(previousHighScore, score)` is computed at the `GameOver` transition.
- Persistence is a **shell** concern via a `localStorage` adapter; the core never touches storage.
  - Read the high score once on load, **before** the first render, through pure `parseHighScore`.
  - Write only when the high score changes; wrap `setItem` in try/catch and return a success
    boolean. On failure, retain the in-session value and continue — never surface an error.
  - `parseHighScore(raw)` returns the value only for a valid non-negative integer; otherwise 0
    (handles `null`, empty, non-numeric, negative, floating-point, overflowing input).
- Persist a single key (`CONFIG.HS_STORAGE_KEY`) holding the stringified integer. Nothing else.

## Difficulty progression patterns

The base spec uses fixed constants. When adding progression, keep it in the pure core, driven
by `score` (or elapsed distance) so it stays deterministic and testable.

- Derive difficulty from state, never from wall-clock time: `difficulty = f(score)`.
- Scale gently and clamp to safe bounds so the game stays playable:
  - Increase `SCROLL_SPEED` toward a ceiling (stay within the 100–300 px/s design range).
  - Shrink `GAP_HEIGHT` toward a floor of `1.5 · CHAR_HEIGHT` — never below (Req 3.3).
  - Optionally tighten `OBSTACLE_SPACING` within the 200–400 px band (Req 3.2).
- Prefer smooth ramps (e.g. every N points step up, or an asymptotic curve) over abrupt jumps.
- Express progression as pure helpers (e.g. `scrollSpeedFor(score)`, `gapHeightFor(score)`) and
  cover them with property tests asserting the clamped bounds always hold.
- Gap center placement stays within the 10–90% band and fully inside the Play_Area regardless
  of difficulty.

## Movement algorithms

- **Physics (character):** semi-implicit Euler, integrated against delta time in seconds.
  - `vy' = min(vy + GRAVITY · dt, MAX_FALL_SPEED)` then `y' = y + vy' · dt`.
  - Flap replaces velocity: `vy = FLAP_VELOCITY` (a fixed upward value), independent of prior `vy`.
  - Character horizontal center is fixed (`CONFIG.CHAR_X`); only `y`/`vy` change.
- **Obstacles:** move left at constant speed — `x' = x − SCROLL_SPEED · dt` — preserving count
  and order. Prune any pair fully past the left edge (`x + width < 0`).
- **Spawning:** accumulate `distanceSinceLastSpawn += SCROLL_SPEED · dt`; when it reaches the
  spacing threshold, emit a new pair at the right edge, draw `gapCenterY` from the injected RNG,
  assign a monotonically increasing `id`, and reset the accumulator (carry remainder to keep
  spacing even).
- Always multiply by `dt`; never assume a fixed frame count. This keeps motion frame-rate
  independent (Req: px/s and px/s² constants).

## Animation patterns

- Rendering is derived purely from `GameState` — the renderer reads state and draws; it never
  advances the simulation. All timing/motion changes flow through `step()`.
- Draw order each frame: light-green background → white clouds → obstacle pairs → character →
  score display → phase overlay.
- Cosmetic animation (cloud drift, character tilt, cape flutter) may be computed from state
  (e.g. tilt from `vy`, cape phase from elapsed time) but must not affect collision, scoring,
  or physics. Keep bounding rects driven by the true `x/y/width/height`.
- Optional audio (`assets/jump.wav` on flap, `assets/game_over.wav` on game over) is best-effort:
  wrap playback in try/catch so it never blocks a state transition.

## Smoother animations

- **Loop:** use `requestAnimationFrame` and its high-resolution timestamp; compute
  `dt = (now - last) / 1000` in seconds.
- **Clamp dt:** `dt = clamp(dt, 0, MAX_DT)` with `MAX_DT = 1/30`s so a backgrounded tab does not
  produce a huge step that tunnels the character through obstacles.
- **Coalesce input:** queue mouse/touch/keyboard intents and drain them once per frame so bursts
  between frames resolve deterministically to a single flap.
- Prefer a fixed-timestep accumulator for physics if visible jitter appears: accumulate real time,
  step the simulation in fixed `dt` slices, and interpolate the render position between slices —
  this decouples simulation stability from render cadence.
- Ease cosmetic transitions (character tilt toward velocity, overlay fade) with simple lerps
  toward a target rather than snapping, keeping easing strictly in the render layer.
- Keep all logical coordinates in a fixed logical Play_Area (`PLAY_WIDTH × PLAY_HEIGHT`) and scale
  to the canvas at draw time so motion stays smooth and consistent across display sizes.
