# GM — hero stellare

Versione locale essenziale della hero GM con monogramma animato e interattivo.

## Avvio

Doppio clic su `AVVIA.cmd`, quindi apri <http://localhost:3000>.
Su macOS usa `AVVIA.command`. Al primo avvio vengono installate le dipendenze.

## Interazioni

- Il monogramma si forma da una nube di stelle.
- Il puntatore sposta localmente le particelle.
- Trascinamento e frecce ruotano il monogramma; Home lo ripristina.
- Il controllo Pausa ferma l’animazione.
- Con movimento ridotto di sistema il logo appare già formato.

## File principali

- `app/page.tsx`: ordine della pagina — storia (hero e cervello), progetti, metodo della casa, servizi, contatti.
- `app/story.tsx`: hero con CTA e capitoli del cervello ("Il pensiero"); le reti neurali si disperdono prima dei progetti.
- `app/method-story.tsx`: dopo i progetti le stelle disegnano la villa, poi il video ne mostra la costruzione seguendo lo scroll. Le tappe `data-scroll-stop` indicano dove si ferma l'indicatore di scroll.
- `app/scroll-cue.tsx`: indicatore di scroll unico per tutta la pagina, centrato in basso: grande in apertura, poi una pillola che sparisce mentre si scorre e ricompare appena ci si ferma, fino ai contatti. Al clic porta alla tappa successiva.
- `app/section-label.tsx`: etichetta "GM · Nome" che apre ogni sezione.
- `app/content.ts`: testi, progetti e **dati dello studio da completare** (`email`, `legalName`, `vat`, `address`): finché sono vuoti non vengono mostrati.
- `app/astra-field.tsx`: scena Three.js (solo scroll: nessun drag né zoom intercettato).
- `app/site-header.tsx`: header con logo, capsula centrale con i nomi di tutte le sezioni e "The Ascent" (`app/ascent.tsx`, SVG/CSS): una traiettoria orizzontale sotto le voci che alla fine sale verso una stella, rivelata man mano; il razzo (`app/rocket.tsx`, SVG con fiamme animate sempre accese) la percorre in modo continuo con lo scroll e raggiunge la stella in fondo alla pagina e pulsante "Contattaci"; sotto i 960 px diventa il menu a schermo intero, e la barra mostra la stessa ascesa in piccolo.
- `app/site-footer.tsx`: footer con Privacy e Cookie.
- `app/star-sky.tsx`: l'unico cielo stellato del sito, dalla hero al footer e su ogni pagina: WebGL fisso sotto i contenuti, con le stesse stelle (shader, dimensioni, colori, luminosità) che prima stavano dietro al cervello. Salgono in modo continuo con lo scroll; la scena della storia (`astra-field.tsx`) non disegna più un cielo proprio.
- `app/privacy`, `app/cookie`: pagine legali. Il sito non usa cookie né servizi di terze parti, quindi non serve un banner di consenso.
- `app/contact-form.tsx` e `app/api/contact/route.ts`: form e invio. In produzione imposta `CONTACT_WEBHOOK_URL` (es. Formspree, Make, Zapier).
- `app/fonts/`: Instrument Sans e Instrument Serif Italic (OFL), ospitati localmente.
- `app/gm-points.json`: stelle del monogramma, generate da `public/gm-logo.png` con `node scripts/sample-gm.mjs` (contorno, riempimento e polvere, per lettere sempre leggibili).
- `app/icon.png`, `app/opengraph-image.png`, `app/robots.ts`, `app/sitemap.ts`: favicon, anteprima social, SEO tecnica.
- `NEXT_PUBLIC_SITE_URL`: dominio definitivo per canonical, sitemap e dati strutturati (default: sito-gm-one.vercel.app).

## Preview dei progetti

Le preview del Portfolio (`public/projects/`) sono registrazioni reali delle homepage che scorrono lentamente: poster, WebM VP9 e MP4 H.264 in 720 e 1280 px, più una registrazione verticale della versione mobile (`-m-`) mostrata sui telefoni, con il finale che sfuma nel primo frame per un loop senza salti. Partono solo quando il progetto è al centro dell'attenzione, uno alla volta (`app/project-preview.tsx`).

Per rigenerarle (Chrome, `npm i -D puppeteer-core` e `ffmpeg`):

```
node scripts/record-preview.mjs lalinga https://lalingaoro.it '[[0,0],[1.2,0],[4.2,1300],[7.2,2880],[9.0,3780],[11.3,4300],[13.3,4800],[14.6,4950]]' 30
node scripts/record-preview.mjs vedovelli https://www.residenzavedovelli.it '[[0,0],[1.2,0],[3.4,900],[5.6,1650],[6.8,1860],[8.8,2380],[10.8,3050],[12.8,3478],[13.4,3478]]' 30
```

Ogni coppia è `[secondo, scroll in px]`; i frame vanno poi codificati come descritto in cima allo script.
