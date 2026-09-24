'use client';

import { useEffect, useRef, useState } from 'react';
import { site } from './content';

const NAV = [
  { id: 'metodo', label: 'Metodo' },
  { id: 'servizi', label: 'Servizi' },
  { id: 'progetti', label: 'Progetti' },
];

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const scrollToSection = (id: string) => {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  history.replaceState(null, '', id === 'inizio' ? location.pathname : `#${id}`);
};

export default function SiteHeader() {
  const [active, setActive] = useState('');
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const barRef = useRef<HTMLSpanElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = innerHeight * 0.4;
      let next = '';
      for (const item of [...NAV, { id: 'contatti' }]) {
        const section = document.getElementById(item.id);
        if (section && section.getBoundingClientRect().top <= line) next = item.id;
      }
      setActive(next);
      const story = document.getElementById('inizio');
      setSolid(!!story && story.getBoundingClientRect().bottom < 80);
      const max = document.documentElement.scrollHeight - innerHeight;
      barRef.current?.style.setProperty('transform', `scaleX(${max > 0 ? scrollY / max : 0})`);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); cancelAnimationFrame(frame); };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenuOpen(false); toggleRef.current?.focus(); } };
    const wide = matchMedia('(min-width: 761px)');
    const onWide = () => { if (wide.matches) setMenuOpen(false); };
    addEventListener('keydown', close);
    wide.addEventListener('change', onWide);
    document.documentElement.classList.add('gm-menu-open');
    return () => {
      removeEventListener('keydown', close);
      wide.removeEventListener('change', onWide);
      document.documentElement.classList.remove('gm-menu-open');
    };
  }, [menuOpen]);

  const go = (event: React.MouseEvent, id: string) => {
    event.preventDefault();
    setMenuOpen(false);
    // Let the page unlock (menu closed) before scrolling.
    requestAnimationFrame(() => scrollToSection(id));
  };

  return (
    <>
      <a className="gm-skip" href="#approccio">Salta l’introduzione animata</a>
      <header className="gm-header" data-solid={solid} data-menu={menuOpen ? 'open' : 'closed'}>
        <span className="gm-header-progress" aria-hidden="true"><span ref={barRef} /></span>
        <a className="gm-logo" href="#inizio" onClick={(event) => go(event, 'inizio')} aria-label={`${site.name} — torna all’inizio`} />

        <nav className="gm-nav" aria-label="Navigazione principale">
          <ul>
            {NAV.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} onClick={(event) => go(event, item.id)} aria-current={active === item.id ? 'location' : undefined}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <a className="gm-btn gm-btn--primary gm-btn--small" href="#contatti" onClick={(event) => go(event, 'contatti')} aria-current={active === 'contatti' ? 'location' : undefined}>
            Parliamo del progetto
          </a>
        </nav>

        <button ref={toggleRef} className="gm-menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="gm-mobile-menu" onClick={() => setMenuOpen((open) => !open)}>
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
          <a className="gm-btn gm-btn--primary gm-btn--large gm-btn--block" href="#contatti" onClick={(event) => go(event, 'contatti')}>
            Parliamo del tuo progetto <span className="gm-btn-arrow" aria-hidden="true">→</span>
          </a>
          {site.email && <a className="gm-mobile-menu-mail" href={`mailto:${site.email}`}>{site.email}</a>}
        </nav>
      </div>
    </>
  );
}
