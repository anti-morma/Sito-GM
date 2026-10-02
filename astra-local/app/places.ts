// Where the studio works: one page, /dove-lavoriamo (app/dove-lavoriamo).
// Present in two cities, open to the whole country: the page must never make
// the studio look bound to a place. No office address is claimed (none is on
// record, see site.street in content.ts): the cities are where we are, not
// premises to visit.

/** The cities the studio is present in. `sameAs` (Wikipedia) tells search
 *  engines which Torino and which Taranto. */
export const cities = [
  { city: 'Torino', sameAs: 'https://it.wikipedia.org/wiki/Torino' },
  { city: 'Taranto', sameAs: 'https://it.wikipedia.org/wiki/Taranto' },
];

/** "Torino e Taranto", for sentences. */
export const cityNames = cities.map((item) => item.city).join(' e ');

export const wherePath = '/dove-lavoriamo';

export const where = {
  title: 'Torino, Taranto e tutta Italia.',
  seoTitle: 'Web design a Torino, Taranto e in tutta Italia',
  description: 'Studio di web design e sviluppo presente a Torino e a Taranto, al lavoro con clienti in tutta Italia: progetti su misura, ovunque tu sia.',
  lead: [
    `Siamo presenti a ${cityNames}, ma lavoriamo con attività, professionisti e aziende in tutta Italia.`,
    'La distanza non è un vincolo: conta capire che cosa deve ottenere il tuo progetto, non il chilometro da cui ci scrivi.',
  ],
  /** Sections in order, each with its own H2 and, on its own line, a link. */
  sections: [
    {
      title: `Presenti a ${cityNames}`,
      text: [
        'A Taranto è nato il nostro primo caso studio: Lalinga Oro, gioielleria di famiglia in via Anfiteatro dal 1950, sei mestieri diversi raccolti in un percorso in cui ognuno trova il suo.',
        'Per un’attività del posto, essere in città vuol dire conoscerne il pubblico e farsi trovare da chi cerca proprio lì: nome, indirizzo e telefono coerenti ovunque, una pagina per ogni servizio, i dati che dicono a Google dove sei.',
      ],
      link: { text: 'Il caso studio di Lalinga Oro', href: '/progetti/lalinga-oro' },
    },
    {
      title: 'In tutta Italia, senza vincoli',
      text: [
        'Residenza Vedovelli è sul Lago di Garda, lontano da entrambe le città: un sito in tre lingue per ospiti da tutta Europa.',
        'Si comincia con una conversazione su che cosa fa la tua attività e che cosa deve ottenere il sito. Poi una proposta su misura, il design pagina per pagina e lo sviluppo, con revisioni condivise sullo schermo e un riferimento diretto in ogni fase.',
      ],
      link: { text: 'Il caso studio di Residenza Vedovelli', href: '/progetti/residenza-vedovelli' },
    },
  ],
};
