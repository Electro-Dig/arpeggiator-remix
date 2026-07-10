import assert from 'node:assert/strict';
import test from 'node:test';

import { chooseRecordingFormat } from '../recording/mime.js';

test('prefers MP4/AAC when the browser supports it', () => {
  assert.deepEqual(chooseRecordingFormat(() => true), {
    mimeType: 'audio/mp4;codecs=mp4a.40.2',
    extension: 'm4a',
  });
});

test('falls back to WebM/Opus before OGG', () => {
  const supports = (mime) => mime === 'audio/webm;codecs=opus' || mime === 'audio/ogg;codecs=opus';
  assert.deepEqual(chooseRecordingFormat(supports), {
    mimeType: 'audio/webm;codecs=opus',
    extension: 'webm',
  });
});

test('uses a truthful compressed extension when capability probing returns false', () => {
  const result = chooseRecordingFormat(() => false);
  assert.deepEqual(result, { mimeType: '', extension: 'webm' });
  assert.notEqual(result.extension, 'wav');
});
