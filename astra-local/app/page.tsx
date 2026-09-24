import ContactForm from './contact-form';
import ProjectPreview from './project-preview';
import Reveal from './reveal';
import SiteFooter from './site-footer';
import SiteHeader from './site-header';
import Story from './story';
import { projects, services, site, type Project } from './content';

const pad = (index: number) => String(index + 1).padStart(2, '0');
const delay = (ms: number) => ({ '--reveal-delay': `${ms}ms` }) as React.CSSProperties;

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const host = project.href ? new URL(project.href).hostname.replace(/^www\./, '') : '';
  return (
    <article className="gm-project" data-reveal>
      <div className="gm-project-text">
        <p className="gm-project-index">{pad(index)} <span>/ {pad(projects.length - 1)}</span></p>
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
  return (
    <>
      <SiteHeader />
      <main className="gm-site" id="contenuto">
        {/* Hero · Brain · Method */}
        <Story />

        {/* Approach: one sentence that sets the tone for everything below. */}
        <section className="gm-manifesto" id="approccio" aria-labelledby="approccio-title">
          <div className="gm-wrap">
            <p className="gm-label" data-reveal>Il nostro approccio</p>
            <h2 id="approccio-title" className="gm-manifesto-title" data-reveal>
              Non progettiamo pagine da riempire. <em>Progettiamo il modo in cui vieni percepito.</em>
            </h2>
          </div>
        </section>

        {/* Services */}
        <section id="servizi" className="gm-section gm-services" aria-labelledby="servizi-title">
          <div className="gm-wrap gm-services-grid">
            <header className="gm-services-head" data-reveal>
              <p className="gm-label">Cosa facciamo</p>
              <h2 id="servizi-title" className="gm-h2">Dall’idea al sito online. E oltre.</h2>
              <p className="gm-lead">Un unico interlocutore per strategia, design, sviluppo e crescita del tuo sito.</p>
              <a className="gm-link" href="#contatti">Raccontaci il tuo progetto <span aria-hidden="true">→</span></a>
            </header>
            <ol className="gm-service-list">
              {services.map((service, index) => (
                <li key={service.title} className="gm-service" data-reveal style={delay(index * 60)}>
                  <span className="gm-service-number">{pad(index)}</span>
                  <h3>{service.title}</h3>
                  <p>{service.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Projects: real, live work */}
        <section id="progetti" className="gm-section gm-projects" aria-labelledby="progetti-title">
          <div className="gm-wrap">
            <header className="gm-projects-head" data-reveal>
              <p className="gm-label">Progetti</p>
              <h2 id="progetti-title" className="gm-h2">Siti reali, online adesso.</h2>
              <p className="gm-lead">Progettati e sviluppati da noi, dall’identità digitale al codice. Guardali dal vivo.</p>
            </header>
            <div className="gm-project-list">
              {projects.map((project, index) => <ProjectCard key={project.name} project={project} index={index} />)}
            </div>
          </div>
        </section>

        {/* Contact: the destination of the whole page */}
        <section id="contatti" className="gm-section gm-contact" aria-labelledby="contatti-title">
          <div className="gm-wrap gm-contact-grid">
            <header className="gm-contact-head" data-reveal>
              <p className="gm-label">Contatti</p>
              <h2 id="contatti-title" className="gm-h2 gm-h2--xl">Parliamo del tuo progetto.</h2>
              <p className="gm-lead">Il tuo progetto merita di essere percepito per ciò che vale. Raccontaci cosa hai in mente: anche solo un’idea, bastano poche righe.</p>
              {site.email && <p className="gm-contact-mail">Oppure scrivici a <a href={`mailto:${site.email}`}>{site.email}</a></p>}
            </header>
            <div className="gm-contact-form" data-reveal style={delay(120)}>
              <ContactForm />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter cta={false} />
      <Reveal />
    </>
  );
}
