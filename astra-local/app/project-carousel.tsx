'use client';

import { useEffect, useRef, useState } from 'react';
import { isReducedMotion } from './motion';

// When a project has no recording playing (none, or autoplay refused), it
// moves on after this long anyway.
const FALLBACK_MS = 9000;
const SLIDE_MS = 900;

/**
 * The home's projects, one at a time, always moving forward: the one on
 * screen leaves to the left and the next comes in from the right, the first
 * again after the last. Each stays until its recording has played through
 * once, then the next comes in. Arrows and dots go anywhere; a swipe works
 * on touch screens. It does not move on while the keyboard is in it, the
 * pointer is on one of its buttons, it is off screen or the tab is hidden,
 * nor with reduced motion.
 */
export default function ProjectCarousel({ count, children }: { count: number; children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const current = useRef(0);

  const slides = () => [...(track.current?.children ?? [])] as HTMLElement[];

  // Only the project on screen is reachable, read aloud and lit.
  const mark = (at: number) => slides().forEach((slide, i) => {
    slide.toggleAttribute('data-current', i === at);
    slide.inert = i !== at;
    slide.setAttribute('aria-hidden', String(i !== at));
  });

  /** dir 1: forward (out to the left, in from the right); -1: back. */
  const go = (target: number, dir: 1 | -1 = 1) => {
    const from = current.current;
    const to = ((target % count) + count) % count;
    if (to === from) return;
    const list = slides();
    const leaving = list[from];
    const coming = list[to];
    if (!leaving || !coming) return;
    const still = isReducedMotion();
    // The new one waits just outside, on the side it comes from...
    coming.style.transition = 'none';
    coming.style.transform = `translateX(${dir * 100}%)`;
    coming.style.visibility = 'visible';
    void coming.offsetWidth;
    // ...then both move together.
    const move = still ? 'none' : `transform ${SLIDE_MS}ms cubic-bezier(0.65, 0, 0.2, 1)`;
    coming.style.transition = move;
    leaving.style.transition = move;
    coming.style.transform = 'translateX(0)';
    leaving.style.transform = `translateX(${-dir * 100}%)`;
    window.setTimeout(() => { if (current.current !== from) leaving.style.visibility = 'hidden'; }, still ? 0 : SLIDE_MS);
    // The new recording starts from its beginning.
    const video = coming.querySelector('video');
    if (video && video.readyState > 0) video.currentTime = 0;
    current.current = to;
    mark(to);
    setIndex(to);
  };

  useEffect(() => {
    slides().forEach((slide, i) => {
      slide.style.transform = i ? 'translateX(100%)' : 'translateX(0)';
      slide.style.visibility = i ? 'hidden' : 'visible';
    });
    mark(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On to the next once the recording on screen has played through once.
  useEffect(() => {
    const box = root.current;
    if (!box || count < 2) return;
    const video = slides()[index]?.querySelector('video') ?? null;
    let seen = false;
    let due = false;
    let last = 0;
    let idle = 0;
    // Arriving at the section, the project on screen plays from its start.
    const watch = new IntersectionObserver(([entry]) => {
      const now = entry.intersectionRatio >= 0.5;
      if (now && !seen && video) {
        if (video.readyState > 0) video.currentTime = 0;
        last = 0;
        due = false;
      }
      seen = now;
    }, { threshold: [0, 0.5] });
    watch.observe(box);
    const held = () => !!box.querySelector('a:hover, button:hover, :focus-visible');
    const free = () => seen && !document.hidden && !isReducedMotion();
    // A loop shows up as the clock jumping back to the start.
    const onTime = () => {
      if (!video) return;
      if (video.currentTime + 0.5 < last) due = true;
      last = video.currentTime;
    };
    video?.addEventListener('timeupdate', onTime);
    const tick = window.setInterval(() => {
      if (!free()) { idle = 0; return; }
      // No recording playing (none, or refused): move on after a while anyway.
      idle = !video || video.paused ? idle + 250 : 0;
      if (idle >= FALLBACK_MS) due = true;
      if (due && !held()) { due = false; go(index + 1, 1); }
    }, 250);
    return () => {
      clearInterval(tick);
      watch.disconnect();
      video?.removeEventListener('timeupdate', onTime);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, count]);

  // A swipe on touch screens.
  useEffect(() => {
    const list = track.current;
    if (!list) return;
    let startX = 0;
    let startY = 0;
    let id = -1;
    const down = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') return;
      id = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
    };
    const up = (event: PointerEvent) => {
      if (event.pointerId !== id) return;
      id = -1;
      const dx = event.clientX - startX;
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(event.clientY - startY)) return;
      if (dx < 0) go(current.current + 1, 1);
      else go(current.current - 1, -1);
    };
    const cancel = () => { id = -1; };
    list.addEventListener('pointerdown', down);
    list.addEventListener('pointerup', up);
    list.addEventListener('pointercancel', cancel);
    return () => {
      list.removeEventListener('pointerdown', down);
      list.removeEventListener('pointerup', up);
      list.removeEventListener('pointercancel', cancel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={root} className="gm-project-carousel" aria-roledescription="carosello">
      <div ref={track} className="gm-project-list">{children}</div>
      <div className="gm-project-controls">
        <button type="button" className="gm-project-arrow gm-project-arrow--prev" onClick={() => go(index - 1, -1)} aria-label="Progetto precedente">
          <span aria-hidden="true" />
        </button>
        <div className="gm-project-dots">
          {Array.from({ length: count }, (_, i) => (
            <button key={i} type="button" onClick={() => go(i, i < index ? -1 : 1)} aria-label={`Progetto ${i + 1} di ${count}`} aria-current={i === index ? 'true' : undefined} />
          ))}
        </div>
        <button type="button" className="gm-project-arrow gm-project-arrow--next" onClick={() => go(index + 1, 1)} aria-label="Progetto successivo">
          <span aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
