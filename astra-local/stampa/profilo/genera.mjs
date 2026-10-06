// GoMore · immagine profilo: il GM fatto di stelle, come lo disegna il sito
// nell'apertura su telefono (stesse stelle, stessi colori). Rigenera i PNG con:
//   node stampa/profilo/genera.mjs
// Serve Google Chrome installato (lo usa senza finestra per disegnare).
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, '../../app');
const logo = readFileSync(join(app, 'gm-logo-stars.json'), 'utf8');
const points = readFileSync(join(app, 'gm-points.json'), 'utf8');
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const work = mkdtempSync(join(tmpdir(), 'gm-profilo-'));

const versions = [
  { file: 'GoMore-profilo-nero.png', sky: 0 },
  { file: 'GoMore-profilo-cielo.png', sky: 1 },
];
for (const { file, sky } of versions) {
  const page = join(work, file + '.html');
  writeFileSync(page, html(sky, 6000));
  execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=2048,2048', `--screenshot=${join(here, file)}`, `file://${page}`], { stdio: 'ignore' });
  console.log('Creato', file);
}

function html(sky, fill) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#050606}canvas{display:block}</style></head><body>
<canvas id="c" width="2048" height="2048" style="width:2048px;height:2048px"></canvas>
<script>
// The GM as the phone opening draws it large (gomore-mobile-intro.tsx, drawStill):
// the header logo's stars (gm-constellation.ts) plus the letters' own points
// (gm-points.json), small sharp stars with the site's sprite and tints.
const LOGO = ${logo};
const POINTS = ${points}.filter((p) => p[2] > 0);
const SKY = ${sky}, FILL = ${fill};
const N = 2048, MONOGRAM_WIDTH = 0.818;
const TINTS = ['255, 255, 255', '214, 218, 226', '198, 214, 255'];
const hash = (seed, salt) => { const v = Math.sin(seed * 127.1 + salt * 311.7) * 43758.5453; return v - Math.floor(v); };
const tintFor = (s) => (s < 0.86 ? 0 : s < 0.965 ? 1 : 2);
const SPRITE = 256;
const sprites = TINTS.map((rgb) => { const c = document.createElement('canvas'); c.width = c.height = SPRITE; const g = c.getContext('2d'); const gr = g.createRadialGradient(SPRITE/2, SPRITE/2, 0, SPRITE/2, SPRITE/2, SPRITE/2);
  gr.addColorStop(0, 'rgba(' + rgb + ', 1)'); gr.addColorStop(0.2, 'rgba(' + rgb + ', 0.9)'); gr.addColorStop(0.42, 'rgba(' + rgb + ', 0.28)'); gr.addColorStop(0.7, 'rgba(' + rgb + ', 0.06)'); gr.addColorStop(1, 'rgba(' + rgb + ', 0)');
  g.fillStyle = gr; g.fillRect(0, 0, SPRITE, SPRITE); return c; });
const ctx = document.getElementById('c').getContext('2d');
ctx.fillStyle = '#050606'; ctx.fillRect(0, 0, N, N);
const star = (x, y, r, a, tint) => { const d = r * 4.6; ctx.globalAlpha = Math.min(1, a); ctx.drawImage(sprites[tint], x - d/2, y - d/2, d, d); };
if (SKY) {
  const glow = ctx.createRadialGradient(N*0.78, N*0.18, 0, N*0.78, N*0.18, N*0.75);
  glow.addColorStop(0, 'rgba(28, 44, 92, 0.5)'); glow.addColorStop(1, 'rgba(28, 44, 92, 0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, N, N);
  const glow2 = ctx.createRadialGradient(N*0.18, N*0.86, 0, N*0.18, N*0.86, N*0.6);
  glow2.addColorStop(0, 'rgba(20, 34, 74, 0.4)'); glow2.addColorStop(1, 'rgba(20, 34, 74, 0)');
  ctx.fillStyle = glow2; ctx.fillRect(0, 0, N, N);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 150; i++) {
    const x = hash(i, 21) * N, y = hash(i, 22) * N;
    const dx = (x - N/2) / (N*0.36), dy = (y - N/2) / (N*0.26);
    if (dx*dx + dy*dy < 1) continue;
    const big = hash(i, 23) > 0.93;
    star(x, y, (big ? 4.5 : 2.4) + 1.6 * hash(i, 24), (big ? 0.6 : 0.25) + 0.25 * hash(i, 25), hash(i, 26) > 0.85 ? 2 : 0);
  }
}
ctx.globalCompositeOperation = 'lighter';
// Letters 68% of the square wide: safe inside a round crop.
const scale = (N * 0.68) / MONOGRAM_WIDTH;
// Star sizes as on a phone (letters 187 CSS px wide), grown with the letters.
const k = scale / (187.5 / MONOGRAM_WIDTH);
const cx = N / 2, cy = N / 2;
for (let i = 0; i < FILL; i++) { const [x, y] = POINTS[i]; star(cx + x * scale, cy - y * scale, 0.72 * k * (0.9 + 0.2 * hash(i, 31)), 0.85 * (0.8 + 0.2 * hash(i, 32)), tintFor(hash(i, 33))); }
LOGO.forEach(([x, y, kind, seed]) => star(cx + x * scale, cy - y * scale, 0.85 * k, 0.74 + 0.26 * hash(seed, 2), tintFor(hash(seed, 3))));
</script></body></html>`;
}
