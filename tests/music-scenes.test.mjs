import assert from 'node:assert/strict';
import test from 'node:test';

import { DEFAULT_SCENE_ID, SCENES, getScene } from '../music/scenes.js';

test('ships the approved scenes and defaults to Neon Drive', () => {
  assert.equal(DEFAULT_SCENE_ID, 'neon-drive');
  assert.deepEqual(SCENES.map(({ id }) => id), ['classic', 'neon-drive', 'midnight-pulse', 'arcade-horizon']);
  assert.deepEqual(SCENES.slice(1).map(({ bpm }) => bpm), [120, 108, 126]);
  assert.deepEqual(SCENES.slice(1).map(({ tonic, mode }) => `${tonic} ${mode}`), [
    'E natural-minor', 'E harmonic-minor', 'A dorian',
  ]);
  assert.ok(SCENES.every(Object.isFrozen));
});

test('unknown scenes fail explicitly', () => {
  assert.throws(() => getScene('unknown'), /Unknown music scene/);
});
