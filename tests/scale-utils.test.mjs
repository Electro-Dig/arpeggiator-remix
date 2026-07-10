import assert from 'node:assert/strict';
import test from 'node:test';

import { buildScale, noteAtPosition } from '../music/scale-utils.js';

test('builds the approved pitch classes across the performance range', () => {
  assert.deepEqual(buildScale('E', 'natural-minor', 3, 4), ['E3', 'F#3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4']);
  assert.deepEqual(buildScale('E', 'harmonic-minor', 3, 4), ['E3', 'F#3', 'G3', 'A3', 'B3', 'C4', 'D#4', 'E4']);
  assert.deepEqual(buildScale('A', 'dorian', 3, 4), ['A3', 'B3', 'C4', 'D4', 'E4', 'F#4', 'G4', 'A4']);
});

test('maps top to high and bottom to low without chromatic notes', () => {
  const scale = buildScale('E', 'natural-minor', 3, 5);
  assert.equal(noteAtPosition(scale, 1), 'E3');
  assert.equal(noteAtPosition(scale, 0), 'E5');
  assert.ok(scale.includes(noteAtPosition(scale, 0.427)));
});

test('rejects unsupported scales and empty note maps', () => {
  assert.throws(() => buildScale('H', 'natural-minor'), /Unsupported scale/);
  assert.throws(() => noteAtPosition([], 0.5), /Scale must contain notes/);
});
