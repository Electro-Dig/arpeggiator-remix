const encoder = new TextEncoder();

export const AUTH_COOKIE_NAME = 'arp_invite_auth';
export const DEFAULT_TTL_SECONDS = 60 * 60 * 12;

export function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex === -1) return cookies;

      const name = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();
      if (!name) return cookies;

      cookies[name] = safeDecode(value);
      return cookies;
    }, {});
}

export function isInviteCodeAllowed(inputCode, rawAllowedCodes) {
  const normalizedInput = String(inputCode || '').trim();
  if (!normalizedInput) return false;

  return normalizeInviteCodes(rawAllowedCodes).some((allowedCode) => {
    return timingSafeEqual(allowedCode, normalizedInput);
  });
}

export async function createAuthToken({
  secret,
  now = Math.floor(Date.now() / 1000),
  ttlSeconds = DEFAULT_TTL_SECONDS,
}) {
  if (!secret) {
    throw new Error('Missing invite auth secret');
  }

  const expiresAt = Math.floor(now + ttlSeconds);
  const payload = String(expiresAt);
  const signature = await hmacHex(secret, payload);

  return `${payload}.${signature}`;
}

export async function verifyAuthToken({
  token,
  secret,
  now = Math.floor(Date.now() / 1000),
}) {
  if (!token || !secret) return false;

  const [expiresAtText, signature] = String(token).split('.');
  const expiresAt = Number.parseInt(expiresAtText, 10);

  if (!Number.isFinite(expiresAt) || expiresAt < now) return false;
  if (!/^[a-f0-9]{64}$/i.test(signature || '')) return false;

  const expectedSignature = await hmacHex(secret, expiresAtText);
  return timingSafeEqual(expectedSignature, signature.toLowerCase());
}

function normalizeInviteCodes(rawAllowedCodes) {
  return String(rawAllowedCodes || '')
    .split(/[,\n]/)
    .map((code) => code.trim())
    .filter(Boolean);
}

async function hmacHex(secret, payload) {
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await globalThis.crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload),
  );

  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function timingSafeEqual(left, right) {
  const leftValue = String(left);
  const rightValue = String(right);
  if (leftValue.length !== rightValue.length) return false;

  let result = 0;
  for (let index = 0; index < leftValue.length; index += 1) {
    result |= leftValue.charCodeAt(index) ^ rightValue.charCodeAt(index);
  }

  return result === 0;
}
