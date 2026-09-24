import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { owner } from '../legal-page';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Il sito GoMore non utilizza cookie di profilazione né strumenti di tracciamento.',
  alternates: { canonical: '/cookie' },
};

export default function Cookie() {
  const o = owner();
  return (
    <LegalPage title="Cookie Policy" updated="24 settembre 2026">
      <p><strong>In breve: questo sito non usa cookie.</strong> Non installa cookie di profilazione, di analisi o di terze parti e non utilizza tecnologie simili (come local storage o pixel di tracciamento). Per questo non ti chiediamo alcun consenso e non mostriamo un banner.</p>

      <h2>Cosa abbiamo verificato</h2>
      <ul>
        <li>I caratteri tipografici, le immagini e i video sono ospitati direttamente sul nostro sito: nessuna richiesta a Google Fonts, YouTube o servizi simili.</li>
        <li>Non sono presenti strumenti di statistica (ad esempio Google Analytics), mappe incorporate, pulsanti social o pubblicità.</li>
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
