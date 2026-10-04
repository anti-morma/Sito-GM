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
import { homeLd, jsonLd, OG_IMAGE, openGraphBase, siteSummary, studyPath } from './seo';
import { contactDetails, DetailText } from './studio-details';
import './home.css';


// The home's title is the layout's default ("GoMore | Web design, sviluppo e
// digital experiences"): the brand first, then what it does.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: { ...openGraphBase, url: '/', title: `${site.name} | Web design, sviluppo e digital experiences`, description: siteSummary, images: [OG_IMAGE] },
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
  // The project in a glance, centred: its name and field, then the site
  // itself moving; under it the case study first and the live site beside it.
  return (
    <article className="gm-project" data-reveal>
      <div className="gm-project-text">
        <h3>{project.name}</h3>
        <p className="gm-project-category">{project.home?.category ?? project.category}</p>
      </div>
      {/* The site itself, moving: just to watch (the buttons under it act). */}
      <div className="gm-project-media">{media}</div>
      <div className="gm-project-actions">
        {study && (
          <Link className="gm-btn gm-btn--primary" href={study} data-cta="progetto" data-project={project.name}>
            Scopri il progetto <span className="gm-btn-arrow" aria-hidden="true">→</span>
          </Link>
        )}
        {project.href && (
          <a className={study ? 'gm-project-live' : 'gm-btn gm-btn--ghost'} href={project.href} target="_blank" rel="noopener" data-cta="sito-cliente" data-project={project.name}>
            Visita il sito<span className="gm-sr-only"> di {project.name} ({host})</span> <span className="gm-btn-arrow" aria-hidden="true">↗</span>{NEW_TAB}
          </a>
        )}
      </div>
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
                <h2 id="progetti-title" className="gm-h2"><span className="gm-h2-line">Non raccontiamo cosa facciamo.</span><br /><em className="gm-shine">Te lo mostriamo.</em></h2>
              </header>
              <ProjectCarousel count={projects.length}>
                {projects.map((project) => <ProjectCard key={project.name} project={project} />)}
              </ProjectCarousel>
              {/* After the proof, the way deeper: every project and how we thought it. */}
              <div className="gm-home-more" data-reveal>
                <Link className="gm-btn gm-btn--ghost" href="/progetti" data-cta="tutti-i-progetti">
                  Esplora i progetti <span className="gm-btn-arrow" aria-hidden="true">→</span>
                </Link>
              </div>
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
                <p className="gm-lead">Hai un’attività, un’idea o un progetto da portare online? Raccontaci cosa hai in mente. Ci bastano poche righe per iniziare a capire dove possiamo portarlo.</p>
                {/* The studio's real e-mail and phone (content.ts): "e-mail" and
                    "telefono" are the links; a detail not filled in is left out. */}
                {contacts.length > 0 && (
                  <p className="gm-contact-mail">
                    Preferisci parlarne direttamente?{' '}
                    <span className="gm-contact-ways">
                      {contacts.map((item, index) => (
                        <Fragment key={item.key}>
                          {index > 0 && ' oppure '}
                          {item.key === 'email' ? (index ? 'scrivici via ' : 'Scrivici via ') : (index ? 'chiamaci al ' : 'Chiamaci al ')}
                          <DetailText item={{ ...item, text: item.key === 'email' ? 'e-mail' : 'telefono' }} />
                        </Fragment>
                      ))}.
                    </span>
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
