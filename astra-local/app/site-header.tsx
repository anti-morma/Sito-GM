'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { site } from './content';
import DynamicGMLogo from './dynamic-gm-logo';
import { isReducedMotion } from './motion';
import MotionToggle from './motion-toggle';
import { wherePath } from './places';
import { contactDetails, DetailText, legalDetails } from './studio-details';
import WhereLink from './where-link';

// The site's pages, in order. Each link always opens its page, from anywhere:
// the same name never does two different things. The last one is the action.
const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Progetti', href: '/progetti' },
  { label: 'Chi siamo', href: '/chi-siamo' },
  { label: 'Servizi', href: '/servizi' },
  { label: 'Contatti', href: '/contatti' },
];

/** Where the visitor is: the page itself ("page"), or a page inside it, such
 *  as a case study under Progetti ("true"). The cities and the legal pages
 *  belong to no item: their breadcrumbs say where they are. */
function currentOf(pathname: string, href: string): 'page' | 'true' | undefined {
  if (pathname === href) return 'page';
  if (href !== '/' && pathname.startsWith(`${href}/`)) return 'true';
  return undefined;
}

/**
 * The header, the same on every page (rendered by the root layout): the GM on
 * the left, the pages on the right, Contatti as the button. On phones the GM
 * is a living constellation (dynamic-gm-logo.tsx) and the pages open in a
 * full-screen menu.
 */
export default function SiteHeader() {
  const pathname = usePathname() || '/';
  const home = pathname === '/';
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const contacts = contactDetails();
  const legal = legalDetails();
  const toggleRef = useRef<HTMLButtonElement>(null);

  // A quiet backdrop once the page moves under the header (on the home, once
  // the opening screen has gone).
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const hero = home ? document.getElementById('inizio') : null;
      setSolid(hero ? hero.getBoundingClientRect().bottom < 80 : scrollY > 24);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [home]);

  // A new page closes the menu.
  useEffect(() => setMenuOpen(false), [pathname]);

  // Where you are, for whoever lands mid-page. Each section opens with its
  // label ("GM · Progetti"): once that label has scrolled up under the header,
  // its name docks beside the GM, as if the label had moved up there, and
  // stays until the section ends. While any label is on screen the header
  // says nothing: it speaks only when the page would not. A page inside a section
  // (a case study, a service) docks its title instead. The page itself is
  // already marked in the menu.
  const [here, setHere] = useState({ name: '', on: false });
  useEffect(() => {
    const inside = NAV.some((item) => currentOf(pathname, item.href) === 'true');
    const nameOf = (anchor: HTMLElement) => {
      const copy = anchor.cloneNode(true) as HTMLElement;
      copy.querySelectorAll('.gm-label-mark, .gm-sr-only').forEach((part) => part.remove());
      return (copy.textContent ?? '').trim().replace(/\.$/, '');
    };
    let frame = 0;
    const update = () => {
      frame = 0;
      const edge = document.querySelector('.gm-header')?.getBoundingClientRect().bottom ?? 72;
      const anchors = document.querySelectorAll<HTMLElement>(inside ? 'main h1' : 'main .gm-label:not(.gm-hero-eyebrow)');
      let name = '';
      for (const anchor of anchors) {
        const block = inside ? anchor.closest('main') : anchor.closest('section');
        const box = anchor.getBoundingClientRect();
        if (!block?.offsetHeight || !box.height) continue;
        // A label on screen already says where you are.
        if (box.bottom > edge && box.top < innerHeight) { name = ''; break; }
        if (box.bottom <= edge) name = block.getBoundingClientRect().bottom > edge + 48 ? nameOf(anchor) : '';
      }
      setHere((current) => name
        ? (current.on && current.name === name ? current : { name, on: true })
        : (current.on ? { ...current, on: false } : current));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    setHere({ name: '', on: false });
    update();
    const late = window.setTimeout(update, 400);
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
      clearTimeout(late);
    };
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    // The menu covers the page: what lies behind it leaves the keyboard's and
    // the screen reader's path until it closes, and the focus moves in.
    const header = toggleRef.current?.closest('header');
    const menu = document.getElementById('gm-mobile-menu');
    const behind = [...document.body.children].filter((element) =>
      element !== header && element !== menu && !(element instanceof HTMLScriptElement) && !element.hasAttribute('inert'));
    behind.forEach((element) => element.setAttribute('inert', ''));
    menu?.querySelector<HTMLElement>('nav a')?.focus();
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenuOpen(false); toggleRef.current?.focus(); } };
    const wide = matchMedia('(min-width: 761px)');
    const onWide = () => { if (wide.matches) setMenuOpen(false); };
    addEventListener('keydown', close);
    wide.addEventListener('change', onWide);
    document.documentElement.classList.add('gm-menu-open');
    return () => {
      behind.forEach((element) => element.removeAttribute('inert'));
      removeEventListener('keydown', close);
      wide.removeEventListener('change', onWide);
      document.documentElement.classList.remove('gm-menu-open');
    };
  }, [menuOpen]);

  const last = NAV.length - 1;
  // The page you are already on: its link takes you back to the top of it.
  const toTop = (event: React.MouseEvent, href: string) => {
    setMenuOpen(false);
    if (href !== pathname) return;
    event.preventDefault();
    scrollTo({ top: 0, behavior: isReducedMotion() ? 'auto' : 'smooth' });
  };

  return (
    <>
      {home ? <a className="gm-skip" href="#progetti">Salta l’introduzione animata</a> : <a className="gm-skip" href="#contenuto">Vai al contenuto</a>}
      <header className="gm-header" data-solid={solid} data-menu={menuOpen ? 'open' : 'closed'}>
        <Link className="gm-logo" href="/" onClick={(event) => toTop(event, '/')} aria-label={`${site.name} — home`}>
          <DynamicGMLogo />
        </Link>

        {/* You are here: the section's label, docked beside the GM. */}
        <p className="gm-here" data-on={here.on ? '' : undefined} aria-hidden={here.on ? undefined : true}>
          <span className="gm-label-dot" aria-hidden="true" />
          <span className="gm-sr-only">Sei in: </span>
          <span key={here.name} className="gm-here-name">{here.name}</span>
        </p>

        <nav className="gm-nav" aria-label="Principale">
          <ul>
            {NAV.map((item, index) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={(event) => toTop(event, item.href)}
                  className={index === last ? 'gm-nav-action' : undefined}
                  aria-current={currentOf(pathname, item.href)}
                  data-cta={index === last ? 'header' : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
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
              <li key={item.href}>
                <Link href={item.href} onClick={(event) => toTop(event, item.href)} aria-current={currentOf(pathname, item.href)} data-cta={index === last ? 'menu' : undefined}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ol>
          {/* Contacts, then the studio's legal details and pages, quietly. */}
          <div className="gm-mobile-menu-info">
            <WhereLink current={pathname === wherePath} onClick={() => setMenuOpen(false)} />
            {contacts.length > 0 && (
              <ul className="gm-mobile-menu-contacts" aria-label="Contatti">
                {contacts.map((item) => <li key={item.key}><DetailText item={item} /></li>)}
              </ul>
            )}
            {legal.length > 0 && (
              <p className="gm-mobile-menu-legal">
                {legal.map((item) => <span key={item.key}><DetailText item={item} /></span>)}
              </p>
            )}
            <p className="gm-mobile-menu-pages">
              <Link href="/privacy" onClick={() => setMenuOpen(false)}>Privacy</Link>
              <Link href="/cookie" onClick={() => setMenuOpen(false)}>Cookie</Link>
              <MotionToggle />
            </p>
          </div>
        </nav>
      </div>
    </>
  );
}
