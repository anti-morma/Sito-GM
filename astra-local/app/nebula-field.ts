import {
  AdditiveBlending, BufferGeometry, Float32BufferAttribute, Group, InstancedBufferAttribute,
  InstancedBufferGeometry, LinearFilter,
  Mesh, PlaneGeometry, Points, Scene, ShaderMaterial, Vector2,
  WebGLRenderTarget, type Camera, type WebGLRenderer,
} from 'three';

// Published by the particle scene in camera space: no DOM reads or React updates
// in the animation loop. Keep the atmosphere quiet inside the star sculpture.
export const nebulaSubject = { x: 0, y: 0, radius: 0.3, strength: 0 };
export const nebulaJourney = { enabled: false, dispersion: 0, scroll: 0 };

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.999, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uAspect;
  uniform vec2 uCenter;
  uniform float uRadius;
  uniform float uSubject;
  uniform float uDispersion;
  uniform float uScroll;

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
    // A local atlas keeps every fragment's source intact even off screen.
    vec2 p = (vUv - 0.5) * 1.8;
    float t = uTime * 0.018;
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
    // A broad, feathered pocket of darkness preserves the sculpture's dots.
    float pocket = 1.0 - smoothstep(uRadius * 0.42, uRadius * 1.35, length(p));
    color *= 1.0 - pocket * uSubject * 0.72;
    float stellarDensity = clamp(color.b * 12.0, 0.0, 1.0);
    gl_FragColor = vec4(color, stellarDensity);
  }
`;

// Shared by the cloud pieces and their stars: each piece keeps its original
// texture and follows a reversible 3D trajectory, with no opacity transition.
const fragmentMotion = `
  float fragmentHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  void fragmentPose(vec2 home, out vec2 destination, out float depth, out float angle) {
    vec2 cell = floor((home + 0.9) / 0.06 + 0.01);
    float seed = fragmentHash(cell);
    float delay = seed * 0.16;
    float progress = smoothstep(delay, 0.84 + delay, uDispersion);
    vec2 drift = vec2(uTime * 0.0015, uScroll * 0.07 + uTime * 0.0025);
    vec2 farSlot = mod(vec2(fragmentHash(cell + 17.3), fragmentHash(cell + 41.7))
      + drift, 1.0) - 0.5;
    farSlot.x *= uAspect;
    depth = 1.0 + progress * (4.0 + seed * 7.0);
    angle = progress * (seed - 0.5) * 2.4;
    destination = mix(home + uCenter, farSlot * depth, progress);
    destination += vec2(cos(seed * 6.283), sin(seed * 6.283))
      * sin(progress * 3.14159) * (0.16 + seed * 0.35);
  }
`;

const cloudPieceVertexShader = `
  attribute vec2 aHome;
  uniform vec2 uCenter;
  uniform float uAspect;
  uniform float uTime;
  uniform float uDispersion;
  uniform float uScroll;
  varying vec2 vUv;
  ${fragmentMotion}
  void main() {
    vec2 destination;
    float depth, angle;
    fragmentPose(aHome, destination, depth, angle);
    vec2 local = position.xy * 0.06;
    // Neighbours share displaced corners, forming an irregular tessellation
    // which closes exactly again when all pieces return to their home positions.
    vec2 corner = floor((aHome + local + 0.9) / 0.06 + 0.1);
    local += (vec2(fragmentHash(corner + 9.2), fragmentHash(corner + 27.4)) - 0.5) * 0.026;
    mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    vec2 p = destination + rotation * local;
    vUv = (aHome + local) / 1.8 + 0.5;
    gl_Position = vec4(p / vec2(uAspect, 1.0) * 2.0, 0.999 * depth, depth);
  }
`;

// Every point belongs to the same cloud throughout its journey. The gas texture
// weights its light, so stars trace the existing filaments and their dark lanes.
const starVertexShader = `
  attribute vec2 aCloud;
  attribute vec3 aStyle;
  uniform sampler2D uGas;
  uniform vec2 uCenter;
  uniform float uAspect;
  uniform float uTime;
  uniform float uDispersion;
  uniform float uScroll;
  uniform float uDpr;
  varying float vLight;
  varying float vHeat;
  ${fragmentMotion}
  void main() {
    float phase = aStyle.z;
    vec2 cloud = aCloud + vec2(
      sin(aCloud.y * 9.0 + uTime * 0.035),
      cos(aCloud.x * 8.0 - uTime * 0.03)
    ) * 0.014;
    vec2 home = floor((aCloud + 0.9) / 0.06) * 0.06 - 0.87;
    vec2 destination;
    float depth, angle;
    fragmentPose(home, destination, depth, angle);
    mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    vec2 p = destination + rotation * (cloud - home);
    gl_Position = vec4(p / vec2(uAspect, 1.0) * 2.0, 0.0, depth);
    vec2 cloudUv = cloud / 1.8 + 0.5;
    float density = texture2D(uGas, clamp(cloudUv, 0.0, 1.0)).a;
    float cloudLight = smoothstep(0.025, 0.55, density);
    float shimmer = 0.86 + 0.14 * sin(uTime * 0.45 + phase);
    vLight = aStyle.y * cloudLight * shimmer / sqrt(depth);
    vHeat = fract(phase * 1.37);
    gl_PointSize = aStyle.x * uDpr / depth;
  }
