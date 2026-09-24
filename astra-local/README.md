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

- `app/page.tsx`: ordine della pagina (storia, servizi, statement, progetti, testimonianze, vision/mission, statement finale, contatti).
- `app/story.tsx`: hero, micro-frasi del cervello e metodo della casa, sincronizzati con lo scroll.
- `app/content.ts`: tutti i testi e i segnaposto da sostituire (progetti, testimonianze, vision, mission).
- `app/astra-field.tsx`: renderer Three.js, shader e interazioni.
- `app/site-header.tsx`: navigazione e indicatore di avanzamento 01–05.
- `app/contact-form.tsx` e `app/api/contact/route.ts`: form e invio. In produzione imposta `CONTACT_WEBHOOK_URL` (es. Formspree, Make, Zapier): senza, il form mostra il messaggio di errore invece di perdere i messaggi.
- `app/globals.css`: stile responsive.
- `public/gm-logo.png`: logo e fallback se WebGL non è disponibile.

## Preview dei progetti

Le preview del Portfolio (`public/projects/`) sono registrazioni reali delle homepage che scorrono lentamente: poster, WebM VP9 e MP4 H.264 in 720 e 1280 px, con il finale che sfuma nel primo frame per un loop senza salti. Partono solo quando il progetto è al centro dell'attenzione, uno alla volta (`app/project-preview.tsx`).

Per rigenerarle (Chrome, `npm i -D puppeteer-core` e `ffmpeg`):

```
node scripts/record-preview.mjs lalinga https://lalingaoro.it '[[0,0],[1.2,0],[4.2,1300],[7.2,2880],[9.0,3780],[11.3,4300],[13.3,4800],[14.6,4950]]' 30
node scripts/record-preview.mjs vedovelli https://www.residenzavedovelli.it '[[0,0],[1.2,0],[3.4,900],[5.6,1650],[6.8,1860],[8.8,2380],[10.8,3050],[12.8,3478],[13.4,3478]]' 30
```

Ogni coppia è `[secondo, scroll in px]`; i frame vanno poi codificati come descritto in cima allo script.
