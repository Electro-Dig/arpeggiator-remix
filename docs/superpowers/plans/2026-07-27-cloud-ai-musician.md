# Cloud AI Musician Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create an independent local prototype of 双手乐队 with a restrained Gemini-to-Lyria auxiliary musician, selectable 5/10/20-second visual capture, safe audio routing, and failure isolation.

**Architecture:** Clone the approved exhibition branch into a standalone repository, preserve the local MediaPipe/Tone.js performance loop, and add a lazy cloud sidecar. A controller coordinates a non-overlapping capture scheduler, a Gemini vision prompt provider, a Lyria RealTime streaming provider, and a dedicated Tone.js AI input that joins the existing limiter/analyser/recording path without entering the local gesture-effects chain.

**Tech Stack:** Browser ES modules, Node.js test runner, Express, Tone.js/Web Audio, `@google/genai@1.0.0`, Gemini `gemini-2.5-flash-lite`, Lyria `models/lyria-realtime-exp`, local `.env.local`.

## Global Constraints

- Build the prototype at exactly `D:\Codex\arpeggiator-remix-cloud-ai-musician`.
- Clone from committed source revision `8f148d5` on `feature/exhibition-v2`; do not modify or deploy the existing exhibition project.
- Treat `D:\项目信息收集\项目中转\lyria-camera` as read-only reference material.
- Keep the existing MediaPipe gesture loop, Tone Transport, local scenes, drums, recording, and sharing behavior independent of cloud latency or failure.
- The AI feature is default-off and its panel is default-collapsed.
- The only AI roles are `ambient`, `sparse-melody`, and `air-texture`.
- The only periodic capture intervals are exactly 5, 10, and 20 seconds; default to 20 seconds.
- Capture one still frame with maximum dimension 256 pixels; never upload a video stream or raw hand-coordinate history.
- Allow at most one Gemini request in flight; skipped ticks are not queued.
- AI volume defaults to `-18 dB` and is clamped to `[-36 dB, -12 dB]` at every entry point.
- Lyria configuration always sets `muteDrums: true`, `muteBass: true`, and `onlyBassAndDrums: false`.
- Route Lyria audio through a fixed 180 Hz high-pass and the shared final limiter, analyser, speaker output, and `MediaStreamDestination`.
- Local accent events duck the AI branch by `-6 dB`, hold for at least 250 ms, and recover over 1.5 seconds.
- A Gemini failure keeps the previous Lyria prompts; a Lyria failure fades only the AI branch and never stops the local band.
- Load the existing test key from a gitignored `.env.local`; never print, persist in browser storage, or commit the key.
- The development credential endpoint exists only in `--dev` mode on `127.0.0.1`; no production deployment is part of this plan.

---

### Task 1: Create the standalone prototype baseline

**Files:**
- Create repository: `D:\Codex\arpeggiator-remix-cloud-ai-musician`
- Create: `tests/prototype-identity.test.mjs`
- Modify: `package.json:1-28`
- Modify: `package-lock.json`
- Modify: `README.md:1-20`
- Modify: `.env.example:1-22`
- Local-only: `.env.local`

**Interfaces:**
- Consumes: source Git revision `8f148d5`; reference `.env.local` containing `GEMINI_API_KEY`.
- Produces: independent branch `prototype/cloud-ai-musician`, pinned Google SDK and dotenv dependencies, and a gitignored local key file.

- [ ] **Step 1: Clone the committed branch and detach it from the original remote**

Run from `D:\Codex`:

```powershell
Test-Path 'D:\Codex\arpeggiator-remix-cloud-ai-musician'
git clone --no-local --branch feature/exhibition-v2 'D:\Codex\arpeggiator-remix-exhibition-v2' 'D:\Codex\arpeggiator-remix-cloud-ai-musician'
git -C 'D:\Codex\arpeggiator-remix-cloud-ai-musician' rev-parse HEAD
git -C 'D:\Codex\arpeggiator-remix-cloud-ai-musician' remote remove origin
git -C 'D:\Codex\arpeggiator-remix-cloud-ai-musician' switch -c prototype/cloud-ai-musician
```

Expected: the first command returns `False`, `rev-parse` returns `8f148d5...`, and `git remote -v` is empty after removal.

- [ ] **Step 2: Verify the untouched baseline**

Run:

```powershell
npm.cmd test
```

Expected: all existing tests pass before prototype changes.

- [ ] **Step 3: Write the failing project-identity test**

Create `tests/prototype-identity.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
const envExample = await readFile(new URL('../.env.example', import.meta.url), 'utf8');

test('standalone cloud AI musician prototype has explicit local-only identity', () => {
  assert.equal(packageJson.name, 'arpeggiator-remix-cloud-ai-musician');
  assert.equal(packageJson.dependencies['@google/genai'], '1.0.0');
  assert.equal(packageJson.dependencies.dotenv, '16.4.7');
  assert.match(readme, /云端 AI 辅助乐手原型/);
  assert.match(readme, /仅限 127\.0\.0\.1 本地测试/);
  assert.match(envExample, /^GEMINI_API_KEY=$/m);
});
```

- [ ] **Step 4: Run the identity test and confirm it fails**

Run:

```powershell
node --test tests/prototype-identity.test.mjs
```

Expected: FAIL because the cloned package still uses the original name and has no pinned Google dependencies.

- [ ] **Step 5: Pin dependencies and update the prototype identity**

Run:

```powershell
npm.cmd install --save-exact @google/genai@1.0.0 dotenv@16.4.7
```

Then set `package.json` name to `arpeggiator-remix-cloud-ai-musician`, add this block at the top of `README.md`, and append the key entry to `.env.example`:

```markdown
## 云端 AI 辅助乐手原型

本副本用于验证双手乐队与 Gemini/Lyria 辅助伴奏层。凭据会进入浏览器，
因此仅限 127.0.0.1 本地测试，不可直接公开部署。
```

```dotenv

# Local cloud AI prototype only. Keep the real value in .env.local.
GEMINI_API_KEY=
```

- [ ] **Step 6: Copy the existing local key without exposing its value**

Run:

```powershell
Copy-Item -LiteralPath 'D:\项目信息收集\项目中转\lyria-camera\.env.local' -Destination 'D:\Codex\arpeggiator-remix-cloud-ai-musician\.env.local'
git check-ignore -v .env.local
```

Expected: `.gitignore` ignores `.env.local`; do not run a command that prints its contents.

- [ ] **Step 7: Run the identity test and full suite**

Run:

```powershell
node --test tests/prototype-identity.test.mjs
npm.cmd test
```

Expected: both commands pass.

- [ ] **Step 8: Commit the independent baseline**

```powershell
git add package.json package-lock.json README.md .env.example tests/prototype-identity.test.mjs
git commit -m "chore: create cloud AI musician prototype baseline"
```

### Task 2: Define the auxiliary-musician policy and performance context

**Files:**
- Create: `cloud-ai/ai-musician-config.js`
- Create: `cloud-ai/performance-energy.js`
- Create: `tests/ai-musician-config.test.mjs`
- Create: `tests/performance-energy.test.mjs`

**Interfaces:**
- Produces: `AI_ROLE_DEFINITIONS`, `CAPTURE_INTERVAL_SECONDS`, `DEFAULT_AI_SETTINGS`, `normalizeAiSettings(input)`, `lyriaConfigFor({ roleId, sceneId, bpm })`, and `PerformanceEnergyTracker.update(handsBySide, now)`.
- Consumes: scene IDs already defined by `music/scenes.js`.

