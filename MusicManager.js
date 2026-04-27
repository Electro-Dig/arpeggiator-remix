import * as Tone from 'https://esm.sh/tone';
import { clonePerformanceScenes } from './PerformanceScenes.js';

const SYNTH_NAMES = [
  'Analog Pad',
  'Bell Pad',
  'Juno 80s Bell Tingle',
  'Phlutterphase Hang',
  'Dizi C5 (Sampler)',
  'Guqin C4 (Sampler)',
  'Guzheng C4 (Sampler)',
  'Pipa E4 (Sampler)',
  'Pipa C4-1 (Sampler)',
  'Pipa C4-2 (Sampler)',
  'Sheng E4 (Sampler)'
];

function createDefaultSynthPresets() {
  return [
    {
      harmonicity: 1.0,
      modulationIndex: 1.5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.25, decay: 0.8, sustain: 0.78, release: 2.2 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.12, decay: 0.65, sustain: 0.58, release: 1.4 },
      effects: { reverbWet: 0.52, delayWet: 0.08 },
      baseVolumeDb: -8
    },
    {
      harmonicity: 3.5,
      modulationIndex: 5.2,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.08, decay: 1.2, sustain: 0.55, release: 2.5 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.02, decay: 0.95, sustain: 0.35, release: 1.8 },
      effects: { reverbWet: 0.58, delayWet: 0.12 },
      baseVolumeDb: -8
    },
    {
      harmonicity: 2.8,
      modulationIndex: 4.5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.04, decay: 0.85, sustain: 0.68, release: 1.8 },
      modulation: { type: 'triangle' },
      modulationEnvelope: { attack: 0.015, decay: 0.7, sustain: 0.52, release: 1.2 },
      effects: { reverbWet: 0.48, delayWet: 0.1 },
      baseVolumeDb: -8
    },
    {
      harmonicity: 5.0,
      modulationIndex: 7.0,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.015, decay: 1.5, sustain: 0.45, release: 2.8 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.008, decay: 1.2, sustain: 0.28, release: 2.0 },
      effects: { reverbWet: 0.62, delayWet: 0.14 },
      baseVolumeDb: -9
    },
    { engine: 'sampler', sampler: { urls: { C5: 'samples/di zi-c5.wav' }, attack: 0.02, release: 2.0 }, effects: { reverbWet: 0.55, delayWet: 0.08 }, baseVolumeDb: -15 },
    { engine: 'sampler', sampler: { urls: { C4: 'samples/gu qin_C4.wav' }, attack: 0.02, release: 2.2 }, effects: { reverbWet: 0.5, delayWet: 0.06 }, baseVolumeDb: -15 },
    { engine: 'sampler', sampler: { urls: { C4: 'samples/gu zheng--c4.wav' }, attack: 0.01, release: 1.8 }, effects: { reverbWet: 0.48, delayWet: 0.06 }, baseVolumeDb: -14 },
    { engine: 'sampler', sampler: { urls: { E4: 'samples/PIPA_E4.wav' }, attack: 0.01, release: 1.8 }, effects: { reverbWet: 0.48, delayWet: 0.06 }, baseVolumeDb: -9 },
    { engine: 'sampler', sampler: { urls: { C4: 'samples/pipa-c4-1.wav' }, attack: 0.01, release: 1.8 }, effects: { reverbWet: 0.48, delayWet: 0.06 }, baseVolumeDb: -9 },
    { engine: 'sampler', sampler: { urls: { C4: 'samples/pipa-c4-2.wav' }, attack: 0.01, release: 1.8 }, effects: { reverbWet: 0.48, delayWet: 0.06 }, baseVolumeDb: -10 },
    { engine: 'sampler', sampler: { urls: { E4: 'samples/Sheng-E4.wav' }, attack: 0.03, release: 2.4 }, effects: { reverbWet: 0.55, delayWet: 0.08 }, baseVolumeDb: -10 }
  ];
}

export class MusicManager {
  constructor() {
    this.polySynth = null;
    this.reverb = null;
    this.stereoDelay = null;
    this.analyser = null;
    this.masterLimiter = null;
    this._limiterInstalled = false;
    this.isStarted = false;

    this.activePatterns = new Map();
    this.handVolumes = new Map();

    this.musicPresets = clonePerformanceScenes();
    this.currentMusicPresetIndex = 0;

    this.synthPresets = createDefaultSynthPresets();
    this.currentSynthIndex = this._getSceneSynthIndex(this.musicPresets[this.currentMusicPresetIndex]);

    this.delayManualOverride = false;
    this.delayBeats = 0;
    this.delayWetManual = 0;

    this.noteLengthLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
    this.noteLengthLevelIndex = 4;
  }

