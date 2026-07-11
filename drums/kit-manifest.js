const drums = ['kick', 'snare', 'hihat', 'openhat', 'clap'];
const urls = (folder) => Object.fromEntries(
  drums.map((drum) => [drum, `assets/drums/${folder}/${drum}.wav`]),
);

export const DRUM_KITS = Object.freeze([
  Object.freeze({
    id: 'acoustic',
    name: 'ACOUSTIC',
    urls: Object.freeze(urls('acoustic')),
    trim: 0,
  }),
  Object.freeze({
    id: 'electronic',
    name: 'ELECTRONIC',
    urls: Object.freeze(urls('electronic')),
    trim: -2,
  }),
  Object.freeze({
    id: 'synthwave',
    name: 'SYNTHWAVE',
    urls: Object.freeze(urls('synthwave')),
    trim: -3,
  }),
]);
