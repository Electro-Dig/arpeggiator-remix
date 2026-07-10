function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function classifyThumbPose(landmarks) {
  if (!landmarks || landmarks.length < 21) return 'neutral';

  const palm = Math.max(distance(landmarks[0], landmarks[9]), 0.001);
  const otherFingersCurled = [[8, 6], [12, 10], [16, 14], [20, 18]]
    .every(([tip, pip]) => (
      distance(landmarks[tip], landmarks[0])
      < distance(landmarks[pip], landmarks[0]) + palm * 0.12
    ));
  const thumbExtended = distance(landmarks[4], landmarks[2]) > palm * 0.55;
  if (!otherFingersCurled || !thumbExtended) return 'neutral';

  const dy = landmarks[4].y - landmarks[2].y;
  if (dy < -palm * 0.35) return 'up';
  if (dy > palm * 0.35) return 'down';
  return 'neutral';
}

export function combineThumbPoses(handsBySide = {}) {
  const left = classifyThumbPose(handsBySide.Left?.landmarks);
  const right = classifyThumbPose(handsBySide.Right?.landmarks);
  if (left === 'up' && right === 'up') return 'both-up';
  if (left === 'down' && right === 'down') return 'both-down';
  return 'neutral';
}

export class GestureLatch {
  constructor({ holdMs = 800, neutralMs = 1000 } = {}) {
    this.holdMs = holdMs;
    this.neutralMs = neutralMs;
    this.reset();
  }

  reset() {
    this.candidate = 'neutral';
    this.since = 0;
    this.armed = true;
    this.neutralSince = 0;
    this.lastNow = 0;
  }

  update(intent, now) {
    this.lastNow = now;
    if (!this.armed) {
      if (intent !== 'neutral') {
        this.neutralSince = 0;
        return null;
      }
      if (!this.neutralSince) this.neutralSince = now;
      if (now - this.neutralSince >= this.neutralMs) {
        this.armed = true;
        this.candidate = 'neutral';
      }
      return null;
    }

    if (intent === 'neutral') {
      this.candidate = 'neutral';
      this.since = now;
      return null;
    }
    if (intent !== this.candidate) {
      this.candidate = intent;
      this.since = now;
      return null;
    }
    if (now - this.since < this.holdMs) return null;

    this.armed = false;
    this.neutralSince = 0;
    return intent;
  }

  get progress() {
    if (this.candidate === 'neutral' || !this.armed) return 0;
    return Math.max(0, Math.min(1, (this.lastNow - this.since) / this.holdMs));
  }
}
