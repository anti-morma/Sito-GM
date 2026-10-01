// Da dati.json al PDF.
//
//   node src/render.mjs ideaoro          → clienti/ideaoro/Check-up digitale – <Nome>.pdf
//   node src/render.mjs --vuoto          → modello/Check-up digitale – modello compilabile.pdf
//   aggiungi --png per salvare anche un'anteprima PNG di ogni pagina.
//
// La pagina è HTML stampato da Chrome: A4, 794 × 1123 px a 96 dpi. Nel modello
// vuoto ogni dato è un campo del PDF (data-f) e ogni esito una scelta OK/!/✕
// (data-r): Chrome disegna la grafica, pdf-lib ci sovrappone i campi.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { AREE, CONTROLLI } from './checks.mjs';
import { punteggiAree, punteggioTotale, giudizio, tonoPageSpeed, titoloSintesi, priorita, abbandono, CURVA_ABBANDONO } from './score.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const asset = (f) => pathToFileURL(path.join(ROOT, 'assets', f)).href;

const argv = process.argv.slice(2);
const VUOTO = argv.includes('--vuoto');
const PNG = argv.includes('--png');
const slug = argv.find((a) => !a.startsWith('--'));
if (!VUOTO && !slug) { console.error('Uso: node src/render.mjs <cliente> | --vuoto'); process.exit(1); }

const studio = JSON.parse(fs.readFileSync(path.join(ROOT, 'studio.json'), 'utf8'));
const DIR = VUOTO ? path.join(ROOT, 'modello') : path.join(ROOT, 'clienti', slug);
fs.mkdirSync(DIR, { recursive: true });
const dati = VUOTO ? { cliente: {}, report: {}, velocita: {}, controlli: {}, gbp: {}, posizionamento: {}, concorrenti: [] }
  : JSON.parse(fs.readFileSync(path.join(DIR, 'dati.json'), 'utf8'));

// ── Formattazione ───────────────────────────────────────────────────────────
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = (n, d = 1) => (n == null ? '—' : Number(n).toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: d }));
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const dataLunga = (iso) => { if (!iso) return ''; const d = new Date(iso); return `${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`; };
const tronca = (s, n) => (!s ? '' : s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const kb = (n) => (n >= 1024 ? `${num(n / 1024, 1)} MB` : `${num(n, 0)} KB`);

// Un dato: il valore, oppure (nel modello) un campo compilabile.
const F = (id, { w = 120, h = 18, size = 10, ml = false, align = 'left', cls = '', hint = '' } = {}) =>
  `<span class="f ${cls}" data-f="${id}" data-size="${size}" data-ml="${ml ? 1 : 0}" data-align="${align}" style="width:${typeof w === 'number' ? `${w}px` : w};height:${h}px">${hint ? `<i>${esc(hint)}</i>` : ''}</span>`;
const V = (valore, id, opt = {}) => (VUOTO ? F(id, opt) : valore == null || valore === '' ? '<span class="nd">Da verificare</span>' : valore);

const ICONE = {
  ok: '<path d="M4.5 8.4l2.3 2.3 4.7-5.2"/>',
  warn: '<path d="M8 4.2v4.6M8 11.3v.2"/>',
  bad: '<path d="M5.2 5.2l5.6 5.6M10.8 5.2l-5.6 5.6"/>',
  na: '<path d="M5 8h6"/>',
};
const icona = (stato, size = 16) => `<svg class="ic ic-${stato}" viewBox="0 0 16 16" width="${size}" height="${size}"><circle cx="8" cy="8" r="7.3"/>${ICONE[stato] || ICONE.na}</svg>`;
const ETICHETTA = { ok: 'OK', warn: 'Da migliorare', bad: 'Critico', na: 'Da verificare' };

// Il nome del cliente e della keyword, o un campo nel modello.
const C = dati.cliente || {};
const nomeCliente = (opt) => V(esc(C.nome), 'cliente_nome', opt);
const keyword = C.keyword || dati.posizionamento?.keyword;

// ── Grafica: anelli, soglie, barre ──────────────────────────────────────────
function anello(valore, { size = 120, tono = null, spessore = null, id = null, testo = null, sotto = '', scuro = false } = {}) {
  const sw = spessore ?? Math.max(3, size * 0.045);
  const r = (size - sw) / 2 - 1;
  const circ = 2 * Math.PI * r;
  const v = VUOTO || valore == null ? 0 : Math.max(0, Math.min(100, valore));
  const t = tono ?? (valore == null ? 'na' : giudizio(valore).tono);
  const centro = VUOTO && id ? F(id, { w: size * 0.46, h: size * 0.3, size: Math.round(size * 0.2), align: 'center', cls: 'f-big' })
    : `<span class="an-num">${testo ?? (valore == null ? '—' : valore)}</span>`;
  return `<div class="anello ${scuro ? 'scuro' : ''}" style="width:${size}px;height:${size}px;--s:${size}px">
    <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <circle class="an-track" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${sw}"/>
      ${v ? `<circle class="an-arc t-${t}" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${sw}" stroke-dasharray="${(circ * v) / 100} ${circ}" transform="rotate(-90 ${size / 2} ${size / 2})"/>` : ''}
    </svg>
    <div class="an-in">${centro}${sotto ? `<span class="an-sotto">${sotto}</span>` : ''}</div>
  </div>`;
}

// Soglie di Google: verde fino a `buono`, ambra fino a `scarso`, rosso oltre.
function soglia(valore, buono, scarso) {
  const max = scarso * 2;
  const p = (x) => `${(Math.min(x, max) / max) * 100}%`;
  const marker = !VUOTO && valore != null ? `<i class="mk" style="left:${p(valore)}"></i>` : '';
  return `<div class="soglia"><span class="z z-ok" style="width:${p(buono)}"></span><span class="z z-warn" style="width:calc(${p(scarso)} - ${p(buono)})"></span><span class="z z-bad"></span>${marker}</div>`;
}
const tonoSoglia = (v, b, s) => (v == null ? 'na' : v <= b ? 'ok' : v <= s ? 'warn' : 'bad');

function riga(c, { valore = true } = {}) {
  const r = dati.controlli?.[c.id] || { stato: 'na' };
  if (VUOTO) {
    return `<div class="ck"><span class="ck-nm">${esc(c.nome)}</span>${F(`v_${c.id}`, { w: 104, h: 15, size: 8, cls: 'f-sm' })}
      <span class="radios" data-r="stato_${c.id}">${['ok', 'warn', 'bad'].map((s) => `<i class="rd rd-${s}" data-opt="${s}"></i>`).join('')}</span></div>`;
  }
  return `<div class="ck ck-${r.stato}">${icona(r.stato, 15)}<span class="ck-nm">${esc(c.nome)}${r.nota ? `<small>${esc(r.nota)}</small>` : ''}</span>
    ${valore ? `<span class="ck-vl">${esc(r.valore ?? '')}</span>` : ''}<span class="pill p-${r.stato}">${ETICHETTA[r.stato]}</span></div>`;
}
const lista = (area, opt) => `<div class="checks">${VUOTO ? '<div class="ck-head"><span>Controllo</span><span>Rilevato</span><span class="rh"><b>OK</b><b>!</b><b>✕</b></span></div>' : ''}${CONTROLLI.filter((c) => c.area === area).map((c) => riga(c, opt)).join('')}</div>`;

// Stelle di valutazione, piene fino al voto.
function stelle(voto, size = 16) {
  const s = [];
  for (let i = 0; i < 5; i++) {
    const pieno = VUOTO || voto == null ? 0 : Math.max(0, Math.min(1, voto - i));
    s.push(`<svg viewBox="0 0 20 20" width="${size}" height="${size}"><defs><linearGradient id="st${i}${size}${Math.round((voto || 0) * 10)}"><stop offset="${pieno * 100}%" stop-color="var(--gold)"/><stop offset="${pieno * 100}%" stop-color="var(--line-2)"/></linearGradient></defs><path fill="url(#st${i}${size}${Math.round((voto || 0) * 10)})" d="M10 1.6l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.5l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z"/></svg>`);
  }
  return `<span class="stelle">${s.join('')}</span>`;
}

// Il cielo della copertina: stelle deterministiche, sempre uguali.
function cielo(w, h, n = 260, seme = 7) {
  let x = seme;
  const rnd = () => ((x = (x * 16807) % 2147483647) / 2147483647);
  let out = '';
  for (let i = 0; i < n; i++) {
    const cx = rnd() * w; const cy = rnd() * h; const r = rnd() ** 3 * 1.5 + 0.25;
    const col = rnd() < 0.3 ? '#8fb1ff' : rnd() < 0.15 ? '#e0d8c1' : '#f3f1ec';
    out += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(2)}" fill="${col}" opacity="${(0.25 + rnd() * 0.7).toFixed(2)}"/>`;
  }
  return `<svg class="cielo" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="none">${out}</svg>`;
}

