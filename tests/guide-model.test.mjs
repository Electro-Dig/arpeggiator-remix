import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GUIDE_CARDS,
  GUIDE_NEUTRAL_LOCK_MS,
  advanceGuide,
  retreatGuide,
} from '../guide/guide-model.js';

test('guide has exactly the three approved cards', () => {
  assert.deepEqual(GUIDE_CARDS.map(({ id }) => id), ['stage', 'hands', 'recording']);
  assert.match(GUIDE_CARDS[0].body, /观众.*不要.*举手/);
  assert.match(GUIDE_CARDS[2].body, /双手大拇指/);
  assert.deepEqual(GUIDE_CARDS.map(({ notations }) => notations.length), [2, 2, 2]);
  assert.deepEqual(GUIDE_CARDS[1].notations, ['L / MELODY', 'R / RHYTHM']);
  assert.deepEqual(GUIDE_CARDS[2].notations, ['↑↑ / CONFIRM', '↓↓ / CANCEL']);
});

test('guide navigation clamps and marks the last advance as complete', () => {
  assert.deepEqual(retreatGuide(0), { index: 0, complete: false });
  assert.deepEqual(advanceGuide(1, 3), { index: 2, complete: false });
  assert.deepEqual(advanceGuide(2, 3), { index: 2, complete: true });
});

test('guide close lock is one second', () => {
  assert.equal(GUIDE_NEUTRAL_LOCK_MS, 1000);
});
