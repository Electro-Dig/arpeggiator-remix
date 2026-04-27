const FINGER_ELEMENTS = [
  {
    finger: 'thumb',
    drum: 'openhat',
    sample: 'Orchestral_Drum.wav',
    label: 'Resonance',
    role: 'gong-frame pulse',
    description: 'Slow ceremonial weight and long low resonance.',
    color: '#6aa9ff',
    element: 'Metal'
  },
  {
    finger: 'index',
    drum: 'kick',
    sample: 'Rimshot.wav',
    label: 'Pulse',
    role: 'beat marker',
    description: 'Clear board-like attack that anchors the phrase.',
    color: '#ff8a5b',
    element: 'Earth'
  },
  {
    finger: 'middle',
    drum: 'snare',
    sample: 'Flam.wav',
    label: 'Accent',
    role: 'lift and answer',
    description: 'Short accented lift used as a rhythmic reply.',
    color: '#ffd166',
    element: 'Fire'
  },
  {
    finger: 'ring',
    drum: 'hihat',
    sample: 'Shaker.wav',
    label: 'Flow',
    role: 'grain motion',
    description: 'Continuous shaker grain for dance-like flow.',
    color: '#6ed3b4',
    element: 'Wood'
  },
  {
    finger: 'pinky',
    drum: 'clap',
    sample: 'Indian_Percussion.wav',
    label: 'Ornament',
    role: 'color inflection',
    description: 'Decorative syncopated colour at phrase edges.',
    color: '#c084fc',
    element: 'Water'
  }
];

export const FINGER_TO_DRUM_MAP = Object.freeze(
  FINGER_ELEMENTS.reduce((map, item) => {
    map[item.finger] = item.drum;
    return map;
  }, {})
);

export const DRUM_SAMPLE_MAP = Object.freeze(
  FINGER_ELEMENTS.reduce((map, item) => {
    map[item.drum] = `assets/${item.sample}`;
    return map;
  }, {})
);

export function getFingerElements() {
  return FINGER_ELEMENTS.map((item) => ({ ...item }));
}
