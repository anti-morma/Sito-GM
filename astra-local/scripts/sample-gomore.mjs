// Samples the GOMORE wordmark into star positions for the phone opening: one
// for every star of the GM monogram, so the word can fold into the monogram.
//
// Run: swift scripts/render-gomore.swift scripts/gomore.png
//      node scripts/sample-gomore.mjs
// Output: app/gomore-points.json — [x, y] for each star of app/gm-points.json,
// in the same order. Stars are paired by position (left to right in narrow
// strips, top to bottom within each), so the word closes up into the GM.

import { readFileSync, writeFileSync } from 'node:fs';
import { readPng } from './png.mjs';
import { distanceField } from './shape.mjs';

const SOURCE = new URL('./gomore.png', import.meta.url);
const MONOGRAM = new URL('../app/gm-points.json', import.meta.url);
const OUTPUT = new URL('../app/gomore-points.json', import.meta.url);
const WIDTH = 2; // word width in scene units (the GM is 0.82)
// Didot's hairlines vanish among the stars: give every stroke some body.
const THICKEN = 2.6;
const OUTLINE_BAND = 2.4;
const SHARE = { outline: 0.46, dust: 0.03 }; // the rest fills the letters
const STRIPS = 72;

let seed = 20260925;
const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

const monogram = JSON.parse(readFileSync(MONOGRAM, 'utf8'));
const { width, height, pixels } = readPng(SOURCE);
const size = width * height;
const mask = new Uint8Array(size);
for (let i = 0; i < size; i++) mask[i] = pixels[i * 4 + 3] >= 128 ? 1 : 0;

const outside = distanceField(mask, width, height);
const letters = new Uint8Array(size);
for (let i = 0; i < size; i++) letters[i] = outside[i] <= THICKEN ? 1 : 0;
const background = new Uint8Array(size);
for (let i = 0; i < size; i++) background[i] = letters[i] ? 0 : 1;
const inside = distanceField(background, width, height);
const around = distanceField(letters, width, height);

const pools = { outline: [], fill: [], dust: [] };
let minX = width, maxX = 0, minY = height, maxY = 0;
for (let i = 0; i < size; i++) {
  const x = i % width, y = (i / width) | 0;
  if (letters[i]) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    (inside[i] <= OUTLINE_BAND ? pools.outline : pools.fill).push(i);
  } else if (around[i] > 3 && around[i] < 14) pools.dust.push(i);
}

const total = monogram.length;
const counts = { outline: Math.round(total * SHARE.outline), dust: Math.round(total * SHARE.dust) };
counts.fill = total - counts.outline - counts.dust;
const scale = WIDTH / (maxX - minX + 1);
const cx = (minX + maxX + 1) / 2, cy = (minY + maxY + 1) / 2;
const word = [];
for (const [name, count] of Object.entries(counts)) {
  const pool = pools[name];
  for (let n = 0; n < count; n++) {
    const i = pool[Math.floor(random() * pool.length)];
    const x = (i % width) + random(), y = ((i / width) | 0) + random();
    word.push([(x - cx) * scale, -(y - cy) * scale]);
  }
}

// Left to right in narrow strips, top to bottom within each strip.
const order = (points) => {
  const byX = points.map((_, i) => i).sort((a, b) => points[a][0] - points[b][0]);
  const strip = Math.ceil(points.length / STRIPS);
  const ranked = [];
  for (let s = 0; s < points.length; s += strip) {
    ranked.push(...byX.slice(s, s + strip).sort((a, b) => points[b][1] - points[a][1]));
  }
  return ranked;
};
const fromMonogram = order(monogram);
const fromWord = order(word);
const paired = new Array(total);
fromMonogram.forEach((star, rank) => {
  const [x, y] = word[fromWord[rank]];
  paired[star] = [+x.toFixed(5), +y.toFixed(5)];
});

writeFileSync(OUTPUT, JSON.stringify(paired));
console.log(`${total} stars, ${WIDTH} × ${((maxY - minY + 1) * scale).toFixed(3)}`, counts);
