# Exhibition V2 Batch 2 Recording Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record the complete internal browser mix for up to 60 seconds, controlled by reliable two-hand thumb gestures or buttons, with countdown, review, retry, and local-download fallback.

**Architecture:** Route melody and drums into one reusable Tone.js master bus that also feeds a `MediaStreamAudioDestinationNode`. Keep recording and gesture timing in pure state modules; a DOM controller owns `MediaRecorder`, Blob retention, timers, and review UI. `game.js` emits handedness-aware `CustomEvent` frames through its existing `renderDiv` EventTarget and suppresses music gestures while a recording intent is being held.

**Tech Stack:** Tone.js ES module, MediaRecorder, MediaPipe handedness, native DOM, Node.js `node:test`.

---

## File map

- Create `audio/tone.js`: the single pinned Tone.js module entry used by every runtime file.
- Create `audio/AudioBus.js`: shared master input, limiter, analyser, destination, and recording stream.
- Create `recording/recording-state.js`: pure finite-state transitions and gesture-to-action mapping.
- Create `recording/mime.js`: MediaRecorder MIME selection and extension mapping.
- Create `recording/thumb-gesture.js`: handedness normalization, thumb pose classification, and hold/re-arm latch.
- Create `RecordingController.js`: countdown, MediaRecorder lifetime, 60-second cutoff, review, retry, and fallback download.
- Create `tests/recording-state.test.mjs`, `tests/recording-mime.test.mjs`, `tests/thumb-gesture.test.mjs`, `tests/audio-routing-contract.test.mjs`.
- Modify `MusicManager.js`, `DrumManager.js`, `WaveformVisualizer.js`: route all sound/analysis through `AudioBus`.
- Modify `game.js`: use MediaPipe handedness, publish stable hand frames, stop missing-hand audio, and gate normal controls.
- Modify `index.html`, `styles.css`, `main.js`, `GuideController.js`: recording UI, buttons, guide priority, and gesture disable toggle.

### Task 1: Define the recording state machine

**Files:**
- Create: `tests/recording-state.test.mjs`
- Create: `recording/recording-state.js`

- [ ] **Step 1: Write failing transition tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { initialRecordingState, reduceRecording } from '../recording/recording-state.js';

const step = (state, type) => reduceRecording(state, { type });

test('happy path reaches review and upload', () => {
  let state = initialRecordingState();
  state = step(state, 'START_REQUEST');
  assert.equal(state.phase, 'countdown');
  state = step(state, 'COUNTDOWN_DONE');
  assert.equal(state.phase, 'recording');
  state = step(state, 'STOP_REQUEST');
  assert.equal(state.phase, 'stopping');
  state = step(state, 'RECORDER_STOPPED');
  assert.equal(state.phase, 'review');
  state = step(state, 'UPLOAD_REQUEST');
  assert.equal(state.phase, 'uploading');
});

test('cancel and rerecord return to a safe idle/countdown path', () => {
  const countdown = step(initialRecordingState(), 'START_REQUEST');
  assert.equal(step(countdown, 'CANCEL_REQUEST').phase, 'idle');
  const review = { phase: 'review', error: '' };
  assert.equal(step(review, 'RERECORD_REQUEST').phase, 'countdown');
  const stopping = step({ phase: 'recording', error: '', pendingRerecord: false }, 'RERECORD_REQUEST');
  assert.equal(stopping.pendingRerecord, true);
  assert.equal(step(stopping, 'RECORDER_STOPPED').phase, 'countdown');
});

test('invalid events do not mutate the state', () => {
  const idle = initialRecordingState();
  assert.strictEqual(step(idle, 'UPLOAD_REQUEST'), idle);
});
```

- [ ] **Step 2: Run and verify the missing-module failure**

Run: `node --test tests/recording-state.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement explicit allowed transitions**

