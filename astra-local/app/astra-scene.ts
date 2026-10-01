import type { RefObject } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  ClampToEdgeWrapping,
  DataTexture,
  DynamicDrawUsage,
  FloatType,
  Group,
  NearestFilter,
  NormalBlending,
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
import type { ParticleFrame } from './astra-field';
import { BLUEPRINT_HALF, blueprintUrl, decodeBlueprint } from './blueprint-geometry';
import { BRAIN_COUNT, BRAIN_MOBILE_COUNT, BRAIN_SURFACE_STARS, loadBrain, type BrainStars } from './brain-sculpture';
import { springStep } from './gesture-spring';
import { hintGpu, isLite, modestDevice, reportFrame, sceneRatio, watchQuality } from './quality';
import { LOGO_MARK_SHARE } from './gm-constellation';
import { GM_RELEASE_END, VILLA_DRAWN_HERO, VILLA_START_HERO } from './method-timeline';
import { nebulaSubject } from './nebula-state';
import { reducedMotion } from './motion';

const ANIMATION_SPEED = 1.25;
// The background stars live in the site-wide sky (star-sky.tsx).
// The GM and the villa's drawing use this many stars; the brain has its own.
const BASE_COUNT = 32768;
// Phones draw fewer stars across the same complete 3D surface.
const MOBILE_LAYER = BASE_COUNT / 2;
// Modest phones (quality.ts) and the lite rung: two thirds of the phones'
// brain stars; desktops on the lite rung draw the phones' half. Each star is
// a little larger, so the brain keeps its surface with less work.
const MODEST_COUNT = (BRAIN_MOBILE_COUNT * 2) / 3;
// Its drawing spans about this much, in scene units at scale 1.
const BRAIN_WIDTH = 0.74;
const BRAIN_HEIGHT = 0.76;
// The method's timeline starts from the loose stars (see method-story.tsx).
const METHOD_START = 0.775;
// The GM's height at scale 1, its dust included, and its letters' width (see gm-points.json).
const LOGO_HEIGHT = 0.62;
const LOGO_WIDTH = 0.818;
// Phones: the GM rests in the header logo, whose letters span this share of its box.
const LOGO_MARK = LOGO_MARK_SHARE;
// The scene's motion is slow: 60 frames a second at most, even on 120 Hz screens.
const MAX_FPS = 60;

