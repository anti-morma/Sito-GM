'use client';

import { useEffect, useRef, useState } from 'react';
import { isReducedMotion } from '../../motion';

/** The reading path beside a case study's story (case-story.tsx) (computers only): the
 *  chapters by name on a thin line that fills as you read. The chapter you
 *  are in is lit; a click takes you to another one. Each part of the story
 *  says which chapter it belongs to with data-story-chapter. */
export default function StoryPath({ items }: { items: { id: string; label: string }[] }) {
  const root = useRef<HTMLElement>(null);
  const [current, setCurrent] = useState(items[0]?.id);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const nav = root.current;
      if (!nav) return;
      // The reading line: a little above the middle of the screen.
      const line = innerHeight * 0.42;
      const parts = [...document.querySelectorAll<HTMLElement>('[data-story-chapter]')];
      let at = -1;
      parts.forEach((part, i) => { if (part.getBoundingClientRect().top <= line) at = i; });
      const id = parts[Math.max(at, 0)]?.dataset.storyChapter ?? items[0].id;
      const index = items.findIndex((item) => item.id === id);
      // Within the chapter: how far through it the reading line is.
      const own = parts.filter((part) => part.dataset.storyChapter === id);
      const top = own[0]?.getBoundingClientRect().top ?? 0;
      const bottom = own[own.length - 1]?.getBoundingClientRect().bottom ?? 1;
      const through = at < 0 ? 0 : Math.min(1, Math.max(0, (line - top) / Math.max(1, bottom - top)));
      nav.style.setProperty('--story-read', String((index + through) / Math.max(1, items.length - 1)));
      setCurrent(id);
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener('scroll', queue);
      removeEventListener('resize', queue);
    };
  }, [items]);

  const go = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: isReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
  };

  return (
    <nav className="gm-st-path" ref={root} aria-label="Il caso studio">
      <ol>
        {items.map((item) => (
          <li key={item.id} data-current={item.id === current ? '' : undefined}>
            <a href={`#${item.id}`} onClick={(event) => go(event, item.id)} aria-current={item.id === current ? 'location' : undefined}>{item.label}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