  _getSceneSynthIndex(scene) {
    if (typeof scene?.synthPreset === 'number' && scene.synthPreset >= 0 && scene.synthPreset < this.synthPresets.length) {
      return scene.synthPreset;
    }
    return 0;
  }

  _getPatternInterval(preset = this.getCurrentMusicPreset()) {
    return preset?.stepInterval || '16n';
  }

  _getPatternBaseSeconds(preset = this.getCurrentMusicPreset()) {
    return Tone.Time(this._getPatternInterval(preset)).toSeconds();
  }

  async start() {
    if (this.isStarted) return;

    await Tone.start();

    if (!this._limiterInstalled) {
      this.masterLimiter = new Tone.Limiter(-1);
      Tone.Destination.chain(this.masterLimiter);
      this._limiterInstalled = true;
    }

    this.reverb = new Tone.Reverb({ decay: 5, preDelay: 0, wet: 0.4 }).toDestination();
    this.stereoDelay = new Tone.FeedbackDelay('8n', 0.5).connect(this.reverb);
    this.stereoDelay.wet.value = 0;
    this.analyser = new Tone.Analyser('waveform', 1024);

    this.polySynth = this._createInstrument(this.synthPresets[this.currentSynthIndex]);
    this.polySynth.connect(this.analyser);
    this.analyser.connect(this.stereoDelay);
    this._applyPresetAudioState(this.synthPresets[this.currentSynthIndex]);

    this.isStarted = true;
    Tone.Transport.bpm.value = this.getCurrentMusicPreset().tempo || 100;
    Tone.Transport.start();
    console.log('Tone.js AudioContext started and PolySynth is ready.');
  }

  _createInstrument(preset) {
    if (preset?.engine === 'sampler' && Tone.Sampler) {
      return new Tone.Sampler(preset.sampler || {});
    }
    return new Tone.PolySynth(Tone.FMSynth, preset);
  }

  _applyPresetAudioState(preset) {
    if (!this.polySynth) return;

    try {
      this.polySynth.volume.value = typeof preset?.baseVolumeDb === 'number' ? preset.baseVolumeDb : -12;
    } catch {
      this.polySynth.volume.value = -12;
    }

    if (this.reverb) {
      this.reverb.wet.value = preset?.effects?.reverbWet ?? 0.8;
    }
    if (this.stereoDelay) {
      this.stereoDelay.wet.value = preset?.effects?.delayWet ?? 0;
    }

    this._applyDelayOverride();
  }

  _applyDelayOverride() {
    if (!this.delayManualOverride || !this.stereoDelay) return;
    const bpm = Tone.Transport.bpm.value || 120;
    this.stereoDelay.delayTime.value = (60 / bpm) * (this.delayBeats || 0);
    this.stereoDelay.wet.value = this.delayWetManual;
  }

  _buildPatternNotes(rootNote, preset = this.getCurrentMusicPreset()) {
    if (Array.isArray(preset.sequence) && preset.sequence.length > 0) {
      return preset.sequence.map((interval) => (
        interval === null ? null : Tone.Frequency(rootNote).transpose(interval).toNote()
      ));
    }

    if (Array.isArray(preset.chordIntervals) && preset.chordIntervals.length > 0) {
      return Tone.Frequency(rootNote)
        .harmonize(preset.chordIntervals)
        .map((frequency) => Tone.Frequency(frequency).toNote());
    }

    return Tone.Frequency(rootNote)
      .harmonize([0, 3, 5, 7])
      .map((frequency) => Tone.Frequency(frequency).toNote());
  }

  _stopAllArpeggios() {
    Array.from(this.activePatterns.keys()).forEach((handId) => this.stopArpeggio(handId));
  }

  startArpeggio(handId, rootNote) {
    if (!this.polySynth || this.activePatterns.has(handId)) return;

    const preset = this.getCurrentMusicPreset();
    const arpeggioNotes = this._buildPatternNotes(rootNote, preset);
    const stepInterval = this._getPatternInterval(preset);
    const pattern = new Tone.Pattern((time, note) => {
      const velocity = this.handVolumes.get(handId) || 0.2;
      if (note === null) return;

      const baseStepSec = this._getPatternBaseSeconds(preset);
      const lengthFactor = this.noteLengthLevels[this.noteLengthLevelIndex] || 1;
      const durationSeconds = Math.max(0.02, baseStepSec * lengthFactor);
      this.polySynth.triggerAttackRelease(note, durationSeconds, time, velocity);
    }, arpeggioNotes, preset.arpeggioPattern || 'up');

    pattern.interval = stepInterval;
    pattern.start(0);

    this.activePatterns.set(handId, {
      pattern,
      currentRoot: rootNote
    });
  }

