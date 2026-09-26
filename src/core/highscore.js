// Flappy Kiro — high-score parsing (pure simulation core).
//
// parseHighScore is a pure function: no DOM, no localStorage, no randomness.
// It is the single source of truth for turning a stored string (or null) into
// a trustworthy in-session High_Score value. The storage adapter (shell) reads
// a raw string from Browser_Storage and passes it through here so that any
// missing, non-numeric, negative, floating-point, or overflowing value degrades
// to 0 without surfacing an error to the Player (Req 6.4, 6.5).
//
// Coordinate/data note: the High_Score is always a non-negative integer.

/**
 * Parse a stored high-score value into a non-negative integer.
 *
 * Returns the parsed value ONLY when `raw` is a bare run of ASCII digits that
 * denotes a non-negative safe integer; otherwise returns 0. This rejects:
 *   - null / undefined
 *   - the empty string (and whitespace-only strings)
 *   - non-numeric junk ("abc", "12px", "NaN", "Infinity")
 *   - signed / negative values ("-5", "+5")
 *   - floating-point values ("3.14", "1e3", "10.0")
 *   - overflowing values that exceed the safe-integer range and therefore lose
 *     precision (rejected by the safe-integer guard)
 *
 * @param {string | null | undefined} raw  the raw stored value
 * @returns {number} a non-negative integer, or 0 when `raw` is not one
 */
export function parseHighScore(raw) {
  if (raw == null) return 0;

  // Only accept a bare run of ASCII digits: this rejects signs, decimal points,
  // exponents, whitespace, and any other non-numeric characters up front.
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) return 0;

  const n = Number(raw);

  // Guard against overflow: a digit string beyond Number.MAX_SAFE_INTEGER
  // parses to an imprecise value. Requiring a safe integer rejects those
  // ("overflowing") values. The `n < 0` guard is belt-and-suspenders — the
  // digits-only regex already excludes signs.
  if (!Number.isSafeInteger(n) || n < 0) return 0;

  return n;
}
