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
import { buildBlueprintParticles } from './blueprint-geometry';
import { buildBrainVolume } from './brain-volume';
import { springStep } from './gesture-spring';
import { phonePixelRatio, reportFrame, watchPixelRatio } from './pixel-ratio';

const ANIMATION_SPEED = 1.25;
// The background stars live in the site-wide sky (star-sky.tsx).
// The villa's drawing and each layer of the brain use this many stars.
const BASE_COUNT = brainPoints.length;
// The brain: front, rim, far side, and a double inner fill.
const BRAIN_COUNT = BASE_COUNT * 5;
// Phones draw half of each (the samples are shuffled, so any half covers the
// whole drawing): a lighter villa, and only the brain's surface layers.
const MOBILE_LAYER = BASE_COUNT / 2;
const MOBILE_COUNT = MOBILE_LAYER * 3;
// Its drawing spans about this much, in scene units at scale 1.
const BRAIN_WIDTH = 0.68;
const BRAIN_HEIGHT = 0.6;
// The method's timeline starts from the loose stars (see method-story.tsx).
const METHOD_START = 0.775;
// The GM's height at scale 1, its dust included, and its letters' width (see gm-points.json).
const LOGO_HEIGHT = 0.62;
const LOGO_WIDTH = 0.818;
// Phones: the GM rests in the header logo. gm-logo.png is drawn at 176% of the
// logo's box and its monogram spans 44.7% of the image.
const LOGO_MARK = 1.76 * 0.447;
// ---------- The phone opening ----------
// Seconds from its start; the shader reads the same values. In the dark a blue
// spiral of stars lights up and writes GOMORE (scripts/sample-gomore.mjs, 2
// units wide) letter by letter; a glint runs along it; the word twists and
// folds into the GM, which locks with a flash that blows the cloud away as a
// ring; the GM half-turns, then breaks into a stream of stars that pours into
// the header logo.
const WORD_WIDTH = 2;
const OPENING = {
  write: 0.15, writeSpread: 0.4, writeTime: 0.45,
  sweep: 0.9, sweepTime: 0.5,
  fold: 1.25, foldTime: 0.45, impact: 1.8,
  turn: 1.85, turnTime: 0.55,
  rise: 2.35, riseSpread: 0.32, riseTime: 0.48,
  reveal: 2.85, end: 3.25,
};
// The cloud borrows this many of the villa's stars while the opening plays.
const OPENING_CLOUD = 6000;
// The opening's stage sits a little above the centre of the screen.
const STAGE_Y = 0.04;
const glslFloat = (value: number) => value.toFixed(3);
const openingShader = `
 // ---------- The phone opening (see OPENING) ----------
 uniform float uOpening;
 uniform float uClock;
 uniform float uWordScale;
 uniform float uMonoScale;
 // The header logo: its centre, and the GM's scale there.
 uniform vec3 uLogoRest;
 const float STAGE_Y = ${glslFloat(STAGE_Y)};
 const float WORD_WIDTH = ${glslFloat(WORD_WIDTH)};
 const float WRITE = ${glslFloat(OPENING.write)};
 const float WRITE_SPREAD = ${glslFloat(OPENING.writeSpread)};
 const float WRITE_TIME = ${glslFloat(OPENING.writeTime)};
 const float SWEEP = ${glslFloat(OPENING.sweep)};
 const float SWEEP_TIME = ${glslFloat(OPENING.sweepTime)};
 const float FOLD = ${glslFloat(OPENING.fold)};
 const float FOLD_TIME = ${glslFloat(OPENING.foldTime)};
 const float IMPACT = ${glslFloat(OPENING.impact)};
 const float TURN = ${glslFloat(OPENING.turn)};
 const float TURN_TIME = ${glslFloat(OPENING.turnTime)};
 const float RISE = ${glslFloat(OPENING.rise)};
 const float RISE_SPREAD = ${glslFloat(OPENING.riseSpread)};
 const float RISE_TIME = ${glslFloat(OPENING.riseTime)};

 float after(float from, float duration) {
   return smoothstep(0.0, 1.0, (uClock - from) / duration);
 }
 vec2 swivel(vec2 v, float angle) {
   float c = cos(angle);
   float s = sin(angle);
   return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
 }
 // The blue cloud: a tilted two-armed spiral around the stage, its inner stars
 // turning faster. Each star keeps its own place in it, from its seeds.
 vec3 inCloud(float reach) {
   float r = fract(aOrigin.x / 1.7 + 0.5);
   r = 0.05 + r * r * reach;
   float arm = step(0.5, fract(aOrigin.y / 1.3 + 0.5)) * 3.14159;
   float angle = arm + r * 7.0 + (fract(aPhase * 1.113) - 0.5) * 1.2 - uClock * 0.45 / (0.2 + r);
   float span = 0.5 * uAspect;
   return vec3(cos(angle) * r * span * 1.15, STAGE_Y + sin(angle) * r * span * 0.5, sin(angle) * r * 0.35);
 }
`;

