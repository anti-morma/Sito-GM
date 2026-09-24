import Link from 'next/link';
import SiteFooter from './site-footer';
import { site } from './content';

export const owner = () => ({
  name: site.legalName || '[Ragione sociale da completare]',
  vat: site.vat || '[P.IVA da completare]',
  address: site.address || '[Sede legale da completare]',
  email: site.email || '[E-mail di contatto da completare]',
});

export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <header className="gm-legal-header">
        <Link className="gm-logo" href="/" aria-label={`${site.name} — torna alla home`} />
        <Link className="gm-link" href="/">← Torna al sito</Link>
      </header>
      <main className="gm-legal gm-wrap">
        <p className="gm-label">Informazioni legali</p>
        <h1 className="gm-h2">{title}</h1>
        <p className="gm-legal-updated">Ultimo aggiornamento: {updated}</p>
        <div className="gm-legal-body">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
