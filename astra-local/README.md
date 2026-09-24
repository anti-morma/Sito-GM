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

- `app/page.tsx`: ordine della pagina — storia (hero, cervello, metodo), approccio, servizi, progetti, contatti.
- `app/story.tsx`: hero con CTA e indicatore di scroll, capitoli del cervello, metodo della casa sincronizzato con lo scroll.
- `app/content.ts`: testi, progetti e **dati dello studio da completare** (`email`, `legalName`, `vat`, `address`): finché sono vuoti non vengono mostrati.
- `app/astra-field.tsx`: scena Three.js (solo scroll: nessun drag né zoom intercettato).
- `app/site-header.tsx`, `app/site-footer.tsx`: menu, CTA, footer con Privacy e Cookie.
- `app/privacy`, `app/cookie`: pagine legali. Il sito non usa cookie né servizi di terze parti, quindi non serve un banner di consenso.
- `app/contact-form.tsx` e `app/api/contact/route.ts`: form e invio. In produzione imposta `CONTACT_WEBHOOK_URL` (es. Formspree, Make, Zapier).
- `app/fonts/`: Instrument Sans e Cormorant Garamond (OFL), ospitati localmente.
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
