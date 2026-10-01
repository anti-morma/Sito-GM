'use client';

import { useEffect, useState } from 'react';
import { reducedMotion } from './motion';

/**
 * "Ferma le animazioni": stars, logo, rocket and previews stand still, as with
 * the system's reduced-motion setting (motion.ts). Hidden when the system
 * already asks for it: there is nothing left to stop.
 */
export default function MotionToggle({ className }: { className?: string }) {
  const [state, setState] = useState<'moving' | 'still' | 'system'>('moving');

  useEffect(() => {
    const motion = reducedMotion();
    const system = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setState(system.matches ? 'system' : motion.chosen() ? 'still' : 'moving');
    sync();
    motion.addEventListener('change', sync);
    return () => motion.removeEventListener('change', sync);
  }, []);

  if (state === 'system') return null;
  return (
    <button
      type="button"
      className={className ? `gm-motion-toggle ${className}` : 'gm-motion-toggle'}
      onClick={() => reducedMotion().set(state !== 'still')}
    >
      <span className="gm-motion-toggle-icon" aria-hidden="true" data-state={state} />
      {state === 'still' ? 'Riattiva le animazioni' : 'Ferma le animazioni'}
    </button>
  );
}
