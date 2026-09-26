// Flappy Kiro — scoring core (pure).
//
// updateScoring(ch, obs) awards at most one point per Obstacle_Pair per session:
// a pair scores when the Character's center has passed (>=) the pair's center
// and the pair has not yet been scored. Inputs are never mutated; a new
// obstacles array is returned with `scored` flags updated, plus the number of
// points gained this step.
//
// Coordinate convention: origin top-left, +y down. The pair center x is
// `obstacle.x + width / 2`; the Character center x is `ch.x`.

/**
 * @typedef {Object} Character
 * @property {number} x   horizontal center
 *
 * @typedef {Object} ObstaclePair
 * @property {number} x       left edge
 * @property {number} width
 * @property {boolean} scored whether this pair has already awarded a point
 */

/**
 * Count unscored pairs whose center the Character's center has passed, mark
 * them scored, and report the number of points gained. Pure: returns a new
 * array; existing scored pairs pass through unchanged. (Req 5.1, 5.4)
 *
 * @param {Character} ch
 * @param {ObstaclePair[]} obs
 * @returns {{ obstacles: ObstaclePair[], gained: number }}
 */
export function updateScoring(ch, obs) {
  let gained = 0;
  const obstacles = obs.map((o) => {
    const center = o.x + o.width / 2;
    if (!o.scored && ch.x >= center) {
      gained += 1;
      return { ...o, scored: true };
    }
    return o;
  });
  return { obstacles, gained };
}