// ── Pagine ──────────────────────────────────────────────────────────────────
const TOT_PAGINE = 9;
const vel = dati.velocita || {};
const mob = vel.mobile || {};
const desk = vel.desktop || {};
const aree = VUOTO ? {} : punteggiAree(dati);
const totale = VUOTO ? null : punteggioTotale(aree);
const giu = giudizio(totale);
const gbp = dati.gbp || {};
const pos = dati.posizionamento || {};
const segnaposto = (v, etichetta) => (v ? esc(v) : `<span class="sp">${etichetta}</span>`);

const testata = (n) => `<header class="ph">
  <div class="ph-l"><i class="mark"></i><b>${esc(studio.nome)}</b><span>Check-up digitale</span></div>
  <div class="ph-r"><span>${VUOTO ? F(`testata_cliente_${n}`, { w: 150, h: 14, size: 8, cls: 'f-sm' }) : esc(C.nome)}</span><span class="pn">${String(n).padStart(2, '0')} / ${String(TOT_PAGINE).padStart(2, '0')}</span></div>
</header>`;
const piede = () => `<footer class="pf"><span>${esc(studio.sito)}</span><span>Documento riservato${VUOTO ? '' : ` · preparato per ${esc(C.nome)}`}</span><span>${VUOTO ? '' : esc(dati.report?.codice)}</span></footer>`;
const intestazione = (n, sezione, titolo, lead = '') => `<div class="sez"><div class="kicker"><span>${String(n).padStart(2, '0')}</span>${sezione}</div><h2>${titolo}</h2>${lead ? `<p class="lead">${lead}</p>` : ''}</div>`;
const pagina = (n, corpo, cls = '') => `<section class="page light ${cls}">${testata(n)}<div class="body">${corpo}</div>${piede()}</section>`;

// 1 · Copertina
function copertina() {
  const lcp = mob.lcp;
  const kpi = [
    { v: VUOTO ? F('cop_lcp', { w: 70, h: 30, size: 20, cls: 'f-dark' }) : `${num(lcp)}<small> s</small>`, l: 'per mostrare il sito da smartphone' },
    { v: VUOTO ? F('cop_ps', { w: 70, h: 30, size: 20, cls: 'f-dark' }) : `${mob.punteggio ?? '—'}<small>/100</small>`, l: 'punteggio Google PageSpeed da mobile' },
    { v: VUOTO ? F('cop_rec', { w: 70, h: 30, size: 20, cls: 'f-dark' }) : gbp.valutazione != null ? `${num(gbp.valutazione)}<small> ★</small>` : '<small>n.d.</small>', l: gbp.recensioni != null && !VUOTO ? `valutazione su Google, ${gbp.recensioni} recensioni` : 'valutazione media su Google' },
  ];
  return `<section class="page dark cover">
    ${cielo(794, 1123)}
    <div class="glow"></div>
    <div class="cv-top">
      <div class="cv-brand"><img src="${asset('gm-mark.png')}" alt=""><div><b>${esc(studio.nome)}</b><span>${esc(studio.payoff)}</span></div></div>
      <div class="cv-meta">${VUOTO ? `Report n. ${F('codice', { w: 90, h: 14, size: 8, cls: 'f-dark f-sm' })}<br>${F('data', { w: 130, h: 14, size: 8, cls: 'f-dark f-sm' })}` : `Report n. ${esc(dati.report?.codice)}<br>${dataLunga(dati.report?.data)}`}</div>
    </div>
    <div class="cv-main">
      <div class="cv-label">Check-up digitale</div>
      <h1>Lo stato di salute<br><em>del vostro sito</em></h1>
      <p class="cv-sub">Velocità, visibilità su Google, reputazione e conformità:<br>un’analisi misurabile, preparata per</p>
      <div class="cv-cliente">${VUOTO ? F('cliente_nome', { w: 420, h: 40, size: 26, cls: 'f-dark' }) : esc(C.nome)}</div>
      <div class="cv-url">${VUOTO ? F('cliente_url', { w: 300, h: 18, size: 11, cls: 'f-dark' }) : esc((C.url || '').replace(/^https?:\/\//, '').replace(/\/$/, ''))}${!VUOTO && C.citta ? ` · ${esc(C.citta)}` : ''}</div>
    </div>
    <div class="cv-score">
      ${anello(totale, { size: 170, scuro: true, id: 'indice_totale', sotto: '/100' })}
      <div class="cv-score-t">
        <span class="cv-label">Indice di salute digitale</span>
        <div class="cv-giudizio">${VUOTO ? F('giudizio', { w: 200, h: 34, size: 22, cls: 'f-dark' }) : giu ? `<em>${giu.nome}</em>` : ''}</div>
        <p>Sintesi di sei aree pesate sull’impatto che hanno sui vostri clienti. Il dettaglio, area per area, nelle pagine che seguono.</p>
      </div>
    </div>
    <div class="cv-kpi">${kpi.map((k) => `<div><b>${k.v}</b><span>${k.l}</span></div>`).join('')}</div>
    <div class="cv-foot"><span>Preparato da ${esc(studio.nome)}${studio.referente ? ` · ${esc(studio.referente)}` : ''}</span><span>${esc(studio.sito)}</span><span>Documento riservato</span></div>
  </section>`;
}

