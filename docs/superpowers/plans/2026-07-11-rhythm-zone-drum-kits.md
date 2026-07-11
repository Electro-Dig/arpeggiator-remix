# Right-hand Rhythm Zone and Drum Kits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restrict right-hand rhythm XY to the approved performance zone, rebuild the 7×7 grid around four understandable electronic rhythm anchors, and add three switchable drum timbre kits with a deliberate fist-to-open gesture.

**Architecture:** Add small pure modules for zone normalization and kit-gesture state, keep 49 rhythms deterministic and built offline, and isolate audio assets/loading in `DrumKitManager`. `game.js` only forwards hand observations; `DrumManager` remains the scheduler and finger-gate facade; UI updates stay event-driven.

**Tech Stack:** JavaScript ES modules, Node.js test runner, Tone.js 15.1.22, deterministic PCM WAV generation, MediaPipe hand landmarks, Netlify Draft deploys.

---

## File map

**Create**

- `rhythm/RhythmZone.js` — clamp and normalize visible-screen palm coordinates.
- `rhythm/rhythm-archetypes.js` — four corner motifs and axis labels.
- `drums/kit-manifest.js` — kit ids, labels, asset paths, and trim values.
- `drums/DrumKitManager.js` — load kits, select/cycle kit, trigger samples, emit semantic events.
- `gesture/KitSwitchGesture.js` — fist-hold/open-window/cooldown state machine.
- `scripts/build-drum-kits.mjs` — deterministic offline Electronic and Synthwave WAV generator.
- `tests/rhythm-zone.test.mjs`
- `tests/drum-kit-assets.test.mjs`
- `tests/drum-kit-manager.test.mjs`
- `tests/kit-switch-gesture.test.mjs`

**Modify**

- `scripts/build-rhythm-grid.mjs` — generate the hybrid four-corner 49-cell map.
- `rhythm/rhythm-grid.json` — regenerated deterministic output.
- `tests/rhythm-grid.test.mjs` — anchor, uniqueness, density, and syncopation assertions.
- `DrumManager.js` — delegate playback and kit state to `DrumKitManager`.
- `game.js` — zone mapping and right-hand kit gesture observation.
- `RhythmGridOverlay.js` — kit label rendering.
- `index.html` — kit output and manual Control Deck selector.
- `styles.css` — 160 px grid and compact kit status.
- `StateManager.js` — semantic `drumKitName` state.
- `main.js` — event-driven kit UI and manual fallback.
- `tests/rhythm-integration-contract.test.mjs`
- `tests/ui-shell.test.mjs`
- `tests/state-manager.test.mjs`
- `tests/audio-routing-contract.test.mjs`

**Move**

- `assets/kick.wav` → `assets/drums/acoustic/kick.wav`
- `assets/snare.wav` → `assets/drums/acoustic/snare.wav`
- `assets/hihat.wav` → `assets/drums/acoustic/hihat.wav`
- `assets/openhat.wav` → `assets/drums/acoustic/openhat.wav`
- `assets/clap.wav` → `assets/drums/acoustic/clap.wav`

---

### Task 1: Normalize the approved right-hand performance zone

**Files:**
- Create: `rhythm/RhythmZone.js`
- Create: `tests/rhythm-zone.test.mjs`

- [ ] **Step 1: Write the failing zone tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { RhythmZone, RIGHT_HAND_ZONE } from '../rhythm/RhythmZone.js';

test('maps the approved zone corners and center into unit coordinates', () => {
  const zone = new RhythmZone();
  assert.deepEqual(zone.map(RIGHT_HAND_ZONE.left, RIGHT_HAND_ZONE.top), { x: 0, y: 0 });
  assert.deepEqual(zone.map(RIGHT_HAND_ZONE.right, RIGHT_HAND_ZONE.bottom), { x: 1, y: 1 });
  assert.deepEqual(zone.map(0.75, 0.51), { x: 0.5, y: 0.5 });
});

