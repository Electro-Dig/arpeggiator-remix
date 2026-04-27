# Interaction-Preserving Demo Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current ethnic-music Arpeggiator remix into a demo-first build that preserves the full hand interaction identity while removing duplicate editor systems and non-essential runtime complexity.

**Architecture:** Keep the existing gesture grammar intact: left hand controls timbre, pitch, preset switching, and dynamics; right hand controls rhythm preset switching, finger-to-percussion element activation, and hidden note-length enhancement. Simplification happens around the runtime edges: remove duplicate editor ownership, move scene content into focused config files, and archive experiment/debug assets.

**Tech Stack:** HTML, CSS, JavaScript (ES modules), Tone.js, MediaPipe Tasks Vision, Three.js, Express dev server.

---

## File Structure Decisions

### Active runtime files to keep
- `index.html`
- `main.js`
- `game.js`
- `MusicManager.js`
- `DrumManager.js`
- `WaveformVisualizer.js`
- `styles.css`
- `server.js`
- `assets/`
- `samples/`

### New focused files to add
- `PerformanceScenes.js` — ethnic scene definitions, preset metadata, BPM, scale, colors.
- `FingerElements.js` — preserves existing finger mapping and adds presentational element semantics.

### Files to detach from runtime
- `CustomEditor.js`
- `ArpeggioEditor.js`
- editor modals and all editor-trigger buttons in `index.html`

### Files to archive later
- experimental/test/debug HTML, JS, and report files currently in root.

---

## Interaction Rules That Must Be Preserved

### Left hand
- Fist transition -> `cycleSynth()`
- Four-finger vertical gesture -> `cycleMusicPreset()`
- Vertical position -> pitch/root-note selection inside current preset scale
- Thumb/index distance -> arpeggio velocity/dynamics

### Right hand
- Fist transition -> `cycleDrumPreset()`
- Finger state mapping -> live percussion element activation
- Existing `fingerToDrumMap` remains the runtime source of truth
- Vertical position -> hidden note-length enhancement via `_updateGlobalNoteLengthByRightHandY`
- Four-finger vertical logic may remain available if already useful/stable

### Simplification constraint
- Do not remove gesture-driven switching.
- Do not remove finger-level percussion activation.
- Do not remove hidden note-length control.
- Remove duplicate editor-driven control paths only.

---

## Runtime Simplification Targets

### Remove from the live demo runtime
- `CustomEditor` bootstrap ownership in `main.js`
- `ArpeggioEditor` bootstrap ownership in `main.js`
- editor modals in `index.html`
- editor buttons in `index.html`
- FM panel runtime UI
- manual delay UI panel
- drum volume micro-control UI
- editor pause/resume bindings in `game.js`
- dead DOM references to removed controls

### Keep in the live demo runtime
- status panel
- concise interaction guide
- optional BPM UI control
- start/reset affordances if useful for presentation
- visual feedback for active scene / preset / synth / drum preset

---

## Content-Layer Upgrade Rules

### Preserve current sound relationships first
Keep existing right-hand mapping:
- thumb -> `openhat` -> `Orchestral_Drum.wav`
- index -> `kick` -> `Rimshot.wav`
- middle -> `snare` -> `Flam.wav`
- ring -> `hihat` -> `Shaker.wav`
- pinky -> `clap` -> `Indian_Percussion.wav`

### Upgrade by adding meaning, not by deleting mapping
`FingerElements.js` should add:
- element label
- presentational color
- short role description
- optional five-element interpretation for sharing sessions

### Upgrade presets into ethnic scenes
`PerformanceScenes.js` should define a small set of scenes that reuse existing gesture grammar while improving musical coherence.

Recommended scene set:
1. `Mountain Resonance` — Guqin-centered, sparse pentatonic, slower BPM
2. `Wind over Bamboo` — Dizi-centered, flowing pentatonic, medium BPM
3. `Silk and Strings` — Guzheng/Pipa-centered, clearer pulse, brighter articulation
4. `Breath Ritual` — Sheng-centered, sustained/modal, slower weighted rhythm

---

## Implementation Tasks

