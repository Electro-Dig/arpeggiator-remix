import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [html, main, game, styles, recordingController] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../main.js', import.meta.url), 'utf8'),
  readFile(new URL('../game.js', import.meta.url), 'utf8'),
  readFile(new URL('../styles.css', import.meta.url), 'utf8'),
  readFile(new URL('../RecordingController.js', import.meta.url), 'utf8'),
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
});

test('recording controls remain visible, optional, and gesture-disableable', () => {
  for (const id of [
    'recording-primary', 'recording-dialog', 'recording-preview',
    'recording-confirm', 'recording-rerecord', 'recording-download',
    'recording-cancel', 'recording-gestures-enabled',
  ]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(main, /new RecordingController/);
  assert.match(main, /actionForThumbIntent/);
  assert.match(main, /guideController\.dialog\?\.open/);
  assert.match(recordingController, /结束并试听/);
  assert.match(styles, /\.recording-dialog/);
  assert.match(styles, /--record:\s*#ff4d5f/i);
});
