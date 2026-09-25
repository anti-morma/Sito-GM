'use client';

/**
 * The idea, between the services and the form: one pinned scene. Beside the
 * words, a brain of stars gathers and turns slowly on itself, then melts away
 * as the form arrives (drawn by particle-journey.tsx, which also sets --bridge,
 * 0 → 1). With reduced motion the section is not pinned and the brain is still.
 */
export default function Bridge() {
  // The arrow leads to the form, like the scroll cue: a star falling to a chevron.
  const toForm = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const form = document.getElementById('modulo');
    if (!form) return;
    event.preventDefault();
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    form.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', '#modulo');
  };

  return (
    <section className="gm-bridge" aria-labelledby="idea-title">
      <span className="gm-story-anchor gm-bridge-stop" data-scroll-stop />
      <div className="gm-stage gm-bridge-stage">
        <div className="gm-nebula gm-bridge-atmosphere" aria-hidden="true" />
        <div className="gm-bridge-copy">
          <h2 className="gm-bridge-line" id="idea-title">
            Hai un’idea? <em>Diamole forma.</em>
          </h2>
          <a className="gm-bridge-arrow" href="#modulo" onClick={toForm} aria-label="Raccontacela: vai al modulo di contatto">
            <span className="gm-cue-track" aria-hidden="true"><i /></span>
          </a>
        </div>
      </div>
    </section>
  );
}
