// Flappy Kiro — configuration constants.
//
// Coordinate convention: origin top-left, +y points down, upward velocity is
// negative. All motion constants are expressed per second (px/s, px/s^2) and
// integrated against real delta time so behavior is frame-rate independent.

export const CONFIG = {
  PLAY_WIDTH: 480, // logical Play_Area width in px
  PLAY_HEIGHT: 640, // logical Play_Area height in px

  GRAVITY: 1200, // px/s^2   (Req 2.1)
  MAX_FALL_SPEED: 700, // px/s     (Req 2.2)
  FLAP_VELOCITY: -400, // px/s, upward = negative y (Req 2.3)

  CHAR_X: 120, // fixed horizontal center; 120/480 = 25% <= 40% (Req 1.4)
  CHAR_WIDTH: 40,
  CHAR_HEIGHT: 40,

  OBSTACLE_WIDTH: 70,
  SCROLL_SPEED: 180, // px/s within [100,300] (Req 3.1)
  OBSTACLE_SPACING: 300, // px within [200,400] (Req 3.2)
  GAP_HEIGHT: 200, // >= 1.5 * CHAR_HEIGHT = 60 (Req 3.3)
  GAP_CENTER_MIN_FRAC: 0.1, // Req 3.4
  GAP_CENTER_MAX_FRAC: 0.9, // Req 3.4

  SCORE_BAND_TOP_FRAC: 0.85, // Score_Display in lower 15% (Req 1.6)
  HS_STORAGE_KEY: 'flappyKiro.highScore',

  MAX_DT: 1 / 30, // clamp frame delta to avoid physics jumps after backgrounding
};
