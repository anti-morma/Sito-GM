// The GM made of stars, shared by the phone opening (gomore-mobile-intro.tsx)
// and the living header logo (dynamic-gm-logo.tsx). Both draw the same stars
// with the same functions and the same clock, so the monogram that forms at
// the centre of the screen and flies to the corner *is* the header logo: when
// it lands, the logo's canvas takes over pixel for pixel.
import logoStars from './gm-logo-stars.json';

// Phones: where the living logo replaces the drawn one, and where the opening plays.
export const PHONE_LOGO_QUERY = '(max-width: 600px)';
export const PHONE_OPENING_QUERY = '(max-width: 600px) and (orientation: portrait)';

// The monogram's letters are this wide in their own units (gm-points.json).
export const MONOGRAM_WIDTH = 0.818;
// Share of the header logo's box the letters span (globals.css, .gm-header .gm-logo).
export const LOGO_MARK_SHARE = 0.84;
// How far a logo star wanders, in CSS pixels: less than half a pixel.
export const LIVING_AMP = 0.32;

// White, a cool grey-white, and very rarely the site's blue, much paler.
export const TINTS = ['255, 255, 255', '214, 218, 226', '198, 214, 255'] as const;

export type LogoStar = {
  x: number;
  y: number;
  // Radius (CSS px) and light in the logo.
  r: number;
  light: number;
  tint: number;
  // Depth in [-1, 1]: nearer stars are a touch larger and brighter.
  z: number;
  // Slow drifts and shimmer: angular speeds (rad/s) and phases.
  w1: number; w2: number; w3: number;
  p1: number; p2: number; p3: number;
};

// Deterministic values from a star's seed.
const hash = (seed: number, salt: number) => {
  const v = Math.sin(seed * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

export const tintFor = (seed: number) => (seed < 0.86 ? 0 : seed < 0.965 ? 1 : 2);

export const LOGO_STARS: LogoStar[] = (logoStars as [number, number, number, number][]).map(([x, y, kind, seed]) => ({
  x,
  y,
  r: 0.5 + 0.28 * hash(seed, 1) + (kind === 2 ? 0.06 : 0),
  light: 0.74 + 0.26 * hash(seed, 2),
  tint: tintFor(hash(seed, 3)),
  z: hash(seed, 4) * 2 - 1,
  w1: 0.35 + 0.55 * hash(seed, 5),
  w2: 0.3 + 0.6 * hash(seed, 6),
  w3: 0.5 + 0.9 * hash(seed, 7),
  p1: hash(seed, 8) * Math.PI * 2,
  p2: hash(seed, 9) * Math.PI * 2,
  p3: hash(seed, 10) * Math.PI * 2,
}));

/**
 * A logo star at time t (seconds): its drift (CSS px) from its place in the
 * monogram, its radius and its light. `amp` scales the drift; `still` holds
 * everything (reduced motion).
 */
export function logoStarAt(star: LogoStar, t: number, amp = LIVING_AMP, still = false) {
  if (still) return { dx: 0, dy: 0, r: star.r, a: star.light };
  // Two slow sways each way, and the whole mark leaning a hair in depth.
  const dx = amp * (0.7 * Math.sin(t * star.w1 + star.p1) + 0.3 * Math.sin(t * star.w1 * 2.3 + star.p2) + 0.5 * star.z * Math.sin(t * 0.21));
  const dy = amp * (0.7 * Math.sin(t * star.w2 + star.p2) + 0.3 * Math.sin(t * star.w2 * 1.9 + star.p3));
  // A gentle shimmer, and now and then a star catches the light.
  const glint = Math.pow(Math.max(0, Math.sin(t * star.w3 * 0.37 + star.p1)), 28) * 0.35;
  const shimmer = 0.86 + 0.14 * Math.sin(t * star.w3 + star.p3) + glint;
  return { dx, dy, r: star.r * (1 + 0.1 * star.z), a: Math.min(1, star.light * shimmer * (1 + 0.08 * star.z)) };
}

/** The logo's scale (CSS px per monogram unit) for a logo box this wide. */
export const logoScale = (boxWidth: number) => (boxWidth * LOGO_MARK_SHARE) / MONOGRAM_WIDTH;

// One small sprite per tint: a crisp core with a short falloff, no halo.
const SPRITE = 32;
export function makeSprites() {
  return TINTS.map((rgb) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SPRITE;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(SPRITE / 2, SPRITE / 2, 0, SPRITE / 2, SPRITE / 2, SPRITE / 2);
    gradient.addColorStop(0, `rgba(${rgb}, 1)`);
    gradient.addColorStop(0.2, `rgba(${rgb}, 0.9)`);
    gradient.addColorStop(0.42, `rgba(${rgb}, 0.28)`);
    gradient.addColorStop(0.7, `rgba(${rgb}, 0.06)`);
    gradient.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, SPRITE, SPRITE);
    return canvas;
  });
}

/** One star, centred on (x, y), radius r in CSS px (the context is already scaled). */
export function drawStar(ctx: CanvasRenderingContext2D, sprites: HTMLCanvasElement[], x: number, y: number, r: number, a: number, tint: number) {
  if (a <= 0.004) return;
  const d = r * 4.6;
  ctx.globalAlpha = a > 1 ? 1 : a;
  ctx.drawImage(sprites[tint], x - d / 2, y - d / 2, d, d);
}

/** Every logo star in a canvas the size of the logo's box. */
export function drawLogo(ctx: CanvasRenderingContext2D, sprites: HTMLCanvasElement[], width: number, height: number, t: number, alpha = 1, still = false, each?: (index: number) => number) {
  const scale = logoScale(width);
  LOGO_STARS.forEach((star, index) => {
    const s = logoStarAt(star, t, LIVING_AMP, still);
    drawStar(ctx, sprites, width / 2 + star.x * scale + s.dx, height / 2 - star.y * scale + s.dy, s.r, s.a * alpha * (each ? each(index) : 1), star.tint);
  });
}

// The hand-over: while the opening plays the logo waits; when the monogram
// lands, the opening draws the logo's first frame itself (same frame, same
// clock) and the logo carries on from there.
export const logoBridge: { draw: ((now: number, alpha?: number) => void) | null } = { draw: null };
