import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const gameSource = await readFile(new URL('../game.js', import.meta.url), 'utf8');
const drumSource = await readFile(new URL('../DrumManager.js', import.meta.url), 'utf8');

test('right hand selects rhythm cells without legacy preset or note-length gestures', () => {
  assert.match(gameSource, /import \{ RhythmSpace \} from ['"]\.\/rhythm\/RhythmSpace\.js['"]/);
  assert.match(gameSource, /queueRhythmCell\(cell\.x, cell\.y\)/);
  assert.match(gameSource, /new CustomEvent\(['"]rhythmposition['"]/);
  assert.doesNotMatch(gameSource, /_updateGlobalNoteLengthByRightHandY/);
  assert.doesNotMatch(gameSource, /drumManager\.cycleDrumPreset\(/);
  assert.doesNotMatch(gameSource, /noteLenCtrl/);
});

test('drum manager applies queued grid patterns while preserving five finger gates', () => {
  assert.match(drumSource, /import \{ PatternScheduler \} from ['"]\.\/rhythm\/PatternScheduler\.js['"]/);
  assert.match(drumSource, /export function queueRhythmCell/);
  assert.match(drumSource, /export function updateActiveDrums/);
  for (const pair of [
    "'thumb': 'openhat'",
    "'index': 'kick'",
    "'middle': 'snare'",
    "'ring': 'hihat'",
    "'pinky': 'clap'",
  ]) assert.match(drumSource, new RegExp(pair));
});
