import type { Project } from '../../content';
import CaseStory, { Blocks, Built, Goals, Manifesto, Names, Pair, Part, Phone, Proof, Prose, Result, Statement, type Story } from './case-story';

/** Lalinga Oro's case study, told as a story (case-story.tsx). Facts only,
 *  checked on the live lalingaoro.it: no figures, rankings or results that
 *  are not real. */
export const LALINGA: Story = {
  intro: [
    'Una gioielleria, orologeria e laboratorio orafo di famiglia, a Taranto dal 1950.',
    'Il punto di partenza era semplice: raccontare tutto ciò che Lalinga Oro è, senza trasformarlo in un semplice catalogo.',
    'Sei attività, una storia, un’identità precisa. Abbiamo costruito un’esperienza capace di farle convivere senza confonderle.',
  ],
  meta: [
    ['Cliente', 'Gioielleria · Orologeria · Laboratorio orafo'],
    ['Dove', 'Taranto'],
    ['Settore', 'Luxury retail'],
    ['Il nostro lavoro', 'Strategia · UX · Web design · Sviluppo · Motion design'],
  ],
  path: [
    { id: 'punto-di-partenza', label: 'Il punto di partenza' },
    { id: 'la-scelta', label: 'La scelta' },
    { id: 'esperienza', label: 'L’esperienza' },
    { id: 'tecnologia', label: 'Tecnologia' },
    { id: 'farsi-trovare', label: 'Farsi trovare' },
    { id: 'mobile', label: 'Mobile' },
    { id: 'risultato', label: 'Il risultato' },
    { id: 'cosa-abbiamo-costruito', label: 'Cosa abbiamo costruito' },
  ],
};

const WORLDS = ['Orologi', 'Gioielli', 'Oreficeria', 'Pelletteria', 'Compro oro', 'Laboratorio'];

