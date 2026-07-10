# Exhibition V2 Batch 1 UI and Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the editor-heavy overlay with the approved retro-futurist exhibition shell, operator-triggered three-card guide, social links, and a clean runtime that no longer loads either editor.

**Architecture:** Keep the existing Three.js camera/hand canvas and audio behavior intact. Put guide state in a small pure module, render it through one DOM controller, and use static-contract tests to guard the runtime removals and required exhibition controls.

**Tech Stack:** Native ES modules, DOM/CSS, Node.js `node:test`, existing Three.js/MediaPipe/Tone.js runtime.

---

## File map

- Create `guide/guide-model.js`: immutable card content and pure previous/next/skip state transitions.
- Create `GuideController.js`: DOM rendering, manual open/close, optional gesture-skip hook, and post-close neutral lock event.
- Create `tests/guide-model.test.mjs`: guide transition tests.
- Create `tests/ui-shell.test.mjs`: static regression checks for editor removal, copy removal, guide controls, and social links.
- Modify `index.html`: semantic exhibition HUD, guide dialog, Control Deck, and social navigation.
- Modify `styles.css`: scoped retro-futurist visual system and reduced-motion/simple-mode rules.
- Modify `main.js`: stop importing/instantiating editors and initialize `GuideController`.
- Modify `game.js`: remove editor pause wiring and both fallback restorations of the deleted slogan.

### Task 1: Lock the guide model contract with tests

**Files:**
- Create: `tests/guide-model.test.mjs`
- Create: `guide/guide-model.js`

- [ ] **Step 1: Write the failing guide-model test**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { GUIDE_CARDS, GUIDE_NEUTRAL_LOCK_MS, advanceGuide, retreatGuide } from '../guide/guide-model.js';

test('guide has exactly the three approved cards', () => {
  assert.deepEqual(GUIDE_CARDS.map(({ id }) => id), ['stage', 'hands', 'recording']);
  assert.match(GUIDE_CARDS[0].body, /观众.*不要.*举手/);
  assert.match(GUIDE_CARDS[2].body, /双手大拇指/);
});

test('guide navigation clamps and marks the last advance as complete', () => {
  assert.deepEqual(retreatGuide(0), { index: 0, complete: false });
  assert.deepEqual(advanceGuide(1, 3), { index: 2, complete: false });
  assert.deepEqual(advanceGuide(2, 3), { index: 2, complete: true });
});
```

- [ ] **Step 2: Run the test and verify the missing-module failure**

Run: `node --test tests/guide-model.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `guide/guide-model.js`.

- [ ] **Step 3: Add the pure guide model**

```js
export const GUIDE_CARDS = Object.freeze([
  Object.freeze({
    id: 'stage',
    kicker: '01 / 站位',
    title: '进入镜头中央',
    body: '请站在屏幕正前方，让双手完整进入画面。现场观众请尽量不要在镜头内举手。',
  }),
  Object.freeze({
    id: 'hands',
    kicker: '02 / 演奏',
    title: '左手旋律，右手节奏',
    body: '左手上下选择旋律、左右改变明暗、捏合控制音量；右手在平面中移动节奏，五根手指开合鼓声。',
  }),
  Object.freeze({
    id: 'recording',
    kicker: '03 / 录音',
    title: '用双手表达选择',
    body: '双手大拇指向上用于开始、停止或确认；双手大拇指向下用于取消或重录。界面按钮始终可用。',
  }),
]);

export const GUIDE_NEUTRAL_LOCK_MS = 1000;

export function advanceGuide(index, count = GUIDE_CARDS.length) {
  const last = Math.max(0, count - 1);
  return index >= last
    ? { index: last, complete: true }
    : { index: index + 1, complete: false };
}

export function retreatGuide(index) {
  return { index: Math.max(0, index - 1), complete: false };
}
```

- [ ] **Step 4: Run the focused and full tests**

Run: `node --test tests/guide-model.test.mjs && npm test`

