'use client';

import { useRef, useState } from 'react';
import { validateContact, type ContactField, type ContactValues } from './contact-validation';

type Field = ContactField;
type Values = ContactValues;
type Status = 'idle' | 'sending' | 'sent' | 'failed';

const EMPTY: Values = { name: '', email: '', company: '', idea: '' };

const FIELDS: { id: Field; label: string; type?: string; autoComplete?: string; optional?: boolean; multiline?: boolean }[] = [
  { id: 'name', label: 'Nome', autoComplete: 'name' },
  { id: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { id: 'company', label: 'Azienda / progetto', autoComplete: 'organization', optional: true },
  { id: 'idea', label: 'Raccontaci la tua idea', multiline: true },
];

export default function ContactForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const formRef = useRef<HTMLFormElement>(null);
  const errors = validateContact(values);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'sending') return;
    setTouched({ name: true, email: true, company: true, idea: true });
    const firstInvalid = FIELDS.find((field) => errors[field.id]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`#contact-${firstInvalid.id}`)?.focus();
      return;
    }
    setStatus('sending');
    const honeypot = (formRef.current?.elements.namedItem('website') as HTMLInputElement | null)?.value ?? '';
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, website: honeypot }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setStatus('sent');
    } catch {
      setStatus('failed');
    }
  };

  if (status === 'sent') {
    return (
      <div className="gm-form-sent" role="status" tabIndex={-1} ref={(node) => node?.focus()}>
        <p className="gm-display">Messaggio ricevuto.</p>
        <p>Grazie per averci raccontato il tuo progetto.<br />Ti ricontatteremo a breve.</p>
      </div>
    );
  }

  return (
    <form ref={formRef} className="gm-form" noValidate onSubmit={submit} aria-busy={status === 'sending'}>
      {FIELDS.map((field) => {
        const value = values[field.id];
        const error = touched[field.id] ? errors[field.id] : undefined;
        const common = {
          id: `contact-${field.id}`,
          name: field.id,
          value,
          autoComplete: field.autoComplete,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': error ? `contact-${field.id}-error` : undefined,
          required: !field.optional,
          onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setValues((current) => ({ ...current, [field.id]: event.target.value }));
            if (status === 'failed') setStatus('idle');
          },
          onBlur: () => setTouched((current) => ({ ...current, [field.id]: true })),
        };
        return (
          <div key={field.id} className={`gm-field${field.multiline ? ' gm-field--wide' : ''}`} data-filled={value.trim() ? true : undefined} data-error={error ? true : undefined}>
            <label htmlFor={common.id}>
              {field.label}
              {field.optional && <small> · facoltativo</small>}
            </label>
            {field.multiline
              ? <textarea {...common} rows={4} />
              : <input {...common} type={field.type ?? 'text'} />}
            <span className="gm-field-line" aria-hidden="true" />
            <p className="gm-field-error" id={`contact-${field.id}-error`} aria-live="polite">{error ?? ''}</p>
          </div>
        );
      })}

      {/* Left empty by people, filled by bots. */}
      <div className="gm-honeypot" aria-hidden="true">
        <label htmlFor="contact-website">Sito web</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="gm-form-actions">
        <button className="gm-btn gm-btn--primary gm-btn--large gm-submit" type="submit" data-status={status} disabled={status === 'sending'}>
          <span className="gm-submit-label">{status === 'sending' ? 'Invio' : 'Invia il messaggio'}</span>
          {status === 'sending'
            ? <span className="gm-submit-dots" aria-hidden="true"><i /><i /><i /></span>
            : <span className="gm-btn-arrow" aria-hidden="true">→</span>}
        </button>
        <p className="gm-form-note">Usiamo i tuoi dati solo per risponderti. <a href="/privacy">Informativa privacy</a></p>
        <p className="gm-form-status" role="alert">
          {status === 'failed' ? 'Qualcosa non ha funzionato. Controlla i dati inseriti e riprova.' : ''}
        </p>
      </div>
    </form>
  );
}
