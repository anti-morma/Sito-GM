'use client';

import { useEffect, useRef, useState } from 'react';
import { phonePixelRatio } from './pixel-ratio';
import {
  drawStar,
  LIVING_AMP,
  LOGO_STARS,
  logoBridge,
  logoScale,
  logoStarAt,
  makeSprites,
  MONOGRAM_WIDTH,
  tintFor,
} from './gm-constellation';

// ---------- The phone opening, once per session (page.tsx decides) ----------
// Seconds from its start. Darkness; a few stars, then more, surface around
// GOMORE (Didot capitals, the GM's own letters: scripts/render-gomore.swift);
// the word loses its hold and its stars, with the cloud's, converge and build
// the GM; a breath; the GM rises on a curve into the header's top-left corner
// and becomes the living logo (dynamic-gm-logo.tsx).
const T = {
  firstStars: 0.18, // the first handful, alone in the dark
  moreStars: 0.38, // then more and more, until…
  allStars: 1.18,
  word: 0.4, // GOMORE surfaces, left to right, fully there by 0.9…
  wordIn: 0.28,
  wordHeld: 1.3, // …and held, clear, until it starts to let go
  converge: 1.2, // the matter starts to converge
  formed: 2.2, // the GM is built
  rise: 2.5, // the ascent
  riseTime: 0.8,
  land: 3.3, // the logo takes over; the page appears
  end: 3.44, // the last stars have joined it
};
// Reduced motion: dark → GOMORE → GM → the logo, by fades alone.
const R = { word: 0.12, swap: 0.8, out: 1.35, land: 1.45, end: 1.75 };

