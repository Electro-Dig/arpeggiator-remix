import assert from 'node:assert/strict';
import test from 'node:test';

import { KitSwitchGesture } from '../gesture/KitSwitchGesture.js';

test('cycles once only after a held fist opens fully', () => {
  const gesture = new KitSwitchGesture();
  assert.equal(gesture.update({ isFist: true, isOpen: false, now: 0 }).triggered, false);
  assert.equal(gesture.update({ isFist: true, isOpen: false, now: 499 }).armed, false);
  assert.equal(gesture.update({ isFist: true, isOpen: false, now: 500 }).armed, true);
  const result = gesture.update({ isFist: false, isOpen: true, now: 700 });
  assert.equal(result.triggered, true);
  assert.equal(gesture.update({ isFist: false, isOpen: true, now: 701 }).triggered, false);
});

test('expires when the open gesture arrives after 1,200 ms', () => {
  const gesture = new KitSwitchGesture();
  gesture.update({ isFist: true, isOpen: false, now: 0 });
  gesture.update({ isFist: true, isOpen: false, now: 500 });
  assert.equal(gesture.update({ isFist: false, isOpen: true, now: 1701 }).triggered, false);
});

test('does not rearm until the 800 ms cooldown has elapsed', () => {
  const gesture = new KitSwitchGesture();
  gesture.update({ isFist: true, isOpen: false, now: 0 });
  gesture.update({ isFist: true, isOpen: false, now: 500 });
  assert.equal(gesture.update({ isFist: false, isOpen: true, now: 700 }).triggered, true);
  assert.equal(gesture.update({ isFist: true, isOpen: false, now: 1000 }).armed, false);
  assert.equal(gesture.update({ isFist: true, isOpen: false, now: 1499 }).armed, false);
  assert.equal(gesture.update({ isFist: true, isOpen: false, now: 1500 }).armed, false);
  assert.equal(gesture.update({ isFist: true, isOpen: false, now: 2000 }).armed, true);
});

test('suppresses drum gates while a fist is held or the gesture is armed', () => {
  const gesture = new KitSwitchGesture();
  assert.equal(gesture.update({ isFist: true, isOpen: false, now: 0 }).suppressDrums, true);
  assert.equal(gesture.update({ isFist: true, isOpen: false, now: 500 }).suppressDrums, true);
  assert.equal(gesture.update({ isFist: false, isOpen: false, now: 600 }).suppressDrums, true);
  assert.equal(gesture.update({ isFist: false, isOpen: true, now: 700 }).suppressDrums, false);
});