```js
const TRANSITIONS = Object.freeze({
  idle: { START_REQUEST: 'countdown' },
  countdown: { COUNTDOWN_DONE: 'recording', CANCEL_REQUEST: 'idle' },
  recording: { STOP_REQUEST: 'stopping', RERECORD_REQUEST: 'stopping' },
  stopping: { RECORDER_STOPPED: 'review', STOP_FAILED: 'error' },
  review: { UPLOAD_REQUEST: 'uploading', RERECORD_REQUEST: 'countdown', DISCARD_REQUEST: 'idle' },
  uploading: { UPLOAD_SUCCEEDED: 'shared', UPLOAD_FAILED: 'review' },
  shared: { START_REQUEST: 'countdown', DISCARD_REQUEST: 'idle' },
  error: { RESET: 'idle' },
});

export function initialRecordingState() {
  return Object.freeze({ phase: 'idle', error: '', pendingRerecord: false });
}

export function reduceRecording(state, event) {
  let nextPhase = TRANSITIONS[state.phase]?.[event.type];
  if (!nextPhase) return state;
  const pendingRerecord = state.phase === 'recording' && event.type === 'RERECORD_REQUEST';
  if (state.phase === 'stopping' && event.type === 'RECORDER_STOPPED' && state.pendingRerecord) {
    nextPhase = 'countdown';
  }
  return Object.freeze({
    phase: nextPhase,
    error: event.type.endsWith('FAILED') ? String(event.error || '录音失败') : '',
    pendingRerecord: nextPhase === 'stopping' ? pendingRerecord : false,
  });
}

export function actionForThumbIntent(phase, intent) {
  if (intent === 'both-up') {
    return ({ idle: 'START_REQUEST', recording: 'STOP_REQUEST', review: 'UPLOAD_REQUEST' })[phase] || null;
  }
  if (intent === 'both-down') {
    return ({ countdown: 'CANCEL_REQUEST', recording: 'RERECORD_REQUEST', review: 'RERECORD_REQUEST' })[phase] || null;
  }
  return null;
}
```

- [ ] **Step 4: Add assertions for every approved gesture mapping and run tests**

Add tests for `idle/up`, `countdown/down`, `recording/up`, `recording/down`, `review/up`, `review/down`, and ensure gestures return `null` in `uploading/shared`.

Run: `node --test tests/recording-state.test.mjs`

Expected: all recording-state tests PASS.

- [ ] **Step 5: Commit**

```bash
git add recording/recording-state.js tests/recording-state.test.mjs
git commit -m "test: define recording state machine"
```

### Task 2: Select a truthful browser recording format

**Files:**
- Create: `tests/recording-mime.test.mjs`
- Create: `recording/mime.js`

- [ ] **Step 1: Write the failing MIME test**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { chooseRecordingFormat } from '../recording/mime.js';

test('prefers MP4/AAC, then WebM/Opus, then OGG', () => {
  const supports = (mime) => mime !== 'audio/mp4;codecs=mp4a.40.2';
  assert.deepEqual(chooseRecordingFormat(supports), {
    mimeType: 'audio/webm;codecs=opus', extension: 'webm',
  });
});

