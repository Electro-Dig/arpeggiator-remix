import assert from 'node:assert/strict';
import test from 'node:test';

import { RhythmGridOverlay } from '../RhythmGridOverlay.js';

test('renders the active drum kit as a compact semantic label', () => {
  const elements = new Map([
    ['rhythm-cursor', { style: {} }],
    ['rhythm-cell-label', { textContent: '' }],
    ['drum-kit-label', { textContent: '' }],
  ]);
  const overlay = new RhythmGridOverlay({
    getElementById: (id) => elements.get(id) ?? null,
  });
  overlay.updateKit({ name: 'SYNTHWAVE' });
  assert.equal(elements.get('drum-kit-label').textContent, 'KIT / SYNTHWAVE');
});
