import * as Tone from './audio/tone.js';
import { audioBus } from './audio/AudioBus.js';
import { PatternScheduler } from './rhythm/PatternScheduler.js';
import { getRhythmCell, RHYTHM_GRID } from './rhythm/rhythm-grid.js';

let players = null;
let isLoaded = false;
let sequence = null;
let beatIndex = 0;
const activeDrums = new Set();
const drumVolumes = { kick: -9, snare: -3, hihat: -5, openhat: -9, clap: -18 };

const initialCell = getRhythmCell(0, 3);
let drumPattern = initialCell.pattern;
const patternScheduler = new PatternScheduler(drumPattern);
let currentGridCell = { x: initialCell.x, y: initialCell.y, label: initialCell.label };
let pendingGridCell = null;
const rhythmListeners = new Set();

const fingerToDrumMap = {
  'thumb': 'openhat',
  'index': 'kick',
  'middle': 'snare',
  'ring': 'hihat',
  'pinky': 'clap',
};

export function loadSamples() {
  if (isLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    players = new Tone.Players({
      urls: {
        kick: 'assets/kick.wav',
        snare: 'assets/snare.wav',
        hihat: 'assets/hihat.wav',
        openhat: 'assets/hihat.wav',
        clap: 'assets/clap.wav',
      },
      onload: () => {
        isLoaded = true;
        for (const [drum, volume] of Object.entries(drumVolumes)) {
          players.player(drum).volume.value = volume;
        }
        resolve();
      },
      onerror: reject,
    });
    players.connect(audioBus.input);
  });
}

export function startSequence() {
  if (!isLoaded || sequence) return;
  sequence = new Tone.Sequence((time, step) => {
    beatIndex = step;
    drumPattern = patternScheduler.onStep(step);
    if (step === 0 && pendingGridCell) {
      currentGridCell = pendingGridCell;
      pendingGridCell = null;
      for (const listener of rhythmListeners) listener(getCurrentGridCell());
    }
    for (const [drum, pattern] of Object.entries(drumPattern)) {
      if (activeDrums.has(drum) && pattern[step]) players.player(drum).start(time);
    }
  }, Array.from({ length: 16 }, (_, index) => index), '16n').start(0);
}

export function queueRhythmCell(x, y) {
  const cell = getRhythmCell(x, y);
  if (currentGridCell.x === x && currentGridCell.y === y && !pendingGridCell) return currentGridCell;
  pendingGridCell = { x, y, label: cell.label };
  patternScheduler.queue(cell.pattern);
  return { ...pendingGridCell };
}

export function getCurrentGridCell() {
  return { ...currentGridCell };
}

export function getPendingGridCell() {
  return pendingGridCell ? { ...pendingGridCell } : null;
}

export function onRhythmCellChange(listener) {
  rhythmListeners.add(listener);
  return () => rhythmListeners.delete(listener);
}

export function updateActiveDrums(fingerStates = {}) {
  activeDrums.clear();
  for (const [finger, isUp] of Object.entries(fingerStates)) {
    const drum = fingerToDrumMap[finger];
    if (isUp && drum) activeDrums.add(drum);
  }
}

export function getActiveDrums() {
  return activeDrums;
}

export function getFingerToDrumMap() {
  return { ...fingerToDrumMap };
}

export function getCurrentBeat() {
  return beatIndex;
}

export function getDrumPattern() {
  return drumPattern;
}

export function getAllRhythmCells() {
  return RHYTHM_GRID;
}

export function setDrumVolume(drumId, dB) {
  if (!Object.hasOwn(drumVolumes, drumId)) return;
  const value = Number.isFinite(dB) ? dB : drumVolumes[drumId];
  drumVolumes[drumId] = value;
  const player = players?.player?.(drumId);
  if (player) player.volume.value = value;
}

export function getAllDrumVolumes() {
  return { ...drumVolumes };
}
