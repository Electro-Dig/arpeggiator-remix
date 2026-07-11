# WAIC Poster, Counter, and Synthpop Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the exhibition guide and recording flow readable at a distance, produce an on-brand WAIC check-in poster with a real resettable participant number, and replace the two weak new scenes with 118–120 BPM synthpop loops.

**Architecture:** Keep all realtime hand-tracking and audio code unchanged. Add deterministic SVG assets and CSS-only layout changes on the client, extend the existing single-instance recording server with a serialized file-backed counter, and propagate `checkinNumber` through the existing upload/download headers into Canvas poster rendering. Generate one text-free bitmap template and continue drawing all QR and copy with Canvas for reliable scanning and typography.

**Tech Stack:** Vanilla ES modules, HTML/CSS, SVG, Canvas 2D, Node.js HTTP server and `node:test`, Netlify Functions/Edge Functions, browser smoke testing.

---

## File map

- `assets/guide/dual-hand-control.svg`: deterministic five-finger left/right control illustration.
- `assets/guide/record-thumbs.svg`: deterministic thumbs-up/thumbs-down recording illustration.
- `assets/qr-share-template-waic-mint.webp`: generated and compressed text-free WAIC poster background.
- `index.html`: recording review status block and shared layout structure.
- `styles.css`: guide readability, review card, responsive share layout, visible footer actions.
- `share/qr.js`: Canvas copy, check-in number and new template integration.
- `share/recordings-client.js`: validate and return `checkinNumber` from upload response.
- `RecordingController.js`: pass real number into UI and poster rendering.
- `r/share-page.js`: read check-in response header and render the same number on mobile/poster.
- `r/index.html`, `r/share.css`: mobile share-page check-in copy.
- `services/recordings-api/storage.mjs`: serialized persistent counter and recording metadata.
- `services/recordings-api/server.mjs`: check-in header and authenticated localhost reset endpoint.
- `scripts/reset-recording-counter.mjs`: safe onsite counter reset client.
- `netlify/functions/recordings-api.mjs`: forward the check-in header.
- `ops/recordings/arpeggiator-recordings.service`: inject the admin secret environment variable.
- `music/scenes.js`: two synthpop loops at 118 and 120 BPM.
- `tests/*.test.mjs`, `services/recordings-api/*.test.mjs`: TDD coverage.

### Task 1: Guide readability and anatomically correct SVGs

**Files:**
- Modify: `assets/guide/dual-hand-control.svg`
- Modify: `assets/guide/record-thumbs.svg`
- Modify: `styles.css:641-789`
- Modify: `tests/guide-model.test.mjs`
- Modify: `tests/ui-shell.test.mjs`

- [ ] **Step 1: Write failing SVG anatomy and typography tests**

Add file reads for both SVGs and assertions that each illustrated hand has five semantic finger markers:

```js
const fingerCount = (svg, hand) => (
  svg.match(new RegExp(`data-hand="${hand}" data-finger="`, 'g')) || []
).length;

