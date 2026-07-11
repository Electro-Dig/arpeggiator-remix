import assert from 'node:assert/strict';
import test from 'node:test';

import { DrumKitManager } from '../drums/DrumKitManager.js';

function fakePlayers(id) {
  const drums = new Map();
  return {
    id,
    player(drum) {
      if (!drums.has(drum)) {
        drums.set(drum, {
          starts: [],
          volume: { value: 0 },
          start(time) { this.starts.push(time); },
        });
      }
      return drums.get(drum);
    },
  };
}

async function loadedManagerWithout(unavailableId) {
  const manager = new DrumKitManager({
    createPlayers: async (kit) => {
      if (kit.id === unavailableId) throw new Error('missing');
      return fakePlayers(kit.id);
    },
  });
  await manager.load();
  return manager;
}

test('loads kits independently and cycles only through ready kits', async () => {
  const manager = new DrumKitManager({
    createPlayers: async (kit) => {
      if (kit.id === 'electronic') throw new Error('missing');
      return fakePlayers(kit.id);
    },
  });
  await manager.load();
  assert.equal(manager.getCurrentKit().id, 'acoustic');
  assert.equal(manager.cycleKit({ source: 'gesture' }).kit.id, 'synthwave');
  assert.equal(manager.cycleKit({ source: 'gesture' }).kit.id, 'acoustic');
});

test('an unavailable selection keeps the previous kit without throwing', async () => {
  const manager = await loadedManagerWithout('electronic');
  const result = manager.setKit('electronic', { source: 'manual' });
  assert.equal(result.changed, false);
  assert.equal(result.reason, 'unavailable');
  assert.equal(manager.getCurrentKit().id, 'acoustic');
});

test('emits once, delegates triggers, and applies volumes to every ready kit', async () => {
  const created = new Map();
  const manager = new DrumKitManager({
    createPlayers: async (kit) => {
      const players = fakePlayers(kit.id);
      created.set(kit.id, players);
      return players;
    },
  });
  await manager.load();
  const events = [];
  manager.addEventListener('kitchange', ({ detail }) => events.push(detail));
  assert.equal(manager.setKit('acoustic', { source: 'manual' }).reason, 'current');
  assert.equal(manager.setKit('electronic', { source: 'manual' }).changed, true);
  assert.equal(events.length, 1);
  manager.trigger('kick', 1.25);
  assert.deepEqual(created.get('electronic').player('kick').starts, [1.25]);
  manager.setDrumVolume('snare', -7);
  assert.equal(created.get('acoustic').player('snare').volume.value, -7);
  assert.equal(created.get('electronic').player('snare').volume.value, -9);
  assert.equal(created.get('synthwave').player('snare').volume.value, -10);
});

test('resolves safely when all kits fail and keeps load idempotent', async () => {
  let attempts = 0;
  const manager = new DrumKitManager({
    createPlayers: async () => {
      attempts += 1;
      throw new Error('offline');
    },
  });
  const first = manager.load();
  const second = manager.load();
  assert.equal(first, second);
  await first;
  assert.equal(attempts, 3);
  assert.equal(manager.getCurrentKit(), null);
  assert.equal(manager.cycleKit({ source: 'gesture' }).reason, 'unavailable');
  assert.doesNotThrow(() => manager.trigger('kick', 0));
});
