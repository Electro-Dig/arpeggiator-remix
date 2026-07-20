# Streamlined Recording and Share Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task with test-driven-development.

**Goal:** Replace the multi-confirmation recording/photo flow with an automatic first-frame cover and reliable gesture confirmation, while unifying timbre selection, correcting the distance filter, redesigning the poster/share dialog, and preventing HUD overlap.

**Architecture:** Keep `RecordingController` as the workflow owner, but reduce its state machine to recording/review/upload/share phases and inject live performance metadata from `main.js`. Put pure filter mapping/controller logic in `music/effect-controls.js`, make `MusicManager` the single timbre source of truth, and keep poster rendering deterministic in `share/qr.js`. UI structure stays in `index.html`/`styles.css` and is driven by existing state managers.

**Tech Stack:** Browser ES modules, Tone.js, MediaPipe gesture tracking, html2canvas, QRCode, Node.js built-in test runner, Netlify.

---

### Task 1: Collapse the recording and gesture-confirmation state machine

**Files:**
- Modify: `recording/recording-state.js`
- Modify: `RecordingController.js`
- Modify: `main.js`
- Test: `tests/recording-state.test.mjs`
- Test: `tests/recording-controller.test.mjs`

- [ ] Write failing state-machine tests proving review thumbs-up emits upload rather than photo, photo states are absent, upload failure returns to review, and a new review gate requires a short neutral rearm.
- [ ] Run the focused tests and confirm they fail for the old photo transition/latch behavior.
- [ ] Implement the reduced state graph and explicit review gesture feedback with a roughly 500ms neutral rearm.
- [ ] Run focused tests until green, then run all recording tests.

### Task 2: Capture a non-mirrored, uncropped first frame

**Files:**
- Modify: `recording/photo-capture.js`
- Modify: `RecordingController.js`
- Modify: `main.js`
- Test: `tests/photo-capture.test.mjs`
- Test: `tests/recording-controller.test.mjs`

- [ ] Write failing tests for aspect-ratio-preserving page capture, per-layer mirror behavior, first-frame capture, stale-generation protection, and screenshot fallback.
- [ ] Confirm the tests fail against the fixed 4:5 photo workflow.
- [ ] Prewarm the capture dependency, capture after recording starts on the first animation frame, cancel stale captures by generation, unmirror only the video clone, and mirror only the WebGL overlay.
- [ ] Remove photo countdown/review wiring while retaining a hidden cover canvas.
- [ ] Run focused capture/recording tests until green.

### Task 3: Unify the melody timbre library

**Files:**
- Modify: `MusicManager.js`
- Modify: `game.js`
- Modify: `StateManager.js`
- Modify: `index.html`
- Test: `tests/state-manager.test.mjs`
- Create or modify: `tests/music-manager.test.mjs`
- Modify: `tests/ui-shell.test.mjs`

- [ ] Write failing tests for the ordered 11-timbre library, `setTimbre`/`cycleTimbre`, scene changes preserving timbre, and the control-deck selector contract.
- [ ] Confirm failures against scene-local variants.
- [ ] Introduce global timbre identity/index APIs and route fist cycling plus selector changes through one setter.
- [ ] Keep HUD SYNTH and selector synchronized and remove relevant runtime references to scene-local timbre variants.
- [ ] Run music/state/UI tests until green.

### Task 4: Correct the two-hand low-pass interaction

**Files:**
- Modify: `music/effect-controls.js`
- Modify: `game.js`
- Test: `tests/effect-controls.test.mjs`
- Modify: `tests/performance-effects-integration.test.mjs`

- [ ] Write failing table-driven tests for 8%, 82%, and 100% curve anchors, monotonic smooth interpolation, 2.55/2.75 hysteresis, reset behavior, and time smoothing.
- [ ] Confirm current 1.5–6.0 linear mapping fails normal-distance expectations.
- [ ] Implement a per-Game low-pass gesture controller and feed it normalized palm distance plus elapsed time.
- [ ] Reset to full-open when tracking is lost or suppressed.
- [ ] Run effect unit and integration tests until green.

### Task 5: Rebuild the poster and compact share panel

**Files:**
- Modify: `share/qr.js`
- Modify: `RecordingController.js`
- Modify: `main.js`
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `recording/performance-snapshot.js`
- Test: `tests/qr.test.mjs`
- Modify: `tests/performance-snapshot.test.mjs`
- Modify: `tests/performance-snapshot-integration.test.mjs`
- Modify: `tests/ui-shell.test.mjs`

- [ ] Write failing tests for metadata snapshotting, deterministic per-take trace variation, ticket-poster labels, abstract cover fallback, and compact share DOM contracts.
- [ ] Confirm failures against the static fingerprint and large asymmetric layout.
- [ ] Capture Scene/Synth/Rhythm/BPM/Root/FX at recording start and pass it to poster generation.
- [ ] Render the live technical-ticket poster with landscape cover, metadata, unique trace, QR, and expiration.
- [ ] Recompose the share dialog to a 760–800px compact two-column layout and verify responsive stacking.
- [ ] Run poster/snapshot/UI tests until green.

### Task 6: Reflow the top HUD

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `StateManager.js`
- Test: `tests/ui-shell.test.mjs`
- Test: `tests/state-manager.test.mjs`

- [ ] Write failing markup/style contract tests for five primary metrics plus a separate FX strip and an unobstructed recording action.
- [ ] Confirm tests fail against the six-column status row.
- [ ] Split FX into its own strip and add desktop/narrow responsive constraints.
- [ ] Run UI/state tests until green.

### Task 7: Integrated verification and Draft deployment

**Files:**
- Modify: `docs/verification/2026-07-17-streamlined-recording-share.md`

- [ ] Run all Node tests and syntax checks from a fresh command.
- [ ] Inspect the final diff for accidental changes, stale photo-flow references, placeholder copy, and secrets.
- [ ] Start the local site and verify desktop plus mobile: HUD clearance, review gate messaging, timbre synchronization, filter display, poster proportions, and compact share layout.
- [ ] Deploy a Netlify Draft only, verify it is ready, and confirm the production deploy ID did not change.
- [ ] Record exact commands, results, limitations, and the Draft URL in the verification note.

