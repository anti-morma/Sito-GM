/** Keep a render deadline instead of restarting the interval after each draw.
 * Restarting it rounds 60 fps down to 37.5 fps on a 75 Hz display (48 on
 * 144 Hz). Carry the fractional interval across display refreshes instead.
 */
export function createFramePacer() {
  let next = 0;
  let previousFps = 0;
  return (now: number, fps: number) => {
    const interval = 1000 / fps;
    if (fps !== previousFps) {
      next = now;
      previousFps = fps;
    }
    if (now + 0.5 < next) return false;
    // After a pause, draw once and discard missed deadlines; never catch up
    // with a burst of draws. The tolerance covers timestamp rounding.
    next += Math.max(1, Math.floor((now - next) / interval) + 1) * interval;
    return true;
  };
}
