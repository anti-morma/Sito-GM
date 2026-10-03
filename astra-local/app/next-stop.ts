import { isReducedMotion as reducedMotion } from './motion';

/** Scrolls to the next stop of the page ([data-scroll-stop]) below the current view. */
export function scrollToNextStop() {
  const stops = [...document.querySelectorAll<HTMLElement>('[data-scroll-stop]')]
    // Sections hidden at this size (desktop film, phone summary) are not stops.
    .filter((element) => element.offsetHeight > 0)
    .map((element) => element.getBoundingClientRect().top + scrollY)
    .sort((a, b) => a - b);
  const top = stops.find((stop) => stop > scrollY + 24) ?? scrollY + innerHeight * 0.9;
  scrollTo({ top, behavior: reducedMotion() ? 'auto' : 'smooth' });
}
