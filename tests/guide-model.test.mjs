import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  GUIDE_CARDS,
  GUIDE_NEUTRAL_LOCK_MS,
  advanceGuide,
  retreatGuide,
} from '../guide/guide-model.js';

const [dualHandSvg, thumbSvg] = await Promise.all([
  readFile(new URL('../assets/guide/dual-hand-control.svg', import.meta.url), 'utf8'),
  readFile(new URL('../assets/guide/record-thumbs.svg', import.meta.url), 'utf8'),
]);

const fingerCount = (svg, hand) => (
  svg.match(new RegExp(`data-hand="${hand}" data-finger="`, 'g')) || []
).length;

test('guide has exactly the three approved cards', () => {
  assert.deepEqual(GUIDE_CARDS.map(({ id }) => id), ['stage', 'hands', 'recording']);
  assert.match(GUIDE_CARDS[0].body, /观众.*不要.*举手/);
  assert.match(GUIDE_CARDS[2].body, /双手大拇指/);
  assert.match(GUIDE_CARDS[2].body, /向下.*取消.*自由演奏/);
  assert.doesNotMatch(GUIDE_CARDS[2].body, /重录/);
  assert.deepEqual(GUIDE_CARDS.map(({ notations }) => notations.length), [2, 2, 2]);
  assert.deepEqual(GUIDE_CARDS[1].notations, ['L / MELODY', 'R / RHYTHM']);
  assert.deepEqual(GUIDE_CARDS[2].notations, ['↑↑ / CONFIRM', '↓↓ / CANCEL']);
});

test('every guide card declares a cacheable local SVG', () => {
  assert.deepEqual(GUIDE_CARDS.map(({ illustration }) => illustration), [
    '/assets/guide/stage-frame.svg',
    '/assets/guide/dual-hand-control.svg',
    '/assets/guide/record-thumbs.svg',
  ]);
});

test('control and recording illustrations declare five anatomical fingers per hand', () => {
  assert.equal(fingerCount(dualHandSvg, 'left'), 5);
  assert.equal(fingerCount(dualHandSvg, 'right'), 5);
  assert.equal(fingerCount(thumbSvg, 'confirm'), 5);
  assert.equal(fingerCount(thumbSvg, 'cancel'), 5);
  assert.match(thumbSvg, /data-gesture="thumbs-up"/);
  assert.match(thumbSvg, /data-gesture="thumbs-down"/);
});

test('guide navigation clamps and marks the last advance as complete', () => {
  assert.deepEqual(retreatGuide(0), { index: 0, complete: false });
  assert.deepEqual(advanceGuide(1, 3), { index: 2, complete: false });
  assert.deepEqual(advanceGuide(2, 3), { index: 2, complete: true });
});

test('guide close lock is one second', () => {
  assert.equal(GUIDE_NEUTRAL_LOCK_MS, 1000);
});
