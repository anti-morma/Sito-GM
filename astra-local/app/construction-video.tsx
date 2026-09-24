'use client';

import { useEffect, useRef, useState } from 'react';

// Scroll-scrubbed construction video. Phones get a lighter file with a
// keyframe every 5 frames so seeking keeps up with the finger.
export default function ConstructionVideo({ progress, onReady }: { progress: number; onReady: (ready: boolean) => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const desired = useRef(progress);
  const seekRef = useRef<() => void>(() => {});
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    setSrc(innerWidth <= 760 ? '/video/blueprint-to-house-mobile.mp4' : '/video/blueprint-to-house.mp4');
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video || !src) return;
    video.muted = true;
    const seek = () => {
      if (!Number.isFinite(video.duration) || video.seeking) return;
      const target = Math.min(video.duration - 1 / 24, Math.max(0, desired.current) * video.duration);
      if (Math.abs(video.currentTime - target) > 1 / 30) video.currentTime = Math.max(0, target);
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
    video.play().then(() => { video.pause(); seek(); }).catch(() => {});
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
