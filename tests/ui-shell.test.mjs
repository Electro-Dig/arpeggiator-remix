import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [html, main, game] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../main.js', import.meta.url), 'utf8'),
  readFile(new URL('../game.js', import.meta.url), 'utf8'),
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
