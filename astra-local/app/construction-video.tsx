'use client';

import { useEffect, useRef } from 'react';

export default function ConstructionVideo({ progress, onReady }: { progress: number; onReady: (ready: boolean) => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const desired = useRef(progress);
  const seekRef = useRef<() => void>(() => {});
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
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
    if (video.readyState >= 2) loaded();
    return () => {
      onReady(false);
      seekRef.current = () => {};
      video.removeEventListener('loadeddata', loaded);
      video.removeEventListener('loadedmetadata', seek);
      video.removeEventListener('seeked', seek);
      video.removeEventListener('error', failed);
    };
  }, [onReady]);
  useEffect(() => { desired.current = progress; seekRef.current(); }, [progress]);
  return <video ref={ref} src="/video/blueprint-to-house.mp4" muted playsInline preload="auto" aria-label="Dal blueprint alla villa: costruzione controllata dallo scroll" />;
}
