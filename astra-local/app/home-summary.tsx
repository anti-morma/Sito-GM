'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import SectionLabel from './section-label';
import { offers } from './content';

// ---------- The stage: one sky of stars, a figure for each line of work ----------

type Point = [x: number, y: number, scale: number, opacity: number];
// The studio's star (the same as the GM's sky and the scroll cue's light).
const STAR = 'M0 -6.5 C0.5 -1.6 1.6 -0.5 6.5 0 C1.6 0.5 0.5 1.6 0 6.5 C-0.5 1.6 -1.6 0.5 -6.5 0 C-1.6 -0.5 -0.5 -1.6 0 -6.5 Z';
const N = 24;
const C = 200;
const rad = (degrees: number) => (degrees * Math.PI) / 180;
const r1 = (value: number) => Math.round(value * 10) / 10;

// A loose ring of faint stars around the figure: every scene leaves its
// unused stars there, each in a different slot, so the ring turns a little.
const DUST = Array.from({ length: N }, (_, k) => {
  const angle = rad(k * 15 + ((k * 37) % 11) - 5);
  const radius = 160 + ((k * 53) % 3) * 13;
  return [r1(C + radius * Math.cos(angle)), r1(C + radius * Math.sin(angle))] as const;
});
const fill = (points: Point[], offset: number): Point[] =>
  Array.from({ length: N }, (_, k) => points[k] ?? [DUST[(k + offset) % N][0], DUST[(k + offset) % N][1], 0.3, 0.3]);

// A smooth line through points (Catmull-Rom as cubic Béziers).
type XY = readonly number[];
function smooth(points: readonly XY[]) {
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const [p1, p2] = [points[i], points[i + 1]];
    const p3 = points[i + 2] ?? p2;
    d += `C${r1(p1[0] + (p2[0] - p0[0]) / 6)} ${r1(p1[1] + (p2[1] - p0[1]) / 6)} ${r1(p2[0] - (p3[0] - p1[0]) / 6)} ${r1(p2[1] - (p3[1] - p1[1]) / 6)} ${p2[0]} ${p2[1]}`;
  }
  return d;
}
const lines = (pairs: readonly (readonly [XY, XY])[]) =>
  pairs.map(([a, b]) => `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`).join('');

// Strategia e UX: a route through the choices, to the goal.
const ROUTE = [[62, 318], [104, 302], [140, 272], [160, 234], [186, 206], [222, 192], [258, 170], [282, 136], [310, 108], [342, 80]] as const;
const BRANCHES = [[118, 232], [96, 204], [262, 222], [292, 240]] as const;

// Design: a construction grid, a square, its circle and a golden cut.
const SQUARE = [[110, 110], [290, 110], [290, 290], [110, 290]] as const;
const CIRCLE = Array.from({ length: 8 }, (_, k) => [r1(C + 90 * Math.cos(rad(k * 45))), r1(C + 90 * Math.sin(rad(k * 45)))] as const);
const GOLDEN = 110 + 180 * 0.618;

// Sviluppo: </>.
const CODE = [
  [160, 130], [125, 165], [90, 200], [125, 235], [160, 270],
  [228, 116], [214, 158], [200, 200], [186, 242], [172, 284],
  [240, 130], [275, 165], [310, 200], [275, 235], [240, 270],
] as const;

// 3D e WebGL: an icosahedron, turned and projected.
const PHI = (1 + Math.sqrt(5)) / 2;
const ICO = [
  [0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI],
  [1, PHI, 0], [-1, PHI, 0], [1, -PHI, 0], [-1, -PHI, 0],
  [PHI, 0, 1], [-PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, -1],
] as const;
const ICO_EDGES = ICO.flatMap((a, i) => ICO.flatMap((b, j) => (j > i && Math.abs(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) - 2) < 0.01 ? [[i, j] as const] : [])));
const ICO_2D = ICO.map(([x, y, z]) => {
  const [ay, ax] = [rad(28), rad(-20)];
  const x1 = x * Math.cos(ay) + z * Math.sin(ay);
  const z1 = -x * Math.sin(ay) + z * Math.cos(ay);
  const y2 = y * Math.cos(ax) - z1 * Math.sin(ax);
  const z2 = y * Math.sin(ax) + z1 * Math.cos(ax);
  const unit = Math.hypot(1, PHI);
  return [r1(C + (x1 / unit) * 128), r1(C + (y2 / unit) * 128), z2 / unit] as const;
});

