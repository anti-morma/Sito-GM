// Work that can wait for the page: run it once the browser is idle, or after
// `timeout` ms at the latest. Safari has no requestIdleCallback: a short timer.
export function whenIdle(task: () => void, timeout = 700) {
  if (typeof requestIdleCallback === 'function') {
    const id = requestIdleCallback(task, { timeout });
    return () => cancelIdleCallback(id);
  }
  const id = window.setTimeout(task, 120);
  return () => clearTimeout(id);
}

/**
 * Like whenIdle, but never while the phone opening plays (opening.ts marks
 * <html> with gm-intro): the 3D scenes load and prepare once it has landed,
 * so their start-up work never makes the opening stutter.
 */
export function afterOpening(task: () => void) {
  const root = document.documentElement;
  let cancel = () => {};
  if (!root.classList.contains('gm-intro')) {
    cancel = whenIdle(task);
    return () => cancel();
  }
  const watch = new MutationObserver(() => {
    if (root.classList.contains('gm-intro')) return;
    watch.disconnect();
    cancel = whenIdle(task);
  });
  watch.observe(root, { attributes: true, attributeFilter: ['class'] });
  return () => { watch.disconnect(); cancel(); };
}
