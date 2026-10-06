import SectionLabel from './section-label';
import SiteFooter from './site-footer';
import { site } from './content';
import { telHref } from './studio-details';

/** Who answers for the data: the owners (joint controllers), with their
 *  P.IVA, and how to reach them. Shared by the privacy and cookie policies. */
export function Controllers() {
  return (
    <>
      <ul>
        {site.owners.map((o) => <li key={o.vat}><strong>{o.name}</strong>, P.IVA {o.vat}</li>)}
      </ul>
      <p>
        {site.address && <>Sede: {site.address}<br /></>}
        E-mail: <a href={`mailto:${site.email}`}>{site.email}</a>
        {site.pec && <> · PEC: {site.pec}</>}
        {site.phones.length > 0 && <><br />Telefono: {site.phones.map((v, i) => <span key={v}>{i > 0 && ' · '}<a href={telHref(v)}>{v}</a></span>)}</>}
      </p>
    </>
  );
}

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
