// Flappy Kiro — storage adapter (impure shell).
//
// All localStorage access is wrapped so failures degrade gracefully and never
// interrupt gameplay. parseHighScore is pure and independently testable.

import { CONFIG } from '../config.js';
import { parseHighScore } from '../core/highscore.js';

// parseHighScore lives in the pure core (src/core/highscore.js). Re-exported
// here for the shell's callers and existing importers of this adapter.
export { parseHighScore };

/**
 * Read the high score, tolerating unavailable storage.
 * @param {Storage} [storage=localStorage]
 * @returns {number}
 */
export function readHighScore(storage = defaultStorage()) {
  try {
    return parseHighScore(storage ? storage.getItem(CONFIG.HS_STORAGE_KEY) : null);
  } catch {
    return 0;
  }
}

/**
 * Persist the high score. Never throws; returns whether the write succeeded.
 * @param {number} value
 * @param {Storage} [storage=localStorage]
 * @returns {boolean}
 */
export function writeHighScore(value, storage = defaultStorage()) {
  try {
    if (!storage) return false;
    storage.setItem(CONFIG.HS_STORAGE_KEY, String(value));
    return true;
  } catch {
    return false;
  }
}

function defaultStorage() {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}
