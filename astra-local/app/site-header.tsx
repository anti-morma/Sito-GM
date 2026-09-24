'use client';

import { useEffect, useState } from 'react';

const NAV = [
  { id: 'servizi', label: 'Servizi' },
  { id: 'progetti', label: 'Progetti' },
  { id: 'chi-siamo', label: 'Chi siamo' },
  { id: 'contatti', label: 'Contatti' },
];

const STEPS = [
  { label: 'Idea', target: 'inizio' },
  { label: 'Costruzione', target: 'metodo' },
  { label: 'Servizi', target: 'servizi' },
  { label: 'Progetti', target: 'progetti' },
  { label: 'Contatto', target: 'contatti' },
];

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export const scrollToSection = (id: string) => {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  history.replaceState(null, '', id === 'inizio' ? location.pathname : `#${id}`);
};

export default function SiteHeader() {
  const [step, setStep] = useState(0);
  const [active, setActive] = useState('');
  const [pressed, setPressed] = useState('');
  const [inHero, setInHero] = useState(true);
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = innerHeight * 0.35;
      let nextStep = 0;
      document.querySelectorAll<HTMLElement>('[data-progress-step]').forEach((marker) => {
        if (marker.getBoundingClientRect().top <= line) nextStep = Math.max(nextStep, Number(marker.dataset.progressStep) - 1);
      });
      let nextActive = '';
      for (const item of NAV) {
        const section = document.getElementById(item.id);
        if (section && section.getBoundingClientRect().top <= line) nextActive = item.id;
      }
      setStep(nextStep);
      setActive(nextActive);
      setInHero(scrollY < innerHeight * 0.45);
      const story = document.getElementById('inizio');
      setSolid(!!story && story.getBoundingClientRect().bottom < 80);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); cancelAnimationFrame(frame); };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    addEventListener('keydown', close);
    document.documentElement.classList.add('gm-menu-open');
    return () => { removeEventListener('keydown', close); document.documentElement.classList.remove('gm-menu-open'); };
  }, [menuOpen]);

  useEffect(() => {
    if (!pressed) return;
    const timer = setTimeout(() => setPressed(''), 700);
    return () => clearTimeout(timer);
  }, [pressed]);

  const go = (event: React.MouseEvent, id: string) => {
    event.preventDefault();
    setPressed(id);
    setMenuOpen(false);
    scrollToSection(id);
  };

  return (
    <>
      <header className="gm-header" data-menu={menuOpen ? 'open' : 'closed'} data-solid={solid}>
        <a className="gm-logo" href="#inizio" onClick={(event) => go(event, 'inizio')} aria-label="GoMore — torna all’inizio" />

        <p className="gm-step-mini" aria-hidden="true" data-visible={!inHero}>
          <span>{String(step + 1).padStart(2, '0')}</span>
          {STEPS[step].label}
        </p>

        <nav className="gm-nav" aria-label="Navigazione principale">
          <ul>
            {NAV.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(event) => go(event, item.id)}
                  aria-current={active === item.id ? 'location' : undefined}
                  data-pressed={pressed === item.id || undefined}
                  className={item.id === 'contatti' ? 'gm-nav-contact' : undefined}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <button className="gm-menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="gm-mobile-menu" onClick={() => setMenuOpen((open) => !open)}>
          <span>{menuOpen ? 'Chiudi' : 'Menu'}</span>
          <i aria-hidden="true" />
        </button>
      </header>

      <div id="gm-mobile-menu" className="gm-mobile-menu" data-open={menuOpen} aria-hidden={!menuOpen} inert={!menuOpen}>
        <nav aria-label="Menu">
          <ol>
            {NAV.map((item, index) => (
              <li key={item.id}>
                <a href={`#${item.id}`} onClick={(event) => go(event, item.id)} aria-current={active === item.id ? 'location' : undefined}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <nav className="gm-progress" aria-label="Avanzamento nella pagina" data-visible={!inHero}>
        <ol>
          {STEPS.map((item, index) => (
            <li key={item.label}>
              <a href={`#${item.target}`} onClick={(event) => go(event, item.target)} aria-current={index === step ? 'step' : undefined}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <em>{item.label}</em>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
