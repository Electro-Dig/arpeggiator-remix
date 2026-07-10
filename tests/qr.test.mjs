import assert from 'node:assert/strict';
import test from 'node:test';

import { renderQr } from '../share/qr.js';

test('loads and renders the QR implementation only when called', async () => {
  const canvas = { id: 'qr' };
  let loadCalls = 0;
  let rendered;
  const loadQr = async () => {
    loadCalls += 1;
    return {
      toCanvas: async (...args) => { rendered = args; },
    };
  };

  assert.equal(loadCalls, 0);
  await renderQr(canvas, 'https://app.example.test/r/token', loadQr);
  assert.equal(loadCalls, 1);
  assert.equal(rendered[0], canvas);
  assert.equal(rendered[1], 'https://app.example.test/r/token');
  assert.equal(rendered[2].width, 280);
});
