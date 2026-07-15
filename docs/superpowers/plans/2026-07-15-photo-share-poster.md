# WAIC Photo Share Poster Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a three-second participant photo flow after recording approval and publish the same personalized poster with the audio share link.

**Architecture:** Extend the existing recording state machine with photo countdown and review states. Capture one frame from the already-authorized webcam into a local canvas, render the final poster locally after the audio upload returns its token, then upload only that composed poster through a second signed endpoint. The mobile share page reads the stored poster while retaining the existing generated-poster fallback for older recordings.

**Tech Stack:** Vanilla ES modules, Canvas 2D, MediaStream video, Node test runner, Netlify Function proxy, Node HTTP recording service.

---

## File map

- Create `recording/photo-capture.js`: deterministic crop calculation and one-frame mirrored capture.
- Modify `recording/recording-state.js`: add photo states and gesture mapping.
- Modify `RecordingController.js`: orchestrate photo countdown, capture, review, poster rendering and two-stage upload.
- Modify `index.html`: add photo viewport, countdown, preview and skip button.
- Modify `styles.css`: photo flow and revised shared-poster layout.
- Modify `main.js`: inject the current camera video and poster upload client.
- Modify `share/qr.js`: render the personalized single-cover poster.
- Modify `share/recordings-client.js`: add poster upload request.
- Modify `netlify/functions/recordings-api.mjs`: proxy poster upload and download.
- Modify `services/recordings-api/storage.mjs`: persist one final poster beside each recording.
- Modify `services/recordings-api/server.mjs`: expose signed poster routes.
- Modify `netlify.toml`: route `/r/poster/:token`.
- Modify `r/index.html`, `r/share.css`, `r/share-page.js`: preview and download the stored poster on mobile.
- Modify corresponding tests under `tests/` and `services/recordings-api/`.

### Task 1: Photo state model and capture primitive

**Files:**
- Create: `recording/photo-capture.js`
- Modify: `recording/recording-state.js`
- Test: `tests/photo-capture.test.mjs`
- Test: `tests/recording-state.test.mjs`

- [ ] **Step 1: Write failing state tests**

Add assertions for this exact transition path:

```js
let state = { phase: 'review', error: '', pendingRerecord: false };
state = step(state, 'PHOTO_REQUEST');
assert.equal(state.phase, 'photo-countdown');
state = step(state, 'PHOTO_CAPTURED');
assert.equal(state.phase, 'photo-review');
state = step(state, 'PHOTO_RETAKE');
assert.equal(state.phase, 'photo-countdown');
state = step(state, 'PHOTO_CAPTURED');
state = step(state, 'PHOTO_ACCEPTED');
assert.equal(state.phase, 'uploading');
assert.equal(step({ ...state, phase: 'uploading' }, 'UPLOAD_FAILED').phase, 'photo-review');
assert.equal(actionForThumbIntent('review', 'both-up'), 'PHOTO_REQUEST');
assert.equal(actionForThumbIntent('photo-review', 'both-up'), null);
```

- [ ] **Step 2: Run the state test and verify RED**

Run: `node --test tests/recording-state.test.mjs`

Expected: failure because `PHOTO_REQUEST` is not handled.

- [ ] **Step 3: Add crop/capture tests**

Test that a 16:9 source becomes a centered 4:5 crop and that mirrored capture uses one draw call:

```js
assert.deepEqual(calculateCoverCrop(1280, 720, 900, 1125), {
  sx: 352, sy: 0, sw: 576, sh: 720,
});
const result = capturePhotoFrame(video, canvas);
assert.equal(result, canvas);
assert.deepEqual(drawCalls[0], [video, 352, 0, 576, 720, 0, 0, 900, 1125]);
```

- [ ] **Step 4: Run the capture test and verify RED**

Run: `node --test tests/photo-capture.test.mjs`

Expected: module-not-found failure for `recording/photo-capture.js`.

- [ ] **Step 5: Implement the state transitions and capture utility**

