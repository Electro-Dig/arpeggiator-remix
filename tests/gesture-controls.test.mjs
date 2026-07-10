import assert from 'node:assert/strict';
import test from 'node:test';

import { EdgeGesture, pinchVelocity } from '../music/gesture-controls.js';

function handWithPinch(distance) {
  const landmarks = Array.from({ length: 21 }, () => ({ x: 0, y: 0 }));
  landmarks[0] = { x: 0, y: 0 };
  landmarks[9] = { x: 0, y: 1 };
  landmarks[4] = { x: 0, y: 0 };
  landmarks[8] = { x: distance, y: 0 };
  return landmarks;
}

test('pinch velocity is palm-normalized with a closed-hand dead zone', () => {
  assert.equal(pinchVelocity(null), 0);
  assert.equal(pinchVelocity(handWithPinch(0.12)), 0);
  assert.ok(Math.abs(pinchVelocity(handWithPinch(0.57)) - 0.5) < 1e-9);
  assert.equal(pinchVelocity(handWithPinch(1.02)), 1);
});

test('edge gesture fires once per rising edge and respects cooldown', () => {
  const edge = new EdgeGesture(700);
  assert.equal(edge.update(false, 0), false);
  assert.equal(edge.update(true, 10), true);
  assert.equal(edge.update(true, 20), false);
  assert.equal(edge.update(false, 30), false);
  assert.equal(edge.update(true, 400), false);
  assert.equal(edge.update(false, 500), false);
  assert.equal(edge.update(true, 711), true);
});
