import assert from 'node:assert/strict';
import test from 'node:test';

import { verifyRecordingRequest } from '../netlify/recording-signature.js';
import { handleRecordingProxy } from '../netlify/functions/recordings-api.mjs';

const env = {
  RECORDINGS_ORIGIN: 'https://recordings.example.test',
  RECORDINGS_PROXY_SECRET: 'test-secret-with-at-least-32-bytes',
};

function uploadRequest(body, type = 'audio/webm;codecs=opus') {
  return new Request('https://app.example.test/recordings-api/upload', {
    method: 'POST',
    headers: { 'content-type': type },
    body,
  });
}

function posterRequest(token, body, type = 'image/webp') {
  return new Request(`https://app.example.test/recordings-api/poster/${token}`, {
    method: 'POST',
    headers: { 'content-type': type },
    body,
  });
}

test('rejects oversized uploads before calling upstream', async () => {
  let fetchCalls = 0;
  const response = await handleRecordingProxy(
    uploadRequest(new Uint8Array(5 * 1024 * 1024 + 1)),
    env,
    async () => { fetchCalls += 1; },
  );
  assert.equal(response.status, 413);
  assert.equal(fetchCalls, 0);
});

test('rejects empty uploads before calling upstream', async () => {
  let fetchCalls = 0;
  const response = await handleRecordingProxy(
    uploadRequest(new Uint8Array()),
    env,
    async () => { fetchCalls += 1; },
  );
  assert.equal(response.status, 400);
  assert.equal(fetchCalls, 0);
});

test('rejects unsupported recording MIME before calling upstream', async () => {
  let fetchCalls = 0;
  const response = await handleRecordingProxy(
    uploadRequest(new Uint8Array([1, 2, 3]), 'audio/wav'),
    env,
    async () => { fetchCalls += 1; },
  );
  assert.equal(response.status, 415);
  assert.equal(fetchCalls, 0);
});

test('maps upload to the signed storage route', async () => {
  const audio = new Uint8Array([1, 2, 3, 4]);
  let captured;
  const response = await handleRecordingProxy(
    uploadRequest(audio, 'audio/mp4;codecs=mp4a.40.2'),
    env,
    async (url, init) => {
      captured = { url, init };
      return Response.json({ token: 'a'.repeat(32), expiresAt: 1234 }, { status: 201 });
    },
  );

  assert.equal(response.status, 201);
  assert.equal(captured.url, 'https://recordings.example.test/v1/recordings');
  assert.equal(captured.init.method, 'POST');
  assert.equal(captured.init.headers['content-type'], 'audio/mp4');
  assert.equal(captured.init.headers['content-length'], '4');
  assert.equal(await verifyRecordingRequest({
    secret: env.RECORDINGS_PROXY_SECRET,
    timestamp: captured.init.headers['x-arp-timestamp'],
    method: 'POST',
    path: '/v1/recordings',
    body: captured.init.body,
    signature: captured.init.headers['x-arp-signature'],
    nowSeconds: Number(captured.init.headers['x-arp-timestamp']),
  }), true);
});

test('maps a valid public token to the signed audio route', async () => {
  const token = 'Abc_123-'.repeat(4);
  let captured;
  const response = await handleRecordingProxy(
    new Request(`https://app.example.test/r/audio/${token}`, {
      headers: { range: 'bytes=1-2' },
    }),
    env,
    async (url, init) => {
      captured = { url, init };
      return new Response(new Uint8Array([9, 8]), {
        status: 206,
        headers: {
          'content-type': 'audio/webm',
          'content-range': 'bytes 1-2/4',
          'content-length': '2',
          'accept-ranges': 'bytes',
          'x-recording-expires-at': '1234',
          'x-recording-checkin-number': '27',
        },
      });
    },
  );
  assert.equal(response.status, 206);
  assert.equal(captured.url, `https://recordings.example.test/v1/recordings/${token}`);
  assert.equal(captured.init.method, 'GET');
  assert.equal(captured.init.headers.range, 'bytes=1-2');
  assert.equal(response.headers.get('content-type'), 'audio/webm');
  assert.equal(response.headers.get('content-range'), 'bytes 1-2/4');
  assert.equal(response.headers.get('content-length'), '2');
  assert.equal(response.headers.get('accept-ranges'), 'bytes');
  assert.equal(response.headers.get('x-recording-expires-at'), '1234');
  assert.equal(response.headers.get('x-recording-checkin-number'), '27');
});

test('maps poster upload and public download to the signed poster route', async () => {
  const token = 'Poster_1'.repeat(4);
  const poster = new Uint8Array([7, 6, 5]);
  const calls = [];
  const upload = await handleRecordingProxy(
    posterRequest(token, poster),
    env,
    async (url, init) => {
      calls.push({ url, init });
      return Response.json({ ok: true }, { status: 201 });
    },
  );
  assert.equal(upload.status, 201);
  assert.equal(calls[0].url, `https://recordings.example.test/v1/recordings/${token}/poster`);
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers['content-type'], 'image/webp');
  assert.equal(await verifyRecordingRequest({
    secret: env.RECORDINGS_PROXY_SECRET,
    timestamp: calls[0].init.headers['x-arp-timestamp'],
    method: 'POST',
    path: `/v1/recordings/${token}/poster`,
    body: calls[0].init.body,
    signature: calls[0].init.headers['x-arp-signature'],
    nowSeconds: Number(calls[0].init.headers['x-arp-timestamp']),
  }), true);

  const download = await handleRecordingProxy(
    new Request(`https://app.example.test/r/poster/${token}`),
    env,
    async (url, init) => {
      calls.push({ url, init });
      return new Response(poster, {
        status: 200,
        headers: {
          'content-type': 'image/webp',
          'content-length': String(poster.length),
          'x-recording-expires-at': '1234',
        },
      });
    },
  );
  assert.equal(download.status, 200);
  assert.equal(calls[1].url, `https://recordings.example.test/v1/recordings/${token}/poster`);
  assert.equal(download.headers.get('content-type'), 'image/webp');
  assert.equal(download.headers.get('content-length'), String(poster.length));
});

test('rejects invalid and oversized poster uploads before calling upstream', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls += 1; };
  assert.equal((await handleRecordingProxy(
    posterRequest('short', new Uint8Array([1])), env, fetchImpl,
  )).status, 400);
  assert.equal((await handleRecordingProxy(
    posterRequest('p'.repeat(32), new Uint8Array([1]), 'image/png'), env, fetchImpl,
  )).status, 415);
  assert.equal((await handleRecordingProxy(
    posterRequest('p'.repeat(32), new Uint8Array(2 * 1024 * 1024 + 1)), env, fetchImpl,
  )).status, 413);
  assert.equal(calls, 0);
});

test('rejects malformed public tokens without calling upstream', async () => {
  let fetchCalls = 0;
  const response = await handleRecordingProxy(
    new Request('https://app.example.test/r/audio/short'),
    env,
    async () => { fetchCalls += 1; },
  );
  assert.equal(response.status, 400);
  assert.equal(fetchCalls, 0);
});

test('passes through safe upstream status without exposing upstream headers', async () => {
  for (const status of [410, 503]) {
    const response = await handleRecordingProxy(
      new Request(`https://app.example.test/r/audio/${'z'.repeat(32)}`),
      env,
      async () => new Response('upstream', {
        status,
        headers: {
          'content-type': 'text/plain',
          'x-upstream-secret': 'hidden',
        },
      }),
    );
    assert.equal(response.status, status);
    assert.equal(response.headers.get('x-upstream-secret'), null);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  }
});
