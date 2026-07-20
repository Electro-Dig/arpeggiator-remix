import assert from 'node:assert/strict';
import test from 'node:test';

import { MELODY_TIMBRES, resolveTimbreIndex } from '../music/timbres.js';

test('the global melody library exposes the approved eleven timbres in one order', () => {
  assert.deepEqual(MELODY_TIMBRES.map(({ name }) => name), [
    'DX7 E.PIANO',
    'DX7 BRASS',
    'DX7 MARIMBA',
    'NEON PLUCK',
    'NEON LEAD',
    'ARCADE PULSE',
    'ARCADE CRYSTAL',
    'AFTERGLOW PAD',
    'COASTAL PLUCK',
    'BLUE HOUR KEYS',
    'TAPE CHOIR',
  ]);
  assert.equal(new Set(MELODY_TIMBRES.map(({ id }) => id)).size, 11);
  assert.ok(MELODY_TIMBRES.every(({ options }) => options?.envelope));
});

test('timbre resolution accepts an id or wrapped numeric index', () => {
  assert.equal(resolveTimbreIndex('neon-pluck'), 3);
  assert.equal(resolveTimbreIndex(11), 0);
  assert.equal(resolveTimbreIndex(-1), 10);
  assert.equal(resolveTimbreIndex('missing'), 0);
});
