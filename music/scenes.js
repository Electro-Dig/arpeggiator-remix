export const DEFAULT_SCENE_ID = 'groove-pulse';

const scene = (definition) => Object.freeze({
  ...definition,
  sequence: Object.freeze([...definition.sequence]),
  bass: Object.freeze([...definition.bass]),
  variants: Object.freeze([...definition.variants]),
});

export const SCENES = Object.freeze([
  scene({
    id: 'minimal-groove', name: 'Minimal Groove', tonic: 'E', mode: 'chromatic', bpm: 122,
    sequence: [0, 3, null, 7, 8, null, 7, null],
    bass: [0, null, 0, null, 7, null, 0, null],
    variants: ['DX7 MARIMBA', 'DX7 E.PIANO', 'DX7 BRASS'],
  }),
  scene({
    id: 'groove-pulse', name: 'Groove Pulse', tonic: 'E', mode: 'chromatic', bpm: 115,
    sequence: [0, 7, 2, 7, 0, 3, 7, 0, 8, 7, 0, 5, 7, 0, 7, 7],
    bass: [0, null, 0, null, 7, null, 0, null],
    variants: ['DX7 E.PIANO', 'DX7 BRASS', 'DX7 MARIMBA'],
  }),
  scene({
    id: 'neon-drive', name: 'Neon Drive', tonic: 'E', mode: 'natural-minor', bpm: 120,
    sequence: [0, 7, 12, 7, 3, 10, 12, 7, 0, 7, 14, 12, 3, 10, 7, null],
    bass: [0, null, 0, null, 5, null, 7, null],
    variants: ['NEON PLUCK', 'NEON LEAD'],
  }),
  scene({
    id: 'arcade-horizon', name: 'Arcade Horizon', tonic: 'A', mode: 'dorian', bpm: 126,
    sequence: [0, 7, 9, 12, 3, 7, 10, 9, 0, 3, 7, 12, 14, 10, 9, 7],
    bass: [0, null, 0, 7, 5, null, 7, null],
    variants: ['ARCADE PULSE', 'ARCADE CRYSTAL'],
  }),
  scene({
    id: 'afterglow-coast', name: 'Afterglow Coast', tonic: 'D', mode: 'major-pentatonic', bpm: 96,
    sequence: [0, 4, 7, 11, 7, 4, 2, null, 0, 4, 9, 11, 7, 4, 2, null],
    bass: [0, null, null, 0, 5, null, 7, null],
    variants: ['AFTERGLOW PAD', 'COASTAL PLUCK'],
  }),
  scene({
    id: 'blue-hour-drift', name: 'Blue Hour Drift', tonic: 'A', mode: 'natural-minor', bpm: 90,
    sequence: [0, null, 3, 7, null, 10, 7, 3, 0, null, 5, 7, 10, null, 7, 3],
    bass: [0, null, null, null, 5, null, null, 7],
    variants: ['BLUE HOUR KEYS', 'TAPE CHOIR'],
  }),
]);

export function getScene(id) {
  const result = SCENES.find((entry) => entry.id === id);
  if (!result) throw new RangeError(`Unknown music scene: ${id}`);
  return result;
}