Expected: guide tests PASS; the existing six invite tests remain PASS.

- [ ] **Step 5: Commit the guide model**

```bash
git add guide/guide-model.js tests/guide-model.test.mjs
git commit -m "test: define exhibition guide flow"
```

### Task 2: Guard the exhibition shell contract

**Files:**
- Create: `tests/ui-shell.test.mjs`
- Modify: `index.html`
- Modify: `main.js`
- Modify: `game.js`

- [ ] **Step 1: Write the failing static-contract test**

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [html, main, game] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../main.js', import.meta.url), 'utf8'),
  readFile(new URL('../game.js', import.meta.url), 'utf8'),
]);

test('runtime editor surfaces and legacy slogan are absent', () => {
  assert.doesNotMatch(html, /arpeggio-editor-modal|drum-editor-modal|open-arpeggio-editor|open-drum-editor/);
  assert.doesNotMatch(main, /CustomEditor|ArpeggioEditor/);
  assert.doesNotMatch(`${html}\n${game}`, /raise your hands to raise the roof/i);
  assert.doesNotMatch(html, /unpkg\.com\/tone/);
});

test('exhibition controls and social links remain discoverable', () => {
  for (const id of ['info-text', 'open-guide', 'control-deck', 'toggle-simple-mode']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /https:\/\/github\.com\/Electro-Dig/);
  assert.match(html, /https:\/\/www\.xiaohongshu\.com\/user\/profile\/6070457c000000000101efac/);
});
```

- [ ] **Step 2: Run the contract test and confirm it fails on the old UI**

Run: `node --test tests/ui-shell.test.mjs`

Expected: FAIL because editor IDs/imports, the slogan, and the global Tone script still exist.

- [ ] **Step 3: Replace the runtime body shell in `index.html`**

Keep the existing metadata/import map and `renderDiv`, remove both editor modal trees, the always-open help panel, the preset editor buttons, and the global Tone `<script>`. Add this semantic overlay inside `renderDiv` before the module script:

```html
<span id="info-text" class="sr-status" role="status" aria-live="polite"></span>

<header class="hud hud--top" aria-label="当前演奏状态">
  <section class="rec-status" aria-label="录音状态">
    <span class="rec-status__lamp" aria-hidden="true"></span>
    <span id="recording-state-label">READY</span>
    <time id="recording-timer">00:00</time>
  </section>
  <dl class="performance-status">
    <div><dt>SCENE</dt><dd id="current-music-preset">CLASSIC</dd></div>
    <div><dt>SYNTH</dt><dd id="current-synth">DX7</dd></div>
    <div><dt>RHYTHM</dt><dd id="current-drum-preset">RHYTHM 1</dd></div>
    <div><dt>BPM</dt><dd id="current-tempo">122</dd></div>
  </dl>
  <nav class="operator-actions" aria-label="现场操作">
    <button id="open-guide" type="button">动作指引</button>
    <button id="toggle-simple-mode" type="button" aria-pressed="false">简化模式</button>
    <button id="control-deck-toggle" type="button" aria-expanded="false">CONTROL DECK</button>
  </nav>
</header>

<aside id="control-deck" class="control-deck" hidden>
  <label><input id="delay-auto-toggle" type="checkbox" checked> AUTO DELAY</label>
  <label>DELAY WET <input id="delay-wet-slider" type="range" min="0" max="0.7" step="0.01" value="0.18"></label>
  <span id="delay-level-label">LEVEL 0</span>
  <div id="drum-volume-sliders">
    <label>KICK <input id="vol-kick" type="range" min="-36" max="0" step="1" value="-9"></label>
    <label>SNARE <input id="vol-snare" type="range" min="-36" max="0" step="1" value="-3"></label>
    <label>HI-HAT <input id="vol-hihat" type="range" min="-36" max="0" step="1" value="-5"></label>
    <label>CLAP <input id="vol-clap" type="range" min="-36" max="0" step="1" value="-18"></label>
    <label>OPEN HAT <input id="vol-openhat" type="range" min="-36" max="0" step="1" value="-9"></label>
  </div>
