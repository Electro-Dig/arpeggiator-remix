# Duo Mix Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an optional Duo Mix mode where the left side keeps melody plus drum performance controls and the right side controls delay, reverb, and filter, while preserving the current single-player mode as the default.

**Architecture:** Add small Duo-specific modules under `duo/` for role assignment, effect mapping, and mode orchestration. Integrate those modules into `game.js` behind an explicit mode flag so the existing single-player path continues to run unless Duo Mix is enabled. Add audio effect setters to `MusicManager.js` and a lightweight split overlay in `index.html` / `styles.css`.

**Tech Stack:** Browser ES modules, MediaPipe HandLandmarker, Three.js overlay rendering, Tone.js/Web Audio, Node's built-in test runner.

---

## Scope

This plan implements the playable Duo Mix mode only. Recording is intentionally kept as a separate follow-up plan because it needs its own visual/audio capture pipeline and should not be mixed with four-hand performance debugging.

## File Structure

- Create `duo/HandRoleAssigner.js`: Pure role assignment state machine for performer/mixer hand roles.
- Create `duo/MixerParameterMapper.js`: Pure mapping functions for filter, reverb, delay, and smoothing.
- Create `duo/DuoModeController.js`: Mode state and routing coordinator with injectable performer/mixer handlers.
- Create `tests/hand-role-assigner.test.mjs`: Unit tests for side partitioning, dead zone, hold lock, and lost-hand release.
- Create `tests/mixer-parameter-mapper.test.mjs`: Unit tests for clamped/logarithmic effect mappings.
- Create `tests/duo-mode-controller.test.mjs`: Unit tests that disabled mode is inert and enabled mode routes role assignments.
- Modify `index.html`: Add Duo Mix mode toggle and overlay DOM shell near the existing bottom control bar.
- Modify `styles.css`: Add split-line overlay, role labels, effect meters, and fix the existing compact mode button text overflow.
- Modify `MusicManager.js`: Add filter node and safe effect setters.
- Modify `game.js`: Add Duo mode initialization, hand slot expansion, hand tracker reconfiguration, single/duo routing, mixer effect control, and overlay updates.
- Modify `main.js`: Wire the Duo Mix toggle button to `game.setDuoModeEnabled()`.

## Task 1: Pure Role Assignment Module

**Files:**
- Create: `duo/HandRoleAssigner.js`
- Test: `tests/hand-role-assigner.test.mjs`

- [ ] **Step 1: Write failing role assignment tests**

Create `tests/hand-role-assigner.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';

import { HandRoleAssigner } from '../duo/HandRoleAssigner.js';

function hand(id, x, y = 0.5) {
  return {
    id,
    trackingIndex: id,
    palm: { x, y },
    landmarks: Array.from({ length: 21 }, () => ({ x, y, z: 0 })),
  };
}

test('locks performer and mixer roles after hold time', () => {
  const assigner = new HandRoleAssigner({
    leftMaxX: 0.47,
    rightMinX: 0.53,
    holdMs: 500,
    lostMs: 1000,
  });

  let result = assigner.update([hand(0, 0.2), hand(1, 0.35), hand(2, 0.65), hand(3, 0.8)], 1000);
  assert.equal(result.roles.performerMelody, null);
  assert.equal(result.roles.performerDrums, null);
  assert.equal(result.roles.mixerFilter, null);
  assert.equal(result.roles.mixerSpace, null);

  result = assigner.update([hand(0, 0.2), hand(1, 0.35), hand(2, 0.65), hand(3, 0.8)], 1600);
  assert.equal(result.roles.performerMelody.trackingIndex, 0);
  assert.equal(result.roles.performerDrums.trackingIndex, 1);
  assert.equal(result.roles.mixerFilter.trackingIndex, 2);
  assert.equal(result.roles.mixerSpace.trackingIndex, 3);
});

test('keeps locked roles through the center dead zone', () => {
  const assigner = new HandRoleAssigner({ holdMs: 0, lostMs: 1000 });

  assigner.update([hand(0, 0.2), hand(1, 0.65)], 1000);
  const result = assigner.update([hand(0, 0.5), hand(1, 0.5)], 1200);

  assert.equal(result.roles.performerMelody.trackingIndex, 0);
  assert.equal(result.roles.mixerFilter.trackingIndex, 1);
  assert.deepEqual(result.waiting.deadZone.map((entry) => entry.trackingIndex), [0, 1]);
});

test('releases roles after lost timeout', () => {
  const assigner = new HandRoleAssigner({ holdMs: 0, lostMs: 500 });

  let result = assigner.update([hand(0, 0.2), hand(1, 0.65)], 1000);
  assert.equal(result.roles.performerMelody.trackingIndex, 0);
  assert.equal(result.roles.mixerFilter.trackingIndex, 1);

  result = assigner.update([], 1300);
  assert.equal(result.roles.performerMelody.trackingIndex, 0);
  assert.equal(result.roles.mixerFilter.trackingIndex, 1);

  result = assigner.update([], 1700);
  assert.equal(result.roles.performerMelody, null);
  assert.equal(result.roles.mixerFilter, null);
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run:

```powershell
npm.cmd test -- tests/hand-role-assigner.test.mjs
```

Expected: FAIL with a module resolution error for `../duo/HandRoleAssigner.js`.

- [ ] **Step 3: Implement `HandRoleAssigner`**

Create `duo/HandRoleAssigner.js`:

```js
const DEFAULT_OPTIONS = {
  leftMaxX: 0.47,
  rightMinX: 0.53,
  holdMs: 700,
  lostMs: 1500,
};

const ROLE_ORDER = {
  performer: ['performerMelody', 'performerDrums'],
  mixer: ['mixerFilter', 'mixerSpace'],
};

