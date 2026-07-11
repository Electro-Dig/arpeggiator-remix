import { mkdir, writeFile } from 'node:fs/promises';

import {
  RHYTHM_ARCHETYPES,
  TRACKS,
  X_LABELS,
  Y_LABELS,
} from '../rhythm/rhythm-archetypes.js';

const TARGET_HITS = Object.freeze([13, 17, 21, 25, 29, 34, 40]);
const MIN_NEIGHBOR_DISTANCE = 5;
const MIN_UPPER_SKELETON_DISTANCE = 2;
const SKELETON_TRACKS = Object.freeze(['kick', 'snare', 'clap']);

const weights = (x, y) => {
  const nx = x / 6;
  const ny = y / 6;
  return {
    minimalHouse: (1 - nx) * (1 - ny),
    technoDrive: (1 - nx) * ny,
    electroBreak: nx * (1 - ny),
    glitchRush: nx * ny,
  };
};

const stableNoise = (x, y, trackIndex, step, salt) => {
  const seed = ((x + 1) * 73856093) ^ ((y + 1) * 19349663)
    ^ ((trackIndex + 1) * 83492791) ^ ((step + 1) * 2654435761)
    ^ ((salt + 1) * 97531);
  return ((seed >>> 0) % 1000) / 1000;
};

const includes = (values, step) => values.includes(step);
const brokenKickSteps = Object.freeze([
  [0, 4, 8, 12],
  [0, 4, 7, 12],
  [0, 3, 7, 12],
  [0, 3, 7, 10, 14],
  [0, 3, 6, 10, 14],
  [0, 2, 5, 9, 11, 14],
  [0, 2, 5, 7, 10, 13, 15],
]);
const brokenSnareSteps = Object.freeze([
  [4, 12],
  [4, 11, 12],
  [4, 10, 12],
  [4, 7, 12],
  [3, 7, 12, 15],
  [3, 6, 10, 14],
  [2, 6, 10, 13],
]);

const eventScore = ({ x, y, track, trackIndex, step, salt }) => {
  const nx = x / 6;
  const ny = y / 6;
  const cornerWeight = Object.entries(weights(x, y)).reduce(
    (sum, [id, weight]) => sum + RHYTHM_ARCHETYPES[id].pattern[track][step] * weight * 2.2,
    0,
  );
  const energyBias = {
    kick: 0.72 + ny * 0.18,
    snare: 0.62 + ny * 0.16,
    hihat: 0.2 + ny * 1.25,
    openhat: 0.04 + ny * 0.88,
    clap: 0.08 + ny * 0.58,
  }[track];
  let structure = 0;
  if (track === 'kick') {
    structure += includes(brokenKickSteps[x], step) ? 1.85 : 0;
    structure += step % 4 === 0 ? (1 - nx) * 1.3 : 0;
  } else if (track === 'snare') {
    structure += includes(brokenSnareSteps[x], step) ? 1.65 : 0;
    structure += includes([4, 12], step) ? (1 - nx) * 1.15 : 0;
  } else if (track === 'clap') {
    structure += includes(brokenSnareSteps[Math.min(6, x + 1)], step) ? 0.95 + ny * 0.6 : 0;
  } else if (track === 'hihat') {
    structure += step % 2 === 0 ? (1 - nx) * 0.9 : 0;
    structure += ((step + x * 3) % 5) < 2 ? nx * 1.05 : 0;
  } else if (track === 'openhat') {
    structure += ((step + x) % 4) === 2 ? (1 - nx) * 0.75 : 0;
    structure += ((step * 3 + x) % 7) < 2 ? nx * 1.1 : 0;
  }
  const variation = (stableNoise(x, y, trackIndex, step, salt) - 0.5) * 2.8;
  return cornerWeight + energyBias + structure + variation;
};

const emptyPattern = () => Object.fromEntries(
  TRACKS.map((track) => [track, Array(16).fill(0)]),
);

