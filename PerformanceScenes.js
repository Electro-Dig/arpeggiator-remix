export const PERFORMANCE_SCENES = [
  {
    name: 'Mountain Resonance',
    description: 'Guqin-centered, sparse pentatonic, slower BPM.',
    tempo: 72,
    synthPreset: 5,
    scale: ['D3', 'F3', 'G3', 'A3', 'C4', 'D4', 'F4', 'G4', 'A4', 'C5'],
    sequence: [0, null, 5, null, 7, null, 12, 7],
    arpeggioPattern: 'up',
    drumPattern: {
      kick:    [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
      snare:   [false, false, false, false, false, false, true, false, false, false, false, false, false, false, true, false],
      hihat:   [false, false, true, false, false, false, false, false, false, false, true, false, false, false, false, false],
      openhat: [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, true],
      clap:    [false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false]
    }
  },
  {
    name: 'Wind over Bamboo',
    description: 'Dizi-centered, flowing pentatonic, medium BPM.',
    tempo: 94,
    synthPreset: 4,
    scale: ['G3', 'A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5'],
    sequence: [0, 2, 5, 7, 9, 7, 5, 2],
    arpeggioPattern: 'up',
    drumPattern: {
      kick:    [true, false, false, false, false, false, true, false, true, false, false, false, false, false, true, false],
      snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat:   [false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true],
      openhat: [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, true],
      clap:    [false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false]
    }
  },
  {
    name: 'Silk and Strings',
    description: 'Guzheng/Pipa-centered, clearer pulse, brighter articulation.',
    tempo: 108,
    synthPreset: 6,
    scale: ['C3', 'D3', 'E3', 'G3', 'A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5'],
    sequence: [0, 7, 12, 7, 4, 7, 9, 12],
    arpeggioPattern: 'up',
    drumPattern: {
      kick:    [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat:   [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      openhat: [false, false, false, true, false, false, false, true, false, false, false, true, false, false, false, true],
      clap:    [false, false, false, false, false, false, true, false, false, false, false, false, false, false, true, false]
    }
  },
  {
    name: 'Breath Ritual',
    description: 'Sheng-centered, sustained/modal, slower weighted rhythm.',
    tempo: 78,
    synthPreset: 10,
    scale: ['A2', 'C3', 'D3', 'E3', 'G3', 'A3', 'C4', 'D4', 'E4', 'G4', 'A4'],
    sequence: [0, null, 3, 5, null, 7, 10, 7],
    arpeggioPattern: 'up',
    drumPattern: {
      kick:    [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
      snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat:   [false, false, false, true, false, false, false, false, false, false, false, true, false, false, false, false],
      openhat: [false, false, false, false, false, false, true, false, false, false, false, false, false, false, true, false],
      clap:    [false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false]
    }
  }
];

export function clonePerformanceScenes() {
  return PERFORMANCE_SCENES.map((scene) => ({
    ...scene,
    scale: Array.isArray(scene.scale) ? [...scene.scale] : [],
    sequence: Array.isArray(scene.sequence) ? [...scene.sequence] : [],
    drumPattern: scene.drumPattern
      ? Object.fromEntries(Object.entries(scene.drumPattern).map(([drum, pattern]) => [drum, [...pattern]]))
      : undefined
  }));
}
