/** White line samples from the construction video's first frame, in its exact
 * 16:9 plane: x, z, shade and drawing order for each star of the villa.
 * They live in public/blueprint-{0,1}.bin, two halves of one list (header
 * 'GMBP', version, count, then four int16 per star, value × 32767), fetched
 * beside the page's code: phones draw the first half only and download that.
 * Keeping the drawing flat until the video arrives prevents a perspective jump.
 */
export const BLUEPRINT_HALF = 16384;
export const blueprintUrl = (index: number) => `/blueprint-${index}.bin?v=1`;

/** Four values per star: x, z, shade, drawing order. */
export function decodeBlueprint(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  const count = buffer.byteLength >= 12 ? view.getUint32(8, true) : 0;
  if (view.getUint32(0, false) !== 0x474d4250 || view.getUint32(4, true) !== 1 || buffer.byteLength !== 12 + count * 8) {
    throw new Error('Invalid blueprint points');
  }
  const values = new Int16Array(buffer, 12, count * 4);
  const points = new Float32Array(count * 4);
  for (let i = 0; i < points.length; i++) points[i] = values[i] / 32767;
  return points;
}