// Two kinds of stars share one shader: the story's (the GM, its loose stars,
// the villa's drawing) and the brain's (BRAIN). They never show together, so
// each kind carries only its own data and computes only its own scene.
const vertexShader = `
 uniform float uTime;
 uniform float uDpr;
 uniform float uPixelScale;
 uniform float uLogoScale;
 // The monogram's light: 0 on phones, where it rests in the header logo.
 uniform float uGlyphLight;
 uniform vec2 uHeroOffset;
 uniform float uAspect;
 uniform float uCompact;
 // Compact layouts: the construction video's centre and width, measured from the page.
 uniform vec2 uPlan;
 uniform float uPlanWidth;
 uniform float uReduced;
 // The method's timeline: loose stars → villa drawing → construction video.
 uniform float uScroll;
 // Share of the hero scrolled away.
 uniform float uHero;
 // The idea scene before the form (0 → 1).
 uniform float uBridge;
 // The brain turns on itself, placed beside the scene's words.
 uniform float uBrainTurn;
 uniform vec2 uBrainCenter;
 uniform float uBrainScale;
 // Brain star size: 1 on desktop; on phones it follows the smaller brain, so
 // the surface texture keeps the desktop's proportions.
 uniform float uBrainStarSize;
 // The brain's exposure, measured from its size on screen (see resize).
 uniform float uBrainLight;
 uniform float uVideoReady;
 // The villa's points arrive apart from the code (blueprint-geometry.ts).
 uniform float uPlanReady;
 uniform float uCamDist;
 uniform sampler2D uSpringField;
 uniform vec2 uFieldSize;
 varying vec3 vColor;
 varying float vLight;
 varying float vStar;
 varying float vSparkle;
 varying float vSpriteCrop;
 varying float vBrainSprite;

 // Touch screens do not use particle gestures, so they skip the spring
 // texture and its four samples for every point.
 // Every star is drawn as a square sprite; only its middle can ever be lit
 // (beyond it, its light stays under the fragment shader's cut-off). The
 // sprite is trimmed to that share, never below 1.5 px so a tiny star cannot
 // vanish between pixels; vSpriteCrop maps the remaining area back to the
 // original sprite, so the result is the same, for a fraction of the pixels.
 void trimSprite(float share) {
   float full = gl_PointSize;
   gl_PointSize = max(full * share, min(full, 1.5));
   vSpriteCrop = gl_PointSize / full;
 }

 vec2 springAt(vec4 mv) {
   vec2 screenPoint = mv.xy * (2.0 / max(0.1, -mv.z));
   vec2 uv = vec2((screenPoint.x + uAspect * 0.5 + 0.1) / (uAspect + 0.2),
     (screenPoint.y + 0.6) / 1.2);
   if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec2(0.0);
   vec2 grid = clamp(uv * uFieldSize - 0.5, vec2(0.0), uFieldSize - 1.0);
   vec2 base = floor(grid);
   vec2 blend = grid - base;
   vec2 a = texture2D(uSpringField, (base + vec2(0.5, 0.5)) / uFieldSize).xy;
   vec2 b = texture2D(uSpringField, (base + vec2(1.5, 0.5)) / uFieldSize).xy;
   vec2 c = texture2D(uSpringField, (base + vec2(0.5, 1.5)) / uFieldSize).xy;
   vec2 d = texture2D(uSpringField, (base + vec2(1.5, 1.5)) / uFieldSize).xy;
   return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
 }

#ifdef BRAIN
 // Read as stored (brain-sculpture.ts): position 0…1 per axis, octahedral
 // normal, shade in the reference image.
 attribute vec3 aBrain;
 attribute vec2 aBrainNormal;
 attribute float aBrainShade;

 // Each brain star's own colour, phase and loose position, from its index.
 float brainRandom(uint id, uint salt) {
   uint x = id * 8u + salt;
   x ^= x >> 16; x *= 0x7feb352du; x ^= x >> 15; x *= 0x846ca68bu; x ^= x >> 16;
   return float(x >> 8) / 16777216.0;
 }
 vec3 octahedral(vec2 e) {
   vec3 v = vec3(e, 1.0 - abs(e.x) - abs(e.y));
   if (v.z < 0.0) v.xy = (1.0 - abs(v.yx)) * vec2(v.x >= 0.0 ? 1.0 : -1.0, v.y >= 0.0 ? 1.0 : -1.0);
   return normalize(v);
 }

 void main() {
   uint id = uint(gl_VertexID);
   float aPhase = brainRandom(id, 0u) * 6.2831853;
   vec3 aOrigin = vec3(brainRandom(id, 1u) * 1.7, brainRandom(id, 2u) * 1.3, brainRandom(id, 3u) * 1.35)
     - vec3(0.85, 0.65, 0.675);
   float heat = brainRandom(id, 4u);
   vec3 aColor = heat < 0.65 ? vec3(0.94, 0.95, 1.0) : heat < 0.85 ? vec3(0.64, 0.82, 1.0) : vec3(1.0, 0.8, 0.59);
   float motion = 1.0 - uReduced;

   // A brain of stars turns slowly on itself. It condenses from a loose halo
   // as the scene arrives, and its stars melt away as the form arrives.
   float gather = mix(smoothstep(0.0, 0.3, uBridge), 1.0, uReduced);
   float melt = smoothstep(0.8 + fract(aPhase * 3.7) * 0.06, 0.94 + fract(aPhase * 3.7) * 0.06, uBridge) * motion;
   vec3 brain = (aBrain * 2.0 - 1.0) * uBrainScale;
   mat3 brainRotation = mat3(
     cos(uBrainTurn), 0.0, -sin(uBrainTurn),
     0.0, 1.0, 0.0,
     sin(uBrainTurn), 0.0, cos(uBrainTurn)
   );
   vec3 brainPivot = vec3(uBrainCenter, 0.0);
   vec3 p = brainPivot + brainRotation * brain;
   p += vec3(aOrigin.x * uAspect, aOrigin.y, aOrigin.z) * 0.18 * (1.0 - gather) * motion;
   p.y -= (1.0 - gather) * 0.08 * motion;
   // Melting: each star drifts a little outward and upward as it fades.
   p += ((p - brainPivot) * 0.35 + vec3(sin(aPhase * 2.3) * 0.05, 0.12, 0.0)) * melt;

   vec4 mv = modelViewMatrix * vec4(p, 1.0);
   vec2 displacement = vec2(0.0);
   #ifndef MOBILE
     displacement = springAt(mv);
   #endif
   float influence = min(length(displacement) * 3.0, 0.2);
   mv.xy += displacement * (-mv.z / 2.0);
   gl_Position = projectionMatrix * mv;
   float depth = clamp(2.0 / -mv.z, 0.35, 2.5);
   // The brain's hidden surfaces are rejected by its depth pass, without
   // changing a sample's opacity as its normal or hemisphere rotates away.
   #ifdef BRAIN_DEPTH
   // Occlusion coverage must not shrink with a faint star's material.
   float renderedSize = 14.0 * uBrainStarSize;
   // A point has one depth: the occluder's allowance (see its fragment
   // shader) is added here, so the GPU can still reject hidden pixels early.
   gl_Position.z += 0.0016 * gl_Position.w;
   #else
   // The reference's fine Gaussian stars vary with its original image shade.
   float renderedSize = (7.5 + aBrainShade * 6.5) * uBrainStarSize;
   #endif
   gl_PointSize = clamp(renderedSize * uDpr * uPixelScale * depth * (1.0 + influence * 0.12), 2.0, 160.0);

   float thoughtLight = 0.26 + aBrainShade * aBrainShade * 3.0;
   #ifndef BRAIN_DEPTH
   // Depth resolves the visible surface without back-face cuts.
   vec3 surfaceNormal = normalize(mat3(modelViewMatrix) * brainRotation * octahedral(aBrainNormal));
   thoughtLight *= gl_VertexID < ${BRAIN_SURFACE_STARS} ? 1.0 : 0.0;
   // Surface points overlap more when a fold turns edge-on. Compensate that
   // projected density so it does not become a white etched line. This is a
   // continuous coverage correction, with no hemisphere switch or rim light.
   float projectedArea = abs(dot(surfaceNormal, normalize(-mv.xyz)));
   thoughtLight *= 0.35 + 0.65 * projectedArea;
   #endif
   thoughtLight *= uBrainLight * gather * (1.0 - melt);

   vLight = thoughtLight;
   vColor = aColor;
   vStar = 0.0;
   vSparkle = 0.0;
   vBrainSprite = 1.0;
   // Compact dots: the occluder's disc fills 0.28 of the sprite, a lit star
   // never reaches beyond 0.54 of it.
   #ifdef BRAIN_DEPTH
   trimSprite(0.28);
   #else
   trimSprite(0.54);
   #endif
   if (vLight <= 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
 }

#else
 attribute vec3 aOrigin;
 attribute vec3 aColor;
 attribute vec3 aStyle;
 // The villa's drawing: x, z, shade, drawing order.
 attribute vec4 aPlan;
 attribute vec2 aOffset;
 // Role in the GM monogram: 2 outline, 1 fill, 0 dust, -1 not part of it.
 attribute float aGlyph;
 #define aSize aStyle.x
 #define aLight aStyle.y
 #define aPhase aStyle.z
 #define aDrawOrder aPlan.w

 void main() {
   float motion = 1.0 - uReduced;
   float scrolled = uHero;
   float t = clamp((uTime * 1.33 - 0.8 - aPhase * 0.12) / 4.8, 0.0, 1.0);
   float ordered = t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
   ordered = mix(ordered, 1.0, max(uReduced, smoothstep(0.0, 0.02, scrolled)));

   // ---------- Hero → method ----------
   // The GM rises with the page and opens into a loose cloud; its stars, joined
   // by the rest of the field, then draw the villa of the method.
   float isGlyph = step(-0.5, aGlyph);
   float release = smoothstep(0.04, ${GM_RELEASE_END.toFixed(3)}, uHero);
   vec3 logo = position * uLogoScale;
   logo.xy += uHeroOffset;
   logo.y += uHero * 0.8 * motion;
   vec3 loose = vec3(aOrigin.x * uAspect * 1.45, aOrigin.y * 1.35 - 0.18, aOrigin.z * 0.6);
   loose.xy += vec2(sin(aPhase * 2.7), cos(aPhase * 1.9)) * 0.18 * motion;
   vec3 target = mix(loose, logo, isGlyph);
   target = mix(target, loose, release);
   // A slight arc on the way out, so the letters open rather than slide.
   target += vec3(aOrigin.x * uAspect, aOrigin.y, aOrigin.z) * sin(3.14159 * release) * 0.12 * motion * isGlyph;
   if (uReduced > 0.5 && uHero < 0.02) target = position * uLogoScale + vec3(uHeroOffset, 0.0);

   float projectMix = smoothstep(0.775, 0.815, uScroll);
   // Match the CSS video rectangle exactly, with no tilt during the crossfade.
   // Wide screens: the drawing takes the video's frame on the left (52% wide,
   // from 4%: globals.css), the words beside it; compact layouts measure it.
   float frameWidth = mix(0.52, uPlanWidth, uCompact);
   vec3 plan = vec3(aPlan.x, -aPlan.y, 0.0) * uAspect * frameWidth;
   plan.xy += mix(vec2(-uAspect * 0.20, 0.0), uPlan, uCompact);
   // Layered relief while drawing; flattens before the video so the crossfade stays exact.
   plan.z = aOrigin.z * 0.12 * (1.0 - smoothstep(0.815, 0.845, uScroll));
   // Each group of stars joins the progressive drawing in turn.
   float assemble = smoothstep(0.775 + aDrawOrder * 0.037, 0.797 + aDrawOrder * 0.037, uScroll) * uPlanReady;
   target = mix(target, plan, assemble);

   // Kept tiny while the GM is formed, so the outline of the letters stays sharp.
   float glyph = isGlyph * (1.0 - smoothstep(0.0, 0.1, uHero));
   float orbit = mix(mix(0.015, 0.005, glyph), 0.0012, release) * motion * (1.0 - projectMix);
   target += vec3(
     sin(uTime * 0.7 + aPhase),
     cos(uTime * 0.55 + aPhase * 1.7),
     sin(uTime * 0.42 + aPhase)
   ) * orbit;
   target.y += sin(position.x * 18.0 + uTime * 0.65) * mix(0.006, 0.0025, glyph) * motion * (1.0 - release);

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

   vec4 mv = modelViewMatrix * vec4(p, 1.0);
   vec2 displacement = vec2(0.0);
   #ifndef MOBILE
     float fieldBlend = smoothstep(0.020, 0.025, scrolled);
     displacement = mix(aOffset, springAt(mv), fieldBlend)
       * (1.0 - smoothstep(0.83, 0.84, uScroll) * uVideoReady);
   #endif
   float influence = min(length(displacement) * 3.0, 0.2);
   mv.xy += displacement * (-mv.z / 2.0);

   gl_Position = projectionMatrix * mv;
   // Aerial perspective relative to the camera focus: nearer stars brighter, farther dimmer.
   float viewDist = max(0.001, -mv.z);
   float depthCue = clamp(pow(uCamDist / viewDist, 1.6), 0.4, 1.8);
   float nearFade = smoothstep(0.12, 0.45, viewDist);
   float depth = clamp(2.0 / -mv.z, 0.35, 2.5);
   float looseSize = min(aSize, 12.0);
   #ifdef PHONE
   // A phone screen is small: the loose stars between the GM and the villa stay finer.
   looseSize *= 0.75;
   #endif
   float renderedSize = mix(aSize, looseSize, release);
   renderedSize = mix(renderedSize, 6.5, projectMix);
   gl_PointSize = clamp(
     renderedSize * uDpr * uPixelScale * depth * (1.0 + influence * 0.12),
     2.0,
     160.0
   );

   float shimmer = 0.5 + 0.5 * pow(
     0.5 + 0.5 * sin(uTime * (0.7 + aPhase * 0.12) + aPhase),
     2.0
   );

   // Light: the GM, its loose stars, then the villa's drawing.
   float heroLight = aLight * mix(shimmer, 1.0, uReduced) + influence * 0.12;
   float looseLight = max(0.22, aLight * 0.8);
   #ifdef PHONE
   looseLight *= 0.6;
   #endif
   heroLight = mix(heroLight, looseLight, release);
   // The rest of the field arrives with the release.
   heroLight *= mix(isGlyph, 1.0, release);
   // Outline stars lead, the fill glows softly behind them, dust barely shows.
   heroLight *= mix(1.0, aGlyph > 1.5 ? 1.04 : aGlyph > 0.5 ? 0.84 : 0.3, glyph);
   heroLight *= mix(1.0, uGlyphLight, isGlyph * (1.0 - release));
   float blueprintLight = (0.20 + aPlan.z * 0.42) * clamp(uAspect * frameWidth / 1.4, 0.28, 1.0);
   // Unassembled particles remain visible: the drawing is made by their arrival.
   heroLight = mix(heroLight, blueprintLight, projectMix);
   heroLight *= 1.0 - smoothstep(0.84, 0.865, uScroll) * uVideoReady;

   vLight = heroLight * depthCue * nearFade;
   vec3 starColor = vec3(0.78, 0.85, 1.0);
   vColor = mix(mix(aColor, starColor, release), vec3(0.94, 0.97, 1.0), projectMix);

   // Loose stars glow with a halo.
   vStar = release * 0.85;
   // The brightest stars of the GM become four-point sparkles: irregular in
   // size, colour and shape, while the outline carries the letters.
   vSparkle = max(glyph * smoothstep(32.0, 50.0, aSize) * 0.85, release * smoothstep(22.0, 34.0, aSize) * 0.35);
   // Compact dots (the GM) have no broad halo and are lit only within 0.4 of
   // their sprite; haloed stars and sparkles within 0.88.
   vBrainSprite = 0.0;
   trimSprite(vStar == 0.0 && vSparkle == 0.0 ? 0.4 : 0.88);
   if (vLight <= 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
 }
#endif
`;

