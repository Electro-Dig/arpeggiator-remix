import * as Tone from 'https://esm.sh/tone';
import { clonePerformanceScenes } from './PerformanceScenes.js';
import { DRUM_SAMPLE_MAP, FINGER_TO_DRUM_MAP } from './FingerElements.js';

const DRUM_IDS = ['kick', 'snare', 'hihat', 'openhat', 'clap'];
const DEFAULT_PATTERN_LENGTH = 16;
const DEFAULT_DRUM_VOLUMES = {
  kick: -8,      // Rimshot pulse
  snare: -10,    // Flam accent
  hihat: -13,    // Shaker flow
  openhat: -15,  // Orchestral drum resonance
  clap: -14      // Indian percussion ornament
};

function createEmptyPatterns() {
  return Object.fromEntries(DRUM_IDS.map((drum) => [drum, new Array(DEFAULT_PATTERN_LENGTH).fill(false)]));
}

function sanitizePatternArray(pattern) {
  const sanitized = new Array(DEFAULT_PATTERN_LENGTH).fill(false);
  if (Array.isArray(pattern)) {
    for (let i = 0; i < Math.min(pattern.length, DEFAULT_PATTERN_LENGTH); i += 1) {
      sanitized[i] = Boolean(pattern[i]);
    }
  }
  return sanitized;
}

function sanitizePatterns(patterns) {
  const base = createEmptyPatterns();
  DRUM_IDS.forEach((drum) => {
    base[drum] = sanitizePatternArray(patterns?.[drum]);
  });
  return base;
}

function buildDrumPresets() {
  return clonePerformanceScenes().map((scene) => ({
    name: scene.name,
    bpm: scene.tempo || 120,
    patterns: sanitizePatterns(scene.drumPattern)
  }));
}

function cloneDrumPreset(preset) {
  return {
    ...preset,
    patterns: sanitizePatterns(preset?.patterns)
  };
}

let players = null;
let isLoaded = false;
let sequence = null;
let beatIndex = 0;
const activeDrums = new Set();
const drumVolumes = { ...DEFAULT_DRUM_VOLUMES };

let drumPresets = buildDrumPresets();
const originalDrumPresets = drumPresets.map((preset) => cloneDrumPreset(preset));
let currentDrumPresetIndex = 0;
let drumPattern = sanitizePatterns(drumPresets[currentDrumPresetIndex]?.patterns);

export function loadSamples() {
  return new Promise((resolve, reject) => {
    if (isLoaded) {
      resolve();
      return;
    }

    players = new Tone.Players({
      urls: DRUM_SAMPLE_MAP,
      onload: () => {
        isLoaded = true;
        DRUM_IDS.forEach((drumId) => {
          players.player(drumId).volume.value = drumVolumes[drumId];
        });
        console.log('Drum samples loaded successfully.');
        resolve();
      },
      onerror: (error) => {
        console.error('Error loading drum samples:', error);
        reject(error);
      }
    }).toDestination();
  });
}

export function startSequence() {
  if (!isLoaded || sequence) {
    console.warn('Drums not loaded or sequence already started. Cannot start sequence.');
    return;
  }

  sequence = new Tone.Sequence((time, step) => {
    beatIndex = step;
    Object.entries(drumPattern).forEach(([drum, pattern]) => {
      if (activeDrums.has(drum) && pattern[step]) {
        players.player(drum).start(time);
      }
    });
  }, Array.from({ length: DEFAULT_PATTERN_LENGTH }, (_, index) => index), '16n').start(0);

  console.log('Drum sequence started.');
}

export function updateActiveDrums(fingerStates) {
  activeDrums.clear();
  Object.entries(fingerStates || {}).forEach(([finger, isUp]) => {
    if (!isUp) return;
    const drum = FINGER_TO_DRUM_MAP[finger];
    if (drum) {
      activeDrums.add(drum);
    }
  });
}

export function getActiveDrums() {
  return activeDrums;
}

export function getFingerToDrumMap() {
  return FINGER_TO_DRUM_MAP;
}

export function setDrumVolume(drumId, dB) {
  if (!Object.prototype.hasOwnProperty.call(drumVolumes, drumId)) return;
  const nextValue = typeof dB === 'number' ? dB : drumVolumes[drumId];
  drumVolumes[drumId] = nextValue;
  try {
    const player = players?.player?.(drumId);
    if (player) {
      player.volume.value = nextValue;
    }
  } catch {
    // Ignore until samples are loaded.
  }
}

export function getAllDrumVolumes() {
  return { ...drumVolumes };
}

export function getCurrentBeat() {
  return beatIndex;
}

export function getDrumPattern() {
  return drumPattern;
}

function applyPresetIndex(index) {
  currentDrumPresetIndex = index;
  drumPattern = sanitizePatterns(drumPresets[currentDrumPresetIndex]?.patterns);
  return drumPresets[currentDrumPresetIndex];
}

export function cycleDrumPreset() {
  const nextIndex = (currentDrumPresetIndex + 1) % drumPresets.length;
  const preset = applyPresetIndex(nextIndex);
  console.log(`Switched drum preset: ${preset.name}`);
  return preset;
}

export function getCurrentDrumPreset() {
  return drumPresets[currentDrumPresetIndex];
}

export function getAllDrumPresets() {
  return drumPresets;
}

export function setDrumPreset(index) {
  if (index < 0 || index >= drumPresets.length) return;
  const preset = applyPresetIndex(index);
  console.log(`Switched drum preset: ${preset.name}`);
}

export function getCurrentDrumBPM() {
  return drumPresets[currentDrumPresetIndex]?.bpm ?? 120;
}

export function setDrumPresetBPM(index, bpm) {
  if (index < 0 || index >= drumPresets.length) return;
  drumPresets[index].bpm = bpm;
  console.log(`Drum preset ${drumPresets[index].name} BPM updated to: ${bpm}`);
}

export function getDrumPresetBPM(index) {
  if (index >= 0 && index < drumPresets.length) {
    return drumPresets[index].bpm;
  }
  return 120;
}

export function updateDrumPresetPatterns(index, patterns) {
  if (index < 0 || index >= drumPresets.length) return;
  drumPresets[index].patterns = sanitizePatterns(patterns);
  if (index === currentDrumPresetIndex) {
    drumPattern = sanitizePatterns(drumPresets[index].patterns);
  }
  console.log(`Drum preset ${drumPresets[index].name} patterns updated.`);
}

export function getOriginalDrumPresets() {
  return originalDrumPresets.map((preset) => cloneDrumPreset(preset));
}

export function resetDrumPreset(index) {
  if (index < 0 || index >= drumPresets.length) return;
  const originalPreset = getOriginalDrumPresets()[index];
  if (!originalPreset) return;

  drumPresets[index] = cloneDrumPreset(originalPreset);
  if (index === currentDrumPresetIndex) {
    drumPattern = sanitizePatterns(drumPresets[index].patterns);
  }
  console.log(`Drum preset ${drumPresets[index].name} reset to original state.`);
}
