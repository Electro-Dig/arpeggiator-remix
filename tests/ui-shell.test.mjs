import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [html, main, game, styles, recordingController, qr] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../main.js', import.meta.url), 'utf8'),
  readFile(new URL('../game.js', import.meta.url), 'utf8'),
  readFile(new URL('../styles.css', import.meta.url), 'utf8'),
  readFile(new URL('../RecordingController.js', import.meta.url), 'utf8'),
  readFile(new URL('../share/qr.js', import.meta.url), 'utf8'),
]);

test('runtime editor surfaces and legacy slogan are absent', () => {
  assert.doesNotMatch(html, /arpeggio-editor-modal|drum-editor-modal|open-arpeggio-editor|open-drum-editor/);
  assert.doesNotMatch(main, /CustomEditor|ArpeggioEditor/);
  assert.doesNotMatch(`${html}\n${game}`, /raise your hands to raise the roof/i);
  assert.doesNotMatch(html, /unpkg\.com\/tone/);
});

test('exhibition controls and social links remain discoverable', () => {
  for (const id of ['info-text', 'open-guide', 'control-deck', 'toggle-simple-mode']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /https:\/\/github\.com\/Electro-Dig/);
  assert.match(html, /https:\/\/www\.xiaohongshu\.com\/user\/profile\/6070457c000000000101efac/);
});

