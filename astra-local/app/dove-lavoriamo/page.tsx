import Reveal from '../reveal';
import SectionLabel from '../section-label';
import SiteFooter from '../site-footer';
import Link from 'next/link';
import { Closing, PageIntro, ProjectTiles } from '../inner';
import { caseStudies } from '../content';
import { where, wherePath } from '../places';
import { jsonLd, pageMetadata, whereLd } from '../seo';
import { services } from '../services';

export const metadata = pageMetadata({ path: wherePath, title: where.seoTitle, description: where.description });

/**
 * Where we work: present in Torino and Taranto, open to the whole country.
 * The two cities, then everywhere else, the work that proves both, what we
 * do, and the way to talk. The old city pages (/torino, /taranto) lead here.
 */
export default function WherePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(whereLd())} />
      <div className="gm-page">
        <main className="gm-inner" id="contenuto">
          <PageIntro crumbs={[{ name: 'Dove lavoriamo' }]} label="Dove lavoriamo" title={where.title} lead={where.lead} />

          {where.sections.map((section, index) => (
            <section key={section.title} className="gm-section" aria-labelledby={`where-${index}`}>
              <div className="gm-wrap gm-split">
                <header data-reveal>
                  <h2 className="gm-h2" id={`where-${index}`}>{section.title}</h2>
                </header>
                <div className="gm-split-body" data-reveal>
                  {section.text.map((line) => <p key={line}>{line}</p>)}
                  <Link className="gm-link" href={section.link.href}>{section.link.text} <span className="gm-btn-arrow" aria-hidden="true">→</span></Link>
                </div>
              </div>
            </section>
          ))}

          {/* The work: one project in Taranto, one far from both cities. */}
          <section className="gm-section" aria-labelledby="where-work">
            <div className="gm-wrap">
              <header className="gm-section-head" data-reveal>
                <SectionLabel>Progetti</SectionLabel>
                <h2 className="gm-h2" id="where-work">Vicino o lontano, lo stesso metodo.</h2>
              </header>
              <ProjectTiles items={caseStudies.map((project) => ({ project, note: `${project.study.place} · ${project.study.headline}` }))} />
            </div>
          </section>

          <section className="gm-section" aria-labelledby="where-services">
            <div className="gm-wrap">
              <header className="gm-section-head" data-reveal>
                <SectionLabel>Servizi</SectionLabel>
                <h2 className="gm-h2" id="where-services">Che cosa facciamo, ovunque tu sia.</h2>
              </header>
              <ul className="gm-names" aria-label="Le competenze" data-reveal>
                {services.map((service) => <li key={service.slug}>{service.name}</li>)}
              </ul>
              <Link className="gm-link" href="/servizi">Scopri i servizi <span className="gm-btn-arrow" aria-hidden="true">→</span></Link>
            </div>
          </section>

          <Closing title={<>Dove sei non conta. Che cosa vuoi costruire, sì.</>} text="Scrivici da qualsiasi città: ti rispondiamo per una prima consulenza, senza impegno." position="dove-lavoriamo" />
        </main>
        <SiteFooter cta={false} />
      </div>
      <Reveal />
    </>
  );
}
