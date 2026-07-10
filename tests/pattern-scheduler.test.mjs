import assert from 'node:assert/strict';
import test from 'node:test';

import { PatternScheduler } from '../rhythm/PatternScheduler.js';

test('pending pattern applies only on step zero', () => {
  const scheduler = new PatternScheduler('A');
  scheduler.queue('B');
  assert.equal(scheduler.onStep(15), 'A');
  assert.equal(scheduler.onStep(0), 'B');
});

test('the newest queued pattern wins before the next bar', () => {
  const scheduler = new PatternScheduler('A');
  scheduler.queue('B');
  scheduler.queue('C');
  assert.equal(scheduler.onStep(8), 'A');
  assert.equal(scheduler.onStep(0), 'C');
  assert.equal(scheduler.pending, null);
});
