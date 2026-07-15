import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CAPTURE_SIZE,
  calculateCoverCrop,
  capturePhotoFrame,
} from '../recording/photo-capture.js';

test('calculates a centered 4:5 crop from a wide camera frame', () => {
  assert.deepEqual(calculateCoverCrop(1280, 720, 900, 1125), {
    sx: 352,
    sy: 0,
    sw: 576,
    sh: 720,
  });
});

test('captures one mirrored camera frame without retaining the stream', () => {
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
  assert.deepEqual(CAPTURE_SIZE, { width: 900, height: 1125 });
  assert.equal(canvas.width, 900);
  assert.equal(canvas.height, 1125);
  assert.deepEqual(calls, [
    ['save'],
    ['translate', 900, 0],
    ['scale', -1, 1],
    ['drawImage', video, 352, 0, 576, 720, 0, 0, 900, 1125],
    ['restore'],
  ]);
});

test('rejects a camera frame before metadata is ready', () => {
  const canvas = { getContext: () => ({}) };
  assert.throws(
    () => capturePhotoFrame({ videoWidth: 0, videoHeight: 0 }, canvas),
    /摄像头画面尚未就绪/,
  );
});
