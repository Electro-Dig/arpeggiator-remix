# Recording HUD and Cancel Gesture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the modal overlay during active recording, show a lightweight 60-second REC countdown in the existing HUD, and make both-thumbs-down cancel instead of re-record.

**Architecture:** Keep the countdown and review surfaces in the existing `RecordingController` dialog, but close the dialog immediately after `MediaRecorder.start()` succeeds. Reuse `.rec-status` as the only active-recording visual. Add an explicit cancel-on-stop path so `MediaRecorder` still shuts down cleanly while its Blob is discarded.

**Tech Stack:** Native ES modules, MediaRecorder, DOM `<dialog>`, CSS, Node.js `node:test`.

---

### Task 1: Change the gesture and state-machine contract

**Files:**
- Modify: `tests/recording-state.test.mjs`
- Modify: `recording/recording-state.js`

- [ ] **Step 1: Write failing gesture and transition assertions**

Replace the recording/review down-intent assertions with:

```js
assert.equal(actionForThumbIntent('recording', 'both-down'), 'CANCEL_REQUEST');
assert.equal(actionForThumbIntent('review', 'both-down'), 'DISCARD_REQUEST');
```

Add a transition assertion:

```js
const canceling = step(
  { phase: 'recording', error: '', pendingRerecord: false },
  'CANCEL_REQUEST',
);
assert.equal(canceling.phase, 'stopping');
assert.equal(step(canceling, 'RECORDER_CANCELLED').phase, 'idle');
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/recording-state.test.mjs`

Expected: FAIL because `both-down` still maps to `RERECORD_REQUEST` and the cancel transitions do not exist.

- [ ] **Step 3: Implement the minimal state contract**

In `recording/recording-state.js`, add:

```js
recording: Object.freeze({
  STOP_REQUEST: 'stopping',
  RERECORD_REQUEST: 'stopping',
  CANCEL_REQUEST: 'stopping',
}),
stopping: Object.freeze({
  RECORDER_STOPPED: 'review',
  RECORDER_CANCELLED: 'idle',
  RECORDER_EMPTY: 'review',
  STOP_FAILED: 'error',
}),
```

Update `actionForThumbIntent()`:

```js
if (intent === 'both-down') {
  return ({
    countdown: 'CANCEL_REQUEST',
    recording: 'CANCEL_REQUEST',
    review: 'DISCARD_REQUEST',
  })[phase] || null;
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test tests/recording-state.test.mjs`

Expected: all recording-state tests PASS.

- [ ] **Step 5: Commit the state contract**

```bash
git add recording/recording-state.js tests/recording-state.test.mjs
git commit -m "fix: make thumbs down cancel recording"
```

### Task 2: Separate dialog and active-recording presentation

**Files:**
- Modify: `tests/recording-controller.test.mjs`
- Modify: `RecordingController.js`
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `tests/ui-shell.test.mjs`

- [ ] **Step 1: Add a minimal fake view to controller tests**

Add a `FakeElement` with `open`, `hidden`, `dataset`, `style.setProperty()`, `showModal()`, `close()`, and `removeAttribute()`. Extend `createHarness({ withView: true })` to provide `recording-dialog`, `recording-status`, `recording-state-label`, and `recording-timer` elements.

- [ ] **Step 2: Write failing lifecycle tests**

Add:

```js
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
```

Extend the UI shell assertion to require `id="recording-status"`, `.rec-status[data-phase="recording"]`, and a `rec-status-pulse` keyframe.

- [ ] **Step 3: Run focused tests and verify RED**

Run:

```bash
node --test tests/recording-controller.test.mjs tests/ui-shell.test.mjs
```

Expected: FAIL because the dialog stays open, the timer counts upward, and recording cancel has no controller path.

- [ ] **Step 4: Implement dialog close, cancel cleanup, and remaining time**

In `RecordingController`:

```js
// constructor
this.cancelOnStop = false;

// collectElements
status: byId('recording-status'),

// dispatch, after state reduction
if (normalizedEvent.type === 'CANCEL_REQUEST' && previousState.phase === 'recording') {
  this.cancelOnStop = true;
  this.requestRecorderStop();
}

// beginRecording, immediately after recorder.start(250)
this.closeDialog();

// handleRecorderStopped, before Blob review handling
if (this.cancelOnStop) {
  this.cancelOnStop = false;
  this.chunks = [];
  this.destroyPreviewUrl();
  this.currentTake = null;
  this.previousTake = null;
  this.currentFilename = '';
  this.elapsedMs = 0;
  this.dispatch({ type: 'RECORDER_CANCELLED' });
  this.closeDialog();
  this.render();
  return;
}
```

In `render()`:

```js
if (this.elements.status) this.elements.status.dataset.phase = phase;
const displayedSeconds = phase === 'countdown'
  ? this.countdownRemaining || 3
  : phase === 'recording'
    ? Math.max(0, Math.ceil((RECORDING_MAX_MS - this.elapsedMs) / 1000))
    : Math.floor(this.elapsedMs / 1000);
this.elements.timer.textContent = `00:${String(displayedSeconds).padStart(2, '0')}`;
```

Ensure the generic stop/rerecord branch does not call `requestRecorderStop()` a second time for `CANCEL_REQUEST`.

- [ ] **Step 5: Add the HUD phase hook and restrained visual state**

Change the existing status section in `index.html`:

```html
<section id="recording-status" class="rec-status" data-phase="idle" aria-label="录音状态">
```

Add to `styles.css`:

```css
.rec-status[data-phase="recording"] {
  color: var(--record);
}

.rec-status[data-phase="recording"] .rec-status__lamp {
  animation: rec-status-pulse 1.1s ease-in-out infinite;
}

@keyframes rec-status-pulse {
  50% {
    opacity: 0.42;
    box-shadow: 0 0 0 6px rgba(255, 77, 95, 0.08);
  }
}
```

The existing reduced-motion media query already disables all animation.

- [ ] **Step 6: Run focused and full verification**

Run:

```bash
node --test tests/recording-controller.test.mjs tests/recording-state.test.mjs tests/ui-shell.test.mjs
npm.cmd test
node --check RecordingController.js
node --check main.js
git diff --check
```

Expected: all tests PASS, syntax checks exit 0, and no whitespace errors.

- [ ] **Step 7: Browser smoke and commit**

At `http://localhost:8000/`, verify: countdown modal appears; it closes at recording start; the camera view remains unobstructed; HUD shows `REC 00:60` then `00:59`; thumbs-down/cancel returns to `READY 00:00`; normal stop opens review and preview/download still work.

```bash
git add RecordingController.js index.html styles.css tests/recording-controller.test.mjs tests/ui-shell.test.mjs
git commit -m "fix: keep active recording unobstructed"
```
