import assert from 'node:assert/strict';
import test from 'node:test';

import { QR_RECT, renderQr } from '../share/qr.js';

test('lazy-loads the selected poster and composites an offscreen QR into its safe zone', async () => {
  const drawCalls = [];
  const textCalls = [];
  const context = {
    drawImage: (...args) => drawCalls.push(args),
    fillText: (...args) => textCalls.push(args),
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
  await renderQr(canvas, 'https://app.example.test/r/token', dependencies);

  assert.equal(templateLoads, 1);
  assert.equal(qrLoads, 1);
  assert.equal(canvas.width, 1254);
  assert.equal(canvas.height, 1254);
  assert.equal(qrRender[0], qrCanvas);
  assert.equal(qrRender[1], 'https://app.example.test/r/token');
  assert.equal(qrRender[2].width, QR_RECT.size);
  assert.deepEqual(drawCalls[0], [template, 0, 0, 1254, 1254]);
  assert.deepEqual(drawCalls[1], [
    qrCanvas,
    QR_RECT.x,
    QR_RECT.y,
    QR_RECT.size,
    QR_RECT.size,
  ]);
  assert.deepEqual(textCalls, [
    ['SCAN TO LISTEN / DOWNLOAD', 72, 1172],
    ['ARPEGGIATOR REMIX · 24H', 72, 1222],
  ]);
});
