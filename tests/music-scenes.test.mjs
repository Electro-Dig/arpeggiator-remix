import assert from 'node:assert/strict';
import test from 'node:test';

import { DEFAULT_SCENE_ID, SCENES, getScene } from '../music/scenes.js';

test('ships exactly six approved scenes and defaults to Groove Pulse', () => {
  assert.equal(DEFAULT_SCENE_ID, 'groove-pulse');
  assert.deepEqual(SCENES.map(({ id }) => id), [
    'minimal-groove', 'groove-pulse', 'neon-drive', 'arcade-horizon',
    'afterglow-coast', 'blue-hour-drift',
  ]);
  assert.deepEqual(SCENES.map(({ bpm }) => bpm), [122, 115, 120, 126, 96, 90]);
  assert.deepEqual(SCENES.map(({ tonic, mode }) => `${tonic} ${mode}`), [
    'E chromatic', 'E chromatic', 'E natural-minor', 'A dorian',
    'D major-pentatonic', 'A natural-minor',
  ]);
  assert.ok(!SCENES.some(({ id }) => id === 'midnight-pulse'));
  assert.ok(SCENES.every(Object.isFrozen));
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
