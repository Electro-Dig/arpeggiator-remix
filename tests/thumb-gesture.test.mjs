import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  GestureLatch,
  classifyThumbPose,
  combineThumbPoses,
} from '../recording/thumb-gesture.js';

function handFixture({ thumb = 'neutral', openFingers = [] } = {}) {
  const points = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.6, z: 0 }));
  points[0] = { x: 0.5, y: 0.8, z: 0 };
  points[2] = { x: 0.5, y: 0.55, z: 0 };
  points[9] = { x: 0.5, y: 0.5, z: 0 };
  points[4] = thumb === 'up'
    ? { x: 0.5, y: 0.34, z: 0 }
    : thumb === 'down'
      ? { x: 0.5, y: 0.77, z: 0 }
      : { x: 0.7, y: 0.55, z: 0 };

  const fingers = [
    ['index', 6, 8, 0.42],
    ['middle', 10, 12, 0.48],
    ['ring', 14, 16, 0.54],
    ['pinky', 18, 20, 0.6],
  ];
  for (const [name, pip, tip, x] of fingers) {
    points[pip] = { x, y: 0.5, z: 0 };
    points[tip] = openFingers.includes(name)
      ? { x, y: 0.2, z: 0 }
      : { x, y: 0.62, z: 0 };
  }
  return points;
}

test('classifies deliberate thumbs only when the other fingers are curled', () => {
  assert.equal(classifyThumbPose(handFixture({ thumb: 'up' })), 'up');
  assert.equal(classifyThumbPose(handFixture({ thumb: 'down' })), 'down');
  assert.equal(classifyThumbPose(handFixture()), 'neutral');
});

test('normal three-finger performance shapes remain neutral', () => {
  const performanceHand = handFixture({
    thumb: 'up',
    openFingers: ['index', 'middle', 'ring'],
  });
  assert.equal(classifyThumbPose(performanceHand), 'neutral');
});

test('combines only matching left and right thumb poses', () => {
  const up = { landmarks: handFixture({ thumb: 'up' }) };
  const down = { landmarks: handFixture({ thumb: 'down' }) };
  assert.equal(combineThumbPoses({ Left: up, Right: up }), 'both-up');
  assert.equal(combineThumbPoses({ Left: down, Right: down }), 'both-down');
  assert.equal(combineThumbPoses({ Left: up, Right: down }), 'neutral');
  assert.equal(combineThumbPoses({ Left: up }), 'neutral');
});

test('fires after 800ms and only rearms after 1000ms neutral', () => {
  const latch = new GestureLatch({ holdMs: 800, neutralMs: 1000 });
  assert.equal(latch.update('both-up', 0), null);
  assert.equal(latch.update('both-up', 799), null);
  assert.equal(latch.update('both-up', 800), 'both-up');
  assert.equal(latch.update('both-up', 2000), null);
  assert.equal(latch.update('neutral', 2100), null);
  assert.equal(latch.update('neutral', 3099), null);
  assert.equal(latch.update('neutral', 3100), null);
  assert.equal(latch.update('both-down', 3101), null);
  assert.equal(latch.update('both-down', 3901), 'both-down');
});

test('changing intent restarts the hold timer', () => {
  const latch = new GestureLatch({ holdMs: 800, neutralMs: 1000 });
  latch.update('both-up', 100);
  assert.equal(latch.update('both-down', 899), null);
  assert.equal(latch.update('both-down', 1698), null);
  assert.equal(latch.update('both-down', 1699), 'both-down');
});

test('guide close can require a full neutral re-arm', () => {
  const latch = new GestureLatch({ holdMs: 800, neutralMs: 1000 });
  latch.requireNeutral();
  assert.equal(latch.update('both-up', 1000), null);
  assert.equal(latch.update('neutral', 1100), null);
  assert.equal(latch.update('neutral', 2099), null);
  assert.equal(latch.update('neutral', 2100), null);
  assert.equal(latch.update('both-up', 2101), null);
  assert.equal(latch.update('both-up', 2901), 'both-up');
test('exposes re-arm state for review feedback with a 500ms neutral window', () => {
  const latch = new GestureLatch({ holdMs: 800, neutralMs: 500 });
  latch.requireNeutral();
  assert.equal(latch.isArmed, false);
  assert.equal(latch.rearmProgress, 0);
  latch.update('neutral', 1000);
  latch.update('neutral', 1250);
  assert.equal(latch.rearmProgress, 0.5);
  latch.update('neutral', 1500);
  assert.equal(latch.isArmed, true);
  assert.equal(latch.rearmProgress, 1);
});

});

test('game frames are normalized by handedness and emitted once per result', async () => {
  const source = await readFile(new URL('../game.js', import.meta.url), 'utf8');
  assert.match(source, /results\.handednesses/);
  assert.match(source, /side === 'Left' \? 0 : side === 'Right' \? 1/);
  assert.match(source, /setInteractionSuppressed/);
  assert.equal((source.match(/new CustomEvent\('handframe'/g) || []).length, 1);
});