</aside>

<nav class="social-links" aria-label="创作者链接">
  <a href="https://github.com/Electro-Dig" target="_blank" rel="noopener noreferrer">GITHUB</a>
  <a href="https://www.xiaohongshu.com/user/profile/6070457c000000000101efac" target="_blank" rel="noopener noreferrer">小红书</a>
</nav>

<dialog id="guide-dialog" class="guide-dialog" aria-labelledby="guide-title">
  <article class="guide-card">
    <p id="guide-kicker" class="guide-card__kicker"></p>
    <h2 id="guide-title"></h2>
    <p id="guide-body"></p>
    <p class="guide-card__crowd">镜头一次只服务当前参与者</p>
  </article>
  <footer>
    <button id="guide-previous" type="button">上一张</button>
    <output id="guide-progress">1 / 3</output>
    <button id="guide-skip" type="button">跳过</button>
    <button id="guide-next" type="button">下一张</button>
  </footer>
</dialog>
```

- [ ] **Step 4: Remove editor runtime wiring and slogan fallbacks**

In `main.js`, keep only these application imports:

```js
import { Game } from './game.js';
import { GuideController } from './GuideController.js';
import * as drumManager from './DrumManager.js';
import { stateManager } from './StateManager.js';
import { container, errorHandler } from './DIContainer.js';
```

Delete `new CustomEditor()`, `new ArpeggioEditor()`, their container registrations, their `window.*` exports, and the `window.Tone` availability/debug block that depended on the removed global script. In `game.js`, delete `_wireEditorPauseResume`, `_pauseRealtime`, `_resumeRealtime`, its call from `_setupEventListeners`, and replace both slogan restoration assignments with:

```js
statusElement.textContent = prev || '';
```

- [ ] **Step 5: Run the contract and baseline suites**

Run: `node --test tests/ui-shell.test.mjs && npm test`

Expected: all UI contract checks and all invite-gate tests PASS.

- [ ] **Step 6: Commit the runtime slimming**

```bash
git add index.html main.js game.js tests/ui-shell.test.mjs
git commit -m "refactor: remove editor runtime surfaces"
```

### Task 3: Implement manual guide rendering and context priority

**Files:**
- Create: `GuideController.js`
- Modify: `main.js`
- Modify: `tests/guide-model.test.mjs`

- [ ] **Step 1: Extend the test with the neutral-lock event contract**

Append:

```js
test('guide close lock is one second', () => {
  assert.equal(GUIDE_NEUTRAL_LOCK_MS, 1000);
});
```

Run: `node --test tests/guide-model.test.mjs`

Expected: PASS; this records the approved timing while the controller remains DOM-tested in the browser smoke step.

- [ ] **Step 2: Add `GuideController`**

```js
import { GUIDE_CARDS, GUIDE_NEUTRAL_LOCK_MS, advanceGuide, retreatGuide } from './guide/guide-model.js';

export class GuideController extends EventTarget {
  constructor(root = document) {
    super();
    this.dialog = root.getElementById('guide-dialog');
    this.index = 0;
    this.recordingBusy = false;
    this.bind(root);
    this.render();
  }

  bind(root) {
    root.getElementById('open-guide')?.addEventListener('click', () => this.open());
    root.getElementById('guide-previous')?.addEventListener('click', () => {
      this.index = retreatGuide(this.index).index;
      this.render();
    });
    root.getElementById('guide-next')?.addEventListener('click', () => {
      const next = advanceGuide(this.index);
      next.complete ? this.close('complete') : (this.index = next.index, this.render());
    });
    root.getElementById('guide-skip')?.addEventListener('click', () => this.close('skip'));
  }

  open() {
    if (this.recordingBusy || !this.dialog || this.dialog.open) return false;
    this.index = 0;
    this.render();
    this.dialog.showModal();
    this.dispatchEvent(new CustomEvent('contextchange', { detail: { active: true } }));
    return true;
  }

