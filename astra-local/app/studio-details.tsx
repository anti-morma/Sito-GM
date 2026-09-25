import { site } from './content';

// The studio's contacts and legal details, from content.ts, in one place for
// the footer, the phone menu and the contact section. The published site shows
// only what is filled in; in development the empty ones appear as dimmed
// placeholders, to show where each detail will go.
const preview = process.env.NODE_ENV !== 'production';

type Detail = { key: string; text: string; href?: string; missing?: boolean };

const detail = (key: string, value: string, placeholder: string, format = (v: string) => v, href?: (v: string) => string): Detail[] =>
  value ? [{ key, text: format(value), href: href?.(value) }]
    : preview ? [{ key, text: placeholder, missing: true }]
    : [];

export const contactDetails = () => [
  ...detail('email', site.email, 'E-mail', undefined, (v) => `mailto:${v}`),
  ...detail('phone', site.phone, 'Telefono', undefined, (v) => `tel:${v.replace(/[^\d+]/g, '')}`),
];

export const legalDetails = () => [
  ...detail('name', site.legalName, 'Ragione sociale'),
  ...detail('vat', site.vat, 'P.IVA', (v) => `P.IVA ${v}`),
  ...detail('address', site.address, 'Sede legale'),
  ...detail('pec', site.pec, 'PEC', (v) => `PEC ${v}`),
];

/** One detail: a link when it has one, a dimmed placeholder while it is missing. */
export function DetailText({ item }: { item: Detail }) {
  if (item.missing) return <span className="gm-detail-missing" title="Da completare in app/content.ts">{item.text}</span>;
  return item.href ? <a href={item.href}>{item.text}</a> : <>{item.text}</>;
}
