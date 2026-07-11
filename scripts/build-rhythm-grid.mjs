import { mkdir, writeFile } from 'node:fs/promises';

import {
  RHYTHM_ARCHETYPES,
  TRACKS,
  X_LABELS,
  Y_LABELS,
} from '../rhythm/rhythm-archetypes.js';

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

const stableNoise = (x, y, trackIndex, step) => {
  const seed = ((x + 1) * 73856093) ^ ((y + 1) * 19349663)
    ^ ((trackIndex + 1) * 83492791) ^ ((step + 1) * 2654435761);
  return ((seed >>> 0) % 1000) / 1000;
};

const blendedHit = ({ x, y, track, trackIndex, step }) => {
  const w = weights(x, y);
  const score = Object.entries(w).reduce(
    (sum, [id, weight]) => sum + RHYTHM_ARCHETYPES[id].pattern[track][step] * weight,
    0,
  );
  const energyBias = (y / 6) * (track === 'hihat' || track === 'openhat' ? 0.18 : 0.05);
  const threshold = 0.54 - energyBias + (stableNoise(x, y, trackIndex, step) - 0.5) * 0.12;
  return score >= threshold ? 1 : 0;
};

const enforceInvariants = (pattern) => {
  pattern.kick[0] = 1;
  for (const step of [4, 12]) {
    if (!pattern.snare[step] && !pattern.clap[step]) pattern.snare[step] = 1;
  }
  for (let step = 0; step < 16; step += 1) {
    const active = TRACKS.filter((track) => pattern[track][step]);
    for (const removable of ['openhat', 'clap', 'hihat']) {
      if (active.length <= 3) break;
      if (pattern[removable][step]) {
        pattern[removable][step] = 0;
        active.splice(active.indexOf(removable), 1);
      }
    }
  }
  return pattern;
};

const clonePattern = (pattern) => Object.fromEntries(
  TRACKS.map((track) => [track, [...pattern[track]]]),
);

const makeUnique = (pattern, x, y, signatures) => {
  const first = JSON.stringify(pattern);
  if (!signatures.has(first)) {
    signatures.add(first);
    return pattern;
  }
  for (let attempt = 0; attempt < TRACKS.length * 16; attempt += 1) {
    const track = TRACKS[(x + y + attempt) % TRACKS.length];
    const step = (x * 7 + y + attempt * 5) % 16;
    const candidate = clonePattern(pattern);
    candidate[track][step] = candidate[track][step] ? 0 : 1;
    enforceInvariants(candidate);
    const signature = JSON.stringify(candidate);
    if (!signatures.has(signature)) {
      signatures.add(signature);
      return candidate;
    }
  }
  throw new Error(`Unable to make rhythm ${x}:${y} unique`);
};

const anchorAt = new Map([
  ['0:0', RHYTHM_ARCHETYPES.minimalHouse],
  ['0:6', RHYTHM_ARCHETYPES.technoDrive],
  ['6:0', RHYTHM_ARCHETYPES.electroBreak],
  ['6:6', RHYTHM_ARCHETYPES.glitchRush],
]);
const signatures = new Set();
const grid = [];

for (let y = 0; y < 7; y += 1) {
  for (let x = 0; x < 7; x += 1) {
    const anchor = anchorAt.get(`${x}:${y}`);
    const blended = Object.fromEntries(TRACKS.map((track, trackIndex) => [
      track,
      Array.from({ length: 16 }, (_, step) => blendedHit({ x, y, track, trackIndex, step })),
    ]));
    const pattern = makeUnique(
      enforceInvariants(anchor ? clonePattern(anchor.pattern) : blended),
      x,
      y,
      signatures,
    );
    const fallback = `${X_LABELS[x]} / ${Y_LABELS[y]}`;
    const archetype = anchor?.name ?? (x === 3 && y === 3 ? 'HYBRID GROOVE' : fallback);
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
