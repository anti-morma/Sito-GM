import {
  AdditiveBlending, BufferGeometry, Float32BufferAttribute, LinearFilter,
  Mesh, PlaneGeometry, Points, Scene, ShaderMaterial, Vector2,
  WebGLRenderTarget, type Camera, type WebGLRenderer,
} from 'three';
import { nebulaJourney, nebulaSubject } from './nebula-state';

// The gas drifts so slowly (its clock runs at 1.8% of the page's) that it is
// computed as keyframes a couple of seconds apart and cross-faded in between.
// Each keyframe is drawn a few rows per frame while the previous pair is on
// screen, so the costly noise never lands on a single frame: per frame the
// nebula costs two texture reads per pixel.
const KEY = 2.5;
// The atlas spans this much of the screen's height around its centre.
const SPAN = 1.8;

const atlasVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// One keyframe of the gas, at uKeyTime. Alpha holds the order in which each
// wisp lets go when the cloud disperses (0 first, 1 last).
const atlasFragmentShader = `
  precision highp float;
  varying vec2 vUv;
  uniform float uKeyTime;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float sum = 0.0, amplitude = 0.5;
    mat2 turn = mat2(0.8, -0.6, 0.6, 0.8);
    for (int i = 0; i < 5; i++) {
      sum += noise(p) * amplitude;
      p = turn * p * 2.03 + 13.7;
      amplitude *= 0.5;
    }
    return sum;
  }
  void main() {
    vec2 p = (vUv - 0.5) * ${SPAN.toFixed(1)};
    float t = uKeyTime * 0.018;
    vec2 q = p * 3.4;
    vec2 warp = vec2(fbm(q + vec2(t, 2.1)), fbm(q + vec2(5.2, -t * 0.7)));
    vec2 folded = q + (warp - 0.5) * 2.9;
    float gas = fbm(folded + vec2(-t * 0.4, t * 0.6));
    float detail = fbm(folded * 2.6 + warp * 3.0);
    float filaments = pow(1.0 - abs(detail * 2.0 - 1.0), 5.0);
    float dust = smoothstep(0.34, 0.69, fbm(q * 0.8 + warp * 2.0 + 8.5));
    // Domain-warped envelope, eroded by dark dust lanes: never a round halo.
    vec2 edge = p + (warp - 0.5) * 0.24;
    float envelope = exp(-dot(edge / vec2(0.48, 0.58), edge / vec2(0.48, 0.58)) * 1.7);
    float density = smoothstep(0.27, 0.72, gas) * envelope;
    density *= mix(0.23, 1.0, dust);
    float veil = smoothstep(0.32, 0.72, gas) * 0.026;
    vec3 blue = mix(vec3(0.10, 0.20, 0.48), vec3(0.30, 0.46, 0.73), detail);
    vec3 violet = vec3(0.35, 0.22, 0.48);
    vec3 color = mix(blue, violet, smoothstep(0.57, 0.76, warp.y) * 0.22);
    color *= density * (0.40 + filaments * 0.44) + veil;
    // The sheet the gas is drawn on has edges, and the thin veil above reaches
    // them: where the sheet stopped, a straight line showed on screen. The gas
    // dissolves well before (from 0.55 to 0.88 of the 0.9 half-span), so no
    // edge is ever seen, at rest or opened up by the scroll.
    color *= 1.0 - smoothstep(0.55, 0.88, length(p));
    // Thin veils and the outskirts go first, the bright filaments last,
    // along torn, warped edges rather than any regular shape.
    float hold = clamp(0.5 * smoothstep(0.2, 0.75, gas) + 0.3 * filaments + 0.35 * (warp.x - 0.3), 0.0, 1.0);
    // The gas is dark: in 8 bits its faint values fall in steps, which the
    // texture filter would draw as square terraces. A fixed sub-step dither
    // (the same in every keyframe, so it never shimmers) melts them.
    float dither = (hash(gl_FragCoord.xy) - 0.5) / 255.0;
    gl_FragColor = vec4(color + dither, hold * envelope / (envelope + 0.08) + dither);
  }
`;

// Shared by the cloud and its stars: where the nebula sits, and the dark
// pocket that keeps the current sculpture (GM, villa, brain) readable.
const nebulaCommon = `
  uniform vec2 uCenter;
  uniform float uAspect;
  uniform float uRadius;
  uniform float uSubject;
  uniform float uDispersion;
  uniform float uScroll;
  uniform float uTime;
  uniform float uBlend;
  uniform float uReady;
  uniform sampler2D uGasA;
  uniform sampler2D uGasB;
  float pocket(vec2 p) {
    return 1.0 - smoothstep(uRadius * 0.42, uRadius * 1.35, length(p));
  }
  vec4 gasAt(vec2 uv) {
    return mix(texture2D(uGasA, uv), texture2D(uGasB, uv), uBlend);
  }
`;

