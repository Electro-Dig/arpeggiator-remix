# Duo Mix Mode Design

## Goal

Build an optional two-person performance mode without changing the current single-player mode behavior. The new mode lets the left-side performer keep the existing melody plus drum controls, while the right-side mixer controls global effects: delay, reverb, and filter.

## Product Direction

Duo Mix Mode should feel like a fast, social jam. One person makes the groove, the other person shapes the sound. The target user is a friend or exhibition visitor who should understand the setup within a few seconds.

The first version should prioritize clarity and stability over deep editing. It should not require login, calibration hardware, two cameras, or external DAW setup.

## Non-Goals

- Do not replace or regress the existing single-player mode.
- Do not require two MediaPipe instances in the first implementation.
- Do not add cloud upload or account-based recording storage.
- Do not build a full timeline editor or DAW-style arrangement system in the first version.
- Do not require MP4 conversion in the browser for the first recording version.

## Mode Structure

The app gets a mode switch:

- Single Mode: current behavior.
- Duo Mix Mode: four-hand, split-screen role mode.

Single Mode remains the default entry path. Duo Mix Mode is explicitly entered by a UI control so exhibition operators can keep the stable current version unless they choose the experimental mode.

## Screen Layout

Duo Mix Mode adds a vertical split line in the center of the screen.

```text
+------------------------------+------------------------------+
|          PERFORMER           |            MIXER             |
|        melody + drums         |     delay / reverb / filter  |
|                              |                              |
|  Melody Hand   Drum Hand     |   Filter Hand   Space Hand   |
+------------------------------+------------------------------+
```

The split line is both visual and functional:

- Hands on the left side are assigned to Performer roles.
- Hands on the right side are assigned to Mixer roles.
- A center dead zone prevents role switching when hands hover near the split line.

The visual language should make roles obvious:

- Performer color family: cyan / green / white.
- Mixer color family: purple / orange.
- Role labels appear close to each hand after assignment.
- Effect values are shown as compact right-side meters.

## Role Assignment

Use one MediaPipe HandLandmarker configured for up to four hands. Do not run two independent MediaPipe instances for the first implementation.

Assignment flow:

1. Detect up to four hands.
2. Convert landmarks to visible screen coordinates.
3. Partition hands by x position:
   - x < 47% viewport: Performer pool.
   - x > 53% viewport: Mixer pool.
   - 47%-53%: center dead zone; keep previous assignment if already locked.
4. Each side accepts up to two hands.
5. A hand must remain in a side for a short hold time before assignment is locked.
6. If a locked hand disappears for more than a timeout, release that role and wait for reacquisition.

Recommended initial timing:

- Assignment hold time: 600-800 ms.
- Lost-hand timeout: 1200-1800 ms.
- Gesture trigger cooldown: 300-500 ms depending on gesture.

## Performer Controls

The Performer side should reuse the current single-player musical behavior as much as possible:

- Melody Hand:
  - vertical position controls root note / pitch area.
  - thumb-index distance controls melody volume.
  - fist switches synth tone.
  - four-finger vertical gesture switches arpeggio preset.

- Drum Hand:
  - finger states activate drum voices.
  - fist switches drum preset.
  - vertical position can continue controlling global note length if stable.

This preserves the current work and avoids retraining the main performer.

## Mixer Controls

The Mixer side should use only a few obvious controls in the first version:

- Filter Hand:
  - horizontal position controls filter cutoff.
  - optional vertical position controls resonance or filter intensity later.

- Space Hand:
  - vertical position controls reverb wet.
  - distance between the two Mixer hands controls delay wet / feedback when both hands are visible.

- Mixer fist gesture:
  - trigger a short drop / mute / filter-dip gesture.
  - first version should make this a brief effect, not a persistent state, to avoid confusion.

All effect parameters should be smoothed and clamped to musically safe ranges.

Suggested parameter ranges:

- Filter cutoff: 300 Hz to 8000 Hz, logarithmic mapping.
- Reverb wet: 0.05 to 0.55.
- Delay wet: 0.0 to 0.45.
- Delay feedback: 0.15 to 0.65.

