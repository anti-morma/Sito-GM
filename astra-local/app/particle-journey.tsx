'use client';

import { useEffect, useRef } from 'react';
import AstraField, { type ParticleFrame } from './astra-field';
import { nebulaJourney } from './nebula-state';
import { reducedMotion } from './motion';

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoothStep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

/** The logo leaves with the hero; the brain returns before the contact form. */
export default function ParticleJourney() {
  const host = useRef<HTMLDivElement>(null);
  const frameState = useRef<ParticleFrame>({ hero: 0, bridge: 0, bridgeMode: false, active: true });

  useEffect(() => {
    const hero = document.querySelector<HTMLElement>('.gm-hero');
    const bridge = document.querySelector<HTMLElement>('.gm-bridge');
    if (!hero || !bridge) return;
    const reduced = reducedMotion();
    nebulaJourney.enabled = true;
    let previousOpacity = -1;
    let previousBridge = -1;
    // On computers the scene is pulled up toward the section before it
    // (globals.css, one spacing rhythm): the brain still waits for that
    // section to scroll away, then gathers in the remaining distance.
    let lead = 0;
    const measure = () => {
      lead = Math.min(innerHeight * 0.6, Math.max(0, -parseFloat(getComputedStyle(bridge).marginTop) || 0));
    };

    const update = () => {
      const state = frameState.current;
      const vh = innerHeight;
      const bridgeBox = bridge.getBoundingClientRect();
      const heroBox = hero.getBoundingClientRect();
      let opacity: number;
      const start = vh - lead;
      state.bridgeMode = bridgeBox.top < start;
      if (!state.bridgeMode) {
        state.bridge = 0;
        state.hero = clamp01(-heroBox.top / Math.max(1, hero.offsetHeight));
        opacity = clamp01(heroBox.bottom / vh);
      } else {
        state.hero = 1;
        const travel = Math.max(1, bridge.offsetHeight - vh);
        const entering = clamp01((start - bridgeBox.top) / start);
        const pinned = clamp01(-bridgeBox.top / travel);
        const leaving = clamp01((vh - bridgeBox.bottom) / vh);
        state.bridge = reduced.matches ? 0.5 : bridgeBox.top > 0 ? 0.3 * entering
          : pinned < 1 ? 0.3 + 0.5 * pinned : 0.8 + 0.2 * leaving;
        opacity = smoothStep(entering) * clamp01(bridgeBox.bottom / vh);
      }
      if (state.bridge !== previousBridge) bridge.style.setProperty('--bridge', state.bridge.toFixed(4));
      previousBridge = state.bridge;
      if (host.current && opacity !== previousOpacity) host.current.style.opacity = String(opacity);
      previousOpacity = opacity;
      state.active = opacity > 0.001;
      nebulaJourney.dispersion = reduced.matches ? 0 : state.bridgeMode
        ? Math.max(1 - smoothStep(state.bridge / 0.3), smoothStep((state.bridge - 0.8) / 0.2))
        : smoothStep((state.hero - 0.04) / 0.27);
      nebulaJourney.scroll = scrollY / Math.max(1, vh);
    };

    const onResize = () => { measure(); update(); };
    measure();
    update();
    const timer = window.setTimeout(onResize, 300);
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', onResize);
    addEventListener('hashchange', update);
    reduced.addEventListener('change', update);
    return () => {
      removeEventListener('scroll', update);
      removeEventListener('resize', onResize);
      removeEventListener('hashchange', update);
      reduced.removeEventListener('change', update);
      clearTimeout(timer);
      nebulaJourney.enabled = false;
      nebulaJourney.dispersion = 0;
      nebulaJourney.scroll = 0;
    };
  }, []);

  return <div ref={host} className="gm-particle-journey"><AstraField frameState={frameState} /></div>;
}
