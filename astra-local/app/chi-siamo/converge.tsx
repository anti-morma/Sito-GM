'use client';

import { useEffect, useRef } from 'react';
import { reducedMotion } from '../motion';

// The reading line: the heads of light travel where the eye rests.
const LINE = 0.62;
// The studio's star (the same as the GM's sky and the scroll cue's light).
const STAR = 'M0 -6.5 C0.5 -1.6 1.6 -0.5 6.5 0 C1.6 0.5 0.5 1.6 0 6.5 C-0.5 1.6 -1.6 0.5 -6.5 0 C-1.6 -0.5 -0.5 -1.6 0 -6.5 Z';
const THREADS = ['axis', 'left', 'right'] as const;
// The burst at the meeting point: fixed angles and reaches (no randomness, so
// the server and the browser draw the same thing).
const SPARKS = Array.from({ length: 18 }, (_, i) => ({
  a: i * 20 + ((i * 47) % 13) - 6,
  d: 70 + ((i * 53) % 90),
  t: 1.1 + ((i * 29) % 7) / 10,
}));

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

type Thread = {
  group: SVGGElement;
  paths: SVGPathElement[];
  gradient: SVGLinearGradientElement;
  comet: SVGGElement;
  start: number;
  length: number;
  shown: number;
  used: boolean;
};

/**
 * "Due sguardi diversi, un solo obiettivo: il tuo." drawn as a scene: a
 * thread of light leaves each founder (and, side by side, one more comes
 * down from the star between them), follows the reading line as the page
 * scrolls, and the threads meet in one point. There they ignite (a star, an
 * anamorphic streak, a shockwave, sparks) and the sentence surfaces word by
 * word. Scrolling back undoes it. With reduced motion everything is simply
 * drawn and lit.
 */
