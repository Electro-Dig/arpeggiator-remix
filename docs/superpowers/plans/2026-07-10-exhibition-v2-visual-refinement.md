# Exhibition V2 Visual Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the archived minimal UI through stronger editorial typography, restrained palette changes, clearer HUD hierarchy, improved guide cards, and removal of the face-obscuring debug overlay.

**Architecture:** Keep all runtime positions and interaction flows. Add semantic classes and two text notations to the existing HUD/guide DOM, render them from the guide model, and replace the Three.js Delay diagnostic overlay with low-frequency text outputs inside Control Deck.

**Tech Stack:** Native HTML/CSS/ES modules, existing Three.js runtime, Node.js `node:test`.

---

### Task 1: Lock the refined visual contract

**Files:**
- Modify: `tests/ui-shell.test.mjs`
- Modify: `tests/guide-model.test.mjs`
- Modify: `tests/guide-controller.test.mjs`
- Create: `tests/diagnostics-ui.test.mjs`

- [ ] **Step 1: Add failing HTML/CSS contract assertions**

Assert that `index.html` contains `hud-metric`, `operator-action__meta`, `guide-card__step`, `guide-notation-primary`, `guide-notation-secondary`, and `delay-diagnostics`; assert `styles.css` uses warm-white `--text`, orange `--signal`, `Bahnschrift`, and contains no `.guide-card::after` circle.

- [ ] **Step 2: Add failing guide content assertions**

Each `GUIDE_CARDS` item must expose exactly two `notations`. The controller test must verify card 2 renders `L / MELODY` and `R / RHYTHM`, and card 3 renders `↑↑ / CONFIRM` and `↓↓ / CANCEL`.

- [ ] **Step 3: Add failing diagnostics assertions**

Read `game.js` and assert `_updateDelayVisualization` and `delayVizGroup` are absent; assert `_updateDelayDiagnostics` exists and writes the three Control Deck IDs `delay-distance-value`, `delay-level-value`, and `note-length-value`.

- [ ] **Step 4: Run RED tests**

Run: `node --test tests/ui-shell.test.mjs tests/guide-model.test.mjs tests/guide-controller.test.mjs tests/diagnostics-ui.test.mjs`

Expected: FAIL on missing semantic classes, notations, and diagnostics migration.

### Task 2: Refine HUD and guide semantics

**Files:**
- Modify: `index.html`
- Modify: `guide/guide-model.js`
- Modify: `GuideController.js`

- [ ] **Step 1: Add guide notations to the model**

```js
notations: ['CENTER / FRAME', 'ONE PLAYER / CAMERA']
notations: ['L / MELODY', 'R / RHYTHM']
notations: ['↑↑ / CONFIRM', '↓↓ / CANCEL']
```

- [ ] **Step 2: Render step and notation outputs**

`GuideController.render()` writes `String(index + 1).padStart(2, '0')` to `guide-step`, and the two notation strings to `guide-notation-primary` and `guide-notation-secondary`.

- [ ] **Step 3: Add semantic HUD and guide markup**

Give each status item `class="hud-metric"` and a two-digit `data-index`. Wrap each operator button with a Chinese primary label and `.operator-action__meta` English label. Add a `.guide-card__step` aside and `.guide-card__content` section. Add `.guide-card__notations` containing the two notation outputs.

- [ ] **Step 4: Add diagnostics markup to Control Deck**

```html
<dl id="delay-diagnostics" class="delay-diagnostics">
  <div><dt>DISTANCE</dt><dd id="delay-distance-value">--</dd></div>
  <div><dt>DELAY</dt><dd id="delay-level-value">L0 / 0.00B</dd></div>
  <div><dt>NOTE LEN</dt><dd id="note-length-value">L4 / 1.00×</dd></div>
</dl>
```

- [ ] **Step 5: Run focused tests**

Run: `node --test tests/guide-model.test.mjs tests/guide-controller.test.mjs tests/ui-shell.test.mjs`

Expected: all focused tests PASS.

### Task 3: Remove the debug overlay without changing audio behavior

**Files:**
- Modify: `game.js`
- Modify: `tests/diagnostics-ui.test.mjs`

- [ ] **Step 1: Remove `_updateDelayVisualization` and its call**

Delete the complete Three.js group/line/text-sprite method and constructor field. Keep `_sampleDelayDistanceIfDue`, `_updateDelayLevelIfDue`, and NoteLen calculations intact.

- [ ] **Step 2: Add low-frequency Control Deck diagnostics**

```js
_updateDelayDiagnostics(distance) {
  const deck = document.getElementById('control-deck');
  if (!deck || deck.hidden) return;
  const level = this.delayCtrl?.level || 0;
  const beats = [0, 0.25, 0.5, 0.75, 1][level];
  const noteLevel = typeof this._currentNoteLenLevelApplied === 'number' ? this._currentNoteLenLevelApplied : 4;
  const noteFactor = this.noteLenFactors[noteLevel] ?? 1;
  document.getElementById('delay-distance-value').textContent = Number(distance).toFixed(3);
  document.getElementById('delay-level-value').textContent = `L${level} / ${beats.toFixed(2)}B`;
  document.getElementById('note-length-value').textContent = `L${noteLevel} / ${noteFactor.toFixed(2)}×`;
}
```

Call it from the existing 100ms sampling path after `d` is computed. This avoids per-frame DOM work.

- [ ] **Step 3: Run syntax and diagnostics tests**

Run: `node --check game.js && node --test tests/diagnostics-ui.test.mjs`

Expected: syntax and tests PASS.

### Task 4: Apply the restrained editorial visual system

**Files:**
- Modify: `styles.css`
- Modify: `tests/ui-shell.test.mjs`

- [ ] **Step 1: Tune palette and typography**

Use warm gray-white for primary text, cyan only for active values, orange only for recording/steps/warnings, and local condensed Latin stacks. Lower the full-screen grid opacity.

- [ ] **Step 2: Refine constant HUD controls**

Use a subtle dark text-protection gradient behind the top edge, smaller labels, stronger data, thinner operator controls, and unboxed social links. Do not move the groups.

- [ ] **Step 3: Convert guide to asymmetric editorial columns**

Remove the circle and dense internal grid. Use a narrow step-number column, a hairline divider, wider content column, two notation chips, orange crowd footnote, and a restrained footer hierarchy.

- [ ] **Step 4: Keep motion and performance constraints**

Only `opacity`, `transform`, border/color transitions; preserve `prefers-reduced-motion`; do not add external assets or dependencies.

- [ ] **Step 5: Run complete verification**

Run: `npm test && node --check main.js && node --check game.js && git diff --check`

Expected: all tests PASS and checks produce no errors.

### Task 5: Manual screenshot smoke and checkpoint

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Run the local site and inspect screenshots**

Verify the main HUD, all three guide cards, Control Deck diagnostics, simple mode, 16:9 layout, and that no green/purple diagnostic overlay covers the participant.

- [ ] **Step 2: Record the checkpoint**

Document the archived fallback tag `exhibition-v2-ui-v1`, test count, screenshot review, and production prohibition.

- [ ] **Step 3: Commit**

```bash
git add index.html styles.css guide/guide-model.js GuideController.js game.js tests README.md
git commit -m "feat: refine exhibition visual hierarchy"
```
