// Frame-by-frame recording of a real homepage scrolling slowly (1440×900).
// usage: node scripts/record-preview.mjs <name> <url> '<keys json [[t,y],...]>' [fps]
// Frames land in ./frames/<name>. Encode (drop the first 15 frames of hold,
// fade the end into frame 15 for a seamless loop, limited-range BT.709):
//   ffmpeg -framerate 30 -start_number 15 -i frames/<name>/f%05d.jpg -loop 1 -framerate 30 -t 1 -i frames/<name>/f00015.jpg \
//     -filter_complex "[0]format=yuv420p,settb=AVTB[a];[1]format=yuv420p,settb=AVTB[b];[a][b]xfade=transition=fade:duration=0.7:offset=<len-0.7>" \
//     -c:v libx264 -crf 12 master.mp4
//   then scale to 1280x800 / 720x450 with in_range=pc:out_range=tv → libx264 crf 25 (+faststart) and libvpx-vp9 crf 36,
//   and export frame 15 as <name>-poster.jpg.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const [name, url, keysJson, fpsArg] = process.argv.slice(2);
const keys = JSON.parse(keysJson);
const FPS = Number(fpsArg || 30);
const out = path.resolve('frames', name);
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

// Monotone cubic (Fritsch–Carlson): continuous velocity, never overshoots.
function monotone(points) {
  const n = points.length;
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const d = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = [0];
  for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2);
  m.push(0);
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h;
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i]
      + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

const at = monotone(keys);
const duration = keys[keys.length - 1][0];
const frames = Math.round(duration * FPS);

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--hide-scrollbars', '--force-color-profile=srgb', '--disable-features=Translate'],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
// Consent banners are hidden from the recording, never accepted.
await page.addStyleTag({ content: '#cookie-banner{display:none!important} html{scroll-behavior:auto!important} *{scrollbar-width:none!important}' });
await page.evaluate(() => {
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if ((cs.position === 'fixed' || cs.position === 'sticky') && /cookie|privacy/i.test(el.textContent || '') && el.offsetHeight < 400) el.style.setProperty('display', 'none', 'important');
  }
});
// Warm-up pass so lazy images and scroll-scrubbed frames are loaded.
const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
for (let y = 0; y <= max; y += 300) { await page.evaluate((v) => scrollTo(0, v), y); await new Promise((r) => setTimeout(r, 120)); }
await page.evaluate(() => scrollTo(0, 0));
await new Promise((r) => setTimeout(r, 2500));

// CSS transitions run at a rate that matches the video clock despite capture time.
const cdp = await page.createCDPSession();
const settle = 45;
const probe = Date.now();
for (let i = 0; i < 6; i++) {
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await new Promise((r) => setTimeout(r, settle));
  await page.screenshot({ type: 'jpeg', quality: 92 });
}
const perFrame = (Date.now() - probe) / 6;
const rate = Math.min(1, 1000 / FPS / perFrame);
await cdp.send('Animation.enable');
await cdp.send('Animation.setPlaybackRate', { playbackRate: rate });
console.log(`capture ${perFrame.toFixed(0)}ms/frame → animation rate ${rate.toFixed(2)}`);
for (let f = 0; f <= frames; f++) {
  const y = Math.round(at(f / FPS));
  await page.evaluate((v) => new Promise((r) => { scrollTo(0, v); requestAnimationFrame(() => requestAnimationFrame(r)); }), y);
  await new Promise((r) => setTimeout(r, settle));
  await page.screenshot({ path: path.join(out, `f${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 });
}
console.log(`${name}: ${frames + 1} frames, ${duration}s, max scroll ${max}`);
await browser.close();
