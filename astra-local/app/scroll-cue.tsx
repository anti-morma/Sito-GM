'use client';

import { useEffect, useState } from 'react';

// How long the visitor must stay still before the cue comes back.
const IDLE_MS = 1100;

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * One scroll cue for the whole page, always centred at the bottom.
 * At the top it invites exploration; afterwards it steps aside while the
 * visitor scrolls and returns whenever they pause, until the contact section.
 * It is a real control: it jumps to the next stop ([data-scroll-stop]).
 */
export default function ScrollCue() {
  const [atTop, setAtTop] = useState(true);
  const [scrolling, setScrolling] = useState(false);
  const [ended, setEnded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let frame = 0;
    let timer = 0;
    const evaluate = () => {
      frame = 0;
      setAtTop(scrollY < 8);
      const contact = document.getElementById('contatti');
      setEnded(!!contact && contact.getBoundingClientRect().top < innerHeight * 0.72);
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

  const visible = !ended && !menuOpen && (atTop || !scrolling);
  const label = atTop ? 'Scorri per esplorare' : 'Continua a scorrere';

  return (
    <button
      type="button"
      className="gm-cue"
      data-mode={atTop ? 'hero' : 'compact'}
      data-visible={visible}
      inert={!visible}
      onClick={next}
      aria-label={`${label}: vai alla sezione successiva`}
    >
      <span className="gm-cue-label">{label}</span>
      <span className="gm-cue-track" aria-hidden="true"><i /></span>
    </button>
  );
}
