import { primaryCta } from './content';

/**
 * The opening screen: one headline, one main action and, for whoever is not
 * ready to talk yet, a quieter one towards the proof. The GM beside it is
 * drawn by the page-wide particle field (particle-journey.tsx), which carries
 * its stars on into the method as the visitor scrolls.
 */
export default function Hero() {
  return (
    <section className="gm-hero" id="inizio" aria-labelledby="hero-title">
      <div className="gm-hero-copy">
        {/* The page's H1 says plainly what the studio does (search engines and
            screen readers start here); the brand's promise below stays the
            largest line on screen. Phones show the shorter half of it. */}
        <div className="gm-label gm-hero-eyebrow">
          <span className="gm-label-mark" aria-hidden="true">GM</span>
          <span className="gm-label-dot" aria-hidden="true" />
          <h1 className="gm-hero-h1" id="hero-title">Web design, sviluppo<span className="gm-hero-eyebrow-more"> e digital experiences</span> su misura</h1>
        </div>
        {/* Phones keep one line each: "Un sito" / "all’altezza di" / "ciò che fai." */}
        <p className="gm-hero-title">
          <span className="gm-hero-title-line">Un sito</span> <span className="gm-hero-title-line">all’altezza di</span> <em>ciò che fai.</em>
        </p>
        <p className="gm-hero-description">Progettiamo e sviluppiamo siti web su misura che comunicano con chiarezza chi sei, cosa offri e cosa ti distingue.</p>
        <div className="gm-hero-actions">
          <a className="gm-btn gm-btn--primary gm-btn--large" href="#contatti" data-cta="hero">
            {primaryCta} <span className="gm-btn-arrow" aria-hidden="true">→</span>
          </a>
          <a className="gm-btn gm-btn--ghost gm-btn--large gm-hero-secondary" href="#progetti" data-cta="hero-progetti">
            Guarda i progetti <span className="gm-btn-arrow gm-btn-arrow--down" aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
    </section>
  );
}
