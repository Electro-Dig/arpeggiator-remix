const encoder = new TextEncoder();

const hex = (bytes) => [...new Uint8Array(bytes)]
  .map((byte) => byte.toString(16).padStart(2, '0'))
  .join('');

async function sha256(body) {
  return hex(await crypto.subtle.digest('SHA-256', body));
}

async function canonical({ timestamp, method, path, body }) {
  return `${timestamp}\n${method.toUpperCase()}\n${path}\n${await sha256(body)}`;
}

export async function signRecordingRequest(input) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(input.secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return hex(await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(await canonical(input)),
  ));
}

export async function verifyRecordingRequest({ signature, nowSeconds, ...input }) {
  const timestamp = Number(input.timestamp);
  if (!Number.isFinite(timestamp) || Math.abs(timestamp - nowSeconds) > 60) return false;

  const expected = await signRecordingRequest(input);
  const received = String(signature || '');
  if (expected.length !== received.length) return false;

  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ received.charCodeAt(index);
  }
  return mismatch === 0;
}
