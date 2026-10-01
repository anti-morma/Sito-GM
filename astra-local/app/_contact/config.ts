// gm-modulo-contatti · file del sito: modificalo liberamente, installa.mjs non lo sovrascrive.
// Campi, testi e nome del sito. Chiave e indirizzi email stanno nelle variabili d'ambiente (README).

import { site } from '../content';
import type { ContactConfig } from './fields';

// The same action from the first button to the last message (primaryCta in
// content.ts): "Richiedi una consulenza" → "Richiedi la consulenza" → "Richiesta ricevuta".
const answer = site.responseTime ? `Ti rispondiamo entro ${site.responseTime}` : 'Ti rispondiamo';

const config: ContactConfig = {
  siteName: site.name,
  returnPath: '/#contatti',
  fields: [
    { name: 'name', label: 'Nome', autoComplete: 'name', required: 'Dicci come ti chiami.', maxLength: 120 },
    { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', required: 'Inserisci il tuo indirizzo email: ti rispondiamo lì.', maxLength: 254 },
    { name: 'company', label: 'Azienda / progetto', autoComplete: 'organization', wide: true, maxLength: 200 },
    {
      name: 'idea',
      label: 'Raccontaci la tua idea',
      multiline: true,
      required: 'Raccontaci qualcosa della tua idea, anche solo poche righe.',
      minLength: 10,
      tooShort: 'Aggiungi qualche dettaglio in più: bastano poche righe.',
    },
  ],
  submitClassName: 'gm-btn gm-btn--primary gm-btn--large',
  text: {
    submit: 'Richiedi la consulenza',
    sending: 'Invio in corso',
    // Beside the button: the last doubts (commitment, data) answered where they arise.
    note: 'Senza impegno. Usiamo i tuoi dati solo per risponderti e li conserviamo al massimo 24 mesi.',
    privacyHref: '/privacy',
    privacyLabel: 'Informativa privacy',
    sentTitle: 'Richiesta ricevuta.',
    sentText: `Grazie per averci raccontato il tuo progetto.\n${answer} all’indirizzo email che ci hai lasciato: se non trovi il nostro messaggio, controlla anche la posta indesiderata.`,
  },
};

export default config;
