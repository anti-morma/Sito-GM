'use client';

import { useEffect, useRef, useState } from 'react';
import { drawLogo, LOGO_STARS, logoBridge, makeSprites, PHONE_LOGO_QUERY } from './gm-constellation';

// The logo lives slowly: two dozen frames a second are plenty for drifts of
// less than a pixel, and leave the phone's GPU to the page.
const FPS = 24;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoothStep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

/**
 * Phones: the header's GM, a small living constellation (gm-constellation.ts).
 * After the phone opening it is the very monogram that just flew into the
 * corner; on any other visit its stars light up one by one.
 */
export default function DynamicGMLogo() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [phone, setPhone] = useState(false);

  useEffect(() => {
    const query = matchMedia(PHONE_LOGO_QUERY);
    const update = () => setPhone(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!phone || !canvas || !ctx) return;
    const root = document.documentElement;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const sprites = makeSprites();
    let width = 0;
    let height = 0;
    let ratio = 1;
    // Waiting for the opening to hand the monogram over, lighting up, or living.
    let mode: 'wait' | 'light' | 'live' = root.classList.contains('gm-intro') ? 'wait' : 'light';
    let lightFrom = performance.now();
    let frame = 0;
    let lastDraw = 0;

    const draw = (now: number, alpha = 1) => {
      lastDraw = now;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';
      const still = reduced.matches;
      // Lighting up: each star in turn, over a little less than a second.
      const since = (now - lightFrom) / 1000;
      const each = mode === 'light' && !still
        ? (index: number) => smoothStep((since - (index / LOGO_STARS.length) * 0.55 - 0.1) / 0.35)
        : undefined;
      drawLogo(ctx, sprites, width, height, now / 1000, alpha, still, each);
      ctx.globalAlpha = 1;
      if (mode === 'light' && since > 1.05) mode = 'live';
    };

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      // A tiny canvas: as sharp as the screen allows.
      ratio = Math.min(devicePixelRatio || 1, 3);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      if (mode !== 'wait') draw(performance.now());
    };

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (mode === 'wait') {
        // The opening gave up before it started (page.tsx): light up as usual.
        if (!root.classList.contains('gm-intro')) {
          mode = 'light';
          lightFrom = now;
        } else return;
      }
      if (document.hidden || now - lastDraw < 1000 / FPS - 2) return;
      // Reduced motion: one still drawing, redrawn only on resize.
      if (reduced.matches && mode === 'live') return;
      draw(now);
    };

    logoBridge.draw = (now, alpha = 1) => {
      mode = 'live';
      draw(now, alpha);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    frame = requestAnimationFrame(loop);
    const onMotion = () => draw(performance.now());
    reduced.addEventListener('change', onMotion);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      reduced.removeEventListener('change', onMotion);
      logoBridge.draw = null;
    };
  }, [phone]);

  if (!phone) return null;
  return <canvas ref={ref} className="gm-logo-stars" aria-hidden="true" />;
}
