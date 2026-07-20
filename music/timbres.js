const fm = (harmonicity, modulationIndex, attack, decay, sustain, release) => Object.freeze({
  harmonicity,
  modulationIndex,
  oscillator: { type: 'sine' },
  modulation: { type: 'sine' },
  envelope: { attack, decay, sustain, release },
  modulationEnvelope: {
    attack: Math.max(0.001, attack / 2),
    decay,
    sustain: Math.max(0.05, sustain * 0.7),
    release,
  },
});

const timbre = (id, name, options) => Object.freeze({ id, name, options });

export const MELODY_TIMBRES = Object.freeze([
  timbre('dx7-e-piano', 'DX7 E.PIANO', fm(14, 4.5, 0.01, 0.3, 0.4, 1.2)),
  timbre('dx7-brass', 'DX7 BRASS', fm(2, 12, 0.1, 0.2, 0.8, 0.6)),
  timbre('dx7-marimba', 'DX7 MARIMBA', fm(3, 6, 0.005, 0.4, 0.1, 0.8)),
  timbre('neon-pluck', 'NEON PLUCK', fm(7, 8, 0.002, 0.3, 0.15, 0.5)),
  timbre('neon-lead', 'NEON LEAD', fm(1.5, 15, 0.05, 0.1, 0.7, 0.8)),
  timbre('arcade-pulse', 'ARCADE PULSE', fm(2, 9, 0.01, 0.16, 0.55, 0.35)),
  timbre('arcade-crystal', 'ARCADE CRYSTAL', fm(7, 10, 0.001, 0.22, 0.1, 0.45)),
  timbre('afterglow-pad', 'AFTERGLOW PAD', fm(1, 3.2, 0.28, 0.8, 0.72, 2.8)),
  timbre('coastal-pluck', 'COASTAL PLUCK', fm(3, 4.8, 0.008, 0.5, 0.18, 1.4)),
  timbre('blue-hour-keys', 'BLUE HOUR KEYS', fm(6, 2.6, 0.035, 0.7, 0.42, 2.2)),
  timbre('tape-choir', 'TAPE CHOIR', fm(0.5, 2.1, 0.42, 1.1, 0.78, 3.4)),
]);

export function resolveTimbreIndex(value, fallback = 0) {
  const length = MELODY_TIMBRES.length;
  if (typeof value === 'string') {
    const match = MELODY_TIMBRES.findIndex(({ id, name }) => value === id || value === name);
    if (match >= 0) return match;
    return resolveTimbreIndex(fallback, 0);
  }
  const number = Number(value);
  if (!Number.isFinite(number)) return resolveTimbreIndex(fallback, 0);
  return ((Math.trunc(number) % length) + length) % length;
}