export default function Converge() {
  const svg = useRef<SVGSVGElement>(null);
  const focal = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = svg.current!.parentElement!;
    const star = root.querySelector('.gm-duo-star');
    const people = [...root.querySelectorAll<HTMLElement>('.gm-duo-person')];
    const note = root.querySelector<HTMLElement>('.gm-duo-note');
    const wrap = root.closest<HTMLElement>('.gm-wrap');
    if (people.length < 2 || !note) return;
    const threads: Thread[] = [...svg.current!.querySelectorAll<SVGGElement>('.cv-thread')].map((group) => ({
      group,
      paths: [...group.querySelectorAll('path')],
      gradient: group.querySelector('linearGradient')!,
      comet: group.querySelector<SVGGElement>('.cv-comet')!,
      start: 0,
      length: 0,
      shown: -1,
      used: false,
    }));
    const motion = reducedMotion();
    let meet = 0;
    let lit = false;
    let frame = 0;
    let last = 0;

    // Where everything is, relative to the scene: rebuilt on every resize.
    const layout = () => {
      const box = root.getBoundingClientRect();
      const at = (element: Element) => {
        const rect = element.getBoundingClientRect();
        return { x: rect.left - box.left, y: rect.top - box.top, w: rect.width, h: rect.height };
      };
      const [a, b] = people.map(at);
      const text = at(note);
      const mx = box.width / 2;
      meet = text.y - Math.min(76, Math.max(44, text.y * 0.06));
      const shapes: ({ d: string; start: number } | null)[] = [];

      if (Math.abs(a.y - b.y) < 4 && star) {
        // Side by side: down from the star, and from under each founder.
        const s = at(star);
        const top = s.y + s.h / 2 + 30;
        shapes.push({ d: `M${mx} ${top} L${mx} ${meet}`, start: top });
        for (const p of [a, b]) {
          const x = p.x + p.w / 2;
          const y = p.y + p.h + 30;
          const h = meet - y;
          shapes.push({ d: `M${x} ${y} C${x} ${y + h * 0.62} ${mx} ${meet - h * 0.58} ${mx} ${meet}`, start: y });
        }
      } else {
        // One after the other: each founder's thread runs down the margin on
        // its own side, then turns in to the middle above the sentence.
        const pad = wrap ? parseFloat(getComputedStyle(wrap).paddingLeft) : 16;
        const off = Math.min(18, pad * 0.5);
        shapes.push(null);
        for (const [p, x] of [[a, -off], [b, box.width + off]] as const) {
          const y = p.y + 8;
          const turn = Math.max(y + 40, meet - 130);
          shapes.push({ d: `M${x} ${y} L${x} ${turn} C${x} ${meet - 34} ${mx} ${meet - 84} ${mx} ${meet}`, start: y });
        }
      }

      threads.forEach((thread, index) => {
        const shape = shapes[index];
        thread.used = Boolean(shape);
        thread.group.style.display = shape ? '' : 'none';
        if (!shape) return;
        for (const path of thread.paths) path.setAttribute('d', shape.d);
        thread.start = shape.start;
        thread.length = thread.paths[0].getTotalLength();
        thread.gradient.setAttribute('y1', String(shape.start));
        thread.gradient.setAttribute('y2', String(meet));
        thread.shown = -1;
      });
      focal.current!.style.top = `${meet}px`;
    };

    const update = (now: number) => {
      frame = 0;
      const still = motion.matches;
      const top = root.getBoundingClientRect().top;
      const line = innerHeight * LINE;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      // A little inertia: the light catches up with the scroll, it is not glued to it.
      const ease = 1 - Math.exp(-dt * 6.5);
      let moving = false;
      let arrived = true;

      for (const thread of threads) {
        if (!thread.used) continue;
        const target = still ? 1 : clamp01((line - (top + thread.start)) / Math.max(1, meet - thread.start));
        const gap = target - thread.shown;
        thread.shown = still || thread.shown < 0 || Math.abs(gap) < 0.0005 ? target : thread.shown + gap * ease;
        if (thread.shown !== target) moving = true;
        if (thread.shown < 0.995) arrived = false;
        const offset = String(1 - thread.shown);
        for (const path of thread.paths) path.style.strokeDashoffset = offset;
        const head = thread.paths[0].getPointAtLength(thread.shown * thread.length);
        thread.comet.setAttribute('transform', `translate(${head.x.toFixed(1)} ${head.y.toFixed(1)})`);
        thread.comet.style.opacity = !still && thread.shown > 0.004 && thread.shown < 0.995 ? '1' : '0';
      }

      const past = line - (top + meet);
      if (still) lit = true;
      else if (!lit && arrived && past >= 0) lit = true;
      else if (lit && past < -28) lit = false;
      root.classList.toggle('is-lit', lit);

      if (moving) {
        frame = requestAnimationFrame(update);
      } else {
        last = 0;
      }
    };

    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const relayout = () => { layout(); schedule(); };

    root.classList.add('cv-ready');
    layout();
    schedule();
    const observer = new ResizeObserver(relayout);
    observer.observe(root);
    document.fonts?.ready.then(relayout);
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', relayout);
    motion.addEventListener('change', schedule);
    return () => {
      observer.disconnect();
      removeEventListener('scroll', schedule);
      removeEventListener('resize', relayout);
      motion.removeEventListener('change', schedule);
      cancelAnimationFrame(frame);
      root.classList.remove('cv-ready', 'is-lit');
    };
  }, []);

  return (
    <>
      <svg ref={svg} className="gm-converge" aria-hidden="true">
        <defs>
          <radialGradient id="cv-halo">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="0.25" stopColor="#b9ccff" stopOpacity="0.45" />
            <stop offset="1" stopColor="#8fb1ff" stopOpacity="0" />
          </radialGradient>
        </defs>
        {THREADS.map((name) => (
          <g key={name} className="cv-thread" data-thread={name}>
            <defs>
              <linearGradient id={`cv-${name}`} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#8fb1ff" stopOpacity="0.06" />
                <stop offset="0.55" stopColor="#8fb1ff" stopOpacity="0.5" />
                <stop offset="1" stopColor="#f1f4ff" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path className="cv-haze" pathLength={1} stroke={`url(#cv-${name})`} />
            <path className="cv-glow" pathLength={1} stroke={`url(#cv-${name})`} />
            <path className="cv-core" pathLength={1} stroke={`url(#cv-${name})`} />
            <g className="cv-comet">
              <circle r="18" fill="url(#cv-halo)" />
              <circle r="2.2" fill="#fff" />
            </g>
          </g>
        ))}
      </svg>

      <div ref={focal} className="cv-focal" aria-hidden="true">
        <span className="cv-target" />
        <span className="cv-bloom" />
        <span className="cv-streak cv-streak--soft" />
        <span className="cv-streak" />
        <span className="cv-ring" />
        <span className="cv-ring cv-ring--late" />
        <span className="cv-sparks">
          {SPARKS.map((spark, index) => (
            <i key={index} style={{ '--a': `${spark.a}deg`, '--d': `${spark.d}px`, '--t': `${spark.t}s` } as React.CSSProperties} />
          ))}
        </span>
        <svg className="cv-star" viewBox="-8 -8 16 16"><path d={STAR} /></svg>
      </div>
    </>
  );
}
