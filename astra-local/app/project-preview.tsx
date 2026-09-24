'use client';

import { useEffect, useRef } from 'react';

// One preview plays at a time: the one the visitor is actually looking at.
// Videos are not tied to page scroll; they only play, pause and resume.
const FOCUS = 0.6; // share of the preview that must be on screen
const START_DELAY = 550; // ms between arriving and the site starting to move
export const MOBILE = '(max-width: 760px)';

type Entry = { video: HTMLVideoElement; ratio: number; load: () => void };
const previews = new Set<Entry>();
let active: Entry | null = null;
let timer = 0;

const motionAllowed = () => {
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  return !matchMedia('(prefers-reduced-motion: reduce)').matches && !saveData;
};

function elect() {
  let next: Entry | null = null;
  if (motionAllowed() && !document.hidden) {
    for (const entry of previews) {
      if (entry.ratio < FOCUS) continue;
      if (!next || entry.ratio > next.ratio + 0.05 || (entry === active && entry.ratio >= next.ratio - 0.05)) next = entry;
    }
  }
  for (const entry of previews) if (entry !== next) entry.video.pause();
  if (next === active) {
    if (next && next.video.paused && !timer) timer = window.setTimeout(play, START_DELAY);
    return;
  }
  active = next;
  clearTimeout(timer);
  timer = 0;
  // Start fetching at once; the poster stays until the delay has passed.
  if (next) { next.load(); timer = window.setTimeout(play, START_DELAY); }
}

function play() {
  timer = 0;
  const entry = active;
  if (!entry) return;
  entry.load();
  entry.video.play().catch(() => { /* autoplay refused: the poster stays */ });
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', elect);
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', elect);
}

export default function ProjectPreview({ src, name }: { src: string; name: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true; // required for autoplay on iOS and Chrome
    let loaded = false;
    // Lazy: sources are attached only when this preview becomes the active one,
    // at the resolution its frame actually needs. Until then only the poster loads.
    const load = () => {
      if (loaded || !motionAllowed()) return;
      loaded = true;
      // Phones get the real mobile homepage, cropped to the square preview frame.
      const variant = matchMedia(MOBILE).matches
        ? 'm-720'
        : video.clientWidth * Math.min(devicePixelRatio || 1, 2) > 900 ? '1280' : '720';
      for (const [type, ext] of [['video/webm; codecs=vp9', 'webm'], ['video/mp4', 'mp4']]) {
        const source = document.createElement('source');
        source.src = `${src}-${variant}.${ext}`;
        source.type = type;
        if (ext === 'webm') source.addEventListener('error', fallback);
        video.appendChild(source);
      }
      video.preload = 'auto';
      video.load();
    };
    // The poster underneath stays until the first frame is actually playing.
    const shown = () => video.classList.add('is-playing');
    video.addEventListener('playing', shown);
    const entry: Entry = { video, ratio: 0, load };
    previews.add(entry);
    // Some hardware decoders reject VP9: fall back to the H.264 file.
    const fallback = () => {
      const webm = video.querySelector('source[type^="video/webm"]');
      if (!webm || !video.currentSrc.endsWith('.webm')) return;
      webm.remove();
      video.load();
      if (active === entry) video.play().catch(() => {});
    };
    video.addEventListener('error', fallback);

    const focus = new IntersectionObserver(([hit]) => {
      entry.ratio = hit.isIntersecting ? hit.intersectionRatio : 0;
      elect();
    }, { threshold: [0, 0.2, 0.4, 0.6, 0.7, 0.8, 0.9, 1] });
    focus.observe(video);

    return () => {
      focus.disconnect();
      video.removeEventListener('error', fallback);
      video.removeEventListener('playing', shown);
      previews.delete(entry);
      if (active === entry) { active = null; clearTimeout(timer); timer = 0; }
      video.pause();
    };
  }, [src]);

  return (
    <>
      <picture className="gm-project-poster">
        <source media={MOBILE} srcSet={`${src}-m-poster.jpg`} />
        <img src={`${src}-poster.jpg`} alt={`Homepage di ${name}`} loading="lazy" decoding="async" />
      </picture>
      <video
        ref={ref}
        className="gm-project-video"
        muted
        loop
        playsInline
        preload="none"
        disablePictureInPicture
        disableRemotePlayback
        tabIndex={-1}
        aria-hidden="true"
      />
    </>
  );
}
