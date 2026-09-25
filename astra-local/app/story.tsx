'use client';

import { useEffect, useRef, useState } from 'react';
import SectionLabel from './section-label';
import { brainMessages } from './content';
import { STORY_UNITS, storyAt, unitsAt } from './story-timeline';

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoothStep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

// Three beats keep the thought concise before the particles disperse.
const CHAPTER_BOUNDS = [0.345, 0.56, 0.68, 0.775];
const CHAPTER_FADE = 0.014;

const STOPS = [0.4, 0.61, 0.73];

export default function Story() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const section = sectionRef.current;
      const stage = stageRef.current;
      if (!section || !stage) return;
      const travel = Math.max(1, section.offsetHeight);
      const fraction = clamp01(-section.getBoundingClientRect().top / travel);
      setScrollProgress(storyAt(fraction * STORY_UNITS));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    const syncTimer = window.setTimeout(update, 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('hashchange', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('hashchange', onScroll);
      window.clearTimeout(syncTimer);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const s = scrollProgress;
  const gmExit = smoothStep(s / 0.16);
  let chapter = -1;
  CHAPTER_BOUNDS.slice(0, -1).forEach((bound, index) => { if (s >= bound) chapter = index; });
  const chaptersOn = smoothStep((s - 0.33) / 0.02) * (1 - smoothStep((s - 0.75) / 0.02));

  return (
    <section ref={sectionRef} className="gm-story" id="inizio" aria-label="Dall'idea al sito online" style={{ height: `${STORY_UNITS}svh` }}>
      <span className="gm-story-anchor" id="pensiero" style={{ top: `${unitsAt(0.36)}svh` }} />
      {STOPS.map((stop) => <span key={stop} className="gm-story-anchor" data-scroll-stop style={{ top: `${unitsAt(stop)}svh` }} />)}

      <div ref={stageRef} className="gm-stage">
        {/* The nebula fades while the network disperses; the site's sky remains. */}
        <div className="gm-nebula" aria-hidden="true" style={{ opacity: 1 - smoothStep((s - 0.6) / 0.18), '--nebula-x': `${68 - 18 * smoothStep((s - 0.08) / 0.28)}%` } as React.CSSProperties} />
        <div className="gm-neural-atmosphere" aria-hidden="true" style={{ opacity: smoothStep((s - 0.48) / 0.10) }} />

        {/* 01 — Hero: the headline leads, one clear action, one clear gesture. */}
        <div className="gm-hero-copy" inert={gmExit > 0.6} style={{ opacity: 1 - gmExit, '--hero-lift': `${-s * 420}svh` } as React.CSSProperties}>
          <SectionLabel className="gm-hero-eyebrow">Studio digitale · Siti web su misura</SectionLabel>
          <h1 className="gm-hero-title">
            Diamo forma a ciò che <em>ti rende unico.</em>
          </h1>
          <p className="gm-hero-description">Progettiamo e sviluppiamo siti web su misura che fanno capire in pochi secondi chi sei, cosa offri e perché sceglierti.</p>
          <div className="gm-hero-actions">
            <a className="gm-btn gm-btn--primary gm-btn--large" href="#contatti">
              Parliamo del tuo progetto <span className="gm-btn-arrow" aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        {/* 02 — Thought: the brain, three chapters, one at a time. */}
        <p className="gm-sr-only">Il pensiero: un’idea prende forma e prende vita.</p>
        <div className="gm-chapters" aria-hidden="true" style={{ opacity: chaptersOn, visibility: chaptersOn < 0.01 ? 'hidden' : undefined }}>
          <SectionLabel className="gm-chapters-label">Il pensiero</SectionLabel>
          <div className="gm-chapter-stack">
            {brainMessages.map((message, index) => {
              // Sequential hand-over: the previous title leaves before the next arrives.
              const enter = index === 0
                ? smoothStep((s - CHAPTER_BOUNDS[0] + CHAPTER_FADE) / (CHAPTER_FADE * 2))
                : smoothStep((s - CHAPTER_BOUNDS[index]) / CHAPTER_FADE);
              const exit = smoothStep((s - CHAPTER_BOUNDS[index + 1] + CHAPTER_FADE) / CHAPTER_FADE);
              const opacity = enter * (1 - exit);
              return (
                <div key={message} className="gm-chapter" style={{ opacity, visibility: opacity < 0.01 ? 'hidden' : undefined, transform: `translateY(${(1 - enter) * 18 - exit * 18}px)` }}>
                  <span className="gm-chapter-number">{String(index + 1).padStart(2, '0')}</span>
                  <p className="gm-chapter-title">{message}</p>
                </div>
              );
            })}
          </div>
          <div className="gm-chapter-progress">
            <span className="gm-chapter-bars">
              {brainMessages.map((message, index) => <i key={message} className={index <= chapter ? 'is-on' : undefined} />)}
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
