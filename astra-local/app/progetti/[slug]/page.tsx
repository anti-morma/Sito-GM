import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProjectPreview from '../../project-preview';
import Reveal from '../../reveal';
import SectionLabel from '../../section-label';
import SiteFooter from '../../site-footer';
import { caseStudies, primaryCta, site } from '../../content';
import { jsonLd, openGraphBase, studyLd, studyPath } from '../../seo';
import '../case-study.css';

// One page per project, built at deploy time from content.ts.
export const dynamicParams = false;
export const generateStaticParams = () => caseStudies.map((project) => ({ slug: project.study.slug }));

const find = (slug: string) => caseStudies.find((project) => project.study.slug === slug);
const pad = (index: number) => String(index + 1).padStart(2, '0');

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const project = find((await params).slug);
  if (!project) return {};
  const path = studyPath(project.study);
  const image = project.preview ? [{ url: `${project.preview}-poster.jpg`, alt: `Homepage di ${project.name}` }] : undefined;
  return {
    title: project.study.seoTitle,
    description: project.description,
    alternates: { canonical: path },
    openGraph: { ...openGraphBase, type: 'article', url: path, title: `${project.name} — ${project.study.headline}`, description: project.description, images: image },
    twitter: { card: 'summary_large_image', title: `${project.name} — ${project.study.headline}`, description: project.description, images: image?.map((item) => item.url) },
  };
}

/**
 * A case study, told like a visit: who the client is, the site at work, the
 * problem, the idea, what was built, and what changed. Figures and the
 * client's words appear only once they are real (content.ts).
 */
export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const project = find((await params).slug);
  if (!project) notFound();
  const { study } = project;
  const index = caseStudies.indexOf(project);
  const next = caseStudies[(index + 1) % caseStudies.length];
  const host = project.href ? new URL(project.href).hostname.replace(/^www\./, '') : '';
  const chapters = [
    { title: 'La sfida', body: <p>{study.challenge}</p> },
    { title: 'L’idea', body: <p>{study.idea}</p> },
    { title: 'Cosa abbiamo fatto', body: <ul className="gm-case-work">{study.work.map((item) => <li key={item}>{item}</li>)}</ul> },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(studyLd(project))} />
      <header className="gm-case-header">
        <Link className="gm-logo" href="/" aria-label={`${site.name} — torna alla home`} />
        <Link className="gm-case-back" href="/#progetti"><span aria-hidden="true">←</span> Tutti i progetti</Link>
        <Link className="gm-btn gm-btn--primary gm-btn--small gm-case-cta" href="/#modulo" data-cta="caso-studio-header">{primaryCta}</Link>
      </header>

      {/* The page and its footer share one light at the bottom: the dawn. */}
      <div className="gm-page">
        <main className="gm-case" id="contenuto">
          {/* Who, where, what: the facts at a glance. */}
          <section className="gm-case-hero gm-wrap" aria-labelledby="case-title">
            <nav className="gm-case-crumbs" aria-label="Percorso">
              <Link href="/">{site.name}</Link><span aria-hidden="true">/</span>
              <Link href="/#progetti">Progetti</Link><span aria-hidden="true">/</span>
              <span aria-current="page">{project.name}</span>
            </nav>
            <SectionLabel>Caso studio · {pad(index)} / {pad(caseStudies.length - 1)}</SectionLabel>
            <h1 className="gm-case-title" id="case-title">{project.name}</h1>
            <p className="gm-case-headline"><em>{study.headline}</em></p>
            <dl className="gm-case-meta">
              <div><dt>Cliente</dt><dd>{study.client}</dd></div>
              <div><dt>Dove</dt><dd>{study.place}</dd></div>
              <div><dt>Settore</dt><dd>{study.sector}</dd></div>
              <div><dt>Il nostro lavoro</dt><dd>{study.services.join(' · ')}</dd></div>
              {study.year && <div><dt>Anno</dt><dd>{study.year}</dd></div>}
              {project.href && (
                <div><dt>Online</dt><dd><a className="gm-case-live" href={project.href} target="_blank" rel="noopener" data-cta="sito-cliente" data-project={project.name}>{host} <span aria-hidden="true">↗</span><span className="gm-sr-only"> (si apre in una nuova scheda)</span></a></dd></div>
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

          {/* The story, chapter by chapter. */}
          <section className="gm-case-story gm-wrap" aria-label="Il progetto">
            {chapters.map((chapter, number) => (
              <article key={chapter.title} className="gm-case-chapter" data-reveal>
                <h2><span>{pad(number)}</span>{chapter.title}</h2>
                <div className="gm-case-chapter-body">{chapter.body}</div>
              </article>
            ))}
          </section>

          {/* The same site in the hand: the phone version. */}
          {project.preview && (
            <section className="gm-case-phone gm-wrap" aria-label="Il sito su telefono">
              <div className="gm-case-phone-copy" data-reveal>
                <SectionLabel>Su telefono</SectionLabel>
                <p>Oggi si naviga soprattutto dallo smartphone: ogni sezione è pensata anche per lo schermo in verticale, non solo rimpicciolita.</p>
              </div>
              <div className="gm-case-phone-frame" data-reveal>
                <ProjectPreview src={project.preview} name={project.name} only="phone" />
              </div>
            </section>
          )}

          {/* What changed. */}
          <section className="gm-case-result gm-wrap" aria-labelledby="case-result">
            <div data-reveal>
              <h2 id="case-result"><span>{pad(chapters.length)}</span>Il risultato</h2>
              <p className="gm-case-statement">{study.result}</p>
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
                Visita {host} <span className="gm-btn-arrow" aria-hidden="true">↗</span><span className="gm-sr-only"> (si apre in una nuova scheda)</span>
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
        </main>
        <SiteFooter />
      </div>
      <Reveal />
    </>
  );
}