function emptyRoles() {
  return {
    performerMelody: null,
    performerDrums: null,
    mixerFilter: null,
    mixerSpace: null,
  };
}

function normalizeHand(input) {
  const palm = input.palm || input.anchor || input.landmarks?.[9] || { x: 0.5, y: 0.5 };
  return {
    id: input.id ?? input.trackingIndex,
    trackingIndex: input.trackingIndex,
    palm: { x: palm.x, y: palm.y },
    landmarks: input.landmarks || [],
    raw: input.raw || input,
  };
}

function sideForHand(hand, options) {
  if (hand.palm.x < options.leftMaxX) return 'performer';
  if (hand.palm.x > options.rightMinX) return 'mixer';
  return 'deadZone';
}

export class HandRoleAssigner {
  constructor(options = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.roles = emptyRoles();
    this.pending = new Map();
    this.lastSeenByRole = new Map();
    this.lockedSideByHandId = new Map();
  }

  reset() {
    this.roles = emptyRoles();
    this.pending.clear();
    this.lastSeenByRole.clear();
    this.lockedSideByHandId.clear();
  }

  update(inputHands, nowMs = performance.now()) {
    const hands = inputHands.map(normalizeHand);
    const handsById = new Map(hands.map((hand) => [hand.id, hand]));
    const grouped = { performer: [], mixer: [], deadZone: [] };

    for (const hand of hands) {
      const lockedSide = this.lockedSideByHandId.get(hand.id);
      const side = sideForHand(hand, this.options);
      if (side === 'deadZone' && lockedSide) {
        grouped[lockedSide].push(hand);
        grouped.deadZone.push(hand);
      } else if (side === 'deadZone') {
        grouped.deadZone.push(hand);
      } else {
        grouped[side].push(hand);
      }
    }

    this.releaseLostRoles(handsById, nowMs);
    this.assignSide('performer', grouped.performer, nowMs);
    this.assignSide('mixer', grouped.mixer, nowMs);

    return {
      roles: { ...this.roles },
      waiting: {
        performer: grouped.performer,
        mixer: grouped.mixer,
        deadZone: grouped.deadZone,
      },
    };
  }

  releaseLostRoles(handsById, nowMs) {
    for (const role of Object.keys(this.roles)) {
      const hand = this.roles[role];
      if (!hand) continue;
      if (handsById.has(hand.id)) {
        this.lastSeenByRole.set(role, nowMs);
        continue;
      }

      const lastSeen = this.lastSeenByRole.get(role) ?? nowMs;
      if (nowMs - lastSeen > this.options.lostMs) {
        this.lockedSideByHandId.delete(hand.id);
        this.roles[role] = null;
        this.lastSeenByRole.delete(role);
      }
    }
  }

  assignSide(side, hands, nowMs) {
    const sortedHands = [...hands].sort((a, b) => a.palm.x - b.palm.x);
    const roleNames = ROLE_ORDER[side];

    for (let i = 0; i < roleNames.length; i += 1) {
      const role = roleNames[i];
      const current = this.roles[role];
      if (current && sortedHands.some((hand) => hand.id === current.id)) {
        const updated = sortedHands.find((hand) => hand.id === current.id);
        this.roles[role] = updated;
        this.lastSeenByRole.set(role, nowMs);
        continue;
      }

      if (current) continue;

      const candidate = sortedHands.find((hand) => !Object.values(this.roles).some((locked) => locked?.id === hand.id));
      if (!candidate) continue;

      const pendingKey = `${role}:${candidate.id}`;
      const firstSeen = this.pending.get(pendingKey) ?? nowMs;
      this.pending.set(pendingKey, firstSeen);

      if (nowMs - firstSeen >= this.options.holdMs) {
        this.roles[role] = candidate;
        this.lastSeenByRole.set(role, nowMs);
        this.lockedSideByHandId.set(candidate.id, side);
      }
    }
  }
}
```

- [ ] **Step 4: Run the focused tests**

Run:

```powershell
npm.cmd test -- tests/hand-role-assigner.test.mjs
```

Expected: PASS for all 3 role assignment tests.

- [ ] **Step 5: Run the full test suite**

Run:

```powershell
npm.cmd test
```

Expected: existing invite tests plus role assignment tests pass.

- [ ] **Step 6: Commit**

```powershell
git add duo/HandRoleAssigner.js tests/hand-role-assigner.test.mjs
git commit -m "Add Duo hand role assigner"
```

## Task 2: Mixer Parameter Mapping

**Files:**
- Create: `duo/MixerParameterMapper.js`
- Test: `tests/mixer-parameter-mapper.test.mjs`

- [ ] **Step 1: Write failing mapping tests**

Create `tests/mixer-parameter-mapper.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clamp01,
  mapDelayFromDistance,
  mapFilterCutoff,
  mapReverbWet,
  smoothValue,
} from '../duo/MixerParameterMapper.js';

test('clamp01 bounds normalized values', () => {
  assert.equal(clamp01(-1), 0);
  assert.equal(clamp01(0.25), 0.25);
  assert.equal(clamp01(2), 1);
});

test('filter cutoff uses a logarithmic musical range', () => {
  assert.equal(Math.round(mapFilterCutoff(0)), 300);
  assert.equal(Math.round(mapFilterCutoff(1)), 8000);
  const middle = mapFilterCutoff(0.5);
  assert.ok(middle > 1400 && middle < 1700);
});

test('reverb and delay mappings stay within safe wet ranges', () => {
  assert.equal(mapReverbWet(0), 0.05);
  assert.equal(mapReverbWet(1), 0.55);
  assert.deepEqual(mapDelayFromDistance(0), { wet: 0, feedback: 0.15 });
  assert.deepEqual(mapDelayFromDistance(1), { wet: 0.45, feedback: 0.65 });
});