test('never labels compressed data as wav', () => {
  assert.notEqual(chooseRecordingFormat(() => false).extension, 'wav');
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/recording-mime.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement capability-based selection**

```js
const CANDIDATES = Object.freeze([
  { mimeType: 'audio/mp4;codecs=mp4a.40.2', extension: 'm4a' },
  { mimeType: 'audio/mp4', extension: 'm4a' },
  { mimeType: 'audio/webm;codecs=opus', extension: 'webm' },
  { mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' },
]);

export function chooseRecordingFormat(isTypeSupported = MediaRecorder.isTypeSupported.bind(MediaRecorder)) {
  return CANDIDATES.find(({ mimeType }) => isTypeSupported(mimeType))
    || { mimeType: '', extension: 'webm' };
}
```

- [ ] **Step 4: Run focused tests and commit**

Run: `node --test tests/recording-mime.test.mjs`

Expected: PASS.

```bash
git add recording/mime.js tests/recording-mime.test.mjs
git commit -m "feat: select supported recording formats"
```

### Task 3: Build the shared master audio bus

**Files:**
- Create: `audio/tone.js`
- Create: `audio/AudioBus.js`
- Create: `tests/audio-routing-contract.test.mjs`
- Modify: `MusicManager.js`
- Modify: `DrumManager.js`
- Modify: `WaveformVisualizer.js`

- [ ] **Step 1: Write a static routing regression test**

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const files = await Promise.all(['MusicManager.js', 'DrumManager.js'].map((name) =>
  readFile(new URL(`../${name}`, import.meta.url), 'utf8')));

test('music and drums use the shared AudioBus', () => {
  for (const source of files) {
    assert.match(source, /audioBus/);
    assert.match(source, /audio\/tone\.js/);
    assert.doesNotMatch(source, /\.toDestination\(\)/);
    assert.doesNotMatch(source, /https:\/\/esm\.sh\/tone/);
  }
});
```

- [ ] **Step 2: Run and verify it fails on direct destinations**

Run: `node --test tests/audio-routing-contract.test.mjs`

Expected: FAIL because both managers still call `toDestination()`.

- [ ] **Step 3: Create the single Tone entry and singleton audio bus**

`audio/tone.js`:

```js
export * from 'https://esm.sh/tone@15.1.22';
```

```js
import * as Tone from './tone.js';

class AudioBus {
  constructor() {
    this.ready = false;
  }

  async start() {
    if (this.ready) return this;
    await Tone.start();
    this.input = new Tone.Gain(1);
    this.limiter = new Tone.Limiter(-1);
    this.analyser = new Tone.Analyser('waveform', 1024);
    this.input.connect(this.limiter);
    this.limiter.connect(this.analyser);
    this.limiter.toDestination();
    this.mediaDestination = Tone.getContext().rawContext.createMediaStreamDestination();
    this.limiter.connect(this.mediaDestination);
    this.ready = true;
    return this;
  }

  get recordingStream() {
    if (!this.ready) throw new Error('AudioBus must be started first');
    return this.mediaDestination.stream;
  }
}

export const audioBus = new AudioBus();
```

- [ ] **Step 4: Route managers into the bus**

Import Tone only from `./audio/tone.js` in `MusicManager.js`, `DrumManager.js`, and `game.js`; remove every direct Tone CDN import so all nodes share one context. Import `audioBus` in both managers. At the start of each audio initializer call `await audioBus.start()`. In `MusicManager.js`, connect the final reverb output to `audioBus.input`, remove `Tone.Destination.chain(...)`, and expose `audioBus.analyser` to `WaveformVisualizer`. In `DrumManager.js`, replace `}).toDestination()` with:

```js
});
players.connect(audioBus.input);
```

- [ ] **Step 5: Run routing, invite, and browser audio smoke tests**

Run: `node --test tests/audio-routing-contract.test.mjs && npm test`

Expected: all tests PASS.

Browser expected: one click starts Tone; melody and every drum sample remain audible; no doubled signal or clipping warning; waveform still moves.

- [ ] **Step 6: Commit**

```bash
git add audio/tone.js audio/AudioBus.js MusicManager.js DrumManager.js game.js WaveformVisualizer.js tests/audio-routing-contract.test.mjs
git commit -m "refactor: route audio through shared master bus"
```

### Task 4: Recognize two-hand thumb intents with hold and re-arm

**Files:**
- Create: `recording/thumb-gesture.js`
- Create: `tests/thumb-gesture.test.mjs`
- Modify: `game.js`

- [ ] **Step 1: Write deterministic latch tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { GestureLatch } from '../recording/thumb-gesture.js';

test('fires after 800ms and only rearms after 1000ms neutral', () => {
  const latch = new GestureLatch({ holdMs: 800, neutralMs: 1000 });
  assert.equal(latch.update('both-up', 0), null);
  assert.equal(latch.update('both-up', 799), null);
  assert.equal(latch.update('both-up', 800), 'both-up');
  assert.equal(latch.update('both-up', 2000), null);
  assert.equal(latch.update('neutral', 2100), null);
  assert.equal(latch.update('neutral', 3099), null);
  assert.equal(latch.update('neutral', 3100), null);
  assert.equal(latch.update('both-down', 3101), null);
  assert.equal(latch.update('both-down', 3901), 'both-down');
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/thumb-gesture.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement pose classification and latch**

```js
function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

export function classifyThumbPose(landmarks) {
  if (!landmarks || landmarks.length < 21) return 'neutral';
  const palm = Math.max(distance(landmarks[0], landmarks[9]), 0.001);
  const otherFingersCurled = [[8, 6], [12, 10], [16, 14], [20, 18]]
    .every(([tip, pip]) => distance(landmarks[tip], landmarks[0]) < distance(landmarks[pip], landmarks[0]) + palm * 0.12);
  const thumbExtended = distance(landmarks[4], landmarks[2]) > palm * 0.55;
  if (!otherFingersCurled || !thumbExtended) return 'neutral';
  const dy = landmarks[4].y - landmarks[2].y;
  if (dy < -palm * 0.35) return 'up';
  if (dy > palm * 0.35) return 'down';
  return 'neutral';
}

