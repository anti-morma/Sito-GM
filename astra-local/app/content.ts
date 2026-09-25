// All site copy and the few details only the studio can provide.
// Empty strings are simply not rendered: fill them in to show them.

export const site = {
  name: 'GoMore',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://sito-gm-one.vercel.app',
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
};

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

export type Project = {
  name: string;
  category: string;
  description: string;
  /** Live site or case study, opened in a new tab. */
  href?: string;
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
  },
  {
    name: 'Residenza Vedovelli',
    category: 'Hospitality · Web design · Digital experience',
    description: 'Una residenza a Torri del Benaco, sul Lago di Garda: la villa, i singoli piani, il territorio, le recensioni degli ospiti e i consigli dell’host.',
    href: 'https://www.residenzavedovelli.it',
    preview: '/projects/vedovelli',
  },
];
