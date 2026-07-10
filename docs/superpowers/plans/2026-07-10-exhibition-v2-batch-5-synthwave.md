# Exhibition V2 Batch 5 Synthwave Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Neon Drive the new Synthwave default, add Midnight Pulse and Arcade Horizon, preserve the legacy material as Classic, and map the left hand to scale-quantized pitch, filter brightness, pinch volume, tone variants, and scene changes.

**Architecture:** Put scene definitions and scale math in pure modules. `MusicManager` owns one reusable arpeggio synth, one lightweight mono bass, and one reusable filter/effect chain connected to the Batch 2 `AudioBus`; frame updates change parameters only and never rebuild audio nodes. `game.js` converts the stable MediaPipe left hand into semantic controls.

**Tech Stack:** Tone.js ES module, native ES modules, MediaPipe landmarks, Node.js `node:test`, existing shared AudioBus.

---

## File map

- Create `music/scenes.js`: immutable Classic/Neon Drive/Midnight Pulse/Arcade Horizon definitions.
- Create `music/scale-utils.js`: note expansion and scale-position quantization.
- Create `music/gesture-controls.js`: pinch, brightness, fist-edge, and four-finger-edge helpers.
- Create `tests/music-scenes.test.mjs`, `tests/scale-utils.test.mjs`, `tests/music-routing-contract.test.mjs`, `tests/left-hand-contract.test.mjs`.
- Modify `MusicManager.js`: scene selection, synth variants, scale roots, filter, mono bass, and stable node graph.
- Modify `game.js`: new left-hand mappings and removal of legacy preset/synth cycling paths.
- Modify `StateManager.js`, `main.js`, `index.html`, `styles.css`: scene/synth/rhythm/BPM status and scene controls.
- Modify `README.md`: final test-branch acceptance record and production prohibition.

### Task 1: Define exact Synthwave scene and scale contracts

**Files:**
- Create: `music/scenes.js`
- Create: `music/scale-utils.js`
- Create: `tests/music-scenes.test.mjs`
- Create: `tests/scale-utils.test.mjs`

- [ ] **Step 1: Write failing scene tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_SCENE_ID, SCENES } from '../music/scenes.js';

test('ships the approved scenes and defaults to Neon Drive', () => {
  assert.equal(DEFAULT_SCENE_ID, 'neon-drive');
  assert.deepEqual(SCENES.map(({ id }) => id), ['classic', 'neon-drive', 'midnight-pulse', 'arcade-horizon']);
  assert.deepEqual(SCENES.slice(1).map(({ bpm }) => bpm), [120, 108, 126]);
  assert.deepEqual(SCENES.slice(1).map(({ tonic, mode }) => `${tonic} ${mode}`), [
    'E natural-minor', 'E harmonic-minor', 'A dorian',
  ]);
});
```

- [ ] **Step 2: Write failing scale tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildScale, noteAtPosition } from '../music/scale-utils.js';

test('builds the approved pitch classes across the performance range', () => {
  assert.deepEqual(buildScale('E', 'natural-minor', 3, 4), ['E3','F#3','G3','A3','B3','C4','D4','E4']);
  assert.deepEqual(buildScale('E', 'harmonic-minor', 3, 4), ['E3','F#3','G3','A3','B3','C4','D#4','E4']);
  assert.deepEqual(buildScale('A', 'dorian', 3, 4), ['A3','B3','C4','D4','E4','F#4','G4','A4']);
});

test('maps top to high and bottom to low without chromatic notes', () => {
  const scale = buildScale('E', 'natural-minor', 3, 5);
  assert.equal(noteAtPosition(scale, 1), 'E3');
  assert.equal(noteAtPosition(scale, 0), 'E5');
});
```

- [ ] **Step 3: Run and verify missing-module failures**

Run: `node --test tests/music-scenes.test.mjs tests/scale-utils.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 4: Implement immutable scene data**

```js
export const DEFAULT_SCENE_ID = 'neon-drive';

