const DEGREE_TO_SEMITONE = Object.freeze({
  '1': 0,
  '2': 2,
  '3': 4,
  '4': 5,
  '5': 7,
  '6': 9,
  '7': 11
});

function pattern16(indices = []) {
  const pattern = new Array(16).fill(false);
  indices.forEach((index) => {
    const normalized = ((index % 16) + 16) % 16;
    pattern[normalized] = true;
  });
  return pattern;
}

export function jianpuToIntervals(tokens = []) {
  return tokens.map((token) => {
    if (token === null || token === undefined || token === '-') return null;
    if (typeof token === 'number') return token;

    let value = `${token}`.trim();
    if (!value) return null;

    let octaveOffset = 0;
    while (value.endsWith("'")) {
      octaveOffset += 12;
      value = value.slice(0, -1);
    }
    while (value.endsWith(',')) {
      octaveOffset -= 12;
      value = value.slice(0, -1);
    }

    let accidentalOffset = 0;
    if (value.startsWith('#')) {
      accidentalOffset = 1;
      value = value.slice(1);
    } else if (value.startsWith('b')) {
      accidentalOffset = -1;
      value = value.slice(1);
    }

    if (!Object.prototype.hasOwnProperty.call(DEGREE_TO_SEMITONE, value)) {
      throw new Error(`Unsupported jianpu token: ${token}`);
    }

    return DEGREE_TO_SEMITONE[value] + accidentalOffset + octaveOffset;
  });
}

function buildScene(scene) {
  const sequence = Array.isArray(scene.melodyDegrees)
    ? jianpuToIntervals(scene.melodyDegrees)
    : Array.isArray(scene.sequence)
      ? [...scene.sequence]
      : [];

  return {
    ...scene,
    sequence,
    stepInterval: scene.stepInterval || '16n',
    scale: Array.isArray(scene.scale) ? [...scene.scale] : [],
    sources: Array.isArray(scene.sources) ? [...scene.sources] : [],
    drumPattern: scene.drumPattern
      ? Object.fromEntries(Object.entries(scene.drumPattern).map(([drum, pattern]) => [drum, [...pattern]]))
      : undefined
  };
}

const FOLK_SONG_SCENES = [
  {
    name: '茉莉花 / Jasmine Flower',
    description: 'Recognisable Jiangsu jasmine melody, lyrical and airy.',
    canonicalVersion: 'Common Jiangsu / 六合 mainstream singing version',
    sources: [
      'https://www.everyonepiano.cn/N-10.html',
      'https://yllhj.beijing.gov.cn/ztxx/bjhx/hhzs/201806/t20180606_118616.shtml'
    ],
    style: 'folk-song',
    tempo: 82,
    synthPreset: 4,
    stepInterval: '8n',
    scale: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5', 'G5', 'A5'],
    melodyDegrees: ['3', '3', '5', '6', "1'", "1'", '6', '5', '3', '3', '5', '6', "1'", "1'", '6', '5'],
    arpeggioPattern: 'up',
    drumPattern: {
      kick: pattern16([0, 8]),
      snare: pattern16([6, 14]),
      hihat: pattern16([3, 7, 11, 15]),
      openhat: pattern16([0, 12]),
      clap: pattern16([7, 15])
    }
  },
  {
    name: '康定情歌 / Kangding Love Song',
    description: 'The familiar “跑马溜溜的山上” contour with a walking pulse.',
    canonicalVersion: 'Mainstream “跑马溜溜的山上” singing version',
    sources: [
      'https://www.everyonepiano.cn/N-14906.html',
      'https://sc.weather.com.cn/bdly/yzsc/703119.shtml'
    ],
    style: 'folk-song',
    tempo: 92,
    synthPreset: 7,
    stepInterval: '8n',
    scale: ['F3', 'G3', 'A3', 'C4', 'D4', 'F4', 'G4', 'A4', 'C5', 'D5'],
    melodyDegrees: ['3', '5', '6', '6', '5', '6', '3', '2', '3', '5', '6', '6', '5', '6', '3', '2'],
    arpeggioPattern: 'up',
    drumPattern: {
      kick: pattern16([0, 4, 8, 12]),
      snare: pattern16([6, 14]),
      hihat: pattern16([2, 6, 10, 14]),
      openhat: pattern16([0, 10]),
      clap: pattern16([5, 13])
    }
  },
  {
    name: '小河淌水 / Flowing River',
    description: 'Midu-style moonlit river contour with sparse breathing space.',
    canonicalVersion: 'Midu singing version beginning “月亮出来亮汪汪”',
    sources: [
      'https://www.everyonepiano.cn/Piano-970.html',
      'https://www.ynxc.gov.cn/html/2024/ddyn_0618/3012919.html'
    ],
    style: 'folk-song',
    tempo: 72,
    synthPreset: 5,
    stepInterval: '8n',
    scale: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5', 'G5', 'A5'],
    melodyDegrees: ['6', "1'", "2'", "3'", "3'", "2'", "1'", '6', "2'", "1'", '6', '6', "1'", '6', '5', '3'],
    arpeggioPattern: 'up',
    drumPattern: {
      kick: pattern16([0, 8]),
      snare: pattern16([7]),
      hihat: pattern16([5, 13]),
      openhat: pattern16([0, 10]),
      clap: pattern16([11])
    }
  },
  {
    name: '青春舞曲 / Youth Dance',
    description: 'Lively Xinjiang dance hook with stronger shaker flow.',
    canonicalVersion: 'Mainstream 王洛宾整理传播版',
    sources: [
      'https://www.everyonepiano.cn/Piano-208.html',
      'https://fashion.chinadaily.com.cn/a/202106/08/WS60bf51eea3101e7ce9753fdd.html'
    ],
    style: 'folk-song',
    tempo: 116,
    synthPreset: 6,
    stepInterval: '8n',
    scale: ['B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'],
    melodyDegrees: ['3', '2', '7,', '1', '3', '2', '1', '7,', '6,', '6,', '4,', '3,', '3', '2', '7,', '1'],
    arpeggioPattern: 'up',
    drumPattern: {
      kick: pattern16([0, 4, 8, 12]),
      snare: pattern16([6, 14]),
      hihat: pattern16([1, 3, 5, 7, 9, 11, 13, 15]),
      openhat: pattern16([0, 8, 12]),
      clap: pattern16([4, 10, 15])
    }
  }
];

