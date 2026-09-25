'use client';

import { useEffect, useRef } from 'react';
import AstraField, { type ParticleFrame } from './astra-field';
import { STORY_UNITS, storyAt } from './story-timeline';

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const METHOD_KEYS: [number, number][] = [[0, 0.815], [70, 0.865], [250, 1]];

function interpolate(keys: [number, number][], units: number) {
  for (let i = 1; i < keys.length; i++) {
    const [nextUnit, nextValue] = keys[i];
    const [unit, value] = keys[i - 1];
    if (units <= nextUnit) return value + (nextValue - value) * clamp01((units - unit) / (nextUnit - unit));
  }
  return keys[keys.length - 1][1];
}

/** One particle system survives the entire thought → work → villa journey. */
export default function ParticleJourney() {
  const host = useRef<HTMLDivElement>(null);
  const frameState = useRef<ParticleFrame>({ progress: 0, videoReady: false, active: true });

  useEffect(() => {
    const story = document.querySelector<HTMLElement>('.gm-story');
    const projects = document.querySelector<HTMLElement>('.gm-projects');
    const method = document.querySelector<HTMLElement>('.gm-method-story');
    let previousOpacity = -1;
    const update = () => {
      if (!story || !projects || !method) return;
      const storyTop = story.getBoundingClientRect().top;
      const projectsTop = projects.getBoundingClientRect().top;
      const methodTop = method.getBoundingClientRect().top;
      if (methodTop < 0) {
        const stageHeight = method.querySelector<HTMLElement>('.gm-stage')?.offsetHeight ?? innerHeight;
        const travel = Math.max(1, method.offsetHeight - stageHeight);
        frameState.current.progress = interpolate(METHOD_KEYS, clamp01(-methodTop / travel) * 250);
      } else if (methodTop < innerHeight) {
        // The same scattered stars begin to assemble as the method first
        // enters the viewport, while the last project is still on screen.
        frameState.current.progress = 0.775 + 0.04 * clamp01((innerHeight - methodTop) / innerHeight);
      } else if (storyTop < 0) {
        frameState.current.progress = storyAt(clamp01(-storyTop / story.offsetHeight) * STORY_UNITS);
      } else {
        frameState.current.progress = 0;
      }
      // Let the field leave with the villa. Reverse scrolling brings back the
      // very same stars at their previous positions.
      const behindWork = clamp01((innerHeight - projectsTop) / innerHeight)
        * (1 - clamp01((innerHeight - methodTop) / innerHeight));
      const exit = clamp01(method.getBoundingClientRect().bottom / Math.max(1, innerHeight));
      const opacity = (1 - behindWork * 0.68) * exit;
      if (host.current && opacity !== previousOpacity) host.current.style.opacity = String(opacity);
      previousOpacity = opacity;
      frameState.current.active = opacity > 0.001;
      frameState.current.videoReady = method.dataset.videoReady === 'true';
    };
    // Publish before the renderer's next frame, without a React commit/effect
    // and a second animation-frame callback in the scroll path.
    const onScroll = update;
    const observer = new MutationObserver(onScroll);
    if (method) observer.observe(method, { attributes: true, attributeFilter: ['data-video-ready'] });
    update();
    const timer = window.setTimeout(update, 300);
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    addEventListener('hashchange', onScroll);
    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      removeEventListener('hashchange', onScroll);
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return <div ref={host} className="gm-particle-journey"><AstraField frameState={frameState} /></div>;
}