  close(reason) {
    if (!this.dialog?.open) return;
    this.dialog.close();
    this.dispatchEvent(new CustomEvent('contextchange', {
      detail: { active: false, reason, neutralUntil: performance.now() + GUIDE_NEUTRAL_LOCK_MS },
    }));
  }

  skipFromGesture() {
    if (this.dialog?.open) this.close('gesture-skip');
  }

  setRecordingBusy(busy) {
    this.recordingBusy = Boolean(busy);
    const button = document.getElementById('open-guide');
    if (button) button.disabled = this.recordingBusy;
  }

  render() {
    const card = GUIDE_CARDS[this.index];
    if (!card) return;
    document.getElementById('guide-kicker').textContent = card.kicker;
    document.getElementById('guide-title').textContent = card.title;
    document.getElementById('guide-body').textContent = card.body;
    document.getElementById('guide-progress').textContent = `${this.index + 1} / ${GUIDE_CARDS.length}`;
    document.getElementById('guide-previous').disabled = this.index === 0;
    document.getElementById('guide-next').textContent = this.index === GUIDE_CARDS.length - 1 ? '开始体验' : '下一张';
  }
}
```

- [ ] **Step 3: Initialize the controller in `main.js`**

Immediately after constructing `Game`, add:

```js
const guideController = new GuideController(document);
container.register('guideController', () => guideController, { singleton: true });
window.guideController = guideController;
```

- [ ] **Step 4: Run all automated tests**

Run: `npm test`

Expected: all tests PASS with no unhandled rejection.

- [ ] **Step 5: Commit the guide controller**

```bash
git add GuideController.js main.js tests/guide-model.test.mjs
git commit -m "feat: add operator-triggered action guide"
```

### Task 4: Apply the restrained retro-futurist visual system

**Files:**
- Modify: `styles.css`
- Modify: `main.js`

- [ ] **Step 1: Add the visual tokens and layout rules**

Append a single scoped V2 section and remove obsolete editor-only rules after browser verification:

```css
:root {
  --ink: #07090d;
  --panel: rgba(10, 14, 21, 0.82);
  --line: rgba(122, 243, 255, 0.28);
  --cyan: #7af3ff;
  --magenta: #ff4fd8;
  --orange: #ff9f43;
  --record: #ff3b4f;
  --text: #edf7f9;
  --muted: #8ea3aa;
  --mono: "IBM Plex Mono", "Cascadia Mono", "SFMono-Regular", monospace;
  --ui: Inter, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}

