const DEFAULT_OPTIONS = {
  leftMaxX: 0.47,
  rightMinX: 0.53,
  holdMs: 700,
  lostMs: 1500,
};

const ROLE_ORDER = {
  performer: ['performerMelody', 'performerDrums'],
  mixer: ['mixerFilter', 'mixerSpace'],
};

function emptyRoles() {
  return {
    performerMelody: null,
    performerDrums: null,
    mixerFilter: null,
    mixerSpace: null,
  };
}

function normalizeHand(input) {
  const palm = input.palm || input.anchor || input.landmarks?.[9] || { x: 0.5, y: 0.5 };
  return {
    id: input.id ?? input.trackingIndex,
    trackingIndex: input.trackingIndex,
    palm: { x: palm.x, y: palm.y },
    landmarks: input.landmarks || [],
    raw: input.raw || input,
  };
}

function sideForHand(hand, options) {
  if (hand.palm.x < options.leftMaxX) return 'performer';
  if (hand.palm.x > options.rightMinX) return 'mixer';
  return 'deadZone';
}

export class HandRoleAssigner {
  constructor(options = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.roles = emptyRoles();
    this.pending = new Map();
    this.lastSeenByRole = new Map();
    this.lockedSideByHandId = new Map();
  }

  reset() {
    this.roles = emptyRoles();
    this.pending.clear();
    this.lastSeenByRole.clear();
    this.lockedSideByHandId.clear();
  }

  update(inputHands, nowMs = performance.now()) {
    const hands = inputHands.map(normalizeHand);
    const handsById = new Map(hands.map((hand) => [hand.id, hand]));
    const grouped = { performer: [], mixer: [], deadZone: [] };

    for (const hand of hands) {
      const lockedSide = this.lockedSideByHandId.get(hand.id);
      const side = sideForHand(hand, this.options);
      if (side === 'deadZone' && lockedSide) {
        grouped[lockedSide].push(hand);
        grouped.deadZone.push(hand);
      } else if (side === 'deadZone') {
        grouped.deadZone.push(hand);
      } else {
        grouped[side].push(hand);
      }
    }

    this.releaseLostRoles(handsById, nowMs);
    this.assignSide('performer', grouped.performer, nowMs);
    this.assignSide('mixer', grouped.mixer, nowMs);

    return {
      roles: { ...this.roles },
      waiting: {
        performer: grouped.performer,
        mixer: grouped.mixer,
        deadZone: grouped.deadZone,
      },
    };
  }

  releaseLostRoles(handsById, nowMs) {
    for (const role of Object.keys(this.roles)) {
      const hand = this.roles[role];
      if (!hand) continue;
      if (handsById.has(hand.id)) {
        this.lastSeenByRole.set(role, nowMs);
        continue;
      }

      const lastSeen = this.lastSeenByRole.get(role) ?? nowMs;
      if (nowMs - lastSeen > this.options.lostMs) {
        this.lockedSideByHandId.delete(hand.id);
        this.roles[role] = null;
        this.lastSeenByRole.delete(role);
      }
    }
  }

  assignSide(side, hands, nowMs) {
    const sortedHands = [...hands].sort((a, b) => a.palm.x - b.palm.x);
    const roleNames = ROLE_ORDER[side];
    const reservedHandIds = new Set(Object.values(this.roles).filter(Boolean).map((hand) => hand.id));

    for (let i = 0; i < roleNames.length; i += 1) {
      const role = roleNames[i];
      const current = this.roles[role];
      if (current && sortedHands.some((hand) => hand.id === current.id)) {
        const updated = sortedHands.find((hand) => hand.id === current.id);
        this.roles[role] = updated;
        this.lastSeenByRole.set(role, nowMs);
        reservedHandIds.add(updated.id);
        continue;
      }

      if (current) continue;

      const candidate = sortedHands.find((hand) => !reservedHandIds.has(hand.id));
      if (!candidate) continue;
      reservedHandIds.add(candidate.id);

      const pendingKey = `${role}:${candidate.id}`;
      const firstSeen = this.pending.get(pendingKey) ?? nowMs;
      this.pending.set(pendingKey, firstSeen);

      if (nowMs - firstSeen >= this.options.holdMs) {
        this.roles[role] = candidate;
        this.lastSeenByRole.set(role, nowMs);
        this.lockedSideByHandId.set(candidate.id, side);
      }
    }
  }
}
