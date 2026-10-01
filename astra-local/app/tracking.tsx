'use client';

import { useEffect } from 'react';
import { track } from '@vercel/analytics';

/**
 * What the site measures beyond page views (README, *Misurazione*): three
 * anonymous events in Vercel Web Analytics, without cookies or personal data.
 * - cta_click: an action marked with data-cta, with where it sits (hero,
 *   header, menu, servizio-sito…) and, for projects, which one.
 * - contact_click: the e-mail or the phone, written out on the page.
 * - generate_lead: the contact form really sent, i.e. its success message on
 *   screen, not a click on its button (which also counts failed attempts).
 */
export default function Tracking() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('a, button') : null;
      if (!target) return;
      const cta = target.getAttribute('data-cta');
      if (cta) {
        const project = target.getAttribute('data-project');
        track('cta_click', project ? { position: cta, project } : { position: cta });
        return;
      }
      const href = target.getAttribute('href') ?? '';
      if (href.startsWith('mailto:')) track('contact_click', { type: 'email' });
      else if (href.startsWith('tel:')) track('contact_click', { type: 'phone' });
    };

    // The form is the studio's shared template (app/_contact): its success
    // message is the one sure sign that a request arrived.
    const isSent = (node: Node) => node instanceof Element && (node.matches('.cf-sent') || !!node.querySelector('.cf-sent'));
    const observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => [...mutation.addedNodes].some(isSent))) track('generate_lead');
    });
    observer.observe(document.body, { childList: true, subtree: true });
    // Sent without JavaScript: the page comes back already showing the message.
    if (document.querySelector('.cf-sent')) track('generate_lead');

    document.addEventListener('click', onClick, { capture: true });
    return () => {
      document.removeEventListener('click', onClick, { capture: true });
      observer.disconnect();
    };
  }, []);
  return null;
}