- [ ] **Step 1: Write failing configuration tests**

Create `tests/ai-musician-config.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AI_ROLE_DEFINITIONS,
  CAPTURE_INTERVAL_SECONDS,
  DEFAULT_AI_SETTINGS,
  lyriaConfigFor,
  normalizeAiSettings,
} from '../cloud-ai/ai-musician-config.js';

test('prototype exposes only the three approved roles and intervals', () => {
  assert.deepEqual(Object.keys(AI_ROLE_DEFINITIONS), ['ambient', 'sparse-melody', 'air-texture']);
  assert.deepEqual(CAPTURE_INTERVAL_SECONDS, [5, 10, 20]);
  assert.deepEqual(DEFAULT_AI_SETTINGS, {
    enabled: false,
    roleId: 'ambient',
    intervalSeconds: 20,
    volumeDb: -18,
  });
});

test('settings normalize to safe defaults and never exceed -12 dB', () => {
  assert.deepEqual(normalizeAiSettings({
    enabled: 1,
    roleId: 'unknown',
    intervalSeconds: 9,
    volumeDb: 4,
  }), {
    enabled: true,
    roleId: 'ambient',
    intervalSeconds: 20,
    volumeDb: -12,
  });
  assert.equal(normalizeAiSettings({ volumeDb: -99 }).volumeDb, -36);
});

test('every Lyria role keeps drums and bass muted', () => {
  for (const roleId of Object.keys(AI_ROLE_DEFINITIONS)) {
    const config = lyriaConfigFor({ roleId, sceneId: 'neon-drive', bpm: 120 });
    assert.equal(config.muteDrums, true);
    assert.equal(config.muteBass, true);
    assert.equal(config.onlyBassAndDrums, false);
    assert.equal(config.bpm, 120);
    assert.equal(config.scale, 'G_MAJOR_E_MINOR');
    assert.ok(config.density <= 0.25);
  }
});
```

- [ ] **Step 2: Run the configuration tests and confirm they fail**

Run:

```powershell
node --test tests/ai-musician-config.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement the fixed roles, clamps, and scene-to-Lyria scale map**

Create `cloud-ai/ai-musician-config.js` with these public values and rules:

```js
export const CAPTURE_INTERVAL_SECONDS = Object.freeze([5, 10, 20]);
export const DEFAULT_AI_SETTINGS = Object.freeze({
  enabled: false,
  roleId: 'ambient',
  intervalSeconds: 20,
  volumeDb: -18,
});

export const AI_ROLE_DEFINITIONS = Object.freeze({
  ambient: Object.freeze({
    label: '氛围铺底',
    density: 0.24,
    brightness: 0.42,
    guidance: 3,
    direction: '宽阔长音、缓慢变化、留出大量空间',
  }),
  'sparse-melody': Object.freeze({
    label: '稀疏旋律',
    density: 0.18,
    brightness: 0.58,
    guidance: 3.4,
    direction: '短小旋律回应、明显留白、避免持续主奏',
  }),
  'air-texture': Object.freeze({
    label: '空气纹理',
    density: 0.2,
    brightness: 0.72,
    guidance: 2.8,
    direction: '轻微颗粒、泛音和环境空气感',
  }),
});

const SCENE_SCALE = Object.freeze({
  'minimal-groove': 'E_MAJOR_D_FLAT_MINOR',
  'groove-pulse': 'E_MAJOR_D_FLAT_MINOR',
  'neon-drive': 'G_MAJOR_E_MINOR',
  'arcade-horizon': 'G_MAJOR_E_MINOR',
  'afterglow-coast': 'D_MAJOR_B_MINOR',
  'blue-hour-drift': 'C_MAJOR_A_MINOR',
});

export function normalizeAiSettings(input = {}) {
  const roleId = Object.hasOwn(AI_ROLE_DEFINITIONS, input.roleId)
    ? input.roleId
    : DEFAULT_AI_SETTINGS.roleId;
  const intervalSeconds = CAPTURE_INTERVAL_SECONDS.includes(Number(input.intervalSeconds))
    ? Number(input.intervalSeconds)
    : DEFAULT_AI_SETTINGS.intervalSeconds;
  const numericDb = Number(input.volumeDb);
  const volumeDb = Number.isFinite(numericDb)
    ? Math.max(-36, Math.min(-12, numericDb))
    : DEFAULT_AI_SETTINGS.volumeDb;
  return { enabled: Boolean(input.enabled), roleId, intervalSeconds, volumeDb };
}

export function lyriaConfigFor({ roleId, sceneId, bpm }) {
  const role = AI_ROLE_DEFINITIONS[roleId] ?? AI_ROLE_DEFINITIONS.ambient;
  return {
    bpm: Math.max(60, Math.min(200, Math.round(Number(bpm) || 120))),
    scale: SCENE_SCALE[sceneId] ?? 'SCALE_UNSPECIFIED',
    density: role.density,
    brightness: role.brightness,
    guidance: role.guidance,
    temperature: 1,
    muteDrums: true,
    muteBass: true,
    onlyBassAndDrums: false,
    musicGenerationMode: 'QUALITY',
  };
}
```

- [ ] **Step 4: Write failing performance-energy tests**

Create `tests/performance-energy.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { PerformanceEnergyTracker } from '../cloud-ai/performance-energy.js';

const hand = (x, y) => ({ landmarks: Array.from({ length: 21 }, (_, index) =>
  index === 9 ? { x, y } : { x: 0, y: 0 }) });

test('energy starts low and enters high only on a movement threshold crossing', () => {
  const tracker = new PerformanceEnergyTracker({ smoothing: 0, mediumSpeed: 0.12, highSpeed: 0.35 });
  assert.deepEqual(tracker.update({ Left: hand(0.2, 0.4), Right: null }, 0), {
    level: 'low', enteredHigh: false, speed: 0,
  });
  assert.equal(tracker.update({ Left: hand(0.22, 0.4), Right: null }, 100).level, 'medium');
  const high = tracker.update({ Left: hand(0.28, 0.4), Right: null }, 200);
  assert.equal(high.level, 'high');
  assert.equal(high.enteredHigh, true);
  assert.equal(tracker.update({ Left: hand(0.35, 0.4), Right: null }, 300).enteredHigh, false);
});

test('missing hands reset energy to low', () => {
  const tracker = new PerformanceEnergyTracker({ smoothing: 0 });
  tracker.update({ Left: hand(0.2, 0.2) }, 0);
  assert.equal(tracker.update({}, 100).level, 'low');
});
```

- [ ] **Step 5: Implement the deterministic energy tracker**

Create `cloud-ai/performance-energy.js`:

```js
function palms(handsBySide = {}) {
  return ['Left', 'Right']
    .map((side) => handsBySide?.[side]?.landmarks?.[9])
    .filter((point) => Number.isFinite(point?.x) && Number.isFinite(point?.y));
}

export class PerformanceEnergyTracker {
  constructor({ smoothing = 0.75, mediumSpeed = 0.12, highSpeed = 0.35 } = {}) {
    this.smoothing = smoothing;
    this.mediumSpeed = mediumSpeed;
    this.highSpeed = highSpeed;
    this.previous = null;
    this.speed = 0;
    this.level = 'low';
  }

