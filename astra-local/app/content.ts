// All site copy and the few details only the studio can provide.
// Empty strings are simply not rendered: fill them in to show them.

export const site = {
  name: 'GoMore',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://astra-local-alpha.vercel.app',
  // Contacts: the contact section, the footer and the phone menu.
  /** Public contact e-mail, e.g. 'ciao@gomore.it'. */
  email: '',
  /** Phone as it should read, e.g. '+39 333 123 4567' (the link dials the digits). */
  phone: '',
  // Legal details: the footer, the phone menu and the privacy policy
  // (an Italian business site must show its P.IVA).
  /** Ragione sociale, e.g. 'GoMore S.r.l.' or 'Mario Rossi'. */
  legalName: '',
  /** Partita IVA, digits only, e.g. '01234567890'. */
  vat: '',
  /** Sede legale, e.g. 'Via Roma 1, 20100 Milano (MI)'. */
  address: '',
  /** Posta elettronica certificata, e.g. 'gomore@pec.it'. */
  pec: '',
  // Local search (Google, Maps, AI answers): where the studio works from.
  // Filled in, the city appears in the footer and in the data Google reads,
  // and pairs with the studio's Google Business Profile (README, *SEO*).
  /** City, e.g. 'Taranto'. */
  city: '',
  /** Province or region, e.g. 'TA' or 'Puglia'. */
  region: '',
  /** Postcode, e.g. '74123'. */
  postalCode: '',
  /** Street and number of a place clients can visit, e.g. 'Via Roma 1'.
   *  Leave empty if the studio works without a public office. */
  street: '',
  /** Public profiles, full addresses: Instagram, LinkedIn, Behance, Google Business Profile… */
  profiles: [] as string[],
  // Promises the studio can keep: shown beside the form and in the message
  // after sending, the moment a visitor wonders "and now?".
  /** How soon a request gets an answer, e.g. '2 giorni lavorativi' ("Ti rispondiamo entro …"). */
  responseTime: '',
};

/** The site's one main action, with the same name at every step: the buttons,
 *  the form's submit and the message after it. */
export const primaryCta = 'Richiedi una consulenza';

/** Where clients come from: the studio works with all of Italy. */
export const areaServed = 'Italia';

// What we offer: one custom website, and someone who looks after it.
// `price` is shown under the text once filled in, e.g. 'A partire da 2.500 €'
// or '90 € al mese': a figure, even a starting one, answers the first question
// a visitor has. Leave it empty until it is a real price.
export const offers = [
  {
    title: 'Sito web su misura',
    kicker: 'Il progetto',
    price: '',
    monthlyFrom: 0,
    text: 'Nessun modello pronto: ogni sito nasce da una consulenza e viene progettato e sviluppato da zero sul tuo progetto.',
    includes: [
      'Consulenza e strategia iniziale',
      'Struttura, contenuti e percorso dell’utente',
      'Design su misura',
      'Sviluppo, animazioni e 3D',
      'Ottimizzato per tutti i dispositivi',
      'Due revisioni del progetto',
    ],
    cta: primaryCta,
  },
  {
    title: 'Hosting e manutenzione',
    kicker: 'Dopo il lancio',
    price: 'A partire da 19,99 € al mese',
    /** The same price as a number, for the structured data (seo.ts). */
    monthlyFrom: 19.99,
    text: 'Ospitiamo il sito, gestiamo il dominio e ce ne prendiamo cura, con un prezzo che segue le tue esigenze.',
    includes: [
      'Hosting: il sito sempre online, veloce e sicuro',
      'Registrazione e gestione del dominio',
      'Gestione DNS e record',
      'Aggiornamenti tecnici e di sicurezza',
      'Modifiche a testi, immagini e contenuti',
    ],
    cta: 'Chiedi informazioni',
  },
];

