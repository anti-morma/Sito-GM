/** Turns the image-sampled brain (a front relief) into a closed, rounded solid.
 *
 * The solid is the brain silhouette inflated with a circular edge profile of
 * radius R around a mid plane. Stars sampled from the reference keep their exact
 * appearance and sit on its near face; the same drawing covers the far
 * hemisphere, and a third set covers the rim between them, so rotating the
 * brain reveals the rest of it.
 * Every star carries a surface normal so the shader can hide the faces turned
 * away from the camera, as on an opaque object.
 */

type BrainPoint = number[]; // [x, y, reliefZ, shade]

export type BrainVolume = {
  /** Per reference star, near hemisphere: [z, nx, ny, nz]. */
  front: Float32Array;
  /** Per reference star, far hemisphere (the brain is near-symmetric): [z, nx, ny, nz]. */
  far: Float32Array;
  /** Rim of the solid (top, bottom, front and back poles): [x, y, z, shade, nx, ny, nz]. */
  rim: Float32Array;
};

const MID_PLANE = -0.12;
const GRID = 160;
const MIN_X = -0.4, MIN_Y = -0.36, SPAN = 0.8;
const CELL = SPAN / GRID;

// Region outlines from the reference sampling (image pixels → world units).
const toWorld = (points: [number, number][]) =>
  points.map(([x, y]) => [(x - 510) * 0.001, (535 - y) * 0.001] as [number, number]);
const CEREBELLUM = toWorld([[262, 661], [291, 645], [326, 640], [367, 643], [411, 651],
  [455, 650], [491, 656], [512, 676], [503, 705], [479, 729], [444, 749], [407, 760],
  [363, 762], [326, 753], [294, 737], [271, 714], [259, 684]]);
const BRAINSTEM = toWorld([[470, 646], [503, 650], [527, 668], [542, 687], [530, 711],
  [509, 740], [490, 774], [471, 806], [450, 830], [415, 826], [423, 792], [437, 758],
  [445, 726], [444, 691]]);

function inPolygon(polygon: [number, number][], x: number, y: number) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function chamfer(distance: Float32Array) {
  const relax = (i: number, j: number, cost: number) => {
    if (distance[j] + cost < distance[i]) distance[i] = distance[j] + cost;
  };
  for (let y = 1; y < GRID - 1; y++) for (let x = 1; x < GRID - 1; x++) {
    const i = y * GRID + x;
    relax(i, i - 1, 1); relax(i, i - GRID, 1);
    relax(i, i - GRID - 1, Math.SQRT2); relax(i, i - GRID + 1, Math.SQRT2);
  }
  for (let y = GRID - 2; y > 0; y--) for (let x = GRID - 2; x > 0; x--) {
    const i = y * GRID + x;
    relax(i, i + 1, 1); relax(i, i + GRID, 1);
    relax(i, i + GRID + 1, Math.SQRT2); relax(i, i + GRID - 1, Math.SQRT2);
  }
}

function blur(values: Float32Array, passes: number) {
  const next = new Float32Array(values.length);
  for (let pass = 0; pass < passes; pass++) {
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
      let sum = 0, weight = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
        sum += values[ny * GRID + nx]; weight++;
      }
      next[y * GRID + x] = sum / weight;
    }
    values.set(next);
  }
}

function sampler(grid: Float32Array) {
  return (x: number, y: number) => {
    const gx = Math.min(GRID - 1.001, Math.max(0, (x - MIN_X) / CELL - 0.5));
    const gy = Math.min(GRID - 1.001, Math.max(0, (y - MIN_Y) / CELL - 0.5));
    const x0 = Math.floor(gx), y0 = Math.floor(gy);
    const fx = gx - x0, fy = gy - y0;
    const i = y0 * GRID + x0;
    return (grid[i] * (1 - fx) + grid[i + 1] * fx) * (1 - fy)
      + (grid[i + GRID] * (1 - fx) + grid[i + GRID + 1] * fx) * fy;
  };
}

// Small seeded value noise for the folds on the surfaces the image never showed.
function makeNoise(random: () => number) {
  const table = new Float32Array(4096);
  for (let i = 0; i < table.length; i++) table[i] = random() * 2 - 1;
  const hash = (x: number, y: number, z: number) =>
    table[((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) & 4095];
  const fade = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number, z: number) => {
    const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
    const u = fade(x - X), v = fade(y - Y), w = fade(z - Z);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    return lerp(
      lerp(lerp(hash(X, Y, Z), hash(X + 1, Y, Z), u), lerp(hash(X, Y + 1, Z), hash(X + 1, Y + 1, Z), u), v),
      lerp(lerp(hash(X, Y, Z + 1), hash(X + 1, Y, Z + 1), u), lerp(hash(X, Y + 1, Z + 1), hash(X + 1, Y + 1, Z + 1), u), v),
      w,
    );
  };
}

