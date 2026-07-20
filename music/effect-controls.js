const PALM_DISTANCE_CLOSED = 1.25;
const PALM_DISTANCE_NORMAL = 2.2;
const PALM_DISTANCE_OPEN = 2.75;
const LOW_PASS_CLOSED = 0.08;
const LOW_PASS_NORMAL = 0.82;
const PINCH_FULL = 0.15;
const PINCH_RELEASED = 0.85;

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function quantize(value) {
  return Math.round(clamp01(value) * 1000) / 1000;
}

function round3(value) {
  return Math.round(Number(value) * 1000) / 1000;
}

function normalizeAspectRatio(value) {
  const ratio = Number(value);
  return Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
}

function distance(a, b, aspectRatio = 1) {
  if (![a?.x, a?.y, b?.x, b?.y].every(Number.isFinite)) return null;
  return Math.hypot((a.x - b.x) * aspectRatio, a.y - b.y);
}

function palmSize(landmarks, aspectRatio) {
  const size = distance(landmarks?.[0], landmarks?.[9], aspectRatio);
  return size && size > 0.001 ? size : null;
}

function pinchAmount(landmarks, fingerTip, aspectRatio) {
  const size = palmSize(landmarks, aspectRatio);
  const pinchDistance = distance(landmarks?.[4], landmarks?.[fingerTip], aspectRatio);
  if (!size || pinchDistance === null) return 0;
  const normalizedDistance = pinchDistance / size;
  return quantize((PINCH_RELEASED - normalizedDistance) / (PINCH_RELEASED - PINCH_FULL));
}

function smoothstep(value) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

export function lowPassAmountFromDistance(distanceValue) {
  if (distanceValue === null || distanceValue === undefined) return 1;
  const value = Number(distanceValue);
  if (!Number.isFinite(value)) return 1;
  if (value <= PALM_DISTANCE_CLOSED) return LOW_PASS_CLOSED;
  if (value < PALM_DISTANCE_NORMAL) {
    const t = smoothstep(
      (value - PALM_DISTANCE_CLOSED) / (PALM_DISTANCE_NORMAL - PALM_DISTANCE_CLOSED),
    );
    return quantize(LOW_PASS_CLOSED + (LOW_PASS_NORMAL - LOW_PASS_CLOSED) * t);
  }
  if (value < PALM_DISTANCE_OPEN) {
    const t = smoothstep(
      (value - PALM_DISTANCE_NORMAL) / (PALM_DISTANCE_OPEN - PALM_DISTANCE_NORMAL),
    );
    return quantize(LOW_PASS_NORMAL + (1 - LOW_PASS_NORMAL) * t);
  }
  return 1;
}

export function normalizedPalmDistance(handsBySide = {}, { aspectRatio = 1 } = {}) {
  const ratio = normalizeAspectRatio(aspectRatio);
  const left = handsBySide?.Left?.landmarks;
  const right = handsBySide?.Right?.landmarks;
  const leftSize = palmSize(left, ratio);
  const rightSize = palmSize(right, ratio);
  const handDistance = distance(left?.[9], right?.[9], ratio);
  if (!leftSize || !rightSize || handDistance === null) return null;
  return round3(handDistance / ((leftSize + rightSize) / 2));
}

export class LowPassGestureController {
  constructor({ timeConstantMs = 100, enterDistance = 2.55, exitDistance = 2.75 } = {}) {
    this.timeConstantMs = Math.max(1, Number(timeConstantMs) || 100);
    this.enterDistance = enterDistance;
    this.exitDistance = exitDistance;
    this.reset();
  }

  reset() {
    this.value = 1;
    this.engaged = false;
    this.lastNow = null;
    return this.value;
  }

  updateDistance(distanceValue, { now = 0 } = {}) {
    const distanceNumber = Number(distanceValue);
    if (!Number.isFinite(distanceNumber)) return this.reset();
    if (this.engaged) {
      if (distanceNumber >= this.exitDistance) this.engaged = false;
    } else if (distanceNumber < this.enterDistance) {
      this.engaged = true;
    }
    const target = this.engaged ? lowPassAmountFromDistance(distanceNumber) : 1;
    const timestamp = Number.isFinite(Number(now)) ? Number(now) : 0;
    const elapsed = this.lastNow === null
      ? 16
      : Math.max(0, Math.min(250, timestamp - this.lastNow));
    this.lastNow = timestamp;
    const alpha = 1 - Math.exp(-elapsed / this.timeConstantMs);
    this.value = quantize(this.value + (target - this.value) * alpha);
    if (!this.engaged && Math.abs(1 - this.value) < 0.001) this.value = 1;
    return this.value;
  }
}

export function performanceEffectsFromHands(handsBySide = {}, { aspectRatio = 1 } = {}) {
  const ratio = normalizeAspectRatio(aspectRatio);
  const left = handsBySide?.Left?.landmarks;
  const palmDistance = normalizedPalmDistance(handsBySide, { aspectRatio: ratio });
  const lowPass = lowPassAmountFromDistance(palmDistance);
  const delay = left ? pinchAmount(left, 12, ratio) : 0;
  const glitch = left ? pinchAmount(left, 16, ratio) : 0;

  return {
    lowPass,
    delay,
    glitch,
    percentages: {
      lowPass: Math.round(lowPass * 100),
      delay: Math.round(delay * 100),
      glitch: Math.round(glitch * 100),
    },
  };
}