// The cloud: one soft sheet, no pieces. Dispersing, it opens outwards, turns
// a little on itself and tears into wisps that thin out into the sky; the same
// path backwards gathers it again. Its stars go their own way (below).
const cloudVertexShader = `
  ${nebulaCommon}
  varying vec2 vAtlas;
  void main() {
    vAtlas = position.xy;
    float d = uDispersion;
    float open = 1.0 + d * d * 0.9;
    vec2 drift = vec2(0.0, uScroll * 0.05) * d;
    vec2 p = position.xy * open + uCenter + drift;
    gl_Position = vec4(p / vec2(uAspect, 1.0) * 2.0, 0.0, 1.0);
  }
`;

const cloudFragmentShader = `
  precision highp float;
  ${nebulaCommon}
  varying vec2 vAtlas;
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453);
    float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
    float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
    float e = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
    return mix(mix(a, b, f.x), mix(c, e, f.x), f.y);
  }
  void main() {
    vec2 p = vAtlas;
    float d = uDispersion;
    if (d > 0.0005) {
      // A slow vortex, stronger inside, and edges torn by a coarse noise.
      float twist = d * (1.2 - length(p)) * 0.55;
      p = mat2(cos(twist), -sin(twist), sin(twist), cos(twist)) * p;
      p += (vec2(vnoise(p * 3.1 + 7.3), vnoise(p * 3.1 - 2.9)) - 0.5) * d * 0.3;
    }
    vec4 gas = gasAt(p / ${SPAN.toFixed(1)} + 0.5);
    // At rest every wisp is held (gas.a >= 0); dispersing, they let go in turn.
    float letGo = d * 1.2;
    float keep = smoothstep(letGo - 0.22, letGo, gas.a);
    vec3 color = gas.rgb * keep;
    color *= 1.0 - pocket(vAtlas) * uSubject * 0.72;
    gl_FragColor = vec4(color * uReady, 1.0);
  }
`;

// Every star belongs to the cloud and leaves it on its own path into the far
// sky: no shared pieces, no grid. The gas weights its light, so at rest the
// stars trace the filaments and their dark lanes.
const starVertexShader = `
  ${nebulaCommon}
  attribute vec2 aCloud;
  attribute vec3 aStyle;
  uniform float uDpr;
  varying float vLight;
  varying float vHeat;
  varying float vCrop;
  varying float vPixel;
  float starHash(float n) {
    return fract(sin(n * 91.3458) * 47453.5453);
  }
  void main() {
    float phase = aStyle.z;
    vec2 cloud = aCloud + vec2(
      sin(aCloud.y * 9.0 + uTime * 0.035),
      cos(aCloud.x * 8.0 - uTime * 0.03)
    ) * 0.014;
    float seed = starHash(phase * 7.13 + aCloud.x * 3.7);
    float delay = seed * 0.16;
    float progress = smoothstep(delay, 0.84 + delay, uDispersion);
    vec2 drift = vec2(uTime * 0.0015, uScroll * 0.07 + uTime * 0.0025);
    vec2 farSlot = mod(vec2(starHash(seed + 17.3), starHash(seed + 41.7)) + drift, 1.0) - 0.5;
    farSlot.x *= uAspect;
    float depth = 1.0 + progress * (4.0 + seed * 7.0);
    vec2 p = mix(cloud + uCenter, farSlot * depth, progress);
    p += vec2(cos(seed * 6.283), sin(seed * 6.283)) * sin(progress * 3.14159) * (0.16 + seed * 0.35);
    gl_Position = vec4(p / vec2(uAspect, 1.0) * 2.0, 0.0, depth);
    vec2 cloudUv = cloud / ${SPAN.toFixed(1)} + 0.5;
    float density = clamp(gasAt(clamp(cloudUv, 0.0, 1.0)).b * 12.0, 0.0, 1.0);
    density *= 1.0 - pocket(cloud) * uSubject * 0.72;
    float cloudLight = smoothstep(0.025, 0.55, density);
    float shimmer = 0.86 + 0.14 * sin(uTime * 0.45 + phase);
    vLight = aStyle.y * cloudLight * shimmer * uReady / sqrt(depth);
    vHeat = fract(phase * 1.37);
    // Lit only within 0.72 of its sprite (beyond, its light is under the
    // cut-off below): the sprite is trimmed to that, never under 4 px, so a
    // scattered star smaller than a pixel still has room for a core a pixel
    // wide (below) instead of blinking as it drifts between pixels.
    float full = aStyle.x * uDpr / depth;
    gl_PointSize = max(full * 0.72, 4.0);
    vCrop = gl_PointSize / full;
    vPixel = 1.0 / full;
  }
`;

