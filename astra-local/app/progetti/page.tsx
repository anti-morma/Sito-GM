import Link from 'next/link';
import Reveal from '../reveal';
import SiteFooter from '../site-footer';
import { Closing, PageIntro } from '../inner';
import { caseStudies } from '../content';
import { jsonLd, pageMetadata, projectsLd, studyPath } from '../seo';

const DESCRIPTION = 'Casi studio di GoMore: siti web e digital experience reali, online, raccontati dal problema alla soluzione. Lalinga Oro, Residenza Vedovelli.';

export const metadata = pageMetadata({ path: '/progetti', title: 'Progetti e casi studio', description: DESCRIPTION });

const host = (href: string) => new URL(href).hostname.replace(/^www\./, '');

/** /progetti: real, live work, each project leading to its case study. */
export default function ProjectsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(projectsLd(DESCRIPTION))} />
      <div className="gm-page">
        <main className="gm-inner" id="contenuto">
          <PageIntro
            crumbs={[{ name: 'Progetti' }]}
            label="Progetti"
            title={<>Made to be <em>seen.</em></>}
            lead={['Progetti digitali costruiti per attirare lo sguardo, guidare l’esperienza e lasciare un’impressione.']}
          />

          <section className="gm-section" aria-label="Casi studio">
            <div className="gm-wrap">
              <ol className="gm-rows">
                {caseStudies.map((project) => (
                  <li key={project.name} className="gm-row" data-reveal>
                    <Link className="gm-row-media" href={studyPath(project.study)} tabIndex={-1} aria-hidden="true">
                      {project.preview && <img src={`${project.preview}-poster.jpg`} width={1280} height={800} alt="" loading="lazy" decoding="async" />}
                    </Link>
                    <div>
                      <p className="gm-row-category">{project.study.place} · {project.study.sector}</p>
                      <h2>{project.name}</h2>
                      <p className="gm-row-headline">{project.study.headline}</p>
                      <p className="gm-row-text">{project.description}</p>
                      <div className="gm-row-actions">
                        <Link className="gm-btn gm-btn--ghost" href={studyPath(project.study)} data-cta="progetto" data-project={project.name}>
                          Leggi il caso studio <span className="gm-sr-only">di {project.name}</span> <span className="gm-btn-arrow" aria-hidden="true">→</span>
                        </Link>
                        {project.href && (
                          <a className="gm-project-live" href={project.href} target="_blank" rel="noopener" data-cta="sito-cliente" data-project={project.name}>
                            Visita {host(project.href)} <span className="gm-btn-arrow" aria-hidden="true">↗</span><span className="gm-sr-only"> (si apre in una nuova scheda)</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <Closing title={<>Il prossimo potrebbe essere il tuo.</>} text="Raccontaci che cosa vuoi costruire: partiamo dal problema, come sempre." position="progetti" />
        </main>
        <SiteFooter cta={false} />
      </div>
      <Reveal />
    </>
  );
}
