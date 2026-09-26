// Flappy Kiro — pure physics core.
//
// These functions are pure: they never mutate their inputs, touch the DOM,
// read storage, use timers, or call Math.random. Given a Character (and a
// delta time for integration), they return a brand-new Character.
//
// Coordinate convention: origin top-left, +y down, upward velocity negative.

import { CONFIG } from '../config.js';

/**
 * @typedef {Object} Character
 * @property {number} x   horizontal center (constant = CONFIG.CHAR_X)
 * @property {number} y   vertical center
 * @property {number} vy  vertical velocity, px/s
 * @property {number} width
 * @property {number} height
 */

/**
 * Semi-implicit Euler integration for one step while Running.
 *
 * Applies gravity to the vertical velocity, caps the downward velocity at
 * MAX_FALL_SPEED, then advances the vertical position by the (capped)
 * velocity over dt. Returns a new Character; the input is not mutated.
 *
 *   vy' = min(vy + GRAVITY * dt, MAX_FALL_SPEED)   (Req 2.1, 2.2)
 *   y'  = y + vy' * dt
 *
 * @param {Character} ch
 * @param {number} dt seconds
 * @returns {Character}
 */
export function applyPhysics(ch, dt) {
  const vy = Math.min(ch.vy + CONFIG.GRAVITY * dt, CONFIG.MAX_FALL_SPEED);
  return { ...ch, vy, y: ch.y + vy * dt };
}

/**
 * Replace the Character's vertical velocity with a fixed upward impulse,
 * independent of the prior velocity. Returns a new Character; the input is
 * not mutated.
 *
 *   vy' = FLAP_VELOCITY   (Req 2.3)
 *
 * @param {Character} ch
 * @returns {Character}
 */
export function applyFlap(ch) {
  return { ...ch, vy: CONFIG.FLAP_VELOCITY };
}
