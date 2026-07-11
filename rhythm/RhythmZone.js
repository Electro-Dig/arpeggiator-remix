export const RIGHT_HAND_ZONE = Object.freeze({
  left: 0.56,
  right: 0.94,
  top: 0.18,
  bottom: 0.84,
});

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
const stableUnit = (value) => Math.round(value * 1e12) / 1e12;

export class RhythmZone {
  constructor(bounds = RIGHT_HAND_ZONE) {
    this.bounds = Object.freeze({ ...bounds });
  }

  map(screenX, screenY) {
    const { left, right, top, bottom } = this.bounds;
    const x = stableUnit((clamp(screenX, left, right) - left) / (right - left));
    const y = stableUnit((clamp(screenY, top, bottom) - top) / (bottom - top));
    return { x, y };
  }
}
