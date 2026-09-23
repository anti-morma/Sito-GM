import { Vector3 } from 'three';
import referencePoints from './blueprint-points.json';

export type BlueprintParticle = {
  plan: Vector3;
  built: Vector3;
  shade: number;
  phase: number;
  kind: number;
  draw: number;
};

/** White line samples from the supplied video's first frame, in its exact 16:9 plane.
 * Regenerate from the local video with scripts/sample-blueprint.py.
 * Keeping the drawing flat until the video arrives prevents a perspective jump.
 */
export function buildBlueprintParticles(count: number, _random: () => number): BlueprintParticle[] {
  const total = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  return Array.from({ length: total }, (_, index) => {
    const [x, z, shade, draw] = referencePoints[index % referencePoints.length];
    return {
      plan: new Vector3(x, 0, z),
      built: new Vector3(x, 0, z),
      shade, draw, phase: 0, kind: 0,
    };
  });
}
