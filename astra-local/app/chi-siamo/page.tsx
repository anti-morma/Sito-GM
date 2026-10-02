import { Fragment } from 'react';
import Link from 'next/link';
import Reveal from '../reveal';
import SectionLabel from '../section-label';
import SiteFooter from '../site-footer';
import { founders, principles, site } from '../content';
import { aboutDescription, aboutLd, aboutPath, jsonLd, pageMetadata } from '../seo';
import Scenes from './scenes';
import './about.css';

export const metadata = pageMetadata({ path: aboutPath, title: 'Chi siamo', description: aboutDescription });

const pad = (index: number) => String(index + 1).padStart(2, '0');

// The studio's star (the same as the GM's sky and the scroll cue's light).
const STAR = 'M0 -6.5 C0.5 -1.6 1.6 -0.5 6.5 0 C1.6 0.5 0.5 1.6 0 6.5 C-0.5 1.6 -1.6 0.5 -6.5 0 C-1.6 -0.5 -0.5 -1.6 0 -6.5 Z';
// A founder's surname initial: the two of them, side by side, read GM.
const initial = (name: string) => name.split(' ').at(-1)!.charAt(0);

/** A soft halo behind a star; each drawing keeps its own (an id shared with
 *  a drawing that may be hidden stops painting). */