// Stars for a capable phone; modest ones get about half, and any phone that
// falls behind in the first frames draws fewer.
const COUNTS = { word: 3400, fill: 1500, cloud: 460 };
// Share of the GM's own stars (beyond the logo's) that come from the word.
const FROM_WORD = 0.5;
// The first stars alone in the dark.
const FIRST = 8;
// The last few cloud stars that follow the GM up and join the logo.
const STRAGGLERS = 14;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoothStep = (from: number, to: number, value: number) => {
  const t = clamp01((value - from) / (to - from));
  return t * t * (3 - 2 * t);
};
const easeInOut = (value: number) => {
  const t = clamp01(value);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

let seed = 20260926;
const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

type Kind = 'cloud' | 'word';
type Star = {
  kind: Kind;
  // Its place in the GM (monogram units), or none.
  gm: [number, number] | null;
  logo: number; // index in LOGO_STARS, or -1
  straggler: number; // index of the logo star it joins, or -1
  // Cloud: its orbit (see orbit()).
  lobe: number; r: number; a0: number; w: number; tilt: number; roll: number; wa: number; wf: number;
  born: number;
  // Word: its place in GOMORE (word units) and when it appears.
  wx: number; wy: number; shown: number;
  // The convergence: when it leaves, how long it takes, its swirl.
  leave: number; travel: number; swirl: number;
  // The ascent: its delay behind the GM, and when it fades (fill stars).
  lag: number; fade: number;
  // Look.
  size: number; light: number; tint: number; phase: number; twinkle: number;
  px: number; py: number;
};

// The cloud: three lobes of unequal weight around the word, one wide and
// tilted, one lower right, a sparse one upper left (screen units, see unit).
const LOBES = [
  { weight: 0.56, x: 0, y: 0, reach: 0.56, tilt: 1.2 },
  { weight: 0.3, x: 0.13, y: 0.07, reach: 0.34, tilt: 0.9 },
  { weight: 0.14, x: -0.19, y: -0.11, reach: 0.24, tilt: 1.4 },
];

function cloudStar(kind: Kind): Star {
  const u = random();
  const lobe = u < LOBES[0].weight ? 0 : u < LOBES[0].weight + LOBES[1].weight ? 1 : 2;
  const reach = LOBES[lobe].reach;
  const r = reach * (0.08 + 0.92 * Math.pow(random(), 0.75));
  // Inner stars turn faster; a few turn the other way.
  const w = (0.2 + 0.55 * (1 - r / 0.56)) * (random() < 0.12 ? -0.6 : 1);
  return {
    kind, gm: null, logo: -1, straggler: -1,
    lobe, r, a0: random() * Math.PI * 2, w,
    tilt: LOBES[lobe].tilt + (random() - 0.5) * 0.5,
    roll: -0.16 + (random() - 0.5) * 0.36,
    wa: 0.01 + 0.03 * random(), wf: 0.4 + 0.7 * random(),
    born: 0, wx: 0, wy: 0, shown: 0,
    leave: T.converge + 0.3 * random(), travel: 0.62 + 0.08 * random(), swirl: 0.7 + 0.35 * random(),
    lag: 0, fade: 0,
    size: 0.45 + 0.6 * Math.pow(random(), 2), light: 0.3 + 0.5 * random(), tint: tintFor(random()),
    phase: random() * Math.PI * 2, twinkle: 1.5 + 3 * random(),
    px: NaN, py: NaN,
  };
}

/** The opening's stars: the cloud (some of them the GM's), the word (some of them the GM's). */
function buildStars(word: number[][], gm: number[][], share: number) {
  const stars: Star[] = [];
  const letters = gm.filter((point) => point[2] > 0);
  const fill = Math.round(COUNTS.fill * share);
  const fromWord = Math.round(fill * FROM_WORD);
  // The logo's stars come from the cloud: they are the ones that fly on.
  LOGO_STARS.forEach((star, index) => {
    const s = cloudStar('cloud');
    s.gm = [star.x, star.y];
    s.logo = index;
    stars.push(s);
  });
  for (let i = fromWord; i < fill; i++) {
    const s = cloudStar('cloud');
    s.gm = [letters[i][0], letters[i][1]];
    stars.push(s);
  }
  const loose = Math.round(COUNTS.cloud * share);
  for (let i = 0; i < loose; i++) {
    const s = cloudStar('cloud');
    if (i < STRAGGLERS) s.straggler = Math.floor(random() * LOGO_STARS.length);
    stars.push(s);
  }
  // Births: a handful alone, then more and more (few early, many late).
  const cloud = stars.slice();
  for (let i = cloud.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cloud[i], cloud[j]] = [cloud[j], cloud[i]];
  }
  cloud.forEach((s, i) => {
    s.born = i < FIRST
      ? T.firstStars + (i / FIRST) * (T.moreStars - T.firstStars)
      : T.moreStars + (T.allStars - T.moreStars) * Math.sqrt(random());
    if (i < FIRST) {
      // The first ones stand apart and a little brighter.
      s.r = LOBES[s.lobe].reach * (0.45 + 0.5 * random());
      s.light = 0.75;
      s.size = 0.85;
    }
  });
  // The word: sharp, thin, white. Its stars appear left to right; half of
  // those the GM needs come from it, the others dissolve on the way.
  const count = Math.round(COUNTS.word * share);
  for (let i = 0; i < count; i++) {
    const [wx, wy] = word[i];
    const s = cloudStar('word');
    s.wx = wx;
    s.wy = wy;
    s.shown = T.word + 0.22 * ((wx + 1) / 2 * 0.75 + random() * 0.25);
    // Outer letters let go first: the word closes in on the monogram.
    s.leave = T.wordHeld + 0.04 + 0.2 * (1 - Math.min(1, Math.abs(wx))) + 0.04 * random();
    s.travel = 0.6;
    s.size = 0.5 + 0.26 * random() + (random() < 0.05 ? 0.25 : 0);
    s.light = 0.72 + 0.28 * random();
    s.tint = random() < 0.9 ? 0 : 1;
    if (i < fromWord) s.gm = [letters[i][0], letters[i][1]];
    stars.push(s);
  }
  // The ascent: the GM's own stars trail a hair behind the logo's and fade
  // early on the way (the monogram thins as it shrinks): a very fine wake.
  stars.forEach((s) => {
    s.lag = s.logo >= 0 ? 0 : 0.015 + 0.06 * random();
    s.fade = T.rise + 0.02 + 0.3 * random();
  });
  return stars;
}

/**
 * GoMore's phone opening: a full-screen canvas over the page, played once per
 * session (page.tsx marks <html> before the first paint). It ends by handing
 * its monogram to the header logo (gm-constellation.ts).
 */
