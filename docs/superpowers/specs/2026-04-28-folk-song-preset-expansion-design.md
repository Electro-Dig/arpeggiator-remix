# Folk Song Preset Expansion Design

**Date:** 2026-04-28

## Goal
Expand the demo-first preset library with recognisable Chinese folk-song scenes while preserving the existing left/right hand interaction grammar. Rework percussion layering so each finger-triggered layer sounds more intentional with the current sample set.

## Locked canonical versions
- 《茉莉花》: common Jiangsu / 六合 mainstream singing version
- 《康定情歌》: mainstream “跑马溜溜的山上” version
- 《小河淌水》: 弥渡传唱版 beginning “月亮出来亮汪汪”
- 《青春舞曲》: mainstream 王洛宾整理传播版

## Musical design
- Keep the interaction shell unchanged.
- Add 4 new folk-song scenes ahead of the existing 4 atmospheric scenes.
- Encode each folk tune from a canonical numbered-notation opening phrase.
- Preserve recognisability by using longer melody sequences and slower scene step intervals (`8n` for folk-song scenes).
- Keep left-hand vertical pitch control by storing melodies as intervals relative to the detected root.

## Percussion design
- Keep the same five-finger trigger map and sample files.
- Retune the role semantics to better match the samples:
  - thumb / orchestral drum = resonance
  - index / rimshot = pulse
  - middle / flam = accent
  - ring / shaker = flow
  - pinky / indian percussion = ornament
- Rewrite drum patterns scene-by-scene so lyrical songs are sparse and dance songs are more flowing, instead of treating every preset like a full western drum machine.

## Code changes
- `PerformanceScenes.js`: add canonical folk scenes, metadata, notation-to-interval helper, scene-specific step interval.
- `MusicManager.js`: honour per-scene step interval and initialise synth from the active scene.
- `FingerElements.js`: expose clearer role labels while keeping the same mapping.
- `DrumManager.js`: keep API stable, only rebalance default drum volumes if needed.
- `tests/performance-scenes.test.mjs`: regression tests for notation conversion and canonical folk scene content.
