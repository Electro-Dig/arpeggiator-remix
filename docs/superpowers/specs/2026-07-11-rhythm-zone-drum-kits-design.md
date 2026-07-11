# Exhibition V2 — Right-hand rhythm zone and drum-kit design

Date: 2026-07-11  
Branch: `feature/exhibition-v2`  
Status: approved conversational design; awaiting written-spec review

## Goal

Make right-hand rhythm control easier to understand and more expressive for an electronic-music exhibition without adding a runtime ML model or obscuring the camera view.

The change has three linked parts:

1. Map the 7×7 rhythm space to the participant's actual right-hand performance zone.
2. Rebuild the 49 deterministic rhythms around four electronic rhythm archetypes while preserving understandable axes.
3. Add three independent drum timbre kits selected by a deliberate right-hand fist-to-open gesture or a manual fallback.

## Non-goals

- Do not draw a large grid over the participant or the marked interaction zone.
- Do not merge the Duo Mix branch.
- Do not add MusicVAE, TensorFlow.js, or other runtime generation.
- Do not alter the melody scene, recording, invite, or public-share architecture.
- Do not deploy to production without separate approval.

## 1. Right-hand coordinate zone

### Input bounds

The rhythm coordinate uses the mirrored on-screen palm position, normalized against the visible camera crop. The approved zone is:

```text
left   = 0.56
right  = 0.94
top    = 0.18
bottom = 0.84
```

These values correspond to the red rectangle supplied in the reference screenshot. They are constants in one focused coordinate-mapping module so later venue tuning does not require editing `game.js` tracking logic.

### Mapping behavior

- The palm position inside the zone maps linearly to `[0, 1] × [0, 1]`, then into the 7×7 selector.
- A palm outside the zone clamps to the nearest zone edge, as approved by the user.
- Existing smoothing and cell hysteresis remain active after zone normalization.
- Only rhythm XY uses these bounds. Finger-to-drum gates continue working anywhere the right hand remains tracked.
- Losing the right hand still disables all active drum gates; it does not change the last confirmed rhythm or kit.

### Visual feedback

- Keep the grid at the bottom-right corner; do not render the zone itself.
- Increase the grid from 126 px to 160 px on the exhibition viewport, with its container and axis labels scaled proportionally.
- Continue using transform-only cursor movement.
- Keep the grid hidden in simplified mode.
- Add one compact kit line below the rhythm label, for example `KIT / SYNTHWAVE`.

## 2. Hybrid four-corner rhythm map

### Understandable axes

- Horizontal: `STRAIGHT → BROKEN`
- Vertical: `MINIMAL → ENERGY`

The axes remain predictable throughout the grid. Moving right increases syncopation, displaced hits, and broken-beat character. Moving upward increases density, subdivisions, and forward drive.

### Corner anchors

| Position | Anchor | Musical role |
| --- | --- | --- |
| Bottom-left | `MINIMAL HOUSE` | Sparse four-on-the-floor entry point with clear space |
| Top-left | `TECHNO DRIVE` | Dense, straight, continuous propulsion |
| Bottom-right | `ELECTRO BREAK` | Syncopated and spacious broken groove |
| Top-right | `GLITCH RUSH` | Dense fragmented rhythm with IDM/breakbeat energy |

The central cells form a stable `HYBRID GROOVE`, not a random or maximally complex result.

### Pattern construction

- Preserve 49 immutable 16-step patterns and the five tracks: kick, snare, hi-hat, open hat, and clap.
- Build the grid offline from four curated anchor motifs and deterministic interpolation rules.
- Preserve musical invariants during interpolation: a usable pulse, bounded simultaneous hits, intentional backbeats, and no empty accidental cell.
- No runtime randomness. A coordinate always returns the same pattern.
- Rhythm-cell changes remain pending until the next 16-step bar boundary.
- HUD and grid labels continue describing the axes, such as `BREAK / LIFT`; corner archetypes define musical construction rather than adding large genre labels to the camera view.

## 3. Drum timbre kits

### Kits

1. `ACOUSTIC`: the current kick, snare, closed hat, open hat, and clap recordings.
2. `ELECTRONIC`: short, tight, modern electronic kick; noise-forward snare and clap; crisp hats.
3. `SYNTHWAVE`: retro drum-machine kick, thick gated-style snare/clap, and bright 1980s hats.

Rhythm and timbre are independent dimensions. Switching a kit must not change the current cell, tempo, scene, or active finger gates.

### Asset and audio architecture