// 2 · Sintesi
function sintesi() {
  const top = VUOTO ? [1, 2, 3].map(() => null) : priorita(dati, 3);
  const lcp = mob.lcp;
  const kpi = [
    { l: 'Caricamento da smartphone', v: VUOTO ? F('k_lcp', { w: 110, h: 30, size: 20 }) : `${num(lcp)}<small> s</small>`, t: tonoSoglia(lcp, 2.5, 4), s: 'Google: veloce sotto 2,5 s' },
    { l: 'PageSpeed da mobile', v: VUOTO ? F('k_ps', { w: 110, h: 30, size: 20 }) : `${mob.punteggio ?? '—'}<small>/100</small>`, t: tonoPageSpeed(mob.punteggio), s: 'Eccellente da 90 in su' },
    { l: 'Recensioni su Google', v: VUOTO ? F('k_rec', { w: 110, h: 30, size: 20 }) : gbp.valutazione != null ? `${num(gbp.valutazione)}<small> ★ · ${gbp.recensioni ?? '—'}</small>` : '<small class="nd">Da verificare</small>', t: gbp.valutazione == null ? 'na' : gbp.valutazione >= 4.5 ? 'ok' : gbp.valutazione >= 4 ? 'warn' : 'bad', s: VUOTO ? 'Voto medio · numero' : gbp.risposte != null ? `Con risposta: ${gbp.risposte}%` : 'Voto medio · numero' },
    { l: `Posizione per «${esc(keyword || 'attività città')}»`, v: VUOTO ? F('k_pos', { w: 110, h: 30, size: 20 }) : posizione(pos.mappe, 'su Maps'), t: tonoPosizione(pos.mappe), s: VUOTO ? 'Su Google Maps' : pos.organico != null ? `Risultati web: ${posTesto(pos.organico)}` : 'Su Google Maps' },
  ];
  return pagina(2, `
    ${intestazione(1, 'Sintesi', 'Cosa abbiamo <em>trovato</em>')}
    <div class="headline"><span class="q">“</span><p>${VUOTO ? F('titolo_sintesi', { w: 600, h: 58, size: 15, ml: true, cls: 'f-dark' }) : esc(titoloSintesi(dati))}</p></div>
    <div class="s-grid">
      <div class="s-score">
        ${anello(totale, { size: 150, id: 'indice_totale_2', sotto: '/100' })}
        <div class="s-giudizio">${VUOTO ? F('giudizio_2', { w: 150, h: 22, size: 14, align: 'center' }) : giu ? `<span class="t-${giu.tono}">${giu.nome}</span>` : ''}</div>
        <div class="scala"><span><i class="t-bad"></i>0–49 critico</span><span><i class="t-warn"></i>50–69 da migliorare</span><span><i class="t-ok"></i>70–89 buono</span><span><i class="t-ok"></i>90–100 eccellente</span></div>
      </div>
      <div class="s-aree">
        ${AREE.map((a) => {
          const v = aree[a.id]; const g = giudizio(v);
          return `<div class="area"><div class="area-t"><b>${a.nome}</b><span>${a.sottotitolo}</span></div>
            <div class="bar">${!VUOTO && v != null ? `<i class="t-${g.tono}" style="width:${Math.max(v, 2)}%"></i>` : ''}</div>
            <div class="area-v">${VUOTO ? F(`area_${a.id}`, { w: 44, h: 18, size: 11, align: 'right' }) : v == null ? '<span class="nd">n.d.</span>' : `<b>${v}</b>`}</div></div>`;
        }).join('')}
        <p class="nota">Ogni area pesa sul totale in base all’impatto sui clienti: velocità 25%, Google e Google Business 20% ciascuna, smartphone 15%, sicurezza e contatti 10% ciascuna.</p>
      </div>
    </div>
    <h3 class="h3">Le tre priorità</h3>
    <div class="prio3">${top.map((p, i) => `<div class="pc">
      <span class="pc-n">${i + 1}</span>
      ${VUOTO ? `${F(`prio${i + 1}_titolo`, { w: '100%', h: 34, size: 10, ml: true })}${F(`prio${i + 1}_testo`, { w: '100%', h: 60, size: 8, ml: true, cls: 'f-gap' })}`
        : `<b>${esc(p?.nome)}</b><p>${esc(p?.perche)}</p><span class="pill p-${p?.impatto >= 3 ? 'bad' : 'warn'}">${p?.impatto >= 3 ? 'Impatto alto' : p?.impatto === 2 ? 'Impatto medio' : 'Impatto basso'}</span>`}
    </div>`).join('')}</div>
    <div class="kpis">${kpi.map((k) => `<div class="kpi"><span class="kpi-l">${k.l}</span><b class="${VUOTO ? '' : `c-${k.t}`}">${k.v}</b><span class="kpi-s">${k.s}</span></div>`).join('')}</div>
  `);
}
function posTesto(p) { return p == null ? 'n.d.' : typeof p === 'number' ? `${p}° posto` : String(p); }
function posizione(p, dove) { return p == null ? '<small class="nd">Da verificare</small>' : typeof p === 'number' ? `${p}°<small> ${dove}</small>` : `<span class="kpi-txt">${esc(p)}</span>`; }
function tonoPosizione(p) { return p == null ? 'na' : typeof p !== 'number' ? 'bad' : p <= 3 ? 'ok' : p <= 10 ? 'warn' : 'bad'; }

