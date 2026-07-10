import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../MusicManager.js', import.meta.url), 'utf8');

test('synthwave manager imports scene and scale contracts and exposes semantic setters', () => {
  assert.match(source, /DEFAULT_SCENE_ID, SCENES, getScene/);
  assert.match(source, /buildScale, noteAtPosition/);
  assert.match(source, /audioBus/);
  for (const method of ['setScene', 'setToneVariant', 'setBrightness', 'setRootFromPosition', 'cycleScene', 'setClassicPreset']) {
    assert.match(source, new RegExp(`${method}\\(`));
  }
});

test('audio nodes are constructed once in start and never routed around the recorder bus', () => {
  assert.equal((source.match(/new Tone\.Filter\(/g) || []).length, 1);
  assert.equal((source.match(/new Tone\.MonoSynth\(/g) || []).length, 1);
  assert.equal((source.match(/new Tone\.PolySynth\(/g) || []).length, 1);
  assert.doesNotMatch(source, /\.toDestination\(/);
  assert.doesNotMatch(source, /setToneVariant[\s\S]{0,700}\.dispose\(/);
  assert.match(source, /sceneReverb\.connect\(audioBus\.input\)/);
  assert.match(source, /this\.startPromise/);
  assert.match(source, /if \(!this\.startPromise\)/);
});

test('legacy Classic material remains available without editor-era note length state', () => {
  assert.match(source, /export const CLASSIC_PRESETS/);
  assert.doesNotMatch(source, /noteLengthLevels|setNoteLengthLevel/);
  assert.doesNotMatch(source, /cycleSynth\(|cycleMusicPreset\(/);
});

test('quantized root status emits only when the note changes', () => {
  assert.match(source, /const rootChanged = note !== this\.currentRoot/);
  assert.match(source, /if \(rootChanged\) this\.emitStatus\(\)/);
});
