'use client';

import { useEffect } from 'react';
import { reducedMotion } from '../motion';

// The reading line: where the eye rests, a little below the middle.
const LINE = 0.66;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

type Scene = {
  element: HTMLElement;
  mode: string;
  parts: { part: HTMLElement; at: number }[];
  last: number;
  lit: boolean | null;
};

/**
 * The scroll scenes of the "Chi siamo" page, in one listener and one frame:
 * every [data-scene] gets its progress as --p (0 → 1), is marked is-on once
 * it has started, and lights each of its [data-at] parts once the progress
 * reaches them, both ways (scrolling back undoes them). Two measures:
 * - "read": 0 when its top reaches the reading line, 1 when its bottom does;
 * - "pass": 0 when it enters at the bottom of the screen, 1 when it leaves at the top.
 * With reduced motion everything is lit and nothing follows the scroll.
 */
export default function Scenes() {
  useEffect(() => {
    const scenes: Scene[] = [...document.querySelectorAll<HTMLElement>('[data-scene]')].map((element) => ({
      element,
      mode: element.dataset.scene ?? 'read',
      parts: [...element.querySelectorAll<HTMLElement>('[data-at]')].map((part) => ({ part, at: Number(part.dataset.at) || 0 })),
      last: -1,
      lit: null,
    }));
    const motion = reducedMotion();
    let frame = 0;

    const apply = (scene: Scene, progress: number, still: boolean) => {
      if (Math.abs(progress - scene.last) < 0.001 && scene.lit === still) return;
      scene.last = progress;
      scene.lit = still;
      scene.element.style.setProperty('--p', progress.toFixed(4));
      scene.element.classList.toggle('is-on', still || progress > 0);
      for (const { part, at } of scene.parts) part.classList.toggle('is-on', still || progress >= at);
    };

    const update = () => {
      frame = 0;
      const vh = innerHeight;
      const still = motion.matches;
      for (const scene of scenes) {
        if (still) {
          apply(scene, scene.mode === 'pass' ? 0.5 : 1, true);
          continue;
        }
        const box = scene.element.getBoundingClientRect();
        const progress = scene.mode === 'pass'
          ? clamp01((vh - box.top) / (vh + box.height))
          : clamp01((vh * LINE - box.top) / Math.max(1, box.height));
        apply(scene, progress, false);
      }
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    motion.addEventListener('change', onScroll);
    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      motion.removeEventListener('change', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