// 3 · Velocità
function velocita() {
  const metriche = [
    { id: 'lcp', n: 'Contenuto principale visibile', s: 'Largest Contentful Paint', v: mob.lcp, b: 2.5, p: 4, u: ' s' },
    { id: 'fcp', n: 'Primo elemento sullo schermo', s: 'First Contentful Paint', v: mob.fcp, b: 1.8, p: 3, u: ' s' },
    { id: 'si', n: 'Velocità percepita', s: 'Speed Index', v: mob.si, b: 3.4, p: 5.8, u: ' s' },
    { id: 'tbt', n: 'Pagina bloccata ai tocchi', s: 'Total Blocking Time', v: mob.tbt, b: 200, p: 600, u: ' ms', d: 0 },
    { id: 'cls', n: 'Stabilità durante il caricamento', s: 'Cumulative Layout Shift', v: mob.cls, b: 0.1, p: 0.25, u: '', d: 2 },
  ];
  const peso = mob.peso || {};
  const segmenti = [
    { k: 'immagini', n: 'Immagini', c: 'var(--c1)' }, { k: 'script', n: 'JavaScript', c: 'var(--c2)' },
    { k: 'font', n: 'Caratteri', c: 'var(--c3)' }, { k: 'css', n: 'Stili CSS', c: 'var(--c4)' }, { k: 'altro', n: 'Altro', c: 'var(--c5)' },
  ];
  const opp = (mob.opportunita || []).slice(0, 5);
  return pagina(3, `
    ${intestazione(2, 'Velocità', 'Quanto aspetta chi vi apre <em>dal telefono</em>', `Misurata con ${esc(dati.report?.fonteVelocita || 'Google Lighthouse')}, lo stesso motore di PageSpeed Insights, su uno smartphone di fascia media con rete 4G: la condizione in cui vi cerca la maggior parte dei clienti.`)}
    <div class="v-top">
      <div class="v-gauges">
        <div class="g">${anello(mob.punteggio, { size: 100, tono: tonoPageSpeed(mob.punteggio), id: 'ps_mobile' })}<b>Smartphone</b><span>PageSpeed</span></div>
        <div class="g">${anello(desk.punteggio, { size: 100, tono: tonoPageSpeed(desk.punteggio), id: 'ps_desktop' })}<b>Computer</b><span>PageSpeed</span></div>
        <div class="g-leg"><span><i class="t-bad"></i>0–49</span><span><i class="t-warn"></i>50–89</span><span><i class="t-ok"></i>90–100</span></div>
      </div>
      <div class="metriche">
        ${metriche.map((m) => `<div class="met">
          <div class="met-t"><b>${m.n}</b><span>${m.s}</span></div>
          ${soglia(m.v, m.b, m.p)}
          <div class="met-v">${VUOTO ? F(`m_${m.id}`, { w: 62, h: 18, size: 11, align: 'right' }) : `<b class="c-${tonoSoglia(m.v, m.b, m.p)}">${num(m.v, m.d ?? 1)}${m.u}</b>`}</div>
        </div>`).join('')}
        <div class="met-leg"><span><i class="t-ok"></i>Buono per Google</span><span><i class="t-warn"></i>Da migliorare</span><span><i class="t-bad"></i>Scarso</span></div>
      </div>
    </div>
    <div class="v-mid">
      <div class="card">
        <h4>Più aspettano, più se ne vanno</h4>
        <p class="c-sub">Aumento della probabilità che un visitatore abbandoni la pagina, rispetto a un caricamento di 1 secondo.</p>
        ${graficoAbbandono(mob.lcp)}
        <p class="fonte">Fonte: Google/SOASTA Research, 2017.</p>
      </div>
      <div class="card">
        <h4>Quanto pesa la pagina</h4>
        <p class="c-sub">Tutto ciò che il telefono deve scaricare per mostrare la home.</p>
        <div class="peso-big">${VUOTO ? F('peso_tot', { w: 90, h: 34, size: 22 }) : `<b>${kb(peso.totaleKB || 0)}</b>`}<span>${VUOTO ? F('peso_req', { w: 40, h: 14, size: 9, cls: 'f-sm' }) : num(peso.richieste, 0)} file · obiettivo GoMore: sotto 1,5 MB</span></div>
        <div class="stack">${VUOTO ? '' : segmenti.filter((s) => peso[s.k] > 0).map((s) => `<i style="flex:${peso[s.k]};background:${s.c}"></i>`).join('')}</div>
        <div class="stack-leg">${segmenti.map((s) => `<span><i style="background:${s.c}"></i>${s.n}<b>${VUOTO ? F(`peso_${s.k}`, { w: 50, h: 13, size: 8, align: 'right', cls: 'f-sm' }) : kb(peso[s.k] || 0)}</b></span>`).join('')}</div>
      </div>
    </div>
    <div class="opp">
      <h4>Cosa rallenta il sito <span>e quanto si può recuperare</span></h4>
      ${(VUOTO ? [0, 1, 2, 3, 4] : opp).map((o, i) => `<div class="opp-r"><span class="opp-n">${i + 1}</span>
        <span class="opp-t">${VUOTO ? F(`opp${i + 1}`, { w: 420, h: 16, size: 10 }) : esc(o.titolo)}</span>
        <span class="opp-s">${VUOTO ? F(`opp${i + 1}_s`, { w: 80, h: 16, size: 10, align: 'right' }) : o.risparmioS >= 0.1 ? `fino a <b>−${num(o.risparmioS)} s</b>` : o.risparmioKB ? `<b>−${kb(o.risparmioKB)}</b>` : '<b>da ottimizzare</b>'}</span></div>`).join('')}
      ${!VUOTO && !opp.length ? '<p class="nota">Nessun intervento rilevante: la velocità è già ottima.</p>' : ''}
    </div>
    <div class="tiles">
      <div><span>Da computer, contenuto principale in</span><b>${VUOTO ? F('desk_lcp', { w: 80, h: 22, size: 14 }) : `${num(desk.lcp)} s`}</b></div>
      <div><span>Risposta del server</span><b>${VUOTO ? F('ttfb', { w: 80, h: 22, size: 14 }) : mob.ttfb != null ? `${num(mob.ttfb / 1000, 2)} s` : '—'}</b></div>
      <div><span>Pagina utilizzabile dopo</span><b>${VUOTO ? F('tti', { w: 80, h: 22, size: 14 }) : `${num(mob.tti)} s`}</b></div>
    </div>
  `);
}

