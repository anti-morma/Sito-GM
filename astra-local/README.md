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
- `app/method-story.tsx`: il metodo, un passo alla volta con lo scroll (tempi in `app/method-timeline.ts`, condivisi con le stelle): le stelle del GM disegnano la villa già mentre la hero scorre via (completa prima che la sezione entri; su desktop già nel riquadro del video, a sinistra), poi compaiono "GM · Il metodo", il titolo e la didascalia, poi il video ne mostra la costruzione con le cinque fasi già scritte. Un pallino scende da una fase all'altra lungo una linea che si disegna fino a lui e mai oltre; ogni fase raggiunta si accende e apre la sua descrizione sotto il titolo (su telefono solo quella in corso). Le tappe `data-scroll-stop` indicano dove si ferma l'indicatore di scroll. Su telefono le cinque fasi restano tutte scritte, in piccolo, sotto il video (è accesa quella in costruzione) e le stelle della villa si allineano al video misurandone la posizione, anche quando la barra di Safari si ritira. Il video (`app/construction-video.tsx`) viene scaricato per intero prima di seguire lo scroll, così saltando avanti non aspetta mai la rete, e viene spostato al massimo una volta per fotogramma; finché copre la scena, il canvas delle stelle si ferma e si nasconde.
- `app/bridge.tsx`: l'idea, tra servizi e form: una sola scena fissata per 60svh (40svh su telefono). A sinistra "Hai un'idea? Diamole forma." con una freccia che porta al form (la stella cadente dell'indicatore di scroll, in un cerchio); a destra (sotto, su telefono) il cervello di stelle in 3D, che si compone mentre la sezione entra, ruota su se stesso (un giro ogni 18 s, si può girare trascinandolo) e si scioglie mentre arriva il form. Con movimento ridotto il cervello resta fermo, senza scroll fissato.
- `public/brain-sculpture.bin`: superficie ricavata dai campioni anatomici locali, separata dal materiale. La scena desktop disegna 163.840 stelle; tutti i 196.608 punti anatomici contribuiscono all’occlusione del retro. `public/brain-surface.bin` dà il materiale: variazioni individuali e zone di luce continue nello spazio, usando la distribuzione tonale del riferimento. Le creste non ricevono sistematicamente le stelle più luminose. La composizione alfa e la compensazione della densità proiettata limitano le righe bianche sulle pieghe durante la rotazione. La profondità nasconde i punti posteriori senza tagli basati sulle normali. La geometria e il modello mobile restano invariati.
- `app/offer-list.tsx`: sui telefoni il pulsante “Cosa include” apre solo l’elenco di ciascun servizio; titolo, descrizione e CTA restano visibili. Su desktop gli elenchi sono sempre aperti. Sui telefoni i due servizi stanno affiancati (sito su misura a sinistra, manutenzione a destra) e la sezione entra in una schermata; sugli schermi più bassi di 600px il sottotitolo si nasconde.
- `app/particle-journey.tsx`: traduce lo scroll nelle due scene del campo di particelle (hero → villa, poi il cervello prima del form); tra le due, su progetti e servizi, resta solo il cielo.
- `app/scroll-cue.tsx`: indicatore di scroll unico per tutta la pagina, centrato in basso: grande in apertura, poi una pillola che sparisce mentre si scorre e ricompare appena ci si ferma, fino ai contatti. Al clic porta alla tappa successiva. Sui telefoni compare solo nella hero, dove dice solo "Esplora", e nelle scene fissate (metodo, cervello), per non coprire i testi.
- `app/section-label.tsx`: etichetta "GM · Nome" che apre ogni sezione.
- `app/content.ts`: testi, progetti e **dati dello studio da completare** (`email`, `phone`, `legalName`, `vat`, `address`, `pec`). Compaiono nel footer, nel menu da telefono, nella sezione contatti e nella privacy (`app/studio-details.tsx`). Sul sito pubblicato quelli vuoti non vengono mostrati; in sviluppo (`npm run dev`) appaiono come segnaposto tratteggiati, per vedere dove andranno.
- `app/astra-field.tsx`: scena Three.js di tutte le particelle: GM, villa, cervello. Sui telefoni disegna fino a 2x (il cielo fino a 1,5x): parte più basso sui telefoni che dichiarano poca memoria o pochi core e scende da solo se i fotogrammi rallentano (`app/pixel-ratio.ts`). Il cervello ha la stessa texture di superficie (`public/brain-surface.bin`) su desktop e telefono; sugli schermi da telefono usa metà stelle per la villa, metà per il cervello (più piccole, in proporzione al cervello) e stelle di passaggio più discrete; sui touch niente effetti al passaggio del dito.
- `app/site-header.tsx`: header con logo, capsula centrale con i nomi di tutte le sezioni e "The Ascent" (`app/ascent.tsx`, SVG/CSS): una traiettoria orizzontale sotto le voci che alla fine sale verso una stella, rivelata man mano; il razzo (`app/rocket.tsx`, SVG con fiamme animate sempre accese) la percorre in modo continuo con lo scroll e raggiunge la stella in fondo alla pagina e pulsante "Contattaci"; sotto i 960 px diventa il menu a schermo intero, e la barra mostra la stessa ascesa in piccolo.
- `app/site-footer.tsx`: footer con Privacy e Cookie.
- `app/star-sky.tsx`: l’unico cielo del sito, con stelle ambientali dietro ai contenuti e alle strutture. Rispetta il movimento ridotto e usa meno stelle sui telefoni.
- `app/privacy`, `app/cookie`: pagine legali. Il sito non usa cookie, nemmeno per le statistiche (Vercel Web Analytics, in `app/layout.tsx`, conta le visite in forma anonima), quindi non serve un banner di consenso.
- `app/_contact/` e `app/api/contact/route.ts`: form e invio, dal template dello studio (vedi sotto, *Modulo contatti*).
- `app/fonts/`: Instrument Sans e Instrument Serif Italic (OFL), ospitati localmente.
- `app/gomore-points.json`: le stelle della scritta GOMORE per l'apertura su telefono, una per ogni stella del GM.
- `app/gm-points.json`: stelle del monogramma, ricavate da `public/gm-logo.png` (contorno, riempimento e polvere, per lettere sempre leggibili).
- `app/icon.png`, `app/opengraph-image.png`, `app/robots.ts`, `app/sitemap.ts`: favicon, anteprima social, SEO tecnica.
- `NEXT_PUBLIC_SITE_URL`: dominio definitivo per canonical, sitemap e dati strutturati (default: astra-local-alpha.vercel.app; quando ci sarà il dominio, impostala su Vercel).

