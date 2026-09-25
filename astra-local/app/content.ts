// All site copy and the few details only the studio can provide.
// Empty strings are simply not rendered: fill them in to show them.

export const site = {
  name: 'GoMore',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://sito-gm-one.vercel.app',
  /** Public contact e-mail, shown in the contact section and footer. */
  email: '',
  /** Legal details for the footer and the privacy policy (Italian law requires P.IVA). */
  legalName: '',
  vat: '',
  address: '',
};

export const brainMessages = [
  "Un'idea",
  'Prende forma',
  'Prende vita',
];

export const housePhases = [
  { title: 'Fondamenta', text: 'Strategia, obiettivi e direzione.' },
  { title: 'Struttura', text: "Architettura, UX e percorso dell'utente." },
  { title: 'Forma', text: 'Design, identità e linguaggio visivo.' },
  { title: 'Dettagli', text: 'Interazioni, 3D, motion e AI.' },
  { title: 'Risultato', text: 'Un sito che lavora per te: chiaro, veloce, riconoscibile.' },
];

export const services = [
  { title: 'Strategia', text: 'Obiettivi, pubblico e priorità, chiariti prima di disegnare una sola pagina.' },
  { title: 'Web design & sviluppo', text: 'Siti su misura, veloci e curati in ogni dettaglio, dal primo schizzo al codice.' },
  { title: 'UX & conversione', text: 'Contenuti e percorsi pensati per portare chi visita a contattarti.' },
  { title: '3D, motion & AI', text: 'Solo dove rendono l’esperienza più chiara e memorabile, mai come effetto.' },
  { title: 'Evoluzione & supporto', text: 'Aggiornamenti, manutenzione e nuove funzioni anche dopo il lancio.' },
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
