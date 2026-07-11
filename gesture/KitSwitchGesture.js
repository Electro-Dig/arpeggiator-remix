export class KitSwitchGesture {
  constructor({ holdMs = 500, openWindowMs = 1200, cooldownMs = 800 } = {}) {
    Object.assign(this, { holdMs, openWindowMs, cooldownMs });
    this.reset();
  }

  reset() {
    this.phase = 'idle';
    this.fistSince = null;
    this.deadline = 0;
    this.cooldownUntil = 0;
  }

  update({ isFist, isOpen, now }) {
    const result = {
      armed: false,
      triggered: false,
      suppressDrums: this.phase === 'armed' || Boolean(isFist),
    };

    if (this.phase === 'cooldown') {
      if (now < this.cooldownUntil) return result;
      this.phase = 'idle';
      this.fistSince = null;
    }

    if (this.phase === 'armed') {
      if (now > this.deadline) {
        this.phase = 'idle';
        this.fistSince = null;
        return { armed: false, triggered: false, suppressDrums: Boolean(isFist) };
      }
      if (isOpen) {
        this.phase = 'cooldown';
        this.cooldownUntil = now + this.cooldownMs;
        this.fistSince = null;
        return { armed: false, triggered: true, suppressDrums: false };
      }
      return result;
    }

    if (!isFist) {
      this.fistSince = null;
      return result;
    }
    if (this.fistSince === null) this.fistSince = now;
    if (now - this.fistSince >= this.holdMs) {
      this.phase = 'armed';
      this.deadline = now + this.openWindowMs;
      result.armed = true;
      result.suppressDrums = true;
    }
    return result;
  }
}
