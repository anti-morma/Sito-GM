import { Fragment } from 'react';
import { site } from './content';

// The studio's contacts and legal details, from content.ts, in one place for
// the footer, the phone menu and the contact section. The published site shows
// only what is filled in; in development the empty ones appear as dimmed
// placeholders, to show where each detail will go.
const preview = process.env.NODE_ENV !== 'production';

type Detail = { key: string; kind?: 'email' | 'phone'; text: string; href?: string; missing?: boolean; line?: boolean };

const detail = (key: string, value: string, placeholder: string, format = (v: string) => v, href?: (v: string) => string): Detail[] =>
  value ? [{ key, text: format(value), href: href?.(value) }]
    : preview ? [{ key, text: placeholder, missing: true }]
    : [];

/** A phone as a link that dials it, Italian prefix included. */
export const telHref = (v: string) => `tel:${v.startsWith('+') ? '' : '+39'}${v.replace(/[^\d+]/g, '')}`;

export const contactDetails = () => [
  ...detail('email', site.email, 'E-mail', undefined, (v) => `mailto:${v}`).map((d): Detail => ({ ...d, kind: 'email' })),
  ...(site.phones.length
    ? site.phones.map((v): Detail => ({ key: `phone-${v}`, kind: 'phone', text: v, href: telHref(v) }))
    : detail('phone', '', 'Telefono').map((d): Detail => ({ ...d, kind: 'phone' }))),
];

export const legalDetails = () => [
  // The owners, one per line, each with their P.IVA; otherwise a single holder.
  ...(site.owners.length
    ? site.owners.map((o): Detail => ({ key: `owner-${o.vat}`, text: `${o.name} · P.IVA ${o.vat}`, line: true }))
    : [...detail('name', site.legalName, 'Ragione sociale'), ...detail('vat', site.vat, 'P.IVA', (v) => `P.IVA ${v}`)]),
  // Sede legale and PEC: only once filled in, never as placeholders.
  ...(site.address ? [{ key: 'address', text: site.address }] : []),
  ...(site.pec ? [{ key: 'pec', text: `PEC ${site.pec}` }] : []),
];

/** A detail that sits on a line of its own (an owner and their P.IVA). */
export const detailClass = (item: Detail) => (item.line ? 'gm-detail-line' : undefined);

/** A handset, so a bare number reads as a phone at a glance. */
const PhoneIcon = () => (
  <svg className="gm-detail-icon" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

/** One detail: a link when it has one, a dimmed placeholder while it is missing.
 *  With `icon`, where a number stands alone (footer, phone menu), a phone shows its handset. */
export function DetailText({ item, icon = false }: { item: Detail; icon?: boolean }) {
  if (item.missing) return <span className="gm-detail-missing" title="Da completare in app/content.ts">{item.text}</span>;
  if (icon && item.kind === 'phone' && item.href) {
    return <a className="gm-detail-with-icon" href={item.href}><PhoneIcon /><span className="gm-sr-only">Telefono: </span>{item.text}</a>;
  }
  return item.href ? <a href={item.href}>{item.text}</a> : <>{item.text}</>;
}

/** The contacts as a sentence: "scrivici a … oppure chiamaci al … o al …".
 *  `emailText` replaces the address as the link text (e.g. "e-mail"). */
export function ContactWays({ items, emailLead, emailText, or = ' oppure ' }: { items: Detail[]; emailLead: string; emailText?: string; or?: string }) {
  const email = items.find((item) => item.kind === 'email');
  const phones = items.filter((item) => item.kind === 'phone');
  return (
    <>
      {email && <>{emailLead}<DetailText item={emailText && !email.missing ? { ...email, text: emailText } : email} /></>}
      {email && phones.length > 0 && or}
      {phones.map((item, index) => <Fragment key={item.key}>{index ? ' o al ' : 'chiamaci al '}<DetailText item={item} /></Fragment>)}
    </>
  );
}
