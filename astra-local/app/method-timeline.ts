// The method's scroll, shared by the page (method-story.tsx) and the stars
// (particle-journey.tsx). Units are svh scrolled while the scene is pinned;
// the story value drives the stars: 0.775 loose, 0.815 the villa drawn, 0.84 →
// 0.865 the crossfade to the video, 1 the house built.
// In order: the words appear over the loose stars, then the villa is drawn,
// then the video takes over and plays to the end.
export const METHOD_KEYS: [number, number][] = [[0, 0.775], [36, 0.775], [92, 0.84], [120, 0.865], [300, 1]];
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
