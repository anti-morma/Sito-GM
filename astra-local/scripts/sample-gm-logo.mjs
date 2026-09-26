// Picks the stars of the living header logo (dynamic-gm-logo.tsx) from the
// GM monogram's stars (gm-points.json): evenly spaced over the letters, so the
// G and the M stay readable at about 38 CSS pixels wide with few stars. The
// phone opening (gomore-mobile-intro.tsx) builds its GM around these same
// stars and flies them into the logo.
//
// Run: node scripts/sample-gm-logo.mjs
// Output: app/gm-logo-stars.json — [x, y, kind, seed] in the monogram's units
// (0.818 wide, centred), kind 2 = outline, 1 = fill; seed in [0, 1).

import { readFileSync, writeFileSync } from 'node:fs';

const SOURCE = new URL('../app/gm-points.json', import.meta.url);
const OUTPUT = new URL('../app/gm-logo-stars.json', import.meta.url);
// Minimum distance between two stars, in monogram units: about 1.3 CSS pixels
// at the logo's size.
const SPACING = 0.0275;

let seed = 20260926;
const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

const points = JSON.parse(readFileSync(SOURCE, 'utf8')).filter(([, , kind]) => kind > 0);
// Outline first: the contour carries the letters, the fill follows.
points.sort((a, b) => b[2] - a[2] || random() - 0.5);

const cell = SPACING;
const grid = new Map();
const key = (x, y) => `${Math.floor(x / cell)},${Math.floor(y / cell)}`;
const chosen = [];
for (const [x, y, kind] of points) {
  const cx = Math.floor(x / cell);
  const cy = Math.floor(y / cell);
  let free = true;
  for (let i = -1; i <= 1 && free; i++) {
    for (let j = -1; j <= 1 && free; j++) {
      for (const [px, py] of grid.get(`${cx + i},${cy + j}`) ?? []) {
        if ((px - x) ** 2 + (py - y) ** 2 < SPACING ** 2) { free = false; break; }
      }
    }
  }
  if (!free) continue;
  const star = [x, y, kind];
  chosen.push(star);
  const k = key(x, y);
  grid.set(k, [...(grid.get(k) ?? []), star]);
}

// Shuffled, so any leading share of the list covers the whole monogram.
for (let i = chosen.length - 1; i > 0; i--) {
  const j = Math.floor(random() * (i + 1));
  [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
}
const out = chosen.map(([x, y, kind]) => [+x.toFixed(4), +y.toFixed(4), kind, +random().toFixed(4)]);
writeFileSync(OUTPUT, JSON.stringify(out));
console.log(`${OUTPUT.pathname}: ${out.length} stars`);
