import assert from 'node:assert/strict';
import test from 'node:test';

import { RhythmGridOverlay } from '../RhythmGridOverlay.js';

test('renders the active drum kit as a compact semantic label', () => {
  const elements = new Map([
    ['rhythm-cursor', { style: {} }],
    ['rhythm-pointer', { style: {} }],
    ['rhythm-cell-label', { textContent: '' }],
    ['drum-kit-label', { textContent: '' }],
  ]);
  const overlay = new RhythmGridOverlay({
    getElementById: (id) => elements.get(id) ?? null,
  });
  overlay.updateKit({ name: 'SYNTHWAVE' });
  assert.equal(elements.get('drum-kit-label').textContent, 'KIT / SYNTHWAVE');
});

test('renders continuous hand feedback separately from the quantized rhythm cell', () => {
  const pointer = { style: {} };
  const cursor = { style: {} };
  const overlay = new RhythmGridOverlay({
    getElementById: (id) => ({ 'rhythm-pointer': pointer, 'rhythm-cursor': cursor })[id] ?? null,
  });

  overlay.updatePointer({ x: 0.5, y: 0.25 });
  overlay.updatePosition({ x: 4, y: 2 });

  assert.equal(pointer.style.transform, 'translate3d(50%, 25%, 0)');
  assert.equal(pointer.style.opacity, '1');
  assert.equal(cursor.style.transform, 'translate3d(400%, 400%, 0)');
});
