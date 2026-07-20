# Gesture Safety Switches Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an independent drum-kit gesture switch and fully gate recording gestures when disabled.

**Architecture:** `main.js` owns both advanced-setting inputs. `Game` owns the runtime drum-kit gesture state and resets its gesture recognizer when disabled. The recording hand-frame handler exits before recording intent mapping whenever its switch is off.

**Tech Stack:** Browser JavaScript, DOM controls, Node test runner, Netlify CLI.

---

### Task 1: Regression contracts

**Files:**
- Modify: `tests/ui-shell.test.mjs`
- Modify: `tests/rhythm-integration-contract.test.mjs`

- [ ] Add assertions for a checked `drum-kit-gestures-enabled` control, its change binding, and a disabled recording-gesture early return.
- [ ] Run both test files and confirm the new assertions fail.

### Task 2: Minimal implementation

**Files:**
- Modify: `index.html`
- Modify: `main.js`
- Modify: `game.js`

- [ ] Add the default-checked advanced setting.
- [ ] Add `Game.setDrumKitGestureEnabled(enabled)` and guard/reset `rightKitGesture` when disabled.
- [ ] Reset and return from the recording gesture path while disabled.
- [ ] Run focused tests and confirm they pass.

### Task 3: Verification and release

**Files:**
- Verify: all changed files

- [ ] Run `npm.cmd test` and require zero failures.
- [ ] Run `git diff --check`.
- [ ] Deploy production with `netlify.cmd deploy --prod --dir . --site 73fb80cc-cf94-46f6-8d1c-e8f11318b8e2 --json`.

