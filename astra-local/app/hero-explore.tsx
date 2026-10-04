'use client';

import { site } from './content';
import { scrollToNextStop } from './next-stop';

/** The hero's one action: it starts the walk down the home, to its first section. */
export default function HeroExplore() {
  return (
    <a
      className="gm-btn gm-hero-explore"
      href="#cosa-facciamo"
      data-cta="hero"
      onClick={(event) => {
        event.preventDefault();
        scrollToNextStop();
      }}
    >
      Esplora {site.name} <span className="gm-btn-arrow gm-btn-arrow--down" aria-hidden="true">↓</span>
    </a>
  );
}