assert.equal(fingerCount(dualHandSvg, 'left'), 5);
assert.equal(fingerCount(dualHandSvg, 'right'), 5);
assert.equal(fingerCount(thumbSvg, 'confirm'), 5);
assert.equal(fingerCount(thumbSvg, 'cancel'), 5);
assert.match(thumbSvg, /data-gesture="thumbs-up"/);
assert.match(thumbSvg, /data-gesture="thumbs-down"/);
assert.match(styles, /\.guide-card #guide-body\s*\{[^}]*font-size:\s*clamp\(18px,\s*1\.45vw,\s*22px\)/s);
assert.match(styles, /\.guide-action\s*\{[^}]*font-size:\s*16px/s);
```

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `node --test tests/guide-model.test.mjs tests/ui-shell.test.mjs`

Expected: FAIL because semantic finger markers and larger typography are absent.

- [ ] **Step 3: Replace the two SVG illustrations**

Draw each hand with five explicit path/circle groups. Add exactly these marker elements per hand without affecting rendering:

```svg
<g data-hand="left">
  <circle data-hand="left" data-finger="thumb" cx="0" cy="0" r="0"/>
  <circle data-hand="left" data-finger="index" cx="0" cy="0" r="0"/>
  <circle data-hand="left" data-finger="middle" cx="0" cy="0" r="0"/>
  <circle data-hand="left" data-finger="ring" cx="0" cy="0" r="0"/>
  <circle data-hand="left" data-finger="little" cx="0" cy="0" r="0"/>
</g>
```

Use `data-hand="right"` on the second control hand and `data-hand="confirm" data-gesture="thumbs-up"` / `data-hand="cancel" data-gesture="thumbs-down"` on the recording hands. Preserve the existing 640×480 viewBox and card palette.

- [ ] **Step 4: Increase guide text and action sizes**

Set the desktop values:

```css
.guide-card #guide-body { font-size: clamp(18px, 1.45vw, 22px); line-height: 1.75; }
.guide-card__notations span { font-size: 15px; }
.guide-card .guide-card__crowd { font-size: 15px; }
.guide-action { min-height: 54px; padding: 0 24px; font-size: 16px; }
#guide-progress { font-size: 15px; }
```

Keep the smallest responsive body text at 16 px.

- [ ] **Step 5: Run focused tests and commit**

Run: `node --test tests/guide-model.test.mjs tests/ui-shell.test.mjs`

Expected: PASS.

```bash
git add assets/guide/dual-hand-control.svg assets/guide/record-thumbs.svg styles.css tests/guide-model.test.mjs tests/ui-shell.test.mjs
git commit -m "fix: improve guide anatomy and readability"
```

### Task 2: Recording review and share-card layout

**Files:**
- Modify: `index.html:158-195`
- Modify: `styles.css:795-1030`
- Modify: `tests/ui-shell.test.mjs`
- Modify: `tests/recording-controller.test.mjs`

- [ ] **Step 1: Write failing shell assertions**

Assert that the audio element remains hidden and has no `controls`, the status panel exists, and shared state uses a bounded two-column body:

```js
assert.match(html, /<audio id="recording-preview" preload="metadata" hidden><\/audio>/);
assert.doesNotMatch(html, /id="recording-preview"[^>]*controls/);
assert.match(html, /id="recording-review-status"/);
assert.match(html, /id="recording-review-wave"/);
assert.match(styles, /\.recording-dialog\[data-phase="shared"\] \.recording-card__body\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*\.8fr\) minmax\(280px,\s*1\.2fr\)/s);
assert.match(styles, /\.recording-dialog\s*\{[^}]*max-height:\s*calc\(100dvh - 32px\)/s);
```

- [ ] **Step 2: Run tests and verify failure**

Run: `node --test tests/ui-shell.test.mjs tests/recording-controller.test.mjs`

Expected: FAIL on the old native controls and vertical shared layout.

- [ ] **Step 3: Replace the player with a static status module**

Use this structure in the review body:

```html
<section id="recording-review-status" class="recording-review-status" aria-label="录音已保存">
  <div id="recording-review-wave" class="recording-review-wave" aria-hidden="true">
    <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
  </div>
  <div><strong>录音已保存</strong><span>请选择生成二维码、重录或放弃</span></div>
