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
