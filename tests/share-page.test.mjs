import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  fetchSharedRecording,
  parseShareToken,
} from '../r/share-page.js';

test('extracts only valid unguessable tokens from share paths', () => {
  const token = 'Abc_123-'.repeat(4);
  assert.equal(parseShareToken(`/r/${token}`), token);
  assert.equal(parseShareToken(`/r/${token}/`), token);
  assert.equal(parseShareToken('/r/short'), null);
  assert.equal(parseShareToken('/r/../../secret'), null);
});

test('fetches shared audio and exposes its expiry', async () => {
  const token = 'a'.repeat(32);
  let requested;
  const result = await fetchSharedRecording(token, async (url) => {
    requested = url;
    return new Response(new Blob(['audio'], { type: 'audio/webm' }), {
      headers: { 'x-recording-expires-at': '123456' },
    });
  });

  assert.equal(requested, `/r/audio/${token}`);
  assert.equal(result.expiresAt, 123456);
  assert.equal(result.blob.type, 'audio/webm');
  assert.equal(await result.blob.text(), 'audio');
});

test('maps expired and unavailable recordings to clear states', async () => {
  await assert.rejects(
    fetchSharedRecording('a'.repeat(32), async () => new Response('', { status: 410 })),
    (error) => error.status === 410 && /已失效/.test(error.message),
  );
  await assert.rejects(
    fetchSharedRecording('a'.repeat(32), async () => new Response('', { status: 503 })),
    (error) => error.status === 503 && /暂时无法/.test(error.message),
  );
});

test('public page stays lightweight and includes playback, download and noindex', async () => {
  const html = await readFile(new URL('../r/index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../r/share.css', import.meta.url), 'utf8');
  assert.match(html, /<audio[^>]+controls/);
  assert.match(html, /id="download-recording"/);
  assert.match(html, /id="recording-expiry"/);
  assert.match(html, /name="robots" content="noindex,nofollow,noarchive"/);
  assert.doesNotMatch(html, /MediaPipe|Tone\.js|mediapipe|main\.js|camera/i);
  assert.match(css, /\[hidden\]\s*\{\s*display:\s*none\s*!important/);
});
