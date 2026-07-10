# Exhibition V2 Batch 4 Rhythm Space Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace drum-preset cycling and right-hand note-length control with a stable 7×7 rhythm space whose X axis moves from regular to syncopated and Y axis moves from sparse to energetic, while all five finger-to-drum switches continue to work.

**Architecture:** Generate and commit 49 deterministic patterns from reviewed literal motifs; the browser loads the resulting JSON and never performs ML or generative work. A pure coordinate selector provides smoothing/hysteresis, and a pure scheduler delays pattern changes until step 0 of the next 16-step bar. `game.js` only forwards the right palm coordinate and finger mask.

**Tech Stack:** Native ES modules, Tone.Sequence, MediaPipe landmarks, Node.js `node:test`, CSS transforms.

---

## File map

- Create `scripts/build-rhythm-grid.mjs`: offline deterministic generator from literal musical motifs.
- Create `rhythm/rhythm-grid.json`: generated 49-cell runtime data.
- Create `rhythm/rhythm-grid.js`: validation, lookup, and pattern decoding.
- Create `rhythm/RhythmSpace.js`: coordinate smoothing/hysteresis and cell-change events.
- Create `rhythm/PatternScheduler.js`: next-bar pending/current pattern state.
- Create `RhythmGridOverlay.js`: small 7×7 display and transform-only cursor.
- Create `tests/rhythm-grid.test.mjs`, `tests/rhythm-space.test.mjs`, `tests/pattern-scheduler.test.mjs`, `tests/rhythm-integration-contract.test.mjs`.
- Modify `DrumManager.js`: apply pending patterns at bar boundary and preserve active finger mask.
- Modify `game.js`: right-hand XY input, removal of note-length and fist-preset behavior.
- Modify `main.js`, `index.html`, `styles.css`, `StateManager.js`: initialize and display rhythm coordinates.

### Task 1: Generate and validate 49 stable curated patterns

**Files:**
- Create: `scripts/build-rhythm-grid.mjs`
- Create: `rhythm/rhythm-grid.json`
- Create: `rhythm/rhythm-grid.js`
- Create: `tests/rhythm-grid.test.mjs`

- [ ] **Step 1: Write the failing grid contract test**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { RHYTHM_GRID, getRhythmCell } from '../rhythm/rhythm-grid.js';

test('contains exactly one immutable 16-step pattern for every 7x7 cell', () => {
  assert.equal(RHYTHM_GRID.length, 49);
  assert.equal(new Set(RHYTHM_GRID.map(({ x, y }) => `${x}:${y}`)).size, 49);
  for (const cell of RHYTHM_GRID) {
    assert.deepEqual(Object.keys(cell.pattern).sort(), ['clap', 'hihat', 'kick', 'openhat', 'snare']);
    for (const steps of Object.values(cell.pattern)) {
      assert.equal(steps.length, 16);
      assert.ok(steps.every((step) => step === 0 || step === 1));
    }
  }
  assert.equal(getRhythmCell(6, 6).x, 6);
});

test('density rises vertically and syncopation rises horizontally', () => {
  const hits = (cell) => Object.values(cell.pattern).flat().reduce((sum, hit) => sum + hit, 0);
  assert.ok(hits(getRhythmCell(3, 6)) > hits(getRhythmCell(3, 0)));
  assert.notDeepEqual(getRhythmCell(0, 3).pattern.kick, getRhythmCell(6, 3).pattern.kick);
});
```

- [ ] **Step 2: Run and verify missing-module failure**

Run: `node --test tests/rhythm-grid.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Create the offline generator from literal motifs**

