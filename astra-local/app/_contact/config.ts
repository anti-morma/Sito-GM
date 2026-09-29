// gm-modulo-contatti · file del sito: modificalo liberamente, installa.mjs non lo sovrascrive.
// Campi, testi e nome del sito. Chiave e indirizzi email stanno nelle variabili d'ambiente (README).

import { site } from '../content';
import type { ContactConfig } from './fields';

const config: ContactConfig = {
  siteName: site.name,
  returnPath: '/#contatti',
  fields: [
    { name: 'name', label: 'Nome', autoComplete: 'name', required: 'Dicci come ti chiami.', maxLength: 120 },
    { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', required: 'Inserisci il tuo indirizzo email.', maxLength: 254 },
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
    submit: 'Invia il messaggio',
    sending: 'Invio',
    note: 'Usiamo i tuoi dati solo per risponderti.',
    privacyHref: '/privacy',
    privacyLabel: 'Informativa privacy',
    sentTitle: 'Messaggio ricevuto.',
    sentText: 'Grazie per averci raccontato il tuo progetto.\nTi ricontatteremo a breve.',
  },
};

export default config;
