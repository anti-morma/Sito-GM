import SectionLabel from './section-label';
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
        {/* Phones show only "Studio digitale": the description below says the rest. */}
        <SectionLabel className="gm-hero-eyebrow">
          <span>Studio digitale<span className="gm-hero-eyebrow-more"> · Siti web su misura</span></span>
        </SectionLabel>
        {/* Phones keep one line each: "Diamo forma" / "a ciò che" / "ti rende unico." */}
        <h1 className="gm-hero-title" id="hero-title">
          <span className="gm-hero-title-line">Diamo forma</span> <span className="gm-hero-title-line">a ciò che</span> <em>ti rende unico.</em>
        </h1>
        <p className="gm-hero-description">Progettiamo e sviluppiamo siti web su misura che fanno capire in pochi secondi chi sei, cosa offri e perché sceglierti.</p>
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
