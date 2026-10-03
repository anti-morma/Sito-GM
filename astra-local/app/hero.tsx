import HeroExplore from './hero-explore';

/**
 * The opening screen: one headline and one action, which starts the walk
 * down the home. The GM beside it is drawn by the page-wide particle field
 * (particle-journey.tsx), which carries its stars on as the visitor scrolls.
 */
export default function Hero() {
  return (
    <section className="gm-hero" id="inizio" aria-labelledby="hero-title">
      <div className="gm-hero-copy">
        {/* The page's H1 says plainly what the studio does (search engines and
            screen readers start here); the brand's promise below stays the
            largest line on screen. */}
        <div className="gm-label gm-hero-eyebrow">
          <span className="gm-label-mark" aria-hidden="true">GM</span>
          <span className="gm-label-dot" aria-hidden="true" />
          <h1 className="gm-hero-h1" id="hero-title">Web design · Sviluppo · 3D · AI</h1>
        </div>
        {/* Phones keep one line each: "Più di un sito." / "La tua identità," / "online." */}
        <p className="gm-hero-title">
          <span className="gm-hero-title-line">Più di un sito.</span> <em>La tua identità,<br /> online.</em>
        </p>
        <p className="gm-hero-description">Progettiamo e sviluppiamo siti web su misura che comunicano con chiarezza chi sei, cosa offri e cosa ti distingue.</p>
        <div className="gm-hero-actions">
          <HeroExplore />
        </div>
      </div>
    </section>
  );
}
