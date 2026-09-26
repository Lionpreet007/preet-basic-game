# Tech Stack

## Runtime

- Plain **HTML / CSS / JavaScript** (ES modules) — no framework, no runtime dependencies.
- **HTML5 Canvas** for all rendering (immediate-mode 2D drawing).
- **`requestAnimationFrame`** drives the game loop, using a high-resolution timestamp for delta-time physics.
- **`localStorage`** for high-score persistence.
- Zero-build: the game runs by opening `index.html` directly in a browser. Do not introduce a bundler or transpiler for the runtime.

## Development & testing

- **Vitest** as the test runner.
- **fast-check** for property-based testing.
- These are dev-only dependencies declared in `package.json`. They must not leak into runtime code.

## Conventions

- Use ES modules (`import` / `export`), not CommonJS.
- Keep the **simulation core pure**: no DOM, `localStorage`, timers, or `Math.random` inside core functions. Randomness enters only through an injected `Rng` (`() => number` in `[0, 1)`); pure functions return new objects rather than mutating inputs.
- Confine all side effects (canvas, event listeners, storage, real time) to the shell.
- Coordinate convention: origin top-left, `+y` points down, upward velocity is negative. Document this where core logic lives.
- Centralize tunable constants in a single `CONFIG` object (see `src/config.js`) rather than scattering magic numbers.
- Wrap all `localStorage` access in try/catch so failures degrade gracefully and never interrupt gameplay.
- Clamp frame delta time (`MAX_DT = 1/30`s) to avoid physics jumps after the tab is backgrounded.
- Property tests use fast-check with a minimum of 100 generated inputs and are tagged: `// Feature: flappy-kiro, Property {number}: {property_text}`.

## Common commands

```bash
# Install dev dependencies
npm install

# Run the test suite once (not watch mode)
npm test
```

Run the game by opening `index.html` in a browser (no build step).
