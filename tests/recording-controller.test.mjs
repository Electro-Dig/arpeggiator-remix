import assert from 'node:assert/strict';
import test from 'node:test';

import { RecordingController } from '../RecordingController.js';

class FakeElement extends EventTarget {
  constructor() {
    super();
    this.open = false;
    this.hidden = false;
    this.disabled = false;
    this.textContent = '';
    this.dataset = {};
    this.style = { setProperty() {} };
  }

  showModal() { this.open = true; }
  close() { this.open = false; }
  removeAttribute(name) { delete this[name]; }
}

class FakeRecorder extends EventTarget {
  constructor(id, options = {}, empty = false) {
    super();
    this.id = id;
    this.mimeType = options.mimeType || 'audio/webm;codecs=opus';
    this.state = 'inactive';
    this.startCalls = [];
    this.stopCalls = 0;
    this.empty = empty;
  }

  start(timeslice) {
    this.state = 'recording';
    this.startCalls.push(timeslice);
  }

  stop() {
    if (this.state !== 'recording') return;
    this.stopCalls += 1;
    this.state = 'inactive';
    const dataEvent = new Event('dataavailable');
    Object.defineProperty(dataEvent, 'data', {
      value: new Blob(this.empty ? [] : [`take-${this.id}`], { type: this.mimeType }),
    });
    this.dispatchEvent(dataEvent);
    this.dispatchEvent(new Event('stop'));
  }
}

function createHarness({
  onUploadRequest = async () => ({}),
  renderQr = async () => {},
  copyText = async () => {},
  empty = false,
  withView = false,
} = {}) {
  let now = 0;
  let timerId = 0;
  let recorderId = 0;
  let urlId = 0;
  const timers = new Map();
  const recorders = [];
  const createdUrls = [];
  const revokedUrls = [];
  const downloads = [];
  const qrRenders = [];
  const copiedTexts = [];
  const viewIds = [
    'recording-dialog', 'recording-status', 'recording-state-label',
    'recording-timer', 'recording-message', 'recording-preview',
    'recording-share', 'recording-qr', 'recording-share-link',
    'recording-share-expiry', 'recording-copy-link',
    'recording-checkin',
    'recording-take-label', 'recording-duration', 'recording-format',
    'recording-confirm', 'recording-rerecord', 'recording-download', 'recording-cancel',
    'recording-cancel-label',
  ];
  const elements = withView
    ? Object.fromEntries(viewIds.map((id) => [id, new FakeElement()]))
    : {};
  const root = withView ? {
    getElementById(id) { return elements[id] || null; },
  } : null;

  const setTimer = (callback, delay) => {
    const id = ++timerId;
    timers.set(id, { at: now + delay, callback });
    return id;
  };
  const clearTimer = (id) => timers.delete(id);
  const advance = (milliseconds) => {
    const target = now + milliseconds;
    while (true) {
      const next = [...timers.entries()]
        .filter(([, timer]) => timer.at <= target)
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      const [id, timer] = next;
      timers.delete(id);
      now = timer.at;
      timer.callback();
    }
    now = target;
  };

  const controller = new RecordingController({
    stream: { id: 'internal-master-mix' },
    root,
    recorderFactory: (_stream, options) => {
      const recorder = new FakeRecorder(++recorderId, options, empty);
      recorders.push(recorder);
      return recorder;
    },
    formatChooser: () => ({
      mimeType: 'audio/webm;codecs=opus',
      extension: 'webm',
    }),
    now: () => now,
    setTimer,
    clearTimer,
    createObjectURL: () => {
      const url = `blob:test-${++urlId}`;
      createdUrls.push(url);
      return url;
    },
    revokeObjectURL: (url) => revokedUrls.push(url),
    triggerDownload: (download) => downloads.push(download),
    onUploadRequest,
    renderQr: async (canvas, value, options) => {
      qrRenders.push({ canvas, value, options });
      return renderQr(canvas, value, options);
    },
    copyText: async (value) => {
      copiedTexts.push(value);
      return copyText(value);
    },
  });

  return {
    controller,
    advance,
    recorders,
    createdUrls,
    revokedUrls,
    downloads,
    qrRenders,
    copiedTexts,
    elements,
  };
}

