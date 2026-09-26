# Product

Flappy Kiro is a retro endless-scroller game that runs entirely in a web browser, styled after Flappy Bird.

## Core concept

The player controls a blue Superman-style character (with a cape) that flaps to rise against gravity and falls otherwise. The character must fly through gaps between pairs of green vertical obstacles that continuously scroll from right to left. The game ends on collision with an obstacle, the ground, or the ceiling.

## Key features

- Flap mechanic via mouse click, touch tap, or spacebar.
- Endless procedurally-generated obstacle pairs with randomized gap placement.
- Scoring: one point per obstacle pair cleared.
- High score persisted across browser sessions via `localStorage`.
- Three game states: Ready, Running, Game_Over, with start/restart flow (no page reload).

## Visual theme

- Light green background with white clouds.
- Green top-and-bottom obstacle pairs separated by a passable gap.
- Character positioned toward the left side of the play area.
- Score display in the lower area showing current score and high score (e.g. "Score: 9 | High: 14").

## Design priorities

- Zero-build, dependency-free runtime: the game should run by opening a single HTML file.
- Frame-rate-independent physics using delta-time integration.
- Graceful degradation when storage or optional assets are unavailable.
