# Direct Share Frame Preview Design

## Problem

The share dialog currently previews the entire 1200×1080 generated poster inside a fixed 420px column. The captured browser frame is first fitted into the poster stage and the poster is then scaled again by CSS, so the live image appears compressed even though its aspect ratio is technically preserved.

## Approved direction

Separate the captured first frame from the generated poster:

- The share dialog displays the original capture canvas directly.
- The capture canvas keeps its intrinsic width and height; responsive CSS may only scale it uniformly to the available viewport.
- The generated poster remains an off-screen artifact used for upload and sharing, never as the dialog preview.
- A dedicated QR canvas and the share metadata occupy a compact side column.
- If capture fails, the dialog shows a clear no-frame fallback instead of substituting the poster.

## Data flow

1. Recording countdown captures the first browser frame into `recording-photo-preview`.
2. The same canvas is retained as `currentCover` and shown directly in the shared phase.
3. Poster generation receives `currentCover` as before, but renders into the hidden `recording-qr` poster canvas.
4. QR generation also targets a separate visible `recording-share-qr` canvas.
5. Poster serialization and upload continue unchanged.

## Layout

The shared dialog expands to the viewport. The frame receives the flexible main column; the QR and metadata use a narrow fixed side column. Below tablet width, the side column stacks below the frame so the frame is never squeezed into a narrow column.

## Regression guarantees

- The shared phase exposes the captured canvas when it exists.
- The poster canvas remains hidden from the user.
- QR rendering receives the dedicated QR preview canvas.
- The frame uses `width: 100%` and `height: auto`, with no fixed display width or forced aspect ratio.