  update(handsBySide = {}, now = 0) {
    const points = palms(handsBySide);
    if (!points.length) {
      this.previous = null;
      this.speed = 0;
      this.level = 'low';
      return { level: 'low', enteredHigh: false, speed: 0 };
    }
    const center = points.reduce((sum, point) => ({
      x: sum.x + point.x / points.length,
      y: sum.y + point.y / points.length,
    }), { x: 0, y: 0 });
    const instant = this.previous
      ? Math.hypot(center.x - this.previous.center.x, center.y - this.previous.center.y)
        / Math.max(0.001, (now - this.previous.now) / 1000)
      : 0;
    this.speed = this.smoothing * this.speed + (1 - this.smoothing) * instant;
    const next = this.speed >= this.highSpeed ? 'high'
      : this.speed >= this.mediumSpeed ? 'medium' : 'low';
    const enteredHigh = next === 'high' && this.level !== 'high';
    this.level = next;
    this.previous = { center, now };
    return { level: next, enteredHigh, speed: Number(this.speed.toFixed(3)) };
  }
}
```

- [ ] **Step 6: Run both test files**

Run:

```powershell
node --test tests/ai-musician-config.test.mjs tests/performance-energy.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit the policy layer**

```powershell
git add cloud-ai/ai-musician-config.js cloud-ai/performance-energy.js tests/ai-musician-config.test.mjs tests/performance-energy.test.mjs
git commit -m "feat: define auxiliary AI musician policy"
```

### Task 3: Implement non-overlapping capture scheduling

**Files:**
- Create: `cloud-ai/capture-scheduler.js`
- Create: `tests/capture-scheduler.test.mjs`

**Interfaces:**
- Consumes: async `onCapture({ reason, signal })`.
- Produces: `CaptureScheduler.start(intervalSeconds)`, `setIntervalSeconds(value)`, `captureNow()`, `pause()`, `resume()`, `stop()`, `dispose()`, and read-only `inFlight`.

- [ ] **Step 1: Write failing scheduler tests with an injected clock**

Create `tests/capture-scheduler.test.mjs` around a small fake timer:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { CaptureScheduler } from '../cloud-ai/capture-scheduler.js';

function fakeClock() {
  let nextId = 1;
  const tasks = new Map();
  return {
    setTimeoutFn(fn, ms) { const id = nextId++; tasks.set(id, { fn, ms }); return id; },
    clearTimeoutFn(id) { tasks.delete(id); },
    runNext() {
      const [id, task] = tasks.entries().next().value;
      tasks.delete(id);
      return task.fn();
    },
    pending() { return [...tasks.values()].map(({ ms }) => ms); },
  };
}

test('scheduler never overlaps or queues captures', async () => {
  const clock = fakeClock();
  let release;
  let calls = 0;
  const scheduler = new CaptureScheduler({
    onCapture: () => { calls += 1; return new Promise((resolve) => { release = resolve; }); },
    ...clock,
  });
  scheduler.start(5);
  const first = clock.runNext();
  assert.equal(calls, 1);
  assert.equal(await scheduler.captureNow(), false);
  release();
  await first;
  assert.deepEqual(clock.pending(), [5000]);
});

test('interval changes reschedule immediately and stop clears work', () => {
  const clock = fakeClock();
  const scheduler = new CaptureScheduler({ onCapture: async () => undefined, ...clock });
  scheduler.start(20);
  scheduler.setIntervalSeconds(10);
  assert.deepEqual(clock.pending(), [10000]);
  scheduler.stop();
  assert.deepEqual(clock.pending(), []);
});
```

- [ ] **Step 2: Run the scheduler tests and confirm failure**

Run:

```powershell
node --test tests/capture-scheduler.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement scheduling and cancellation**

Create `cloud-ai/capture-scheduler.js` so that:

```js
export class CaptureScheduler {
  constructor({
    onCapture,
    setTimeoutFn = setTimeout,
    clearTimeoutFn = clearTimeout,
  }) {
    this.onCapture = onCapture;
    this.setTimeoutFn = setTimeoutFn;
    this.clearTimeoutFn = clearTimeoutFn;
    this.timerId = null;
    this.intervalSeconds = 20;
    this.running = false;
    this.inFlight = false;
    this.abortController = null;
  }

  start(intervalSeconds = this.intervalSeconds) {
    this.running = true;
    this.setIntervalSeconds(intervalSeconds);
  }

  setIntervalSeconds(value) {
    this.intervalSeconds = [5, 10, 20].includes(Number(value)) ? Number(value) : 20;
    if (this.running) this.schedule();
    return this.intervalSeconds;
  }

  schedule() {
    if (this.timerId !== null) this.clearTimeoutFn(this.timerId);
    this.timerId = this.setTimeoutFn(() => this.run('timer'), this.intervalSeconds * 1000);
  }

  async run(reason) {
    this.timerId = null;
    if (!this.running || this.inFlight) return false;
    this.inFlight = true;
    this.abortController = new AbortController();
    try {
      await this.onCapture({ reason, signal: this.abortController.signal });
      return true;
    } finally {
      this.inFlight = false;
      this.abortController = null;
      if (this.running) this.schedule();
    }
  }

  captureNow() { return this.run('manual'); }
  pause() { this.running = false; if (this.timerId !== null) this.clearTimeoutFn(this.timerId); this.timerId = null; }
  resume() { if (!this.running) { this.running = true; this.schedule(); } }
  stop() { this.pause(); this.abortController?.abort(); }
  dispose() { this.stop(); }
}
```

Add a visibility listener that calls `pause()` when `document.hidden` is true and resumes from a full interval when it becomes visible. Inject `documentRef` in the constructor so Node tests do not require a DOM.

- [ ] **Step 4: Add visibility and manual-capture assertions**

Extend `tests/capture-scheduler.test.mjs` with a fake `EventTarget` document and assert:

```js
assert.equal(await scheduler.captureNow(), true);
documentRef.hidden = true;
documentRef.dispatchEvent(new Event('visibilitychange'));
assert.deepEqual(clock.pending(), []);
documentRef.hidden = false;
documentRef.dispatchEvent(new Event('visibilitychange'));
assert.deepEqual(clock.pending(), [20000]);
```

- [ ] **Step 5: Run the scheduler tests**

Run:

```powershell
node --test tests/capture-scheduler.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit the scheduler**

```powershell
git add cloud-ai/capture-scheduler.js tests/capture-scheduler.test.mjs
git commit -m "feat: schedule non-overlapping AI captures"
```

### Task 4: Generate constrained Gemini prompts from the existing camera

**Files:**
- Create: `cloud-ai/vision-prompt-provider.js`
- Create: `tests/vision-prompt-provider.test.mjs`

**Interfaces:**
- Consumes: existing `HTMLVideoElement`, Google GenAI client, `{ sceneId, sceneName, bpm, tonic, mode, energyLevel, roleId }`, and optional `AbortSignal`.
- Produces: `captureVideoFrame(video, options)` and `VisionPromptProvider.generate({ video, context, signal }): Promise<string[]>`.

- [ ] **Step 1: Write failing frame and prompt-contract tests**

Create `tests/vision-prompt-provider.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PromptContractError,
  VisionPromptProvider,
  captureVideoFrame,
} from '../cloud-ai/vision-prompt-provider.js';