export function buildBrainVolume(points: BrainPoint[], random: () => number): BrainVolume {
  // Silhouette mask from the reference stars, closed over small gaps.
  const hits = new Uint8Array(GRID * GRID);
  const shadeSum = new Float32Array(GRID * GRID);
  const shadeCount = new Float32Array(GRID * GRID);
  for (const [x, y, , shade] of points) {
    const gx = Math.floor((x - MIN_X) / CELL), gy = Math.floor((y - MIN_Y) / CELL);
    if (gx < 0 || gy < 0 || gx >= GRID || gy >= GRID) continue;
    hits[gy * GRID + gx] = 1;
    shadeSum[gy * GRID + gx] += shade;
    shadeCount[gy * GRID + gx]++;
  }
  const inside = new Uint8Array(GRID * GRID);
  for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
    let hit = 0;
    for (let dy = -2; dy <= 2 && !hit; dy++) for (let dx = -2; dx <= 2; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < GRID && ny < GRID && hits[ny * GRID + nx]) { hit = 1; break; }
    }
    inside[y * GRID + x] = hit;
  }

  // Signed distance to the outline (positive inside), in world units.
  const toOutside = new Float32Array(GRID * GRID);
  const toInside = new Float32Array(GRID * GRID);
  for (let i = 0; i < inside.length; i++) {
    toOutside[i] = inside[i] ? 1e6 : 0;
    toInside[i] = inside[i] ? 0 : 1e6;
  }
  chamfer(toOutside);
  chamfer(toInside);
  const signed = new Float32Array(GRID * GRID);
  for (let i = 0; i < signed.length; i++)
    signed[i] = (inside[i] ? toOutside[i] - 0.5 : 0.5 - toInside[i]) * CELL;
  blur(signed, 1);

  // Edge radius per region: full cortex, a narrower cerebellum, a slim brainstem.
  const radius = new Float32Array(GRID * GRID);
  for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
    const wx = MIN_X + (x + 0.5) * CELL, wy = MIN_Y + (y + 0.5) * CELL;
    radius[y * GRID + x] = inPolygon(BRAINSTEM, wx, wy) ? 0.045
      : inPolygon(CEREBELLUM, wx, wy) ? 0.14 : 0.22;
  }
  blur(radius, 6);

  // Average reference shade, spread outward so every surface point finds one.
  const shade = new Float32Array(GRID * GRID);
  for (let i = 0; i < shade.length; i++) shade[i] = shadeCount[i] ? shadeSum[i] / shadeCount[i] : 0.35;
  blur(shade, 1);

  const sd = sampler(signed);
  const R = sampler(radius);
  const shadeAt = sampler(shade);

  // Rounded solid: distance to the eroded core on the mid plane, minus R.
  const field = (x: number, y: number, z: number) => {
    const r = R(x, y);
    const inward = Math.max(0, r - sd(x, y));
    return Math.hypot(inward, z - MID_PLANE) - r;
  };
  const H = 0.003;
  const gradient = (x: number, y: number, z: number) => {
    const gx = field(x + H, y, z) - field(x - H, y, z);
    const gy = field(x, y + H, z) - field(x, y - H, z);
    const gz = field(x, y, z + H) - field(x, y, z - H);
    const length = Math.hypot(gx, gy, gz) || 1;
    return [gx / length, gy / length, gz / length];
  };

  // Front face: each reference star moves onto the solid along z only; the
  // shader keeps it on its original camera ray, so the resting view is unchanged.
  const front = new Float32Array(points.length * 4);
  const far = new Float32Array(points.length * 4);
  points.forEach(([x, y], index) => {
    const r = R(x, y);
    const inward = Math.max(0, r - Math.max(0, sd(x, y)));
    const depth = Math.sqrt(Math.max(0, r * r - inward * inward));
    const [nx, ny, nz] = gradient(x, y, MID_PLANE + depth);
    front.set([MID_PLANE + depth, nx, ny, nz], index * 4);
    far.set([MID_PLANE - depth, nx, ny, -nz], index * 4);
  });

  // Rim: project random points onto the solid where the image stars are too
  // sparse (surface seen edge-on in the reference), with their own gyri.
  const noise = makeNoise(random);
  const rim = new Float32Array(points.length * 7);
  let made = 0;
  while (made < points.length) {
    let x = MIN_X + 0.03 + random() * (SPAN - 0.06);
    let y = MIN_Y + 0.03 + random() * (SPAN - 0.06);
    let z = MID_PLANE + (random() - 0.5) * 0.5;
    for (let step = 0; step < 8; step++) {
      const f = field(x, y, z);
      const [gx, gy, gz] = gradient(x, y, z);
      x -= f * gx; y -= f * gy; z -= f * gz;
    }
    if (Math.abs(field(x, y, z)) > 0.002) continue;
    const [nx, ny, nz] = gradient(x, y, z);
    if (Math.abs(nz) > 0.55) continue;
    // Gyri: warped ridged noise, stars gather on the crests, grooves stay dark.
    const w = noise(x * 9, y * 9, z * 9) * 0.9;
    const ridge = Math.abs(noise(x * 24 + w, y * 24 - w, z * 24 + w));
    const gyrus = Math.min(1, Math.max(0, (ridge - 0.04) / 0.3));
    if (random() > 0.12 + 0.88 * gyrus) continue;
    // Towards the faces, blend into the reference shading so there is no seam.
    const blend = Math.min(1, Math.abs(nz) / 0.55);
    const value = Math.min(1, Math.max(0.06, (0.1 + 0.8 * gyrus) * (1 - blend) + shadeAt(x, y) * blend));
    rim.set([x, y, z, value, nx, ny, nz], made * 7);
    made++;
  }
  return { front, far, rim };
}
