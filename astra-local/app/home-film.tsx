'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import SectionLabel from './section-label';
import { afterOpening } from './idle';
import { reducedMotion } from './motion';
import { skyFocus } from './sky-focus';

// The studio's star (the same as the GM's sky and the scroll cue's light).
const STAR = 'M0 -6.5 C0.5 -1.6 1.6 -0.5 6.5 0 C1.6 0.5 0.5 1.6 0 6.5 C-0.5 1.6 -1.6 0.5 -6.5 0 C-1.6 -0.5 -0.5 -1.6 0 -6.5 Z';
const Star = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="-7 -7 14 14" aria-hidden="true"><path d={STAR} /></svg>
);
const START = '/video/blueprint-loop-start.jpg';
const STILL = '/video/blueprint-loop-still.jpg';
// The film's clock: the drawing, then the finished villa, then the drawing again.
const isResult = (t: number) => t >= 6.4 && t < 9.6;

/**
 * Right after the opening, on every screen: what we do, and a lit window on
 * the project (beside the words on computers, between them on tablets and
 * phones). A line of starlight opens like a shutter into the film of the
 * villa, from its blueprint to the finished house at sunset, looping on its
 * own (never driven by the scroll). The film's colours light the sky around
 * it, and stars of the site's sky drift into its edge (sky-focus.ts).
 */