`;

const starFragmentShader = `
  precision highp float;
  varying float vLight;
  varying float vHeat;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r2 = dot(uv, uv);
    float core = exp(-r2 * 95.0);
    float halo = exp(-r2 * 22.0) * 0.065;
    float alpha = (core + halo) * vLight;
    if (alpha < 0.002) discard;
    vec3 blue = mix(vec3(0.28, 0.61, 1.0), vec3(0.64, 0.84, 1.0), vHeat);
    gl_FragColor = vec4(blue, alpha);
  }
`;

export function createNebulaField() {
  // Gas needs soft detail, while stars retain the main canvas's sharp pixels.
  const target = new WebGLRenderTarget(1, 1, {
    minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false,
  });
  const geometry = new PlaneGeometry(2, 2);
  const material = new ShaderMaterial({
    vertexShader, fragmentShader, depthTest: false, depthWrite: false,
    uniforms: {
      uTime: { value: 0 }, uAspect: { value: 1 },
      uCenter: { value: new Vector2(0.24, 0.02) },
      uRadius: { value: 0.3 }, uSubject: { value: 0 },
      uDispersion: { value: 0 }, uScroll: { value: 0 },
    },
  });
  const scene = new Scene();
  const gas = new Mesh(geometry, material);
  gas.frustumCulled = false;
  scene.add(gas);
  const pieces = new InstancedBufferGeometry();
  const tile = new PlaneGeometry(1, 1);
  pieces.setIndex(tile.getIndex());
  pieces.setAttribute('position', tile.getAttribute('position'));
  const homes: number[] = [];
  for (let y = 0; y < 30; y++) {
    for (let x = 0; x < 30; x++) homes.push(-0.87 + x * 0.06, -0.87 + y * 0.06);
  }
  pieces.setAttribute('aHome', new InstancedBufferAttribute(new Float32Array(homes), 2));
  pieces.instanceCount = 900;
  const compositeMaterial = new ShaderMaterial({
    vertexShader: cloudPieceVertexShader,
    fragmentShader: `
      varying vec2 vUv;
      uniform sampler2D uGas;
      void main() {
        vec4 gas = texture2D(uGas, vUv);
        if (max(gas.r, max(gas.g, gas.b)) < 0.0005) discard;
        gl_FragColor = vec4(gas.rgb, 1.0);
      }
    `,
    uniforms: { ...material.uniforms, uGas: { value: target.texture } },
    transparent: true, blending: AdditiveBlending, depthTest: false, depthWrite: false,
  });
  const cloudPieces = new Mesh(pieces, compositeMaterial);
  cloudPieces.frustumCulled = false;
  cloudPieces.renderOrder = -1;
  const nightMaterial = new ShaderMaterial({
    vertexShader,
    fragmentShader: 'void main() { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); }',
    depthTest: false, depthWrite: false,
  });
  const night = new Mesh(geometry, nightMaterial);
  night.frustumCulled = false;
  night.renderOrder = -2;
  const backdrop = new Group();
  backdrop.add(night, cloudPieces);
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
    uniforms: { ...material.uniforms, uGas: { value: target.texture }, uDpr: { value: 1 } },
    transparent: true, blending: AdditiveBlending, depthTest: false, depthWrite: false,
  });
  const stars = new Points(starGeometry, starMaterial);
  stars.frustumCulled = false;
  stars.renderOrder = 1;
  const desiredCenter = new Vector2();
  let previousTime: number | undefined;
  return {
    backdrop,
    stars,
    resize(width: number, height: number, mobile: boolean) {
      const scale = Math.min(mobile ? 0.5 : 0.65, 640 / height);
      const resolution = Math.max(1, Math.round(height * scale));
      target.setSize(resolution, resolution);
      material.uniforms.uAspect.value = width / height;
      starGeometry.setDrawRange(0, mobile ? 6200 : starCount);
    },
    render(renderer: WebGLRenderer, camera: Camera, time: number) {
      const u = material.uniforms;
      u.uTime.value = time;
      const center = u.uCenter.value as Vector2;
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
      u.uScroll.value = time === 0 ? 0 : nebulaJourney.scroll;
      starMaterial.uniforms.uDpr.value = renderer.getPixelRatio();
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
    },
    dispose() {
      target.dispose();
      material.dispose();
      compositeMaterial.dispose();
      nightMaterial.dispose();
      geometry.dispose();
      pieces.dispose();
      tile.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
    },
  };
}
