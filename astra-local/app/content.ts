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

// What happens at each stage, said for the client rather than in the trade's words.
export const housePhases = [
  { title: 'Fondamenta', text: 'Obiettivi, pubblico e strategia del tuo sito.' },
  { title: 'Struttura', text: 'Contenuti e percorso di chi visita il sito.' },
  { title: 'Forma', text: 'Design, identità e linguaggio visivo.' },
  { title: 'Dettagli', text: 'Interazioni, animazioni e 3D, dove servono.' },
  { title: 'Risultato', text: 'Un sito che lavora per te: chiaro, veloce, riconoscibile.' },
];

// What we offer: one custom website, and someone who looks after it.
// `price` is shown under the text once filled in, e.g. 'A partire da 2.500 €'
// or '90 € al mese': a figure, even a starting one, answers the first question
// a visitor has. Leave it empty until it is a real price.
export const offers = [
  {
    title: 'Sito web su misura',
    kicker: 'Il progetto',
    price: '',
    text: 'Nessun modello pronto: ogni sito nasce da una consulenza e viene progettato e sviluppato da zero sul tuo progetto.',
    includes: [
      'Consulenza e strategia iniziale',
      'Struttura, contenuti e percorso dell’utente',
      'Design su misura della tua identità',
      'Sviluppo, animazioni e 3D dove servono',
      'Ottimizzato per telefono e velocità',
      'Pubblicazione online',
    ],
    cta: primaryCta,
  },
  {
    title: 'Hosting e manutenzione',
    kicker: 'Dopo il lancio · servizio a pagamento',
    price: '',
    text: 'Ospitiamo il sito, gestiamo il dominio e ce ne prendiamo cura. Il prezzo non è fisso: dipende dalle tue esigenze.',
    includes: [
      'Hosting: il sito sempre online, veloce e sicuro',
      'Registrazione e gestione del dominio',
      'Aggiornamenti tecnici e di sicurezza',
      'Modifiche a testi, immagini e contenuti',
      'Nuove sezioni e funzioni quando servono',
      'Un riferimento diretto per ogni richiesta',
    ],
    cta: 'Chiedi informazioni',
  },
];

// What happens after the form, said before it is sent: nobody should wonder.
export const nextSteps = [
  'Leggiamo la tua richiesta.',
  'Ti ricontattiamo per una prima consulenza.',
  'Ti proponiamo un progetto su misura.',
];

/** A project told in full on its own page, /progetti/<slug>. Facts only:
 *  figures and the client's words appear once they are real and approved. */
export type CaseStudy = {
  slug: string;
  /** The page's title in search results: what was made, for whom, where. */
  seoTitle: string;
  /** Who the client is, in one sentence. */
  client: string;
  place: string;
  sector: string;
  services: string[];
  year?: string;
  /** The page's promise, under the name. */
  headline: string;
  challenge: string;
  idea: string;
  work: string[];
  result: string;
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
    category: 'Gioielleria · Brand experience · Web design',
    description: 'Tre generazioni di orafi a Taranto, dal 1950. Un orologio che prende vita allo scroll racconta la loro precisione e porta ognuno, in pochi secondi, al servizio che cerca.',
    href: 'https://lalingaoro.it',
    preview: '/projects/lalinga',
    study: {
      slug: 'lalinga-oro',
      seoTitle: 'Lalinga Oro: sito web per una gioielleria di Taranto',
      client: 'Gioielleria, orologeria e laboratorio orafo di famiglia, a Taranto dal 1950.',
      place: 'Taranto',
      sector: 'Gioielleria · Orologeria',
      services: ['Strategia e struttura', 'Brand experience', 'Web design', 'Sviluppo e animazioni'],
      headline: 'Tre generazioni di mestiere, in un solo scroll.',
      challenge: 'Una maison di famiglia dal 1950 e sei mestieri diversi: orologi, oreficeria, gioielli, pelletteria, compro oro e un laboratorio interno. Il rischio era un catalogo. Serviva un sito che trasmettesse fiducia e precisione, e che facesse trovare a ognuno la propria strada.',
      idea: 'Una gioielleria vive di precisione e di fiducia: per questo il sito parla la lingua dell’orologeria. Il primo scroll apre un orologio e ne svela il meccanismo, pezzo per pezzo. Come i suoi ingranaggi, i sei servizi della maison lavorano insieme, ognuno al suo posto.',
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
    category: 'Hospitality · Web design · Digital experience',
    description: 'Una residenza sul Lago di Garda, da visitare piano per piano in tre lingue. Un sito che porta gli ospiti a prenotare direttamente dai proprietari, senza commissioni ai portali.',
    href: 'https://www.residenzavedovelli.it',
    preview: '/projects/vedovelli',
    study: {
      slug: 'residenza-vedovelli',
      seoTitle: 'Residenza Vedovelli: sito web per una casa vacanze sul Lago di Garda',
      client: 'Una residenza ricavata da un’antica limonaia a Torri del Benaco, sulla sponda veronese del Lago di Garda.',
      place: 'Torri del Benaco · Lago di Garda',
      sector: 'Hospitality · Affitti brevi',
      services: ['Web design', 'Digital experience', 'Sviluppo', 'Sito in tre lingue'],
      headline: 'La casa sul lago, piano per piano.',
      challenge: 'Tre piani che si prenotano da soli o insieme, ospiti da tutta Europa e portali che trattengono una commissione su ogni notte. Serviva un sito che aiutasse a scegliere la soluzione giusta e desse un motivo per prenotare direttamente.',
      idea: 'Visitare la casa prima di arrivare: la villa, poi i piani uno per uno, il territorio intorno e la voce di chi c’è già stato.',
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
