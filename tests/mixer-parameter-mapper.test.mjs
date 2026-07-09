import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clamp01,
  mapDelayFromDistance,
  mapFilterCutoff,
  mapReverbWet,
  smoothValue,
} from '../duo/MixerParameterMapper.js';

test('clamp01 bounds normalized values', () => {
  assert.equal(clamp01(-1), 0);
  assert.equal(clamp01(0.25), 0.25);
  assert.equal(clamp01(2), 1);
});

test('filter cutoff uses a logarithmic musical range', () => {
  assert.equal(Math.round(mapFilterCutoff(0)), 300);
  assert.equal(Math.round(mapFilterCutoff(1)), 8000);
  const middle = mapFilterCutoff(0.5);
  assert.ok(middle > 1400 && middle < 1700);
});

test('reverb and delay mappings stay within safe wet ranges', () => {
  assert.equal(mapReverbWet(0), 0.55);
  assert.equal(mapReverbWet(1), 0.05);
  assert.deepEqual(mapDelayFromDistance(0), { wet: 0, feedback: 0.15 });
  assert.deepEqual(mapDelayFromDistance(1), { wet: 0.45, feedback: 0.65 });
});

test('smoothValue moves partially toward target', () => {
  assert.equal(smoothValue(0, 1, 0.2), 0.2);
  assert.equal(smoothValue(10, 0, 0.5), 5);
});
