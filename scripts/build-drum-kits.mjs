import { mkdir, writeFile } from 'node:fs/promises';

const SAMPLE_RATE = 44_100;
const clamp = (value) => Math.max(-1, Math.min(1, value));

function seededNoise(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return (state / 0xffffffff) * 2 - 1;
  };
}

function writeWav(samples) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((sample, index) => {
    buffer.writeInt16LE(Math.round(clamp(sample) * 32767), 44 + index * 2);
  });
  return buffer;
}

const render = (seconds, sampleAt) => Float32Array.from(
  { length: Math.ceil(seconds * SAMPLE_RATE) },
  (_, index) => sampleAt(index / SAMPLE_RATE, index),
);

const kick = ({ seconds, startHz, endHz, decay, click }) => render(seconds, (t) => {
  const sweep = endHz + (startHz - endHz) * Math.exp(-t * 28);
  const body = Math.sin(2 * Math.PI * sweep * t) * Math.exp(-t * decay);
  const transient = (t < 0.012 ? (1 - t / 0.012) * click : 0)
    * Math.sin(2 * Math.PI * 1800 * t);
  return body * 0.88 + transient;
});

const noiseDrum = ({ seconds, seed, bodyHz, decay, noiseLevel }) => {
  const noise = seededNoise(seed);
  let previous = 0;
  return render(seconds, (t) => {
    const raw = noise();
    const high = raw - previous * 0.92;
    previous = raw;
    const env = Math.exp(-t * decay);
    return (Math.sin(2 * Math.PI * bodyHz * t) * 0.32 + high * noiseLevel) * env;
  });
};

const hat = ({ seconds, seed, decay }) => {
  const noise = seededNoise(seed);
  let previous = 0;
  return render(seconds, (t) => {
    const raw = noise();
    const high = raw - previous;
    previous = raw;
    return high * 0.42 * Math.exp(-t * decay);
  });
};

const clap = ({ seconds, seed, decay, spacing }) => {
  const noise = seededNoise(seed);
  const bursts = [0, spacing, spacing * 2, spacing * 3];
  return render(seconds, (t) => {
    const burst = bursts.reduce((sum, start) => (
      t >= start ? sum + Math.exp(-(t - start) * decay) : sum
    ), 0);
    return noise() * burst * 0.24;
  });
};

const configs = {
  electronic: {
    kick: () => kick({ seconds: 0.42, startHz: 150, endHz: 48, decay: 11, click: 0.34 }),
    snare: () => noiseDrum({ seconds: 0.34, seed: 2101, bodyHz: 190, decay: 15, noiseLevel: 0.58 }),
    hihat: () => hat({ seconds: 0.11, seed: 2102, decay: 42 }),
    openhat: () => hat({ seconds: 0.48, seed: 2103, decay: 9 }),
    clap: () => clap({ seconds: 0.30, seed: 2104, decay: 32, spacing: 0.018 }),
  },
  synthwave: {
    kick: () => kick({ seconds: 0.62, startHz: 120, endHz: 42, decay: 7.5, click: 0.18 }),
    snare: () => noiseDrum({ seconds: 0.72, seed: 3101, bodyHz: 165, decay: 7, noiseLevel: 0.52 }),
    hihat: () => hat({ seconds: 0.15, seed: 3102, decay: 30 }),
    openhat: () => hat({ seconds: 0.68, seed: 3103, decay: 6.5 }),
    clap: () => clap({ seconds: 0.62, seed: 3104, decay: 15, spacing: 0.024 }),
  },
};

for (const [kit, drums] of Object.entries(configs)) {
  const directory = new URL(`../assets/drums/${kit}/`, import.meta.url);
  await mkdir(directory, { recursive: true });
  for (const [name, build] of Object.entries(drums)) {
    await writeFile(new URL(`${name}.wav`, directory), writeWav(build()));
  }
}
