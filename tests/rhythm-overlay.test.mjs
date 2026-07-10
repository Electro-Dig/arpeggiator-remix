import assert from 'node:assert/strict';
import test from 'node:test';

import { RhythmGridOverlay } from '../RhythmGridOverlay.js';

test('updates the cursor with a transform only and keeps pending and confirmed labels distinct', () => {
  const cursor = { style: {} };
  const label = { textContent: '' };
  const root = {
    getElementById(id) {
      return id === 'rhythm-cursor' ? cursor : label;
    },
  };
  const overlay = new RhythmGridOverlay(root);
  overlay.updatePosition({ x: 6, y: 0 });
  assert.equal(cursor.style.transform, 'translate3d(600%, 600%, 0)');
  assert.equal(label.textContent, '');
  overlay.confirm({ label: 'FRACTURE / AIR' });
  assert.equal(label.textContent, 'FRACTURE / AIR');
});
