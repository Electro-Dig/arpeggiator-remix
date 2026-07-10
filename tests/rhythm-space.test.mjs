import assert from 'node:assert/strict';
import test from 'node:test';

import { RhythmSpace } from '../rhythm/RhythmSpace.js';

test('coordinate selector clamps and resists boundary jitter', () => {
  const space = new RhythmSpace({ smoothing: 1, hysteresis: 0.03 });
  assert.deepEqual(space.update(0, 0), { x: 0, y: 6, changed: true });
  assert.deepEqual(space.update(0.50, 0.50), { x: 3, y: 3, changed: true });
  assert.equal(space.update(0.501, 0.499).changed, false);
  assert.deepEqual(space.update(1, 1), { x: 6, y: 0, changed: true });
});

test('coordinate selector smooths movement before changing cells', () => {
  const space = new RhythmSpace({ smoothing: 0.25, hysteresis: 0 });
  assert.equal(space.update(0, 0.5).x, 0);
  assert.equal(space.update(1, 0.5).x, 1);
  assert.equal(space.update(1, 0.5).x, 3);
});
