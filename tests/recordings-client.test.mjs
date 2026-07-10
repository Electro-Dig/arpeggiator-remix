import assert from 'node:assert/strict';
import test from 'node:test';

import { uploadRecording } from '../share/recordings-client.js';

test('uploads the native Blob and returns a same-origin share URL', async () => {
  const blob = new Blob(['audio'], { type: 'audio/webm;codecs=opus' });
  let captured;
  const result = await uploadRecording(
    blob,
    async (url, init) => {
      captured = { url, init };
      return Response.json({
        token: 'a'.repeat(32),
        expiresAt: 123456,
      }, { status: 201 });
    },
    'https://app.example.test',
  );

  assert.equal(captured.url, '/recordings-api/upload');
  assert.equal(captured.init.method, 'POST');
  assert.equal(captured.init.body, blob);
  assert.equal(captured.init.headers['content-type'], 'audio/webm;codecs=opus');
  assert.deepEqual(result, {
    token: 'a'.repeat(32),
    expiresAt: 123456,
    shareUrl: `https://app.example.test/r/${'a'.repeat(32)}`,
  });
});

test('maps upload failures to actionable Chinese messages without replacing the Blob', async () => {
  const cases = [
    [413, /5 MB/],
    [415, /格式/],
    [503, /云端暂时不可用/],
  ];
  for (const [status, message] of cases) {
    const blob = new Blob(['keep-me'], { type: 'audio/webm' });
    let capturedBody;
    await assert.rejects(
      uploadRecording(blob, async (_url, init) => {
        capturedBody = init.body;
        return new Response('failed', { status });
      }, 'https://app.example.test'),
      (error) => error.status === status && message.test(error.message),
    );
    assert.equal(capturedBody, blob);
    assert.equal(await blob.text(), 'keep-me');
  }
});

test('rejects malformed successful responses', async () => {
  const blob = new Blob(['audio'], { type: 'audio/ogg' });
  await assert.rejects(
    uploadRecording(
      blob,
      async () => Response.json({ token: 'short', expiresAt: 'never' }),
      'https://app.example.test',
    ),
    /分享响应无效/,
  );
});