const vertexShader = `
 attribute vec3 aOrigin;
 attribute vec3 aColor;
 attribute vec4 aStyle;
 // The brain: its star, the surface normal (w: original relief depth), and
 // its layer (0 front, 2 rim and far side, 3 inner fill) with its shade.
 attribute vec3 aBrain;
 attribute vec4 aBrainNormal;
 attribute vec2 aBrainStyle;
 #define aDetail aBrainStyle.x
 #define aBrainShade aBrainStyle.y
 attribute vec4 aPlan;
 attribute vec4 aBuilding;
 attribute vec2 aArchitecture;
 #define aDrawOrder aArchitecture.y
 attribute vec2 aOffset;
 // Role in the GM monogram: 2 outline, 1 fill, 0 dust, -1 not part of it.
 attribute float aGlyph;
 // The phone opening: this star's place in GOMORE.
 attribute vec2 aWord;
 #define aSize aStyle.x
 #define aLight aStyle.y
 #define aPhase aStyle.z
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
 // The method's timeline, unchanged: 0.775 loose stars → 0.815 villa → 1 video.
 uniform float uScroll;
 // Share of the hero scrolled away.
 uniform float uHero;
 // The idea scene before the form (0 → 1), shown while uBridgeMode is 1.
 uniform float uBridge;
 uniform float uBridgeMode;
 // The brain turns on itself, placed beside the scene's words.
 uniform float uBrainTurn;
 uniform vec2 uBrainCenter;
 uniform float uBrainScale;
 uniform float uVideoReady;
 uniform float uCamDist;
 uniform sampler2D uSpringField;
 uniform vec2 uFieldSize;
 varying vec3 vColor;
 varying float vLight;
 varying float vStar;
 varying float vSparkle;
 varying float vSpriteCrop;
${openingShader}
 void main() {
   float motion = 1.0 - uReduced;
   float scrolled = max(uHero, uBridgeMode);
   float t = clamp((uTime * 1.33 - 0.8 - aPhase * 0.12) / 4.8, 0.0, 1.0);
   float ordered = t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
   ordered = mix(ordered, 1.0, max(uReduced, smoothstep(0.0, 0.02, scrolled)));

   // ---------- Hero → method ----------
   // The GM rises with the page and opens into a loose cloud; its stars, joined
   // by the rest of the field, then draw the villa of the method.
   float isGlyph = step(-0.5, aGlyph);
   float release = smoothstep(0.04, 0.5, uHero);
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
   vec3 plan = vec3(aPlan.x, -aPlan.z, 0.0) * uAspect * frameWidth;
   plan.xy += mix(vec2(-uAspect * 0.20, 0.0), uPlan, uCompact);
   // Layered relief while drawing; flattens before the video so the crossfade stays exact.
   plan.z = aOrigin.z * 0.12 * (1.0 - smoothstep(0.815, 0.845, uScroll));
   // Each group of stars joins the progressive drawing in turn.
   float assemble = smoothstep(0.775 + aDrawOrder * 0.037, 0.797 + aDrawOrder * 0.037, uScroll);
   target = mix(target, plan, assemble);

   // ---------- The idea, before the form ----------
   // A brain of stars turns slowly on itself. It condenses from a loose halo
   // as the scene arrives, and its stars melt away as the form arrives.
   float gather = mix(smoothstep(0.0, 0.3, uBridge), 1.0, uReduced);
   float melt = smoothstep(0.8 + fract(aPhase * 3.7) * 0.06, 0.94 + fract(aPhase * 3.7) * 0.06, uBridge) * motion;
   vec3 brain = aBrain * uBrainScale;
   vec2 brainOverview = brain.xy + uBrainCenter;
   // Front stars stay on the camera ray through their reference position, so
   // the resting view matches the original drawing exactly.
   brainOverview *= (2.0 - brain.z) / (2.0 - aBrainNormal.w * uBrainScale);
   mat3 brainRotation = mat3(
     cos(uBrainTurn), 0.0, -sin(uBrainTurn),
     0.0, 1.0, 0.0,
     sin(uBrainTurn), 0.0, cos(uBrainTurn)
   );
   vec3 brainPivot = vec3(uBrainCenter, -0.12 * uBrainScale);
   vec3 thought = brainPivot + brainRotation * (vec3(brainOverview, brain.z) - brainPivot);
   thought += vec3(aOrigin.x * uAspect, aOrigin.y, aOrigin.z) * 0.18 * (1.0 - gather) * motion;
   thought.y -= (1.0 - gather) * 0.08 * motion;
   // Melting: each star drifts a little outward and upward as it fades.
   thought += ((thought - brainPivot) * 0.35 + vec3(sin(aPhase * 2.3) * 0.05, 0.12, 0.0)) * melt;
   target = mix(target, thought, uBridgeMode);

   // Kept tiny while the GM is formed, so the outline of the letters stays sharp.
   float glyph = isGlyph * (1.0 - smoothstep(0.0, 0.1, uHero)) * (1.0 - uBridgeMode);
   float orbit = mix(mix(0.015, 0.005, glyph), 0.0012, max(release, uBridgeMode))
     * motion * (1.0 - projectMix);
   target += vec3(
     sin(uTime * 0.7 + aPhase),
     cos(uTime * 0.55 + aPhase * 1.7),
     sin(uTime * 0.42 + aPhase)
   ) * orbit;
   target.y += sin(position.x * 18.0 + uTime * 0.65) * mix(0.006, 0.0025, glyph) * motion * (1.0 - release) * (1.0 - uBridgeMode);

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

   // ---------- The phone opening ----------
   float openingLight = 0.0;
   vec3 openingColor = vec3(1.0);
   float openingSize = 1.0;
   float openingHalo = 0.0;
   if (uOpening > 0.5) {
     float seedA = fract(aPhase * 1.1141);
     float seedB = fract(aPhase * 2.0697 + 0.31);
     float seedC = aOrigin.z / 1.35 + 0.5;
     vec2 stage = vec2(0.0, STAGE_Y);
     float twinkle = 0.78 + 0.22 * sin(uClock * (5.0 + seedA * 4.0) + aPhase * 3.0);
     vec3 cloudBlue = mix(vec3(0.36, 0.52, 1.0), vec3(0.72, 0.82, 1.0), seedB);
     // The GM locking together: a flash through every star.
     float flash = exp(-pow((uClock - IMPACT) / 0.07, 2.0));
     if (isGlyph > 0.5) {
       // Written: each star leaves the cloud for its place in GOMORE, the
       // letters appearing left to right, each star landing with a spark.
       float writeFrom = WRITE + WRITE_SPREAD * (aWord.x / WORD_WIDTH + 0.5) + 0.08 * seedA;
       float written = after(writeFrom, WRITE_TIME);
       // Folded: the word twists and closes up into the GM, its stars
       // scattering in depth before they lock.
       float folded = after(FOLD + 0.08 * seedB, FOLD_TIME);
       // Turned: a half turn that still ends on a readable GM (past edge-on
       // the letters are mirrored, so the turn brings them back true),
       // swelling and tilting a little on the way.
       float turned = after(TURN, TURN_TIME);
       vec3 mono = position * uMonoScale * (1.0 + 0.08 * sin(3.14159 * turned));
       mono.x *= 1.0 - 2.0 * step(0.5, turned);
       mono.xz = swivel(mono.xz, 3.14159 * turned);
       mono.yz = swivel(mono.yz, 0.3 * sin(3.14159 * turned));
       vec3 shaped = mix(vec3(aWord * uWordScale, 0.0), mono, folded);
       shaped.xy = stage + swivel(shaped.xy, 0.45 * sin(3.14159 * folded));
       shaped.z += sin(3.14159 * folded) * (seedC - 0.5) * 0.45;
       vec3 born = inCloud(0.7);
       vec2 way = shaped.xy - born.xy;
       vec3 placed = mix(born, shaped, written);
       placed.xy += vec2(-way.y, way.x) * sin(3.14159 * written) * 0.25;
       // Risen: the GM comes apart from the corner nearest the logo, its stars
       // flowing as a stream that swings out to the right and up, widening
       // mid-flight, and pours into the header logo.
       float queue = (position.x / 0.82 + 0.5) * 0.6 + (0.5 - position.y / 0.58) * 0.4;
       float rose = after(RISE + RISE_SPREAD * queue + 0.08 * seedC, RISE_TIME);
       vec3 home = vec3(position.xy * uLogoRest.z + uLogoRest.xy, 0.0);
       vec3 bend = mix(placed, home, 0.5) + vec3(
         (0.34 + (seedA - 0.5) * 0.14) * uAspect,
         0.06 + (seedB - 0.5) * 0.08,
         0.3 + (seedC - 0.5) * 0.3
       );
       float q = 1.0 - rose;
       p = q * q * placed + 2.0 * q * rose * bend + rose * rose * home;

       float glint = exp(-pow((aWord.x - mix(-1.4, 1.4, after(SWEEP, SWEEP_TIME))) / 0.2, 2.0)) * (1.0 - folded);
       float landing = exp(-pow((uClock - writeFrom - WRITE_TIME) / 0.08, 2.0));
       float lit = aLight * twinkle * 1.15 * (1.0 + 1.2 * landing + 1.8 * glint + 1.8 * flash);
       openingLight = mix(aLight * 0.5 * after(0.0, 0.5), lit, written);
       // Brighter as it flies, gone as it reaches the logo.
       openingLight *= (1.0 + 0.4 * sin(3.14159 * rose)) * (1.0 - smoothstep(0.45, 0.95, rose));
       openingColor = mix(cloudBlue, mix(aColor, vec3(0.88, 0.92, 1.0), 0.55), written);
       openingColor = mix(openingColor, vec3(1.0, 0.96, 0.9), glint * 0.6);
       openingColor = mix(openingColor, vec3(0.62, 0.76, 1.0), sin(3.14159 * rose) * 0.6);
       openingSize = mix(min(aSize, 12.0) * 0.8, aSize, written) * mix(1.0, 0.35, rose);
     } else {
       // The cloud: it glows in, draws in a little as the word folds, and the
       // flash blows it out into a widening ring that fades.
       vec3 cloud = inCloud(1.0);
       // Its bright core would sit in the middle of the word: it dims as the word appears.
       float core = mix(1.0, smoothstep(0.3, 0.6, fract(aOrigin.x / 1.7 + 0.5)), after(WRITE + 0.2, 0.5));
       vec2 rel = (cloud.xy - stage) * (1.0 - 0.3 * after(FOLD, FOLD_TIME));
       float blown = after(IMPACT, 0.75);
       float reach = length(rel / (vec2(1.15, 0.5) * 0.5 * uAspect));
       rel += normalize(rel + 1e-4) * blown * uAspect * (0.75 - 0.5 * smoothstep(0.0, 0.9, reach));
       p = vec3(stage + rel, cloud.z + blown * (seedC - 0.5) * 0.5);
       openingLight = aLight * 0.5 * twinkle * after(0.0, 0.6) * core * (1.0 - blown) * (1.0 + 1.5 * flash);
       openingColor = cloudBlue;
       openingSize = min(aSize, 12.0) * 0.9;
       openingHalo = 0.55;
     }
   }

   vec4 mv = modelViewMatrix * vec4(p, 1.0);
   // Touch screens do not use particle gestures, so skip the spring texture
   // and its four samples for every point.
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
     float fieldBlend = smoothstep(0.020, 0.025, scrolled);
     displacement = mix(aOffset, fieldOffset, fieldBlend)
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
   // An opaque-looking brain: hide the surface turned away from the camera.
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
   float looseSize = min(aSize, 12.0);
   #ifdef PHONE
   // A phone screen is small: the loose stars between the GM and the villa stay finer.
   looseSize *= 0.75;
   #endif
   float renderedSize = mix(aSize, looseSize, release);
   renderedSize = mix(renderedSize, 6.5, projectMix);
   renderedSize = mix(renderedSize, 7.5 + aBrainShade * 6.5, uBridgeMode);
   if (uOpening > 0.5) renderedSize = openingSize;
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
   float blueprintLight = (0.20 + aBuilding.w * 0.42) * clamp(uAspect * frameWidth / 1.4, 0.28, 1.0);
   // Unassembled particles remain visible: the drawing is made by their arrival.
   heroLight = mix(heroLight, blueprintLight, projectMix);
   heroLight *= 1.0 - smoothstep(0.84, 0.865, uScroll) * uVideoReady;

   // Light: the brain's own shading from the reference drawing.
   float thoughtLight = 0.035 + aBrainShade * aBrainShade * 1.6;
   thoughtLight *= clamp(pow(uBrainScale / 1.18, 0.8), 0.30, 1.0);
   // The rim, the far side and the inner fill show only where the solid faces the camera.
   if (aDetail > 1.5) thoughtLight *= brainBack;
   thoughtLight *= mix(1.0, brainVisible, brainShell);
   thoughtLight *= 0.65 * gather * (1.0 - melt);
   #ifdef PHONE
   // Phones draw only half of the surface layers: each star carries a little more light.
   thoughtLight *= 1.25;
   #endif

   vLight = mix(heroLight, thoughtLight, uBridgeMode);
   if (uOpening > 0.5) vLight = openingLight;
   vLight *= depthCue * nearFade;

   vec3 starColor = vec3(0.78, 0.85, 1.0);
   vec3 heroColor = mix(mix(aColor, starColor, release), vec3(0.94, 0.97, 1.0), projectMix);
   vColor = mix(heroColor, aColor, uBridgeMode);
   if (uOpening > 0.5) vColor = openingColor;

   // Loose stars glow with a halo; so does the opening's cloud.
   vStar = max(release * 0.85 * (1.0 - uBridgeMode), openingHalo);
   // The brightest stars of the GM become four-point sparkles: irregular in
   // size, colour and shape, while the outline carries the letters.
   vSparkle = max(glyph * smoothstep(32.0, 50.0, aSize) * 0.85, release * smoothstep(22.0, 34.0, aSize) * 0.35) * (1.0 - uBridgeMode);
   // Compact dots (the GM, the brain) have no broad halo. Trim only transparent
   // sprite margins and remap UVs, preserving their pixel size, light and position.
   vSpriteCrop = (vStar == 0.0 && vSparkle == 0.0) ? 0.6 : 1.0;
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
   float alpha = (core + inner + halo + rays) * vLight;
   if (alpha < 0.0003) discard;
   gl_FragColor = vec4(mix(vColor, vec3(1.0), core * 0.6), alpha);
 }
`;

