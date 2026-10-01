// One quality budget for every screen, from a new phone to an old laptop.
// Both star canvases (star-sky.tsx, astra-field.tsx) share the GPU, so they
// share this ladder too. Each rung costs less than the one before:
//   0  as sharp as the screen allows, up to 2x
//   1  at most 1.5x
//   2  at most 1x
//   3  "lite": 1x, fewer stars, a lighter nebula, still CSS (gm-lite on <html>)
// A device starts on the rung its hints suggest and steps down, never back up,
// only if it cannot keep up. A rung that would change nothing on this screen
// (a 1x screen asked for 1.5x) is skipped, so a slow device gets help quickly.
const CAPS = [2, 1.5, 1, 1];
export const LITE = 3;
// A verdict every 60 frames, on the median and the slower frames, so a single
// hitch never counts but a device that keeps stuttering steps down quickly.
const SAMPLES = 60;
const SLOW_MEDIAN_MS = 20; // under about 50 fps
const SLOW_TAIL_MS = 30; // one frame in five slower than this
// Frames right after loading or after a change are not judged.
const SETTLE_MS = 1000;

type Nav = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
// Server rendering has no device to ask (Node's own navigator is not one).
const nav = () => (typeof window === 'undefined' ? undefined : (navigator as Nav));

/** A phone that says it is modest (Chrome: 4 GB of memory or less) or asks to
 *  save data. Safari says nothing and is never treated as modest. */
export const modestDevice = () => {
  const n = nav();
  return !!n && (!!n.connection?.saveData || (n.deviceMemory !== undefined && n.deviceMemory <= 4));
};

// Devices that say they are modest (Chrome reports memory and cores) start a
// rung or more lower; the others, and Safari, which says nothing, start sharp.
const startingLevel = () => {
  const n = nav();
  if (!n) return 0;
  // ?lite in the address previews the lightest rung on any device.
  if (new URLSearchParams(location.search).has('lite')) return LITE;
  const memory = n.deviceMemory;
  const cores = n.hardwareConcurrency;
  if (n.connection?.saveData || (memory !== undefined && memory <= 2) || (cores !== undefined && cores <= 2)) return LITE;
  if ((memory !== undefined && memory <= 4) || (cores !== undefined && cores <= 4)) return 1;
  return 0;
};

// Graphics chips known to struggle with full-screen star fields: software
// renderers, early mobile GPUs, Intel integrated graphics before 2015.
const WEAK_GPU = /swiftshader|llvmpipe|softpipe|basic render|mali-[4t]|mali-g(31|51|52)\b|adreno[^0-9]*[2-4]\d\d\b|adreno[^0-9]*50\d\b|powervr|sgx|intel.*(gma|hd graphics( [2-5]\d{3}\b|\)|$| family))/i;

let level = startingLevel();
let samples: number[] = [];
let settleUntil = 0;
const listeners = new Set<() => void>();

const ratioAt = (rung: number) => Math.min(typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, CAPS[rung]);

const apply = (next: number) => {
  // Skip the rungs that would not change anything here.
  while (next < LITE && ratioAt(next) >= ratioAt(level)) next++;
  if (next <= level) return;
  level = next;
  samples = [];
  settleUntil = 0;
  if (typeof document !== 'undefined') document.documentElement.classList.toggle('gm-lite', level >= LITE);
  listeners.forEach((listener) => listener());
};

/** The canvases' pixel ratio on this rung (the sky may cap it lower). */
export const sceneRatio = () => ratioAt(level);
/** True once the device is on the lightest rung. */
export const isLite = () => level >= LITE;

/** Called whenever the rung changes; returns the unsubscribe function. */
export function watchQuality(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Read once from the first WebGL context: a weak chip starts lighter. */
export function hintGpu(gl: WebGLRenderingContext | WebGL2RenderingContext) {
  try {
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
    if (WEAK_GPU.test(name)) apply(LITE);
  } catch {}
}

/** Time between two animation frames that actually drew. */
export function reportFrame(now: number, delta: number) {
  if (level >= LITE || delta > 250) return;
  if (!settleUntil) settleUntil = now + SETTLE_MS;
  if (now < settleUntil) return;
  samples.push(delta);
  if (samples.length < SAMPLES) return;
  samples.sort((a, b) => a - b);
  const median = samples[samples.length >> 1];
  const tail = samples[Math.floor(samples.length * 0.8)];
  samples = [];
  if (median <= SLOW_MEDIAN_MS && tail <= SLOW_TAIL_MS) return;
  apply(level + 1);
  settleUntil = now + SETTLE_MS;
}

// The starting rung, marked before the canvases exist.
if (typeof document !== 'undefined' && level >= LITE) document.documentElement.classList.add('gm-lite');