### Task 1: Remove duplicate editor runtime ownership
**Files:**
- Modify: `main.js`
- Modify: `index.html`

- [ ] Remove `CustomEditor` imports, instantiation, container registration, and `window.customEditor` export from `main.js`.
- [ ] Remove `ArpeggioEditor` imports, instantiation, container registration, and `window.arpeggioEditor` export from `main.js`.
- [ ] Remove editor buttons and editor modals from `index.html`.
- [ ] Keep the main runtime page loadable with no editor dependencies.

### Task 2: Trim runtime UI without touching core gesture logic
**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `game.js`

- [ ] Keep status display, interaction guide, and only the minimum manual UI needed for demos.
- [ ] Remove FM panel, delay panel, drum volume panel, and editor-only controls.
- [ ] Update styles to match removed DOM.
- [ ] Remove dead runtime DOM bindings from `game.js`.

### Task 3: Preserve gesture grammar while cleaning `game.js`
**Files:**
- Modify: `game.js`

- [ ] Preserve left-hand fist -> synth cycle.
- [ ] Preserve left-hand four-finger vertical -> music preset cycle.
- [ ] Preserve right-hand fist -> drum preset cycle.
- [ ] Preserve right-hand finger-state -> active drums mapping.
- [ ] Preserve right-hand Y -> note-length enhancement.
- [ ] Remove only editor-coupled hooks and dead UI branches.

### Task 4: Add scene config layer without replacing current interaction logic
**Files:**
- Create: `PerformanceScenes.js`
- Modify: `MusicManager.js`
- Modify: `game.js`

- [ ] Define 3-4 coherent ethnic scenes.
- [ ] Allow `MusicManager` to read scene metadata while preserving existing gesture-driven preset switching.
- [ ] Keep `cycleMusicPreset()` semantics intact, but point it at cleaner scene content.
- [ ] Let scene metadata drive visible labels and visual colors.

### Task 5: Add finger semantics layer without changing runtime mapping
**Files:**
- Create: `FingerElements.js`
- Modify: `DrumManager.js`
- Optional modify: `index.html`

- [ ] Encode current finger mapping plus element semantics.
- [ ] Keep `fingerToDrumMap` behavior unchanged or derive it from the new file without changing meaning.
- [ ] Optionally show concise finger-element labels in the guide/status UI.

### Task 6: Clean up drum content while preserving right-hand interaction
**Files:**
- Modify: `DrumManager.js`

- [ ] Preserve live finger-driven drum activation.
- [ ] Fix malformed rhythm data such as the invalid `Rhythm2` array.
- [ ] Keep drum preset cycling intact.
- [ ] Improve preset naming/content toward clearer ethnic demo scenes.

### Task 7: Clean up server/package/runtime safety issues
**Files:**
- Modify: `server.js`
- Modify: `package.json`

- [ ] Fix invalid string-repeat logging in `server.js`.
- [ ] Remove `python-server` script if no `server.py` exists.
- [ ] Keep the local server simple and demo-friendly.

### Task 8: Archive experiments after runtime is stable
**Files:**
- Create: `archive/experimental/`
- Move: root-level experimental files
- Modify: `README.md`

- [ ] Move non-runtime experiment/debug files out of the root.
- [ ] Update `README.md` to describe the demo-first interaction-preserving build.

### Task 9: Smoke-test the demo build
**Files:**
- Modify: `README.md`
- Optional create: `docs/demo-checklist.md`

- [ ] Verify page loads without editor code.
- [ ] Verify left-hand synth switching still works.
- [ ] Verify left-hand preset switching still works.
- [ ] Verify right-hand drum preset switching still works.
- [ ] Verify right-hand finger mapping still activates separate percussion elements.
- [ ] Verify right-hand Y note-length enhancement still works.
- [ ] Verify BPM/manual controls still behave coherently if kept.

---

## Success Criteria

- The unique hand interaction system remains intact.
- Duplicate editor systems are removed from the runtime path.
- The live demo is easier to explain because the page only exposes presentation-relevant controls.
- Ethnic content feels intentional at the scene level, not just like a sample swap.
- The project root becomes significantly clearer and safer for future iteration.
