# Check-up digitale GoMore

Il report "stato di salute del sito" da mandare ai prospect: 9 pagine A4 con
il marchio GoMore, dati misurati, grafici e piano d'azione.

| Pagina | Contenuto |
|---|---|
| 1 | Copertina: cliente, indice di salute digitale (0–100), tre numeri chiave |
| 2 | Sintesi: frase d'apertura, punteggio per area, le tre priorità, KPI |
| 3 | Velocità: PageSpeed mobile/desktop, Core Web Vitals con soglie Google, curva degli abbandoni, peso della pagina, cosa rallenta |
| 4 | Smartphone: screenshot reale in un iPhone, controlli, versione desktop |
| 5 | Google: posizione su Maps e nei risultati, anteprima del risultato, SEO tecnica |
| 6 | Google Business: voto, recensioni, risposte, foto, confronto con i concorrenti |
| 7 | Sicurezza, GDPR, P.IVA, integrazioni e tecnologie |
| 8 | Piano d'azione e confronto con un sito GoMore (Lalinga Oro) |
| 9 | Proposta, contatti GoMore, metodologia e fonti |

## Uso

Il modo più semplice: manda a Claude il link del sito ("fammi il check-up di
https://…"). Fa analisi, ricerca su Google Maps e PDF (skill `report-salute`).

A mano:

```
node src/analyze.mjs https://www.sito.it --nome "Gioielleria Rossi" --citta Bari
```

Scrive `clienti/<slug>/dati.json` e gli screenshot (circa 40 secondi). Poi
completa in `dati.json` ciò che una macchina non vede: `gbp`,
`posizionamento`, `concorrenti` e i controlli `g_*`, `s_posizione`,
`s_mappe` (stato `ok` / `warn` / `bad` / `na`, più un `valore` breve).

```
node src/render.mjs <slug>          # il PDF, in clienti/<slug>/
node src/render.mjs <slug> --png    # più un'anteprima PNG per pagina
node src/render.mjs --vuoto         # il modello compilabile, in modello/
```

Si può anche forzare: `sintesi.titolo` (la frase della pagina 2),
`priorita` (lista di id di controlli), `punteggi.<area>`,
`proposta.testo` e `proposta.anteprima` (un'immagine del nuovo look, nella
cartella del cliente: compare nell'ultima pagina).

## Da fare una volta

Compila `studio.json`: email, telefono, Instagram, referente, P.IVA. Finché
sono vuoti, nel PDF compaiono come segnaposto tratteggiati.

Facoltativo: con una chiave gratuita di Google (`export PSI_API_KEY=…`) la
velocità arriva direttamente dall'API di PageSpeed Insights, con i dati reali
degli utenti Chrome quando esistono. Senza chiave si usa Lighthouse in locale:
stesso motore, stesse soglie.

## File

- `src/checks.mjs` — le 53 voci controllate, con perché e soluzione
- `src/analyze.mjs` — Lighthouse, pagina reale, rete, certificato
- `src/score.mjs` — punteggi, giudizi, priorità, frase di sintesi
- `src/render.mjs` + `template/report.css` — impaginazione e PDF (Chrome + pdf-lib)
