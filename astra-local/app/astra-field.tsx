'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { afterOpening } from './idle';

export type ParticleFrame = {
  /** The method's timeline, from loose stars through the villa to the video. */
  progress: number;
  /** Share of the hero scrolled away (0 → 1): the GM rises and opens. */
  hero: number;
  /** The idea scene before the form (0 → 1), drawn while bridgeMode is on. */
  bridge: number;
  bridgeMode: boolean;
  /** False when the page has no method section: the GM's stars draw no villa. */
  villa: boolean;
  videoReady: boolean;
  active: boolean;
};

/**
 * The page's particle scenes: the GM, the villa's drawing, the brain. The
 * scene and its 3D library (astra-scene.ts) load after the page, and after
 * the phone opening: the words, their links and the opening never wait.
 */
export default function AstraField({ frameState, onFailed }: { frameState: RefObject<ParticleFrame>; onFailed?: () => void }) {
  const onFailedRef = useRef(onFailed);
  onFailedRef.current = onFailed;
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    const failed = () => {
      host.dataset.failed = 'true';
      onFailedRef.current?.();
    };
    const cancelIdle = afterOpening(() => {
      import('./astra-scene').then(({ mountAstraField }) => {
        if (cancelled) return;
        cleanup = mountAstraField(host, frameState, failed);
        if (cleanup) host.dataset.failed = 'false';
      }, () => { if (!cancelled) failed(); });
    });
    return () => {
      cancelled = true;
      cancelIdle();
      cleanup?.();
    };
  }, [frameState]);

  return (
    <div ref={hostRef} className="starfield" aria-hidden="true">
      <div className="starfield-gesture" />
      <span className="webgl-error">WebGL non disponibile.</span>
    </div>
  );
}
