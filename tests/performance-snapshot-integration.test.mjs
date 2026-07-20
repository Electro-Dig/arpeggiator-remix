import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [main, game] = await Promise.all([
  readFile(new URL('../main.js', import.meta.url), 'utf8'),
  readFile(new URL('../game.js', import.meta.url), 'utf8'),
]);

test('recording captures the full performance surface and preserves the WebGL music layer', () => {
  assert.match(main, /import \{[\s\S]*capturePerformanceSnapshot[\s\S]*preloadPerformanceSnapshotRasterizer[\s\S]*\} from ['"]\.\/recording\/performance-snapshot\.js['"]/);
  assert.match(main, /preloadPerformanceSnapshotRasterizer\(\)/);
  assert.match(main, /getPerformanceMetadata:\s*\(\)\s*=>\s*createPerformanceMetadataSnapshot\(/);
  assert.match(main, /rhythmStatus:\s*drumManager\.getCurrentGridCell\(\)/);
  assert.match(main, /getPhotoCaptureSource:\s*\(\)\s*=>\s*capturePerformanceSnapshot\(\{ root: renderDiv \}\)/);
  assert.match(main, /getPhotoOverlays:\s*\(\)\s*=>/);
  assert.match(main, /source:\s*game\.renderer\.domElement/);
  assert.match(main, /fit:\s*['"]contain['"]/);
  assert.match(main, /blendMode:\s*['"]screen['"]/);
  assert.match(main, /mirror:\s*true/);
  assert.match(game, /preserveDrawingBuffer:\s*true/);
  assert.match(game, /videoElement\.dataset\.cameraFeed\s*=\s*['"]true['"]/);
  assert.match(game, /renderer\.domElement\.dataset\.photoCaptureIgnore\s*=\s*['"]true['"]/);
});
