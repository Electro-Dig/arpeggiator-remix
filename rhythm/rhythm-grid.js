import rawGrid from './rhythm-grid.json' with { type: 'json' };

const TRACKS = ['kick', 'snare', 'hihat', 'openhat', 'clap'];

function freezeCell(cell) {
  if (!Number.isInteger(cell.x) || !Number.isInteger(cell.y)) {
    throw new TypeError('Rhythm coordinates must be integers');
  }
  const pattern = Object.fromEntries(TRACKS.map((track) => {
    const steps = cell.pattern?.[track];
    if (!Array.isArray(steps) || steps.length !== 16 || steps.some((step) => step !== 0 && step !== 1)) {
      throw new TypeError(`Invalid ${track} pattern at ${cell.x}:${cell.y}`);
    }
    return [track, Object.freeze([...steps])];
  }));
  return Object.freeze({ ...cell, pattern: Object.freeze(pattern) });
}

export const RHYTHM_GRID = Object.freeze(rawGrid.map(freezeCell));

if (RHYTHM_GRID.length !== 49 || new Set(RHYTHM_GRID.map(({ x, y }) => `${x}:${y}`)).size !== 49) {
  throw new TypeError('Rhythm grid must contain exactly 49 unique cells');
}

export function getRhythmCell(x, y) {
  const cell = RHYTHM_GRID.find((entry) => entry.x === x && entry.y === y);
  if (!cell) throw new RangeError(`Unknown rhythm cell ${x}:${y}`);
  return cell;
}
