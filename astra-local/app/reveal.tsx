'use client';

import { useEffect } from 'react';

/** Section reveal: [data-reveal] elements fade and rise once as they enter. */
export default function Reveal() {
  useEffect(() => {
    const root = document.documentElement;
    const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    items.forEach((item) => {
      // Content already on screen (e.g. after a reload mid-page) stays put.
      if (item.getBoundingClientRect().top < innerHeight * 0.88) item.classList.add('is-visible');
      else observer.observe(item);
    });
    root.classList.add('gm-reveal-ready');
    return () => observer.disconnect();
  }, []);
  return null;
}
