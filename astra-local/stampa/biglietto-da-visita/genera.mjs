// Biglietto da visita GoMore, fronte e retro, pronto per la tipografia.
//
//   node stampa/biglietto-da-visita/genera.mjs
//
// Legge i dati da `dati.json` (telefoni, email) e scrive, in questa cartella:
//   GoMore-biglietto-da-visita.pdf    il file da mandare: 2 pagine (fronte, retro),
//                                     91 × 61 mm = 85 × 55 mm + 3 mm di abbondanza
//   GoMore-biglietto-con-crocini.pdf  lo stesso con i segni di taglio, se la
//                                     tipografia li chiede
//   anteprima.png                     come appare una volta tagliato
//
// Il QR del retro viene da `qr-sito.json` (il sito, codificato una volta sola:
// versione 2, correzione d'errore M). Se cambia il sito in `dati.json`, il
// QR va rigenerato: lo script si ferma invece di stampare un QR sbagliato.
//
// Finché un campo di `dati.json` è vuoto, al suo posto compare un segnaposto
// tratteggiato e i PDF portano "BOZZA" nel nome: non vanno in stampa così.

import { readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, '..', '..');
const dati = JSON.parse(readFileSync(join(here, 'dati.json'), 'utf8'));

// Misure in millimetri.
const TRIM = { w: 85, h: 55 }; // formato finito, standard italiano
const BLEED = 3; // abbondanza: lo sfondo esce dal taglio
const SAFE = 5; // nessun testo a meno di 5 mm dal taglio
const PAGE = { w: TRIM.w + 2 * BLEED, h: TRIM.h + 2 * BLEED };

// Colori e caratteri del sito (app/globals.css, app/fonts).
const C = {
  bg: '#050606',
  ink: '#f3f1ec',
  ink2: '#c4c3bd',
  warm: '#e0d8c1',
  accent: '#8fb1ff',
  star: '#b4caff',
  night: '#0d1f4a',
  line: '#393a39', // linee sottili: ink al 22% sul nero, come --line-2 del sito, ma pieno
};
// Font statici (istanze del variabile del sito, in ./font): nel PDF restano
// caratteri veri, che ogni tipografia legge senza sorprese.
const fontUrl = (file) => pathToFileURL(join(here, 'font', file)).href;

// Il GM vettoriale del sito, lo stesso della pagina Chi siamo.
const mono = readFileSync(join(site, 'app', 'chi-siamo', 'monogram-shape.ts'), 'utf8');
const MONO_PATH = mono.match(/MONO_PATH = '([^']+)'/)[1];

// ---------------------------------------------------------------------------
// Campi da compilare

const missing = [];
const field = (value, label) => {
  if (value && String(value).trim()) return esc(value);
  missing.push(label);
  return `<span class="todo">${esc(label)}</span>`;
};
function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

// ---------------------------------------------------------------------------
// Cielo stellato: stelle morbide, sparse, mai sopra i testi.
// Coordinate nel foglio con abbondanza (0..91 × 0..61 mm).

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Rettangoli liberi da stelle, in coordinate del formato finito. */
function sky(seed, { stars, dust, keepOut, clusters }) {
  const r = rng(seed);
  const out = [];
  const free = (x, y, pad) =>
    !keepOut.some(([x0, y0, x1, y1]) =>
      x > x0 + BLEED - pad && x < x1 + BLEED + pad && y > y0 + BLEED - pad && y < y1 + BLEED + pad);
  const place = (n, make) => {
    let tries = 0;
    while (n > 0 && tries++ < 20000) {
      let x, y;
      const c = clusters && r() < 0.45 ? clusters[Math.floor(r() * clusters.length)] : null;
      if (c) {
        // Piccoli ammassi: qualche stella in più qua e là, come nel cielo del sito.
        const a = r() * Math.PI * 2, d = Math.sqrt(r()) * c[2];
        x = c[0] + BLEED + Math.cos(a) * d; y = c[1] + BLEED + Math.sin(a) * d * 0.7;
      } else {
        x = r() * PAGE.w; y = r() * PAGE.h;
      }
      if (x < 0 || y < 0 || x > PAGE.w || y > PAGE.h) continue;
      const s = make();
      if (!free(x, y, s.halo + 0.8)) continue;
      // Gli aloni non si toccano: ogni stella sfuma nel cielo, non in un'altra stella.
      if (out.some((o) => Math.hypot(o.x - x, o.y - y) < o.halo + s.halo + 0.15)) continue;
      out.push({ x, y, ...s });
      n--;
    }
  };
  // Polvere: punti piccoli e tenui, pochi, perché in tanti sembrano grana.
  place(dust, () => ({ halo: 0.26 + r() * 0.12, o: 0.3 + r() * 0.3, blue: r() < 0.25 }));
  // Stelle: nucleo luminoso e alone morbido.
  place(stars, () => {
    const big = r() < 0.12;
    return { halo: big ? 0.9 + r() * 0.5 : 0.38 + r() * 0.4, o: big ? 0.95 : 0.5 + r() * 0.45, blue: r() < 0.3 };
  });
  return out;
}

