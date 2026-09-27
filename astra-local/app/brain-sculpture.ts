/** The art-directed display volume, baked offline from the visual reference. */
export const BRAIN_COUNT = 163840;
export const BRAIN_MOBILE_COUNT = BRAIN_COUNT / 2;

export function decodeBrainSculpture(buffer: ArrayBuffer, phone: boolean) {
  const view = new DataView(buffer);
  if (buffer.byteLength !== 16 + BRAIN_COUNT * 16
    || view.getUint32(0, false) !== 0x474d4252
    || view.getUint32(4, true) !== 1
    || view.getUint32(8, true) !== BRAIN_COUNT
    || view.getUint32(12, true) !== 8) {
    throw new Error('Invalid brain sculpture');
  }
  const count = phone ? BRAIN_MOBILE_COUNT : BRAIN_COUNT;
  const step = phone ? 2 : 1;
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const shades = new Float32Array(count);
  const weights = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const offset = 16 + i * step * 16;
    for (let axis = 0; axis < 3; axis++) {
      positions[i * 3 + axis] = view.getUint16(offset + axis * 2, true) / 32767.5 - 1;
      normals[i * 3 + axis] = view.getUint16(offset + 6 + axis * 2, true) / 32767.5 - 1;
    }
    shades[i] = view.getUint16(offset + 12, true) / 65535;
    weights[i] = view.getUint16(offset + 14, true) / 65535;
  }
  return { positions, normals, shades, weights };
}
