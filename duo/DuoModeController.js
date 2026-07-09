import { HandRoleAssigner } from './HandRoleAssigner.js';

function noop() {}

function emptyRoleState() {
  return {
    performerMelody: null,
    performerDrums: null,
    mixerFilter: null,
    mixerSpace: null,
  };
}

export class DuoModeController {
  constructor({
    assignerOptions,
    handlePerformerMelody = noop,
    handlePerformerDrums = noop,
    handleMixer = noop,
    handleOverlay = noop,
  } = {}) {
    this.enabled = false;
    this.assigner = new HandRoleAssigner(assignerOptions);
    this.handlePerformerMelody = handlePerformerMelody;
    this.handlePerformerDrums = handlePerformerDrums;
    this.handleMixer = handleMixer;
    this.handleOverlay = handleOverlay;
  }

  setEnabled(nextEnabled) {
    const enabled = Boolean(nextEnabled);
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    this.assigner.reset();
  }

  isEnabled() {
    return this.enabled;
  }

  update(hands, nowMs = performance.now(), context = {}) {
    if (!this.enabled) {
      return {
        enabled: false,
        roles: emptyRoleState(),
        waiting: { performer: [], mixer: [], deadZone: [] },
      };
    }

    const assignment = this.assigner.update(hands, nowMs);
    const { roles } = assignment;

    if (roles.performerMelody) {
      this.handlePerformerMelody({ hand: roles.performerMelody, roles, context });
    }
    if (roles.performerDrums) {
      this.handlePerformerDrums({ hand: roles.performerDrums, roles, context });
    }
    if (roles.mixerFilter || roles.mixerSpace) {
      this.handleMixer({ roles, context });
    }

    this.handleOverlay({ ...assignment, context });
    return { enabled: true, ...assignment };
  }
}
