import test from 'node:test';
import assert from 'node:assert/strict';
import { PERFORMANCE_SCENES, clonePerformanceScenes, jianpuToIntervals } from '../PerformanceScenes.js';

test('jianpuToIntervals converts octave-aware numbered notation into semitone intervals', () => {
  assert.deepEqual(
    jianpuToIntervals(['7,', '1', '2', '3', '5', '6', "1'", "2'"]),
    [-1, 0, 2, 4, 7, 9, 12, 14]
  );
});

test('folk-song scenes lead the preset library with canonical names and melody metadata', () => {
  const names = PERFORMANCE_SCENES.slice(0, 4).map((scene) => scene.name);
  assert.deepEqual(names, [
    '茉莉花 / Jasmine Flower',
    '康定情歌 / Kangding Love Song',
    '小河淌水 / Flowing River',
    '青春舞曲 / Youth Dance'
  ]);

  PERFORMANCE_SCENES.slice(0, 4).forEach((scene) => {
    assert.ok(scene.canonicalVersion);
    assert.ok(Array.isArray(scene.sources) && scene.sources.length >= 1);
    assert.ok(Array.isArray(scene.sequence) && scene.sequence.length >= 12);
    assert.equal(scene.stepInterval, '8n');
  });
});

test('canonical folk-song interval hooks match the locked opening phrases', () => {
  const [molihua, kangding, xiaohe, qingchun] = PERFORMANCE_SCENES;

  assert.deepEqual(molihua.sequence.slice(0, 8), [4, 4, 7, 9, 12, 12, 9, 7]);
  assert.deepEqual(kangding.sequence.slice(0, 8), [4, 7, 9, 9, 7, 9, 4, 2]);
  assert.deepEqual(xiaohe.sequence.slice(0, 8), [9, 12, 14, 16, 16, 14, 12, 9]);
  assert.deepEqual(qingchun.sequence.slice(0, 8), [4, 2, -1, 0, 4, 2, 0, -1]);
});

test('scene cloning preserves drum pattern lengths for every layer', () => {
  clonePerformanceScenes().forEach((scene) => {
    Object.values(scene.drumPattern || {}).forEach((pattern) => {
      assert.equal(pattern.length, 16);
    });
  });
});
