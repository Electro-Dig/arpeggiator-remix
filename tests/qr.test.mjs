import assert from 'node:assert/strict';
import test from 'node:test';

import * as qrModule from '../share/qr.js';

const { POSTER_SIZE, QR_RECT, renderQr } = qrModule;

test('lazy-loads the selected poster and composites an offscreen QR into its safe zone', async () => {
  const drawCalls = [];
  const textCalls = [];
  const fillRects = [];
  const context = {
    drawImage: (...args) => drawCalls.push(args),
    fillText: (...args) => textCalls.push(args),
    fillRect: (...args) => fillRects.push(args),
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => context,
  };
  const template = { naturalWidth: 1254, naturalHeight: 1254 };
  const qrCanvas = { id: 'offscreen-qr' };
  let templateLoads = 0;
  let qrLoads = 0;
  let qrRender;

  const dependencies = {
    loadTemplate: async () => {
      templateLoads += 1;
      return template;
    },
    createCanvas: () => qrCanvas,
    loadQr: async () => {
      qrLoads += 1;
      return {
        toCanvas: async (...args) => { qrRender = args; },
      };
    },
  };

  assert.equal(templateLoads, 0);
  assert.equal(qrLoads, 0);
  await renderQr(canvas, 'https://app.example.test/r/token', {
    ...dependencies,
    takeLabel: 'TAKE 007',
    projectName: 'ARPEGGIATOR REMIX',
  });

  assert.equal(templateLoads, 1);
  assert.equal(qrLoads, 1);
  assert.deepEqual(POSTER_SIZE, { width: 1080, height: 1440 });
  assert.equal(canvas.width, POSTER_SIZE.width);
  assert.equal(canvas.height, POSTER_SIZE.height);
  assert.equal(qrRender[0], qrCanvas);
  assert.equal(qrRender[1], 'https://app.example.test/r/token');
  assert.equal(qrRender[2].width, QR_RECT.size);
  assert.deepEqual(drawCalls[0], [template, 0, 0, 1080, 1080]);
  assert.deepEqual(drawCalls[1], [
    qrCanvas,
    QR_RECT.x,
    QR_RECT.y,
    QR_RECT.size,
    QR_RECT.size,
  ]);
  assert.deepEqual(fillRects, [[0, 1080, 1080, 360]]);
  assert.deepEqual(textCalls, [
    ['ARPEGGIATOR REMIX', 72, 1200],
    ['TAKE 007', 72, 1280],
    ['SCAN TO LISTEN / DOWNLOAD · 24H', 72, 1360],
  ]);
});
