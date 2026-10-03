'use client';

import { useEffect, useRef, useState } from 'react';
import { isReducedMotion } from './motion';

/**
 * Phones: the projects side by side in a swipeable row, one at a time, with an
 * arrow each side of the preview and a dot per project. On larger screens the
 * row is the usual list and the controls are hidden; on computers it is a
 * row again, one project per screen (globals.css).
 */
export default function ProjectCarousel({ count, children }: { count: number; children: React.ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const row = track.current;
    if (!row) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const current = Math.round(row.scrollLeft / Math.max(1, row.clientWidth));
      setIndex(current);
      // Only the project in view keeps its light: a neighbour's would spill
      // into the row and be cut at its edge. As a plain list, all keep it.
      const sliding = row.scrollWidth > row.clientWidth + 1;
      [...row.children].forEach((slide, i) => slide.toggleAttribute('data-current', !sliding || i === current));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    row.addEventListener('scroll', onScroll, { passive: true });
    const resize = new ResizeObserver(onScroll);
    resize.observe(row);
    update();
    return () => {
      row.removeEventListener('scroll', onScroll);
      resize.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  const go = (next: number) => {
    const row = track.current;
    if (!row) return;
    const still = isReducedMotion();
    row.scrollTo({ left: Math.max(0, Math.min(count - 1, next)) * row.clientWidth, behavior: still ? 'auto' : 'smooth' });
  };

  return (
    <div className="gm-project-carousel">
      <div ref={track} className="gm-project-list">{children}</div>
      {/* Laid out together on computers; on phones each control sits on its own. */}
      <div className="gm-project-controls">
        <button type="button" className="gm-project-arrow gm-project-arrow--prev" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Progetto precedente">
          <span aria-hidden="true" />
        </button>
        <button type="button" className="gm-project-arrow gm-project-arrow--next" onClick={() => go(index + 1)} disabled={index >= count - 1} aria-label="Progetto successivo">
          <span aria-hidden="true" />
        </button>
        <div className="gm-project-dots">
          {Array.from({ length: count }, (_, i) => (
            <button key={i} type="button" onClick={() => go(i)} aria-label={`Progetto ${i + 1} di ${count}`} aria-current={i === index ? 'true' : undefined} />
          ))}
        </div>
      </div>
    </div>
  );
}
