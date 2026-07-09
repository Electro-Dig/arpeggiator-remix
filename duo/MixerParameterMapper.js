export function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function mapLinear(value, min, max) {
  const t = clamp01(value);
  return min + (max - min) * t;
}

export function mapExponential(value, min, max) {
  const t = clamp01(value);
  return min * Math.pow(max / min, t);
}

export function mapFilterCutoff(normX) {
  return mapExponential(normX, 300, 8000);
}

export function mapReverbWet(normY) {
  return Number(mapLinear(1 - clamp01(normY), 0.05, 0.55).toFixed(4));
}

export function mapDelayFromDistance(normDistance) {
  return {
    wet: Number(mapLinear(normDistance, 0, 0.45).toFixed(4)),
    feedback: Number(mapLinear(normDistance, 0.15, 0.65).toFixed(4)),
  };
}

export function smoothValue(current, target, factor = 0.2) {
  const t = clamp01(factor);
  return current + (target - current) * t;
}
