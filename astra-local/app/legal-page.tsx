import SectionLabel from './section-label';
import SiteFooter from './site-footer';
import { site } from './content';

export const owner = () => ({
  name: site.owners.length ? site.owners.map((o) => o.name).join(' e ') : site.legalName || '[Ragione sociale da completare]',
  vat: site.owners.length ? site.owners.map((o) => `${o.name}: P.IVA ${o.vat}`).join(', ') : site.vat || '[P.IVA da completare]',
  address: site.address || '[Sede legale da completare]',
  email: site.email || '[E-mail di contatto da completare]',
});

export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <main className="gm-legal gm-wrap" id="contenuto">
        <SectionLabel>Informazioni legali</SectionLabel>
        <h1 className="gm-h2">{title}</h1>
        <p className="gm-legal-updated">Ultimo aggiornamento: {updated}</p>
        <div className="gm-legal-body">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
