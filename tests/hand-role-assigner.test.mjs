import assert from 'node:assert/strict';
import test from 'node:test';

import { HandRoleAssigner } from '../duo/HandRoleAssigner.js';

function hand(id, x, y = 0.5) {
  return {
    id,
    trackingIndex: id,
    palm: { x, y },
    landmarks: Array.from({ length: 21 }, () => ({ x, y, z: 0 })),
  };
}

test('locks performer and mixer roles after hold time', () => {
  const assigner = new HandRoleAssigner({
    leftMaxX: 0.47,
    rightMinX: 0.53,
    holdMs: 500,
    lostMs: 1000,
  });

  let result = assigner.update([hand(0, 0.2), hand(1, 0.35), hand(2, 0.65), hand(3, 0.8)], 1000);
  assert.equal(result.roles.performerMelody, null);
  assert.equal(result.roles.performerDrums, null);
  assert.equal(result.roles.mixerFilter, null);
  assert.equal(result.roles.mixerSpace, null);

  result = assigner.update([hand(0, 0.2), hand(1, 0.35), hand(2, 0.65), hand(3, 0.8)], 1600);
  assert.equal(result.roles.performerMelody.trackingIndex, 0);
  assert.equal(result.roles.performerDrums.trackingIndex, 1);
  assert.equal(result.roles.mixerFilter.trackingIndex, 2);
  assert.equal(result.roles.mixerSpace.trackingIndex, 3);
});

test('keeps locked roles through the center dead zone', () => {
  const assigner = new HandRoleAssigner({ holdMs: 0, lostMs: 1000 });

  assigner.update([hand(0, 0.2), hand(1, 0.65)], 1000);
  const result = assigner.update([hand(0, 0.5), hand(1, 0.5)], 1200);

  assert.equal(result.roles.performerMelody.trackingIndex, 0);
  assert.equal(result.roles.mixerFilter.trackingIndex, 1);
  assert.deepEqual(result.waiting.deadZone.map((entry) => entry.trackingIndex), [0, 1]);
});

test('releases roles after lost timeout', () => {
  const assigner = new HandRoleAssigner({ holdMs: 0, lostMs: 500 });

  let result = assigner.update([hand(0, 0.2), hand(1, 0.65)], 1000);
  assert.equal(result.roles.performerMelody.trackingIndex, 0);
  assert.equal(result.roles.mixerFilter.trackingIndex, 1);

  result = assigner.update([], 1300);
  assert.equal(result.roles.performerMelody.trackingIndex, 0);
  assert.equal(result.roles.mixerFilter.trackingIndex, 1);

  result = assigner.update([], 1700);
  assert.equal(result.roles.performerMelody, null);
  assert.equal(result.roles.mixerFilter, null);
});
