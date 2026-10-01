import type { Metadata } from 'next';
import { Fragment } from 'react';
import Link from 'next/link';
import Bridge from './bridge';
import ContactForm from './_contact/form';
import GoMoreMobileIntro from './gomore-mobile-intro';
import Hero from './hero';
import MethodStory from './method-story';
import OfferDeck from './offer-deck';
import ParticleJourney from './particle-journey';
import ProjectCarousel from './project-carousel';
import ProjectPreview from './project-preview';
import Reveal from './reveal';
import ScrollCue from './scroll-cue';
import SectionLabel from './section-label';
import SiteFooter from './site-footer';
import SiteHeader from './site-header';
import { nextSteps, offers, projects, site, type Project } from './content';
import { homeLd, jsonLd, openGraphBase, siteSummary, studyPath } from './seo';
import { contactDetails, DetailText } from './studio-details';


export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: { ...openGraphBase, url: '/', title: 'GoMore — Diamo forma a ciò che ti rende unico', description: siteSummary },
};

const delay = (ms: number) => ({ '--reveal-delay': `${ms}ms` }) as React.CSSProperties;
const pad = (index: number) => String(index + 1).padStart(2, '0');
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
      <SiteHeader />
      <GoMoreMobileIntro />
      <ParticleJourney />
      {/* The page and its footer share one light at the bottom: the dawn. */}
      <div className="gm-page">
        <main className="gm-site" id="contenuto">
          {/* Hero: the headline, and the GM made of stars */}
          <Hero />

          {/* Method: the GM's stars draw the villa, then the construction footage. */}
          <MethodStory />

          {/* Projects: real, live work */}
          <section id="progetti" className="gm-section gm-projects" aria-labelledby="progetti-title" data-scroll-stop>
            <div className="gm-wrap">
              <header className="gm-projects-head" data-reveal>
                <SectionLabel>Portfolio</SectionLabel>
                <h2 id="progetti-title" className="gm-h2">I nostri progetti.</h2>
                <p className="gm-lead">Siti progettati e sviluppati da noi, dall’identità digitale al codice. Sono online e funzionano: guardali dal vivo.</p>
              </header>
              <ProjectCarousel count={projects.length}>
                {projects.map((project) => <ProjectCard key={project.name} project={project} />)}
              </ProjectCarousel>
            </div>
          </section>

          {/* Services: one custom website, and the care that follows it. */}
          <section id="servizi" className="gm-section gm-services" aria-labelledby="servizi-title" data-scroll-stop>
            <div className="gm-wrap">
              <header className="gm-services-head" data-reveal>
                <SectionLabel>Cosa facciamo</SectionLabel>
                <h2 id="servizi-title" className="gm-h2">Un sito su misura.<br /> <span className="gm-h2-line">Seguito anche dopo il lancio.</span></h2>
                <p className="gm-lead">Non vendiamo pacchetti: ogni sito nasce da una consulenza e viene costruito sul tuo progetto. Dopo il lancio, possiamo continuare a seguirlo noi.</p>
              </header>
              {/* Phones: the two offers as a deck of cards, the site in front and
                  its care right behind it (offer-deck.tsx). */}
              <OfferDeck offers={offers} />
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
                {/* The answer to "and then?", before the form is sent. */}
                <div className="gm-next-steps">
                  <h3>Cosa succede dopo</h3>
                  <ol>
                    {nextSteps.map((step, index) => <li key={step}><span aria-hidden="true">{pad(index)}</span>{step}</li>)}
                  </ol>
                  {site.responseTime && <p className="gm-next-steps-time">Ti rispondiamo entro {site.responseTime}.</p>}
                </div>
              </header>
              <div id="modulo" className="gm-contact-form" data-reveal style={delay(120)}>
                <ContactForm />
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
