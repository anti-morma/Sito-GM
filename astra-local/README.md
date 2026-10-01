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
- `app/hero.tsx`: hero con titolo e CTA, alta una schermata; il GM di stelle accanto al testo è disegnato dal campo di particelle. Sui telefoni in verticale la hero è tutta del testo (label "GM · Studio digitale", titolo sempre su tre righe, descrizione, CTA) e il GM di stelle vive nel logo in alto a sinistra: scorrendo, le sue stelle ne escono e disegnano la villa. Alla prima visita della sessione c'è l'apertura (decisa in `app/opening.ts`, disegnata da `app/gomore-mobile-intro.tsx`): una spirale di stelle blu si accende e scrive GOMORE lettera per lettera, un riflesso la percorre, la parola si avvita e si chiude nel GM con un lampo che spazza via la nube in un anello, il GM fa mezzo giro e si scompone in un fiume di stelle che si riversa nel logo, che si accende (circa 3,2 secondi; un tocco la salta; mai tornando indietro, ricaricando, aprendo un link a una sezione o con movimento ridotto). Sugli schermi più bassi l'indicatore di scroll si fa da parte.
- `app/method-story.tsx`: il metodo, un passo alla volta con lo scroll (tempi in `app/method-timeline.ts`, condivisi con le stelle): le stelle del GM disegnano la villa già mentre la hero scorre via (completa prima che la sezione entri; su desktop già nel riquadro del video, a sinistra), poi compaiono "GM · Il metodo", il titolo e la didascalia, poi il video ne mostra la costruzione con le cinque fasi già scritte. Un pallino scende da una fase all'altra lungo una linea che si disegna fino a lui e mai oltre; ogni fase raggiunta si accende e apre la sua descrizione sotto il titolo (su telefono solo quella in corso). Le tappe `data-scroll-stop` indicano dove si ferma l'indicatore di scroll. Su telefono le cinque fasi restano tutte scritte, in piccolo, sotto il video (è accesa quella in costruzione) e le stelle della villa si allineano al video misurandone la posizione, anche quando la barra di Safari si ritira. Il video (`app/construction-video.tsx`) viene scaricato per intero prima di seguire lo scroll, così saltando avanti non aspetta mai la rete, e viene spostato al massimo una volta per fotogramma; finché copre la scena, il canvas delle stelle si ferma e si nasconde.
- `app/bridge.tsx`: l'idea, tra servizi e form: una sola scena fissata per 60svh (40svh su telefono). A sinistra "Hai un'idea? Diamole forma." con una freccia che porta al form (la stella cadente dell'indicatore di scroll, in un cerchio); a destra (sotto, su telefono) il cervello di stelle in 3D, che si compone mentre la sezione entra, ruota su se stesso (un giro ogni 18 s, si può girare trascinandolo) e si scioglie mentre arriva il form. Con movimento ridotto il cervello resta fermo, senza scroll fissato.
- `public/brain-0.bin`, `brain-1.bin`, `brain-2.bin`: il cervello in tre fette consecutive (formato in `app/brain-sculpture.ts`): per ogni stella posizione, normale e tonalità del materiale, letti così come sono dalla GPU. Ogni prefisso copre già tutta la superficie, quindi chi disegna meno stelle scarica solo le prime fette (telefono: 0 e 1, 885 KB; desktop: tutte, 1,8 MB; prima erano 3,3 MB per tutti). La scena desktop disegna 163.840 stelle; tutti i 196.608 punti anatomici contribuiscono all’occlusione del retro. Il materiale dà variazioni individuali e zone di luce continue nello spazio, usando la distribuzione tonale del riferimento. Le creste non ricevono sistematicamente le stelle più luminose. La composizione alfa e la compensazione della densità proiettata limitano le righe bianche sulle pieghe durante la rotazione. La profondità nasconde i punti posteriori senza tagli basati sulle normali. La geometria e il modello mobile restano invariati.
- `app/offer-deck.tsx` e `app/offer-list.tsx`: i due servizi. Su desktop stanno affiancati con gli elenchi aperti. Sui telefoni sono un mazzo di due carte: il sito su misura davanti e la manutenzione subito dietro, di cui si vede il bordo in alto con numero, "Dopo il lancio" e nome. Un tocco sul bordo, o uno swipe orizzontale sulla carta, le scambia. Il pulsante “Cosa include” apre l'elenco della carta davanti; la sezione resta alta una schermata.
- `app/particle-journey.tsx`: traduce lo scroll nelle due scene del campo di particelle (hero → villa, poi il cervello prima del form); tra le due, su progetti e servizi, resta solo il cielo.
- `app/scroll-cue.tsx`: l'indicatore di scroll è una scia di stelle lungo il bordo destro: la scritta verticale "Scorri", una linea a puntini come la rotta dell'header, nove piccole stelle e una stella cadente che la percorre e le accende una per una, fino a una freccia. È luminoso in apertura, si attenua mentre si scorre, torna appena ci si ferma e sparisce al form. Sui telefoni resta solo nelle scene che si animano scorrendo (apertura, metodo, cervello), non sopra i testi. Al clic porta alla tappa successiva (`data-scroll-stop`).
- `app/section-label.tsx`: etichetta "GM · Nome" che apre ogni sezione.
- `app/progetti/[slug]/page.tsx` e `app/progetti/case-study.css`: le pagine caso studio, una per progetto (`/progetti/lalinga-oro`, `/progetti/residenza-vedovelli`), generate da `study` in `content.ts`. Contengono i dati del cliente, il sito nella finestra del browser, la sfida, l'idea, cosa abbiamo fatto, il sito su telefono, il risultato e il progetto successivo. Numeri (`metrics`) e parole del cliente (`quote`) compaiono solo quando vengono compilati: vanno inseriti solo dati reali e approvati dal cliente. In home, "Scopri il progetto" e l'anteprima portano alla pagina caso studio; "Visita il sito ↗" porta al sito online.
- `app/content.ts`: testi, progetti e **dati dello studio da completare** (`email`, `phone`, `legalName`, `vat`, `address`, `pec`). Compaiono nel footer, nel menu da telefono, nella sezione contatti e nella privacy (`app/studio-details.tsx`). Sul sito pubblicato quelli vuoti non vengono mostrati; in sviluppo (`npm run dev`) appaiono come segnaposto tratteggiati, per vedere dove andranno. Da compilare appena sono certi, perché rispondono alle domande che fermano chi sta per scrivere: `responseTime` ("Ti rispondiamo entro …", accanto al form e nel messaggio dopo l'invio) e `price` di ogni servizio in `offers` (per esempio "A partire da …"). `primaryCta` è il nome dell'azione principale, uguale in hero, header, menu, servizi, footer e casi studio; il form usa "Richiedi la consulenza" e, dopo l'invio, "Richiesta ricevuta". `nextSteps` sono i tre passi di "Cosa succede dopo" nella sezione contatti.
- `app/astra-field.tsx` e `app/astra-scene.ts`: scena Three.js di tutte le particelle: GM, villa, cervello. Il componente carica la scena (e Three.js) dopo la pagina, a browser libero. Le stelle della storia (GM, villa) e quelle del cervello sono due insiemi separati: il cervello arriva sulla GPU solo qualche schermata prima della sua scena. Il cervello ha la stessa texture di superficie su desktop e telefono; sugli schermi da telefono usa metà stelle per la villa, metà per il cervello (più piccole, in proporzione al cervello) e stelle di passaggio più discrete; sui touch niente effetti al passaggio del dito.
- `app/quality.ts`: la qualità adattiva, per ogni dispositivo (prima solo per i telefoni). Una scala condivisa dai due canvas: fino a 2x, poi 1,5x, poi 1x, poi "lite" (meno stelle nel cervello e nel cielo, nebulosa più leggera, niente vetro smerigliato né fiamme animate: classe `gm-lite` su `<html>`). Si parte dal gradino suggerito dal dispositivo (memoria, core, risparmio dati, schede grafiche note per essere deboli) e si scende da soli, mai risalendo, se i fotogrammi rallentano. `?lite` nell'indirizzo mostra il gradino più leggero su qualsiasi dispositivo. Le scene non superano i 60 fotogrammi al secondo, anche sugli schermi a 120 Hz.
- `app/site-header.tsx`: header con logo, capsula centrale con i nomi di tutte le sezioni e "The Ascent" (`app/ascent.tsx`, SVG/CSS): una traiettoria orizzontale sotto le voci che alla fine sale verso una stella, rivelata man mano; il razzo (`app/rocket.tsx`, SVG con fiamme animate sempre accese) la percorre in modo continuo con lo scroll e raggiunge la stella in fondo alla pagina e pulsante "Richiedi una consulenza" (`primaryCta`); sotto i 960 px diventa il menu a schermo intero, e la barra mostra la stessa ascesa in piccolo. Aperto, il menu copre la pagina: quella dietro diventa `inert` (fuori dal percorso di tastiera e lettori di schermo) e il focus entra nel menu; Esc lo chiude e riporta il focus su "Menu".
- `app/site-footer.tsx`: footer con Privacy, Cookie e "Ferma le animazioni".
- `app/motion.ts` e `app/motion-toggle.tsx`: "Ferma le animazioni" (nel footer e nel menu da telefono) ferma cielo, GM, logo, razzo, indicatore di scroll e anteprime dei progetti, come l'impostazione di sistema "Riduci movimento" (WCAG 2.2.2). Ogni parte animata legge `reducedMotion()` invece della sola media query; la scelta vale per la visita (sessionStorage) ed è segnata su `<html data-motion="still">`, che `globals.css` tratta come la media query. Quando il sistema chiede già meno movimento, il pulsante non compare.
- `app/tracking.tsx`: cosa si misura oltre alle visite (vedi *Misurazione*).
- `app/star-sky.tsx` e `app/star-sky-scene.ts`: l’unico cielo del sito, con stelle ambientali e la nebulosa dietro ai contenuti e alle strutture, caricato dopo la pagina. Rispetta il movimento ridotto e usa meno stelle sui telefoni.
- `app/nebula-field.ts`: la nebulosa. Il gas cambia lentissimo, quindi viene calcolato a fotogrammi chiave ogni ~2 secondi, poche righe per fotogramma, e sfumato tra un fotogramma chiave e l'altro: ogni fotogramma costa due letture di texture invece del rumore completo. Scorrendo si dissolve in modo organico (si apre, ruota appena su se stessa e si sfilaccia in filamenti, prima i veli sottili e poi i filamenti luminosi) e le sue stelle se ne vanno ognuna per conto suo; tornando indietro si ricompone. Nessuna tessera: prima si spezzava in 900 quadrati.
- `app/privacy`, `app/cookie`: pagine legali. Il sito non usa cookie, nemmeno per le statistiche (Vercel Web Analytics, in `app/layout.tsx`, conta le visite in forma anonima), quindi non serve un banner di consenso. Usa solo la memoria di sessione del browser (apertura già vista, animazioni ferme), dichiarata nella cookie policy: se si aggiunge altro che salva dati sul dispositivo, va aggiunto lì.
- `app/_contact/` e `app/api/contact/route.ts`: form e invio, dal template dello studio (vedi sotto, *Modulo contatti*).
- `app/fonts/`: Instrument Sans e Instrument Serif Italic (OFL), ospitati localmente.
- `app/gomore-points.json`: le stelle della scritta GOMORE per l'apertura su telefono, una per ogni stella del GM.
- `app/gm-points.json`: stelle del monogramma, ricavate da `public/gm-logo.png` (contorno, riempimento e polvere, per lettere sempre leggibili).
- `app/icon.png`, `app/opengraph-image.png`, `app/robots.ts`, `app/sitemap.ts`: favicon, anteprima social, SEO tecnica.
- Luce: apertura e metodo restano cielo notturno. Da progetti in poi, nebulose nei blu del sito dietro ogni sezione e schermi dei progetti che fanno luce; in fondo un'alba sotto il form e il footer (`globals.css`, *Light*).

## SEO

- `app/seo.ts`: descrizioni (quella per Google sotto i 160 caratteri) e dati strutturati schema.org. In home: `Organization` + `ProfessionalService` con servizi, area servita e, se compilati, indirizzo, contatti, P.IVA e profili; `WebSite`, `WebPage` e l'elenco dei progetti. Nei casi studio: `CreativeWork` e `BreadcrumbList`.
- SEO locale: in `content.ts` compila `city`, `region`, `postalCode`, `street` (solo se lo studio riceve clienti) e `profiles` (Instagram, LinkedIn, **scheda Google Business Profile**). Compaiono nei dati strutturati, nel footer e in `llms.txt`. La scheda Google Business Profile va creata a parte su business.google.com, con nome, città e telefono identici al sito.
- `app/sitemap.ts` (con le immagini dei progetti), `app/robots.ts`, `app/manifest.ts` (icona e colori quando il sito viene aggiunto alla schermata home), `app/llms.txt/route.ts` (lo studio in testo semplice per gli assistenti AI, generato da `content.ts`).
- Ogni pagina ha titolo, descrizione, canonical e anteprima social propri.
- `next.config.ts`: intestazioni di sicurezza e cache (dati delle stelle un anno, video e anteprime una settimana).

## Prestazioni

- Three.js e le scene di stelle si caricano dopo la pagina (`import()` dinamico, quando il browser è libero): il JavaScript iniziale della home è sceso da circa 374 a 163 KB compressi. Lighthouse mobile: da 91–94 a 99, LCP da 3,2–3,5 s a 2,0 s.
- Le stelle della villa sono in `public/blueprint-0.bin` e `blueprint-1.bin` (int16, vedi `app/blueprint-geometry.ts`), scaricate a parte a bassa priorità; i telefoni usano solo la prima metà e scaricano solo quella.
- Ogni stella è disegnata come un quadratino: viene ritagliato alla sola parte che può accendersi (stesso risultato a vista, molti meno pixel calcolati; nella passata di profondità del cervello quasi cinque volte meno).
- I telefoni modesti (Chrome, 4 GB di memoria o meno) e chi ha attivato il risparmio dati saltano l'apertura e disegnano un terzo di stelle in meno nel cervello (`modestDevice` in `app/quality.ts`); un telefono molto lento durante l'apertura la accelera invece di scattare.
- Favicon e icona Apple ricodificate in toni indicizzati (54 → 10 KB e 13 → 2 KB, identiche a vista).
- Il video del cantiere si scarica dopo il caricamento, al primo scroll o dopo 3,5 secondi; con il risparmio dati non si scarica e resta il disegno di stelle.
- Il logo dell'header è `public/gm-logo.webp` (18 KB invece di 170).

- `NEXT_PUBLIC_SITE_URL`: dominio definitivo per canonical, sitemap e dati strutturati (default: astra-local-alpha.vercel.app; quando ci sarà il dominio, impostala su Vercel).

## Misurazione

Oltre alle visite, Vercel Web Analytics riceve tre eventi anonimi (`app/tracking.tsx`), senza cookie e senza dati personali. Gli eventi personalizzati compaiono nella dashboard di Vercel solo con il piano Pro; con il piano Hobby vengono ignorati senza errori.

| Evento | Quando | Proprietà |
| --- | --- | --- |
| `generate_lead` | il modulo è stato inviato davvero (compare il messaggio di conferma) | — |
| `cta_click` | clic su un'azione con `data-cta` | `position` (hero, hero-progetti, header, menu, servizio-sito, servizio-manutenzione, footer, caso-studio-header, progetto, sito-cliente), `project` per i progetti |
| `contact_click` | clic su e-mail o telefono | `type` (email, phone) |

Il tasso di conversione del sito è `generate_lead` ÷ visitatori. Per un nuovo pulsante basta aggiungere `data-cta="nome-posizione"`.

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
