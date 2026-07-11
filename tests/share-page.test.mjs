import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import * as sharePage from '../r/share-page.js';

const { probeSharedRecording, parseShareToken, takeLabelForToken } = sharePage;

test('extracts only valid unguessable tokens from share paths', () => {
  const token = 'Abc_123-'.repeat(4);
  assert.equal(parseShareToken(`/r/${token}`), token);
  assert.equal(parseShareToken(`/r/${token}/`), token);
  assert.equal(parseShareToken('/r/short'), null);
  assert.equal(parseShareToken('/r/../../secret'), null);
});

test('probes one byte and returns a direct streaming URL without reading a Blob', async () => {
  const token = 'a'.repeat(32);
  let requested;
  const result = await probeSharedRecording(token, async (url, init) => {
    requested = { url, init };
    const response = new Response(new Uint8Array([0]), {
      status: 206,
      headers: {
        'content-type': 'audio/webm',
        'content-range': 'bytes 0-0/1000',
        'x-recording-expires-at': '123456',
      },
    });
    response.blob = () => assert.fail('probe must not read the complete recording Blob');
    return response;
  });

  assert.equal(requested.url, `/r/audio/${token}`);
  assert.equal(requested.init.headers.range, 'bytes=0-0');
  assert.deepEqual(result, {
    audioUrl: `/r/audio/${token}`,
    expiresAt: 123456,
    mime: 'audio/webm',
  });
});

test('maps expired and unavailable recordings to clear states', async () => {
  await assert.rejects(
    probeSharedRecording('a'.repeat(32), async () => new Response('', { status: 410 })),
    (error) => error.status === 410 && /已失效/.test(error.message),
  );
  await assert.rejects(
    probeSharedRecording('a'.repeat(32), async () => new Response('', { status: 503 })),
    (error) => error.status === 503 && /暂时无法/.test(error.message),
  );
});

test('public page stays lightweight and includes playback, download and noindex', async () => {
  const html = await readFile(new URL('../r/index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../r/share.css', import.meta.url), 'utf8');
  assert.match(html, /<audio[^>]+controls/);
  assert.match(html, /id="download-recording"/);
  assert.match(html, /id="download-poster"/);
  assert.match(html, /id="recording-expiry"/);
  assert.match(html, /name="robots" content="noindex,nofollow,noarchive"/);
  assert.doesNotMatch(html, /MediaPipe|Tone\.js|mediapipe|main\.js|camera/i);
  assert.match(css, /\[hidden\]\s*\{\s*display:\s*none\s*!important/);
  const script = await readFile(new URL('../r/share-page.js', import.meta.url), 'utf8');
  assert.doesNotMatch(script, /response\.blob\(|URL\.createObjectURL/);
  assert.match(script, /downloadPoster/);
  assert.match(script, /addEventListener\('click'[\s\S]*downloadPoster/);
});

test('derives a stable public take label without exposing the full token', () => {
  assert.equal(takeLabelForToken('AbCd1234'.repeat(4)), 'TAKE CD12');
});
