'use client';

import { useEffect, useState } from 'react';
import { isReducedMotion as reducedMotion } from './motion';

// How long the visitor must stay still before the cue comes back.
const IDLE_MS = 1100;
// The stars of the trail, top to bottom.
const STARS = 9;
// Phones: a chevron of seven stars, its tip at the bottom (px from its centre),
// joined by a faint line like a constellation.
const CHEVRON: [number, number][] = [[-21, -8], [-14, -3], [-7, 2], [0, 7], [7, 2], [14, -3], [21, -8]];
const CHEVRON_LINE = CHEVRON.map(([x, y]) => `${x + 24},${y + 10}`).join(' ');

/**
 * The scroll cue: a trail of stars down the right edge of the screen, with a
 * shooting star that keeps falling along it and lights each star it passes.
 * It says "scroll" without covering the page: bright at the opening, quiet
 * while the visitor scrolls, back as soon as they pause, gone at the form.
 * Phones get another shape (a thin edge is lost there): two chevrons of stars
 * at the bottom centre that light up downwards, with "Scorri" at the opening.
 * On phones it stays where scrolling moves a scene (the opening, the method,
 * the idea), not over the sections people read. It is a real control: it
 * jumps to the next stop ([data-scroll-stop]).
 */
export default function ScrollCue() {
  const [atTop, setAtTop] = useState(true);
  const [scrolling, setScrolling] = useState(false);
  const [ended, setEnded] = useState(false);
  const [overText, setOverText] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let frame = 0;
    let timer = 0;
    const evaluate = () => {
      frame = 0;
      setAtTop(scrollY < 8);
      const contact = document.getElementById('contatti');
      setEnded(!!contact && contact.getBoundingClientRect().top < innerHeight * 0.72);
      const scene = [...document.querySelectorAll<HTMLElement>('.gm-hero, .gm-method-story, .gm-bridge')].some((section) => {
        const box = section.getBoundingClientRect();
        return box.top <= innerHeight * 0.1 && box.bottom >= innerHeight * 0.9;
      });
      setOverText(matchMedia('(max-width: 760px)').matches && !scene);
    };
    const onScroll = () => {
      setScrolling(true);
      clearTimeout(timer);
      timer = window.setTimeout(() => setScrolling(false), IDLE_MS);
      if (!frame) frame = requestAnimationFrame(evaluate);
    };
    const onResize = () => { if (!frame) frame = requestAnimationFrame(evaluate); };
    // The mobile menu covers the page: the cue has nothing to point at.
    const root = document.documentElement;
    const menu = new MutationObserver(() => setMenuOpen(root.classList.contains('gm-menu-open')));
    menu.observe(root, { attributes: true, attributeFilter: ['class'] });
    evaluate();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onResize);
    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onResize);
      menu.disconnect();
      clearTimeout(timer);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const next = () => {
    const stops = [...document.querySelectorAll<HTMLElement>('[data-scroll-stop]')]
      .map((element) => element.getBoundingClientRect().top + scrollY)
      .sort((a, b) => a - b);
    const top = stops.find((stop) => stop > scrollY + 24) ?? scrollY + innerHeight * 0.9;
    scrollTo({ top, behavior: reducedMotion() ? 'auto' : 'smooth' });
  };

  const hidden = ended || menuOpen || overText;
  const state = hidden ? 'hidden' : scrolling && !atTop ? 'quiet' : 'invite';

  return (
    <button
      type="button"
      className="gm-rail"
      data-mode={atTop ? 'hero' : 'compact'}
      data-state={state}
      inert={hidden}
      onClick={next}
      aria-label="Scorri: vai alla sezione successiva"
    >
      <span className="gm-rail-label" aria-hidden="true">Scorri</span>
      <span className="gm-rail-line" aria-hidden="true">
        {Array.from({ length: STARS }, (_, index) => (
          <i key={index} style={{ '--i': index / (STARS - 1) } as React.CSSProperties} />
        ))}
        <b className="gm-rail-comet" />
      </span>
      <span className="gm-rail-end" aria-hidden="true" />
      {/* Phones: two chevrons drawn with stars at the bottom of the screen,
          lighting up one after the other, downwards. */}
      <span className="gm-rail-chevrons" aria-hidden="true">
        {[0, 1].map((row) => (
          <span key={row} className="gm-rail-chevron" style={{ '--row': row } as React.CSSProperties}>
            <svg viewBox="0 0 48 20" width="48" height="20"><polyline points={CHEVRON_LINE} /></svg>
            {CHEVRON.map(([x, y], index) => <i key={index} style={{ '--x': `${x}px`, '--y': `${y}px` } as React.CSSProperties} />)}
          </span>
        ))}
      </span>
      <span className="gm-rail-word" aria-hidden="true">Scorri</span>
    </button>
  );
}
