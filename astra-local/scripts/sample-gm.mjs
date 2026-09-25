// Samples the GM monogram into star positions with a crisp, readable outline.
//
// Run: node scripts/sample-gm.mjs
// Output: app/gm-points.json — [x, y, kind] with kind 2 = outline, 1 = fill,
// 0 = dust just outside the letters. The shader lights each kind differently so
// the contour of the G and the M stays legible at any size.

import { writeFileSync } from 'node:fs';
import { readPng } from './png.mjs';
import { distanceField } from './shape.mjs';

const SOURCE = new URL('../public/gm-logo.png', import.meta.url);
const OUTPUT = new URL('../app/gm-points.json', import.meta.url);
const COUNTS = { outline: 4600, fill: 5400, dust: 420 };
// Hairlines of the M and the G's crossbar vanish in a cloud of stars: thicken
// every stroke a little (source pixels) so each one keeps a visible body.
const THICKEN = 3.2;
const OUTLINE_BAND = 2.4;
const WIDTH = 0.82; // monogram width in scene units, as before

let seed = 20260924;
const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

const { width, height, pixels } = readPng(SOURCE);
const size = width * height;
const mask = new Uint8Array(size);
for (let i = 0; i < size; i++) mask[i] = pixels[i * 4 + 3] >= 128 ? 1 : 0;

// Drop the small decorative specks around the logo: only the letters remain.
const seen = new Uint8Array(size);
for (let start = 0; start < size; start++) {
  if (!mask[start] || seen[start]) continue;
  const stack = [start];
  const component = [];
  seen[start] = 1;
  while (stack.length) {
    const i = stack.pop();
    component.push(i);
    const x = i % width;
    for (const j of [i - 1, i + 1, i - width, i + width]) {
      if (j < 0 || j >= size || seen[j] || !mask[j]) continue;
      if ((j === i - 1 && x === 0) || (j === i + 1 && x === width - 1)) continue;
      seen[j] = 1;
      stack.push(j);
    }
  }
  if (component.length < 400) for (const i of component) mask[i] = 0;
}

const distanceTo = (target) => distanceField(target, width, height);

const outside = distanceTo(mask);
const letters = new Uint8Array(size);
for (let i = 0; i < size; i++) letters[i] = outside[i] <= THICKEN ? 1 : 0;
const background = new Uint8Array(size);
for (let i = 0; i < size; i++) background[i] = letters[i] ? 0 : 1;
const inside = distanceTo(background);
const around = distanceTo(letters);

const pools = { outline: [], fill: [], dust: [] };
let minX = width, maxX = 0, minY = height, maxY = 0;
for (let i = 0; i < size; i++) {
  const x = i % width, y = (i / width) | 0;
  if (letters[i]) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    (inside[i] <= OUTLINE_BAND ? pools.outline : pools.fill).push(i);
  } else if (around[i] > 3 && around[i] < 16) pools.dust.push(i);
}

const scale = WIDTH / (maxX - minX + 1);
const cx = (minX + maxX + 1) / 2, cy = (minY + maxY + 1) / 2;
const points = [];
const kinds = { outline: 2, fill: 1, dust: 0 };
for (const [name, count] of Object.entries(COUNTS)) {
  const pool = pools[name];
  for (let n = 0; n < count; n++) {
    const i = pool[Math.floor(random() * pool.length)];
    const x = (i % width) + random(), y = ((i / width) | 0) + random();
    points.push([+((x - cx) * scale).toFixed(5), +(-(y - cy) * scale).toFixed(5), kinds[name]]);
  }
}
// Interleave the kinds, so any share of the stars keeps the whole monogram.
for (let i = points.length - 1; i > 0; i--) {
  const j = Math.floor(random() * (i + 1));
  [points[i], points[j]] = [points[j], points[i]];
}

writeFileSync(OUTPUT, JSON.stringify(points));
console.log(`${points.length} stars, ${(maxX - minX + 1) * scale} × ${((maxY - minY + 1) * scale).toFixed(3)}`, Object.fromEntries(Object.entries(pools).map(([k, v]) => [k, v.length])));