test('clamps positions outside the red-box zone to the nearest edge', () => {
  const zone = new RhythmZone();
  assert.deepEqual(zone.map(0, 0), { x: 0, y: 0 });
  assert.deepEqual(zone.map(1, 1), { x: 1, y: 1 });
  assert.deepEqual(zone.map(0.75, 0), { x: 0.5, y: 0 });
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `node --test tests/rhythm-zone.test.mjs`  
Expected: FAIL because `rhythm/RhythmZone.js` does not exist.

- [ ] **Step 3: Implement the pure mapper**

```js
export const RIGHT_HAND_ZONE = Object.freeze({
  left: 0.56,
  right: 0.94,
  top: 0.18,
  bottom: 0.84,
});

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));

export class RhythmZone {
  constructor(bounds = RIGHT_HAND_ZONE) {
    this.bounds = Object.freeze({ ...bounds });
  }

  map(screenX, screenY) {
    const { left, right, top, bottom } = this.bounds;
    const x = (clamp(screenX, left, right) - left) / (right - left);
    const y = (clamp(screenY, top, bottom) - top) / (bottom - top);
    return { x, y };
  }
}
```

- [ ] **Step 4: Run tests and commit**

Run: `node --test tests/rhythm-zone.test.mjs`  
Expected: 2/2 PASS.

```bash
git add rhythm/RhythmZone.js tests/rhythm-zone.test.mjs
git commit -m "feat: map the right-hand rhythm zone"
```

---

### Task 2: Rebuild the deterministic grid around four electronic anchors

**Files:**
- Create: `rhythm/rhythm-archetypes.js`
- Modify: `scripts/build-rhythm-grid.mjs`
- Modify: `rhythm/rhythm-grid.json`
- Modify: `tests/rhythm-grid.test.mjs`

- [ ] **Step 1: Extend the grid tests before changing the generator**

Add exact anchor and center expectations:

```js
const byId = (x, y) => RHYTHM_GRID.find((cell) => cell.x === x && cell.y === y);

test('uses the approved electronic rhythm anchors and stable center', () => {
  assert.equal(byId(0, 0).archetype, 'MINIMAL HOUSE');
  assert.equal(byId(0, 6).archetype, 'TECHNO DRIVE');
  assert.equal(byId(6, 0).archetype, 'ELECTRO BREAK');
  assert.equal(byId(6, 6).archetype, 'GLITCH RUSH');
  assert.equal(byId(3, 3).archetype, 'HYBRID GROOVE');
});

test('keeps every complete 7x7 pattern unique', () => {
  const signatures = RHYTHM_GRID.map(({ pattern }) => JSON.stringify(pattern));
  assert.equal(new Set(signatures).size, 49);
});
```

Keep the existing density and syncopation tests, but rename axis language to `STRAIGHT → BROKEN` and `MINIMAL → ENERGY`.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/rhythm-grid.test.mjs`  
Expected: FAIL because cells do not contain the approved `archetype` anchors.

- [ ] **Step 3: Define immutable anchor motifs**

Create `rhythm/rhythm-archetypes.js` with these exact 16-step motifs:

```js
export const TRACKS = Object.freeze(['kick', 'snare', 'hihat', 'openhat', 'clap']);

const bits = (value) => Object.freeze([...value].map(Number));
const motif = ({ kick, snare, hihat, openhat, clap }) => Object.freeze({
  kick: bits(kick), snare: bits(snare), hihat: bits(hihat),
  openhat: bits(openhat), clap: bits(clap),
});

export const RHYTHM_ARCHETYPES = Object.freeze({
  minimalHouse: Object.freeze({ name: 'MINIMAL HOUSE', pattern: motif({
    kick: '1000100010001000', snare: '0000100000001000',
    hihat: '0010001000100010', openhat: '0000000000000000', clap: '0000000000001000',
  }) }),
  technoDrive: Object.freeze({ name: 'TECHNO DRIVE', pattern: motif({
    kick: '1000100010001000', snare: '0000100000001000',
    hihat: '1111111111111111', openhat: '0010001000100010', clap: '0000100000001000',
  }) }),
  electroBreak: Object.freeze({ name: 'ELECTRO BREAK', pattern: motif({
    kick: '1001000100100010', snare: '0000100000011000',
    hihat: '0010001000100010', openhat: '0000000100000001', clap: '0000000000001000',
  }) }),
  glitchRush: Object.freeze({ name: 'GLITCH RUSH', pattern: motif({
    kick: '1010010100101010', snare: '0010010000100100',
    hihat: '1111111111111111', openhat: '0010101010101010', clap: '0000010000100100',
  }) }),
});

export const X_LABELS = Object.freeze(['STRAIGHT', 'PULSE', 'DRIVE', 'BREAK', 'SHIFT', 'GLITCH', 'BROKEN']);
export const Y_LABELS = Object.freeze(['MINIMAL', 'LEAN', 'LIGHT', 'GROOVE', 'LIFT', 'HOT', 'ENERGY']);
```

Use these exact anchor principles:

- `MINIMAL HOUSE`: kick on 0/4/8/12, snare on 4/12, sparse offbeat hat.
- `TECHNO DRIVE`: four-on-floor kick, snare/clap backbeat, 16th hats with controlled open hats.
- `ELECTRO BREAK`: syncopated kick at 0/3/7/10/14, backbeat plus ghost snare, sparse hats.
- `GLITCH RUSH`: broken kick/snare accents, dense hats, no more than three simultaneous tracks per step.

- [ ] **Step 4: Implement deterministic offline interpolation**

At the top of `scripts/build-rhythm-grid.mjs`, retain the existing `node:fs/promises` import and add:

```js
import { RHYTHM_ARCHETYPES, TRACKS, X_LABELS, Y_LABELS } from '../rhythm/rhythm-archetypes.js';
```

Then compute bilinear corner weights for every cell:

```js
const weights = (x, y) => {
  const nx = x / 6;
  const ny = y / 6;
  return {
    minimalHouse: (1 - nx) * (1 - ny),
    technoDrive: (1 - nx) * ny,
    electroBreak: nx * (1 - ny),
    glitchRush: nx * ny,
  };
};

const stableNoise = (x, y, trackIndex, step) => {
  const seed = ((x + 1) * 73856093) ^ ((y + 1) * 19349663)
    ^ ((trackIndex + 1) * 83492791) ^ ((step + 1) * 2654435761);
  return ((seed >>> 0) % 1000) / 1000;
};

const blendedHit = ({ x, y, track, trackIndex, step }) => {
  const w = weights(x, y);
  const score = Object.entries(w).reduce(
    (sum, [id, weight]) => sum + RHYTHM_ARCHETYPES[id].pattern[track][step] * weight,
    0,
  );
  const energyBias = (y / 6) * (track === 'hihat' || track === 'openhat' ? 0.18 : 0.05);
  const threshold = 0.54 - energyBias + (stableNoise(x, y, trackIndex, step) - 0.5) * 0.12;
  return score >= threshold ? 1 : 0;
};
```

Apply the invariants with explicit helpers:

```js
const enforceInvariants = (pattern) => {
  pattern.kick[0] = 1;
  for (const step of [4, 12]) {
    if (!pattern.snare[step] && !pattern.clap[step]) pattern.snare[step] = 1;
  }
  for (let step = 0; step < 16; step += 1) {
    const active = TRACKS.filter((track) => pattern[track][step]);
    for (const removable of ['openhat', 'clap', 'hihat']) {
      if (active.length <= 3) break;
      if (pattern[removable][step]) {
        pattern[removable][step] = 0;
        active.splice(active.indexOf(removable), 1);
      }
    }
  }
  return pattern;
};

const clonePattern = (pattern) => Object.fromEntries(
  TRACKS.map((track) => [track, [...pattern[track]]]),
);

const makeUnique = (pattern, x, y, signatures) => {
  const first = JSON.stringify(pattern);
  if (!signatures.has(first)) { signatures.add(first); return pattern; }
  for (let attempt = 0; attempt < TRACKS.length * 16; attempt += 1) {
    const track = TRACKS[(x + y + attempt) % TRACKS.length];
    const step = (x * 7 + y + attempt * 5) % 16;
    const candidate = clonePattern(pattern);
    candidate[track][step] = candidate[track][step] ? 0 : 1;
    enforceInvariants(candidate);
    const signature = JSON.stringify(candidate);
    if (!signatures.has(signature)) { signatures.add(signature); return candidate; }
  }
  throw new Error(`Unable to make rhythm ${x}:${y} unique`);
};
```

Import `RHYTHM_ARCHETYPES`, `TRACKS`, `X_LABELS`, and `Y_LABELS`, then build the grid with this exact loop. The four corners copy their source motifs byte-for-byte; the center receives the stable semantic label while retaining the deterministic 50/50 blend.

```js
const anchorAt = new Map([
  ['0:0', RHYTHM_ARCHETYPES.minimalHouse],
  ['0:6', RHYTHM_ARCHETYPES.technoDrive],
  ['6:0', RHYTHM_ARCHETYPES.electroBreak],
  ['6:6', RHYTHM_ARCHETYPES.glitchRush],
]);
const signatures = new Set();
const grid = [];

for (let y = 0; y < 7; y += 1) {
  for (let x = 0; x < 7; x += 1) {
    const anchor = anchorAt.get(`${x}:${y}`);
    const blended = Object.fromEntries(TRACKS.map((track, trackIndex) => [
      track,
      Array.from({ length: 16 }, (_, step) => blendedHit({ x, y, track, trackIndex, step })),
    ]));
    const pattern = makeUnique(
      enforceInvariants(anchor ? clonePattern(anchor.pattern) : blended),
      x,
      y,
      signatures,
    );
    const fallback = `${X_LABELS[x]} / ${Y_LABELS[y]}`;
    const archetype = anchor?.name ?? (x === 3 && y === 3 ? 'HYBRID GROOVE' : fallback);
    grid.push({ id: `r${y + 1}c${x + 1}`, x, y, label: archetype, archetype, pattern });
  }
}
```

- [ ] **Step 5: Regenerate, test, audition the five anchor patterns, and commit**

Run:

```bash
node scripts/build-rhythm-grid.mjs
node --test tests/rhythm-grid.test.mjs tests/pattern-scheduler.test.mjs
```

Expected: all tests PASS; JSON contains 49 unique cells and the five exact archetype cells.

```bash
git add rhythm/rhythm-archetypes.js scripts/build-rhythm-grid.mjs rhythm/rhythm-grid.json tests/rhythm-grid.test.mjs
git commit -m "feat: curate four-corner electronic rhythms"
```

---

### Task 3: Generate and validate local Electronic and Synthwave drum assets

**Files:**
- Create: `scripts/build-drum-kits.mjs`
- Create: `tests/drum-kit-assets.test.mjs`
- Create: `assets/drums/electronic/*.wav`
- Create: `assets/drums/synthwave/*.wav`
- Move: current Acoustic WAV files into `assets/drums/acoustic/`

- [ ] **Step 1: Write the failing asset contract**

```js
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

const kits = ['acoustic', 'electronic', 'synthwave'];
const drums = ['kick', 'snare', 'hihat', 'openhat', 'clap'];

test('ships five valid local WAV files for every drum kit under three megabytes total', async () => {
  let total = 0;
  for (const kit of kits) {
    for (const drum of drums) {
      const url = new URL(`../assets/drums/${kit}/${drum}.wav`, import.meta.url);
      const [header, info] = await Promise.all([readFile(url), stat(url)]);
      assert.equal(header.subarray(0, 4).toString(), 'RIFF');
      assert.equal(header.subarray(8, 12).toString(), 'WAVE');
      assert.ok(info.size > 1_000);
      total += info.size;
    }
  }
  assert.ok(total <= 3 * 1024 * 1024, `drum payload was ${total} bytes`);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/drum-kit-assets.test.mjs`  
Expected: FAIL because the kit directories do not exist.

- [ ] **Step 3: Move Acoustic assets and implement the deterministic generator**

Use `git mv` for the five existing files. In `scripts/build-drum-kits.mjs`, implement PCM16 mono WAV output at 44.1 kHz with:

```js
const SAMPLE_RATE = 44_100;
const clamp = (value) => Math.max(-1, Math.min(1, value));

function seededNoise(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return (state / 0xffffffff) * 2 - 1;
  };
}

function writeWav(samples) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((sample, index) => buffer.writeInt16LE(Math.round(clamp(sample) * 32767), 44 + index * 2));
  return buffer;
}
```

Add these renderers and fixed configurations below `writeWav`:

```js
const render = (seconds, sampleAt) => Float32Array.from(
  { length: Math.ceil(seconds * SAMPLE_RATE) },
  (_, index) => sampleAt(index / SAMPLE_RATE, index),
);

const kick = ({ seconds, startHz, endHz, decay, click }) => render(seconds, (t) => {
  const sweep = endHz + (startHz - endHz) * Math.exp(-t * 28);
  const body = Math.sin(2 * Math.PI * sweep * t) * Math.exp(-t * decay);
  const transient = (t < 0.012 ? (1 - t / 0.012) * click : 0) * Math.sin(2 * Math.PI * 1800 * t);
  return body * 0.88 + transient;
});

const noiseDrum = ({ seconds, seed, bodyHz, decay, noiseLevel }) => {
  const noise = seededNoise(seed);
  let previous = 0;
  return render(seconds, (t) => {
    const raw = noise();
    const high = raw - previous * 0.92;
    previous = raw;
    const env = Math.exp(-t * decay);
    return (Math.sin(2 * Math.PI * bodyHz * t) * 0.32 + high * noiseLevel) * env;
  });
};

const hat = ({ seconds, seed, decay }) => {
  const noise = seededNoise(seed);
  let previous = 0;
  return render(seconds, (t) => {
    const raw = noise();
    const high = raw - previous;
    previous = raw;
    return high * 0.42 * Math.exp(-t * decay);
  });
};

const clap = ({ seconds, seed, decay, spacing }) => {
  const noise = seededNoise(seed);
  const bursts = [0, spacing, spacing * 2, spacing * 3];
  return render(seconds, (t) => {
    const burst = bursts.reduce((sum, start) => (
      t >= start ? sum + Math.exp(-(t - start) * decay) : sum
    ), 0);
    return noise() * burst * 0.24;
  });
};

const configs = {
  electronic: {
    kick: () => kick({ seconds: 0.42, startHz: 150, endHz: 48, decay: 11, click: 0.34 }),
    snare: () => noiseDrum({ seconds: 0.34, seed: 2101, bodyHz: 190, decay: 15, noiseLevel: 0.58 }),
    hihat: () => hat({ seconds: 0.11, seed: 2102, decay: 42 }),
    openhat: () => hat({ seconds: 0.48, seed: 2103, decay: 9 }),
    clap: () => clap({ seconds: 0.30, seed: 2104, decay: 32, spacing: 0.018 }),
  },
  synthwave: {
    kick: () => kick({ seconds: 0.62, startHz: 120, endHz: 42, decay: 7.5, click: 0.18 }),
    snare: () => noiseDrum({ seconds: 0.72, seed: 3101, bodyHz: 165, decay: 7, noiseLevel: 0.52 }),
    hihat: () => hat({ seconds: 0.15, seed: 3102, decay: 30 }),
    openhat: () => hat({ seconds: 0.68, seed: 3103, decay: 6.5 }),
    clap: () => clap({ seconds: 0.62, seed: 3104, decay: 15, spacing: 0.024 }),
  },
};

for (const [kit, drums] of Object.entries(configs)) {
  const directory = new URL(`../assets/drums/${kit}/`, import.meta.url);
  await mkdir(directory, { recursive: true });
  for (const [name, build] of Object.entries(drums)) {
    await writeFile(new URL(`${name}.wav`, directory), writeWav(build()));
  }
}
```

Add this import at the top of the generator:

```js
import { mkdir, writeFile } from 'node:fs/promises';
```

The fixed seeds make repeated builds byte-stable.

- [ ] **Step 4: Generate, validate, and commit**

Run:

```bash
node scripts/build-drum-kits.mjs
node --test tests/drum-kit-assets.test.mjs
```

Expected: PASS; 15 valid WAV files; total ≤ 3 MB.

```bash
git add scripts/build-drum-kits.mjs tests/drum-kit-assets.test.mjs assets/drums
git commit -m "feat: add electronic and synthwave drum kits"
```

---

### Task 4: Add a resilient long-lived DrumKitManager

**Files:**
- Create: `drums/kit-manifest.js`
- Create: `drums/DrumKitManager.js`
- Create: `tests/drum-kit-manager.test.mjs`

- [ ] **Step 1: Write failing state and failure-isolation tests**

Test with an injected fake players factory:

```js
function fakePlayers(id) {
  const drums = new Map();
  return {
    id,
    player(drum) {
      if (!drums.has(drum)) {
        drums.set(drum, {
          starts: [],
          volume: { value: 0 },
          start(time) { this.starts.push(time); },
        });
      }
      return drums.get(drum);
    },
  };
}

async function loadedManagerWithout(unavailableId) {
  const manager = new DrumKitManager({
    createPlayers: async (kit) => {
      if (kit.id === unavailableId) throw new Error('missing');
      return fakePlayers(kit.id);
    },
  });
  await manager.load();
  return manager;
}

test('loads kits independently and cycles only through ready kits', async () => {
  const manager = new DrumKitManager({
    createPlayers: async (kit) => {
      if (kit.id === 'electronic') throw new Error('missing');
      return fakePlayers(kit.id);
    },
  });
  await manager.load();
  assert.equal(manager.getCurrentKit().id, 'acoustic');
  assert.equal(manager.cycleKit({ source: 'gesture' }).kit.id, 'synthwave');
  assert.equal(manager.cycleKit({ source: 'gesture' }).kit.id, 'acoustic');
});

test('an unavailable selection keeps the previous kit without throwing', async () => {
  const manager = await loadedManagerWithout('electronic');
  const result = manager.setKit('electronic', { source: 'manual' });
  assert.equal(result.changed, false);
  assert.equal(result.reason, 'unavailable');
  assert.equal(manager.getCurrentKit().id, 'acoustic');
});

test('emits once, delegates triggers, and applies volumes to every ready kit', async () => {
  const created = new Map();
  const manager = new DrumKitManager({
    createPlayers: async (kit) => {
      const players = fakePlayers(kit.id);
      created.set(kit.id, players);
      return players;
    },
  });
  await manager.load();
  const events = [];
  manager.addEventListener('kitchange', ({ detail }) => events.push(detail));
  assert.equal(manager.setKit('acoustic', { source: 'manual' }).reason, 'current');
  assert.equal(manager.setKit('electronic', { source: 'manual' }).changed, true);
  assert.equal(events.length, 1);
  manager.trigger('kick', 1.25);
  assert.deepEqual(created.get('electronic').player('kick').starts, [1.25]);
  manager.setDrumVolume('snare', -7);
  assert.equal(created.get('acoustic').player('snare').volume.value, -7);
  assert.equal(created.get('electronic').player('snare').volume.value, -9);
  assert.equal(created.get('synthwave').player('snare').volume.value, -10);
});

test('resolves safely when all kits fail and keeps load idempotent', async () => {
  let attempts = 0;
  const manager = new DrumKitManager({
    createPlayers: async () => { attempts += 1; throw new Error('offline'); },
  });
  const first = manager.load();
  const second = manager.load();
  assert.equal(first, second);
  await first;
  assert.equal(attempts, 3);
  assert.equal(manager.getCurrentKit(), null);
  assert.equal(manager.cycleKit({ source: 'gesture' }).reason, 'unavailable');
  assert.doesNotThrow(() => manager.trigger('kick', 0));
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/drum-kit-manager.test.mjs`  
Expected: FAIL because the manager module does not exist.

- [ ] **Step 3: Add the manifest**

```js
const drums = ['kick', 'snare', 'hihat', 'openhat', 'clap'];
const urls = (folder) => Object.fromEntries(drums.map((drum) => [drum, `assets/drums/${folder}/${drum}.wav`]));

export const DRUM_KITS = Object.freeze([
  Object.freeze({ id: 'acoustic', name: 'ACOUSTIC', urls: Object.freeze(urls('acoustic')), trim: 0 }),
  Object.freeze({ id: 'electronic', name: 'ELECTRONIC', urls: Object.freeze(urls('electronic')), trim: -2 }),
  Object.freeze({ id: 'synthwave', name: 'SYNTHWAVE', urls: Object.freeze(urls('synthwave')), trim: -3 }),
]);
```

- [ ] **Step 4: Implement the manager API**

The public methods are:

```js
await manager.load();
manager.getCurrentKit();
manager.getKitStatuses();
manager.setKit(id, { source });
manager.cycleKit({ source });
manager.trigger(drumId, time);
manager.setDrumVolume(drumId, dB);
manager.addEventListener('kitchange', listener);
```

Implement the production factory and manager as follows. `load()` remains idempotent, every kit loads independently, and an all-kit failure resolves with no active kit instead of breaking camera, melody, or recording startup.

```js
import * as Tone from '../audio/tone.js';
import { audioBus } from '../audio/AudioBus.js';
import { DRUM_KITS } from './kit-manifest.js';

const initialVolumes = Object.freeze({ kick: -9, snare: -3, hihat: -5, openhat: -9, clap: -18 });

function createTonePlayers(kit) {
  return new Promise((resolve, reject) => {
    let players;
    players = new Tone.Players({
      urls: kit.urls,
      onload: () => resolve(players),
      onerror: reject,
    });
    players.connect(audioBus.input);
  });
}

function kitEvent(detail) {
  const event = new Event('kitchange');
  Object.defineProperty(event, 'detail', { value: detail });
  return event;
}

export class DrumKitManager extends EventTarget {
  constructor({ kits = DRUM_KITS, createPlayers = createTonePlayers } = {}) {
    super();
    this.kits = kits;
    this.createPlayers = createPlayers;
    this.players = new Map();
    this.statuses = new Map(kits.map(({ id }) => [id, 'loading']));
    this.volumes = { ...initialVolumes };
    this.currentId = null;
    this.loadPromise = null;
  }

  load() {
    if (!this.loadPromise) this.loadPromise = this.loadAll();
    return this.loadPromise;
  }

  async loadAll() {
    await Promise.allSettled(this.kits.map(async (kit) => {
      try {
        const players = await this.createPlayers(kit);
        this.players.set(kit.id, players);
        this.statuses.set(kit.id, 'ready');
        for (const [drum, dB] of Object.entries(this.volumes)) {
          players.player(drum).volume.value = dB + kit.trim;
        }
      } catch {
        this.statuses.set(kit.id, 'error');
      }
    }));
    const acoustic = this.statuses.get('acoustic') === 'ready' ? 'acoustic' : null;
    this.currentId = acoustic ?? this.kits.find(({ id }) => this.statuses.get(id) === 'ready')?.id ?? null;
    return this;
  }

  getCurrentKit() {
    return this.kits.find(({ id }) => id === this.currentId) ?? null;
  }

  getKitStatuses() {
    return this.kits.map(({ id, name }) => ({ id, name, status: this.statuses.get(id) }));
  }

  setKit(id, { source = 'manual' } = {}) {
    const kit = this.kits.find((candidate) => candidate.id === id) ?? null;
    if (!kit || this.statuses.get(id) !== 'ready') {
      return { changed: false, reason: 'unavailable', kit: this.getCurrentKit() };
    }
    if (id === this.currentId) return { changed: false, reason: 'current', kit };
    this.currentId = id;
    const detail = { kit, source };
    this.dispatchEvent(kitEvent(detail));
    return { changed: true, reason: 'changed', ...detail };
  }

  cycleKit({ source = 'gesture' } = {}) {
    const ready = this.kits.filter(({ id }) => this.statuses.get(id) === 'ready');
    if (!ready.length) return { changed: false, reason: 'unavailable', kit: null };
    const index = ready.findIndex(({ id }) => id === this.currentId);
    return this.setKit(ready[(index + 1 + ready.length) % ready.length].id, { source });
  }

  trigger(drumId, time) {
    this.players.get(this.currentId)?.player(drumId)?.start(time);
  }

  setDrumVolume(drumId, dB) {
    if (!Object.hasOwn(this.volumes, drumId)) return;
    this.volumes[drumId] = dB;
    for (const kit of this.kits) {
      const player = this.players.get(kit.id)?.player(drumId);
      if (player) player.volume.value = dB + kit.trim;
    }
  }
}
```

- [ ] **Step 5: Run tests and commit**

Run: `node --test tests/drum-kit-manager.test.mjs tests/audio-routing-contract.test.mjs`  
Expected: all PASS.

```bash
git add drums/kit-manifest.js drums/DrumKitManager.js tests/drum-kit-manager.test.mjs
git commit -m "feat: manage resilient drum timbre kits"
```

---

### Task 5: Route DrumManager through the active kit

**Files:**
- Modify: `DrumManager.js`
- Modify: `tests/rhythm-integration-contract.test.mjs`
- Modify: `tests/audio-routing-contract.test.mjs`

- [ ] **Step 1: Add failing integration contracts**

Add exact source contracts:

```js
const source = await readFile(new URL('../DrumManager.js', import.meta.url), 'utf8');
assert.match(source, /import \{ DrumKitManager \} from '\.\/drums\/DrumKitManager\.js'/);
assert.match(source, /const kitManager = new DrumKitManager\(\)/);
assert.match(source, /kitManager\.trigger\(drum, time\)/);
assert.match(source, /export const getCurrentDrumKit/);
assert.match(source, /export const getDrumKitStatuses/);
assert.match(source, /export const setDrumKit/);
assert.match(source, /export const cycleDrumKit/);
assert.match(source, /export const onDrumKitChange/);
assert.doesNotMatch(source, /new Tone\.Players/);
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/rhythm-integration-contract.test.mjs tests/audio-routing-contract.test.mjs`  
Expected: FAIL because DrumManager still owns the single Acoustic player.

- [ ] **Step 3: Refactor the module facade**

Replace `players`/`isLoaded` with one long-lived kit manager:

```js
const kitManager = new DrumKitManager();

export async function loadSamples() {
  await kitManager.load();
}

// Inside the sequence callback:
if (activeDrums.has(drum) && pattern[step]) kitManager.trigger(drum, time);

export const getCurrentDrumKit = () => kitManager.getCurrentKit();
export const getDrumKitStatuses = () => kitManager.getKitStatuses();
export const setDrumKit = (id, options) => kitManager.setKit(id, options);
export const cycleDrumKit = (options) => kitManager.cycleKit(options);
export const onDrumKitChange = (listener) => {
  const wrapped = ({ detail }) => listener(detail);
  kitManager.addEventListener('kitchange', wrapped);
  return () => kitManager.removeEventListener('kitchange', wrapped);
};
```

Replace `setDrumVolume` with the exact facade below so the existing control-deck state remains the source of truth and every loaded kit is updated:

```js
export function setDrumVolume(drumId, dB) {
  if (!Object.hasOwn(drumVolumes, drumId)) return;
  const value = Number.isFinite(dB) ? dB : drumVolumes[drumId];
  drumVolumes[drumId] = value;
  kitManager.setDrumVolume(drumId, value);
}
```

- [ ] **Step 4: Run tests and commit**

Run: `node --test tests/rhythm-integration-contract.test.mjs tests/audio-routing-contract.test.mjs tests/drum-kit-manager.test.mjs`  
Expected: all PASS.

```bash
git add DrumManager.js tests/rhythm-integration-contract.test.mjs tests/audio-routing-contract.test.mjs
git commit -m "feat: play rhythms through selectable drum kits"
```

---

### Task 6: Add the deliberate fist-to-open kit gesture

**Files:**
- Create: `gesture/KitSwitchGesture.js`
- Create: `tests/kit-switch-gesture.test.mjs`
- Modify: `game.js`
- Modify: `tests/left-hand-contract.test.mjs`

- [ ] **Step 1: Write failing pure state-machine tests**

Cover short fist, 500 ms arm, 1,200 ms expiry, valid open, and 800 ms cooldown:

```js
test('cycles once only after a held fist opens fully', () => {
  const gesture = new KitSwitchGesture();
  assert.equal(gesture.update({ isFist: true, isOpen: false, now: 0 }).triggered, false);
  assert.equal(gesture.update({ isFist: true, isOpen: false, now: 499 }).armed, false);
  assert.equal(gesture.update({ isFist: true, isOpen: false, now: 500 }).armed, true);
  const result = gesture.update({ isFist: false, isOpen: true, now: 700 });
  assert.equal(result.triggered, true);
  assert.equal(gesture.update({ isFist: false, isOpen: true, now: 701 }).triggered, false);
});

test('expires when the open gesture arrives after 1,200 ms', () => {
  const gesture = new KitSwitchGesture();
  gesture.update({ isFist: true, isOpen: false, now: 0 });
  gesture.update({ isFist: true, isOpen: false, now: 500 });
  assert.equal(gesture.update({ isFist: false, isOpen: true, now: 1701 }).triggered, false);
});

test('does not rearm until the 800 ms cooldown has elapsed', () => {
  const gesture = new KitSwitchGesture();
  gesture.update({ isFist: true, isOpen: false, now: 0 });
  gesture.update({ isFist: true, isOpen: false, now: 500 });
  assert.equal(gesture.update({ isFist: false, isOpen: true, now: 700 }).triggered, true);
  assert.equal(gesture.update({ isFist: true, isOpen: false, now: 1000 }).armed, false);
  assert.equal(gesture.update({ isFist: true, isOpen: false, now: 1499 }).armed, false);
  assert.equal(gesture.update({ isFist: true, isOpen: false, now: 1500 }).armed, false);
  assert.equal(gesture.update({ isFist: true, isOpen: false, now: 2000 }).armed, true);
});

test('kit switching is routed only through the stable right-hand branch', () => {
  const leftStart = game.indexOf("if (hand.side === 'Left')");
  const rightStart = game.indexOf("else if (hand.side === 'Right')", leftStart);
  const rightEnd = game.indexOf('categoryName', rightStart);
  assert.ok(leftStart >= 0 && rightStart > leftStart && rightEnd > rightStart);
  assert.doesNotMatch(game.slice(leftStart, rightStart), /rightKitGesture/);
  assert.match(game.slice(rightStart, rightEnd), /rightKitGesture\.update/);
  assert.match(game.slice(rightStart, rightEnd), /cycleDrumKit/);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/kit-switch-gesture.test.mjs`  
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement explicit states**

```js
export class KitSwitchGesture {
  constructor({ holdMs = 500, openWindowMs = 1200, cooldownMs = 800 } = {}) {
    Object.assign(this, { holdMs, openWindowMs, cooldownMs });
    this.reset();
  }

  reset() {
    this.phase = 'idle';
    this.fistSince = null;
    this.deadline = 0;
    this.cooldownUntil = 0;
  }

  update({ isFist, isOpen, now }) {
    const result = { armed: false, triggered: false, suppressDrums: this.phase === 'armed' || Boolean(isFist) };
    if (this.phase === 'cooldown') {
      if (now < this.cooldownUntil) return result;
      this.phase = 'idle';
    }
    if (this.phase === 'armed') {
      if (now > this.deadline) {
        this.phase = 'idle';
        this.fistSince = null;
        return { armed: false, triggered: false, suppressDrums: Boolean(isFist) };
      }
      if (isOpen) {
        this.phase = 'cooldown';
        this.cooldownUntil = now + this.cooldownMs;
        return { armed: false, triggered: true, suppressDrums: false };
      }
      return result;
    }
    if (!isFist) { this.fistSince = null; return result; }
    if (this.fistSince === null) this.fistSince = now;
    if (now - this.fistSince >= this.holdMs) {
      this.phase = 'armed';
      this.deadline = now + this.openWindowMs;
      result.armed = true;
      result.suppressDrums = true;
    }
    return result;
  }
}
```

- [ ] **Step 4: Integrate only in the right-hand branch**

Import `KitSwitchGesture`, instantiate `this.rightKitGesture = new KitSwitchGesture()` beside the other gesture-state objects, and use the existing transpiled `_this1` alias inside the right-hand branch:

```js
const isFist = _this1._isFist(smoothedLandmarks);
const isOpen = ['index', 'middle', 'ring', 'pinky'].every((finger) => fingerStates[finger]);
let kitGesture = { armed: false, triggered: false, suppressDrums: false };
if (interactionsEnabled) {
  kitGesture = _this1.rightKitGesture.update({ isFist, isOpen, now: performance.now() });
} else {
  _this1.rightKitGesture.reset();
}
if (kitGesture.armed) _this1._showInfoTransient('KIT READY', 900);
if (kitGesture.triggered) {
  const result = drumManager.cycleDrumKit({ source: 'gesture' });
  if (result.changed) _this1._showInfoTransient(`DRUM KIT: ${result.kit.name}`, 1600);
}
drumManager.updateActiveDrums(
  interactionsEnabled && !kitGesture.suppressDrums ? fingerStates : {},
);
```

In the existing `hand.side === 'Right'` loss branch, call `_this1.rightKitGesture.reset()` immediately before `drumManager.updateActiveDrums({})`. Do not place this logic in the left-hand branch or recording thumb-intent path.

- [ ] **Step 5: Run tests and commit**

Run: `node --test tests/kit-switch-gesture.test.mjs tests/left-hand-contract.test.mjs tests/thumb-gesture.test.mjs`  
Expected: all PASS.

```bash
git add gesture/KitSwitchGesture.js game.js tests/kit-switch-gesture.test.mjs tests/left-hand-contract.test.mjs
git commit -m "feat: switch drum kits with a held fist"
```

---

### Task 7: Wire zone mapping, enlarged overlay, kit status, and manual fallback

**Files:**
- Modify: `game.js`
- Modify: `RhythmGridOverlay.js`
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `StateManager.js`
- Modify: `main.js`
- Modify: `tests/ui-shell.test.mjs`
- Modify: `tests/state-manager.test.mjs`
- Modify: `tests/rhythm-integration-contract.test.mjs`

- [ ] **Step 1: Add failing UI and routing assertions**

Assert:

```js
assert.match(game, /new RhythmZone\(\)/);
assert.match(game, /rhythmZone\.map\(1 - normX_visible, normY_visible\)/);
assert.match(html, /id="drum-kit-label"/);
assert.match(html, /id="drum-kit-select"/);
assert.match(styles, /\.rhythm-space__grid[\s\S]*?width:\s*160px/);
assert.match(main, /onDrumKitChange/);
assert.match(main, /setDrumKit\(drumKitSelect\.value/);
```

Extend the initial-state assertion with:

```js
drumKitName: 'ACOUSTIC',
```

Add a state-only test; the overlay remains event-driven through `main.js`, so StateManager does not own a second DOM binding:

```js
test('stores the active drum kit as semantic state', () => {
  const manager = new StateManager();
  assert.equal(manager.getState().drumKitName, 'ACOUSTIC');
  manager.setState({ drumKitName: 'SYNTHWAVE' });
  assert.equal(manager.getState().drumKitName, 'SYNTHWAVE');
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/ui-shell.test.mjs tests/state-manager.test.mjs tests/rhythm-integration-contract.test.mjs`  
Expected: FAIL on missing zone and kit UI.

- [ ] **Step 3: Route palm coordinates through RhythmZone**

In `game.js`, import `RhythmZone`, instantiate `this.rhythmZone = new RhythmZone()` beside `this.rhythmSpace`, and replace the current right-hand call with:

```js
var zonePoint = _this1.rhythmZone.map(1 - normX_visible, normY_visible);
var cell = _this1.rhythmSpace.update(zonePoint.x, zonePoint.y);
```

Finger states continue using the full tracked hand regardless of the zone clamp.

- [ ] **Step 4: Add compact semantic markup**

Under `#rhythm-cell-label` add:

```html
<output id="drum-kit-label">KIT / ACOUSTIC</output>
```

Replace the two existing axis strings with:

```html
<span class="rhythm-space__axis rhythm-space__axis--x">STRAIGHT → BROKEN</span>
<span class="rhythm-space__axis rhythm-space__axis--y">MINIMAL → ENERGY</span>
```

In Control Deck add:

```html
<label>DRUM KIT
  <select id="drum-kit-select" aria-label="鼓组音色">
    <option value="acoustic">ACOUSTIC</option>
    <option value="electronic">ELECTRONIC</option>
    <option value="synthwave">SYNTHWAVE</option>
  </select>
</label>
```

- [ ] **Step 5: Enlarge without adding a central overlay**

Apply these desktop overrides while preserving the existing mobile transform:

```css
.rhythm-space {
  right: 24px;
  bottom: 22px;
  width: 194px;
}

.rhythm-space__grid {
  width: 160px;
  height: 160px;
  margin: 13px 0 0 28px;
}

.rhythm-space__axis--x { top: 0; right: 6px; }
.rhythm-space__axis--y { top: 108px; left: -47px; }

#drum-kit-label {
  display: block;
  margin-top: 4px;
  color: var(--muted);
  font: 500 8px/1.2 var(--mono);
  letter-spacing: 0.08em;
  text-align: right;
}
```

- [ ] **Step 6: Wire event-driven status and availability**

In `RhythmGridOverlay`, cache `drum-kit-label` in the constructor and add:

```js
updateKit({ name } = {}) {
  if (this.kitLabel && name) this.kitLabel.textContent = `KIT / ${name}`;
}
```

Subscribe once and keep all availability updates in one function:

```js
const drumKitSelect = document.getElementById('drum-kit-select');
const syncDrumKitUi = () => {
  const kit = drumManager.getCurrentDrumKit();
  if (kit) {
    rhythmOverlay.updateKit(kit);
    stateManager.setState({ drumKitName: kit.name });
    if (drumKitSelect) drumKitSelect.value = kit.id;
  }
  const statuses = new Map(drumManager.getDrumKitStatuses().map((item) => [item.id, item.status]));
  for (const option of drumKitSelect?.options ?? []) {
    option.disabled = statuses.get(option.value) !== 'ready';
  }
};

drumManager.onDrumKitChange(syncDrumKitUi);

drumKitSelect?.addEventListener('change', () => {
  const result = drumManager.setDrumKit(drumKitSelect.value, { source: 'manual' });
  if (!result.changed && result.reason === 'unavailable') {
    drumKitSelect.value = drumManager.getCurrentDrumKit()?.id ?? '';
  }
});

drumManager.loadSamples().then(syncDrumKitUi);
```

`loadSamples()` is idempotent, so this shares the same promise as `Game._loadAssets()` and does not create a second player set. Never introduce polling.

- [ ] **Step 7: Run tests and commit**

Run:

```bash
node --test tests/ui-shell.test.mjs tests/state-manager.test.mjs tests/rhythm-integration-contract.test.mjs
npm.cmd test
git diff --check
```

Expected: full suite PASS; no whitespace errors.

```bash
git add game.js RhythmGridOverlay.js index.html styles.css StateManager.js main.js tests/ui-shell.test.mjs tests/state-manager.test.mjs tests/rhythm-integration-contract.test.mjs
git commit -m "feat: expose the right-hand rhythm and kit controls"
```

---

### Task 8: Browser, camera, recording, and Draft acceptance

**Files:**
- Modify: `docs/verification/2026-07-11-exhibition-v2-preview.md`

- [ ] **Step 1: Run the complete automated gate**

```bash
npm.cmd test
node --check game.js
git diff --check
git status --short
```

Expected: all tests PASS, syntax check succeeds, whitespace check is empty, and only the verification report is uncommitted.

- [ ] **Step 2: Perform local browser smoke**

At 1920×1080:

1. Start the audio context from a click.
2. Inject zone positions for all four corners, center, and two outside points; confirm edge clamping and 49-cell cursor reachability.
3. Cycle all three kits manually and confirm long-lived player identity remains stable.
4. Exercise the gesture state machine with synthetic landmark states.
5. Verify the 160 px overlay does not overlap the robot, social links, scene strip, or top HUD.
6. Inspect console; expected errors are none except headless camera permission denial when applicable.

- [ ] **Step 3: Perform real-camera and audible rehearsal**

Use the user's Chrome camera:

1. Visit red-box corners and center with the right palm.
2. Move outside each edge and verify the nearest edge cell stays selected.
3. Play each anchor in Acoustic, Electronic, and Synthwave.
4. Hold fist 500 ms and open four fingers; verify one switch only.
5. Repeat ordinary one-to-five finger drumming and confirm no accidental kit switch.
6. Compare kit loudness and confirm no clipping spike.

- [ ] **Step 4: Verify recording captures kit changes**

Record at least 10 seconds, switch kits twice, stop, seek in preview, upload, scan/open the public page, seek again, and verify the download link. Confirm the server returns `206 Partial Content` for a range probe.

- [ ] **Step 5: Update verification report and commit**

Record exact automated counts, browser results, any physical limitations, and the rollback commit. Do not mark physical steps passed unless they were actually performed.

```bash
git add docs/verification/2026-07-11-exhibition-v2-preview.md
git commit -m "docs: verify rhythm zone and drum kits"
git push
```

- [ ] **Step 6: Create a Draft only and stop at production gate**

```bash
npx.cmd netlify status
npx.cmd netlify deploy --dir . --message "Right-hand rhythm zone and drum kits" --json
```

Expected: a unique Draft URL. Verify invite entry and repeat the critical camera/audio/record/share smoke on that URL. Confirm `origin/main` and `https://arpeggiator-remix-2.netlify.app` remain unchanged.
