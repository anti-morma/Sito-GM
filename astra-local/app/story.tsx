'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AstraField from './astra-field';
import ConstructionVideo from './construction-video';
import { brainMessages, housePhases } from './content';

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoothStep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

// Scroll distance (in svh of sticky travel) at which each chapter is reached.
// Story progress 0..1 drives the particle scene. Kept deliberately short:
// the story should pull the visitor forward, never make them wait.
const KEYS: [number, number][] = [
  [0, 0], // GM hero
  [45, 0.10], // the monogram disperses into stars
  [62, 0.28], // the empty sky is crossed quickly
  [372, 0.865], // brain, neural network, blueprint and crossfade to video
  [552, 1], // the house is built
  [566, 1], // a breath on the finished house
];
const STORY_UNITS = KEYS[KEYS.length - 1][0];

const storyAt = (units: number) => {
  for (let i = 1; i < KEYS.length; i++) {
    const [u1, s1] = KEYS[i];
    const [u0, s0] = KEYS[i - 1];
    if (units <= u1) return s0 + ((units - u0) / (u1 - u0 || 1)) * (s1 - s0);
  }
  return 1;
};
const unitsAt = (story: number) => {
  for (let i = 1; i < KEYS.length; i++) {
    const [u1, s1] = KEYS[i];
    const [u0, s0] = KEYS[i - 1];
    if (story <= s1 && s1 > s0) return u0 + ((story - s0) / (s1 - s0)) * (u1 - u0);
  }
  return STORY_UNITS;
};

// Chapters hand over at these points: formed brain, entering it, first
// impulse, the four synapses, whole network.
const CHAPTER_BOUNDS = [0.345, 0.475, 0.575, 0.655, 0.72, 0.775];
const CHAPTER_FADE = 0.014;

// Video progress at which each phase of the method takes over, matched to the
// footage: plan, rising volumes, white model, rendering, finished villa.
const PHASE_STARTS = [0, 0.27, 0.5, 0.72, 0.88];

// Keep in sync with videoSettle in the shader: the drawing and the video move as one.
const SETTLE_START = 0.862;
const SETTLE_LENGTH = 0.026;

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Story() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const onWebglFailed = useCallback(() => setWebglFailed(true), []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const section = sectionRef.current;
      const stage = stageRef.current;
      if (!section || !stage) return;
      const travel = Math.max(1, section.offsetHeight - stage.offsetHeight);
      const fraction = clamp01(-section.getBoundingClientRect().top / travel);
      setScrollProgress(storyAt(fraction * STORY_UNITS));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // The scroll cue is a real control: it takes the visitor to the first chapter.
  const explore = () => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    const travel = section.offsetHeight - stage.offsetHeight;
    const top = section.offsetTop + (unitsAt(0.4) / STORY_UNITS) * travel;
    window.scrollTo({ top, behavior: reducedMotion() ? 'auto' : 'smooth' });
  };

  const s = scrollProgress;
  const gmExit = smoothStep(s / 0.16);
  const cue = 1 - smoothStep((s - 0.02) / 0.08);
  const videoEnter = smoothStep((s - 0.84) / 0.025);
  const settle = smoothStep((s - SETTLE_START) / SETTLE_LENGTH);
  // The method appears only once the video has made room for it.
  const houseEnter = smoothStep((s - 0.883) / 0.024);
  const videoProgress = clamp01((s - 0.865) / 0.135);
  let phase = 0;
  PHASE_STARTS.forEach((start, index) => { if (videoProgress >= start) phase = index; });
  let chapter = -1;
  CHAPTER_BOUNDS.slice(0, -1).forEach((bound, index) => { if (s >= bound) chapter = index; });
  const chaptersOn = smoothStep((s - 0.33) / 0.02) * (1 - smoothStep((s - 0.765) / 0.02));
  // Without WebGL or a playable video, the poster still shows the construction.
  const showVideo = videoReady || webglFailed;

  return (
    <section ref={sectionRef} className="gm-story" id="inizio" aria-label="Dall'idea al sito online" style={{ height: `${STORY_UNITS + 100}svh` }}>
      <span className="gm-story-anchor" id="metodo" style={{ top: `${unitsAt(0.9)}svh` }} />

      <div ref={stageRef} className="gm-stage">
        <AstraField scrollProgress={s} videoReady={videoReady} onFailed={onWebglFailed} />
        <div className="gm-neural-atmosphere" aria-hidden="true" style={{ opacity: smoothStep((s - 0.48) / 0.10), backgroundPosition: `${50 - settle * 22}% 50%` }} />

        {/* 01 — Hero: the headline leads, one clear action, one clear gesture. */}
        <div className="gm-hero-copy" inert={gmExit > 0.6} style={{ opacity: 1 - gmExit, '--hero-lift': `${-s * 420}svh` } as React.CSSProperties}>
          <p className="gm-hero-eyebrow">Studio digitale · Siti web su misura</p>
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

        <button type="button" className="gm-scroll-cue" onClick={explore} style={{ opacity: cue, visibility: cue < 0.02 ? 'hidden' : undefined }} aria-label="Scorri per esplorare: vai al primo capitolo">
          <span className="gm-scroll-cue-ring" aria-hidden="true"><i /></span>
          <span className="gm-scroll-cue-label">Scorri per esplorare</span>
        </button>

        {/* 02 — Brain: five chapters, one at a time. */}
        <p className="gm-sr-only">Un’idea prende forma, trova una direzione, diventa esperienza e prende vita.</p>
        <div className="gm-chapters" aria-hidden="true" style={{ opacity: chaptersOn, visibility: chaptersOn < 0.01 ? 'hidden' : undefined }}>
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
            <span className="gm-chapter-hint">Continua a scorrere <b>↓</b></span>
          </div>
        </div>

        {/* 03 — Method: the construction video explains how we work. */}
        <div className="gm-construction-video" aria-hidden="true" style={{ opacity: showVideo ? videoEnter : 0, '--video-settle': settle } as React.CSSProperties}>
          {s > 0.6 && <ConstructionVideo progress={videoProgress} onReady={setVideoReady} />}
        </div>

        <div className="gm-house" style={{ opacity: houseEnter, '--house-enter': houseEnter } as React.CSSProperties}>
          <div className="gm-house-intro">
            <p className="gm-label">Il metodo</p>
            <h2 className="gm-house-title">Una presenza digitale si costruisce.</h2>
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
