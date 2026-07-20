import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [source, game] = await Promise.all([
  readFile(new URL('../MusicManager.js', import.meta.url), 'utf8'),
  readFile(new URL('../game.js', import.meta.url), 'utf8'),
]);

test('synthwave manager imports scene and scale contracts and exposes semantic setters', () => {
  assert.match(source, /DEFAULT_SCENE_ID, SCENES, getScene/);
  assert.match(source, /buildScale, noteAtPosition/);
  assert.match(source, /audioBus/);
  for (const method of ['setScene', 'setTimbre', 'cycleTimbre', 'setBrightness', 'setRootFromPosition', 'cycleScene', 'setBroadcastBuild', 'triggerBroadcastImpact']) {
    assert.match(source, new RegExp(`${method}\\(`));
  }
  assert.doesNotMatch(source, /setClassicPreset\(/);
});

test('audio nodes are constructed once in start and never routed around the recorder bus', () => {
  assert.equal((source.match(/new Tone\.Filter\(/g) || []).length, 1);
  assert.equal((source.match(/new Tone\.MonoSynth\(/g) || []).length, 1);
  assert.equal((source.match(/new Tone\.PolySynth\(/g) || []).length, 1);
  assert.doesNotMatch(source, /\.toDestination\(/);
  assert.doesNotMatch(source, /setTimbre[\s\S]{0,700}\.dispose\(/);
  assert.match(source, /sceneReverb\.connect\(audioBus\.input\)/);
  assert.match(source, /this\.startPromise/);
  assert.match(source, /if \(!this\.startPromise\)/);
});

test('obsolete Classic selector state and editor-era note length state are absent', () => {
  assert.doesNotMatch(source, /CLASSIC_PRESETS|classicPresetIndex/);
  assert.doesNotMatch(source, /noteLengthLevels|setNoteLengthLevel/);
  assert.doesNotMatch(source, /cycleSynth\(|cycleMusicPreset\(/);
  assert.doesNotMatch(source, /setToneVariant\(|variantIndex|scene\.variants/);
});

test('scene switching preserves global timbre and the fist cycles the same library', () => {
  const setSceneStart = source.indexOf('setScene(id)');
  const setSceneEnd = source.indexOf('cycleScene()', setSceneStart);
  assert.ok(setSceneStart >= 0 && setSceneEnd > setSceneStart);
  const setScene = source.slice(setSceneStart, setSceneEnd);
  assert.doesNotMatch(setScene, /currentTimbreIndex|setTimbre|cycleTimbre/);
  assert.match(game, /musicManager\.cycleTimbre\(\)/);
  assert.doesNotMatch(game, /musicManager\.setToneVariant\(\)/);
});

test('quantized root status emits only when the note changes', () => {
  assert.match(source, /const rootChanged = note !== this\.currentRoot/);
  assert.match(source, /if \(rootChanged\) this\.emitStatus\(\)/);
});
