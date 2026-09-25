export const STORY_KEYS: [number, number][] = [
  [0, 0],
  [34, 0.12],
  [88, 0.36],
  [92, 0.47],
  [255, 0.745],
  [335, 0.775],
];

export const STORY_UNITS = STORY_KEYS[STORY_KEYS.length - 1][0];

export const storyAt = (units: number) => {
  for (let i = 1; i < STORY_KEYS.length; i++) {
    const [u1, s1] = STORY_KEYS[i];
    const [u0, s0] = STORY_KEYS[i - 1];
    if (units <= u1) return s0 + ((units - u0) / (u1 - u0)) * (s1 - s0);
  }
  return 0.775;
};

export const unitsAt = (story: number) => {
  for (let i = 1; i < STORY_KEYS.length; i++) {
    const [u1, s1] = STORY_KEYS[i];
    const [u0, s0] = STORY_KEYS[i - 1];
    if (story <= s1) return u0 + ((story - s0) / (s1 - s0)) * (u1 - u0);
  }
  return STORY_UNITS;
};