export default function LalingaOro({ project, index, total }: { project: Project; index: number; total: number }) {
  return (
    <CaseStory project={project} index={index} total={total} story={LALINGA}>
      {/* What the client had, and the problem in it. */}
      <Part id="punto-di-partenza" title="Il punto di partenza">
        <Statement
          text="Dal 1950 Lalinga Oro porta avanti un mestiere fatto di precisione, fiducia e competenza."
          turn="Ma sul digitale questa ricchezza rischiava di diventare dispersione."
        />
        <Names label="Le sei attività" items={WORLDS} />
        <Prose strong="Sei mondi diversi, sotto lo stesso nome." lines={['La sfida era dare a ciascuno il proprio spazio, senza perdere l’identità comune.']} />
      </Part>
      <Goals chapter="punto-di-partenza" items={[
        { word: 'Autorevolezza', text: 'Comunicare autorevolezza e storia senza risultare nostalgici.' },
        { word: 'Riconoscibilità', text: 'Rendere immediatamente riconoscibili i sei servizi.' },
        { word: 'Orientamento', text: 'Accompagnare ogni visitatore verso ciò che sta cercando.' },
        { word: 'Un invito', text: 'Trasformare l’esperienza digitale in un invito a entrare in boutique.' },
      ]} />

      {/* The one decision the whole site follows. */}
      <Part id="la-scelta" title="La scelta">
        <Manifesto text="Abbiamo scelto di non costruire un catalogo." turn="Abbiamo costruito un percorso." />
        <Pair
          prose={[
            'Il primo scroll introduce il mondo Lalinga attraverso il linguaggio dell’orologeria: un movimento meccanico che si apre, componente dopo componente.',
            'Non è solo un’animazione. È il modo in cui il sito racconta il brand: precisione, meccanica, cura del dettaglio.',
            'Da lì, sei ingressi distinti portano ai sei mondi della maison.',
          ]}
          lines={[
            'Chi cerca un orologio trova l’orologeria.',
            'Chi cerca un gioiello trova la gioielleria.',
            'Chi cerca il laboratorio arriva direttamente al laboratorio.',
          ]}
          last="Nessun percorso superfluo."
        />
      </Part>

      {/* How that decision becomes the experience. */}
      <Part id="esperienza" title="L’esperienza">
        <Blocks items={[
          { title: 'Sei mondi, un’unica identità', text: ['La homepage presenta le sei attività attraverso una struttura numerata, immediata e riconoscibile.', 'Ogni sezione ha una propria pagina, costruita per raccontare quel servizio senza perdere il legame con la maison.'] },
          { title: 'Un’identità senza tempo', text: ['La direzione visiva prende ispirazione dal mondo dell’alta orologeria e della gioielleria.', 'Tipografia classica, spaziatura, materiali e movimento costruiscono un’atmosfera contemporanea senza cancellare settant’anni di storia.'] },
          { title: 'Il movimento come linguaggio', text: ['L’apertura non è un elemento decorativo. È parte del racconto.', 'Un orologio si apre progressivamente allo scroll e ne rivela il meccanismo interno. L’animazione è stata disegnata e sviluppata su misura per il progetto.'] },
        ]} />
      </Part>

      {/* How it is built, and found: the proof, kept quiet. */}
      <Part id="tecnologia" title="Tecnologia" className="gm-st-part--proof">
        <Proof
          intro="Il sito è stato sviluppato da zero, senza CMS, template o framework preconfezionati."
          items={['HTML, CSS e JavaScript sviluppati su misura', 'Font ospitati direttamente sul sito', 'Animazione dell’hero sviluppata su canvas', 'Esperienza responsive', 'Struttura ottimizzata per performance']}
        />
      </Part>
      <Part id="farsi-trovare" title="Farsi trovare" className="gm-st-part--proof">
        <Proof
          intro="La presenza digitale doveva funzionare anche fuori dal sito. Per questo abbiamo costruito una struttura pensata per la ricerca locale."
          items={['Contenuti orientati alla ricerca locale', 'Pagine dedicate ai singoli servizi', 'Dati strutturati JewelryStore', 'Informazioni aziendali', 'Sitemap XML', 'robots.txt']}
        />
      </Part>

      {/* The phone, rethought rather than shrunk. */}
      <Part id="mobile" title="Un’esperienza pensata anche per il telefono">
        <Phone
          project={project}
          strong="Il primo contatto con una boutique può avvenire ovunque."
          lines={[
            'Per questo ogni elemento importante è stato progettato per essere raggiunto con pochi gesti: menu, servizi, indirizzo, telefono e indicazioni per raggiungere il negozio.',
            'L’esperienza desktop non è stata semplicemente rimpicciolita. È stata ripensata per il mobile.',
          ]}
        />
      </Part>

      {/* What it became. */}
      <Part id="risultato" title="Il risultato">
        <Result text="Una maison con settant’anni di storia, trasformata in" turn="un’esperienza digitale contemporanea." />
        <Prose lines={['Il sito non si limita a raccontare Lalinga Oro.', 'Fa entrare il visitatore nel suo mondo, gli permette di scegliere la propria strada e lo accompagna fino alla boutique.']} />
      </Part>

      {/* The work, in short, and the way to the live site. */}
      <Part id="cosa-abbiamo-costruito" title="Cosa abbiamo costruito" className="gm-st-part--built">
        <Built project={project} items={[
          'Strategia e architettura dei contenuti',
          'UX e struttura dei sei servizi',
          'Art direction e web design',
          'Sviluppo completo da zero',
          'Sistema di animazione dell’orologio',
          'Motion e micro-interazioni',
          'Ottimizzazione mobile',
          'Struttura SEO locale',
          'Schema.org e dati strutturati',
          'Sitemap e robots.txt',
          'Pagine dedicate alla storia, ai servizi e al laboratorio',
          'Contatti, mappa e informazioni per raggiungere la boutique',
        ]} />
      </Part>
    </CaseStory>
  );
}
