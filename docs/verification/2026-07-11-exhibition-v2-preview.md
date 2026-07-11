# Exhibition V2 preview verification — 2026-07-11

## Scope

- Branch: `feature/exhibition-v2`
- Preview commit: `4da3cfa`
- Netlify Draft: `https://6a524094fb0517928e960004--arpeggiator-remix-2.netlify.app`
- Production branch remained at `59f9ef3c6b9af1ab77ab4d02693830959a93771a` during the preview push.
- The Duo Mix branch was not merged.

## Automated verification

- `npm.cmd test`: 137/137 passing.
- JavaScript syntax check: all project `.js` files passing.
- `git diff --check`: clean.
- Rhythm map: 49 unique immutable 16-step cells across `STRAIGHT → BROKEN` and `MINIMAL → ENERGY`; four anchors, center hybrid, boundary smoothing and next-bar scheduling covered by tests.
- Right-hand zone: the approved `left 0.56 / right 0.94 / top 0.18 / bottom 0.84` region maps to the full 7×7 grid and clamps outside positions to the nearest edge.
- Drum kits: Acoustic, Electronic and Synthwave each ship five local WAV assets; all 15 files total 1,174,104 bytes and load independently.
- Kit gesture: 500 ms fist hold, 1,200 ms open window, 800 ms cooldown, right-hand-only routing and drum suppression covered by tests.
- Audio graph: one reusable PolySynth, MonoSynth, Filter, Delay, Reverb, and bass sequence; routing to the internal recording bus covered by tests.
- Gesture contracts: stable handedness, left-hand scene/tone/root controls, right-hand rhythm XY and five independent drum gates covered by tests.
- Recording contracts: 3-second countdown, 60-second cap, early stop, cancel, re-record, upload retry, MIME selection, signed proxy and expiry states covered by tests.
- Guide contracts: three local SVG cards, manual navigation, `👍👍` one-page advance, `👎👎` exit and neutral rearming covered by tests.
- Share contracts: TAKE metadata, 1080×1440 portrait poster, lazy mobile poster download and seekable public audio remain independently tested.
- Music scenes: six immutable modes, default Groove Pulse, no Midnight Pulse, and major-pentatonic support for Afterglow Coast covered by tests.

## Browser and service smoke

- Local Chrome smoke at 1920×1080 loaded all 15 drum samples with HTTP 200, no failed requests, no page errors and no console errors.
- Manual Control Deck switching reached Acoustic, Electronic and Synthwave and updated the event-driven kit label each time.
- The enlarged rhythm grid measured exactly 182×182 px and did not overlap the top HUD, scene controls or social links.
- A 390×844 responsive capture kept the lower controls, grid and social links separated.
- The three-page illustrated guide fit inside 1920×1080 without internal scrolling; the 390×844 layout also kept the complete third card and actions on screen.
- Recording review and shared states fit inside 1920×1080 without internal scrolling; TAKE, duration, format, player and 48 px actions remained visible.
- The public mobile card at 390×844 exposed playback, audio download and poster download in one viewport. Poster rendering remains lazy until the user clicks.
- Draft HTTP smoke confirmed `/` remains a `303` invite boundary while `/r/<token>`, `/r/share-page.js`, `/share/qr.js` and the Bauhaus poster template return `200` with noindex headers.
- The new Draft returned the expected `303` invite boundary with `X-Robots-Tag: noindex`.
- The following recording and public-share checks were completed on the preceding Draft of the same branch before this rhythm/kit batch:

- Invite boundary: a fresh browser was redirected to the invite screen; valid entry opened the Draft.
- Manual fallback: all four scenes switched correctly; Classic exposed its seven-pattern selector.
- Scene stress: 100 scene transitions retained the identity of all six long-lived Tone nodes.
- Recording: an MP4/AAC take reached review with a native seekable timeline and uploaded successfully.
- QR poster: the generated QR was composited into the approved colorful hand/music template without text overlap.
- Public mobile page: opened without invite authentication, rendered at 390×844, and exposed playback plus download.
- Streaming: a 32-byte probe returned `206 Partial Content`, `Accept-Ranges: bytes`, and a valid `Content-Range`.
- Seeking: the public audio element moved from 0 to 55% and emitted `seeked`; its full duration was reported as seekable.
- Recording server: systemd status `active`, `/health` returned `{"ok":true}`, `NRestarts=0`.

## Automated performance proxy

This is a rendering/audio-control stress proxy, not a camera tracking benchmark.

| Segment | Frames | Average FPS | P95 frame | Max frame | Tone node identity | Heap delta |
| --- | ---: | ---: | ---: | ---: | --- | ---: |
| Warm stress | 901 | 60.0 | 16.9 ms | 17.0 ms | Stable | +3,762,644 B |
| Post-warm stress | 600 | 59.9 | 16.9 ms | 32.4 ms | Stable | -11,957,128 B |

The second segment's negative heap delta indicates collection after warm-up; no monotonic growth was observed in this short proxy.

## Still requires physical exhibition rehearsal

- Enter the invite on the new Draft and confirm real-camera tracking plus audible Acoustic/Electronic/Synthwave switching.
- Rehearse the 500 ms fist-to-open gesture against ordinary one-to-five-finger drumming.
- Record a new take containing two kit changes, then verify preview, upload, QR scan, public seeking and download on a phone.
- Same-camera five-minute `origin/main` versus V2 hand-tracking FPS comparison.
- Five-minute full-grid audible audition and a 30-minute camera/audio soak.
- Two-background-observer crowd-interference rehearsal.
- Subjective level matching across the six scenes and all 49 rhythm cells on the venue speakers.

These items are deliberately not marked as passed by headless automation. Production replacement remains behind explicit user approval.

## Rollback references

- Before the right-hand rhythm-zone and drum-kit batch: `83085d1`.
- Current protected production branch: `59f9ef3c6b9af1ab77ab4d02693830959a93771a`.
- Before the guide/recording/share/chill refresh: `be07f97`.
