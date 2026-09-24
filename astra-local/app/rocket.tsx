import { useId } from 'react';

/**
 * GoMore's rocket, drawn in SVG (side view, nose to the right, origin at the
 * middle of the body): red nose cone and curved fins, blue-grey body with a
 * porthole, an orange band and a nozzle. The engine never stops: layered
 * flames flicker at full thrust and stretch further with speed (--motion).
 */
export default function Rocket() {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const u = (name: string) => `url(#${id}-${name})`;
  return (
    <svg className="gm-rocket" width="45" height="20" viewBox="-28 -10 45 20" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-body`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e3ebf5" />
          <stop offset="0.45" stopColor="#a9bacd" />
          <stop offset="1" stopColor="#5f7390" />
        </linearGradient>
        <linearGradient id={`${id}-red`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ff5a4a" />
          <stop offset="0.55" stopColor="#e2261d" />
          <stop offset="1" stopColor="#a8160f" />
        </linearGradient>
        <radialGradient id={`${id}-glass`} cx="0.38" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#bfeaff" />
          <stop offset="0.45" stopColor="#3aa0f0" />
          <stop offset="1" stopColor="#1452a8" />
        </radialGradient>
        <linearGradient id={`${id}-flame`} x1="1" x2="0" y1="0" y2="0">
          <stop offset="0" stopColor="#ffd25a" />
          <stop offset="0.35" stopColor="#ff8a1e" />
          <stop offset="0.75" stopColor="#ff4a1a" stopOpacity="0.75" />
          <stop offset="1" stopColor="#ff3a1a" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-core`} x1="1" x2="0" y1="0" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.3" stopColor="#fff1b0" />
          <stop offset="1" stopColor="#ffd25a" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-heat`}>
          <stop offset="0" stopColor="#ff9a3a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ff6a1a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Engine at full thrust: heat haze, outer flame, white-hot core. */}
      <g className="gm-rocket-engine">
        <ellipse className="gm-rocket-heat" cx="-15" cy="0" rx="10" ry="5" fill={u('heat')} />
        <path className="gm-rocket-flame" d="M-10.6 -2.7 C-14 -3.6 -18.5 -2.4 -26.5 0 C-18.5 2.4 -14 3.6 -10.6 2.7 Z" fill={u('flame')} />
        <path className="gm-rocket-flame gm-rocket-flame--inner" d="M-10.6 -1.6 C-13.4 -1.9 -16.6 -1 -21 0 C-16.6 1 -13.4 1.9 -10.6 1.6 Z" fill={u('core')} />
      </g>

      {/* Back fins, then nozzle, body, band, nose, porthole, front fin. */}
      <path d="M-3.6 -4.3 C-5.6 -6.6 -8.6 -7.6 -11.6 -7.6 C-10.3 -6.2 -9.7 -5.2 -9.3 -3.9 Z" fill={u('red')} />
      <path d="M-3.6 4.3 C-5.6 6.6 -8.6 7.6 -11.6 7.6 C-10.3 6.2 -9.7 5.2 -9.3 3.9 Z" fill={u('red')} />
      <rect x="-11.2" y="-2.5" width="2.6" height="5" rx="0.9" fill="#586b84" />
      <path d="M-9.2 -4.4 C-3 -5.5 5 -5.3 9 -4.1 L9 4.1 C5 5.3 -3 5.5 -9.2 4.4 C-10 1.5 -10 -1.5 -9.2 -4.4 Z" fill={u('body')} />
      <path d="M-7.9 -4.75 L-6.6 -4.9 L-6.6 4.9 L-7.9 4.75 Z" fill="#f08a24" />
      <path d="M-1.6 -5.2 L-1.6 5.2 M5.6 -4.9 L5.6 4.9" stroke="#5f7390" strokeWidth="0.35" opacity="0.6" />
      <path d="M9 -4.1 C12.6 -3.4 15.6 -1.7 17 0 C15.6 1.7 12.6 3.4 9 4.1 Z" fill={u('red')} />
      <circle cx="2" cy="-0.4" r="2.55" fill="#d92b25" />
      <circle cx="2" cy="-0.4" r="1.8" fill={u('glass')} />
      <ellipse cx="1.35" cy="-1.1" rx="0.7" ry="0.45" fill="#ffffff" opacity="0.85" />
      <path d="M-1.4 1.5 C-4.4 1.2 -8.2 1.7 -12 2.7 C-8.2 3.1 -4.4 2.8 -1.4 2.4 Z" fill={u('red')} />
    </svg>
  );
}
