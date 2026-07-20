import assert from 'node:assert/strict';
import test from 'node:test';

import {
  capturePerformanceSnapshot,
  createPerformanceMetadataSnapshot,
} from '../recording/performance-snapshot.js';

test('rasterizes the full performance root with capture-safe options', async () => {
  const root = { clientWidth: 1440, clientHeight: 900 };
  const canvas = { width: 1440, height: 900 };
  const calls = [];
  const rasterize = async (...args) => {
    calls.push(args);
    return canvas;
  };

  const result = await capturePerformanceSnapshot({ root, rasterize });

  assert.equal(result, canvas);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], root);

  const { ignoreElements, onclone, ...options } = calls[0][1];
  assert.deepEqual(options, {
    backgroundColor: null,
    useCORS: true,
    logging: false,
    scale: 1,
    width: 1440,
    height: 900,
    scrollX: 0,
    scrollY: 0,
  });
  assert.equal(ignoreElements({ id: 'recording-dialog' }), true);
  assert.equal(ignoreElements({ id: 'guide-dialog' }), true);
  assert.equal(ignoreElements({
    id: 'performance-stage',
    hasAttribute: (name) => name === 'data-photo-capture-ignore',
  }), true);
  assert.equal(ignoreElements({
    id: 'performance-stage',
    hasAttribute: () => false,
  }), false);

  const camera = { style: { transform: 'scaleX(-1)', visibility: 'visible' } };
  const clonedRoot = { style: { background: '#080a0c' } };
  const clone = {
    querySelectorAll(selector) {
      assert.equal(selector, 'video[data-camera-feed], #inputVideo');
      return [camera];
    },
    querySelector(selector) {
      assert.equal(selector, '#renderDiv');
      return clonedRoot;
    },
  };
  onclone(clone);
  assert.equal(camera.style.visibility, 'hidden');
  assert.equal(camera.style.transform, 'scaleX(-1)');
  assert.equal(clonedRoot.style.background, 'transparent');
});

test('warns and returns null when performance rasterization fails', async (t) => {
  const error = new Error('rasterizer failed');
  const warnings = [];
  t.mock.method(console, 'warn', (...args) => warnings.push(args));

  const result = await capturePerformanceSnapshot({
    root: { clientWidth: 1280, clientHeight: 720 },
    rasterize: async () => {
      throw error;
    },
  });

  assert.equal(result, null);
  assert.equal(warnings.length, 1);
  assert.match(String(warnings[0][0]), /performance snapshot/i);
  assert.equal(warnings[0][1], error);
});

test('freezes the live music and rhythm status into poster metadata', () => {
  const snapshot = createPerformanceMetadataSnapshot({
    musicStatus: {
      sceneName: 'Afterglow Coast',
      synthName: 'DX7 E.PIANO',
      tempo: 118,
      rootNote: 'F#3',
      effectsLabel: 'LP 82% · DLY 24% · GLT 8%',
    },
    rhythmStatus: { label: 'GLITCH / LEAN' },
  });

  assert.deepEqual(snapshot, {
    scene: 'AFTERGLOW COAST',
    synth: 'DX7 E.PIANO',
    rhythm: 'GLITCH / LEAN',
    bpm: 118,
    root: 'F#3',
    fx: 'LP 82% · DLY 24% · GLT 8%',
  });
  assert.equal(Object.isFrozen(snapshot), true);

  assert.deepEqual(createPerformanceMetadataSnapshot(), {
    scene: 'LIVE SCENE', synth: 'MELODY', rhythm: 'FREE',
    bpm: 120, root: '--', fx: 'LP 100% · DLY 0% · GLT 0% · RVB 0%',
  });
});
