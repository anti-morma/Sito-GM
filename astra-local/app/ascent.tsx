'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import Rocket from './rocket';

export type Point = { x: number; y: number };

// ---------------------------------------------------------------------------
// Journey progress: 0 at the top of the page, one unit per section, and the
// last unit is the final climb to the star at the very end of the page.
// The header computes it from the scroll; every Ascent drawing listens.
let latestProgress = 0;
const listeners = new Set<(progress: number) => void>();
export function setAscentProgress(progress: number) {
  if (Math.abs(progress - latestProgress) < 1e-4) return;
  latestProgress = progress;
  listeners.forEach((listener) => listener(progress));
}

// Critically damped spring: the light follows the scroll with a little inertia.
const STIFFNESS = 6.5;
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Monotone cubic (Fritsch–Carlson) through the points: it only ever climbs. */
function ascentPath(points: Point[]) {
  const n = points.length;
  const slopes: number[] = [];
  const secants: number[] = [];
  for (let i = 0; i < n - 1; i++) secants.push((points[i + 1].y - points[i].y) / (points[i + 1].x - points[i].x));
  for (let i = 0; i < n; i++) {
    if (i === 0) slopes.push(secants[0]);
    else if (i === n - 1) slopes.push(secants[n - 2]);
    else slopes.push(secants[i - 1] * secants[i] <= 0 ? 0 : (secants[i - 1] + secants[i]) / 2);
  }
  for (let i = 0; i < n - 1; i++) {
    if (secants[i] === 0) { slopes[i] = slopes[i + 1] = 0; continue; }
    const a = slopes[i] / secants[i];
    const b = slopes[i + 1] / secants[i];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      slopes[i] = t * a * secants[i];
      slopes[i + 1] = t * b * secants[i];
    }
  }
  const segments = [`M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`];
  for (let i = 0; i < n - 1; i++) {
    const p = points[i];
    const q = points[i + 1];
    const h = (q.x - p.x) / 3;
    segments.push(`C${(p.x + h).toFixed(2)} ${(p.y + slopes[i] * h).toFixed(2)} ${(q.x - h).toFixed(2)} ${(q.y - slopes[i + 1] * h).toFixed(2)} ${q.x.toFixed(2)} ${q.y.toFixed(2)}`);
  }
  return segments;
}

/**
 * THE ASCENT — the further you go, the higher you climb.
 * An ascending trajectory links one star per section to a final star; a small
 * light climbs it with the scroll, revealing the path already travelled.
 * SVG and CSS only; one requestAnimationFrame loop that sleeps when settled.
 */
