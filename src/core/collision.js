// Flappy Kiro — collision detection (pure simulation core).
//
// Axis-aligned bounding-box (AABB) overlap plus Play_Area boundary checks.
// These are pure functions: no DOM, no mutation, no randomness, no timers.
//
// Coordinate convention: origin top-left, +y points down, upward velocity is
// negative. A Rect uses extents left=x, right=x+width, top=y, bottom=y+height.

import { CONFIG } from '../config.js';

/**
 * @typedef {Object} Rect
 * @property {number} x       left edge
 * @property {number} y       top edge
 * @property {number} width
 * @property {number} height
 *
 * @typedef {import('./step.js').Character} Character
 * @typedef {import('./step.js').ObstaclePair} ObstaclePair
 */

/**
 * AABB overlap test with a >= 1px threshold (Req 4.1).
 *
 * Two rectangles are considered colliding only when they overlap by at least
 * one pixel on BOTH axes. The overlap amount on an axis is the smaller of the
 * two "far edge minus near edge" gaps; requiring it to be >= 1 means a 0px
 * shared-edge touch does not count as a collision.
 *
 * @param {Rect} a
 * @param {Rect} b
 * @returns {boolean}
 */
export function rectsOverlap(a, b) {
  return (
    a.x + a.width - b.x >= 1 &&
    b.x + b.width - a.x >= 1 &&
    a.y + a.height - b.y >= 1 &&
    b.y + b.height - a.y >= 1
  );
}

/**
 * Character bounding Rect derived from its center (per the data model).
 * @param {Character} ch
 * @returns {Rect}
 */
export function charRect(ch) {
  return {
    x: ch.x - ch.width / 2,
    y: ch.y - ch.height / 2,
    width: ch.width,
    height: ch.height,
  };
}

/**
 * The top-obstacle Rect of an Obstacle_Pair (per the data model).
 * @param {ObstaclePair} o
 * @returns {Rect}
 */
export function topObstacleRect(o) {
  return {
    x: o.x,
    y: 0,
    width: o.width,
    height: o.gapCenterY - o.gapHeight / 2,
  };
}

/**
 * The bottom-obstacle Rect of an Obstacle_Pair (per the data model).
 * @param {ObstaclePair} o
 * @param {number} playHeight
 * @returns {Rect}
 */
export function bottomObstacleRect(o, playHeight) {
  const bottomTop = o.gapCenterY + o.gapHeight / 2;
  return {
    x: o.x,
    y: bottomTop,
    width: o.width,
    height: playHeight - bottomTop,
  };
}

/**
 * True when the Character collides with any obstacle, contacts/crosses the
 * Ground, or contacts/crosses the Ceiling (Req 4.1, 4.2, 4.3).
 *
 * - Ceiling contact: the Character Rect's top edge <= 0.
 * - Ground contact: the Character Rect's bottom edge >= playHeight.
 * - Obstacle contact: the Character Rect overlaps a top or bottom obstacle Rect
 *   by at least 1 pixel.
 *
 * @param {Character} ch
 * @param {ObstaclePair[]} obs
 * @param {number} playHeight
 * @returns {boolean}
 */
export function detectCollision(ch, obs, playHeight) {
  const c = charRect(ch);

  // Ceiling contact/crossing (Req 4.3).
  if (c.y <= 0) return true;

  // Ground contact/crossing (Req 4.2).
  if (c.y + c.height >= playHeight) return true;

  // Obstacle overlap (Req 4.1).
  for (const o of obs) {
    if (
      rectsOverlap(c, topObstacleRect(o)) ||
      rectsOverlap(c, bottomObstacleRect(o, playHeight))
    ) {
      return true;
    }
  }

  return false;
}
