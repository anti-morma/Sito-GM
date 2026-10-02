import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProjectPreview from '../../project-preview';
import Reveal from '../../reveal';
import SectionLabel from '../../section-label';
import SiteFooter from '../../site-footer';
import { Closing } from '../../inner';
import { caseStudies, type CaseStudy } from '../../content';
import { jsonLd, pageMetadata, studyLd, studyPath } from '../../seo';
import '../case-study.css';

// One page per project, built at deploy time from content.ts.
export const dynamicParams = false;
export const generateStaticParams = () => caseStudies.map((project) => ({ slug: project.study.slug }));

const find = (slug: string) => caseStudies.find((project) => project.study.slug === slug);
const pad = (index: number) => String(index + 1).padStart(2, '0');
const NEW_TAB = <span className="gm-sr-only"> (si apre in una nuova scheda)</span>;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const project = find((await params).slug);
  if (!project) return {};
  return pageMetadata({
    path: studyPath(project.study),
    title: project.study.seoTitle,
    description: project.study.seoDescription,
    type: 'article',
    image: project.preview ? { url: `${project.preview}-poster.jpg`, width: 1280, height: 800, alt: `Homepage del sito realizzato per ${project.name}` } : undefined,
  });
}

type Chapter = { id: string; title: string; body: React.ReactNode; aside?: React.ReactNode };

/** The chapters of a case study, the same for every project: PROBLEM →
 *  DECISION → SOLUTION → EXPERIENCE. Inside the solution, each side of the
 *  work has a short heading; any part left empty in content.ts is not shown. */
function chaptersOf(study: CaseStudy, phone: React.ReactNode): Chapter[] {
  const list = (items: string[]) => <ul className="gm-case-work">{items.map((item) => <li key={item}>{item}</li>)}</ul>;
  const part = (title: string, body: React.ReactNode) => (
    <div className="gm-case-part" key={title}>
      <h3>{title}</h3>
      {body}
    </div>
  );
  const solution = [
    study.ux && part('Esperienza utente', <p>{study.ux}</p>),
    study.design && part('Direzione visiva', <p>{study.design}</p>),
    !!study.technology?.length && part('Tecnologia', list(study.technology)),
    study.motion && part('Motion e interazione', <p>{study.motion}</p>),
    !!study.seo?.length && part('Farsi trovare', list(study.seo)),
  ].filter(Boolean);
  const all: (Chapter | false)[] = [
    {
      id: 'problema',
      title: 'Il problema',
      body: <>
        <p>{study.challenge}</p>
        {!!study.goals?.length && part('Gli obiettivi', list(study.goals))}
      </>,
    },
    { id: 'decisione', title: 'La decisione', body: <>{[study.idea, study.strategy].filter(Boolean).map((text) => <p key={text}>{text}</p>)}</> },
    solution.length > 0 && { id: 'soluzione', title: 'La soluzione', body: <>{solution}</> },
    !!study.mobile && { id: 'telefono', title: 'L’esperienza su telefono', body: <p>{study.mobile}</p>, aside: phone },
  ];
  return all.filter((chapter): chapter is Chapter => !!chapter);
}

/**
 * A case study, the model for every project to come: the facts at a glance,
 * the site at work, the reasoning in four chapters, the result and what was
 * delivered, and the next project. Figures and the
 * client's words appear only once they are real (content.ts).
 */
