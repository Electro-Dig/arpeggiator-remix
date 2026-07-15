# Participant Photo Share Poster Verification

Verified on 2026-07-16 against branch `feature/exhibition-v2`.

## Delivered flow

- Recording review confirmation now continues to a visible `3 → 2 → 1` photo countdown.
- The captured 4:5 image is reviewed before poster creation, with `使用这张照片`, `重新拍摄`, and `无照片继续` actions.
- The final 1080×1440 live-single poster combines the participant photo, performance fingerprint, player number, duration, and a scannable QR ticket.
- Only the final WebP/JPEG poster is uploaded. The raw participant photo stays in the current browser and is cleared after completion or discard.
- Audio and poster share the same unguessable token and 24-hour expiry. Expiry cleanup removes both files.
- The public mobile share page displays the stored personalized poster and offers recording and poster downloads. Older recordings retain the generated-poster fallback.

## Automated checks

- `npm.cmd test`: 159 passed, 0 failed.
- Syntax checks passed for the recording storage server, Netlify proxy function, and related modules.
- Dedicated tests cover photo crop/mirroring, countdown state transitions, retake/no-photo recovery, poster composition and size fallback, poster upload retry without duplicate check-in, server persistence/expiry, proxy validation, and mobile share URLs.
- `git diff --check`: clean.

## Browser smoke

The Codex in-app browser inspected the following 1280×720 states:

- Photo countdown with large centered numeral and privacy note.
- Photo review with all five actions visible and no internal scrolling.
- Final shared state with the photo-led poster on the left, player identity on the right, QR in the poster ticket, and visible completion action.

The automation browser denied system camera permission, so a local colored portrait stand-in was injected only for visual inspection. No persistent test hook was added to the project. Real camera capture remains an on-device preview check; capture and controller behavior are covered by automated tests.

## Recording service

- Isolated service: `arpeggiator-recordings.service` on the existing recording server.
- Deployment path: `/srv/arpeggiator-recordings`.
- Backup: `/srv/arpeggiator-recordings/backups/20260716-012137`.
- Service status after update: `active`; health returned `{"ok":true}`; `NRestarts=0`.
- Public draft probes for unknown valid tokens returned `404` for both `/r/audio/:token` and `/r/poster/:token`, confirming the Netlify proxy reaches the updated origin without exposing it.

## Netlify Draft

- Draft URL: https://6a57c1ded496ef2148c93c98--arpeggiator-remix-2.netlify.app
- Deploy log: https://app.netlify.com/projects/arpeggiator-remix-2/deploys/6a57c1ded496ef2148c93c98
- Root invite boundary returned `303`.
- Public share page and QR/share scripts returned `200`.
- No production deploy was run; `https://arpeggiator-remix-2.netlify.app` was not replaced.

## Preserved source

- Worktree: `D:\Codex\arpeggiator-remix-exhibition-v2`
- Branch: `feature/exhibition-v2`