// AI: a small neural network, three layers.
const LAYERS = [[110, [125, 175, 225, 275]], [200, [100, 150, 200, 250, 300]], [290, [150, 200, 250]]] as const;
const NODES = LAYERS.map(([x, ys]) => ys.map((y) => [x, y] as const));

// Cura del sito: the site at the centre, its care on orbit around it.
const TILT = -16;
const orbit = (rx: number, ry: number, degrees: number) => {
  const [t, th] = [rad(degrees), rad(TILT)];
  return [r1(C + rx * Math.cos(t) * Math.cos(th) - ry * Math.sin(t) * Math.sin(th)), r1(C + rx * Math.cos(t) * Math.sin(th) + ry * Math.sin(t) * Math.cos(th))] as const;
};
const ellipse = (rx: number, ry: number) => {
  const [a, b] = [orbit(rx, ry, 0), orbit(rx, ry, 180)];
  return `M${a[0]} ${a[1]}A${rx} ${ry} ${TILT} 1 1 ${b[0]} ${b[1]}A${rx} ${ry} ${TILT} 1 1 ${a[0]} ${a[1]}`;
};
const OUTER = ellipse(150, 58);

const FIGURES: { points: Point[]; paths: { d: string; faint?: boolean }[] }[] = [
  {
    points: fill([
      ...ROUTE.map(([x, y], i): Point => (i === ROUTE.length - 1 ? [x, y, 1.5, 1] : [x, y, 0.5 + i * 0.02, 0.9])),
      ...BRANCHES.map(([x, y]): Point => [x, y, 0.42, 0.45]),
    ], 0),
    paths: [
      { d: smooth(ROUTE) },
      { d: `M140 272L118 232L96 204M222 192L262 222L292 240`, faint: true },
      { d: 'M356 80A14 14 0 1 1 328 80A14 14 0 1 1 356 80' },
    ],
  },
  {
    points: fill([
      ...SQUARE.map(([x, y]): Point => [x, y, 0.6, 0.95]),
      ...CIRCLE.map(([x, y]): Point => [x, y, 0.5, 0.85]),
      [GOLDEN, 110, 0.42, 0.7], [GOLDEN, 290, 0.42, 0.7], [C, C, 1.25, 1],
    ], 5),
    paths: [
      { d: 'M110 110H290V290H110Z' },
      { d: 'M290 200A90 90 0 1 1 110 200A90 90 0 1 1 290 200' },
      { d: `M${r1(GOLDEN)} 110V290` },
      { d: 'M110 110L290 290M290 110L110 290', faint: true },
    ],
  },
  {
    points: fill(CODE.map(([x, y], i): Point => [x, y, i % 5 === 2 ? 0.85 : 0.55, 0.95]), 10),
    paths: [
      { d: 'M160 130L90 200L160 270' },
      { d: 'M228 116L172 284' },
      { d: 'M240 130L310 200L240 270' },
    ],
  },
  {
    points: fill([...ICO_2D.map(([x, y, z]): Point => [x, y, 0.42 + 0.3 * (z + 1) / 2, 0.45 + 0.55 * (z + 1) / 2]), [C, C, 0.9, 0.9]], 15),
    // The edges behind stay faint: the solid reads in depth.
    paths: [
      { d: lines(ICO_EDGES.filter(([i, j]) => ICO_2D[i][2] + ICO_2D[j][2] >= 0).map(([i, j]) => [ICO_2D[i], ICO_2D[j]] as const)) },
      { d: lines(ICO_EDGES.filter(([i, j]) => ICO_2D[i][2] + ICO_2D[j][2] < 0).map(([i, j]) => [ICO_2D[i], ICO_2D[j]] as const)), faint: true },
    ],
  },
  {
    points: fill(NODES.flat().map(([x, y]): Point => (x === 290 && y === 200 ? [x, y, 1.3, 1] : [x, y, 0.55, 0.9])), 20),
    paths: [{ d: lines(NODES.slice(0, -1).flatMap((layer, i) => layer.flatMap((a) => NODES[i + 1].map((b) => [a, b] as const)))), faint: true }],
  },
  {
    points: fill([
      [C, C, 1.7, 1],
      ...Array.from({ length: 9 }, (_, k): Point => [...orbit(150, 58, k * 40), 0.5, 0.85]),
      ...Array.from({ length: 5 }, (_, k): Point => [...orbit(92, 34, k * 72 + 20), 0.4, 0.7]),
    ], 3),
    paths: [{ d: OUTER }, { d: ellipse(92, 34), faint: true }],
  },
];

