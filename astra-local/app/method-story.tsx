'use client';

import { useEffect, useRef, useState } from 'react';
import ConstructionVideo from './construction-video';
import SectionLabel from './section-label';
import { housePhases } from './content';
import { METHOD_TRAVEL, methodStoryAt, methodUnitsAt } from './method-timeline';

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoothStep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

// Where each phase starts in the construction footage (share of the film), on
// the film's own beats: the plan, the volumes rising, the furnishing, the wave
// of light and materials, the finished house.
const PHASE_STARTS = [0, 0.25, 0.48, 0.68, 0.84];
// Scroll (share of the film's stretch) → film. The plan barely moves for its
// first fifth: it passes in a tenth of the scroll, the rest runs evenly.
const FILM_KEYS: [number, number][] = [[0, 0], [0.1, 0.22], [1, 1]];
const piecewise = (keys: [number, number][], value: number) => {
  for (let i = 1; i < keys.length; i++) {
    const [x1, y1] = keys[i];
    const [x0, y0] = keys[i - 1];
    if (value <= x1) return y0 + ((value - x0) / (x1 - x0)) * (y1 - y0);
  }
  return keys[keys.length - 1][1];
};
const filmAt = (scroll: number) => piecewise(FILM_KEYS, clamp01(scroll));
const scrollAt = (film: number) => piecewise(FILM_KEYS.map(([x, y]) => [y, x]), clamp01(film));
// The scroll cue's stops: the words read, the film's start, then the middle of
// each later phase.
const STOPS = [
  30,
  methodUnitsAt(0.865),
  ...PHASE_STARTS.slice(1).map((start, index) => {
    const middle = (start + (PHASE_STARTS[index + 2] ?? 1)) / 2;
    return methodUnitsAt(0.865 + scrollAt(middle) * 0.135);
  }),
];

/**
 * The method, one step at a time as the visitor scrolls (method-timeline.ts):
 * the kicker, the title and its line appear over loose stars; the stars draw
 * the villa; the construction footage takes over with the five phases already
 * listed, and a dot walks down them as the house is built.
 */
export default function MethodStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [units, setUnits] = useState(0);
  const [near, setNear] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const section = sectionRef.current;
      const stage = stageRef.current;
      if (!section || !stage) return;
      const travel = Math.max(1, section.offsetHeight - stage.offsetHeight);
      const next = clamp01(-section.getBoundingClientRect().top / travel) * METHOD_TRAVEL;
      // Finer than a frame of the film: no new render for it.
      setUnits((previous) => (Math.abs(previous - next) < 0.05 ? previous : next));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    const syncTimer = window.setTimeout(update, 300);
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    addEventListener('hashchange', onScroll);
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setNear(true);
    }, { rootMargin: '100% 0px' });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      removeEventListener('hashchange', onScroll);
      window.clearTimeout(syncTimer);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const s = methodStoryAt(units);
  // The words, one after the other, while the stars are still loose.
  const reveal = (from: number) => ({ '--in': smoothStep((units - from) / 14) }) as React.CSSProperties;
  const videoEnter = smoothStep((s - 0.84) / 0.025);
  // The phases arrive with the footage, already written.
  const phasesIn = smoothStep((s - 0.845) / 0.02);
  const videoProgress = filmAt((s - 0.865) / 0.135);
  let phase = 0;
  PHASE_STARTS.forEach((start, index) => { if (videoProgress >= start) phase = index; });

  return (
    <section ref={sectionRef} className="gm-method-story" aria-labelledby="metodo-title" data-video-ready={videoReady} style={{ height: `${METHOD_TRAVEL + 100}svh` }}>
      {STOPS.map((stop, index) => <span key={stop} id={index === 0 ? 'metodo' : undefined} className="gm-story-anchor" data-scroll-stop style={{ top: `${stop}svh` }} />)}
      <div ref={stageRef} className="gm-stage">
        <div className="gm-neural-atmosphere" aria-hidden="true" style={{ opacity: 1 - smoothStep((s - 0.84) / 0.05) }} />
        <div className="gm-construction-video" aria-hidden="true" style={{ opacity: videoReady ? videoEnter : 0 }}>
          {near && <ConstructionVideo progress={videoProgress} onReady={setVideoReady} />}
        </div>
        <div className="gm-house">
          <div className="gm-house-intro">
            <SectionLabel style={reveal(0)}>Il metodo</SectionLabel>
            <h2 className="gm-house-title" id="metodo-title" style={reveal(7)}>Come creiamo il vostro sito web</h2>
            <p className="gm-house-lead" style={reveal(15)}>Come una casa: prima le fondamenta, poi la struttura, la forma e i dettagli.</p>
          </div>
          <div className="gm-phases" style={{ '--in': phasesIn } as React.CSSProperties}>
            {/* Phones only: where the visitor is along the five phases. */}
            <p className="gm-phases-count" aria-hidden="true">
              <span>{String(phase + 1).padStart(2, '0')}</span> / {String(housePhases.length).padStart(2, '0')}
            </p>
            <div className="gm-phases-dots" aria-hidden="true">
              {housePhases.map((item, index) => <i key={item.title} className={index <= phase ? 'is-on' : undefined} />)}
            </div>
            <ol>
              {housePhases.map((item, index) => (
                <li key={item.title} className={index === phase ? 'is-active' : index < phase ? 'is-done' : undefined} aria-current={index === phase ? 'step' : undefined}>
                  <span className="gm-phase-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="gm-phase-body">
                    <strong>{item.title}</strong>
                    <span>{item.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
