import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [audioBusSource, musicManagerSource] = await Promise.all([
  readFile(new URL('../audio/AudioBus.js', import.meta.url), 'utf8'),
  readFile(new URL('../MusicManager.js', import.meta.url), 'utf8'),
]);

test('AudioBus applies one reusable effect chain to every shared input', () => {
  assert.equal((audioBusSource.match(/new Tone\.Filter\(/g) || []).length, 1);
  assert.equal((audioBusSource.match(/new Tone\.FeedbackDelay\(/g) || []).length, 1);
  assert.equal((audioBusSource.match(/new Tone\.BitCrusher\(/g) || []).length, 1);
  assert.equal((audioBusSource.match(/new Tone\.Reverb\(/g) || []).length, 1);
  assert.equal((audioBusSource.match(/new Tone\.MembraneSynth\(/g) || []).length, 1);
  assert.match(audioBusSource, /this\.input\.connect\(this\.lowPassFilter\)/);
  assert.match(audioBusSource, /this\.lowPassFilter\.connect\(this\.performanceDelay\)/);
  assert.match(audioBusSource, /this\.performanceDelay\.connect\(this\.glitchCrusher\)/);
  assert.match(audioBusSource, /this\.glitchCrusher\.connect\(this\.broadcastReverb\)/);
  assert.match(audioBusSource, /this\.broadcastReverb\.connect\(this\.limiter\)/);
  assert.match(audioBusSource, /this\.impactSynth\.connect\(this\.limiter\)/);
  assert.doesNotMatch(audioBusSource, /this\.input\.connect\(this\.limiter\)/);
});

test('AudioBus exposes atomic effect updates and HUD-readable state', () => {
  for (const method of [
    'setLowPassAmount',
    'setDelayAmount',
    'setGlitchAmount',
    'setBroadcastBuild',
    'triggerBroadcastImpact',
    'resetBroadcastEffects',
    'setPerformanceEffects',
    'getEffectState',
    'onEffectChange',
  ]) {
    assert.match(audioBusSource, new RegExp(`${method}\\(`));
  }

  const batchStart = audioBusSource.indexOf('setPerformanceEffects(');
  const batchEnd = audioBusSource.indexOf('\n  setLowPassAmount(', batchStart);
  const batchBody = audioBusSource.slice(batchStart, batchEnd);
  assert.equal((batchBody.match(/emitEffectChange\(/g) || []).length, 1);
  assert.match(batchBody, /if \(!changed\) return this\.getEffectState\(\)/);
  assert.match(batchBody, /const statusChanged = next\.label !== previous\.label/);
  assert.match(batchBody, /if \(statusChanged\) this\.emitEffectChange\(\)/);
  assert.match(audioBusSource, /new CustomEvent\(['"]effectchange['"]/);
  assert.match(audioBusSource, /RVB \$\{percentages\.broadcastBuild\}%/);
  assert.match(audioBusSource, /this\.broadcastReverb\.wet\.rampTo/);
});

test('MusicManager preserves scene effects while proxying global effects and melody volume', () => {
  assert.match(musicManagerSource, /this\.sceneFilter\.connect\(this\.sceneDelay\)/);
  assert.match(musicManagerSource, /this\.sceneDelay\.connect\(this\.sceneReverb\)/);
  for (const method of [
    'setLowPassAmount',
    'setDelayAmount',
    'setGlitchAmount',
    'setBroadcastBuild',
    'triggerBroadcastImpact',
    'resetBroadcastEffects',
    'setPerformanceEffects',
    'setMelodyVolume',
  ]) {
    assert.match(musicManagerSource, new RegExp(`${method}\\(`));
  }
  assert.match(musicManagerSource, /effects:\s*audioBus\.getEffectState\(\)/);
  assert.match(musicManagerSource, /melodyVolumeDb:\s*this\.melodyVolumeDb/);
  assert.match(musicManagerSource, /this\.arpSynth\.volume\.value\s*=\s*this\.melodyVolumeDb/);
});
