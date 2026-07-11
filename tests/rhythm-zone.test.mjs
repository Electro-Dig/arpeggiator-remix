import assert from 'node:assert/strict';
import test from 'node:test';

import { RhythmZone, RIGHT_HAND_ZONE } from '../rhythm/RhythmZone.js';

test('maps the approved zone corners and center into unit coordinates', () => {
  const zone = new RhythmZone();
  assert.deepEqual(zone.map(RIGHT_HAND_ZONE.left, RIGHT_HAND_ZONE.top), { x: 0, y: 0 });
  assert.deepEqual(zone.map(RIGHT_HAND_ZONE.right, RIGHT_HAND_ZONE.bottom), { x: 1, y: 1 });
  assert.deepEqual(zone.map(0.75, 0.51), { x: 0.5, y: 0.5 });
});

test('clamps positions outside the red-box zone to the nearest edge', () => {
  const zone = new RhythmZone();
  assert.deepEqual(zone.map(0, 0), { x: 0, y: 0 });
  assert.deepEqual(zone.map(1, 1), { x: 1, y: 1 });
  assert.deepEqual(zone.map(0.75, 0), { x: 0.5, y: 0 });
});