test('capture scales the existing video to a maximum side of 256', () => {
  const canvas = {
    width: 0, height: 0,
    getContext: () => ({ drawImage: (...args) => { canvas.args = args; } }),
    toDataURL: () => 'data:image/jpeg;base64,AAAA',
  };
  const frame = captureVideoFrame(
    { videoWidth: 1920, videoHeight: 1080 },
    { canvasFactory: () => canvas },
  );
  assert.deepEqual({ width: canvas.width, height: canvas.height }, { width: 256, height: 144 });
  assert.equal(frame.mimeType, 'image/jpeg');
  assert.equal(frame.base64, 'AAAA');
});

test('provider sends scene context but no hand coordinates and returns exactly three prompts', async () => {
  let request;
  const ai = { models: { generateContent: async (value) => {
    request = value;
    return { text: JSON.stringify({ prompts: ['柔和玻璃泛音', '稀疏温暖长音', '轻微空气颗粒'] }) };
  } } };
  const provider = new VisionPromptProvider({ ai });
  const prompts = await provider.generate({
    frame: { mimeType: 'image/jpeg', base64: 'AAAA' },
    context: {
      sceneId: 'groove-pulse', sceneName: 'Groove Pulse', bpm: 115,
      tonic: 'E', mode: 'chromatic', energyLevel: 'medium', roleId: 'ambient',
    },
  });
  assert.equal(prompts.length, 3);
  const serialized = JSON.stringify(request);
  assert.match(serialized, /Groove Pulse/);
  assert.match(serialized, /禁止鼓、低音、人声和强主奏/);
  assert.doesNotMatch(serialized, /handsBySide|landmarks/);
});

test('invalid Gemini output is rejected instead of replacing valid music', async () => {
  const ai = { models: { generateContent: async () => ({ text: '{"prompts":["only one"]}' }) } };
  const provider = new VisionPromptProvider({ ai });
  await assert.rejects(
    provider.generate({ frame: { mimeType: 'image/jpeg', base64: 'AAAA' }, context: { roleId: 'ambient' } }),
    PromptContractError,
  );
});
```

- [ ] **Step 2: Run the vision tests and confirm failure**

Run:

```powershell
node --test tests/vision-prompt-provider.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement frame capture and strict response parsing**

Create `cloud-ai/vision-prompt-provider.js`. Use `Type` from `@google/genai`, `gemini-2.5-flash-lite`, JPEG quality `0.72`, and this response schema:

```js
config: {
  responseMimeType: 'application/json',
  responseSchema: {
    type: Type.OBJECT,
    required: ['prompts'],
    properties: {
      prompts: {
        type: Type.ARRAY,
        minItems: 3,
        maxItems: 3,
        items: { type: Type.STRING },
      },
    },
  },
}
```

Build the instruction from approved role metadata and local music context:

```js
const instruction = [
  '你是双手乐队后方的辅助乐手。',
  `角色：${role.label}；方向：${role.direction}。`,
  `当前场景：${sceneName}；BPM：${bpm}；调性：${tonic} ${mode}；现场能量：${energyLevel}。`,
  '根据图片气氛生成恰好三个简短中文音乐提示，每条不超过 24 个汉字。',
  '三个提示应互补、克制、留白明显。禁止鼓、低音、人声和强主奏，禁止突兀转折。',
].join('\n');
```

Trim prompts, reject non-strings, empty strings, arrays whose length is not three, and individual prompts longer than 24 Chinese characters after whitespace removal.

- [ ] **Step 4: Run the provider tests**

Run:

