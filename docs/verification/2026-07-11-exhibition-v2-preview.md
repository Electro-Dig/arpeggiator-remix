# Exhibition V2 preview verification — 2026-07-11

## Scope

- Branch: `feature/exhibition-v2`
- Preview commit: `0560f1e`
- Netlify Draft: `https://6a51609309a90ea46c7f3b5b--arpeggiator-remix-2.netlify.app`
- Production branch remained at `59f9ef3c6b9af1ab77ab4d02693830959a93771a` during the preview push.
- The Duo Mix branch was not merged.

## Automated verification

- `npm.cmd test`: 104/104 passing.
- JavaScript syntax check: all project `.js` files passing.
- `git diff --check`: clean.
- Rhythm map: 49 immutable 16-step cells; boundary smoothing and next-bar scheduling covered by tests.
- Audio graph: one reusable PolySynth, MonoSynth, Filter, Delay, Reverb, and bass sequence; routing to the internal recording bus covered by tests.
- Gesture contracts: stable handedness, left-hand scene/tone/root controls, right-hand rhythm XY and five independent drum gates covered by tests.
- Recording contracts: 3-second countdown, 60-second cap, early stop, cancel, re-record, upload retry, MIME selection, signed proxy and expiry states covered by tests.

## Browser and service smoke

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

- Same-camera five-minute `origin/main` versus V2 hand-tracking FPS comparison.
- Five-minute full-grid audible audition and a 30-minute camera/audio soak.
- Two-background-observer crowd-interference rehearsal.
- Subjective level matching across the four scenes and all 49 rhythm cells on the venue speakers.

These items are deliberately not marked as passed by headless automation. Production replacement remains behind explicit user approval.

## Rollback references

- Before rhythm/Synthwave batches: `11cb4fe`.
- Current protected production branch: `59f9ef3c6b9af1ab77ab4d02693830959a93771a`.
