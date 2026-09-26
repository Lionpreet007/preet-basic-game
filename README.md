# Flappy Kiro

A retro, browser-based endless-scroller in the style of Flappy Bird, built entirely with plain
HTML, CSS, and JavaScript on an HTML5 Canvas. You control a blue Superman-style character that
flaps to rise against gravity and threads through gaps in green top-and-bottom obstacle pairs.
Each pair cleared scores a point, and your high score persists across sessions via `localStorage`.

This project was built with [Kiro](https://kiro.dev) using its **spec-driven development** workflow:
requirements first, then design, then a task plan, then implementation task by task.

## Example UI

![Flappy Kiro UI](img/example-ui.png)

## Play It

The game is a zero-build, dependency-free static app. ES modules require an HTTP origin
(they will not load over `file://`), so serve the folder with any static server:

```bash
# Python 3
python -m http.server 8000
```

Then open http://127.0.0.1:8000/ and click, tap, or press Space to start and to flap.

## The Prompt I Used With Kiro

> Build **Flappy Kiro**, a browser-based Flappy Bird-style endless scroller, using your
> spec-driven development workflow. Follow the process step by step and do not skip stages:
>
> 1. **Requirements first.** Write a `requirements.md` with a short introduction, a glossary of
>    domain terms (Character, Obstacle_Pair, Gap, Play_Area, Score, High_Score, Game_State, etc.),
>    and numbered requirements as user stories with testable acceptance criteria in EARS format
>    (WHEN/WHILE/IF ... THEN ... SHALL). Cover: rendering and theme (light-green background, white
>    clouds, blue caped character in the leftmost 40%, green obstacle pairs, score display in the
>    lower 15%), flap-and-gravity physics (gravity 1200 px/s², max fall 700 px/s, flap −400 px/s),
>    input (mouse click, touch tap, spacebar), endless scrolling obstacles with randomized passable
>    gaps, collision and game over, scoring, high-score persistence in localStorage, and the
>    Ready → Running → Game_Over lifecycle with restart.
>
> 2. **Design second.** Once requirements are approved, write a `design.md`: overview, key design
>    decisions with rationale, an architecture diagram, a layered split of a **pure simulation core**
>    (physics, obstacles, collision, scoring, high-score parsing, the master `step()` transition)
>    from an **impure shell** (rAF game loop, canvas renderer, input handler, storage adapter).
>    Define the data models, list the `CONFIG` constants with the requirement each traces to, spell
>    out `step()` semantics per phase, enumerate correctness properties for property-based testing,
>    and describe the error handling and testing strategy. Trace every design element back to a
>    requirement.
>
> 3. **Tasks third.** Once design is approved, write a `tasks.md` implementation plan: small,
>    actionable, checkbox coding tasks in dependency order, each referencing the specific
>    requirements it satisfies. Keep pure-core work separate from shell work, mark optional test
>    tasks, and include checkpoints to verify the build.
>
> 4. **Implement last.** Execute the tasks one wave at a time. Keep the simulation core pure (no DOM,
>    no timers, no `localStorage`, randomness only through an injected RNG) so it is unit- and
>    property-testable. Verify after each change. Do not gold-plate — implement exactly what the
>    requirements and design call for.
>
> **Rules to follow throughout:** treat the spec as the source of truth; do not write code before the
> requirements and design are settled; keep changes traceable to requirements; prefer small,
> verifiable steps; and pause for review at the end of each stage before moving to the next.

## How the Spec-Driven Build Went

Kiro produced the three spec documents under `.kiro/specs/flappy-kiro/` and then implemented the plan:

1. **`requirements.md`** — EARS-format acceptance criteria across 7 requirement groups.
2. **`design.md`** — architecture, pure-core/shell layering, `CONFIG` constants, `step()` semantics,
   14 correctness properties, and a testing strategy (Vitest + fast-check).
3. **`tasks.md`** — an ordered, checkbox task plan; each task cites the requirements it satisfies.
4. **Implementation** — the code below, built task by task with the core kept pure and testable.

## Project Structure

```
index.html              # Canvas element + ES module bootstrap
package.json            # Dev deps: Vitest + fast-check (single-run test script)
src/
  config.js             # CONFIG constants (physics, layout, storage key)
  core/                 # Pure simulation core (no DOM, no I/O, injected RNG)
    physics.js          # applyPhysics, applyFlap
    obstacles.js        # moveObstacles, pruneObstacles, maybeSpawn
    collision.js        # rectsOverlap, detectCollision (AABB + boundaries)
    scoring.js          # updateScoring (one point per passed pair)
    highscore.js        # parseHighScore (non-negative integer or 0)
    step.js             # Master state transition; createInitialState
  shell/                # Impure shell (DOM, canvas, storage, timing)
    GameEngine.js       # requestAnimationFrame loop, wiring, dt clamping
    renderer.js         # Canvas drawing (background, clouds, obstacles, character, score, overlays)
    input.js            # Mouse / touch / Space -> coalesced flap intents
    storage.js          # localStorage adapter (graceful failure)
.kiro/specs/flappy-kiro/  # requirements.md, design.md, tasks.md
```

## Architecture at a Glance

The design deliberately separates a **pure simulation core** from an **impure shell**:

- **Core** takes the current `GameState`, a delta time, input intents, and an RNG, and returns the
  next `GameState`. It never touches the DOM, storage, timers, or `Math.random` directly, which is
  what makes it unit- and property-testable.
- **Shell** owns the canvas, the `requestAnimationFrame` loop, event listeners, and the storage
  adapter. Each frame it measures real time (clamped to avoid physics jumps after backgrounding),
  drains coalesced input, calls the core `step()`, persists high-score changes, and renders.

## Testing

The spec defines 14 correctness properties intended for property-based testing with
[fast-check](https://github.com/dubzzz/fast-check) under Vitest, plus example-based unit tests and
mock-based shell tests. The test tasks are optional in the plan; to run them once written:

```bash
npm install
npm test
```

## Resources

- `assets/` — optional game audio and sprites (gameplay works without them)
- `img/` — screenshots and images
