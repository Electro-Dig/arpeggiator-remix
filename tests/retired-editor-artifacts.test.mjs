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
