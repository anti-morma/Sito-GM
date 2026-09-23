import { CatmullRomCurve3, Vector3 } from 'three';

export type SynapseParticle = {
  point: Vector3;
  signal: number;
  kind: number;
  shade: number;
  release: Vector3;
};

type Cell = { center: Vector3; radius: number; activation: number; branches: number };
type Fiber = {
  curve: CatmullRomCurve3;
  radiusStart: number;
  radiusEnd: number;
  signalStart: number;
  signalEnd: number;
  weight: number;
};

const TAU = Math.PI * 2;
const STRUCTURAL = 2;

function clamp(value: number, low: number, high: number) {
  return Math.max(low, Math.min(high, value));
}

function addParticle(
  particles: SynapseParticle[], point: Vector3, kind: number, shade: number,
  signal = STRUCTURAL, release = point,
) {
  particles.push({ point, kind, shade: clamp(shade, 0.1, 1), signal, release });
}

function tubePoint(fiber: Fiber, t: number, random: () => number) {
  const point = fiber.curve.getPoint(t);
  const tangent = fiber.curve.getTangent(t).normalize();
  const side = new Vector3(-tangent.y, tangent.x, 0).normalize();
  if (side.lengthSq() < 0.01) side.set(1, 0, 0);
  const up = tangent.clone().cross(side).normalize();
  const angle = random() * TAU;
  // A broad root narrows quickly; a soft, irregular cross-section avoids a pipe silhouette.
  const phase = fiber.curve.points[0].x * 37 + fiber.curve.points[0].y * 23;
  const taper = Math.pow(1 - t, 1.8);
  const contour = 0.86 + 0.10 * Math.sin(t * 29 + phase)
    + 0.06 * Math.sin(t * 53 + phase * 1.7 + angle * 2);
  const radius = (fiber.radiusEnd + (fiber.radiusStart - fiber.radiusEnd) * taper)
    * contour * Math.sqrt(random());
  const normal = side.multiplyScalar(Math.cos(angle)).addScaledVector(up, Math.sin(angle));
  return {
    point: point.addScaledVector(normal, radius),
    light: 0.22 + 0.78 * Math.max(0, normal.dot(new Vector3(-0.3, 0.5, 0.81))),
  };
}

function weightedFiber(fibers: Fiber[], cumulative: number[], random: () => number) {
  const cursor = random() * cumulative[cumulative.length - 1];
  let low = 0;
  let high = fibers.length - 1;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (cursor <= cumulative[mid]) high = mid;
    else low = mid + 1;
  }
  return fibers[low];
}