export function combineThumbPoses(handsBySide) {
  const left = classifyThumbPose(handsBySide.Left?.landmarks);
  const right = classifyThumbPose(handsBySide.Right?.landmarks);
  if (left === 'up' && right === 'up') return 'both-up';
  if (left === 'down' && right === 'down') return 'both-down';
  return 'neutral';
}

export class GestureLatch {
  constructor({ holdMs = 800, neutralMs = 1000 } = {}) {
    this.holdMs = holdMs; this.neutralMs = neutralMs; this.reset();
  }
  reset() { this.candidate = 'neutral'; this.since = 0; this.armed = true; this.neutralSince = 0; }
  update(intent, now) {
    this.lastNow = now;
    if (!this.armed) {
      if (intent !== 'neutral') { this.neutralSince = 0; return null; }
      if (!this.neutralSince) this.neutralSince = now;
      if (now - this.neutralSince >= this.neutralMs) { this.armed = true; this.candidate = 'neutral'; }
      return null;
    }
    if (intent === 'neutral') { this.candidate = 'neutral'; this.since = now; return null; }
    if (intent !== this.candidate) { this.candidate = intent; this.since = now; return null; }
    if (now - this.since < this.holdMs) return null;
    this.armed = false; this.neutralSince = 0; return intent;
  }
  get progress() {
    return this.candidate === 'neutral' ? 0 : Math.max(0, Math.min(1, (this.lastNow - this.since) / this.holdMs));
  }
}
```

- [ ] **Step 4: Normalize MediaPipe results by handedness in `game.js`**

During `_updateHands`, derive a stable map from `results.handednesses[i][0].categoryName`, accounting for the mirrored preview only in display coordinates, not by array index:

```js
const side = results.handednesses?.[i]?.[0]?.categoryName;
if (side === 'Left' || side === 'Right') {
  hand.side = side;
  this.handsBySide[side] = hand;
}
```

Emit one `handframe` event after processing results:

```js
this.renderDiv.dispatchEvent(new CustomEvent('handframe', {
  detail: { handsBySide: this.handsBySide, now: performance.now() },
}));
```

When a side disappears, call `musicManager.stopArpeggio('Left')` or `drumManager.updateActiveDrums({})` immediately. Add `setInteractionSuppressed(value)` and make the existing fist/four-finger/position handlers return before musical mutations while suppressed.

- [ ] **Step 5: Add fixture-based up/down/neutral pose assertions and run tests**

Use 21-point fixtures with thumb tip/MCP and curled/open finger points; assert open three-finger performance shapes classify as `neutral`.

Run: `node --test tests/thumb-gesture.test.mjs && npm test`

Expected: all tests PASS, including the false-positive fixture.

- [ ] **Step 6: Commit**

```bash
git add recording/thumb-gesture.js tests/thumb-gesture.test.mjs game.js
git commit -m "feat: add latched two-hand recording gestures"
```

### Task 5: Implement MediaRecorder lifecycle and review UI

**Files:**
- Create: `RecordingController.js`
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `main.js`
- Modify: `GuideController.js`

- [ ] **Step 1: Add the recording dialog and permanent button controls**

Add to `index.html`:

```html
<button id="recording-primary" class="recording-primary" type="button">开始录音</button>
<dialog id="recording-dialog" class="recording-dialog" aria-labelledby="recording-dialog-title">
  <h2 id="recording-dialog-title">准备录音</h2>
  <p id="recording-message" role="status" aria-live="polite"></p>
  <div id="recording-hold-progress" class="hold-progress" aria-hidden="true"></div>
  <audio id="recording-preview" controls hidden></audio>
  <div class="recording-actions">
    <button id="recording-confirm" type="button">确认并生成二维码</button>
    <button id="recording-rerecord" type="button">重新录制</button>
    <button id="recording-cancel" type="button">取消</button>
    <button id="recording-download" type="button">下载到这台电脑</button>
  </div>
</dialog>
```

Add a checkbox inside Control Deck:

```html
<label><input id="recording-gestures-enabled" type="checkbox" checked> 录音手势</label>
```

- [ ] **Step 2: Implement the controller with injected timers and recorder factory**

`RecordingController` must:

```js
const MAX_MS = 60_000;
const COUNTDOWN_MS = 3_000;

