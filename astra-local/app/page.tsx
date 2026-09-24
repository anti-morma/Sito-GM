'use client';

import { useEffect, useState } from 'react';
import AstraField from './astra-field';
import ConstructionVideo from './construction-video';

const smoothStep = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

const windowProgress = (progress: number, enterStart: number, enterEnd: number, exitStart: number, exitEnd: number) => {
  const enter = smoothStep((progress - enterStart) / (enterEnd - enterStart));
  const exit = smoothStep((progress - exitStart) / (exitEnd - exitStart));
  return { enter, exit, opacity: enter * (1 - exit) };
};

// The empty stretch between the GM hero and the brain (0.10–0.28 of the
// story) is crossed quickly; the rest keeps its original one-to-one pace.
const GAP_START = 0.10;
const GAP_END = 0.28;
const GAP_SCROLL = 0.04;
const STORY_SCALE = 1 - (GAP_END - GAP_START - GAP_SCROLL);
const storyProgress = (scroll: number) => {
  const t = scroll * STORY_SCALE;
  if (t < GAP_START) return t;
  if (t < GAP_START + GAP_SCROLL) return GAP_START + ((t - GAP_START) / GAP_SCROLL) * (GAP_END - GAP_START);
  return t + (GAP_END - GAP_START - GAP_SCROLL);
};

const slide = (enter: number, exit: number, distance = 72) =>
  `translateY(${(1 - enter) * distance - exit * distance}px)`;

export default function Home() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setScrollProgress(storyProgress(Math.min(1, Math.max(0, window.scrollY / max))));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (frame) cancelAnimationFrame(frame); };
  }, []);

  const gmExit = smoothStep(scrollProgress / 0.20);
  const idea = windowProgress(scrollProgress, 0.34, 0.42, 0.47, 0.53);
  const firstCue = windowProgress(scrollProgress, 0.58, 0.61, 0.65, 0.68);
  const secondCue = windowProgress(scrollProgress, 0.69, 0.71, 0.74, 0.76);
  const blueprintCue = windowProgress(scrollProgress, 0.76, 0.79, 0.83, 0.86);
  const finalEnter = smoothStep((scrollProgress - 0.91) / 0.07);
  const videoEnter = smoothStep((scrollProgress - 0.84) / 0.025);
  const videoSettle = smoothStep((scrollProgress - 0.87) / 0.07);
  const videoProgress = Math.max(0, Math.min(1, (scrollProgress - 0.865) / 0.135));

  return (
    <main className="gm-site">
      <section className="gm-story" aria-label="Dalle idee al sito su misura">
        <div className="gm-stage">
          <AstraField scrollProgress={scrollProgress} videoReady={videoReady} />
          <div className="gm-neural-atmosphere" aria-hidden="true" style={{ opacity: smoothStep((scrollProgress - 0.48) / 0.10), backgroundPosition: `${50 - finalEnter * 22}% 50%` }} />

          <div className="gm-hero-copy" aria-hidden={gmExit > 0.99} style={{ opacity: 1 - gmExit, '--hero-lift': `${-scrollProgress * 600}svh` } as React.CSSProperties}>
            <p className="gm-hero-eyebrow">Design digitale su misura</p>
            <h1>
              <span className="gm-hero-title">Non creiamo solo siti web.</span>
              <span className="gm-hero-subtitle">Diamo forma a ciò che ti distingue.</span>
            </h1>
            <p className="gm-hero-description">Siti web su misura per valorizzare la tua identità, raccontare ciò che fai e trasformare la tua presenza online in un’opportunità concreta.</p>
            <p className="gm-hero-services">Web design · Sviluppo · 3D · AI</p>
          </div>
          <div className="gm-hero-side" aria-hidden={gmExit > 0.99} style={{ opacity: 1 - gmExit }}>
            <span className="gm-edition">INDIPENDENT STUDIO · ITALIA</span>
          </div>

          <div className="gm-construction-video" aria-hidden={!videoReady || videoEnter < 0.01} style={{ opacity: videoReady ? videoEnter : 0, '--video-settle': videoSettle } as React.CSSProperties}>
            {scrollProgress > 0.65 && <ConstructionVideo progress={videoProgress} onReady={setVideoReady} />}
          </div>

          <div className="gm-idea-copy" aria-hidden={idea.opacity < 0.01} style={{ opacity: idea.opacity, transform: `translateY(calc(-50% + ${(1 - idea.enter) * 72 - idea.exit * 72}px))` }}>
            <h2>Partiamo dalle tue idee.</h2>
          </div>

          <div className="gm-synapse-copy" aria-hidden={firstCue.opacity < 0.01} style={{ opacity: firstCue.opacity, transform: slide(firstCue.enter, firstCue.exit, 48) }}>
            <p>Le tue idee prendono vita.</p>
          </div>
          <div className="gm-synapse-copy" aria-hidden={secondCue.opacity < 0.01} style={{ opacity: secondCue.opacity, transform: slide(secondCue.enter, secondCue.exit, 48) }}>
            <p>Diamo loro una direzione.</p>
          </div>
          <div className="gm-synapse-copy" aria-hidden={blueprintCue.opacity < 0.01} style={{ opacity: blueprintCue.opacity, transform: slide(blueprintCue.enter, blueprintCue.exit, 48) }}>
            <p>Partiamo dalle basi.</p>
          </div>

          <div className="gm-final-copy" aria-hidden={finalEnter < 0.01} style={{ opacity: finalEnter, transform: `translateY(${(1 - finalEnter) * 72}px)` }}>
            <h2>Diamo struttura alle tue idee.</h2>
            <p>E le trasformiamo in un sito su misura.</p>
          </div>


        </div>
      </section>
    </main>
  );
}
