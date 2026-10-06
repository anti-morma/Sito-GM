import Link from 'next/link';
import { site } from '../content';
import LegalPage, { Controllers } from '../legal-page';
import { pageMetadata } from '../seo';

export const metadata = pageMetadata({ path: '/cookie', title: 'Cookie Policy', description: 'Il sito GoMore non usa cookie né strumenti di tracciamento: cosa salva sul dispositivo, perché e come cancellarlo.' });

// Checked on the site itself: no cookies (none set by the pages or by the
// server), no localStorage, two sessionStorage keys (app/opening.ts:
// 'gm-intro'; app/motion.ts: 'gm-motion'). Fonts, images and films are
// served from the site. Anything new that stores data on the device goes here.
export default function Cookie() {
  return (
    <LegalPage title="Cookie Policy" updated="6 ottobre 2026">
      <p><strong>In breve: questo sito non usa cookie.</strong> Non installa cookie tecnici, di analisi, di profilazione o di terze parti e non usa pixel, fingerprinting o altri sistemi di tracciamento. Salva soltanto due preferenze tecniche, che restano sul tuo dispositivo e si cancellano quando chiudi la scheda. Per questo non ti chiediamo alcun consenso e non mostriamo un banner.</p>
      <p>Questa informativa è resa ai sensi dell’art. 122 del Codice in materia di protezione dei dati personali (D.Lgs. 196/2003), degli articoli 13 e 14 del Regolamento (UE) 2016/679 e delle Linee guida del Garante per la protezione dei dati personali sull’uso dei cookie e di altri strumenti di tracciamento del 10 giugno 2021.</p>

      <h2>1. Cosa sono i cookie e gli strumenti simili</h2>
      <p>I cookie sono piccoli file di testo che un sito salva nel browser e rilegge alle visite successive. La legge tratta allo stesso modo ogni strumento che salva informazioni sul tuo dispositivo o le legge, come la memoria del browser (<em>localStorage</em> e <em>sessionStorage</em>). Gli strumenti <strong>tecnici</strong>, strettamente necessari a fornire un servizio che hai richiesto, si possono usare senza consenso; quelli di <strong>profilazione</strong> e di analisi che permettono di identificarti richiedono invece il tuo consenso preventivo.</p>

      <h2>2. Cosa salva questo sito sul tuo dispositivo</h2>
      <p>Solo due informazioni tecniche, nella memoria di sessione del browser (<em>sessionStorage</em>):</p>
      <ul>
        <li><strong>gm-intro</strong>: ricorda che, su telefono, hai già visto l’animazione di apertura della home, così non si ripete a ogni pagina. Durata: fino alla chiusura della scheda.</li>
        <li><strong>gm-motion</strong>: viene salvato solo se scegli di fermare le animazioni, per mantenere la tua scelta mentre navighi. Durata: fino alla chiusura della scheda.</li>
      </ul>
      <p>Sono strumenti tecnici di prima parte: non contengono dati personali, non vengono inviati a noi né a terzi e servono solo a darti il servizio che hai chiesto. Per questo la legge non richiede il consenso.</p>

      <h2>3. Statistiche senza cookie</h2>
      <p>Per sapere quante persone visitano il sito usiamo Vercel Web Analytics, che non usa cookie e non salva né legge informazioni sul tuo dispositivo. Le visite sono contate in forma aggregata: il codice che distingue una visita dall’altra è cancellato dopo 24 ore e non permette di identificarti né di seguirti su altri siti. I dettagli sono nella <Link href="/privacy">Privacy Policy</Link>.</p>

      <h2>4. Nessun servizio di terze parti</h2>
      <ul>
        <li>Caratteri tipografici, immagini e video sono ospitati direttamente sul nostro sito: nessuna richiesta a Google Fonts, YouTube, Vimeo o servizi simili.</li>
        <li>Non sono presenti Google Analytics, Meta Pixel, mappe incorporate, pulsanti o contenuti dei social network, chat o pubblicità.</li>
        <li>Il modulo di contatto invia i dati direttamente al nostro server, senza cookie.</li>
      </ul>

      <h2>5. Link ad altri siti</h2>
      <p>Il sito contiene collegamenti a siti esterni, come i siti realizzati per i nostri clienti nella sezione Progetti. Quando li apri, valgono le informative e le scelte sui cookie di quei siti, di cui non siamo responsabili.</p>

      <h2>6. Come cancellare o bloccare questi dati</h2>
      <p>La memoria di sessione si svuota da sola quando chiudi la scheda o il browser. Puoi anche cancellarla subito dalle impostazioni del browser, alla voce che riguarda i dati dei siti o la cronologia (in Chrome, Safari, Firefox ed Edge si trova nelle impostazioni di privacy e sicurezza). Se la blocchi, il sito funziona comunque: semplicemente non ricorda le due preferenze.</p>

      <h2>7. Chi è responsabile</h2>
      <p>I titolari del trattamento sono:</p>
      <Controllers />

      <h2>8. Se qualcosa cambia</h2>
      <p>Se in futuro introdurremo cookie o strumenti che richiedono il consenso, aggiorneremo questa pagina e, prima di attivarli, ti chiederemo di esprimere una scelta con un banner, come previsto dalle Linee guida del Garante. La data dell’ultimo aggiornamento è indicata in alto.</p>

      <p>Per qualsiasi domanda scrivi a <a href={`mailto:${site.email}`}>{site.email}</a>. Per tutto ciò che riguarda i dati personali consulta la <Link href="/privacy">Privacy Policy</Link>.</p>
    </LegalPage>
  );
}
