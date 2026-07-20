import * as Tone from './audio/tone.js';
import { audioBus } from './audio/AudioBus.js';
import { DEFAULT_SCENE_ID, SCENES, getScene } from './music/scenes.js';
import { buildScale, noteAtPosition } from './music/scale-utils.js';
import { MELODY_TIMBRES, resolveTimbreIndex } from './music/timbres.js';

export class MusicManager extends EventTarget {
  constructor() {
    super();
    this.isStarted = false;
    this.startPromise = null;
    this.activePatterns = new Map();
    this.handVolumes = new Map();
    this.scene = getScene(DEFAULT_SCENE_ID);
    this.scale = buildScale(this.scene.tonic, this.scene.mode, 3, 5);
    this.currentTimbreIndex = 0;
    this.currentRoot = this.scale[0];
    this.bassRoot = null;
    this.delayManualOverride = false;
    this.delayBeats = 0;
    this.delayWetManual = 0.18;
    this.melodyVolumeDb = -14;
    this.analyser = audioBus.analyser;
    this.sceneFilter = null;
    this.sceneDelay = null;
    this.sceneReverb = null;
    this.arpSynth = null;
    this.bassSynth = null;
    this.bassSequence = null;
    this.unsubscribeEffects = audioBus.onEffectChange(() => this.emitStatus());
  }

  start() {
    if (this.isStarted) return Promise.resolve(this);
    if (!this.startPromise) {
      this.startPromise = this.initialize().catch((error) => {
        this.startPromise = null;
        throw error;
      });
    }
    return this.startPromise;
  }

