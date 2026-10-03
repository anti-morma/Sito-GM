'use client';

// gm-modulo-contatti · file comune: non modificarlo nel sito, si aggiorna con installa.mjs.
// Campi e testi stanno in config.ts, l'aspetto in form.css.

import { useEffect, useRef, useState } from 'react';
import config from './config';
import { emptyValues, maxLengthOf, validate, type ContactValues } from './fields';
import './form.css';

type Status = 'idle' | 'sending' | 'sent' | 'failed';
type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const FAILED = 'Qualcosa non ha funzionato. Riprova tra qualche minuto.';

export default function ContactForm() {
  const [values, setValues] = useState<ContactValues>(emptyValues);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [failure, setFailure] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const errors = validate(values);

  // Without JavaScript the endpoint sends people back here with the outcome in the address.
  useEffect(() => {
    const url = new URL(window.location.href);
    const outcome = url.searchParams.get('invio');
    if (!outcome) return;
    url.searchParams.delete('invio');
    window.history.replaceState(window.history.state, '', url);
    if (outcome === 'ok') setStatus('sent');
    else {
      setFailure(FAILED);
      setStatus('failed');
    }
  }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'sending') return;
    setTouched(Object.fromEntries(config.fields.map((field) => [field.name, true])));
    const firstInvalid = config.fields.find((field) => errors[field.name]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`#contact-${firstInvalid.name}`)?.focus();
      return;
    }
    setStatus('sending');
    const trap = (formRef.current?.elements.namedItem('website') as HTMLInputElement | null)?.value ?? '';
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...values, website: trap }),
      });
      const result = await response.json().catch(() => null) as { ok?: boolean; message?: string } | null;
      if (response.ok && result?.ok) {
        setStatus('sent');
        return;
      }
      setFailure(result?.message || FAILED);
      setStatus('failed');
    } catch {
      setFailure('Connessione non riuscita. Controlla la rete e riprova.');
      setStatus('failed');
    }
  };

  if (status === 'sent') {
    return (
      <div className="cf-sent" role="status" tabIndex={-1} ref={(node) => node?.focus()}>
        <p className="cf-sent-title">{config.text.sentTitle}</p>
        <p className="cf-sent-text">{config.text.sentText}</p>
      </div>
    );
  }

  return (
    <form ref={formRef} className="cf-form" method="post" action="/api/contact" noValidate onSubmit={submit} aria-busy={status === 'sending'}>
      {config.fields.map((field) => {
        const id = `contact-${field.name}`;
        const value = values[field.name] ?? '';
        const error = touched[field.name] ? errors[field.name] : undefined;
        const common = {
          id,
          name: field.name,
          value,
          required: Boolean(field.required),
          'aria-invalid': error ? true : undefined,
          'aria-describedby': error ? `${id}-error` : undefined,
          onChange: (event: React.ChangeEvent<Control>) => {
            setValues((current) => ({ ...current, [field.name]: event.target.value }));
            if (status === 'failed') setStatus('idle');
          },
          onBlur: () => setTouched((current) => ({ ...current, [field.name]: true })),
        };
        const text = { autoComplete: field.autoComplete, maxLength: maxLengthOf(field), placeholder: field.placeholder };
        return (
          <div
            key={field.name}
            className={`cf-field${field.wide || field.multiline ? ' cf-field--wide' : ''}`}
            data-filled={value.trim() ? true : undefined}
            data-error={error ? true : undefined}
          >
            <label htmlFor={id}>
              {field.label}
              {!field.required && !field.options && <small> · facoltativo</small>}
              {field.hint && <small> · {field.hint}</small>}
            </label>
            {field.options
              ? <select {...common}>{field.options.map((option) => <option key={option}>{option}</option>)}</select>
              : field.multiline
                ? <textarea {...common} {...text} rows={4} />
                : <input {...common} {...text} type={field.type ?? 'text'} />}
            <span className="cf-field-line" aria-hidden="true" />
            <p className="cf-field-error" id={`${id}-error`} aria-live="polite">{error ?? ''}</p>
          </div>
        );
      })}

      {/* Left empty by people, filled by bots. */}
      <div className="cf-honeypot" aria-hidden="true">
        <label htmlFor="contact-website">Sito web</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="cf-actions">
        <button
          className={`cf-submit ${config.submitClassName ?? ''}`.trim()}
          type="submit"
          data-status={status}
          disabled={status === 'sending'}
        >
          <span className="cf-submit-label">{status === 'sending' ? config.text.sending : config.text.submit}</span>
          {status === 'sending'
            ? <span className="cf-submit-dots" aria-hidden="true"><i /><i /><i /></span>
            : <span className="cf-submit-arrow" aria-hidden="true">→</span>}
        </button>
        <p className="cf-note">{config.text.note} <a href={config.text.privacyHref}>{config.text.privacyLabel}</a></p>
        <p className="cf-status" role="alert">{status === 'failed' ? failure : ''}</p>
      </div>
    </form>
  );
}