```powershell
node --test tests/vision-prompt-provider.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit the Gemini provider**

```powershell
git add cloud-ai/vision-prompt-provider.js tests/vision-prompt-provider.test.mjs
git commit -m "feat: generate restrained visual music prompts"
```

### Task 5: Stream and crossfade Lyria RealTime audio

**Files:**
- Create: `cloud-ai/pcm-audio.js`
- Create: `cloud-ai/live-music-provider.js`
- Create: `tests/pcm-audio.test.mjs`
- Create: `tests/live-music-provider.test.mjs`

**Interfaces:**
- Consumes: Google GenAI client, Tone raw `AudioContext`, an object implementing `connectSource(AudioBufferSourceNode)`, three prompt strings, and a complete Lyria config.
- Produces: `decodePcm16Stereo(base64, audioContext)`, `LiveMusicProvider.connect()`, `play()`, `setPrompts(prompts, { crossfadeSeconds })`, `setMusicContext(config)`, `stop()`, `dispose()`, and `error`/`playbackchange` events.

- [ ] **Step 1: Write failing PCM decoding tests**

Create `tests/pcm-audio.test.mjs` using a fake audio context and a base64-encoded interleaved stereo `Int16Array`. Assert that left and right samples are normalized independently and the created buffer uses 48,000 Hz and two channels.

Core assertion:

```js
assert.deepEqual([...created.channels[0]], [0, 32767 / 32768]);
assert.deepEqual([...created.channels[1]], [-1, -32768 / 32768]);
assert.deepEqual(created.meta, { channels: 2, frames: 2, sampleRate: 48000 });
```

- [ ] **Step 2: Implement browser-safe PCM decoding**

Create `cloud-ai/pcm-audio.js` with:

```js
export function decodeBase64(base64) {
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function decodePcm16Stereo(base64, audioContext) {
  const bytes = decodeBase64(base64);
  const samples = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
  const frames = samples.length / 2;
  const buffer = audioContext.createBuffer(2, frames, 48000);
  const left = new Float32Array(frames);
  const right = new Float32Array(frames);
  for (let frame = 0; frame < frames; frame += 1) {
    left[frame] = samples[frame * 2] / 32768;
    right[frame] = samples[frame * 2 + 1] / 32768;
  }
  buffer.copyToChannel(left, 0);
  buffer.copyToChannel(right, 1);
  return buffer;
}
```

Provide a Node fallback using `Buffer.from(base64, 'base64')` when `atob` is unavailable.

- [ ] **Step 3: Write failing live-session tests**

Create `tests/live-music-provider.test.mjs` with a fake session that records calls. Assert:

```js
assert.deepEqual(session.configs.at(-1), {
  musicGenerationConfig: {
    bpm: 115,
    scale: 'E_MAJOR_D_FLAT_MINOR',
    density: 0.24,
    brightness: 0.42,
    guidance: 3,
    temperature: 1,
    muteDrums: true,
    muteBass: true,
    onlyBassAndDrums: false,
    musicGenerationMode: 'QUALITY',
  },
});
assert.equal(session.resetContextCalls, 1);
assert.ok(session.promptUpdates.every(({ weightedPrompts }) =>
  weightedPrompts.every(({ weight }) => weight > 0)));
```

Also simulate two audio chunks and assert their `AudioBufferSourceNode.start()` times are continuous with an initial 2-second buffer.

- [ ] **Step 4: Implement the Lyria session adapter**

Create `cloud-ai/live-music-provider.js` with model `models/lyria-realtime-exp`. Follow these exact SDK calls:

```js
this.session = await this.ai.live.music.connect({
  model: this.model,
  callbacks: {
    onmessage: (message) => this.handleMessage(message),
    onerror: (error) => this.handleConnectionError(error),
    onclose: () => this.handleClose(),
  },
});

await this.session.setWeightedPrompts({ weightedPrompts });
await this.session.setMusicGenerationConfig({ musicGenerationConfig: completeConfig });
this.session.resetContext();
this.session.play();
```

Rules:

- Store the last complete config; every update sends all fields so omitted fields do not reset to server defaults.
- Call `resetContext()` only when BPM or scale changes after the first config.
- The first prompt set is immediate with weight `1`.
- Later sets crossfade old and new prompts every 200 ms; omit weight-zero prompts.
- Use 2 seconds of initial audio buffer, then schedule every decoded source at `nextStartTime`.
- On underrun, reset `nextStartTime` to `currentTime + 2` and emit `playbackchange: loading`.
- On provider stop, clear crossfade timers, call `session.stop()`, `session.close()`, clear pending sources, and reset the buffer cursor.

- [ ] **Step 5: Run PCM and Lyria unit tests**

Run:

```powershell
node --test tests/pcm-audio.test.mjs tests/live-music-provider.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit the Lyria adapter**

```powershell
git add cloud-ai/pcm-audio.js cloud-ai/live-music-provider.js tests/pcm-audio.test.mjs tests/live-music-provider.test.mjs
git commit -m "feat: stream and crossfade Lyria accompaniment"
```

### Task 6: Add a safe AI audio branch to the shared recording bus

**Files:**
- Create: `audio/cloud-ai-policy.js`
- Create: `audio/CloudAiInput.js`
- Modify: `audio/AudioBus.js:1-196`
- Create: `tests/cloud-ai-audio.test.mjs`
- Modify: `tests/audio-routing-contract.test.mjs:1-29`

**Interfaces:**
- Produces: `clampCloudAiVolumeDb(value)`, `CloudAiInput.connectSource(source)`, `setVolumeDb(db)`, `fadeIn()`, `fadeOut(seconds)`, `duck()`, `dispose()`.
- Extends `audioBus` with `cloudAiInput`, `setCloudAiVolumeDb(db)`, `fadeCloudAiIn()`, `fadeCloudAiOut(seconds)`, and `duckCloudAi()`.

- [ ] **Step 1: Write failing policy and source-routing tests**

Create `tests/cloud-ai-audio.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { clampCloudAiVolumeDb } from '../audio/cloud-ai-policy.js';

test('cloud AI volume is hard-clamped', () => {
  assert.equal(clampCloudAiVolumeDb(0), -12);
  assert.equal(clampCloudAiVolumeDb(-18), -18);
  assert.equal(clampCloudAiVolumeDb(-80), -36);
  assert.equal(clampCloudAiVolumeDb('bad'), -18);
});

test('cloud branch is high-passed and joins only before the final limiter', async () => {
  const source = await readFile(new URL('../audio/AudioBus.js', import.meta.url), 'utf8');
  const cloud = await readFile(new URL('../audio/CloudAiInput.js', import.meta.url), 'utf8');
  assert.match(cloud, /type:\s*['"]highpass['"]/);
  assert.match(cloud, /frequency:\s*180/);
  assert.match(source, /cloudAiInput\.connect\(this\.limiter\)/);
  assert.doesNotMatch(source, /cloudAiInput\.connect\(this\.lowPassFilter\)/);
  assert.match(source, /this\.limiter\.connect\(this\.mediaDestination\)/);
});
```

- [ ] **Step 2: Run the cloud-audio test and confirm failure**

Run:

```powershell
node --test tests/cloud-ai-audio.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement the pure audio policy**

Create `audio/cloud-ai-policy.js`:

```js
export const CLOUD_AI_DEFAULT_DB = -18;
export const CLOUD_AI_MIN_DB = -36;
export const CLOUD_AI_MAX_DB = -12;
export const CLOUD_AI_DUCK_DB = -6;

export function clampCloudAiVolumeDb(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return CLOUD_AI_DEFAULT_DB;
  return Math.max(CLOUD_AI_MIN_DB, Math.min(CLOUD_AI_MAX_DB, number));
}
```

- [ ] **Step 4: Implement the Tone.js AI branch**

Create `audio/CloudAiInput.js` using the pinned `audio/tone.js` entry:

```js
this.highPass = new Tone.Filter({ type: 'highpass', frequency: 180, Q: 0.7 });
this.userGain = new Tone.Gain(Tone.dbToGain(CLOUD_AI_DEFAULT_DB));
this.duckGain = new Tone.Gain(0);
this.highPass.connect(this.userGain);
this.userGain.connect(this.duckGain);
```

Expose `connect(destination)` and implement native-source connection with `Tone.connect(source, this.highPass)`. Use `Tone.dbToGain(-6)` for the duck target, an attack no longer than 80 ms, a 250 ms hold timer, and `gain.rampTo(1, 1.5)` for recovery. Repeated calls clear and restart the hold timer. `fadeIn()` ramps from the current value to `1` over 0.3 seconds; `fadeOut(seconds = 0.5)` ramps to `0`.

- [ ] **Step 5: Wire the branch into AudioBus**

In `audio/AudioBus.js`:

```js
this.cloudAiInput = new CloudAiInput();
this.cloudAiInput.connect(this.limiter);
```

Add wrapper methods and change `triggerBroadcastImpact()` to call `this.duckCloudAi()` immediately before returning `true`. Keep the existing limiter connections to analyser, destination, and `mediaDestination` unchanged.

- [ ] **Step 6: Extend the shared-bus contract and run tests**

Add `audio/CloudAiInput.js` to the sources checked by `tests/audio-routing-contract.test.mjs`; assert it imports `audio/tone.js` and never calls `.toDestination()`.

Run:

```powershell
node --test tests/cloud-ai-audio.test.mjs tests/audio-routing-contract.test.mjs
npm.cmd test
```

Expected: PASS.

- [ ] **Step 7: Commit the AI audio branch**

```powershell
git add audio/cloud-ai-policy.js audio/CloudAiInput.js audio/AudioBus.js tests/cloud-ai-audio.test.mjs tests/audio-routing-contract.test.mjs
git commit -m "feat: mix AI accompaniment through safe audio branch"
```

### Task 7: Coordinate cloud state without blocking the local band

**Files:**
- Create: `cloud-ai/ai-musician-controller.js`
- Create: `tests/ai-musician-controller.test.mjs`

**Interfaces:**
- Consumes: `createCloudServices(): Promise<{ visionProvider, liveMusicProvider }>`, `createScheduler(onCapture)`, `audioInput`, `getVideo()`, and `getMusicContext()`.
- Produces: `setEnabled(value)`, `setRole(roleId)`, `setIntervalSeconds(value)`, `setVolumeDb(value)`, `captureNow()`, `syncMusicContext(status)`, `handleHandFrame(detail)`, `retry()`, `dispose()`, `getState()`, and `statechange` events.

- [ ] **Step 1: Write failing controller tests with fakes**

Create `tests/ai-musician-controller.test.mjs`. Cover these behaviors:

```js
test('enable connects once, captures, configures, and starts Lyria', async () => {
  await controller.setEnabled(true);
  assert.equal(servicesCreated, 1);
  assert.equal(live.connectCalls, 1);
  assert.deepEqual(live.promptSets[0].prompts, prompts);
  assert.equal(live.playCalls, 1);
  assert.equal(controller.getState().status, 'playing');
});

test('Gemini failure keeps the previous music and scheduler alive', async () => {
  vision.error = new Error('vision offline');
  await scheduler.fire();
  assert.equal(live.stopCalls, 0);
  assert.equal(controller.getState().status, 'degraded');
  assert.equal(scheduler.running, true);
});

test('Lyria failure fades only AI and stops future capture', () => {
  live.dispatchEvent(new Event('error'));
  assert.equal(audio.fadeOutCalls.at(-1), 0.5);
  assert.equal(scheduler.running, false);
  assert.equal(localMusicStopCalls, 0);
});

test('disable aborts work and releases the whole cloud sidecar', async () => {
  await controller.setEnabled(false);
  assert.equal(scheduler.disposed, true);
  assert.equal(live.disposeCalls, 1);
  assert.equal(controller.getState().status, 'disabled');
});
```

- [ ] **Step 2: Run the controller tests and confirm failure**

Run:

```powershell
node --test tests/ai-musician-controller.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement the controller state model**

Use this stable public state shape:

```js
{
  enabled: false,
  expanded: false,
  status: 'disabled',
  roleId: 'ambient',
  intervalSeconds: 20,
  volumeDb: -18,
  prompts: [],
  error: '',
  energyLevel: 'low',
}
```

Implementation rules:

- `setEnabled(true)` does not touch the local transport.
- If `getMusicContext().isStarted` is false, retain enabled intent, show `observing`, and wait for `syncMusicContext({ isStarted: true })`.
- Create Google services lazily on the first actual connection.
- Connect Lyria, apply the complete safe config, perform one initial capture, send prompts, call `play()`, fade in, then start the scheduler.
- A successful later capture returns status from `prompting` to `playing`.
- A Gemini error preserves `state.prompts`, never calls `liveMusicProvider.stop()`, and permits the next scheduled retry.
- A Lyria `error` or unexpected close stops scheduling and fades the AI branch over 0.5 seconds.
- Changing roles sends a complete Lyria config and requests a fresh capture.
- Changing intervals calls `scheduler.setIntervalSeconds()`.
- `handleHandFrame()` feeds `PerformanceEnergyTracker`; only `enteredHigh` calls `audioInput.duck()`.
- `dispose()` is idempotent and removes every event listener.

- [ ] **Step 4: Run controller tests**

Run:

```powershell
node --test tests/ai-musician-controller.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit the controller**

```powershell
git add cloud-ai/ai-musician-controller.js tests/ai-musician-controller.test.mjs
git commit -m "feat: isolate cloud AI musician lifecycle"
```

### Task 8: Restrict development credentials to loopback mode

**Files:**
- Create: `server/dev-ai-config.js`
- Create: `tests/dev-ai-config.test.mjs`
- Create: `cloud-ai/dev-ai-client.js`
- Modify: `server.js:1-97`
- Modify: `index.html:20-28`
- Modify: `package.json:7-12`

**Interfaces:**
- Produces: `createDevAiConfigHandler({ enabled, apiKey })` and browser `createDevGoogleAiClient()`.
- Endpoint: `GET /api/dev/ai-config` returns `{ apiKey, apiVersion, geminiModel, lyriaModel }` only for a loopback request in development mode.

- [ ] **Step 1: Write failing endpoint-policy tests**

Create `tests/dev-ai-config.test.mjs` with fake request/response objects. Assert:

```js
assert.equal(invoke({ enabled: false, address: '127.0.0.1' }).status, 404);
assert.equal(invoke({ enabled: true, address: '192.168.1.4' }).status, 403);
assert.equal(invoke({ enabled: true, address: '127.0.0.1', apiKey: '' }).status, 503);
const ok = invoke({ enabled: true, address: '::1', apiKey: 'secret' });
assert.equal(ok.status, 200);
assert.equal(ok.headers['Cache-Control'], 'no-store');
assert.deepEqual(ok.body, {
  apiKey: 'secret',
  apiVersion: 'v1alpha',
  geminiModel: 'gemini-2.5-flash-lite',
  lyriaModel: 'models/lyria-realtime-exp',
});
```

- [ ] **Step 2: Run the endpoint test and confirm failure**

Run:

```powershell
node --test tests/dev-ai-config.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement the pure Express handler**

Create `server/dev-ai-config.js`. Accept loopback forms `127.0.0.1`, `::1`, and `::ffff:127.0.0.1`; set `Cache-Control: no-store`; never log the response body or key.

Return these status bodies:

```js
{ error: 'not-found' }       // 404 outside dev mode
{ error: 'loopback-only' }   // 403 for non-loopback clients
{ error: 'missing-api-key' } // 503 when the local key is absent
```

- [ ] **Step 4: Load `.env.local` only in local development and bind to loopback**

In `server.js`, define `IS_DEV` before middleware, call:

```js
if (IS_DEV) dotenv.config({ path: join(__dirname, '.env.local') });
app.get('/api/dev/ai-config', createDevAiConfigHandler({
  enabled: IS_DEV,
  apiKey: process.env.GEMINI_API_KEY ?? '',
}));
```

Move this API route before `express.static`. In `--dev` mode listen on `127.0.0.1`; retain `process.env.HOST || '0.0.0.0'` for non-development use. Do not include the key in startup logs.

- [ ] **Step 5: Add the browser SDK import map and client factory**

Add to the existing import map in `index.html`:

```json
"@google/genai": "https://esm.sh/@google/genai@1.0.0?bundle"
```

Create `cloud-ai/dev-ai-client.js`:

```js
import { GoogleGenAI } from '@google/genai';

export async function createDevGoogleAiClient(fetchFn = fetch) {
  const response = await fetchFn('/api/dev/ai-config', {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error ?? `ai-config-${response.status}`);
  }
  const config = await response.json();
  return {
    ai: new GoogleGenAI({ apiKey: config.apiKey, apiVersion: config.apiVersion }),
    geminiModel: config.geminiModel,
    lyriaModel: config.lyriaModel,
  };
}
```

- [ ] **Step 6: Add the local AI smoke script command**

Add to `package.json` scripts:

```json
"smoke:ai": "node scripts/ai-api-smoke.mjs"
```

The script itself is added in Task 11.

- [ ] **Step 7: Run endpoint and full tests**

Run:

```powershell
node --test tests/dev-ai-config.test.mjs tests/prototype-identity.test.mjs
npm.cmd test
```

Expected: PASS.

- [ ] **Step 8: Commit local credential isolation**

```powershell
git add server/dev-ai-config.js tests/dev-ai-config.test.mjs cloud-ai/dev-ai-client.js server.js index.html package.json package-lock.json
git commit -m "feat: expose AI credentials only to local prototype"
```

### Task 9: Build the collapsible AI musician panel

**Files:**
- Create: `cloud-ai/ai-musician-panel.js`
- Modify: `index.html:35-174`
- Modify: `styles.css:245-600,1403-1603`
- Create: `tests/ai-musician-panel.test.mjs`
- Modify: `tests/ui-shell.test.mjs:1-236`

**Interfaces:**
- Consumes: any controller with the Task 7 public methods and `statechange` events.
- Produces: `AiMusicianPanel.connect(controller)`, `render(state)`, and `dispose()`.

- [ ] **Step 1: Write the failing semantic UI contract**

Create `tests/ai-musician-panel.test.mjs` to read `index.html`, `styles.css`, and the panel module. Require these IDs:

```js
[
  'ai-musician-panel-toggle',
  'ai-musician-panel',
  'ai-musician-enabled',
  'ai-musician-status',
  'ai-role-ambient',
  'ai-role-sparse-melody',
  'ai-role-air-texture',
  'ai-interval-5',
  'ai-interval-10',
  'ai-interval-20',
  'ai-capture-now',
  'ai-volume-slider',
  'ai-volume-value',
  'ai-prompt-list',
  'ai-musician-error',
]
```

Assert:

```js
assert.match(html, /id="ai-musician-panel"[^>]*hidden/);
assert.match(html, /id="ai-musician-enabled"[^>]*type="checkbox"/);
assert.match(html, /id="ai-volume-slider"[^>]*min="-36"[^>]*max="-12"[^>]*value="-18"/);
assert.match(html, /data-interval-seconds="20"[^>]*aria-pressed="true"/);
assert.doesNotMatch(html, /textarea|ai-prompt-editor/);
assert.match(styles, /\.ai-musician-panel/);
assert.match(panelSource, /controller\.captureNow\(\)/);
```

- [ ] **Step 2: Run the UI contract and confirm failure**

Run:

```powershell
node --test tests/ai-musician-panel.test.mjs
```

Expected: FAIL because the panel does not exist.

- [ ] **Step 3: Add the independent panel markup**

Add an `operator-action` button next to “高级控制”:

```html
<button id="ai-musician-panel-toggle" class="operator-action" type="button"
  aria-expanded="false" aria-controls="ai-musician-panel">
  <span>云端 AI 乐手</span><small class="operator-action__meta">AMBIENT SIDECAR</small>
</button>
```

Add a sibling `<aside id="ai-musician-panel" class="ai-musician-panel" hidden>` after the control deck. Use buttons, a checkbox, a range input, an ordered prompt list, `role="status"` for state, and `aria-live="polite"` for errors. Do not add a free-text prompt input.

- [ ] **Step 4: Implement panel event binding and rendering**

Create `cloud-ai/ai-musician-panel.js`:

```js
const STATUS_LABEL = {
  disabled: '未连接',
  connecting: '正在连接',
  observing: '观察现场',
  prompting: '生成提示',
  playing: '演奏中',
  degraded: '网络降级',
};
```

Bind open/close independently from AI enable/disable. Bind roles, intervals, capture, and volume to controller methods. During `prompting`, disable `#ai-capture-now`. Render prompts with `textContent`, never `innerHTML`. Keep the panel open when the AI is stopped, and keep AI running when the panel is collapsed.

- [ ] **Step 5: Add restrained responsive styling**

Position the panel below the operator controls on wide screens and as a full-width lower drawer at `max-width: 620px`. Reuse `--panel`, `--cyan`, `--signal`, and `--text`; ensure selected role/interval controls use `aria-pressed` styles. Under `prefers-reduced-motion: reduce`, remove shimmer and drawer motion.

- [ ] **Step 6: Run UI and regression tests**

Run:

```powershell
node --test tests/ai-musician-panel.test.mjs tests/ui-shell.test.mjs
npm.cmd test
```

Expected: PASS.

- [ ] **Step 7: Commit the panel**

```powershell
git add cloud-ai/ai-musician-panel.js index.html styles.css tests/ai-musician-panel.test.mjs tests/ui-shell.test.mjs
git commit -m "feat: add cloud AI musician control panel"
```

### Task 10: Wire music context, drum accents, camera capture, and recording

**Files:**
- Modify: `MusicManager.js:1-269`
- Modify: `DrumManager.js:1-115`
- Modify: `main.js:1-419`
- Create: `cloud-ai/bootstrap-ai-musician.js`
- Create: `tests/ai-musician-integration.test.mjs`
- Modify: `tests/music-routing-contract.test.mjs:1-56`

**Interfaces:**
- Extends `MusicManager.getStatus()` with `isStarted`, `tonic`, `mode`, and a copied `scale`.
- Extends DrumManager with `onDrumHit(listener)`.
- Produces: `bootstrapAiMusician({ documentRef, renderDiv, game, musicManager, drumManager, audioBus })`.

- [ ] **Step 1: Write the failing integration contract**

Create `tests/ai-musician-integration.test.mjs` that reads the relevant sources and asserts:

```js
assert.match(musicManagerSource, /isStarted:\s*this\.isStarted/);
assert.match(musicManagerSource, /tonic:\s*this\.scene\.tonic/);
assert.match(musicManagerSource, /mode:\s*this\.scene\.mode/);
assert.match(drumManagerSource, /export function onDrumHit/);
assert.match(mainSource, /bootstrapAiMusician/);
assert.match(mainSource, /getVideoSource:\s*\(\)\s*=>\s*game\.videoElement/);
assert.match(bootstrapSource, /new AiMusicianController/);
assert.match(bootstrapSource, /new VisionPromptProvider/);
assert.match(bootstrapSource, /new LiveMusicProvider/);
assert.match(bootstrapSource, /musicManager\.onStatusChange/);
assert.match(bootstrapSource, /renderDiv\.addEventListener\(['"]handframe/);
assert.match(bootstrapSource, /drumManager\.onDrumHit/);
assert.match(audioBusSource, /cloudAiInput\.connect\(this\.limiter\)/);
```

- [ ] **Step 2: Run the integration test and confirm failure**

Run:

```powershell
node --test tests/ai-musician-integration.test.mjs
```

Expected: FAIL because runtime wiring is absent.

- [ ] **Step 3: Expose stable local music context**

Extend `MusicManager.getStatus()`:

```js
isStarted: this.isStarted,
tonic: this.scene.tonic,
mode: this.scene.mode,
scale: [...this.scale],
```

Keep existing status fields unchanged. Update `tests/music-routing-contract.test.mjs` to assert these fields come from the current scene and that `scale` is copied.

- [ ] **Step 4: Emit strong drum events without changing drum timing**

In `DrumManager.js`, add a `drumHitListeners` set and:

```js
export function onDrumHit(listener) {
  drumHitListeners.add(listener);
  return () => drumHitListeners.delete(listener);
}
```

Immediately after each existing `kitManager.trigger(drum, time)`, notify listeners with:

```js
{ drumId: drum, time, strong: drum === 'kick' || drum === 'snare' }
```

Do not add DOM dispatch or await anything inside the Tone sequence callback.

- [ ] **Step 5: Implement lazy bootstrap**

Create `cloud-ai/bootstrap-ai-musician.js`. Instantiate the panel immediately, but call `createDevGoogleAiClient()` only through the controller’s lazy `createCloudServices` callback:

```js
const { ai, geminiModel, lyriaModel } = await createDevGoogleAiClient();
return {
  visionProvider: new VisionPromptProvider({ ai, model: geminiModel }),
  liveMusicProvider: new LiveMusicProvider({
    ai,
    model: lyriaModel,
    audioContext: Tone.getContext().rawContext,
    audioInput: audioBus.cloudAiInput,
  }),
};
```

Create the scheduler through `new CaptureScheduler({ onCapture, documentRef })`. Supply `getVideo: () => game.videoElement` and `getMusicContext: () => musicManager.getStatus()`.

Subscriptions:

- `musicManager.onStatusChange(status => controller.syncMusicContext(status))`.
- `renderDiv.addEventListener('handframe', event => controller.handleHandFrame(event.detail))`.
- `drumManager.onDrumHit(({ strong }) => { if (strong) audioBus.duckCloudAi(); })`.
- Existing `AudioBus.triggerBroadcastImpact()` already ducks the AI branch.
- `pagehide` calls bootstrap disposal once.

- [ ] **Step 6: Initialize the sidecar from main.js**

After the existing `musicManager` variable is available, call:

```js
const aiMusician = bootstrapAiMusician({
  documentRef: document,
  renderDiv,
  game,
  musicManager,
  drumManager,
  audioBus,
});
window.aiMusicianController = aiMusician.controller;
```

Wrap only bootstrap construction in a local try/catch that reports to the panel and logs a short message without secret or server response data. A bootstrap failure must not escape the existing `safeExecute` block or abort application initialization.

- [ ] **Step 7: Run integration and full tests**

Run:

```powershell
node --test tests/ai-musician-integration.test.mjs tests/music-routing-contract.test.mjs
npm.cmd test
```

Expected: PASS, including all pre-existing recording tests.

- [ ] **Step 8: Commit runtime integration**

```powershell
git add MusicManager.js DrumManager.js main.js cloud-ai/bootstrap-ai-musician.js tests/ai-musician-integration.test.mjs tests/music-routing-contract.test.mjs
git commit -m "feat: integrate AI musician with live performance"
```

### Task 11: Verify local UI, real APIs, recording, and disconnect fallback

**Files:**
- Create: `scripts/ai-api-smoke.mjs`
- Modify: `scripts/browser-smoke.mjs:1-190`
- Create: `docs/verification/2026-07-27-cloud-ai-musician.md`
- Modify: `package.json:7-13`

**Interfaces:**
- Produces: `npm run smoke:ai`, expanded browser smoke coverage, screenshots, and a verification record that distinguishes code failures from missing Lyria account access.

- [ ] **Step 1: Write the real API smoke script**

Create `scripts/ai-api-smoke.mjs`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { VisionPromptProvider } from '../cloud-ai/vision-prompt-provider.js';
import { lyriaConfigFor } from '../cloud-ai/ai-musician-config.js';

dotenv.config({ path: fileURLToPath(new URL('../.env.local', import.meta.url)) });
assert.ok(process.env.GEMINI_API_KEY, 'GEMINI_API_KEY is required in .env.local');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, apiVersion: 'v1alpha' });
const image = await readFile(new URL('../assets/demo.png', import.meta.url));
const vision = new VisionPromptProvider({ ai });
const prompts = await vision.generate({
  frame: { mimeType: 'image/png', base64: image.toString('base64') },
  context: {
    sceneId: 'groove-pulse', sceneName: 'Groove Pulse', bpm: 115,
    tonic: 'E', mode: 'chromatic', energyLevel: 'low', roleId: 'ambient',
  },
});
assert.equal(prompts.length, 3);
```

Then connect `ai.live.music.connect()` with `models/lyria-realtime-exp`, send the three prompts, apply `lyriaConfigFor(...)`, call `play()`, and resolve when the first non-empty audio chunk arrives. Apply a 20-second timeout. In `finally`, call `stop()` and `close()`. Print only:

```text
Gemini prompts: OK (3)
Lyria audio: OK (first chunk received)
```

On a permissions/model-access error, print `Lyria audio: BLOCKED (account access required)` without the service response body and exit nonzero.

- [ ] **Step 2: Extend the no-cloud browser smoke**

In `scripts/browser-smoke.mjs`, before screenshots:

```js
await page.click('#ai-musician-panel-toggle');
await page.waitForSelector('#ai-musician-panel', { state: 'visible' });
assert.equal(await page.locator('#ai-musician-enabled').isChecked(), false);
assert.equal(await page.locator('#ai-volume-slider').inputValue(), '-18');
assert.equal(await page.locator('[data-interval-seconds="20"]').getAttribute('aria-pressed'), 'true');
await page.click('#ai-musician-panel-toggle');
```

Add desktop and mobile panel screenshots while the panel is open. Do not enable AI during this deterministic smoke, so it never depends on credentials or the external service.

- [ ] **Step 3: Run the complete automated suite**

Run:

```powershell
npm.cmd test
git diff --check
```

Expected: all tests pass and `git diff --check` produces no output.

- [ ] **Step 4: Start the loopback server and run browser smoke**

In terminal 1:

```powershell
npm.cmd run dev
```

Expected: server reports `http://127.0.0.1:8000` and does not print the key.

