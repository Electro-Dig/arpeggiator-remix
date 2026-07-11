const PITCHES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MODES = Object.freeze({
  'natural-minor': [0, 2, 3, 5, 7, 8, 10],
  'harmonic-minor': [0, 2, 3, 5, 7, 8, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  'major-pentatonic': [0, 2, 4, 7, 9],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
});

export function buildScale(tonic, mode, lowOctave = 3, highOctave = 5) {
  const root = PITCHES.indexOf(tonic);
  const intervals = MODES[mode];
  if (root < 0 || !intervals || !Number.isInteger(lowOctave) || !Number.isInteger(highOctave) || highOctave < lowOctave) {
    throw new RangeError(`Unsupported scale ${tonic} ${mode}`);
  }
  const firstMidi = 12 * (lowOctave + 1) + root;
  const lastMidi = 12 * (highOctave + 1) + root;
  const notes = [];
  for (let midi = firstMidi; midi <= lastMidi; midi += 1) {
    if (!intervals.includes((midi - firstMidi) % 12)) continue;
    notes.push(`${PITCHES[midi % 12]}${Math.floor(midi / 12) - 1}`);
  }
  return notes;
}

export function noteAtPosition(scale, normalizedY) {
  if (!Array.isArray(scale) || scale.length === 0) throw new RangeError('Scale must contain notes');
  const value = Math.max(0, Math.min(1, Number(normalizedY) || 0));
  return scale[Math.round((1 - value) * (scale.length - 1))];
}
