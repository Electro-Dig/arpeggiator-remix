import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [game, main] = await Promise.all([
  readFile(new URL('../game.js', import.meta.url), 'utf8'),
  readFile(new URL('../main.js', import.meta.url), 'utf8'),
]);

test('hand frames continuously drive the shared performance effects without legacy calibration', () => {
  assert.match(game, /performanceEffectsFromHands/);
  assert.match(game, /new LowPassGestureController\(\{\s*timeConstantMs:\s*100\s*\}\)/);
  assert.match(game, /var effectOptions = \{[\s\S]*videoNaturalWidth\s*\/\s*videoParams\.videoNaturalHeight/);
  assert.match(game, /musicManager\.setPerformanceEffects\(effects\)/);
  assert.match(game, /normalizedPalmDistance\(this\.handsBySide/);
  assert.match(game, /lowPassController\.updateDistance\(/);

  const animateStart = game.indexOf('key: "_animate"');
  const animateEnd = game.indexOf('key: "_updateBeatIndicator"', animateStart);
  assert.ok(animateStart >= 0 && animateEnd > animateStart);
  const animate = game.slice(animateStart, animateEnd);
  assert.doesNotMatch(animate, /_sampleDelayDistanceIfDue|_updateDelayLevelIfDue/);
});

test('broadcast gestures feed reverb build and a one-shot impact into the shared music manager', () => {
  assert.match(game, /import \{ BroadcastGestureController \} from ['"]\.\/music\/broadcast-gestures\.js['"]/);
  assert.match(game, /this\.broadcastGestureController\s*=\s*new BroadcastGestureController\(/);
  assert.match(game, /broadcastGestureController\.update\(this\.handsBySide,\s*performance\.now\(\)\)/);
  assert.match(game, /effects\.broadcastBuild\s*=\s*broadcastGesture\.build/);
  assert.match(game, /if \(broadcastGesture\.impact\)[\s\S]{0,220}musicManager\.triggerBroadcastImpact\(1\)/);
  assert.match(game, /BUILD READY/);
  assert.match(game, /DROP IMPACT/);
});

test('broadcast effects are reset on suppression and every tracking-loss exit', () => {
  assert.match(game, /key: "_resetBroadcastEffects"[\s\S]{0,320}broadcastGestureController\.reset\(\)[\s\S]{0,180}musicManager\.resetBroadcastEffects\(\)/);
  assert.ok((game.match(/_resetBroadcastEffects\(\)/g) || []).length >= 6,
    'suppression, invalid video, detector errors and stale tracking reset broadcast effects');
});

test('suppression and detector errors immediately reset shared effects to neutral', () => {
  const suppressionStart = game.indexOf('key: "setInteractionSuppressed"');
  const suppressionEnd = game.indexOf('key: "_updateHands"', suppressionStart);
  assert.ok(suppressionStart >= 0 && suppressionEnd > suppressionStart);
  assert.match(
    game.slice(suppressionStart, suppressionEnd),
    /if \(nextValue\)[\s\S]*lowPassController\.reset\(\)[\s\S]*setPerformanceEffects\(performanceEffectsFromHands\(\)\)/,
  );

  const detectionStart = game.indexOf('detectForVideo');
  const detectionEnd = game.indexOf('key: "_updateBeatIndicator"', detectionStart);
  assert.ok(detectionStart >= 0 && detectionEnd > detectionStart);
  assert.match(
    game.slice(detectionStart, detectionEnd),
    /catch \(error\)[\s\S]*handsBySide\s*=\s*\{[\s\S]*Left:\s*null,[\s\S]*Right:\s*null[\s\S]*setPerformanceEffects\(performanceEffectsFromHands\(\)\)/,
  );

  assert.match(game, /this\.lastPerformanceEffectFrameAt\s*=\s*0/);
  assert.match(
    game.slice(detectionStart, detectionEnd),
    /performance\.now\(\)\s*-\s*this\.lastPerformanceEffectFrameAt\s*>\s*350/,
  );
  assert.match(game.slice(detectionStart, detectionEnd), /this\.lastPerformanceEffectFrameAt\s*=\s*performance\.now\(\)/);
  assert.ok((game.match(/lowPassController\.reset\(\)/g) || []).length >= 5,
    'all lost-tracking and suppression exits reset the low-pass controller');
});

test('advanced melody volume control is wired to the music manager with a live dB readout', () => {
  assert.match(main, /getElementById\('melody-volume-slider'\)/);
  assert.match(main, /getElementById\('melody-volume-value'\)/);
  assert.match(main, /musicManager\.setMelodyVolume\(dB\)/);
  assert.match(main, /melodyVolumeValue\.textContent\s*=\s*`\$\{dB\} dB`/);
});

test('music status synchronizes the shared effect summary into the HUD state', () => {
  assert.match(main, /mixEffects:\s*status\.effectsLabel/);
});
