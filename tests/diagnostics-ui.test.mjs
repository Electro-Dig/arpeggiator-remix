import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [html, game] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../game.js', import.meta.url), 'utf8'),
]);

test('face-obscuring Three.js diagnostics are removed', () => {
  assert.doesNotMatch(game, /_updateDelayVisualization|delayVizGroup/);
  assert.doesNotMatch(game, /Dx:.*NoteLen/);
});

test('diagnostics are exposed only inside Control Deck', () => {
  assert.match(game, /_updateDelayDiagnostics/);
  for (const id of ['delay-distance-value', 'delay-level-value']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
    assert.match(game, new RegExp(id));
  }
  assert.doesNotMatch(html, /note-length-value/);
  assert.doesNotMatch(game, /note-length-value/);
});