  updateArpeggioVolume(handId, velocity) {
    if (!this.polySynth || !this.activePatterns.has(handId)) return;
    this.handVolumes.set(handId, Math.max(0, Math.min(1, velocity)));
  }

  updateArpeggio(handId, newRootNote) {
    const activePattern = this.activePatterns.get(handId);
    if (!this.polySynth || !activePattern || activePattern.currentRoot === newRootNote) return;

    activePattern.pattern.values = this._buildPatternNotes(newRootNote);
    activePattern.currentRoot = newRootNote;
  }

  stopArpeggio(handId) {
    const activePattern = this.activePatterns.get(handId);
    if (!activePattern) return;

    activePattern.pattern.stop(0);
    activePattern.pattern.dispose();
    this.activePatterns.delete(handId);
    this.handVolumes.delete(handId);
  }

  cycleSynth() {
    if (!this.polySynth) return;
    this.currentSynthIndex = (this.currentSynthIndex + 1) % this.synthPresets.length;
    this._updateSynth();
    console.log(`Switched to synth preset: ${this.currentSynthIndex}`);
  }

  _updateSynth() {
    if (!this.polySynth || !this.analyser) return;

    this._stopAllArpeggios();
    this.polySynth.dispose();

    const newPreset = this.synthPresets[this.currentSynthIndex];
    this.polySynth = this._createInstrument(newPreset);
    this.polySynth.connect(this.analyser);
    this._applyPresetAudioState(newPreset);

    console.log(`Updated to synth preset: ${this.currentSynthIndex}`);
  }

  getAnalyser() {
    return this.analyser;
  }

  cycleMusicPreset() {
    this._stopAllArpeggios();
    this.currentMusicPresetIndex = (this.currentMusicPresetIndex + 1) % this.musicPresets.length;
    const preset = this.getCurrentMusicPreset();
    Tone.Transport.bpm.value = preset.tempo || Tone.Transport.bpm.value;
    this._applyDelayOverride();
    console.log(`Switched music preset: ${preset.name}`);
    return preset;
  }

  getCurrentMusicPreset() {
    return this.musicPresets[this.currentMusicPresetIndex] || this.musicPresets[0];
  }

  getSynthName() {
    return SYNTH_NAMES[this.currentSynthIndex] || `Synth ${this.currentSynthIndex + 1}`;
  }

  setMusicPreset(index) {
    if (index < 0 || index >= this.musicPresets.length) return undefined;

    this._stopAllArpeggios();
    this.currentMusicPresetIndex = index;

    const preset = this.getCurrentMusicPreset();
    Tone.Transport.bpm.value = preset.tempo || Tone.Transport.bpm.value;

    if (typeof preset.synthPreset === 'number' && preset.synthPreset !== this.currentSynthIndex) {
      this.currentSynthIndex = preset.synthPreset;
      if (this.polySynth) {
        this._updateSynth();
      }
    }

    this._applyDelayOverride();
    console.log(`Set music preset: ${preset.name}`);
    return preset;
  }

  setDelayTimeBeats(beats, options) {
    this.delayBeats = Math.max(0, beats || 0);
    if (!options || options.manual !== false) {
      this.delayManualOverride = true;
    }
    if (this.stereoDelay) {
      const bpm = Tone.Transport.bpm.value || 120;
      this.stereoDelay.delayTime.value = (60 / bpm) * this.delayBeats;
    }
  }

  setDelayWet(wet, options) {
    this.delayWetManual = Math.max(0, Math.min(1, wet || 0));
    if (!options || options.manual !== false) {
      this.delayManualOverride = true;
    }
    if (this.stereoDelay) {
      this.stereoDelay.wet.value = this.delayWetManual;
    }
  }

  setNoteLengthLevel(levelIndex) {
    const parsed = Number.parseInt(levelIndex, 10);
    const clamped = Math.max(0, Math.min(this.noteLengthLevels.length - 1, parsed));
    if (!Number.isNaN(clamped)) {
      this.noteLengthLevelIndex = clamped;
    }
  }
}
