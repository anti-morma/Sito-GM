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

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const section = sectionRef.current;
      const stage = stageRef.current;
      if (!section || !stage) return;
      const travel = Math.max(1, section.offsetHeight - stage.offsetHeight);
      const fraction = clamp01(-section.getBoundingClientRect().top / travel);
      setScrollProgress(storyAt(fraction * TRAVEL));
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
  const houseEnter = smoothStep((s - 0.883) / 0.024);
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
            <h2 className="gm-house-title" id="metodo-title">Una presenza digitale si costruisce.</h2>
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
          </div>
        </div>
      </div>
    </section>
  );
}
