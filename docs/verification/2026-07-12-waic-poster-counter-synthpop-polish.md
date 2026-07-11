# WAIC Poster, Counter, and Synthpop Polish Verification

Verified on 2026-07-12 against branch `feature/exhibition-v2`.

## Automated checks

- JavaScript syntax checks passed for the recording controller, QR renderer, mobile share page, recording service, and counter reset script.
- Full project suite: 143 tests passed, 0 failed.

## Browser smoke

The Codex in-app browser plugin could not start because its runtime metadata omitted `sandboxPolicy`. This happened before project code executed, so the visual smoke was completed with the independent `agent-browser` fallback.

Captured states:

- Guide page 1: `.artifacts/screenshot-1783791180082.png`
- Guide page 2: `.artifacts/screenshot-1783791436850.png`
- Guide page 3: `.artifacts/screenshot-1783791604716.png`
- Recording review: `.artifacts/screenshot-1783791702719.png`
- Desktop shared state: `.artifacts/screenshot-1783791821753.png`
- Narrow shared state: `.artifacts/screenshot-1783791947486.png`

The automation browser has no camera device, so real camera and hand-gesture behavior remains an on-device exhibition smoke item. The visual states, navigation, recording review, poster generation, visible discard action, and responsive layouts were inspected.

## Recording service

- Service: `arpeggiator-recordings.service` on `43.159.132.70`
- Isolated deployment path: `/srv/arpeggiator-recordings`
- Backup created at `/srv/arpeggiator-recordings/backups/20260712-015059`
- Internal and external health endpoints returned `{"ok":true}`.
- Signed upload smoke returned HTTP 201 and check-in number 1.
- Range playback returned HTTP 206 with `Accept-Ranges: bytes`.
- Counter was reset to 0 after the smoke.

## Netlify Draft

- Draft URL: https://6a52841a46672bc6fddd6a20--arpeggiator-remix-2.netlify.app
- Deploy log: https://app.netlify.com/projects/arpeggiator-remix-2/deploys/6a52841a46672bc6fddd6a20
- Invite gate redirects the root route.
- QR script, mint WAIC poster asset, and public `/r/` share page returned HTTP 200.
- Unauthenticated recording upload remains protected by the invite gate.
- No production deploy was run.
- `origin/main` remained at `59f9ef3c6b9af1ab77ab4d02693830959a93771a` during final verification.

## Integration decision

The user selected the test-branch workflow. Keep `feature/exhibition-v2` and its worktree; push it to origin without merging into `main` or replacing the production Netlify site.
