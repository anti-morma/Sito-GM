'use client';

import { useEffect, useRef, useState } from 'react';

// Scroll-scrubbed construction video. Phones get a lighter file with a
// keyframe every 5 frames so seeking keeps up with the finger.
const FILES = { phone: '/video/blueprint-to-house-mobile.mp4', wide: '/video/blueprint-to-house.mp4' };
// Both files run at 24 frames a second: one seek per frame of the film.
const FPS = 24;

export default function ConstructionVideo({ progress, onReady }: { progress: number; onReady: (ready: boolean) => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const desired = useRef(progress);
  const seekRef = useRef<() => void>(() => {});
  const [src, setSrc] = useState<string | null>(null);

  // The whole file in memory before scrubbing starts, so a jump never waits
  // for the network (on a slow connection the frame would otherwise freeze
  // while that part downloads). Until then the stars' drawing stands in.
  useEffect(() => {
    const file = innerWidth <= 760 ? FILES.phone : FILES.wide;
    let url = '';
    let cancelled = false;
    fetch(file)
      .then((response) => (response.ok ? response.blob() : Promise.reject(new Error(`${response.status}`))))
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setSrc(url);
      })
      .catch(() => { if (!cancelled) setSrc(file); });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video || !src) return;
    video.muted = true;
    let frame = -1;
    // One seek at a time, to the middle of the frame the scroll asks for, and
    // none while that frame is already on screen.
    const seek = () => {
      if (!Number.isFinite(video.duration) || video.seeking) return;
      const lastFrame = Math.max(0, Math.floor(video.duration * FPS) - 1);
      const next = Math.round(Math.min(1, Math.max(0, desired.current)) * lastFrame);
      if (next === frame) return;
      frame = next;
      video.currentTime = (next + 0.5) / FPS;
    };
    const loaded = () => { onReady(true); seek(); };
    const failed = () => onReady(false);
    seekRef.current = seek;
    video.addEventListener('loadeddata', loaded);
    video.addEventListener('loadedmetadata', seek);
    video.addEventListener('seeked', seek);
    video.addEventListener('error', failed);
    // iOS Safari fetches no frames for a video that has never played:
    // a muted, inline play() followed by pause() makes it decodable.
    video.play().then(() => { video.pause(); frame = -1; seek(); }).catch(() => {});
    if (video.readyState >= 2) loaded();
    return () => {
      onReady(false);
      seekRef.current = () => {};
      video.removeEventListener('loadeddata', loaded);
      video.removeEventListener('loadedmetadata', seek);
      video.removeEventListener('seeked', seek);
      video.removeEventListener('error', failed);
    };
  }, [onReady, src]);

  useEffect(() => { desired.current = progress; seekRef.current(); }, [progress]);

  return (
    <video
      ref={ref}
      src={src ?? undefined}
      poster="/video/blueprint-poster.jpg"
      muted
      playsInline
      preload="auto"
      disablePictureInPicture
      disableRemotePlayback
      aria-hidden="true"
    />
  );
}