// Each star's position in every scene, and in the loose ring before the first.
const POINT_STYLES = Array.from({ length: N }, (_, k) => {
  const style: Record<string, string | number> = { '--k': k, '--xd': DUST[k][0], '--yd': DUST[k][1], '--tw': `${-((k * 0.73) % 4).toFixed(2)}s` };
  FIGURES.forEach(({ points }, s) => {
    const [x, y, scale, opacity] = points[k];
    style[`--x${s}`] = x;
    style[`--y${s}`] = y;
    style[`--s${s}`] = scale;
    style[`--o${s}`] = opacity;
  });
  return style as React.CSSProperties;
});

// ---------- What we do, and with what ----------

const [, CARE] = offers;
const MONTHLY = CARE.monthlyFrom > 0 ? CARE.monthlyFrom.toLocaleString('it-IT', { minimumFractionDigits: 2 }) : '';
const WORK = [
  { name: 'Strategia e UX', href: '/servizi/ux-ui', text: 'Capiamo chi visita il tuo sito e che cosa lo porta a scegliere.', tools: ['Ricerca', 'Psicologia del consumatore', 'User flow'] },
  { name: 'Design', href: '/servizi/web-design', text: 'Un’identità visiva su misura, riconoscibile al primo sguardo.', tools: ['Art direction', 'Tipografia', 'Design system'] },
  { name: 'Sviluppo', href: '/servizi/sviluppo-web', text: 'Codice scritto da zero: veloce, accessibile, su ogni schermo.', tools: ['Codice su misura', 'Next.js', 'React'] },
  { name: '3D e WebGL', href: '/servizi/3d-webgl', text: 'Scene e movimento che aiutano a capire e a ricordare.', tools: ['WebGL', 'Three.js', 'Animazioni allo scroll'] },
  { name: 'AI', href: '/servizi/ai', text: 'Uno strumento, dove migliora contenuti, processi e interazione.', tools: ['Contenuti', 'Processi', 'Assistenti AI'] },
  {
    name: 'Cura del sito',
    href: '/servizi',
    text: MONTHLY ? `Il sito sempre online e aggiornato, da ${MONTHLY} € al mese.` : 'Il sito sempre online e aggiornato, anche dopo il lancio.',
    tools: ['Hosting', 'Dominio', 'Aggiornamenti di sicurezza'],
  },
];

/**
 * Right after the opening, what we do and what we use, one line of work at a
 * time. The lines scroll past like titles: the one in the middle of the
 * screen is lit, the others wait in the dark. Beside them, a stage of stars
 * that fly into a figure for each: a route, a construction grid, </>, a solid,
 * a network, an orbit. Phones keep the stage on top and the lines below.
 */