export const SCENES = Object.freeze([
  Object.freeze({
    id: 'classic', name: 'Classic', tonic: 'E', mode: 'chromatic', bpm: 122,
    sequence: [0, 3, null, 7, 8, null, 7, null], bass: [0, null, 0, null, 7, null, 0, null],
    variants: ['DX7 E.PIANO', 'DX7 BRASS', 'DX7 MARIMBA'], legacy: true,
  }),
  Object.freeze({
    id: 'neon-drive', name: 'Neon Drive', tonic: 'E', mode: 'natural-minor', bpm: 120,
    sequence: [0, 7, 12, 7, 3, 10, 12, 7, 0, 7, 14, 12, 3, 10, 7, null],
    bass: [0, null, 0, null, 5, null, 7, null], variants: ['NEON PLUCK', 'NEON LEAD'],
  }),
  Object.freeze({
    id: 'midnight-pulse', name: 'Midnight Pulse', tonic: 'E', mode: 'harmonic-minor', bpm: 108,
    sequence: [0, null, 7, 11, 12, 11, 7, null, 0, 3, 7, 11, 14, 12, 11, 7],
    bass: [0, null, null, 0, 5, null, 7, null], variants: ['MIDNIGHT BELL', 'MIDNIGHT BRASS'],
  }),
  Object.freeze({
    id: 'arcade-horizon', name: 'Arcade Horizon', tonic: 'A', mode: 'dorian', bpm: 126,
    sequence: [0, 7, 9, 12, 3, 7, 10, 9, 0, 3, 7, 12, 14, 10, 9, 7],
    bass: [0, null, 0, 7, 5, null, 7, null], variants: ['ARCADE PULSE', 'ARCADE CRYSTAL'],
  }),
]);

