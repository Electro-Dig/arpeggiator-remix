# Folk Song Preset Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four canonical Chinese folk-song melody scenes and rebalance percussion behaviour without changing the existing hand-gesture interaction grammar.

**Architecture:** Keep the runtime architecture intact. Extend `PerformanceScenes.js` into the authoritative scene library with canonical melody metadata and scene step intervals, then teach `MusicManager.js` to use those scene-specific timing values. Preserve the current finger-to-sample mapping while reshaping labels, drum patterns, and default drum blend.

**Tech Stack:** Vanilla ESM JavaScript, Tone.js runtime, Node built-in test runner for data-level regression checks.

---

### Task 1: Add scene-library regression tests

**Files:**
- Create: `tests/performance-scenes.test.mjs`
- Modify: `package.json`

- [ ] Add a Node test script and a failing test file that expects canonical folk-song scenes, notation conversion, and 16-step drum patterns.
- [ ] Run `node --test tests/performance-scenes.test.mjs` and confirm it fails because the helper/scene metadata does not exist yet.

### Task 2: Expand `PerformanceScenes.js`

**Files:**
- Modify: `PerformanceScenes.js`

- [ ] Add a numbered-notation-to-interval helper.
- [ ] Add four canonical folk-song scenes with metadata, melody source links, melody degrees, converted interval sequences, step interval, scales, synth presets, and redesigned drum patterns.
- [ ] Keep the four atmospheric scenes after the new folk-song scenes.

### Task 3: Honour scene timing in `MusicManager.js`

**Files:**
- Modify: `MusicManager.js`

- [ ] Initialise the active synth from the first selected scene.
- [ ] Let patterns use per-scene `stepInterval` and base note duration instead of hard-coded `16n`.

### Task 4: Clarify finger percussion roles and rebalance defaults

**Files:**
- Modify: `FingerElements.js`
- Modify: `DrumManager.js`

- [ ] Keep the finger-to-drum/sample mapping unchanged.
- [ ] Update role labels/semantics and rebalance default drum volumes for the current sample set.

### Task 5: Verify

**Files:**
- Modify: `README.md` (only if scene names/examples need refresh)

- [ ] Run `node --test tests/performance-scenes.test.mjs`.
- [ ] Run `node --check PerformanceScenes.js MusicManager.js DrumManager.js FingerElements.js`.
- [ ] If needed, run a local smoke test via `node server.js` and verify the page still serves successfully.