const setHit = (pattern, track, step) => {
  pattern[track][step] = 1;
};

const hitCount = (pattern) => Object.values(pattern).flat().reduce((sum, hit) => sum + hit, 0);
const simultaneousAt = (pattern, step) => TRACKS.reduce((sum, track) => sum + pattern[track][step], 0);

const buildPattern = (x, y, salt) => {
  const pattern = emptyPattern();
  setHit(pattern, 'kick', 0);
  setHit(pattern, 'snare', 4);
  setHit(pattern, 'snare', 12);

  const candidates = TRACKS.flatMap((track, trackIndex) => (
    Array.from({ length: 16 }, (_, step) => ({
      track,
      trackIndex,
      step,
      score: eventScore({ x, y, track, trackIndex, step, salt }),
    }))
  )).filter(({ track, step }) => !pattern[track][step]);
  candidates.sort((left, right) => right.score - left.score
    || left.trackIndex - right.trackIndex
    || left.step - right.step);

  for (const { track, step } of candidates) {
    if (hitCount(pattern) >= TARGET_HITS[y]) break;
    if (simultaneousAt(pattern, step) >= 3) continue;
    setHit(pattern, track, step);
  }
  if (hitCount(pattern) !== TARGET_HITS[y]) {
    throw new Error(`Unable to reach target density at ${x}:${y}`);
  }
  return pattern;
};

const flatten = (pattern, tracks = TRACKS) => tracks.flatMap((track) => pattern[track]);
const distance = (left, right, tracks = TRACKS) => {
  const a = flatten(left, tracks);
  const b = flatten(right, tracks);
  return a.reduce((sum, value, index) => sum + Number(value !== b[index]), 0);
};

const acceptable = (pattern, x, y, cells, signatures) => {
  const signature = JSON.stringify(pattern);
  if (signatures.has(signature)) return false;
  const left = cells.find((cell) => cell.x === x - 1 && cell.y === y);
  const below = cells.find((cell) => cell.x === x && cell.y === y - 1);
  if (left && distance(pattern, left.pattern) < MIN_NEIGHBOR_DISTANCE) return false;
  if (below && distance(pattern, below.pattern) < MIN_NEIGHBOR_DISTANCE) return false;
  if (y >= 4 && left && distance(pattern, left.pattern, SKELETON_TRACKS) < MIN_UPPER_SKELETON_DISTANCE) {
    return false;
  }
  return true;
};

const anchorNames = new Map([
  ['0:0', 'MINIMAL HOUSE'],
  ['0:6', 'TECHNO DRIVE'],
  ['6:0', 'ELECTRO BREAK'],
  ['6:6', 'GLITCH RUSH'],
  ['3:3', 'HYBRID GROOVE'],
]);
const signatures = new Set();
const grid = [];

for (let y = 0; y < 7; y += 1) {
  for (let x = 0; x < 7; x += 1) {
    let pattern = null;
    for (let salt = 0; salt < 512; salt += 1) {
      const candidate = buildPattern(x, y, salt);
      if (acceptable(candidate, x, y, grid, signatures)) {
        pattern = candidate;
        break;
      }
    }
    if (!pattern) throw new Error(`Unable to build a distinct rhythm at ${x}:${y}`);
    signatures.add(JSON.stringify(pattern));
    const fallback = `${X_LABELS[x]} / ${Y_LABELS[y]}`;
    const archetype = anchorNames.get(`${x}:${y}`) ?? fallback;
    grid.push({
      id: `r${y + 1}c${x + 1}`,
      x,
      y,
      label: archetype,
      archetype,
      pattern,
    });
  }
}

await mkdir(new URL('../rhythm/', import.meta.url), { recursive: true });
await writeFile(
  new URL('../rhythm/rhythm-grid.json', import.meta.url),
  `${JSON.stringify(grid, null, 2)}\n`,
);
