// Flappy Kiro — pure simulation core.
//
// step(state, dt, intents, rng) returns the NEXT GameState. It never mutates
// its inputs, touches the DOM, reads localStorage, uses timers, or calls
// Math.random directly. Randomness enters only through the injected `rng`.
//
// Coordinate convention: origin top-left, +y down, upward velocity negative.

import { CONFIG } from '../config.js';
import { applyPhysics, applyFlap } from './physics.js';
import { moveObstacles, pruneObstacles, maybeSpawn } from './obstacles.js';
import { detectCollision } from './collision.js';
import { updateScoring } from './scoring.js';

/**
 * @typedef {'Ready' | 'Running' | 'GameOver'} Phase
 * @typedef {() => number} Rng  float in [0, 1)
 * @typedef {{ flap: boolean, restart: boolean }} Intents
 *
 * @typedef {Object} Character
 * @property {number} x   horizontal center (constant = CONFIG.CHAR_X)
 * @property {number} y   vertical center
 * @property {number} vy  vertical velocity, px/s
 * @property {number} width
 * @property {number} height
 *
 * @typedef {Object} ObstaclePair
 * @property {number} id
 * @property {number} x         left edge
 * @property {number} width
 * @property {number} gapCenterY
 * @property {number} gapHeight
 * @property {boolean} scored
 *
 * @typedef {Object} GameState
 * @property {Phase} phase
 * @property {Character} character
 * @property {ObstaclePair[]} obstacles
 * @property {number} score
 * @property {number} highScore
 * @property {number} distanceSinceLastSpawn
 * @property {number} nextObstacleId
 */

/** Build a fresh character at its starting position. @returns {Character} */
function startingCharacter() {
  return {
    x: CONFIG.CHAR_X,
    y: CONFIG.PLAY_HEIGHT / 2,
    vy: 0,
    width: CONFIG.CHAR_WIDTH,
    height: CONFIG.CHAR_HEIGHT,
  };
}

/**
 * Create the initial Ready state.
 * @param {number} [highScore=0]
 * @returns {GameState}
 */
export function createInitialState(highScore = 0) {
  return {
    phase: 'Ready',
    character: startingCharacter(),
    obstacles: [],
    score: 0,
    highScore,
    distanceSinceLastSpawn: 0,
    nextObstacleId: 1,
  };
}

/**
 * Master transition function used by the loop.
 * @param {GameState} state
 * @param {number} dt seconds, already clamped by the shell
 * @param {Intents} intents
 * @param {Rng} rng
 * @returns {GameState}
 */
export function step(state, dt, intents, rng) {
  switch (state.phase) {
    case 'Ready': {
      if (intents.flap) {
        return {
          ...createInitialState(state.highScore),
          phase: 'Running',
        };
      }
      return state;
    }

    case 'Running': {
      let character = intents.flap ? applyFlap(state.character) : state.character;
      character = applyPhysics(character, dt);

      let next = { ...state, character };
      next.obstacles = moveObstacles(next.obstacles, dt);
      next = maybeSpawn(next, dt, rng);
      next.obstacles = pruneObstacles(next.obstacles);

      const scoring = updateScoring(character, next.obstacles);
      next.obstacles = scoring.obstacles;
      next.score += scoring.gained;

      if (detectCollision(character, next.obstacles, CONFIG.PLAY_HEIGHT)) {
        return {
          ...next,
          phase: 'GameOver',
          highScore: Math.max(next.highScore, next.score),
        };
      }
      return next;
    }

    case 'GameOver': {
      if (intents.restart) {
        return createInitialState(state.highScore);
      }
      return state;
    }

    default:
      return state;
  }
}