// Tutto vettoriale, nitido a qualsiasi ingrandimento. Ogni sfumatura è fatta
// di colori pieni (niente trasparenze): così nel PDF resta una sfumatura vera,
// mentre quelle trasparenti Chrome le spezza in pixel. Per questo ogni stella
// sfuma esattamente nel colore del cielo che ha sotto, nebulose comprese.

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const hex = (c) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

/** Nebulose: veli di blu notte, appena visibili, come dietro le sezioni del sito.
 *  [x, y, raggio x, raggio y, intensità], in coordinate del formato finito. */
const NEB_STOPS = [[0, 0.9], [0.55, 0.35], [1, 0]];
const nebAlpha = (t) => {
  if (t >= 1) return 0;
  for (let i = 1; i < NEB_STOPS.length; i++) {
    const [t0, a0] = NEB_STOPS[i - 1], [t1, a1] = NEB_STOPS[i];
    if (t <= t1) return a0 + ((a1 - a0) * (t - t0)) / (t1 - t0);
  }
  return 0;
};
/** Il colore del cielo in un punto, come lo dipingono fondo e nebulose. */
const skyColor = (x, y, nebulae) =>
  nebulae.reduce((c, [nx, ny, rx, ry, o]) => {
    const t = Math.hypot((x - nx - BLEED) / rx, (y - ny - BLEED) / ry);
    return mix(c, rgb(C.night), nebAlpha(t) * o);
  }, rgb(C.bg));

const drawNebulae = (list, id) =>
  list.map(([x, y, rx, ry, o], i) => {
    const stops = NEB_STOPS.map(([t, a]) => `<stop offset="${t}" stop-color="${hex(mix(rgb(C.bg), rgb(C.night), a * o))}"/>`).join('');
    return `<radialGradient id="${id}n${i}">${stops}</radialGradient>` +
      `<ellipse cx="${x + BLEED}" cy="${y + BLEED}" rx="${rx}" ry="${ry}" fill="url(#${id}n${i})"/>`;
  }).join('');

/** Una stella: un nucleo piccolo e luminoso, poi un alone che si spegne nel cielo. */
const drawStars = (list, nebulae, id) =>
  list.map((s, i) => {
    const under = skyColor(s.x, s.y, nebulae);
    const glow = rgb(s.blue ? C.star : C.ink);
    const stops = [
      [0, mix(under, [255, 255, 255], s.o)],
      [0.16, mix(under, s.blue ? rgb('#e4ecff') : [255, 255, 255], s.o * 0.92)],
      [0.34, mix(under, glow, s.o * 0.42)],
      [0.62, mix(under, glow, s.o * 0.1)],
      [1, under],
    ].map(([t, c]) => `<stop offset="${t}" stop-color="${hex(c)}"/>`).join('');
    return `<radialGradient id="${id}s${i}">${stops}</radialGradient>` +
      `<circle cx="${s.x.toFixed(2)}" cy="${s.y.toFixed(2)}" r="${s.halo.toFixed(2)}" fill="url(#${id}s${i})"/>`;
  }).join('');

