import { PHONE_OPENING_QUERY } from './gm-constellation';

// Phones, first visit of the session: black before the first paint, for the
// opening (gomore-mobile-intro.tsx), which ends in the header logo. Never on a
// reload, a return or a link to a section (sessionStorage: a new session plays
// it again); with reduced motion, a short version of fades. Modest phones
// (Chrome: 4 GB of memory or less) and "save data" skip it: the page is there
// at once. If the opening is not under way in time, the page simply appears.
// To preview it again, add ?intro to the address: it then plays on every load.
// It lives in the root layout, so it runs once per page load and never again
// on a navigation inside the site (a script rendered there would not run).
export const OPENING_SCRIPT = `(() => { try {
  if (location.pathname !== '/') return;
  const root = document.documentElement;
  const visit = performance.getEntriesByType('navigation')[0];
  const preview = new URLSearchParams(location.search).has('intro');
  if (!matchMedia('${PHONE_OPENING_QUERY}').matches) return;
  const memory = navigator.deviceMemory, link = navigator.connection;
  if (!preview && ((link && link.saveData) || (memory && memory <= 4))) return;
  if (!preview && (location.hash || (visit && visit.type !== 'navigate')
    || sessionStorage.getItem('gm-intro'))) return;
  sessionStorage.setItem('gm-intro', '1');
  root.classList.add('gm-intro');
  root.dataset.intro = 'waiting';
  const show = () => {
    if (!root.classList.contains('gm-intro')) return;
    root.classList.remove('gm-intro');
    root.classList.add('gm-intro-done');
    delete root.dataset.intro;
  };
  setTimeout(() => { if (root.dataset.intro === 'waiting') show(); }, 2500);
  setTimeout(show, 6500);
} catch (error) {} })();`;
