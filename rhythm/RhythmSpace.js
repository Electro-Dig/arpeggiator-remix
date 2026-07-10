export class RhythmSpace {
  constructor({ smoothing = 0.25, hysteresis = 0.03 } = {}) {
    this.smoothing = smoothing;
    this.hysteresis = hysteresis;
    this.smoothX = null;
    this.smoothY = null;
    this.x = -1;
    this.y = -1;
  }

  axis(value, previous) {
    const clamped = Math.max(0, Math.min(1, Number(value) || 0));
    if (previous >= 0) {
      const low = previous / 7 - this.hysteresis;
      const high = (previous + 1) / 7 + this.hysteresis;
      if (clamped >= low && clamped <= high) return previous;
    }
    return Math.min(6, Math.floor(clamped * 7));
  }

  update(x, y) {
    const inputX = Math.max(0, Math.min(1, Number(x) || 0));
    const inputY = Math.max(0, Math.min(1, Number(y) || 0));
    this.smoothX = this.smoothX === null
      ? inputX
      : this.smoothX + (inputX - this.smoothX) * this.smoothing;
    this.smoothY = this.smoothY === null
      ? inputY
      : this.smoothY + (inputY - this.smoothY) * this.smoothing;
    const nextX = this.axis(this.smoothX, this.x);
    const nextY = this.axis(1 - this.smoothY, this.y);
    const changed = nextX !== this.x || nextY !== this.y;
    this.x = nextX;
    this.y = nextY;
    return { x: this.x, y: this.y, changed };
  }
}