body { background: var(--ink); color: var(--text); font-family: var(--ui); }
#renderDiv::after {
  content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 4;
  background: linear-gradient(rgba(122,243,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(122,243,255,.035) 1px, transparent 1px);
  background-size: 48px 48px;
}
.hud { position: absolute; z-index: 20; display: grid; align-items: start; gap: 20px; pointer-events: none; }
.hud--top { inset: 20px 24px auto; grid-template-columns: 180px minmax(420px, 1fr) auto; }
.hud button, .control-deck, .social-links, .guide-dialog { pointer-events: auto; }
.performance-status { display: flex; justify-content: center; gap: 28px; margin: 0; }
.performance-status div { min-width: 92px; border-top: 1px solid var(--line); padding-top: 8px; }
dt, .guide-card__kicker { color: var(--muted); font: 10px/1 var(--mono); letter-spacing: .16em; }
dd { margin: 5px 0 0; color: var(--cyan); font: 13px/1.2 var(--mono); }
.operator-actions { display: flex; gap: 8px; }
button, .social-links a { border: 1px solid var(--line); background: var(--panel); color: var(--text); font: 11px/1 var(--mono); letter-spacing: .08em; padding: 10px 12px; }
.rec-status { color: var(--muted); font: 12px/1 var(--mono); display: flex; gap: 8px; align-items: center; }
.rec-status__lamp { width: 7px; height: 7px; border-radius: 50%; background: var(--muted); }
.social-links { position: absolute; z-index: 20; left: 24px; bottom: 22px; display: flex; gap: 8px; }
.control-deck { position: absolute; z-index: 30; right: 24px; top: 72px; width: min(360px, calc(100vw - 48px)); padding: 16px; border: 1px solid var(--line); background: var(--panel); backdrop-filter: blur(12px); }
.guide-dialog { width: min(780px, calc(100vw - 48px)); padding: 0; border: 1px solid var(--cyan); color: var(--text); background: rgba(5, 8, 13, .95); }
.guide-dialog::backdrop { background: rgba(0, 0, 0, .72); }
.guide-card { min-height: 360px; padding: 64px; background: radial-gradient(circle at 80% 20%, rgba(255,79,216,.12), transparent 38%); }
.guide-card h2 { max-width: 560px; font-size: clamp(32px, 5vw, 64px); font-weight: 500; margin: 22px 0; }
.guide-card p { max-width: 620px; color: #c7d7db; line-height: 1.8; }
.guide-dialog footer { display: flex; align-items: center; gap: 10px; padding: 16px; border-top: 1px solid var(--line); }
#guide-progress { margin-right: auto; color: var(--muted); font: 11px/1 var(--mono); }
.simple-mode #renderDiv::after, .simple-mode .rec-status__lamp { display: none; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
@media (max-width: 800px) { .hud--top { grid-template-columns: 1fr auto; } .performance-status { display: none; } .guide-card { padding: 36px 28px; } }
```

- [ ] **Step 2: Wire Control Deck and simple mode without inline style mutations**

In `main.js`, replace the existing simple-mode listener and add:

```js
const simpleModeBtn = document.getElementById('toggle-simple-mode');
simpleModeBtn?.addEventListener('click', () => {
  game.simpleMode = !game.simpleMode;
  document.body.classList.toggle('simple-mode', game.simpleMode);
  simpleModeBtn.setAttribute('aria-pressed', String(game.simpleMode));
});

const deckToggle = document.getElementById('control-deck-toggle');
const deck = document.getElementById('control-deck');
deckToggle?.addEventListener('click', () => {
  deck.hidden = !deck.hidden;
  deckToggle.setAttribute('aria-expanded', String(!deck.hidden));
});
```

- [ ] **Step 3: Verify the browser layout and interaction smoke test**

Run: `npm run start`

Open: `http://localhost:8000`

Expected: camera permission prompt works on localhost; no editor buttons/modals; guide opens only from `动作指引`; all three cards navigate and skip; Control Deck toggles; social links open new tabs; central hand/camera area remains unobstructed; console contains no missing-element exception.

- [ ] **Step 4: Run the final Batch 1 regression suite**

Run: `npm test && git diff --check`

Expected: all tests PASS and `git diff --check` prints nothing.

- [ ] **Step 5: Commit Batch 1 styling and controls**

```bash
git add index.html styles.css main.js GuideController.js game.js tests
git commit -m "feat: redesign exhibition interface"
```

### Task 5: Record the Batch 1 acceptance checkpoint

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add the exact preview checklist**

```md
## Exhibition V2 — Batch 1 checkpoint

- Runtime editors are unloaded; their source files remain in Git history and are not deleted.
- The legacy “raise your hands…” copy is removed, while `#info-text` stays as an empty live region.
- The guide is operator-triggered, has three cards, supports previous/next/skip, and never auto-opens.
- GitHub and Xiaohongshu links are visible at the lower left.
- Production deployment is forbidden until explicit final approval.
```

- [ ] **Step 2: Run and record verification**

Run: `npm test && git status --short`

Expected: tests PASS; only `README.md` is modified.

- [ ] **Step 3: Commit the checkpoint**

```bash
git add README.md
git commit -m "docs: record exhibition ui checkpoint"
```