export default function GoMoreMobileIntro() {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (document.documentElement.dataset.intro === 'waiting') setActive(true);
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!active || !canvas || !ctx) return;
    const root = document.documentElement;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nav = navigator as Navigator & { deviceMemory?: number };
    const modest = (nav.deviceMemory !== undefined && nav.deviceMemory <= 4) || (navigator.hardwareConcurrency ?? 8) <= 4;
    let share = still ? 0.6 : modest ? 0.55 : 1;
    const sprites = makeSprites();
    let stars: Star[] = [];
    let frame = 0;
    let clock = 0;
    let last = 0;
    let speed = 1;
    let landed = false;
    let cancelled = false;
    const slowFrames: number[] = [];

    // The stage: GOMORE and the GM a little above the centre; the logo's box.
    let width = 0;
    let height = 0;
    let ratio = 1;
    const stage = { x: 0, y: 0, unit: 1, word: 1, gm: 1 };
    const logo = { x: 0, y: 0, scale: 1 };
    const measure = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      ratio = phonePixelRatio();
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      stage.x = width / 2;
      stage.y = height * 0.45;
      stage.unit = Math.min(width, height * 0.62);
      stage.word = Math.min(width * 0.84, 440) / 2.02;
      stage.gm = Math.min(width * 0.5, 260) / MONOGRAM_WIDTH;
      const mark = document.querySelector<HTMLElement>('.gm-header .gm-logo');
      const box = mark?.getBoundingClientRect();
      logo.x = box ? box.left + box.width / 2 : 36;
      logo.y = box ? box.top + box.height / 2 : 32;
      logo.scale = logoScale(box?.width ?? 46);
    };

    // A cloud star at time t: screen position, and its depth factor.
    const orbit = (s: Star, t: number, pull = 1) => {
      const lobe = LOBES[s.lobe];
      const angle = s.a0 + s.w * t;
      let ox = Math.cos(angle) * s.r * 1.35 * pull + Math.sin(t * s.wf + s.phase) * s.wa;
      let oy = Math.sin(angle) * s.r * Math.cos(s.tilt) * 0.75 * pull + Math.cos(t * s.wf * 1.3 + s.phase) * s.wa * 0.6;
      const oz = Math.sin(angle) * s.r * Math.sin(s.tilt);
      const c = Math.cos(s.roll);
      const n = Math.sin(s.roll);
      [ox, oy] = [ox * c - oy * n, ox * n + oy * c];
      const depth = 1 + oz * 0.55;
      return {
        x: stage.x + (lobe.x * pull + ox) * stage.unit * depth,
        y: stage.y + (lobe.y * pull + oy) * stage.unit * depth,
        depth,
      };
    };

    // The monogram's frame at time t: centre and scale, on the curve to the logo.
    // It swings out to the logo's side first, then climbs and hooks into it:
    // an arc rather than a straight line, whichever corner the logo holds.
    const riseCurve = (e: number) => {
      const side = logo.x < stage.x ? -1 : 1;
      const p0x = stage.x, p0y = stage.y;
      const p1x = stage.x + 0.3 * (logo.x - stage.x) + side * 0.1 * width, p1y = stage.y - 0.04 * height;
      const p2x = logo.x + side * 0.03 * width, p2y = logo.y + 0.3 * (stage.y - logo.y);
      const q = 1 - e;
      return {
        x: q * q * q * p0x + 3 * q * q * e * p1x + 3 * q * e * e * p2x + e * e * e * logo.x,
        y: q * q * q * p0y + 3 * q * q * e * p1y + 3 * q * e * e * p2y + e * e * e * logo.y,
        // Shrinking evenly to the eye: geometric, and a little ahead of the flight.
        scale: stage.gm * Math.pow(logo.scale / stage.gm, Math.pow(e, 0.8)),
      };
    };
    const monogramAt = (t: number, lag = 0) => {
      const e = easeInOut((t - T.rise - lag) / T.riseTime);
      // A breath while it waits at the centre.
      const breath = 1 + 0.015 * Math.sin(Math.PI * clamp01((t - T.formed + 0.15) / 0.6));
      const frameAt = riseCurve(e);
      return { ...frameAt, scale: frameAt.scale * (e > 0 ? 1 : breath), e };
    };

    const put = (s: Star, x: number, y: number, r: number, a: number) => {
      // A short streak behind the fastest stars: the eye's motion blur.
      if (!Number.isNaN(s.px)) {
        const dx = x - s.px;
        const dy = y - s.py;
        if (dx * dx + dy * dy > 6.25) {
          drawStar(ctx, sprites, x - dx / 3, y - dy / 3, r * 0.9, a * 0.32, s.tint);
          drawStar(ctx, sprites, x - (dx * 2) / 3, y - (dy * 2) / 3, r * 0.8, a * 0.16, s.tint);
        }
      }
      s.px = x;
      s.py = y;
      drawStar(ctx, sprites, x, y, r, a, s.tint);
    };

    const drawMotion = (t: number, now: number) => {
      const tt = now / 1000;
      const gm = monogramAt(t);
      const wordDim = 1 - 0.45 * smoothStep(T.wordHeld, T.wordHeld + 0.3, t);
      // While GOMORE is there, the cloud steps back from its letters.
      const wordPresence = smoothStep(T.word, T.word + 0.5, t) * (1 - smoothStep(T.wordHeld, T.wordHeld + 0.3, t));
      const clearOfWord = (x: number, y: number) => {
        if (wordPresence <= 0) return 1;
        const nx = Math.abs(x - stage.x) / (stage.word * 1.08);
        const ny = Math.abs(y - stage.y) / (stage.word * 0.26);
        const inside = (1 - smoothStep(0.85, 1.15, nx)) * (1 - smoothStep(0.6, 1.4, ny));
        return 1 - 0.7 * inside * wordPresence;
      };
      const cloudPull = 1 - 0.25 * smoothStep(T.converge, T.formed, t);
      const cloudDim = 1 - 0.45 * smoothStep(1.3, T.formed, t);
      const drawn = Math.ceil(stars.length * share);
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        // Fewer stars when the phone falls behind (never the logo's).
        if (i >= drawn && s.logo < 0 && s.straggler < 0) continue;
        const twinkle = 0.8 + 0.2 * Math.sin(tt * s.twinkle + s.phase);

        if (s.kind === 'word') {
          const shown = smoothStep(s.shown, s.shown + T.wordIn, t);
          if (shown <= 0) continue;
          // Suspended: the word hangs almost still, settling from a hair larger.
          const settle = 1 + 0.03 * (1 - smoothStep(T.word, T.word + 0.8, t));
          const hx = stage.x + s.wx * stage.word * settle + 0.25 * Math.sin(tt * 1.3 + s.phase);
          const hy = stage.y - s.wy * stage.word * settle + 0.25 * Math.cos(tt * 1.1 + s.phase);
          const u = clamp01((t - s.leave) / s.travel);
          const alpha = s.light * shown * wordDim * (0.9 + 0.1 * twinkle);
          if (u <= 0) {
            put(s, hx, hy, s.size, alpha);
            continue;
          }
          const e = easeInOut(u);
          if (s.gm) {
            if (t >= T.rise) {
              drawAscending(s, t, tt);
              continue;
            }
            const tx = gm.x + s.gm[0] * gm.scale;
            const ty = gm.y - s.gm[1] * gm.scale;
            const [cx, cy] = swirlPoint(hx, hy, tx, ty, s.swirl * 0.7);
            const q = 1 - e;
            put(s, q * q * hx + 2 * q * e * cx + e * e * tx, q * q * hy + 2 * q * e * cy + e * e * ty,
              lerp(s.size, 0.72, e), lerp(alpha, 0.85 * (0.9 + 0.1 * twinkle), e));
          } else {
            // Dissolving: towards the heart of the monogram, fading on the way.
            const tx = stage.x + (s.wx * 0.12) * stage.word;
            const ty = stage.y - s.wy * 0.5 * stage.word;
            const [cx, cy] = swirlPoint(hx, hy, tx, ty, s.swirl * 0.7);
            const q = 1 - e;
            put(s, q * q * hx + 2 * q * e * cx + e * e * tx, q * q * hy + 2 * q * e * cy + e * e * ty,
              s.size * (1 - 0.4 * e), alpha * (1 - smoothStep(0.3, 0.8, u)));
          }
          continue;
        }

        // The cloud.
        const born = smoothStep(s.born, s.born + 0.4, t);
        if (born <= 0) continue;
        if (s.gm) {
          if (t >= T.rise) {
            drawAscending(s, t, tt);
            continue;
          }
          const o = orbit(s, t);
          const alpha = s.light * born * twinkle * (0.55 + 0.45 * o.depth) * clearOfWord(o.x, o.y);
          const u = clamp01((t - s.leave) / s.travel);
          if (u <= 0) {
            put(s, o.x, o.y, s.size * o.depth, alpha);
            continue;
          }
          const e = easeInOut(u);
          const from = orbit(s, s.leave);
          // The logo's stars arrive already living, as they will fly on.
          const live = s.logo >= 0 ? logoStarAt(LOGO_STARS[s.logo], tt, 0.6) : null;
          const tx = gm.x + s.gm[0] * gm.scale + (live ? live.dx : 0);
          const ty = gm.y - s.gm[1] * gm.scale + (live ? live.dy : 0);
          const [cx, cy] = swirlPoint(from.x, from.y, tx, ty, s.swirl);
          const q = 1 - e;
          const bx = q * q * from.x + 2 * q * e * cx + e * e * tx;
          const by = q * q * from.y + 2 * q * e * cy + e * e * ty;
          const target = s.logo >= 0 ? 0.95 : 0.85 * (0.9 + 0.1 * twinkle);
          put(s, lerp(o.x, bx, e), lerp(o.y, by, e), lerp(s.size * o.depth, s.logo >= 0 ? 0.85 : 0.72, e), lerp(alpha, target, e));
          continue;
        }

        // Loose cloud: it draws in and dims around the forming GM, then
        // evaporates as it rises; a few follow it and join the logo.
        const o = orbit(s, t, cloudPull);
        let alpha = s.light * born * twinkle * cloudDim * (0.55 + 0.45 * o.depth) * clearOfWord(o.x, o.y);
        if (s.straggler >= 0 && t > T.rise - 0.1) {
          drawStraggler(s, t, tt, o, alpha);
          continue;
        }
        alpha *= 1 - smoothStep(T.rise - 0.2, T.rise + 0.35, t);
        put(s, o.x, o.y, s.size * o.depth, alpha);
      }
    };

    // The GM's stars on the way up. The logo's own stars land exactly where,
    // and as, the header logo draws them.
    const drawAscending = (s: Star, t: number, tt: number) => {
      const m = monogramAt(t, s.lag);
      if (s.logo >= 0) {
        const star = LOGO_STARS[s.logo];
        const live = logoStarAt(star, tt, lerp(0.6, LIVING_AMP, m.e));
        put(s, m.x + star.x * m.scale + live.dx, m.y - star.y * m.scale + live.dy, lerp(0.85, live.r, m.e), lerp(0.95, live.a, m.e));
        return;
      }
      if (!s.gm) return;
      const twinkle = 0.8 + 0.2 * Math.sin(tt * s.twinkle + s.phase);
      const alpha = 0.85 * (0.9 + 0.1 * twinkle) * (1 - smoothStep(s.fade, s.fade + 0.2, t));
      if (alpha <= 0) return;
      // A step behind on the curve, but at the monogram's current size: the
      // wake stays as narrow as the GM itself.
      const scale = monogramAt(t).scale;
      put(s, m.x + s.gm[0] * scale, m.y - s.gm[1] * scale, lerp(0.72, 0.5, m.e), alpha);
    };

    // A control point that makes the way in a gentle inward spiral.
    const swirlPoint = (fx: number, fy: number, tx: number, ty: number, turn: number): [number, number] => {
      const mx = (fx + tx) / 2 - stage.x;
      const my = (fy + ty) / 2 - stage.y;
      const c = Math.cos(turn * 0.6);
      const n = Math.sin(turn * 0.6);
      return [stage.x + (mx * c - my * n) * 0.75, stage.y + (mx * n + my * c) * 0.75];
    };

    // Reduced motion: still stars, fades only.
    const drawStill = (t: number) => {
      const wordIn = smoothStep(R.word, R.word + 0.3, t) * (1 - smoothStep(R.swap, R.swap + 0.25, t));
      const gmIn = smoothStep(R.swap + 0.05, R.swap + 0.3, t) * (1 - smoothStep(R.out, R.out + 0.25, t));
      for (const s of stars) {
        if (s.kind === 'word' && wordIn > 0) {
          drawStar(ctx, sprites, stage.x + s.wx * stage.word, stage.y - s.wy * stage.word, s.size, s.light * wordIn, s.tint);
        }
        if (s.gm && gmIn > 0) {
          drawStar(ctx, sprites, stage.x + s.gm[0] * stage.gm, stage.y - s.gm[1] * stage.gm, s.logo >= 0 ? 0.85 : 0.72, 0.85 * gmIn, s.tint);
        }
      }
    };

    const reveal = () => {
      if (!root.classList.contains('gm-intro')) return;
      root.classList.remove('gm-intro');
      root.classList.add('gm-intro-done');
    };
    const finish = () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      removeEventListener('pointerdown', hurry);
      removeEventListener('wheel', hurry);
      removeEventListener('keydown', hurry);
      reveal();
      delete root.dataset.intro;
      // The logo takes over from here, whatever happened.
      logoBridge.draw?.(performance.now());
      setActive(false);
    };
    // A touch, a wheel or a key: the opening is not a wall. It plays on, fast.
    const hurry = () => { speed = 3.2; };

    const render = (now: number) => {
      frame = requestAnimationFrame(render);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock += dt * speed;
      // The page gave up on the opening (page.tsx's safety net).
      if (!root.classList.contains('gm-intro') && !landed) return finish();
      // A phone that falls behind in the first frames draws fewer stars.
      if (!still && slowFrames.length < 16 && clock > 0.2) {
        slowFrames.push(dt);
        if (slowFrames.length === 16) {
          const median = slowFrames.sort((a, b) => a - b)[8];
          if (median > 0.024) share = Math.min(share, 0.55);
        }
      }
      const t = clock;
      const tt = now / 1000;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, width, height);
      // Black, until the monogram rises: then the page shows through.
      const black = still ? 1 - smoothStep(R.out, R.end - 0.05, t) : 1 - smoothStep(T.rise - 0.05, T.land - 0.15, t);
      if (black > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${black})`;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.globalCompositeOperation = 'lighter';
      if (still) {
        drawStill(t);
        if (t >= R.land) {
          reveal();
          logoBridge.draw?.(now, smoothStep(R.land, R.end, t));
        }
        if (t >= R.end) finish();
        return;
      }
      if (t >= T.land && !landed) {
        // The logo's stars have landed: from this frame the header draws them.
        landed = true;
        reveal();
        logoBridge.draw?.(now);
      }
      if (landed) {
        // Only the last stragglers, joining the logo.
        for (const s of stars) if (s.straggler >= 0) drawStraggler(s, t, tt, null, 0);
      } else {
        drawMotion(t, now);
      }
      if (t >= T.end) finish();
    };
    // The last cloud stars: pulled after the GM as it rises, they join a logo
    // star each and go out as they reach it.
    const drawStraggler = (s: Star, t: number, tt: number, o: { x: number; y: number; depth: number } | null, cloudAlpha: number) => {
      const m = monogramAt(t, 0.08 + 0.03 * (s.straggler % 3));
      const star = LOGO_STARS[s.straggler];
      const live = logoStarAt(star, tt);
      const pull = smoothStep(T.rise - 0.1, T.rise + 0.35, t);
      const x = m.x + star.x * m.scale + live.dx;
      const y = m.y - star.y * m.scale + live.dy;
      const alpha = lerp(cloudAlpha, s.light * 0.6, pull) * (1 - smoothStep(0.8, 1, m.e));
      put(s, o ? lerp(o.x, x, pull) : x, o ? lerp(o.y, y, pull) : y, o ? lerp(s.size * o.depth, star.r, pull) : star.r, alpha);
    };

    measure();
    addEventListener('resize', measure);
    Promise.all([import('./gomore-points.json'), import('./gm-points.json')]).then(([word, gm]) => {
      if (cancelled) return;
      // The page stopped waiting (page.tsx): no opening today.
      if (root.dataset.intro !== 'waiting') return finish();
      stars = buildStars(word.default as number[][], gm.default as number[][], share);
      addEventListener('pointerdown', hurry, { passive: true });
      addEventListener('wheel', hurry, { passive: true });
      addEventListener('keydown', hurry);
      root.dataset.intro = 'playing';
      last = performance.now();
      frame = requestAnimationFrame(render);
    }, finish);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      removeEventListener('resize', measure);
      removeEventListener('pointerdown', hurry);
      removeEventListener('wheel', hurry);
      removeEventListener('keydown', hurry);
    };
  }, [active]);

  if (!active) return null;
  return (
    <div className="gm-opening" aria-hidden="true">
      <canvas ref={ref} />
    </div>
  );
}
