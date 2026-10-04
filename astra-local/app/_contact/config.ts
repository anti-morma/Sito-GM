// gm-modulo-contatti · file del sito: modificalo liberamente, installa.mjs non lo sovrascrive.
// Campi, testi e nome del sito. Chiave e indirizzi email stanno nelle variabili d'ambiente (README).

import { site } from '../content';
import type { ContactConfig } from './fields';

// A first, informal word, not a quote request: "Parliamone" → "Richiesta ricevuta".
const answer = site.responseTime ? `Ti rispondiamo entro ${site.responseTime}` : 'Ti rispondiamo';

const config: ContactConfig = {
  siteName: site.name,
  // Without JavaScript the form comes back here with its outcome.
  returnPath: '/contatti',
  fields: [
    { name: 'name', label: 'Nome', placeholder: 'Il tuo nome', autoComplete: 'name', required: 'Dicci come ti chiami.', maxLength: 120 },
    { name: 'email', label: 'Email', placeholder: 'La tua email', type: 'email', autoComplete: 'email', required: 'Inserisci il tuo indirizzo email: ti rispondiamo lì.', maxLength: 254 },
    { name: 'company', label: 'Attività / brand', placeholder: 'Nome dell’attività o del brand', autoComplete: 'organization', maxLength: 200 },
    // The first option is selected from the start: it must be a true answer
    // for anyone who does not choose.
    { name: 'type', label: 'Di cosa hai bisogno?', hint: 'Possiamo definirlo insieme.', options: ['Da definire insieme', 'Un sito web nuovo', 'Il rinnovo di un sito esistente', 'Hosting e manutenzione', 'Altro'] },
    {
      name: 'idea',
      label: 'Parlaci del progetto',
      placeholder: 'Cosa hai in mente? Raccontacelo anche in poche righe.',
      multiline: true,
      required: 'Raccontaci qualcosa del progetto, anche solo poche righe.',
      minLength: 10,
      tooShort: 'Aggiungi qualche dettaglio in più: bastano poche righe.',
    },
  ],
  submitClassName: 'gm-btn gm-btn--primary gm-btn--large',
  text: {
    submit: 'Parliamone',
    sending: 'Invio in corso',
    // Beside the button: no commitment, and what happens next. How long the data
    // is kept is said in the privacy policy.
    note: 'Senza impegno. Ti risponderemo per capire insieme il progetto e i prossimi passi.',
    privacyHref: '/privacy',
    privacyLabel: 'Informativa privacy',
    sentTitle: 'Richiesta ricevuta.',
    sentText: `Grazie per averci raccontato il tuo progetto.\n${answer} all’indirizzo email che ci hai lasciato: se non trovi il nostro messaggio, controlla anche la posta indesiderata.`,
  },
};

export default config;
