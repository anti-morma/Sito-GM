// The method's scroll, shared by the page (method-story.tsx) and the stars
// (particle-journey.tsx). The first villa stars leave the GM at 75% of its
// dispersion; the drawing is already underway when the method section enters.
// It is recognizable in the first 30svh, then holds while the words appear.
export const VILLA_START_HERO = 0.04 + (0.5 - 0.04) * 0.75;
export const METHOD_ENTRY = 0.805;
export const METHOD_KEYS: [number, number][] = [[0, METHOD_ENTRY], [30, 0.84], [92, 0.84], [120, 0.865], [300, 1]];
export const METHOD_TRAVEL = METHOD_KEYS[METHOD_KEYS.length - 1][0];

/** Story value at a point of the scroll (units). */
export function methodStoryAt(units: number) {
  for (let i = 1; i < METHOD_KEYS.length; i++) {
    const [u1, s1] = METHOD_KEYS[i];
    const [u0, s0] = METHOD_KEYS[i - 1];
    if (units <= u1) return s0 + (s1 - s0) * Math.max(0, Math.min(1, (units - u0) / (u1 - u0)));
  }
  return 1;
}

/** Scroll (units) at which the story reaches a value. */
export function methodUnitsAt(story: number) {
  for (let i = 1; i < METHOD_KEYS.length; i++) {
    const [u1, s1] = METHOD_KEYS[i];
    const [u0, s0] = METHOD_KEYS[i - 1];
    if (story <= s1) return s1 === s0 ? u0 : u0 + ((story - s0) / (s1 - s0)) * (u1 - u0);
  }
  return METHOD_TRAVEL;
}
