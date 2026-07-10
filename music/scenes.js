export const DEFAULT_SCENE_ID = 'neon-drive';

const scene = (definition) => Object.freeze({
  ...definition,
  sequence: Object.freeze([...definition.sequence]),
  bass: Object.freeze([...definition.bass]),
  variants: Object.freeze([...definition.variants]),
});

export const SCENES = Object.freeze([
  scene({
    id: 'classic', name: 'Classic', tonic: 'E', mode: 'chromatic', bpm: 122,
    sequence: [0, 3, null, 7, 8, null, 7, null],
    bass: [0, null, 0, null, 7, null, 0, null],
    variants: ['DX7 E.PIANO', 'DX7 BRASS', 'DX7 MARIMBA'], legacy: true,
  }),
  scene({
    id: 'neon-drive', name: 'Neon Drive', tonic: 'E', mode: 'natural-minor', bpm: 120,
    sequence: [0, 7, 12, 7, 3, 10, 12, 7, 0, 7, 14, 12, 3, 10, 7, null],
    bass: [0, null, 0, null, 5, null, 7, null],
    variants: ['NEON PLUCK', 'NEON LEAD'],
  }),
  scene({
    id: 'midnight-pulse', name: 'Midnight Pulse', tonic: 'E', mode: 'harmonic-minor', bpm: 108,
    sequence: [0, null, 7, 11, 12, 11, 7, null, 0, 3, 7, 11, 14, 12, 11, 7],
    bass: [0, null, null, 0, 5, null, 7, null],
    variants: ['MIDNIGHT BELL', 'MIDNIGHT BRASS'],
  }),
  scene({
    id: 'arcade-horizon', name: 'Arcade Horizon', tonic: 'A', mode: 'dorian', bpm: 126,
    sequence: [0, 7, 9, 12, 3, 7, 10, 9, 0, 3, 7, 12, 14, 10, 9, 7],
    bass: [0, null, 0, 7, 5, null, 7, null],
    variants: ['ARCADE PULSE', 'ARCADE CRYSTAL'],
  }),
]);

export function getScene(id) {
  const result = SCENES.find((entry) => entry.id === id);
  if (!result) throw new RangeError(`Unknown music scene: ${id}`);
  return result;
}
