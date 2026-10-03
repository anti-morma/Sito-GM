import type { Metadata } from 'next';
import { Fragment } from 'react';
import Link from 'next/link';
import Bridge from './bridge';
import ContactForm from './_contact/form';
import GoMoreMobileIntro from './gomore-mobile-intro';
import GrowTextarea from './grow-textarea';
import Hero from './hero';
import HomeFilm from './home-film';
import HomeSummary from './home-summary';
import ParticleJourney from './particle-journey';
import ProjectCarousel from './project-carousel';
import ProjectPreview from './project-preview';
import Reveal from './reveal';
import ScrollCue from './scroll-cue';
import SectionLabel from './section-label';
import SiteFooter from './site-footer';
import { founders, projects, site, type Project } from './content';
import { homeLd, jsonLd, openGraphBase, siteSummary, studyPath } from './seo';
import { contactDetails, DetailText } from './studio-details';
import './home.css';


// The home's title is the layout's default ("GoMore | Web design, sviluppo e
// digital experiences"): the brand first, then what it does.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: { ...openGraphBase, url: '/', title: `${site.name} | Web design, sviluppo e digital experiences`, description: siteSummary, images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: `${site.name} — studio digitale` }] },
};

const delay = (ms: number) => ({ '--reveal-delay': `${ms}ms` }) as React.CSSProperties;
// Links that open another tab say so to screen readers too (the arrow is only drawn).
const NEW_TAB = <span className="gm-sr-only"> (si apre in una nuova scheda)</span>;

// Each project: the case study on this site first, the live site beside it.
function ProjectCard({ project }: { project: Project }) {
  const host = project.href ? new URL(project.href).hostname.replace(/^www\./, '') : '';
  const study = project.study ? studyPath(project.study) : '';
  const media = project.preview
    ? <ProjectPreview src={project.preview} name={project.name} />
    : project.image && <img src={project.image} alt={`Homepage di ${project.name}`} loading="lazy" />;
  return (
    <article className="gm-project" data-reveal>
      <div className="gm-project-text">
        <h3>{project.name}</h3>
        <p className="gm-project-category">{project.category}</p>
        <p className="gm-project-description">{project.description}</p>
        <div className="gm-project-actions">
          {study && (
            <Link className="gm-btn gm-btn--ghost" href={study} data-cta="progetto" data-project={project.name}>
              Scopri il progetto <span className="gm-btn-arrow" aria-hidden="true">→</span>
            </Link>
          )}
          {project.href && (
            <a className={study ? 'gm-project-live' : 'gm-btn gm-btn--ghost'} href={project.href} target="_blank" rel="noopener" data-cta="sito-cliente" data-project={project.name}>
              Visita {host} <span className="gm-btn-arrow" aria-hidden="true">↗</span>{NEW_TAB}
            </a>
          )}
        </div>
      </div>
      {study ? (
        <Link className="gm-project-media" href={study} aria-label={`${project.name}: scopri il progetto`} data-cta="progetto" data-project={project.name}>
          {media}
          <span className="gm-project-hover" aria-hidden="true">Scopri il progetto <span>→</span></span>
        </Link>
      ) : project.href ? (
        <a className="gm-project-media" href={project.href} target="_blank" rel="noopener" aria-label={`Apri il sito di ${project.name} in una nuova scheda`} data-cta="sito-cliente" data-project={project.name}>
          {media}
          <span className="gm-project-hover" aria-hidden="true">Visita il sito <span>↗</span></span>
        </a>
      ) : (
        <div className="gm-project-media">{media}</div>
      )}
    </article>
  );
}

