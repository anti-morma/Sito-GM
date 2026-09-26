import { Fragment } from 'react';
import Bridge from './bridge';
import ContactForm from './contact-form';
import { PHONE_OPENING_QUERY } from './gm-constellation';
import GoMoreMobileIntro from './gomore-mobile-intro';
import Hero from './hero';
import MethodStory from './method-story';
import ParticleJourney from './particle-journey';
import ProjectCarousel from './project-carousel';
import ProjectPreview from './project-preview';
import Reveal from './reveal';
import ScrollCue from './scroll-cue';
import SectionLabel from './section-label';
import SiteFooter from './site-footer';
import SiteHeader from './site-header';
import { offers, projects, type Project } from './content';
import { contactDetails, DetailText } from './studio-details';

// Phones, first visit of the session: black before the first paint, for the
// opening (gomore-mobile-intro.tsx), which ends in the header logo. Never on a
// reload, a return or a link to a section (sessionStorage: a new session plays
// it again); with reduced motion, a short version of fades. If the opening is
// not under way in time, the page simply appears. To preview it again, add
// ?intro to the address: it then plays on every load.
const OPENING = `(() => { try {
  const root = document.documentElement;
  const visit = performance.getEntriesByType('navigation')[0];
  const preview = new URLSearchParams(location.search).has('intro');
  if (!matchMedia('${PHONE_OPENING_QUERY}').matches) return;
  if (!preview && (location.hash || (visit && visit.type !== 'navigate')
    || sessionStorage.getItem('gm-intro'))) return;
  sessionStorage.setItem('gm-intro', '1');
  root.classList.add('gm-intro');
  root.dataset.intro = 'waiting';
  const show = () => {
    if (!root.classList.contains('gm-intro')) return;
    root.classList.remove('gm-intro');
    root.classList.add('gm-intro-done');
    delete root.dataset.intro;
  };
  setTimeout(() => { if (root.dataset.intro === 'waiting') show(); }, 2500);
  setTimeout(show, 6500);
} catch (error) {} })();`;

const pad = (index: number) => String(index + 1).padStart(2, '0');
const delay = (ms: number) => ({ '--reveal-delay': `${ms}ms` }) as React.CSSProperties;

function ProjectCard({ project }: { project: Project }) {
  const host = project.href ? new URL(project.href).hostname.replace(/^www\./, '') : '';
  return (
    <article className="gm-project" data-reveal>
      <div className="gm-project-text">
        <h3>{project.name}</h3>
        <p className="gm-project-category">{project.category}</p>
        <p className="gm-project-description">{project.description}</p>
        {project.href && (
          <a className="gm-btn gm-btn--ghost" href={project.href} target="_blank" rel="noopener">
            Visita {host} <span className="gm-btn-arrow" aria-hidden="true">↗</span>
          </a>
        )}
      </div>
      {project.href ? (
        <a className="gm-project-media" href={project.href} target="_blank" rel="noopener" aria-label={`Apri il sito di ${project.name} in una nuova scheda`}>
          {project.preview ? <ProjectPreview src={project.preview} name={project.name} /> : project.image && <img src={project.image} alt={`Homepage di ${project.name}`} loading="lazy" />}
          <span className="gm-project-hover" aria-hidden="true">Scopri il progetto <span>→</span></span>
        </a>
      ) : (
        <div className="gm-project-media">
          {project.preview ? <ProjectPreview src={project.preview} name={project.name} /> : project.image && <img src={project.image} alt={`Homepage di ${project.name}`} loading="lazy" />}
        </div>
      )}
    </article>
  );
}

export default function Home() {
  const contacts = contactDetails();
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: OPENING }} />
      <SiteHeader />
      <GoMoreMobileIntro />
      <ParticleJourney />
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
            <div className="gm-offers">
              {offers.map((offer, index) => (
                <article key={offer.title} className="gm-offer" data-reveal style={delay(index * 120)}>
                  <p className="gm-offer-kicker"><span>{pad(index)}</span>{offer.kicker}</p>
                  <h3>{offer.title}</h3>
                  <p className="gm-offer-text">{offer.text}</p>
                  <ul className="gm-offer-list" aria-label={`Cosa include: ${offer.title}`}>
                    {offer.includes.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                  <a className={index === 0 ? 'gm-btn gm-btn--primary' : 'gm-btn gm-btn--ghost'} href="#contatti">
                    {offer.cta} <span className="gm-btn-arrow" aria-hidden="true">→</span>
                  </a>
                </article>
              ))}
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
              <p className="gm-lead">Il tuo progetto merita di essere percepito per ciò che vale. Raccontaci cosa hai in mente: anche solo un’idea, bastano poche righe.</p>
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
            </div>
          </div>
        </section>
      </main>
      <SiteFooter cta={false} />
      <ScrollCue />
      <Reveal />
    </>
  );
}