function graficoAbbandono(lcp) {
  const W = 318; const H = 150; const L = 30; const R = 10; const T = 12; const B = 22;
  const x = (s) => L + ((s - 1) / 9) * (W - L - R);
  const y = (p) => T + (1 - p / 140) * (H - T - B);
  const pts = CURVA_ABBANDONO.map(([s, p]) => `${x(s).toFixed(1)},${y(p).toFixed(1)}`).join(' ');
  const area = `${x(1)},${y(0)} ${pts} ${x(10)},${y(0)}`;
  const grid = [0, 40, 80, 120].map((p) => `<line x1="${L}" x2="${W - R}" y1="${y(p)}" y2="${y(p)}" class="gl"/><text x="${L - 6}" y="${y(p) + 3}" class="ax" text-anchor="end">+${p}%</text>`).join('');
  const ticks = [1, 2.5, 4, 6, 8, 10].map((s) => `<text x="${x(s)}" y="${H - 6}" class="ax" text-anchor="middle">${num(s)} s</text>`).join('');
  let marker = '';
  if (!VUOTO && lcp != null) {
    const s = Math.min(Math.max(lcp, 1), 10); const p = abbandono(lcp);
    const fuori = lcp > 10;
    const lx = x(s); const ly = y(p);
    const anchor = lx > W - 90 ? 'end' : 'start';
    const tx = anchor === 'end' ? lx - 10 : lx + 10;
    marker = `<line x1="${lx}" x2="${lx}" y1="${ly}" y2="${y(0)}" class="mk-l"/><circle cx="${lx}" cy="${ly}" r="5.5" class="mk-c"/>
      <text x="${tx}" y="${ly + 22}" class="mk-t" text-anchor="${anchor}">Voi: ${num(lcp)} s${fuori ? ' →' : ''}</text><text x="${tx}" y="${ly + 34}" class="mk-s" text-anchor="${anchor}">+${p}% abbandoni</text>`;
  }
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <rect x="${x(1)}" y="${T}" width="${x(2.5) - x(1)}" height="${y(0) - T}" class="target"/><text x="${(x(1) + x(2.5)) / 2}" y="${T + 10}" class="tg" text-anchor="middle">obiettivo</text>
    ${grid}${ticks}<polygon points="${area}" class="ar"/><polyline points="${pts}" class="ln"/>${CURVA_ABBANDONO.map(([s, p]) => `<circle cx="${x(s)}" cy="${y(p)}" r="2.6" class="pt"/>`).join('')}${marker}
  </svg>`;
}

// 4 · Smartphone
function smartphone() {
  const img = (f) => (VUOTO || !fs.existsSync(path.join(DIR, f)) ? '<div class="shot-vuoto">Screenshot</div>' : `<img src="${f}" alt="">`);
  return pagina(4, `
    ${intestazione(3, 'Esperienza da smartphone', 'Come vi vede un cliente <em>dal telefono</em>', 'La prima schermata del sito, così come appare aprendolo da uno smartphone, e i controlli che fanno la differenza tra una visita e un cliente.')}
    <div class="m-grid">
      <div class="m-left">
        <div class="phone"><div class="phone-in">${img('screen-mobile.jpg')}</div><i class="notch"></i></div>
        <p class="didascalia">Prima apertura da smartphone${VUOTO ? '' : `, ${dataLunga(dati.report?.data)}`}.</p>
      </div>
      <div class="m-right">
        <div class="area-head">${anello(aree.mobile, { size: 76, id: 'area_mobile_p' })}<div><b>Esperienza da smartphone</b><span>${VUOTO ? 'Punteggio dell’area, su 100' : `${giudizio(aree.mobile)?.nome ?? ''} · accessibilità ${mob.accessibilita ?? '—'}/100`}</span></div></div>
        ${lista('mobile')}
        <div class="desk"><div class="browser"><div class="b-bar"><i></i><i></i><i></i><span>${VUOTO ? '' : esc((C.url || '').replace(/^https?:\/\//, '').replace(/\/$/, ''))}</span></div><div class="b-in">${img('screen-desktop.jpg')}</div></div><p class="didascalia">E da computer.</p></div>
      </div>
    </div>
    <div class="stat"><b>76%</b><p>delle persone che cercano da smartphone un’attività nelle vicinanze la visita entro un giorno. Il 28% di queste ricerche si chiude con un acquisto.<span class="fonte">Fonte: Google, 2016.</span></p></div>
  `);
}

// 5 · Visibilità su Google
function google() {
  const s = dati.serp || {};
  const dominio = VUOTO ? '' : (C.dominio || '');
  const primi = pos.primi || [];
  return pagina(5, `
    ${intestazione(4, 'Visibilità su Google', `Quando qualcuno cerca <em>«${esc(keyword || 'la vostra attività')}»</em>`, 'Dove comparite nelle ricerche che portano clienti in negozio, e come vi presenta Google.')}
    <div class="g-top">
      <div class="rank">
        <div class="rank-n"><span>Su Google Maps</span><b class="${VUOTO ? '' : `c-${tonoPosizione(pos.mappe)}`}">${VUOTO ? F('pos_mappe', { w: 110, h: 40, size: 26 }) : pos.mappe == null ? '<small class="nd">Da verificare</small>' : typeof pos.mappe === 'number' ? `${pos.mappe}°` : `<small>${esc(pos.mappe)}</small>`}</b></div>
        <div class="rank-n"><span>Nei risultati web</span><b class="${VUOTO ? '' : `c-${tonoPosizione(pos.organico)}`}">${VUOTO ? F('pos_organico', { w: 110, h: 40, size: 26 }) : pos.organico == null ? '<small class="nd">Da verificare</small>' : typeof pos.organico === 'number' ? `${pos.organico}°` : `<small>${esc(pos.organico)}</small>`}</b></div>
        <div class="rank-l"><span>Chi compare per primo</span>
          <ol>${(VUOTO ? [1, 2, 3] : primi.slice(0, 3)).map((p, i) => `<li>${VUOTO ? F(`primo${i + 1}`, { w: 210, h: 15, size: 9, cls: 'f-sm' }) : esc(p)}</li>`).join('')}${!VUOTO && !primi.length ? '<li class="nd">Da verificare</li>' : ''}</ol>
          <span class="fonte">Ricerca da ${VUOTO ? F('pos_luogo', { w: 90, h: 13, size: 8, cls: 'f-sm' }) : esc(C.citta || '—')}, senza personalizzazione${VUOTO ? '' : `, ${dataLunga(dati.report?.data)}`}.</span></div>
      </div>
      <div class="serp">
        <span class="serp-l">Come vi mostra Google oggi</span>
        <div class="serp-box">
          <div class="serp-site"><i></i><div><b>${VUOTO ? F('serp_nome', { w: 180, h: 13, size: 8, cls: 'f-sm' }) : esc(C.nome)}</b><span>${VUOTO ? F('serp_url', { w: 200, h: 12, size: 7, cls: 'f-sm' }) : esc(`https://${dominio}`)}</span></div></div>
          <div class="serp-t">${VUOTO ? F('serp_titolo', { w: 330, h: 18, size: 11 }) : esc(tronca(s.titolo || '(nessun titolo)', 62))}</div>
          <div class="serp-d">${VUOTO ? F('serp_desc', { w: 330, h: 30, size: 8, ml: true }) : s.descrizione ? esc(tronca(s.descrizione, 158)) : '<span class="nd">Nessuna descrizione: Google ne compone una con frasi prese dalla pagina.</span>'}</div>
        </div>
        <div class="serp-note">${VUOTO ? F('serp_nota', { w: 340, h: 26, size: 8, ml: true }) : noteSerp(s)}</div>
      </div>
    </div>
    <div class="two">
      <div>${lista('seo')}</div>
    </div>
    <div class="stat"><b>27,6%</b><p>dei clic va al primo risultato di Google. Alla seconda pagina arriva meno di una persona su cento (0,63%).<span class="fonte">Fonte: Backlinko, analisi di 4 milioni di ricerche, 2023.</span></p></div>
  `);
}
function noteSerp(s) {
  const out = [];
  const t = s.titolo || ''; const d = s.descrizione || '';
  if (!t) out.push('Manca il titolo della pagina.');
  else if (t.length > 62) out.push(`Il titolo ha ${t.length} caratteri: Google lo taglia.`);
  if (C.citta && !t.toLowerCase().includes(C.citta.toLowerCase())) out.push(`La città (${esc(C.citta)}) non è nel titolo.`);
  if (!d) out.push('Manca la descrizione.');
  else if (d.length > 160) out.push(`La descrizione ha ${d.length} caratteri: Google la taglia.`);
  return out.length ? out.join(' ') : 'Titolo e descrizione hanno la lunghezza giusta.';
}

// 6 · Google Business e recensioni
function business() {
  const conc = dati.concorrenti || [];
  const righe = VUOTO ? [0, 1, 2, 3].map((i) => ({ i })) : [{ nome: C.nome, recensioni: gbp.recensioni, valutazione: gbp.valutazione, voi: true }, ...conc].filter((r) => r.recensioni != null);
  const max = Math.max(1, ...righe.map((r) => r.recensioni || 0));
  const risp = gbp.risposte;
  return pagina(6, `
    ${intestazione(5, 'Google Business e recensioni', 'La vostra vetrina <em>su Google Maps</em>', 'La scheda Google è spesso il primo contatto con un nuovo cliente, prima ancora del sito: orari, foto, recensioni e il modo in cui rispondete.')}
    <div class="b-top">
      <div class="b-kpi">
        <span class="kpi-l">Valutazione media</span>
        <div class="b-voto">${VUOTO ? F('gbp_voto', { w: 80, h: 44, size: 30 }) : `<b>${gbp.valutazione != null ? num(gbp.valutazione) : '—'}</b>`}${stelle(gbp.valutazione, 18)}</div>
        <span class="kpi-s">${VUOTO ? F('gbp_num', { w: 60, h: 14, size: 9, cls: 'f-sm' }) : `<b>${gbp.recensioni ?? '—'}</b>`} recensioni</span>
      </div>
      <div class="b-kpi b-ring">
        ${anello(risp, { size: 92, tono: risp == null ? 'na' : risp >= 80 ? 'ok' : risp >= 40 ? 'warn' : 'bad', id: 'gbp_risposte', testo: risp == null ? '—' : `${risp}%` })}
        <div><span class="kpi-l">Recensioni con risposta</span><span class="kpi-s">L’88% dei clienti sceglie un’attività che risponde a tutte le recensioni.<span class="fonte">BrightLocal, 2022</span></span></div>
      </div>
      <div class="b-kpi">
        <span class="kpi-l">Ultima recensione</span>
        <b class="b-mid">${VUOTO ? F('gbp_ultima', { w: 150, h: 22, size: 14 }) : esc(gbp.ultimaRecensione ?? '—')}</b>
        <span class="kpi-l" style="margin-top:12px">Foto nella scheda</span>
        <b class="b-mid">${VUOTO ? F('gbp_foto', { w: 150, h: 22, size: 14 }) : esc(gbp.foto ?? '—')}</b>
      </div>
    </div>
    <div class="b-grid">
      <div>${lista('gbp')}</div>
      <div class="card conc">
        <h4>Voi e le attività vicine</h4>
        <p class="c-sub">Numero di recensioni su Google e voto medio${VUOTO ? '' : `, per «${esc(keyword)}»`}.</p>
        ${righe.length ? righe.map((r, i) => VUOTO ? `<div class="cr">${F(`conc${i + 1}_nome`, { w: 102, h: 15, size: 8, cls: 'f-sm' })}<div class="cr-bar"></div>${F(`conc${i + 1}_rec`, { w: 30, h: 15, size: 8, cls: 'f-sm', align: 'right' })}${F(`conc${i + 1}_voto`, { w: 36, h: 15, size: 8, cls: 'f-sm', align: 'right' })}</div>`
          : `<div class="cr ${r.voi ? 'voi' : ''}"><span class="cr-n">${esc(tronca(r.nome, 24))}${r.voi ? ' <em>(voi)</em>' : ''}</span><div class="cr-bar"><i style="width:${Math.max(2, ((r.recensioni || 0) / max) * 100)}%"></i></div><b>${r.recensioni}</b><span class="cr-v">${r.valutazione != null ? `${num(r.valutazione)} ★` : ''}</span></div>`).join('')
          : '<p class="nd">Da compilare con le attività che compaiono su Maps.</p>'}
        <div class="stat stat-in"><b>98%</b><p>dei consumatori legge le recensioni online prima di scegliere un’attività locale.<span class="fonte">BrightLocal, Local Consumer Review Survey 2023.</span></p></div>
      </div>
    </div>
    ${!VUOTO && gbp.nota ? `<p class="nota">${esc(gbp.nota)}</p>` : ''}
    <h3 class="h3">Come Google sceglie chi mostrare su Maps</h3>
    <div class="leve">
      <div><b>Pertinenza</b><p>Quanto la scheda corrisponde alla ricerca: categoria, descrizione, prodotti, parole usate nelle recensioni.</p><span class="pill p-ok">Si lavora</span></div>
      <div><b>Distanza</b><p>Quanto siete vicini a chi cerca. È l’unico fattore che non si può cambiare.</p><span class="pill p-na">Fissa</span></div>
      <div><b>Notorietà</b><p>Numero e voto delle recensioni, risposte, foto, sito collegato e presenza online. Qui si recupera di più.</p><span class="pill p-ok">Si lavora</span></div>
    </div>
    <p class="fonte">Fonte: Google, Guida di Profilo dell’attività, «Come migliorare il posizionamento locale su Google».</p>
  `);
}

// 7 · Sicurezza, conformità, contatti e integrazioni
function sicurezza() {
  const ssl = dati._grezzo?.rete?.ssl;
  return pagina(7, `
    ${intestazione(6, 'Sicurezza, conformità e integrazioni', 'Fiducia, obblighi di legge <em>e strumenti</em>', 'Quello che il cliente non vede ma percepisce: il lucchetto, la privacy, i dati aziendali. E gli strumenti che trasformano una visita in una richiesta.')}
    <div class="two">
      <div>
        <div class="area-head">${anello(aree.sicurezza, { size: 64, id: 'area_sicurezza_p' })}<div><b>Sicurezza e conformità</b><span>${VUOTO ? 'Punteggio dell’area' : giudizio(aree.sicurezza)?.nome ?? ''}</span></div></div>
        ${lista('sicurezza')}
        <div class="info">
          <div><span>Certificato SSL</span><b>${VUOTO ? F('ssl_emittente', { w: 120, h: 14, size: 9, cls: 'f-sm' }) : esc(ssl?.emittente || '—')}</b></div>
          <div><span>Scadenza</span><b>${VUOTO ? F('ssl_scadenza', { w: 120, h: 14, size: 9, cls: 'f-sm' }) : ssl?.scadenza ? dataLunga(ssl.scadenza) : '—'}</b></div>
        </div>
      </div>
      <div>
        <div class="area-head">${anello(aree.conversione, { size: 64, id: 'area_conversione_p' })}<div><b>Contatti e integrazioni</b><span>${VUOTO ? 'Punteggio dell’area' : giudizio(aree.conversione)?.nome ?? ''}</span></div></div>
        ${lista('conversione')}
        <div class="tech"><span>Tecnologie rilevate</span><div>${VUOTO ? F('tecnologie', { w: 320, h: 30, size: 8, ml: true }) : (dati.tecnologie || []).map((t) => `<i>${esc(t)}</i>`).join('') || '<i>—</i>'}</div></div>
      </div>
    </div>
    <div class="stat"><b>4%</b><p>del fatturato annuo, fino a 20 milioni di euro: il tetto delle sanzioni previste dal GDPR. Consenso ai cookie, informativa e dati aziendali in ordine sono la prima tutela, e un segnale di serietà per chi vi sceglie.<span class="fonte">Fonte: Regolamento UE 2016/679, art. 83.</span></p></div>
  `);
}

// 8 · Piano d'azione
function piano() {
  const lista6 = VUOTO ? [0, 1, 2, 3, 4, 5].map(() => null) : priorita(dati, 6);
  const caso = studio.caso || {};
  const confronto = [
    { n: 'Velocità da smartphone', voi: mob.punteggio, noi: caso.velocitaMobile, id: 'cf_vel' },
    { n: 'SEO tecnica (Lighthouse)', voi: mob.seo, noi: caso.seo, id: 'cf_seo' },
    { n: 'Accessibilità', voi: mob.accessibilita, noi: caso.accessibilita, id: 'cf_acc' },
  ];
  return pagina(8, `
    ${intestazione(7, 'Piano d’azione', 'Da dove <em>partiremmo</em>', 'Gli interventi in ordine di impatto: prima quello che fa perdere clienti oggi, poi quello che vi fa trovare e scegliere.')}
    <div class="piano">
      <div class="pr-head"><span>#</span><span>Intervento</span><span>Perché conta</span><span>Cosa facciamo</span><span>Impatto</span></div>
      ${lista6.map((p, i) => `<div class="pr">
        <span class="pr-n">${i + 1}</span>
        ${VUOTO ? `<span>${F(`piano${i + 1}_titolo`, { w: 150, h: 40, size: 9, ml: true })}</span><span>${F(`piano${i + 1}_perche`, { w: 180, h: 40, size: 8, ml: true })}</span><span>${F(`piano${i + 1}_cosa`, { w: 170, h: 40, size: 8, ml: true })}</span><span class="rh3" data-r="impatto_${i + 1}"><i class="rd rd-bad" data-opt="alto"></i><i class="rd rd-warn" data-opt="medio"></i><i class="rd rd-ok" data-opt="basso"></i></span>`
          : `<span class="pr-t"><b>${esc(p.nome)}</b>${p.valore ? `<small>${esc(p.valore)}</small>` : ''}</span><span>${esc(p.perche)}</span><span>${esc(p.soluzione)}</span><span class="pr-i">${[1, 2, 3].map((k) => `<i class="${k <= p.impatto ? `on t-${p.impatto >= 3 ? 'bad' : 'warn'}` : ''}"></i>`).join('')}<small>${p.impatto >= 3 ? 'Alto' : p.impatto === 2 ? 'Medio' : 'Basso'}</small></span>`}
      </div>`).join('')}
      ${VUOTO ? '<div class="pr-leg"><span>Impatto:</span><span><i class="rd rd-bad"></i>alto</span><span><i class="rd rd-warn"></i>medio</span><span><i class="rd rd-ok"></i>basso</span></div>' : ''}
    </div>
    <div class="pot">
      <div class="pot-t"><h4>Il potenziale, misurato</h4><p>Lo stesso controllo, sullo stesso motore di Google, fatto su un sito che abbiamo realizzato noi: <b>${esc(caso.nome || '')}</b>, ${esc(caso.descrizione || '')}.</p></div>
      <div class="pot-c">
        ${confronto.map((c) => `<div class="cf"><span class="cf-n">${c.n}</span>
          <div class="cf-r"><span>Voi</span><div class="cf-bar">${VUOTO ? '' : `<i class="t-${tonoPageSpeed(c.voi) || 'na'}" style="width:${c.voi ?? 0}%"></i>`}</div><b>${VUOTO ? F(`${c.id}_voi`, { w: 34, h: 14, size: 9, align: 'right', cls: 'f-sm' }) : c.voi ?? '—'}</b></div>
          <div class="cf-r noi"><span>${esc(caso.nome || 'GoMore')}</span><div class="cf-bar"><i style="width:${c.noi ?? 0}%"></i></div><b>${c.noi ?? '—'}</b></div></div>`).join('')}
      </div>
    </div>
    <h3 class="h3">Il metodo GoMore</h3>
    <div class="metodo-gm">${[
      ['Fondamenta', 'Strategia, obiettivi e direzione.'], ['Struttura', 'Architettura, UX e percorso del cliente.'],
      ['Forma', 'Design, identità e linguaggio visivo.'], ['Dettagli', 'Interazioni, 3D, motion e AI.'],
      ['Risultato', 'Un sito che lavora per voi: chiaro, veloce, riconoscibile.'],
    ].map(([t, d], i) => `<div><i>${i + 1}</i><b>${t}</b><p>${d}</p></div>`).join('')}</div>
  `);
}

// 9 · Chiusura: proposta e contatti
function chiusura() {
  const anteprima = !VUOTO && dati.proposta?.anteprima && fs.existsSync(path.join(DIR, dati.proposta.anteprima));
  const servizi = [
    { t: 'Sito su misura', k: 'Il progetto', d: 'Progettato da zero sulla vostra identità: veloce, elegante, pensato prima per lo smartphone e per farvi trovare.' },
    { t: 'Google e recensioni', k: 'La vetrina', d: 'Scheda Google Business curata, SEO locale e un metodo semplice per raccogliere e gestire le recensioni.' },
    { t: 'Manutenzione', k: 'Dopo il lancio', d: 'Aggiornamenti, sicurezza e contenuti: un riferimento diretto, così il sito resta al passo con voi.' },
  ];
  const contatti = [
    ['Sito', studio.sito], ['Email', studio.email], ['Telefono', studio.telefono], ['Instagram', studio.instagram],
  ];
  return `<section class="page dark chiusura">
    ${cielo(794, 1123, 200, 31)}
    <div class="glow g2"></div>
    <div class="ch-top"><img src="${asset('gm-mark.png')}" alt=""><span>${String(TOT_PAGINE).padStart(2, '0')} / ${String(TOT_PAGINE).padStart(2, '0')}</span></div>
    <div class="ch-main">
      <div class="cv-label">Il prossimo passo</div>
      <h2>Un sito che lavora per voi:<br><em>chiaro, veloce, riconoscibile.</em></h2>
      <p class="ch-lead">${VUOTO ? F('proposta_testo', { w: 600, h: 44, size: 11, ml: true, cls: 'f-dark' }) : esc(dati.proposta?.testo || `Ogni punto di questo report si può risolvere. Abbiamo già immaginato come potrebbe essere il nuovo sito di ${C.nome}: vi mostriamo l’anteprima in un incontro di venti minuti, senza impegno.`)}</p>
    </div>
    ${anteprima ? `<div class="ch-prev"><div class="browser dark-b"><div class="b-bar"><i></i><i></i><i></i><span>Anteprima del nuovo sito</span></div><div class="b-in"><img src="${esc(dati.proposta.anteprima)}" alt=""></div></div></div>` : ''}
    <div class="servizi">${servizi.map((s) => `<div><span>${s.k}</span><b>${s.t}</b><p>${s.d}</p></div>`).join('')}</div>
    <div class="ch-cta">
      <div class="ch-ref">
        <span class="cv-label">Il vostro riferimento</span>
        <b>${segnaposto(studio.referente, 'Nome e cognome')}</b>
        <span>${segnaposto(studio.ruolo, 'Ruolo')} · ${esc(studio.nome)}</span>
      </div>
      <div class="ch-con">${contatti.map(([k, v]) => `<div><span>${k}</span><b>${segnaposto(v, k.toLowerCase())}</b></div>`).join('')}</div>
    </div>
    <div class="metodo">
      <b>Metodologia</b> Velocità misurata con Google Lighthouse (lo stesso motore di PageSpeed Insights) con profilo smartphone su rete 4G simulata e profilo computer; controlli su contenuti, sicurezza, conformità e integrazioni eseguiti sulla home page${VUOTO ? '' : ` il ${dataLunga(dati.report?.data)}`}; scheda Google Business, recensioni e posizionamento verificati con ricerche non personalizzate. I valori possono variare leggermente tra una misura e l’altra.
      <b>Fonti</b> Google, <i>The Need for Mobile Speed</i>, 2016; Google/SOASTA Research, 2017; Google, 2016; Backlinko, 2023; BrightLocal, 2022 e 2023.
      <span class="legal">${[studio.ragioneSociale || studio.nome, studio.piva && `P.IVA ${studio.piva}`, studio.sede].filter(Boolean).map(esc).join(' · ')}</span>
    </div>
  </section>`;
}

// ── Stile ───────────────────────────────────────────────────────────────────
const CSS = fs.readFileSync(path.join(ROOT, 'template', 'report.css'), 'utf8')
  .replaceAll('{{sans}}', asset('fonts/instrument-sans-latin.woff2'))
  .replaceAll('{{serif}}', asset('fonts/instrument-serif-latin-400-italic.woff2'))
  .replaceAll('{{mark}}', asset('gm-mark.png'));

const html = `<!doctype html><html lang="it"><head><meta charset="utf-8">
<title>Check-up digitale${VUOTO ? '' : ` – ${esc(C.nome)}`}</title><style>${CSS}</style></head>
<body class="${VUOTO ? 'vuoto' : ''}">${[copertina(), sintesi(), velocita(), smartphone(), google(), business(), sicurezza(), piano(), chiusura()].join('\n')}</body></html>`;
const htmlPath = path.join(DIR, 'report.html');
fs.writeFileSync(htmlPath, html);

// ── Stampa ──────────────────────────────────────────────────────────────────
const nomeFile = VUOTO ? 'Check-up digitale – modello compilabile.pdf' : `Check-up digitale – ${C.nome.replace(/[/\\:]/g, '-')}.pdf`;
const pdfPath = path.join(DIR, nomeFile);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);

  const troppo = await page.evaluate(() => [...document.querySelectorAll('.page')].map((p, i) => {
    const b = p.querySelector('.body'); if (!b) return null;
    const fine = Math.max(...[...b.children].map((c) => c.getBoundingClientRect().bottom)) - p.getBoundingClientRect().top;
    const limite = (p.querySelector('.pf')?.getBoundingClientRect().top ?? 1123) - p.getBoundingClientRect().top;
    return fine > limite ? `pagina ${i + 1}: il contenuto supera il piè di pagina di ${Math.round(fine - limite)} px` : null;
  }).filter(Boolean));
  troppo.forEach((t) => console.warn(`! ${t}`));

  if (PNG) {
    const n = await page.$$eval('.page', (p) => p.length);
    for (let i = 0; i < n; i++) {
      await page.screenshot({ path: path.join(DIR, `anteprima-${i + 1}.png`), clip: { x: 0, y: i * 1123, width: 794, height: 1123 } });
    }
  }

  const campi = VUOTO ? await page.evaluate(() => {
    const out = [];
    const pagine = [...document.querySelectorAll('.page')];
    const rel = (el) => {
      const pg = el.closest('.page'); const r = el.getBoundingClientRect(); const pr = pg.getBoundingClientRect();
      return { p: pagine.indexOf(pg), x: r.left - pr.left, y: r.top - pr.top, w: r.width, h: r.height };
    };
    document.querySelectorAll('[data-f]').forEach((el) => out.push({ tipo: 'testo', nome: el.dataset.f, size: +el.dataset.size, ml: el.dataset.ml === '1', align: el.dataset.align, scuro: el.classList.contains('f-dark'), ...rel(el) }));
    document.querySelectorAll('[data-r]').forEach((g) => out.push({ tipo: 'scelta', nome: g.dataset.r, opzioni: [...g.querySelectorAll('[data-opt]')].map((o) => ({ v: o.dataset.opt, ...rel(o) })) }));
    return out;
  }) : [];

  await page.pdf({ path: pdfPath, width: '210mm', height: '297mm', printBackground: true, preferCSSPageSize: true });

  // Titolo, autore e (nel modello) i campi compilabili.
  const doc = await PDFDocument.load(fs.readFileSync(pdfPath));
  doc.setTitle(VUOTO ? 'Check-up digitale – modello' : `Check-up digitale – ${C.nome}`);
  doc.setAuthor(studio.nome);
  doc.setSubject('Stato di salute del sito web');
  doc.setCreator(`${studio.nome} · ${studio.sito}`);
  if (VUOTO) {
    const form = doc.getForm();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pagine = doc.getPages();
    const k = 0.75; // px → pt
    const H = 1123;
    const nomi = new Set();
    for (const c of campi) {
      if (c.tipo === 'testo') {
        let nome = c.nome; let j = 2;
        while (nomi.has(nome)) nome = `${c.nome}_${j++}`;
        nomi.add(nome);
        const f = form.createTextField(nome);
        if (c.ml) f.enableMultiline();
        f.addToPage(pagine[c.p], {
          x: c.x * k, y: (H - c.y - c.h) * k, width: c.w * k, height: c.h * k,
          textColor: c.scuro ? rgb(0.95, 0.94, 0.92) : rgb(0.07, 0.07, 0.08), backgroundColor: undefined, borderColor: undefined, borderWidth: 0, font,
        });
        f.setFontSize(Math.round(c.size * k * 10) / 10);
        if (c.align === 'center') f.setAlignment(1);
        if (c.align === 'right') f.setAlignment(2);
      } else {
        const g = form.createRadioGroup(c.nome);
        for (const o of c.opzioni) {
          const col = { ok: rgb(0.16, 0.48, 0.32), warn: rgb(0.72, 0.47, 0.12), bad: rgb(0.7, 0.23, 0.18), alto: rgb(0.7, 0.23, 0.18), medio: rgb(0.72, 0.47, 0.12), basso: rgb(0.16, 0.48, 0.32) }[o.v];
          g.addOptionToPage(o.v, pagine[o.p], { x: o.x * k, y: (H - o.y - o.h) * k, width: o.w * k, height: o.h * k, borderColor: col, borderWidth: 1, backgroundColor: rgb(1, 1, 1), textColor: col });
        }
      }
    }
    form.updateFieldAppearances(font);
    console.log(`· ${campi.length} campi compilabili`);
  }
  fs.writeFileSync(pdfPath, await doc.save());
  console.log(`· PDF: ${path.relative(process.cwd(), pdfPath)}`);
  if (!VUOTO) console.log(`· indice di salute ${totale}/100 (${giu?.nome}) · ${Object.entries(aree).map(([k, v]) => `${k} ${v ?? 'n.d.'}`).join(' · ')}`);
} finally {
  await browser.close();
}
