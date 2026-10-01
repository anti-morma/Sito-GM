// Shared between the page and the sky's nebula (nebula-field.ts), apart from
// the 3D library so the page can publish it before the sky has loaded.
// Published by the particle scene in camera space: no DOM reads or React updates
// in the animation loop. Keep the atmosphere quiet inside the star sculpture.
export const nebulaSubject = { x: 0, y: 0, radius: 0.3, strength: 0 };
export const nebulaJourney = { enabled: false, dispersion: 0, scroll: 0 };
