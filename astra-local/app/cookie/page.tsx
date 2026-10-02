import Link from 'next/link';
import LegalPage, { owner } from '../legal-page';
import { pageMetadata } from '../seo';

export const metadata = pageMetadata({ path: '/cookie', title: 'Cookie Policy', description: 'Il sito GoMore non utilizza cookie di profilazione né strumenti di tracciamento.' });

export default function Cookie() {
  const o = owner();
  return (
    <LegalPage title="Cookie Policy" updated="30 settembre 2026">
      <p><strong>In breve: questo sito non usa cookie.</strong> Non installa cookie di profilazione, di analisi o di terze parti e non utilizza pixel o altri sistemi di tracciamento. Per questo non ti chiediamo alcun consenso e non mostriamo un banner.</p>

      <h2>L’unica cosa che il sito ricorda</h2>
      <p>Durante la visita il sito usa la memoria di sessione del tuo browser (<em>sessionStorage</em>) per due informazioni tecniche: che su telefono hai già visto l’animazione di apertura, così non la ripete, e, se lo scegli, che vuoi le animazioni ferme. Restano sul tuo dispositivo, non vengono inviate a noi né a terzi e si cancellano quando chiudi la scheda. Servono solo a darti il servizio che hai chiesto: per questo la legge non richiede il consenso.</p>

      <h2>Cosa abbiamo verificato</h2>
      <ul>
        <li>I caratteri tipografici, le immagini e i video sono ospitati direttamente sul nostro sito: nessuna richiesta a Google Fonts, YouTube o servizi simili.</li>
        <li>Per le statistiche usiamo Vercel Web Analytics, che conta le visite in forma aggregata e anonima senza cookie e senza salvare informazioni sul tuo dispositivo (dettagli nella <Link href="/privacy">Privacy Policy</Link>). Non sono presenti Google Analytics, mappe incorporate, pulsanti social o pubblicità.</li>
        <li>Il modulo di contatto invia i dati direttamente al nostro server, senza cookie.</li>
      </ul>

      <h2>Link verso altri siti</h2>
      <p>La sezione Progetti contiene collegamenti a siti realizzati per i nostri clienti. Quando li apri, valgono le informative e le eventuali scelte sui cookie di quei siti.</p>

      <h2>Se qualcosa cambia</h2>
      <p>Se in futuro introdurremo strumenti che richiedono il consenso, aggiorneremo questa pagina e ti chiederemo di esprimere una scelta prima di attivarli, come previsto dalle Linee guida del Garante (10 giugno 2021).</p>

      <p>Per domande: {o.email}. Per il trattamento dei dati personali consulta la <Link href="/privacy">Privacy Policy</Link>.</p>
    </LegalPage>
  );
}
