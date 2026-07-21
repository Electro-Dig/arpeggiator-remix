import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const projectRoot = new URL('../', import.meta.url);
const retiredArtifacts = [
  'ArpeggioEditor.js',
  'CustomEditor.js',
  'arpeggio-editor-fixed.html',
  'arpeggio-editor-integrated.html',
  'arpeggio-preview-test.html',
  'test-scale-modes.html',
  'test-sequence-editor.html',
  'test-sequence-functionality.js',
  'test-enhanced-visualizer.html',
  'test-enhanced-functionality.js',
  'ARPEGGIO_OPTIMIZATION_REPORT.md',
  'ENHANCED_VISUALIZER_SUMMARY.md',
  'integration-guide.md',
];

async function exists(relativePath) {
  try {
    await access(new URL(relativePath, projectRoot));
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

const [html, main, game, music, drum] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../main.js', import.meta.url), 'utf8'),
  readFile(new URL('../game.js', import.meta.url), 'utf8'),
  readFile(new URL('../MusicManager.js', import.meta.url), 'utf8'),
  readFile(new URL('../DrumManager.js', import.meta.url), 'utf8'),
]);

const [readme, debugMain] = await Promise.all([
  readFile(new URL('../README.md', import.meta.url), 'utf8'),
  readFile(new URL('../debug-main.html', import.meta.url), 'utf8'),
]);

test('retired editor artifacts are absent from the publish root', async () => {
  const checks = await Promise.all(
    retiredArtifacts.map(async (relativePath) => ({
      relativePath,
      present: await exists(relativePath),
    })),
  );
  const present = checks.filter((item) => item.present).map((item) => item.relativePath);
  assert.deepEqual(present, []);
});

test('live arpeggio and drum entry points remain while editor runtime surfaces stay absent', () => {
  assert.doesNotMatch(html, /arpeggio-editor-modal|open-arpeggio-editor/);
  assert.doesNotMatch(main, /ArpeggioEditor|CustomEditor/);

  for (const method of ['startArpeggio', 'updateArpeggioVolume', 'stopArpeggio']) {
    assert.match(music, new RegExp(`${method}\\(`));
  }
  assert.match(game, /musicManager\.updateArpeggioVolume\('Left', velocity\)/);
  assert.match(game, /musicManager\.stopArpeggio\('Left'\)/);
  assert.match(main, /import \* as drumManager from '\.\/DrumManager\.js'/);
  assert.match(game, /import \* as drumManager from '\.\/DrumManager\.js'/);
  assert.match(drum, /export function startSequence\(/);
});

test('docs and diagnostics do not advertise or probe retired editors', () => {
  assert.doesNotMatch(
    readme,
    /\u81ea\u5b9a\u4e49\u7f16\u8f91\u5668|\u7436\u97f3\u7f16\u8f91\u5668\u6d4b\u8bd5|\u9f13\u7ec4\u7f16\u8f91\u5668\u6d4b\u8bd5|\u4fdd\u5b58\u9884\u8bbe|\u7f16\u8f91\u9f13\u7ec4/,
  );
  assert.doesNotMatch(
    debugMain,
    /checkArpeggio|checkEvents|arpeggioEditor|arpeggio-editor-modal|sequencePointsContainer/,
  );
  assert.match(debugMain, /function checkTone\(\)/);
  assert.match(debugMain, /function clearLog\(\)/);
});
