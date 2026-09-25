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

- `app/page.tsx`: ordine della pagina — hero, metodo della casa, progetti, servizi, l'idea (cervello di stelle), contatti.
- `app/hero.tsx`: hero con titolo e CTA, alta una schermata; il GM di stelle accanto al testo è disegnato dal campo di particelle. Sui telefoni in verticale la hero è tutta del testo (label "GM · Studio digitale", titolo sempre su tre righe, descrizione, CTA) e il GM di stelle vive nel logo in alto a sinistra: scorrendo, le sue stelle ne escono e disegnano la villa. Alla prima visita della sessione c'è l'apertura (`OPENING` in `app/astra-field.tsx`): una spirale di stelle blu si accende e scrive GOMORE lettera per lettera, un riflesso la percorre, la parola si avvita e si chiude nel GM con un lampo che spazza via la nube in un anello, il GM fa mezzo giro e si scompone in un fiume di stelle che si riversa nel logo, che si accende (circa 3,2 secondi; un tocco la salta; mai tornando indietro, ricaricando, aprendo un link a una sezione o con movimento ridotto). Sugli schermi più bassi l'indicatore di scroll si fa da parte.
- `app/method-story.tsx`: il metodo, un passo alla volta con lo scroll (tempi in `app/method-timeline.ts`, condivisi con le stelle): prima compaiono "GM · Il metodo", il titolo e la didascalia sulle stelle sciolte, poi le stelle disegnano la villa (su desktop già nel riquadro del video, a sinistra), poi il video ne mostra la costruzione con le cinque fasi già scritte. Un pallino scende da una fase all'altra lungo una linea che si disegna fino a lui e mai oltre; ogni fase raggiunta si accende e apre la sua descrizione sotto il titolo (su telefono solo quella in corso). Le tappe `data-scroll-stop` indicano dove si ferma l'indicatore di scroll. Su telefono le cinque fasi restano tutte scritte, in piccolo, sotto il video (è accesa quella in costruzione) e le stelle della villa si allineano al video misurandone la posizione, anche quando la barra di Safari si ritira. Il video (`app/construction-video.tsx`) viene scaricato per intero prima di seguire lo scroll, così saltando avanti non aspetta mai la rete, e viene spostato al massimo una volta per fotogramma; finché copre la scena, il canvas delle stelle si ferma e si nasconde.
- `app/bridge.tsx`: l'idea, tra servizi e form: una sola scena fissata per 60svh (40svh su telefono). A sinistra "Hai un'idea? Diamole forma." con una freccia che porta al form (la stella cadente dell'indicatore di scroll, in un cerchio); a destra (sotto, su telefono) il cervello di stelle in 3D, che si compone mentre la sezione entra, ruota su se stesso (un giro ogni 18 s, si può girare trascinandolo) e si scioglie mentre arriva il form. Con movimento ridotto il cervello resta fermo, senza scroll fissato.
- `app/brain-volume.ts` e `app/brain-points.json`: il cervello, campionato dal disegno di riferimento (`scripts/sample-brain.py`) e reso un solido chiuso.
- `app/particle-journey.tsx`: traduce lo scroll nelle due scene del campo di particelle (hero → villa, poi il cervello prima del form); tra le due, su progetti e servizi, resta solo il cielo.
- `app/scroll-cue.tsx`: indicatore di scroll unico per tutta la pagina, centrato in basso: grande in apertura, poi una pillola che sparisce mentre si scorre e ricompare appena ci si ferma, fino ai contatti. Al clic porta alla tappa successiva. Sui telefoni compare solo nella hero, dove dice solo "Esplora", e nelle scene fissate (metodo, cervello), per non coprire i testi.
- `app/section-label.tsx`: etichetta "GM · Nome" che apre ogni sezione.
- `app/content.ts`: testi, progetti e **dati dello studio da completare** (`email`, `phone`, `legalName`, `vat`, `address`, `pec`). Compaiono nel footer, nel menu da telefono, nella sezione contatti e nella privacy (`app/studio-details.tsx`). Sul sito pubblicato quelli vuoti non vengono mostrati; in sviluppo (`npm run dev`) appaiono come segnaposto tratteggiati, per vedere dove andranno.
- `app/astra-field.tsx`: scena Three.js di tutte le particelle: GM, villa, cervello. Sui telefoni disegna fino a 2x (il cielo fino a 1,5x): parte più basso sui telefoni che dichiarano poca memoria o pochi core e scende da solo se i fotogrammi rallentano (`app/pixel-ratio.ts`). Sugli schermi da telefono usa metà stelle (villa e superficie del cervello) e stelle di passaggio più discrete; sui touch niente effetti al passaggio del dito.
- `app/site-header.tsx`: header con logo, capsula centrale con i nomi di tutte le sezioni e "The Ascent" (`app/ascent.tsx`, SVG/CSS): una traiettoria orizzontale sotto le voci che alla fine sale verso una stella, rivelata man mano; il razzo (`app/rocket.tsx`, SVG con fiamme animate sempre accese) la percorre in modo continuo con lo scroll e raggiunge la stella in fondo alla pagina e pulsante "Contattaci"; sotto i 960 px diventa il menu a schermo intero, e la barra mostra la stessa ascesa in piccolo.
- `app/site-footer.tsx`: footer con Privacy e Cookie.
- `app/star-sky.tsx`: l'unico cielo stellato del sito, dalla hero al footer e su ogni pagina: WebGL fisso sotto i contenuti, con le stesse stelle (shader, dimensioni, colori, luminosità) delle scene a particelle. Salgono in modo continuo con lo scroll; la scena della storia (`astra-field.tsx`) non disegna più un cielo proprio.
- `app/privacy`, `app/cookie`: pagine legali. Il sito non usa cookie né servizi di terze parti, quindi non serve un banner di consenso.
- `app/contact-form.tsx` e `app/api/contact/route.ts`: form e invio. In produzione imposta `CONTACT_WEBHOOK_URL` (es. Formspree, Make, Zapier).
- `app/fonts/`: Instrument Sans e Instrument Serif Italic (OFL), ospitati localmente.
- `app/gomore-points.json`: le stelle della scritta GOMORE per l'apertura su telefono, una per ogni stella del GM (`swift scripts/render-gomore.swift scripts/gomore.png`, poi `node scripts/sample-gomore.mjs`; Didot serve solo a generarle).
- `app/gm-points.json`: stelle del monogramma, generate da `public/gm-logo.png` con `node scripts/sample-gm.mjs` (contorno, riempimento e polvere, per lettere sempre leggibili).
- `app/icon.png`, `app/opengraph-image.png`, `app/robots.ts`, `app/sitemap.ts`: favicon, anteprima social, SEO tecnica.
- `NEXT_PUBLIC_SITE_URL`: dominio definitivo per canonical, sitemap e dati strutturati (default: sito-gm-one.vercel.app).

