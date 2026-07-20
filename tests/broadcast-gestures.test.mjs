import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BroadcastGestureController,
  broadcastBuildFromHands,
} from '../music/broadcast-gestures.js';

function handAt(y) {
  const landmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y }));
  landmarks[9] = { x: 0.5, y };
  return { landmarks };
}

function twoHands(y) {
  return { Left: handAt(y), Right: handAt(y) };
}

test('both hands raised create a continuous build while one hand stays neutral', () => {
  assert.equal(broadcastBuildFromHands(twoHands(0.6)), 0);
  assert.equal(broadcastBuildFromHands(twoHands(0.4)), 0.5);
  assert.equal(broadcastBuildFromHands(twoHands(0.2)), 1);
  assert.equal(broadcastBuildFromHands({ Left: handAt(0.2), Right: null }), 0);
});

test('an armed fast synchronized downstroke triggers one impact', () => {
  const controller = new BroadcastGestureController({
    holdMs: 300,
    cooldownMs: 2_000,
  });

  assert.deepEqual(controller.update(twoHands(0.25), 0), {
    build: 0.875, impact: false, phase: 'building',
  });
  assert.equal(controller.update(twoHands(0.25), 350).phase, 'armed');
  assert.deepEqual(controller.update(twoHands(0.7), 550), {
    build: 0, impact: true, phase: 'impact',
  });
  assert.equal(controller.update(twoHands(0.75), 600).impact, false);
});

test('slow movement, expired builds, and tracking loss never trigger impact', () => {
  const slow = new BroadcastGestureController({ holdMs: 300, armedTimeoutMs: 1_500 });
  slow.update(twoHands(0.25), 0);
  slow.update(twoHands(0.25), 350);
  assert.equal(slow.update(twoHands(0.45), 1_050).impact, false);
  assert.equal(slow.update(twoHands(0.7), 1_750).impact, false);

  const lost = new BroadcastGestureController({ holdMs: 300 });
  lost.update(twoHands(0.25), 0);
  assert.equal(lost.update(twoHands(0.25), 350).phase, 'armed');
  assert.deepEqual(lost.update({ Left: null, Right: null }, 400), {
    build: 0, impact: false, phase: 'idle',
  });
  assert.equal(lost.update(twoHands(0.7), 500).impact, false);
});

test('reset cancels build state and impact cooldown blocks a second drop', () => {
  const controller = new BroadcastGestureController({ holdMs: 300, cooldownMs: 2_000 });
  controller.update(twoHands(0.25), 0);
  controller.update(twoHands(0.25), 350);
  assert.equal(controller.update(twoHands(0.7), 550).impact, true);

  controller.update(twoHands(0.25), 700);
  controller.update(twoHands(0.25), 1_050);
  assert.equal(controller.update(twoHands(0.7), 1_250).impact, false);

  controller.reset();
  assert.deepEqual(controller.update(twoHands(0.25), 3_000), {
    build: 0.875, impact: false, phase: 'building',
  });
});