In terminal 2, using the workspace Playwright entry if needed:

```powershell
node scripts/browser-smoke.mjs http://127.0.0.1:8000/ .artifacts/cloud-ai-musician
```

Expected: zero page errors, zero console errors, panel checks pass, and desktop/mobile screenshots are created.

- [ ] **Step 5: Run the real Gemini and Lyria API smoke**

Run:

```powershell
npm.cmd run smoke:ai
```

Expected when the account has access:

```text
Gemini prompts: OK (3)
Lyria audio: OK (first chunk received)
```

If Gemini works and Lyria reports an access error, record it as an external account-permission blocker and continue with fake-provider and UI verification; do not weaken tests or change model names silently.

- [ ] **Step 6: Perform the audible browser acceptance pass**

At `http://127.0.0.1:8000/`:

1. Start the existing local band and verify hand gestures remain responsive.
2. Open “云端 AI 乐手”, enable it, and confirm the state reaches `演奏中`.
3. Verify the first three prompt chips appear and AI level starts at `-18 dB`.
4. Try `5 秒`, `10 秒`, `20 秒`, and “立即捕捉”; confirm no overlapping request indication.
5. Switch through all three roles and confirm local drums/bass remain the musical foreground.
6. Trigger a drop impact and kick/snare activity; confirm the AI bed audibly ducks and recovers.
7. Record at least 10 seconds, stop, and confirm playback contains both the local band and the quieter AI layer.
8. Disable the network or close the Lyria session; confirm AI fades while local performance and recording continue.
9. Disable AI and confirm no further captures or audio arrive.

