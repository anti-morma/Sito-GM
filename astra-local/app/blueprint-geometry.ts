import { Vector3 } from 'three';

export type BlueprintParticle = {
  plan: Vector3;
  built: Vector3;
  shade: number;
  phase: number;
  kind: number;
  draw: number;
};

type Sample = { x: number; y: number; z: number; along?: number };
type Stroke = {
  weight: number;
  kind: number;
  phase: number;
  shade: number;
  sample: (random: () => number) => Sample;
};

/**
 * A measured architectural drawing and its matching model share one X/Z plan.
 * X runs along the lake-facing facade, and positive Z faces the pool.
 */
export function buildBlueprintParticles(count: number, random: () => number): BlueprintParticle[] {
  const total = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  if (!total) return [];

  const strokes: Stroke[] = [];
  const line = (
    x1: number, z1: number, x2: number, z2: number, y: number,
    kind: number, phase: number, shade = 0.8, density = 1,
  ) => {
    const length = Math.hypot(x2 - x1, z2 - z1);
    if (length < 0.00001) return;
    strokes.push({
      weight: length * density, kind, phase, shade,
      sample: (rng) => {
        const t = rng();
        return { x: x1 + (x2 - x1) * t, y, z: z1 + (z2 - z1) * t, along: t };
      },
    });
  };
  const outline = (
    x1: number, z1: number, x2: number, z2: number, y: number,
    kind: number, phase: number, shade = 0.8, density = 1,
  ) => {
    line(x1, z1, x2, z1, y, kind, phase, shade, density);
    line(x2, z1, x2, z2, y, kind, phase, shade, density);
    line(x2, z2, x1, z2, y, kind, phase, shade, density);
    line(x1, z2, x1, z1, y, kind, phase, shade, density);
  };
  const panel = (
    x1: number, z1: number, x2: number, z2: number,
    y1: number, y2: number, kind: number, phase: number,
    shade: number, density: number,
  ) => {
    const length = Math.hypot(x2 - x1, z2 - z1);
    strokes.push({
      weight: length * (y2 - y1) * density, kind, phase, shade,
      sample: (rng) => {
        const t = rng();
        return { x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * rng(), z: z1 + (z2 - z1) * t };
      },
    });
  };
  const floor = (
    x1: number, z1: number, x2: number, z2: number, y: number,
    kind: number, phase: number, shade: number, density: number,
  ) => {
    strokes.push({
      weight: (x2 - x1) * (z2 - z1) * density, kind, phase, shade,
      sample: (rng) => ({ x: x1 + (x2 - x1) * rng(), y, z: z1 + (z2 - z1) * rng() }),
    });
  };
  const upright = (x: number, z: number, bottom: number, top: number, shade = 0.92, density = 1) => {
    strokes.push({
      weight: (top - bottom) * density, kind: 2, phase: 0.35, shade,
      sample: (rng) => ({ x, y: bottom + (top - bottom) * rng(), z }),
    });
  };
  const arc = (x: number, z: number, radius: number, start: number, sweep: number, shade = 0.55) => {
    strokes.push({
      weight: radius * Math.abs(sweep) * 0.42, kind: 0, phase: 0, shade,
      sample: (rng) => {
        const a = start + sweep * rng();
        return { x: x + radius * Math.cos(a), y: 0, z: z + radius * Math.sin(a) };
      },
    });
  };

  // Survey marks and fine drafting conventions give the opening plan a real scale.
  outline(-0.615, -0.365, 0.615, 0.435, 0, 0, 0, 0.27, 0.28);
  for (const [x1, z1, x2, z2] of [
    [-0.56, -0.337, 0.57, -0.337], [-0.56, -0.345, -0.56, -0.328],
    [0.57, -0.345, 0.57, -0.328], [-0.585, -0.28, -0.585, 0.17],
    [-0.593, -0.28, -0.576, -0.28], [-0.593, 0.17, -0.576, 0.17],
    [-0.36, 0.416, 0.28, 0.416], [-0.36, 0.408, -0.36, 0.424],
    [0.28, 0.408, 0.28, 0.424],
  ] as number[][]) line(x1, z1, x2, z2, 0, 0, 0, 0.43, 0.62);
  for (const x of [-0.53, -0.31, -0.08, 0.15, 0.30, 0.57]) {
    line(x, -0.358, x, -0.323, 0, 0, 0, 0.36, 0.5);
  }
  for (const z of [-0.28, -0.11, 0.02, 0.17, 0.39]) {
    line(-0.60, z, -0.573, z, 0, 0, 0, 0.34, 0.5);
  }

  // Long rear bar, a forward right wing, and the broad glazed front.
  outline(-0.53, -0.28, 0.30, 0.005, 0, 0, 0, 0.94, 1.5);
  outline(0.30, -0.22, 0.57, 0.14, 0, 0, 0, 0.88, 1.42);
  outline(-0.522, -0.272, 0.292, -0.003, 0, 0, 0, 0.40, 0.64);
  outline(0.308, -0.212, 0.562, 0.132, 0, 0, 0, 0.38, 0.64);
  line(-0.53, -0.005, 0.30, -0.005, 0.012, 2, 0, 0.95, 1.5);
  line(0.30, 0.137, 0.57, 0.137, 0.012, 2, 0, 0.92, 1.2);

  // Interior partitions, cabinetry, door swings and kitchen island remain visible in plan.
  for (const [x1, z1, x2, z2] of [
    [-0.29, -0.28, -0.29, -0.085], [-0.285, -0.085, -0.17, -0.085],
    [-0.10, -0.28, -0.10, -0.11], [-0.10, -0.11, 0.035, -0.11],
    [0.10, -0.28, 0.10, -0.11], [0.10, -0.11, 0.22, -0.11],
    [0.30, -0.08, 0.57, -0.08], [0.43, -0.22, 0.43, -0.13],
    [-0.47, -0.21, -0.39, -0.21], [-0.47, -0.21, -0.47, -0.12],
    [-0.07, -0.24, 0.01, -0.24], [-0.07, -0.24, -0.07, -0.18],
  ] as number[][]) line(x1, z1, x2, z2, 0, 0, 0, 0.62, 0.9);
  outline(-0.18, -0.065, -0.03, -0.025, 0, 0, 0, 0.46, 0.6);
  outline(0.355, -0.185, 0.51, -0.135, 0, 0, 0, 0.38, 0.45);
  arc(-0.17, -0.085, 0.065, Math.PI, Math.PI / 2);
  arc(0.035, -0.11, 0.065, Math.PI, Math.PI / 2);
  arc(0.22, -0.11, 0.055, Math.PI, Math.PI / 2);
  arc(0.43, -0.13, 0.05, Math.PI / 2, Math.PI / 2);

  // The rear and side walls are translucent enough to keep the facade legible.
  panel(-0.53, -0.28, 0.30, -0.28, 0.015, 0.248, 1, 0.15, 0.43, 8.5);
  panel(-0.53, -0.28, -0.53, 0.005, 0.015, 0.248, 1, 0.15, 0.52, 11);
  panel(0.30, -0.28, 0.30, -0.22, 0.015, 0.248, 1, 0.15, 0.52, 10);
  panel(0.30, -0.22, 0.57, -0.22, 0.015, 0.248, 1, 0.15, 0.48, 9);
  panel(0.57, -0.22, 0.57, 0.14, 0.015, 0.248, 1, 0.15, 0.61, 13);
  panel(0.30, 0.005, 0.30, 0.14, 0.015, 0.248, 1, 0.15, 0.36, 6);
  panel(-0.53, 0.005, -0.42, 0.005, 0.015, 0.248, 1, 0.15, 0.67, 10);
  panel(0.23, 0.005, 0.30, 0.005, 0.015, 0.248, 1, 0.15, 0.67, 10);

  // Continuous glass spans: both horizontal rails and vertical mullions.
  for (const [x1, x2, z] of [[-0.42, -0.16, 0.005], [-0.16, 0.055, 0.005], [0.055, 0.23, 0.005], [0.32, 0.55, 0.14]]) {
    panel(x1, z, x2, z, 0.035, 0.219, 3, 0.35, 0.63, 14);
    for (const y of [0.031, 0.221]) line(x1, z, x2, z, y, 3, 0.35, 0.96, 1.25);
    for (let x = x1; x <= x2 + 0.001; x += 0.07) upright(x, z, 0.028, 0.229, 0.98, 1.5);
  }
  for (const z of [-0.205, -0.13, -0.055, 0.02, 0.095]) upright(0.57, z, 0.025, 0.223, 0.75, 0.8);
  for (const x of [-0.53, -0.38, -0.18, 0.04, 0.23, 0.30, 0.57]) {
    upright(x, x > 0.29 ? 0.14 : 0.005, 0.0, 0.265, 0.99, 1.8);
  }

  // Two flat roof plates overhang the exact plan, with a thin parapet and seams.
  outline(-0.545, -0.295, 0.315, 0.020, 0.255, 2, 0.65, 1, 2.3);
  outline(0.285, -0.235, 0.585, 0.155, 0.255, 2, 0.65, 0.98, 2.1);
  outline(-0.535, -0.285, 0.305, 0.010, 0.277, 2, 0.65, 0.83, 1.2);
  outline(0.295, -0.225, 0.575, 0.145, 0.277, 2, 0.65, 0.84, 1.1);
  for (const z of [-0.245, -0.18, -0.115, -0.05]) {
    line(-0.50, z, 0.27, z, 0.26, 2, 0.65, 0.32, 0.65);
  }
  for (const x of [0.35, 0.42, 0.49]) line(x, -0.19, x, 0.11, 0.26, 2, 0.65, 0.37, 0.52);
  floor(-0.53, -0.28, 0.30, 0.005, 0.255, 1, 0.65, 0.25, 2.2);
  floor(0.30, -0.22, 0.57, 0.14, 0.255, 1, 0.65, 0.27, 2.2);

  // Lake-facing terrace, timber deck, risers and a narrow right access path.
  outline(-0.50, 0.015, 0.30, 0.18, 0.009, 0, 0, 0.75, 1.1);
  floor(-0.49, 0.025, 0.29, 0.17, 0.010, 1, 0, 0.31, 4.3);
  for (let z = 0.032; z < 0.17; z += 0.014) {
    line(-0.49, z, 0.29, z, 0.012, 0, 0, 0.46, 0.54);
  }
  for (const z of [0.178, 0.189, 0.2]) line(-0.49, z, 0.29, z, 0.006, 0, 0, 0.57, 0.58);
  outline(0.585, -0.18, 0.62, 0.34, 0.005, 0, 0, 0.42, 0.58);
  for (const z of [-0.15, -0.07, 0.01, 0.09, 0.17, 0.25]) {
    line(0.585, z, 0.62, z, 0.005, 0, 0, 0.4, 0.35);
  }

  // A rectangular pool close to the terrace, with coping, water and lane marks.
  outline(-0.37, 0.207, 0.29, 0.405, 0.009, 4, 0, 0.98, 1.8);
  outline(-0.35, 0.222, 0.27, 0.389, 0.008, 4, 0, 0.87, 1.35);
  floor(-0.348, 0.224, 0.268, 0.387, 0.004, 4, 0, 0.46, 19);
  for (let z = 0.244; z < 0.39; z += 0.03) {
    line(-0.33, z, 0.25, z, 0.006, 4, 0, 0.45, 0.36);
  }
  for (const x of [-0.30, -0.26, -0.22]) line(x, 0.22, x, 0.277, 0.007, 4, 0, 0.86, 1);
  line(-0.37, 0.405, 0.29, 0.405, 0.002, 0, 0, 0.52, 0.6);

  // Pick by visible line/surface measure, then retain the exact requested count.
  const cumulative: number[] = [];
  let weight = 0;
  for (const stroke of strokes) {
    weight += stroke.weight;
    cumulative.push(weight);
  }
  const particles: BlueprintParticle[] = [];
  for (let i = 0; i < total; i++) {
    const target = Math.min(weight * 0.999999999, Math.max(0, random()) * weight);
    let low = 0;
    let high = strokes.length - 1;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (target < cumulative[mid]) high = mid;
      else low = mid + 1;
    }
    const stroke = strokes[low];
    const point = stroke.sample(random);
    particles.push({
      plan: new Vector3(point.x, 0, point.z),
      built: new Vector3(point.x, point.y, point.z),
      shade: Math.max(0.1, Math.min(1, stroke.shade * (0.91 + random() * 0.09))),
      phase: stroke.phase,
      kind: stroke.kind,
      draw: (low + (point.along ?? random())) / strokes.length,
    });
  }
  return particles;
}
