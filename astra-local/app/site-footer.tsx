import Link from 'next/link';
import { site } from './content';

export default function SiteFooter({ cta = true }: { cta?: boolean }) {
  const legal = [site.legalName, site.vat && `P.IVA ${site.vat}`, site.address].filter(Boolean).join(' · ');
  return (
    <footer className="gm-footer">
      <div className="gm-wrap">
        {cta && (
          <div className="gm-footer-cta">
            <p>Hai un progetto in mente?</p>
            <Link className="gm-btn gm-btn--primary gm-btn--large" href="/#contatti">
              Parliamo del tuo progetto <span className="gm-btn-arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        )}
        <div className="gm-footer-bottom">
          <div>
            <p className="gm-footer-brand">{site.name}</p>
            <p>Studio digitale indipendente · Italia</p>
            {legal && <p>{legal}</p>}
          </div>
          <ul>
            {site.email && <li><a href={`mailto:${site.email}`}>{site.email}</a></li>}
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/cookie">Cookie</Link></li>
            <li><span>© {new Date().getFullYear()} {site.name}</span></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