export function getScene(id) {
  const scene = SCENES.find((entry) => entry.id === id);
  if (!scene) throw new RangeError(`Unknown music scene: ${id}`);
  return scene;
}
```

- [ ] **Step 5: Implement scale construction and quantization**

```js
const PITCHES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const MODES = Object.freeze({
  'natural-minor': [0, 2, 3, 5, 7, 8, 10],
  'harmonic-minor': [0, 2, 3, 5, 7, 8, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
});

export function buildScale(tonic, mode, lowOctave = 3, highOctave = 5) {
  const root = PITCHES.indexOf(tonic);
  if (root < 0 || !MODES[mode]) throw new RangeError(`Unsupported scale ${tonic} ${mode}`);
  const notes = [];
  for (let midi = 12 * (lowOctave + 1) + root; midi <= 12 * (highOctave + 1) + root; midi += 1) {
    if (MODES[mode].includes((midi - (12 * (lowOctave + 1) + root) + 120) % 12)) {
      notes.push(`${PITCHES[midi % 12]}${Math.floor(midi / 12) - 1}`);
    }
  }
  return notes;
}

export function noteAtPosition(scale, normalizedY) {
  const value = Math.max(0, Math.min(1, normalizedY));
  return scale[Math.round((1 - value) * (scale.length - 1))];
}
```

- [ ] **Step 6: Run and commit**

Run: `node --test tests/music-scenes.test.mjs tests/scale-utils.test.mjs`

Expected: PASS.

```bash
git add music/scenes.js music/scale-utils.js tests/music-scenes.test.mjs tests/scale-utils.test.mjs
git commit -m "feat: define synthwave scenes and scales"
```

### Task 2: Rebuild `MusicManager` around reusable scene nodes

**Files:**
- Create: `tests/music-routing-contract.test.mjs`
- Modify: `MusicManager.js`

- [ ] **Step 1: Write the static node-lifecycle contract test**

Read `MusicManager.js` and assert it imports `SCENES`, `buildScale`, and `audioBus`; contains `setScene`, `setToneVariant`, `setBrightness`, and `setRootFromPosition`; constructs `Tone.Filter` and `Tone.MonoSynth` only inside `start`; never calls `.toDestination()`; and never constructs an audio node inside any hand-frame setter.

Run: `node --test tests/music-routing-contract.test.mjs`

Expected: FAIL on the legacy manager.

- [ ] **Step 2: Define the complete variant table and create the audio graph once in `start()`**

Use the shared Tone entry and pure scene modules:

```js
import * as Tone from './audio/tone.js';
import { audioBus } from './audio/AudioBus.js';
import { DEFAULT_SCENE_ID, SCENES, getScene } from './music/scenes.js';
import { buildScale, noteAtPosition } from './music/scale-utils.js';
```

At module scope:

```js
const fm = (harmonicity, modulationIndex, attack, decay, sustain, release) => Object.freeze({
  harmonicity, modulationIndex,
  oscillator: { type: 'sine' }, modulation: { type: 'sine' },
  envelope: { attack, decay, sustain, release },
  modulationEnvelope: { attack: Math.max(0.001, attack / 2), decay, sustain: Math.max(0.05, sustain * 0.7), release },
});

const SYNTH_VARIANTS = Object.freeze({
  'DX7 E.PIANO': fm(14, 4.5, 0.01, 0.3, 0.4, 1.2),
  'DX7 BRASS': fm(2, 12, 0.1, 0.2, 0.8, 0.6),
  'DX7 MARIMBA': fm(3, 6, 0.005, 0.4, 0.1, 0.8),
  'NEON PLUCK': fm(7, 8, 0.002, 0.3, 0.15, 0.5),
  'NEON LEAD': fm(1.5, 15, 0.05, 0.1, 0.7, 0.8),
  'MIDNIGHT BELL': fm(4.5, 12, 0.005, 1.2, 0.05, 2.0),
  'MIDNIGHT BRASS': fm(1, 11, 0.08, 0.25, 0.9, 1.2),
  'ARCADE PULSE': fm(2, 9, 0.01, 0.16, 0.55, 0.35),
  'ARCADE CRYSTAL': fm(7, 10, 0.001, 0.22, 0.1, 0.45),
});
```

After `await audioBus.start()`:

```js
this.sceneFilter = new Tone.Filter({ type: 'lowpass', frequency: 2600, Q: 1.2 });
this.sceneDelay = new Tone.FeedbackDelay('8n.', 0.32);
this.sceneReverb = new Tone.Reverb({ decay: 4.2, preDelay: 0.02, wet: 0.24 });
this.arpSynth = new Tone.PolySynth(Tone.FMSynth, SYNTH_VARIANTS['NEON PLUCK']);
this.bassSynth = new Tone.MonoSynth({
  oscillator: { type: 'sawtooth' },
  filter: { type: 'lowpass', Q: 1 },
  envelope: { attack: 0.01, decay: 0.18, sustain: 0.35, release: 0.25 },
  filterEnvelope: { attack: 0.01, decay: 0.15, sustain: 0.2, release: 0.2, baseFrequency: 70, octaves: 2.2 },
});
this.arpSynth.connect(this.sceneFilter);
this.bassSynth.connect(this.sceneFilter);
this.sceneFilter.connect(this.sceneDelay);
this.sceneDelay.connect(this.sceneReverb);
this.sceneReverb.connect(audioBus.input);
this.bassSynth.volume.value = -20;
this.bassSequence = new Tone.Sequence((time, step) => {
  const interval = this.scene?.bass?.[step];
  if (interval === null || interval === undefined || !this.bassRoot) return;
  const note = Tone.Frequency(this.bassRoot).transpose(interval - 12).toNote();
  this.bassSynth.triggerAttackRelease(note, '16n', time, 0.32);
}, [0, 1, 2, 3, 4, 5, 6, 7], '8n').start(0);
this.setScene(DEFAULT_SCENE_ID);
```

Do not dispose/recreate effects or the bass sequence during scene or hand updates.

- [ ] **Step 3: Implement scene and parameter setters**

```js
setScene(id) {
  const scene = getScene(id);
  this.stopAllArpeggios();
  this.scene = scene;
  this.scale = buildScale(scene.tonic, scene.mode, 3, 5);
  this.variantIndex = 0;
  Tone.Transport.bpm.rampTo(scene.bpm, 0.15);
  this.setToneVariant(0);
  return scene;
}

setRootFromPosition(normalizedY) {
  const note = noteAtPosition(this.scale, normalizedY);
  if (this.activePatterns.has('Left')) this.updateArpeggio('Left', note);
  else this.startArpeggio('Left', note);
  this.currentRoot = note;
  this.bassRoot = note;
  return note;
}

setBrightness(normalizedX) {
  const value = Math.max(0, Math.min(1, normalizedX));
  const frequency = 250 * Math.pow(8000 / 250, value);
  this.sceneFilter.frequency.rampTo(frequency, 0.04);
}

setToneVariant(index = this.variantIndex + 1) {
  this.variantIndex = ((index % this.scene.variants.length) + this.scene.variants.length) % this.scene.variants.length;
  this.arpSynth.set(SYNTH_VARIANTS[this.scene.variants[this.variantIndex]]);
  return this.scene.variants[this.variantIndex];
}

cycleScene() {
  const index = SCENES.findIndex(({ id }) => id === this.scene.id);
  return this.setScene(SCENES[(index + 1) % SCENES.length].id);
}

setClassicPreset(index) {
  if (this.scene.id !== 'classic' || !Number.isInteger(index) || !CLASSIC_PRESETS[index]) return null;
  const preset = CLASSIC_PRESETS[index];
  this.stopAllArpeggios();
  this.scene = { ...getScene('classic'), sequence: preset.sequence, bpm: preset.tempo };
  Tone.Transport.bpm.rampTo(preset.tempo, 0.15);
  return preset;
}

stopAllArpeggios() {
  for (const handId of [...this.activePatterns.keys()]) this.stopArpeggio(handId);
  this.bassRoot = null;
  this.bassSynth?.triggerRelease();
}
```

The stable bass sequence reads `this.scene.bass` on each scheduled step, so scene changes require no new sequence. Stop bass immediately when the left hand disappears.

- [ ] **Step 4: Preserve Classic material**

Move the seven existing `musicPresets` definitions unchanged into a `CLASSIC_PRESETS` export. `setClassicPreset(index)` validates `0..6`, changes only the Classic sequence, and returns the selected preset; the Control Deck selector added in Task 4 calls it while Classic is active. Four-finger input still advances one scene per edge. Existing DX7 E.Piano/Brass/Marimba options remain the Classic tone variants.

- [ ] **Step 5: Run tests and audio smoke**

Run: `npm test`

Expected: tests PASS. Browser audio contains one arp and one mono bass routed through the shared recorder bus; scene switches do not double effects or Transport callbacks; output stays below limiter clipping during rapid changes.

- [ ] **Step 6: Commit**

```bash
git add MusicManager.js tests/music-routing-contract.test.mjs
git commit -m "feat: add reusable synthwave audio scenes"
```

### Task 3: Map left-hand movement and gesture edges

**Files:**
- Create: `music/gesture-controls.js`
- Create: `tests/left-hand-contract.test.mjs`
- Modify: `game.js`

- [ ] **Step 1: Write pure gesture-helper tests**

Test that pinch distance maps to velocity `0..1` with a dead zone; fist and four-finger helpers emit only on closed→open edges with a 700 ms cooldown; missing landmarks return neutral; handedness must be `Left` rather than detection-array index.

- [ ] **Step 2: Implement the helpers**

```js
export function pinchVelocity(landmarks) {
  if (!landmarks?.[4] || !landmarks?.[8] || !landmarks?.[0] || !landmarks?.[9]) return 0;
  const pinch = Math.hypot(landmarks[4].x - landmarks[8].x, landmarks[4].y - landmarks[8].y);
  const palm = Math.max(0.001, Math.hypot(landmarks[0].x - landmarks[9].x, landmarks[0].y - landmarks[9].y));
  return Math.max(0, Math.min(1, (pinch / palm - 0.12) / 0.9));
}

export class EdgeGesture {
  constructor(cooldownMs = 700) { this.previous = false; this.lastAt = -Infinity; this.cooldownMs = cooldownMs; }
  update(active, now) {
    const fired = active && !this.previous && now - this.lastAt >= this.cooldownMs;
    this.previous = active;
    if (fired) this.lastAt = now;
    return fired;
  }
}
```

- [ ] **Step 3: Replace left-hand legacy mappings in `game.js`**

For `handsBySide.Left`, while recording/guide intent is not suppressing musical controls:

```js
const root = this.musicManager.setRootFromPosition(normYVisible);
this.musicManager.setBrightness(normXVisible);
this.musicManager.updateArpeggioVolume('Left', pinchVelocity(leftLandmarks));
if (this.leftFistEdge.update(this._isFist(leftLandmarks), now)) {
  this.musicManager.setToneVariant();
}
if (this.leftFourFingerEdge.update(this._areFourFingersVertical(leftLandmarks), now)) {
  this.musicManager.cycleScene();
}
```

On disappearance, stop the left arp and bass. Delete the old `cycleSynth()`/`cycleMusicPreset()` gesture branches and do not use `hands[0]` as a proxy for left handedness.

- [ ] **Step 4: Run automated and hand smoke tests**

Run: `npm test`

Expected: tests PASS.

Browser expected: left vertical motion produces only notes in the active scale; horizontal motion smoothly brightens/darkens timbre; pinch changes loudness without clicks; fist changes tone variant once; four fingers change scene once; right-hand drum gestures remain unaffected.

- [ ] **Step 5: Commit**

```bash
git add music/gesture-controls.js game.js tests/left-hand-contract.test.mjs
git commit -m "feat: map left hand to synthwave performance"
```

### Task 4: Finish scene status and manual fallback controls

**Files:**
- Modify: `StateManager.js`
- Modify: `main.js`
- Modify: `index.html`
- Modify: `styles.css`

- [ ] **Step 1: Extend state with semantic fields**

Replace editor-era preset fields with:

```js
sceneName: 'Neon Drive',
synthName: 'NEON PLUCK',
rhythmName: 'STEADY / FULL',
tempo: 120,
rootNote: 'E3',
```

Bind them to `current-music-preset`, `current-synth`, `current-drum-preset`, `current-tempo`, and a new `current-root-note` output. Update state from emitted scene/rhythm events, not one-second polling.

- [ ] **Step 2: Add manual scene fallback buttons to the bottom-center strip**

```html
<nav id="scene-selector" class="scene-selector" aria-label="音乐场景">
  <button type="button" data-scene="classic">CLASSIC</button>
  <button type="button" data-scene="neon-drive" aria-current="true">NEON DRIVE</button>
  <button type="button" data-scene="midnight-pulse">MIDNIGHT PULSE</button>
  <button type="button" data-scene="arcade-horizon">ARCADE HORIZON</button>
</nav>

<label id="classic-pattern-control" hidden>CLASSIC PATTERN
  <select id="classic-pattern-select">
    <option value="0">Minimal Groove</option>
    <option value="1">Rhythmic Drive</option>
    <option value="2">Melodic Flow</option>
    <option value="3">Groove Pulse</option>
    <option value="4">Dark Current</option>
    <option value="5">Light Flow</option>
    <option value="6">Deep Space</option>
  </select>
</label>
```

Buttons call `musicManager.setScene(id)` and update `aria-current`; they remain usable if hand tracking is unavailable. Show `classic-pattern-control` only for Classic and call `musicManager.setClassicPreset(Number(select.value))` on change. Keep the strip compact and outside the central camera/hand area.

- [ ] **Step 3: Run accessibility and browser smoke tests**

Expected: all buttons are reachable by keyboard, focus is visible, status changes are readable without emoji, reduced-motion removes nonessential motion, and the recording preview captures the selected scene plus drums.

- [ ] **Step 4: Run and commit**

Run: `npm test && git diff --check`

Expected: all tests PASS.

```bash
git add StateManager.js main.js index.html styles.css
git commit -m "feat: expose synthwave scene controls"
```

### Task 5: Validate performance, resilience, and the complete exhibition flow

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Establish the tracking performance comparison**

On the same Windows exhibition-class browser and camera, measure the original `origin/main` build for five minutes and the V2 branch for five minutes after warm-up. Record median hand-tracking FPS from the same 60-second sample window.

Expected: V2 median FPS is no worse than 10% below baseline; no repeated audio-node construction appears in the Performance allocation timeline.

- [ ] **Step 2: Run the 30-minute soak test**

Cycle scenes, traverse the rhythm grid, open/skip the guide, record/re-record/upload at least six takes, disconnect/reconnect network once, and temporarily lose both hands from frame.

Expected: missing hands stop active audio; recovery does not duplicate Tone sequences; memory stabilizes; QR retry survives outage; server cleanup and invite boundary remain correct; no uncaught exception.

- [ ] **Step 3: Run the crowd-interference rehearsal**

Place the participant at the marked center position with two background observers. Verify guide copy and camera placement are sufficient; disable recording gestures from Control Deck and complete the full record/share flow with buttons; re-enable gestures and confirm only the foreground participant can reliably hold both thumb poses.

Expected: no ROI/person-identification logic is introduced; operator fallback remains sufficient.

- [ ] **Step 4: Run the complete automated suite**

Run:

```bash
npm test
git diff --check
git status --short
```

Expected: all suites PASS, whitespace check is empty, and only the intended checkpoint documentation is uncommitted.

- [ ] **Step 5: Record final branch acceptance**

```md
## Exhibition V2 — complete test-branch checkpoint

- Default scene: Neon Drive / E natural minor / 120 BPM.
- Additional scenes: Midnight Pulse / E harmonic minor / 108 BPM; Arcade Horizon / A Dorian / 126 BPM; legacy material preserved as Classic.
- Left hand: scale root (Y), brightness (X), pinch volume, fist tone variant, four-finger scene change.
- Right hand: 7×7 rhythm position plus five independent drum fingers.
- Recording: internal master mix, three-second countdown, 60-second maximum, review/re-record, signed cloud upload, 24-hour QR share.
- Guide remains operator-triggered; production remains unchanged.
- Screen recording is intentionally excluded from this release and remains an OBS/OS workflow.
- Median tracking FPS regression met the approved ≤10% threshold; raw baseline and V2 values are included in the branch preview report.
```

Add the actual baseline/V2 numbers to the branch preview report before this README checkpoint is committed; do not commit the statement if the threshold failed.

- [ ] **Step 6: Commit the verified checkpoint**

```bash
git add README.md
git commit -m "docs: record exhibition v2 acceptance"
```

### Task 6: Publish a branch preview without touching production

**Files:**
- No source changes expected.

- [ ] **Step 1: Push only the test branch**

Run:

```bash
git push -u origin feature/exhibition-v2
```

Expected: the branch appears on GitHub; `origin/main` is unchanged.

- [ ] **Step 2: Create or refresh a Netlify branch/draft deploy**

Deploy `feature/exhibition-v2` with invite secrets and recording proxy variables set only in the appropriate preview context.

Expected: a draft/branch URL is produced; the production URL `https://arpeggiator-remix-2.netlify.app/` still serves the old production commit.

- [ ] **Step 3: Perform final preview smoke**

Verify invite entry, camera, both hands, all scenes, all rhythm corners, record/re-record, cloud QR, public mobile playback, social links, simple mode, gesture-disable fallback, offline recovery, and expired link state.

Expected: all pass on the draft URL.

- [ ] **Step 4: Stop at the production approval gate**

Report the draft URL, test results, FPS numbers, known limitations, server health, and rollback commit. Do not merge to `main`, change the production deploy, or replace `https://arpeggiator-remix-2.netlify.app/` until the user gives a new explicit production authorization.
