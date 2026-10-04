import type { Project } from '../../content';
import CaseStory, { Blocks, Built, Goals, Manifesto, Names, Pair, Part, Phone, Proof, Prose, Result, Statement, type Story } from './case-story';

/** Residenza Vedovelli's case study, told as a story (case-story.tsx), the
 *  same way as Lalinga Oro's. Facts only: no figures, bookings or results
 *  that are not real. */
export const VEDOVELLI: Story = {
  intro: [
    'Una residenza ricavata da un’antica limonaia a Torri del Benaco, sulla sponda veronese del Lago di Garda.',
    'La villa intera o i suoi tre piani, prenotabili insieme o separatamente.',
    'Il progetto nasce per trasformare una casa in un’esperienza da scoprire prima ancora di arrivare.',
  ],
  meta: [
    ['Cliente', 'Residenza privata · Hospitality'],
    ['Dove', 'Torri del Benaco · Lago di Garda'],
    ['Settore', 'Hospitality · Affitti brevi'],
    ['Il nostro lavoro', 'Strategia · UX · Web design · Sviluppo · Multilingua'],
  ],
  path: [
    { id: 'punto-di-partenza', label: 'Il punto di partenza' },
    { id: 'la-scelta', label: 'La scelta' },
    { id: 'esperienza', label: 'L’esperienza' },
    { id: 'direzione-visiva', label: 'La direzione visiva' },
    { id: 'tecnologia', label: 'Tecnologia' },
    { id: 'tre-lingue', label: 'Tre lingue' },
    { id: 'mobile', label: 'Mobile' },
    { id: 'risultato', label: 'Il risultato' },
    { id: 'cosa-abbiamo-costruito', label: 'Cosa abbiamo costruito' },
  ],
};

