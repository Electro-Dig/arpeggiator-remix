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

test('continuous effect status replaces obsolete calibrated-delay diagnostics', () => {
  for (const id of ['current-mix-effects', 'gesture-fx-panel']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  for (const id of ['delay-distance-value', 'delay-level-value', 'note-length-value']) {
    assert.doesNotMatch(html, new RegExp(`id=["']${id}["']`));
  }
  assert.doesNotMatch(game, /delayCtrl|_initDelayControlUI|_sampleDelayDistanceIfDue|_updateDelayDiagnostics|_updateDelayLevelIfDue/);
  const animateStart = game.indexOf('key: "_animate"');
  const animateEnd = game.indexOf('key: "_updateBeatIndicator"', animateStart);
  assert.ok(animateStart >= 0 && animateEnd > animateStart);
  assert.doesNotMatch(game.slice(animateStart, animateEnd), /_sampleDelayDistanceIfDue|_updateDelayLevelIfDue/);
});
