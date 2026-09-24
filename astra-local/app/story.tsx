'use client';

import { useEffect, useRef, useState } from 'react';
import AstraField from './astra-field';
import ConstructionVideo from './construction-video';
import { brainMessages, housePhases } from './content';

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoothStep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

// Scroll distance (in svh of sticky travel) at which each chapter is reached.
// Story progress 0..1 drives the particle scene; the house video owns the
// longest stretch so each phase of the method can be read while it builds.
const KEYS: [number, number][] = [
  [0, 0], // GM hero
  [60, 0.10], // the monogram disperses into stars
  [84, 0.28], // the empty sky is crossed quickly
  [464, 0.865], // brain, neural network, blueprint and crossfade to video
  [684, 1], // the house is built
  [714, 1], // a short hold on the finished house
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

// Micro-messages hand over to each other at these points of the story:
// formed brain, entering it, first impulse, the four synapses, whole network.
const MESSAGE_BOUNDS = [0.345, 0.475, 0.575, 0.655, 0.72, 0.775];
const MESSAGE_FADE = 0.014;

// Video progress at which each phase of the method takes over, matched to the
// footage: plan, rising volumes, white model, rendering, finished villa.
const PHASE_STARTS = [0, 0.27, 0.5, 0.72, 0.88];

// Keep in sync with videoSettle in the shader: the drawing and the video move as one.
const SETTLE_START = 0.862;
const SETTLE_LENGTH = 0.026;

export default function Story() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
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

  const s = scrollProgress;
  const gmExit = smoothStep(s / 0.20);
  const cue = 1 - smoothStep(s / 0.012);
  const videoEnter = smoothStep((s - 0.84) / 0.025);
  const settle = smoothStep((s - SETTLE_START) / SETTLE_LENGTH);
  // The method appears only once the video has made room for it.
  const houseEnter = smoothStep((s - 0.883) / 0.024);
  const videoProgress = clamp01((s - 0.865) / 0.135);
  let phase = 0;
  PHASE_STARTS.forEach((start, index) => { if (videoProgress >= start) phase = index; });

  return (
    <section ref={sectionRef} className="gm-story" id="inizio" aria-label="Dall'idea alla costruzione" style={{ height: `${STORY_UNITS + 100}svh` }}>
      {/* Anchors for the navigation and the progress indicator. */}
      <span className="gm-story-anchor" data-progress-step="1" style={{ top: 0 }} />
      <span className="gm-story-anchor" data-progress-step="2" style={{ top: `${unitsAt(0.775) + 35}svh` }} />
      <span className="gm-story-anchor" id="metodo" style={{ top: `${unitsAt(0.9)}svh` }} />

      <div ref={stageRef} className="gm-stage">
        <AstraField scrollProgress={s} videoReady={videoReady} />
        <div className="gm-neural-atmosphere" aria-hidden="true" style={{ opacity: smoothStep((s - 0.48) / 0.10), backgroundPosition: `${50 - settle * 22}% 50%` }} />

        {/* 01 — Hero */}
        <div className="gm-hero-copy" aria-hidden={gmExit > 0.99} style={{ opacity: 1 - gmExit, '--hero-lift': `${-s * 600}svh` } as React.CSSProperties}>
          <p className="gm-hero-eyebrow">Creazione siti web su misura</p>
          <h1>
            <span className="gm-hero-title">Non creiamo solo siti web.</span>
            <span className="gm-hero-subtitle">Diamo forma a ciò che ti distingue.</span>
          </h1>
          <p className="gm-hero-description">Siti web su misura che valorizzano la tua identità e trasformano la tua presenza online in un’opportunità concreta.</p>
          <p className="gm-hero-services">Web design · Sviluppo · 3D · AI</p>
        </div>
        <div className="gm-hero-side" aria-hidden={gmExit > 0.99} style={{ opacity: 1 - gmExit }}>
          <span className="gm-edition">Independent studio · Italia</span>
        </div>
        <div className="gm-scroll-cue" aria-hidden="true" style={{ opacity: cue, visibility: cue < 0.01 ? 'hidden' : undefined }}>
          <span>Scorri per esplorare</span>
          <i />
        </div>

        {/* 02 — Brain: one short line at a time, below the brain. */}
        <p className="gm-sr-only">Un’idea prende forma, trova una direzione, diventa esperienza e prende vita.</p>
        <div className="gm-brain-messages" aria-hidden="true">
          {brainMessages.map((message, index) => {
            const enter = smoothStep((s - MESSAGE_BOUNDS[index] + MESSAGE_FADE) / (MESSAGE_FADE * 2));
            const exit = smoothStep((s - MESSAGE_BOUNDS[index + 1] + MESSAGE_FADE) / (MESSAGE_FADE * 2));
            const opacity = enter * (1 - exit);
            return (
              <p key={message} className="gm-brain-message" style={{ opacity, visibility: opacity < 0.01 ? 'hidden' : undefined, transform: `translate(-50%, ${(1 - enter) * 14 - exit * 14}px)` }}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                {message}
              </p>
            );
          })}
        </div>

        {/* 03 — House: the construction video explains the method. */}
        <div className="gm-construction-video" aria-hidden={!videoReady || videoEnter < 0.01} style={{ opacity: videoReady ? videoEnter : 0, '--video-settle': settle } as React.CSSProperties}>
          {s > 0.65 && <ConstructionVideo progress={videoProgress} onReady={setVideoReady} />}
        </div>

        <div className="gm-house" style={{ opacity: houseEnter, '--house-enter': houseEnter } as React.CSSProperties}>
          <div className="gm-house-intro">
            <h2 className="gm-display">Una presenza digitale si costruisce.</h2>
            <p>Non basta che sia bella. Deve avere fondamenta solide, una struttura chiara e ogni dettaglio al posto giusto.</p>
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
