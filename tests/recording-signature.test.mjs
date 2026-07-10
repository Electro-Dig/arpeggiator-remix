import assert from 'node:assert/strict';
import test from 'node:test';

import {
  signRecordingRequest,
  verifyRecordingRequest,
} from '../netlify/recording-signature.js';

test('verifies an untampered request inside the clock window', async () => {
  const input = {
    secret: 'secret',
    timestamp: '1000',
    method: 'POST',
    path: '/v1/recordings',
    body: new TextEncoder().encode('audio'),
  };
  const signature = await signRecordingRequest(input);
  assert.equal(await verifyRecordingRequest({
    ...input,
    signature,
    nowSeconds: 1005,
  }), true);
});

test('rejects body tampering and timestamps older than 60 seconds', async () => {
  const base = {
    secret: 'secret',
    timestamp: '1000',
    method: 'POST',
    path: '/v1/recordings',
    body: new TextEncoder().encode('audio'),
  };
  const signature = await signRecordingRequest(base);
  assert.equal(await verifyRecordingRequest({
    ...base,
    body: new TextEncoder().encode('changed'),
    signature,
    nowSeconds: 1005,
  }), false);
  assert.equal(await verifyRecordingRequest({
    ...base,
    signature,
    nowSeconds: 1061,
  }), false);
  assert.equal(await verifyRecordingRequest({
    ...base,
    timestamp: 'not-a-number',
    signature,
    nowSeconds: 1005,
  }), false);
  assert.equal(await verifyRecordingRequest({
    ...base,
    signature,
    nowSeconds: 939,
  }), false);
});