function Halo({ id }: { id: string }) {
  return (
    <defs>
      <radialGradient id={id}>
        <stop offset="0" stopColor="#8fb1ff" stopOpacity="0.5" />
        <stop offset="1" stopColor="#8fb1ff" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

/**
 * Chi siamo, in the order a visitor asks: who you are (the opening says it
 * plainly), the two people (G and M, one direction), how you think, what you
 * believe, and one action. Motion only where it carries meaning
 * (scenes.tsx); everything reads with reduced motion.
 */
export default function AboutPage() {
  const [first, second] = founders;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(aboutLd())} />

      <div className="gm-page">
        <main className="gm-about" id="contenuto">
          {/* 1 · Who we are, said plainly under the line that opens the page. */}
          <section className="gm-about-hero" aria-labelledby="about-title">
            {/* A route rising to a star, the site's own sign, barely there. */}
            <svg className="gm-about-route" viewBox="0 0 600 600" aria-hidden="true">
              <defs>
                <linearGradient id="about-route" gradientUnits="userSpaceOnUse" x1="20" y1="560" x2="520" y2="90">
                  <stop offset="0" stopColor="#8fb1ff" stopOpacity="0" />
                  <stop offset="0.7" stopColor="#8fb1ff" stopOpacity="0.35" />
                  <stop offset="1" stopColor="#e6ecff" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              <Halo id="about-halo" />
              <path className="gm-about-route-dots" d="M20 560 C180 540 300 470 380 360 S480 150 520 90" />
              <path className="gm-about-route-trail" d="M20 560 C180 540 300 470 380 360 S480 150 520 90" stroke="url(#about-route)" pathLength={1} />
              <g className="gm-about-route-star" transform="translate(520 90)">
                <circle r="26" fill="url(#about-halo)" />
                <path d={STAR} transform="scale(1.9)" />
              </g>
            </svg>

            <div className="gm-wrap gm-about-hero-copy">
              <nav className="gm-crumbs" aria-label="Percorso">
                <ol>
                  <li><Link href="/">Home</Link></li>
                  <li><span aria-current="page">Chi siamo</span></li>
                </ol>
              </nav>
              <h1 className="gm-about-title" id="about-title">
                <span className="gm-label gm-about-kicker">
                  <span className="gm-label-mark">GM</span>
                  <span className="gm-label-dot" aria-hidden="true" />
                  <span className="gm-sr-only"> · </span>
                  Chi siamo
                </span>
                <span className="gm-sr-only">: </span>
                <span className="gm-about-title-line">Due persone.</span>{' '}
                <span className="gm-about-title-line">Una stessa ossessione:</span>{' '}
                <span className="gm-about-title-rest">esperienze digitali che abbiano <em>un motivo per esistere.</em></span>
              </h1>
              <p className="gm-about-hero-lead">
                {site.name} è lo studio digitale indipendente di <strong>{first.name}</strong> e <strong>{second.name}</strong>. Progettiamo e sviluppiamo siti web ed esperienze digitali su misura, per brand, attività e professionisti.
              </p>
            </div>

            <a className="gm-about-down" href="#fondatori" aria-label="Scorri: i fondatori">
              <span className="gm-cue-track" aria-hidden="true"><i /></span>
            </a>
          </section>

          {/* 2 · The two founders: G and M, two competences meeting in one direction. */}
          <section id="fondatori" className="gm-section gm-people" aria-labelledby="people-title">
            <div className="gm-wrap">
              <header className="gm-people-head" data-reveal>
                <SectionLabel>I fondatori</SectionLabel>
                <h2 className="gm-h2" id="people-title">Due competenze. <em>Una direzione.</em></h2>
              </header>

              <div className="gm-duo" data-scene="read">
                {/* Each initial above its founder; two lines meet in the star between them. */}
                <div className="gm-duo-mark" aria-hidden="true">
                  <span className="gm-duo-cell" data-side="left">
                    <span className="gm-duo-letter">{initial(first.name)}</span>
                    <span className="gm-duo-link" />
                  </span>
                  <svg className="gm-duo-star" viewBox="-30 -30 60 60">
                    <Halo id="about-duo-halo" />
                    <circle r="22" fill="url(#about-duo-halo)" />
                    <path d={STAR} transform="scale(1.6)" />
                  </svg>
                  <span className="gm-duo-cell" data-side="right">
                    <span className="gm-duo-letter">{initial(second.name)}</span>
                    <span className="gm-duo-link" />
                  </span>
                </div>

                <div className="gm-duo-people">
                  {founders.map((person, index) => (
                    <Fragment key={person.name}>
                      {/* Between the two: the line that comes down from the star. */}
                      {index > 0 && <span className="gm-duo-axis" aria-hidden="true" />}
                      <article className="gm-duo-person" data-reveal style={{ '--reveal-delay': `${index * 140}ms` } as React.CSSProperties}>
                        <h3>{person.name}</h3>
                        <p className="gm-duo-role" lang="en">{person.role}</p>
                        <p className="gm-duo-text">{person.text}</p>
                      </article>
                    </Fragment>
                  ))}
                </div>

                <p className="gm-duo-note" data-reveal>Due sguardi diversi, un solo obiettivo: il tuo.</p>
              </div>
            </div>
          </section>

          {/* 3 · How we think: the question first, then five sides of every project. */}
          <section className="gm-section gm-think" aria-labelledby="think-title">
            <div className="gm-wrap">
              <div className="gm-think-intro">
                <header data-reveal>
                  <SectionLabel>Come pensiamo</SectionLabel>
                  <h2 className="gm-h2" id="think-title">Il punto di partenza <span className="gm-h2-line">non è il sito.</span></h2>
                </header>
                <p className="gm-think-question" data-reveal>Prima del design viene una domanda: <em>che cosa deve ottenere?</em> Per rispondere guardiamo ogni progetto da cinque lati.</p>
              </div>
              <ol className="gm-principles">
                {principles.map((item, index) => (
                  <li key={item.title} className="gm-principle" data-scene="read">
                    <span className="gm-principle-number" aria-hidden="true">{pad(index)}</span>
                    <h3 className="gm-principle-title">{item.title}</h3>
                    <p className="gm-principle-text">{item.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* 4 · What we believe, in three lines. */}
          <section className="gm-section gm-less" aria-labelledby="less-title">
            <div className="gm-wrap gm-less-wrap" data-reveal>
              <SectionLabel>Filosofia</SectionLabel>
              <h2 className="gm-h2 gm-h2--xl" id="less-title" lang="en">Less, <em>but better.</em></h2>
              <p className="gm-less-source">Dieter Rams · <span lang="de">Weniger, aber besser</span></p>
              <div className="gm-less-body">
                <p>Non crediamo che un progetto debba essere più complesso per essere più importante.</p>
                <p>Crediamo nella complessità quando è necessaria. Nella semplicità quando è sufficiente.</p>
                <p className="gm-less-rule">Ogni elemento deve avere un motivo.</p>
              </div>
            </div>
          </section>

          {/* 5 · The call. */}
          <section className="gm-section gm-about-cta" aria-labelledby="about-cta-title">
            <div className="gm-wrap gm-about-cta-wrap" data-reveal>
              <svg className="gm-about-cta-star" viewBox="-40 -40 80 80" aria-hidden="true">
                <Halo id="about-cta-halo" />
                <circle r="30" fill="url(#about-cta-halo)" />
                <path d={STAR} transform="scale(2.2)" />
              </svg>
              <h2 className="gm-h2 gm-h2--xl" id="about-cta-title">Hai qualcosa che merita di essere portato <em>più in alto?</em></h2>
              <p className="gm-lead">Raccontaci cosa vuoi costruire.</p>
              <Link className="gm-btn gm-btn--primary gm-btn--large" href="/contatti" data-cta="chi-siamo-finale">
                Inizia il tuo progetto <span className="gm-btn-arrow" aria-hidden="true">→</span>
              </Link>
            </div>
          </section>
        </main>
        <SiteFooter cta={false} />
      </div>
      <Scenes />
      <Reveal />
    </>
  );
}