The state model must include:

```js
review: { PHOTO_REQUEST: 'photo-countdown', RERECORD_REQUEST: 'countdown', DISCARD_REQUEST: 'idle' },
'photo-countdown': { PHOTO_CAPTURED: 'photo-review', PHOTO_CAPTURE_FAILED: 'photo-review', DISCARD_REQUEST: 'idle' },
'photo-review': { PHOTO_ACCEPTED: 'uploading', PHOTO_RETAKE: 'photo-countdown', PHOTO_SKIPPED: 'uploading', DISCARD_REQUEST: 'idle' },
uploading: { UPLOAD_SUCCEEDED: 'shared', UPLOAD_FAILED: 'photo-review' },
```

`capturePhotoFrame()` must validate `videoWidth`/`videoHeight`, set the destination to 900 × 1125, mirror with `translate(width, 0)` and `scale(-1, 1)`, draw the centered crop, and always restore the context.

- [ ] **Step 6: Run both tests and verify GREEN**

Run: `node --test tests/recording-state.test.mjs tests/photo-capture.test.mjs`

- [ ] **Step 7: Commit**

Run:

```bash
git add recording/recording-state.js recording/photo-capture.js tests/recording-state.test.mjs tests/photo-capture.test.mjs
git commit -m "feat: add recording photo states and capture"
```

### Task 2: Recording dialog photo flow

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `RecordingController.js`
- Modify: `main.js`
- Test: `tests/recording-controller.test.mjs`
- Test: `tests/ui-shell.test.mjs`

- [ ] **Step 1: Write failing controller tests**

Extend the harness with `recording-photo-video`, `recording-photo-preview`, `recording-photo-countdown`, and `recording-photo-skip`. Inject `getVideoSource` and `capturePhoto` and assert:

```js
controller.dispatch({ type: 'PHOTO_REQUEST' });
assert.equal(controller.state.phase, 'photo-countdown');
advance(3000);
assert.equal(controller.state.phase, 'photo-review');
assert.equal(captureCalls.length, 1);
assert.equal(elements['recording-photo-preview'].hidden, false);
controller.dispatch({ type: 'PHOTO_RETAKE' });
assert.equal(controller.state.phase, 'photo-countdown');
```

Also verify missing video enters `photo-review` with an actionable error and leaves the recording intact.

- [ ] **Step 2: Run controller tests and verify RED**

Run: `node --test tests/recording-controller.test.mjs`

- [ ] **Step 3: Add failing UI-shell assertions**

Assert the dialog contains the live video, photo canvas, countdown status and the “无照片继续” action.

- [ ] **Step 4: Run UI-shell tests and verify RED**

Run: `node --test tests/ui-shell.test.mjs`

- [ ] **Step 5: Implement controller orchestration and UI**

Inject these defaults:

```js
getVideoSource = () => null,
capturePhoto = capturePhotoFrame,
posterSerializer = canvasToPosterBlob,
onPosterUploadRequest = async () => {},
```

The review confirm button dispatches `PHOTO_REQUEST`; in `photo-review` it dispatches `PHOTO_ACCEPTED`. A three-second timer updates `photoCountdownRemaining`, captures one frame, then dispatches `PHOTO_CAPTURED`. `PHOTO_RETAKE` clears the previous frame and restarts the timer. `PHOTO_SKIPPED` marks the poster as abstract and uploads. `DISCARD_REQUEST` clears photo data and timers.

`main.js` injects:

```js
getVideoSource: () => game.videoElement,
onPosterUploadRequest: (token, blob) => uploadRecordingPoster(token, blob),
```

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `node --test tests/recording-controller.test.mjs tests/ui-shell.test.mjs`

- [ ] **Step 7: Commit**

Run:

```bash
git add index.html styles.css RecordingController.js main.js tests/recording-controller.test.mjs tests/ui-shell.test.mjs
git commit -m "feat: add participant photo review flow"
```

### Task 3: Personalized poster renderer and browser client