function beginTake(harness) {
  harness.controller.dispatch({ type: 'START_REQUEST' });
  harness.advance(3000);
  assert.equal(harness.controller.state.phase, 'recording');
}

test('uses a three-second countdown and stops automatically at 60 seconds', () => {
  const harness = createHarness();
  harness.controller.dispatch({ type: 'START_REQUEST' });
  harness.advance(2999);
  assert.equal(harness.controller.state.phase, 'countdown');
  harness.advance(1);
  assert.equal(harness.controller.state.phase, 'recording');
  assert.deepEqual(harness.recorders[0].startCalls, [250]);

  harness.advance(59_999);
  assert.equal(harness.recorders[0].stopCalls, 0);
  harness.advance(1);
  assert.equal(harness.recorders[0].stopCalls, 1);
  assert.equal(harness.controller.state.phase, 'review');
});

test('early stop requests call MediaRecorder.stop only once', () => {
  const harness = createHarness();
  beginTake(harness);
  harness.controller.dispatch({ type: 'STOP_REQUEST' });
  harness.controller.dispatch({ type: 'STOP_REQUEST' });
  harness.advance(60_000);
  assert.equal(harness.recorders[0].stopCalls, 1);
  assert.equal(harness.controller.state.phase, 'review');
});

test('re-record keeps the prior take until its replacement stops successfully', () => {
  const harness = createHarness();
  beginTake(harness);
  harness.controller.dispatch({ type: 'STOP_REQUEST' });
  const firstTake = harness.controller.currentTake;

  harness.controller.dispatch({ type: 'RERECORD_REQUEST' });
  assert.equal(harness.controller.currentTake, firstTake);
  harness.advance(3000);
  assert.equal(harness.controller.currentTake, firstTake);
  harness.controller.dispatch({ type: 'STOP_REQUEST' });

  assert.notEqual(harness.controller.currentTake, firstTake);
  assert.equal(harness.controller.previousTake, firstTake);
});

test('canceling a rerecord countdown returns to the preserved review', () => {
  const harness = createHarness();
  beginTake(harness);
  harness.controller.dispatch({ type: 'STOP_REQUEST' });
  const firstTake = harness.controller.currentTake;
  harness.controller.dispatch({ type: 'RERECORD_REQUEST' });
  harness.controller.dispatch({ type: 'CANCEL_REQUEST' });
  assert.equal(harness.controller.state.phase, 'review');
  assert.equal(harness.controller.currentTake, firstTake);
});

test('rerecord during capture discards the incomplete take and restarts countdown', () => {
  const harness = createHarness();
  beginTake(harness);
  harness.controller.dispatch({ type: 'RERECORD_REQUEST' });
  assert.equal(harness.recorders[0].stopCalls, 1);
  assert.equal(harness.controller.currentTake, null);
  assert.equal(harness.controller.state.phase, 'countdown');
  harness.advance(3000);
  assert.equal(harness.controller.state.phase, 'recording');
  assert.equal(harness.recorders.length, 2);
});

test('failed upload preserves the approved Blob for retry or download', async () => {
  const harness = createHarness({
    onUploadRequest: async () => { throw new Error('network unavailable'); },
  });
  beginTake(harness);
  harness.controller.dispatch({ type: 'STOP_REQUEST' });
  const approvedTake = harness.controller.currentTake;

  await harness.controller.dispatch({ type: 'UPLOAD_REQUEST' });
  assert.equal(harness.controller.state.phase, 'review');
  assert.match(harness.controller.state.error, /network unavailable/);
  assert.equal(harness.controller.currentTake, approvedTake);
  assert.equal(harness.qrRenders.length, 0);
});

