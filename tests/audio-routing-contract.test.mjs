import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const managerSources = await Promise.all(
  ['MusicManager.js', 'DrumManager.js'].map((name) =>
    readFile(new URL(`../${name}`, import.meta.url), 'utf8')),
);

test('music and drums use the shared AudioBus', () => {
  for (const source of managerSources) {
    assert.match(source, /audioBus/);
    assert.match(source, /audio\/tone\.js/);
    assert.doesNotMatch(source, /\.toDestination\(\)/);
    assert.doesNotMatch(source, /https:\/\/esm\.sh\/tone/);
  }
});

test('all runtime Tone imports use the single pinned entry', async () => {
  const gameSource = await readFile(new URL('../game.js', import.meta.url), 'utf8');
  assert.match(gameSource, /audio\/tone\.js/);
  assert.doesNotMatch(gameSource, /https:\/\/esm\.sh\/tone/);
});
