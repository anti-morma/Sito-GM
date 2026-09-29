import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '../content';
import LegalPage, { owner } from '../legal-page';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Come GoMore tratta i dati personali raccolti attraverso il sito e il modulo di contatto.',
  alternates: { canonical: '/privacy' },
};

export default function Privacy() {
  const o = owner();
  return (
    <LegalPage title="Privacy Policy" updated="29 settembre 2026">
      <p>Questa informativa descrive come vengono trattati i dati personali di chi visita questo sito e di chi ci scrive tramite il modulo di contatto, ai sensi del Regolamento (UE) 2016/679 (GDPR).</p>

      <h2>Titolare del trattamento</h2>
      <p>{o.name} — {o.address} — {o.vat}<br />Contatto: {o.email}{site.pec && ` · PEC ${site.pec}`}</p>

      <h2>Quali dati raccogliamo</h2>
      <p><strong>Dati inviati tramite il modulo di contatto:</strong> nome, indirizzo e-mail, eventuale azienda o progetto e il testo del messaggio.</p>
      <p><strong>Dati tecnici di navigazione:</strong> i server che ospitano il sito registrano automaticamente, come ogni server web, dati quali indirizzo IP, data e ora della richiesta e tipo di browser, per garantire il funzionamento e la sicurezza del servizio.</p>
      <p><strong>Statistiche di visita:</strong> usiamo Vercel Web Analytics per sapere, in forma aggregata e anonima, quante persone visitano il sito e quali pagine guardano. Per ogni visita vengono registrati la pagina, la pagina di provenienza, paese e città approssimativi, tipo di dispositivo, sistema operativo e browser. Non usa cookie e non salva informazioni sul tuo dispositivo: per contare le visite usa un codice ricavato dalla richiesta, che viene cancellato dopo 24 ore e non permette di identificarti né di seguirti su altri siti.</p>
      <p>Il sito non utilizza cookie di profilazione o sistemi di tracciamento (vedi la <Link href="/cookie">Cookie Policy</Link>).</p>

      <h2>Perché li trattiamo e su quale base</h2>
      <ul>
        <li>Rispondere alla tua richiesta e, se lo desideri, formulare una proposta: esecuzione di misure precontrattuali su tua richiesta (art. 6.1.b GDPR).</li>
        <li>Garantire sicurezza e funzionamento del sito: legittimo interesse del titolare (art. 6.1.f GDPR).</li>
        <li>Capire, con statistiche aggregate e anonime, come viene usato il sito per migliorarlo: legittimo interesse del titolare (art. 6.1.f GDPR).</li>
      </ul>
      <p>Il conferimento dei dati del modulo è facoltativo, ma senza nome, e-mail e messaggio non possiamo risponderti.</p>

      <h2>Per quanto tempo</h2>
      <p>I messaggi ricevuti sono conservati per il tempo necessario a gestire la richiesta e l’eventuale rapporto che ne deriva, e comunque non oltre 24 mesi dall’ultimo contatto, salvo obblighi di legge. I dati tecnici di navigazione sono conservati dal fornitore di hosting per il periodo strettamente necessario alla sicurezza del servizio.</p>

      <h2>A chi vengono comunicati</h2>
      <ul>
        <li><strong>Vercel Inc.</strong>, fornitore dell’hosting del sito e delle statistiche di visita, che agisce come responsabile del trattamento. Il trasferimento verso gli Stati Uniti avviene sulla base del Data Privacy Framework UE-USA e/o delle clausole contrattuali standard.</li>
        <li><strong>Resend, Inc.</strong>, che spedisce alla nostra casella i messaggi del modulo di contatto e agisce come responsabile del trattamento. Il trasferimento verso gli Stati Uniti avviene sulla base del Data Privacy Framework UE-USA e/o delle clausole contrattuali standard.</li>
      </ul>
      <p>I dati non vengono venduti né usati per finalità di marketing senza il tuo consenso.</p>

      <h2>I tuoi diritti</h2>
      <p>Puoi chiedere in ogni momento accesso, rettifica, cancellazione, limitazione, portabilità dei tuoi dati o opporti al trattamento (artt. 15–22 GDPR), scrivendo a {o.email}. Hai inoltre il diritto di proporre reclamo al Garante per la protezione dei dati personali (<a href="https://www.garanteprivacy.it" target="_blank" rel="noopener">garanteprivacy.it</a>).</p>
    </LegalPage>
  );
}
