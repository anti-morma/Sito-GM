import ContactForm from './contact-form';
import ProjectPreview from './project-preview';
import Reveal from './reveal';
import SiteHeader from './site-header';
import Story from './story';
import { mission, projects, services, testimonials, vision, type Project } from './content';

const pad = (index: number) => String(index + 1).padStart(2, '0');
const delay = (ms: number) => ({ '--reveal-delay': `${ms}ms` }) as React.CSSProperties;

function ProjectCard({ project, lead }: { project: Project; lead?: boolean }) {
  const media = project.preview
    ? <ProjectPreview src={project.preview} name={project.name} />
    : project.image
      ? <img src={project.image} alt="" loading="lazy" />
      : <span className="gm-project-empty"><small>Immagine o video da inserire</small></span>;
  const body = (
    <>
      <div className="gm-project-text">
        <h3>{project.name}</h3>
        <p className="gm-project-category">{project.category}</p>
        <p className="gm-project-description">{project.description}</p>
      </div>
      <div className="gm-project-media">
        {media}
        {project.href && <span className="gm-project-hover" aria-hidden="true">Scopri il progetto <span>→</span></span>}
      </div>
      <span className="gm-project-cta" aria-disabled={project.href ? undefined : true}>
        Scopri il progetto <span aria-hidden="true">→</span>
      </span>
    </>
  );
  const className = `gm-project${lead ? ' gm-project--lead' : ''}`;
  return project.href
    ? <a className={className} href={project.href} target="_blank" rel="noopener" data-reveal>{body}</a>
    : <article className={className} data-reveal>{body}</article>;
}

export default function Home() {
  const [leadQuote, ...otherQuotes] = testimonials;

  return (
    <>
      <SiteHeader />
      <main className="gm-site">
        {/* 01 Hero · 02 Brain · 03 House / method */}
        <Story />

        {/* 04 — Services */}
        <section id="servizi" className="gm-section gm-services" data-progress-step="3" aria-labelledby="servizi-title">
          <div className="gm-wrap gm-services-grid">
            <header className="gm-section-head gm-services-head" data-reveal>
              <p className="gm-kicker">Servizi</p>
              <h2 id="servizi-title" className="gm-display">Costruiamo esperienze digitali, non semplici pagine.</h2>
              <p className="gm-lead">Ogni progetto parte da ciò che vuoi comunicare, dalle persone che vuoi raggiungere e dal risultato che vuoi ottenere.</p>
            </header>
            <ol className="gm-service-list">
              {services.map((service, index) => (
                <li key={service.title} className="gm-service" data-reveal style={delay(index * 70)}>
                  <span className="gm-service-number">{pad(index)}</span>
                  <h3>{service.title}</h3>
                  <p>{service.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 05 — Statement */}
        <section className="gm-statement" aria-label="Il nostro approccio">
          <div className="gm-wrap">
            <p className="gm-statement-line" data-reveal>Non progettiamo pagine da riempire.</p>
            <p className="gm-statement-line gm-statement-line--second" data-reveal style={delay(320)}>Progettiamo esperienze che hanno qualcosa da dire.</p>
          </div>
        </section>

        {/* 06 — Projects */}
        <section id="progetti" className="gm-section gm-projects" data-progress-step="4" aria-labelledby="progetti-title">
          <div className="gm-wrap">
            <header className="gm-section-head gm-projects-head" data-reveal>
              <p className="gm-kicker">Progetti</p>
              <h2 id="progetti-title" className="gm-display">Progetti che hanno preso forma.</h2>
              <p className="gm-lead">Alcuni dei progetti che abbiamo trasformato in esperienze digitali.</p>
            </header>
            <div className="gm-project-list">
              {projects.map((project, index) => <ProjectCard key={project.name} project={project} lead={index === 0} />)}
            </div>
          </div>
        </section>

        {/* 07 — Testimonials */}
        <section className="gm-section gm-testimonials" aria-labelledby="testimonianze-title">
          <div className="gm-wrap">
            <header className="gm-section-head" data-reveal>
              <p className="gm-kicker">Testimonianze</p>
              <h2 id="testimonianze-title" className="gm-display gm-display--small">Cosa dicono di noi.</h2>
            </header>
            <div className="gm-quotes">
              {[leadQuote, ...otherQuotes].map((item, index) => (
                <figure key={index} className={`gm-quote${index === 0 ? ' gm-quote--lead' : ''}${item.placeholder ? ' is-placeholder' : ''}`} data-reveal style={delay(index === 0 ? 0 : index * 120)}>
                  {item.placeholder && <span className="gm-placeholder-tag">Segnaposto</span>}
                  <blockquote><p>{item.quote}</p></blockquote>
                  <figcaption>
                    <strong>{item.name}</strong>
                    <span>{[item.role, item.company].filter(Boolean).join(' · ')}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* 08 — Vision / Mission */}
        <section id="chi-siamo" className="gm-section gm-about" aria-labelledby="chi-siamo-title">
          <div className="gm-wrap">
            <h2 id="chi-siamo-title" className="gm-kicker" data-reveal>Chi siamo</h2>
            <div className="gm-about-block" data-reveal>
              <h3>Vision</h3>
              <span className="gm-about-line" aria-hidden="true" />
              <p>{vision}</p>
            </div>
            <div className="gm-about-block gm-about-block--mission" data-reveal>
              <h3>Mission</h3>
              <span className="gm-about-line" aria-hidden="true" />
              <p>{mission}</p>
            </div>
          </div>
        </section>

        {/* 09 — Closing statement */}
        <section className="gm-closing" data-progress-step="5" aria-label="Il valore del tuo progetto">
          <div className="gm-wrap">
            <p className="gm-closing-title" data-reveal>Il tuo progetto merita di essere percepito per ciò che vale.</p>
            <p className="gm-closing-text" data-reveal style={delay(240)}>Noi trasformiamo questo valore in un’esperienza digitale chiara, distintiva e progettata per il tuo pubblico.</p>
          </div>
        </section>

        {/* 10 — Contact */}
        <section id="contatti" className="gm-section gm-contact" aria-labelledby="contatti-title">
          <div className="gm-wrap gm-contact-grid">
            <header className="gm-section-head gm-contact-head" data-reveal>
              <p className="gm-kicker">Contatti</p>
              <h2 id="contatti-title" className="gm-display">Parliamo del tuo progetto.</h2>
              <p className="gm-lead">Che tu abbia già una direzione precisa o soltanto un’idea da sviluppare, raccontacela.</p>
            </header>
            <div data-reveal style={delay(120)}>
              <ContactForm />
            </div>
          </div>
          <footer className="gm-wrap gm-footer">
            <span>GoMore · Independent studio · Italia</span>
            <span>© {new Date().getFullYear()}</span>
          </footer>
        </section>
      </main>
      <Reveal />
    </>
  );
}