</section>
<audio id="recording-preview" preload="metadata" hidden></audio>
```

Do not change blob URL assignment or cleanup in `RecordingController`.

- [ ] **Step 4: Implement bounded desktop and mobile layouts**

Use `max-height: calc(100dvh - 32px)` on the dialog. In shared state, use a two-column body and cap the poster preview at 420 px high. Keep `.recording-actions` inside the card grid and make every action at least 56 px tall. At widths below 760 px, switch to one column and cap the preview at 300 px.

- [ ] **Step 5: Run tests and commit**

Run: `node --test tests/ui-shell.test.mjs tests/recording-controller.test.mjs`

Expected: PASS.

```bash
git add index.html styles.css tests/ui-shell.test.mjs tests/recording-controller.test.mjs
git commit -m "feat: redesign recording review and share layout"
```

### Task 3: Generate and integrate the mint WAIC poster template

**Files:**
- Create: `assets/qr-share-template-waic-mint.webp`
- Modify: `share/qr.js`
- Modify: `netlify/edge-functions/invite-gate.js`
- Modify: `tests/qr.test.mjs`
- Modify: `tests/invite-gate.test.mjs`

- [ ] **Step 1: Write failing poster-copy tests**

Update the Canvas spy to assert the new template and exact dynamic copy:

```js
await renderQr(canvas, shareUrl, {
  loadQr,
  loadTemplate,
  createCanvas,
  checkinNumber: 27,
});
assert.deepEqual(fillTextCalls.map(([text]) => text), [
  'WAIC 双手乐队',
  '欢迎打卡',
  '你是本场第 027 位音乐玩家',
  'TAKE 027',
  '扫码试听与下载 · 24H',
]);
```

Also assert that `/assets/qr-share-template-waic-mint.webp` is a public invite-gate bypass.

- [ ] **Step 2: Run tests and verify failure**

Run: `node --test tests/qr.test.mjs tests/invite-gate.test.mjs`

Expected: FAIL because the old Bauhaus asset and project copy are still used.

- [ ] **Step 3: Generate the text-free template**

Inspect the existing reference with `view_image`, then use the explicitly requested `imagegen` skill as an edit. Preserve the square layout, QR safe zone, hand/music composition and paper texture; replace the palette with fog white, pale mint, deep teal, coral orange and limited warm yellow. Require no letters, words, numbers, QR modules or logos in the generated image. Compress the chosen output to WebP and store it as `assets/qr-share-template-waic-mint.webp`.

- [ ] **Step 4: Render precise copy in Canvas**

Change the public API to:

```js
export async function renderQr(canvas, value, {
  loadQr = loadDefaultQr,
  loadTemplate = loadDefaultTemplate,
  createCanvas = createDefaultCanvas,
  checkinNumber = 1,
} = {})
```

Format the number with `String(checkinNumber).padStart(3, '0')`, retain the 1080×1440 poster and draw the five approved lines below the 1080×1080 artwork.

- [ ] **Step 5: Run tests and commit**

Run: `node --test tests/qr.test.mjs tests/invite-gate.test.mjs`

Expected: PASS.

```bash
git add assets/qr-share-template-waic-mint.webp share/qr.js netlify/edge-functions/invite-gate.js tests/qr.test.mjs tests/invite-gate.test.mjs
git commit -m "feat: add WAIC check-in poster artwork"
```

### Task 4: Persistent serialized activity counter and reset endpoint

**Files:**
- Modify: `services/recordings-api/storage.mjs`
- Modify: `services/recordings-api/storage.test.mjs`
- Modify: `services/recordings-api/server.mjs`
- Modify: `services/recordings-api/server.test.mjs`
- Create: `scripts/reset-recording-counter.mjs`
- Modify: `ops/recordings/arpeggiator-recordings.service`
- Modify: `.env.example`

- [ ] **Step 1: Write failing storage tests**

Add tests that expect `put()` to return sequential values, preserve them in metadata, serialize concurrent writes, and reset:

```js
const [first, second, third] = await Promise.all([
  store.put(new Uint8Array([1]), 'audio/webm'),
  store.put(new Uint8Array([2]), 'audio/webm'),
  store.put(new Uint8Array([3]), 'audio/webm'),
]);
assert.deepEqual(
  [first.checkinNumber, second.checkinNumber, third.checkinNumber].sort((a, b) => a - b),
  [1, 2, 3],
);
await store.resetCounter(40);
assert.equal((await store.put(new Uint8Array([4]), 'audio/webm')).checkinNumber, 41);
```

Assert `store.get(token).checkinNumber` matches the upload result.

- [ ] **Step 2: Run storage tests and verify failure**

Run: `node --test services/recordings-api/storage.test.mjs`

Expected: FAIL because `checkinNumber` and `resetCounter()` do not exist.

- [ ] **Step 3: Implement the serialized counter**

Initialize `this.counterQueue = Promise.resolve()` in `RecordingStore`. Add a private queue helper and a `_activity-counter.json` file containing `{"value":27,"updatedAt":...}`. Under the queue, write the next value to a temporary file and atomically rename it, then include `checkinNumber` in recording metadata. If metadata writing fails, restore the previous counter value before rejecting.

Expose:

```js
async resetCounter(value = 0) {
  if (!Number.isSafeInteger(value) || value < 0) throw httpError('Bad counter', 400);
  return this.#withCounterLock(() => this.#writeCounter(value));
}
```

- [ ] **Step 4: Write failing server tests**

Test `x-recording-checkin-number` on GET and the localhost admin endpoint:

```js
const reset = await fetch(`${origin}/v1/admin/counter/reset`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-recordings-admin-key': adminSecret,
  },
  body: JSON.stringify({ value: 10 }),
});
assert.equal(reset.status, 200);
assert.deepEqual(await reset.json(), { value: 10 });
```

Also assert missing/wrong keys return 401 and do not alter the next number.

- [ ] **Step 5: Implement the reset route and script**

Extend `createRecordingServer` with `adminSecret`. Use `timingSafeEqual` after equal-length validation. Accept only `POST /v1/admin/counter/reset` with JSON `{ value: nonNegativeInteger }`. Add a CLI script that requires `RECORDINGS_ADMIN_SECRET` and POSTs to `http://127.0.0.1:8787/v1/admin/counter/reset`.

