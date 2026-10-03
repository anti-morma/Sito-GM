// gm-modulo-contatti · file comune: non modificarlo nel sito, si aggiorna con installa.mjs.
// Le regole dei campi, uguali nel browser e sul server: una sola validazione per entrambi.

import config from './config';

export type ContactFieldConfig = {
  /** Nome del campo. `name` ed `email` devono esserci: servono per l'oggetto e per il Rispondi. Non usare `website`. */
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel';
  /** Testo su più righe. */
  multiline?: boolean;
  /** Menu a tendina: le uniche risposte accettate, la prima è già selezionata. */
  options?: string[];
  /** Messaggio se il campo resta vuoto; se manca, il campo è facoltativo. */
  required?: string;
  minLength?: number;
  /** Messaggio se il testo è più corto di minLength. */
  tooShort?: string;
  /** Predefinito: 5000 caratteri per il testo su più righe, 200 per gli altri. */
  maxLength?: number;
  autoComplete?: string;
  /** Esempio dentro il campo vuoto (i menu a tendina non lo mostrano). */
  placeholder?: string;
  /** Breve nota accanto all'etichetta, letta insieme a lei, es. "possiamo definirlo insieme". */
  hint?: string;
  /** Occupa tutta la larghezza del form (il testo su più righe lo fa sempre). */
  wide?: boolean;
};

export type ContactConfig = {
  /** Compare nell'oggetto dell'email: "Sito <siteName> — …". */
  siteName: string;
  /** Dove torna chi invia il form senza JavaScript, es. '/contatti' o '/#contatti'. */
  returnPath: string;
  fields: ContactFieldConfig[];
  /** Classi in più per il pulsante, per usare lo stile dei pulsanti del sito. */
  submitClassName?: string;
  text: {
    submit: string;
    sending: string;
    note: string;
    privacyHref: string;
    privacyLabel: string;
    sentTitle: string;
    /** Gli a capo vengono mantenuti. */
    sentText: string;
  };
};

export type ContactValues = Record<string, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const maxLengthOf = (field: ContactFieldConfig) => field.maxLength ?? (field.multiline ? 5000 : 200);

export function emptyValues(): ContactValues {
  return Object.fromEntries(config.fields.map((field) => [field.name, field.options?.[0] ?? '']));
}

/** I valori ricevuti dal server: solo i campi previsti, a capo uniformi, senza caratteri di controllo. */
export function readValues(raw: Record<string, unknown>): ContactValues {
  return Object.fromEntries(config.fields.map((field) => {
    const value = raw[field.name];
    const text = typeof value === 'string'
      ? value.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim()
      : '';
    return [field.name, text];
  }));
}

/** Un messaggio per ogni campo da correggere; vuoto se è tutto a posto. */
export function validate(values: ContactValues): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of config.fields) {
    const value = (values[field.name] ?? '').trim();
    const max = maxLengthOf(field);
    if (!value) {
      if (field.required) errors[field.name] = field.required;
    } else if (field.options && !field.options.includes(value)) {
      errors[field.name] = 'Scegli una delle opzioni.';
    } else if (field.type === 'email' && (!EMAIL.test(value) || value.length > max)) {
      errors[field.name] = 'Inserisci un indirizzo email valido.';
    } else if (value.length > max) {
      errors[field.name] = `Testo troppo lungo: al massimo ${max} caratteri.`;
    } else if (field.minLength && value.length < field.minLength) {
      errors[field.name] = field.tooShort ?? `Scrivi almeno ${field.minLength} caratteri.`;
    }
  }
  return errors;
}
