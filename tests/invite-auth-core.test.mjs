import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createAuthToken,
  isInviteCodeAllowed,
  parseCookies,
  verifyAuthToken,
} from '../netlify/invite-auth-core.js';

test('accepts a freshly signed auth token', async () => {
  const token = await createAuthToken({
    secret: 'test-secret',
    now: 1_000,
    ttlSeconds: 60,
  });

  const isValid = await verifyAuthToken({
    token,
    secret: 'test-secret',
    now: 1_000,
  });

  assert.equal(isValid, true);
});

test('rejects expired auth tokens', async () => {
  const token = await createAuthToken({
    secret: 'test-secret',
    now: 1_000,
    ttlSeconds: 60,
  });

  const isValid = await verifyAuthToken({
    token,
    secret: 'test-secret',
    now: 1_061,
  });

  assert.equal(isValid, false);
});

test('rejects tampered auth tokens', async () => {
  const token = await createAuthToken({
    secret: 'test-secret',
    now: 1_000,
    ttlSeconds: 60,
  });

  const tamperedToken = `${token.slice(0, -1)}${token.endsWith('0') ? '1' : '0'}`;
  const isValid = await verifyAuthToken({
    token: tamperedToken,
    secret: 'test-secret',
    now: 1_000,
  });

  assert.equal(isValid, false);
});

test('parses cookies without throwing on empty or encoded values', () => {
  assert.deepEqual(parseCookies(''), {});
  assert.deepEqual(parseCookies('invite=hello%20world; theme=dark'), {
    invite: 'hello world',
    theme: 'dark',
  });
});

test('matches invite codes after trimming and splitting comma-separated values', () => {
  assert.equal(isInviteCodeAllowed(' ARP-2026 ', 'demo,ARP-2026'), true);
  assert.equal(isInviteCodeAllowed('wrong', 'demo,ARP-2026'), false);
});
