# Adaptive Poster and Broadcast FX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the complete browser-frame aspect ratio in the poster and add two broadcast-safe, two-hand music effects.

**Architecture:** The capture layer derives its Canvas dimensions from the page snapshot, while the poster computes a contained image rectangle from the source ratio. A pure `BroadcastGestureController` converts two-hand height and vertical motion into a continuous reverb build plus a one-shot impact event; `AudioBus` owns the new audio nodes and reset behavior.

**Tech Stack:** Browser Canvas 2D, MediaPipe landmarks, Tone.js 15.1.22, Node test runner.

---

### Task 1: Preserve the browser-frame aspect ratio

**Files:**
- Modify: `recording/photo-capture.js`
- Test: `tests/photo-capture.test.mjs`

- [ ] Add a failing test asserting that a 1440×900 page snapshot creates a 1440×900 Canvas and is drawn from its complete source rectangle.
- [ ] Run `node --test tests/photo-capture.test.mjs`; expect the new assertion to fail because the Canvas is 1200×675.
- [ ] Derive the default target width and height from `captureSource`, falling back to the native video dimensions; use `contain` for the page layer.
- [ ] Run the focused test and expect all cases to pass.

### Task 2: Fit the full image into an adaptive poster window

**Files:**
- Modify: `share/poster-ticket.js`
- Modify: `share/qr.js`
- Test: `tests/qr.test.mjs`

- [ ] Add failing 4:3 and 16:10 tests for a pure `fitSourceWithinRect` helper and assert that poster `drawImage` uses the full source rectangle.
- [ ] Run `node --test tests/qr.test.mjs`; expect failure because the current stage is fixed at 968×544 and uses cover cropping.
- [ ] Add a 968×726 maximum stage region, contain the complete source inside it, and flow metadata below the computed image rectangle.
- [ ] Run the focused poster tests and expect all cases to pass.

### Task 3: Recognize broadcast-safe two-hand gestures

**Files:**
- Create: `music/broadcast-gestures.js`
- Create: `tests/broadcast-gestures.test.mjs`

- [ ] Write failing tests for continuous two-hand build, single-hand neutrality, armed fast-down impact, slow-down rejection, cooldown, and reset.
- [ ] Run `node --test tests/broadcast-gestures.test.mjs`; expect module-not-found failure.
- [ ] Implement `BroadcastGestureController.update(handsBySide, now)` returning `{ build, impact, phase }` with hold, velocity, timeout, and cooldown gates.
- [ ] Run the focused gesture tests and expect all cases to pass.

### Task 4: Add reverb and impact to the shared audio bus

**Files:**
- Modify: `audio/AudioBus.js`
- Modify: `MusicManager.js`
- Test: `tests/audio-effects-contract.test.mjs`
- Test: `tests/music-routing-contract.test.mjs`

- [ ] Add failing contract tests for a shared reverb node, `RVB` state, an impact synth connected before the limiter, and MusicManager proxy methods.
- [ ] Run the focused audio tests and confirm the new contracts fail.
- [ ] Add `Tone.Reverb`, a safe wet ramp capped below 50%, `Tone.MembraneSynth`, `setBroadcastBuild`, `triggerBroadcastImpact`, and reset support.
- [ ] Run the focused audio tests and expect them to pass.

### Task 5: Wire gestures into performance and operator feedback

**Files:**
- Modify: `game.js`
- Modify: `index.html`
- Modify: `StateManager.js`
- Test: `tests/performance-effects-integration.test.mjs`
- Test: `tests/ui-shell.test.mjs`

- [ ] Add failing integration tests requiring the controller, build/impact routing, reset paths, RVB HUD text, and two new operator mappings.
- [ ] Run the focused integration tests and confirm failure.
- [ ] Update `Game` to process the controller after hand normalization, proxy build/impact to MusicManager, reset on suppression/errors/stale tracking, and show short BUILD/IMPACT notices.
- [ ] Update the HUD and control deck copy.
- [ ] Run focused integration and UI tests and expect them to pass.

### Task 6: Verify and deploy Draft

**Files:**
- Verify all modified files.

- [ ] Run `npm.cmd test`; expect zero failures.
- [ ] Run `git diff --check` and `node --check` for changed JavaScript files; expect exit code 0.
- [ ] Publish a Netlify Draft with `netlify.cmd deploy --dir . --site 73fb80cc-cf94-46f6-8d1c-e8f11318b8e2 --json` (without `--prod`).
- [ ] Confirm the Draft URL reaches the existing invite gate and report it to the user.

