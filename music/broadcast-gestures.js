const BUILD_START_Y = 0.6;
const BUILD_FULL_Y = 0.2;

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function quantize(value) {
  return Math.round(clamp01(value) * 1000) / 1000;
}

function averagePalmY(handsBySide = {}) {
  const leftY = Number(handsBySide?.Left?.landmarks?.[9]?.y);
  const rightY = Number(handsBySide?.Right?.landmarks?.[9]?.y);
  if (!Number.isFinite(leftY) || !Number.isFinite(rightY)) return null;
  return (leftY + rightY) / 2;
}

export function broadcastBuildFromHands(handsBySide = {}, {
  startY = BUILD_START_Y,
  fullY = BUILD_FULL_Y,
} = {}) {
  const palmY = averagePalmY(handsBySide);
  if (palmY === null) return 0;
  const range = Math.max(0.001, Number(startY) - Number(fullY));
  return quantize((Number(startY) - palmY) / range);
}

export class BroadcastGestureController {
  constructor({
    startY = BUILD_START_Y,
    fullY = BUILD_FULL_Y,
    armThreshold = 0.75,
    holdMs = 350,
    dropY = 0.62,
    dropVelocityPerMs = 0.001,
    armedTimeoutMs = 1_500,
    cooldownMs = 2_000,
  } = {}) {
    this.startY = startY;
    this.fullY = fullY;
    this.armThreshold = armThreshold;
    this.holdMs = holdMs;
    this.dropY = dropY;
    this.dropVelocityPerMs = dropVelocityPerMs;
    this.armedTimeoutMs = armedTimeoutMs;
    this.cooldownMs = cooldownMs;
    this.reset();
  }

  reset() {
    this.armStartedAt = null;
    this.armedAt = null;
    this.lastPalmY = null;
    this.lastNow = null;
    this.lastImpactAt = -Infinity;
    return { build: 0, impact: false, phase: 'idle' };
  }

  clearBuild() {
    this.armStartedAt = null;
    this.armedAt = null;
  }

  update(handsBySide = {}, now = 0) {
    const timestamp = Number.isFinite(Number(now)) ? Number(now) : 0;
    const palmY = averagePalmY(handsBySide);
    if (palmY === null) {
      this.clearBuild();
      this.lastPalmY = null;
      this.lastNow = null;
      return { build: 0, impact: false, phase: 'idle' };
    }

    const build = broadcastBuildFromHands(handsBySide, {
      startY: this.startY,
      fullY: this.fullY,
    });
    const elapsed = this.lastNow === null ? 0 : Math.max(1, timestamp - this.lastNow);
    const downwardVelocity = this.lastPalmY === null
      ? 0
      : (palmY - this.lastPalmY) / elapsed;
    let impact = false;

    if (this.armedAt !== null) {
      if (timestamp - this.armedAt > this.armedTimeoutMs) {
        this.clearBuild();
      } else if (palmY >= this.dropY && downwardVelocity >= this.dropVelocityPerMs) {
        if (timestamp - this.lastImpactAt >= this.cooldownMs) {
          impact = true;
          this.lastImpactAt = timestamp;
        }
        this.clearBuild();
      }
    }

    if (!impact && this.armedAt === null) {
      if (build >= this.armThreshold) {
        if (this.armStartedAt === null) this.armStartedAt = timestamp;
        if (timestamp - this.armStartedAt >= this.holdMs) this.armedAt = timestamp;
      } else {
        this.armStartedAt = null;
      }
    }

    this.lastPalmY = palmY;
    this.lastNow = timestamp;
    const phase = impact
      ? 'impact'
      : this.armedAt !== null
        ? 'armed'
        : build > 0 ? 'building' : 'idle';
    return { build, impact, phase };
  }
}
