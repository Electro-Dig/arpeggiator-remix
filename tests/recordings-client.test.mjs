import assert from 'node:assert/strict';
import test from 'node:test';

import { uploadRecording, uploadRecordingPoster } from '../share/recordings-client.js';

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
        checkinNumber: 27,
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
    checkinNumber: 27,
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
  for (const result of [
    { token: 'short', expiresAt: 'never', checkinNumber: 1 },
    { token: 'a'.repeat(32), expiresAt: 123, checkinNumber: 0 },
    { token: 'a'.repeat(32), expiresAt: 123, checkinNumber: -1 },
    { token: 'a'.repeat(32), expiresAt: 123, checkinNumber: 1.5 },
    { token: 'a'.repeat(32), expiresAt: 123 },
  ]) {
    await assert.rejects(
      uploadRecording(
        blob,
        async () => Response.json(result),
        'https://app.example.test',
      ),
      /分享响应无效/,
    );
  }
});

test('uploads the composed poster to the existing recording token', async () => {
  const token = 'p'.repeat(32);
  const poster = new Blob(['poster'], { type: 'image/webp' });
  let captured;

  const result = await uploadRecordingPoster(token, poster, async (url, init) => {
    captured = { url, init };
    return Response.json({ ok: true }, { status: 201 });
  });

  assert.equal(captured.url, `/recordings-api/poster/${token}`);
  assert.equal(captured.init.method, 'POST');
  assert.equal(captured.init.headers['content-type'], 'image/webp');
  assert.equal(captured.init.body, poster);
  assert.deepEqual(result, { ok: true });
});

test('rejects malformed poster uploads before calling the network', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls += 1; return new Response(); };
  await assert.rejects(
    uploadRecordingPoster('short', new Blob(['x'], { type: 'image/webp' }), fetchImpl),
    /分享令牌无效/,
  );
  await assert.rejects(
    uploadRecordingPoster('p'.repeat(32), new Blob(['x'], { type: 'image/png' }), fetchImpl),
    /海报格式/,
  );
  assert.equal(calls, 0);
});
