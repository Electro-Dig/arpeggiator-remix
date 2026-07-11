import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.Netlify = {
  env: {
    get(name) {
      if (name === 'INVITE_CODE') return 'ARP-TEST';
      if (name === 'INVITE_SECRET') return 'test-secret';
      return '';
    },
  },
};

const { default: inviteGate } = await import('../netlify/edge-functions/invite-gate.js');

test('valid invite submission redirects and sets the auth cookie', async () => {
  const request = new Request('https://example.test/__invite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'invite_code=ARP-TEST&redirect=/',
  });

  const response = await inviteGate(request, {
    next: () => new Response('app'),
  });

  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), 'https://example.test/');
  assert.match(response.headers.get('set-cookie'), /arp_invite_auth=/);
});

test('public share routes bypass invite while upload remains protected', async () => {
  const next = () => new Response('public');
  assert.equal((await inviteGate(
    new Request('https://example.test/r/token'),
    { next },
  )).status, 200);
  assert.equal((await inviteGate(
    new Request('https://example.test/r/audio/token'),
    { next },
  )).status, 200);
  assert.equal((await inviteGate(
    new Request('https://example.test/share/qr.js'),
    { next },
  )).status, 200);
  assert.equal((await inviteGate(
    new Request('https://example.test/assets/qr-share-template-bauhaus.webp'),
    { next },
  )).status, 200);
  assert.equal((await inviteGate(
    new Request('https://example.test/recordings-api/upload'),
    { next },
  )).status, 303);
});
