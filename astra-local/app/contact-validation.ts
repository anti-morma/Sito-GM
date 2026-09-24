export type ContactField = 'name' | 'email' | 'company' | 'idea';
export type ContactValues = Record<ContactField, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Shared by the form and the API route; messages are written for people. */
export function validateContact(values: ContactValues): Partial<Record<ContactField, string>> {
  const errors: Partial<Record<ContactField, string>> = {};
  if (!values.name.trim()) errors.name = 'Dicci come ti chiami.';
  if (!values.email.trim()) errors.email = 'Inserisci il tuo indirizzo email.';
  else if (!EMAIL.test(values.email.trim())) errors.email = 'Inserisci un indirizzo email valido.';
  if (!values.idea.trim()) errors.idea = 'Raccontaci qualcosa della tua idea, anche solo poche righe.';
  else if (values.idea.trim().length < 10) errors.idea = 'Aggiungi qualche dettaglio in più: bastano poche righe.';
  return errors;
}