const fragmentShader = `
 precision highp float;
 varying vec3 vColor;
 varying float vLight;
 varying float vStar;
 varying float vSparkle;
 varying float vSpriteCrop;
 varying float vBrainSprite;

 void main() {
   vec2 uv = (gl_PointCoord - 0.5) * vSpriteCrop;
   float r2 = dot(uv, uv);
   if (vStar == 0.0 && vSparkle == 0.0) {
     float core = exp(-r2 * mix(850.0, 480.0, vBrainSprite));
     float alpha = (core + exp(-r2 * mix(200.0, 115.0, vBrainSprite))
       * mix(0.25, 0.30, vBrainSprite)) * vLight;
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
   float alpha = (core + inner + halo + rays) * vLight;
   if (alpha < 0.0003) discard;
   gl_FragColor = vec4(mix(vColor, vec3(1.0), core * 0.6), alpha);
 }
`;

// The nearest anatomical surface hides the far side and supplies a dark base.
// A small depth allowance keeps neighbouring samples of the same fold visible.
const brainDepthFragmentShader = `
 precision highp float;
 varying float vSpriteCrop;
 void main() {
   vec2 uv = (gl_PointCoord - 0.5) * vSpriteCrop;
   // Cover gaps between front stars, but leave enough depth allowance for
   // neighbouring cells of the same gyrus. Rear folds remain hidden.
   // Its depth sits 0.0008 behind the star itself (set in the vertex shader).
   if (dot(uv, uv) > 0.0196) discard;
   // A near-black front surface blocks the sky behind the cell cloud.
   gl_FragColor = vec4(0.009, 0.016, 0.037, 1.0);
 }
`;

