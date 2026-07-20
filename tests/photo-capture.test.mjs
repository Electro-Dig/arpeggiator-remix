import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateCoverCrop,
  capturePhotoFrame,
} from '../recording/photo-capture.js';

test('calculates a centered 16:9 crop from a wider camera frame', () => {
  assert.deepEqual(calculateCoverCrop(1920, 1080, 1200, 675), {
    sx: 0,
    sy: 0,
    sw: 1920,
    sh: 1080,
  });
});

test('captures one normally oriented landscape camera frame without retaining the stream', () => {
  const calls = [];
  const context = {
    save: () => calls.push(['save']),
    translate: (...args) => calls.push(['translate', ...args]),
    scale: (...args) => calls.push(['scale', ...args]),
    drawImage: (...args) => calls.push(['drawImage', ...args]),
    restore: () => calls.push(['restore']),
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => context,
  };
  const video = { videoWidth: 1280, videoHeight: 720, readyState: 4 };

  assert.equal(capturePhotoFrame(video, canvas), canvas);
  assert.equal(canvas.width, 1280);
  assert.equal(canvas.height, 720);
  assert.deepEqual(calls, [
    ['save'],
    ['drawImage', video, 0, 0, 1280, 720, 0, 0, 1280, 720],
    ['restore'],
  ]);
});

test('uses the complete browser snapshot dimensions beneath transparent overlays', () => {
  const calls = [];
  const context = {
    save: () => calls.push(['save']),
    translate: (...args) => calls.push(['translate', ...args]),
    scale: (...args) => calls.push(['scale', ...args]),
    drawImage: (...args) => calls.push(['drawImage', ...args]),
    restore: () => calls.push(['restore']),
  };
  Object.defineProperties(context, {
    globalAlpha: {
      set: (value) => calls.push(['globalAlpha', value]),
    },
    globalCompositeOperation: {
      set: (value) => calls.push(['globalCompositeOperation', value]),
    },
  });
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => context,
  };
  const camera = { videoWidth: 640, videoHeight: 480 };
  const pageSnapshot = { width: 1440, height: 900 };
  const musicVisual = { width: 1440, height: 900 };

  capturePhotoFrame(camera, canvas, {
    captureSource: pageSnapshot,
    overlays: [{ source: musicVisual, opacity: 0.7, blendMode: 'screen', mirror: true }],
  });

  const draws = calls.filter(([name]) => name === 'drawImage');
  assert.equal(canvas.width, 1440);
  assert.equal(canvas.height, 900);
  assert.equal(draws.length, 3);
  assert.equal(draws[0][1], camera);
  assert.deepEqual(draws[0].slice(2), [
    0, 40, 640, 400, 0, 0, 1440, 900,
  ]);
  assert.equal(draws[1][1], pageSnapshot);
  assert.deepEqual(draws[1].slice(2), [
    0, 0, 1440, 900, 0, 0, 1440, 900,
  ]);
  assert.equal(draws[2][1], musicVisual);
  assert.ok(calls.some((call) => call[0] === 'globalAlpha' && call[1] === 0.7));
  assert.ok(calls.some((call) => (
    call[0] === 'globalCompositeOperation' && call[1] === 'screen'
  )));
  assert.deepEqual(calls.filter(([name]) => name === 'translate' || name === 'scale'), [
    ['translate', 1440, 0],
    ['scale', -1, 1],
  ]);
});

test('rejects a camera frame before metadata is ready', () => {
  const canvas = { getContext: () => ({}) };
  assert.throws(
    () => capturePhotoFrame({ videoWidth: 0, videoHeight: 0 }, canvas),
    /摄像头画面尚未就绪/,
  );
});
