import * as Tone from './tone.js';

const LOW_PASS_MIN_HZ = 220;
const LOW_PASS_MAX_HZ = 18000;
const DELAY_SECONDS = 0.25;
const BROADCAST_REVERB_MAX_WET = 0.45;

function clampAmount(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.round(Math.max(0, Math.min(1, number)) * 1000) / 1000;
}

function buildEffectState({ lowPass, delay, glitch, broadcastBuild }) {
  const percentages = {
    lowPass: Math.round(lowPass * 100),
    delay: Math.round(delay * 100),
    glitch: Math.round(glitch * 100),
    broadcastBuild: Math.round(broadcastBuild * 100),
  };
  const frequencyHz = Math.round(
    LOW_PASS_MIN_HZ * Math.pow(LOW_PASS_MAX_HZ / LOW_PASS_MIN_HZ, lowPass),
  );
  const delayWet = Math.round(delay * 0.7 * 1000) / 1000;
  const delayFeedback = Math.round((0.28 + delay * 0.3) * 1000) / 1000;
  const glitchWet = Math.round(glitch * 0.85 * 1000) / 1000;
  const glitchBits = Math.round(16 - glitch * 12);
  const reverbWet = Math.round(broadcastBuild * BROADCAST_REVERB_MAX_WET * 1000) / 1000;

  return {
    lowPass: { amount: lowPass, percent: percentages.lowPass, frequencyHz },
    delay: {
      amount: delay,
      percent: percentages.delay,
      wet: delayWet,
      feedback: delayFeedback,
      seconds: DELAY_SECONDS,
    },
    glitch: {
      amount: glitch,
      percent: percentages.glitch,
      wet: glitchWet,
      bits: glitchBits,
    },
    broadcastBuild: {
      amount: broadcastBuild,
      percent: percentages.broadcastBuild,
      wet: reverbWet,
    },
    percentages,
    label: `LP ${percentages.lowPass}% · DLY ${percentages.delay}% · GLT ${percentages.glitch}% · RVB ${percentages.broadcastBuild}%`,
  };
}

class AudioBus extends EventTarget {
  constructor() {
    super();
    this.ready = false;
    this.startPromise = null;

    this.input = new Tone.Gain(1);
    this.lowPassFilter = new Tone.Filter({
      type: 'lowpass',
      frequency: LOW_PASS_MAX_HZ,
      Q: 0.7,
    });
    this.performanceDelay = new Tone.FeedbackDelay(DELAY_SECONDS, 0.28);
    this.glitchCrusher = new Tone.BitCrusher(16);
    this.broadcastReverb = new Tone.Reverb({ decay: 3.4, preDelay: 0.025, wet: 0 });
    this.impactSynth = new Tone.MembraneSynth({
      pitchDecay: 0.035,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.32, sustain: 0, release: 0.6 },
      volume: -10,
    });
    this.limiter = new Tone.Limiter(-1);
    this.analyser = new Tone.Analyser('waveform', 1024);
    this.mediaDestination = Tone.getContext().rawContext.createMediaStreamDestination();
    this.effectState = buildEffectState({ lowPass: 1, delay: 0, glitch: 0, broadcastBuild: 0 });

    this.performanceDelay.wet.value = 0;
    this.glitchCrusher.wet.value = 0;
    this.broadcastReverb.wet.value = 0;
    this.input.connect(this.lowPassFilter);
    this.lowPassFilter.connect(this.performanceDelay);
    this.performanceDelay.connect(this.glitchCrusher);
    this.glitchCrusher.connect(this.broadcastReverb);
    this.broadcastReverb.connect(this.limiter);
    this.impactSynth.connect(this.limiter);
    this.limiter.connect(this.analyser);
    this.limiter.toDestination();
    this.limiter.connect(this.mediaDestination);
  }

  async start() {
    if (this.ready) return this;
    if (!this.startPromise) {
      this.startPromise = Tone.start()
        .then(() => {
          this.ready = true;
          return this;
        })
        .catch((error) => {
          this.startPromise = null;
          throw error;
        });
    }
    return this.startPromise;
  }

  get recordingStream() {
    return this.mediaDestination.stream;
  }

  setPerformanceEffects(effects = {}) {
    const previous = this.effectState;
    const amounts = {
      lowPass: clampAmount(effects.lowPass, previous.lowPass.amount),
      delay: clampAmount(effects.delay, previous.delay.amount),
      glitch: clampAmount(effects.glitch, previous.glitch.amount),
      broadcastBuild: clampAmount(effects.broadcastBuild, previous.broadcastBuild.amount),
    };
    const changed = amounts.lowPass !== previous.lowPass.amount
      || amounts.delay !== previous.delay.amount
      || amounts.glitch !== previous.glitch.amount
      || amounts.broadcastBuild !== previous.broadcastBuild.amount;
    if (!changed) return this.getEffectState();

    const next = buildEffectState(amounts);
    const statusChanged = next.label !== previous.label;

    this.lowPassFilter.frequency.rampTo(next.lowPass.frequencyHz, 0.05);
    this.performanceDelay.wet.rampTo(next.delay.wet, 0.05);
    this.performanceDelay.feedback.rampTo(next.delay.feedback, 0.05);
    this.glitchCrusher.bits.value = next.glitch.bits;
    this.glitchCrusher.wet.rampTo(next.glitch.wet, 0.05);
    this.broadcastReverb.wet.rampTo(next.broadcastBuild.wet, 0.08);
    this.effectState = next;
    if (statusChanged) this.emitEffectChange();
    return this.getEffectState();
  }

  setLowPassAmount(amount) {
    return this.setPerformanceEffects({ lowPass: amount });
  }

  setDelayAmount(amount) {
    return this.setPerformanceEffects({ delay: amount });
  }

  setGlitchAmount(amount) {
    return this.setPerformanceEffects({ glitch: amount });
  }

  setBroadcastBuild(amount) {
    return this.setPerformanceEffects({ broadcastBuild: amount });
  }

  triggerBroadcastImpact(amount = 1) {
    if (!this.ready || !this.impactSynth) return false;
    const velocity = 0.45 + clampAmount(amount, 1) * 0.4;
    const when = Tone.Transport.state === 'started'
      ? Tone.Transport.nextSubdivision('8n')
      : Tone.now();
    this.impactSynth.triggerAttackRelease('C1', '8n', when, velocity);
    return true;
  }

  resetBroadcastEffects() {
    return this.setBroadcastBuild(0);
  }

  getEffectState() {
    return {
      lowPass: { ...this.effectState.lowPass },
      delay: { ...this.effectState.delay },
      glitch: { ...this.effectState.glitch },
      broadcastBuild: { ...this.effectState.broadcastBuild },
      percentages: { ...this.effectState.percentages },
      label: this.effectState.label,
    };
  }

  onEffectChange(listener) {
    const handler = ({ detail }) => listener(detail);
    this.addEventListener('effectchange', handler);
    return () => this.removeEventListener('effectchange', handler);
  }

  emitEffectChange() {
    this.dispatchEvent(new CustomEvent('effectchange', { detail: this.getEffectState() }));
  }
}

export const audioBus = new AudioBus();
