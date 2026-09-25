import SectionLabel from './section-label';

/**
 * The opening screen: one headline, one action. The GM beside it is drawn by
 * the page-wide particle field (particle-journey.tsx), which carries its stars
 * on into the method as the visitor scrolls.
 */
export default function Hero() {
  return (
    <section className="gm-hero" id="inizio" aria-labelledby="hero-title">
      {/* Night blue, painted behind the canvas so it never dims a star. */}
      <div className="gm-nebula" aria-hidden="true" />
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
          <a className="gm-btn gm-btn--primary gm-btn--large" href="#contatti">
            Parliamo del tuo progetto <span className="gm-btn-arrow" aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