export type ParticleFrame = {
  /** The method's timeline: 0.775 loose stars → 0.815 villa → 1 construction video. */
  progress: number;
  /** Share of the hero scrolled away (0 → 1): the GM rises and opens. */
  hero: number;
  /** The idea scene before the form (0 → 1), drawn while bridgeMode is on. */
  bridge: number;
  bridgeMode: boolean;
  videoReady: boolean;
  active: boolean;
};

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
      host.dataset.failed = 'true';
      onFailedRef.current?.();
      return;
    }

    host.dataset.failed = 'false';
    renderer.setClearColor(0, 0);
    renderer.setPixelRatio(mobile.matches ? phonePixelRatio() : Math.min(devicePixelRatio, 2));
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

    const count = phone.matches ? MOBILE_COUNT : BRAIN_COUNT;
    const layer = phone.matches ? MOBILE_LAYER : BASE_COUNT;
    const positions: number[] = [];
    const origins: number[] = [];
    const colors: number[] = [];
    const styles: number[] = [];
    const brains: number[] = [];
    const brainNormals: number[] = [];
    const brainStyles: number[] = [];
    const plans: number[] = [];
    const buildings: number[] = [];
    const buildingKinds: number[] = [];
    const glyphs: number[] = [];
    const brainVolume = buildBrainVolume(brainPoints, random);
    const projectParticles = buildBlueprintParticles(BASE_COUNT, random);

    for (let i = 0; i < count; i++) {
      const project = projectParticles[i % BASE_COUNT];
      plans.push(project.plan.x, project.plan.y, project.plan.z, project.phase);
      buildings.push(project.built.x, project.built.y, project.built.z, project.shade);
      buildingKinds.push(project.kind, project.draw);
      const point = logoPoints[i % logoPoints.length];
      const glyph = i < logoPoints.length;
      // Monogram stars sit exactly on the sampled letters (see scripts/sample-gm.mjs).
      // An irregular edge: most monogram stars stay close to the outline, a few stray further.
      const roll = random();
      const scatter = glyph ? 0.0075 * (1 + 3 * roll ** 3) : roll < 0.20 ? 0.075 : 0.022;
      positions.push(
        point[0] + (random() - 0.5) * scatter,
        point[1] + (random() - 0.5) * scatter,
        // Shallow depth: perspective would otherwise smear the off-centre letters.
        (random() - 0.5) * (glyph ? 0.03 : 0.16),
      );
      glyphs.push(glyph ? point[2] : -1);
      origins.push((random() - 0.5) * 1.7, (random() - 0.5) * 1.3, (random() - 0.5) * 1.35);

      const heat = random();
      colors.push(...(heat < 0.65 ? [0.94, 0.95, 1] : heat < 0.85 ? [0.64, 0.82, 1] : [1, 0.8, 0.59]));
      const bright = random();
      const size = bright > 0.993 ? 58 : bright > 0.94 ? 28 : 7 + random() * 10;
      const light = 0.32 + random() * 0.4;
      styles.push(size, light, random() * Math.PI * 2, 0);
      const reference = brainPoints[i % layer];
      if (i < layer) {
        // Reference star on the solid's front face; w keeps its original depth.
        const [z, nx, ny, nz] = brainVolume.front.subarray(i * 4, i * 4 + 4);
        brains.push(reference[0], reference[1], z);
        brainNormals.push(nx, ny, nz, reference[2]);
        brainStyles.push(0, reference[3]);
      } else if (i < layer * 2) {
        // Rim of the solid (top, bottom, poles), revealed by rotation.
        const k = (i - layer) * 7;
        const [x, y, z, shade, nx, ny, nz] = brainVolume.rim.subarray(k, k + 7);
        brains.push(x, y, z);
        brainNormals.push(nx, ny, nz, z);
        brainStyles.push(2, shade);
      } else if (i < layer * 3) {
        // Far hemisphere, carrying the same reference drawing.
        const j = i - layer * 2;
        const [z, nx, ny, nz] = brainVolume.far.subarray(j * 4, j * 4 + 4);
        brains.push(reference[0], reference[1], z);
        brainNormals.push(nx, ny, nz, z);
        brainStyles.push(2, reference[3]);
      } else {
        // Continuous inner surface, including the dark folds.
        const k = (i - layer * 3) * 7;
        const [x, y, z, shade, nx, ny, nz] = brainVolume.fill.subarray(k, k + 7);
        brains.push(x, y, z);
        brainNormals.push(nx, ny, nz, z);
        brainStyles.push(3, shade);
      }
    }

    const geometry = new BufferGeometry();
    for (const [name, array, size] of [
      ['position', positions, 3],
      ['aOrigin', origins, 3],
      ['aColor', colors, 3],
      ['aStyle', styles, 4],
      ['aBrain', brains, 3],
      ['aBrainNormal', brainNormals, 4],
      ['aBrainStyle', brainStyles, 2],
      ['aPlan', plans, 4],
      ['aBuilding', buildings, 4],
      ['aArchitecture', buildingKinds, 2],
      ['aGlyph', glyphs, 1],
    ] as [string, number[], number][]) {
      geometry.setAttribute(name, new Float32BufferAttribute(array, size));
    }

    // Filled only when the phone opening plays (see below).
    const wordAttribute = new Float32BufferAttribute(new Float32Array(count * 2), 2);
    geometry.setAttribute('aWord', wordAttribute);

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
      defines: { ...(mobile.matches ? { MOBILE: 1 } : {}), ...(phone.matches ? { PHONE: 1 } : {}) },
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uDpr: { value: renderer.getPixelRatio() },
        uPixelScale: { value: 1 },
        uLogoScale: { value: 1 },
        uGlyphLight: { value: 1 },
        uOpening: { value: 0 },
        uClock: { value: 0 },
        uWordScale: { value: 1 },
        uMonoScale: { value: 1 },
        uLogoRest: { value: new Vector3() },
        uHeroOffset: { value: new Vector2() },
        uAspect: { value: 1 },
        uCompact: { value: 0 },
        uPlan: { value: new Vector2(0, -0.05) },
        uPlanWidth: { value: 0.86 },
        uReduced: { value: media.matches ? 1 : 0 },
        uScroll: { value: METHOD_START },
        uHero: { value: 0 },
        uBridge: { value: 0 },
        uBridgeMode: { value: 0 },
        uBrainTurn: { value: 0 },
        uBrainCenter: { value: new Vector2() },
        uBrainScale: { value: 1 },
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
    // The stars answer the pointer in the GM, the villa's drawing and the
    // brain; never over the video or while the brain melts away.
    const interactionAvailable = () => {
      const state = frameState.current;
      if (mobile.matches) return false;
      if (state.bridgeMode) return state.bridge < 0.8;
      return !(videoReadyRef.current && scrollRef.current >= 0.84);
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

    // ---------- The phone opening ----------
    // The page's first script marks it with .gm-intro (page.tsx) and hides the
    // header and the copy; the shader plays the opening from one clock (see
    // OPENING), then the page appears. A touch skips it.
    const root = document.documentElement;
    let phoneHero = false;
    const rest = { scale: 0.05, x: 0, y: 0.45 };
    const stage = { word: 0.2, mono: 0.3 };
    let opening: 'waiting' | 'playing' | 'done' = root.classList.contains('gm-intro') ? 'waiting' : 'done';
    let openingStart = 0;
    let wordReady = false;
    // A slow push-in of the camera while the word forms and folds.
    let openingPush = 0;
    const placeOpening = (seconds: number) => {
      const u = material.uniforms;
      const playing = phoneHero && Number.isFinite(seconds);
      u.uOpening.value = playing ? 1 : 0;
      u.uClock.value = playing ? seconds : 0;
      const push = playing ? (seconds - OPENING.write) / (OPENING.rise - OPENING.write) : 0;
      openingPush = push > 0 && push < 1 ? 0.16 * Math.sin(Math.PI * push) : 0;
      if (!phoneHero) {
        u.uGlyphLight.value = 1;
        return;
      }
      // At rest the GM sits, unlit, in the header logo: the page draws the logo.
      u.uGlyphLight.value = 0;
      u.uLogoScale.value = rest.scale;
      (u.uHeroOffset.value as Vector2).set(rest.x, rest.y);
      (u.uLogoRest.value as Vector3).set(rest.x, rest.y, rest.scale);
      u.uWordScale.value = stage.word;
      u.uMonoScale.value = stage.mono;
    };
    const showPage = () => {
      if (!root.classList.contains('gm-intro')) return;
      root.classList.remove('gm-intro');
      root.classList.add('gm-intro-done');
    };
    const skipEvents = ['pointerdown', 'wheel', 'keydown', 'scroll'] as const;
    const finishOpening = () => {
      if (opening === 'done') return;
      opening = 'done';
      skipEvents.forEach((type) => removeEventListener(type, finishOpening));
      showPage();
      delete root.dataset.intro;
      root.style.removeProperty('--opening-impact');
      placeOpening(Infinity);
    };
    if (opening !== 'done') {
      skipEvents.forEach((type) => addEventListener(type, finishOpening, { passive: true }));
      import('./gomore-points.json').then(({ default: word }) => {
        const array = wordAttribute.array as Float32Array;
        word.forEach(([x, y], i) => { array[i * 2] = x; array[i * 2 + 1] = y; });
        wordAttribute.needsUpdate = true;
        wordReady = true;
      }, finishOpening);
    }

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
      // There the villa's drawing lands exactly on the construction video,
      // wherever the page puts it. The video's stage keeps the height of the
      // screen with the browser bars shown, while this canvas grows as they
      // hide: measuring (and measuring again on resize) keeps the two aligned.
      const frame = document.querySelector<HTMLElement>('.gm-construction-video');
      if (frame) {
        material.uniforms.uPlanWidth.value = frame.offsetWidth / width;
        (material.uniforms.uPlan.value as Vector2).set(
          ((frame.offsetLeft + frame.offsetWidth / 2) / width - 0.5) * camera.aspect,
          0.5 - frame.offsetTop / height,
        );
      }
      const fullScale = Math.min(1, (camera.aspect * 0.84) / 0.82);
      // The headline leads; the GM fills the space the copy leaves free,
      // measured from the rendered hero copy rather than guessed.
      const heroOffset = material.uniforms.uHeroOffset.value as Vector2;
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
        // The opening, centred a little high: GOMORE across the screen, then the GM.
        stage.word = (0.86 * camera.aspect) / WORD_WIDTH;
        stage.mono = (0.62 * camera.aspect) / LOGO_WIDTH;
        placeOpening(opening === 'playing' ? (performance.now() - openingStart) / 1000 : Infinity);
      } else if (camera.aspect < 1.05) {
        // Stacked: the GM sits between the header and the copy.
        const top = 76;
        const bottom = copy ? copy.offsetTop - 24 : height * 0.45;
        const room = Math.max(90, bottom - top);
        material.uniforms.uLogoScale.value = Math.min(fullScale * 0.92, room / height / LOGO_HEIGHT) * 1.10;
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
      if (!phoneHero) {
        placeOpening(Infinity);
        finishOpening();
      }
      // The brain sits beside the scene's words: to their right on wide
      // screens, below them on phones and portrait tablets.
      const brainCenter = material.uniforms.uBrainCenter.value as Vector2;
      const words = document.querySelector<HTMLElement>('.gm-bridge-copy');
      const header = 76;
      if (width <= 760 || camera.aspect < 1.05) {
        const top = words ? words.offsetTop + words.offsetHeight + 28 : height * 0.3;
        const bottom = height - 96; // clears the scroll cue
        const room = Math.max(120, bottom - top);
        // Narrower than the screen: turning, the brain is wider in some views.
        const scale = Math.min(1.12, (camera.aspect * 0.72) / BRAIN_WIDTH, (room / height) / BRAIN_HEIGHT);
        material.uniforms.uBrainScale.value = scale;
        brainCenter.set(0, 0.5 - (top + room / 2) / height);
      } else {
        const textRight = words ? words.offsetLeft + words.offsetWidth : width * 0.45;
        const start = (textRight + 48) / width;
        const end = 0.96;
        const scale = Math.min(1.12, ((end - start) * camera.aspect * 0.9) / BRAIN_WIDTH, ((height - header) / height * 0.8) / BRAIN_HEIGHT);
        material.uniforms.uBrainScale.value = scale;
        brainCenter.set(((start + end) / 2 - 0.5) * camera.aspect, -(header / height) / 2);
      }
      material.uniforms.uPixelScale.value = Math.max(
        0.65,
        Math.min(1.3, height / 720),
      );
    };

    window.addEventListener('resize', resize);
    resize();
    // Phones: sharper stars, one step coarser if the device falls behind.
    const unwatch = watchPixelRatio(() => {
      renderer.setPixelRatio(phonePixelRatio());
      material.uniforms.uDpr.value = renderer.getPixelRatio();
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
      scrollRef.current = state.bridgeMode ? METHOD_START : state.progress;
      videoReadyRef.current = state.videoReady;
      if (document.hidden || !onScreen || !state.active) return;
      const behindVideo = !state.bridgeMode && state.videoReady && state.progress >= 0.866;
      if (behindVideo !== asleep) {
        asleep = behindVideo;
        renderer.domElement.style.visibility = asleep ? 'hidden' : '';
      }
      if (asleep) return;
      if (mobile.matches) reportFrame(now, elapsed);

      if (opening === 'waiting') {
        // The page stopped waiting for the stars (page.tsx): no opening today.
        if (!root.classList.contains('gm-intro')) finishOpening();
        else if (wordReady) {
          opening = 'playing';
          openingStart = now;
          // The page's own effects (globals.css) keep time with the stars.
          root.style.setProperty('--opening-impact', `${OPENING.impact}s`);
          root.dataset.intro = 'playing';
        }
      }
      if (opening === 'playing') {
        const seconds = (now - openingStart) / 1000;
        placeOpening(seconds);
        if (seconds >= OPENING.reveal) showPage();
        if (seconds >= OPENING.end) finishOpening();
      }

      const atHero = !state.bridgeMode && state.hero < 0.02;
      time += dt * ANIMATION_SPEED;
      // Once the visitor scrolls on, returning to the top must restore the
      // completed monogram even if the opening assembly was interrupted.
      if (!atHero) time = Math.max(time, 10);
      material.uniforms.uTime.value = media.matches ? 10 : time;
      material.uniforms.uReduced.value = media.matches ? 1 : 0;
      material.uniforms.uScroll.value = scrollRef.current;
      material.uniforms.uHero.value = state.bridgeMode ? 1 : state.hero;
      material.uniforms.uBridge.value = state.bridge;
      material.uniforms.uBridgeMode.value = state.bridgeMode ? 1 : 0;
      // One full revolution every 18 seconds; it pauses while the visitor drags,
      // and starts again from the resting view each time the scene returns.
      if (media.matches || !state.bridgeMode) {
        material.uniforms.uBrainTurn.value = 0;
      } else if (!dragging) {
        material.uniforms.uBrainTurn.value = (material.uniforms.uBrainTurn.value + dt * Math.PI * 2 / 18) % (Math.PI * 2);
      }
      // Draw only the stars the current scene uses: the GM, the villa, or the network.
      geometry.setDrawRange(0, atHero
        ? logoPoints.length + (opening === 'playing' ? Math.min(OPENING_CLOUD, count - logoPoints.length) : 0)
        : state.bridgeMode ? count : layer);
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
      // The villa's drawing settles, aligned and untilted, before its video.
      const videoSettle = videoReadyRef.current && !state.bridgeMode
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
      const heroWeight = 1 - Math.min(1, state.hero / 0.5);
      const logoCenter = material.uniforms.uHeroOffset.value as Vector2;
      const brainCenter = material.uniforms.uBrainCenter.value as Vector2;
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
        const logoScale = material.uniforms.uLogoScale.value;
        const brainScale = material.uniforms.uBrainScale.value;
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
      const distanceGoal = zoomTarget + (REST_DISTANCE - zoomTarget) * videoSettle - openingPush;
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
        offsetAttribute.array.set(offsets.subarray(0, logoPoints.length * 2));
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
      unwatch();
      skipEvents.forEach((type) => removeEventListener(type, finishOpening));
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

