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
};

/** Where clients come from: the studio works with all of Italy. */
export const areaServed = 'Italia';

export const housePhases = [
  { title: 'Fondamenta', text: 'Strategia, obiettivi e direzione.' },
  { title: 'Struttura', text: "Architettura, UX e percorso dell'utente." },
  { title: 'Forma', text: 'Design, identità e linguaggio visivo.' },
  { title: 'Dettagli', text: 'Interazioni, 3D, motion e AI.' },
  { title: 'Risultato', text: 'Un sito che lavora per te: chiaro, veloce, riconoscibile.' },
];

// What we offer: one custom website, and someone who looks after it.
export const offers = [
  {
    title: 'Sito web su misura',
    kicker: 'Il progetto',
    text: 'Nessun modello pronto: ogni sito nasce da una consulenza e viene progettato e sviluppato da zero sul tuo progetto.',
    includes: [
      'Consulenza e strategia iniziale',
      'Struttura, contenuti e percorso dell’utente',
      'Design su misura della tua identità',
      'Sviluppo, animazioni e 3D dove servono',
      'Ottimizzato per telefono e velocità',
      'Pubblicazione online',
    ],
    cta: 'Richiedi una consulenza',
  },
  {
    title: 'Manutenzione',
    kicker: 'Dopo il lancio · servizio a pagamento',
    text: 'Il sito non si ferma alla messa online. Ce ne occupiamo noi, così resta sicuro, aggiornato e al passo con la tua attività.',
    includes: [
      'Aggiornamenti tecnici e di sicurezza',
      'Modifiche a testi, immagini e contenuti',
      'Nuove sezioni e funzioni quando servono',
      'Un riferimento diretto per ogni richiesta',
    ],
    cta: 'Chiedi informazioni',
  },
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
    description: 'Una gioielleria di Taranto dal 1950. In apertura un orologio si scompone con lo scroll e introduce i sei servizi della maison.',
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
      idea: 'Il linguaggio dell’orologeria: la precisione. In apertura un orologio si scompone pezzo dopo pezzo con lo scroll e, ingranaggio dopo ingranaggio, introduce i sei servizi della maison.',
      work: [
        'Architettura dei contenuti costruita attorno ai sei servizi',
        'Apertura animata allo scroll: l’orologio che si scompone',
        'Il racconto della famiglia e del laboratorio orafo',
        'I marchi trattati, i contatti diretti e la mappa per raggiungere il negozio',
        'Un’esperienza pensata anche per il telefono',
      ],
      result: 'Un sito che si riconosce al primo scroll: la storia della famiglia, i sei servizi e la strada più breve per arrivare in negozio, in un’unica esperienza.',
    },
  },
  {
    name: 'Residenza Vedovelli',
    category: 'Hospitality · Web design · Digital experience',
    description: 'Una residenza a Torri del Benaco, sul Lago di Garda: la villa, i singoli piani, il territorio, le recensioni degli ospiti e i consigli dell’host.',
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
        'Una pagina per la villa intera e una per ogni piano: terra, primo piano, mansarda',
        'Le recensioni degli ospiti, con il collegamento a quelle verificate',
        'I consigli dell’host: dove mangiare, cosa vedere, come muoversi',
        'Italiano, inglese e tedesco',
        'La richiesta di prenotazione diretta, sempre a portata di mano',
      ],
      result: 'Gli ospiti trovano in un solo posto la casa, il piano adatto a loro e il lago intorno, e sanno che possono prenotare direttamente.',
    },
  },
];

/** The projects that have their own page, in the portfolio's order. */
export const caseStudies = projects.filter((project): project is Project & { study: CaseStudy } => !!project.study);