/**
 * The page's particle scenes (astra-field.tsx), loaded after the page itself.
 * Returns its cleanup, or nothing if WebGL is unavailable.
 */
export function mountAstraField(host: HTMLElement, frameState: RefObject<ParticleFrame>, failed: () => void) {
  const media = reducedMotion();
  // Touch screens: no hover effects. Phone-sized screens: also fewer stars.
  const mobile = matchMedia('(max-width: 760px), (pointer: coarse)');
  const phone = matchMedia('(max-width: 760px), (max-height: 500px)');
  let renderer: WebGLRenderer;

  try {
    renderer = new WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    });
  } catch {
    failed();
    return;
  }

  hintGpu(renderer.getContext());
  renderer.setClearColor(0, 0);
  renderer.setPixelRatio(sceneRatio());
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

  const phoneDensity = phone.matches;
  const modest = phoneDensity && modestDevice();
  const layer = phoneDensity ? MOBILE_LAYER : BASE_COUNT;
  // The brain: every star on a capable desktop, half on phones, fewer on
  // modest devices and on the lite rung (any prefix covers the whole surface).
  const brainFull = phoneDensity ? BRAIN_MOBILE_COUNT : BRAIN_COUNT;
  const brainWanted = () => (isLite() || modest
    ? (phoneDensity ? MODEST_COUNT : BRAIN_MOBILE_COUNT)
    : brainFull);
  // Typed arrays filled in place: no intermediate lists, no copies.
  const positions = new Float32Array(layer * 3);
  const origins = new Float32Array(layer * 3);
  const colors = new Float32Array(layer * 3);
  const styles = new Float32Array(layer * 3);
  // Filled when the villa's points arrive: x, z, shade, drawing order.
  const plans = new Float32Array(layer * 4);
  const glyphs = new Float32Array(layer);
  const tints = [[0.94, 0.95, 1], [0.64, 0.82, 1], [1, 0.8, 0.59]];

  for (let i = 0; i < layer; i++) {
    const point = logoPoints[i % logoPoints.length];
    const glyph = i < logoPoints.length;
    // Monogram stars sit exactly on the sampled letters.
    // An irregular edge: most monogram stars stay close to the outline, a few stray further.
    const roll = random();
    const scatter = glyph ? 0.0075 * (1 + 3 * roll ** 3) : roll < 0.20 ? 0.075 : 0.022;
    positions[i * 3] = point[0] + (random() - 0.5) * scatter;
    positions[i * 3 + 1] = point[1] + (random() - 0.5) * scatter;
    // Shallow depth: perspective would otherwise smear the off-centre letters.
    positions[i * 3 + 2] = (random() - 0.5) * (glyph ? 0.03 : 0.16);
    glyphs[i] = glyph ? point[2] : -1;
    origins[i * 3] = (random() - 0.5) * 1.7;
    origins[i * 3 + 1] = (random() - 0.5) * 1.3;
    origins[i * 3 + 2] = (random() - 0.5) * 1.35;

    const heat = random();
    colors.set(tints[heat < 0.65 ? 0 : heat < 0.85 ? 1 : 2], i * 3);
    const bright = random();
    const size = bright > 0.993 ? 58 : bright > 0.94 ? 28 : 7 + random() * 10;
    const light = 0.32 + random() * 0.4;
    styles[i * 3] = size;
    styles[i * 3 + 1] = light;
    styles[i * 3 + 2] = random() * Math.PI * 2;
  }

  const geometry = new BufferGeometry();
  for (const [name, array, size] of [
    ['position', positions, 3],
    ['aOrigin', origins, 3],
    ['aColor', colors, 3],
    ['aStyle', styles, 3],
    ['aPlan', plans, 4],
    ['aGlyph', glyphs, 1],
  ] as [string, Float32Array, number][]) {
    geometry.setAttribute(name, new BufferAttribute(array, size));
  }

  const offsets = new Float32Array(layer * 2);
  const velocities = new Float32Array(logoPoints.length * 2);
  const offsetAttribute = new BufferAttribute(offsets, 2);
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

  const uniforms = {
    uTime: { value: 0 },
    uDpr: { value: renderer.getPixelRatio() },
    uPixelScale: { value: 1 },
    uLogoScale: { value: 1 },
    uGlyphLight: { value: 1 },
    uHeroOffset: { value: new Vector2() },
    uAspect: { value: 1 },
    uCompact: { value: 0 },
    uPlan: { value: new Vector2(0, -0.05) },
    uPlanWidth: { value: 0.86 },
    uReduced: { value: media.matches ? 1 : 0 },
    uScroll: { value: METHOD_START },
    uHero: { value: 0 },
    uBridge: { value: 0 },
    uBrainTurn: { value: 0 },
    uBrainCenter: { value: new Vector2() },
    uBrainScale: { value: 1 },
    uBrainStarSize: { value: 1 },
    uBrainLight: { value: 1 },
    uVideoReady: { value: 0 },
    uPlanReady: { value: 0 },
    uCamDist: { value: 2 },
    uSpringField: { value: springTexture },
    uFieldSize: { value: new Vector2(fieldWidth, fieldHeight) },
  };
  const defines = { ...(mobile.matches ? { MOBILE: 1 } : {}), ...(phone.matches ? { PHONE: 1 } : {}) };
  const material = new ShaderMaterial({
    defines,
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
  });
  const field = new Points(geometry, material);
  field.frustumCulled = false;
  galaxy.add(field);

  // The brain: its own stars, its depth pass, its own blending. Created when
  // its data arrives, a few screens before the scene.
  const brainMaterial = new ShaderMaterial({
    defines: { ...defines, BRAIN: 1 },
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: NormalBlending,
  });
  const brainDepthMaterial = new ShaderMaterial({
    defines: { ...defines, BRAIN: 1, BRAIN_DEPTH: 1 },
    vertexShader,
    fragmentShader: brainDepthFragmentShader,
    uniforms,
    depthWrite: true,
    depthTest: true,
  });
  const brainGroup = new Group();
  brainGroup.visible = false;
  galaxy.add(brainGroup);
  let brainGeometry: BufferGeometry | null = null;
  let brainLoaded = 0;
  // The first frame after the data lands uploads it, drawing nothing.
  let brainWarm = false;
  renderer.compile(scene, camera);

  const abort = new AbortController();

  // The villa's drawing: its points arrive beside the code; until then its
  // stars simply stay loose. Phones need only the first half.
  Promise.all(Array.from({ length: Math.ceil(layer / BLUEPRINT_HALF) }, (_, index) =>
    fetch(blueprintUrl(index), { signal: abort.signal, priority: 'low' } as RequestInit)
      .then((response) => (response.ok ? response.arrayBuffer() : Promise.reject(new Error(`Blueprint: ${response.status}`))))))
    .then((buffers) => {
      buffers.forEach((buffer, index) => plans.set(decodeBlueprint(buffer), index * BLUEPRINT_HALF * 4));
      geometry.getAttribute('aPlan').needsUpdate = true;
      uniforms.uPlanReady.value = 1;
    })
    .catch(() => { if (!abort.signal.aborted) console.warn('The villa drawing could not be loaded.'); });

  const showBrain = (stars: BrainStars) => {
    brainGeometry = new BufferGeometry();
    brainGeometry.setAttribute('aBrain', new BufferAttribute(stars.positions, 3, true));
    brainGeometry.setAttribute('aBrainNormal', new BufferAttribute(stars.normals, 2, true));
    brainGeometry.setAttribute('aBrainShade', new BufferAttribute(stars.shades, 1, true));
    brainLoaded = stars.count;
    const brainDepth = new Points(brainGeometry, brainDepthMaterial);
    const brainField = new Points(brainGeometry, brainMaterial);
    brainDepth.frustumCulled = brainField.frustumCulled = false;
    brainGroup.add(brainDepth, brainField);
    placeBrainStars();
    resize();
    renderer.compileAsync(brainGroup, camera, scene).then(() => { brainWarm = true; });
  };
  let brainStarted = false;
  const brainWatcher = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) startBrain();
  }, { rootMargin: '300% 0px' });
  const startBrain = async () => {
    if (brainStarted) return;
    brainStarted = true;
    brainWatcher.disconnect();
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const stars = await loadBrain(brainWanted(), abort.signal);
        if (abort.signal.aborted) return;
        showBrain(stars);
        return;
      } catch {
        if (abort.signal.aborted) return;
      }
    }
    // Keep the surrounding scene usable if the local asset is unavailable.
    console.warn('The brain model could not be loaded.');
  };
  const brainSection = document.querySelector('.gm-bridge');
  if (brainSection) brainWatcher.observe(brainSection);
  else startBrain();

  // Stars drawn and their size: fewer stars are each a little larger, so the
  // surface stays covered (two thirds of them, 1.22 times larger), and a
  // little dimmer, so the brain keeps its overall light (measured: half the
  // stars at 1.41 times the size read 13% brighter).
  let brainDrawn = 0;
  let brainBoost = 1;
  const placeBrainStars = () => {
    if (!brainGeometry) return;
    brainDrawn = Math.min(brainLoaded, brainWanted());
    brainGeometry.setDrawRange(0, brainDrawn);
    brainBoost = Math.sqrt(brainFull / brainDrawn);
  };

  let frame = 0;
  let time = 0;
  let last = 0;
  let lastDraw = 0;
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
  let scrollProgress = METHOD_START;
  let videoReady = false;
  // The stars answer the pointer in the GM, the villa's drawing and the
  // brain; never over the video or while the brain melts away.
  const interactionAvailable = () => {
    const state = frameState.current;
    if (mobile.matches) return false;
    if (state.bridgeMode) return state.bridge < 0.8;
    return !(videoReady && scrollProgress >= 0.84);
  };

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

  // ---------- Phones: the GM at rest in the header logo ----------
  // The page draws the living logo (dynamic-gm-logo.tsx); these stars wait
  // there, unlit, and stream out into the villa as the visitor scrolls.
  // While the phone opening plays (gomore-mobile-intro.tsx) this canvas rests.
  const root = document.documentElement;
  let phoneHero = false;
  const rest = { scale: 0.05, x: 0, y: 0.45 };
  const placeRest = () => {
    if (!phoneHero) {
      uniforms.uGlyphLight.value = 1;
      return;
    }
    uniforms.uGlyphLight.value = 0;
    uniforms.uLogoScale.value = rest.scale;
    uniforms.uHeroOffset.value.set(rest.x, rest.y);
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
      uniforms.uSpringField.value = springTexture;
      uniforms.uFieldSize.value.set(fieldWidth, fieldHeight);
      fieldMoving = false;
    }
    uniforms.uAspect.value = camera.aspect;
    // Mirrors the CSS stacked layouts: (max-width: 600px), (max-aspect-ratio: 9/10),
    // and upright phones up to 767px.
    uniforms.uCompact.value = width <= 600 || camera.aspect <= 0.9 || (width <= 767 && camera.aspect <= 1) ? 1 : 0;
    // There the villa's drawing lands exactly on the construction video,
    // wherever the page puts it. The video's stage keeps the height of the
    // screen with the browser bars shown, while this canvas grows as they
    // hide: measuring (and measuring again on resize) keeps the two aligned.
    const video = document.querySelector<HTMLElement>('.gm-construction-video');
    const videoStage = video?.offsetParent;
    if (video && videoStage) {
      // Its centre in the stage, whether the CSS centres it on its top
      // (translate -50%) or lays it out in the flow (phones).
      const box = video.getBoundingClientRect();
      const centre = box.top + box.height / 2 - videoStage.getBoundingClientRect().top;
      uniforms.uPlanWidth.value = video.offsetWidth / width;
      uniforms.uPlan.value.set(
        ((video.offsetLeft + video.offsetWidth / 2) / width - 0.5) * camera.aspect,
        0.5 - centre / height,
      );
    }
    const fullScale = Math.min(1, (camera.aspect * 0.84) / 0.82);
    // The headline leads; the GM fills the space the copy leaves free,
    // measured from the rendered hero copy rather than guessed.
    const heroOffset = uniforms.uHeroOffset.value;
    const copy = document.querySelector<HTMLElement>('.gm-hero-copy');
    // Mirrors the CSS phone composition: (max-width: 600px) and (orientation: portrait).
    phoneHero = width <= 600 && camera.aspect <= 1;
    if (phoneHero) {
      // Phones: the words have the hero to themselves and the GM rests in
      // the header logo, unlit (the logo is drawn by the page). From there
      // its stars stream out into the villa as the visitor scrolls.
      const mark = document.querySelector<HTMLElement>('.gm-header .gm-logo');
      const box = mark?.getBoundingClientRect();
      rest.scale = ((mark?.offsetWidth ?? 46) * LOGO_MARK) / (LOGO_WIDTH * height);
      rest.x = box ? ((box.left + box.width / 2) / width - 0.5) * camera.aspect : -camera.aspect * 0.4;
      rest.y = box ? 0.5 - (box.top + box.height / 2) / height : 0.46;
    } else if (camera.aspect < 1.05) {
      // Stacked: the GM sits between the header and the copy.
      const top = 76;
      const bottom = copy ? copy.offsetTop - 24 : height * 0.45;
      const room = Math.max(90, bottom - top);
      uniforms.uLogoScale.value = Math.min(fullScale * 0.92, room / height / LOGO_HEIGHT) * 1.10;
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
      uniforms.uLogoScale.value = Math.max(0.4, Math.min(fit, 0.48 / 0.58));
      heroOffset.set(((start + end) / 2 - 0.5) * camera.aspect, 0.02);
    }
    placeRest();
    // The brain sits beside the scene's words: to their right on wide
    // screens, below them on phones and portrait tablets.
    const brainCenter = uniforms.uBrainCenter.value;
    const words = document.querySelector<HTMLElement>('.gm-bridge-copy');
    const header = 76;
    if (width <= 760 || camera.aspect < 1.05) {
      const top = words ? words.offsetTop + words.offsetHeight + 28 : height * 0.3;
      const bottom = height - 96; // clears the scroll cue
      const room = Math.max(120, bottom - top);
      // Narrower than the screen: turning, the brain is wider in some views.
      const scale = Math.min(1.12, (camera.aspect * 0.72) / BRAIN_WIDTH, (room / height) / BRAIN_HEIGHT);
      uniforms.uBrainScale.value = scale;
      brainCenter.set(0, 0.5 - (top + room / 2) / height);
    } else {
      const textRight = words ? words.offsetLeft + words.offsetWidth : width * 0.45;
      const start = (textRight + 48) / width;
      const end = 0.96;
      const scale = Math.min(1.12, ((end - start) * camera.aspect * 0.9) / BRAIN_WIDTH, ((height - header) / height * 0.8) / BRAIN_HEIGHT);
      uniforms.uBrainScale.value = scale;
      brainCenter.set(((start + end) / 2 - 0.5) * camera.aspect, -(header / height) / 2);
    }
    uniforms.uPixelScale.value = Math.max(
      0.65,
      Math.min(1.3, height / 720),
    );
    // Phones: the brain is about half its desktop size. Its stars shrink with
    // it, and it keeps the exposure of a desktop brain (scale 0.9 on a
    // 1280×800 screen), so the surface texture reads as it does there.
    const brainScale = uniforms.uBrainScale.value;
    const exposure = (value: number) => Math.min(1, Math.max(0.3, (value / 1.18) ** 0.8));
    if (phoneDensity) {
      // Star size relative to the brain, against that desktop reference.
      const onScreen = ((brainScale * height) / (0.9 * 800))
        * ((800 / 720) / uniforms.uPixelScale.value);
      uniforms.uBrainStarSize.value = Math.min(1, Math.max(0.4, onScreen)) * brainBoost;
      uniforms.uBrainLight.value = exposure(0.9) * brainBoost ** -0.36;
    } else {
      uniforms.uBrainStarSize.value = brainBoost;
      uniforms.uBrainLight.value = exposure(brainScale) * brainBoost ** -0.36;
    }
  };

  window.addEventListener('resize', resize);
  resize();
  // A step down the quality ladder (quality.ts): fewer pixels, then fewer stars.
  const unwatch = watchQuality(() => {
    renderer.setPixelRatio(sceneRatio());
    uniforms.uDpr.value = renderer.getPixelRatio();
    placeBrainStars();
    resize();
  });
  // Web fonts change the copy's height: place the GM again once they land.
  document.fonts?.ready.then(() => resize());

  // Nothing to draw once the story has scrolled away: skip the GPU work.
  let onScreen = true;
  // Behind the construction video every star is dark (the shader fades them
  // out as it arrives): the canvas is hidden and the GPU rests until the
  // scene needs the stars again.
  let asleep = false;
  const visibility = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; });
  visibility.observe(host);

  const render = (now: number) => {
    frame = requestAnimationFrame(render);
    const elapsed = now - last;
    const dt = Math.min(0.04, elapsed / 1000);
    last = now;
    const state = frameState.current;
    // Dim the gas inside the current sculpture, keeping its edges luminous.
    const logoCenterForSky = uniforms.uHeroOffset.value;
    const planCenterForSky = uniforms.uPlan.value;
    const brainCenterForSky = uniforms.uBrainCenter.value;
    const arrival = Math.max(0, Math.min(1, (state.hero - VILLA_START_HERO) / (VILLA_DRAWN_HERO - VILLA_START_HERO)));
    const villaMix = arrival * arrival * (3 - 2 * arrival);
    const compact = uniforms.uCompact.value;
    const villaX = compact ? planCenterForSky.x : -camera.aspect * 0.20;
    const villaY = compact ? planCenterForSky.y : 0;
    nebulaSubject.x = state.bridgeMode ? brainCenterForSky.x
      : logoCenterForSky.x + (villaX - logoCenterForSky.x) * villaMix;
    nebulaSubject.y = state.bridgeMode ? brainCenterForSky.y
      : logoCenterForSky.y + (villaY - logoCenterForSky.y) * villaMix;
    nebulaSubject.radius = state.bridgeMode
      ? uniforms.uBrainScale.value * 0.36
      : uniforms.uLogoScale.value * 0.48 * (1 - villaMix)
        + camera.aspect * (compact ? uniforms.uPlanWidth.value : 0.52) * 0.40 * villaMix;
    nebulaSubject.strength = state.active
      ? state.bridgeMode ? Math.min(1, state.bridge / 0.3, (1 - state.bridge) / 0.2)
        : Math.max(Math.max(0, 1 - state.hero / 0.8), villaMix)
      : 0;
    scrollProgress = state.bridgeMode ? METHOD_START : state.progress;
    videoReady = state.videoReady;
    if (document.hidden || !onScreen) return;
    // The phone opening covers the page: nothing to draw under it.
    if (root.classList.contains('gm-intro')) return;
    const behindVideo = !state.bridgeMode && state.videoReady && state.progress >= 0.866;
    if (behindVideo !== asleep) {
      asleep = behindVideo;
      renderer.domElement.style.visibility = asleep ? 'hidden' : '';
    }
    // At rest while unseen, except for the one frame that hands the brain's
    // stars to the GPU ahead of its scene (nothing shows: the canvas is hidden).
    if ((asleep || !state.active) && !brainWarm) return;
    if (state.active && !asleep) reportFrame(now, elapsed);
    // 120 Hz screens: every other frame is enough for these slow motions.
    if (now - lastDraw < 1000 / MAX_FPS - 2) return;
    const step = Math.min(0.04, (now - (lastDraw || now - elapsed)) / 1000);
    lastDraw = now;
    renderScene(now, step, state);
  };

  const renderScene = (now: number, dt: number, state: ParticleFrame) => {
    const atHero = !state.bridgeMode && state.hero < 0.02;
    time += dt * ANIMATION_SPEED;
    // Once the visitor scrolls on, returning to the top must restore the
    // completed monogram even if the opening assembly was interrupted.
    if (!atHero) time = Math.max(time, 10);
    uniforms.uTime.value = media.matches ? 10 : time;
    uniforms.uReduced.value = media.matches ? 1 : 0;
    uniforms.uScroll.value = scrollProgress;
    uniforms.uHero.value = state.bridgeMode ? 1 : state.hero;
    uniforms.uBridge.value = state.bridge;
    // The story's stars or the brain's: never both.
    field.visible = !state.bridgeMode;
    brainGroup.visible = (state.bridgeMode || brainWarm) && !!brainGeometry;
    if (brainGeometry) brainGeometry.setDrawRange(0, state.bridgeMode ? brainDrawn : 0);
    brainWarm = false;
    // One full revolution every 18 seconds; it pauses while the visitor drags,
    // and starts again from the resting view each time the scene returns.
    if (media.matches || !state.bridgeMode) {
      uniforms.uBrainTurn.value = 0;
    } else if (!dragging) {
      uniforms.uBrainTurn.value = (uniforms.uBrainTurn.value + dt * Math.PI * 2 / 18) % (Math.PI * 2);
    }
    // Draw only the stars the current scene uses: the GM or the villa.
    geometry.setDrawRange(0, atHero ? logoPoints.length : layer);
    uniforms.uVideoReady.value = videoReady ? 1 : 0;
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
    // The villa's drawing settles, aligned and untilted, before its video.
    const videoSettle = videoReady && !state.bridgeMode
      ? Math.max(0, Math.min(1, (scrollProgress - 0.83) / 0.01))
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
    const heroWeight = 1 - Math.min(1, state.hero / GM_RELEASE_END);
    const logoCenter = uniforms.uHeroOffset.value;
    const brainCenter = uniforms.uBrainCenter.value;
    if (state.bridgeMode) pivot.set(brainCenter.x, brainCenter.y, 0);
    else pivot.set(logoCenter.x * heroWeight, logoCenter.y * heroWeight, 0);
    rotatedPivot.copy(pivot).applyEuler(galaxy.rotation);
    galaxy.position.copy(pivot).sub(rotatedPivot);
    galaxy.updateMatrixWorld();

    // The GM and the brain can be turned by hand while they are whole.
    const onBrain = state.bridgeMode && state.bridge > 0.2 && state.bridge < 0.8;
    const canGesture = !mobile.matches && (onBrain || (!state.bridgeMode && state.hero < 0.025));
    gesture.style.display = canGesture ? 'block' : 'none';
    if (!canGesture && dragging) leave();
    if (canGesture) {
      const logoScale = uniforms.uLogoScale.value;
      const brainScale = uniforms.uBrainScale.value;
      const center = onBrain ? brainCenter : logoCenter;
      gesture.style.width = `${Math.min(0.9, (onBrain ? brainScale * BRAIN_WIDTH * 1.1 : logoScale * 0.9) / camera.aspect) * 100}%`;
      gesture.style.height = `${Math.min(0.8, onBrain ? brainScale * BRAIN_HEIGHT * 1.1 : logoScale * 0.65) * 100}%`;
      gesture.style.left = `${(0.5 + center.x / camera.aspect) * 100}%`;
      gesture.style.top = `${(0.5 - center.y) * 100}%`;
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
    uniforms.uCamDist.value = camera.position.z;

    const matrix = galaxy.matrixWorld.elements;
    const mx = (smoothPointer.x - previousPointer.x) / Math.max(dt, 0.001);
    const my = (smoothPointer.y - previousPointer.y) / Math.max(dt, 0.001);
    const speed = Math.hypot(mx, my);
    const limit = Math.min(1, 1.5 / Math.max(speed, 0.001));
    const strength = (media.matches ? 0.25 : 1) * (1 - videoSettle);
    const scale = uniforms.uLogoScale.value;
    const heroOffset = uniforms.uHeroOffset.value;

    // Keep the original GM particles on their individual CPU springs.
    const leftHero = state.bridgeMode || state.hero >= 0.025;
    let gmDirty = false;
    if (leftHero && springsMoving) {
      offsets.fill(0, 0, logoPoints.length * 2);
      velocities.fill(0);
      springsMoving = false;
      gmDirty = true;
    }
    if (!leftHero && (pointerActive || springsMoving)) {
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
        const weight = pointerActive && !dragging && atHero && (time > 4 || media.matches)
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
      offsetAttribute.clearUpdateRanges();
      offsetAttribute.addUpdateRange(0, logoPoints.length * 2);
      offsetAttribute.needsUpdate = true;
    }

    // A compact screen-space spring field drives all later constructions.
    // The shader samples this at each star's current projected position.
    const fieldForces = pointerActive && !dragging && interactionAvailable() && !atHero;
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
    failed();
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
  last = performance.now();
  frame = requestAnimationFrame(render);

  return () => {
    abort.abort();
    brainWatcher.disconnect();
    cancelAnimationFrame(frame);
    unwatch();
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
    brainGeometry?.dispose();
    material.dispose();
    brainMaterial.dispose();
    brainDepthMaterial.dispose();
    nebulaSubject.strength = 0;
    springTexture.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