export default function HomeFilm() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const glowRef = useRef<HTMLCanvasElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const setup = () => {
      const section = sectionRef.current;
      const stage = stageRef.current;
      const frameEl = frameRef.current;
      const video = videoRef.current;
      const image = imageRef.current;
      const canvas = glowRef.current;
      const toggle = toggleRef.current;
      if (!section || !stage || !frameEl || !video || !image || !canvas || !toggle) return () => {};

      const motion = reducedMotion();
      const saveData = !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
      const posterOnly = () => motion.matches || saveData;
      const ctx = canvas.getContext('2d');
      video.muted = video.defaultMuted = true;

      let loaded = false;
      let entered = false;
      let opened = false;
      let visible = false;
      let userPaused = false;
      let userPlay = false;
      let phase = '';
      let lastGlow = 0;
      let lastRing = 0;
      let videoFrame = 0;
      const timers: number[] = [];

      const glowFrom = (source: CanvasImageSource) => {
        try { ctx?.drawImage(source, 0, 0, 32, 18); } catch { /* not decodable yet */ }
      };
      const setPhase = (next: string) => {
        if (next === phase) return;
        phase = next;
        section.dataset.phase = next;
      };
      const setToggle = (state: 'loading' | 'playing' | 'paused') => {
        toggle.dataset.state = state;
        toggle.disabled = state === 'loading';
        toggle.setAttribute('aria-label', state === 'playing' ? 'Metti in pausa il video' : state === 'paused' ? 'Riproduci il video' : 'Video in caricamento');
      };
      const stopFrames = () => {
        if ('requestVideoFrameCallback' in video) video.cancelVideoFrameCallback(videoFrame);
      };
      const showPoster = () => {
        stopFrames();
        delete section.dataset.playing;
        setStill(true);
        setPhase('risultato');
        setToggle('paused');
      };
      const onImageLoad = () => { if (!section.hasAttribute('data-playing')) glowFrom(image); };
      image.addEventListener('load', onImageLoad);

      if (posterOnly()) {
        showPoster();
      } else {
        setPhase('progetto');
        setToggle('loading');
      }
      image.decode().then(() => glowFrom(image)).catch(() => {});

      // Where the window is, for the sky's stars.
      const measure = () => {
        const box = stage.getBoundingClientRect();
        stage.style.setProperty('--fw', `${box.width}px`);
        stage.style.setProperty('--fh', `${box.height}px`);
        skyFocus.left = box.left;
        skyFocus.top = box.top + scrollY;
        skyFocus.width = box.width;
        skyFocus.height = box.height;
        skyFocus.radius = parseFloat(getComputedStyle(frameEl).borderTopLeftRadius) || 24;
      };
      const focus = () => {
        skyFocus.target = visible && opened && !video.paused && !motion.matches ? 1 : 0;
      };

      const load = () => {
        if (loaded) return;
        loaded = true;
        const width = video.clientWidth * Math.min(devicePixelRatio || 1, 2) > 1000 ? 1280 : 960;
        video.src = `/video/blueprint-loop-${width}.mp4`;
        video.preload = 'auto';
        video.load();
      };
      const sync = () => {
        const run = visible && entered && !document.hidden && !userPaused && (userPlay || !posterOnly());
        if (run) {
          load();
          // Autoplay refused (a phone saving battery, say): the poster stays,
          // and the button is there to start it.
          video.play().catch(() => { if (video.paused) setToggle('paused'); });
        } else if (!video.paused) {
          video.pause();
        }
        focus();
      };

      // The film's own frames drive the glow, the ring and the caption.
      const tick = (_now?: number, meta?: { mediaTime: number }) => {
        if (video.paused) return;
        const t = meta?.mediaTime ?? video.currentTime;
        const now = performance.now();
        if (now - lastGlow > 120) { lastGlow = now; glowFrom(video); }
        if (now - lastRing > 80 && video.duration) { lastRing = now; toggle.style.setProperty('--p', String(t / video.duration)); }
        setPhase(isResult(t) ? 'risultato' : 'progetto');
        if ('requestVideoFrameCallback' in video) videoFrame = video.requestVideoFrameCallback(tick);
      };
      const onPlaying = () => {
        section.dataset.playing = '';
        setStill(false);
        setToggle('playing');
        if ('requestVideoFrameCallback' in video) {
          video.cancelVideoFrameCallback(videoFrame);
          videoFrame = video.requestVideoFrameCallback(tick);
        }
        focus();
      };
      const onPause = () => { stopFrames(); setToggle('paused'); focus(); };
      const onTime = () => { if (!('requestVideoFrameCallback' in video)) tick(); };
      const onError = () => { video.pause(); showPoster(); toggle.hidden = true; focus(); };
      const onToggle = () => {
        if (video.paused) {
          userPaused = false;
          userPlay = true;
          entered = true;
          sync();
        } else {
          userPaused = true;
          video.pause();
        }
      };
      video.addEventListener('playing', onPlaying);
      video.addEventListener('pause', onPause);
      video.addEventListener('timeupdate', onTime);
      video.addEventListener('error', onError);
      toggle.addEventListener('click', onToggle);

      // Load the film near the section, once the page and its opening are done.
      const near = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        near.disconnect();
        if (!posterOnly()) load();
      }, { rootMargin: '100% 0px' });
      const cancelIdle = afterOpening(() => near.observe(stage));

      // The entrance plays once, as the window arrives; already on screen, it is simply open.
      const box = stage.getBoundingClientRect();
      const armed = !posterOnly() && box.top + box.height / 2 > innerHeight * 0.75;
      if (armed) section.dataset.armed = '';
      const open = () => {
        opened = true;
        section.dataset.done = '';
        focus();
      };
      const enter = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        enter.disconnect();
        section.dataset.in = '';
        entered = true;
        sync();
        if (armed) timers.push(window.setTimeout(open, 1650));
        else open();
      }, { rootMargin: '0px 0px -25% 0px', threshold: 0.5 });
      enter.observe(stage);

      // Plays only while at least a fifth of it is on screen.
      const seen = new IntersectionObserver(([entry]) => {
        visible = entry.intersectionRatio >= 0.2;
        if (visible) measure();
        sync();
      }, { threshold: [0, 0.2] });
      seen.observe(stage);
      const onVisibility = () => sync();
      document.addEventListener('visibilitychange', onVisibility);
      const onMotion = () => {
        if (motion.matches) {
          // A new request to stop animations also overrides manual playback.
          userPlay = false;
          video.pause();
          showPoster();
        }
        sync();
      };
      motion.addEventListener('change', onMotion);
      const resize = new ResizeObserver(measure);
      resize.observe(section);
      resize.observe(document.body);
      measure();

      // The window stays still; only a soft light follows the pointer over it.
      const fine = matchMedia('(hover: hover) and (pointer: fine)');
      const onPointer = (event: PointerEvent) => {
        if (!fine.matches) return;
        const box = stage.getBoundingClientRect();
        stage.style.setProperty('--gx', `${(((event.clientX - box.left) / box.width) * 100).toFixed(1)}%`);
        stage.style.setProperty('--gy', `${(((event.clientY - box.top) / box.height) * 100).toFixed(1)}%`);
      };
      stage.addEventListener('pointermove', onPointer, { passive: true });

      return () => {
        cancelIdle();
        near.disconnect();
        enter.disconnect();
        seen.disconnect();
        resize.disconnect();
        timers.forEach(clearTimeout);
        stopFrames();
        image.removeEventListener('load', onImageLoad);
        document.removeEventListener('visibilitychange', onVisibility);
        motion.removeEventListener('change', onMotion);
        video.removeEventListener('playing', onPlaying);
        video.removeEventListener('pause', onPause);
        video.removeEventListener('timeupdate', onTime);
        video.removeEventListener('error', onError);
        toggle.removeEventListener('click', onToggle);
        stage.removeEventListener('pointermove', onPointer);
        video.pause();
        skyFocus.target = 0;
      };
    };

    return setup();
  }, []);

  return (
    <section ref={sectionRef} id="cosa-facciamo" className="gm-film" aria-labelledby="cosa-facciamo-title" data-scroll-stop>
      <div className="gm-film-grid">
        <div className="gm-film-stage" ref={stageRef}>
          <div className="gm-film-glow" aria-hidden="true"><div className="gm-film-glow-blur"><canvas ref={glowRef} width={32} height={18} /></div></div>
          <div className="gm-film-frame" ref={frameRef}>
            <div className="gm-film-clip">
              <div className="gm-film-dolly">
                <div className="gm-film-media">
                  <img ref={imageRef} src={still ? STILL : START} alt="" width={1280} height={720} loading="lazy" decoding="async" />
                  <video
                    ref={videoRef}
                    muted
                    loop
                    playsInline
                    preload="none"
                    disablePictureInPicture
                    disableRemotePlayback
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </div>
              </div>
              <div className="gm-film-scrim" />
              <div className="gm-film-glare" />
              <p className="gm-film-caption" aria-hidden="true">
                <span className="gm-label-dot" />
                <span className="gm-film-word" data-word="progetto">Il progetto</span>
                <span className="gm-film-word" data-word="risultato">Il risultato</span>
              </p>
              <button ref={toggleRef} type="button" className="gm-film-toggle" data-state="loading" aria-label="Video in caricamento" disabled>
                <svg viewBox="0 0 40 40" aria-hidden="true"><circle className="track" cx="20" cy="20" r="18" /><circle className="ring" cx="20" cy="20" r="18" /></svg>
                <i aria-hidden="true" />
              </button>
            </div>
            <span className="gm-film-line" aria-hidden="true" />
            <span className="gm-film-edge gm-film-edge--top" aria-hidden="true" />
            <span className="gm-film-edge gm-film-edge--bottom" aria-hidden="true" />
            <Star className="gm-film-spark gm-film-spark--l" />
            <Star className="gm-film-spark gm-film-spark--r" />
          </div>
        </div>

        <div className="gm-film-copy">
          <header data-reveal>
            <SectionLabel>Cosa facciamo</SectionLabel>
            <h2 id="cosa-facciamo-title" className="gm-h2">
              <span className="gm-h2-line">Dall’idea al digitale.</span> <span className="gm-h2-line">Tutto su <em className="gm-shine">misura.</em></span>
            </h2>
            <p className="gm-lead">Partiamo da ciò che vuoi raccontare e costruiamo un’esperienza digitale pensata intorno alla tua identità, ai tuoi obiettivi e al tuo pubblico.</p>
          </header>
          <div data-reveal style={{ '--reveal-delay': '140ms' } as React.CSSProperties}>
            <ul className="gm-film-tech" aria-label="Tra i nostri servizi">
              <li>Sviluppo web</li>
              <li aria-hidden="true"><Star /></li>
              <li>3D e WebGL</li>
              <li aria-hidden="true"><Star /></li>
              <li>AI</li>
            </ul>
            <Link className="gm-btn gm-btn--ghost" href="/servizi" data-cta="home-servizi">
              Scopri i servizi <span className="gm-btn-arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
