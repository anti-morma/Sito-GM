'use client';

import { useEffect, useRef, type RefObject } from 'react';
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
import { buildBrainVolume } from './brain-volume';
import { springStep } from './gesture-spring';

const ANIMATION_SPEED = 1.25;
// The background stars now live in the site-wide sky (star-sky.tsx).
const MAX_AMBIENT_STARS = 0;
const BASE_MORPH_COUNT = brainPoints.length;
const NEURAL_COUNT = BASE_MORPH_COUNT * 3;
const MORPH_COUNT = BASE_MORPH_COUNT * 5;

const vertexShader = `
 attribute vec3 aOrigin;
 attribute vec3 aColor;
 attribute vec4 aStyle;
 attribute vec4 aMorph;
 attribute vec3 aBrain;
 attribute vec4 aBrainNormal;
 attribute vec4 aSynapse;
 attribute vec3 aRelease;
 attribute vec4 aPlan;
 attribute vec4 aBuilding;
 attribute vec2 aArchitecture;
 #define aBuildingKind aArchitecture.x
 #define aDrawOrder aArchitecture.y
 attribute vec2 aOffset;
 // Role in the GM monogram: 2 outline, 1 fill, 0 dust, -1 not part of it.
 attribute float aGlyph;
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
 uniform float uBrainTurn;
 uniform float uDpr;
 uniform float uPixelScale;
 uniform float uLogoScale;
 uniform vec2 uHeroOffset;
 uniform float uAspect;
 uniform float uCompact;
 uniform float uReduced;
 uniform float uScroll;
 uniform float uVideoReady;
 uniform float uCamDist;
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
 varying float vSpriteCrop;

 void main() {
   float t = clamp((uTime * 1.33 - 0.8 - aPhase * 0.12) / 4.8, 0.0, 1.0);
   float ordered = t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
   ordered = mix(ordered, 1.0, max(uReduced, smoothstep(0.0, 0.025, uScroll)));
   float motion = 1.0 - uReduced;

   float travel = 1.0 - uReduced;
   // The GM flows straight into the brain from the first scroll: no empty sky between them.
   float gather = smoothstep(0.02, 0.34, uScroll);
   #ifdef BRAIN_PASS
   // These blends are exactly zero through scroll 0.47. Constants let the
   // compiler remove the later scenes and their vertex attributes entirely.
   float zoomIn = 0.0;
   float synapseMix = 0.0;
   float projectMix = 0.0;
   #else
   float zoomIn = smoothstep(0.47, 0.56, uScroll);
   float synapseMix = smoothstep(0.48, 0.58, uScroll);
   float projectMix = smoothstep(0.775, 0.815, uScroll);
   #endif
   // The brain is the protagonist: centred and large, a little bigger on
   // narrow screens where it has the whole width to itself.
   float brainScale = min(1.12, uAspect * mix(0.65, 0.9, uCompact));
   vec3 brain = aBrain * brainScale;
   vec2 center = vec2(0.0, 0.035);
   vec2 brainOverview = brain.xy + center;
   // Front stars stay on the camera ray through their reference position, so
   // the resting view matches the original drawing exactly.
   brainOverview *= (2.0 - brain.z) / (2.0 - aBrainNormal.w * brainScale);
   mat3 brainRotation = mat3(
     cos(uBrainTurn), 0.0, -sin(uBrainTurn),
     0.0, 1.0, 0.0,
     sin(uBrainTurn), 0.0, cos(uBrainTurn)
   );
   vec3 brainPivot = vec3(center, -0.12 * brainScale);
   vec3 turnedBrain = brainPivot + brainRotation * (vec3(brainOverview, brain.z) - brainPivot);
   vec2 brainCloseup = (aBrain.xy - vec2(0.21, 0.055)) * brainScale * 4.0;
   brain.xy = mix(turnedBrain.xy, brainCloseup, zoomIn);
   brain.z = mix(turnedBrain.z, brain.z, zoomIn);
   brain.y -= (1.0 - gather) * 0.12 * travel;
   float synapseScale = min(0.82, uAspect * 0.70);
   // The impulse bursts out of the central soma, then eases through the
   // outer dendrites. Its position still follows scroll in both directions.
   float impulseTime = clamp((uScroll - 0.58) / 0.17, 0.0, 1.0);
   float signalHead = 1.02 * (1.0 - pow(1.0 - impulseTime, 2.4));
   float activeRoute = 1.0 - step(1.5, aSignal);
   float pulseDistance = signalHead - aSignal;
   float pulseFront = exp(-pow(pulseDistance * 18.0, 2.0));
   float pulseTail = exp(-max(pulseDistance, 0.0) * 6.0)
     * smoothstep(0.0, 0.04, pulseDistance);
   float pulse = (pulseFront * 1.1 + pulseTail * 0.3)
     * activeRoute * synapseMix * (1.0 - aFree);
   vec3 synapse = aSynapse.xyz * synapseScale;
   float releaseProgress = smoothstep(aSignal - 0.015, aSignal + 0.11, signalHead);
   if (aKind > 1.5 && aKind < 2.5) {
     synapse = mix(synapse, aRelease * synapseScale, releaseProgress);
   }
   // A small scroll-driven camera arc reveals the depth of the same particle volume.
   float neuralTurn = (smoothstep(0.54, 0.75, uScroll) - 0.5) * 0.30 * motion;
   synapse.xz = mat2(cos(neuralTurn), -sin(neuralTurn), sin(neuralTurn), cos(neuralTurn)) * synapse.xz;
   // Match the CSS video rectangle exactly, with no tilt during the crossfade.
   float videoSettle = smoothstep(0.862, 0.888, uScroll); // keep in sync with method-story.tsx
   float frameWidth = mix(0.80 - videoSettle * 0.28, 0.86, uCompact);
   vec3 project = vec3(aPlan.x, -aPlan.z, 0.0) * uAspect * frameWidth;
   project.xy += vec2(mix(-uAspect * videoSettle * 0.20, 0.0, uCompact), -0.05 * uCompact);
   // Layered relief while drawing; flattens before the video so the crossfade stays exact.
   project.z = aOrigin.z * 0.12 * (1.0 - smoothstep(0.815, 0.845, uScroll));
   // Scatter first, then gather each group of stars into the progressive drawing.
   #ifdef BRAIN_PASS
   float scatter = 0.0;
   #else
   float scatter = smoothstep(0.745, 0.775, uScroll) * motion;
   #endif
   vec3 loose = vec3(aOrigin.x * uAspect * 1.45, aOrigin.y * 1.35 - 0.18, aOrigin.z * 0.6);
   loose.xy += vec2(sin(aPhase * 2.7), cos(aPhase * 1.9)) * 0.18 * motion;
   synapse = mix(synapse, loose, scatter);
   float assemble = smoothstep(0.775 + aDrawOrder * 0.037, 0.797 + aDrawOrder * 0.037, uScroll);
   synapse = mix(synapse, project, assemble);
   vec3 logo = position * uLogoScale;
   logo.xy += uHeroOffset;
   // Respond from the first scroll pixel. The GM's own stars fly into the brain
   // along a slight arc; every other star of the brain condenses in place from a
   // loose halo while it fades in, so the brain takes shape right after the GM.
   logo.y += uScroll * 1.5 * travel;
   float condense = 1.0 - smoothstep(0.02, 0.22, uScroll);
   vec3 halo = brain + vec3(aOrigin.x * uAspect, aOrigin.y, aOrigin.z) * 0.14 * condense * travel;
   vec3 target = mix(halo, logo, step(-0.5, aGlyph));
   target = mix(target, brain, gather);
   target += vec3(aOrigin.x * uAspect, aOrigin.y, aOrigin.z) * sin(3.14159 * gather) * 0.16 * travel * step(-0.5, aGlyph);
   target = mix(target, synapse, synapseMix);
   if (uReduced > 0.5 && uScroll < 0.025) target = position * uLogoScale + vec3(uHeroOffset, 0.0);
   // Kept tiny while the GM is formed, so the outline of the letters stays sharp.
   float glyph = step(-0.5, aGlyph) * (1.0 - smoothstep(0.0, 0.1, uScroll));
   float orbit = mix(mix(0.015, 0.005, glyph), 0.0012, gather) * motion * (1.0 - projectMix);
   target += vec3(
     sin(uTime * 0.7 + aPhase),
     cos(uTime * 0.55 + aPhase * 1.7),
     sin(uTime * 0.42 + aPhase)
   ) * orbit;
   target.y += sin(position.x * 18.0 + uTime * 0.65) * mix(0.006, 0.0025, glyph) * motion * (1.0 - gather);

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
   // Touch screens do not use particle gestures, so skip the spring texture
   // and its four samples for every point of the GM-to-brain transition.
   vec2 displacement = vec2(0.0);
   #ifndef MOBILE
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
     displacement = mix(aOffset, fieldOffset, fieldBlend) * (1.0 - aFree)
       * (1.0 - smoothstep(0.83, 0.84, uScroll) * uVideoReady);
   #endif
   float influence = min(length(displacement) * 3.0, 0.2);
   mv.xy += displacement * (-mv.z / 2.0);

   gl_Position = projectionMatrix * mv;
   // Aerial perspective relative to the camera focus: nearer stars brighter, farther dimmer.
   float viewDist = max(0.001, -mv.z);
   float depthCue = clamp(pow(uCamDist / viewDist, mix(1.6, 0.8, aFree)), 0.4, 1.8);
   float nearFade = smoothstep(0.12, 0.45, viewDist);
   float depth = clamp(2.0 / -mv.z, 0.35, 2.5);
   float anatomy = gather * (1.0 - synapseMix) * (1.0 - aFree);
   // Opaque-looking brain: hide the surface turned away from the camera.
   float brainShell = step(0.25, dot(aBrainNormal.xyz, aBrainNormal.xyz));
   float brainBack = step(1.5, aDetail) * brainShell;
   vec3 brainNormal = normalize(mat3(modelViewMatrix) * brainRotation * (aBrainNormal.xyz + vec3(0.0, 0.0, 1e-4)));
   float facing = dot(brainNormal, normalize(-mv.xyz));
   // Reference stars on the near rim crowd into a seam when seen edge-on: soften
   // them only once rotation turns them towards the camera (never at rest).
   float rimSeam = (1.0 - smoothstep(0.0, 0.35, abs(aBrainNormal.z))) * smoothstep(0.2, 0.7, facing);
   // Seen edge-on the near face collapses into a bright line; fade it only while
   // the brain is turned away from its resting pose.
   float brainTurned = smoothstep(0.02, 0.25, 1.0 - normalize(mat3(modelViewMatrix) * brainRotation * vec3(0.0, 0.0, 1.0)).z);
   float nearVisible = mix(smoothstep(-0.3, 0.0, facing), smoothstep(-0.05, 0.3, facing), brainTurned);
   float brainVisible = mix(nearVisible * (1.0 - 0.25 * rimSeam), smoothstep(-0.08, 0.22, facing), brainBack);
   float renderedSize = mix(aSize, 7.5 + aBrainShade * 6.5, anatomy);
   // Neural close-up roles (see NEURAL_KIND): membrane, cell body, warm light, far network.
   float isSoma = step(0.5, aKind) * step(aKind, 1.5);
   float isGlow = step(1.5, aKind) * step(aKind, 2.5);
   float isDistant = step(2.5, aKind);
   // Shallow depth of field: the central cell is sharp, the rest melts into bokeh.
   float focusBlur = smoothstep(0.125, 0.575, abs(aSynapse.z));
   float synapseSize = mix(mix(mix(7.0, 8.0, isSoma), 12.0, isGlow), 7.5, isDistant);
   synapseSize *= mix(1.0, 1.725, focusBlur);
   synapseSize *= clamp(pow(synapseScale / 0.84, 0.2), 0.8, 1.0);
   renderedSize = mix(renderedSize, synapseSize, synapseMix * (1.0 - aFree));
   renderedSize = mix(renderedSize, 6.5, projectMix * (1.0 - aFree));
   renderedSize *= 1.0 + pulse * 0.18 * (1.0 - isGlow) * (1.0 - isDistant);
   // Hero only: a quieter sky so no background star competes with the copy.
   // It lifts before the brain arrives, leaving the later sections untouched.
   float heroCalm = (1.0 - smoothstep(0.03, 0.14, uScroll)) * aFree;
   float heroHidden = heroCalm * step(fract(aPhase * 7.13), 0.42);
   renderedSize *= mix(1.0, 0.68 - 0.18 * smoothstep(20.0, 30.0, aSize), heroCalm);
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
   float reached = smoothstep(aSignal - 0.025, aSignal + 0.025, signalHead);
   float lit = activeRoute * reached * synapseMix * (1.0 - aFree);
   vLight = aLight * mix(shimmer, 1.0, uReduced) + influence * 0.12;
   vLight = mix(vLight, 0.035 + aBrainShade * aBrainShade * 1.6, anatomy);
   vLight *= mix(1.0, clamp(pow(brainScale / 1.18, 0.8), 0.30, 1.0), anatomy);
   // Dark translucent membranes catch light only at their edges; warm light
   // ignites inside the cells and along the fibres as the impulse arrives.
   float ignite = smoothstep(aSignal - 0.02, aSignal + 0.09, signalHead) * activeRoute;
   float membrane = mix(0.07 + 1.05 * pow(aShade, 2.2), 0.08 + 1.1 * pow(aShade, 2.0), isSoma);
   float glowLight = (mix(0.07, 0.56 + 0.26 * aShade, ignite) + pulse * 0.34)
     * (0.96 + 0.04 * sin(uTime * 0.9 + aPhase * 5.0) * motion);
   float shellLight = mix(membrane + lit * 0.08 + pulse * 0.43, glowLight, isGlow);
   shellLight = mix(shellLight, 0.05 + 0.1 * aShade, isDistant);
   shellLight *= mix(1.0, 0.42, focusBlur);
   vLight = mix(vLight, shellLight, synapseMix * (1.0 - aFree));
   // Once the network releases, its points read as individual stars rather
   // than the deliberately dim fibres and membranes of the neural scene.
   vLight = mix(vLight, max(0.22, aLight * 0.8), scatter * (1.0 - aFree));
   vLight *= mix(1.0, 0.24, gather * aFree);
   float synapseDensity = clamp(pow(synapseScale / 0.84, 0.60), 0.60, 1.0);
   vLight *= mix(1.0, synapseDensity, synapseMix * (1.0 - aFree));
   vLight *= 1.0 - min(aDetail, 1.0) * (1.0 - gather);
   vec3 fiberColor = mix(vec3(0.34, 0.33, 0.44), vec3(0.8, 0.82, 0.94), aShade);
   vec3 somaColor = mix(vec3(0.24, 0.2, 0.32), vec3(0.86, 0.84, 0.96), aShade);
   // Brand champagne rather than amber: the light reads as intention, not alarm.
   vec3 warmLight = vec3(0.9, 0.8, 0.6);
   vec3 glowColor = mix(warmLight, vec3(1.0, 0.95, 0.84), aShade * 0.6);
   vec3 synapseColor = mix(fiberColor, somaColor, isSoma);
   synapseColor = mix(synapseColor, warmLight, min(1.0, lit * 0.14 + pulse * 0.7));
   synapseColor = mix(synapseColor, glowColor, isGlow);
   synapseColor = mix(synapseColor, fiberColor * 0.8, isDistant);
   vColor = mix(aColor, synapseColor, synapseMix * (1.0 - aFree));
   vColor = mix(vColor, vec3(0.78, 0.85, 1.0), scatter * (1.0 - aFree));
   vStar = max(aFree, synapseMix * (1.0 - aFree) * min(0.95, isGlow * 0.75 + pulse * 0.38));
   vStar = max(vStar, scatter * (1.0 - aFree) * 0.85);
   vSparkle = aFree * smoothstep(22.0, 34.0, aSize) * (1.0 - 0.9 * heroCalm);
   vSparkle = max(vSparkle, scatter * (1.0 - aFree) * smoothstep(22.0, 34.0, aSize) * 0.35);
   vSparkle = max(vSparkle, pulse * isGlow * 0.16);
   // The brightest stars of the GM become four-point sparkles: irregular in
   // size, colour and shape, while the outline carries the letters.
   vSparkle = max(vSparkle, glyph * smoothstep(32.0, 50.0, aSize) * 0.85);
   vSynapse = synapseMix * (1.0 - aFree) * (1.0 - 0.85 * isGlow) * (1.0 - scatter);
   #ifdef BRAIN_PASS
   vNeuralFocus = 0.0;
   #else
   vNeuralFocus = focusBlur;
   #endif
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
   vLight *= mix(1.0, 0.55, synapseMix * (1.0 - projectMix) * (1.0 - aFree) * (1.0 - scatter));
   if (aDetail > 1.5) vLight *= max(synapseMix * (1.0 - projectMix), anatomy * brainBack);
   vLight *= mix(1.0, brainVisible, anatomy * brainShell);
   vLight *= mix(1.0, 0.65, anatomy);
   // Extra surface stars belong only to the brain, not to the other forms.
   if (aDetail > 2.5) vLight *= anatomy;
   vLight *= 1.0 - smoothstep(0.84, 0.865, uScroll) * uVideoReady * (1.0 - aFree);
   vLight *= depthCue * nearFade;
   vLight *= mix(1.0, min(0.55, 0.9 / max(depthCue, 0.001)), heroCalm) * (1.0 - heroHidden);
   // Outline stars lead, the fill glows softly behind them, dust barely shows.
   vLight *= mix(1.0, aGlyph > 1.5 ? 1.04 : aGlyph > 0.5 ? 0.84 : 0.3, glyph);
   // Compact brain dots have no broad halo. Trim only transparent sprite
   // margins and remap UVs, preserving their pixel size, light and position.
   vSpriteCrop = (vStar == 0.0 && vSparkle == 0.0 && vSynapse == 0.0) ? 0.6 : 1.0;
   gl_PointSize *= vSpriteCrop;
   if (vLight <= 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
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
 varying float vSpriteCrop;

 void main() {
   vec2 uv = (gl_PointCoord - 0.5) * vSpriteCrop;
   float r2 = dot(uv, uv);
   if (vSpriteCrop < 1.0) {
     float core = exp(-r2 * 850.0);
     float alpha = (core + exp(-r2 * 200.0) * 0.25) * vLight;
     if (alpha < 0.0003) discard;
     gl_FragColor = vec4(mix(vColor, vec3(1.0), core * 0.6), alpha);
     return;
   }
   float core = exp(-r2 * mix(850.0, 310.0, vStar));
   float inner = exp(-r2 * mix(200.0, 90.0, vStar)) * mix(0.25, 0.2, vStar);
   float halo = exp(-r2 * 26.0) * 0.055 * vStar;
   float rays = (
     exp(-abs(uv.x) * 170.0 - abs(uv.y) * 13.0) +
     exp(-abs(uv.y) * 170.0 - abs(uv.x) * 13.0)
   ) * 0.18 * vSparkle;
   float neuralLight = 0.0;
   if (vSynapse > 0.0) {
     float neuralCore = exp(-r2 * mix(mix(240.0, 170.0, vConstruction), 85.0, vNeuralFocus));
     float neuralHalo = exp(-r2 * 28.0) * (0.045 + vPulse * 0.06);
     neuralLight = (neuralCore + neuralHalo) * mix(1.0, 0.42, vNeuralFocus);
   }
   float alpha = mix(core + inner + halo + rays, neuralLight, vSynapse) * vLight;
   if (alpha < 0.0003) discard;
   gl_FragColor = vec4(mix(vColor, vec3(1.0), core * mix(0.6, 0.18, vSynapse)), alpha);
 }
`;

