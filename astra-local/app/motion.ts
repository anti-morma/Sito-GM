// Reduced motion for the whole site: the system setting, or the visitor's own
// choice ("Ferma le animazioni", motion-toggle.tsx). Every animated part reads
// this instead of the media query alone, so the switch stops the starfields,
// the logo, the rocket and the previews exactly as the system setting does.
// The choice lasts for the visit (sessionStorage) and is marked on <html> as
// data-motion="still", which globals.css treats like the media query.

const QUERY = '(prefers-reduced-motion: reduce)';
const KEY = 'gm-motion';

type Motion = {
  /** True when the page should stand still: the system asks for it, or the visitor chose it. */
  readonly matches: boolean;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
  /** The visitor's own choice, apart from the system setting. */
  chosen(): boolean;
  set(still: boolean): void;
};

let shared: Motion | null = null;

function create(): Motion {
  const media = matchMedia(QUERY);
  const events = new EventTarget();
  const root = document.documentElement;
  const chosen = () => root.dataset.motion === 'still';
  media.addEventListener('change', () => events.dispatchEvent(new Event('change')));
  return {
    get matches() { return media.matches || chosen(); },
    addEventListener: (_, listener) => events.addEventListener('change', listener),
    removeEventListener: (_, listener) => events.removeEventListener('change', listener),
    chosen,
    set(still) {
      if (still === chosen()) return;
      if (still) root.dataset.motion = 'still';
      else delete root.dataset.motion;
      try {
        if (still) sessionStorage.setItem(KEY, 'still');
        else sessionStorage.removeItem(KEY);
      } catch {}
      events.dispatchEvent(new Event('change'));
    },
  };
}

/** Like matchMedia('(prefers-reduced-motion: reduce)'), plus the visitor's choice. */
export function reducedMotion() {
  shared ??= create();
  return shared;
}

export const isReducedMotion = () => reducedMotion().matches;

/** Runs before the first paint (layout.tsx): restores the choice for this visit. */
export const MOTION_SCRIPT = `try{if(sessionStorage.getItem('${KEY}')==='still')document.documentElement.dataset.motion='still'}catch(e){}`;
