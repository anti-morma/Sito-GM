// Every piece of copy that still needs real content lives here.
// Replace the bracketed placeholders; nothing below is invented client data.

export const brainMessages = [
  "Un'idea",
  'Prende forma',
  'Trova una direzione',
  'Diventa esperienza',
  'Prende vita',
];

export const housePhases = [
  { title: 'Fondamenta', text: 'Strategia, obiettivi e direzione.' },
  { title: 'Struttura', text: "Architettura, UX e percorso dell'utente." },
  { title: 'Forma', text: 'Design, identità e linguaggio visivo.' },
  { title: 'Dettagli', text: 'Interazioni, 3D, motion e AI.' },
  { title: 'Risultato', text: "Un'esperienza digitale progettata intorno al progetto e alle persone che vuoi raggiungere." },
];

export const services = [
  { title: 'Consulenza & strategia', text: 'Prima di progettare, definiamo direzione, obiettivi, pubblico e priorità del progetto.' },
  { title: 'Web design & sviluppo', text: 'Progettiamo e sviluppiamo siti su misura, chiari, performanti e costruiti intorno al tuo progetto.' },
  { title: 'UX & conversione', text: "Strutturiamo contenuti, percorsi e interazioni per guidare l'utente verso l'azione." },
  { title: '3D · motion & AI', text: "Introduciamo 3D, animazioni, motion e AI quando possono rendere l'esperienza realmente più distintiva." },
  { title: 'Evoluzione & manutenzione', text: 'Continuiamo a supportare il progetto dopo la pubblicazione, quando servono interventi, aggiornamenti o evoluzioni.' },
];

export type Project = {
  name: string;
  category: string;
  description: string;
  /** Live site or case study, opened in a new tab. */
  href?: string;
  /** Base path of the scrolling homepage preview under /public:
   *  `${preview}-poster.jpg`, `${preview}-{720,1280}.{webm,mp4}`. */
  preview?: string;
  /** Static image under /public, used when there is no preview video. */
  image?: string;
};

// Real projects only. Previews are recordings of each live homepage scrolling.
export const projects: Project[] = [
  {
    name: 'Lalinga Oro',
    category: 'Gioielleria · Brand experience · Web design',
    description: 'Il sito della gioielleria di Taranto, dal 1950: un orologio che si scompone con lo scroll introduce orologi, oreficeria, gioielli, pelletteria, compro oro e laboratorio.',
    href: 'https://lalingaoro.it',
    preview: '/projects/lalinga',
  },
  {
    name: 'Residenza Vedovelli',
    category: 'Hospitality · Web design · Digital experience',
    description: 'Il sito della residenza a Torri del Benaco, sul Lago di Garda: la villa intera, i singoli piani, il territorio, le recensioni degli ospiti e i consigli dell’host.',
    href: 'https://www.residenzavedovelli.it',
    preview: '/projects/vedovelli',
  },
];

export type Testimonial = { quote: string; name: string; company: string; role?: string; placeholder?: boolean };

export const testimonials: Testimonial[] = [
  { quote: '[Citazione del cliente da inserire — testimonianza principale]', name: '[Nome Cognome]', company: '[Azienda / progetto]', role: '[Ruolo]', placeholder: true },
  { quote: '[Citazione del cliente da inserire]', name: '[Nome Cognome]', company: '[Azienda / progetto]', role: '[Ruolo]', placeholder: true },
  { quote: '[Citazione del cliente da inserire]', name: '[Nome Cognome]', company: '[Azienda / progetto]', role: '[Ruolo]', placeholder: true },
];

export const vision = '[TESTO VISION DA INSERIRE]';
export const mission = '[TESTO MISSION DA INSERIRE]';