  async initialize() {
    await audioBus.start();
    this.sceneFilter = new Tone.Filter({ type: 'lowpass', frequency: 2600, Q: 1.2 });
    this.sceneDelay = new Tone.FeedbackDelay('8n.', 0.32);
    this.sceneReverb = new Tone.Reverb({ decay: 4.2, preDelay: 0.02, wet: 0.24 });
    this.arpSynth = new Tone.PolySynth(Tone.FMSynth, MELODY_TIMBRES[this.currentTimbreIndex].options);
    this.bassSynth = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      filter: { type: 'lowpass', Q: 1 },
      envelope: { attack: 0.01, decay: 0.18, sustain: 0.35, release: 0.25 },
      filterEnvelope: {
        attack: 0.01, decay: 0.15, sustain: 0.2, release: 0.2,
        baseFrequency: 70, octaves: 2.2,
      },
    });
    this.arpSynth.connect(this.sceneFilter);
    this.bassSynth.connect(this.sceneFilter);
    this.sceneFilter.connect(this.sceneDelay);
    this.sceneDelay.connect(this.sceneReverb);
    this.sceneReverb.connect(audioBus.input);
    this.arpSynth.volume.value = this.melodyVolumeDb;
    this.bassSynth.volume.value = -22;
    this.sceneDelay.wet.value = this.delayWetManual;
    this.bassSequence = new Tone.Sequence((time, step) => {
      const interval = this.scene?.bass?.[step];
      if (interval === null || interval === undefined || !this.bassRoot) return;
      const note = Tone.Frequency(this.bassRoot).transpose(interval - 12).toNote();
      this.bassSynth.triggerAttackRelease(note, '16n', time, 0.3);
    }, [0, 1, 2, 3, 4, 5, 6, 7], '8n').start(0);
    this.isStarted = true;
    this.setScene(DEFAULT_SCENE_ID);
    Tone.Transport.start();
    return this;
  }

  sceneSequence() {
    return this.scene.sequence;
  }

  notesForRoot(rootNote) {
    return this.sceneSequence().map((interval) => (
      interval === null ? null : Tone.Frequency(rootNote).transpose(interval).toNote()
    ));
  }

  startArpeggio(handId, rootNote) {
    if (!this.arpSynth || this.activePatterns.has(handId)) return;
    const pattern = new Tone.Pattern((time, note) => {
      if (note === null) return;
      const velocity = this.handVolumes.get(handId) ?? 0.2;
      this.arpSynth.triggerAttackRelease(note, Tone.Time('16n').toSeconds() * 0.82, time, velocity);
    }, this.notesForRoot(rootNote), 'up');
    pattern.interval = '16n';
    pattern.start(0);
    this.activePatterns.set(handId, { pattern, currentRoot: rootNote });
  }

  updateArpeggio(handId, newRootNote) {
    const active = this.activePatterns.get(handId);
    if (!this.arpSynth || !active || active.currentRoot === newRootNote) return;
    active.pattern.values = this.notesForRoot(newRootNote);
    active.currentRoot = newRootNote;
  }

  updateArpeggioVolume(handId, velocity) {
    if (!this.activePatterns.has(handId)) return;
    this.handVolumes.set(handId, Math.max(0, Math.min(1, Number(velocity) || 0)));
  }

  stopArpeggio(handId) {
    const active = this.activePatterns.get(handId);
    if (active) {
      active.pattern.stop(0);
      active.pattern.dispose();
      this.activePatterns.delete(handId);
      this.handVolumes.delete(handId);
    }
    if (handId === 'Left' || handId === 0) {
      this.bassRoot = null;
      this.bassSynth?.triggerRelease();
    }
  }

  stopAllArpeggios() {
    for (const handId of [...this.activePatterns.keys()]) this.stopArpeggio(handId);
    this.bassRoot = null;
    this.bassSynth?.triggerRelease();
  }

  setScene(id) {
    const selected = getScene(id);
    this.stopAllArpeggios();
    this.scene = selected;
    this.scale = buildScale(selected.tonic, selected.mode, 3, 5);
    this.currentRoot = this.scale[0];
    if (this.isStarted) Tone.Transport.bpm.rampTo(selected.bpm, 0.15);
    this.emitStatus();
    return selected;
  }

  cycleScene() {
    const index = SCENES.findIndex(({ id }) => id === this.scene.id);
    return this.setScene(SCENES[(index + 1) % SCENES.length].id);
  }

  setTimbre(value = this.currentTimbreIndex, { emit = true } = {}) {
    this.currentTimbreIndex = resolveTimbreIndex(value, this.currentTimbreIndex);
    const selected = MELODY_TIMBRES[this.currentTimbreIndex];
    if (this.arpSynth) this.arpSynth.set(selected.options);
    if (emit) this.emitStatus();
    return selected.name;
  }

  cycleTimbre() {
    return this.setTimbre(this.currentTimbreIndex + 1);
  }

  setRootFromPosition(normalizedY) {
    const note = noteAtPosition(this.scale, normalizedY);
    const rootChanged = note !== this.currentRoot;
    if (this.activePatterns.has('Left')) this.updateArpeggio('Left', note);
    else this.startArpeggio('Left', note);
    this.currentRoot = note;
    this.bassRoot = note;
    if (rootChanged) this.emitStatus();
    return note;
  }

  setBrightness(normalizedX) {
    const value = Math.max(0, Math.min(1, Number(normalizedX) || 0));
    const frequency = 250 * Math.pow(8000 / 250, value);
    this.sceneFilter?.frequency.rampTo(frequency, 0.04);
    return frequency;
  }

  setDelayTimeBeats(beats, options) {
    this.delayBeats = Math.max(0, Number(beats) || 0);
    if (!options || options.manual !== false) this.delayManualOverride = true;
    if (this.sceneDelay) {
      const bpm = Tone.Transport.bpm.value || 120;
      this.sceneDelay.delayTime.rampTo((60 / bpm) * this.delayBeats, 0.04);
    }
  }

  setDelayWet(wet, options) {
    this.delayWetManual = Math.max(0, Math.min(0.7, Number(wet) || 0));
    if (!options || options.manual !== false) this.delayManualOverride = true;
    this.sceneDelay?.wet.rampTo(this.delayWetManual, 0.04);
  }

  setPerformanceEffects(effects) {
    return audioBus.setPerformanceEffects(effects);
  }

  setLowPassAmount(amount) {
    return audioBus.setLowPassAmount(amount);
  }

  setDelayAmount(amount) {
    return audioBus.setDelayAmount(amount);
  }

  setGlitchAmount(amount) {
    return audioBus.setGlitchAmount(amount);
  }

  setBroadcastBuild(amount) {
    return audioBus.setBroadcastBuild(amount);
  }

  triggerBroadcastImpact(amount) {
    return audioBus.triggerBroadcastImpact(amount);
  }

  resetBroadcastEffects() {
    return audioBus.resetBroadcastEffects();
  }

  setMelodyVolume(dB) {
    const number = Number(dB);
    if (!Number.isFinite(number)) return this.melodyVolumeDb;
    const next = Math.max(-36, Math.min(0, number));
    if (next === this.melodyVolumeDb) return next;
    this.melodyVolumeDb = next;
    this.arpSynth?.volume.rampTo(next, 0.04);
    this.emitStatus();
    return next;
  }

  getAnalyser() {
    return this.analyser;
  }

  getCurrentMusicPreset() {
    return { ...this.scene, tempo: this.scene.bpm, scale: [...this.scale] };
  }

  getSynthName() {
    return MELODY_TIMBRES[this.currentTimbreIndex].name;
  }

  getStatus() {
    return {
      sceneId: this.scene.id,
      sceneName: this.scene.name,
      synthName: this.getSynthName(),
      timbreId: MELODY_TIMBRES[this.currentTimbreIndex].id,
      timbreIndex: this.currentTimbreIndex,
      tempo: this.scene.bpm,
      rootNote: this.currentRoot,
      melodyVolumeDb: this.melodyVolumeDb,
      effects: audioBus.getEffectState(),
      effectsLabel: audioBus.getEffectState().label,
    };
  }

  onStatusChange(listener) {
    const handler = ({ detail }) => listener(detail);
    this.addEventListener('statuschange', handler);
    return () => this.removeEventListener('statuschange', handler);
  }

  emitStatus() {
    this.dispatchEvent(new CustomEvent('statuschange', { detail: this.getStatus() }));
  }
}
