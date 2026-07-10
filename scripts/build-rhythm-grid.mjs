import { mkdir, writeFile } from 'node:fs/promises';

const KICK_X = ['1000100010001000', '1000101010001000', '1000100010101000', '1001001010001000', '1010001010011000', '1001010010101000', '1010010100101010'];
const SNARE_X = ['0000100000001000', '0000100000001000', '0000100000101000', '0000100100001000', '0000100001001000', '0010100001001000', '0010010000100100'];
const CLAP_X = ['0000000000001000', '0000000000001000', '0000000000001000', '0000000000101000', '0000000001001000', '0000001000001000', '0000010000100100'];
const HAT_Y = ['0000000000000000', '0010000000100000', '0010001000100010', '1010101010101010', '1011101010111010', '1110111011101110', '1111111111111111'];
const OPEN_Y = ['0000000000000000', '0000000010000000', '0000000010000000', '0000000010000010', '0000001010000010', '0010001010100010', '0010101010101010'];
const EXTRA_Y = ['0000000000000000', '0000000000000000', '0000000000000010', '0000001000000010', '0010001000000010', '0010001000100010', '0010101000101010'];

const X_LABELS = ['STEADY', 'PULSE', 'DRIVE', 'BREAK', 'SHIFT', 'GLITCH', 'FRACTURE'];
const Y_LABELS = ['AIR', 'LEAN', 'LIGHT', 'FULL', 'LIFT', 'HOT', 'MAX'];

const bits = (value) => [...value].map(Number);
const merge = (left, right) => left.map((hit, index) => (hit || right[index] ? 1 : 0));

const grid = [];
for (let y = 0; y < 7; y += 1) {
  for (let x = 0; x < 7; x += 1) {
    grid.push({
      id: `r${y + 1}c${x + 1}`,
      x,
      y,
      label: `${X_LABELS[x]} / ${Y_LABELS[y]}`,
      pattern: {
        kick: merge(bits(KICK_X[x]), bits(EXTRA_Y[y])),
        snare: bits(SNARE_X[x]),
        hihat: bits(HAT_Y[y]),
        openhat: bits(OPEN_Y[y]),
        clap: bits(CLAP_X[x]),
      },
    });
  }
}

await mkdir(new URL('../rhythm/', import.meta.url), { recursive: true });
await writeFile(
  new URL('../rhythm/rhythm-grid.json', import.meta.url),
  `${JSON.stringify(grid, null, 2)}\n`,
);
