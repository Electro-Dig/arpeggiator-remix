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
    this.srcObject = null;
    this.paused = true;
  }

  showModal() { this.open = true; }
  close() { this.open = false; }
  removeAttribute(name) { delete this[name]; }
  play() { this.paused = false; return Promise.resolve(); }
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
  getVideoSource = () => null,
  getPhotoCaptureSource = () => null,
  getPhotoOverlays = () => [],
  capturePhoto = () => {},
  requestFrame = (callback) => callback(),
  getPerformanceMetadata = () => ({}),
  onPosterUploadRequest = async () => ({ ok: true }),
  posterSerializer = async () => new Blob(['poster'], { type: 'image/webp' }),
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
  const posterUploads = [];
  const viewIds = [
    'recording-dialog', 'recording-status', 'recording-state-label',
    'recording-timer', 'recording-message', 'recording-preview',
    'recording-share', 'recording-qr', 'recording-share-qr', 'recording-share-link',
    'recording-share-expiry', 'recording-copy-link',
    'recording-checkin',
    'recording-take-label', 'recording-duration', 'recording-format',
    'recording-confirm', 'recording-rerecord', 'recording-download', 'recording-cancel',
    'recording-cancel-label',
    'recording-photo-preview', 'recording-share-frame-fallback', 'recording-gesture-status',
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
    getVideoSource,
    getPhotoCaptureSource,
    getPhotoOverlays,
    capturePhoto,
    requestFrame,
    getPerformanceMetadata,
    posterSerializer,
    onPosterUploadRequest: async (token, blob) => {
      posterUploads.push({ token, blob });
      return onPosterUploadRequest(token, blob);
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
    posterUploads,
  };
}

function beginTake(harness) {
  harness.controller.dispatch({ type: 'START_REQUEST' });
  harness.advance(3000);
  assert.equal(harness.controller.state.phase, 'recording');
}

const flushAsyncWork = () => new Promise((resolve) => setImmediate(resolve));

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

test('successful upload shows the captured frame directly while keeping the poster canvas hidden', async () => {
  const shareResult = {
    token: 'a'.repeat(32),
    expiresAt: Date.UTC(2026, 6, 11, 12, 0),
    checkinNumber: 27,
    shareUrl: `https://app.example.test/r/${'a'.repeat(32)}`,
  };
  const performanceMetadata = {
    scene: 'AFTERGLOW COAST',
    synth: 'DX7 E.PIANO',
    rhythm: 'GLITCH / LEAN',
    bpm: 118,
    root: 'F#3',
    fx: 'LP 82% · DLY 24% · GLT 8%',
  };
  const harness = createHarness({
    withView: true,
    onUploadRequest: async () => shareResult,
    getPerformanceMetadata: () => performanceMetadata,
  });
  beginTake(harness);
  harness.controller.dispatch({ type: 'STOP_REQUEST' });
  harness.controller.currentCover = harness.elements['recording-photo-preview'];
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
  assert.equal(harness.qrRenders[0].options.qrPreview, harness.elements['recording-share-qr']);
  assert.equal(harness.qrRenders[0].value, shareResult.shareUrl);
  assert.equal(harness.qrRenders[0].options.checkinNumber, 27);
  assert.equal(harness.qrRenders[0].options.photo, harness.elements['recording-photo-preview']);
  assert.equal(harness.elements['recording-qr'].hidden, true);
  assert.equal(harness.elements['recording-photo-preview'].hidden, false);
  assert.equal(harness.elements['recording-share-frame-fallback'].hidden, true);
  assert.equal(harness.qrRenders[0].options.durationMs, harness.controller.takeDurationMs);
  assert.deepEqual(harness.qrRenders[0].options.metadata, performanceMetadata);
  assert.equal(harness.posterUploads.length, 1);
  assert.equal(harness.posterUploads[0].token, shareResult.token);
  assert.equal(harness.posterUploads[0].blob.type, 'image/webp');
  assert.equal(harness.elements['recording-dialog'].open, true);
});
test('review exposes explicit gesture re-arm and hold feedback', () => {
  const harness = createHarness({ withView: true });
  beginTake(harness);
  harness.controller.dispatch({ type: 'STOP_REQUEST' });

  harness.controller.setGestureFeedback({ armed: false, intent: 'both-up', progress: 0 });
  assert.equal(harness.elements['recording-gesture-status'].dataset.state, 'rearming');
  assert.match(harness.elements['recording-gesture-status'].textContent, /0\.5/);

  harness.controller.setGestureFeedback({ armed: true, intent: 'both-up', progress: 0.42 });
  assert.equal(harness.elements['recording-gesture-status'].dataset.state, 'holding');
  assert.match(harness.elements['recording-gesture-status'].textContent, /42%/);

  harness.controller.setGestureFeedback({ armed: true, intent: 'neutral', progress: 0 });
  assert.equal(harness.elements['recording-gesture-status'].dataset.state, 'ready');
  assert.match(harness.elements['recording-gesture-status'].textContent, /点赞/);
});