export type ParticleFrame = { progress: number; videoReady: boolean; active: boolean };

export default function AstraField({ frameState, onFailed }: { frameState: RefObject<ParticleFrame>; onFailed?: () => void }) {
  const onFailedRef = useRef(onFailed);
  onFailedRef.current = onFailed;
  const hostRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(0);
  const videoReadyRef = useRef(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = matchMedia('(max-width: 760px), (pointer: coarse)');
    let renderer: WebGLRenderer;

    try {
      renderer = new WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: 'high-performance',
      });
    } catch {
      host.dataset.failed = 'true';
      onFailedRef.current?.();
      return;
    }

    host.dataset.failed = 'false';
    renderer.setClearColor(0, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile.matches ? 1 : 2));
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
    const brainNormals: number[] = [];
    const synapses: number[] = [];
    const releases: number[] = [];
    const plans: number[] = [];
    const buildings: number[] = [];
    const buildingKinds: number[] = [];
    const signals: number[] = [];
    const kinds: number[] = [];
    const glyphs: number[] = [];
    const totalCount = MORPH_COUNT + MAX_AMBIENT_STARS;
    const synapseParticles = buildSynapseParticles(NEURAL_COUNT, random);
    const projectParticles = buildBlueprintParticles(BASE_MORPH_COUNT, random);
    const brainVolume = buildBrainVolume(brainPoints, random);

    for (let i = 0; i < totalCount; i++) {
      const ambient = i >= MORPH_COUNT;
      const detail = i >= logoPoints.length && !ambient;
      const project = ambient ? null : projectParticles[i % BASE_MORPH_COUNT];
      plans.push(project?.plan.x ?? 0, project?.plan.y ?? 0, project?.plan.z ?? 0, project?.phase ?? 0);
      buildings.push(project?.built.x ?? 0, project?.built.y ?? 0, project?.built.z ?? 0, project?.shade ?? 0);
      buildingKinds.push(project?.kind ?? 0, project?.draw ?? 0);
      const sourceIndex = i % logoPoints.length;
      const point = ambient ? [0, 0, 0] : logoPoints[sourceIndex];
      const glyph = !ambient && i < logoPoints.length;
      // Monogram stars sit exactly on the sampled letters (see scripts/sample-gm.mjs);
      // the copies used later by the brain keep their looser cloud.
      // An irregular edge: most monogram stars stay close to the outline, a few stray further.
      const roll = ambient ? 0 : random();
      const scatter = ambient ? 0 : glyph ? 0.0075 * (1 + 3 * roll ** 3) : roll < 0.20 ? 0.075 : 0.022;
      positions.push(
        point[0] + (random() - 0.5) * scatter,
        point[1] + (random() - 0.5) * scatter,
        // Shallow depth: perspective would otherwise smear the off-centre letters.
        (random() - 0.5) * (ambient ? 0.09 : glyph ? 0.03 : 0.16),
      );
      glyphs.push(glyph ? point[2] : -1);
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
      details.push(!ambient && i >= NEURAL_COUNT ? 3 : !ambient && i >= BASE_MORPH_COUNT ? 2 : detail ? 1 : 0);
      if (ambient) {
        brains.push(0, 0, 0);
        brainShades.push(0);
        brainNormals.push(0, 0, 0, 0);
      } else {
        const brain = brainPoints[i % BASE_MORPH_COUNT];
        if (i < BASE_MORPH_COUNT) {
          // Reference star on the solid's front face; w keeps its original depth.
          const [z, nx, ny, nz] = brainVolume.front.subarray(i * 4, i * 4 + 4);
          brains.push(brain[0], brain[1], z);
          brainShades.push(brain[3]);
          brainNormals.push(nx, ny, nz, brain[2]);
        } else if (i < BASE_MORPH_COUNT * 2) {
          // Rim of the solid (top, bottom, poles), revealed by rotation.
          const k = (i - BASE_MORPH_COUNT) * 7;
          const [x, y, z, shade, nx, ny, nz] = brainVolume.rim.subarray(k, k + 7);
          brains.push(x, y, z);
          brainShades.push(shade);
          brainNormals.push(nx, ny, nz, z);
        } else if (i < NEURAL_COUNT) {
          // Far hemisphere, carrying the same reference drawing.
          const j = i - BASE_MORPH_COUNT * 2;
          const [z, nx, ny, nz] = brainVolume.far.subarray(j * 4, j * 4 + 4);
          brains.push(brain[0], brain[1], z);
          brainShades.push(brain[3]);
          brainNormals.push(nx, ny, nz, z);
        } else {
          const k = (i - NEURAL_COUNT) * 7;
          const [x, y, z, shade, nx, ny, nz] = brainVolume.fill.subarray(k, k + 7);
          brains.push(x, y, z);
          brainShades.push(shade);
          brainNormals.push(nx, ny, nz, z);
        }
      }
      if (ambient) {
        synapses.push(0, 0, 0, 0);
        releases.push(0, 0, 0);
        signals.push(2);
        kinds.push(0);
      } else {
        const synapse = synapseParticles[i % NEURAL_COUNT];
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
      ['aBrainNormal', brainNormals, 4],
      ['aSynapse', synapses, 4],
      ['aRelease', releases, 3],
      ['aPlan', plans, 4],
      ['aBuilding', buildings, 4],
      ['aArchitecture', buildingKinds, 2],
      ['aGlyph', glyphs, 1],
    ] as [string, number[], number][]) {
      geometry.setAttribute(name, new Float32BufferAttribute(array, size));
    }

    const offsets = new Float32Array((positions.length / 3) * 2);
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
      defines: mobile.matches ? { MOBILE: 1 } : {},
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uBrainTurn: { value: 0 },
        uDpr: { value: renderer.getPixelRatio() },
        uPixelScale: { value: 1 },
        uLogoScale: { value: 1 },
        uHeroOffset: { value: new Vector2() },
        uAspect: { value: 1 },
        uCompact: { value: 0 },
        uReduced: { value: media.matches ? 1 : 0 },
        uScroll: { value: 0 },
        uVideoReady: { value: 0 },
        uCamDist: { value: 2 },
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
    const brainMaterial = material.clone();
    brainMaterial.defines = { ...material.defines, BRAIN_PASS: 1 };
    brainMaterial.uniforms = material.uniforms;
    // Compile both passes before the visitor reaches their scroll boundary.
    renderer.compile(scene, camera);
    field.material = brainMaterial;
    renderer.compile(scene, camera);

    let frame = 0;
    let time = 0;
    let last = 0;
    let dragging = false;
    let targetX = 0;
    let targetY = 0;
    let vx = 0;
    let vy = 0;
    let targetZ = 0;
    let vz = 0;
    let zoomVelocity = 0;
    let wheelUntil = 0;
    let pointerActive = false;
    let springsMoving = false;
    let fieldMoving = false;
    const REST_DISTANCE = 2;
    let zoomTarget = REST_DISTANCE;
    const panTarget = new Vector2();
    const pointer = new Vector2(-10, -10);
    const smoothPointer = new Vector2(-10, -10);
    const previousPointer = new Vector2(-10, -10);
    const gesture = host.querySelector<HTMLDivElement>('.starfield-gesture')!;
    const contacts = new Map<number, Vector2>();
    const pivot = new Vector3();
    const rotatedPivot = new Vector3();
    const interactionAvailable = () =>
      !mobile.matches && !(videoReadyRef.current && scrollRef.current >= 0.84);

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
      // Mirrors the CSS stacked layout: (max-width: 600px), (max-aspect-ratio: 9/10).
      material.uniforms.uCompact.value = width <= 600 || camera.aspect <= 0.9 ? 1 : 0;
      const fullScale = Math.min(1, (camera.aspect * 0.84) / 0.82);
      // The headline leads; the GM fills the space the copy leaves free,
      // measured from the rendered hero copy rather than guessed.
      const heroOffset = material.uniforms.uHeroOffset.value as Vector2;
      const copy = document.querySelector<HTMLElement>('.gm-hero-copy');
      if (width <= 600 || camera.aspect < 1.05) {
        // Stacked: the GM sits between the header and the copy.
        const top = 76;
        const bottom = copy ? copy.offsetTop - 24 : height * 0.45;
        const room = Math.max(90, bottom - top);
        material.uniforms.uLogoScale.value = Math.min(fullScale * 0.92, room / height / 0.62) * 1.10;
        heroOffset.set(0, 0.5 - (top + room / 2) / height);
      } else {
        // Side by side: the GM is centred in the space right of the words
        // actually drawn (not of the copy's box), which brings it towards the
        // middle of the screen and leaves room for a larger mark.
        const left = host.getBoundingClientRect().left;
        let textRight = Math.min(136, Math.max(32, width * 0.075)) + Math.min(width * 0.42, 620);
        if (copy) {
          const range = document.createRange();
          textRight = 0;
          for (const child of copy.children) {
            range.selectNodeContents(child);
            textRight = Math.max(textRight, range.getBoundingClientRect().right - left);
          }
        }
        const start = (textRight + 56) / width;
        const end = 0.95;
        const fit = ((end - start) * camera.aspect * 0.74) / 0.82;
        material.uniforms.uLogoScale.value = Math.max(0.4, Math.min(fit, 0.48 / 0.58));
        heroOffset.set(((start + end) / 2 - 0.5) * camera.aspect, 0.02);
      }
      material.uniforms.uPixelScale.value = Math.max(
        0.65,
        Math.min(1.3, height / 720),
      );
    };

    window.addEventListener('resize', resize);
    resize();
    // Web fonts change the copy's height: place the GM again once they land.
    document.fonts?.ready.then(() => resize());

    // Nothing to draw once the story has scrolled away: skip the GPU work.
    let onScreen = true;
    const visibility = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; });
    visibility.observe(host);

    const render = (now: number) => {
      frame = requestAnimationFrame(render);
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      scrollRef.current = frameState.current.progress;
      videoReadyRef.current = frameState.current.videoReady;
      if (document.hidden || !onScreen || !frameState.current.active) return;

      time += dt * ANIMATION_SPEED;
      // Once the visitor enters the story, returning to the top must restore
      // the completed monogram even if the opening assembly was interrupted.
      if (scrollRef.current > 0.025) time = Math.max(time, 10);
      material.uniforms.uTime.value = media.matches ? 10 : time;
      // One full revolution every 18 seconds, independent of the logo timing.
      // Pause while the visitor drags; resume from the same orientation.
      if (media.matches || scrollRef.current < 0.28 || scrollRef.current >= 0.58) {
        material.uniforms.uBrainTurn.value = 0;
      } else if (!dragging && scrollRef.current >= 0.36 && scrollRef.current < 0.48) {
        material.uniforms.uBrainTurn.value = (material.uniforms.uBrainTurn.value + dt * Math.PI * 2 / 18) % (Math.PI * 2);
      }
      material.uniforms.uReduced.value = media.matches ? 1 : 0;
      material.uniforms.uScroll.value = scrollRef.current;
      // Omit only groups whose shader light is exactly zero in this phase.
      // Every surface layer is present throughout GM -> brain, both ways.
      const progress = scrollRef.current;
      field.material = progress <= 0.47 ? brainMaterial : material;
      geometry.setDrawRange(0, progress <= 0.02 ? logoPoints.length
        : progress >= 0.815 ? BASE_MORPH_COUNT
        : progress >= 0.58 ? NEURAL_COUNT : totalCount);
      material.uniforms.uVideoReady.value = videoReadyRef.current ? 1 : 0;
      if (!interactionAvailable()) pointerActive = false;
      const damping = 1 - Math.exp(-14 * dt);
      smoothPointer.lerp(pointer, damping);

      if (!dragging && now >= wheelUntil) {
        [targetY, vx] = springStep(targetY, vx, 0, dt);
        [targetX, vy] = springStep(targetX, vy, 0, dt);
        [targetZ, vz] = springStep(targetZ, vz, 0, dt);
        [zoomTarget, zoomVelocity] = springStep(zoomTarget, zoomVelocity, REST_DISTANCE, dt);
        if (media.matches) {
          targetX = targetY = targetZ = vx = vy = vz = zoomVelocity = 0;
          zoomTarget = REST_DISTANCE;
        }
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
      galaxy.rotation.z += (targetZ - galaxy.rotation.z) * follow;
      // Complete the return even on a fast scroll into the aligned video frame.
      galaxy.rotation.x *= 1 - videoSettle;
      galaxy.rotation.y *= 1 - videoSettle;
      galaxy.rotation.z *= 1 - videoSettle;
      // Rotate the monogram around its own centre, not around the page centre.
      const heroWeight = 1 - Math.min(1, scrollRef.current / 0.20);
      const logoCenter = material.uniforms.uHeroOffset.value as Vector2;
      pivot.set(logoCenter.x * heroWeight, logoCenter.y * heroWeight, 0);
      rotatedPivot.copy(pivot).applyEuler(galaxy.rotation);
      galaxy.position.copy(pivot).sub(rotatedPivot);
      galaxy.updateMatrixWorld();

      const s = scrollRef.current;
      const canGesture = !mobile.matches && (s < 0.025 || (s >= 0.36 && s < 0.745));
      gesture.style.display = canGesture ? 'block' : 'none';
      if (!canGesture && dragging) leave();
      const isLogo = s < 0.025;
      const zoneWidth = isLogo ? Math.min(0.9, material.uniforms.uLogoScale.value * 0.9 / camera.aspect) : 0.70;
      const zoneHeight = isLogo ? Math.min(0.65, material.uniforms.uLogoScale.value * 0.65) : 0.62;
      if (canGesture) {
        gesture.style.width = `${zoneWidth * 100}%`;
        gesture.style.height = `${zoneHeight * 100}%`;
        gesture.style.left = `${(0.5 + (isLogo ? logoCenter.x / camera.aspect : 0)) * 100}%`;
        gesture.style.top = `${(0.5 - (isLogo ? logoCenter.y : 0.035)) * 100}%`;
      }

      if (!interactionAvailable()) {
        zoomTarget = REST_DISTANCE;
        panTarget.set(0, 0);
      }
      const distanceGoal = zoomTarget + (REST_DISTANCE - zoomTarget) * videoSettle;
      const zoomFollow = media.matches ? 1 : 1 - Math.exp(-9 * dt);
      camera.position.z += (distanceGoal - camera.position.z) * zoomFollow;
      camera.position.x += (panTarget.x * (1 - videoSettle) - camera.position.x) * zoomFollow;
      camera.position.y += (panTarget.y * (1 - videoSettle) - camera.position.y) * zoomFollow;
      camera.updateMatrixWorld();
      material.uniforms.uCamDist.value = camera.position.z;

      const matrix = galaxy.matrixWorld.elements;
      const mx = (smoothPointer.x - previousPointer.x) / Math.max(dt, 0.001);
      const my = (smoothPointer.y - previousPointer.y) / Math.max(dt, 0.001);
      const speed = Math.hypot(mx, my);
      const limit = Math.min(1, 1.5 / Math.max(speed, 0.001));
      const strength = (media.matches ? 0.25 : 1) * (1 - videoSettle);
      const scale = material.uniforms.uLogoScale.value;
      const heroOffset = material.uniforms.uHeroOffset.value as Vector2;

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
          const wx = positions[k] * scale + heroOffset.x;
          const wy = positions[k + 1] * scale + heroOffset.y;
          const wz = positions[k + 2] * scale;
          const rx = matrix[0] * wx + matrix[4] * wy + matrix[8] * wz + matrix[12];
          const ry = matrix[1] * wx + matrix[5] * wy + matrix[9] * wz + matrix[13];
          const rz = matrix[2] * wx + matrix[6] * wy + matrix[10] * wz + matrix[14];
          const depth = 2 / Math.max(0.05, camera.position.z - rz);
          const dx = (rx - camera.position.x) * depth + offsets[j] - smoothPointer.x;
          const dy = (ry - camera.position.y) * depth + offsets[j + 1] - smoothPointer.y;
          const radius = Math.hypot(dx, dy);
          const weight = pointerActive && !dragging && scroll < 0.02 && (time > 4 || media.matches)
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
      const fieldForces = pointerActive && !dragging && interactionAvailable() && scroll >= 0.02;
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

    // Only the form's interaction area owns touch gestures; the rest of the
    // stage remains available for scrolling and the overlaid links keep working.
    const down = (event: PointerEvent) => {
      if (!interactionAvailable() || event.button !== 0 || contacts.size >= 2) return;
      contacts.set(event.pointerId, new Vector2(event.clientX, event.clientY));
      gesture.setPointerCapture(event.pointerId);
      dragging = true;
      gesture.dataset.dragging = 'true';
      vx = vy = vz = zoomVelocity = 0;
      locate(event);
    };
    const wheel = (event: WheelEvent) => {
      // Browsers expose trackpad pinch as Ctrl+wheel. Ordinary wheel scrolling
      // still belongs to the page; zoom returns once the pinch stream ends.
      if (!event.ctrlKey || !interactionAvailable() || dragging) return;
      event.preventDefault();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? host.clientHeight : 1);
      zoomTarget = Math.max(1.35, Math.min(2.75, zoomTarget * Math.exp(Math.max(-0.2, Math.min(0.2, delta * 0.006)))));
      zoomVelocity = 0;
      wheelUntil = performance.now() + 160;
    };
    const move = (event: PointerEvent) => {
      const previous = contacts.get(event.pointerId);
      if (previous) {
        const before = [...contacts.values()].map(p => p.clone());
        const dx = event.clientX - previous.x, dy = event.clientY - previous.y;
        previous.set(event.clientX, event.clientY);
        const sensitivity = 3.2 / Math.max(320, host.clientHeight);
        if (contacts.size === 1) {
          targetY += dx * sensitivity;
          targetX += dy * sensitivity;
        } else {
          const after = [...contacts.values()];
          const a = before[1].clone().sub(before[0]);
          const b = after[1].clone().sub(after[0]);
          if (a.length() > 8 && b.length() > 8) {
            zoomTarget = Math.max(1.35, Math.min(2.75, zoomTarget * a.length() / b.length()));
            const angle = Math.atan2(b.y, b.x) - Math.atan2(a.y, a.x);
            targetZ -= Math.atan2(Math.sin(angle), Math.cos(angle));
          }
          targetY += dx * sensitivity * 0.5;
          targetX += dy * sensitivity * 0.5;
        }
        locate(event);
      } else if (interactionAvailable() && event.pointerType === 'mouse') locate(event);
    };
    const up = (event: PointerEvent) => {
      contacts.delete(event.pointerId);
      if (gesture.hasPointerCapture(event.pointerId)) gesture.releasePointerCapture(event.pointerId);
      dragging = contacts.size > 0;
      gesture.dataset.dragging = String(dragging);
      pointerActive = false;
    };
    const leave = () => {
      for (const id of contacts.keys()) if (gesture.hasPointerCapture(id)) gesture.releasePointerCapture(id);
      contacts.clear();
      dragging = false;
      wheelUntil = 0;
      gesture.dataset.dragging = 'false';
      pointerActive = false;
    };

    const contextLost = (event: Event) => {
      event.preventDefault();
      host.dataset.failed = 'true';
      onFailedRef.current?.();
    };

    window.addEventListener('pointermove', move, { passive: true });
    gesture.addEventListener('pointerdown', down);
    gesture.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    gesture.addEventListener('lostpointercapture', up);
    document.addEventListener('pointerleave', leave);
    window.addEventListener('blur', leave);
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      visibility.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', move);
      gesture.removeEventListener('pointerdown', down);
      gesture.removeEventListener('wheel', wheel);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      gesture.removeEventListener('lostpointercapture', up);
      document.removeEventListener('pointerleave', leave);
      window.removeEventListener('blur', leave);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      geometry.dispose();
      material.dispose();
      brainMaterial.dispose();
      springTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div ref={hostRef} className="starfield" aria-hidden="true">
      <div className="starfield-gesture" />
      <span className="webgl-error">WebGL non disponibile.</span>
    </div>
  );
}

