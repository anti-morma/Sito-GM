'use client';

import { useEffect, useRef } from 'react';
import { whenIdle } from './idle';

/**
 * One sky for the whole site, from the GM to the footer and on every page:
 * a fixed WebGL starfield under all content. Its stars rise continuously as
 * the page scrolls, so a star low on the screen really climbs to the top.
 * The scene and its 3D library (star-sky-scene.ts) load after the page: the
 * words never wait for the stars.
 */
export default function StarSky() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    const scene = import('./star-sky-scene');
    const cancelIdle = whenIdle(() => {
      scene.then(({ mountStarSky }) => { if (!cancelled) cleanup = mountStarSky(host); }).catch(() => {});
    });
    return () => {
      cancelled = true;
      cancelIdle();
      cleanup?.();
    };
  }, []);

  return <div ref={hostRef} className="gm-star-sky" aria-hidden="true" />;
}
