import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LowPassGestureController,
  lowPassAmountFromDistance,
  normalizedPalmDistance,
  performanceEffectsFromHands,
} from '../music/effect-controls.js';

function hand({
  palmX = 0.25,
  palmY = 0.5,
  palmSize = 0.1,
  middleDistance = 1,
  ringDistance = 1,
} = {}) {
  const landmarks = Array.from({ length: 21 }, () => ({ x: palmX, y: palmY }));
  landmarks[0] = { x: palmX, y: palmY + palmSize };
  landmarks[9] = { x: palmX, y: palmY };
  landmarks[4] = { x: palmX, y: palmY - palmSize };
  landmarks[12] = { x: palmX + middleDistance * palmSize, y: palmY - palmSize };
  landmarks[16] = { x: palmX + ringDistance * palmSize, y: palmY - palmSize };
  return { landmarks };
}

function physicalHand({
  width,
  height,
  palmX,
  palmY = height * 0.5,
  palmSize = height * 0.1,
  middleDistance = 0.5,
  ringDistance = 0.85,
}) {
  const landmarks = Array.from({ length: 21 }, () => ({
    x: palmX / width,
    y: palmY / height,
  }));
  landmarks[0] = { x: palmX / width, y: (palmY + palmSize) / height };
  landmarks[9] = { x: palmX / width, y: palmY / height };
  landmarks[4] = { x: palmX / width, y: (palmY - palmSize) / height };
  landmarks[12] = {
    x: (palmX + middleDistance * palmSize) / width,
    y: (palmY - palmSize) / height,
  };
  landmarks[16] = {
    x: (palmX + ringDistance * palmSize) / width,
    y: (palmY - palmSize) / height,
  };
  return { landmarks };
}

function physicalGesture(width, height) {
  const palmSize = height * 0.1;
  const palmX = width * 0.2;
  return {
    Left: physicalHand({ width, height, palmX, palmSize }),
    Right: physicalHand({
      width,
      height,
      palmX: palmX + palmSize * 3.75,
      palmSize,
    }),
  };
}

test('missing hands leave the global filter open and momentary effects off', () => {
  assert.deepEqual(performanceEffectsFromHands(), {
    lowPass: 1,
    delay: 0,
    glitch: 0,
    percentages: { lowPass: 100, delay: 0, glitch: 0 },
  });
});

test('two-hand palm distance uses the staged 8–82–100 percent curve', () => {
  const left = hand({ palmX: 0.2 });
  const closed = performanceEffectsFromHands({
    Left: left,
    Right: hand({ palmX: 0.325 }),
  });
  const normal = performanceEffectsFromHands({
    Left: left,
    Right: hand({ palmX: 0.42 }),
  });
  const open = performanceEffectsFromHands({
    Left: left,
    Right: hand({ palmX: 0.475 }),
  });

  assert.equal(closed.lowPass, 0.08);
  assert.equal(normal.lowPass, 0.82);
  assert.equal(normal.percentages.lowPass, 82);
  assert.equal(open.lowPass, 1);
  assert.equal(normalizedPalmDistance({ Left: left, Right: hand({ palmX: 0.42 }) }), 2.2);
});

test('distance curve is monotonic and reaches full-open by 2.75 palm lengths', () => {
  const samples = [1, 1.25, 1.5, 2, 2.2, 2.4, 2.75, 3]
    .map(lowPassAmountFromDistance);
  for (let index = 1; index < samples.length; index += 1) {
    assert.ok(samples[index] >= samples[index - 1]);
  }
  assert.equal(samples[1], 0.08);
  assert.equal(samples[4], 0.82);
  assert.equal(samples[6], 1);
});

test('thumb-middle and thumb-ring pinches control distinct effects', () => {
  const delayPinch = performanceEffectsFromHands({
    Left: hand({ middleDistance: 0.15, ringDistance: 0.85 }),
  });
  const glitchPinch = performanceEffectsFromHands({
    Left: hand({ middleDistance: 0.85, ringDistance: 0.15 }),
  });
  const halfDelay = performanceEffectsFromHands({
    Left: hand({ middleDistance: 0.5, ringDistance: 0.85 }),
  });

  assert.equal(delayPinch.delay, 1);
  assert.equal(delayPinch.glitch, 0);
  assert.equal(glitchPinch.delay, 0);
  assert.equal(glitchPinch.glitch, 1);
  assert.ok(Math.abs(halfDelay.delay - 0.5) < 1e-9);
  assert.equal(halfDelay.percentages.delay, 50);
});

test('equivalent physical gestures map identically at 4:3 and 16:9', () => {
  const fourThree = performanceEffectsFromHands(
    physicalGesture(640, 480),
    { aspectRatio: 640 / 480 },
  );
  const sixteenNine = performanceEffectsFromHands(
    physicalGesture(1280, 720),
    { aspectRatio: 1280 / 720 },
  );

  assert.deepEqual(fourThree, sixteenNine);
  assert.equal(fourThree.lowPass, 1);
  assert.equal(fourThree.delay, 0.5);
  assert.equal(fourThree.glitch, 0);
  assert.deepEqual(fourThree.percentages, { lowPass: 100, delay: 50, glitch: 0 });
});

test('low-pass controller adds hysteresis, time smoothing, and immediate reset', () => {
  const controller = new LowPassGestureController({ timeConstantMs: 100 });
  assert.equal(controller.updateDistance(2.6, { now: 0 }), 1);
  assert.equal(controller.engaged, false);

  const entering = controller.updateDistance(2.4, { now: 16 });
  assert.equal(controller.engaged, true);
  assert.ok(entering < 1 && entering > lowPassAmountFromDistance(2.4));

  const stillEngaged = controller.updateDistance(2.6, { now: 116 });
  assert.equal(controller.engaged, true);
  assert.ok(stillEngaged < 1);

  controller.updateDistance(2.75, { now: 216 });
  assert.equal(controller.engaged, false);
  assert.equal(controller.reset(), 1);
  assert.equal(controller.value, 1);
});

test('a physically released ring finger stays outside the glitch range on wide video', () => {
  const effects = performanceEffectsFromHands(
    { Left: physicalHand({ width: 1280, height: 720, palmX: 240, ringDistance: 0.85 }) },
    { aspectRatio: 1280 / 720 },
  );

  assert.equal(effects.glitch, 0);
  assert.equal(effects.percentages.glitch, 0);
});

test('invalid aspect ratios fall back to square normalized coordinates', () => {
  const hands = { Left: hand({ middleDistance: 0.5, ringDistance: 0.85 }) };
  const expected = performanceEffectsFromHands(hands);

  for (const aspectRatio of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.deepEqual(performanceEffectsFromHands(hands, { aspectRatio }), expected);
  }
});
