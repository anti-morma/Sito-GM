'use client';

import { useEffect, useRef, useState } from 'react';
import ConstructionVideo from './construction-video';
import SectionLabel from './section-label';
import { housePhases } from './content';

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoothStep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

// The villa starts assembling as this section enters the viewport; continue
// the drawing and then the construction footage over their own scroll distance.
const KEYS: [number, number][] = [[0, 0.815], [70, 0.865], [250, 1]];
const TRAVEL = KEYS[KEYS.length - 1][0];
const PHASE_STARTS = [0, 0.27, 0.5, 0.72, 0.88];
const STOPS = [0.865, 0.905, 0.935, 0.965, 0.995];
// Phones and portrait tablets (see globals.css): the video does not move aside,
// so the words can arrive with it and the first phase stays lit for longer.
const STACKED = '(max-width: 600px), (max-aspect-ratio: 9/10)';

const storyAt = (units: number) => {
  for (let i = 1; i < KEYS.length; i++) {
    const [u1, s1] = KEYS[i];
    const [u0, s0] = KEYS[i - 1];
    if (units <= u1) return s0 + ((units - u0) / (u1 - u0)) * (s1 - s0);
  }
  return 1;
};

const unitsAt = (story: number) => {
  for (let i = 1; i < KEYS.length; i++) {
    const [u1, s1] = KEYS[i];
    const [u0, s0] = KEYS[i - 1];
    if (story <= s1) return u0 + ((story - s0) / (s1 - s0)) * (u1 - u0);
  }
  return TRAVEL;
};

export default function MethodStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0.815);
  const [near, setNear] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [stacked, setStacked] = useState(false);

  useEffect(() => {
    const media = matchMedia(STACKED);
    const sync = () => setStacked(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const section = sectionRef.current;
      const stage = stageRef.current;
      if (!section || !stage) return;
      const travel = Math.max(1, section.offsetHeight - stage.offsetHeight);
      const fraction = clamp01(-section.getBoundingClientRect().top / travel);
      const next = storyAt(fraction * TRAVEL);
      // Finer than a frame of the film: no new render for it.
      setScrollProgress((previous) => (Math.abs(previous - next) < 1e-4 ? previous : next));
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

  const s = scrollProgress;
  const videoEnter = smoothStep((s - 0.84) / 0.025);
  const settle = smoothStep((s - 0.862) / 0.026);
  const houseEnter = stacked ? smoothStep((s - 0.848) / 0.02) : smoothStep((s - 0.883) / 0.024);
  const videoProgress = clamp01((s - 0.865) / 0.135);
  let phase = 0;
  PHASE_STARTS.forEach((start, index) => { if (videoProgress >= start) phase = index; });

  return (
    <section ref={sectionRef} className="gm-method-story" aria-labelledby="metodo-title" data-video-ready={videoReady} style={{ height: `${TRAVEL + 100}svh` }}>
      {STOPS.map((stop) => <span key={stop} id={stop === 0.905 ? 'metodo' : undefined} className="gm-story-anchor" data-scroll-stop style={{ top: `${unitsAt(stop)}svh` }} />)}
      <div ref={stageRef} className="gm-stage">
        <div className="gm-neural-atmosphere" aria-hidden="true" style={{ opacity: 1 - smoothStep((s - 0.84) / 0.05), backgroundPosition: `${50 - settle * 22}% 50%` }} />
        <div className="gm-construction-video" aria-hidden="true" style={{ opacity: videoReady ? videoEnter : 0, '--video-settle': settle } as React.CSSProperties}>
          {near && <ConstructionVideo progress={videoProgress} onReady={setVideoReady} />}
        </div>
        <div className="gm-house" style={{ opacity: houseEnter, '--house-enter': houseEnter } as React.CSSProperties}>
          <div className="gm-house-intro">
            <SectionLabel>Il metodo</SectionLabel>
            <h2 className="gm-house-title" id="metodo-title">Come creiamo il vostro sito web</h2>
            <p className="gm-house-lead">Come una casa: prima le fondamenta, poi la struttura, la forma e i dettagli.</p>
          </div>
          <div className="gm-phases">
            <div className="gm-phases-track" aria-hidden="true"><i style={{ transform: `scaleY(${videoProgress})` }} /></div>
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
            {/* Phones: the titles stay listed, the lit phase's words below them. */}
            <p key={phase} className="gm-phase-caption" aria-hidden="true">{housePhases[phase].text}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