export default function HomeSummary() {
  const bodyRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);
  // Before the section arrives the stars wait in their ring (-1), so the
  // first figure forms in view. Without JS the first figure is simply there.
  const [scene, setScene] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const body = bodyRef.current;
    const list = listRef.current;
    if (!body || !list) return;
    const rows = [...list.children] as HTMLElement[];
    const wide = matchMedia('(min-width: 900px)');
    let armed = body.getBoundingClientRect().top < innerHeight;
    if (!armed) setScene(-1);
    let frame = 0;

    const update = () => {
      frame = 0;
      // The reading line: the middle of the screen; on phones, the middle of
      // the space left under the stage.
      let line = innerHeight * 0.5;
      const stage = stageRef.current;
      if (!wide.matches && stage) {
        const bottom = stage.getBoundingClientRect().bottom;
        line = bottom + (innerHeight - bottom) * 0.42;
      }
      let best = 0;
      let distance = Infinity;
      rows.forEach((row, index) => {
        const box = row.getBoundingClientRect();
        const gap = Math.abs(box.top + box.height / 2 - line);
        if (gap < distance) {
          distance = gap;
          best = index;
        }
      });
      setActive(best);
      if (!armed && body.getBoundingClientRect().top < innerHeight * 0.7) armed = true;
      if (armed) setScene(best);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    setReady(true);
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section id="servizi" className="gm-section gm-what" aria-labelledby="servizi-title" data-scroll-stop>
      <div className="gm-wrap">
        <header className="gm-what-head" data-reveal>
          <SectionLabel>Cosa facciamo</SectionLabel>
          <h2 id="servizi-title" className="gm-h2"><span className="gm-h2-line">Dall’idea al sito online.</span> <em className="gm-shine">Tutto in casa.</em></h2>
        </header>

        <div className="gm-what-body" ref={bodyRef}>
          <div className="gm-what-stage" ref={stageRef} data-scene={scene} aria-hidden="true">
            <svg className="gm-what-sky" viewBox="0 0 400 400" focusable="false">
              <defs>
                <path id="gmw-star" d={STAR} />
                <linearGradient id="gmw-line" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="400" y2="400">
                  <stop offset="0" stopColor="#8fb1ff" />
                  <stop offset="1" stopColor="#f3f1ec" stopOpacity=".55" />
                </linearGradient>
              </defs>
              {FIGURES.map(({ paths }, s) => (
                <g key={s} className="gm-what-lines" data-fig={s}>
                  {paths.map(({ d, faint }) => (
                    <path key={d} className={faint ? 'gm-what-line is-faint' : 'gm-what-line'} d={d} pathLength={1} />
                  ))}
                  {/* The care goes round and round. */}
                  {s === 5 && (
                    <circle className="gm-what-satellite" r="2.6">
                      <animateMotion dur="9s" repeatCount="indefinite" path={OUTER} />
                    </circle>
                  )}
                </g>
              ))}
              <g className="gm-what-points">
                {POINT_STYLES.map((style, k) => (
                  <g key={k} className="gm-what-pt" style={style}>
                    <use href="#gmw-star" className="gm-what-star" />
                  </g>
                ))}
              </g>
            </svg>
            <div className="gm-what-ticks">
              {WORK.map((work, index) => <i key={work.name} data-on={index === active || undefined} />)}
            </div>
          </div>

          <ol className="gm-what-list" ref={listRef} data-ready={ready || undefined}>
            {WORK.map((work, index) => (
              <li key={work.name} className="gm-what-row" data-active={index === active || undefined}>
                <span className="gm-what-n" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <h3>
                  <Link href={work.href} data-cta="home-servizio"><span className="gm-what-word">{work.name}</span></Link>
                  <span className="gm-what-arrow" aria-hidden="true">→</span>
                </h3>
                <p className="gm-what-text">{work.text}</p>
                <p className="gm-what-tools"><span className="gm-sr-only">Usiamo: </span>{work.tools.join(' · ')}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
