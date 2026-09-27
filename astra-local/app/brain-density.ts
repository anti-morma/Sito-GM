/** Fill local triangles on the same anatomical surface.
 * Original samples stay unchanged. Matching normals and short, nearly tangent
 * edges reject opposing folds; triangle interiors avoid strands of new stars.
 */
export const BRAIN_SOURCE_COUNT = 65536;
export const BRAIN_DESKTOP_LAYERS = 3;
export const BRAIN_PHONE_LAYERS = 2;

const CELL = 0.014;
const MAX_DISTANCE = CELL * CELL;
const key = (x: number, y: number, z: number) => x + y * 256 + z * 65536;
const cell = (value: number) => Math.floor((value + 1) / CELL);

export async function densifyBrain(
  packed: number[], appearance: number[], stride: number, layers: number,
  signal: AbortSignal,
) {
  const sourceCount = packed.length / 7;
  const baseCount = sourceCount / stride;
  const count = baseCount * layers;
  const source = new Float32Array(sourceCount * 7);
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const shades = new Float32Array(count);
  const weights = new Float32Array(count);
  const density = new Float32Array(baseCount);
  const cells = new Map<number, number[]>();
  const aborted = () => { if (signal.aborted) throw new DOMException('Brain loading cancelled', 'AbortError'); };
  const yieldToPage = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

  for (let i = 0; i < sourceCount; i++) {
    const k = i * 7;
    for (let axis = 0; axis < 6; axis++) source[k + axis] = packed[k + axis] / 32767.5 - 1;
    source[k + 6] = appearance[i] / 65535;
    const bucket = key(cell(source[k]), cell(source[k + 1]), cell(source[k + 2]));
    const list = cells.get(bucket);
    if (list) list.push(i); else cells.set(bucket, [i]);
    if (i % 8192 === 8191) { aborted(); await yieldToPage(); }
  }

  for (let i = 0; i < baseCount; i++) {
    const k = i * stride * 7;
    const x = source[k], y = source[k + 1], z = source[k + 2];
    const nx = source[k + 3], ny = source[k + 4], nz = source[k + 5];
    positions.set([x, y, z], i * 3);
    normals.set([nx, ny, nz], i * 3);
    shades[i] = source[k + 6];
    const cx = cell(x), cy = cell(y), cz = cell(z);
    const neighbors: { index: number; distance: number }[] = [];
    for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const bucket = cells.get(key(cx + dx, cy + dy, cz + dz));
      if (!bucket) continue;
      for (const candidate of bucket) {
        const j = candidate * 7;
        const vx = source[j] - x, vy = source[j + 1] - y, vz = source[j + 2] - z;
        const distance = vx * vx + vy * vy + vz * vz;
        if (distance < 1e-8 || distance > MAX_DISTANCE) continue;
        if (nx * source[j + 3] + ny * source[j + 4] + nz * source[j + 5] < 0.85) continue;
        // Reject steps through the surface, including close but separate lobes.
        const tangentLimit = Math.sqrt(distance) * 0.20 + 0.00035;
        if (Math.abs(vx * nx + vy * ny + vz * nz) > tangentLimit
          || Math.abs(vx * source[j + 3] + vy * source[j + 4] + vz * source[j + 5]) > tangentLimit) continue;
        neighbors.push({ index: j, distance });
      }
    }
    neighbors.sort((a, b) => a.distance - b.distance);
    density[i] = 1 + neighbors.reduce((sum, neighbor) => sum + Math.exp(-neighbor.distance / 0.000036), 0);
    weights[i] = 1;
    for (let layer = 1; layer < layers; layer++) {
      const target = layer * baseCount + i;
      const first = neighbors.length ? neighbors[(i + layer * 3) % Math.min(8, neighbors.length)].index : k;
      const ax = source[first] - x, ay = source[first + 1] - y, az = source[first + 2] - z;
      const aLength2 = ax * ax + ay * ay + az * az;
      let second = k, area = 0;
      for (const neighbor of neighbors.slice(0, 12)) {
        const j = neighbor.index;
        const bx = source[j] - x, by = source[j + 1] - y, bz = source[j + 2] - z;
        const dot = ax * bx + ay * by + az * bz;
        const spread = aLength2 * neighbor.distance - dot * dot;
        if (spread > area) { area = spread; second = j; }
      }
      let a = 0, b = 0, c = 0, clearance = -1;
      // Select the best of four deterministic interior samples. This fills
      // local gaps instead of stacking new particles onto existing ones.
      for (let attempt = 0; attempt < 4; attempt++) {
        const seed = (i + 1) * 16807 + layer * 48271 + attempt * 69621;
        const root = Math.sqrt(0.1 + (seed % 65521) / 65521 * 0.8);
        const split = 0.1 + ((seed * 17) % 65519) / 65519 * 0.8;
        const wa = 1 - root, wb = root * (1 - split), wc = root * split;
        const px = x * wa + source[first] * wb + source[second] * wc;
        const py = y * wa + source[first + 1] * wb + source[second + 1] * wc;
        const pz = z * wa + source[first + 2] * wb + source[second + 2] * wc;
        let nearest = (px - x) ** 2 + (py - y) ** 2 + (pz - z) ** 2;
        for (const neighbor of neighbors) {
          const j = neighbor.index;
          nearest = Math.min(nearest, (px - source[j]) ** 2 + (py - source[j + 1]) ** 2 + (pz - source[j + 2]) ** 2);
        }
        if (nearest > clearance) { clearance = nearest; a = wa; b = wb; c = wc; }
      }
      for (let axis = 0; axis < 3; axis++) {
        positions[target * 3 + axis] = source[k + axis] * a + source[first + axis] * b + source[second + axis] * c;
        normals[target * 3 + axis] = source[k + 3 + axis] * a + source[first + 3 + axis] * b + source[second + 3 + axis] * c;
      }
      const j = target * 3;
      const length = Math.hypot(normals[j], normals[j + 1], normals[j + 2]) || 1;
      for (let axis = 0; axis < 3; axis++) normals[j + axis] /= length;
      shades[target] = source[k + 6] * a + source[first + 6] * b + source[second + 6] * c;
      weights[target] = clearance > 1e-9 ? 1 : 0;
    }
    if (i % 2048 === 2047) { aborted(); await yieldToPage(); }
  }
  const orderedDensity = Float32Array.from(density).sort();
  const medianDensity = orderedDensity[baseCount >> 1];
  for (let i = 0; i < count; i++) {
    weights[i] *= Math.max(0.4, Math.min(1.3, Math.sqrt(medianDensity / density[i % baseCount])));
  }
  aborted();
  return { positions, normals, shades, weights };
}
