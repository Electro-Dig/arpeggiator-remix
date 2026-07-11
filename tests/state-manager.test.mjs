import assert from 'node:assert/strict';
import test from 'node:test';

import { StateManager } from '../StateManager.js';

test('starts with semantic exhibition status fields', () => {
  const manager = new StateManager();
  assert.deepEqual(manager.getState(), {
    sceneName: 'Neon Drive',
    synthName: 'NEON PLUCK',
    rhythmName: 'STEADY / FULL',
    drumKitName: 'ACOUSTIC',
    tempo: 120,
    rootNote: 'E3',
    isPlaying: false,
    handPosition: { left: null, right: null },
  });
});

test('stores the active drum kit as semantic state', () => {
  const manager = new StateManager();
  assert.equal(manager.getState().drumKitName, 'ACOUSTIC');
  manager.setState({ drumKitName: 'SYNTHWAVE' });
  assert.equal(manager.getState().drumKitName, 'SYNTHWAVE');
});

test('binds scene, rhythm, tempo and root changes to the HUD', () => {
  const elements = new Map();
  const previousDocument = globalThis.document;
  globalThis.document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, { textContent: '' });
      return elements.get(id);
    },
  };
  try {
    const manager = new StateManager();
    manager.initDisplayBindings();
    manager.setState({ sceneName: 'Arcade Horizon', rhythmName: 'SHIFT / HOT', tempo: 126, rootNote: 'A4' });
    assert.equal(elements.get('current-music-preset').textContent, 'Arcade Horizon');
    assert.equal(elements.get('current-drum-preset').textContent, 'SHIFT / HOT');
    assert.equal(elements.get('current-tempo').textContent, '126');
    assert.equal(elements.get('current-root-note').textContent, 'A4');
  } finally {
    globalThis.document = previousDocument;
  }
});