- Use local WAV samples for all kits. Generate the new Electronic and Synthwave samples offline and commit the deterministic generation script, avoiding third-party sample licensing ambiguity.
- Move the current Acoustic files into `assets/drums/acoustic/`; place the generated kits in `assets/drums/electronic/` and `assets/drums/synthwave/`, then update the single kit manifest to those paths.
- Preload all available kits once during drum initialization. Target a combined drum-audio payload no larger than 3 MB.
- Create the players once, connect every kit through the existing `audioBus.input`, and never recreate or route nodes during a kit switch.
- Only the active kit receives new triggers. Tails already playing may finish naturally.
- Normalize per-kit trim values so switching does not produce a dangerous loudness jump.

### Load failures

- Kit loading uses independent results rather than failing the complete camera/audio startup.
- If a non-active kit fails, mark it unavailable and keep the current kit.
- If the default Acoustic kit fails, use the first ready kit.
- If no drum kit loads, keep melody, camera, guide, and recording available while drums remain muted and the Control Deck reports the failure.

## 4. Right-hand kit-switch gesture

### State sequence

1. A right-hand fist held continuously for 500 ms arms kit selection and naturally silences the five drum gates.
2. Four non-thumb fingers must fully open within 1,200 ms after arming.
3. A valid opening cycles `ACOUSTIC → ELECTRONIC → SYNTHWAVE → ACOUSTIC`.
4. Apply an 800 ms cooldown before another kit selection can arm.
5. If the opening window expires, cancel the armed state without changing kit.

The thumb is not required for the open-palm confirmation because its camera geometry is less stable. Normal individual finger performance cannot switch kits unless preceded by the deliberate 500 ms fist hold.

### Timing and feedback

- The new kit applies to the first drum trigger after confirmation; it does not wait for the next bar.
- Show a quiet `KIT READY` indication after the fist hold.
- On success, show a short `DRUM KIT: <name>` notification and update the bottom-right `KIT / <name>` label.
- Do not show a modal and do not interrupt recording. Kit changes made during recording are captured in the internal mix.
- Disable the gesture while interaction is explicitly suppressed by guide/error states.

### Manual fallback

Add a `DRUM KIT` select control to Control Deck. It uses the same kit-selection API and remains available when recording gestures are disabled or tracking is unreliable.

## 5. Component boundaries

- `RhythmZone`: normalizes and clamps on-screen palm coordinates before the existing smoothing selector.
- Rhythm-grid builder: owns the four anchors and deterministic 49-cell construction.
- `DrumKitManager`: owns kit manifests, one `Tone.Players` instance per kit, loading, availability, active-kit state, and events.
- Kit gesture state machine: owns fist hold, open window, cooldown, and cancellation without depending on DOM code.
- `DrumManager`: schedules patterns, maintains finger gates, and asks the active kit to trigger a drum.
- `RhythmGridOverlay`: renders confirmed/pending rhythm position plus kit status.

No new responsibility should be added to `game.js` beyond passing normalized hand observations into these modules.

## 6. Events and state

- Rhythm position remains a pending event followed by confirmed cell state at the bar boundary.
- Kit selection emits one semantic change event containing kit id, display name, and source (`gesture` or `manual`).
- StateManager stores the confirmed kit name for UI synchronization.
- Repeated selection of the current kit is idempotent.
- Event-driven updates replace polling; no new animation or status intervals are introduced.

## 7. Testing and acceptance

### Automated

- Zone corners, center, edge clamping, and outside-corner clamping.
- Smoothing and hysteresis after zone normalization.
- Exact four anchor identities and 49 unique immutable patterns.
- Monotonic movement toward broken rhythm on X and higher energy on Y.
- Bar-boundary rhythm changes remain intact.
- Fist hold shorter than 500 ms does not arm.
- Armed state expires after 1,200 ms without a valid open hand.
- Valid fist-to-open cycles exactly once and respects the 800 ms cooldown.
- Individual finger gating never changes kit.
- Kit switch preserves rhythm, tempo, scene, and active gates.
- All kit players route through the recording bus and are constructed only once.
- Failed optional kit loading does not reject overall startup.
- Manual and gesture changes update the same UI state.

### Browser and physical rehearsal

- Visit all four zone corners and the center with a real camera.
- Confirm outside-zone movement clamps rather than freezing or silencing.
- Verify the enlarged bottom-right grid does not overlap the robot or operator controls.
- Audition all four rhythm anchors using all three kits on venue-class speakers.
- Check loudness consistency and clipping during rapid kit changes.
- Confirm ordinary right-hand finger drumming does not accidentally arm a kit change.
- Record a take containing at least two kit changes and verify preview, upload, QR playback, and seeking.

## 8. Deployment boundary

Implement and validate only on `feature/exhibition-v2`, then publish a new Netlify Draft. Keep `origin/main`, the production URL, and the Duo Mix branch unchanged until explicit production approval.

## Reference

Google Magenta's Beat Blender uses editable corner beats and a two-dimensional interpolated palette. This design borrows the four-corner mental model but uses deterministic curated patterns to protect exhibition performance and predictability: <https://magenta.withgoogle.com/music-vae>.