test('smoothValue moves partially toward target', () => {
  assert.equal(smoothValue(0, 1, 0.2), 0.2);
  assert.equal(smoothValue(10, 0, 0.5), 5);
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run:

```powershell
npm.cmd test -- tests/mixer-parameter-mapper.test.mjs
```

Expected: FAIL with a module resolution error for `../duo/MixerParameterMapper.js`.

- [ ] **Step 3: Implement pure mapping helpers**

Create `duo/MixerParameterMapper.js`:

```js
export function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function mapLinear(value, min, max) {
  const t = clamp01(value);
  return min + (max - min) * t;
}

export function mapExponential(value, min, max) {
  const t = clamp01(value);
  return min * Math.pow(max / min, t);
}

export function mapFilterCutoff(normX) {
  return mapExponential(normX, 300, 8000);
}

export function mapReverbWet(normY) {
  return Number(mapLinear(1 - clamp01(normY), 0.05, 0.55).toFixed(4));
}

export function mapDelayFromDistance(normDistance) {
  return {
    wet: Number(mapLinear(normDistance, 0, 0.45).toFixed(4)),
    feedback: Number(mapLinear(normDistance, 0.15, 0.65).toFixed(4)),
  };
}

export function smoothValue(current, target, factor = 0.2) {
  const t = clamp01(factor);
  return current + (target - current) * t;
}
```

- [ ] **Step 4: Run the focused tests**

Run:

```powershell
npm.cmd test -- tests/mixer-parameter-mapper.test.mjs
```

Expected: PASS for all mapping tests.

- [ ] **Step 5: Run the full test suite**

Run:

```powershell
npm.cmd test
```

Expected: all current tests pass.

- [ ] **Step 6: Commit**

```powershell
git add duo/MixerParameterMapper.js tests/mixer-parameter-mapper.test.mjs
git commit -m "Add Duo mixer parameter mapping"
```

## Task 3: Duo Mode Controller

**Files:**
- Create: `duo/DuoModeController.js`
- Test: `tests/duo-mode-controller.test.mjs`

- [ ] **Step 1: Write failing controller tests**

Create `tests/duo-mode-controller.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';

import { DuoModeController } from '../duo/DuoModeController.js';

function hand(id, x, y = 0.5) {
  return {
    id,
    trackingIndex: id,
    palm: { x, y },
    landmarks: Array.from({ length: 21 }, () => ({ x, y, z: 0 })),
  };
}

test('disabled Duo controller is inert', () => {
  const events = [];
  const controller = new DuoModeController({
    handlePerformerMelody: (payload) => events.push(['melody', payload]),
    handlePerformerDrums: (payload) => events.push(['drums', payload]),
    handleMixer: (payload) => events.push(['mixer', payload]),
  });

  const result = controller.update([hand(0, 0.2), hand(1, 0.7)], 1000);

  assert.equal(result.enabled, false);
  assert.deepEqual(events, []);
});

test('enabled Duo controller routes locked roles', () => {
  const events = [];
  const controller = new DuoModeController({
    assignerOptions: { holdMs: 0, lostMs: 1000 },
    handlePerformerMelody: (payload) => events.push(['melody', payload.hand.trackingIndex]),
    handlePerformerDrums: (payload) => events.push(['drums', payload.hand.trackingIndex]),
    handleMixer: (payload) => events.push(['mixer', payload.roles.mixerFilter.trackingIndex, payload.roles.mixerSpace.trackingIndex]),
  });

  controller.setEnabled(true);
  const result = controller.update([hand(0, 0.2), hand(1, 0.4), hand(2, 0.6), hand(3, 0.8)], 1000);

  assert.equal(result.enabled, true);
  assert.deepEqual(events, [
    ['melody', 0],
    ['drums', 1],
    ['mixer', 2, 3],
  ]);
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run:

```powershell
npm.cmd test -- tests/duo-mode-controller.test.mjs
```

Expected: FAIL with a module resolution error for `../duo/DuoModeController.js`.

- [ ] **Step 3: Implement the controller**

Create `duo/DuoModeController.js`:

```js
import { HandRoleAssigner } from './HandRoleAssigner.js';

function noop() {}

export class DuoModeController {
  constructor({
    assignerOptions,
    handlePerformerMelody = noop,
    handlePerformerDrums = noop,
    handleMixer = noop,
    handleOverlay = noop,
  } = {}) {
    this.enabled = false;
    this.assigner = new HandRoleAssigner(assignerOptions);
    this.handlePerformerMelody = handlePerformerMelody;
    this.handlePerformerDrums = handlePerformerDrums;
    this.handleMixer = handleMixer;
    this.handleOverlay = handleOverlay;
  }

  setEnabled(nextEnabled) {
    const enabled = Boolean(nextEnabled);
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    this.assigner.reset();
  }

  isEnabled() {
    return this.enabled;
  }

  update(hands, nowMs = performance.now(), context = {}) {
    if (!this.enabled) {
      return {
        enabled: false,
        roles: {
          performerMelody: null,
          performerDrums: null,
          mixerFilter: null,
          mixerSpace: null,
        },
        waiting: { performer: [], mixer: [], deadZone: [] },
      };
    }

    const assignment = this.assigner.update(hands, nowMs);
    const { roles } = assignment;

    if (roles.performerMelody) {
      this.handlePerformerMelody({ hand: roles.performerMelody, roles, context });
    }
    if (roles.performerDrums) {
      this.handlePerformerDrums({ hand: roles.performerDrums, roles, context });
    }
    if (roles.mixerFilter || roles.mixerSpace) {
      this.handleMixer({ roles, context });
    }

    this.handleOverlay({ ...assignment, context });
    return { enabled: true, ...assignment };
  }
}
```

- [ ] **Step 4: Run the focused tests**

Run:

```powershell
npm.cmd test -- tests/duo-mode-controller.test.mjs
```

Expected: PASS for both controller tests.

- [ ] **Step 5: Run the full test suite**

Run:

```powershell
npm.cmd test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```powershell
git add duo/DuoModeController.js tests/duo-mode-controller.test.mjs
git commit -m "Add Duo mode controller"
```

## Task 4: Duo Toggle And Split Overlay Shell

**Files:**
- Modify: `index.html:127-185`
- Modify: `styles.css:264-294`
- Modify: `main.js:195-210`

- [ ] **Step 1: Add the UI shell in `index.html`**

Insert the Duo toggle beside the existing simple mode button inside `#custom-editor-buttons`:

```html
<button id="toggle-duo-mode" class="custom-btn mode-text-btn" title="双人混音模式：左侧演奏，右侧混音">
    Duo
</button>
```

Add this overlay shell immediately after `#info-text`:

```html
<div id="duo-overlay" class="duo-overlay" aria-hidden="true">
    <div class="duo-split-line"></div>
    <div class="duo-side-label duo-side-label-left">
        <strong>PERFORMER</strong>
        <span>Melody + Drums</span>
    </div>
    <div class="duo-side-label duo-side-label-right">
        <strong>MIXER</strong>
        <span>Delay / Reverb / Filter</span>
    </div>
    <div id="duo-effect-meters" class="duo-effect-meters">
        <div class="duo-meter"><span>Filter</span><i id="duo-filter-meter"></i></div>
        <div class="duo-meter"><span>Reverb</span><i id="duo-reverb-meter"></i></div>
        <div class="duo-meter"><span>Delay</span><i id="duo-delay-meter"></i></div>
    </div>
</div>
```

- [ ] **Step 2: Add styles in `styles.css`**

Append these styles near the custom button styles:

```css
.mode-text-btn {
    width: auto;
    min-width: 54px;
    padding: 0 12px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 700;
    line-height: 1;
}

.duo-overlay {
    position: absolute;
    inset: 0;
    z-index: 60;
    pointer-events: none;
    opacity: 0;
    transition: opacity 180ms ease;
}

.duo-overlay.active {
    opacity: 1;
}

.duo-split-line {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 2px;
    transform: translateX(-50%);
    background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.55), transparent);
    box-shadow: 0 0 18px rgba(123, 67, 148, 0.45);
}

.duo-side-label {
    position: absolute;
    top: 92px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 8px 12px;
    border-radius: 8px;
    color: white;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(8px);
    font-size: 12px;
}

.duo-side-label-left {
    left: 24px;
    border-left: 3px solid #4fd1c7;
}

.duo-side-label-right {
    right: 24px;
    border-right: 3px solid #f6ad55;
    text-align: right;
}

.duo-effect-meters {
    position: absolute;
    right: 24px;
    bottom: 148px;
    width: 160px;
    display: grid;
    gap: 8px;
}

.duo-meter {
    display: grid;
    grid-template-columns: 52px 1fr;
    align-items: center;
    gap: 8px;
    color: white;
    font-size: 11px;
}

.duo-meter i {
    display: block;
    height: 8px;
    width: 0%;
    border-radius: 999px;
    background: linear-gradient(90deg, #7b4394, #f6ad55);
}
```

- [ ] **Step 3: Wire the toggle in `main.js`**

After the existing simple-mode listener, add:

```js
const duoModeBtn = document.getElementById('toggle-duo-mode');
if (duoModeBtn && game) {
    duoModeBtn.addEventListener('click', async () => {
        const nextEnabled = !game.isDuoModeEnabled?.();
        if (game.setDuoModeEnabled) {
            await game.setDuoModeEnabled(nextEnabled);
        }
        duoModeBtn.classList.toggle('active', nextEnabled);
        duoModeBtn.textContent = nextEnabled ? 'Solo' : 'Duo';
        duoModeBtn.title = nextEnabled ? '返回单人模式' : '双人混音模式：左侧演奏，右侧混音';
    });
}
```

- [ ] **Step 4: Run tests**

Run:

```powershell
npm.cmd test
```

Expected: all tests pass. UI code is not executed by Node tests, but this verifies imports still load.

- [ ] **Step 5: Run local server for manual UI smoke**

Run:

```powershell
npm.cmd start
```

Open `http://localhost:8000` or the URL printed by `server.js`. Verify the Duo button is visible and the existing single mode still loads.

- [ ] **Step 6: Commit**

```powershell
git add index.html styles.css main.js
git commit -m "Add Duo mode UI shell"
```

## Task 5: Audio Effect Setters In MusicManager

**Files:**
- Modify: `MusicManager.js:438-453`
- Modify: `MusicManager.js:748-790`

- [ ] **Step 1: Add a minimal test seam by documenting expected setters**

No Node test should import `MusicManager.js` because it imports Tone from a remote URL. Use the existing browser runtime for manual verification after implementation. The testable parameter ranges are covered by `MixerParameterMapper`.

- [ ] **Step 2: Insert the filter node in the synth audio chain**

In `MusicManager.start()`, replace:

```js
_this.stereoDelay = new Tone.FeedbackDelay("8n", 0.5).connect(_this.reverb);
_this.stereoDelay.wet.value = 0;
_this.analyser = new Tone.Analyser('waveform', 1024);
_this.polySynth = new Tone.PolySynth(Tone.FMSynth, _this.synthPresets[_this.currentSynthIndex]);
_this.polySynth.connect(_this.analyser);
_this.analyser.connect(_this.stereoDelay);
```

with:

```js
_this.stereoDelay = new Tone.FeedbackDelay("8n", 0.5).connect(_this.reverb);
_this.stereoDelay.wet.value = 0;
_this.mixFilter = new Tone.Filter(8000, 'lowpass');
_this.mixFilter.frequency.value = 8000;
_this.analyser = new Tone.Analyser('waveform', 1024);
_this.polySynth = new Tone.PolySynth(Tone.FMSynth, _this.synthPresets[_this.currentSynthIndex]);
_this.polySynth.connect(_this.analyser);
_this.analyser.connect(_this.mixFilter);
_this.mixFilter.connect(_this.stereoDelay);
```

- [ ] **Step 3: Preserve the filter chain when synths are recreated**

In both `cycleSynth()` and `_updateSynth()`, keep:

```js
this.polySynth.connect(this.analyser);
```

Do not reconnect the analyser in those methods. The analyser-to-filter-to-delay chain is created once in `start()`.

- [ ] **Step 4: Add effect setter methods near existing delay setters**

Add these methods before `setNoteLengthLevel`:

```js
,
{
    key: "setFilterCutoff",
    value: function setFilterCutoff(frequency) {
        var clamped = Math.max(300, Math.min(8000, Number(frequency) || 8000));
        this.filterCutoff = clamped;
        if (this.mixFilter) {
            this.mixFilter.frequency.value = clamped;
        }
    }
}
,
{
    key: "setReverbWet",
    value: function setReverbWet(wet) {
        var clamped = Math.max(0, Math.min(1, Number(wet) || 0));
        this.reverbWetManual = clamped;
        if (this.reverb) {
            this.reverb.wet.value = clamped;
        }
    }
}
,
{
    key: "setDelayFeedback",
    value: function setDelayFeedback(feedback) {
        var clamped = Math.max(0, Math.min(0.95, Number(feedback) || 0));
        this.delayFeedbackManual = clamped;
        if (this.stereoDelay) {
            this.stereoDelay.feedback.value = clamped;
        }
    }
}
```

- [ ] **Step 5: Run tests**

Run:

```powershell
npm.cmd test
```

Expected: all Node tests pass.

- [ ] **Step 6: Manual audio smoke**

Run:

```powershell
npm.cmd start
```

Open the app, activate audio, then in browser DevTools run:

```js
window.game.musicManager.setFilterCutoff(500);
window.game.musicManager.setReverbWet(0.5);
window.game.musicManager.setDelayWet(0.35);
window.game.musicManager.setDelayFeedback(0.45);
```

Expected: no console errors, filter darkens the synth, reverb/delay become audible.

- [ ] **Step 7: Commit**

```powershell
git add MusicManager.js
git commit -m "Add controllable mixer effects"
```

## Task 6: Game-Level Duo Mode State And Hand Limit Switching

**Files:**
- Modify: `game.js:216-224`
- Modify: `game.js:330-356`
- Modify: `game.js:460-518`
- Modify: `game.js:680-722`

- [ ] **Step 1: Import Duo modules**

At the top of `game.js`, add:

```js
import { DuoModeController } from './duo/DuoModeController.js';
import {
    mapDelayFromDistance,
    mapFilterCutoff,
    mapReverbWet,
    smoothValue
} from './duo/MixerParameterMapper.js';
```

- [ ] **Step 2: Add Duo state in the constructor**

Near `this.simpleMode = false`, add:

```js
this.duoModeEnabled = false;
this.trackingHandLimit = 2;
this.duoEffectState = {
    filterCutoff: 8000,
    reverbWet: 0.05,
    delayWet: 0,
    delayFeedback: 0.15
};
this.duoModeController = null;
```

- [ ] **Step 3: Replace the two-slot hand setup with a helper**

In `_setupThree()`, replace the `for (var i = 0; i < 2; i++)` hand setup block with:

```js
this._ensureHandSlots(2);
this.handsInitialized = true;
console.log('Hands slots initialized:', this.hands.length);
```

Add a new method before `_setupHandTracking`:

```js
{
    key: "_ensureHandSlots",
    value: function _ensureHandSlots(count) {
        while (this.hands.length < count) {
            var lineGroup = new THREE.Group();
            lineGroup.visible = false;
            this.scene.add(lineGroup);
            this.hands.push({
                landmarks: null,
                anchorPos: new THREE.Vector3(),
                lineGroup: lineGroup,
                isFist: false,
                wasAllFingersUp: false,
                wasFist: false,
                wasPalmFacingAway: false,
                wasFourFingersVertical: false,
                lastFistTime: 0,
                lastGestureChangeTime: 0
            });
        }
        while (this.lastLandmarkPositions.length < count) {
            this.lastLandmarkPositions.push(null);
        }
    }
}
```

- [ ] **Step 4: Add hand tracker creation helper**

Extract HandLandmarker creation into:

```js
{
    key: "_createHandLandmarker",
    value: function _createHandLandmarker(vision, numHands) {
        return HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                delegate: 'GPU'
            },
            numHands: numHands,
            runningMode: 'VIDEO'
        });
    }
}
```

Then in `_setupHandTracking()`, replace the inline `HandLandmarker.createFromOptions(...)` call with:

```js
_this.vision = vision;
return [4, _this._createHandLandmarker(vision, _this.trackingHandLimit)];
```

- [ ] **Step 5: Add mode switching methods**

Add these methods near `_setupEventListeners`:

```js
{
    key: "isDuoModeEnabled",
    value: function isDuoModeEnabled() {
        return this.duoModeEnabled;
    }
},
{
    key: "setDuoModeEnabled",
    value: function setDuoModeEnabled(enabled) {
        var _this = this;
        return _async_to_generator(function () {
            var nextLimit;
            return _ts_generator(this, function (_state) {
                switch (_state.label) {
                    case 0:
                        _this.duoModeEnabled = !!enabled;
                        nextLimit = _this.duoModeEnabled ? 4 : 2;
                        _this.trackingHandLimit = nextLimit;
                        _this._ensureHandSlots(nextLimit);
                        if (!_this.duoModeController) {
                            _this._setupDuoModeController();
                        }
                        _this.duoModeController.setEnabled(_this.duoModeEnabled);
                        _this._setDuoOverlayActive(_this.duoModeEnabled);
                        if (!_this.vision) return [3, 2];
                        return [4, _this._createHandLandmarker(_this.vision, nextLimit)];
                    case 1:
                        _this.handLandmarker = _state.sent();
                        _state.label = 2;
                    case 2:
                        return [2];
                }
            });
        })();
    }
}
```

- [ ] **Step 6: Add overlay activation helper**

Add:

```js
{
    key: "_setDuoOverlayActive",
    value: function _setDuoOverlayActive(active) {
        var overlay = document.getElementById('duo-overlay');
        if (overlay) {
            overlay.classList.toggle('active', !!active);
            overlay.setAttribute('aria-hidden', active ? 'false' : 'true');
        }
    }
}
```

- [ ] **Step 7: Run tests**

Run:

```powershell
npm.cmd test
```

Expected: all tests pass.

- [ ] **Step 8: Manual mode switching smoke**

Run:

```powershell
npm.cmd start
```

Open the app and click Duo. Expected:

- split overlay appears.
- no console errors.
- clicking Solo hides the split overlay.
- single mode still works after returning to Solo.

- [ ] **Step 9: Commit**

```powershell
git add game.js
git commit -m "Add Duo mode state and hand limit switching"
```

## Task 7: Duo Routing For Performer And Mixer

**Files:**
- Modify: `game.js:1030-1196`

- [ ] **Step 1: Add hand normalization helper**

Add this method near `_getVisibleVideoParameters`:

```js
{
    key: "_normalizeDetectedHandsForDuo",
    value: function _normalizeDetectedHandsForDuo(results, videoParams, canvasWidth, canvasHeight) {
        var _this = this;
        if (!results.landmarks) return [];
        return results.landmarks.map(function (landmarks, trackingIndex) {
            var smoothedLandmarks = _this._smoothLandmarksForIndex(trackingIndex, landmarks);
            var palm = smoothedLandmarks[9];
            var lmOriginalX = palm.x * videoParams.videoNaturalWidth;
            var lmOriginalY = palm.y * videoParams.videoNaturalHeight;
            var normX = (lmOriginalX - videoParams.offsetX) / videoParams.visibleWidth;
            var normY = (lmOriginalY - videoParams.offsetY) / videoParams.visibleHeight;
            return {
                id: trackingIndex,
                trackingIndex: trackingIndex,
                palm: {
                    x: Math.max(0, Math.min(1, normX)),
                    y: Math.max(0, Math.min(1, normY))
                },
                landmarks: smoothedLandmarks,
                videoParams: videoParams,
                canvasWidth: canvasWidth,
                canvasHeight: canvasHeight
            };
        });
    }
}
```

- [ ] **Step 2: Extract smoothing helper from existing `_updateHands`**

Add:

```js
{
    key: "_smoothLandmarksForIndex",
    value: function _smoothLandmarksForIndex(index, currentRawLandmarks) {
        if (!this.lastLandmarkPositions[index] || this.lastLandmarkPositions[index].length !== currentRawLandmarks.length) {
            this.lastLandmarkPositions[index] = currentRawLandmarks.map(function (lm) {
                return _object_spread({}, lm);
            });
        }
        var smoothedLandmarks = currentRawLandmarks.map((lm, lmIndex) => {
            var prevLm = this.lastLandmarkPositions[index][lmIndex];
            return {
                x: this.smoothingFactor * lm.x + (1 - this.smoothingFactor) * prevLm.x,
                y: this.smoothingFactor * lm.y + (1 - this.smoothingFactor) * prevLm.y,
                z: this.smoothingFactor * lm.z + (1 - this.smoothingFactor) * prevLm.z
            };
        });
        this.lastLandmarkPositions[index] = smoothedLandmarks.map(function (lm) {
            return _object_spread({}, lm);
        });
        return smoothedLandmarks;
    }
}
```

Then update the existing single-mode loop to call this helper instead of duplicating smoothing.

- [ ] **Step 3: Add Duo controller setup**

Add:

```js
{
    key: "_setupDuoModeController",
    value: function _setupDuoModeController() {
        this.duoModeController = new DuoModeController({
            handlePerformerMelody: ({ hand, context }) => {
                this._handlePerformerMelodyHand(hand.trackingIndex, hand.landmarks, context.videoParams, context.canvasWidth, context.canvasHeight);
            },
            handlePerformerDrums: ({ hand, context }) => {
                this._handlePerformerDrumHand(hand.trackingIndex, hand.landmarks, context.videoParams, context.canvasWidth, context.canvasHeight);
            },
            handleMixer: ({ roles, context }) => {
                this._handleMixerHands(roles, context);
            },
            handleOverlay: ({ roles }) => {
                this._updateDuoOverlay(roles);
            }
        });
    }
}
```

- [ ] **Step 4: Add performer handlers by reusing current behavior**

Move the existing `i === 0` melody code into:

```js
{
    key: "_handlePerformerMelodyHand",
    value: function _handlePerformerMelodyHand(trackingIndex, smoothedLandmarks, videoParams, canvasWidth, canvasHeight) {
        var hand = this.hands[trackingIndex];
        if (!hand) return;
        var wasVisible = hand.landmarks !== null;
        hand.landmarks = smoothedLandmarks;
        var palm = smoothedLandmarks[9];
        var lmOriginalY = palm.y * videoParams.videoNaturalHeight;
        var normYVisible = (lmOriginalY - videoParams.offsetY) / videoParams.visibleHeight;
        var currentMusicPreset = this.musicManager.getCurrentMusicPreset();
        var currentScale = currentMusicPreset.scale || ['E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3', 'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4'];
        var noteIndex = Math.floor((1 - normYVisible) * currentScale.length);
        var rootNote = currentScale[Math.max(0, Math.min(currentScale.length - 1, noteIndex))];
        var isFistNow = this._isFist(smoothedLandmarks);
        var thumbTip = smoothedLandmarks[4];
        var indexTip = smoothedLandmarks[8];
        var dx = thumbTip.x - indexTip.x;
        var dy = thumbTip.y - indexTip.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        var velocity = Math.max(0.1, Math.min(1.0, distance * 5));

        this._updateHandLines(trackingIndex, smoothedLandmarks, videoParams, canvasWidth, canvasHeight, {
            note: rootNote,
            velocity: velocity,
            isFist: isFistNow,
            roleLabel: 'Melody'
        });

        if (isFistNow && !hand.isFist) {
            this.musicManager.cycleSynth();
            this.musicManager.stopArpeggio(0);
        }
        hand.isFist = isFistNow;

        if (!isFistNow) {
            var arpeggioIsActive = this.musicManager.activePatterns.has(0);
            if (!wasVisible || !arpeggioIsActive) {
                this.musicManager.startArpeggio(0, rootNote);
            } else {
                this.musicManager.updateArpeggio(0, rootNote);
                this.musicManager.updateArpeggioVolume(0, velocity);
            }
        } else {
            this.musicManager.stopArpeggio(0);
        }
        hand.lineGroup.visible = true;
    }
}
```

Move the existing `i === 1` drum code into `_handlePerformerDrumHand` with `drumManager.updateActiveDrums(fingerStates)` and `_updateGlobalNoteLengthByRightHandY(...)`.

- [ ] **Step 5: Add mixer effect handler**

Add:

```js
{
    key: "_handleMixerHands",
    value: function _handleMixerHands(roles, context) {
        var filterHand = roles.mixerFilter;
        var spaceHand = roles.mixerSpace;

        if (filterHand) {
            var targetCutoff = mapFilterCutoff(filterHand.palm.x);
            this.duoEffectState.filterCutoff = smoothValue(this.duoEffectState.filterCutoff, targetCutoff, 0.18);
            this.musicManager.setFilterCutoff(this.duoEffectState.filterCutoff);
            this._updateHandLines(filterHand.trackingIndex, filterHand.landmarks, context.videoParams, context.canvasWidth, context.canvasHeight, {
                roleLabel: 'Filter'
            });
        }

        if (spaceHand) {
            var targetReverb = mapReverbWet(spaceHand.palm.y);
            this.duoEffectState.reverbWet = smoothValue(this.duoEffectState.reverbWet, targetReverb, 0.18);
            this.musicManager.setReverbWet(this.duoEffectState.reverbWet);
            this._updateHandLines(spaceHand.trackingIndex, spaceHand.landmarks, context.videoParams, context.canvasWidth, context.canvasHeight, {
                roleLabel: 'Space'
            });
        }

        if (filterHand && spaceHand) {
            var dx = filterHand.palm.x - spaceHand.palm.x;
            var dy = filterHand.palm.y - spaceHand.palm.y;
            var distance = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2);
            var delay = mapDelayFromDistance(distance);
            this.duoEffectState.delayWet = smoothValue(this.duoEffectState.delayWet, delay.wet, 0.18);
            this.duoEffectState.delayFeedback = smoothValue(this.duoEffectState.delayFeedback, delay.feedback, 0.18);
            this.musicManager.setDelayWet(this.duoEffectState.delayWet);
            this.musicManager.setDelayFeedback(this.duoEffectState.delayFeedback);
        }
    }
}
```

- [ ] **Step 6: Route `_updateHands` through Duo controller when enabled**

After `results`, `videoParams`, `canvasWidth`, and `canvasHeight` are available in `_updateHands`, insert:

```js
if (this.duoModeEnabled && this.duoModeController) {
    var duoHands = this._normalizeDetectedHandsForDuo(results, videoParams, canvasWidth, canvasHeight);
    this.duoModeController.update(duoHands, performance.now(), {
        videoParams: videoParams,
        canvasWidth: canvasWidth,
        canvasHeight: canvasHeight
    });
    return;
}
```

Keep the existing single-mode loop after this block.

- [ ] **Step 7: Add Duo overlay meter updates**

Add:

```js
{
    key: "_updateDuoOverlay",
    value: function _updateDuoOverlay() {
        var filterMeter = document.getElementById('duo-filter-meter');
        var reverbMeter = document.getElementById('duo-reverb-meter');
        var delayMeter = document.getElementById('duo-delay-meter');
        if (filterMeter) {
            var filterNorm = (this.duoEffectState.filterCutoff - 300) / (8000 - 300);
            filterMeter.style.width = Math.max(0, Math.min(100, filterNorm * 100)) + '%';
        }
        if (reverbMeter) {
            reverbMeter.style.width = Math.max(0, Math.min(100, this.duoEffectState.reverbWet / 0.55 * 100)) + '%';
        }
        if (delayMeter) {
            delayMeter.style.width = Math.max(0, Math.min(100, this.duoEffectState.delayWet / 0.45 * 100)) + '%';
        }
    }
}
```

- [ ] **Step 8: Run tests**

Run:

```powershell
npm.cmd test
```

Expected: all tests pass.

- [ ] **Step 9: Manual single-mode regression**

Run:

```powershell
npm.cmd start
```

In browser:

- Load the app in default mode.
- Confirm no split overlay.
- Use the original two-hand controls.
- Confirm melody and drums behave as before.

- [ ] **Step 10: Manual Duo mode smoke**

In browser:

- Click Duo.
- Confirm split overlay appears.
- Put two hands on the left and one or two hands on the right.
- Confirm the left side still controls melody/drums.
- Confirm the right side changes filter/reverb/delay without console errors.
- Click Solo and confirm app returns to default two-hand behavior.

- [ ] **Step 11: Commit**

```powershell
git add game.js
git commit -m "Route Duo roles to performance and mixer controls"
```

## Task 8: Duo Visual Feedback Polish

**Files:**
- Modify: `game.js:2030-2145`
- Modify: `styles.css`

- [ ] **Step 1: Extend `_updateHandLines` to accept role labels**

In `_updateHandLines`, after `var wristPos = points3D[0];`, add:

```js
var roleLabelText = controlData && controlData.roleLabel;
```

After the existing label block starts, add:

```js
if (roleLabelText && wristPos) {
    var roleLabel = this._createTextSprite(roleLabelText, {
        fontsize: 16,
        backgroundColor: handIndex < 2 ? this.labelColors.evaGreen : this.labelColors.evaPurple,
        textColor: this.labelColors.white
    });
    roleLabel.position.set(wristPos.x, wristPos.y + 95, 2);
    lineGroup.add(roleLabel);
}
```

- [ ] **Step 2: Confirm mixer role line rendering uses Duo context**

Confirm `_handleMixerHands(roles, context)` from Task 7 calls `_updateHandLines` for both Mixer hands:

```js
if (filterHand) {
    this._updateHandLines(filterHand.trackingIndex, filterHand.landmarks, context.videoParams, context.canvasWidth, context.canvasHeight, {
        roleLabel: 'Filter'
    });
}
if (spaceHand) {
    this._updateHandLines(spaceHand.trackingIndex, spaceHand.landmarks, context.videoParams, context.canvasWidth, context.canvasHeight, {
        roleLabel: 'Space'
    });
}
```

- [ ] **Step 3: Run tests**

Run:

```powershell
npm.cmd test
```

Expected: all tests pass.

- [ ] **Step 4: Manual visual smoke**

Run:

```powershell
npm.cmd start
```

Verify:

- Duo overlay labels are readable.
- Hand labels do not overlap the bottom control bar in common positions.
- The existing simple-mode button text no longer escapes its circular container because `.mode-text-btn` handles text buttons.

- [ ] **Step 5: Commit**

```powershell
git add game.js styles.css
git commit -m "Polish Duo visual feedback"
```

## Task 9: End-To-End Verification And Draft Deploy

**Files:**
- No code changes expected unless verification finds a defect.

- [ ] **Step 1: Run automated tests**

Run:

```powershell
npm.cmd test
```

Expected: all tests pass.

- [ ] **Step 2: Check git diff for single-mode blast radius**

Run:

```powershell
git diff origin/main...HEAD -- index.html styles.css main.js game.js MusicManager.js duo tests
```

Expected: changes are limited to Duo mode, effect setters, tests, and UI shell.

- [ ] **Step 3: Start local server**

Run:

```powershell
npm.cmd start
```

Manual checks:

- Default load starts in Single Mode.
- Single Mode has no split line.
- Duo toggle enters Duo Mode.
- Duo toggle returns to Single Mode.
- Single Mode still works after a Duo round-trip.
- Browser console has no uncaught errors.

- [ ] **Step 4: Create a Netlify draft deploy**

Run:

```powershell
npx.cmd netlify deploy --dir .
```

Expected: Netlify prints a draft deploy URL. Do not use `--prod` for this branch.

- [ ] **Step 5: Manual remote smoke on draft URL**

Open the draft URL in Chrome or Edge:

- Enter the invite code if the gate appears.
- Confirm Single Mode loads.
- Confirm Duo Mode toggle appears.
- Confirm camera permission prompt works.
- Confirm Duo overlay appears.

- [ ] **Step 6: Commit verification notes if any docs changed**

If no files changed, skip this step. If a verification note was added to docs, commit it:

```powershell
git add docs
git commit -m "Document Duo verification notes"
```

## Deferred Follow-Up Plan: Recording MVP

After Duo Mix is playable, write a second plan for local WebM recording. It should cover:

- Canvas/video composition.
- Tone/Web Audio capture through `createMediaStreamDestination()`.
- `MediaRecorder` lifecycle.
- Preview/download UI.
- Browser compatibility and file naming.

## Self-Review

Spec coverage:

- Optional mode switch: Tasks 4 and 6.
- Center split line and role UI: Tasks 4 and 8.
- One MediaPipe instance with four-hand tracking in Duo mode: Tasks 6 and 7.
- Left performer reuses melody/drum controls: Task 7.
- Right mixer controls filter/reverb/delay: Tasks 2, 5, and 7.
- Single Mode safety: Tasks 6, 7, and 9.
- Performance safeguards: Tasks 6, 7, and 9.
- Recording: explicitly deferred to a separate plan after Duo Mix is playable.

Placeholder scan:

- This plan contains concrete file paths, commands, test code, and implementation snippets.
- Recording is deferred by scope decision, not left as an unfinished requirement in this plan.

Type consistency:

- `HandRoleAssigner.update()` returns `{ roles, waiting }`.
- `DuoModeController.update()` returns `{ enabled, roles, waiting }`.
- Game integration uses the same role names: `performerMelody`, `performerDrums`, `mixerFilter`, `mixerSpace`.
