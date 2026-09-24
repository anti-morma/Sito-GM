'use client';

import { useEffect, useState } from 'react';
import AstraField from './astra-field';

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const STORY_KEYS: [number, number][] = [[0, 0], [34, 0.12], [88, 0.36], [92, 0.47], [320, 0.745], [420, 0.775]];
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
  const [progress, setProgress] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const story = document.querySelector<HTMLElement>('.gm-story');
      const projects = document.querySelector<HTMLElement>('.gm-projects');
      const method = document.querySelector<HTMLElement>('.gm-method-story');
      if (!story || !projects || !method) return;
      const storyTop = story.getBoundingClientRect().top;
      const projectsTop = projects.getBoundingClientRect().top;
      const methodTop = method.getBoundingClientRect().top;
      if (methodTop < 0) {
        const stageHeight = method.querySelector<HTMLElement>('.gm-stage')?.offsetHeight ?? innerHeight;
        const travel = Math.max(1, method.offsetHeight - stageHeight);
        setProgress(interpolate(METHOD_KEYS, clamp01(-methodTop / travel) * 250));
      } else if (methodTop < innerHeight) {
        // The same scattered stars begin to assemble as the method first
        // enters the viewport, while the last project is still on screen.
        setProgress(0.775 + 0.04 * clamp01((innerHeight - methodTop) / innerHeight));
      } else if (storyTop < 0) {
        setProgress(interpolate(STORY_KEYS, clamp01(-storyTop / story.offsetHeight) * 420));
      } else {
        setProgress(0);
      }
      // Let the field leave with the villa. Reverse scrolling brings back the
      // very same stars at their previous positions.
      const behindWork = clamp01((innerHeight - projectsTop) / innerHeight)
        * (1 - clamp01((innerHeight - methodTop) / innerHeight));
      const exit = clamp01(method.getBoundingClientRect().bottom / Math.max(1, innerHeight));
      setOpacity((1 - behindWork * 0.68) * exit);
      setVideoReady(method.dataset.videoReady === 'true');
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    const method = document.querySelector<HTMLElement>('.gm-method-story');
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
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div className="gm-particle-journey" style={{ opacity }}><AstraField scrollProgress={progress} videoReady={videoReady} active={opacity > 0.001} /></div>;
}
