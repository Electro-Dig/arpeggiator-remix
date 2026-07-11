import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { signRecordingRequest } from '../../netlify/recording-signature.js';
import { createRecordingServer } from './server.mjs';
import { MAX_BYTES, RecordingStore } from './storage.mjs';

const secret = 'server-test-secret-with-at-least-32-bytes';
const adminSecret = 'admin-test-secret-with-at-least-32-bytes';

async function withServer(run) {
  const root = await mkdtemp(join(tmpdir(), 'arpeggiator-server-'));
  const store = new RecordingStore(root);
  await store.init();
  const server = createRecordingServer({ store, secret, adminSecret });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    await run({ origin: `http://127.0.0.1:${port}`, root });
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (
      error ? reject(error) : resolve()
    )));
    await rm(root, { recursive: true, force: true });
  }
}

async function signedHeaders({ method, path, body = new Uint8Array(), mime }) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = await signRecordingRequest({ secret, timestamp, method, path, body });
  return {
    ...(mime ? { 'content-type': mime } : {}),
    'x-arp-timestamp': timestamp,
    'x-arp-signature': signature,
  };
}

test('health is available without authentication', async () => {
  await withServer(async ({ origin }) => {
    const response = await fetch(`${origin}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
  });
});

test('signed upload and download round-trip audio bytes', async () => {
  await withServer(async ({ origin }) => {
    const body = new Uint8Array([1, 3, 5, 7]);
    const uploadPath = '/v1/recordings';
    const upload = await fetch(`${origin}${uploadPath}`, {
      method: 'POST',
      headers: await signedHeaders({
        method: 'POST', path: uploadPath, body, mime: 'audio/webm',
      }),
      body,
    });
    assert.equal(upload.status, 201);
    const result = await upload.json();
    assert.match(result.token, /^[A-Za-z0-9_-]{32}$/);
    assert.equal(result.checkinNumber, 1);

    const downloadPath = `/v1/recordings/${result.token}`;
    const download = await fetch(`${origin}${downloadPath}`, {
      headers: await signedHeaders({ method: 'GET', path: downloadPath }),
    });
    assert.equal(download.status, 200);
    assert.equal(download.headers.get('content-type'), 'audio/webm');
    assert.equal(download.headers.get('x-recording-expires-at'), String(result.expiresAt));
    assert.equal(download.headers.get('x-recording-checkin-number'), '1');
    assert.deepEqual(new Uint8Array(await download.arrayBuffer()), body);
  });
});

test('admin reset is authenticated and controls the next successful check-in', async () => {
  await withServer(async ({ origin }) => {
    const denied = await fetch(`${origin}/v1/admin/counter/reset`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ value: 10 }),
    });
    assert.equal(denied.status, 401);

    const reset = await fetch(`${origin}/v1/admin/counter/reset`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-recordings-admin-key': adminSecret,
      },
      body: JSON.stringify({ value: 10 }),
    });
    assert.equal(reset.status, 200);
    assert.deepEqual(await reset.json(), { value: 10 });

    const body = new Uint8Array([9]);
    const path = '/v1/recordings';
    const upload = await fetch(`${origin}${path}`, {
      method: 'POST',
      headers: await signedHeaders({ method: 'POST', path, body, mime: 'audio/webm' }),
      body,
    });
    assert.equal(upload.status, 201);
    assert.equal((await upload.json()).checkinNumber, 11);
  });
});

test('signed range reads return 206 and reject unsatisfiable ranges with 416', async () => {
  await withServer(async ({ origin }) => {
    const body = new Uint8Array([10, 20, 30, 40]);
    const uploadPath = '/v1/recordings';
    const upload = await fetch(`${origin}${uploadPath}`, {
      method: 'POST',
      headers: await signedHeaders({
        method: 'POST', path: uploadPath, body, mime: 'audio/webm',
      }),
      body,
    });
    const result = await upload.json();
    const downloadPath = `/v1/recordings/${result.token}`;
    const authHeaders = await signedHeaders({ method: 'GET', path: downloadPath });

    const partial = await fetch(`${origin}${downloadPath}`, {
      headers: { ...authHeaders, range: 'bytes=1-2' },
    });
    assert.equal(partial.status, 206);
    assert.equal(partial.headers.get('accept-ranges'), 'bytes');
    assert.equal(partial.headers.get('content-range'), 'bytes 1-2/4');
    assert.equal(partial.headers.get('content-length'), '2');
    assert.deepEqual(new Uint8Array(await partial.arrayBuffer()), new Uint8Array([20, 30]));

    const unsatisfiable = await fetch(`${origin}${downloadPath}`, {
      headers: { ...authHeaders, range: 'bytes=9-10' },
    });
    assert.equal(unsatisfiable.status, 416);
    assert.equal(unsatisfiable.headers.get('content-range'), 'bytes */4');
  });
});

test('unsigned and oversized uploads cannot mutate storage', async () => {
  await withServer(async ({ origin, root }) => {
    const unsigned = await fetch(`${origin}/v1/recordings`, {
      method: 'POST',
      headers: { 'content-type': 'audio/webm' },
      body: new Uint8Array([1]),
    });
    assert.equal(unsigned.status, 401);
    assert.deepEqual(await readdir(root), []);

    const body = new Uint8Array(MAX_BYTES + 1);
    const path = '/v1/recordings';
    const oversized = await fetch(`${origin}${path}`, {
      method: 'POST',
      headers: await signedHeaders({ method: 'POST', path, body, mime: 'audio/webm' }),
      body,
    });
    assert.equal(oversized.status, 413);
    assert.deepEqual(await readdir(root), []);
  });
});