const skySvg = (id, stars, nebulae) => `
  <svg class="sky" viewBox="0 0 ${PAGE.w} ${PAGE.h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="${PAGE.w}" height="${PAGE.h}" fill="${C.bg}"/>
    ${drawNebulae(nebulae, id)}
    ${drawStars(stars, nebulae, id)}
  </svg>`;

// ---------------------------------------------------------------------------
// Fronte: GoMore e, sotto, che cosa facciamo.

const frontStars = sky(7, {
  stars: 46,
  dust: 60,
  keepOut: [[17, 18, 68, 38.5]],
  clusters: [[70, 10, 13], [12, 45, 11], [60, 47, 9]],
});
const front = `
  <section class="page">
    ${skySvg('f', frontStars, [[66, 12, 30, 18, 0.55], [14, 46, 26, 14, 0.4]])}
    <div class="front">
      <p class="wordmark">GOMORE</p>
      <p class="tagline">Siti web su misura</p>
    </div>
  </section>`;

// ---------------------------------------------------------------------------
// Retro: chi siamo (i nomi), cosa facciamo, dove siamo, come trovarci.

const [p1, p2] = dati.persone;

// QR verso il sito: moduli scuri su una tessera chiara, il modo che ogni
// fotocamera legge (i QR chiari su fondo scuro alcuni telefoni non li leggono).
// Moduli da 0,5 mm e 3 moduli di margine bianco attorno.
const qr = JSON.parse(readFileSync(join(here, 'qr-sito.json'), 'utf8'));
const QR_MODULE = 0.5;
const QR_QUIET = 3;
if (dati.studio.sito && qr.url !== `https://${dati.studio.sito}`.replace(/\/$/, '')) {
  throw new Error(`Il QR porta a ${qr.url}, ma in dati.json il sito è ${dati.studio.sito}: rigenera qr-sito.json prima di stampare.`);
}
// I tre mirini (i quadrati grandi negli angoli) sono ciò con cui il telefono
// trova il codice: restano quadrati, perché arrotondati o con una stella al
// centro non li leggono più tutti (provato: con la stella falliva 27 volte su
// 30). Prendono solo il blu notte del sito, che non toglie nulla alla lettura.
// Le stelline stanno fuori dalla tessera, sul nero del biglietto.
const sparkle = (cx, cy, r, fill) =>
  `<path d="M${cx} ${cy - r}Q${cx + r * 0.16} ${cy - r * 0.16} ${cx + r} ${cy}Q${cx + r * 0.16} ${cy + r * 0.16} ${cx} ${cy + r}` +
  `Q${cx - r * 0.16} ${cy + r * 0.16} ${cx - r} ${cy}Q${cx - r * 0.16} ${cy - r * 0.16} ${cx} ${cy - r}z" fill="${fill}"/>`;
