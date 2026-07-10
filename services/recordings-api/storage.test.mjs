import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  MAX_BYTES,
  RecordingStore,
  TTL_MS,
} from './storage.mjs';

async function withStore(run) {
  const root = await mkdtemp(join(tmpdir(), 'arpeggiator-recordings-'));
  try {
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('writes accepted audio and metadata with a 192-bit token', async () => {
  await withStore(async (root) => {
    const store = new RecordingStore(root, () => 1_000);
    await store.init();
    const result = await store.put(new Uint8Array([1, 2, 3]), 'audio/webm');
    assert.match(result.token, /^[A-Za-z0-9_-]{32}$/);
    assert.equal(result.expiresAt, 1_000 + TTL_MS);

    const meta = JSON.parse(await readFile(join(root, `${result.token}.json`), 'utf8'));
    assert.equal(meta.mime, 'audio/webm');
    assert.deepEqual(
      new Uint8Array(await readFile(join(root, `${result.token}.webm`))),
      new Uint8Array([1, 2, 3]),
    );
  });
});

test('rejects empty files, invalid MIME and files over five megabytes', async () => {
  await withStore(async (root) => {
    const store = new RecordingStore(root);
    await store.init();
    await assert.rejects(
      store.put(new Uint8Array(), 'audio/webm'),
      (error) => error.status === 400,
    );
    await assert.rejects(
      store.put(new Uint8Array([1]), 'audio/wav'),
      (error) => error.status === 415,
    );
    await assert.rejects(
      store.put(new Uint8Array(MAX_BYTES + 1), 'audio/mp4'),
      (error) => error.status === 413,
    );
  });
});

test('returns 404 for unknown tokens and rejects path traversal', async () => {
  await withStore(async (root) => {
    const store = new RecordingStore(root);
    await store.init();
    await assert.rejects(
      store.get('a'.repeat(32)),
      (error) => error.status === 404,
    );
    await assert.rejects(
      store.get('../outside'),
      (error) => error.status === 400,
    );
  });
});

test('expired reads delete both audio and metadata before returning 410', async () => {
  await withStore(async (root) => {
    let now = 10_000;
    const store = new RecordingStore(root, () => now);
    await store.init();
    const { token } = await store.put(new Uint8Array([4, 5]), 'audio/ogg');
    now += TTL_MS + 1;

    await assert.rejects(store.get(token), (error) => error.status === 410);
    await assert.rejects(access(join(root, `${token}.ogg`)));
    await assert.rejects(access(join(root, `${token}.json`)));
  });
});

test('cleanup removes expired entries and leaves live entries', async () => {
  await withStore(async (root) => {
    let now = 20_000;
    const store = new RecordingStore(root, () => now);
    await store.init();
    const expired = await store.put(new Uint8Array([1]), 'audio/mp4');
    now += TTL_MS + 1;
    const live = await store.put(new Uint8Array([2]), 'audio/mp4');

    await store.cleanup();
    await assert.rejects(store.get(expired.token), (error) => error.status === 404);
    assert.deepEqual(new Uint8Array((await store.get(live.token)).body), new Uint8Array([2]));
  });
});