- [ ] **Step 7: Record verification evidence**

Create `docs/verification/2026-07-27-cloud-ai-musician.md` with:

- Git revision tested.
- Node/browser versions.
- Automated test count and result.
- Browser smoke result and artifact paths.
- Gemini result.
- Lyria result, explicitly marked pass or account-access blocked.
- Audible checks for foreground balance, ducking, recording inclusion, and disconnect fallback.
- Confirmation that `.env.local` is ignored and no key appears in Git diff.

- [ ] **Step 8: Commit the verification tooling and record**

```powershell
git add scripts/ai-api-smoke.mjs scripts/browser-smoke.mjs docs/verification/2026-07-27-cloud-ai-musician.md package.json package-lock.json
git commit -m "test: verify cloud AI musician prototype"
```

## Final Review

- [ ] Run `npm.cmd test`.
- [ ] Run `git diff --check`.
- [ ] Run `git status --short` and confirm `.env.local` is absent.
- [ ] Inspect `git log --oneline --max-count=12` for one coherent commit per task.
- [ ] Confirm the original repository at `D:\Codex\arpeggiator-remix-exhibition-v2` has no product-code changes after revision `8f148d5`.
- [ ] Confirm no deployment command was run.

## Primary SDK References

- Google Lyria RealTime guide: `https://ai.google.dev/gemini-api/docs/realtime-music-generation`
- JavaScript `LiveMusicSession`: `https://googleapis.github.io/js-genai/release_docs/classes/music.LiveMusicSession.html`
- JavaScript `LiveMusicGenerationConfig`: `https://googleapis.github.io/js-genai/release_docs/interfaces/types.LiveMusicGenerationConfig.html`
- JavaScript `Scale` enum: `https://googleapis.github.io/js-genai/release_docs/enums/types.Scale.html`