// Constructor dependencies:
// { stream, recorderFactory, now, setTimer, clearTimer, onUploadRequest }
// Owned fields:
// state, recorder, chunks, currentTake, previousTake, previewUrl, stopTimer
// Required methods:
// dispatch(event), startCountdown(), beginRecording(), stopRecording(reason),
// showReview(), rerecord(), downloadCurrentTake(), destroyPreviewUrl()
```

Use the chosen MIME in the real implementation:

```js
const format = chooseRecordingFormat();
this.recorder = this.recorderFactory(this.stream, format.mimeType ? { mimeType: format.mimeType } : {});
this.chunks = [];
this.recorder.addEventListener('dataavailable', ({ data }) => data.size && this.chunks.push(data));
this.recorder.addEventListener('stop', () => {
  const discardAndRestart = this.state.pendingRerecord;
  const stoppedBlob = new Blob(this.chunks, { type: this.recorder.mimeType || format.mimeType });
  this.dispatch({ type: 'RECORDER_STOPPED' });
  if (discardAndRestart) {
    this.startCountdown();
    return;
  }
  this.previousTake = this.currentTake;
  this.currentTake = stoppedBlob;
  this.showReview();
}, { once: true });
this.recorder.start(250);
this.stopTimer = this.setTimer(() => this.stopRecording('limit'), MAX_MS);
```

Download must be opt-in and revoke its object URL after clicking. Re-record must retain `previousTake` until the replacement recording successfully stops. Upload failure must leave `currentTake` untouched.

- [ ] **Step 3: Wire button, guide, and gesture priority in `main.js`**

Start `audioBus`, construct `RecordingController` with `audioBus.recordingStream`, and apply this context order:

```js
// Highest to lowest: guide -> recorder -> musical controls.
game.renderDiv.addEventListener('handframe', ({ detail }) => {
  const guideOpen = guideController.dialog?.open;
  const intent = combineThumbPoses(detail.handsBySide);
  const trigger = gestureLatch.update(intent, detail.now);
  if (guideOpen) {
    game.setInteractionSuppressed(true);
    if (trigger === 'both-up') guideController.skipFromGesture();
    return;
  }
  const recordingGestures = document.getElementById('recording-gestures-enabled').checked;
  const action = recordingGestures && trigger
    ? actionForThumbIntent(recordingController.state.phase, trigger)
    : null;
  game.setInteractionSuppressed(Boolean(action) || intent !== 'neutral');
  if (action) recordingController.dispatch({ type: action });
});
```

Call `guideController.setRecordingBusy(true)` during `recording`, `stopping`, and `uploading`; guide close resets the latch and enforces its one-second neutral period.

- [ ] **Step 4: Add controller tests with a fake MediaRecorder**

Test exact behaviors: three-second countdown; automatic stop at 60,000 ms; early stop; stop called once; re-record preserves previous Blob; failed upload preserves current Blob; generated filename extension matches MIME; object URLs are revoked.

Run: `node --test tests/recording*.test.mjs tests/thumb-gesture.test.mjs`

Expected: all focused tests PASS.

- [ ] **Step 5: Perform Chrome and Edge smoke tests**

Run: `npm run start`

Expected in both browsers: countdown is 3→2→1; audio preview contains melody and drums but no microphone; hard stop occurs at 01:00; early stop works; buttons work without gestures; thumbs must hold about 0.8s and release for about 1s; normal three-finger drum play does not trigger recording; guide cannot open during recording/stopping/uploading.

- [ ] **Step 6: Run regression and commit**

Run: `npm test && git diff --check`

Expected: all tests PASS; no whitespace errors.

```bash
git add RecordingController.js recording audio MusicManager.js DrumManager.js WaveformVisualizer.js game.js main.js index.html styles.css GuideController.js tests
git commit -m "feat: add one-minute gesture recording"
```

### Task 6: Execute the repeat-recording stability checkpoint

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Run the ten-minute repeat loop**

Perform ten cycles of: start → stop at 20–40 seconds → preview → re-record once → preview → local fallback download → discard. Watch Chrome Task Manager and DevTools console.

Expected: only current and previous Blob remain referenced; revoked preview URLs do not accumulate; no extra MediaRecorder remains active; audio does not become louder after each cycle.

- [ ] **Step 2: Add the result checklist**

```md
## Exhibition V2 — Batch 2 checkpoint

- Internal master mix recording verified in current Chrome and Edge.
- Countdown: 3 seconds. Maximum take: 60 seconds. Early stop and re-record verified.
- Two-hand gestures require an 800 ms hold and 1000 ms neutral re-arm.
- Buttons and manual local download remain available as fallbacks.
- Ten-minute repeat-recording loop completed without leaked recorder instances or doubled audio.
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: record browser recording checkpoint"
```