// "Chi siamo" (app/chi-siamo): the two founders, as they are. No portraits
// until real ones exist: the page is typographic on purpose.
export const founders = [
  {
    name: 'Ludovico Gusmano',
    role: 'Strategy · UX/UI · Business',
    text: 'Ideatore di ogni progetto, dalla prima idea al sito online. Strategia, user experience, user interface e user flow; psicologia del consumatore e principi di persuasione; gerarchia visiva, carico cognitivo e leggi della UX; business, economia e finanza. Definisce obiettivi, struttura e identità del sito: come le persone lo percepiscono, come si muovono e cosa le porta a scegliere.',
    knowsAbout: ['Strategia digitale', 'UX design', 'UI design', 'User flow', 'Psicologia del consumatore', 'Business', 'Economia e finanza'],
  },
  {
    name: 'Alessandro Mormandi',
    role: 'Development · 3D · Creative Technology',
    text: 'Struttura e architettura tecnologica del sito, sviluppo e scrittura del codice, front-end, performance, 3D e WebGL, animazioni e interazioni. Trasforma il progetto in un sito veloce, solido e curato in ogni dettaglio.',
    knowsAbout: ['Sviluppo web', 'Front-end', 'Performance web', '3D e WebGL', 'Creative technology'],
  },
];

// How the studio thinks: five sides of every project (chi-siamo).
export const principles = [
  { title: 'Psicologia', text: 'Capire come le persone percepiscono, scelgono e agiscono.' },
  { title: 'UX', text: 'Ridurre attrito, confusione e passaggi inutili.' },
  { title: 'Design', text: 'Trasformare strategia e identità in un’esperienza visiva coerente.' },
  { title: 'Tecnologia', text: 'Usare codice, 3D, WebGL e AI quando aggiungono un valore reale, non per stupire.' },
  { title: 'Business', text: 'Costruire un’esperienza che non sia solo bella, ma utile all’obiettivo.' },
];

// What happens after the form, said before it is sent: nobody should wonder.
export const nextSteps = [
  'Leggiamo la tua richiesta.',
  'Ti ricontattiamo per una prima consulenza.',
  'Ti proponiamo un progetto su misura.',
];

/** A project told in full on its own page, /progetti/<slug>: the same model
 *  for every case study, PROBLEM → DECISION → SOLUTION → EXPERIENCE. Facts
 *  only: an optional chapter left empty is simply not shown, and figures and
 *  the client's words appear once they are real and approved. */
export type CaseStudy = {
  slug: string;
  /** The page's title in search results (the layout adds "| GoMore"), under ~50 characters. */
  seoTitle: string;
  /** Meta description, under 155 characters. */
  seoDescription: string;
  /** Who the client is, in one sentence. */
  client: string;
  place: string;
  sector: string;
  services: string[];
  year?: string;
  /** The page's promise, under the name. */
  headline: string;
  /** The project in a few lines: what was made, how big. */
  overview: string;
  /** The problem. */
  challenge: string;
  goals?: string[];
  /** The decision: the idea the whole site follows. */
  idea: string;
  strategy?: string;
  ux?: string;
  design?: string;
  technology?: string[];
  /** 3D, motion, interactive elements. */
  motion?: string;
  mobile?: string;
  seo?: string[];
  /** Deliverables. */
  work: string[];
  result: string;
  /** Service pages this project shows (services.ts slugs). */
  serviceSlugs: string[];
  /** Real, verifiable figures only, e.g. { value: '+40%', label: 'richieste dal sito in sei mesi' }. */
  metrics?: { value: string; label: string }[];
  /** The client's own words, with their approval. */
  quote?: { text: string; author: string; role: string };
};

export type Project = {
  name: string;
  category: string;
  description: string;
  /** Live site, opened in a new tab. */
  href?: string;
  /** The case study: the project's own page on this site. */
  study?: CaseStudy;
  /** Base path of the scrolling homepage preview under /public:
   *  `${preview}-poster.jpg`, `${preview}-{720,1280}.{webm,mp4}`, and the portrait
   *  mobile recording `${preview}-m-poster.jpg`, `${preview}-m-720.{webm,mp4}`. */
  preview?: string;
  /** Static image under /public, used when there is no preview video. */
  image?: string;
};

