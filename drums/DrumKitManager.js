import { DRUM_KITS } from './kit-manifest.js';

const initialVolumes = Object.freeze({
  kick: -9,
  snare: -3,
  hihat: -5,
  openhat: -9,
  clap: -18,
});

async function createTonePlayers(kit) {
  const [Tone, { audioBus }] = await Promise.all([
    import('../audio/tone.js'),
    import('../audio/AudioBus.js'),
  ]);
  return new Promise((resolve, reject) => {
    let players;
    players = new Tone.Players({
      urls: kit.urls,
      onload: () => resolve(players),
      onerror: reject,
    });
    players.connect(audioBus.input);
  });
}

function kitEvent(detail) {
  const event = new Event('kitchange');
  Object.defineProperty(event, 'detail', { value: detail });
  return event;
}

export class DrumKitManager extends EventTarget {
  constructor({ kits = DRUM_KITS, createPlayers = createTonePlayers } = {}) {
    super();
    this.kits = kits;
    this.createPlayers = createPlayers;
    this.players = new Map();
    this.statuses = new Map(kits.map(({ id }) => [id, 'loading']));
    this.volumes = { ...initialVolumes };
    this.currentId = null;
    this.loadPromise = null;
  }

  load() {
    if (!this.loadPromise) this.loadPromise = this.loadAll();
    return this.loadPromise;
  }

  async loadAll() {
    await Promise.allSettled(this.kits.map(async (kit) => {
      try {
        const players = await this.createPlayers(kit);
        this.players.set(kit.id, players);
        this.statuses.set(kit.id, 'ready');
        for (const [drum, dB] of Object.entries(this.volumes)) {
          players.player(drum).volume.value = dB + kit.trim;
        }
      } catch {
        this.statuses.set(kit.id, 'error');
      }
    }));
    const acoustic = this.statuses.get('acoustic') === 'ready' ? 'acoustic' : null;
    this.currentId = acoustic
      ?? this.kits.find(({ id }) => this.statuses.get(id) === 'ready')?.id
      ?? null;
    return this;
  }

  getCurrentKit() {
    return this.kits.find(({ id }) => id === this.currentId) ?? null;
  }

  getKitStatuses() {
    return this.kits.map(({ id, name }) => ({
      id,
      name,
      status: this.statuses.get(id),
    }));
  }

  setKit(id, { source = 'manual' } = {}) {
    const kit = this.kits.find((candidate) => candidate.id === id) ?? null;
    if (!kit || this.statuses.get(id) !== 'ready') {
      return { changed: false, reason: 'unavailable', kit: this.getCurrentKit() };
    }
    if (id === this.currentId) {
      return { changed: false, reason: 'current', kit };
    }
    this.currentId = id;
    const detail = { kit, source };
    this.dispatchEvent(kitEvent(detail));
    return { changed: true, reason: 'changed', ...detail };
  }

  cycleKit({ source = 'gesture' } = {}) {
    const ready = this.kits.filter(({ id }) => this.statuses.get(id) === 'ready');
    if (!ready.length) {
      return { changed: false, reason: 'unavailable', kit: null };
    }
    const index = ready.findIndex(({ id }) => id === this.currentId);
    const next = ready[(index + 1 + ready.length) % ready.length];
    return this.setKit(next.id, { source });
  }

  trigger(drumId, time) {
    this.players.get(this.currentId)?.player(drumId)?.start(time);
  }

  setDrumVolume(drumId, dB) {
    if (!Object.hasOwn(this.volumes, drumId)) return;
    this.volumes[drumId] = dB;
    for (const kit of this.kits) {
      const player = this.players.get(kit.id)?.player(drumId);
      if (player) player.volume.value = dB + kit.trim;
    }
  }
}
