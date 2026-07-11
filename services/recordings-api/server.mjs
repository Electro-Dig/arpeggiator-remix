import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { verifyRecordingRequest } from '../../netlify/recording-signature.js';
import { MAX_BYTES, RecordingStore } from './storage.mjs';

const TOKEN_ROUTE = /^\/v1\/recordings\/([A-Za-z0-9_-]{32,128})$/;

function httpError(message, status) {
  return Object.assign(new Error(message), { status });
}

function parseByteRange(value, size) {
  if (!value) return null;
  const match = String(value).match(/^bytes=(\d*)-(\d*)$/);
  if (!match || (!match[1] && !match[2])) {
    throw Object.assign(httpError('Unsatisfiable range', 416), { size });
  }

  let start;
  let end;
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) {
      throw Object.assign(httpError('Unsatisfiable range', 416), { size });
    }
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
    ) {
      throw Object.assign(httpError('Unsatisfiable range', 416), { size });
    }
    end = Math.min(end, size - 1);
  }

  return { start, end };
}

async function readBody(request, maxBytes) {
  const declaredLength = Number(request.headers['content-length']);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    request.resume();
    throw httpError('Too large', 413);
  }

  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > maxBytes) {
      request.resume();
      throw httpError('Too large', 413);
    }
    chunks.push(chunk);
  }
  return new Uint8Array(Buffer.concat(chunks, total));
}

function sendJson(response, status, value, headers = {}) {
  const body = Buffer.from(JSON.stringify(value));
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(body.length),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    ...headers,
  });
  response.end(body);
}

function sendError(response, error) {
  const status = [400, 401, 404, 410, 413, 415, 416].includes(error.status)
    ? error.status
    : 500;
  const messages = {
    400: 'Bad request',
    401: 'Unauthorized',
    404: 'Not found',
    410: 'Expired',
    413: 'Recording too large',
    415: 'Unsupported recording type',
    416: 'Unsatisfiable range',
    500: 'Internal server error',
  };
  const headers = status === 416 && Number.isSafeInteger(error.size)
    ? { 'content-range': `bytes */${error.size}` }
    : {};
  sendJson(response, status, { error: messages[status] }, headers);
}

function matchesAdminSecret(value, expected) {
  const actualBuffer = Buffer.from(String(value || ''));
  const expectedBuffer = Buffer.from(String(expected || ''));
  return expectedBuffer.length >= 32
    && actualBuffer.length === expectedBuffer.length
    && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function createRecordingServer({
  store,
  secret,
  adminSecret = '',
  nowSeconds = () => Math.floor(Date.now() / 1000),
}) {
  return createServer(async (request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    const path = url.pathname;

    if (request.method === 'GET' && path === '/health') {
      sendJson(response, 200, { ok: true });
      return;
    }

    const isCounterReset = request.method === 'POST'
      && path === '/v1/admin/counter/reset';
    const tokenMatch = request.method === 'GET' ? path.match(TOKEN_ROUTE) : null;
    const isUpload = request.method === 'POST' && path === '/v1/recordings';
    if (!isUpload && !tokenMatch && !isCounterReset) {
      sendJson(response, 404, { error: 'Not found' });
      return;
    }

    try {
      if (isCounterReset) {
        if (!matchesAdminSecret(request.headers['x-recordings-admin-key'], adminSecret)) {
          throw httpError('Unauthorized', 401);
        }
        const body = await readBody(request, 1024);
        let payload;
        try {
          payload = JSON.parse(Buffer.from(body).toString('utf8'));
        } catch {
          throw httpError('Bad request', 400);
        }
        if (!Number.isSafeInteger(payload?.value) || payload.value < 0) {
          throw httpError('Bad request', 400);
        }
        sendJson(response, 200, await store.resetCounter(payload.value));
        return;
      }

      const body = isUpload
        ? await readBody(request, MAX_BYTES)
        : new Uint8Array();
      const authorized = await verifyRecordingRequest({
        secret,
        timestamp: request.headers['x-arp-timestamp'],
        method: request.method,
        path,
        body,
        signature: request.headers['x-arp-signature'],
        nowSeconds: nowSeconds(),
      });
      if (!authorized) throw httpError('Unauthorized', 401);

      if (isUpload) {
        const mime = String(request.headers['content-type'] || '')
          .split(';')[0]
          .toLowerCase();
        const result = await store.put(body, mime);
        sendJson(response, 201, result);
        return;
      }

      const recording = await store.get(tokenMatch[1]);
      const range = parseByteRange(request.headers.range, recording.body.length);
      const responseBody = range
        ? recording.body.subarray(range.start, range.end + 1)
        : recording.body;
      response.writeHead(range ? 206 : 200, {
        'content-type': recording.mime,
        'content-length': String(responseBody.length),
        'cache-control': 'private, max-age=300',
        'x-content-type-options': 'nosniff',
        'x-recording-expires-at': String(recording.expiresAt),
        ...(Number.isSafeInteger(recording.checkinNumber) ? {
          'x-recording-checkin-number': String(recording.checkinNumber),
        } : {}),
        'accept-ranges': 'bytes',
        ...(range ? {
          'content-range': `bytes ${range.start}-${range.end}/${recording.body.length}`,
        } : {}),
      });
      response.end(responseBody);
    } catch (error) {
      sendError(response, error);
    }
  });
}

async function main() {
  const root = process.env.RECORDINGS_DATA_DIR;
  if (!root) throw new Error('RECORDINGS_DATA_DIR is required');
  const store = new RecordingStore(root);
  await store.init();

  if (process.argv.includes('--cleanup')) {
    await store.cleanup();
    return;
  }

  const secret = process.env.RECORDINGS_PROXY_SECRET || '';
  if (secret.length < 32) throw new Error('RECORDINGS_PROXY_SECRET must contain at least 32 characters');
  const adminSecret = process.env.RECORDINGS_ADMIN_SECRET || '';
  if (adminSecret.length < 32) throw new Error('RECORDINGS_ADMIN_SECRET must contain at least 32 characters');
  const server = createRecordingServer({ store, secret, adminSecret });
  server.listen(8787, '127.0.0.1', () => {
    console.log('Recording API listening on http://127.0.0.1:8787');
  });
}

const isEntrypoint = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isEntrypoint) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
