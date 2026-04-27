# Arpeggiator Remix - Demo-first ethnic performance build

This branch is a **demo-first** simplification of the ethnic-music Arpeggiator remix.

The goal of this version is:

- keep the project’s unique **hand interaction grammar**
- remove duplicate editor/runtime ownership
- make the live demo easier to explain and more stable to run
- reorganize the music layer into clearer ethnic scenes

## Core interaction grammar

### Left hand
- move up/down -> pitch
- thumb-index distance -> dynamics / volume
- fist -> cycle synth / timbre
- four fingers vertical -> cycle music scene

### Right hand
- fist -> cycle rhythm scene
- each finger activates one percussion element
- right-hand height -> hidden note-length enhancement

## Finger-to-percussion mapping

- thumb -> Orchestral Drum
- index -> Rimshot
- middle -> Flam
- ring -> Shaker
- pinky -> Indian Percussion

## Demo scenes

- Mountain Resonance
- Wind over Bamboo
- Silk and Strings
- Breath Ritual

These scenes are now defined through focused config modules:

- `PerformanceScenes.js`
- `FingerElements.js`

## Runtime files

Main runtime files kept active:

- `index.html`
- `main.js`
- `game.js`
- `MusicManager.js`
- `DrumManager.js`
- `WaveformVisualizer.js`
- `styles.css`
- `server.js`

## What was removed from runtime

The following are no longer part of the live demo runtime path:

- duplicate editor bootstrapping in `main.js`
- editor buttons / editor modals in `index.html`
- FM editor runtime controls
- delay manual panel
- drum volume micro-panel
- editor pause/resume hooks

## Run locally

```bash
npm install
npm start
```

Then open:

- `http://localhost:8000`

## Archive

Older experiment, debug, and report files have been moved to:

- `archive/experimental/`

## Current validation status

Completed checks for this demo-first branch:

- syntax checks with `node --check`
- local server smoke test (`HTTP 200`)
- verified demo page contains runtime container and tempo slider
- verified editor buttons are no longer present in served HTML

## Notes

This repository still contains historical modules such as `CustomEditor.js` and `ArpeggioEditor.js`, but they are no longer part of the active demo runtime chain in this branch.