**Files:**
- Modify: `share/qr.js`
- Modify: `share/recordings-client.js`
- Test: `tests/qr.test.mjs`
- Test: `tests/recordings-client.test.mjs`
- Test: `tests/recording-controller.test.mjs`

- [ ] **Step 1: Write failing poster renderer tests**

Assert `renderQr()` accepts `photo`, `durationMs`, and `checkinNumber`; the photo is cropped into the 1080 × 1040 cover, the QR lands in the lower ticket, and the title/number/duration text is drawn. Add an abstract-cover test for `photo: null`.

- [ ] **Step 2: Run poster tests and verify RED**

Run: `node --test tests/qr.test.mjs`

- [ ] **Step 3: Write failing client tests**

```js
await uploadRecordingPoster('a'.repeat(32), posterBlob, fetchImpl);
assert.equal(request.url, `/recordings-api/poster/${'a'.repeat(32)}`);
assert.equal(request.options.headers['content-type'], 'image/webp');
assert.equal(request.options.body, posterBlob);
```

Reject invalid tokens, unsupported poster MIME types and non-2xx responses.

- [ ] **Step 4: Run client tests and verify RED**

Run: `node --test tests/recordings-client.test.mjs`

- [ ] **Step 5: Implement the single-cover poster**

`renderQr()` keeps `POSTER_SIZE = 1080 × 1440` but moves the QR into the 1040–1440 ticket region. With a photo it draws a muted teal-tinted cover, grid, tracking path and rhythm nodes; without a photo it draws the same system over an abstract mint background. The ticket includes:

```text
这是我的现场单曲
你是本场第 0XX 位音乐玩家
TAKE 0XX · XX SEC
扫码试听与下载 · 24H
```

- [ ] **Step 6: Implement poster serialization and upload retry**

Serialize WebP at quality 0.86, retry at 0.78 if larger than 2 MB. After the audio upload returns a token, render the poster, serialize it, and call `onPosterUploadRequest`. Preserve `shareResult` after a poster upload failure so retrying does not create a second check-in number. Retry poster upload once before returning to `photo-review`.

- [ ] **Step 7: Run focused tests and verify GREEN**

Run: `node --test tests/qr.test.mjs tests/recordings-client.test.mjs tests/recording-controller.test.mjs`

- [ ] **Step 8: Commit**

Run:

```bash
git add share/qr.js share/recordings-client.js RecordingController.js tests/qr.test.mjs tests/recordings-client.test.mjs tests/recording-controller.test.mjs
git commit -m "feat: compose and upload personal share posters"
```

### Task 4: Persist posters with the recording service

**Files:**
- Modify: `services/recordings-api/storage.mjs`
- Modify: `services/recordings-api/server.mjs`
- Modify: `netlify/functions/recordings-api.mjs`
- Modify: `netlify.toml`
- Test: `services/recordings-api/storage.test.mjs`
- Test: `services/recordings-api/server.test.mjs`
- Test: `tests/recordings-proxy.test.mjs`

- [ ] **Step 1: Write failing storage tests**

Test that `putPoster(token, body, 'image/webp')` succeeds only for an existing unexpired token; `getPoster(token)` returns the same body/mime/expiry; oversize and unsupported images fail; cleanup removes the poster with its recording.

- [ ] **Step 2: Run storage tests and verify RED**

Run: `node --test services/recordings-api/storage.test.mjs`

- [ ] **Step 3: Write failing server and proxy route tests**

Cover:

```text
POST /v1/recordings/:token/poster
GET  /v1/recordings/:token/poster
POST /recordings-api/poster/:token
GET  /r/poster/:token
```

Verify signed paths, 2 MB limit, allowed MIME types, cache headers and 404/410 responses.

- [ ] **Step 4: Run route tests and verify RED**

Run: `node --test services/recordings-api/server.test.mjs tests/recordings-proxy.test.mjs`

- [ ] **Step 5: Implement poster persistence**

