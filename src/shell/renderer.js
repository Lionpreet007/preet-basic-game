// Flappy Kiro — canvas renderer (impure shell).
//
// The renderer derives everything it draws from GameState. It never advances
// the simulation. Draw order: background -> clouds -> obstacles -> character
// -> score display -> phase overlay. Cosmetic-only effects (cloud drift,
// character tilt) must not affect physics, collision, or scoring.

import { CONFIG } from '../config.js';

const COLORS = {
  background: '#bfe8b0', // light green (Req 1.1)
  cloud: '#ffffff',
  obstacle: '#3fa34d', // green (Req 1.5)
  obstacleShade: '#2e7d3a', // darker green pipe cap/rim (cosmetic only)
  character: '#1e6fd6', // blue body (Req 1.3)
  characterShade: '#1657a8', // darker blue for limbs/shading
  cape: '#c0392b', // red cape (Req 1.3)
  capeShade: '#96271b', // darker red for cape fold
  emblem: '#f1c40f', // gold chest emblem accent
  skin: '#f2c9a0', // head/face
  text: '#183a1d',
  // Overlay-specific colors (phase instruction overlays).
  overlayScrim: 'rgba(0, 0, 0, 0.45)', // dimming backdrop behind Game_Over text
  overlayText: '#ffffff', // light text drawn over the scrim
  overlayTextShadow: 'rgba(0, 0, 0, 0.55)', // subtle shadow for Ready text legibility
};

/**
 * Draw the full frame for the given state.
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../core/step.js').GameState} state
 * @param {number} [nowMs] wall-clock ms, cosmetic animation only
 */
export function render(ctx, state, nowMs = 0) {
  drawBackground(ctx);
  drawClouds(ctx, nowMs);
  drawObstacles(ctx, state.obstacles);
  drawCharacter(ctx, state.character);
  drawScore(ctx, state.score, state.highScore);
  drawOverlay(ctx, state.phase);
}

function drawBackground(ctx) {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, CONFIG.PLAY_WIDTH, CONFIG.PLAY_HEIGHT);
}

function drawClouds(ctx, nowMs) {
  // Cosmetic parallax drift; purely visual, never touches state.
  const drift = (nowMs / 40) % (CONFIG.PLAY_WIDTH + 120);
  ctx.fillStyle = COLORS.cloud;
  drawCloud(ctx, CONFIG.PLAY_WIDTH - drift, 90);
  drawCloud(ctx, CONFIG.PLAY_WIDTH * 1.6 - drift, 180);
}

function drawCloud(ctx, cx, cy) {
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.arc(cx + 26, cy + 6, 28, 0, Math.PI * 2);
  ctx.arc(cx + 56, cy, 20, 0, Math.PI * 2);
  ctx.fill();
}

function drawObstacles(ctx, obstacles) {
  // Each Obstacle_Pair renders as a green top and bottom rectangle separated by
  // the Gap (Req 1.5). Rects are derived per the design's Data Models:
  //   Top:    { x, y: 0,                          width, height: gapCenterY - gapHeight/2 }
  //   Bottom: { x, y: gapCenterY + gapHeight/2,   width, height: PLAY_HEIGHT - (gapCenterY + gapHeight/2) }
  // A darker rim at each gap-facing edge is cosmetic only and never affects the
  // collision Rects, which the core derives independently.
  const capH = 12; // cosmetic pipe-cap thickness
  for (const o of obstacles) {
    const topH = o.gapCenterY - o.gapHeight / 2;
    const bottomY = o.gapCenterY + o.gapHeight / 2;
    const bottomH = CONFIG.PLAY_HEIGHT - bottomY;

    // Green fills for the top and bottom obstacles (Req 1.5).
    ctx.fillStyle = COLORS.obstacle;
    ctx.fillRect(o.x, 0, o.width, topH);
    ctx.fillRect(o.x, bottomY, o.width, bottomH);

    // Darker cap at each gap-facing edge for a retro pipe look (cosmetic).
    ctx.fillStyle = COLORS.obstacleShade;
    if (topH > 0) {
      ctx.fillRect(o.x, Math.max(0, topH - capH), o.width, Math.min(capH, topH));
    }
    if (bottomH > 0) {
      ctx.fillRect(o.x, bottomY, o.width, Math.min(capH, bottomH));
    }
  }
}