## Modulo contatti

Il form viene dal template dello studio **gm-modulo-contatti** (README completo lì): le richieste partono con [Resend](https://resend.com) e *Rispondi* scrive direttamente al visitatore.

- `app/_contact/config.ts` (campi e testi) e `app/_contact/form.css` (aspetto) sono di questo sito.
- `app/_contact/form.tsx`, `app/_contact/fields.ts` e `app/api/contact/route.ts` sono file comuni: non modificarli qui, si aggiornano con `node <percorso>/gm-modulo-contatti/installa.mjs .`.

Variabili su Vercel (in locale in `.env.local`):

| Variabile | Valore |
| --- | --- |
| `RESEND_API_KEY` | chiave API di Resend, permesso *Sending access* |
| `CONTACT_TO` | chi riceve le richieste |
| `CONTACT_FROM` | mittente sul dominio verificato; finché manca il dominio lasciala vuota: Resend usa il suo indirizzo di prova, che consegna solo all'email dell'account Resend |

In sviluppo, senza chiave, il messaggio viene solo stampato nel terminale.

## Preview dei progetti

Le preview del Portfolio (`public/projects/`) sono registrazioni reali delle homepage che scorrono lentamente: poster, WebM VP9 e MP4 H.264 in 720 e 1280 px, più una registrazione verticale della versione mobile (`-m-`) mostrata sui telefoni, con il finale che sfuma nel primo frame per un loop senza salti. Partono solo quando il progetto è al centro dell'attenzione, uno alla volta (`app/project-preview.tsx`). Su telefono i progetti scorrono uno alla volta in un carosello (`app/project-carousel.tsx`): anteprima verticale intera, frecce ai lati, pallini, nome e descrizione sotto.

## Strumenti di generazione

Il progetto contiene solo ciò che serve al sito pubblicato. Gli script e i materiali sorgente usati per generare le stelle (GM, GOMORE, villa), il cervello e le preview dei progetti (`scripts/`, `assets/`, `docs/`, `public/brain-model.json`, `public/brain-sculpture.json`) sono stati tolti il 29/09/2026 e restano nella storia di git. Per riaverli, dalla cartella principale del repo:

```
git checkout 99871bc -- astra-local/scripts astra-local/assets astra-local/docs astra-local/public/brain-model.json astra-local/public/brain-sculpture.json
```
