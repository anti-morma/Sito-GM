/** Stable damped spring, integrated at 120 Hz even after a slow frame. */
export function springStep(value: number, velocity: number, rest: number, dt: number) {
  const steps = Math.max(1, Math.ceil(dt * 120));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    velocity += ((rest - value) * 42 - velocity * 8) * h;
    value += velocity * h;
  }
  if (Math.abs(value - rest) + Math.abs(velocity) < 0.0001) return [rest, 0];
  return [value, velocity];
}
