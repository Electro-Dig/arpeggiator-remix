import assert from 'node:assert/strict';
import test from 'node:test';

import {
  actionForThumbIntent,
  initialRecordingState,
  reduceRecording,
} from '../recording/recording-state.js';

const step = (state, type, extra = {}) => reduceRecording(state, { type, ...extra });

test('happy path reaches review and upload', () => {
  let state = initialRecordingState();
  state = step(state, 'START_REQUEST');
  assert.equal(state.phase, 'countdown');
  state = step(state, 'COUNTDOWN_DONE');
  assert.equal(state.phase, 'recording');
  state = step(state, 'STOP_REQUEST');
  assert.equal(state.phase, 'stopping');
  state = step(state, 'RECORDER_STOPPED');
  assert.equal(state.phase, 'review');
  state = step(state, 'UPLOAD_REQUEST');
  assert.equal(state.phase, 'uploading');
  state = step(state, 'UPLOAD_SUCCEEDED');
  assert.equal(state.phase, 'shared');
});

test('cancel and rerecord return to a safe idle or countdown path', () => {
  const countdown = step(initialRecordingState(), 'START_REQUEST');
  assert.equal(step(countdown, 'CANCEL_REQUEST').phase, 'idle');
  assert.equal(step(countdown, 'CANCEL_TO_REVIEW').phase, 'review');

  const review = { phase: 'review', error: '', pendingRerecord: false };
  assert.equal(step(review, 'RERECORD_REQUEST').phase, 'countdown');

  const stopping = step(
    { phase: 'recording', error: '', pendingRerecord: false },
    'RERECORD_REQUEST',
  );
  assert.equal(stopping.pendingRerecord, true);
  assert.equal(step(stopping, 'RECORDER_STOPPED').phase, 'countdown');

  const canceling = step(
    { phase: 'recording', error: '', pendingRerecord: false },
    'CANCEL_REQUEST',
  );
  assert.equal(canceling.phase, 'stopping');
  assert.equal(step(canceling, 'RECORDER_CANCELLED').phase, 'idle');
});

test('upload failure returns to review with an actionable error', () => {
  const state = step(
    { phase: 'uploading', error: '', pendingRerecord: false },
    'UPLOAD_FAILED',
    { error: '网络暂时不可用' },
  );
  assert.deepEqual(state, {
    phase: 'review',
    error: '网络暂时不可用',
    pendingRerecord: false,
  });
});

test('an empty recorder result returns to review instead of exposing a broken file', () => {
  const state = step(
    { phase: 'stopping', error: '', pendingRerecord: false },
    'RECORDER_EMPTY',
    { error: '未捕获到内部声音' },
  );
  assert.equal(state.phase, 'review');
  assert.equal(state.error, '未捕获到内部声音');
});

test('invalid events preserve object identity', () => {
  const idle = initialRecordingState();
  assert.strictEqual(step(idle, 'UPLOAD_REQUEST'), idle);
});

test('approved two-thumb intents map only in actionable phases', () => {
  assert.equal(actionForThumbIntent('idle', 'both-up'), 'START_REQUEST');
  assert.equal(actionForThumbIntent('countdown', 'both-down'), 'CANCEL_REQUEST');
  assert.equal(actionForThumbIntent('recording', 'both-up'), 'STOP_REQUEST');
  assert.equal(actionForThumbIntent('recording', 'both-down'), 'CANCEL_REQUEST');
  assert.equal(actionForThumbIntent('review', 'both-up'), 'UPLOAD_REQUEST');
  assert.equal(actionForThumbIntent('review', 'both-down'), 'DISCARD_REQUEST');
  assert.equal(actionForThumbIntent('uploading', 'both-up'), null);
  assert.equal(actionForThumbIntent('shared', 'both-down'), null);
  assert.equal(actionForThumbIntent('idle', 'neutral'), null);
});
