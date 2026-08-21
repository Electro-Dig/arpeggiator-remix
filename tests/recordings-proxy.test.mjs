import assert from 'node:assert/strict';
import test from 'node:test';

import { verifyRecordingRequest } from '../netlify/recording-signature.js';
import * as blobBackend from '../netlify/blob-recording-backend.mjs';
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

class MemoryBlobStore {
  constructor() {
    this.entries = new Map();
    this.nextEtag = 1;
    this.binaryInputTypes = [];
  }

  async set(key, data, options = {}) {
    this.binaryInputTypes.push(data?.constructor?.name || typeof data);
    this.entries.set(key, {
      data: new Uint8Array(data),
      metadata: options.metadata || {},
      etag: String(this.nextEtag++),
    });
    return { modified: true, etag: this.entries.get(key).etag };
  }

  async setJSON(key, data, options = {}) {
    const existing = this.entries.get(key);
    if (options.onlyIfNew && existing) return { modified: false };
    if (options.onlyIfMatch && existing?.etag !== options.onlyIfMatch) {
      return { modified: false };
    }
    const entry = {
      data: structuredClone(data),
      metadata: options.metadata || {},
      etag: String(this.nextEtag++),
    };
    this.entries.set(key, entry);
    return { modified: true, etag: entry.etag };
  }

  async get(key, options = {}) {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (options.type === 'json') return structuredClone(entry.data);
    if (options.type === 'arrayBuffer') {
      const bytes = new Uint8Array(entry.data);
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    }
    return entry.data;
  }

  async getWithMetadata(key, options = {}) {
    const entry = this.entries.get(key);
    if (!entry) return null;
    const data = options.type === 'json' ? structuredClone(entry.data) : entry.data;
    return { data, etag: entry.etag, metadata: structuredClone(entry.metadata) };
  }

  async getMetadata(key) {
    const entry = this.entries.get(key);
    if (!entry) return null;
    return { etag: entry.etag, metadata: structuredClone(entry.metadata) };
  }

  list(options = {}) {
    const page = {
      blobs: [...this.entries]
        .filter(([key]) => !options.prefix || key.startsWith(options.prefix))
        .map(([key, entry]) => ({ key, etag: entry.etag })),
      directories: [],
    };
    if (!options.paginate) return Promise.resolve(page);
    return (async function* pages() { yield page; }());
  }

  async delete(key) {
    this.entries.delete(key);
  }
}

test('rejects oversized Blobs uploads before calling storage', async () => {
  let fetchCalls = 0;
  const response = await handleRecordingProxy(
    uploadRequest(new Uint8Array(4 * 1024 * 1024 + 1)),
    { ...env, RECORDINGS_BACKEND: 'blobs' },
    async () => {
      fetchCalls += 1;
      return new Response('legacy origin called', { status: 503 });
    },
  );
  assert.equal(response.status, 413);
  assert.equal(fetchCalls, 0);
});

