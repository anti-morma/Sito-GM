/** Uniformly spaced particles on the original anatomical surface. */
export const BRAIN_COUNT = 196608;
export const BRAIN_MOBILE_COUNT = BRAIN_COUNT / 2;
// The full anatomical surface is retained for occlusion. Its evenly spaced
// prefix draws the desktop texture, leaving air between the individual cells.
export const BRAIN_SURFACE_STARS = 163840;

// The sculpture lives in public/brain-{0,1,2}.bin, consecutive slices of one
// list whose every prefix is itself spread across the whole surface: a screen
// that draws fewer stars downloads only the first slices. Each slice: header
// 'GMBC', version, first star, count (uint32), then per star its position
// (uint16 ×3, 0…65535 over −1…1), its outward normal (int8 ×2, octahedral)
// and its shade in the reference image (uint8). The GPU reads them as they
// are: no decoding on the page.
const SLICES = [65536, 98304, BRAIN_COUNT];
const url = (index: number) => `/brain-${index}.bin?v=1`;

export type BrainStars = { count: number; positions: Uint16Array; normals: Int8Array; shades: Uint8Array };

/** The first `count` stars (a slice boundary: 65536, 98304 or all of them). */
export async function loadBrain(count: number, signal: AbortSignal): Promise<BrainStars> {
  const slices = SLICES.findIndex((end) => end >= count) + 1;
  const total = SLICES[slices - 1];
  const positions = new Uint16Array(total * 3);
  const normals = new Int8Array(total * 2);
  const shades = new Uint8Array(total);
  const buffers = await Promise.all(Array.from({ length: slices }, (_, index) =>
    fetch(url(index), { signal, priority: 'low' } as RequestInit).then((response) => {
      if (!response.ok) throw new Error(`Brain stars: ${response.status}`);
      return response.arrayBuffer();
    })));
  for (const buffer of buffers) {
    const view = new DataView(buffer);
    const start = view.getUint32(8, true);
    const n = view.getUint32(12, true);
    if (view.getUint32(0, false) !== 0x474d4243 || view.getUint32(4, true) !== 1 || buffer.byteLength !== 16 + n * 9) {
      throw new Error('Invalid brain stars');
    }
    positions.set(new Uint16Array(buffer, 16, n * 3), start * 3);
    normals.set(new Int8Array(buffer, 16 + n * 6, n * 2), start * 2);
    shades.set(new Uint8Array(buffer, 16 + n * 8, n), start);
  }
  return { count: total, positions, normals, shades };
}