export default function ResidenzaVedovelli({ project, index, total }: { project: Project; index: number; total: number }) {
  return (
    <CaseStory project={project} index={index} total={total} story={VEDOVELLI}>
      {/* What the client had, and the problem in it. */}
      <Part id="punto-di-partenza" title="Il punto di partenza">
        <Statement
          text="Una casa, tre piani e più modi di viverla."
          turn="La villa può essere prenotata interamente oppure piano per piano."
        />
        <Prose after lines={['Gli ospiti arrivano da paesi diversi e spesso scoprono la struttura per la prima volta online.']} />
        <Prose
          after
          strong="La sfida era rendere immediata una scelta che, sulla carta, poteva sembrare complessa."
          lines={['E allo stesso tempo dare alla prenotazione diretta un valore sufficiente per preferirla ai grandi portali.']}
        />
      </Part>
      <Goals chapter="punto-di-partenza" items={[
        { word: 'Chiarezza', text: 'Rendere immediata la scelta tra villa intera e singoli piani.' },
        { word: 'Prima dell’arrivo', text: 'Far percepire la casa prima ancora dell’arrivo.' },
        { word: 'Fiducia', text: 'Costruire fiducia attraverso immagini, contenuti e recensioni.' },
        { word: 'Prenotazione diretta', text: 'Accompagnare l’utente verso la prenotazione diretta.' },
        { word: 'Tre lingue', text: 'Rendere l’esperienza accessibile a ospiti italiani, inglesi e tedeschi.' },
      ]} />

      {/* The one decision the whole site follows. */}
      <Part id="la-scelta" title="La scelta">
        <Manifesto text="Abbiamo scelto di non raccontare la residenza come una semplice struttura ricettiva." turn="L’abbiamo fatta esplorare." />
        <Pair
          linesFirst
          lines={[
            'Prima la casa nel suo insieme.',
            'Poi i suoi piani, uno alla volta.',
            'Gli ambienti, gli spazi, ciò che si vede dalle finestre e ciò che c’è intorno.',
          ]}
          prose={['Il percorso segue la logica di chi sta scegliendo dove trascorrere il proprio soggiorno: prima immagina il luogo, poi sceglie come viverlo.']}
        />
      </Part>

      {/* How that decision becomes the experience. */}
      <Part id="esperienza" title="L’esperienza">
        <Blocks items={[
          { title: 'La casa, un piano alla volta', text: ['La struttura viene raccontata attraverso la villa intera e i suoi tre piani.', 'Ogni spazio ha il proprio racconto, così l’utente può capire rapidamente cosa offre ciascuna soluzione e scegliere quella più adatta al proprio soggiorno.'] },
          { title: 'Prima di prenotare, si esplora', text: ['Il sito accompagna l’utente dentro la casa prima ancora del suo arrivo.', 'Gli ambienti, il territorio, i luoghi da visitare e i consigli dell’host costruiscono un’esperienza che va oltre la semplice descrizione della struttura.'] },
          { title: 'La prenotazione resta vicina', text: ['Una volta presa la decisione, il percorso non si interrompe.', 'La prenotazione diretta rimane facilmente raggiungibile durante l’esperienza, riducendo il percorso tra desiderio e azione.'] },
        ]} />
      </Part>

      {/* The look: the house itself leads. */}
      <Part id="direzione-visiva" title="Un luogo prima ancora di un sito">
        <Statement
          text="La direzione visiva nasce dal carattere della casa e dal suo rapporto con il lago."
          turn="Non abbiamo cercato di costruire un’identità artificiale intorno alla struttura."
        />
        <Prose
          after
          lines={['Abbiamo lasciato che fossero gli spazi, la luce, il paesaggio e i dettagli della residenza a guidare l’esperienza.']}
          last="La casa diventa così il vero elemento protagonista del progetto."
        />
      </Part>

      {/* How it is built: the proof, kept quiet. */}
      <Part id="tecnologia" title="Tecnologia" className="gm-st-part--proof">
        <Proof
          intro="La tecnologia rimane sullo sfondo: deve rendere l’esperienza più semplice, non diventare il soggetto della pagina."
          items={['Sviluppo su misura', 'Tre lingue: italiano, inglese e tedesco', 'Sistema di recensioni collegato alle recensioni verificate', 'Struttura responsive pensata per desktop e mobile']}
        />
      </Part>

      {/* Guests from all over Europe. */}
      <Part id="tre-lingue" title="Una casa per chi arriva da lontano">
        <Statement text="La residenza si rivolge a un pubblico internazionale." />
        <Names label="Le lingue del sito" items={['Italiano', 'English', 'Deutsch']} />
        <Prose lines={[
          'Per questo l’esperienza è stata progettata in italiano, inglese e tedesco, mantenendo struttura, navigazione e contenuti coerenti in ogni lingua.',
          'Non una semplice traduzione del sito, ma la stessa esperienza, indipendentemente dalla lingua con cui la si attraversa.',
        ]} />
      </Part>

      {/* The phone, rethought rather than shrunk. */}
      <Part id="mobile" title="La casa, anche sul telefono">
        <Phone
          project={project}
          strong="Gran parte del viaggio verso una prenotazione avviene da uno smartphone."
          lines={[
            'Per questo il sito è stato progettato per essere veloce, leggibile e naturale da esplorare anche su schermi più piccoli.',
            'L’esperienza desktop non è stata semplicemente rimpicciolita. È stata ripensata per il mobile.',
          ]}
        />
      </Part>

      {/* What it became. */}
      <Part id="risultato" title="Il risultato">
        <Result text="Un sito che permette di conoscere la casa" turn="prima ancora di arrivare." />
        <Prose
          strong="La residenza non viene semplicemente presentata. Viene esplorata."
          lines={['L’utente può capire gli spazi, confrontare le diverse configurazioni, conoscere il territorio e arrivare alla prenotazione diretta con tutte le informazioni necessarie.']}
        />
      </Part>

      {/* The work, in short, and the way to the live site. */}
      <Part id="cosa-abbiamo-costruito" title="Cosa abbiamo costruito" className="gm-st-part--built">
        <Built project={project} items={[
          'Strategia e architettura dei contenuti',
          'UX per la scelta tra villa e singoli piani',
          'Web design e direzione visiva',
          'Sviluppo completo del sito',
          'Struttura dedicata alla villa e ai tre piani',
          'Sistema di navigazione tra gli ambienti',
          'Sezione dedicata al territorio e ai consigli dell’host',
          'Sistema di recensioni',
          'Versioni italiana, inglese e tedesca',
          'Percorso orientato alla prenotazione diretta',
          'Ottimizzazione dell’esperienza mobile',
        ]} />
      </Part>
    </CaseStory>
  );
}
