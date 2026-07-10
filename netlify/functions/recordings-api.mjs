import { signRecordingRequest } from '../recording-signature.js';

const MAX_BYTES = 5 * 1024 * 1024;
const AUDIO_TYPES = new Set(['audio/mp4', 'audio/webm', 'audio/ogg']);
const TOKEN = /^[A-Za-z0-9_-]{32,128}$/;

export async function handleRecordingProxy(request, env, fetchImpl = fetch) {
  const url = new URL(request.url);
  const isUpload = url.pathname === '/recordings-api/upload' && request.method === 'POST';
  const token = url.pathname.startsWith('/r/audio/')
    ? url.pathname.slice('/r/audio/'.length)
    : '';
  if (!isUpload && !TOKEN.test(token)) {
    return new Response('Bad request', { status: 400 });
  }

  const body = isUpload
    ? new Uint8Array(await request.arrayBuffer())
    : new Uint8Array();
  const mime = (request.headers.get('content-type') || '')
    .split(';')[0]
    .toLowerCase();
  if (isUpload && body.byteLength > MAX_BYTES) {
    return new Response('Recording too large', { status: 413 });
  }
  if (isUpload && body.byteLength === 0) {
    return new Response('Empty recording', { status: 400 });
  }
  if (isUpload && !AUDIO_TYPES.has(mime)) {
    return new Response('Unsupported recording type', { status: 415 });
  }

  const upstreamPath = isUpload
    ? '/v1/recordings'
    : `/v1/recordings/${token}`;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = await signRecordingRequest({
    secret: env.RECORDINGS_PROXY_SECRET,
    timestamp,
    method: request.method,
    path: upstreamPath,
    body,
  });
  const upstreamHeaders = {
    'content-type': isUpload ? mime : 'application/octet-stream',
    'content-length': String(body.byteLength),
    'x-arp-timestamp': timestamp,
    'x-arp-signature': signature,
  };
  const range = request.headers.get('range');
  if (!isUpload && range) upstreamHeaders.range = range;

  const upstream = await fetchImpl(`${env.RECORDINGS_ORIGIN}${upstreamPath}`, {
    method: request.method,
    headers: upstreamHeaders,
    body: isUpload ? body : undefined,
  });

  const responseHeaders = {
    'content-type': upstream.headers.get('content-type') || 'application/octet-stream',
    'cache-control': isUpload ? 'no-store' : 'private, max-age=300',
    'x-content-type-options': 'nosniff',
  };
  const expiresAt = upstream.headers.get('x-recording-expires-at');
  if (!isUpload && expiresAt) {
    responseHeaders['x-recording-expires-at'] = expiresAt;
  }
  if (!isUpload) {
    for (const header of ['accept-ranges', 'content-range', 'content-length']) {
      const value = upstream.headers.get(header);
      if (value) responseHeaders[header] = value;
    }
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export default (request) => handleRecordingProxy(request, {
  RECORDINGS_ORIGIN: Netlify.env.get('RECORDINGS_ORIGIN'),
  RECORDINGS_PROXY_SECRET: Netlify.env.get('RECORDINGS_PROXY_SECRET'),
});