function drawCharacter(ctx, ch) {
  // A blue Superman-style avatar with a flowing red cape (Req 1.3).
  // All geometry is derived from the Character center (ch.x, ch.y), so the
  // avatar's horizontal center stays at CHAR_X within the leftmost 40% band
  // (Req 1.4). Drawing here is cosmetic only and never touches simulation.
  const cx = ch.x;
  const cy = ch.y;
  const w = ch.width;
  const h = ch.height;
  const left = cx - w / 2;
  const top = cy - h / 2;

  ctx.save();

  // Cape: a flowing shape trailing behind (left of) the body, anchored at the
  // shoulders and billowing down and back. Two-tone for a bit of depth.
  ctx.fillStyle = COLORS.cape;
  ctx.beginPath();
  ctx.moveTo(left + w * 0.3, top + h * 0.15); // right shoulder anchor
  ctx.lineTo(left - w * 0.35, top + h * 0.35); // top billow behind
  ctx.lineTo(left - w * 0.2, top + h * 1.05); // trailing bottom tip
  ctx.lineTo(left + w * 0.35, top + h * 0.85); // back to lower body
  ctx.closePath();
  ctx.fill();
  // Cape fold shadow.
  ctx.fillStyle = COLORS.capeShade;
  ctx.beginPath();
  ctx.moveTo(left - w * 0.05, top + h * 0.35);
  ctx.lineTo(left - w * 0.2, top + h * 1.05);
  ctx.lineTo(left + w * 0.15, top + h * 0.9);
  ctx.closePath();
  ctx.fill();

  // Legs (darker blue).
  ctx.fillStyle = COLORS.characterShade;
  ctx.fillRect(left + w * 0.2, top + h * 0.72, w * 0.22, h * 0.3);
  ctx.fillRect(left + w * 0.58, top + h * 0.72, w * 0.22, h * 0.3);

  // Torso (blue body).
  ctx.fillStyle = COLORS.character;
  roundRect(ctx, left + w * 0.18, top + h * 0.32, w * 0.64, h * 0.46, 4);
  ctx.fill();

  // Arms (blue), one raised in a flight pose.
  ctx.fillStyle = COLORS.character;
  roundRect(ctx, left + w * 0.6, top + h * 0.18, w * 0.28, h * 0.2, 3); // forward/up arm
  ctx.fill();
  ctx.fillStyle = COLORS.characterShade;
  roundRect(ctx, left + w * 0.08, top + h * 0.4, w * 0.16, h * 0.28, 3); // trailing arm
  ctx.fill();

  // Chest emblem (gold diamond) — the classic Superman cue.
  const ecx = left + w * 0.5;
  const ecy = top + h * 0.5;
  const er = w * 0.12;
  ctx.fillStyle = COLORS.emblem;
  ctx.beginPath();
  ctx.moveTo(ecx, ecy - er);
  ctx.lineTo(ecx + er * 0.8, ecy);
  ctx.lineTo(ecx, ecy + er);
  ctx.lineTo(ecx - er * 0.8, ecy);
  ctx.closePath();
  ctx.fill();

  // Head.
  ctx.fillStyle = COLORS.skin;
  ctx.beginPath();
  ctx.arc(cx, top + h * 0.18, h * 0.16, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Cosmetic helper: trace a rounded rectangle path (caller fills/strokes).
function roundRect(ctx, x, y, width, height, r) {
  const radius = Math.min(r, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawScore(ctx, score, highScore) {
  ctx.fillStyle = COLORS.text;
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  const y = CONFIG.PLAY_HEIGHT * CONFIG.SCORE_BAND_TOP_FRAC + 28;
  ctx.fillText(`Score: ${score} | High: ${highScore}`, CONFIG.PLAY_WIDTH / 2, y);
}

// Phase overlays. Ready draws a start instruction (Req 7.1); Game_Over draws a
// "Game Over" heading plus a restart instruction over a dimming scrim that
// stays visible for the whole Game_Over phase — i.e. until the state
// transitions back to Ready (Req 4.5, 7.4). No overlay is drawn while Running,
// so gameplay is never obscured.
function drawOverlay(ctx, phase) {
  if (phase === 'Running') return;

  const cx = CONFIG.PLAY_WIDTH / 2;
  const cy = CONFIG.PLAY_HEIGHT / 2;
  ctx.save();
  ctx.textAlign = 'center';

  if (phase === 'Ready') {
    // Ready: a start instruction (Req 7.1). No scrim — the play field is empty
    // and inviting. A soft shadow keeps the text readable over clouds.
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 20px sans-serif';
    ctx.shadowColor = COLORS.overlayTextShadow;
    ctx.shadowBlur = 4;
    ctx.fillStyle = COLORS.text;
    ctx.fillText('Click, tap, or press Space to start', cx, cy);
  } else if (phase === 'GameOver') {
    // Game_Over: dim the whole Play_Area, then show the heading and a restart
    // instruction that remains visible until Ready (Req 4.5, 7.4).
    ctx.fillStyle = COLORS.overlayScrim;
    ctx.fillRect(0, 0, CONFIG.PLAY_WIDTH, CONFIG.PLAY_HEIGHT);

    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.overlayText;

    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('Game Over', cx, cy - 16);

    ctx.font = '18px sans-serif';
    ctx.fillText('Click, tap, or press Space to restart', cx, cy + 22);
  }

  ctx.restore();
}
