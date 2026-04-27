# Demo-First Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current ethnic-instrument Arpeggiator remix into a stable, explainable, demo-first live music visualization build for sharing sessions.

**Architecture:** Keep one runtime path only: gesture input -> scene-driven music engine -> simplified rhythm layer -> core visual feedback. Remove duplicate editor control paths, archive experiment/debug pages, and replace the current "sample swap only" ethnic version with a small set of coherent ethnic performance scenes.

**Tech Stack:** HTML, CSS, JavaScript (ES modules), Tone.js, MediaPipe Tasks Vision, Three.js, Express dev server.

---

## File Structure Decisions

### Keep as active runtime files
- `index.html` — main demo page only; simplified controls and status UI.
- `main.js` — app bootstrap only.
- `game.js` — runtime orchestration only: camera, gesture tracking, main loop, scene switching, UI sync.
- `MusicManager.js` — scene-aware melodic playback, instrument loading, BPM control.
- `DrumManager.js` — simplified rhythm density and ethnic percussion patterns.
- `WaveformVisualizer.js` — core visualizer.
- `styles.css` — only styles used by the demo runtime.
- `server.js` — local dev server.
- `assets/` — active percussion samples.
- `samples/` — active melodic samples.

### Downgrade / detach from runtime
- `CustomEditor.js` — archive from runtime; keep only if later migrated into workshop mode.
- `ArpeggioEditor.js` — archive from runtime; not used in demo-first build.
- `DIContainer.js` — optional keep; if retained, bootstrap only. Do not let it hide runtime ownership.
- `StateManager.js` — optional keep if status sync remains useful; otherwise fold status display into `game.js`.

### Archive into `archive/experimental/`
- `arpeggio-editor-fixed.html`
- `arpeggio-editor-integrated.html`
- `arpeggio-preview-test.html`
- `debug-main.html`
- `debug-waveform.html`
- `drag-audio-test.html`
- `test-enhanced-visualizer.html`
- `test-scale-modes.html`
- `test-sequence-editor.html`
- `tone-check.html`
- `waveform-visualizer-concept.html`
- `optimized-waveform-logic.js`
- `test-enhanced-functionality.js`
- `test-sequence-functionality.js`
- `test-refactor.sh`
- `integration-guide.md`
- `ARPEGGIO_OPTIMIZATION_REPORT.md`
- `ENHANCED_VISUALIZER_SUMMARY.md`
- `REFACTOR_REPORT.md`
- `WAVEFORM_IMPLEMENTATION_PLAN.md`

### Add new focused config file
- `PerformanceScenes.js` — source of truth for demo scenes.

---

## Target Runtime After Simplification

### Runtime responsibilities
- `main.js`
  - Boot `Game`
  - Do not instantiate `CustomEditor`
  - Do not instantiate `ArpeggioEditor`
- `game.js`
  - Read gestures
  - Map gestures to a small stable control set
  - Ask `MusicManager` to switch scenes / update pitch / update dynamics / set BPM
  - Ask `DrumManager` to switch rhythm density
  - Update status text and lightweight UI
- `MusicManager.js`
  - Load melodic instruments
  - Expose scene switching
  - Expose note generation from scene scale and phrase pattern
  - Expose BPM setter
- `DrumManager.js`
  - Load percussion samples
  - Expose 4-level rhythm density or pattern intensity
  - Remove editor-specific preset mutation paths from main runtime
- `PerformanceScenes.js`
  - Define 3-4 ethnic scenes with instrument, scale, phrase, drum preset, color, BPM

---

## Demo-First Gesture Model

### Keep
- Left hand Y -> pitch register
- Left hand pinch distance -> dynamics / brightness
- Right hand openness or hand height -> rhythm density
- Fist -> mute / hold / stop

### Remove from demo runtime
- Finger-per-drum mapping
- Gesture-driven cycling through many synths
- Four-finger special switching logic
- Editor pause/resume hooks
- Delay distance mapping UI
- Drum volume micro-control UI
- FM parameter live panel

---

## Performance Scene Design

Create 4 coherent scenes:

1. `Mountain`  
   - Instrument: Guqin  
   - Scale: sparse pentatonic  
   - Rhythm: very light  
   - Visual: dark, slow pulse  
   - BPM: 76

2. `Flowing Air`  
   - Instrument: Dizi  
   - Scale: bright pentatonic  
   - Rhythm: light-medium  
   - Visual: thin flowing lines  
   - BPM: 92

3. `Silk Bamboo`  
   - Instrument: Guzheng or Pipa  
   - Scale: more articulated  
   - Rhythm: medium groove  
   - Visual: clearer beat accents  
   - BPM: 104

4. `Ritual Breath`  
   - Instrument: Sheng  
   - Scale: sustained modal cluster style  
   - Rhythm: slow, weighted  
   - Visual: large breathing blocks / slower waveform color shifts  
   - BPM: 68

---

## Phase Plan

### Task 1: Remove duplicate editor runtime ownership
**Files:**
- Modify: `main.js`
- Modify: `index.html`

