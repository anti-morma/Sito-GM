import Link from 'next/link';
import { site } from './content';
import { contactDetails, DetailText, legalDetails } from './studio-details';

export default function SiteFooter({ cta = true }: { cta?: boolean }) {
  const contacts = contactDetails();
  const legal = legalDetails();
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
          {/* The studio and its legal details. */}
          <div className="gm-footer-studio">
            <p className="gm-footer-brand">{site.name}</p>
            <p>Studio digitale indipendente · Italia</p>
            {legal.length > 0 && (
              <p className="gm-footer-legal">
                {legal.map((item) => <span key={item.key}><DetailText item={item} /></span>)}
              </p>
            )}
          </div>
          {contacts.length > 0 && (
            <ul className="gm-footer-contacts" aria-label="Contatti">
              {contacts.map((item) => <li key={item.key}><DetailText item={item} /></li>)}
            </ul>
          )}
          <ul aria-label="Informazioni legali">
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/cookie">Cookie</Link></li>
            <li><span>© {new Date().getFullYear()} {site.name}</span></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
