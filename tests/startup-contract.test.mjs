import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [gameSource, html] = await Promise.all([
  readFile(new URL('../game.js', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
]);

function methodSection(name) {
  const start = gameSource.indexOf(`key: "${name}"`);
  assert.notEqual(start, -1, `${name} must exist`);
  const end = gameSource.indexOf('key: "', start + name.length + 8);
  return gameSource.slice(start, end === -1 ? gameSource.length : end);
}

test('camera and no-camera startup avoid retired preset UI APIs', () => {
  for (const name of ['_startGame', '_startNoCameraMode']) {
    const source = methodSection(name);
    assert.match(source, /musicManager\.start\(\)/);
    assert.match(source, /drumManager\.startSequence\(\)/);
    assert.match(source, /_hideAudioActivationPrompt\(\)/);
    assert.doesNotMatch(source, /_updatePresetDisplay\(\)/);
    assert.doesNotMatch(source, /_initPresetSelector\(\)/);
  }
});

test('removed preset editors do not leave compatibility elements that invoke stale APIs', () => {
  assert.doesNotMatch(html, /compatibility-status/);
  assert.doesNotMatch(html, /id=["'](?:music-preset|drum-preset|preset-menu)["']/);
});

test('startup prompts use recoverable non-blocking cards without retired editors', () => {
  const audioPrompt = methodSection('_showAudioActivationPrompt');
  const noCameraPrompt = methodSection('_showNoCameraModeGuide');
  assert.match(audioPrompt, /audio-activation-chip/);
  assert.match(audioPrompt, /点击画面 · 启动声音/);
  assert.doesNotMatch(audioPrompt, /rgba\(0,\s*0,\s*0,\s*0\.8\)/);
  assert.match(noCameraPrompt, /重试摄像头/);
  assert.match(noCameraPrompt, /继续手动模式/);
  assert.doesNotMatch(noCameraPrompt, /openArpeggioEditor|openDrumEditor/);
});
