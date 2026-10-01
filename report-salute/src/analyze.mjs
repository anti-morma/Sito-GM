// Analizza un sito e scrive clienti/<slug>/dati.json, più gli screenshot.
//
//   node src/analyze.mjs https://www.gioielleriarossi.it --nome "Gioielleria Rossi" --citta Bari
//
// Opzioni: --keyword "gioielleria bari" (default: "<settore> <città>"),
// --settore gioielleria, --slug rossi, --runs 2 (media di più misure).
// Con la variabile PSI_API_KEY la velocità arriva dall'API di PageSpeed Insights
// (con i dati reali degli utenti Chrome, se Google li ha); senza, da Lighthouse
// in locale: stesso motore, stesse soglie.
//
// Quello che una macchina non può vedere (scheda Google Business, posizione
// nelle ricerche, concorrenti) resta a null in dati.json, da completare.

import fs from 'node:fs';
import path from 'node:path';
import tls from 'node:tls';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import * as chromeLauncher from 'chrome-launcher';
import { CONTROLLI } from './checks.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const UA_MOBILE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';

// ── Argomenti ───────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const opt = (name, def = null) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : def;
};
let url = argv.find((a) => !a.startsWith('--') && !argv[argv.indexOf(a) - 1]?.startsWith('--'));
if (!url) {
  console.error('Uso: node src/analyze.mjs <url> --nome "Nome attività" --citta Città [--keyword "..."] [--settore gioielleria]');
  process.exit(1);
}
if (!/^https?:\/\//.test(url)) url = `https://${url}`;
const dominio = new URL(url).hostname.replace(/^www\./, '');
const nome = opt('nome', dominio);
const citta = opt('citta', '');
const settore = opt('settore', 'gioielleria');
const keyword = opt('keyword', [settore, citta].filter(Boolean).join(' ').toLowerCase());
const slug = opt('slug', dominio.split('.')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-'));
const runs = Math.max(1, Number(opt('runs', 1)));
const DIR = path.join(ROOT, 'clienti', slug);
fs.mkdirSync(DIR, { recursive: true });

const log = (...a) => console.log('·', ...a);
const round = (n, d = 1) => (n == null || Number.isNaN(n) ? null : Math.round(n * 10 ** d) / 10 ** d);
const median = (xs) => {
  const s = xs.filter((x) => x != null).sort((a, b) => a - b);
  return s.length ? s[Math.floor((s.length - 1) / 2)] : null;
};

// ── 1. Velocità: Lighthouse (locale) o PageSpeed Insights (API) ─────────────
const CATEGORIE = ['performance', 'accessibility', 'best-practices', 'seo'];

async function lighthouseLocale(strategia) {
  const chrome = await chromeLauncher.launch({ chromePath: CHROME, chromeFlags: ['--headless=new', '--no-first-run'] });
  try {
    const flags = { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: CATEGORIE, locale: 'it' };
    const r = await lighthouse(url, flags, strategia === 'desktop' ? desktopConfig : undefined);
    return { lhr: r.lhr, campo: null };
  } finally {
    await chrome.kill();
  }
}

async function pagespeedApi(strategia) {
  const q = new URLSearchParams({ url, strategy: strategia, locale: 'it', key: process.env.PSI_API_KEY });
  CATEGORIE.forEach((c) => q.append('category', c.toUpperCase().replace('-', '_')));
  const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${q}`);
  if (!res.ok) throw new Error(`PageSpeed API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  const m = j.loadingExperience?.metrics;
  const campo = m ? {
    lcp: round(m?.LARGEST_CONTENTFUL_PAINT_MS?.percentile / 1000),
    inp: m?.INTERACTION_TO_NEXT_PAINT?.percentile ?? null,
    cls: m?.CUMULATIVE_LAYOUT_SHIFT_SCORE ? m.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100 : null,
    giudizio: j.loadingExperience.overall_category ?? null,
  } : null;
  return { lhr: j.lighthouseResult, campo };
}

const NOMI_OPPORTUNITA = {
  'render-blocking-insight': 'File che bloccano la visualizzazione della pagina',
  'image-delivery-insight': 'Immagini troppo pesanti o nel formato sbagliato',
  'unused-javascript': 'Codice JavaScript caricato ma non usato',
  'unused-css-rules': 'Stili CSS caricati ma non usati',
  'lcp-discovery-insight': 'Immagine principale trovata in ritardo dal browser',
  'lcp-breakdown-insight': 'Contenuto principale lento a comparire',
  'document-latency-insight': 'Server lento a rispondere',
  'font-display-insight': 'Caratteri tipografici che ritardano i testi',
  'cache-insight': 'Il browser non conserva i file tra una visita e l’altra',
  'third-parties-insight': 'Servizi esterni che appesantiscono la pagina',
  'network-dependency-tree-insight': 'File caricati a catena, uno dopo l’altro',
  'legacy-javascript-insight': 'Codice JavaScript datato',
  'duplicated-javascript-insight': 'Codice JavaScript duplicato',
  'total-byte-weight': 'Pagina troppo pesante da scaricare',
  'mainthread-work-breakdown': 'Troppo lavoro per il processore del telefono',
  'bootup-time': 'Script lenti ad avviarsi',
  'dom-size-insight': 'Pagina con troppi elementi',
  'cls-culprits-insight': 'Elementi che si spostano durante il caricamento',
  'unminified-css': 'CSS non compresso',
  'unminified-javascript': 'JavaScript non compresso',
  'modern-http-insight': 'Protocollo del server datato',
  'viewport-insight': 'Pagina non ottimizzata per il tocco',
  'forced-reflow-insight': 'Ricalcoli di layout forzati',
  'uses-long-cache-ttl': 'Il browser non conserva i file tra una visita e l’altra',
  'offscreen-images': 'Immagini fuori schermo caricate subito',
  'uses-optimized-images': 'Immagini non compresse',
  'modern-image-formats': 'Immagini in formati datati',
  'uses-responsive-images': 'Immagini più grandi dello schermo',
  'server-response-time': 'Server lento a rispondere',
  'uses-text-compression': 'Testi non compressi dal server',
};

function leggiVelocita(lhr) {
  const a = lhr.audits;
  const v = (id) => a[id]?.numericValue ?? null;
  const tipi = Object.fromEntries((a['resource-summary']?.details?.items || []).map((i) => [i.resourceType, i]));
  const kb = (t) => Math.round((tipi[t]?.transferSize || 0) / 1024);
  const opportunita = lhr.categories.performance.auditRefs
    .map((r) => ({ id: r.id, au: a[r.id] }))
    .filter(({ au }) => au && au.score !== null && au.score < 0.9)
    .map(({ id, au }) => ({
      id,
      titolo: NOMI_OPPORTUNITA[id] || au.title,
      risparmioS: round(Math.max(au.metricSavings?.LCP || 0, au.metricSavings?.FCP || 0, au.details?.overallSavingsMs || 0) / 1000),
      risparmioKB: au.details?.overallSavingsBytes ? Math.round(au.details.overallSavingsBytes / 1024) : null,
    }))
    .filter((o) => o.risparmioS > 0 || o.risparmioKB > 20 || ['total-byte-weight', 'mainthread-work-breakdown', 'bootup-time'].includes(o.id))
    .sort((x, y) => (y.risparmioS || 0) - (x.risparmioS || 0) || (y.risparmioKB || 0) - (x.risparmioKB || 0));
  const seen = new Set();
  return {
    punteggio: Math.round((lhr.categories.performance.score ?? 0) * 100),
    fcp: round(v('first-contentful-paint') / 1000),
    lcp: round(v('largest-contentful-paint') / 1000),
    si: round(v('speed-index') / 1000),
    tbt: Math.round(v('total-blocking-time') ?? 0),
    cls: round(v('cumulative-layout-shift'), 3),
    tti: round(v('interactive') / 1000),
    ttfb: Math.round(v('server-response-time') ?? a['document-latency-insight']?.details?.debugData?.serverResponseTime ?? 0) || null,
    accessibilita: Math.round((lhr.categories.accessibility?.score ?? 0) * 100),
    buonePratiche: Math.round((lhr.categories['best-practices']?.score ?? 0) * 100),
    seo: Math.round((lhr.categories.seo?.score ?? 0) * 100),
    peso: {
      totaleKB: Math.round((a['total-byte-weight']?.numericValue || 0) / 1024),
      richieste: tipi.total?.requestCount ?? null,
      immagini: kb('image'), script: kb('script'), css: kb('stylesheet'), font: kb('font'),
      altro: kb('document') + kb('media') + kb('other'),
    },
    opportunita: opportunita.filter((o) => !seen.has(o.titolo) && seen.add(o.titolo)).slice(0, 6),
    lhAudit: {
      isCrawlable: a['is-crawlable']?.score,
      imageAlt: a['image-alt']?.score,
      consoleErrors: a['errors-in-console']?.details?.items?.length ?? 0,
      viewport: a['viewport']?.score,
      responsiveImages: Math.min(a['image-delivery-insight']?.score ?? 1, a['uses-responsive-images']?.score ?? 1, a['modern-image-formats']?.score ?? 1),
      thirdParty: (a['third-parties-insight']?.details?.items || []).map((i) => i.entity?.text || i.entity).filter(Boolean).slice(0, 8),
    },
  };
}

async function misura(strategia) {
  const risultati = [];
  for (let i = 0; i < runs; i++) {
    log(`velocità ${strategia}${runs > 1 ? ` (${i + 1}/${runs})` : ''}…`);
    const r = process.env.PSI_API_KEY ? await pagespeedApi(strategia) : await lighthouseLocale(strategia);
    if (i === 0) fs.writeFileSync(path.join(DIR, `lighthouse-${strategia}.json`), JSON.stringify(r.lhr));
    risultati.push({ ...leggiVelocita(r.lhr), campo: r.campo, screenshotFinale: r.lhr.audits['final-screenshot']?.details?.data });
  }
  // Più misure: si tiene quella col punteggio mediano, per non scegliere a caso.
  const m = median(risultati.map((r) => r.punteggio));
  return risultati.find((r) => r.punteggio === m);
}

// ── 2. Pagina reale: contenuti, contatti, integrazioni, screenshot ─────────
async function ispeziona() {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-first-run', '--hide-scrollbars'] });
  try {
    const page = await browser.newPage();
    const risorseHttp = new Set();
    page.on('request', (r) => { if (r.url().startsWith('http://')) risorseHttp.add(r.url()); });
    await page.setUserAgent(UA_MOBILE);
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const t0 = Date.now();
    const res = await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => null);
    const tempoCaricamento = Date.now() - t0;
    await new Promise((r) => setTimeout(r, 2500));
    const headers = res?.headers() || {};
    const finale = page.url();

    // Quanto della prima schermata è coperto da pop-up e banner (elementi fissi).
    const copertura = await page.evaluate(() => {
      const W = innerWidth; const H = innerHeight; const passo = 13; let coperti = 0; let tot = 0;
      for (let y = passo / 2; y < H; y += passo) for (let x = passo / 2; x < W; x += passo) {
        tot++;
        let el = document.elementFromPoint(x, y);
        while (el && el !== document.body) {
          const pos = getComputedStyle(el).position;
          if (pos === 'fixed' || pos === 'sticky') { const r = el.getBoundingClientRect(); if (r.height < H * 0.9 || r.top > 0 || /cookie|consent|iubenda|gdpr|popup|modal|newsletter/i.test(el.id + ' ' + el.className)) { coperti++; } break; }
          el = el.parentElement;
        }
      }
      return tot ? coperti / tot : 0;
    });
    const dom = await page.evaluate(() => {
      const $$ = (s) => [...document.querySelectorAll(s)];
      const meta = (n) => document.querySelector(`meta[name="${n}"], meta[property="${n}"]`)?.content?.trim() || null;
      const html = document.documentElement.outerHTML;
      const testo = document.body?.innerText || '';
      const links = $$('a[href]').map((a) => a.getAttribute('href') || '');
      const visibile = (el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05;
      };
      // Testi piccoli: quota di caratteri visibili sotto i 12px.
      let tot = 0; let piccoli = 0;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const n = walker.currentNode; const t = n.textContent.trim();
        if (!t || !n.parentElement || !visibile(n.parentElement)) continue;
        tot += t.length;
        if (parseFloat(getComputedStyle(n.parentElement).fontSize) < 12) piccoli += t.length;
      }
      // Bersagli di tocco sotto i 24px (WCAG 2.2, 2.5.8).
      const cliccabili = $$('a[href], button, [role=button], input:not([type=hidden]), select').filter(visibile);
      const piccoliTap = cliccabili.filter((el) => { const r = el.getBoundingClientRect(); return r.height < 24 || r.width < 24; }).length;
      // Invito all'azione nella prima schermata.
      const ctaRe = /(contatt|prenot|chiam|appuntament|scrivi|whatsapp|scopri|acquista|shop|visita|richied|vieni|collezion|preventiv)/i;
      const cta = cliccabili.some((el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 && ctaRe.test(el.innerText || el.value || el.getAttribute('aria-label') || ''); });
      const jsonld = $$('script[type="application/ld+json"]').flatMap((s) => {
        try { const j = JSON.parse(s.textContent); const items = [j, ...(j['@graph'] || [])].flat(); return items.map((i) => i && i['@type']).flat().filter(Boolean); } catch { return []; }
      });
      const immagini = $$('img').filter((i) => i.getBoundingClientRect().width > 40);
      const anni = [...testo.matchAll(/(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?(\d{4})/gi)].map((m) => Number(m[1]));
      return {
        titolo: document.title?.trim() || null,
        descrizione: meta('description'),
        lang: document.documentElement.lang || null,
        viewport: meta('viewport'),
        canonical: document.querySelector('link[rel=canonical]')?.href || null,
        robotsMeta: meta('robots'),
        ogTitle: meta('og:title'), ogImage: meta('og:image'),
        generator: meta('generator'),
        h1: $$('h1').map((h) => h.innerText.trim()).filter(Boolean),
        immagini: immagini.length, senzaAlt: immagini.filter((i) => !(i.getAttribute('alt') || '').trim()).length,
        tel: links.filter((h) => h.startsWith('tel:')).length,
        mail: links.filter((h) => h.startsWith('mailto:')).length,
        whatsapp: links.some((h) => /wa\.me|api\.whatsapp|whatsapp\.com\/send/.test(h)) || /wa\.me\/|api\.whatsapp\.com|joinchat|click-to-chat|ht-ctc|whatsapp-button|wa-chat|whatsapp/i.test(html),
        social: ['instagram', 'facebook', 'tiktok', 'pinterest', 'youtube', 'linkedin'].filter((s) => links.some((h) => h.includes(`${s}.com`))),
        mappa: /google\.[a-z.]+\/maps|maps\.google|goo\.gl\/maps|maps\.app\.goo\.gl|openstreetmap|api\.mapbox/.test(html),
        form: $$('form').some((f) => f.querySelector('textarea, input[type=email], input[type=tel]')) || /wpcf7|wpforms|gform|formspree|elementor-form/.test(html),
        orari: /(lun|mar|mer|gio|ven|sab|dom)[a-z]*\.?\s*[-–:]?.{0,30}\d{1,2}[:.]\d{2}/i.test(testo) || /orari/i.test(testo) && /\d{1,2}[:.]\d{2}/.test(testo),
        indirizzo: /\b(via|viale|piazza|corso|largo|vicolo|p\.?zza)\s+[A-ZÀ-Úa-zà-ú'. ]{2,40},?\s*\d{0,4}/i.test(testo),
        piva: /(p\.?\s?iva|partita\s+iva|vat|c\.?f\.?\s*e\s*p\.?\s?iva)[\s:.n°]*?(it)?\s?\d{11}/i.test(testo) || /\b(IT)?\d{11}\b/.test(testo) && /iva/i.test(testo),
        privacy: links.some((h) => /privacy|informativa/i.test(h)) || $$('a').some((a) => /privacy|informativa/i.test(a.innerText)),
        cookieBanner: /iubenda|cookiebot|cookieyes|complianz|onetrust|cookie-law-info|cookie-notice|cmplz|borlabs|termly|usercentrics|klaro|didomi|tarteaucitron|cookiescript|axeptio|gdpr-cookie|moove_gdpr|real-cookie-banner|cookie-consent|cc-window|cookiefirst/i.test(html),
        analytics: /gtag\(|googletagmanager\.com\/gtag|google-analytics\.com|G-[A-Z0-9]{6,}|UA-\d+-\d+/.test(html),
        gtm: /googletagmanager\.com\/gtm\.js|GTM-[A-Z0-9]+/.test(html),
        pixel: /connect\.facebook\.net|fbq\(/.test(html),
        googleAds: /AW-\d{6,}|googleadservices/.test(html),
        recensioni: /recensioni|reviews|trustindex|elfsight|stelle|★/i.test(testo) || /trustindex|elfsight|reviews-widget|google-reviews/i.test(html),
        catalogo: /woocommerce|shopify|add[-_]to[-_]cart|aggiungi al carrello|carrello|prestashop|magento|\/shop|\/prodotti|\/collezion|\/catalog/i.test(html),
        newsletter: /mailchimp|newsletter|sendinblue|brevo|klaviyo|mailerlite/i.test(html),
        cta, piccoliTap, tapTot: cliccabili.length,
        testoPiccolo: tot ? piccoli / tot : 0,
        overflow: document.documentElement.scrollWidth > innerWidth + 4,
        jsonld,
        anni,
        tech: {
          wordpress: /wp-content|wp-includes/.test(html), woocommerce: /woocommerce/.test(html), elementor: /elementor/.test(html),
          divi: /et_pb_|themes\/Divi/.test(html), shopify: /cdn\.shopify|Shopify\.theme/.test(html), wix: /wix\.com|_wixCIDX|wixstatic/.test(html),
          squarespace: /squarespace/.test(html), jimdo: /jimdo/.test(html), webflow: /webflow/.test(html), joomla: /\/media\/jui\/|joomla/i.test(html),
          prestashop: /prestashop/i.test(html), magento: /Mage\.Cookies|static\/version\d+\/frontend|mage-init/.test(html), nextjs: /__NEXT_DATA__|\/_next\//.test(html),
          jquery: /jquery/i.test(html), bootstrap: /bootstrap/i.test(html), wpbakery: /vc_row|js_composer/.test(html),
            },
      };
    });

    log('screenshot…');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(DIR, 'screen-mobile.jpg'), type: 'jpeg', quality: 82 });
    await page.setUserAgent((await browser.userAgent()).replace('HeadlessChrome', 'Chrome'));
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.goto(finale, { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(DIR, 'screen-desktop.jpg'), type: 'jpeg', quality: 82 });
    dom.copertura = copertura;
    return { dom, headers, finale, tempoCaricamento, status: res?.status() ?? null, risorseHttp: [...risorseHttp].filter((u) => !u.startsWith(`http://${new URL(finale).host}`) || finale.startsWith('http://')).length };
  } finally {
    await browser.close();
  }
}

// ── 3. Rete: redirect, robots, sitemap, certificato ─────────────────────────
async function rete() {
  const host = new URL(url).hostname;
  const out = { redirectHttps: null, robots: null, sitemap: null, sitemapUrl: 0, ssl: null };
  try {
    const r = await fetch(`http://${host}/`, { redirect: 'follow', signal: AbortSignal.timeout(15000) });
    out.redirectHttps = r.url.startsWith('https://');
  } catch { out.redirectHttps = null; }
  const base = `https://${host}`;
  try {
    const r = await fetch(`${base}/robots.txt`, { signal: AbortSignal.timeout(10000) });
    const t = r.ok ? await r.text() : '';
    out.robots = r.ok && /user-agent/i.test(t);
    out.robotsBlocca = /^disallow:\s*\/\s*$/im.test(t);
    const sm = t.match(/^sitemap:\s*(\S+)/im)?.[1];
    for (const u of [sm, `${base}/sitemap.xml`, `${base}/sitemap_index.xml`, `${base}/wp-sitemap.xml`].filter(Boolean)) {
      const s = await fetch(u, { signal: AbortSignal.timeout(10000) }).catch(() => null);
      if (s?.ok) {
        const x = await s.text();
        if (/<(urlset|sitemapindex)/.test(x)) { out.sitemap = u; out.sitemapUrl = (x.match(/<loc>/g) || []).length; break; }
      }
    }
  } catch { /* nessun robots */ }
  out.ssl = await new Promise((resolve) => {
    const s = tls.connect({ host, port: 443, servername: host, timeout: 10000 }, () => {
      const c = s.getPeerCertificate();
      resolve({ valido: s.authorized, scadenza: c.valid_to, giorni: Math.round((new Date(c.valid_to) - Date.now()) / 86400000), emittente: c.issuer?.O || c.issuer?.CN || null });
      s.end();
    });
    s.on('error', () => resolve(null));
    s.on('timeout', () => { s.destroy(); resolve(null); });
  });
  return out;
}

// ── 4. Dai dati ai controlli ────────────────────────────────────────────────
function valuta({ mob, desk, p, net }) {
  const d = p.dom;
  const c = {};
  const set = (id, stato, valore = null, nota = null) => { c[id] = { stato, valore, nota }; };
  const lower = (s) => (s || '').toLowerCase();
  const cittaL = lower(citta);
  const anno = new Date().getFullYear();

  // Esperienza da smartphone
  set('m_viewport', /width=device-width/.test(d.viewport || '') ? 'ok' : 'bad', d.viewport ? 'Presente' : 'Assente');
  const cop = Math.round((d.copertura || 0) * 100);
  set('m_popup', cop <= 25 ? 'ok' : cop <= 50 ? 'warn' : 'bad', cop <= 5 ? 'Libera' : `${cop}% dello schermo coperto`,
    cop > 25 && d.cookieBanner ? 'Soprattutto dal banner dei cookie' : null);
  set('m_overflow', d.overflow ? 'bad' : 'ok', d.overflow ? 'La pagina sfora lo schermo' : 'Nessuno');
  const pic = Math.round(d.testoPiccolo * 100);
  set('m_font', pic <= 10 ? 'ok' : pic <= 30 ? 'warn' : 'bad', `${pic}% del testo sotto 12px`);
  const tapPct = d.tapTot ? Math.round((d.piccoliTap / d.tapTot) * 100) : 0;
  set('m_tap', tapPct <= 10 ? 'ok' : tapPct <= 30 ? 'warn' : 'bad', `${d.piccoliTap} su ${d.tapTot} troppo piccoli`);
  set('m_call', d.tel ? 'ok' : 'bad', d.tel ? 'Presente' : 'Numero non cliccabile');
  set('m_whatsapp', d.whatsapp ? 'ok' : 'warn', d.whatsapp ? 'Presente' : 'Assente');
  const img = mob.lhAudit.responsiveImages;
  set('m_immagini', img >= 0.9 ? 'ok' : img >= 0.5 ? 'warn' : 'bad', `${mob.peso.immagini.toLocaleString('it-IT')} KB di immagini`);
  set('m_a11y', mob.accessibilita >= 90 ? 'ok' : mob.accessibilita >= 70 ? 'warn' : 'bad', `${mob.accessibilita}/100`);

  // Visibilità su Google
  const tl = (d.titolo || '').length;
  const titoloLocale = cittaL && lower(d.titolo).includes(cittaL);
  set('s_titolo', !d.titolo ? 'bad' : tl >= 25 && tl <= 65 && titoloLocale ? 'ok' : 'warn',
    d.titolo ? `${tl} caratteri${cittaL ? (titoloLocale ? ', con la città' : ', senza la città') : ''}` : 'Assente');
  const dl = (d.descrizione || '').length;
  set('s_descrizione', !d.descrizione ? 'bad' : dl >= 70 && dl <= 165 ? 'ok' : 'warn', d.descrizione ? `${dl} caratteri` : 'Assente');
  set('s_h1', d.h1.length === 1 ? 'ok' : d.h1.length === 0 ? 'bad' : 'warn', d.h1.length === 1 ? '1 titolo' : `${d.h1.length} titoli H1`);
  const altPct = d.immagini ? Math.round(((d.immagini - d.senzaAlt) / d.immagini) * 100) : 100;
  set('s_alt', altPct >= 90 ? 'ok' : altPct >= 50 ? 'warn' : 'bad', `${d.immagini - d.senzaAlt} su ${d.immagini} descritte`);
  const noindex = /noindex/i.test(d.robotsMeta || '') || net.robotsBlocca || mob.lhAudit.isCrawlable === 0;
  set('s_indicizzabile', noindex ? 'bad' : 'ok', noindex ? 'Bloccata' : 'Sì');
  set('s_sitemap', net.sitemap ? 'ok' : 'warn', net.sitemap ? `${net.sitemapUrl} indirizzi` : 'Assente');
  set('s_robots', net.robots ? 'ok' : 'warn', net.robots ? 'Presente' : 'Assente');
  set('s_canonical', d.canonical ? 'ok' : 'warn', d.canonical ? 'Presente' : 'Assente');
  const tipiLocali = d.jsonld.filter((t) => /LocalBusiness|Store|JewelryStore|Organization|Restaurant|Hotel|Place/i.test(t));
  set('s_schema', tipiLocali.some((t) => /LocalBusiness|Store/i.test(t)) ? 'ok' : tipiLocali.length ? 'warn' : 'bad',
    tipiLocali.length ? [...new Set(tipiLocali)].slice(0, 2).join(', ') : 'Assenti');
  set('s_social', d.ogTitle && d.ogImage ? 'ok' : d.ogTitle || d.ogImage ? 'warn' : 'bad', d.ogImage ? 'Con immagine' : d.ogTitle ? 'Senza immagine' : 'Assente');
  const cittaNelSito = cittaL && (lower(d.titolo).includes(cittaL) || lower(d.descrizione).includes(cittaL));
  set('s_locale', d.indirizzo && cittaNelSito ? 'ok' : d.indirizzo || cittaNelSito ? 'warn' : 'bad',
    d.indirizzo ? (cittaNelSito ? 'Indirizzo e città' : 'Indirizzo, città non nei titoli') : 'Indirizzo non trovato');
  set('s_posizione', 'na'); set('s_mappe', 'na');

  // Google Business: tutto da verificare a mano (vedi dati.json → gbp).
  for (const x of CONTROLLI.filter((x) => x.area === 'gbp')) set(x.id, 'na');

  // Sicurezza e conformità
  const https = p.finale.startsWith('https://');
  set('c_https', https ? 'ok' : 'bad', https ? 'Attiva' : 'Assente');
  set('c_redirect', net.redirectHttps ? 'ok' : https ? 'warn' : 'bad', net.redirectHttps ? 'Sì' : 'No');
  const g = net.ssl?.giorni;
  set('c_ssl', !net.ssl ? 'bad' : !net.ssl.valido ? 'bad' : g < 14 ? 'warn' : 'ok', net.ssl ? `Scade tra ${g} giorni` : 'Non valido');
  const h = p.headers;
  const sec = ['strict-transport-security', 'content-security-policy', 'x-frame-options', 'x-content-type-options', 'referrer-policy'].filter((k) => h[k]).length;
  set('c_header', sec >= 4 ? 'ok' : sec >= 2 ? 'warn' : 'bad', `${sec} ${sec === 1 ? "protezione" : "protezioni"} su 5`);
  set('c_misto', p.risorseHttp ? 'bad' : 'ok', p.risorseHttp ? `${p.risorseHttp} risorse non protette` : 'Nessuno');
  set('c_privacy', d.privacy ? 'ok' : 'bad', d.privacy ? 'Presente' : 'Non trovata');
  const traccia = d.analytics || d.gtm || d.pixel || d.googleAds || mob.lhAudit.thirdParty.some((t) => /facebook|google analytics|hotjar|clarity|tiktok/i.test(t));
  set('c_cookie', d.cookieBanner ? 'ok' : traccia ? 'bad' : 'warn', d.cookieBanner ? 'Banner presente' : traccia ? 'Tracciamento senza consenso' : 'Banner non rilevato');
  set('c_piva', d.piva ? 'ok' : 'bad', d.piva ? 'Presente' : 'Non trovata in home');
  const bp = mob.buonePratiche;
  set('c_tecnica', bp >= 90 && !mob.lhAudit.consoleErrors ? 'ok' : bp >= 70 ? 'warn' : 'bad',
    `${bp}/100${mob.lhAudit.consoleErrors ? `, ${mob.lhAudit.consoleErrors} errori` : ''}`);

  // Contatti e integrazioni
  set('v_cta', d.cta ? 'ok' : 'bad', d.cta ? 'Presente' : 'Assente');
  set('v_form', d.form ? 'ok' : 'warn', d.form ? 'Presente' : 'Non in home');
  set('v_mappa', d.mappa ? 'ok' : 'warn', d.mappa ? 'Presente' : 'Assente');
  set('v_orari', d.orari ? 'ok' : 'warn', d.orari ? 'Presenti' : 'Non trovati');
  set('v_social', d.social.length >= 2 ? 'ok' : d.social.length ? 'warn' : 'bad', d.social.length ? d.social.map((s) => s[0].toUpperCase() + s.slice(1)).join(', ') : 'Nessuno');
  set('v_recensioni', d.recensioni ? 'ok' : 'warn', d.recensioni ? 'Presenti' : 'Assenti');
  set('v_catalogo', d.catalogo ? 'ok' : 'warn', d.catalogo ? 'Presente' : 'Assente');
  set('v_statistiche', d.analytics || d.gtm ? 'ok' : 'bad', d.analytics || d.gtm ? (d.gtm ? 'Tag Manager' : 'Google Analytics') : 'Assenti');
  set('v_campagne', d.pixel || d.googleAds ? 'ok' : 'warn', [d.pixel && 'Meta Pixel', d.googleAds && 'Google Ads'].filter(Boolean).join(', ') || 'Nessuno');
  const ultimo = d.anni.length ? Math.max(...d.anni) : null;
  set('v_aggiornato', ultimo == null ? 'na' : ultimo >= anno - 1 ? 'ok' : ultimo >= anno - 3 ? 'warn' : 'bad', ultimo ? `© ${ultimo}` : null);
  return c;
}

function tecnologie(d, desk) {
  const t = d.tech;
  const nomi = [
    t.wordpress && 'WordPress', t.woocommerce && 'WooCommerce', t.elementor && 'Elementor', t.divi && 'Divi', t.wpbakery && 'WPBakery',
    t.shopify && 'Shopify', t.wix && 'Wix', t.squarespace && 'Squarespace', t.jimdo && 'Jimdo', t.webflow && 'Webflow',
    t.joomla && 'Joomla', t.prestashop && 'PrestaShop', t.magento && 'Magento', t.nextjs && 'Next.js', t.jquery && 'jQuery', t.bootstrap && 'Bootstrap',
    (d.analytics || d.gtm) && (d.gtm ? 'Google Tag Manager' : 'Google Analytics'), d.pixel && 'Meta Pixel',
  ].filter(Boolean);
  const gen = d.generator?.match(/wordpress\s*([\d.]+)/i);
  if (gen) nomi[nomi.indexOf('WordPress')] = `WordPress ${gen[1]}`;
  return [...new Set([...nomi, ...desk.lhAudit.thirdParty.filter((x) => !/google|facebook|meta/i.test(x)).slice(0, 4)])];
}

// ── Via ─────────────────────────────────────────────────────────────────────
log(`analisi di ${url} → clienti/${slug}/`);
const mob = await misura('mobile');
const desk = await misura('desktop');
log('pagina, contatti e integrazioni…');
const p = await ispeziona();
log('rete, sitemap e certificato…');
const net = await rete();
const controlli = valuta({ mob, desk, p, net });

const oggi = new Date();
const file = path.join(DIR, 'dati.json');
const precedente = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
const strip = ({ screenshotFinale, lhAudit, ...r }) => r;

const dati = {
  cliente: { nome, citta, settore, url: p.finale || url, dominio, keyword, referente: precedente?.cliente?.referente || '' },
  report: {
    codice: precedente?.report?.codice || `GM-${oggi.getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`,
    data: oggi.toISOString().slice(0, 10),
    fonteVelocita: process.env.PSI_API_KEY ? 'PageSpeed Insights (Google)' : 'Google Lighthouse 13',
  },
  velocita: { mobile: strip(mob), desktop: strip(desk) },
  serp: { titolo: p.dom.titolo, descrizione: p.dom.descrizione, url: p.finale },
  tecnologie: tecnologie(p.dom, desk),
  controlli,
  // ── Da completare a mano (o da Claude con una ricerca su Google/Maps) ──
  gbp: precedente?.gbp || {
    trovata: null, nome: null, valutazione: null, recensioni: null, risposte: null, ultimaRecensione: null,
    foto: null, categoria: null, link: null, nota: null,
  },
  posizionamento: precedente?.posizionamento || { keyword, mappe: null, organico: null, primi: [] },
  concorrenti: precedente?.concorrenti || [],
  sintesi: precedente?.sintesi || { titolo: null, testo: null },
  priorita: precedente?.priorita || null,
  proposta: precedente?.proposta || { anteprima: null, testo: null },
  _grezzo: { dom: p.dom, headers: p.headers, rete: net, tempoCaricamentoMs: p.tempoCaricamento },
};
// I controlli compilati a mano (gbp, posizione) sopravvivono a una nuova analisi.
if (precedente?.controlli) {
  for (const [id, v] of Object.entries(precedente.controlli)) {
    if ((id.startsWith('g_') || id === 's_posizione' || id === 's_mappe') && v.stato !== 'na') dati.controlli[id] = v;
  }
}
fs.writeFileSync(file, JSON.stringify(dati, null, 2));
log(`fatto: velocità mobile ${mob.punteggio}/100 (LCP ${mob.lcp} s), desktop ${desk.punteggio}/100`);
log(`dati in ${path.relative(process.cwd(), file)} — ora completa gbp, posizionamento e concorrenti, poi: node src/render.mjs ${slug}`);
