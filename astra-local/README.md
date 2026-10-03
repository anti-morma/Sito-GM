# GM — hero stellare

Versione locale essenziale della hero GM con monogramma animato e interattivo.

## Avvio

Doppio clic su `AVVIA.cmd`, quindi apri <http://localhost:3000>.
Su macOS usa `AVVIA.command`. Al primo avvio vengono installate le dipendenze.

## Interazioni

- Il monogramma si forma da una nube di stelle.
- Il puntatore sposta localmente le particelle.
- Il trascinamento ruota il monogramma; il pinch con Ctrl e rotella cambia lo zoom.
- Il controllo "Ferma le animazioni" rispetta anche il movimento ridotto del sistema.
- Con movimento ridotto di sistema il logo appare già formato.

## File principali

- `app/page.tsx`: ordine della home — hero, film e servizi, progetti, studio, cervello e contatti. La vecchia sezione del metodo con villa a particelle è stata rimossa, insieme a codice, CSS e asset dedicati.
- `app/hero.tsx`: hero con titolo e CTA, alta una schermata; il GM di stelle accanto al testo è disegnato dal campo di particelle. Sui telefoni in verticale la hero è tutta del testo (label "GM · Studio digitale", titolo sempre su tre righe, descrizione, CTA) e il GM di stelle vive nel logo in alto a sinistra: scorrendo, le sue stelle si disperdono e lasciano la hero. Alla prima visita della sessione c'è l'apertura (decisa in `app/opening.ts`, disegnata da `app/gomore-mobile-intro.tsx`): una spirale di stelle blu si accende e scrive GOMORE lettera per lettera, un riflesso la percorre, la parola si avvita e si chiude nel GM con un lampo che spazza via la nube in un anello, il GM fa mezzo giro e si scompone in un fiume di stelle che si riversa nel logo, che si accende (circa 3,2 secondi; un tocco la salta; mai tornando indietro, ricaricando, aprendo un link a una sezione o con movimento ridotto). Sugli schermi più bassi l'indicatore di scroll si fa da parte.
- `app/bridge.tsx`: l'idea, tra servizi e form: una sola scena fissata per 60svh (40svh su telefono). A sinistra "Hai un'idea? Diamole forma." con una freccia che porta al form (la stella cadente dell'indicatore di scroll, in un cerchio); a destra (sotto, su telefono) il cervello di stelle in 3D, che si compone mentre la sezione entra, ruota su se stesso (un giro ogni 18 s, si può girare trascinandolo) e si scioglie mentre arriva il form. Con movimento ridotto il cervello resta fermo, senza scroll fissato.
- `public/brain-0.bin`, `brain-1.bin`, `brain-2.bin`: il cervello in tre fette consecutive (formato in `app/brain-sculpture.ts`): per ogni stella posizione, normale e tonalità del materiale, letti così come sono dalla GPU. Ogni prefisso copre già tutta la superficie, quindi chi disegna meno stelle scarica solo le prime fette (telefono: 0 e 1, 885 KB; desktop: tutte, 1,8 MB; prima erano 3,3 MB per tutti). La scena desktop disegna 163.840 stelle; tutti i 196.608 punti anatomici contribuiscono all’occlusione del retro. Il materiale dà variazioni individuali e zone di luce continue nello spazio, usando la distribuzione tonale del riferimento. Le creste non ricevono sistematicamente le stelle più luminose. La composizione alfa e la compensazione della densità proiettata limitano le righe bianche sulle pieghe durante la rotazione. La profondità nasconde i punti posteriori senza tagli basati sulle normali. La geometria e il modello mobile restano invariati.
- `app/particle-journey.tsx`: traduce lo scroll nelle due scene del campo di particelle (hero → villa, poi il cervello prima del form); tra le due, su progetti e servizi, resta solo il cielo.
- `app/scroll-cue.tsx`: l'indicatore di scroll è una scia di stelle lungo il bordo destro: la scritta verticale "Scorri", una linea a puntini come la rotta dell'header, nove piccole stelle e una stella cadente che la percorre e le accende una per una, fino a una freccia. È luminoso in apertura, si attenua mentre si scorre, torna appena ci si ferma e sparisce al form. Sui telefoni resta solo nelle scene che si animano scorrendo (apertura, metodo, cervello), non sopra i testi. Al clic porta alla tappa successiva (`data-scroll-stop`).
- `app/chi-siamo/`: la pagina "Chi siamo" (`/chi-siamo`), nell'ordine in cui un visitatore se lo chiede: chi siete (l'apertura dice subito che GoMore è lo studio di Ludovico Gusmano e Alessandro Mormandi), i due fondatori (le iniziali dei cognomi, G e M, unite da due linee che si incontrano in una stella: due competenze, una direzione), come pensiamo (la domanda "che cosa deve ottenere?" e i cinque lati di ogni progetto), "Less, but better" e la chiamata finale verso `/contatti`. Gli stati legati allo scroll sono in `scenes.tsx` (un solo listener: `--p` e `.is-on`); fondatori e cinque lati in `content.ts` (`founders`, `principles`), usati anche dai dati strutturati (`AboutPage`, `Person`, `founder`) e da `llms.txt`. Con movimento ridotto tutto è già al suo posto.
- `app/section-label.tsx`: etichetta "GM · Nome" che apre ogni sezione.
- `app/progetti/[slug]/page.tsx` e `app/progetti/case-study.css`: le pagine caso studio, una per progetto (`/progetti/lalinga-oro`, `/progetti/residenza-vedovelli`), generate da `study` in `content.ts`. Contengono i dati del cliente, il sito nella finestra del browser, la sfida, l'idea, cosa abbiamo fatto, il sito su telefono, il risultato e il progetto successivo. Numeri (`metrics`) e parole del cliente (`quote`) compaiono solo quando vengono compilati: vanno inseriti solo dati reali e approvati dal cliente. In home, "Scopri il progetto" e l'anteprima portano alla pagina caso studio; "Visita il sito ↗" porta al sito online.
- `app/content.ts`: testi, progetti e **dati dello studio da completare** (`email`, `phone`, `legalName`, `vat`, `address`, `pec`). Compaiono nel footer, nel menu da telefono, nella sezione contatti e nella privacy (`app/studio-details.tsx`). Sul sito pubblicato quelli vuoti non vengono mostrati; in sviluppo (`npm run dev`) appaiono come segnaposto tratteggiati, per vedere dove andranno. Da compilare appena sono certi, perché rispondono alle domande che fermano chi sta per scrivere: `responseTime` ("Ti rispondiamo entro …", accanto al form e nel messaggio dopo l'invio) e `price` di ogni servizio in `offers` (per esempio "A partire da …"). `primaryCta` è il nome dell'azione principale, uguale in hero, header, menu, servizi, footer e casi studio; il form usa "Richiedi la consulenza" e, dopo l'invio, "Richiesta ricevuta". `nextSteps` sono i tre passi di "Cosa succede dopo" nella sezione contatti.
- `app/astra-field.tsx` e `app/astra-scene.ts`: le due scene attive, GM e cervello. Il GM alloca soltanto i suoi 10.420 punti. Entrambi reagiscono al mouse tramite una sola griglia di molle, campionata negli shader soltanto durante un'interazione; trascinamento e zoom restano disponibili. I dati del cervello arrivano poche schermate prima della sua scena.
- `app/quality.ts`: budget adattivo condiviso dai due canvas: 1,5×, 1,25×, 1× e lite. Su desktop la qualità riduce pixel e particelle, seguendo il refresh del browser per logo e cervello, con la nebulosa attiva a 60 FPS. `?lite` forza la qualità minima; `?fps` mostra i frame realmente inviati al rendering per primo piano e sfondo, con p95 degli intervalli (non misura il completamento GPU).
- `app/site-header.tsx`: l'header, uguale su ogni pagina (lo inserisce `app/layout.tsx`): il GM a sinistra, a destra Home · Progetti · Chi siamo · Servizi e Contatti come pulsante. Ogni voce apre sempre la sua pagina, da qualsiasi punto del sito; la pagina in cui ci si trova (o quella che la contiene, come Progetti per un caso studio) è segnata da un punto blu e da `aria-current`. Sotto i 760 px le voci passano nel menu a schermo intero: aperto, copre la pagina, quella dietro diventa `inert` e il focus entra nel menu; Esc lo chiude e riporta il focus su "Menu".
- `app/site-footer.tsx`: footer uguale su ogni pagina: la chiamata finale (dove la pagina non ne ha una sua), i dati dello studio con il pulsante "Torino · Taranto · tutta Italia" verso `/dove-lavoriamo` (`app/where-link.tsx`, presente anche nel menu da telefono), Privacy e Cookie.
- `app/motion.ts` e `app/motion-toggle.tsx`: "Ferma le animazioni" (nel menu da telefono) ferma cielo, GM, logo, indicatore di scroll e anteprime dei progetti, come l'impostazione di sistema "Riduci movimento" (WCAG 2.2.2). Ogni parte animata legge `reducedMotion()` invece della sola media query; la scelta vale per la visita (sessionStorage) ed è segnata su `<html data-motion="still">`, che `globals.css` tratta come la media query. Quando il sistema chiede già meno movimento, il pulsante non compare.
- `app/tracking.tsx`: cosa si misura oltre alle visite (vedi *Misurazione*).
- `app/star-sky.tsx` e `app/star-sky-scene.ts`: l’unico cielo del sito, con stelle ambientali e la nebulosa dietro ai contenuti e alle strutture, caricato dopo la pagina. Rispetta il movimento ridotto e usa meno stelle sui telefoni.
- `app/nebula-field.ts`: la nebulosa. Il gas svanisce prima dei bordi del foglio su cui è disegnato, così non si vede mai una linea dove il foglio finisce. Il gas cambia lentissimo, quindi viene calcolato a fotogrammi chiave ogni ~2 secondi, poche righe per fotogramma, e sfumato tra un fotogramma chiave e l'altro: ogni fotogramma costa due letture di texture invece del rumore completo. Scorrendo si dissolve in modo organico (si apre, ruota appena su se stessa e si sfilaccia in filamenti, prima i veli sottili e poi i filamenti luminosi) e le sue stelle se ne vanno ognuna per conto suo; tornando indietro si ricompone. Nessuna tessera: prima si spezzava in 900 quadrati.
- `app/privacy`, `app/cookie`: pagine legali. Il sito non usa cookie, nemmeno per le statistiche (Vercel Web Analytics, in `app/layout.tsx`, conta le visite in forma anonima), quindi non serve un banner di consenso. Usa solo la memoria di sessione del browser (apertura già vista, animazioni ferme), dichiarata nella cookie policy: se si aggiunge altro che salva dati sul dispositivo, va aggiunto lì.
- `app/_contact/` e `app/api/contact/route.ts`: form e invio, dal template dello studio (vedi sotto, *Modulo contatti*).
- `app/fonts/`: Instrument Sans e Instrument Serif Italic (OFL), ospitati localmente.
- `app/gomore-points.json`: le stelle della scritta GOMORE per l'apertura su telefono, una per ogni stella del GM.
- `app/gm-points.json`: stelle del monogramma (contorno, riempimento e polvere, per lettere sempre leggibili).
- `app/icon.png`, `app/opengraph-image.png`, `app/robots.ts`, `app/sitemap.ts`: favicon, anteprima social, SEO tecnica.
- Luce: apertura e metodo restano cielo notturno. Da progetti in poi, nebulose nei blu del sito dietro ogni sezione e schermi dei progetti che fanno luce; in fondo un'alba sotto il form e il footer (`globals.css`, *Light*).

## Architettura del sito

La home racconta lo studio dall'inizio alla fine, in breve; ogni voce del menu ha la sua pagina, che approfondisce. L'header (`app/site-header.tsx`) è lo stesso ovunque e ogni voce porta sempre alla stessa pagina: Home, Progetti, Chi siamo, Servizi, Contatti. Nelle pagine interne le briciole di pane in alto dicono dove ci si trova. In home, ogni sezione ha il suo link alla pagina completa ("Tutti i progetti e i casi studio", "Scopri chi siamo", "Scopri tutti i servizi"). 

| Pagina | Da dove nasce |
| --- | --- |
| `/` | `app/page.tsx` (H1: "Web design, sviluppo e digital experiences su misura"; il titolo creativo resta il più grande) |
| `/chi-siamo` | `app/chi-siamo/` |
| `/servizi`, `/servizi/<slug>` | `app/servizi/`, dati in `app/services.ts` (web design, sviluppo web, UX/UI, 3D e WebGL, AI) |
| `/progetti`, `/progetti/<slug>` | `app/progetti/`, dati in `projects` di `app/content.ts` |
| `/dove-lavoriamo` | `app/dove-lavoriamo/page.tsx`, testi in `app/places.ts` (i vecchi `/torino` e `/taranto` rimandano qui, `next.config.ts`) |
| `/contatti` | `app/contatti/page.tsx`, stesso form della home |
| `/privacy`, `/cookie` | `app/privacy`, `app/cookie` |

Le pagine interne usano gli stessi mattoni (`app/inner.tsx` + `app/inner.css`): apertura con briciole di pane e H1, sezioni a due colonne, elenchi numerati, progetti collegati, chiusura con un'unica azione verso `/contatti`.

**Aggiungere un servizio**: un oggetto in `services.ts`. Pagina, link nel footer e in /servizi, sitemap, dati strutturati e `llms.txt` si aggiornano da soli. In `projects` va indicato solo un progetto reale, con che cosa ha fatto quella disciplina lì; se non ce n'è nessuno, `noProjects` lo dice.

**Aggiungere un caso studio**: un progetto con `study` in `content.ts`. Ogni caso studio segue lo stesso modello in quattro capitoli, problema → decisione → soluzione → esperienza: il problema (con gli obiettivi), la decisione (idea e strategia), la soluzione (esperienza utente, direzione visiva, tecnologia, motion, SEO, ognuna con un titoletto), l'esperienza su telefono; poi il risultato con ciò che è stato consegnato e i servizi coinvolti. I capitoli lasciati vuoti non compaiono: vanno scritti solo fatti veri. Numeri (`metrics`) e parole del cliente (`quote`) solo se reali e approvati.

**Dove lavoriamo**: una sola pagina, `/dove-lavoriamo`: presenti a Torino e Taranto, al lavoro con clienti in tutta Italia, senza vincoli. Prova con i progetti veri: Lalinga Oro a Taranto, Residenza Vedovelli sul Lago di Garda. Nessun indirizzo viene dichiarato: nello schema le città sono aree servite (`areaServed`), non sedi.

**Contenuti futuri (insights)**: non ci sono pagine vuote. Quando ci saranno articoli veri, la sezione `/insights` va creata con la stessa logica: una pagina per ogni domanda reale delle persone, con autore e data.

## SEO

- `app/seo.ts`: descrizioni, metadata di ogni pagina (`pageMetadata`: title, description, canonical, Open Graph, Twitter, eventuale `noindex`) e dati strutturati schema.org, come un unico grafo collegato da `@id`. Lo studio (`Organization`) è dichiarato per intero in home, chi siamo e contatti, e richiamato per `@id` dalle altre pagine. Diventa anche `ProfessionalService` (attività locale) solo quando in `content.ts` c'è un indirizzo vero. Nelle pagine: `WebSite`, `WebPage`/`AboutPage`/`ContactPage`/`CollectionPage`, `Service` (servizi), `CreativeWork` (casi studio), `Person` (fondatori), `BreadcrumbList` nelle pagine interne. Niente recensioni, valutazioni, orari o sedi: non esistono.
- Titoli: `Pagina | GoMore` (template in `app/layout.tsx`); home: "GoMore | Web design, sviluppo e digital experiences".
- SEO locale: in `content.ts` compila `city`, `region`, `postalCode`, `street` (solo se lo studio riceve clienti) e `profiles` (Instagram, LinkedIn, **scheda Google Business Profile**). Compaiono nei dati strutturati, nel footer e in `llms.txt`. La scheda Google Business Profile va creata a parte su business.google.com, solo se c'è una sede o un'attività idonea, con nome, città e telefono identici al sito.
- `app/sitemap.ts`: costruita dagli stessi dati delle pagine (servizi, casi studio, città indicizzabili); `app/robots.ts`: tutto aperto tranne l'endpoint del form; `app/manifest.ts`; `app/llms.txt/route.ts` (lo studio in testo semplice per gli assistenti AI).
- Le anteprime di Vercel (`VERCEL_ENV=preview`) sono `noindex` e chiuse in robots.txt: non fanno concorrenza al sito vero.
- `next.config.ts`: intestazioni di sicurezza e cache (dati delle stelle un anno, video e anteprime una settimana).

### Dopo il deploy (Google Search Console)

1. Imposta `NEXT_PUBLIC_SITE_URL` su Vercel con il dominio definitivo (canonical, sitemap e dati strutturati lo usano tutti).
2. Aggiungi la proprietà del dominio in Google Search Console e verificala (record DNS).
3. Invia `/sitemap.xml`.
4. Usa *Controllo URL* sulle pagine principali (home, servizi, progetti, casi studio, chi siamo, contatti, Taranto) e richiedi l'indicizzazione.
5. Verifica i dati strutturati con il Test dei risultati multimediali e lo Schema Markup Validator.

## Prestazioni

- Desktop: logo e cervello disegnano a ogni `requestAnimationFrame`, seguendo il refresh del browser (anche 144/165 Hz); velocità e interazione dipendono dal tempo trascorso, non dal numero di frame. Stelle e nebulosa restano a 60 FPS con un timer che conserva le frazioni tra i refresh del monitor. La nebulosa usa un atlas fino a 512 px (256 in lite); le sue prime texture vengono preparate 32 righe per frame, evitando due passate complete all'avvio. Lo sfondo usa risoluzione 1× e preferisce la GPU ad alte prestazioni.
- `node --test app/frame-pacer.test.mjs`: verifica il target a 30/60 FPS su monitor da 60 a 240 Hz, cadence nativa senza frame saltati, ripresa dopo una pausa e cambio del target.

- Three.js e le scene di stelle si caricano dopo la pagina (`import()` dinamico, quando il browser è libero): il JavaScript iniziale della home è sceso da circa 374 a 163 KB compressi. Lighthouse mobile: da 91–94 a 99, LCP da 3,2–3,5 s a 2,0 s.
- Ogni stella è disegnata come un quadratino: viene ritagliato alla sola parte che può accendersi (stesso risultato a vista, molti meno pixel calcolati; nella passata di profondità del cervello quasi cinque volte meno).
- I telefoni modesti (Chrome, 4 GB di memoria o meno) e chi ha attivato il risparmio dati saltano l'apertura e disegnano un terzo di stelle in meno nel cervello (`modestDevice` in `app/quality.ts`); un telefono molto lento durante l'apertura la accelera invece di scattare.
- Favicon e icona Apple ricodificate in toni indicizzati (54 → 10 KB e 13 → 2 KB, identiche a vista).
- Telefoni: partono già sul gradino "lite" (`app/quality.ts`): scene a risoluzione 1x, cielo e GM/cervello a 30 fotogrammi al secondo, cervello con un terzo di stelle in meno, logo dell'header a 15 fotogrammi, nessuna nebulosa. Le scene 3D si caricano solo dopo l'apertura (`afterOpening` in `app/idle.ts`), e in cima alla pagina il livello del GM resta spento finché le stelle non escono dal logo. L'apertura usa il 60% delle stelle.
- Il logo dell'header è `public/gm-logo.webp` (18 KB invece di 170).

- `NEXT_PUBLIC_SITE_URL`: dominio definitivo per canonical, sitemap e dati strutturati (default: astra-local-alpha.vercel.app; quando ci sarà il dominio, impostala su Vercel).

## Misurazione

Oltre alle visite, Vercel Web Analytics riceve tre eventi anonimi (`app/tracking.tsx`), senza cookie e senza dati personali. Gli eventi personalizzati compaiono nella dashboard di Vercel solo con il piano Pro; con il piano Hobby vengono ignorati senza errori.

| Evento | Quando | Proprietà |
| --- | --- | --- |
| `generate_lead` | il modulo è stato inviato davvero (compare il messaggio di conferma) | — |
| `cta_click` | clic su un'azione con `data-cta` | `position` (hero, hero-progetti, header, menu, servizio-sito, servizio-manutenzione, footer, chi-siamo, chi-siamo-finale, servizi, servizio-<slug>, progetti, caso-studio, citta-<slug>, progetto, sito-cliente), `project` per i progetti |
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
