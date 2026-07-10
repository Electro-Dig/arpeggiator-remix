export function pinchVelocity(landmarks) {
  if (!landmarks?.[4] || !landmarks?.[8] || !landmarks?.[0] || !landmarks?.[9]) return 0;
  const pinch = Math.hypot(
    landmarks[4].x - landmarks[8].x,
    landmarks[4].y - landmarks[8].y,
  );
  const palm = Math.max(0.001, Math.hypot(
    landmarks[0].x - landmarks[9].x,
    landmarks[0].y - landmarks[9].y,
  ));
  return Math.max(0, Math.min(1, (pinch / palm - 0.12) / 0.9));
}

export class EdgeGesture {
  constructor(cooldownMs = 700) {
    this.previous = false;
    this.lastAt = -Infinity;
    this.cooldownMs = cooldownMs;
  }

  update(active, now) {
    const next = Boolean(active);
    const fired = next && !this.previous && now - this.lastAt >= this.cooldownMs;
    this.previous = next;
    if (fired) this.lastAt = now;
    return fired;
  }
}
