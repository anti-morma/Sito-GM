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

## File della hero

- `app/astra-field.tsx`: renderer Three.js, shader e interazioni.
- `app/gm-points.json`: coordinate del monogramma.
- `app/page.tsx`: testo e controllo Pausa.
- `app/globals.css`: stile responsive.
- `public/gm-logo.png`: fallback se WebGL non è disponibile.
- `public/fonts/OpenAISans-Regular.woff2`: font locale.
