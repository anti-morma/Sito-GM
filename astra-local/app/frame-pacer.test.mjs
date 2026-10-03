import assert from 'node:assert/strict';
import test from 'node:test';
import { createFramePacer } from './frame-pacer.ts';

for (const hz of [60, 75, 90, 120, 144, 165, 240]) {
  for (const fps of [30, 60]) {
    test(`${fps} fps stays on budget on a ${hz} Hz display`, () => {
      const draw = createFramePacer();
      let count = 0;
      for (let refresh = 0; refresh < hz * 10; refresh++) {
        if (draw(refresh * 1000 / hz, fps)) count++;
      }
      assert.ok(Math.abs(count - fps * 10) <= 1, `got ${count} draws`);
    });
  }
}

test('a long pause resumes without a catch-up burst', () => {
  const draw = createFramePacer();
  assert.equal(draw(0, 60), true);
  assert.equal(draw(10003, 60), true);
  assert.equal(draw(10004, 60), false);
  assert.equal(draw(10017, 60), true);
});

test('a quality change starts the new cadence immediately', () => {
  const draw = createFramePacer();
  draw(0, 60);
  assert.equal(draw(17, 30), true);
  assert.equal(draw(34, 30), false);
  assert.equal(draw(51, 30), true);
});

for (const hz of [60, 75, 90, 120, 144, 165, 240]) {
  test(`native cadence draws every refresh on a ${hz} Hz display`, () => {
    const draw = createFramePacer();
    for (let refresh = 0; refresh < hz * 10; refresh++) {
      assert.equal(draw(refresh * 1000 / hz, null), true);
    }
  });
}

test('switching between native and capped cadence resets the deadline', () => {
  const draw = createFramePacer();
  draw(0, 30);
  assert.equal(draw(6, null), true);
  assert.equal(draw(12, null), true);
  assert.equal(draw(18, 30), true);
  assert.equal(draw(24, 30), false);
  assert.equal(draw(52, 30), true);
});
