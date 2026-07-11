export const TRACKS = Object.freeze(['kick', 'snare', 'hihat', 'openhat', 'clap']);

const bits = (value) => Object.freeze([...value].map(Number));
const motif = ({ kick, snare, hihat, openhat, clap }) => Object.freeze({
  kick: bits(kick),
  snare: bits(snare),
  hihat: bits(hihat),
  openhat: bits(openhat),
  clap: bits(clap),
});

export const RHYTHM_ARCHETYPES = Object.freeze({
  minimalHouse: Object.freeze({
    name: 'MINIMAL HOUSE',
    pattern: motif({
      kick: '1000100010001000',
      snare: '0000100000001000',
      hihat: '0010001000100010',
      openhat: '0000000000000000',
      clap: '0000000000001000',
    }),
  }),
  technoDrive: Object.freeze({
    name: 'TECHNO DRIVE',
    pattern: motif({
      kick: '1000100010001000',
      snare: '0000100000001000',
      hihat: '1111111111111111',
      openhat: '0010001000100010',
      clap: '0000100000001000',
    }),
  }),
  electroBreak: Object.freeze({
    name: 'ELECTRO BREAK',
    pattern: motif({
      kick: '1001000100100010',
      snare: '0000100000011000',
      hihat: '0010001000100010',
      openhat: '0000000100000001',
      clap: '0000000000001000',
    }),
  }),
  glitchRush: Object.freeze({
    name: 'GLITCH RUSH',
    pattern: motif({
      kick: '1010010100101010',
      snare: '0010010000100100',
      hihat: '1111111111111111',
      openhat: '0010101010101010',
      clap: '0000010000100100',
    }),
  }),
});

export const X_LABELS = Object.freeze([
  'STRAIGHT', 'PULSE', 'DRIVE', 'BREAK', 'SHIFT', 'GLITCH', 'BROKEN',
]);

export const Y_LABELS = Object.freeze([
  'MINIMAL', 'LEAN', 'LIGHT', 'GROOVE', 'LIFT', 'HOT', 'ENERGY',
]);
