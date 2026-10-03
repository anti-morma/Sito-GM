import Link from 'next/link';
import Reveal from '../reveal';
import SectionLabel from '../section-label';
import SiteFooter from '../site-footer';
import { Closing, PageIntro, ProjectTiles } from '../inner';
import { caseStudies, offers } from '../content';
import { jsonLd, pageMetadata, servicesLd } from '../seo';
import { servicePath, services } from '../services';

const DESCRIPTION = 'Web design, sviluppo web, UX/UI, 3D, WebGL e AI: servizi digitali progettati intorno agli obiettivi del progetto, dalla strategia al lancio.';

export const metadata = pageMetadata({ path: '/servizi', title: 'Servizi digitali', description: DESCRIPTION });

const pad = (index: number) => String(index + 1).padStart(2, '0');

/**
 * /servizi: what you can ask us for (a website, and its care), the five
 * disciplines inside every project (each with its own page), and the proof.
 * The home shows what we do at a glance and links here for the details.
 */
export default function ServicesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(servicesLd(DESCRIPTION))} />
      <div className="gm-page">
        <main className="gm-inner" id="contenuto">
          <PageIntro
            crumbs={[{ name: 'Servizi' }]}
            label="Servizi"
            title={<>Servizi digitali progettati intorno al <em>tuo obiettivo.</em></>}
            lead={['Dal primo ragionamento alla tecnologia finale, costruiamo ogni progetto intorno a ciò che deve ottenere.']}
          />

          {/* First what you can ask us for: the two ways to work together. */}
          <section className="gm-section" aria-labelledby="formats-title">
            <div className="gm-wrap">
              <header className="gm-section-head" data-reveal>
                <SectionLabel>Come si lavora insieme</SectionLabel>
                <h2 className="gm-h2" id="formats-title">Prima lo costruiamo. <span className="gm-h2-line">Poi lo facciamo crescere.</span></h2>
                <p className="gm-lead">Ogni sito nasce da una consulenza ed è progettato da zero. Dopo il lancio possiamo continuare a seguirlo noi.</p>
              </header>
              <div className="gm-formats">
                {offers.map((offer, index) => (
                  <article key={offer.title} className="gm-format" data-reveal>
                    <p className="gm-format-kicker"><span aria-hidden="true">{pad(index)}</span> {offer.kicker}</p>
                    <h3>{offer.title}</h3>
                    <p className="gm-format-text">{offer.text}</p>
                    {offer.price && <p className="gm-format-price">{offer.price}</p>}
                    <ul className="gm-facts" aria-label={`Cosa include: ${offer.title}`}>
                      {offer.includes.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* Then what is inside every project: the disciplines, each with its own page. */}
          <section className="gm-section" aria-labelledby="disciplines-title">
            <div className="gm-wrap">
              <header className="gm-section-head" data-reveal>
                <SectionLabel>Le competenze</SectionLabel>
                <h2 className="gm-h2" id="disciplines-title">Cinque competenze, un solo progetto.</h2>
                <p className="gm-lead">Non le vendiamo a pezzi: entrano in ogni progetto nella misura in cui servono.</p>
              </header>
              <ul className="gm-linklist" data-reveal>
                {services.map((service, index) => (
                  <li key={service.slug}>
                    <Link href={servicePath(service)}>
                      <strong><span className="gm-sr-only">{pad(index)} · </span>{service.name}</strong>
                      <span>{service.summary}</span>
                      <span className="gm-btn-arrow" aria-hidden="true">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* The proof. */}
          <section className="gm-section" aria-labelledby="proof-title">
            <div className="gm-wrap">
              <header className="gm-section-head" data-reveal>
                <SectionLabel>Progetti</SectionLabel>
                <h2 className="gm-h2" id="proof-title">Le competenze, al lavoro.</h2>
              </header>
              <ProjectTiles items={caseStudies.map((project) => ({ project }))} />
            </div>
          </section>

          <Closing title={<>Non sai ancora di quale servizio hai bisogno?</>} text="È normale: lo capiamo insieme. Raccontaci che cosa deve ottenere il progetto, al resto pensiamo noi." position="servizi" />
        </main>
        <SiteFooter cta={false} />
      </div>
      <Reveal />
    </>
  );
}
