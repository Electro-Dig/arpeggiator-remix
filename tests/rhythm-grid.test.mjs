import assert from 'node:assert/strict';
import test from 'node:test';

import { RHYTHM_GRID, getRhythmCell } from '../rhythm/rhythm-grid.js';

const byId = (x, y) => RHYTHM_GRID.find((cell) => cell.x === x && cell.y === y);

test('contains exactly one immutable 16-step pattern for every 7x7 cell', () => {
  assert.equal(RHYTHM_GRID.length, 49);
  assert.equal(new Set(RHYTHM_GRID.map(({ x, y }) => `${x}:${y}`)).size, 49);
  for (const cell of RHYTHM_GRID) {
    assert.ok(Object.isFrozen(cell));
    assert.ok(Object.isFrozen(cell.pattern));
    assert.deepEqual(Object.keys(cell.pattern).sort(), ['clap', 'hihat', 'kick', 'openhat', 'snare']);
    for (const steps of Object.values(cell.pattern)) {
      assert.ok(Object.isFrozen(steps));
      assert.equal(steps.length, 16);
      assert.ok(steps.every((step) => step === 0 || step === 1));
    }
  }
  assert.equal(getRhythmCell(6, 6).x, 6);
});

test('density rises vertically and syncopation rises horizontally', () => {
  const hits = (cell) => Object.values(cell.pattern).flat().reduce((sum, hit) => sum + hit, 0);
  assert.ok(hits(getRhythmCell(3, 6)) > hits(getRhythmCell(3, 0)));
  assert.notDeepEqual(getRhythmCell(0, 3).pattern.kick, getRhythmCell(6, 3).pattern.kick);
});

test('uses the approved electronic rhythm anchors and stable center', () => {
  assert.equal(byId(0, 0).archetype, 'MINIMAL HOUSE');
  assert.equal(byId(0, 6).archetype, 'TECHNO DRIVE');
  assert.equal(byId(6, 0).archetype, 'ELECTRO BREAK');
  assert.equal(byId(6, 6).archetype, 'GLITCH RUSH');
  assert.equal(byId(3, 3).archetype, 'HYBRID GROOVE');
});

test('keeps every complete 7x7 pattern unique', () => {
  const signatures = RHYTHM_GRID.map(({ pattern }) => JSON.stringify(pattern));
  assert.equal(new Set(signatures).size, 49);
});

test('limits every step to three simultaneous drum tracks', () => {
  for (const cell of RHYTHM_GRID) {
    for (let step = 0; step < 16; step += 1) {
      const simultaneous = Object.values(cell.pattern).reduce((sum, track) => sum + track[step], 0);
      assert.ok(simultaneous <= 3, `${cell.x}:${cell.y} step ${step} had ${simultaneous} tracks`);
    }
  }
});

test('invalid coordinates fail explicitly', () => {
  assert.throws(() => getRhythmCell(-1, 0), /Unknown rhythm cell/);
  assert.throws(() => getRhythmCell(7, 6), /Unknown rhythm cell/);
});
