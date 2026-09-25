'use client';

import { useEffect, useRef } from 'react';
import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three';

// Same clock as the story scene (astra-field.tsx), so the sky moves alike.
const ANIMATION_SPEED = 1.25;
// Stars rise by a fifth of their field for every screen height scrolled:
// the pace of the sky behind the brain and the synapses.
const SCROLL_DRIFT = 0.2;
// The sky as it looks behind the synapses: the story dimmed it to 24%.
const SKY_LIGHT = 0.24;

// The free-star branch of the story shader, unchanged: the same drift, depth,
// shimmer and four-ray sparkle on the brightest stars.
const vertexShader = `
  attribute vec3 aOrigin;
  attribute vec3 aColor;
  attribute vec3 aStyle; // size, light, phase
  uniform float uTime;
  uniform float uScroll;
  uniform float uAspect;
  uniform float uDpr;
  uniform float uPixelScale;
  uniform float uMotion;
  uniform float uSkyLight;
  varying vec3 vColor;
  varying float vLight;
  varying float vSparkle;

  void main() {
    float aSize = aStyle.x;
    float aPhase = aStyle.z;
    float layerSpeed = 0.012 + (aOrigin.z + 0.675) * 0.018;
    vec2 drift = vec2(uTime * layerSpeed * 0.35, uTime * layerSpeed + uScroll * (0.8 + aPhase * 0.08)) * uMotion;
    vec2 slot = mod(aOrigin.xy + drift + 0.55, 1.1) - 0.55;
    vec3 p = vec3(slot, aOrigin.z);
    p.x *= uAspect;
    p.xy *= (2.0 - p.z) * 0.5;
    p += vec3(sin(uTime * 0.38 + aPhase) * 0.025, cos(uTime * 0.31 + aPhase) * 0.02, sin(uTime * 0.28 + aPhase) * 0.025) * uMotion;

    vec4 mv = viewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float viewDist = max(0.001, -mv.z);
    float depth = clamp(2.0 / viewDist, 0.35, 2.5);
    gl_PointSize = clamp(aSize * uDpr * uPixelScale * depth, 2.0, 160.0);

    float shimmer = mix(1.0, 0.72 + 0.28 * sin(uTime * (0.65 + aPhase * 0.065) + aPhase * 3.0), uMotion);
    float depthCue = clamp(pow(2.0 / viewDist, 0.8), 0.4, 1.8);
    float nearFade = smoothstep(0.12, 0.45, viewDist);
    vLight = aStyle.y * shimmer * uSkyLight * depthCue * nearFade;
    vSparkle = smoothstep(22.0, 34.0, aSize);
    vColor = aColor;
  }
`;

const fragmentShader = `
  precision highp float;
  varying vec3 vColor;
  varying float vLight;
  varying float vSparkle;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r2 = dot(uv, uv);
    float core = exp(-r2 * 310.0);
    float inner = exp(-r2 * 90.0) * 0.2;
    float halo = exp(-r2 * 26.0) * 0.055;
    float rays = (exp(-abs(uv.x) * 170.0 - abs(uv.y) * 13.0) + exp(-abs(uv.y) * 170.0 - abs(uv.x) * 13.0)) * 0.18 * vSparkle;
    float alpha = (core + inner + halo + rays) * vLight;
    if (alpha < 0.0003) discard;
    gl_FragColor = vec4(mix(vColor, vec3(1.0), core * 0.6), alpha);
  }
`;

// Same density as the story sky had (astra-field.tsx), +10%.
const starCount = (width: number, height: number, mobile = false) =>
  mobile
    ? Math.round(Math.min(260, Math.max(180, (width * height) / 1800)))
    : Math.round(Math.min(1800, Math.max(480, (width * height) / 700)) * 0.847);
const MAX_STARS = starCount(1e5, 1e5);

/**
 * One sky for the whole site, from the GM to the footer and on every page:
 * a fixed WebGL starfield under all content. Its stars rise continuously as
 * the page scrolls, so a star low on the screen really climbs to the top.
 */
export default function StarSky() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
    } catch {
      return;
    }
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = matchMedia('(max-width: 760px), (pointer: coarse)');
    renderer.setClearColor(0, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile.matches ? 1 : 2));
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(renderer.domElement);

    // The same distributions as the story's ambient stars.
    let seed = 601;
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const origins: number[] = [];
    const colors: number[] = [];
    const styles: number[] = [];
    for (let i = 0; i < MAX_STARS; i++) {
      origins.push((random() - 0.5) * 1.1, (random() - 0.5) * 1.1, (random() - 0.5) * 1.35);
      const heat = random();
      colors.push(...(heat < 0.65 ? [0.94, 0.95, 1] : heat < 0.85 ? [0.64, 0.82, 1] : [1, 0.8, 0.59]));
      const bright = random();
      const size = bright > 0.97 ? 26 + random() * 10 : bright > 0.78 ? 12 + random() * 6 : 5 + random() * 6;
      styles.push(size, 0.38 + random() * 0.48, random() * Math.PI * 2);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(MAX_STARS * 3), 3));
    geometry.setAttribute('aOrigin', new Float32BufferAttribute(origins, 3));
    geometry.setAttribute('aColor', new Float32BufferAttribute(colors, 3));
    geometry.setAttribute('aStyle', new Float32BufferAttribute(styles, 3));

    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uAspect: { value: 1 },
        uDpr: { value: renderer.getPixelRatio() },
        uPixelScale: { value: 1 },
        uMotion: { value: reduced.matches ? 0 : 1 },
        uSkyLight: { value: SKY_LIGHT },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
    });
    const points = new Points(geometry, material);
    points.frustumCulled = false;
    const scene = new Scene();
    scene.add(points);
    const camera = new PerspectiveCamera(28.072486, 1, 0.1, 20);
    camera.position.z = 2;

    const u = material.uniforms;
    const resize = () => {
      const width = innerWidth;
      const height = innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      u.uAspect.value = camera.aspect;
      u.uPixelScale.value = Math.max(0.65, Math.min(1.3, height / 720));
      geometry.setDrawRange(0, starCount(width, height, mobile.matches));
    };
    resize();

    let time = 0;
    let frame = 0;
    let last = performance.now();
    const draw = () => {
      u.uTime.value = reduced.matches ? 10 : time;
      u.uMotion.value = reduced.matches ? 0 : 1;
      u.uScroll.value = (scrollY / Math.max(1, innerHeight)) * SCROLL_DRIFT;
      renderer.render(scene, camera);
    };
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (mobile.matches && now - last < 1000 / 30) return;
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      if (document.hidden) return;
      time += dt * ANIMATION_SPEED;
      draw();
    };
    const onResize = () => { resize(); draw(); };
    const onMotion = () => {
      cancelAnimationFrame(frame);
      draw();
      if (!reduced.matches) frame = requestAnimationFrame(loop);
    };
    addEventListener('resize', onResize);
    reduced.addEventListener('change', onMotion);
    onMotion();

    return () => {
      cancelAnimationFrame(frame);
      removeEventListener('resize', onResize);
      reduced.removeEventListener('change', onMotion);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} className="gm-star-sky" aria-hidden="true" />;
}
