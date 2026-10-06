import Link from 'next/link';
import { site } from '../content';
import LegalPage, { Controllers } from '../legal-page';
import { pageMetadata } from '../seo';

export const metadata = pageMetadata({ path: '/privacy', title: 'Privacy Policy', description: 'Come GoMore tratta i dati personali di chi visita il sito e di chi ci contatta: titolari, finalità, fornitori, tempi di conservazione e diritti.' });

// Every fact here is checked against the site itself: the contact form
// (app/api/contact: Resend, then the studio's Google Workspace mailbox), the
// statistics (app/layout.tsx, app/tracking.tsx: Vercel Web Analytics) and the
// hosting (Vercel). A new service or a new field must be added here.
export default function Privacy() {
  const host = new URL(site.url).host;
  return (
    <LegalPage title="Privacy Policy" updated="6 ottobre 2026">
      <p>Questa informativa spiega come vengono trattati i dati personali di chi visita il sito {host} e di chi ci contatta tramite il modulo, l’e-mail o il telefono. È resa ai sensi degli articoli 13 e 14 del Regolamento (UE) 2016/679 (“GDPR”) e del Codice in materia di protezione dei dati personali (D.Lgs. 196/2003, come modificato dal D.Lgs. 101/2018).</p>

      <h2>1. Chi tratta i tuoi dati</h2>
      <p>GoMore è lo studio digitale di due professionisti, che decidono insieme come e perché vengono trattati i dati raccolti attraverso il sito e sono quindi <strong>contitolari del trattamento</strong> (art. 26 GDPR):</p>
      <Controllers />
      <p>I contitolari hanno definito di comune accordo i rispettivi compiti, in particolare nel rispondere alle richieste e nel garantire i tuoi diritti. Il contenuto essenziale di questo accordo è disponibile su richiesta all’indirizzo {site.email}. Puoi esercitare i tuoi diritti nei confronti di ciascuno dei due.</p>
      <p>Non è stato nominato un Responsabile della protezione dei dati (DPO), perché per l’attività svolta non è obbligatorio.</p>

      <h2>2. Quali dati trattiamo</h2>
      <p><strong>Dati di navigazione.</strong> Come ogni sito, i server che lo ospitano ricevono e registrano automaticamente alcune informazioni tecniche a ogni richiesta: indirizzo IP, data e ora, pagina richiesta, esito della richiesta, tipo di browser e sistema operativo. Servono a far funzionare il sito e a proteggerlo da abusi e attacchi.</p>
      <p><strong>Statistiche di visita.</strong> Usiamo Vercel Web Analytics per sapere, in forma aggregata, quante persone visitano il sito e quali pagine guardano. Per ogni visita vengono rilevati la pagina, il sito di provenienza, paese e area geografica approssimativi, tipo di dispositivo, sistema operativo e browser. Contiamo inoltre alcune azioni: i clic sui pulsanti principali (per esempio quelli verso il modulo di contatto o verso i progetti e i siti dei clienti), i clic sull’e-mail e sui numeri di telefono e l’invio riuscito del modulo, <strong>mai il contenuto di ciò che scrivi</strong>. Lo strumento non usa cookie e non salva nulla sul tuo dispositivo: per distinguere le visite calcola un codice dall’indirizzo IP e dal browser, che viene cancellato automaticamente dopo 24 ore e non permette né di identificarti né di seguirti su altri siti. Noi vediamo soltanto numeri complessivi.</p>
      <p><strong>Dati che ci invii con il modulo di contatto.</strong> Nome, indirizzo e-mail, attività o brand (facoltativo), il tipo di progetto scelto e il testo del messaggio, oltre a data e ora dell’invio. Per proteggere il modulo dallo spam, il nostro server tiene in memoria il tuo indirizzo IP per un massimo di 10 minuti, solo per limitare gli invii ripetuti; non viene salvato altrove.</p>
      <p><strong>Dati che ci comunichi scrivendoci o telefonandoci.</strong> Se ci contatti direttamente all’e-mail o ai numeri indicati nel sito, trattiamo i dati che ci fornisci (per esempio nome, indirizzo e-mail, numero di telefono e contenuto della comunicazione).</p>
      <p><strong>Ti chiediamo di non inserire nei messaggi dati particolari</strong> (per esempio relativi alla salute, alle opinioni politiche o religiose) o dati di altre persone che non servono a descrivere il progetto.</p>
      <p>Il sito non usa cookie e non utilizza strumenti di profilazione o di pubblicità. Le uniche informazioni salvate sul tuo dispositivo sono due preferenze tecniche, descritte nella <Link href="/cookie">Cookie Policy</Link>.</p>

      <h2>3. Perché li trattiamo, su quale base e per quanto tempo</h2>
      <ul>
        <li><strong>Rispondere alla tua richiesta</strong> e, se lo desideri, preparare una proposta. Base giuridica: esecuzione di misure precontrattuali adottate su tua richiesta (art. 6.1.b GDPR). Conservazione: per il tempo necessario a gestire la richiesta e comunque non oltre 24 mesi dall’ultimo contatto, se non nasce un rapporto di lavoro.</li>
        <li><strong>Gestire l’eventuale incarico</strong> che nasce dalla richiesta e adempiere agli obblighi di legge, contabili e fiscali. Base giuridica: esecuzione del contratto e obbligo legale (art. 6.1.b e 6.1.c GDPR). Conservazione: per la durata del rapporto e poi per 10 anni, come previsto per le scritture contabili e i documenti fiscali (art. 2220 del Codice civile).</li>
        <li><strong>Far funzionare il sito e proteggerlo</strong> da abusi, spam e attacchi. Base giuridica: legittimo interesse dei titolari alla sicurezza del sito (art. 6.1.f GDPR). Conservazione: i dati di navigazione sono conservati dal fornitore di hosting per il breve periodo previsto dalla sua configurazione tecnica; l’indirizzo IP usato contro lo spam per un massimo di 10 minuti.</li>
        <li><strong>Capire come viene usato il sito</strong>, con statistiche aggregate, per migliorarlo. Base giuridica: legittimo interesse dei titolari (art. 6.1.f GDPR), con un impatto minimo su di te, perché i dati non permettono di identificarti. Conservazione: il codice che distingue le visite è cancellato dopo 24 ore; restano solo dati aggregati.</li>
        <li><strong>Difendere i nostri diritti</strong> in caso di contestazioni. Base giuridica: legittimo interesse dei titolari (art. 6.1.f GDPR). Conservazione: per il tempo necessario, nei limiti dei termini di prescrizione.</li>
      </ul>
      <p>Non usiamo i tuoi dati per inviarti newsletter o comunicazioni promozionali, non li vendiamo e non li cediamo a terzi per i loro scopi.</p>

      <h2>4. Sei obbligato a fornirli?</h2>
      <p>No. Scriverci è una tua scelta. Nel modulo, però, nome, e-mail e descrizione del progetto sono necessari per poterti rispondere: senza, la richiesta non può essere inviata. Attività o brand è facoltativo. I dati di navigazione, invece, vengono trasmessi automaticamente dal browser durante la visita.</p>

      <h2>5. Come li trattiamo</h2>
      <p>I dati sono trattati con strumenti elettronici, con misure tecniche e organizzative adeguate a proteggerli da accessi non autorizzati, perdita o divulgazione: il sito usa solo connessioni cifrate (HTTPS) e i messaggi sono consultati soltanto dai due titolari. Non prendiamo decisioni basate unicamente su trattamenti automatizzati e non facciamo profilazione (art. 22 GDPR).</p>

      <h2>6. A chi vengono comunicati</h2>
      <p>I dati sono trattati dai due titolari. Per far funzionare il sito ci serviamo di alcuni fornitori, che trattano i dati per nostro conto come <strong>responsabili del trattamento</strong> (art. 28 GDPR), sulla base di accordi che li obbligano a proteggerli e a usarli solo secondo le nostre istruzioni:</p>
      <ul>
        <li><strong>Vercel Inc.</strong> (Stati Uniti): ospita il sito, riceve i dati di navigazione e fornisce le statistiche di visita.</li>
        <li><strong>Resend, Inc.</strong> (Stati Uniti): consegna alla nostra casella di posta i messaggi inviati con il modulo di contatto.</li>
        <li><strong>Google Ireland Limited</strong> (Irlanda), con il gruppo Google: fornisce la casella di posta elettronica dello studio (Google Workspace), dove arrivano e sono conservati i messaggi del modulo e le e-mail che ci invii.</li>
      </ul>
      <p>Se dalla richiesta nasce un incarico, i dati necessari possono essere comunicati al nostro consulente fiscale, per gli adempimenti di legge. I dati possono infine essere comunicati alle autorità, quando la legge lo impone. Non sono mai diffusi.</p>

      <h2>7. Trasferimenti fuori dall’Unione europea</h2>
      <p>Vercel, Resend e il gruppo Google possono trattare dati negli Stati Uniti. Il trasferimento è lecito perché queste società aderiscono all’EU-U.S. Data Privacy Framework, riconosciuto adeguato dalla Commissione europea con la decisione del 10 luglio 2023 (art. 45 GDPR); i loro accordi prevedono inoltre le clausole contrattuali standard approvate dalla Commissione (art. 46 GDPR). Puoi chiederci maggiori informazioni scrivendo a {site.email}.</p>

      <h2>8. I tuoi diritti</h2>
      <p>In ogni momento, e gratuitamente, puoi chiedere:</p>
      <ul>
        <li>di <strong>accedere</strong> ai tuoi dati e riceverne copia (art. 15);</li>
        <li>di <strong>correggerli</strong> o completarli (art. 16);</li>
        <li>di <strong>cancellarli</strong> (art. 17);</li>
        <li>di <strong>limitarne il trattamento</strong> (art. 18);</li>
        <li>di riceverli in un formato di uso comune e di farli trasmettere a un altro titolare (<strong>portabilità</strong>, art. 20);</li>
        <li>di <strong>opporti</strong> al trattamento basato sul legittimo interesse, per motivi legati alla tua situazione particolare (art. 21).</li>
      </ul>
      <p>Per esercitarli scrivi a <a href={`mailto:${site.email}`}>{site.email}</a>. Ti risponderemo entro un mese dalla richiesta, prorogabile di altri due mesi solo nei casi più complessi, come previsto dall’art. 12 GDPR. Potremmo chiederti informazioni utili a verificare la tua identità.</p>
      <p>Se ritieni che il trattamento violi la normativa, puoi proporre reclamo al <strong>Garante per la protezione dei dati personali</strong> (<a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">garanteprivacy.it</a>) o rivolgerti all’autorità giudiziaria.</p>

      <h2>9. Minori</h2>
      <p>Il sito si rivolge ad attività e professionisti. Se hai meno di 14 anni, non inviarci dati personali senza il consenso di chi esercita la responsabilità genitoriale.</p>

      <h2>10. Link ad altri siti</h2>
      <p>Il sito contiene collegamenti a siti esterni, come i siti realizzati per i nostri clienti nella sezione Progetti. Quando li apri, valgono le informative di quei siti, di cui non siamo responsabili.</p>

      <h2>11. Modifiche a questa informativa</h2>
      <p>Aggiorniamo questa informativa quando cambia il modo in cui trattiamo i dati, per esempio se aggiungiamo un nuovo servizio. La data dell’ultimo aggiornamento è indicata in alto; ti invitiamo a consultarla periodicamente.</p>
    </LegalPage>
  );
}
