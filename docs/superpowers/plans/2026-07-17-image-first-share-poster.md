# Image-first Share Poster Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the complete recording-start frame dominate the share poster and remove the parameter table below it.

**Architecture:** Keep the existing Canvas renderer and QR pipeline, but replace the portrait ticket geometry with a near-square image-first layout. The poster still uses a pure contain calculation; CSS controls only the on-screen preview size.

**Tech Stack:** Canvas 2D, CSS Grid, Node test runner.

---

### Task 1: Lock the image-first poster contract

**Files:**
- Modify: `tests/qr.test.mjs`

- [ ] Change the expected poster to `1200×1080`, the stage to `{ x: 40, y: 118, width: 1120, height: 700 }`, and the QR to `{ x: 936, y: 842, size: 216 }`.
- [ ] Assert that 16:10 and 16:9 sources use their complete source rectangles and are centered inside the stage.
- [ ] Assert that Scene, Synth, Rhythm, BPM, Root, and FX labels are absent.
- [ ] Run `node --test tests/qr.test.mjs`; expect the geometry and removed-label assertions to fail.

### Task 2: Implement the compact image-first Canvas layout

**Files:**
- Modify: `share/poster-ticket.js`

- [ ] Replace the poster and stage constants with the new geometry.
- [ ] Center the contained image on both axes by returning `rect.y + (rect.height - height) / 2`.
- [ ] Delete `drawMeta` and its call.
- [ ] Move the divider, player identity, scan hint, and QR-safe space directly below the image stage.
- [ ] Run `node --test tests/qr.test.mjs`; expect all poster tests to pass.

### Task 3: Enlarge the share preview

**Files:**
- Modify: `styles.css`
- Modify: `tests/ui-shell.test.mjs`

- [ ] Add a failing CSS contract requiring a desktop shared-dialog width of 1040px, a 420px poster column, and a 420px poster preview.
- [ ] Run `node --test tests/ui-shell.test.mjs`; expect the new contract to fail.
- [ ] Update the shared dialog and grid dimensions while retaining the existing one-column mobile breakpoint.
- [ ] Run the focused UI test, then `npm.cmd test`, `git diff --check`, and JavaScript syntax checks.
- [ ] Deploy a new Netlify Draft without `--prod`.

