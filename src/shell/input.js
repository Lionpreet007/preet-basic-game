// Flappy Kiro — input handler (impure shell).
//
// Mouse click (press+release), touch tap, and Space each enqueue exactly one
// flap intent. Intents are queued and drained once per frame so bursts between
// frames coalesce deterministically. The same intent doubles as start (Ready)
// and restart (GameOver); step() decides what to do with it per phase.

/**
 * Attach input listeners to a canvas and return an intent drainer + detach fn.
 * @param {HTMLCanvasElement} canvas
 * @param {EventTarget} [keyTarget=window]
 * @returns {{ drain: () => { flap: boolean, restart: boolean }, detach: () => void }}
 */
export function createInputHandler(canvas, keyTarget = window) {
  let flapQueued = false;
  const enqueue = () => {
    flapQueued = true;
  };

  let pressed = false;
  const onMouseDown = () => {
    pressed = true;
  };
  const onMouseUp = () => {
    if (pressed) enqueue();
    pressed = false;
  };
  const onTouchStart = (e) => {
    e.preventDefault();
    enqueue();
  };
  const onKeyDown = (e) => {
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      enqueue();
    }
  };

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  keyTarget.addEventListener('keydown', onKeyDown);

  return {
    // A single queued flap serves as flap / start / restart; step() disambiguates.
    drain() {
      const flap = flapQueued;
      flapQueued = false;
      return { flap, restart: flap };
    },
    detach() {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      keyTarget.removeEventListener('keydown', onKeyDown);
    },
  };
}
