'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Ascent, { setAscentProgress, type Point } from './ascent';
import { site } from './content';

// Every section of the page, in order: the one on screen lights up.
const NAV = [
  { id: 'inizio', label: 'Studio' },
  { id: 'pensiero', label: 'Pensiero' },
  { id: 'metodo', label: 'Metodo' },
  { id: 'servizi', label: 'Servizi' },
  { id: 'progetti', label: 'Progetti' },
  { id: 'contatti', label: 'Parliamo del progetto' },
];

// THE ASCENT: the further you go, the higher you climb. The route runs level
// under the names, then climbs to the star beyond the last one.
const ROUTE_HEIGHT = 56;
const STOP_Y = 44;

// Compact screens: the same ascent, drawn small in the top bar.
const MINI = { width: 168, height: 40 };
const MINI_STOPS: Point[] = NAV.map((_, index) => ({ x: 12 + index * 22, y: 29 }));
const MINI_BEND: Point = { x: 136, y: 28 };
const MINI_STAR: Point = { x: 160, y: 7 };

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
  const [route, setRoute] = useState<{ stops: Point[]; bend: Point; star: Point; width: number } | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  // After a click the comet flies straight to the destination while the page
  // scrolls there, instead of stopping at every section on the way.
  const heading = useRef<{ id: string; until: number } | null>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let next = '';
      for (const item of NAV) {
        const section = document.getElementById(item.id);
        if (!section) continue;
        // Sections count once they fill 60% of the screen; the brain and the
        // method live inside the sticky story, so their anchors must be reached.
        const line = innerHeight * (section.classList.contains('gm-story-anchor') ? 0.1 : 0.4);
        if (section.getBoundingClientRect().top <= line) next = item.id;
      }
      // Continuous journey: where the visitor is between two sections, and the
      // last stretch to the star is the end of the page.
      const marks = NAV.map((item, index) => {
        const section = document.getElementById(item.id);
        if (!section || index === 0) return 0;
        const line = innerHeight * (section.classList.contains('gm-story-anchor') ? 0.1 : 0.4);
        return section.getBoundingClientRect().top + scrollY - line;
      });
      marks.push(Math.max(document.documentElement.scrollHeight - innerHeight, marks[marks.length - 1] + 1));
      let progress = marks.length - 1;
      for (let i = 0; i < marks.length - 1; i++) {
        if (scrollY < marks[i + 1]) {
          progress = i + Math.max(0, (scrollY - marks[i]) / Math.max(1, marks[i + 1] - marks[i]));
          break;
        }
      }
      setAscentProgress(progress);

      const flight = heading.current;
      if (flight && (next === flight.id || performance.now() > flight.until)) heading.current = null;
      if (!heading.current) setActive(next);
      const story = document.getElementById('inizio');
      setSolid(!!story && story.getBoundingClientRect().bottom < 80);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    // A new gesture from the visitor takes over from a clicked destination.
    const interrupt = () => { heading.current = null; };
    update();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    addEventListener('wheel', interrupt, { passive: true });
    addEventListener('touchstart', interrupt, { passive: true });
    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      removeEventListener('wheel', interrupt);
      removeEventListener('touchstart', interrupt);
      cancelAnimationFrame(frame);
    };
  }, []);

  // One star per section under the centre of its name, the final star just
  // beyond the last one, near the top of the capsule.
  useLayoutEffect(() => {
    const measure = () => {
      const links = NAV.map((item) => linkRefs.current[item.id]);
      const last = links[links.length - 1];
      const box = last?.parentElement?.parentElement?.parentElement;
      if (!last || !box || links.some((link) => !link || !link.offsetWidth)) return setRoute(null);
      const stops = links.map((link) => ({ x: link!.offsetLeft + link!.offsetWidth / 2, y: STOP_Y }));
      // The route stays low under the last name, then makes its final climb.
      const lastStop = stops[stops.length - 1];
      const end = last.offsetLeft + last.offsetWidth;
      const next = { stops, bend: { x: end - 2, y: lastStop.y - 1.5 }, star: { x: end + 24, y: 13 }, width: box.offsetWidth };
      setRoute((previous) => (previous && previous.width === next.width && previous.stops.every((p, i) => Math.abs(p.x - next.stops[i].x) < 0.5) ? previous : next));
    };
    measure();
    addEventListener('resize', measure);
    document.fonts?.ready.then(measure);
    return () => removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenuOpen(false); toggleRef.current?.focus(); } };
    const wide = matchMedia('(min-width: 961px)');
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
    heading.current = { id, until: performance.now() + 3000 };
    setActive(id);
    // Let the page unlock (menu closed) before scrolling.
    requestAnimationFrame(() => scrollToSection(id));
  };

  return (
    <>
      <a className="gm-skip" href="#servizi">Salta l’introduzione animata</a>
      <header className="gm-header" data-solid={solid} data-menu={menuOpen ? 'open' : 'closed'}>
        <a className="gm-logo" href="#inizio" onClick={(event) => go(event, 'inizio')} aria-label={`${site.name} — torna all’inizio`} />

        {/* The sections, in a dedicated capsule: a comet travels to the one on screen. */}
        <nav className="gm-nav" aria-label="Sezioni">
          <div className="gm-nav-route">
            <ul>
              {NAV.map((item) => (
                <li key={item.id}>
                  <a
                    ref={(link) => { linkRefs.current[item.id] = link; }}
                    href={`#${item.id}`}
                    onClick={(event) => go(event, item.id)}
                    aria-current={active === item.id ? 'location' : undefined}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            {route && <Ascent stops={route.stops} bend={route.bend} star={route.star} arrive={14} width={route.width} height={ROUTE_HEIGHT} active={NAV.findIndex((item) => item.id === active)} />}
          </div>
        </nav>

        <Ascent className="gm-ascent-mini" stops={MINI_STOPS} bend={MINI_BEND} star={MINI_STAR} arrive={10} width={MINI.width} height={MINI.height} active={NAV.findIndex((item) => item.id === active)} />

        <a className="gm-btn gm-btn--primary gm-btn--small gm-header-cta" href="#contatti" onClick={(event) => go(event, 'contatti')}>
          Contattaci
        </a>

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
            Contattaci <span className="gm-btn-arrow" aria-hidden="true">→</span>
          </a>
          {site.email && <a className="gm-mobile-menu-mail" href={`mailto:${site.email}`}>{site.email}</a>}
        </nav>
      </div>
    </>
  );
}