// Real projects only. Previews are recordings of each live homepage scrolling.
export const projects: Project[] = [
  {
    name: 'Lalinga Oro',
    category: 'Gioielleria · Taranto',
    description: 'Tre generazioni di orafi a Taranto, dal 1950. Un orologio che prende vita allo scroll racconta la loro precisione e porta ognuno, in pochi secondi, al servizio che cerca.',
    href: 'https://lalingaoro.it',
    preview: '/projects/lalinga',
    study: {
      slug: 'lalinga-oro',
      seoTitle: 'Lalinga Oro, gioielleria a Taranto: caso studio',
      seoDescription: 'Il sito di Lalinga Oro, gioielleria di famiglia a Taranto dal 1950: sei mestieri in un solo percorso e un orologio che si apre allo scroll.',
      client: 'Gioielleria, orologeria e laboratorio orafo di famiglia, a Taranto dal 1950.',
      place: 'Taranto',
      sector: 'Gioielleria · Orologeria',
      services: ['Strategia e struttura', 'Brand experience', 'Web design', 'Sviluppo e animazioni'],
      headline: 'Tre generazioni di mestiere, in un solo scroll.',
      overview: 'Un sito nuovo per una gioielleria, orologeria e laboratorio orafo di famiglia, in via Anfiteatro a Taranto dal 1950. Nove pagine: una per ciascuno dei sei mestieri della maison, la sua storia e i contatti.',
      challenge: 'Una maison di famiglia dal 1950 e sei mestieri diversi: orologi, oreficeria, gioielli, pelletteria, compro oro e un laboratorio interno. Il rischio era un catalogo. Serviva un sito che trasmettesse fiducia e precisione, e che facesse trovare a ognuno la propria strada.',
      goals: [
        'Trasmettere la fiducia e la precisione di settant’anni di mestiere.',
        'Far trovare a ognuno, in pochi secondi, il servizio che cerca.',
        'Portare le persone dallo schermo alla vetrina di via Anfiteatro.',
      ],
      idea: 'Una gioielleria vive di precisione e di fiducia: per questo il sito parla la lingua dell’orologeria. Il primo scroll apre un orologio e ne svela il meccanismo, pezzo per pezzo. Come i suoi ingranaggi, i sei servizi della maison lavorano insieme, ognuno al suo posto.',
      strategy: 'Sei mestieri, sei porte d’ingresso. Invece di un catalogo unico, ogni servizio ha una pagina sua, raggiungibile dalla prima schermata: chi cerca un orologio non deve attraversare il compro oro per trovarlo.',
      ux: 'Dopo l’apertura la home presenta i sei servizi, numerati da 01 a 06: per ciascuno una riga che dice che cosa offre e un link alla sua pagina. Indirizzo e telefono sono nel menu e in fondo alla pagina, a un tocco da chi è già pronto a passare in negozio.',
      design: 'Il carattere di una maison del 1950, senza nostalgia: due caratteri tipografici di impronta classica, Italiana e Cormorant Garamond, e un racconto che prende il ritmo preciso dell’orologeria.',
      technology: [
        'HTML, CSS e JavaScript scritti su misura: nessun CMS, nessun tema, nessun framework',
        'Caratteri tipografici ospitati sul sito, senza servizi esterni',
        'L’apertura disegnata su un canvas e guidata dallo scroll',
      ],
      motion: 'Al primo scroll un orologio si apre e svela il suo meccanismo, pezzo per pezzo: un’animazione disegnata e programmata su misura, che avanza al ritmo di chi scorre.',
      mobile: 'Pensato prima di tutto per il telefono: dal menu, indirizzo e numero della boutique sono sempre a un tocco.',
      seo: [
        'Titolo e descrizione costruiti sulla ricerca locale: «Gioielleria a Taranto dal 1950»',
        'Una pagina per ciascun servizio, perché ognuno possa essere trovato per ciò che offre',
        'Dati strutturati da gioielleria (JewelryStore) con indirizzo, orari, telefono e dati aziendali',
        'Sitemap e robots.txt per guidare l’indicizzazione',
      ],
      // The clock is motion on a 2D canvas, not WebGL: the 3D page cites it as motion only.
      serviceSlugs: ['web-design', 'sviluppo-web', 'ux-ui'],
      work: [
        'Un sito nuovo, progettato e sviluppato da zero: nessun tema, nessun modello già pronto',
        'Strategia e architettura dei contenuti: sei servizi diversi ordinati in un percorso chiaro, in cui ognuno trova subito il suo',
        'Identità digitale e design di ogni pagina, dal primo schizzo all’ultimo dettaglio, sul carattere di una maison del 1950',
        'L’apertura animata: un orologio che si scompone allo scroll, disegnata e programmata su misura',
        'Il racconto della famiglia e del laboratorio orafo, i marchi trattati, i contatti diretti e la mappa per arrivare in negozio',
        'Sviluppo del codice su misura, veloce e leggero, pensato prima di tutto per il telefono',
      ],
      result: 'Settant’anni di mestiere orafo, raccontati con la stessa cura con cui nasce un gioiello. Un’esperienza all’altezza della maison, che accompagna ogni cliente dallo schermo alla vetrina.',
    },
  },
  {
    name: 'Residenza Vedovelli',
    category: 'Casa vacanze · Lago di Garda',
    description: 'Una residenza sul Lago di Garda, da visitare piano per piano in tre lingue. Un sito che porta gli ospiti a prenotare direttamente dai proprietari, senza commissioni ai portali.',
    href: 'https://www.residenzavedovelli.it',
    preview: '/projects/vedovelli',
    study: {
      slug: 'residenza-vedovelli',
      seoTitle: 'Residenza Vedovelli, Lago di Garda: caso studio',
      seoDescription: 'Il sito di Residenza Vedovelli, sul Lago di Garda: la casa piano per piano, in tre lingue, con la prenotazione diretta senza commissioni.',
      client: 'Una residenza ricavata da un’antica limonaia a Torri del Benaco, sulla sponda veronese del Lago di Garda.',
      place: 'Torri del Benaco · Lago di Garda',
      sector: 'Hospitality · Affitti brevi',
      services: ['Web design', 'Digital experience', 'Sviluppo', 'Sito in tre lingue'],
      headline: 'La casa sul lago, piano per piano.',
      overview: 'Il sito di una residenza ricavata da un’antica limonaia a Torri del Benaco: la villa intera e i suoi tre piani, prenotabili insieme o da soli, raccontati in italiano, inglese e tedesco.',
      challenge: 'Tre piani che si prenotano da soli o insieme, ospiti da tutta Europa e portali che trattengono una commissione su ogni notte. Serviva un sito che aiutasse a scegliere la soluzione giusta e desse un motivo per prenotare direttamente.',
      goals: [
        'Aiutare a scegliere la soluzione giusta, tra la villa intera e i singoli piani.',
        'Dare un motivo per prenotare direttamente, senza le commissioni dei portali.',
        'Parlare agli ospiti da tutta Europa nella loro lingua.',
      ],
      idea: 'Visitare la casa prima di arrivare: la villa, poi i piani uno per uno, il territorio intorno e la voce di chi c’è già stato.',
      ux: 'Un percorso semplice per scegliere tra la villa intera e i singoli piani e arrivare alla prenotazione in pochi passaggi. La prenotazione diretta resta sempre a portata di mano.',
      design: 'Il carattere di un’antica limonaia affacciata sul lago: la casa raccontata spazio per spazio, dal piano terra alla mansarda.',
      technology: [
        'Sviluppo su misura, senza modelli già pronti',
        'Tre lingue: italiano, inglese e tedesco',
        'Recensioni degli ospiti collegate a quelle verificate',
      ],
      mobile: 'Sviluppato su misura, veloce e pensato prima di tutto per il telefono.',
      serviceSlugs: ['web-design', 'sviluppo-web', 'ux-ui'],
      work: [
        'Un sito progettato e sviluppato da zero, su misura per la casa e per chi la sceglie',
        'User experience: un percorso semplice per scegliere tra la villa intera e i singoli piani e arrivare alla prenotazione in pochi passaggi',
        'Architettura dei contenuti e design, sul carattere di un’antica limonaia affacciata sul lago',
        'La casa raccontata spazio per spazio: una pagina per la villa e una per ogni piano, dal piano terra alla mansarda',
        'Il territorio e i consigli dell’host: dove mangiare, cosa vedere, come muoversi sul lago',
        'Le recensioni degli ospiti, collegate a quelle verificate',
        'Tre lingue, italiano, inglese e tedesco, per gli ospiti da tutta Europa',
        'La prenotazione diretta sempre a portata di mano, senza commissioni ai portali',
        'Sviluppo su misura, veloce e pensato prima di tutto per il telefono',
      ],
      result: 'Gli ospiti prenotano direttamente dal sito, senza passare dai portali. Per i proprietari significa nessuna commissione: ogni soggiorno rende di più.',
    },
  },
];

/** The projects that have their own page, in the portfolio's order. */
export const caseStudies = projects.filter((project): project is Project & { study: CaseStudy } => !!project.study);
