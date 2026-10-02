import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Reveal from '../../reveal';
import SectionLabel from '../../section-label';
import SiteFooter from '../../site-footer';
import { Closing, PageIntro, ProjectTiles, ServiceLinks } from '../../inner';
import { jsonLd, pageMetadata, projectBySlug, serviceLd } from '../../seo';
import { findService, servicePath, services } from '../../services';

// One page per discipline, built at deploy time from services.ts.
export const dynamicParams = false;
export const generateStaticParams = () => services.map((service) => ({ slug: service.slug }));

const pad = (index: number) => String(index + 1).padStart(2, '0');

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const service = findService((await params).slug);
  if (!service) return {};
  return pageMetadata({ path: servicePath(service), title: service.seoTitle, description: service.description });
}

/**
 * A service: what it is for (the lead), what it covers and why each part
 * matters, our position on it, the real work that shows it, the other
 * disciplines, and one action.
 */
export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const service = findService((await params).slug);
  if (!service) notFound();
  const index = services.indexOf(service);
  const work = service.projects.flatMap(({ slug, note }) => {
    const project = projectBySlug(slug);
    return project ? [{ project, note }] : [];
  });
  const others = services.filter((other) => other !== service);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(serviceLd(service))} />
      <div className="gm-page">
        <main className="gm-inner" id="contenuto">
          <PageIntro
            crumbs={[{ name: 'Servizi', path: '/servizi' }, { name: service.name }]}
            label={`Servizi · ${pad(index)} / ${pad(services.length - 1)}`}
            title={service.title}
            lead={service.lead}
          />

          {/* What it covers, and what each part is for. */}
          <section className="gm-section" aria-labelledby="parts-title">
            <div className="gm-wrap gm-split">
              <header data-reveal>
                <SectionLabel>{service.name}</SectionLabel>
                <h2 className="gm-h2" id="parts-title">{service.partsTitle}</h2>
              </header>
              <div className="gm-split-body" data-reveal>
                <ol className="gm-numbered">
                  {service.parts.map((part, number) => (
                    <li key={part.title}>
                      <span className="gm-numbered-index" aria-hidden="true">{pad(number)}</span>
                      <h3>{part.title}</h3>
                      <p>{part.text}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          {/* Our position on it, plainly. */}
          {(service.stance || service.example) && (
            <section className="gm-section" aria-labelledby="stance-title">
              <div className="gm-wrap gm-split">
                <header data-reveal>
                  <SectionLabel>Il nostro punto di vista</SectionLabel>
                  <h2 className="gm-h2" id="stance-title">{service.stance?.title ?? 'In pratica'}</h2>
                </header>
                <div className="gm-split-body" data-reveal>
                  {service.stance?.text.map((line) => <p key={line}>{line}</p>)}
                  {service.example && (
                    <aside className="gm-aside">
                      <h3>{service.example.title}</h3>
                      <p>{service.example.text}</p>
                    </aside>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* The work that shows it, or an honest "not yet". */}
          <section className="gm-section" aria-labelledby="work-title">
            <div className="gm-wrap">
              <header className="gm-section-head" data-reveal>
                <SectionLabel>Progetti</SectionLabel>
                <h2 className="gm-h2" id="work-title">{service.name} nei nostri progetti.</h2>
              </header>
              {work.length > 0
                ? <ProjectTiles items={work} />
                : (
                  <div data-reveal>
                    <p className="gm-aside">{service.noProjects}</p>
                    <Link className="gm-link" href="/progetti">Guarda i progetti pubblicati <span className="gm-btn-arrow" aria-hidden="true">→</span></Link>
                  </div>
                )}
            </div>
          </section>

          {/* The other disciplines, and where we work. */}
          <section className="gm-section" aria-labelledby="others-title">
            <div className="gm-wrap">
              <header className="gm-section-head" data-reveal>
                <SectionLabel>Gli altri servizi</SectionLabel>
                <h2 className="gm-h2" id="others-title">Raramente da solo.</h2>
                <p className="gm-lead">Ogni progetto unisce più competenze, nella misura in cui servono.</p>
              </header>
              <ServiceLinks items={others} label="Gli altri servizi" />
            </div>
          </section>

          <Closing title={<>Parliamo del tuo progetto.</>} text="Raccontaci che cosa deve ottenere: capiamo insieme se, e come, possiamo aiutarti." position={`servizio-${service.slug}`} />
        </main>
        <SiteFooter cta={false} />
      </div>
      <Reveal />
    </>
  );
}
