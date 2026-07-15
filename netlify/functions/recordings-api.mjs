import { signRecordingRequest } from '../recording-signature.js';

const MAX_AUDIO_BYTES = 5 * 1024 * 1024;
const MAX_POSTER_BYTES = 2 * 1024 * 1024;
const AUDIO_TYPES = new Set(['audio/mp4', 'audio/webm', 'audio/ogg']);
const POSTER_TYPES = new Set(['image/webp', 'image/jpeg']);
const TOKEN = /^[A-Za-z0-9_-]{32,128}$/;

function tokenAfter(pathname, prefix) {
  return pathname.startsWith(prefix) ? pathname.slice(prefix.length) : '';
}

export async function handleRecordingProxy(request, env, fetchImpl = fetch) {
  const url = new URL(request.url);
  const isAudioUpload = url.pathname === '/recordings-api/upload' && request.method === 'POST';
  const posterUploadToken = request.method === 'POST'
    ? tokenAfter(url.pathname, '/recordings-api/poster/')
    : '';
  const audioDownloadToken = request.method === 'GET'
    ? tokenAfter(url.pathname, '/r/audio/')
    : '';
  const posterDownloadToken = request.method === 'GET'
    ? tokenAfter(url.pathname, '/r/poster/')
    : '';
  const isPosterUpload = TOKEN.test(posterUploadToken);
  const isAudioDownload = TOKEN.test(audioDownloadToken);
  const isPosterDownload = TOKEN.test(posterDownloadToken);
  const isBodyUpload = isAudioUpload || isPosterUpload;
  const hasRecognizedPath = isAudioUpload || isPosterUpload || isAudioDownload || isPosterDownload;
  if (!hasRecognizedPath) return new Response('Bad request', { status: 400 });

  const body = isBodyUpload
    ? new Uint8Array(await request.arrayBuffer())
    : new Uint8Array();
  const mime = (request.headers.get('content-type') || '')
    .split(';')[0]
    .toLowerCase();
  const maxBytes = isPosterUpload ? MAX_POSTER_BYTES : MAX_AUDIO_BYTES;
  if (isBodyUpload && body.byteLength > maxBytes) {
    return new Response(isPosterUpload ? 'Poster too large' : 'Recording too large', { status: 413 });
  }
  if (isBodyUpload && body.byteLength === 0) {
    return new Response(isPosterUpload ? 'Empty poster' : 'Empty recording', { status: 400 });
  }
  if (isAudioUpload && !AUDIO_TYPES.has(mime)) {
    return new Response('Unsupported recording type', { status: 415 });
  }
  if (isPosterUpload && !POSTER_TYPES.has(mime)) {
    return new Response('Unsupported poster type', { status: 415 });
  }

  const upstreamPath = isAudioUpload
    ? '/v1/recordings'
    : isPosterUpload
      ? `/v1/recordings/${posterUploadToken}/poster`
      : isAudioDownload
        ? `/v1/recordings/${audioDownloadToken}`
        : `/v1/recordings/${posterDownloadToken}/poster`;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = await signRecordingRequest({
    secret: env.RECORDINGS_PROXY_SECRET,
    timestamp,
    method: request.method,
    path: upstreamPath,
    body,
  });
  const upstreamHeaders = {
    'content-type': isBodyUpload ? mime : 'application/octet-stream',
    'content-length': String(body.byteLength),
    'x-arp-timestamp': timestamp,
    'x-arp-signature': signature,
  };
  const range = request.headers.get('range');
  if (isAudioDownload && range) upstreamHeaders.range = range;

  const upstream = await fetchImpl(`${env.RECORDINGS_ORIGIN}${upstreamPath}`, {
    method: request.method,
    headers: upstreamHeaders,
    body: isBodyUpload ? body : undefined,
  });

  const responseHeaders = {
    'content-type': upstream.headers.get('content-type') || 'application/octet-stream',
    'cache-control': isBodyUpload ? 'no-store' : 'private, max-age=300',
    'x-content-type-options': 'nosniff',
  };
  const expiresAt = upstream.headers.get('x-recording-expires-at');
  if (!isBodyUpload && expiresAt) responseHeaders['x-recording-expires-at'] = expiresAt;
  if (isAudioDownload) {
    for (const header of [
      'accept-ranges',
      'content-range',
      'content-length',
      'x-recording-checkin-number',
    ]) {
      const value = upstream.headers.get(header);
      if (value) responseHeaders[header] = value;
    }
  } else if (isPosterDownload) {
    const contentLength = upstream.headers.get('content-length');
    if (contentLength) responseHeaders['content-length'] = contentLength;
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
