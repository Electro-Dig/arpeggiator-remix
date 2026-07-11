import assert from 'node:assert/strict';
import test from 'node:test';

import { RHYTHM_GRID, getRhythmCell } from '../rhythm/rhythm-grid.js';

const byId = (x, y) => RHYTHM_GRID.find((cell) => cell.x === x && cell.y === y);
const flattened = (pattern, tracks = Object.keys(pattern)) => tracks.flatMap((track) => pattern[track]);
const hits = (pattern) => flattened(pattern).reduce((sum, hit) => sum + hit, 0);
const distance = (left, right, tracks) => {
  const a = flattened(left, tracks);
  const b = flattened(right, tracks);
  return a.reduce((sum, value, index) => sum + Number(value !== b[index]), 0);
};

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
  assert.ok(hits(getRhythmCell(3, 6).pattern) > hits(getRhythmCell(3, 0).pattern));
  assert.notDeepEqual(getRhythmCell(0, 3).pattern.kick, getRhythmCell(6, 3).pattern.kick);
});

test('each energy row has a clearly higher average density than the previous row', () => {
  const averages = Array.from({ length: 7 }, (_, y) => (
    Array.from({ length: 7 }, (_, x) => hits(getRhythmCell(x, y).pattern))
      .reduce((sum, value) => sum + value, 0) / 7
  ));
  for (let y = 1; y < averages.length; y += 1) {
    assert.ok(
      averages[y] - averages[y - 1] >= 3,
      `row ${y - 1} (${averages[y - 1]}) -> ${y} (${averages[y]}) lacked an audible density step`,
    );
  }
});

test('every neighboring cell differs by at least five drum events', () => {
  for (let y = 0; y < 7; y += 1) {
    for (let x = 0; x < 7; x += 1) {
      if (x < 6) assert.ok(distance(byId(x, y).pattern, byId(x + 1, y).pattern) >= 5, `horizontal ${x}:${y}`);
      if (y < 6) assert.ok(distance(byId(x, y).pattern, byId(x, y + 1).pattern) >= 5, `vertical ${x}:${y}`);
    }
  }
});

test('upper rows change the drum skeleton instead of only saturating hats', () => {
  const skeleton = ['kick', 'snare', 'clap'];
  for (let y = 4; y < 7; y += 1) {
    for (let x = 0; x < 6; x += 1) {
      assert.ok(
        distance(byId(x, y).pattern, byId(x + 1, y).pattern, skeleton) >= 2,
        `upper skeleton ${x}:${y}`,
      );
    }
  }
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
