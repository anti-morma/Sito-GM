import { CatmullRomCurve3, Vector3 } from 'three';

export type SynapseParticle = {
  point: Vector3;
  signal: number;
  kind: number;
  shade: number;
  release: Vector3;
};

/** Particle roles, read by the shader. */
export const NEURAL_KIND = {
  fiber: 0, // translucent dendrite and axon membrane
  soma: 1, // rough cell body membrane
  glow: 2, // warm light inside cell bodies and along the fibres
  distant: 3, // faint far network that gives the scene depth
} as const;

type Cell = { center: Vector3; radius: number; ignite: number; dendrites: number; reach: number };
type Fiber = {
  curve: CatmullRomCurve3;
  radiusStart: number;
  radiusEnd: number;
  signalStart: number;
  signalEnd: number;
  weight: number;
  kind: number;
};

const TAU = Math.PI * 2;
const QUIET = 2; // signal value for structure that never carries the impulse
const VIEW = new Vector3(0, 0, 1);
const KEY_LIGHT = new Vector3(-0.35, 0.55, 0.76).normalize();

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));

function addParticle(particles: SynapseParticle[], point: Vector3, kind: number, shade: number, signal = QUIET) {
  particles.push({ point, kind, shade: clamp(shade, 0.05, 1), signal, release: point });
}

function frame(curve: CatmullRomCurve3, t: number) {
  const tangent = curve.getTangentAt(t).normalize();
  const helper = Math.abs(tangent.z) < 0.9 ? VIEW : new Vector3(1, 0, 0);
  const side = new Vector3().crossVectors(tangent, helper).normalize();
  const up = new Vector3().crossVectors(side, tangent).normalize();
  return { tangent, side, up };
}

/** Fine tapered fibres with subtle organic variation. */
function tubeRadius(fiber: Fiber, t: number) {
  const phase = fiber.curve.points[0].x * 41 + fiber.curve.points[0].y * 29;
  const taper = Math.pow(1 - t, 1.35);
  const radius = fiber.radiusEnd + (fiber.radiusStart - fiber.radiusEnd) * taper;
  // Varicosities: soft swellings spaced along the fibre, like the reference beads.
  const beads = 1 + 0.22 * Math.pow(Math.max(0, Math.sin(t * 46 + phase)), 6)
    + 0.06 * Math.sin(t * 17 + phase * 0.7);
  return radius * beads * 0.69;
}

function tubePoint(fiber: Fiber, t: number, random: () => number) {
  const point = fiber.curve.getPointAt(t);
  const { side, up } = frame(fiber.curve, t);
  const angle = random() * TAU;
  const normal = side.multiplyScalar(Math.cos(angle)).addScaledVector(up, Math.sin(angle));
  // A soft, partly filled membrane: halfway between the original glassy
  // branches and the thinner filaments, without two hard tubular edges.
  const spread = random();
  const radius = tubeRadius(fiber, t) * (0.5 * Math.pow(spread, 0.8) + 0.5 * (0.82 + 0.18 * Math.sqrt(spread)));
  const rim = 1 - Math.abs(normal.dot(VIEW));
  const key = Math.max(0, normal.dot(KEY_LIGHT));
  return {
    point: point.addScaledVector(normal, radius),
    shade: 0.26 + 0.275 * Math.pow(rim, 1.6) + 0.27 * key + 0.06 * random(),
  };
}

function pickWeighted<T extends { weight: number }>(items: T[], random: () => number) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let cursor = random() * total;
  for (const item of items) {
    cursor -= item.weight;
    if (cursor <= 0) return item;
  }
  return items[items.length - 1];
}

function curveThrough(a: Vector3, b: Vector3, bend: number, lift: number, random: () => number) {
  const delta = b.clone().sub(a);
  const length = delta.length();
  const planar = new Vector3(-delta.y, delta.x, 0).normalize();
  const points = [a.clone()];
  for (const t of [0.2, 0.4, 0.6, 0.8]) {
    const envelope = Math.sin(t * Math.PI);
    points.push(a.clone().lerp(b, t)
      .addScaledVector(planar, (bend + (random() - 0.5) * 0.06) * length * envelope)
      .add(new Vector3(0, 0, (lift + (random() - 0.5) * 0.08) * length * envelope)));
  }
  points.push(b.clone());
  return new CatmullRomCurve3(points, false, 'catmullrom', 0.4);
}