const qrSvg = () => {
  const n = qr.matrix.length, q = QR_QUIET, size = (n + 2 * q) * QR_MODULE;
  const eyes = [[0, 0], [n - 7, 0], [0, n - 7]];
  const inEye = (x, y) => eyes.some(([ex, ey]) => x >= ex && x < ex + 7 && y >= ey && y < ey + 7);
  let d = '';
  qr.matrix.forEach((row, y) => {
    let run = -1;
    for (let x = 0; x <= n; x++) {
      const on = x < n && row[x] === '1' && !inEye(x, y);
      if (on && run < 0) run = x;
      if (!on && run >= 0) { d += `M${run} ${y}h${x - run}v1h-${x - run}z`; run = -1; }
    }
  });
  // Mirino: cornice quadrata e, al posto del quadrato 3×3, una stella a quattro
  // punte rivolte agli angoli; i lati si incurvano verso il centro di QR_CC moduli (oltre 0,6 il QR si legge peggio: provato).
  const CC = Number(process.env.QR_CC ?? 0.6);
  const eye = ([ex, ey]) => {
    const x0 = ex + 2, y0 = ey + 2, x1 = ex + 5, y1 = ey + 5, mx = ex + 3.5, my = ey + 3.5;
    return `M${ex} ${ey}h7v7h-7zM${ex + 1} ${ey + 1}v5h5v-5z` +
      `M${x0} ${y0}Q${mx} ${y0 + CC} ${x1} ${y0}Q${x1 - CC} ${my} ${x1} ${y1}Q${mx} ${y1 - CC} ${x0} ${y1}Q${x0 + CC} ${my} ${x0} ${y0}z`;
  };
  const S = n + 2 * q; // lato della tessera, in moduli
  // Stelline attorno alla tessera (in moduli; la tessera va da -q a n + q).
  const stars = [
    [n + q + 2.6, -q - 1.4, 1.9, C.ink],
    [n + q + 5.2, -q + 2.4, 0.9, C.star],
    [-q - 2.4, n + q - 3.2, 1.3, C.star],
    [-q - 4.6, n + q + 0.4, 0.7, C.ink],
  ];
  return `<svg class="qr" viewBox="${-q} ${-q} ${S} ${S}" overflow="visible" style="width:${size}mm;height:${size}mm" role="img" aria-label="QR: ${esc(qr.url)}">` +
    stars.map(([x, y, r, c]) => sparkle(x, y, r, c)).join('') +
    `<rect x="${-q}" y="${-q}" width="${S}" height="${S}" rx="2" fill="${C.ink}"/>` +
    `<path d="${d}" fill="${C.bg}" shape-rendering="crispEdges"/>` +
    `<path d="${eyes.map(eye).join('')}" fill="${C.night}" fill-rule="evenodd"/></svg>`;
};
const person = (p) => `
  <div class="person">
    <p class="name">${esc(p.nome)}</p>
    <p class="role">${esc(p.ruolo)}</p>
    <p class="phone">${field(p.telefono, `telefono ${p.nome.split(' ')[0]}`)}</p>
  </div>`;

const backStars = sky(23, {
  stars: 20,
  dust: 26,
  keepOut: [[SAFE - 1, SAFE - 1, TRIM.w - SAFE + 1, TRIM.h - SAFE + 1]],
  clusters: [[80, 3, 8], [4, 52, 7]],
});
const back = `
  <section class="page">
    ${skySvg('r', backStars, [[80, 2, 26, 14, 0.45]])}
    <div class="back">
      <header class="top">
        <svg class="mono" viewBox="0 0 848 600" aria-label="GM"><path d="${MONO_PATH}" fill="${C.ink}"/></svg>
        <div class="what">
          <p class="services">Web design · Sviluppo · 3D · AI</p>
          <p class="where"><span class="dot"></span>Torino · Taranto</p>
          <p class="reach">Lavoriamo in tutta Italia</p>
        </div>
      </header>
      <div class="people">${person(p1)}<span class="sep"></span>${person(p2)}</div>
      <footer class="contacts">
        <p class="email fit">${field(dati.studio.email, 'email dello studio')}</p>
        ${qrSvg()}
        <p class="web fit">${field(dati.studio.sito, 'sito')}</p>
      </footer>
    </div>
  </section>`;

// ---------------------------------------------------------------------------
// Stili