## Technical Architecture

Keep Duo Mix as an additive feature with clear boundaries.

Suggested modules:

- `DuoModeController`: owns mode state, role assignment, and hand routing.
- `HandRoleAssigner`: maps MediaPipe results to Performer/Mixer roles with dead zone, hold time, and lost-hand timeout.
- `PerformerController`: adapts existing melody and drum behavior to role-assigned hands.
- `MixerEffectsController`: maps Mixer hands to filter, delay, reverb, and drop effects.
- `DuoOverlayRenderer`: draws split line, side labels, role labels, and effect meters.
- `RecorderController`: later handles video/audio capture and download.

The first implementation can live near existing `game.js` code if a full refactor is too risky, but behavior should still be separated by small classes or helper objects where practical.

## Audio Changes

The current audio chain already has delay and reverb. Duo Mix will need a controllable filter in the chain.

Recommended chain:

```text
polySynth -> analyser -> filter -> delay -> reverb -> destination
drums     -> optional drum bus/filter path -> destination
```

For first version, the filter can affect the melodic synth path only. If that feels too subtle, later versions can route drums through a shared mix bus.

## Recording Design

Recording should be a separate milestone after Duo Mix is playable.

First recording version:

- Add one recording button.
- Start with a 3-second countdown.
- Record 30 or 60 seconds.
- Allow early stop.
- Show preview after stopping.
- Download `.webm`.
- Do not upload anything.

Technical approach:

- Use canvas/video composition plus `HTMLCanvasElement.captureStream()` for visual capture.
- Route Web Audio through `createMediaStreamDestination()` to capture audio.
- Combine video and audio tracks into one `MediaStream`.
- Use `MediaRecorder` to produce a Blob.
- Download through an object URL.

MP4 is not required in the first version because browser-side WebM is more reliable and lighter.

## Performance Strategy

Duo Mix is more expensive than Single Mode because it can track up to four hands.

Performance safeguards:

- Keep Single Mode default and unchanged.
- Run Duo Mix only when explicitly enabled.
- Use simple overlay labels in Duo mode.
- Prefer geometry reuse over rebuilding Three.js objects every frame where possible.
- Keep a "Duo Lite" fallback that limits tracking to two hands if performance is poor.
- Avoid ffmpeg.wasm or heavy client-side conversion during performance.

## Testing Strategy

Automated tests:

- Hand role assignment by x position.
- Dead-zone behavior.
- Assignment lock and release timing.
- Effect parameter mapping and clamping.
- Mode switch does not change Single Mode defaults.

Manual tests:

- Single Mode still works exactly as before.
- Duo Mode detects four hands in correct screen halves.
- Role labels remain stable when hands jitter near boundaries.
- Mixer filter/reverb/delay changes are audible but controlled.
- Fist/drop gesture does not get stuck.
- Low-end device can use Single Mode and Duo Lite.

## Implementation Phases

### Phase 1: Isolated Workspace And Spec

Create an isolated branch and document the design. No feature code yet.

### Phase 2: Duo Mode Skeleton

Add a mode switch, split overlay, and non-invasive mode state. Single Mode remains unchanged.

### Phase 3: Four-Hand Role Assignment

Configure four-hand detection in Duo Mode only. Add role assignment tests and debug labels.

### Phase 4: Performer Routing

Route left-side role-assigned hands to existing melody and drum behavior.

### Phase 5: Mixer Effects

Add filter/reverb/delay control and safe smoothing. Add visual meters.

### Phase 6: Recording MVP

Add local WebM recording and download after Duo Mix is playable.

## Open Decisions

- Whether Performer hand roles should be assigned by x position, vertical position, or an explicit calibration gesture.
- Whether filter affects only the synth or the full mix in the first Duo version.
- Whether Duo Mode should include a guided calibration screen before performance starts.
- Whether recording should be 30 seconds, 60 seconds, or user-selectable.