export default function Ascent({ stops, bend, star, arrive = 0, width, height, active, className }: {
  stops: Point[];
  /** Optional waypoint before the star, e.g. to clear the last label. */
  bend?: Point;
  star: Point;
  /** How far before the star the rocket stops, so its nose touches it. */
  arrive?: number;
  width: number;
  height: number;
  active: number;
  className?: string;
}) {
  const id = useId().replace(/:/g, '');
  const rootRef = useRef<HTMLSpanElement>(null);
  const routeRef = useRef<SVGPathElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const lightRef = useRef<HTMLSpanElement>(null);
  const starRef = useRef<SVGGElement>(null);
  const lengths = useRef<number[]>([]);
  const motion = useRef({ q: Number.NaN, v: 0, dir: 1, frame: 0, last: 0, wake: () => {} });
  const [d, setD] = useState('');
  const points = bend ? [...stops, bend, star] : [...stops, star];
  const key = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Build the curve and the arc length at which each stop is reached.
  useLayoutEffect(() => {
    const route = routeRef.current;
    if (!route || points.length < 2) return;
    const segments = ascentPath(points);
    const cumulative = [0];
    for (let i = 2; i <= segments.length; i++) {
      route.setAttribute('d', segments.slice(0, i).join(' '));
      cumulative.push(route.getTotalLength());
    }
    // One unit of progress per stop, the last one ends on the star.
    if (bend) cumulative.splice(stops.length, 1);
    const end = cumulative.length - 1;
    cumulative[end] = Math.max(cumulative[end - 1], cumulative[end] - arrive);
    lengths.current = cumulative;
    setD(segments.join(' '));
    motion.current.wake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    const route = routeRef.current;
    const trail = trailRef.current;
    const glow = glowRef.current;
    const light = lightRef.current;
    const finale = starRef.current;
    const root = rootRef.current;
    if (!route || !trail || !glow || !light || !finale || !root) return;
    const state = motion.current;
    const last = () => lengths.current.length - 1;

    const lengthAt = (q: number) => {
      const marks = lengths.current;
      const i = Math.max(0, Math.min(marks.length - 2, Math.floor(q)));
      return marks[i] + (marks[i + 1] - marks[i]) * Math.max(0, Math.min(1, q - i));
    };

    const draw = () => {
      if (lengths.current.length < 2) return;
      const total = route.getTotalLength();
      const at = lengthAt(state.q);
      const point = route.getPointAtLength(at);
      const ahead = route.getPointAtLength(Math.min(total, at + 1.5));
      const behind = route.getPointAtLength(Math.max(0, at - 1.5));
      const angle = Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180 / Math.PI;
      const speed = Math.abs(state.v);
      if (speed > 0.08) state.dir = state.v > 0 ? 1 : -1;
      light.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) rotate(${angle.toFixed(2)}deg)`;
      light.style.setProperty('--stretch', (0.3 + Math.min(1.3, speed * 0.9)).toFixed(3));
      light.style.setProperty('--motion', Math.min(1, speed * 0.8).toFixed(3));
      light.style.setProperty('--dir', String(state.dir));
      // Reveal only the stretch already travelled.
      const dash = `${at.toFixed(2)} ${(total + 2).toFixed(2)}`;
      trail.style.strokeDasharray = dash;
      glow.style.strokeDasharray = dash;
      finale.classList.toggle('is-reached', state.q > last() - 0.04);
    };

    const step = (now: number) => {
      const dt = Math.min(0.034, (now - state.last) / 1000);
      state.last = now;
      const target = Math.min(latestProgress, last());
      const accel = STIFFNESS * STIFFNESS * (target - state.q) - 2 * STIFFNESS * state.v;
      state.v += accel * dt;
      state.q += state.v * dt;
      if (Math.abs(target - state.q) < 0.0005 && Math.abs(state.v) < 0.002) {
        state.q = target;
        state.v = 0;
        state.frame = 0;
        draw();
        return;
      }
      draw();
      state.frame = requestAnimationFrame(step);
    };

    state.wake = () => {
      if (Number.isNaN(state.q) || reducedMotion()) {
        state.q = Math.min(latestProgress, Math.max(0, last()));
        state.v = 0;
        draw();
        return;
      }
      if (!state.frame) {
        state.last = performance.now();
        state.frame = requestAnimationFrame(step);
      }
    };
    listeners.add(state.wake);
    state.wake();
    return () => {
      listeners.delete(state.wake);
      cancelAnimationFrame(state.frame);
      state.frame = 0;
    };
  }, []);

  // A section change is a small push upwards: the route glows, then settles.
  const previous = useRef(active);
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion()) return;
    const rising = active > previous.current;
    previous.current = active;
    if (!rising) return;
    root.classList.remove('is-rising');
    void root.offsetWidth;
    root.classList.add('is-rising');
    const timer = setTimeout(() => root.classList.remove('is-rising'), 1100);
    return () => clearTimeout(timer);
  }, [active]);

  return (
    <span ref={rootRef} className={className ? `gm-ascent ${className}` : 'gm-ascent'} style={{ width, height }} aria-hidden="true">
      <svg className="gm-ascent-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id={`${id}-trail`} gradientUnits="userSpaceOnUse" x1={stops[0]?.x ?? 0} x2={star.x} y1="0" y2="0">
            <stop offset="0" stopColor="#8fb1ff" stopOpacity="0.08" />
            <stop offset="0.7" stopColor="#8fb1ff" stopOpacity="0.4" />
            <stop offset="1" stopColor="#e6ecff" stopOpacity="0.8" />
          </linearGradient>
          <radialGradient id={`${id}-halo`}>
            <stop offset="0" stopColor="#8fb1ff" stopOpacity="0.55" />
            <stop offset="0.45" stopColor="#8fb1ff" stopOpacity="0.16" />
            <stop offset="1" stopColor="#8fb1ff" stopOpacity="0" />
          </radialGradient>
          <filter id={`${id}-soft`} x="-10%" y="-200%" width="120%" height="500%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>
        {/* The whole route, barely suggested; the travelled part is revealed. */}
        <path ref={routeRef} className="gm-ascent-route" d={d} />
        <path ref={glowRef} className="gm-ascent-glow" d={d} stroke={`url(#${id}-trail)`} filter={`url(#${id}-soft)`} />
        <path ref={trailRef} className="gm-ascent-trail" d={d} stroke={`url(#${id}-trail)`} />
        {stops.map((point, index) => (
          <circle
            key={index}
            className="gm-ascent-stop"
            data-state={index < active ? 'past' : index === active ? 'here' : 'next'}
            cx={point.x}
            cy={point.y}
            r="1.5"
          />
        ))}
        {/* The destination: GO MORE. */}
        <g ref={starRef} className="gm-ascent-star" transform={`translate(${star.x} ${star.y})`}>
          <g className="gm-ascent-star-body">
            <circle className="gm-ascent-star-glow" r="9" fill={`url(#${id}-halo)`} />
            <path d="M0 -6.5 C0.5 -1.6 1.6 -0.5 6.5 0 C1.6 0.5 0.5 1.6 0 6.5 C-0.5 1.6 -1.6 0.5 -6.5 0 C-1.6 -0.5 -0.5 -1.6 0 -6.5 Z" />
            <circle className="gm-ascent-star-core" r="1.1" />
          </g>
          <g className="gm-ascent-sparks">
            <circle r="0.8" style={{ '--spark-x': '9px', '--spark-y': '-6px' } as React.CSSProperties} />
            <circle r="0.6" style={{ '--spark-x': '-8px', '--spark-y': '-7px' } as React.CSSProperties} />
            <circle r="0.7" style={{ '--spark-x': '7px', '--spark-y': '8px' } as React.CSSProperties} />
            <circle r="0.5" style={{ '--spark-x': '-9px', '--spark-y': '5px' } as React.CSSProperties} />
          </g>
        </g>
      </svg>
      {/* The rocket, engine always firing, riding the route. */}
      <span ref={lightRef} className="gm-ascent-light">
        <span className="gm-ascent-body">
          <span className="gm-ascent-dust"><i /><i /><i /></span>
          <Rocket />
        </span>
      </span>
    </span>
  );
}