```js
import { mkdir, writeFile } from 'node:fs/promises';

const KICK_X = ['1000100010001000','1000101010001000','1000100010101000','1001001010001000','1010001010011000','1001010010101000','1010010100101010'];
const SNARE_X = ['0000100000001000','0000100000001000','0000100000101000','0000100100001000','0000100001001000','0010100001001000','0010010000100100'];
const CLAP_X = ['0000000000001000','0000000000001000','0000000000001000','0000000000101000','0000000001001000','0000001000001000','0000010000100100'];
const HAT_Y = ['0000000000000000','0010000000100000','0010001000100010','1010101010101010','1011101010111010','1110111011101110','1111111111111111'];
const OPEN_Y = ['0000000000000000','0000000010000000','0000000010000000','0000000010000010','0000001010000010','0010001010100010','0010101010101010'];
const EXTRA_Y = ['0000000000000000','0000000000000000','0000000000000010','0000001000000010','0010001000000010','0010001000100010','0010101000101010'];

const bits = (value) => [...value].map(Number);
const merge = (left, right) => left.map((hit, index) => hit || right[index] ? 1 : 0);
const grid = [];
for (let y = 0; y < 7; y += 1) {
  for (let x = 0; x < 7; x += 1) {
    grid.push({
      id: `r${y + 1}c${x + 1}`, x, y,
      label: `${['STEADY','PULSE','DRIVE','BREAK','SHIFT','GLITCH','FRACTURE'][x]} / ${['AIR','LEAN','LIGHT','FULL','LIFT','HOT','MAX'][y]}`,
      pattern: {
        kick: merge(bits(KICK_X[x]), bits(EXTRA_Y[y])),
        snare: bits(SNARE_X[x]),
        hihat: bits(HAT_Y[y]),
        openhat: bits(OPEN_Y[y]),
        clap: bits(CLAP_X[x]),
      },
    });
  }
}
await mkdir(new URL('../rhythm/', import.meta.url), { recursive: true });
await writeFile(new URL('../rhythm/rhythm-grid.json', import.meta.url), `${JSON.stringify(grid, null, 2)}\n`);
```

The literal motifs are the review surface. Run the generator once; commit its JSON output. Do not call this script from browser runtime.

- [ ] **Step 4: Add the validated loader**

```js
import rawGrid from './rhythm-grid.json' with { type: 'json' };

function freezeCell(cell) {
  const pattern = Object.fromEntries(Object.entries(cell.pattern).map(([track, steps]) => [track, Object.freeze([...steps])]));
  return Object.freeze({ ...cell, pattern: Object.freeze(pattern) });
}

export const RHYTHM_GRID = Object.freeze(rawGrid.map(freezeCell));
export function getRhythmCell(x, y) {
  const cell = RHYTHM_GRID.find((entry) => entry.x === x && entry.y === y);
  if (!cell) throw new RangeError(`Unknown rhythm cell ${x}:${y}`);
  return cell;
}
```

- [ ] **Step 5: Generate, inspect, test, and commit**

Run:

```bash
node scripts/build-rhythm-grid.mjs
node --test tests/rhythm-grid.test.mjs
```

Expected: generator writes 49 entries; tests PASS. Audition the seven cells on the bottom, middle, and top rows before commit; correct motifs in the script and regenerate JSON if any transition sounds abrupt.

```bash
git add scripts/build-rhythm-grid.mjs rhythm tests/rhythm-grid.test.mjs
git commit -m "feat: add curated 7x7 rhythm map"
```

### Task 2: Select cells smoothly and switch only at bar boundaries

**Files:**
- Create: `rhythm/RhythmSpace.js`
- Create: `rhythm/PatternScheduler.js`
- Create: `tests/rhythm-space.test.mjs`
- Create: `tests/pattern-scheduler.test.mjs`

- [ ] **Step 1: Write failing selector and scheduler tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { RhythmSpace } from '../rhythm/RhythmSpace.js';
import { PatternScheduler } from '../rhythm/PatternScheduler.js';

test('coordinate selector clamps and resists boundary jitter', () => {
  const space = new RhythmSpace({ smoothing: 1, hysteresis: 0.03 });
  assert.deepEqual(space.update(0, 0), { x: 0, y: 6, changed: true });
  const center = space.update(0.50, 0.50);
  assert.deepEqual(center, { x: 3, y: 3, changed: true });
  assert.equal(space.update(0.501, 0.499).changed, false);
  assert.deepEqual(space.update(1, 1), { x: 6, y: 0, changed: true });
});