const css = (marks) => `
  @font-face { font-family: 'Instrument Sans'; font-weight: 400; src: url('${fontUrl('InstrumentSans-Regular.ttf')}'); }
  @font-face { font-family: 'Instrument Sans'; font-weight: 500; src: url('${fontUrl('InstrumentSans-Medium.ttf')}'); }
  @font-face { font-family: 'Instrument Sans'; font-weight: 700; src: url('${fontUrl('InstrumentSans-Bold.ttf')}'); }
  @font-face { font-family: 'Instrument Serif'; font-style: italic; src: url('${fontUrl('InstrumentSerif-Italic.ttf')}'); }
  @page { size: ${marks ? PAGE.w + 2 * marks : PAGE.w}mm ${marks ? PAGE.h + 2 * marks : PAGE.h}mm; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: 'Instrument Sans', Arial, sans-serif; color: ${C.ink}; font-kerning: normal; text-rendering: geometricPrecision; }
  .sheet { position: relative; width: ${marks ? PAGE.w + 2 * marks : PAGE.w}mm; height: ${marks ? PAGE.h + 2 * marks : PAGE.h}mm; overflow: hidden; page-break-after: always; break-after: page; }
  .sheet:last-child { page-break-after: auto; break-after: auto; }
  .page { position: absolute; left: ${marks || 0}mm; top: ${marks || 0}mm; width: ${PAGE.w}mm; height: ${PAGE.h}mm; overflow: hidden; background: ${C.bg}; }
  .sky { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
  .mark { position: absolute; background: #000; }

  /* Fronte */
  .front { position: absolute; left: ${BLEED}mm; top: ${BLEED}mm; width: ${TRIM.w}mm; height: ${TRIM.h}mm;
    display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding-bottom: 1mm; }
  /* Maiuscolo, spaziato; il margine negativo compensa la spaziatura dopo l'ultima lettera, così resta centrato. */
  .wordmark { font-weight: 700; font-size: 26pt; line-height: 1; letter-spacing: 0.07em; margin-right: -0.07em; }
  .tagline { margin-top: 2.6mm; font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 11.5pt; line-height: 1; color: ${C.warm}; letter-spacing: 0.005em; }

  /* Retro */
  .back { position: absolute; left: ${BLEED + SAFE}mm; top: ${BLEED + SAFE}mm; width: ${TRIM.w - 2 * SAFE}mm; height: ${TRIM.h - 2 * SAFE}mm;
    display: flex; flex-direction: column; justify-content: space-between; }
  /* Il GM è alto quanto il blocco di testo accanto: una sola fascia. */
  .top { display: flex; justify-content: space-between; align-items: center; }
  .mono { width: 14mm; height: auto; display: block; }
  /* Cosa facciamo; poi dove siamo (le città, maiuscole, con il punto blu) e,
     sotto, fin dove arriviamo, in una frase: due cose diverse, due livelli. */
  .what { text-align: right; color: ${C.ink2}; }
  .services, .where { font-size: 6pt; line-height: 1.3; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; }
  .where { margin-top: 1.5mm; color: ${C.ink}; }
  .reach { margin-top: 0.5mm; font-size: 6.6pt; line-height: 1.3; letter-spacing: 0.01em; }
  .dot { display: inline-block; width: 1.1mm; height: 1.1mm; border-radius: 50%; background: ${C.accent}; margin-right: 1.4mm; vertical-align: 0.15mm; }
  .people { display: flex; align-items: stretch; gap: 4.5mm; }
  .sep { width: 0.2mm; background: ${C.line}; }
  .person { flex: 1 1 0; }
  .name { font-size: 8.6pt; font-weight: 500; letter-spacing: -0.005em; line-height: 1.15; white-space: nowrap; }
  .role { margin-top: 0.8mm; font-size: 6pt; letter-spacing: 0.04em; color: ${C.ink2}; }
  .phone { margin-top: 1.8mm; font-size: 7.6pt; font-weight: 500; letter-spacing: 0.02em; font-variant-numeric: tabular-nums; }
  /* Email e sito ai lati del QR, ciascuno sopra la sua linea sottile. */
  .contacts { display: grid; grid-template-columns: 1fr auto 1fr; column-gap: 3mm; align-items: end; font-size: 7pt; font-weight: 500; letter-spacing: 0.01em; }
  /* Altezza fissa: le due linee restano alla stessa quota, qualunque cosa ci sia scritto. */
  .contacts .fit { height: 5.4mm; padding-top: 2.4mm; border-top: 0.2mm solid ${C.line}; white-space: nowrap; overflow: hidden; line-height: 1.2;
    display: flex; align-items: flex-end; }
  .qr { display: block; overflow: visible; }
  .web { color: ${C.accent}; justify-content: flex-end; }
  .todo { display: inline-block; padding: 0.1mm 1.2mm; border: 0.25mm dashed ${C.accent}; border-radius: 0.8mm; color: ${C.accent}; font-weight: 400; font-size: 6pt; letter-spacing: 0.04em; }

  /* Anteprima a schermo */
  .preview { display: flex; gap: 10mm; padding: 10mm; background: #e9e7e2; width: max-content; }
  .preview .cut { position: relative; width: ${TRIM.w}mm; height: ${TRIM.h}mm; overflow: hidden; border-radius: 0.6mm; box-shadow: 0 1.5mm 5mm rgb(0 0 0 / 0.28); }
  .preview .page { left: -${BLEED}mm; top: -${BLEED}mm; }
`;

