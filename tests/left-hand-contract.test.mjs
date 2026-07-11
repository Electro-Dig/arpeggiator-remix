import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const game = await readFile(new URL('../game.js', import.meta.url), 'utf8');

test('left hand maps semantic controls without legacy synth or preset cycling', () => {
  assert.match(game, /import \{ EdgeGesture, pinchVelocity \} from ['"]\.\/music\/gesture-controls\.js['"]/);
  assert.match(game, /leftFistEdge\s*=\s*new EdgeGesture\(700\)/);
  assert.match(game, /leftFourFingerEdge\s*=\s*new EdgeGesture\(700\)/);
  assert.match(game, /setRootFromPosition\(normY_visible\)/);
  assert.match(game, /setBrightness\(1 - normX_visible\)/);
  assert.match(game, /pinchVelocity\(smoothedLandmarks\)/);
  assert.match(game, /stopArpeggio\(['"]Left['"]\)/);
  assert.doesNotMatch(game, /\.cycleSynth\(|\.cycleMusicPreset\(/);
});

test('musical branches use stable handedness rather than detection array order', () => {
  assert.match(game, /if \(hand\.side === ['"]Left['"]\)/);
  assert.match(game, /else if \(hand\.side === ['"]Right['"]\)/);
  assert.match(game, /categoryName/);
});

test('kit switching is routed only through the stable right-hand branch', () => {
  const leftStart = game.indexOf("if (hand.side === 'Left')");
  const rightStart = game.indexOf("else if (hand.side === 'Right')", leftStart);
  const rightEnd = game.indexOf('categoryName', rightStart);
  assert.ok(leftStart >= 0 && rightStart > leftStart && rightEnd > rightStart);
  assert.doesNotMatch(game.slice(leftStart, rightStart), /rightKitGesture/);
  assert.match(game.slice(rightStart, rightEnd), /rightKitGesture\.update/);
  assert.match(game.slice(rightStart, rightEnd), /cycleDrumKit/);
});
