import assert from 'node:assert/strict';
import test from 'node:test';

import { DEFAULT_SCENE_ID, SCENES, getScene } from '../music/scenes.js';

test('ships exactly six approved scenes and defaults to Groove Pulse', () => {
  assert.equal(DEFAULT_SCENE_ID, 'groove-pulse');
  assert.deepEqual(SCENES.map(({ id }) => id), [
    'minimal-groove', 'groove-pulse', 'neon-drive', 'arcade-horizon',
    'afterglow-coast', 'blue-hour-drift',
  ]);
  assert.deepEqual(SCENES.map(({ bpm }) => bpm), [122, 115, 120, 126, 118, 120]);
  assert.deepEqual(SCENES.map(({ tonic, mode }) => `${tonic} ${mode}`), [
    'E chromatic', 'E chromatic', 'E natural-minor', 'A dorian',
    'D major-pentatonic', 'A natural-minor',
  ]);
  assert.ok(!SCENES.some(({ id }) => id === 'midnight-pulse'));
  assert.ok(SCENES.every(Object.isFrozen));
});

test('the two newest scenes use dense 16-step synthpop hooks around 118 BPM', () => {
  const afterglow = getScene('afterglow-coast');
  const blueHour = getScene('blue-hour-drift');
  assert.deepEqual(afterglow.sequence, [0, 4, 7, 9, 11, 9, 7, 4, 2, 4, 7, 11, 9, 7, 4, 2]);
  assert.deepEqual(blueHour.sequence, [0, 3, 7, 10, 12, 10, 7, 3, 5, 7, 10, 14, 12, 10, 7, 3]);
  assert.equal(afterglow.sequence.filter(Number.isFinite).length, 16);
  assert.equal(blueHour.sequence.filter(Number.isFinite).length, 16);
  assert.deepEqual(afterglow.bass, [0, null, 0, null, 5, null, 7, null]);
  assert.deepEqual(blueHour.bass, [0, null, 0, 0, 5, null, 7, null]);
});

test('promotes only the approved Classic material into standalone scenes', () => {
  assert.deepEqual(getScene('minimal-groove').sequence, [0, 3, null, 7, 8, null, 7, null]);
  assert.equal(getScene('minimal-groove').variants[0], 'DX7 MARIMBA');
  assert.deepEqual(
    getScene('groove-pulse').sequence,
    [0, 7, 2, 7, 0, 3, 7, 0, 8, 7, 0, 5, 7, 0, 7, 7],
  );
  assert.equal(getScene('groove-pulse').variants[0], 'DX7 E.PIANO');
});

test('unknown scenes fail explicitly', () => {
  assert.throws(() => getScene('unknown'), /Unknown music scene/);
});
