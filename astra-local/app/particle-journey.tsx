'use client';

import { useEffect, useRef } from 'react';
import AstraField, { type ParticleFrame } from './astra-field';
import { nebulaJourney } from './nebula-field';
import { METHOD_ENTRY, METHOD_TRAVEL, VILLA_DRAWN_HERO, VILLA_START_HERO, methodStoryAt } from './method-timeline';

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoothStep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
// Loose stars, ready to draw the villa (see method-timeline.ts).
const METHOD_START = 0.775;
// With reduced motion the idea scene holds its whole, still brain.
const BRIDGE_STILL = 0.5;

/**
 * One particle system for the page's two scenes: the hero's GM opens and draws
 * the method's villa; later, before the form, a brain of stars gathers, turns
 * and melts away (the idea scene, bridge.tsx). Between them only the sky remains.
 */
export default function ParticleJourney() {
  const host = useRef<HTMLDivElement>(null);
  const frameState = useRef<ParticleFrame>({
    progress: METHOD_START,
    hero: 0,
    bridge: 0,
    bridgeMode: false,
    videoReady: false,
    active: true,
  });

  useEffect(() => {
    const hero = document.querySelector<HTMLElement>('.gm-hero');
    const method = document.querySelector<HTMLElement>('.gm-method-story');
    const bridge = document.querySelector<HTMLElement>('.gm-bridge');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    nebulaJourney.enabled = true;
    let previousOpacity = -1;
    let previousBridge = -1;

    const update = () => {
      if (!hero || !method || !bridge) return;
      const state = frameState.current;
      const vh = innerHeight;
      const still = reduced.matches;
      state.videoReady = method.dataset.videoReady === 'true';

      const bridgeBox = bridge.getBoundingClientRect();
      const methodBox = method.getBoundingClientRect();
      let opacity: number;
      if (bridgeBox.top >= vh) {
        state.bridgeMode = false;
        state.bridge = 0;
        state.hero = clamp01(-hero.getBoundingClientRect().top / Math.max(1, hero.offsetHeight));
        if (methodBox.top < 0) {
          const stageHeight = method.querySelector<HTMLElement>('.gm-stage')?.offsetHeight ?? vh;
          const travel = Math.max(1, method.offsetHeight - stageHeight);
          state.progress = methodStoryAt(clamp01(-methodBox.top / travel) * METHOD_TRAVEL);
        } else {
          // At 75% of the GM's dispersion its stars start the villa drawing,
          // complete before the method section begins.
          state.progress = METHOD_START + (METHOD_ENTRY - METHOD_START)
            * clamp01((state.hero - VILLA_START_HERO) / (VILLA_DRAWN_HERO - VILLA_START_HERO));
        }
        // The field leaves with the villa: the projects and services keep only the sky.
        opacity = clamp01(methodBox.bottom / vh);
      } else {
        state.bridgeMode = true;
        state.hero = 1;
        state.progress = METHOD_START;
        // No empty scroll: the brain gathers while the section comes in, turns
        // while it is pinned, and melts while the form arrives.
        const travel = Math.max(1, bridge.offsetHeight - vh);
        const entering = clamp01((vh - bridgeBox.top) / vh);
        const pinned = clamp01(-bridgeBox.top / travel);
        const leaving = clamp01((vh - bridgeBox.bottom) / vh);
        state.bridge = still ? BRIDGE_STILL : bridgeBox.top > 0 ? 0.3 * entering : pinned < 1 ? 0.3 + 0.5 * pinned : 0.8 + 0.2 * leaving;
        // In with its section; out as the form arrives.
        opacity = smoothStep((vh - bridgeBox.top) / vh) * clamp01(bridgeBox.bottom / vh);
      }

      if (state.bridge !== previousBridge) bridge.style.setProperty('--bridge', state.bridge.toFixed(4));
      previousBridge = state.bridge;
      if (host.current && opacity !== previousOpacity) host.current.style.opacity = String(opacity);
      previousOpacity = opacity;
      state.active = opacity > 0.001;
      // One reversible journey for the background's own stars. GM opens first;
      // they gather below the villa, then fill every intervening section before
      // gathering below the brain. Its exit releases them through the footer.
      const heroDispersion = smoothStep((state.hero - 0.04) / 0.27)
        * (1 - smoothStep((state.hero - 0.36) / (VILLA_DRAWN_HERO - 0.36)));
      const villaExit = smoothStep((vh * 1.15 - methodBox.bottom) / (vh * 0.8));
      const brainEntry = 1 - smoothStep(state.bridge / 0.3);
      const brainExit = smoothStep((state.bridge - 0.8) / 0.2);
      nebulaJourney.dispersion = still ? 0 : state.bridgeMode
        ? Math.max(brainEntry, brainExit)
        : Math.max(heroDispersion, villaExit);
      nebulaJourney.scroll = scrollY / Math.max(1, vh);
    };

    // Publish before the renderer's next frame, without a React commit/effect
    // and a second animation-frame callback in the scroll path.
    const observer = new MutationObserver(update);
    if (method) observer.observe(method, { attributes: true, attributeFilter: ['data-video-ready'] });
    update();
    const timer = window.setTimeout(update, 300);
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    addEventListener('hashchange', update);
    reduced.addEventListener('change', update);
    return () => {
      removeEventListener('scroll', update);
      removeEventListener('resize', update);
      removeEventListener('hashchange', update);
      reduced.removeEventListener('change', update);
      observer.disconnect();
      clearTimeout(timer);
      nebulaJourney.enabled = false;
      nebulaJourney.dispersion = 0;
      nebulaJourney.scroll = 0;
    };
  }, []);

  return <div ref={host} className="gm-particle-journey"><AstraField frameState={frameState} /></div>;
}
