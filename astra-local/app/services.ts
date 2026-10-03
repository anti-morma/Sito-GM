// The studio's disciplines, one page each under /servizi/<slug> (app/servizi).
// Everything a service page shows comes from here: a new service is a new
// entry, not a new page to build. Facts only: `projects` names real work in
// content.ts, and says what that discipline did there.

export type Service = {
  slug: string;
  /** Short name: links, menus, breadcrumbs. */
  name: string;
  /** The page's H1. */
  title: string;
  /** Search result title (the layout adds "| GoMore"). */
  seoTitle: string;
  /** Meta description, under 155 characters. */
  description: string;
  /** One line for the lists that link here. */
  summary: string;
  /** The opening paragraphs. */
  lead: string[];
  /** What it covers, each with its practical value. */
  parts: { title: string; text: string }[];
  partsTitle: string;
  /** Our position on it, said plainly. */
  stance?: { title: string; text: string[] };
  /** Real work where this discipline mattered: the project's slug and what it did there. */
  projects: { slug: string; note: string }[];
  /** When there is no client case yet: said, not hidden. */
  noProjects?: string;
  /** A real example that is not a client project (e.g. this very site). */
  example?: { title: string; text: string };
};

export const services: Service[] = [
  {
    slug: 'web-design',
    name: 'Web design',
    title: 'Web design su misura.',
    seoTitle: 'Web design su misura',
    description: 'Web design su misura: architettura dei contenuti, art direction, visual e interaction design, pensati per il telefono e per l’obiettivo del sito.',
    summary: 'Interfacce disegnate sul brand e su chi le usa: dall’architettura dei contenuti alla direzione visiva.',
    lead: [
      'Un sito non dovrebbe adattarsi a un template. Dovrebbe adattarsi al brand, alle persone che lo utilizzano e all’obiettivo che deve raggiungere.',
      'Progettiamo interfacce su misura, dall’architettura dell’informazione alla direzione visiva, costruendo ogni dettaglio intorno all’esperienza.',
    ],
    partsTitle: 'Cosa comprende',
    parts: [
      { title: 'Art direction', text: 'Una direzione visiva che nasce dal carattere del brand: riferimenti, tono, ritmo. È ciò che rende un sito riconoscibile prima ancora di essere letto.' },
      { title: 'Visual design', text: 'Tipografia, colore, immagini e spazi scelti per dare gerarchia: l’occhio deve capire subito che cosa conta di più.' },
      { title: 'Responsive design', text: 'Ogni sezione è ripensata per il telefono, non rimpicciolita. Spesso è lì che arriva la maggior parte delle persone.' },
      { title: 'Design system', text: 'Componenti e regole condivise: il sito resta coerente quando cresce, e ogni pagina nuova costa meno della precedente.' },
      { title: 'Interaction design', text: 'Stati, transizioni, risposte ai gesti: dicono a chi naviga che cosa è successo e che cosa può fare dopo.' },
      { title: 'Design orientato alla conversione', text: 'Il percorso verso il contatto, la prenotazione o la visita è progettato, non lasciato al caso: un’azione principale chiara a ogni passo.' },
    ],
    stance: {
      title: 'Bello non basta',
      text: [
        'Un sito può essere elegante e non far capire che cosa offri. Per questo il design parte dai contenuti e dal percorso, e solo dopo arriva alla forma.',
        'La forma, poi, conta: è il primo segnale di cura che una persona riceve, prima di leggere una riga.',
      ],
    },
    projects: [
      { slug: 'lalinga-oro', note: 'Identità digitale e design di ogni pagina, sul carattere di una maison orafa del 1950.' },
      { slug: 'residenza-vedovelli', note: 'Il design sul carattere di un’antica limonaia affacciata sul Lago di Garda.' },
    ],
  },
  {
    slug: 'sviluppo-web',
    name: 'Sviluppo web',
    title: 'Sviluppo web su misura.',
    seoTitle: 'Sviluppo web su misura',
    description: 'Sviluppo web su misura: siti veloci, responsive e accessibili, scritti per il progetto. Animazioni, integrazioni e SEO tecnica comprese.',
    summary: 'Codice scritto per il progetto: siti veloci, responsive, accessibili e facili da far crescere.',
    lead: [
      'Il design diventa esperienza attraverso il codice.',
      'Sviluppiamo siti e prodotti digitali performanti, responsive e costruiti intorno alle esigenze specifiche del progetto. Nessun tema da adattare: proprio perché il codice nasce per quel sito, può restare leggero.',
    ],
    partsTitle: 'Cosa comprende',
    parts: [
      { title: 'Front-end', text: 'HTML, CSS e JavaScript scritti per il progetto; framework moderni come Next.js e React quando la complessità lo richiede, e solo allora.' },
      { title: 'Performance', text: 'Immagini, font e script caricati quando servono. Un sito veloce viene letto; uno lento viene abbandonato prima di aprirsi.' },
      { title: 'Responsive', text: 'Layout, immagini e interazioni pensati per ogni schermo, dal telefono in verticale al monitor grande.' },
      { title: 'CMS e integrazioni', text: 'Quando i contenuti vanno aggiornati in autonomia, o il sito deve parlare con prenotazioni, moduli e servizi esterni, scegliamo e colleghiamo gli strumenti adatti.' },
      { title: 'Animazioni e interazioni', text: 'Scroll, transizioni e micro-interazioni sviluppate badando al costo di ogni fotogramma, con un’alternativa ferma per chi chiede meno movimento.' },
      { title: 'SEO tecnica e accessibilità', text: 'Struttura semantica, dati strutturati, sitemap, contrasti e navigazione da tastiera: un sito che Google capisce e che tutti possono usare.' },
      { title: 'Web application', text: 'Quando un progetto ha bisogno di più di un sito, un’area riservata, uno strumento, un flusso su misura, lo valutiamo insieme, partendo da ciò che deve risolvere.' },
    ],
    projects: [
      { slug: 'lalinga-oro', note: 'Codice su misura, senza CMS né framework: leggero e pensato prima di tutto per il telefono.' },
      { slug: 'residenza-vedovelli', note: 'Un sito in tre lingue, veloce, con la prenotazione diretta sempre a portata di mano.' },
    ],
  },
  {
    slug: 'ux-ui',
    name: 'UX/UI design',
    title: 'UX/UI design.',
    seoTitle: 'UX/UI design',
    description: 'UX/UI design: architettura dell’informazione, percorsi e interfacce che riducono attrito e dubbi, perché le persone capiscano, scelgano e agiscano.',
    summary: 'Percorsi e interfacce che riducono attrito e dubbi: capire, scegliere, agire.',
    lead: [
      'Una buona interfaccia non deve soltanto essere bella. Deve essere comprensibile.',
      'Studiamo come le persone percepiscono, navigano e scelgono, per ridurre attrito e rendere ogni interazione più naturale.',
    ],
    partsTitle: 'I principi, e a che cosa servono',
    parts: [
      { title: 'Architettura dell’informazione', text: 'Prima di disegnare decidiamo che cosa c’è e dove: contenuti raggruppati come li cercano le persone, non come sono organizzati internamente.' },
      { title: 'User flow', text: 'Il percorso dalla prima pagina all’azione: quanti passaggi, quale dubbio a ogni passo, dove qualcuno si ferma e perché.' },
      { title: 'Affordance', text: 'Un pulsante deve sembrare un pulsante. Ciò che si può toccare, aprire o trascinare deve dirlo da solo, senza istruzioni.' },
      { title: 'Carico cognitivo', text: 'Ogni elemento in più chiede attenzione. Togliamo ciò che non aiuta a capire o a scegliere.' },
      { title: 'Legge di Hick', text: 'Più opzioni rendono la scelta più lenta: per questo un’azione principale per schermata, e le alternative raggruppate.' },
      { title: 'Legge di Fitts', text: 'Ciò che si usa spesso deve essere grande e a portata: pulsanti comodi da toccare, soprattutto con il pollice, sul telefono.' },
      { title: 'Legge di Jakob', text: 'Le persone passano la maggior parte del tempo su altri siti. Dove conta, rispettiamo le convenzioni che conoscono già; innoviamo dove porta valore.' },
      { title: 'Accessibilità', text: 'Contrasti leggibili, navigazione da tastiera, testi alternativi, meno movimento per chi lo chiede: un sito accessibile è più chiaro per tutti.' },
      { title: 'Conversione', text: 'Ogni principio serve a una cosa: rendere più facile il passo che conta, che sia una richiesta, una prenotazione o una visita.' },
    ],
    projects: [
      { slug: 'residenza-vedovelli', note: 'Un percorso semplice per scegliere tra la villa intera e i singoli piani, e arrivare alla prenotazione in pochi passaggi.' },
      { slug: 'lalinga-oro', note: 'Sei servizi diversi ordinati in un percorso in cui ognuno trova subito il suo.' },
    ],
  },
  {
    slug: '3d-webgl',
    name: '3D e WebGL',
    title: '3D, WebGL e interactive experiences.',
    seoTitle: '3D, WebGL e interactive experiences',
    description: '3D, WebGL e interazioni avanzate per il web, quando aggiungono valore: racconti allo scroll, prodotti e spazi da esplorare, sempre leggeri.',
    summary: '3D, WebGL e motion quando aiutano a capire o a ricordare, mai solo per stupire.',
    lead: [
      'Il 3D non è decorazione. Può diventare parte dell’esperienza, del racconto e della comprensione di un prodotto o di un brand.',
      'Utilizziamo 3D, WebGL e interazioni avanzate quando aggiungono un valore reale.',
    ],
    partsTitle: 'Dove ha senso',
    parts: [
      { title: 'Racconto', text: 'Un oggetto che si scompone, uno spazio che si costruisce: il 3D può spiegare in pochi secondi ciò che un testo racconta in un paragrafo.' },
      { title: 'Prodotti e spazi', text: 'Un prodotto da girare tra le mani, un luogo da attraversare prima di visitarlo.' },
      { title: 'Scroll e motion', text: 'Animazioni legate allo scroll: è la persona a decidere il ritmo, e la storia avanza con lei.' },
      { title: 'Performance', text: 'Scene caricate dopo la pagina, qualità che si adatta al dispositivo, un’alternativa ferma con il movimento ridotto: l’effetto non deve rallentare chi legge.' },
    ],
    stance: {
      title: 'Quando non serve',
      text: [
        'Se un’immagine o un video dicono la stessa cosa con meno peso, scegliamo l’immagine o il video.',
        'Una scena 3D costa: in tempo di sviluppo, in dati da scaricare, in batteria. Ha senso quando restituisce più di quanto chiede.',
      ],
    },
    example: {
      title: 'Lo vedi su questo sito',
      text: 'Il monogramma GM in apertura e il cervello che ruota prima del modulo contatti sono disegnati da migliaia di stelle in WebGL (Three.js). Le scene si caricano dopo la pagina, scendono di qualità sui dispositivi più lenti e si fermano con il movimento ridotto.',
    },
    projects: [
      { slug: 'lalinga-oro', note: 'Motion su misura: al primo scroll un orologio si apre e svela il suo meccanismo, pezzo per pezzo.' },
    ],
  },
  {
    slug: 'ai',
    name: 'AI',
    title: 'AI e creative technology.',
    seoTitle: 'AI e creative technology',
    description: 'AI e creative technology integrate nei progetti web quando migliorano contenuti, processi, personalizzazione o interazione. Senza promesse automatiche.',
    summary: 'L’intelligenza artificiale come strumento: dove migliora contenuti, processi o interazione.',
    lead: [
      'L’intelligenza artificiale è uno strumento.',
      'La integriamo nei progetti quando può migliorare contenuti, processi, personalizzazione o interazione. Altrimenti, no.',
    ],
    partsTitle: 'Dove può aiutare',
    parts: [
      { title: 'Contenuti', text: 'Bozze, varianti, traduzioni, adattamenti: l’AI accelera il lavoro, le persone decidono che cosa pubblicare.' },
      { title: 'Processi', text: 'Attività ripetitive, come smistare richieste, preparare riepiloghi, ordinare informazioni, dove un modello fa risparmiare tempo senza togliere controllo.' },
      { title: 'Personalizzazione', text: 'Contenuti o percorsi che si adattano a chi visita il sito, quando i dati lo permettono e la privacy lo consente.' },
      { title: 'Interazione', text: 'Assistenti e interfacce conversazionali, solo se rispondono meglio di una pagina ben scritta.' },
      { title: 'Farsi capire dagli assistenti', text: 'Sempre più persone chiedono a un assistente AI chi può aiutarle. Testi chiari e dati strutturati aiutano anche lui a capire chi sei.' },
      { title: 'Creative technology', text: 'Immagini, suoni e interazioni sperimentali al servizio di un’idea, non della novità.' },
    ],
    stance: {
      title: 'Che cosa non promettiamo',
      text: [
        'Nessun risultato automatico. Un modello sbaglia, va guidato e verificato: per questo lo integriamo solo dove si può controllare che cosa produce e misurare se aiuta.',
      ],
    },
    example: {
      title: 'Lo vedi su questo sito',
      text: 'Oltre ai dati strutturati, questo sito pubblica un riassunto dello studio in testo semplice pensato per gli assistenti AI (llms.txt), generato dagli stessi contenuti delle pagine.',
    },
    projects: [],
    noProjects: 'Non abbiamo ancora un caso studio pubblicato su questo tema. Preferiamo dirlo che riempire lo spazio.',
  },
];

export const servicePath = (service: Service) => `/servizi/${service.slug}`;
export const findService = (slug: string) => services.find((service) => service.slug === slug);