test('pending pattern applies only on step zero', () => {
  const scheduler = new PatternScheduler('A');
  scheduler.queue('B');
  assert.equal(scheduler.onStep(15), 'A');
  assert.equal(scheduler.onStep(0), 'B');
});
```

- [ ] **Step 2: Implement the pure classes**

```js
export class RhythmSpace {
  constructor({ smoothing = 0.25, hysteresis = 0.03 } = {}) {
    this.smoothing = smoothing; this.hysteresis = hysteresis; this.smoothX = null; this.smoothY = null; this.x = -1; this.y = -1;
  }
  axis(value, previous) {
    const clamped = Math.max(0, Math.min(1, value));
    if (previous >= 0) {
      const low = previous / 7 - this.hysteresis;
      const high = (previous + 1) / 7 + this.hysteresis;
      if (clamped >= low && clamped <= high) return previous;
    }
    return Math.min(6, Math.floor(clamped * 7));
  }
  update(x, y) {
    this.smoothX = this.smoothX === null ? x : this.smoothX + (x - this.smoothX) * this.smoothing;
    this.smoothY = this.smoothY === null ? y : this.smoothY + (y - this.smoothY) * this.smoothing;
    const nextX = this.axis(this.smoothX, this.x);
    const nextY = this.axis(1 - this.smoothY, this.y);
    const changed = nextX !== this.x || nextY !== this.y;
    this.x = nextX; this.y = nextY;
    return { x: this.x, y: this.y, changed };
  }
}
```

```js
export class PatternScheduler {
  constructor(initial) { this.current = initial; this.pending = null; }
  queue(pattern) { this.pending = pattern; }
  onStep(step) {
    if (step === 0 && this.pending) { this.current = this.pending; this.pending = null; }
    return this.current;
  }
}
```

- [ ] **Step 3: Run and commit**

Run: `node --test tests/rhythm-space.test.mjs tests/pattern-scheduler.test.mjs`

Expected: PASS.

```bash
git add rhythm/RhythmSpace.js rhythm/PatternScheduler.js tests/rhythm-space.test.mjs tests/pattern-scheduler.test.mjs
git commit -m "feat: schedule smoothed rhythm-space changes"
```

### Task 3: Integrate right-hand XY without breaking finger masks

**Files:**
- Create: `tests/rhythm-integration-contract.test.mjs`
- Modify: `DrumManager.js`
- Modify: `game.js`

- [ ] **Step 1: Write static integration guards**

Assert that `game.js` no longer contains `_updateGlobalNoteLengthByRightHandY`, right-hand `cycleDrumPreset`, or a `noteLenCtrl` mutation; assert it imports `RhythmSpace`; assert `DrumManager.js` imports `PatternScheduler` and still exports `updateActiveDrums` with all five entries in `fingerToDrumMap`.

Run: `node --test tests/rhythm-integration-contract.test.mjs`

Expected: FAIL on legacy behavior.

- [ ] **Step 2: Add pending-cell support to `DrumManager.js`**

Initialize with `getRhythmCell(0, 3).pattern`, then add:

```js
const patternScheduler = new PatternScheduler(drumPattern);
let currentGridCell = { x: 0, y: 3 };
let pendingGridCell = null;

export function queueRhythmCell(x, y) {
  const cell = getRhythmCell(x, y);
  pendingGridCell = { x, y, label: cell.label };
  patternScheduler.queue(cell.pattern);
}