test('poster upload retries once and never creates a second audio check-in', async () => {
  let audioUploads = 0;
  let posterShouldFail = true;
  const shareResult = {
    token: 'b'.repeat(32),
    expiresAt: Date.UTC(2026, 6, 11, 12, 0),
    checkinNumber: 31,
    shareUrl: `https://app.example.test/r/${'b'.repeat(32)}`,
  };
  const harness = createHarness({
    withView: true,
    onUploadRequest: async () => { audioUploads += 1; return shareResult; },
    onPosterUploadRequest: async () => {
      if (posterShouldFail) throw new Error('poster unavailable');
      return { ok: true };
    },
  });
  beginTake(harness);
  harness.controller.dispatch({ type: 'STOP_REQUEST' });
  await harness.controller.dispatch({ type: 'UPLOAD_REQUEST' });
  assert.equal(harness.controller.state.phase, 'review');
  assert.equal(audioUploads, 1);
  assert.equal(harness.posterUploads.length, 2);
  assert.equal(harness.controller.shareResult, shareResult);

  posterShouldFail = false;
  await harness.controller.dispatch({ type: 'UPLOAD_REQUEST' });
  assert.equal(harness.controller.state.phase, 'shared');
  assert.equal(audioUploads, 1);
  assert.equal(harness.posterUploads.length, 3);
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

test('recording start captures the first performance frame without a photo phase', async () => {
  const captureCalls = [];
  const frames = [];
  const source = {
    videoWidth: 1280,
    videoHeight: 720,
    readyState: 4,
  };
  const harness = createHarness({
    withView: true,
    getVideoSource: () => source,
    requestFrame: (callback) => frames.push(callback),
    capturePhoto: (video, canvas) => {
      captureCalls.push({ video, canvas });
      return canvas;
    },
  });
  beginTake(harness);

  assert.equal(harness.controller.state.phase, 'recording');
  assert.equal(frames.length, 1);
  assert.equal(captureCalls.length, 0);
  frames.shift()(0);
  await flushAsyncWork();
  assert.equal(captureCalls.length, 1);
  assert.equal(captureCalls[0].video, source);
  assert.equal(captureCalls[0].canvas, harness.elements['recording-photo-preview']);
  assert.equal(harness.elements['recording-photo-preview'].hidden, true);
  assert.equal(harness.controller.currentCover, harness.elements['recording-photo-preview']);
  assert.equal('photoCountdownTimer' in harness.controller, false);
});

test('first-frame capture forwards an injected page snapshot and mirrored music overlay', async () => {
  const captureCalls = [];
  const sourceRequests = [];
  const overlayRequests = [];
  const source = {
    videoWidth: 1280,
    videoHeight: 720,
    srcObject: { id: 'existing-camera-stream' },
  };
  const pageSnapshot = { width: 1440, height: 900 };
  const musicVisual = { width: 1440, height: 900 };
  const harness = createHarness({
    withView: true,
    getVideoSource: () => source,
    getPhotoCaptureSource: async (request) => {
      sourceRequests.push(request);
      return pageSnapshot;
    },
    getPhotoOverlays: async (request) => {
      overlayRequests.push(request);
      return [{ source: musicVisual, opacity: 0.7, blendMode: 'screen', mirror: true }];
    },
    capturePhoto: async (video, canvas, options) => {
      captureCalls.push({ video, canvas, options });
      return canvas;
    },
  });
  beginTake(harness);
  await flushAsyncWork();

  assert.equal(harness.controller.state.phase, 'recording');
  assert.equal(captureCalls.length, 1);
  assert.equal(sourceRequests.length, 1);
  assert.equal(overlayRequests.length, 1);
  assert.equal(sourceRequests[0].cameraSource, source);
  assert.equal(sourceRequests[0].targetCanvas, harness.elements['recording-photo-preview']);
  assert.strictEqual(overlayRequests[0], sourceRequests[0]);
  assert.equal(captureCalls[0].video, source);
  assert.equal(captureCalls[0].options.captureSource, pageSnapshot);
  assert.deepEqual(captureCalls[0].options.overlays, [
    { source: musicVisual, opacity: 0.7, blendMode: 'screen', mirror: true },
  ]);
});

test('a stale asynchronous cover cannot overwrite the next rerecorded take', async () => {
  const pending = [];
  const coverCanvases = [];
  const harness = createHarness({
    withView: true,
    getVideoSource: () => ({ videoWidth: 1280, videoHeight: 720 }),
    getPhotoCaptureSource: () => new Promise((resolve) => pending.push(resolve)),
    capturePhoto: (_video, canvas) => {
      coverCanvases.push(canvas);
      return canvas;
    },
  });
  beginTake(harness);
  harness.controller.dispatch({ type: 'STOP_REQUEST' });
  harness.controller.dispatch({ type: 'RERECORD_REQUEST' });
  harness.advance(3000);
  assert.equal(pending.length, 2);

  const secondSnapshot = { width: 1440, height: 900, id: 'second' };
  pending[1](secondSnapshot);
  await flushAsyncWork();
  const acceptedCover = harness.controller.currentCover;
  assert.ok(acceptedCover);

  const firstSnapshot = { width: 1440, height: 900, id: 'first' };
  pending[0](firstSnapshot);
  await flushAsyncWork();
  assert.equal(harness.controller.currentCover, acceptedCover);
  assert.equal(coverCanvases.length, 1);
});

test('missing camera or snapshot keeps recording and uses the abstract poster fallback', async () => {
  const shareResult = {
    token: 'c'.repeat(32),
    expiresAt: Date.UTC(2026, 6, 11, 12, 0),
    checkinNumber: 44,
    shareUrl: `https://app.example.test/r/${'c'.repeat(32)}`,
  };
  const harness = createHarness({
    withView: true,
    getVideoSource: () => null,
    getPhotoCaptureSource: async () => null,
    capturePhoto: () => { throw new Error('camera unavailable'); },
    onUploadRequest: async () => shareResult,
  });
  beginTake(harness);
  await flushAsyncWork();
  harness.controller.dispatch({ type: 'STOP_REQUEST' });
  await harness.controller.dispatch({ type: 'UPLOAD_REQUEST' });

  assert.equal(harness.controller.state.phase, 'shared');
  assert.equal(harness.controller.currentCover, null);
  assert.equal(harness.qrRenders[0].options.photo, null);
});
