// Flappy Kiro — GameEngine (impure shell orchestrator).
//
// GameEngine owns the requestAnimationFrame loop, holds the current GameState,
// and coordinates the pure core, the renderer, input, and storage. It never
// implements gameplay rules itself: those live in the pure core (step()). The
// engine only measures real time, drains input, calls step(), persists
// high-score changes, and renders.
//
// Per-frame flow:
//   dt = clamp((now - last) / 1000, 0, MAX_DT)   // frame-rate independent
//   intents = input.drain()                       // coalesced once per frame
//   state = step(state, dt, intents, rng)         // pure
//   if highScore changed -> storage.writeHighScore(...)
//   render(ctx, state)
//   schedule next frame

import { CONFIG } from '../config.js';
import { step, createInitialState } from '../core/step.js';
import { render } from './renderer.js';
import { createInputHandler } from './input.js';
import { readHighScore, writeHighScore } from './storage.js';

export class GameEngine {
  /**
   * @param {Object} deps
   * @param {HTMLCanvasElement} deps.canvas   canvas to render into
   * @param {() => number} [deps.rng]         RNG in [0,1); injected for determinism
   * @param {Storage} [deps.storage]          storage adapter target (defaults to localStorage)
   * @param {(cb: FrameRequestCallback) => number} [deps.raf]  frame scheduler (injectable for tests)
   * @param {(id: number) => void} [deps.cancelRaf]
   * @param {() => number} [deps.now]          high-res clock in ms (injectable for tests)
   */
  constructor({ canvas, rng, storage, raf, cancelRaf, now } = {}) {
    if (!canvas) throw new Error('GameEngine requires a canvas');

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.rng = rng ?? Math.random;
    this.storage = storage;
    this._raf = raf ?? ((cb) => requestAnimationFrame(cb));
    this._cancelRaf = cancelRaf ?? ((id) => cancelAnimationFrame(id));
    this._now = now ?? (() => performance.now());

    // Logical Play_Area size; the canvas is scaled to it at draw time.
    this.canvas.width = CONFIG.PLAY_WIDTH;
    this.canvas.height = CONFIG.PLAY_HEIGHT;

    // Read persisted high score before the first render (Req 6.3).
    const highScore = readHighScore(this.storage);
    this.state = createInitialState(highScore);

    this.input = createInputHandler(canvas);

    this._rafId = null;
    this._lastTime = null;
    this._running = false;
    this._onFrame = this._onFrame.bind(this);
  }

  /** Start the loop. Renders the initial Ready frame, then schedules frames. */
  start() {
    if (this._running) return;
    this._running = true;
    this._lastTime = this._now();
    render(this.ctx, this.state, this._lastTime); // draw Ready before first step
    this._rafId = this._raf(this._onFrame);
  }

  /** Stop the loop without tearing down state. */
  stop() {
    if (!this._running) return;
    this._running = false;
    if (this._rafId != null) this._cancelRaf(this._rafId);
    this._rafId = null;
  }

  /** Stop the loop and detach input listeners. */
  destroy() {
    this.stop();
    this.input.detach();
  }

  /** One frame: advance the simulation by clamped dt, persist, render. */
  _onFrame(now) {
    if (!this._running) return;

    const dt = clamp((now - this._lastTime) / 1000, 0, CONFIG.MAX_DT);
    this._lastTime = now;

    this.advance(dt, now);

    this._rafId = this._raf(this._onFrame);
  }

  /**
   * Advance the simulation one step and render. Separated from the rAF callback
   * so tests can drive fixed deltas without a real frame scheduler.
   * @param {number} dt seconds (caller is responsible for clamping if bypassing _onFrame)
   * @param {number} [nowMs] wall-clock ms for cosmetic animation
   */
  advance(dt, nowMs = 0) {
    const prevHigh = this.state.highScore;
    const intents = this.input.drain();

    this.state = step(this.state, dt, intents, this.rng);

    if (this.state.highScore !== prevHigh) {
      writeHighScore(this.state.highScore, this.storage);
    }

    render(this.ctx, this.state, nowMs);
  }
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
