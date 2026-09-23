'use client';

import { useEffect, useRef } from 'react';
import {
  AdditiveBlending,
  BufferGeometry,
  ClampToEdgeWrapping,
  DataTexture,
  DynamicDrawUsage,
  Float32BufferAttribute,
  FloatType,
  Group,
  NearestFilter,
  PerspectiveCamera,
  Points,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import logoPoints from './gm-points.json';
import brainPoints from './brain-points.json';
import { buildSynapseParticles } from './synapse-geometry';
import { buildBlueprintParticles } from './blueprint-geometry';

const ANIMATION_SPEED = 1.25;
const MAX_AMBIENT_STARS = 1386;
const BASE_MORPH_COUNT = brainPoints.length;
const MORPH_COUNT = BASE_MORPH_COUNT * 3;

const vertexShader = `
 attribute vec3 aOrigin;
 attribute vec3 aColor;
 attribute vec4 aStyle;
 attribute vec4 aMorph;
 attribute vec3 aBrain;
 attribute vec4 aSynapse;
 attribute vec3 aRelease;
 attribute vec4 aPlan;
 attribute vec4 aBuilding;
 attribute vec2 aArchitecture;
 #define aBuildingKind aArchitecture.x
 #define aDrawOrder aArchitecture.y
 attribute vec2 aOffset;
 #define aSize aStyle.x
 #define aLight aStyle.y
 #define aPhase aStyle.z
 #define aKind aStyle.w
 #define aFree aMorph.x
 #define aDetail aMorph.y
 #define aBrainShade aMorph.z
 #define aSignal aMorph.w
 #define aShade aSynapse.w
 uniform float uTime;
 uniform float uDpr;
 uniform float uPixelScale;
 uniform float uLogoScale;
 uniform float uAspect;
 uniform float uCompact;
 uniform float uReduced;
 uniform float uScroll;
 uniform float uVideoReady;
 uniform sampler2D uSpringField;
 uniform vec2 uFieldSize;
 varying vec3 vColor;
 varying float vLight;
 varying float vStar;
 varying float vSparkle;
 varying float vSynapse;
 varying float vNeuralFocus;
 varying float vPulse;
 varying float vConstruction;

 void main() {
   float t = clamp((uTime - 0.8 - aPhase * 0.12) / 4.8, 0.0, 1.0);
   float ordered = t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
   ordered = mix(ordered, 1.0, max(uReduced, smoothstep(0.0, 0.025, uScroll)));
   float motion = 1.0 - uReduced;

   float travel = 1.0 - uReduced;
   float gather = smoothstep(0.28, 0.42, uScroll);
   float zoomIn = smoothstep(0.47, 0.56, uScroll);
   float synapseMix = smoothstep(0.48, 0.58, uScroll);
   float projectMix = smoothstep(0.775, 0.815, uScroll);
   float brainScale = min(1.18, uAspect * 0.65);
   vec3 brain = aBrain * brainScale;
   vec2 center = vec2(-0.235 * uAspect, 0.015);
   vec2 brainOverview = brain.xy + center;
   vec2 brainCloseup = (aBrain.xy - vec2(0.21, 0.055)) * brainScale * 4.0;
   brain.xy = mix(brainOverview, brainCloseup, zoomIn);
   brain.y -= (1.0 - smoothstep(0.28, 0.42, uScroll)) * 0.90 * travel;
   float synapseScale = min(0.82, uAspect * 0.70);
   float signalHead = clamp((uScroll - 0.58) / 0.17, 0.0, 1.0) * 1.06;
   vec3 synapse = aSynapse.xyz * synapseScale;
   float releaseProgress = smoothstep(aSignal - 0.015, aSignal + 0.11, signalHead);
   if (aKind > 1.5 && aKind < 2.5) {
     synapse = mix(synapse, aRelease * synapseScale, releaseProgress);
   }
   // A small scroll-driven camera arc reveals the depth of the same particle volume.
   float neuralTurn = (smoothstep(0.54, 0.75, uScroll) - 0.5) * 0.30 * motion;
   synapse.xz = mat2(cos(neuralTurn), -sin(neuralTurn), sin(neuralTurn), cos(neuralTurn)) * synapse.xz;
   // Match the CSS video rectangle exactly, with no tilt during the crossfade.
   float videoSettle = smoothstep(0.87, 0.94, uScroll);
   float frameWidth = mix(0.80 - videoSettle * 0.28, 0.92, uCompact);
   vec3 project = vec3(aPlan.x, -aPlan.z, 0.0) * uAspect * frameWidth;
   project.xy += vec2(mix(-uAspect * videoSettle * 0.20, 0.0, uCompact), 0.16 * uCompact);
   // Scatter first, then gather each group of stars into the progressive drawing.
   float scatter = smoothstep(0.745, 0.775, uScroll) * motion;
   vec3 loose = vec3(aOrigin.x * uAspect, aOrigin.y - 0.18, aOrigin.z * 0.35);
   loose.xy += vec2(sin(aPhase * 2.7), cos(aPhase * 1.9)) * 0.13 * motion;
   synapse = mix(synapse, loose, scatter);
   float assemble = smoothstep(0.775 + aDrawOrder * 0.037, 0.797 + aDrawOrder * 0.037, uScroll);
   synapse = mix(synapse, project, assemble);
   vec3 logo = position * uLogoScale;
   // The story spans six viewport heights: respond one-to-one from the first scroll pixel.
   logo.y += uScroll * 6.0 * travel;
   vec3 dispersed = vec3(aOrigin.x * uAspect, aOrigin.y + 0.15, aOrigin.z * 0.35);
   vec3 target = mix(logo, dispersed, smoothstep(0.0, 0.20, uScroll) * travel);
   target = mix(target, brain, gather);
   target = mix(target, synapse, synapseMix);
   if (uReduced > 0.5 && uScroll < 0.025) target = position * uLogoScale;
   float orbit = mix(0.015, 0.0012, gather) * motion * (1.0 - projectMix);
   target += vec3(
     sin(uTime * 0.7 + aPhase),
     cos(uTime * 0.55 + aPhase * 1.7),
     sin(uTime * 0.42 + aPhase)
   ) * orbit;
   target.y += sin(position.x * 18.0 + uTime * 0.65) * 0.006 * motion * (1.0 - gather);

   vec3 origin = aOrigin;
   origin.x *= uAspect;
   float spin = uTime * 0.5 * (1.0 - ordered) * motion;
   origin.xy = mat2(cos(spin), -sin(spin), sin(spin), cos(spin)) * origin.xy;
   vec3 turbulence = vec3(
     sin(uTime * 1.5 + aPhase * 2.0),
     cos(uTime * 1.15 + aPhase * 3.0),
     sin(uTime * 1.3 + aPhase)
   ) * motion;
   vec3 p = mix(origin, target, ordered) + turbulence * 0.16 * (1.0 - ordered);

   if (aFree > 0.5) {
     float layerSpeed = 0.012 + (aOrigin.z + 0.675) * 0.018;
     vec2 drift = vec2(uTime * layerSpeed * 0.35, uTime * layerSpeed + uScroll * (0.8 + aPhase * 0.08)) * motion;
     vec2 slot = mod(aOrigin.xy + drift + 0.55, 1.1) - 0.55;
     p = vec3(slot, aOrigin.z);
     p.x *= uAspect;
     p.xy *= (2.0 - p.z) * 0.5;
     p += vec3(
       sin(uTime * 0.38 + aPhase) * 0.025,
       cos(uTime * 0.31 + aPhase) * 0.02,
       sin(uTime * 0.28 + aPhase) * 0.025
     ) * motion;
   }

   vec4 mv = aFree > 0.5
     ? viewMatrix * vec4(p, 1.0)
     : modelViewMatrix * vec4(p, 1.0);
   // The spring texture stores screen-space offsets; sample it after the
   // complete morph and rotation so it follows the particles actually drawn.
   vec2 screenPoint = mv.xy * (2.0 / max(0.1, -mv.z));
   vec2 uv = vec2((screenPoint.x + uAspect * 0.5 + 0.1) / (uAspect + 0.2),
     (screenPoint.y + 0.6) / 1.2);
   vec2 fieldOffset = vec2(0.0);
   if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
     vec2 grid = clamp(uv * uFieldSize - 0.5, vec2(0.0), uFieldSize - 1.0);
     vec2 base = floor(grid);
     vec2 blend = grid - base;
     vec2 a = texture2D(uSpringField, (base + vec2(0.5, 0.5)) / uFieldSize).xy;
     vec2 b = texture2D(uSpringField, (base + vec2(1.5, 0.5)) / uFieldSize).xy;
     vec2 c = texture2D(uSpringField, (base + vec2(0.5, 1.5)) / uFieldSize).xy;
     vec2 d = texture2D(uSpringField, (base + vec2(1.5, 1.5)) / uFieldSize).xy;
     fieldOffset = mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
   }
   float fieldBlend = smoothstep(0.020, 0.025, uScroll);
   vec2 displacement = mix(aOffset, fieldOffset, fieldBlend) * (1.0 - aFree)
     * (1.0 - smoothstep(0.83, 0.84, uScroll) * uVideoReady);
   float influence = min(length(displacement) * 3.0, 0.2);
   mv.xy += displacement * (-mv.z / 2.0);

   gl_Position = projectionMatrix * mv;
   float depth = clamp(2.0 / -mv.z, 0.35, 2.5);
   float anatomy = gather * (1.0 - synapseMix) * (1.0 - aFree);
   float renderedSize = mix(aSize, 7.5 + aBrainShade * 6.5, anatomy);
   float synapseSize = aKind < 0.5 ? 9.0 : (aKind < 1.5 ? 10.5 : 7.0);
   float depthLayer = smoothstep(-0.23, 0.23, aSynapse.z);
   synapseSize *= mix(0.73, 1.12, depthLayer);
   synapseSize *= clamp(pow(synapseScale / 0.84, 0.2), 0.8, 1.0);
   renderedSize = mix(renderedSize, synapseSize, synapseMix * (1.0 - aFree));
   renderedSize = mix(renderedSize, 6.5, projectMix * (1.0 - aFree));
   gl_PointSize = clamp(
     renderedSize * uDpr * uPixelScale * depth * (1.0 + influence * 0.12),
     2.0,
     160.0
   );

   float shimmer = 0.5 + 0.5 * pow(
     0.5 + 0.5 * sin(uTime * (0.7 + aPhase * 0.12) + aPhase),
     2.0
   );
   float starShimmer = 0.72 + 0.28 * sin(
     uTime * (0.65 + aPhase * 0.065) + aPhase * 3.0
   );
   shimmer = mix(shimmer, starShimmer, aFree);
   float activeRoute = 1.0 - step(1.5, aSignal);
   float reached = smoothstep(aSignal - 0.025, aSignal + 0.025, signalHead);
   float lit = activeRoute * reached * synapseMix * (1.0 - aFree);
   float pulse = (1.0 - step(1.5, aSignal)) *
     exp(-pow((signalHead - aSignal) * 15.0, 2.0)) * synapseMix * (1.0 - aFree);
   vLight = aLight * mix(shimmer, 1.0, uReduced) + influence * 0.12;
   vLight = mix(vLight, 0.035 + aBrainShade * aBrainShade * 1.6, anatomy);
   vLight *= mix(1.0, clamp(pow(brainScale / 1.18, 0.8), 0.30, 1.0), anatomy);
   float shellLight = (0.26 + 0.10 * aShade) * mix(0.72, 1.0, depthLayer);
   shellLight += aKind > 0.5 && aKind < 1.5 ? 0.06 : 0.0;

   if (aKind > 1.5 && aKind < 2.5) shellLight *= mix(0.18, 0.65, reached);

   vLight = mix(vLight, shellLight, synapseMix * (1.0 - aFree));
   vLight *= mix(1.0, 0.24, gather * aFree);
   float pulseStrength = aKind > 0.5 && aKind < 1.5 ? 0.28 : 0.46;
   vLight += lit * (aKind < 0.5 ? 0.07 : 0.10) + pulse * pulseStrength;
   float synapseDensity = clamp(pow(synapseScale / 0.84, 0.60), 0.60, 1.0);
   vLight *= mix(1.0, synapseDensity, synapseMix * (1.0 - aFree));
   vLight *= mix(1.0, 0.42, step(2.5, aKind) * synapseMix * (1.0 - aFree));
   vLight *= 1.0 - min(aDetail, 1.0) * (1.0 - gather);
   vec3 fiberColor = mix(vec3(0.055, 0.18, 0.48), vec3(0.24, 0.74, 1.0), 0.55 + aShade * 0.25);
   vec3 somaColor = mix(vec3(0.12, 0.25, 0.54), vec3(0.37, 0.72, 0.94), aShade);
   vec3 gapColor = fiberColor;
   vec3 outputColor = fiberColor;
   vec3 synapseColor = aKind < 0.5 ? fiberColor :
     (aKind < 1.5 ? somaColor : (aKind < 2.5 ? gapColor : outputColor));
   vColor = mix(aColor, synapseColor, synapseMix * (1.0 - aFree));
   vStar = max(aFree, synapseMix * (pulse * 0.36));
   vSparkle = aFree * smoothstep(22.0, 34.0, aSize);
   vSynapse = synapseMix * (1.0 - aFree);
   vNeuralFocus = smoothstep(0.02, 0.28, abs(aSynapse.z - 0.07));
   vPulse = pulse;
   float constructed = projectMix * (1.0 - aFree);
   vConstruction = constructed;
   float blueprintLight = (0.20 + aBuilding.w * 0.42) * clamp(uAspect * frameWidth / 1.4, 0.28, 1.0);
   vec3 architecturalColor = vec3(0.94, 0.97, 1.0);
   vLight = mix(vLight, blueprintLight, constructed);
   // Unassembled particles remain visible: the drawing is made by their arrival.
   vColor = mix(vColor, architecturalColor, constructed);
   vNeuralFocus *= 1.0 - constructed;
   vPulse *= 1.0 - constructed;
   // Extra samples add neural detail only; preserve the original brain and project density.
   vLight *= mix(1.0, 0.55, synapseMix * (1.0 - projectMix) * (1.0 - aFree));
   if (aDetail > 1.5) vLight *= synapseMix * (1.0 - projectMix);
   vLight *= 1.0 - smoothstep(0.84, 0.865, uScroll) * uVideoReady * (1.0 - aFree);
 }
`;

const fragmentShader = `
 precision highp float;
 varying vec3 vColor;
 varying float vLight;
 varying float vStar;
 varying float vSparkle;
 varying float vSynapse;
 varying float vNeuralFocus;
 varying float vPulse;
 varying float vConstruction;

 void main() {
   vec2 uv = gl_PointCoord - 0.5;
   float r2 = dot(uv, uv);
   float core = exp(-r2 * mix(850.0, 310.0, vStar));
   float inner = exp(-r2 * mix(200.0, 90.0, vStar)) * mix(0.25, 0.2, vStar);
   float halo = exp(-r2 * 26.0) * 0.055 * vStar;
   float rays = (
     exp(-abs(uv.x) * 170.0 - abs(uv.y) * 13.0) +
     exp(-abs(uv.y) * 170.0 - abs(uv.x) * 13.0)
   ) * 0.18 * vSparkle;
   float neuralCore = exp(-r2 * mix(mix(240.0, 170.0, vConstruction), 85.0, vNeuralFocus));
   float neuralHalo = exp(-r2 * 28.0) * (0.045 + vPulse * 0.075);
   float neuralLight = (neuralCore + neuralHalo) * mix(1.0, 0.42, vNeuralFocus);
   float alpha = mix(core + inner + halo + rays, neuralLight, vSynapse) * vLight;
   if (alpha < 0.0003) discard;
   gl_FragColor = vec4(mix(vColor, vec3(1.0), core * mix(0.6, 0.18, vSynapse)), alpha);
 }
`;

function getAmbientStarCount(width: number, height: number) {
  const count = Math.round(Math.min(1800, Math.max(480, (width * height) / 700)));
  return Math.round(count * 0.77);
}

export default function AstraField({ scrollProgress = 0, videoReady = false }: { scrollProgress?: number; videoReady?: boolean }) {
  const hostRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef(scrollProgress);
  const videoReadyRef = useRef(videoReady);
  useEffect(() => { videoReadyRef.current = videoReady; }, [videoReady]);

  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let renderer: WebGLRenderer;

    try {
      renderer = new WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: 'high-performance',
      });
    } catch {
      host.dataset.failed = 'true';
      return;
    }

    host.dataset.failed = 'false';
    renderer.setClearColor(0, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(28.072486, 1, 0.1, 20);
    const galaxy = new Group();
    camera.position.z = 2;
    scene.add(galaxy);

    let seed = 601;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const positions: number[] = [];
    const origins: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    const lights: number[] = [];
    const phases: number[] = [];
    const free: number[] = [];
    const details: number[] = [];
    const brains: number[] = [];
    const brainShades: number[] = [];
    const synapses: number[] = [];
    const releases: number[] = [];
    const plans: number[] = [];
    const buildings: number[] = [];
    const buildingKinds: number[] = [];
    const signals: number[] = [];
    const kinds: number[] = [];
    const totalCount = MORPH_COUNT + MAX_AMBIENT_STARS;
    const synapseParticles = buildSynapseParticles(MORPH_COUNT, random);
    const projectParticles = buildBlueprintParticles(BASE_MORPH_COUNT, random);

    for (let i = 0; i < totalCount; i++) {
      const ambient = i >= MORPH_COUNT;
      const detail = i >= logoPoints.length && !ambient;
      const project = ambient ? null : projectParticles[i % BASE_MORPH_COUNT];
      plans.push(project?.plan.x ?? 0, project?.plan.y ?? 0, project?.plan.z ?? 0, project?.phase ?? 0);
      buildings.push(project?.built.x ?? 0, project?.built.y ?? 0, project?.built.z ?? 0, project?.shade ?? 0);
      buildingKinds.push(project?.kind ?? 0, project?.draw ?? 0);
      const sourceIndex = i % logoPoints.length;
      const point = ambient ? [0, 0, 0] : logoPoints[sourceIndex];
      const scatter = ambient ? 0 : random() < 0.28 ? 0.12 : 0.035;
      positions.push(
        point[0] + (random() - 0.5) * scatter,
        point[1] + (random() - 0.5) * scatter,
        (random() - 0.5) * 0.09,
      );
      origins.push(
        (random() - 0.5) * (ambient ? 1.1 : 1.7),
        (random() - 0.5) * (ambient ? 1.1 : 1.3),
        (random() - 0.5) * 1.35,
      );

      const heat = random();
      colors.push(
        ...(heat < 0.65
          ? [0.94, 0.95, 1]
          : heat < 0.85
            ? [0.64, 0.82, 1]
            : [1, 0.8, 0.59]),
      );
      const bright = random();
      sizes.push(
        ambient
          ? bright > 0.97
            ? 26 + random() * 10
            : bright > 0.78
              ? 12 + random() * 6
              : 5 + random() * 6
          : bright > 0.993
            ? 58
            : bright > 0.94
              ? 28
              : 7 + random() * 10,
      );
      lights.push(ambient ? 0.38 + random() * 0.48 : 0.32 + random() * 0.4);
      phases.push(random() * Math.PI * 2);
      free.push(ambient ? 1 : 0);
      details.push(!ambient && i >= BASE_MORPH_COUNT ? 2 : detail ? 1 : 0);
      if (ambient) {
        brains.push(0, 0, 0);
        brainShades.push(0);
      } else {
        const brain = brainPoints[i % BASE_MORPH_COUNT];
        brains.push(brain[0], brain[1], brain[2]);
        brainShades.push(brain[3]);
      }
      if (ambient) {
        synapses.push(0, 0, 0, 0);
        releases.push(0, 0, 0);
        signals.push(2);
        kinds.push(0);
      } else {
        const synapse = synapseParticles[i];
        synapses.push(synapse.point.x, synapse.point.y, synapse.point.z, synapse.shade);
        releases.push(synapse.release.x, synapse.release.y, synapse.release.z);
        signals.push(synapse.signal);
        kinds.push(synapse.kind);
      }
    }

    const styles: number[] = [];
    const morphs: number[] = [];
    for (let i = 0; i < totalCount; i++) {
      styles.push(sizes[i], lights[i], phases[i], kinds[i]);
      morphs.push(free[i], details[i], brainShades[i], signals[i]);
    }

    const geometry = new BufferGeometry();
    for (const [name, array, size] of [
      ['position', positions, 3],
      ['aOrigin', origins, 3],
      ['aColor', colors, 3],
      ['aStyle', styles, 4],
      ['aMorph', morphs, 4],
      ['aBrain', brains, 3],
      ['aSynapse', synapses, 4],
      ['aRelease', releases, 3],
      ['aPlan', plans, 4],
      ['aBuilding', buildings, 4],
      ['aArchitecture', buildingKinds, 2],
    ] as [string, number[], number][]) {
      geometry.setAttribute(name, new Float32BufferAttribute(array, size));
    }

    const offsets = new Float32Array(totalCount * 2);
    const velocities = new Float32Array(logoPoints.length * 2);
    const offsetAttribute = new Float32BufferAttribute(offsets, 2);
    offsetAttribute.setUsage(DynamicDrawUsage);
    geometry.setAttribute('aOffset', offsetAttribute);

    let fieldWidth = 64;
    const fieldHeight = 40;
    let fieldData = new Float32Array(fieldWidth * fieldHeight * 4);
    let fieldVelocity = new Float32Array(fieldWidth * fieldHeight * 2);
    const makeFieldTexture = (data: Float32Array, width: number) => {
      const texture = new DataTexture(data, width, fieldHeight, RGBAFormat, FloatType);
      texture.magFilter = NearestFilter;
      texture.minFilter = NearestFilter;
      texture.wrapS = ClampToEdgeWrapping;
      texture.wrapT = ClampToEdgeWrapping;
      texture.generateMipmaps = false;
      texture.needsUpdate = true;
      return texture;
    };
    let springTexture = makeFieldTexture(fieldData, fieldWidth);

    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uDpr: { value: renderer.getPixelRatio() },
        uPixelScale: { value: 1 },
        uLogoScale: { value: 1 },
        uAspect: { value: 1 },
        uCompact: { value: 0 },
        uReduced: { value: media.matches ? 1 : 0 },
        uScroll: { value: 0 },
        uVideoReady: { value: 0 },
        uSpringField: { value: springTexture },
        uFieldSize: { value: new Vector2(fieldWidth, fieldHeight) },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
    });

    const field = new Points(geometry, material);
    field.frustumCulled = false;
    galaxy.add(field);

    let frame = 0;
    let time = 0;
    let last = 0;
    let dragging = false;
    let pointerId: number | null = null;
    let lastX = 0;
    let lastY = 0;
    let targetX = 0;
    let targetY = 0;
    let vx = 0;
    let vy = 0;
    let lastMove = 0;
    let pointerActive = false;
    let springsMoving = false;
    let fieldMoving = false;
    const pointer = new Vector2(-10, -10);
    const smoothPointer = new Vector2(-10, -10);
    const previousPointer = new Vector2(-10, -10);
    const interactionAvailable = () =>
      !(videoReadyRef.current && scrollRef.current >= 0.84);

    const locate = (event: PointerEvent) => {
      const bounds = host.getBoundingClientRect();
      if (
        event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom
      ) {
        pointerActive = false;
        return;
      }
      pointer.set(
        ((event.clientX - bounds.left) / Math.max(1, bounds.width) - 0.5) * camera.aspect,
        0.5 - (event.clientY - bounds.top) / Math.max(1, bounds.height),
      );
      if (!pointerActive) {
        smoothPointer.copy(pointer);
        previousPointer.copy(pointer);
      }
      pointerActive = true;
    };

    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      geometry.setDrawRange(
        0,
        MORPH_COUNT + getAmbientStarCount(width, height),
      );
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      const nextFieldWidth = Math.min(96, Math.max(32, Math.round((camera.aspect + 0.2) * 40)));
      if (nextFieldWidth !== fieldWidth) {
        springTexture.dispose();
        fieldWidth = nextFieldWidth;
        fieldData = new Float32Array(fieldWidth * fieldHeight * 4);
        fieldVelocity = new Float32Array(fieldWidth * fieldHeight * 2);
        springTexture = makeFieldTexture(fieldData, fieldWidth);
        material.uniforms.uSpringField.value = springTexture;
        material.uniforms.uFieldSize.value.set(fieldWidth, fieldHeight);
        fieldMoving = false;
      }
      material.uniforms.uAspect.value = camera.aspect;
      material.uniforms.uCompact.value = width <= 600 ? 1 : 0;
      material.uniforms.uLogoScale.value = Math.min(
        1,
        (camera.aspect * 0.84) / 0.82,
      );
      material.uniforms.uPixelScale.value = Math.max(
        0.65,
        Math.min(1.3, height / 720),
      );
    };

    window.addEventListener('resize', resize);
    resize();

    const render = (now: number) => {
      frame = requestAnimationFrame(render);
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      if (document.hidden) return;

      time += dt * ANIMATION_SPEED;
      // Once the visitor enters the story, returning to the top must restore
      // the completed monogram even if the opening assembly was interrupted.
      if (scrollRef.current > 0.025) time = Math.max(time, 10);
      material.uniforms.uTime.value = media.matches ? 10 : time;
      material.uniforms.uReduced.value = media.matches ? 1 : 0;
      material.uniforms.uScroll.value = scrollRef.current;
      material.uniforms.uVideoReady.value = videoReadyRef.current ? 1 : 0;
      if (!interactionAvailable()) {
        pointerActive = false;
        if (dragging) {
          dragging = false;
          if (pointerId !== null && host.hasPointerCapture(pointerId))
            host.releasePointerCapture(pointerId);
          pointerId = null;
          host.dataset.dragging = 'false';
          vx = vy = 0;
        }
      }
      const damping = 1 - Math.exp(-14 * dt);
      smoothPointer.lerp(pointer, damping);

      if (!dragging) {
        targetY += vx * dt;
        targetX += vy * dt;
        vx *= Math.exp(-3.2 * dt);
        vy *= Math.exp(-3.2 * dt);
        const returnDamping = 1 - Math.exp(-1.6 * dt);
        targetX += -targetX * returnDamping;
        targetY += -targetY * returnDamping;
      }
      const videoSettle = videoReadyRef.current
        ? Math.max(0, Math.min(1, (scrollRef.current - 0.83) / 0.01))
        : 0;
      const xLimit = 1.20 * (1 - videoSettle);
      const yLimit = 2.40 * (1 - videoSettle);
      targetX = Math.max(-xLimit, Math.min(xLimit, targetX));
      targetY = Math.max(-yLimit, Math.min(yLimit, targetY));

      const follow = media.matches ? 1 : 1 - Math.exp(-10 * dt);
      const idle = media.matches ? 0 : Math.sin(time * 0.32) * 0.028;
      galaxy.rotation.y += ((targetY + idle * (1 - videoSettle)) - galaxy.rotation.y) * follow;
      galaxy.rotation.x += (targetX - galaxy.rotation.x) * follow;
      // Complete the return even on a fast scroll into the aligned video frame.
      galaxy.rotation.x *= 1 - videoSettle;
      galaxy.rotation.y *= 1 - videoSettle;
      galaxy.updateMatrixWorld();

      const matrix = galaxy.matrixWorld.elements;
      const mx = (smoothPointer.x - previousPointer.x) / Math.max(dt, 0.001);
      const my = (smoothPointer.y - previousPointer.y) / Math.max(dt, 0.001);
      const speed = Math.hypot(mx, my);
      const limit = Math.min(1, 1.5 / Math.max(speed, 0.001));
      const strength = (media.matches ? 0.25 : 1) * (1 - videoSettle);
      const scale = material.uniforms.uLogoScale.value;

      // Keep the original GM particles on their individual CPU springs.
      const scroll = scrollRef.current;
      let gmDirty = false;
      if (scroll >= 0.025 && springsMoving) {
        offsets.fill(0, 0, logoPoints.length * 2);
        velocities.fill(0);
        springsMoving = false;
        gmDirty = true;
      }
      if (scroll < 0.025 && (pointerActive || springsMoving)) {
        let nextSpringsMoving = false;
        const steps = Math.max(1, Math.ceil(dt * 120));
        const stepTime = dt / steps;
        for (let i = 0; i < logoPoints.length; i++) {
          const j = i * 2;
          const k = i * 3;
          const wx = positions[k] * scale;
          const wy = positions[k + 1] * scale;
          const wz = positions[k + 2] * scale;
          const rx = matrix[0] * wx + matrix[4] * wy + matrix[8] * wz;
          const ry = matrix[1] * wx + matrix[5] * wy + matrix[9] * wz;
          const rz = matrix[2] * wx + matrix[6] * wy + matrix[10] * wz;
          const depth = 2 / (2 - rz);
          const dx = rx * depth + offsets[j] - smoothPointer.x;
          const dy = ry * depth + offsets[j + 1] - smoothPointer.y;
          const radius = Math.hypot(dx, dy);
          const weight = pointerActive && scroll < 0.02 && (time > 4 || media.matches)
            ? Math.pow(Math.max(0, 1 - radius / 0.17), 2) * strength
            : 0;
          const radial = dragging ? -18 : 0.6 / Math.max(radius, 0.008);
          const fx = (mx * limit * 14 + dx * radial) * weight;
          const fy = (my * limit * 14 + dy * radial) * weight;
          for (let step = 0; step < steps; step++) {
            velocities[j] += (fx - offsets[j] * 32 - velocities[j] * 8) * stepTime;
            velocities[j + 1] += (fy - offsets[j + 1] * 32 - velocities[j + 1] * 8) * stepTime;
            offsets[j] += velocities[j] * stepTime;
            offsets[j + 1] += velocities[j + 1] * stepTime;
          }
          const excursion = Math.hypot(offsets[j], offsets[j + 1]);
          if (excursion > 0.085) {
            offsets[j] *= 0.085 / excursion;
            offsets[j + 1] *= 0.085 / excursion;
            velocities[j] *= 0.8;
            velocities[j + 1] *= 0.8;
          }
          if (Math.abs(offsets[j]) + Math.abs(offsets[j + 1]) +
            Math.abs(velocities[j]) + Math.abs(velocities[j + 1]) > 0.0001) {
            nextSpringsMoving = true;
          } else {
            offsets[j] = offsets[j + 1] = velocities[j] = velocities[j + 1] = 0;
          }
        }
        gmDirty = true;
        springsMoving = nextSpringsMoving;
      }
      if (gmDirty) {
        offsetAttribute.array.set(offsets.subarray(0, logoPoints.length * 2));
        offsetAttribute.addUpdateRange(0, logoPoints.length * 2);
        offsetAttribute.needsUpdate = true;
      }

      // A compact screen-space spring field drives all later constructions.
      // The shader samples this at each star's current projected position.
      const fieldForces = pointerActive && interactionAvailable() && scroll >= 0.02;
      let nextFieldMoving = false;
      if (fieldForces || fieldMoving) {
        const steps = Math.max(1, Math.ceil(dt * 120));
        const stepTime = dt / steps;
        const fieldStrength = strength;
        for (let y = 0; y < fieldHeight; y++) {
          const cellY = ((y + 0.5) / fieldHeight) * 1.2 - 0.6;
          for (let x = 0; x < fieldWidth; x++) {
            const cell = y * fieldWidth + x;
            const j = cell * 2;
            const k = cell * 4;
            if (!fieldForces && fieldData[k] === 0 && fieldData[k + 1] === 0 &&
              fieldVelocity[j] === 0 && fieldVelocity[j + 1] === 0) continue;
            const cellX = ((x + 0.5) / fieldWidth) * (camera.aspect + 0.2)
              - camera.aspect * 0.5 - 0.1;
            const dx = cellX + fieldData[k] - smoothPointer.x;
            const dy = cellY + fieldData[k + 1] - smoothPointer.y;
            const radius = Math.hypot(dx, dy);
            const weight = fieldForces
              ? Math.pow(Math.max(0, 1 - radius / 0.17), 2) * fieldStrength
              : 0;
            const radial = dragging ? -18 : 0.6 / Math.max(radius, 0.008);
            const fx = (mx * limit * 14 + dx * radial) * weight;
            const fy = (my * limit * 14 + dy * radial) * weight;
            for (let step = 0; step < steps; step++) {
              fieldVelocity[j] += (fx - fieldData[k] * 32 - fieldVelocity[j] * 8) * stepTime;
              fieldVelocity[j + 1] += (fy - fieldData[k + 1] * 32 - fieldVelocity[j + 1] * 8) * stepTime;
              fieldData[k] += fieldVelocity[j] * stepTime;
              fieldData[k + 1] += fieldVelocity[j + 1] * stepTime;
            }
            const excursion = Math.hypot(fieldData[k], fieldData[k + 1]);
            if (excursion > 0.085) {
              fieldData[k] *= 0.085 / excursion;
              fieldData[k + 1] *= 0.085 / excursion;
              fieldVelocity[j] *= 0.8;
              fieldVelocity[j + 1] *= 0.8;
            }
            if (Math.abs(fieldData[k]) + Math.abs(fieldData[k + 1]) +
              Math.abs(fieldVelocity[j]) + Math.abs(fieldVelocity[j + 1]) > 0.0001) {
              nextFieldMoving = true;
            } else {
              fieldData[k] = fieldData[k + 1] = fieldVelocity[j] = fieldVelocity[j + 1] = 0;
            }
          }
        }
        springTexture.needsUpdate = true;
      }
      fieldMoving = nextFieldMoving;
      previousPointer.copy(smoothPointer);
      renderer.render(scene, camera);
    };

    const down = (event: PointerEvent) => {
      if (!interactionAvailable() || event.pointerType === 'touch') return;
      if (!event.isPrimary || event.button !== 0 || pointerId !== null) return;
      locate(event);
      dragging = true;
      pointerId = event.pointerId;
      lastX = event.clientX;
      lastY = event.clientY;
      lastMove = event.timeStamp;
      vx = vy = 0;
      host.dataset.dragging = 'true';
      host.setPointerCapture(event.pointerId);
    };

    const move = (event: PointerEvent) => {
      if (!interactionAvailable() || event.pointerType === 'touch') return;
      if (!event.isPrimary || (pointerId !== null && event.pointerId !== pointerId))
        return;
      locate(event);
      if (!dragging) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      const dt = Math.max(0.008, (event.timeStamp - lastMove) / 1000);
      targetY += dx * 0.0016;
      targetX += dy * 0.0016;
      vx = Math.max(-1, Math.min(1, (dx * 0.0016) / dt));
      vy = Math.max(-0.7, Math.min(0.7, (dy * 0.0016) / dt));
      lastX = event.clientX;
      lastY = event.clientY;
      lastMove = event.timeStamp;
    };

    const up = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      dragging = false;
      pointerId = null;
      host.dataset.dragging = 'false';
      if (event.type !== 'pointerup' || event.timeStamp - lastMove > 80) vx = vy = 0;
      if (event.pointerType !== 'mouse') pointerActive = false;
      if (host.hasPointerCapture(event.pointerId))
        host.releasePointerCapture(event.pointerId);
    };

    const leave = () => {
      if (!dragging) pointerActive = false;
    };

    const blur = () => {
      dragging = false;
      pointerId = null;
      vx = vy = 0;
      pointerActive = false;
      host.dataset.dragging = 'false';
    };

    const key = (event: KeyboardEvent) => {
      if (!interactionAvailable() || !['ArrowLeft', 'ArrowRight', 'r', 'R'].includes(event.key))
        return;
      event.preventDefault();
      vx = vy = 0;
      pointerActive = false;
      if (event.key.toLowerCase() === 'r') {
        targetX = targetY = 0;
        offsets.fill(0);
        velocities.fill(0);
        springsMoving = false;
        offsetAttribute.array.fill(0, 0, logoPoints.length * 2);
        offsetAttribute.addUpdateRange(0, logoPoints.length * 2);
        offsetAttribute.needsUpdate = true;
        fieldData.fill(0);
        fieldVelocity.fill(0);
        fieldMoving = false;
        springTexture.needsUpdate = true;
      }
      if (event.key === 'ArrowRight') targetY += 0.06;
      if (event.key === 'ArrowLeft') targetY -= 0.06;
    };

    const contextLost = (event: Event) => {
      event.preventDefault();
      host.dataset.failed = 'true';
    };

    host.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    host.addEventListener('lostpointercapture', up);
    host.addEventListener('pointerleave', leave);
    host.addEventListener('keydown', key);
    host.addEventListener('blur', blur);
    window.addEventListener('blur', blur);
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      host.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      host.removeEventListener('lostpointercapture', up);
      host.removeEventListener('pointerleave', leave);
      host.removeEventListener('keydown', key);
      host.removeEventListener('blur', blur);
      window.removeEventListener('blur', blur);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      geometry.dispose();
      material.dispose();
      springTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <button
      ref={hostRef}
      className="starfield"
      type="button"
      aria-label="Costruzioni di particelle GM, cervello, connessioni neurali e progetto interattive. Trascina o usa le frecce laterali per ruotarle, R per ripristinare. Scorri per seguire la trasformazione."
      data-dragging="false"
    >
      <span className="webgl-error">
        WebGL non disponibile. Abilita l’accelerazione grafica del browser per
        vedere il monogramma stellare.
      </span>
    </button>
  );
}