Add `MAX_POSTER_BYTES = 2 * 1024 * 1024`, allow `image/webp` and `image/jpeg`, write poster and metadata atomically, overwrite the prior poster for the same token, and remove poster files in expiry cleanup. Use the recording token as authorization through the already signed proxy.

- [ ] **Step 6: Implement signed proxy routes and redirect**

The Netlify Function must distinguish audio upload/download from poster upload/download, sign the exact upstream path, forward poster content type, and return `image/*` without range handling. Add `/r/poster/*` to `netlify.toml` before `/r/*`.

- [ ] **Step 7: Run storage/server/proxy tests and verify GREEN**

Run: `node --test services/recordings-api/storage.test.mjs services/recordings-api/server.test.mjs tests/recordings-proxy.test.mjs`

- [ ] **Step 8: Commit**

Run:

```bash
git add services/recordings-api/storage.mjs services/recordings-api/server.mjs netlify/functions/recordings-api.mjs netlify.toml services/recordings-api/storage.test.mjs services/recordings-api/server.test.mjs tests/recordings-proxy.test.mjs
git commit -m "feat: store expiring share poster images"
```

### Task 5: Mobile share-page poster download

**Files:**
- Modify: `r/index.html`
- Modify: `r/share.css`
- Modify: `r/share-page.js`
- Test: `tests/share-page.test.mjs`

- [ ] **Step 1: Write failing share-page tests**

Assert `posterUrlForToken(token)` returns `/r/poster/:token`, the stored poster download uses that endpoint, and a missing stored poster falls back to `renderQr()` for older recordings.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/share-page.test.mjs`

- [ ] **Step 3: Implement the mobile poster UI**

Add a hidden `<img id="share-poster">`. Reveal it on successful image load and wire “下载分享海报” to fetch the stored poster Blob. On image or download 404, preserve the existing generated poster fallback.

- [ ] **Step 4: Run the share-page test and verify GREEN**

Run: `node --test tests/share-page.test.mjs`

- [ ] **Step 5: Commit**

Run:

```bash
git add r/index.html r/share.css r/share-page.js tests/share-page.test.mjs
git commit -m "feat: show personal poster on mobile share page"
```

### Task 6: Full verification and browser smoke

**Files:**
- Modify: `scripts/browser-smoke.mjs` only if a stable photo-flow assertion is missing.
- Create: `docs/verification/2026-07-15-photo-share-poster.md`

- [ ] **Step 1: Run the full automated suite**

Run: `npm test`

Expected: all tests pass with zero failures.

- [ ] **Step 2: Run static checks**

Run:

```bash
git diff --check
node --check RecordingController.js
node --check recording/photo-capture.js
node --check share/qr.js
node --check share/recordings-client.js
node --check netlify/functions/recordings-api.mjs
node --check services/recordings-api/server.mjs
node --check services/recordings-api/storage.mjs
```

- [ ] **Step 3: Run the local app and browser smoke**

Run `npm start`, open `http://localhost:8000/`, and verify:

1. Existing invite/camera/audio startup remains usable.
2. A recorded take reaches the review card.
3. Confirm opens the 3–2–1 camera view.
4. Capture reaches photo review; retake and no-photo fallback work.
5. The final local poster is readable at desktop and 1365 × 768.
6. No new console errors occur.

Use a synthetic video/canvas test hook only in local smoke mode if physical camera automation cannot be controlled reliably.

- [ ] **Step 4: Verify API integration locally**

Start the recording service with a temporary data directory and test audio upload, poster upload, audio range playback and poster download through the signed proxy tests. Confirm cleanup removes both files.

- [ ] **Step 5: Record evidence**

Write the exact test counts, commands, screenshots, known limitations and preview URL to `docs/verification/2026-07-15-photo-share-poster.md`.

- [ ] **Step 6: Commit verification evidence**

Run:

```bash
git add docs/verification/2026-07-15-photo-share-poster.md scripts/browser-smoke.mjs
git commit -m "docs: verify participant photo sharing"
```
