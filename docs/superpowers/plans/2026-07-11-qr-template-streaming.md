# QR Template and Streaming Playback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Composite the approved Bauhaus recording template with a real QR code and make shared audio start faster and seek through byte-range streaming.

**Architecture:** The browser lazily composites a static template and an independently generated QR into one Canvas. Public audio is probed with a one-byte Range request, then streamed directly through the Netlify signed proxy to a range-aware Node service.

**Tech Stack:** Canvas 2D, dynamic ES module import, native `<audio>`, Netlify Functions, Node HTTP, Node test runner.

---

### Task 1: Add deterministic poster compositing

**Files:**
- Create: `assets/qr-share-template-bauhaus.png`
- Modify: `share/qr.js`
- Modify: `tests/qr.test.mjs`

- [ ] Write a failing test that injects `loadTemplate`, `createCanvas`, and `loadQr`; assert the main Canvas receives the template first and a QR sub-canvas at the approved safe rectangle.
- [ ] Run `node --test tests/qr.test.mjs` and verify the current direct QR renderer fails the composition assertions.
- [ ] Implement `renderQr(canvas, value, dependencies)` so the QR library draws to an offscreen Canvas and the template remains intact.
- [ ] Re-run the focused test and commit the compositor and asset.

### Task 2: Add byte-range responses end to end

**Files:**
- Modify: `services/recordings-api/server.mjs`
- Modify: `services/recordings-api/server.test.mjs`
- Modify: `netlify/functions/recordings-api.mjs`
- Modify: `tests/recordings-proxy.test.mjs`

- [ ] Add failing service tests for `Range: bytes=1-2` → 206 with `Content-Range: bytes 1-2/4`, and an unsatisfiable range → 416.
- [ ] Add a failing proxy test requiring the client Range header to reach upstream and requiring safe 206 range headers to reach the browser.
- [ ] Implement one-range parsing in the Node service and safe Range forwarding/header passthrough in the Netlify proxy.
- [ ] Run both focused suites and commit the streaming backend.

### Task 3: Replace full-Blob loading with a one-byte probe

**Files:**
- Modify: `r/share-page.js`
- Modify: `tests/share-page.test.mjs`

- [ ] Change the client test to require `Range: bytes=0-0`, a returned direct `audioUrl`, MIME and expiry, and no Blob read.
- [ ] Run the focused test and verify it fails against `response.blob()`.
- [ ] Implement `probeSharedRecording` and set the player/download URL directly; update status on `loadedmetadata`/`canplay`.
- [ ] Run the focused suite and commit the public playback change.

### Task 4: Integrate the poster layout and redeploy the test environment

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `tests/ui-shell.test.mjs`
- Deploy: server service and Netlify Draft only

- [ ] Add failing static assertions for the selected asset and a one-column `.recording-share` layout.
- [ ] Update the Canvas dimensions and CSS so the poster is centered and details sit below it at desktop and mobile widths.
- [ ] Run `npm test` and `git diff --check`; commit.
- [ ] Copy the committed server file to `/srv/arpeggiator-recordings/app`, restart only `arpeggiator-recordings.service`, verify 200/206/416.
- [ ] Create a new Netlify Draft Deploy and run browser smoke at desktop and 390×844 mobile viewports; do not promote production.
