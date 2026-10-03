// The window the sky's stars drift into (home-film.tsx → star-sky-scene.ts).
// Document coordinates in CSS px, so the sky's loop never reads the DOM.
// `target` 0 leaves the sky exactly as it is everywhere else.
export const skyFocus = { left: 0, top: 0, width: 0, height: 0, radius: 24, target: 0 };
