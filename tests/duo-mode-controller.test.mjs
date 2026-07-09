import assert from 'node:assert/strict';
import test from 'node:test';

import { DuoModeController } from '../duo/DuoModeController.js';

function hand(id, x, y = 0.5) {
  return {
    id,
    trackingIndex: id,
    palm: { x, y },
    landmarks: Array.from({ length: 21 }, () => ({ x, y, z: 0 })),
  };
}

test('disabled Duo controller is inert', () => {
  const events = [];
  const controller = new DuoModeController({
    handlePerformerMelody: (payload) => events.push(['melody', payload]),
    handlePerformerDrums: (payload) => events.push(['drums', payload]),
    handleMixer: (payload) => events.push(['mixer', payload]),
  });

  const result = controller.update([hand(0, 0.2), hand(1, 0.7)], 1000);

  assert.equal(result.enabled, false);
  assert.deepEqual(events, []);
});

test('enabled Duo controller routes locked roles', () => {
  const events = [];
  const controller = new DuoModeController({
    assignerOptions: { holdMs: 0, lostMs: 1000 },
    handlePerformerMelody: (payload) => events.push(['melody', payload.hand.trackingIndex]),
    handlePerformerDrums: (payload) => events.push(['drums', payload.hand.trackingIndex]),
    handleMixer: (payload) => events.push(['mixer', payload.roles.mixerFilter.trackingIndex, payload.roles.mixerSpace.trackingIndex]),
  });

  controller.setEnabled(true);
  const result = controller.update([hand(0, 0.2), hand(1, 0.4), hand(2, 0.6), hand(3, 0.8)], 1000);

  assert.equal(result.enabled, true);
  assert.deepEqual(events, [
    ['melody', 0],
    ['drums', 1],
    ['mixer', 2, 3],
  ]);
});
