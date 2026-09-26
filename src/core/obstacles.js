// Flappy Kiro — pure obstacle generation, movement, and pruning core.
//
// These functions are pure: they never mutate their inputs, touch the DOM,
// read storage, use timers, or call Math.random. Randomness enters only
// through an injected Rng so generation is deterministic in tests.
//
// Coordinate convention: origin top-left, +y down, upward velocity negative.

import { CONFIG } from '../config.js';

/**
 * @typedef {Object} ObstaclePair
 * @property {number} id          unique, monotonically increasing
 * @property {number} x           left edge of the pair (both obstacles share x)
 * @property {number} width
 * @property {number} gapCenterY  vertical center of the Gap
 * @property {number} gapHeight   vertical height of the Gap
 * @property {boolean} scored     whether this pair has already awarded a point
 */

/**
 * @typedef {() => number} Rng  returns a float in [0, 1)
 */

/**
 * Decide whether (and where) to spawn a new Obstacle_Pair based on the
 * distance the world has scrolled since the last spawn.
 *
 * Distance accumulates at the scroll speed (SCROLL_SPEED * dt), matching the
 * leftward movement of existing obstacles, so consecutive pairs end up spaced
 * by OBSTACLE_SPACING px horizontally (within the 200-400 band, Req 3.2).
 *
 * When the accumulated distance reaches OBSTACLE_SPACING a new pair is spawned
 * at the right edge of the Play_Area (x = PLAY_WIDTH) and the accumulator is
 * reduced by OBSTACLE_SPACING (carrying any remainder forward so spacing does
 * not drift over time). The new pair receives a monotonically increasing id.
 *
 * The Gap:
 *  - gapHeight = GAP_HEIGHT, which is >= 1.5 * CHAR_HEIGHT (Req 3.3).
 *  - gapCenterY is drawn from the 10-90% band of the Play_Area height using the
 *    injected Rng, then clamped so the full Gap stays inside the Play_Area
 *    (Req 3.4): gapCenterY in [max(0.10*H, gapHeight/2), min(0.90*H, H - gapHeight/2)].
 *
 * Returns a new GameState; the input state and its obstacle list are not
 * mutated.
 *
 * @param {import('./step.js').GameState} state
 * @param {number} dt seconds
 * @param {Rng} rng
 * @returns {import('./step.js').GameState}
 */
export function maybeSpawn(state, dt, rng) {
  const distance = state.distanceSinceLastSpawn + CONFIG.SCROLL_SPEED * dt;

  // Not far enough yet: just carry the accumulated distance forward.
  if (distance < CONFIG.OBSTACLE_SPACING) {
    return { ...state, distanceSinceLastSpawn: distance };
  }

  const gapHeight = CONFIG.GAP_HEIGHT;
  const H = CONFIG.PLAY_HEIGHT;

  // Center band from the 10-90% placement rule, then tightened so the whole
  // Gap fits inside the Play_Area.
  const lo = Math.max(CONFIG.GAP_CENTER_MIN_FRAC * H, gapHeight / 2);
  const hi = Math.min(CONFIG.GAP_CENTER_MAX_FRAC * H, H - gapHeight / 2);

  // Guard against a degenerate/inverted band (e.g. an over-large gap): clamp
  // to the midpoint so gapCenterY is always well-defined and inside the area.
  const gapCenterY = lo <= hi ? lo + rng() * (hi - lo) : (lo + hi) / 2;

  const pair = {
    id: state.nextObstacleId,
    x: CONFIG.PLAY_WIDTH,
    width: CONFIG.OBSTACLE_WIDTH,
    gapCenterY,
    gapHeight,
    scored: false,
  };

  return {
    ...state,
    obstacles: [...state.obstacles, pair],
    // Carry the remainder so spacing does not drift across spawns.
    distanceSinceLastSpawn: distance - CONFIG.OBSTACLE_SPACING,
    nextObstacleId: state.nextObstacleId + 1,
  };
}

/**
 * Move all obstacles left by SCROLL_SPEED * dt, preserving count and relative
 * order. Returns a new array of new obstacle objects; the input is not mutated.
 * (Req 3.1 / Property 5)
 *
 * @param {ObstaclePair[]} obs
 * @param {number} dt seconds
 * @returns {ObstaclePair[]}
 */
export function moveObstacles(obs, dt) {
  const dx = CONFIG.SCROLL_SPEED * dt;
  return obs.map((o) => ({ ...o, x: o.x - dx }));
}

/**
 * Drop obstacles that have moved completely past the left edge, keeping only
 * those with x + width >= 0. Returns a new array; the input is not mutated.
 * (Req 3.5 / Property 8)
 *
 * @param {ObstaclePair[]} obs
 * @returns {ObstaclePair[]}
 */
export function pruneObstacles(obs) {
  return obs.filter((o) => o.x + o.width >= 0);
}