test('successful upload renders a share URL, expiry and QR without discarding the take', async () => {
  const shareResult = {
    token: 'a'.repeat(32),
    expiresAt: Date.UTC(2026, 6, 11, 12, 0),
    checkinNumber: 27,
    shareUrl: `https://app.example.test/r/${'a'.repeat(32)}`,
  };
  const harness = createHarness({
    withView: true,
    onUploadRequest: async () => shareResult,
  });
  beginTake(harness);
  harness.controller.dispatch({ type: 'STOP_REQUEST' });
  const approvedTake = harness.controller.currentTake;

  await harness.controller.dispatch({ type: 'UPLOAD_REQUEST' });

  assert.equal(harness.controller.state.phase, 'shared');
  assert.equal(harness.controller.currentTake, approvedTake);
  assert.equal(harness.elements['recording-share'].hidden, false);
  assert.equal(harness.elements['recording-share-link'].href, shareResult.shareUrl);
  assert.equal(harness.elements['recording-share-link'].textContent, shareResult.shareUrl);
  assert.match(harness.elements['recording-share-expiry'].textContent, /有效至/);
  assert.equal(harness.elements['recording-checkin'].textContent, '你是本场第 027 位音乐玩家');
  assert.equal(harness.qrRenders.length, 1);
  assert.equal(harness.qrRenders[0].canvas, harness.elements['recording-qr']);
  assert.equal(harness.qrRenders[0].value, shareResult.shareUrl);
  assert.equal(harness.qrRenders[0].options.checkinNumber, 27);
  assert.equal(harness.elements['recording-dialog'].open, true);
});

test('completed takes expose incrementing review metadata', () => {
  const harness = createHarness({ withView: true });
  beginTake(harness);
  harness.advance(12_000);
  harness.controller.dispatch({ type: 'STOP_REQUEST' });

  assert.equal(harness.controller.takeNumber, 1);
  assert.equal(harness.elements['recording-take-label'].textContent, 'TAKE 001');
  assert.equal(harness.elements['recording-duration'].textContent, '00:12');
  assert.equal(harness.elements['recording-format'].textContent, 'WEBM');

  harness.controller.dispatch({ type: 'RERECORD_REQUEST' });
  harness.advance(3000);
  harness.controller.dispatch({ type: 'STOP_REQUEST' });
  assert.equal(harness.controller.takeNumber, 2);
  assert.equal(harness.elements['recording-take-label'].textContent, 'TAKE 002');
});

test('download filename matches MIME and temporary object URLs are revoked', () => {
  const harness = createHarness();
  beginTake(harness);
  harness.controller.dispatch({ type: 'STOP_REQUEST' });
  assert.match(harness.controller.currentFilename, /\.webm$/);

  harness.controller.downloadCurrentTake();
  assert.equal(harness.downloads.length, 1);
  assert.match(harness.downloads[0].filename, /\.webm$/);
  assert.ok(harness.revokedUrls.includes(harness.downloads[0].url));

  const previewUrl = harness.controller.previewUrl;
  harness.controller.destroyPreviewUrl();
  assert.ok(harness.revokedUrls.includes(previewUrl));
});

test('an empty take stays recoverable and never creates a broken preview URL', () => {
  const harness = createHarness({ empty: true });
  beginTake(harness);
  harness.controller.dispatch({ type: 'STOP_REQUEST' });
  assert.equal(harness.controller.state.phase, 'review');
  assert.match(harness.controller.state.error, /未捕获到内部声音/);
  assert.equal(harness.controller.currentTake, null);
  assert.equal(harness.createdUrls.length, 0);
});

test('active recording closes the dialog and counts down from 60 in the HUD', () => {
  const harness = createHarness({ withView: true });
  harness.controller.dispatch({ type: 'START_REQUEST' });
  assert.equal(harness.elements['recording-dialog'].open, true);
  harness.advance(3000);
  assert.equal(harness.controller.state.phase, 'recording');
  assert.equal(harness.elements['recording-dialog'].open, false);
  assert.equal(harness.elements['recording-status'].dataset.phase, 'recording');
  assert.equal(harness.elements['recording-timer'].textContent, '00:60');
  harness.advance(1000);
  assert.equal(harness.elements['recording-timer'].textContent, '00:59');
  harness.controller.dispatch({ type: 'STOP_REQUEST' });
  assert.equal(harness.elements['recording-dialog'].open, true);
});

test('cancel during recording discards the take and returns to free mode', () => {
  const harness = createHarness({ withView: true });
  beginTake(harness);
  const recorder = harness.recorders[0];
  harness.controller.dispatch({ type: 'CANCEL_REQUEST' });
  assert.equal(recorder.stopCalls, 1);
  assert.equal(harness.controller.state.phase, 'idle');
  assert.equal(harness.controller.currentTake, null);
  assert.equal(harness.controller.previousTake, null);
  assert.equal(harness.elements['recording-dialog'].open, false);
  assert.equal(harness.createdUrls.length, 0);
});