// Segni di taglio: fuori dall'abbondanza, sulle linee del formato finito.
function cropMarks(m) {
  const len = m - BLEED - 1.5; // dal bordo foglio fino a 1,5 mm dall'abbondanza
  const t = 0.25; // spessore in mm
  const xs = [m + BLEED, m + BLEED + TRIM.w];
  const ys = [m + BLEED, m + BLEED + TRIM.h];
  const W = PAGE.w + 2 * m, H = PAGE.h + 2 * m;
  const out = [];
  for (const x of xs) {
    out.push(`<i class="mark" style="left:${x - t / 2}mm;top:0;width:${t}mm;height:${len}mm"></i>`);
    out.push(`<i class="mark" style="left:${x - t / 2}mm;top:${H - len}mm;width:${t}mm;height:${len}mm"></i>`);
  }
  for (const y of ys) {
    out.push(`<i class="mark" style="top:${y - t / 2}mm;left:0;height:${t}mm;width:${len}mm"></i>`);
    out.push(`<i class="mark" style="top:${y - t / 2}mm;left:${W - len}mm;height:${t}mm;width:${len}mm"></i>`);
  }
  return out.join('');
}

const doc = (body, marks = 0) => `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>GoMore — biglietto da visita</title><style>${css(marks)}</style></head><body>${body}</body></html>`;

const sheets = (marks) => [front, back].map((side) => `<div class="sheet">${marks ? cropMarks(marks) : ''}${side}</div>`).join('');

// ---------------------------------------------------------------------------
// Uscita

const chrome = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
].find(existsSync);
if (!chrome) throw new Error('Serve Google Chrome per creare il PDF.');

const run = (args) => execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', '--virtual-time-budget=4000', ...args], { stdio: 'pipe' });

const draft = missing.length ? '-BOZZA' : '';
for (const f of ['GoMore-biglietto-da-visita', 'GoMore-biglietto-con-crocini']) {
  for (const suffix of ['', '-BOZZA']) rmSync(join(here, `${f}${suffix}.pdf`), { force: true });
}

const px = (mm) => (mm * 96) / 25.4;

const build = (name, html, pdf) => {
  const file = join(here, `.${name}.html`);
  writeFileSync(file, html);
  run(['--no-pdf-header-footer', `--print-to-pdf=${join(here, pdf)}`, pathToFileURL(file).href]);
  rmSync(file);
};
build('stampa', doc(sheets(0)), `GoMore-biglietto-da-visita${draft}.pdf`);
build('crocini', doc(sheets(10), 10), `GoMore-biglietto-con-crocini${draft}.pdf`);

// Anteprima: fronte e retro come escono dal taglio.
const previewFile = join(here, '.anteprima.html');
writeFileSync(previewFile, doc(`<div class="preview"><div class="cut">${front}</div><div class="cut">${back}</div></div>`));
// Email e sito devono stare interi accanto al QR: se uno è troppo lungo, lo dice.
const checkFile = join(here, '.controllo.html');
writeFileSync(checkFile, doc(`${back}<script>document.fonts.ready.then(() => { document.body.dataset.overflow = [...document.querySelectorAll('.fit')].filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent.trim()).join(' | '); });</script>`));
const dom = run(['--dump-dom', pathToFileURL(checkFile).href]).toString();
rmSync(checkFile);
const overflow = dom.match(/data-overflow="([^"]*)"/)?.[1];
if (overflow) console.warn(`Attenzione, non sta accanto al QR: ${overflow}. Usa un indirizzo più corto.`);
run(['--force-device-scale-factor=4', `--window-size=${Math.round(px(2 * TRIM.w + 30))},${Math.round(px(TRIM.h + 20))}`, `--screenshot=${join(here, 'anteprima.png')}`, pathToFileURL(previewFile).href]);
rmSync(previewFile);

console.log(missing.length
  ? `Bozza creata. Da compilare in dati.json: ${missing.join(', ')}.`
  : 'Pronto per la stampa: GoMore-biglietto-da-visita.pdf');