Add `EnvironmentFile=-/etc/arpeggiator-recordings.env` to the service if not already present and document `RECORDINGS_ADMIN_SECRET` in `.env.example`.

- [ ] **Step 6: Run service tests and commit**

Run: `node --test services/recordings-api/storage.test.mjs services/recordings-api/server.test.mjs`

Expected: PASS.

```bash
git add services/recordings-api/storage.mjs services/recordings-api/storage.test.mjs services/recordings-api/server.mjs services/recordings-api/server.test.mjs scripts/reset-recording-counter.mjs ops/recordings/arpeggiator-recordings.service .env.example
git commit -m "feat: add resettable recording check-in counter"
```

### Task 5: Propagate the check-in number through upload, poster, and mobile share

**Files:**
- Modify: `netlify/functions/recordings-api.mjs`
- Modify: `share/recordings-client.js`
- Modify: `RecordingController.js`
- Modify: `r/share-page.js`
- Modify: `r/index.html`
- Modify: `r/share.css`
- Modify: `tests/recordings-proxy.test.mjs`
- Modify: `tests/recordings-client.test.mjs`
- Modify: `tests/recording-controller.test.mjs`
- Modify: `tests/share-page.test.mjs`

- [ ] **Step 1: Write failing propagation tests**

Require upload JSON `{ token, expiresAt, checkinNumber: 27 }`, a `checkinNumber` property from `uploadRecording`, forwarding of `x-recording-checkin-number`, and poster rendering with the same number:

```js
assert.equal(result.checkinNumber, 27);
assert.equal(renderOptions.checkinNumber, 27);
assert.equal(probeResult.checkinNumber, 27);
```

Reject zero, negative, fractional or missing upload numbers as invalid server responses.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `node --test tests/recordings-proxy.test.mjs tests/recordings-client.test.mjs tests/recording-controller.test.mjs tests/share-page.test.mjs`

Expected: FAIL because the number is not forwarded or rendered.

- [ ] **Step 3: Forward and validate the number**

Forward `x-recording-checkin-number` on audio responses. In `uploadRecording`, require `Number.isSafeInteger(result.checkinNumber) && result.checkinNumber > 0` and return it unchanged.

- [ ] **Step 4: Integrate desktop and mobile UI**

Pass `{ checkinNumber: result.checkinNumber }` into `renderQr`. Add `#recording-checkin` to the shared desktop details. In `probeSharedRecording`, read and validate the header. Replace token-derived TAKE copy on the mobile share page with:

```js
checkin.textContent = `你是本场第 ${String(result.checkinNumber).padStart(3, '0')} 位音乐玩家`;
takeLabel.textContent = `TAKE ${String(result.checkinNumber).padStart(3, '0')}`;
```

Use the same number when the mobile page lazily downloads the poster.

- [ ] **Step 5: Run focused tests and commit**

