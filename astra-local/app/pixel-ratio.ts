// Phones draw the star scenes as sharp as the screen allows, up to 2x, and
// step down (2 → 1.5 → 1, never back up) only if the device cannot keep up.
// One budget for both canvases (star-sky.tsx, astra-field.tsx): they share the GPU.
const STEPS = [2, 1.5, 1];
// A verdict every 60 frames, on the median and the slower frames, so a single
// hitch never counts but a device that keeps stuttering steps down quickly.
const SAMPLES = 60;
const SLOW_MEDIAN_MS = 20; // under about 50 fps
const SLOW_TAIL_MS = 30; // one frame in five slower than this
// Frames right after loading or after a change are not judged.
const SETTLE_MS = 1000;

// Phones that say they are modest (Chrome reports memory and cores) start a
// step or two lower; the others, and Safari, which says nothing, start sharp.
const startingStep = () => {
  if (typeof navigator === 'undefined') return 0;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const cores = navigator.hardwareConcurrency;
  if (memory !== undefined && memory <= 2) return 2;
  if ((memory !== undefined && memory <= 4) || (cores !== undefined && cores <= 4)) return 1;
  return 0;
};

let step = startingStep();
let samples: number[] = [];
let settleUntil = 0;
const listeners = new Set<() => void>();

export const phonePixelRatio = () => Math.min(devicePixelRatio, STEPS[step]);

/** Called when the ratio steps down; returns the unsubscribe function. */
export function watchPixelRatio(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Time between two animation frames that actually drew. */
export function reportFrame(now: number, delta: number) {
  if (step === STEPS.length - 1 || delta > 250) return;
  if (!settleUntil) settleUntil = now + SETTLE_MS;
  if (now < settleUntil) return;
  samples.push(delta);
  if (samples.length < SAMPLES) return;
  samples.sort((a, b) => a - b);
  const median = samples[samples.length >> 1];
  const tail = samples[Math.floor(samples.length * 0.8)];
  samples = [];
  if (median <= SLOW_MEDIAN_MS && tail <= SLOW_TAIL_MS) return;
  step++;
  settleUntil = now + SETTLE_MS;
  listeners.forEach((listener) => listener());
}
