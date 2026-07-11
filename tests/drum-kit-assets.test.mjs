import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

const kits = ['acoustic', 'electronic', 'synthwave'];
const drums = ['kick', 'snare', 'hihat', 'openhat', 'clap'];

test('ships five valid local WAV files for every drum kit under three megabytes total', async () => {
  let total = 0;
  for (const kit of kits) {
    for (const drum of drums) {
      const url = new URL(`../assets/drums/${kit}/${drum}.wav`, import.meta.url);
      const [header, info] = await Promise.all([readFile(url), stat(url)]);
      assert.equal(header.subarray(0, 4).toString(), 'RIFF');
      assert.equal(header.subarray(8, 12).toString(), 'WAVE');
      assert.ok(info.size > 1_000);
      total += info.size;
    }
  }
  assert.ok(total <= 3 * 1024 * 1024, `drum payload was ${total} bytes`);
});
