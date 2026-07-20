# Direct Share Frame Preview Implementation Plan

1. Add failing controller, QR, and UI shell tests for direct frame display, hidden poster output, and a dedicated QR preview.
2. Move the capture canvas into the share view and add QR/fallback elements.
3. Pass the QR preview canvas through the poster renderer and toggle the frame/fallback in the controller.
4. Replace the fixed 420px poster layout with a viewport-sized frame-first layout.
5. Run focused tests, full tests, visual browser verification, and publish a Netlify Draft.