/**
 * A close-up of living neurons after the reference photograph: one large cell in
 * focus at the centre, four neighbours receding into soft focus at the corners,
 * fine branching dendrites linking them and warm light travelling along them.
 * z > 0 is nearer the camera; the focal plane is z = 0.
 * signal 0..1 is the moment the impulse reaches a star; 2 means never.
 */
export function buildSynapseParticles(count: number, random: () => number): SynapseParticle[] {
  const total = Math.max(0, Math.floor(count));
  const particles: SynapseParticle[] = [];
  if (!total) return particles;

  const cells: Cell[] = [
    { center: new Vector3(-0.04, 0.08, 0.0), radius: 0.11, ignite: 0.04, dendrites: 9, reach: 0.36 },
    { center: new Vector3(-0.8, 0.4, -0.34), radius: 0.056, ignite: 0.5, dendrites: 7, reach: 0.3 },
    { center: new Vector3(0.68, 0.42, -0.26), radius: 0.058, ignite: 0.46, dendrites: 7, reach: 0.3 },
    { center: new Vector3(-0.66, -0.31, -0.14), radius: 0.062, ignite: 0.54, dendrites: 7, reach: 0.3 },
    { center: new Vector3(0.84, -0.34, 0.28), radius: 0.078, ignite: 0.58, dendrites: 8, reach: 0.34 },
  ];
  // Faint, far neurons that only give the scene depth.
  const distantCells = [
    new Vector3(0.18, 0.66, -0.62), new Vector3(-0.28, -0.66, -0.58),
    new Vector3(1.12, 0.06, -0.55), new Vector3(-1.14, -0.02, -0.6),
    new Vector3(0.42, -0.1, -0.7), new Vector3(-0.42, 0.34, -0.66),
  ];

  const fibers: Fiber[] = [];
  // Warm lights: a short stretch of fibre (or a cell core) that glows from within.
  type Glow = { fiber?: Fiber; t: number; point: Vector3; signal: number; size: number };
  const glowSpots: Glow[] = [];

  // Thick dendrites from the central cell to each neighbour: the impulse runs out
  // from the centre, lighting beads on the way.
  const link = (from: number, to: number, start: number, end: number, bend: number, lift: number, thickness: number) => {
    const a = cells[from], b = cells[to];
    const dir = b.center.clone().sub(a.center).normalize();
    const curve = curveThrough(
      a.center.clone().addScaledVector(dir, a.radius * 0.7),
      b.center.clone().addScaledVector(dir, -b.radius * 0.7),
      bend, lift, random,
    );
    const fiber: Fiber = {
      curve, radiusStart: thickness, radiusEnd: thickness * 0.55,
      signalStart: start, signalEnd: end, weight: curve.getLength() * thickness * 55, kind: NEURAL_KIND.fiber,
    };
    fibers.push(fiber);
    for (const t of [0.24 + random() * 0.1, 0.62 + random() * 0.14]) {
      glowSpots.push({ fiber, t, point: curve.getPointAt(t), signal: start + (end - start) * t, size: 0.028 });
    }
  };
  link(0, 1, 0.06, 0.5, 0.12, -0.2, 0.019);
  link(0, 2, 0.06, 0.46, -0.1, -0.15, 0.02);
  link(0, 3, 0.06, 0.54, -0.14, -0.1, 0.019);
  link(0, 4, 0.06, 0.58, 0.1, 0.18, 0.023);
  // Neighbours also talk to each other around the frame.
  link(1, 3, 0.52, 0.8, 0.18, 0.05, 0.008);
  link(2, 4, 0.5, 0.82, -0.16, 0.1, 0.009);
  link(1, 2, 0.52, 0.9, 0.08, 0.05, 0.007);
  link(3, 4, 0.56, 0.92, -0.1, 0.1, 0.008);

  // Dendritic trees: thick at the soma, branching twice, tapering to threads.
  const grow = (start: Vector3, direction: Vector3, length: number, depth: number,
    width: number, signal: number, kind: number) => {
    const dir = direction.clone().normalize();
    const sideways = new Vector3(-dir.y, dir.x, (random() - 0.5) * 0.6).normalize();
    const wobble = (random() - 0.5) * length * 0.4;
    const end = start.clone().addScaledVector(dir, length).addScaledVector(sideways, wobble * 0.4);
    const curve = new CatmullRomCurve3([
      start.clone(),
      start.clone().addScaledVector(dir, length * 0.3).addScaledVector(sideways, wobble),
      start.clone().addScaledVector(dir, length * 0.68).addScaledVector(sideways, wobble * 0.55),
      end,
    ], false, 'catmullrom', 0.45);
    const endSignal = signal < 1.5 ? Math.min(0.98, signal + 0.05 + length * 0.12) : QUIET;
    const fiber: Fiber = { curve, radiusStart: width, radiusEnd: width * (depth === 2 ? 0.14 : 0.5),
      signalStart: signal, signalEnd: endSignal, weight: length * width * 40, kind };
    fibers.push(fiber);
    if (depth === 0 && kind === NEURAL_KIND.fiber && random() < 0.3) {
      const t = 0.35 + random() * 0.4;
      glowSpots.push({ fiber, t, point: curve.getPointAt(t), signal: signal + (endSignal - signal) * t, size: 0.02 });
    }
    if (depth === 2) return;
    const children = depth === 0 ? 2 + (random() < 0.35 ? 1 : 0) : 2;
    for (let i = 0; i < children; i++) {
      const rotate = (i - (children - 1) / 2) * (0.5 + random() * 0.35) + (random() - 0.5) * 0.25;
      const childDir = dir.clone().applyAxisAngle(VIEW, rotate);
      childDir.z = clamp(childDir.z + (random() - 0.5) * 0.4, -0.7, 0.7);
      grow(end, childDir, length * (0.5 + random() * 0.14), depth + 1, width * 0.55, endSignal, kind);
    }
  };

  const somaRoots: Vector3[][] = cells.map(() => []);
  cells.forEach((cell, index) => {
    for (let branch = 0; branch < cell.dendrites; branch++) {
      const angle = (branch + random() * 0.7) / cell.dendrites * TAU + index * 0.9;
      const dir = new Vector3(Math.cos(angle), Math.sin(angle), (random() - 0.5) * 0.7).normalize();
      somaRoots[index].push(dir);
      const start = cell.center.clone().addScaledVector(dir, cell.radius * 0.7);
      grow(start, dir, cell.reach * (0.6 + random() * 0.5), 0, cell.radius * (0.2 + random() * 0.06),
        cell.ignite + 0.02, NEURAL_KIND.fiber);
    }
  });
  distantCells.forEach((center) => {
    for (let branch = 0; branch < 6; branch++) {
      const angle = (branch + random() * 0.8) / 6 * TAU;
      grow(center, new Vector3(Math.cos(angle), Math.sin(angle), (random() - 0.5) * 0.4), 0.22 + random() * 0.18,
        1, 0.006, QUIET, NEURAL_KIND.distant);
    }
  });
  for (let i = 0; i < distantCells.length; i++) {
    const a = distantCells[i], b = distantCells[(i + 2) % distantCells.length];
    fibers.push({ curve: curveThrough(a, b, (random() - 0.5) * 0.4, 0, random), radiusStart: 0.005,
      radiusEnd: 0.004, signalStart: QUIET, signalEnd: QUIET, weight: a.distanceTo(b) * 0.2, kind: NEURAL_KIND.distant });
  }

  const nearFibers = fibers.filter((fiber) => fiber.kind === NEURAL_KIND.fiber);
  const farFibers = fibers.filter((fiber) => fiber.kind === NEURAL_KIND.distant);

  // Budget: rough cell bodies, warm light, near membrane, far network.
  const somaEnd = Math.floor(total * 0.15);
  const glowEnd = somaEnd + Math.floor(total * 0.06);
  const distantEnd = glowEnd + Math.floor(total * 0.08);

  // Cell bodies: an irregular, crinkled membrane pulled out towards each dendrite.
  const somaWeights = cells.map((cell) => cell.radius * cell.radius);
  const somaTotal = somaWeights.reduce((sum, weight) => sum + weight, 0);
  while (particles.length < somaEnd) {
    let index = 0;
    let cursor = random() * somaTotal;
    while (index < cells.length - 1 && cursor > somaWeights[index]) cursor -= somaWeights[index++];
    const cell = cells[index];
    const zz = random() * 2 - 1;
    const azimuth = random() * TAU;
    const radial = Math.sqrt(1 - zz * zz);
    const direction = new Vector3(Math.cos(azimuth) * radial, Math.sin(azimuth) * radial, zz);
    let alignment = 0;
    for (const root of somaRoots[index]) alignment = Math.max(alignment, direction.dot(root));
    const lobe = Math.pow(Math.max(0, alignment), 6);
    const crinkle = 0.07 * Math.sin(azimuth * 9 + zz * 13) * Math.sin(azimuth * 5 - zz * 7)
      + 0.05 * Math.sin(azimuth * 17 + zz * 21);
    const shell = random() < 0.82 ? 0.9 + 0.1 * random() : 0.35 + 0.5 * random();
    const r = cell.radius * (0.82 + 0.6 * lobe + crinkle) * shell;
    const point = cell.center.clone().add(new Vector3(direction.x * r * 1.08, direction.y * r, direction.z * r * 0.85));
    const rim = 1 - Math.abs(direction.dot(VIEW));
    const key = Math.max(0, direction.dot(KEY_LIGHT));
    // Crystalline surface: facets catch the light unevenly, the rim glows silver.
    const facet = 0.5 + 0.5 * Math.sin(azimuth * 23 + zz * 31) * Math.sin(azimuth * 13 - zz * 19);
    addParticle(particles, point, NEURAL_KIND.soma,
      0.1 + 0.62 * Math.pow(rim, 1.8) + 0.26 * key * facet + crinkle * 1.6, cell.ignite);
  }

  // Warm light: a bright core in every cell body, then beads along the fibres.
  // Cores glow inside the translucent body and spill warm light towards the membrane.
  const cores: Glow[] = cells.map((cell) => ({ t: 0, point: cell.center, signal: cell.ignite, size: cell.radius * 0.75 }));
  const lights = [...cores, ...cores, ...cores, ...cores, ...glowSpots];
  while (particles.length < glowEnd) {
    const spot = lights[Math.floor(random() * lights.length)];
    if (spot.fiber) {
      // A lit stretch of fibre: bright at its middle, fading along the tube.
      // Concentrated at its middle, fading softly along the tube.
      const along = (random() < 0.5 ? -1 : 1) * Math.pow(random(), 2.2);
      const t = clamp(spot.t + along * spot.size, 0, 1);
      const sample = tubePoint(spot.fiber, t, random);
      const centre = spot.fiber.curve.getPointAt(t);
      const point = centre.lerp(sample.point, Math.pow(random(), 1.5) * 0.85);
      addParticle(particles, point, NEURAL_KIND.glow, Math.pow(1 - Math.abs(along), 2.2),
        spot.signal + along * spot.size * 0.3);
    } else {
      const spread = spot.size * Math.pow(random(), 1.7);
      const offset = new Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize().multiplyScalar(spread);
      addParticle(particles, spot.point.clone().add(offset), NEURAL_KIND.glow,
        Math.pow(1 - spread / spot.size, 2.6), spot.signal);
    }
  }

  while (particles.length < distantEnd) {
    const fiber = pickWeighted(farFibers, random);
    const t = random();
    const sample = tubePoint(fiber, t, random);
    addParticle(particles, sample.point, NEURAL_KIND.distant, sample.shade * 0.7);
  }

  while (particles.length < total) {
    const fiber = pickWeighted(nearFibers, random);
    const t = random();
    const sample = tubePoint(fiber, t, random);
    const signal = fiber.signalStart < 1.5
      ? fiber.signalStart + (fiber.signalEnd - fiber.signalStart) * t
      : QUIET;
    addParticle(particles, sample.point, NEURAL_KIND.fiber, sample.shade, signal);
  }

  // Shuffle so every copy of the particle budget samples the whole scene evenly.
  for (let i = particles.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [particles[i], particles[j]] = [particles[j], particles[i]];
  }
  return particles;
}
