/** Opt-in diagnostic for actual layer draws, rather than RAF callbacks.
 * Open with ?fps. Submission rate does not measure GPU completion time.
 */
export function createFrameMeter(name?: string) {
  if (!new URLSearchParams(location.search).has('fps')) return null;
  const output = document.createElement('output');
  output.setAttribute('aria-label', name ? `Diagnostica frame ${name}` : 'Diagnostica frame del logo e del cervello');
  output.style.cssText = 'position:fixed;bottom:12px;left:12px;z-index:10000;padding:10px 14px;background:#000e;color:#fff;font:13px monospace;pointer-events:none;border:1px solid #777;border-radius:6px';
  if (name) output.style.bottom = '54px';
  output.textContent = 'Misurazione frame…';
  document.body.appendChild(output);
  let previous = 0;
  let start = 0;
  let intervals: number[] = [];
  return {
    record(now: number, target: number, label: string) {
      // Exclude offscreen/hidden pauses from the next measurement window.
      if (!previous || now - previous > 250) {
        previous = start = now;
        intervals = [];
        return;
      }
      intervals.push(now - previous);
      previous = now;
      if (now - start < 1000) return;
      const fps = intervals.length * 1000 / (now - start);
      intervals.sort((a, b) => a - b);
      const p95 = intervals[Math.min(intervals.length - 1, Math.floor(intervals.length * 0.95))];
      output.textContent = `${label}: ${fps.toFixed(1)} FPS · limite ${target} · p95 ${p95.toFixed(1)} ms`;
      output.dataset.fps = fps.toFixed(1);
      output.dataset.p95 = p95.toFixed(1);
      start = now;
      intervals = [];
    },
    dispose() { output.remove(); },
  };
}