export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const project = find((await params).slug);
  if (!project) notFound();
  const { study } = project;
  const index = caseStudies.indexOf(project);
  const next = caseStudies[(index + 1) % caseStudies.length];
  const host = project.href ? new URL(project.href).hostname.replace(/^www\./, '') : '';
  const phone = project.preview && (
    <div className="gm-case-phone-frame">
      <ProjectPreview src={project.preview} name={project.name} only="phone" />
    </div>
  );
  const chapters = chaptersOf(study, phone);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(studyLd(project))} />

      {/* The page and its footer share one light at the bottom: the dawn. */}
      <div className="gm-page">
        <main className="gm-case" id="contenuto">
          {/* Who, where, what, at a glance. */}
          <section className="gm-case-hero gm-wrap" aria-labelledby="case-title">
            <nav className="gm-case-crumbs" aria-label="Percorso">
              <Link href="/">Home</Link><span aria-hidden="true">/</span>
              <Link href="/progetti">Progetti</Link><span aria-hidden="true">/</span>
              <span aria-current="page">{project.name}</span>
            </nav>
            <SectionLabel>Caso studio · {pad(index)} / {pad(caseStudies.length - 1)}</SectionLabel>
            <h1 className="gm-case-title" id="case-title">{project.name}</h1>
            <p className="gm-case-headline"><em>{study.headline}</em></p>
            <p className="gm-case-overview">{study.overview}</p>
            <dl className="gm-case-meta">
              <div><dt>Cliente</dt><dd>{study.client}</dd></div>
              <div><dt>Dove</dt><dd>{study.place}</dd></div>
              <div><dt>Settore</dt><dd>{study.sector}</dd></div>
              <div>
                <dt>Il nostro lavoro</dt>
                <dd>{study.services.join(' · ')}</dd>
              </div>
              {study.year && <div><dt>Anno</dt><dd>{study.year}</dd></div>}
              {project.href && (
                <div><dt>Online</dt><dd><a className="gm-case-live" href={project.href} target="_blank" rel="noopener" data-cta="sito-cliente" data-project={project.name}>{host} <span aria-hidden="true">↗</span>{NEW_TAB}</a></dd></div>
              )}
            </dl>
          </section>

          {/* The site at work, in a browser window: it plays as soon as it
              appears, and a click opens the live site. */}
          {project.preview && (
            <section className="gm-case-showcase gm-wrap" aria-label={`Il sito di ${project.name}`}>
              {project.href ? (
                <a className="gm-case-screen" href={project.href} target="_blank" rel="noopener" aria-label={`Apri il sito di ${project.name} in una nuova scheda`} data-reveal data-cta="sito-cliente" data-project={project.name}>
                  <div className="gm-case-screen-bar" aria-hidden="true"><i /><i /><i /><span>{host}</span></div>
                  <div className="gm-case-screen-view">
                    <ProjectPreview src={project.preview} name={project.name} only="wide" focus={0.05} />
                    <span className="gm-project-hover" aria-hidden="true">Visita il sito <span>↗</span></span>
                  </div>
                </a>
              ) : (
                <div className="gm-case-screen" data-reveal>
                  <div className="gm-case-screen-bar" aria-hidden="true"><i /><i /><i /><span>{host}</span></div>
                  <div className="gm-case-screen-view">
                    <ProjectPreview src={project.preview} name={project.name} only="wide" focus={0.05} />
                  </div>
                </div>
              )}
            </section>
          )}

          {/* The reasoning: problem → decision → solution → experience. */}
          <section className="gm-case-story gm-wrap" aria-label="Il progetto, capitolo per capitolo">
            {chapters.map((chapter, number) => (
              <article key={chapter.id} className={chapter.aside ? 'gm-case-chapter gm-case-chapter--aside' : 'gm-case-chapter'} aria-labelledby={`chapter-${chapter.id}`} data-reveal>
                <h2 id={`chapter-${chapter.id}`}><span aria-hidden="true">{pad(number)}</span>{chapter.title}</h2>
                <div className="gm-case-chapter-body">
                  {chapter.body}
                  {chapter.aside}
                </div>
              </article>
            ))}
          </section>

          {/* The result, and what was delivered. */}
          <section className="gm-case-result gm-wrap" aria-labelledby="case-result">
            <div data-reveal>
              <h2 id="case-result"><span aria-hidden="true">{pad(chapters.length)}</span>Il risultato</h2>
              <p className="gm-case-statement">{study.result}</p>
            </div>
            <div className="gm-case-delivered" data-reveal>
              <h3>Che cosa abbiamo consegnato</h3>
              <ul className="gm-case-work">{study.work.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            {study.metrics && study.metrics.length > 0 && (
              <ul className="gm-case-metrics" data-reveal>
                {study.metrics.map((metric) => <li key={metric.label}><strong>{metric.value}</strong><span>{metric.label}</span></li>)}
              </ul>
            )}
            {study.quote && (
              <figure className="gm-case-quote" data-reveal>
                <blockquote><p>“{study.quote.text}”</p></blockquote>
                <figcaption><strong>{study.quote.author}</strong>{study.quote.role}</figcaption>
              </figure>
            )}
            {project.href && (
              <a className="gm-btn gm-btn--ghost gm-case-visit" href={project.href} target="_blank" rel="noopener" data-reveal data-cta="sito-cliente" data-project={project.name}>
                Visita {host} <span className="gm-btn-arrow" aria-hidden="true">↗</span>{NEW_TAB}
              </a>
            )}
          </section>

          {/* On to the next project. */}
          {next !== project && (
            <nav className="gm-case-next gm-wrap" aria-label="Progetto successivo">
              <Link href={studyPath(next.study)}>
                <span className="gm-case-next-label">Progetto successivo</span>
                <span className="gm-case-next-name">{next.name} <span className="gm-btn-arrow" aria-hidden="true">→</span></span>
                <span className="gm-case-next-line">{next.study.headline}</span>
              </Link>
            </nav>
          )}

          {/* The call. */}
          <Closing title={<>Hai un progetto con una storia da raccontare?</>} text="Partiamo dal problema, come abbiamo fatto qui. Raccontaci che cosa deve ottenere il tuo sito." position="caso-studio" />
        </main>
        <SiteFooter cta={false} />
      </div>
      <Reveal />
    </>
  );
}
