// Punteggi, giudizi, priorità e titolo della sintesi, calcolati da dati.json
// al momento del PDF: basta correggere un controllo a mano e tutto si aggiorna.

import { AREE, CONTROLLI, STATI } from './checks.mjs';

export const GIUDIZI = [
  { min: 90, nome: 'Eccellente', tono: 'ok' },
  { min: 70, nome: 'Buono', tono: 'ok' },
  { min: 50, nome: 'Da migliorare', tono: 'warn' },
  { min: 0, nome: 'Critico', tono: 'bad' },
];
export const giudizio = (n) => (n == null ? null : GIUDIZI.find((g) => n >= g.min));

// Le soglie di Google per il punteggio PageSpeed: 0–49, 50–89, 90–100.
export const tonoPageSpeed = (n) => (n == null ? null : n >= 90 ? 'ok' : n >= 50 ? 'warn' : 'bad');

export function punteggiAree(dati) {
  const out = {};
  for (const area of AREE) {
    const override = dati.punteggi?.[area.id];
    if (override != null) { out[area.id] = override; continue; }
    if (area.id === 'velocita') {
      // PageSpeed da mobile e da computer, più il tempo reale in cui compare il
      // contenuto principale (LCP): 100 fino a 2,5 s, 50 a 4 s, 0 da 10 s.
      const m = dati.velocita?.mobile?.punteggio; const d = dati.velocita?.desktop?.punteggio;
      const lcp = dati.velocita?.mobile?.lcp;
      const t = lcp == null ? m : lcp <= 2.5 ? 100 : lcp <= 4 ? 100 - ((lcp - 2.5) / 1.5) * 50 : Math.max(0, 50 - ((lcp - 4) / 6) * 50);
      out[area.id] = m == null ? null : Math.round(m * 0.5 + (d ?? m) * 0.2 + t * 0.3);
      continue;
    }
    let somma = 0; let pesi = 0;
    for (const c of CONTROLLI.filter((c) => c.area === area.id)) {
      const v = STATI[dati.controlli?.[c.id]?.stato]?.valore;
      if (v == null) continue;
      somma += v * c.peso; pesi += c.peso;
    }
    out[area.id] = pesi ? Math.round((somma / pesi) * 100) : null;
  }
  return out;
}

export function punteggioTotale(aree) {
  let somma = 0; let pesi = 0;
  for (const a of AREE) if (aree[a.id] != null) { somma += aree[a.id] * a.peso; pesi += a.peso; }
  return pesi ? Math.round(somma / pesi) : null;
}

const fmt = (n, d = 1) => (n == null ? '—' : n.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: d }));

export function titoloSintesi(dati) {
  if (dati.sintesi?.titolo) return dati.sintesi.titolo;
  const lcp = dati.velocita?.mobile?.lcp;
  const g = dati.gbp || {};
  if (lcp >= 4) return `Da smartphone il vostro sito impiega ${fmt(lcp)} secondi a mostrare il contenuto principale. Più della metà delle persone abbandona una pagina che ne richiede più di 3.`;
  if (g.recensioni && g.risposte != null && g.risposte < 50) return `Avete ${g.recensioni} recensioni su Google, ma avete risposto solo al ${g.risposte}%: chi vi sceglie legge soprattutto come rispondete.`;
  if (lcp >= 2.5) return `Da smartphone il vostro sito impiega ${fmt(lcp)} secondi a mostrarsi: Google considera veloce una pagina sotto i 2,5.`;
  return 'Il vostro sito ha buone basi. Ecco cosa lo separa da un’eccellenza che si vede, e che si trova.';
}

// Il piano d'azione: velocità prima di tutto se è lenta, poi i controlli
// critici per impatto, poi quelli da migliorare ad alto impatto.
export function priorita(dati, quante = 6) {
  if (Array.isArray(dati.priorita) && dati.priorita.length) {
    return dati.priorita.map((p) => (typeof p === 'string' ? voce(p, dati) : p)).filter(Boolean).slice(0, quante);
  }
  const lista = [];
  const mob = dati.velocita?.mobile;
  if (mob && mob.punteggio < 90) {
    lista.push({
      id: 'velocita', nome: `Velocità da smartphone: da ${fmt(mob.lcp)} s a meno di 2,5 s`,
      perche: 'Ogni secondo in più di attesa fa aumentare le persone che chiudono la pagina prima di vedervi.',
      soluzione: 'Immagini ottimizzate, codice alleggerito, hosting e cache adeguati.',
      impatto: mob.punteggio < 50 || mob.lcp > 4 ? 3 : 2, stato: mob.punteggio < 50 || mob.lcp > 4 ? 'bad' : 'warn',
    });
  }
  const ordina = (a, b) => b.impatto - a.impatto || b.peso - a.peso;
  const conStato = CONTROLLI.map((c) => ({ ...c, stato: dati.controlli?.[c.id]?.stato, valore: dati.controlli?.[c.id]?.valore }));
  lista.push(...conStato.filter((c) => c.stato === 'bad').sort(ordina));
  lista.push(...conStato.filter((c) => c.stato === 'warn' && c.impatto >= 3).sort(ordina));
  lista.push(...conStato.filter((c) => c.stato === 'warn' && c.impatto === 2).sort(ordina));
  return lista.slice(0, quante);
}

function voce(id, dati) {
  const c = CONTROLLI.find((c) => c.id === id);
  return c ? { ...c, stato: dati.controlli?.[id]?.stato, valore: dati.controlli?.[id]?.valore } : null;
}

// Aumento della probabilità di abbandono rispetto a una pagina da 1 secondo
// (Google/SOASTA Research, 2017): 1→3 s +32%, 1→5 s +90%, 1→6 s +106%, 1→10 s +123%.
export const CURVA_ABBANDONO = [[1, 0], [3, 32], [5, 90], [6, 106], [10, 123]];
export function abbandono(sec) {
  if (sec == null) return null;
  const c = CURVA_ABBANDONO;
  if (sec <= 1) return 0;
  if (sec >= 10) return 123;
  for (let i = 1; i < c.length; i++) {
    if (sec <= c[i][0]) {
      const [x0, y0] = c[i - 1]; const [x1, y1] = c[i];
      return Math.round(y0 + ((sec - x0) / (x1 - x0)) * (y1 - y0));
    }
  }
  return 123;
}
