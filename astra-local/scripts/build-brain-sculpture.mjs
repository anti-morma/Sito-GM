/** Bake the reference composition into a rounded, closed particle sculpture.
 * Run with Node 24: node scripts/build-brain-sculpture.mjs
 * The original anatomical binary remains separately archived, unchanged.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { buildBrainVolume } from './brain-volume.ts';

const root = new URL('../', import.meta.url);
const reference = await readFile(new URL('assets/brain-reference-points.json', root));
const points = JSON.parse(reference);
let seed = 601;
const random = () => {
  seed = seed * 16807 % 2147483647;
  return (seed - 1) / 2147483646;
};
const volume = buildBrainVolume(points, random);
const count = points.length * 5;
// Eight uint16 fields: position xyz, normal xyz, shade, contribution.
// A 16-byte header makes layout/version/count validation independent of JSON.
const packed = Buffer.alloc(16 + count * 16);
packed.write('GMBR', 0, 'ascii');
packed.writeUInt32LE(1, 4);
packed.writeUInt32LE(count, 8);
packed.writeUInt32LE(8, 12);
const signed = value => Math.round((Math.max(-1, Math.min(1, value)) + 1) * 32767.5);
const unit = value => Math.round(Math.max(0, Math.min(1, value)) * 65535);
const write = (i, x, y, z, nx, ny, nz, shade, weight = 1) => {
  // Centre the completed solid on its rotation axis; no camera-dependent
  // projection or per-frame reconstruction changes the surface during a turn.
  const row = [signed(x), signed(y), signed(z + 0.12), signed(nx), signed(ny), signed(nz), unit(shade), unit(weight)];
  row.forEach((value, j) => packed.writeUInt16LE(value, 16 + i * 16 + j * 2));
};
for (let i = 0; i < points.length; i++) {
  const [x, y, , shade] = points[i];
  const [z, nx, ny, nz] = volume.front.subarray(i * 4, i * 4 + 4);
  write(i, x, y, z, nx, ny, nz, shade);
  const [fz, fnx, fny, fnz] = volume.far.subarray(i * 4, i * 4 + 4);
  write(i + points.length * 2, x, y, fz, fnx, fny, fnz, shade);
  const [rx, ry, rz, rs, rnx, rny, rnz] = volume.rim.subarray(i * 7, i * 7 + 7);
  write(i + points.length, rx, ry, rz, rnx, rny, rnz, rs);
}
for (let i = 0; i < points.length * 2; i++) {
  const [x, y, z, shade, nx, ny, nz] = volume.fill.subarray(i * 7, i * 7 + 7);
  write(i + points.length * 3, x, y, z, nx, ny, nz, shade);
}
const output = new URL('public/brain-sculpture.bin', root);
await writeFile(output, packed);
console.log(JSON.stringify({ count, bytes: packed.length, sha256: createHash('sha256').update(packed).digest('hex') }));
