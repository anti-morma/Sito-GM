// The building blocks of every inner page (servizi, progetti, contatti, the
// cities): one opening, one closing, the project tiles, and prose with links.
// Same type, labels, hairlines and light as the home (globals.css, inner.css).
import Link from 'next/link';
import SectionLabel from './section-label';
import type { Project } from './content';
import { studyPath } from './seo';
import './inner.css';

export type Crumb = { name: string; path?: string };

/** The page's opening: where it sits (breadcrumbs), its kicker, its one H1 and its lead. */
export function PageIntro({ crumbs, label, title, lead, children }: {
  crumbs: Crumb[];
  label: React.ReactNode;
  title: React.ReactNode;
  lead?: string[];
  children?: React.ReactNode;
}) {
  return (
    <section className="gm-intro-section gm-wrap" aria-labelledby="page-title">
      <nav className="gm-crumbs" aria-label="Percorso">
        <ol>
          <li><Link href="/">Home</Link></li>
          {crumbs.map((crumb) => (
            <li key={crumb.name}>
              {crumb.path ? <Link href={crumb.path}>{crumb.name}</Link> : <span aria-current="page">{crumb.name}</span>}
            </li>
          ))}
        </ol>
      </nav>
      <SectionLabel>{label}</SectionLabel>
      <h1 className="gm-page-title" id="page-title">{title}</h1>
      {lead && <div className="gm-page-lead">{lead.map((line) => <p key={line}>{line}</p>)}</div>}
      {children}
    </section>
  );
}

/** Real projects, each with what it has to do with this page. */
export function ProjectTiles({ items, headingLevel = 3 }: { items: { project: Project; note?: string }[]; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <ul className="gm-tiles">
      {items.map(({ project, note }) => {
        const href = project.study ? studyPath(project.study) : project.href ?? '#';
        return (
          <li key={project.name} className="gm-tile" data-reveal>
            <Link href={href} className="gm-tile-link">
              {project.preview && (
                <span className="gm-tile-media">
                  <img src={`${project.preview}-poster.jpg`} width={1280} height={800} alt={`Homepage del sito realizzato per ${project.name}`} loading="lazy" decoding="async" />
                </span>
              )}
              <span className="gm-tile-text">
                <span className="gm-tile-category">{project.category}</span>
                <Heading className="gm-tile-name">{project.name}</Heading>
                <span className="gm-tile-note">{note ?? project.description}</span>
                <span className="gm-tile-more">Leggi il caso studio <span className="gm-btn-arrow" aria-hidden="true">→</span></span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** The last section of every inner page: one question, one action. */
export function Closing({ title, text, action = 'Parliamo del tuo progetto', href = '/contatti', position }: {
  title: React.ReactNode;
  text: string;
  action?: string;
  href?: string;
  /** For the analytics (tracking.tsx): where this button is. */
  position: string;
}) {
  return (
    <section className="gm-closing gm-section" aria-labelledby="closing-title">
      <div className="gm-wrap gm-closing-wrap" data-reveal>
        <h2 className="gm-h2 gm-h2--xl" id="closing-title">{title}</h2>
        <p className="gm-lead">{text}</p>
        <Link className="gm-btn gm-btn--primary gm-btn--large" href={href} data-cta={position}>
          {action} <span className="gm-btn-arrow" aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