Run: `node --test tests/recordings-proxy.test.mjs tests/recordings-client.test.mjs tests/recording-controller.test.mjs tests/share-page.test.mjs`

Expected: PASS.

```bash
git add netlify/functions/recordings-api.mjs share/recordings-client.js RecordingController.js r/share-page.js r/index.html r/share.css tests/recordings-proxy.test.mjs tests/recordings-client.test.mjs tests/recording-controller.test.mjs tests/share-page.test.mjs
git commit -m "feat: show real WAIC check-in numbers"
```

### Task 6: Replace the two weak scenes with synthpop loops

**Files:**
- Modify: `music/scenes.js`
- Modify: `tests/music-scenes.test.mjs`

- [ ] **Step 1: Write failing synthpop scene tests**

```js
const afterglow = getScene('afterglow-coast');
const blueHour = getScene('blue-hour-drift');
assert.equal(afterglow.bpm, 118);
assert.equal(blueHour.bpm, 120);
assert.equal(afterglow.sequence.length, 16);
assert.equal(blueHour.sequence.length, 16);
assert.ok(afterglow.sequence.filter(Number.isFinite).length >= 14);
assert.ok(blueHour.sequence.filter(Number.isFinite).length >= 13);
```

- [ ] **Step 2: Run tests and verify failure**

Run: `node --test tests/music-scenes.test.mjs`

Expected: FAIL on BPM 96 and 90.

- [ ] **Step 3: Implement the approved loops**

Use these deterministic 16-step sequences:

```js
// Afterglow Coast — D major-pentatonic, 118 BPM
sequence: [0, 4, 7, 9, 11, 9, 7, 4, 2, 4, 7, 11, 9, 7, 4, 2],
bass: [0, null, 0, null, 5, null, 7, null],

// Blue Hour Drift — A natural minor, 120 BPM
sequence: [0, 3, 7, 10, 12, 10, 7, 3, 5, 7, 10, 14, 12, 10, 7, 3],
bass: [0, null, 0, 0, 5, null, 7, null],
```

Keep scene IDs, names and the existing recognized variants unchanged: `['AFTERGLOW PAD', 'COASTAL PLUCK']` and `['BLUE HOUR KEYS', 'TAPE CHOIR']`.

- [ ] **Step 4: Run tests and commit**

Run: `node --test tests/music-scenes.test.mjs tests/music-routing-contract.test.mjs`

Expected: PASS.

```bash
git add music/scenes.js tests/music-scenes.test.mjs
git commit -m "feat: replace chill scenes with synthpop loops"
```

### Task 7: Full verification and Draft deployment

**Files:**
- Modify only if verification exposes an in-scope defect.
- Update: `docs/superpowers/plans/2026-07-12-waic-poster-counter-synthpop-polish.md` checkbox status.

- [ ] **Step 1: Run syntax and full automated tests**

Run:

```bash
node --check RecordingController.js
node --check share/qr.js
node --check r/share-page.js
node --check services/recordings-api/server.mjs
npm test
```

Expected: all checks pass and the full suite reports zero failures.

- [ ] **Step 2: Run local browser smoke**

Start the local server and use the in-app browser to capture:

1. All three guide cards at desktop size.
2. Recording review with no native scrubber.
3. Shared desktop state with visible discard action.
4. A narrow/mobile shared state.
5. Console with no new errors.

- [ ] **Step 3: Verify counter end to end**

Run the recording service tests, upload two sample recordings, verify consecutive numbers and audio range playback, reset to zero through `scripts/reset-recording-counter.mjs`, then verify the next successful upload returns `1`.

- [ ] **Step 4: Deploy only to the existing Netlify Draft**

Use the linked test site and verify the Draft URL, guide assets, public poster template, invite gate, recording upload, QR scan/share page and mobile poster download. Do not deploy to production and do not update `origin/main`.

- [ ] **Step 5: Commit verification documentation**

```bash
git add docs/superpowers/plans/2026-07-12-waic-poster-counter-synthpop-polish.md
git commit -m "docs: record WAIC polish verification"
```

Expected final state: clean test branch, full suite green, Draft smoke green, production untouched.