/** Nine layered neurons; signal 0..1 follows selected paths, 2 is quiet structure. */
export function buildSynapseParticles(count: number, random: () => number): SynapseParticle[] {
  const total = Math.max(0, Math.floor(count));
  const particles: SynapseParticle[] = [];
  if (!total) return particles;

  // z > 0 is nearer the camera. Staggered depths make crossings legible.
  const cells: Cell[] = [
    { center: new Vector3(-0.62, 0.32, -0.32), radius: 0.026, activation: 0.05, branches: 5 },
    { center: new Vector3(-0.56, -0.23, -0.26), radius: 0.025, activation: 0.09, branches: 5 },
    { center: new Vector3(-0.28, 0.12, 0.12), radius: 0.065, activation: 0.28, branches: 7 },
    { center: new Vector3(-0.32, -0.34, -0.21), radius: 0.029, activation: 0.31, branches: 5 },
    { center: new Vector3(0.10, 0.48, -0.38), radius: 0.024, activation: 0.18, branches: 5 },
    { center: new Vector3(0.015, -0.10, 0.015), radius: 0.078, activation: 0.50, branches: 7 },
    { center: new Vector3(0.10, -0.58, 0.36), radius: 0.094, activation: 0.39, branches: 5 },
    { center: new Vector3(0.30, 0.20, 0.20), radius: 0.058, activation: 0.71, branches: 6 },
    { center: new Vector3(0.69, 0.035, -0.20), radius: 0.028, activation: 0.85, branches: 5 },
  ];

  const active: Fiber[] = [];
  const branches: Fiber[] = [];
  const somaRoots: Vector3[][] = cells.map(() => []);
  const connect = (from: number, to: number, start: number, end: number, bend: number) => {
    const a = cells[from].center;
    const b = cells[to].center;
    const delta = b.clone().sub(a);
    const planar = new Vector3(-delta.y, delta.x, 0).normalize();
    const length = delta.length();
    const points = [a.clone()];
    for (const t of [0.16, 0.33, 0.52, 0.72, 0.87]) {
      const envelope = Math.sin(t * Math.PI);
      points.push(a.clone().lerp(b, t)
        .addScaledVector(planar, (bend + (random() - 0.5) * 0.085) * length * envelope)
        .add(new Vector3(0, 0, (random() - 0.5) * length * 0.10 * envelope)));
    }
    points.push(b.clone());
    active.push({ curve: new CatmullRomCurve3(points, false, 'catmullrom', 0.38),
      radiusStart: cells[from].radius * 0.12, radiusEnd: 0.0014, signalStart: start, signalEnd: end,
      weight: length * 1.7 });
  };

  // Several idea seeds ignite first, then routes join and converge at the exit.
  connect(0, 2, 0.10, 0.28, 0.13);
  connect(1, 3, 0.13, 0.31, -0.13);
  connect(2, 5, 0.30, 0.50, -0.17);
  connect(3, 5, 0.33, 0.50, 0.18);
  connect(4, 7, 0.20, 0.71, -0.16);
  connect(6, 7, 0.41, 0.71, 0.14);
  connect(5, 7, 0.52, 0.71, 0.11);
  connect(7, 8, 0.73, 0.86, -0.14);
  const output = new Vector3(0.735, 0.055, 0.005);
  active.push({
    curve: new CatmullRomCurve3([
      cells[8].center.clone(), new Vector3(0.62, -0.005, -0.015),
      new Vector3(0.69, 0.005, 0.013), output,
    ], false, 'catmullrom', 0.38),
    radiusStart: 0.004, radiusEnd: 0.001, signalStart: 0.87, signalEnd: 0.98,
    weight: 0.29,
  });

  // Each cell sprouts a dendritic tree with two tapering generations.
  const grow = (start: Vector3, direction: Vector3, length: number, depth: number,
    width: number, seed: number, ignition = STRUCTURAL) => {
    const dir = direction.clone().normalize();
    const sideways = new Vector3(-dir.y, dir.x, (random() - 0.5) * 0.5).normalize();
    const wobble = (random() - 0.5) * length * 0.36;
    const end = start.clone().addScaledVector(dir, length)
      .addScaledVector(sideways, wobble * 0.45);
    const curve = new CatmullRomCurve3([
      start.clone(),
      start.clone().addScaledVector(dir, length * 0.28).addScaledVector(sideways, wobble),
      start.clone().addScaledVector(dir, length * 0.66)
        .addScaledVector(sideways, wobble * 0.58),
      end,
    ], false, 'catmullrom', 0.42);
    branches.push({ curve, radiusStart: width, radiusEnd: width * (depth === 2 ? 0.11 : 0.52),
      signalStart: ignition,
      signalEnd: ignition < 1.5 ? Math.min(0.98, ignition + 0.045) : STRUCTURAL,
      weight: length * (depth === 0 ? 1.15 : depth === 1 ? 0.83 : 0.56) });
    if (depth === 2) return;
    const children = depth === 0 && seed % 4 === 0 ? 3 : 2;
    for (let i = 0; i < children; i++) {
      const rotate = (i - (children - 1) / 2) * (0.58 + random() * 0.29)
        + (random() - 0.5) * 0.2;
      const childDir = dir.clone().applyAxisAngle(new Vector3(0, 0, 1), rotate);
      childDir.z = clamp(childDir.z + (random() - 0.5) * 0.34, -0.65, 0.65);
      grow(end, childDir, length * (0.48 + random() * 0.12), depth + 1,
        width * 0.53, seed + i * 11 + 1,
        ignition < 1.5 ? Math.min(0.98, ignition + 0.045) : STRUCTURAL);
    }
  };
  // Collateral arbors grow out of the long connections, not only out of cell bodies.
  // They share the local arrival time so the impulse follows the branching anatomy.
  active.slice(0, -1).forEach((fiber, index) => {
    for (const t of [0.27, 0.53, 0.76]) {
      const start = fiber.curve.getPoint(t);
      const tangent = fiber.curve.getTangent(t).normalize();
      const lateral = new Vector3(-tangent.y, tangent.x, (random() - 0.5) * 0.9).normalize();
      const direction = tangent.multiplyScalar(0.30)
        .addScaledVector(lateral, (index + Math.round(t * 10)) % 2 ? 1 : -1).normalize();
      grow(start, direction, 0.040 + random() * 0.045, 1,
        0.0025 + random() * 0.001, index * 13,
        fiber.signalStart + (fiber.signalEnd - fiber.signalStart) * t);
    }
  });
  cells.forEach((cell, cellIndex) => {
    for (let branch = 0; branch < cell.branches; branch++) {
      const angle = (branch + random() * 0.75) / cell.branches * TAU + cellIndex * 0.71;
      const dir = new Vector3(Math.cos(angle), Math.sin(angle), (random() - 0.5) * 0.73);
      if (branch % 2 === 0) somaRoots[cellIndex].push(dir.clone().normalize());
      const start = cell.center.clone().addScaledVector(dir, cell.radius * 0.58);
      const prominence = Math.sqrt(cell.radius / 0.039);
      grow(start, dir, (0.078 + random() * 0.085) * prominence, 0, cell.radius * (0.20 + random() * 0.06),
        branch + cellIndex * 17,
        branch % 4 === 0 ? cell.activation : STRUCTURAL);
    }
  });

  const somaEnd = Math.floor(total * 0.24);
  const somaWeights = cells.map(cell => Math.pow(cell.radius, 1.5) * (cell.center.z > 0.3 ? 0.45 : 1));
  const somaTotal = somaWeights.reduce((sum, weight) => sum + weight, 0);
  while (particles.length < somaEnd) {
    let cellIndex = 0;
    let cellCursor = random() * somaTotal;
    while (cellIndex < cells.length - 1 && cellCursor > somaWeights[cellIndex]) cellCursor -= somaWeights[cellIndex++];
    const cell = cells[cellIndex];
    const azimuth = random() * TAU;
    const z = random() * 2 - 1;
    const radial = Math.sqrt(1 - z * z);
    const direction = new Vector3(Math.cos(azimuth) * radial,
      Math.sin(azimuth) * radial, z);
    const roots = somaRoots[cellIndex];
    if (random() < 0.34) {
      const root = roots[Math.floor(random() * roots.length)];
      direction.lerp(root, 0.58 + random() * 0.25).normalize();
    }
    let alignment = 0;
    for (const root of roots) alignment = Math.max(alignment, direction.dot(root));
    const rootLobe = Math.pow(Math.max(0, alignment), 7);
    const irregular = 0.045 * Math.sin(azimuth * 7 + z * 9)
      + 0.035 * Math.sin(azimuth * 11 - z * 5);
    const r = cell.radius * (0.76 + 0.57 * rootLobe + irregular)
      * (0.64 + Math.pow(random(), 0.34) * 0.36);
    const point = cell.center.clone().add(new Vector3(
      direction.x * r * 1.12,
      direction.y * r,
      direction.z * r * 0.8,
    ));
    const membraneLight = Math.max(0, direction.dot(new Vector3(-0.3, 0.5, 0.81)));
    addParticle(particles, point, 1, 0.18 + 0.62 * membraneLight,
      cell.activation);
  }

  const activeEnd = Math.floor(total * 0.34);
  const activeTotalWeight = active.reduce((sum, fiber) => sum + fiber.weight, 0);
  while (particles.length < activeEnd) {
    let cursor = random() * activeTotalWeight;
    let fiber = active[active.length - 1];
    for (const candidate of active) {
      cursor -= candidate.weight;
      if (cursor <= 0) { fiber = candidate; break; }
    }
    const t = random();
    const sample = tubePoint(fiber, t, random);
    addParticle(particles, sample.point, 0, sample.light,
      fiber.signalStart + (fiber.signalEnd - fiber.signalStart) * t);
  }

  const branchEnd = Math.floor(total * 0.95);
  const cumulative: number[] = [];
  let accumulated = 0;
  for (const fiber of branches) {
    accumulated += fiber.weight;
    cumulative.push(accumulated);
  }
  while (particles.length < branchEnd) {
    const fiber = weightedFiber(branches, cumulative, random);
    const t = random();
    const sample = tubePoint(fiber, t, random);
    addParticle(particles, sample.point, 0,
      sample.light * (1 - t * 0.22),
      fiber.signalStart + (fiber.signalEnd - fiber.signalStart) * t);
  }

  const gapEnd = Math.floor(total * 0.97);
  // Short hops at selected junctions make travel between cells visible.
  const junctions = [active[0], active[2], active[6], active[7]];
  while (particles.length < gapEnd) {
    const fiber = junctions[(particles.length - branchEnd) % junctions.length];
    const t = 0.68 + random() * 0.30;
    const point = tubePoint(fiber, t, random).point;
    const release = fiber.curve.getPoint(Math.min(1, t + 0.025));
    addParticle(particles, point, 2, 0.22 + random() * 0.2,
      fiber.signalStart + (fiber.signalEnd - fiber.signalStart) * t, release);
  }

  while (particles.length < total) {
    const t = random();
    const fiber = active[active.length - 1];
    const point = fiber.curve.getPoint(t);
    point.x += (random() - 0.5) * 0.019;
    point.y += (random() - 0.5) * 0.024;
    point.z += (random() - 0.5) * 0.019;
    addParticle(particles, point, 3, 0.48 + random() * 0.35,
      fiber.signalStart + (fiber.signalEnd - fiber.signalStart) * t);
  }

  return particles;
}