- [ ] Remove `CustomEditor` import and instantiation from `main.js`.
- [ ] Remove `ArpeggioEditor` import and instantiation from `main.js`.
- [ ] Remove global `window.customEditor` and `window.arpeggioEditor` exports from runtime bootstrap.
- [ ] Remove editor-related container registrations.
- [ ] Remove editor-open buttons and both editor modals from `index.html`.
- [ ] Keep the page runnable with only runtime UI.

### Task 2: Strip runtime UI to demo essentials
**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `game.js`

- [ ] Keep only scene selector, BPM slider, start/reset, and status text.
- [ ] Remove preset menu, FM panel, delay panel, drum volume panel, editor-only hints.
- [ ] Replace dense help copy with one compact instruction block.
- [ ] Update `game.js` to bind only controls that still exist.
- [ ] Delete dead references to missing DOM ids such as help toggles or legacy selects.

### Task 3: Introduce scene-first music structure
**Files:**
- Create: `PerformanceScenes.js`
- Modify: `MusicManager.js`
- Modify: `game.js`

- [ ] Move demo scene definitions into `PerformanceScenes.js`.
- [ ] Refactor `MusicManager.js` so current scene becomes the source of instrument, scale, sequence, color/BPM metadata.
- [ ] Replace the current preset model that mostly reuses one chromatic scale with ethnic modal scene data.
- [ ] Add `setScene(index)` and `getCurrentScene()` APIs.
- [ ] Update `game.js` to switch scenes using simple UI buttons only.

### Task 4: Simplify gesture-to-music mapping
**Files:**
- Modify: `game.js`
- Modify: `MusicManager.js`

- [ ] Keep left-hand Y to pitch selection inside current scene scale.
- [ ] Keep pinch distance to volume / note energy.
- [ ] Remove runtime synth-cycling and over-special gesture branches.
- [ ] Replace current gesture-triggered preset switching with explicit scene buttons.
- [ ] Keep one fist gesture for mute/stop only.

### Task 5: Simplify rhythm engine for presentation clarity
**Files:**
- Modify: `DrumManager.js`
- Modify: `game.js`

- [ ] Replace finger-per-drum live mapping with 4 rhythm density states.
- [ ] Curate 4 ethnic percussion patterns aligned with the 4 scenes.
- [ ] Expose `setDensity(level)` or `setPatternIntensity(level)`.
- [ ] Map right-hand openness or height to density.
- [ ] Ensure BPM changes remain global and stable.

### Task 6: Stabilize known runtime issues
**Files:**
- Modify: `DrumManager.js`
- Modify: `server.js`
- Modify: `package.json`

- [ ] Fix malformed `Rhythm2` pattern length and invalid commas.
- [ ] Remove or repair `getOriginalDrumPresets()` dependency paths.
- [ ] Fix `server.js` invalid string-repeat logging.
- [ ] Remove `python-server` script if `server.py` does not exist.
- [ ] Audit scene and sample names so editor-era naming mismatches do not survive in runtime UI.

### Task 7: Reduce visual layer to one readable presentation language
**Files:**
- Modify: `game.js`
- Modify: `WaveformVisualizer.js`
- Modify: `styles.css`

- [ ] Keep one main waveform / ribbon visual.
- [ ] Keep one rhythm pulse / beat indicator layer.
- [ ] Tune scene-based color changes rather than many simultaneous overlays.
- [ ] Remove visualizations that primarily exist to support editor/debug features.

### Task 8: Archive experiments and isolate the demo build
**Files:**
- Create: `archive/experimental/`
- Move: experimental HTML/JS/MD files listed above
- Modify: `README.md`

- [ ] Move non-runtime files into `archive/experimental/`.
- [ ] Leave root focused on the demo runtime.
- [ ] Update `README.md` to describe the demo-first build, gestures, controls, and scene list.

### Task 9: Demo checklist and smoke testing
**Files:**
- Modify: `README.md`
- Optional create: `docs/demo-checklist.md`

- [ ] Verify page loads with no editor code required.
- [ ] Verify camera access path works.
- [ ] Verify all 4 scenes play correct samples.
- [ ] Verify BPM slider affects both melody and rhythm.
- [ ] Verify each simplified gesture produces stable results.
- [ ] Verify visual feedback changes clearly enough for presentation.
- [ ] Prepare a 3-minute demo flow: intro -> 4 scenes -> gesture explanation -> BPM change -> ending scene.

---

## Main Risks

- `game.js` is currently overgrown, so removing UI branches may expose hidden coupling.
- `CustomEditor.js` currently owns some arpeggio logic that may have leaked into runtime assumptions.
- Scene refactor must avoid breaking sample routing when replacing the current preset model.
- Some UI ids referenced in JS no longer exist; cleanup must happen together with HTML simplification.

## Success Criteria

- One clean runtime page only.
- No duplicate editor ownership in bootstrap.
- 3-4 coherent ethnic scenes instead of many mixed presets.
- Clear gesture mapping that can be explained in under 30 seconds.
- BPM adjustable from UI.
- Stable audio + visual feedback for live sharing.
