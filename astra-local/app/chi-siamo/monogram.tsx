import { MONO_M, MONO_PATH, MONO_SHARED, MONO_VIEW } from './monogram-shape';

const VIEW = `0 0 ${MONO_VIEW.width} ${MONO_VIEW.height}`;

/**
 * The founders' initials are the studio's monogram, and in it one stroke
 * belongs to both letters: the G's spur is the M's first leg. On arrival
 * (scenes.tsx marks it is-on) the G is written from its terminal round the
 * bowl to the bar, the M from its right foot back towards the G, and when
 * both reach the stroke they share, it is drawn last, top to bottom, in the
 * site's light. Before that the monogram is only a trace; with reduced
 * motion it is simply there. Decorative: the names say who they are.
 */
export default function Monogram() {
  return (
    <div className="gm-mono" data-scene="read" aria-hidden="true">
      <svg className="gm-mono-layer gm-mono-trace" viewBox={VIEW}>
        <defs>
          <path id="gm-mono-path" d={MONO_PATH} />
          <clipPath id="gm-mono-clip"><use href="#gm-mono-path" /></clipPath>
          <mask id="gm-mono-g" maskUnits="userSpaceOnUse" x="0" y="0" width={MONO_VIEW.width} height={MONO_VIEW.height}>
            <rect width={MONO_VIEW.width} height={MONO_VIEW.height} fill="#fff" />
            <polygon points={MONO_M} fill="#000" />
            <polygon points={MONO_SHARED} fill="#000" />
          </mask>
          <mask id="gm-mono-m" maskUnits="userSpaceOnUse" x="0" y="0" width={MONO_VIEW.width} height={MONO_VIEW.height}>
            <polygon points={MONO_M} fill="#fff" />
            <polygon points={MONO_SHARED} fill="#000" />
          </mask>
          <linearGradient id="gm-mono-light" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f4f6ff" />
            <stop offset="1" stopColor="#8fb1ff" />
          </linearGradient>
        </defs>
        <use href="#gm-mono-path" />
      </svg>
      <svg className="gm-mono-layer gm-mono-g" viewBox={VIEW}>
        <use href="#gm-mono-path" mask="url(#gm-mono-g)" />
      </svg>
      <svg className="gm-mono-layer gm-mono-m" viewBox={VIEW}>
        <use href="#gm-mono-path" mask="url(#gm-mono-m)" />
      </svg>
      <svg className="gm-mono-layer gm-mono-shared" viewBox={VIEW}>
        <polygon points={MONO_SHARED} clipPath="url(#gm-mono-clip)" fill="url(#gm-mono-light)" />
      </svg>
    </div>
  );
}