const starFragmentShader = `
  precision highp float;
  varying float vLight;
  varying float vHeat;
  varying float vCrop;
  varying float vPixel;
  void main() {
    vec2 uv = (gl_PointCoord - 0.5) * vCrop;
    float r2 = dot(uv, uv);
    // The core is at least a pixel wide: finer, it would flicker as the star
    // moves. What it loses in peak it keeps in width.
    float s = max(0.0725, 0.8 * vPixel);
    float core = exp(-r2 / (2.0 * s * s)) * (0.0725 / s);
    float halo = exp(-r2 * 22.0) * 0.065;
    float alpha = (core + halo) * vLight;
    if (alpha < 0.002) discard;
    vec3 blue = mix(vec3(0.28, 0.61, 1.0), vec3(0.64, 0.84, 1.0), vHeat);
    gl_FragColor = vec4(blue, alpha);
  }
`;

export function createNebulaField() {
  // Three keyframes: two on screen, the next one being drawn.
  const keys = [0, 1, 2].map(() => new WebGLRenderTarget(1, 1, {
    minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false,
  }));
  const screen = new PlaneGeometry(2, 2);
  const atlasMaterial = new ShaderMaterial({
    vertexShader: atlasVertexShader, fragmentShader: atlasFragmentShader,
    depthTest: false, depthWrite: false,
    uniforms: { uKeyTime: { value: 0 } },
  });
  const atlasScene = new Scene();
  const atlas = new Mesh(screen, atlasMaterial);
  atlas.frustumCulled = false;
  atlasScene.add(atlas);

  const uniforms = {
    uTime: { value: 0 }, uAspect: { value: 1 },
    uCenter: { value: new Vector2(0.24, 0.02) },
    uRadius: { value: 0.3 }, uSubject: { value: 0 },
    uDispersion: { value: 0 }, uScroll: { value: 0 },
    uBlend: { value: 0 },
    uReady: { value: 0 },
    uGasA: { value: keys[0].texture }, uGasB: { value: keys[1].texture },
  };
  const sheet = new PlaneGeometry(SPAN, SPAN);
  const cloudMaterial = new ShaderMaterial({
    vertexShader: cloudVertexShader, fragmentShader: cloudFragmentShader, uniforms,
    transparent: true, blending: AdditiveBlending, depthTest: false, depthWrite: false,
  });
  const backdrop = new Mesh(sheet, cloudMaterial);
  backdrop.frustumCulled = false;
  backdrop.renderOrder = -1;

  const starCount = 13000;
  let seed = 923;
  const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
  const cloudPositions: number[] = [];
  const styles: number[] = [];
  for (let i = 0; i < starCount; i++) {
    cloudPositions.push((random() - 0.5) * 1.6, (random() - 0.5) * 1.7);
    // Keep the existing star sizes, phases and positions deterministic.
    random(); random();
    const bright = random() > 0.985;
    styles.push(bright ? 8 + random() * 4 : 3.5 + random() * 3.5,
      bright ? 0.44 : 0.16 + random() * 0.24, random() * Math.PI * 2);
  }
  const starGeometry = new BufferGeometry();
  starGeometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(starCount * 3), 3));
  starGeometry.setAttribute('aCloud', new Float32BufferAttribute(cloudPositions, 2));
  starGeometry.setAttribute('aStyle', new Float32BufferAttribute(styles, 3));
  const starMaterial = new ShaderMaterial({
    vertexShader: starVertexShader, fragmentShader: starFragmentShader,
    uniforms: { ...uniforms, uDpr: { value: 1 } },
    transparent: true, blending: AdditiveBlending, depthTest: false, depthWrite: false,
  });
  const stars = new Points(starGeometry, starMaterial);
  stars.frustumCulled = false;
  stars.renderOrder = 1;

  // Keyframe bookkeeping: keys[order[0]] at time `from`, keys[order[1]] one
  // KEY later, keys[order[2]] being drawn for the KEY after that.
  const order = [0, 1, 2];
  let from = Number.NaN;
  let rows = 0; // rows of the next keyframe already drawn
  let size = 1;
  let warmKey = 0;
  let warmRows = 0;

  // The atlas quad ignores the camera: any camera will do.
  const drawRows = (renderer: WebGLRenderer, camera: Camera, index: number, time: number, start: number, end: number) => {
    if (end <= start) return;
    const target = keys[index];
    atlasMaterial.uniforms.uKeyTime.value = time;
    target.scissor.set(0, start, size, end - start);
    target.scissorTest = true;
    renderer.setRenderTarget(target);
    renderer.render(atlasScene, camera);
  };

  const desiredCenter = new Vector2();
  let previousTime: number | undefined;
  return {
    backdrop,
    stars,
    resize(width: number, height: number, mobile: boolean, lite = false) {
      // A soft atmosphere does not need a screen-sized noise atlas. Bound
      // both its memory and the work needed to prepare its first keyframes.
      const resolution = Math.max(16, Math.min(lite ? 256 : 512, Math.round(height * 0.5)));
      if (resolution !== size) {
        size = resolution;
        keys.forEach((target) => target.setSize(size, size));
        from = Number.NaN;
      }
      uniforms.uAspect.value = width / height;
      starGeometry.setDrawRange(0, mobile || lite ? 6200 : starCount);
    },
    render(renderer: WebGLRenderer, camera: Camera, time: number) {
      const u = uniforms;
      u.uTime.value = time;
      const center = u.uCenter.value;
      desiredCenter.set(nebulaSubject.x, nebulaSubject.y);
      if (nebulaSubject.strength < 0.01 && !nebulaJourney.enabled) desiredCenter.set(u.uAspect.value * 0.22, 0.02);
      // Ease the handover between scenes; reduced motion remains fully static.
      const follow = time === 0 || previousTime === undefined ? 1
        : 1 - Math.exp(-Math.min(0.05, Math.abs(time - previousTime)) * 4);
      previousTime = time;
      center.lerp(desiredCenter, follow);
      u.uRadius.value += (nebulaSubject.radius - u.uRadius.value) * follow;
      u.uSubject.value += (nebulaSubject.strength - u.uSubject.value) * follow;
      u.uDispersion.value += (nebulaJourney.dispersion - u.uDispersion.value) * follow;
      if (u.uDispersion.value < 1e-4) u.uDispersion.value = 0;
      u.uScroll.value = time === 0 ? 0 : nebulaJourney.scroll;
      starMaterial.uniforms.uDpr.value = renderer.getPixelRatio();

      const target = renderer.getRenderTarget();
      // A jump in time (a first frame, reduced motion, a long pause): start over.
      if (!(time >= from && time < from + KEY * 3)) {
        from = Math.floor(time / KEY) * KEY;
        warmKey = warmRows = 0;
        u.uReady.value = 0;
        rows = 0;
      }
      // Initial atlases used to execute two complete noise passes on the
      // first visible frame. Prepare at most 32 rows per frame instead.
      // Reduced motion has no ongoing loop, so initialise its still once.
      if (time === 0 && warmKey < 2) {
        drawRows(renderer, camera, order[0], from, 0, size);
        drawRows(renderer, camera, order[1], from + KEY, 0, size);
        warmKey = 2;
      }
      if (warmKey < 2) {
        const end = Math.min(size, warmRows + 32);
        drawRows(renderer, camera, order[warmKey], from + KEY * warmKey, warmRows, end);
        warmRows = end;
        if (warmRows === size) { warmKey++; warmRows = 0; }
        renderer.setRenderTarget(target);
        return;
      }
      u.uReady.value = time === 0 ? 1 : Math.min(1, u.uReady.value + 0.06);
      while (time >= from + KEY) {
        // The next keyframe must be complete before it is shown.
        drawRows(renderer, camera, order[2], from + KEY * 2, rows, size);
        order.push(order.shift()!);
        from += KEY;
        rows = 0;
      }
      const blend = (time - from) / KEY;
      // A little ahead of the clock, so the last rows never pile up.
      const due = Math.min(size, Math.ceil(size * Math.min(1, blend * 1.15 + 0.05)));
      const end = Math.min(due, rows + 32);
      drawRows(renderer, camera, order[2], from + KEY * 2, rows, end);
      rows = Math.max(rows, end);
      renderer.setRenderTarget(target);
      u.uBlend.value = blend;
      u.uGasA.value = keys[order[0]].texture;
      u.uGasB.value = keys[order[1]].texture;
    },
    dispose() {
      keys.forEach((target) => target.dispose());
      atlasMaterial.dispose();
      cloudMaterial.dispose();
      screen.dispose();
      sheet.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
    },
  };
}
