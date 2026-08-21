const TTL_MS = 24 * 60 * 60 * 1000;
const COUNTER_KEY = '_activity-counter';
// Keep the lease well beyond Netlify's synchronous invocation window so a
// second request cannot recycle a number while the first Blob PUT is settling.
const COUNTER_RESERVATION_MS = 5 * 60 * 1000;
const CLEANUP_BATCH_SIZE = 25;
const DEFAULT_CLEANUP_LIMIT = 100;

const audioKey = (token) => `audio/${token}`;
const metadataKey = (token) => `metadata/${token}`;
const posterKey = (token) => `poster/${token}`;
const expiryKey = (expiresAt, token) => (
  `expiry/${String(expiresAt).padStart(16, '0')}/${token}`
);

function exactArrayBuffer(bytes) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function response(body, status, headers = {}) {
  return new Response(body, {
    status,
    headers: {
      'cache-control': status >= 400 ? 'no-store' : 'private, max-age=300',
      'x-content-type-options': 'nosniff',
      ...headers,
    },
  });
}

async function removeRecording(store, token, expiresAt) {
  await Promise.all([
    store.delete(audioKey(token)),
    store.delete(metadataKey(token)),
    store.delete(posterKey(token)),
  ]);
  // The expiry entry is the retry queue. Remove it only after every data Blob
  // has been deleted successfully, otherwise the next scheduled run must retry.
  if (Number.isFinite(expiresAt)) await store.delete(expiryKey(expiresAt, token));
}

async function getLiveMetadata(store, token, now) {
  const metadata = await store.get(metadataKey(token), { type: 'json' });
  if (!metadata) return { error: response('Not found', 404) };
  if (!Number.isFinite(metadata.expiresAt) || metadata.expiresAt <= now()) {
    await removeRecording(store, token, metadata.expiresAt);
    return { error: response('Expired', 410) };
  }
  return { metadata };
}

async function reserveCheckinNumber(store, token, now) {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const current = await store.getWithMetadata(COUNTER_KEY, { type: 'json' });
    const previous = Number.isSafeInteger(current?.data?.value) && current.data.value >= 0
      ? current.data.value
      : 0;
    const activeReservation = current?.data?.reservation;
    if (activeReservation) {
      if (Number(activeReservation.expiresAt) <= now()) {
        const pending = await store.get(metadataKey(activeReservation.token), { type: 'json' });
        const committed = pending?.checkinNumber === activeReservation.value;
        await store.setJSON(COUNTER_KEY, {
          value: committed ? activeReservation.value : previous,
          updatedAt: now(),
        }, { onlyIfMatch: current.etag });
        continue;
      }
      await new Promise((resolve) => setTimeout(resolve, Math.min(5 * (attempt + 1), 50)));
      continue;
    }
    const value = previous + 1;
    const result = await store.setJSON(
      COUNTER_KEY,
      {
        value: previous,
        reservation: {
          token,
          value,
          expiresAt: now() + COUNTER_RESERVATION_MS,
        },
        updatedAt: now(),
      },
      current?.etag ? { onlyIfMatch: current.etag } : { onlyIfNew: true },
    );
    if (result.modified) {
      return { token, value, previous, etag: result.etag };
    }
    await new Promise((resolve) => setTimeout(resolve, Math.min(5 * (attempt + 1), 50)));
  }
  throw Object.assign(new Error('Counter is busy'), { status: 503 });
}

async function releaseCheckinReservation(store, reservation, now) {
  await store.setJSON(COUNTER_KEY, {
    value: reservation.previous,
    updatedAt: now(),
  }, { onlyIfMatch: reservation.etag });
}

async function finalizeCheckinReservation(store, reservation, now) {
  let etag = reservation.etag;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const result = await store.setJSON(COUNTER_KEY, {
        value: reservation.value,
        updatedAt: now(),
      }, { onlyIfMatch: etag });
      if (result.modified) return;
    } catch {
      // Verify whether the write landed before treating a transport error as a
      // failed commit.
    }
    const current = await store.getWithMetadata(COUNTER_KEY, { type: 'json' });
    if (!current?.data?.reservation && current?.data?.value >= reservation.value) return;
    if (
      current?.data?.reservation?.token !== reservation.token
      || current.data.reservation.value !== reservation.value
    ) break;
    etag = current.etag;
  }
  throw Object.assign(new Error('Counter finalization conflict'), { status: 503 });
}

function parseRange(value, size) {
  if (!value) return null;
  const match = String(value).match(/^bytes=(\d*)-(\d*)$/);
  if (!match || (!match[1] && !match[2])) return { error: true };

  let start;
  let end;
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return { error: true };
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
    if (
      !Number.isSafeInteger(start)
      || !Number.isSafeInteger(end)
      || start >= size
      || end < start
    ) return { error: true };
    end = Math.min(end, size - 1);
  }
  return { start, end };
}

