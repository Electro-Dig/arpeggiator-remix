import assert from 'node:assert/strict';
import test from 'node:test';

import {
  POSTER_SIZE,
  QR_RECT,
  STAGE_RECT,
  fitSourceWithinRect,
  performanceTracePoints,
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
  const photo = { width: 1440, height: 900 };
  const metadata = {
    scene: 'AFTERGLOW COAST',
    synth: 'DX7 E.PIANO',
    rhythm: 'GLITCH / LEAN',
    bpm: 118,
    root: 'F#3',
    fx: 'LP 82% · DLY 24% · GLT 8%',
  };

  await renderQr(harness.canvas, 'https://app.example.test/r/token', {
    ...harness.dependencies,
    photo,
    checkinNumber: 27,
    durationMs: 36_000,
    metadata,
  });

  assert.deepEqual(POSTER_SIZE, { width: 1200, height: 1080 });
  assert.equal(harness.canvas.width, 1200);
  assert.equal(harness.canvas.height, 1080);
  assert.deepEqual(harness.drawCalls.find((call) => call[0] === photo), [
    photo, 0, 0, 1440, 900,
    40, 118, 1120, 700,
  ]);
  assert.deepEqual(harness.drawCalls.at(-1), [
    harness.qrCanvas,
    QR_RECT.x,
    QR_RECT.y,
    QR_RECT.size,
    QR_RECT.size,
  ]);
  assert.equal(harness.getQrRender()[2].width, QR_RECT.size);
  const labels = harness.textCalls.map(([text]) => text);
  for (const expected of [
    'WAIC 双手乐队 / LIVE PERFORMANCE TICKET',
    'PLAYER 027 / TAKE 027 / 36 SEC',
    'SCENE / AFTERGLOW COAST',
    'SYNTH / DX7 E.PIANO',
    'RHYTHM / GLITCH / LEAN',
    'BPM / 118',
    'ROOT / F#3',
    'FX / LP 82% · DLY 24% · GLT 8%',
    'PERFORMANCE TRACE / PARAMETRIC',
  ].filter((expected) => !['SCENE /', 'SYNTH /', 'RHYTHM /', 'BPM /', 'ROOT /', 'FX /']
    .some((prefix) => expected.startsWith(prefix)))) assert.ok(labels.includes(expected), expected);
  for (const prefix of ['SCENE /', 'SYNTH /', 'RHYTHM /', 'BPM /', 'ROOT /', 'FX /'])
    assert.ok(!labels.some((label) => label.startsWith(prefix)), prefix);
  assert.ok(harness.lineCalls.length > 4);
  assert.deepEqual(STAGE_RECT, { x: 40, y: 118, width: 1120, height: 700 });
  assert.deepEqual(QR_RECT, { x: 936, y: 842, size: 216 });
});

test('renders the visible QR into a dedicated preview canvas while keeping the poster separate', async () => {
  const harness = createHarness();
  const qrPreview = { id: 'visible-share-qr' };

  await renderQr(harness.canvas, 'https://app.example.test/r/token', {
    ...harness.dependencies,
    qrPreview,
  });

  assert.equal(harness.getQrRender()[0], qrPreview);
  assert.deepEqual(harness.drawCalls.at(-1), [
    qrPreview,
    QR_RECT.x,
    QR_RECT.y,
    QR_RECT.size,
    QR_RECT.size,
  ]);
});

test('fits complete browser frames inside the poster without cropping', () => {
  assert.deepEqual(fitSourceWithinRect({ width: 1440, height: 900 }, STAGE_RECT), {
    x: 40, y: 118, width: 1120, height: 700,
  });
  assert.deepEqual(fitSourceWithinRect({ width: 1920, height: 1080 }, STAGE_RECT), {
    x: 40, y: 153, width: 1120, height: 630,
  });
  assert.deepEqual(fitSourceWithinRect({ width: 1200, height: 900 }, STAGE_RECT), {
    x: 134, y: 118, width: 933, height: 700,
  });
});

test('renders the same information hierarchy with an abstract no-photo cover', async () => {
  const harness = createHarness();
  await renderQr(harness.canvas, 'https://app.example.test/r/token', {
    ...harness.dependencies,
    photo: null,
    checkinNumber: 3,
    durationMs: 5_000,
  });

  assert.ok(harness.fillRects.some((call) => (
    call[0] === STAGE_RECT.x && call[1] === STAGE_RECT.y
      && call[2] === STAGE_RECT.width && call[3] === STAGE_RECT.height
  )));
  assert.ok(harness.textCalls.some(([text]) => text === 'PLAYER 003 / TAKE 003 / 05 SEC'));
});

test('performance trace is deterministic for one take and varies between takes', () => {
  const first = performanceTracePoints('player-027-afterglow');
  assert.deepEqual(performanceTracePoints('player-027-afterglow'), first);
  assert.notDeepEqual(performanceTracePoints('player-028-afterglow'), first);
  assert.equal(first.length, 9);
  assert.ok(first.every(([x, y]) => x >= 0 && x <= 1 && y >= 0 && y <= 1));
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