test('keeps the legacy 5 MiB upload boundary when Blobs are disabled', async () => {
  let fetchCalls = 0;
  const response = await handleRecordingProxy(
    uploadRequest(new Uint8Array(4 * 1024 * 1024 + 1)),
    env,
    async () => {
      fetchCalls += 1;
      return Response.json({ token: 'a'.repeat(32), expiresAt: 1234 }, { status: 201 });
    },
  );
  assert.equal(response.status, 201);
  assert.equal(fetchCalls, 1);
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

test('blob backend stores an uploaded recording without calling the legacy origin', async () => {
  const store = new MemoryBlobStore();
  let fetchCalls = 0;
  const now = 1_000_000;
  const response = await handleRecordingProxy(
    uploadRequest(new Uint8Array([1, 2, 3, 4])),
    { ...env, RECORDINGS_BACKEND: 'blobs' },
    async () => {
      fetchCalls += 1;
      return new Response('legacy origin called', { status: 503 });
    },
    { blobStore: store, now: () => now },
  );

  assert.equal(response.status, 201);
  assert.equal(fetchCalls, 0);
  const result = await response.json();
  assert.match(result.token, /^[A-Za-z0-9_-]{32,128}$/);
  assert.equal(result.expiresAt, now + 24 * 60 * 60 * 1000);
  assert.equal(result.checkinNumber, 1);
  assert.deepEqual(store.binaryInputTypes, ['ArrayBuffer']);
});

test('blob backend completes poster upload and public audio/poster downloads', async () => {
  const store = new MemoryBlobStore();
  const dependencies = { blobStore: store, now: () => 2_000_000 };
  const blobEnv = { ...env, RECORDINGS_BACKEND: 'blobs' };
  const failLegacyFetch = async () => new Response('legacy origin called', { status: 503 });
  const upload = await handleRecordingProxy(
    uploadRequest(new Uint8Array([9, 8, 7, 6])),
    blobEnv,
    failLegacyFetch,
    dependencies,
  );
  assert.equal(upload.status, 201);
  const { token } = await upload.json();

  const poster = new Uint8Array([5, 4, 3]);
  const posterUpload = await handleRecordingProxy(
    posterRequest(token, poster),
    blobEnv,
    failLegacyFetch,
    dependencies,
  );
  assert.equal(posterUpload.status, 201);

  const audioDownload = await handleRecordingProxy(
    new Request(`https://app.example.test/r/audio/${token}`, {
      headers: { range: 'bytes=1-2' },
    }),
    blobEnv,
    failLegacyFetch,
    dependencies,
  );
  assert.equal(audioDownload.status, 206);
  assert.equal(audioDownload.headers.get('content-type'), 'audio/webm');
  assert.equal(audioDownload.headers.get('content-range'), 'bytes 1-2/4');
  assert.deepEqual(new Uint8Array(await audioDownload.arrayBuffer()), new Uint8Array([8, 7]));

  const posterDownload = await handleRecordingProxy(
    new Request(`https://app.example.test/r/poster/${token}`),
    blobEnv,
    failLegacyFetch,
    dependencies,
  );
  assert.equal(posterDownload.status, 200);
  assert.equal(posterDownload.headers.get('content-type'), 'image/webp');
  assert.deepEqual(new Uint8Array(await posterDownload.arrayBuffer()), poster);
});

test('blob poster download keeps MIME atomically beside the poster bytes', async () => {
  const store = new MemoryBlobStore();
  const dependencies = { blobStore: store, now: () => 2_500_000 };
  const blobEnv = { ...env, RECORDINGS_BACKEND: 'blobs' };
  const upload = await handleRecordingProxy(
    uploadRequest(new Uint8Array([1])), blobEnv, fetch, dependencies,
  );
  const { token } = await upload.json();
  await handleRecordingProxy(
    posterRequest(token, new Uint8Array([7, 7]), 'image/webp'),
    blobEnv,
    fetch,
    dependencies,
  );
  const recordingMetadata = store.entries.get(`metadata/${token}`);
  delete recordingMetadata.data.posterMime;

  const download = await handleRecordingProxy(
    new Request(`https://app.example.test/r/poster/${token}`),
    blobEnv,
    fetch,
    dependencies,
  );

  assert.equal(download.status, 200);
  assert.equal(download.headers.get('content-type'), 'image/webp');
});

test('blob backend expires recordings after 24 hours', async () => {
  const store = new MemoryBlobStore();
  let now = 3_000_000;
  const dependencies = { blobStore: store, now: () => now };
  const blobEnv = { ...env, RECORDINGS_BACKEND: 'blobs' };
  const upload = await handleRecordingProxy(
    uploadRequest(new Uint8Array([1, 2, 3])),
    blobEnv,
    async () => new Response('legacy origin called', { status: 503 }),
    dependencies,
  );
  assert.equal(upload.status, 201);
  const { token, expiresAt } = await upload.json();
  now = expiresAt + 1;

  const expired = await handleRecordingProxy(
    new Request(`https://app.example.test/r/audio/${token}`),
    blobEnv,
    async () => new Response('legacy origin called', { status: 503 }),
    dependencies,
  );
  assert.equal(expired.status, 410);
});

test('blob backend assigns unique sequential numbers to concurrent uploads', async () => {
  const store = new MemoryBlobStore();
  const dependencies = { blobStore: store, now: () => 4_000_000 };
  const blobEnv = { ...env, RECORDINGS_BACKEND: 'blobs' };
  const responses = await Promise.all([
    handleRecordingProxy(
      uploadRequest(new Uint8Array([1])), blobEnv, fetch, dependencies,
    ),
    handleRecordingProxy(
      uploadRequest(new Uint8Array([2])), blobEnv, fetch, dependencies,
    ),
  ]);
  const numbers = (await Promise.all(responses.map((item) => item.json())))
    .map((item) => item.checkinNumber)
    .sort((a, b) => a - b);
  assert.deepEqual(numbers, [1, 2]);
});

test('blob backend never recycles a number when metadata stalls past 60 seconds', async () => {
  let releaseMetadata;
  let signalMetadataStarted;
  const metadataStarted = new Promise((resolve) => { signalMetadataStarted = resolve; });
  const metadataGate = new Promise((resolve) => { releaseMetadata = resolve; });
  class PausedMetadataStore extends MemoryBlobStore {
    constructor() {
      super();
      this.pauseOnce = true;
    }

    async setJSON(key, data, options = {}) {
      if (key.startsWith('metadata/') && this.pauseOnce) {
        this.pauseOnce = false;
        signalMetadataStarted();
        await metadataGate;
      }
      return super.setJSON(key, data, options);
    }
  }

  const store = new PausedMetadataStore();
  let now = 4_100_000;
  const dependencies = { blobStore: store, now: () => now };
  const blobEnv = { ...env, RECORDINGS_BACKEND: 'blobs' };
  const firstPromise = handleRecordingProxy(
    uploadRequest(new Uint8Array([1])), blobEnv, fetch, dependencies,
  );
  await metadataStarted;
  now += 61 * 1000;

  const competing = await handleRecordingProxy(
    uploadRequest(new Uint8Array([2])), blobEnv, fetch, dependencies,
  );
  assert.equal(competing.status, 503);

  releaseMetadata();
  const first = await firstPromise;
  assert.equal(first.status, 201);
  assert.equal((await first.json()).checkinNumber, 1);

  const next = await handleRecordingProxy(
    uploadRequest(new Uint8Array([3])), blobEnv, fetch, dependencies,
  );
  assert.equal(next.status, 201);
  assert.equal((await next.json()).checkinNumber, 2);
});

test('blob backend does not consume an activity number when storage fails', async () => {
  class FailOnceStore extends MemoryBlobStore {
    constructor() {
      super();
      this.shouldFail = true;
    }

    async setJSON(key, data, options = {}) {
      if (key.startsWith('metadata/') && this.shouldFail) {
        this.shouldFail = false;
        throw new Error('temporary write failure');
      }
      return super.setJSON(key, data, options);
    }
  }

  const store = new FailOnceStore();
  const blobEnv = { ...env, RECORDINGS_BACKEND: 'blobs' };
  const dependencies = { blobStore: store, now: () => 4_500_000 };
  const failed = await handleRecordingProxy(
    uploadRequest(new Uint8Array([1])), blobEnv, fetch, dependencies,
  );
  assert.equal(failed.status, 503);

  const succeeded = await handleRecordingProxy(
    uploadRequest(new Uint8Array([2])), blobEnv, fetch, dependencies,
  );
  assert.equal(succeeded.status, 201);
  assert.equal((await succeeded.json()).checkinNumber, 1);
});

test('blob cleanup removes unvisited recordings and posters after 24 hours', async () => {
  assert.equal(typeof blobBackend.cleanupExpiredBlobRecordings, 'function');
  const store = new MemoryBlobStore();
  let now = 5_000_000;
  const dependencies = { blobStore: store, now: () => now };
  const blobEnv = { ...env, RECORDINGS_BACKEND: 'blobs' };
  const upload = await handleRecordingProxy(
    uploadRequest(new Uint8Array([3, 2, 1])), blobEnv, fetch, dependencies,
  );
  const { token, expiresAt } = await upload.json();
  await handleRecordingProxy(
    posterRequest(token, new Uint8Array([9, 9])), blobEnv, fetch, dependencies,
  );
  now = expiresAt + 1;
  const orphanAudioToken = 'a'.repeat(32);
  const orphanPosterToken = 'p'.repeat(32);
  await store.set(`audio/${orphanAudioToken}`, new ArrayBuffer(1), {
    metadata: { mime: 'audio/webm', expiresAt: now - 1 },
  });
  await store.set(`poster/${orphanPosterToken}`, new ArrayBuffer(1), {
    metadata: { mime: 'image/webp', expiresAt: now - 1 },
  });
  await store.setJSON(`expiry/${String(now - 1).padStart(16, '0')}/${orphanAudioToken}`, {});
  await store.setJSON(`expiry/${String(now - 1).padStart(16, '0')}/${orphanPosterToken}`, {});

  store.get = async () => {
    throw new Error('cleanup must not fetch every Blob body');
  };
  store.getMetadata = async () => {
    throw new Error('cleanup must not fetch every Blob metadata record');
  };

  const result = await blobBackend.cleanupExpiredBlobRecordings(store, () => now);

  assert.deepEqual(result, { scanned: 3, deleted: 3, limited: false });
  assert.equal(store.entries.has(`audio/${token}`), false);
  assert.equal(store.entries.has(`poster/${token}`), false);
  assert.equal(store.entries.has(`metadata/${token}`), false);
  assert.equal(store.entries.has(`audio/${orphanAudioToken}`), false);
  assert.equal(store.entries.has(`poster/${orphanPosterToken}`), false);
});

test('blob cleanup retains the expiry index when a data delete fails', async () => {
  class FailDeleteOnceStore extends MemoryBlobStore {
    constructor() {
      super();
      this.failed = false;
      this.failKey = '';
    }

    async delete(key) {
      if (key === this.failKey && !this.failed) {
        this.failed = true;
        throw new Error('temporary delete failure');
      }
      return super.delete(key);
    }
  }

  const store = new FailDeleteOnceStore();
  let now = 5_500_000;
  const blobEnv = { ...env, RECORDINGS_BACKEND: 'blobs' };
  const dependencies = { blobStore: store, now: () => now };
  const upload = await handleRecordingProxy(
    uploadRequest(new Uint8Array([4, 5, 6])), blobEnv, fetch, dependencies,
  );
  const { token, expiresAt } = await upload.json();
  const indexKey = `expiry/${String(expiresAt).padStart(16, '0')}/${token}`;
  store.failKey = `audio/${token}`;
  now = expiresAt + 1;

  await assert.rejects(
    blobBackend.cleanupExpiredBlobRecordings(store, () => now),
    /temporary delete failure/,
  );
  assert.equal(store.entries.has(indexKey), true);

  const retry = await blobBackend.cleanupExpiredBlobRecordings(store, () => now);
  assert.deepEqual(retry, { scanned: 1, deleted: 1, limited: false });
  assert.equal(store.entries.has(indexKey), false);
  assert.equal(store.entries.has(`audio/${token}`), false);
});

test('blob backend returns 503 when the activity counter stays contended', async () => {
  class BusyCounterStore extends MemoryBlobStore {
    async setJSON(key, data, options = {}) {
      if (key === '_activity-counter') return { modified: false };
      return super.setJSON(key, data, options);
    }
  }
  const response = await handleRecordingProxy(
    uploadRequest(new Uint8Array([1, 2, 3])),
    { ...env, RECORDINGS_BACKEND: 'blobs' },
    fetch,
    { blobStore: new BusyCounterStore(), now: () => 6_000_000 },
  );
  assert.equal(response.status, 503);
});