const ATMOSPHERIC_SCENES = [
  {
    name: 'Mountain Resonance',
    description: 'Guqin-centered, sparse pentatonic, slower BPM.',
    tempo: 72,
    synthPreset: 5,
    scale: ['D3', 'F3', 'G3', 'A3', 'C4', 'D4', 'F4', 'G4', 'A4', 'C5'],
    sequence: [0, null, 5, null, 7, null, 12, 7],
    arpeggioPattern: 'up',
    drumPattern: {
      kick: pattern16([0, 8]),
      snare: pattern16([6, 14]),
      hihat: pattern16([3, 11]),
      openhat: pattern16([0, 12]),
      clap: pattern16([14])
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
      kick: pattern16([0, 6, 8, 14]),
      snare: pattern16([4, 12]),
      hihat: pattern16([1, 3, 5, 7, 9, 11, 13, 15]),
      openhat: pattern16([7, 15]),
      clap: pattern16([12])
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
      kick: pattern16([0, 4, 8, 12]),
      snare: pattern16([4, 12]),
      hihat: pattern16([0, 2, 4, 6, 8, 10, 12, 14]),
      openhat: pattern16([3, 7, 11, 15]),
      clap: pattern16([6, 14])
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
      kick: pattern16([0, 8]),
      snare: pattern16([4, 12]),
      hihat: pattern16([3, 11]),
      openhat: pattern16([6, 14]),
      clap: pattern16([10])
    }
  }
];

export const PERFORMANCE_SCENES = Object.freeze(
  [...FOLK_SONG_SCENES, ...ATMOSPHERIC_SCENES].map((scene) => buildScene(scene))
);

export function clonePerformanceScenes() {
  return PERFORMANCE_SCENES.map((scene) => ({
    ...scene,
    scale: Array.isArray(scene.scale) ? [...scene.scale] : [],
    sequence: Array.isArray(scene.sequence) ? [...scene.sequence] : [],
    sources: Array.isArray(scene.sources) ? [...scene.sources] : [],
    drumPattern: scene.drumPattern
      ? Object.fromEntries(Object.entries(scene.drumPattern).map(([drum, pattern]) => [drum, [...pattern]]))
      : undefined
  }));
}