export async function handleBlobRecordingRequest({
  request,
  store,
  now = Date.now,
  body,
  mime,
  isAudioUpload,
  posterUploadToken,
  audioDownloadToken,
  posterDownloadToken,
}) {
  if (isAudioUpload) {
    const token = crypto.randomUUID().replaceAll('-', '');
    const expiresAt = now() + TTL_MS;
    let reservation;
    try {
      await store.set(audioKey(token), exactArrayBuffer(body), {
        metadata: { mime, expiresAt },
      });
      await store.setJSON(expiryKey(expiresAt, token), { token, expiresAt });
      reservation = await reserveCheckinNumber(store, token, now);
      const metadata = {
        token,
        mime,
        expiresAt,
        checkinNumber: reservation.value,
      };
      await store.setJSON(metadataKey(token), metadata);
      await finalizeCheckinReservation(store, reservation, now);
      return Response.json(metadata, {
        status: 201,
        headers: { 'cache-control': 'no-store' },
      });
    } catch (error) {
      if (reservation) {
        await releaseCheckinReservation(store, reservation, now).catch(() => {});
      }
      await removeRecording(store, token, expiresAt);
      throw error;
    }
  }

  if (posterUploadToken) {
    const live = await getLiveMetadata(store, posterUploadToken, now);
    if (live.error) return live.error;
    await store.set(posterKey(posterUploadToken), exactArrayBuffer(body), {
      metadata: { mime, expiresAt: live.metadata.expiresAt },
    });
    return Response.json({
      token: posterUploadToken,
      expiresAt: live.metadata.expiresAt,
      mime,
    }, {
      status: 201,
      headers: { 'cache-control': 'no-store' },
    });
  }

  const token = audioDownloadToken || posterDownloadToken;
  const live = await getLiveMetadata(store, token, now);
  if (live.error) return live.error;
  const isAudio = Boolean(audioDownloadToken);
  const stored = isAudio
    ? await store.get(audioKey(token), { type: 'arrayBuffer' })
    : await store.getWithMetadata(posterKey(token), { type: 'arrayBuffer' });
  if (!stored) return response('Not found', 404);

  const bytes = new Uint8Array(isAudio ? stored : stored.data);
  const posterMime = isAudio ? '' : stored.metadata?.mime;
  if (!isAudio && !posterMime) return response('Not found', 404);
  const headers = {
    'content-type': isAudio ? live.metadata.mime : posterMime,
    'x-recording-expires-at': String(live.metadata.expiresAt),
  };
  if (!isAudio) {
    headers['content-length'] = String(bytes.byteLength);
    return response(bytes, 200, headers);
  }

  headers['accept-ranges'] = 'bytes';
  headers['x-recording-checkin-number'] = String(live.metadata.checkinNumber);
  const range = parseRange(request.headers.get('range'), bytes.byteLength);
  if (range?.error) {
    return response('Unsatisfiable range', 416, {
      ...headers,
      'content-range': `bytes */${bytes.byteLength}`,
    });
  }
  if (range) {
    const ranged = bytes.slice(range.start, range.end + 1);
    return response(ranged, 206, {
      ...headers,
      'content-length': String(ranged.byteLength),
      'content-range': `bytes ${range.start}-${range.end}/${bytes.byteLength}`,
    });
  }
  return response(bytes, 200, {
    ...headers,
    'content-length': String(bytes.byteLength),
  });
}

export async function cleanupExpiredBlobRecordings(
  store,
  now = Date.now,
  { maxDeletes = DEFAULT_CLEANUP_LIMIT } = {},
) {
  let scanned = 0;
  let deleted = 0;
  let limited = false;
  const cutoff = now();
  for await (const page of store.list({ prefix: 'expiry/', paginate: true })) {
    const expired = [];
    for (const blob of page.blobs) {
      scanned += 1;
      const match = blob.key.match(/^expiry\/(\d{16})\/([A-Za-z0-9_-]{32,128})$/);
      if (!match || Number(match[1]) > cutoff) continue;
      if (deleted + expired.length >= maxDeletes) {
        limited = true;
        break;
      }
      expired.push({ key: blob.key, expiresAt: Number(match[1]), token: match[2] });
    }
    for (let index = 0; index < expired.length; index += CLEANUP_BATCH_SIZE) {
      const batch = expired.slice(index, index + CLEANUP_BATCH_SIZE);
      await Promise.all(batch.map(({ expiresAt, token }) => (
        removeRecording(store, token, expiresAt)
      )));
      deleted += batch.length;
    }
    if (limited) break;
    if (deleted >= maxDeletes) {
      limited = true;
      break;
    }
  }
  return { scanned, deleted, limited };
}