export default function Home() {
  const contacts = contactDetails();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(homeLd())} />
      <GoMoreMobileIntro />
      <ParticleJourney />
      {/* The page and its footer share one light at the bottom: the dawn. */}
      <div className="gm-page">
        <main className="gm-site" id="contenuto">
          {/* Hero: the headline, and the GM made of stars */}
          <Hero />

          {/* What we do. Desktop: the film of the villa in a lit window
              (home-film.tsx); phones and tablets: one line of work at a time. */}
          <HomeFilm />
          <HomeSummary />

          {/* Projects: real, live work */}
          <section id="progetti" className="gm-section gm-projects" aria-labelledby="progetti-title" data-scroll-stop>
            <div className="gm-wrap">
              <header className="gm-projects-head" data-reveal>
                <SectionLabel>Progetti</SectionLabel>
                <h2 id="progetti-title" className="gm-h2">Progetti reali, <span className="gm-h2-line">online adesso.</span></h2>
              </header>
              <ProjectCarousel count={projects.length}>
                {projects.map((project) => <ProjectCard key={project.name} project={project} />)}
              </ProjectCarousel>
              <p className="gm-home-more" data-reveal>
                <Link className="gm-link" href="/progetti">Tutti i progetti e i casi studio <span className="gm-btn-arrow" aria-hidden="true">→</span></Link>
              </p>
            </div>
          </section>

          {/* Why GoMore, and who, in a few words: the whole story is on its own
              page (app/chi-siamo). */}
          <section id="chi-siamo" className="gm-section gm-about-stop" aria-labelledby="chi-siamo-title" data-scroll-stop>
            <div className="gm-wrap gm-about-stop-grid">
              <header data-reveal>
                <SectionLabel>Perché GoMore</SectionLabel>
                <h2 id="chi-siamo-title" className="gm-h2">Non costruiamo siti. <span className="gm-h2-line">Progettiamo esperienze che hanno un perché.</span></h2>
                <div className="gm-lead gm-about-stop-lead">
                  <p>Un sito efficace non nasce da un template, né dalla sola estetica. Parte da una comprensione: chi sei, cosa vuoi ottenere e cosa deve fare l’utente una volta arrivato.</p>
                  <p>Per questo uniamo strategia, UX/UI, design e sviluppo per costruire esperienze progettate intorno alla tua identità e ai tuoi obiettivi.</p>
                  <p>Ogni scelta ha un motivo.</p>
                </div>
              </header>
              <div className="gm-about-stop-side" data-reveal style={delay(120)}>
                <ul className="gm-about-stop-people" aria-label="I fondatori">
                  {founders.map((person) => <li key={person.name}><strong>{person.name}</strong><span lang="en">{person.role.split(' · ').slice(0, 2).join(' · ')}</span></li>)}
                </ul>
                <Link className="gm-btn gm-btn--ghost" href="/chi-siamo" data-cta="chi-siamo">
                  Scopri chi siamo <span className="gm-btn-arrow" aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </section>

          {/* The idea: a network lights up, then its stars melt into the form. */}
          <Bridge />

          {/* Contact: the destination of the whole page */}
          <section id="contatti" className="gm-section gm-contact" aria-labelledby="contatti-title" data-scroll-stop>
            <div className="gm-wrap gm-contact-grid">
              <header className="gm-contact-head" data-reveal>
                <SectionLabel>Contatti</SectionLabel>
                <h2 id="contatti-title" className="gm-h2 gm-h2--xl">Parliamo del tuo progetto.</h2>
                <p className="gm-lead">Raccontaci che attività hai e cosa vorresti ottenere dal sito: bastano poche righe, anche solo un’idea.</p>
                {contacts.length > 0 && (
                  <p className="gm-contact-mail">
                    Oppure {contacts.map((item, index) => (
                      <Fragment key={item.key}>{index > 0 && ' o '}{item.key === 'email' ? 'scrivici a ' : 'chiamaci al '}<DetailText item={item} /></Fragment>
                    ))}
                  </p>
                )}
              </header>
              <div id="modulo" className="gm-contact-form" data-reveal style={delay(120)}>
                <ContactForm />
                <GrowTextarea selector="#modulo textarea" />
              </div>
            </div>
          </section>
        </main>
        <SiteFooter cta={false} />
      </div>
      <ScrollCue />
      <Reveal />
    </>
  );
}
