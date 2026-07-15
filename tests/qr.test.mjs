import assert from 'node:assert/strict';
import test from 'node:test';

import {
  POSTER_SIZE,
  QR_RECT,
  canvasToPosterBlob,
  renderQr,
} from '../share/qr.js';

function createHarness() {
  const drawCalls = [];
  const textCalls = [];
  const fillRects = [];
  const lineCalls = [];
  const context = {
    save() {},
    restore() {},
    translate() {},
    scale() {},
    beginPath() {},
    moveTo: (...args) => lineCalls.push(['moveTo', ...args]),
    lineTo: (...args) => lineCalls.push(['lineTo', ...args]),
    stroke() {},
    arc() {},
    fill() {},
    drawImage: (...args) => drawCalls.push(args),
    fillText: (...args) => textCalls.push(args),
    fillRect: (...args) => fillRects.push(args),
  };
  const canvas = { width: 0, height: 0, getContext: () => context };
  const qrCanvas = { id: 'offscreen-qr' };
  let qrRender;
  const dependencies = {
    createCanvas: () => qrCanvas,
    loadQr: async () => ({
      toCanvas: async (...args) => { qrRender = args; },
    }),
  };
  return {
    canvas,
    qrCanvas,
    dependencies,
    drawCalls,
    textCalls,
    fillRects,
    lineCalls,
    getQrRender: () => qrRender,
  };
}

test('renders a participant photo as a live single cover with a ticket QR', async () => {
  const harness = createHarness();
  const photo = { width: 900, height: 1125 };

  await renderQr(harness.canvas, 'https://app.example.test/r/token', {
    ...harness.dependencies,
    photo,
    checkinNumber: 27,
    durationMs: 36_000,
  });

  assert.deepEqual(POSTER_SIZE, { width: 1080, height: 1440 });
  assert.equal(harness.canvas.width, 1080);
  assert.equal(harness.canvas.height, 1440);
  assert.ok(harness.drawCalls.some((call) => call[0] === photo));
  assert.deepEqual(harness.drawCalls.at(-1), [
    harness.qrCanvas,
    QR_RECT.x,
    QR_RECT.y,
    QR_RECT.size,
    QR_RECT.size,
  ]);
  assert.equal(harness.getQrRender()[2].width, QR_RECT.size);
  assert.deepEqual(harness.textCalls.map(([text]) => text), [
    'WAIC 双手乐队 / LIVE TAKE',
    'PLAYER 027',
    '这是我的现场单曲',
    '你是本场第 027 位音乐玩家',
    'TAKE 027 · 36 SEC',
    '扫码试听与下载 · 24H',
  ]);
  assert.ok(harness.lineCalls.length > 4);
});

test('renders the same information hierarchy with an abstract no-photo cover', async () => {
  const harness = createHarness();
  await renderQr(harness.canvas, 'https://app.example.test/r/token', {
    ...harness.dependencies,
    photo: null,
    checkinNumber: 3,
    durationMs: 5_000,
  });

  assert.ok(harness.fillRects.some((call) => call[2] === 1080 && call[3] === 1040));
  assert.ok(harness.textCalls.some(([text]) => text === 'PLAYER 003'));
  assert.ok(harness.textCalls.some(([text]) => text === 'TAKE 003 · 05 SEC'));
});

test('reduces WebP quality when the first poster serialization exceeds two megabytes', async () => {
  const qualities = [];
  const canvas = {
    toBlob(callback, type, quality) {
      qualities.push({ type, quality });
      const size = qualities.length === 1 ? (2 * 1024 * 1024) + 1 : 1024;
      callback(new Blob([new Uint8Array(size)], { type }));
    },
  };

  const blob = await canvasToPosterBlob(canvas);
  assert.equal(blob.size, 1024);
  assert.deepEqual(qualities, [
    { type: 'image/webp', quality: 0.86 },
    { type: 'image/webp', quality: 0.78 },
  ]);
});
