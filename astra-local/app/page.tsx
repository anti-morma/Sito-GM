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
      setScrollProgress(Math.min(1, Math.max(0, window.scrollY / max)));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (frame) cancelAnimationFrame(frame); };
  }, []);

  const gmExit = smoothStep(scrollProgress / 0.20);
  const product = windowProgress(scrollProgress, 0.10, 0.14, 0.27, 0.32);
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

          <div className="gm-intro" aria-hidden={gmExit > 0.99} style={{ opacity: 1 - gmExit, transform: `translateY(${-scrollProgress * 600}svh)` }}>
            <span className="gm-status">DESIGN DIGITALE PER L’OSPITALITÀ</span>
          </div>
          <div className="gm-hero-side" aria-hidden={gmExit > 0.99} style={{ opacity: 1 - gmExit }}>
            <span className="gm-edition">INDIPENDENT STUDIO · ITALIA</span>
          </div>

          <div className="gm-product-shade" aria-hidden="true" style={{ opacity: product.opacity }} />
          <div className="gm-product-copy" aria-hidden={product.opacity < 0.01} style={{ opacity: product.opacity, transform: `translateY(calc(-50% + ${(1 - product.enter) * 86 - product.exit * 86}px))` }}>
            <span className="gm-status">DESIGN DIGITALE PER L’OSPITALITÀ</span>
            <h1>Siti web su misura.<br /><em>Per la tua ospitalità.</em></h1>
            <p>Per case vacanza, boutique hotel e property manager.</p>
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