test('visual shell supports control deck, simple mode, and reduced motion', () => {
  assert.match(styles, /--cyan:\s*#80e7ec/i);
  assert.match(styles, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(styles, /\.simple-mode\s+#renderDiv::after/);
  assert.match(main, /control-deck-toggle/);
  assert.match(main, /classList\.toggle\('simple-mode'/);
});

test('rhythm space uses a transform-only overlay and event-driven confirmed status', () => {
  for (const id of ['rhythm-space', 'rhythm-cursor', 'rhythm-pointer', 'rhythm-cell-label', 'drum-kit-label', 'drum-kit-select']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(styles, /\.rhythm-space/);
  assert.match(styles, /\.rhythm-space__grid[\s\S]*?width:\s*182px/);
  assert.match(styles, /\.simple-mode\s+\.rhythm-space/);
  assert.match(main, /new RhythmGridOverlay/);
  assert.match(main, /addEventListener\('rhythmpointer'/);
  assert.match(main, /onRhythmCellChange/);
  assert.match(main, /onDrumKitChange/);
  assert.match(main, /setDrumKit\(drumKitSelect\.value/);
  assert.match(game, /new RhythmZone\(\)/);
  assert.match(game, /rhythmZone\.map\(1 - normX_visible, normY_visible\)/);
  assert.match(html, /STRAIGHT → BROKEN/);
  assert.match(html, /MINIMAL → ENERGY/);
  assert.doesNotMatch(main, /\n\s{4}observeDrumManager\(drumMgr\)[\s\S]{0,500}setInterval/);
});

test('wide-screen HUD preserves full labels and lifts the rhythm grid above the sequencer', () => {
  assert.match(styles, /\.performance-status\s*\{[\s\S]*?display:\s*grid/);
  assert.match(styles, /grid-template-columns:\s*minmax\(145px,\s*1\.2fr\)/);
  assert.doesNotMatch(styles, /\.hud-metric dd\s*\{[^}]*text-overflow:\s*ellipsis/s);
  assert.doesNotMatch(styles, /\.hud-metric dd\s*\{[^}]*max-width:\s*150px/s);
  assert.match(styles, /\.rhythm-space\s*\{[^}]*right:\s*72px[^}]*bottom:\s*190px/s);
});

test('six standalone music scenes and semantic HUD remain available without tracking', () => {
  for (const id of ['scene-selector', 'current-root-note']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  for (const scene of [
    'minimal-groove', 'groove-pulse', 'neon-drive', 'arcade-horizon',
    'afterglow-coast', 'blue-hour-drift',
  ]) {
    assert.match(html, new RegExp(`data-scene=["']${scene}["']`));
  }
  assert.doesNotMatch(html, /data-scene=["']midnight-pulse["']/);
  assert.doesNotMatch(html, /classic-pattern-control|classic-pattern-select|data-scene=["']classic["']/);
  assert.match(main, /musicManager\.setScene\(sceneId\)/);
  assert.doesNotMatch(main, /setClassicPreset|classic-pattern/);
  assert.match(main, /onStatusChange/);
  assert.doesNotMatch(main, /setInterval\(/);
});

test('narrow screens stack scene fallback controls above the lower corner utilities', () => {
  assert.match(styles, /@media \(max-width: 620px\)[\s\S]*?\.performance-controls\s*\{[\s\S]*?bottom:\s*248px/);
  assert.match(styles, /@media \(max-width: 620px\)[\s\S]*?\.performance-controls\s*\{[\s\S]*?width:\s*calc\(100vw - 24px\)/);
  assert.match(styles, /@media \(max-width: 620px\)[\s\S]*?\.scene-selector\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2/);
});

test('editorial hierarchy remains restrained and semantic', () => {
  for (const className of ['hud-metric', 'operator-action__meta', 'guide-card__step', 'guide-card__notations']) {
    assert.match(html, new RegExp(`class=["'][^"']*${className}`));
  }
  for (const id of ['guide-step', 'guide-notation-primary', 'guide-notation-secondary', 'delay-diagnostics']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(styles, /--text:\s*#f2efe8/i);
  assert.match(styles, /--signal:\s*#ff9a4a/i);
  assert.match(styles, /Bahnschrift/);
  assert.doesNotMatch(styles, /\.guide-card::after/);
  assert.match(styles, /\.guide-card h2\s*\{[^}]*font-size:\s*clamp\(32px,\s*3vw,\s*44px\)/s);
  assert.match(styles, /\.guide-card #guide-body\s*\{[^}]*font-size:\s*clamp\(18px,\s*1\.45vw,\s*22px\)/s);
  assert.match(styles, /\.guide-card__notations span\s*\{[^}]*font:\s*600 15px/s);
  assert.match(styles, /\.guide-card \.guide-card__crowd\s*\{[^}]*font:\s*600 15px/s);
  assert.match(styles, /\.guide-action\s*\{[^}]*font:\s*600 16px/s);
  assert.match(styles, /#guide-progress\s*\{[^}]*font:\s*600 15px/s);
});

test('recording controls remain visible, optional, and gesture-disableable', () => {
  for (const id of [
    'recording-primary', 'recording-dialog', 'recording-preview',
    'recording-review-status', 'recording-review-wave',
    'recording-confirm', 'recording-rerecord', 'recording-download',
    'recording-cancel', 'recording-gestures-enabled',
    'recording-status', 'recording-share', 'recording-qr',
    'recording-share-link', 'recording-share-expiry', 'recording-copy-link', 'recording-checkin',
    'recording-photo', 'recording-photo-video', 'recording-photo-preview',
    'recording-photo-countdown', 'recording-photo-skip',
  ]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(main, /new RecordingController/);
  assert.match(main, /onUploadRequest:\s*\(blob\)\s*=>\s*uploadRecording\(blob\)/);
  assert.match(main, /getVideoSource:\s*\(\)\s*=>\s*game\.videoElement/);
  assert.match(main, /actionForThumbIntent/);
  assert.match(main, /guideController\.dialog\?\.open/);
  assert.match(recordingController, /结束并试听/);
  assert.match(styles, /\.recording-dialog/);
  assert.match(styles, /--record:\s*#ff4d5f/i);
  assert.match(styles, /\.rec-status\[data-phase=["']recording["']\]/);
  assert.match(styles, /@keyframes\s+rec-status-pulse/);
  assert.match(html, /<audio id="recording-preview" preload="metadata" hidden><\/audio>/);
  assert.doesNotMatch(html, /id="recording-preview"[^>]*controls/);
  assert.match(styles, /\.recording-dialog\s*\{[^}]*max-height:\s*calc\(100dvh - 32px\)/s);
  assert.match(styles, /\.recording-dialog\[data-phase="shared"\] \.recording-share\s*\{[^}]*grid-template-columns:\s*minmax\(280px,\s*\.8fr\) minmax\(0,\s*1\.2fr\)/s);
  assert.match(styles, /\.recording-review-status\s*\{/);
  assert.match(styles, /\.recording-review-wave\s*\{/);
  assert.match(styles, /\.recording-action\s*\{[^}]*min-height:\s*56px[^}]*font:\s*600 14px/s);
  assert.match(qr, /这是我的现场单曲/);
  assert.match(qr, /PLAYER/);
  assert.match(html, /id="recording-qr"[^>]+width="1080"[^>]+height="1440"/);
  assert.doesNotMatch(styles, /\.recording-dialog\[data-phase="shared"\]\s*\{[^}]*overflow:\s*auto/s);
  assert.match(styles, /\.recording-share__copy\s*\{[^}]*color:\s*#102025/s);
});

test('guide consumes thumbs gestures page by page and requires neutral rearming', () => {
  assert.match(main, /trigger === 'both-up'[\s\S]*guideController\.advanceFromGesture\(\)/);
  assert.match(main, /trigger === 'both-down'[\s\S]*guideController\.exitFromGesture\(\)/);
  assert.match(main, /guideController\.dialog\?\.open[\s\S]*recordingGestureLatch\.requireNeutral\(\)/);
  assert.doesNotMatch(main, /guideController\.skipFromGesture\(\)/);
});