export function getCurrentGridCell() { return { ...currentGridCell }; }
```

Inside the existing Tone.Sequence callback, before reading tracks:

```js
drumPattern = patternScheduler.onStep(step);
if (step === 0 && pendingGridCell) {
  currentGridCell = pendingGridCell;
  pendingGridCell = null;
}
```

Do not alter `activeDrums`: the finger mask remains an independent playback gate layered over the selected pattern.

- [ ] **Step 3: Replace right-hand legacy mappings in `game.js`**

Construct one `RhythmSpace`. For the MediaPipe hand whose stable side is `Right`, normalize palm landmark 9 to visible-video X/Y, then:

```js
const cell = this.rhythmSpace.update(normXVisible, normYVisible);
if (cell.changed) {
  drumManager.queueRhythmCell(cell.x, cell.y);
  this.renderDiv.dispatchEvent(new CustomEvent('rhythmposition', { detail: cell }));
}
drumManager.updateActiveDrums(this._getFingerStates(rightLandmarks));
```

Delete right-fist preset cycling and all right-Y note-length calls/state/UI text. A fist now naturally produces an empty active-drum set.

- [ ] **Step 4: Run tests and hand-tracking smoke**

Run: `npm test`

Expected: all tests PASS.

Browser expected: right XY moves across all 49 cells; audible change waits for the next bar; five fingers independently enable Open-hat/Kick/Snare/Hi-hat/Clap; fist silences tracks without switching presets; three-finger shapes do not start recording.

- [ ] **Step 5: Commit**

```bash
git add DrumManager.js game.js tests/rhythm-integration-contract.test.mjs
git commit -m "feat: map right hand to rhythm space"
```

### Task 4: Add a low-cost rhythm grid overlay

**Files:**
- Create: `RhythmGridOverlay.js`
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `main.js`
- Modify: `StateManager.js`

- [ ] **Step 1: Add semantic grid markup**

```html
<section id="rhythm-space" class="rhythm-space" aria-label="二维节奏空间">
  <span class="rhythm-space__axis rhythm-space__axis--x">REGULAR → BROKEN</span>
  <span class="rhythm-space__axis rhythm-space__axis--y">SPARSE → DENSE</span>
  <div id="rhythm-cursor" class="rhythm-space__cursor"></div>
  <output id="rhythm-cell-label">STEADY / FULL</output>
</section>
```

- [ ] **Step 2: Implement transform-only updates**

```js
export class RhythmGridOverlay {
  constructor(root = document) {
    this.cursor = root.getElementById('rhythm-cursor');
    this.label = root.getElementById('rhythm-cell-label');
  }
  update({ x, y, label }) {
    this.cursor.style.transform = `translate3d(${x * 100 / 6}%, ${(6 - y) * 100 / 6}%, 0)`;
    if (label) this.label.textContent = label;
  }
}
```

Style the overlay as a small 7×7 cyan grid at bottom right. Hide it in `.simple-mode`; animate only `transform` and `opacity`.

- [ ] **Step 3: Wire and verify**

Listen for `game`'s `rhythmposition`; update the cursor continuously while the status label changes only when `DrumManager` confirms the next-bar cell.

Run: `npm test && git diff --check`

Expected: tests PASS; cursor movement does not cause layout/reflow warnings in the Performance panel.

- [ ] **Step 4: Commit**

```bash
git add RhythmGridOverlay.js index.html styles.css main.js StateManager.js
git commit -m "feat: visualize the 7x7 rhythm space"
```

### Task 5: Complete the rhythm acceptance checkpoint

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Audition the full grid and record results**

Use keyboard/debug coordinate injection to visit all 49 cells at 120 BPM for at least one bar each. Confirm no empty accidental cell, clipping spike, abrupt mid-bar switch, or duplicate adjacent row. Then perform a five-minute hand-play session.

- [ ] **Step 2: Document and commit**

```md
## Exhibition V2 — Batch 4 checkpoint

- 49 committed deterministic patterns audited across the full 7×7 grid.
- X moves from regular to broken; Y increases rhythmic density.
- Pattern changes occur only at the next 16-step bar boundary.
- Five finger-to-drum gates remain independent; a fist silences rather than changes presets.
- Right-hand Y no longer changes arpeggio note length.
```

Run: `npm test && git diff --check`

Expected: all tests PASS.

```bash
git add README.md
git commit -m "docs: record rhythm-space checkpoint"
```
