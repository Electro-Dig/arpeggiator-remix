const FINGER_ELEMENTS = [
  {
    finger: 'thumb',
    drum: 'openhat',
    sample: 'Orchestral_Drum.wav',
    label: 'Resonance',
    color: '#6aa9ff',
    element: 'Metal'
  },
  {
    finger: 'index',
    drum: 'kick',
    sample: 'Rimshot.wav',
    label: 'Pulse',
    color: '#ff8a5b',
    element: 'Earth'
  },
  {
    finger: 'middle',
    drum: 'snare',
    sample: 'Flam.wav',
    label: 'Strike',
    color: '#ffd166',
    element: 'Fire'
  },
  {
    finger: 'ring',
    drum: 'hihat',
    sample: 'Shaker.wav',
    label: 'Flow',
    color: '#6ed3b4',
    element: 'Wood'
  },
  {
    finger: 'pinky',
    drum: 'clap',
    sample: 'Indian_Percussion.wav',
    label: 'Spirit',
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