## Preview dei progetti

Le preview del Portfolio (`public/projects/`) sono registrazioni reali delle homepage che scorrono lentamente: poster, WebM VP9 e MP4 H.264 in 720 e 1280 px, più una registrazione verticale della versione mobile (`-m-`) mostrata sui telefoni, con il finale che sfuma nel primo frame per un loop senza salti. Partono solo quando il progetto è al centro dell'attenzione, uno alla volta (`app/project-preview.tsx`). Su telefono i progetti scorrono uno alla volta in un carosello (`app/project-carousel.tsx`): anteprima verticale intera, frecce ai lati, pallini, nome e descrizione sotto.

Per rigenerarle (Chrome, `npm i -D puppeteer-core` e `ffmpeg`):

```
node scripts/record-preview.mjs lalinga https://lalingaoro.it '[[0,0],[1.2,0],[4.2,1300],[7.2,2880],[9.0,3780],[11.3,4300],[13.3,4800],[14.6,4950]]' 30
node scripts/record-preview.mjs vedovelli https://www.residenzavedovelli.it '[[0,0],[1.2,0],[3.4,900],[5.6,1650],[6.8,1860],[8.8,2380],[10.8,3050],[12.8,3478],[13.4,3478]]' 30
```

Ogni coppia è `[secondo, scroll in px]`; i frame vanno poi codificati come descritto in cima allo script.
