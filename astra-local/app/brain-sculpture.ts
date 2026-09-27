/** Uniformly spaced particles on the original anatomical surface. */
export const BRAIN_COUNT = 196608;
export const BRAIN_MOBILE_COUNT = BRAIN_COUNT / 2;

/** Separate reference material: one appearance value per anatomical point. */
export function decodeBrainSurface(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  if (buffer.byteLength !== 16 + BRAIN_COUNT
    || view.getUint32(0, false) !== 0x474d5346
    || view.getUint32(4, true) !== 7
    || view.getUint32(8, true) !== BRAIN_COUNT
    || view.getUint32(12, true) !== 1) throw new Error('Invalid brain surface texture');
  return new Uint8Array(buffer, 16);
}

export function decodeBrainSculpture(buffer: ArrayBuffer, phone: boolean) {
  const view = new DataView(buffer);
  if (buffer.byteLength !== 16 + BRAIN_COUNT * 16
    || view.getUint32(0, false) !== 0x474d4252
    || view.getUint32(4, true) !== 2
    || view.getUint32(8, true) !== BRAIN_COUNT
    || view.getUint32(12, true) !== 8) {
    throw new Error('Invalid brain sculpture');
  }
  const count = phone ? BRAIN_MOBILE_COUNT : BRAIN_COUNT;
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // The prefix is itself evenly distributed across the complete surface.
    const offset = 16 + i * 16;
    for (let axis = 0; axis < 3; axis++) {
      positions[i * 3 + axis] = view.getUint16(offset + axis * 2, true) / 32767.5 - 1;
      normals[i * 3 + axis] = view.getUint16(offset + 6 + axis * 2, true) / 32767.5 - 1;
    }
  }
  return { positions, normals };
}
