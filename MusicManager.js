function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _async_to_generator(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
function _class_call_check(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}
function _defineProperties(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _create_class(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
}
function _ts_generator(thisArg, body) {
    var f, y, t, g, _ = {
        label: 0,
        sent: function() {
            if (t[0] & 1) throw t[1];
            return t[1];
        },
        trys: [],
        ops: []
    };
    return g = {
        next: verb(0),
        "throw": verb(1),
        "return": verb(2)
    }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
    }), g;
    function verb(n) {
        return function(v) {
            return step([
                n,
                v
            ]);
        };
    }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while(_)try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [
                op[0] & 2,
                t.value
            ];
            switch(op[0]){
                case 0:
                case 1:
                    t = op;
                    break;
                case 4:
                    _.label++;
                    return {
                        value: op[1],
                        done: false
                    };
                case 5:
                    _.label++;
                    y = op[1];
                    op = [
                        0
                    ];
                    continue;
                case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                        _.label = op[1];
                        break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];
                        t = op;
                        break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];
                        _.ops.push(op);
                        break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
            }
            op = body.call(thisArg, _);
        } catch (e) {
            op = [
                6,
                e
            ];
            y = 0;
        } finally{
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return {
            value: op[0] ? op[1] : void 0,
            done: true
        };
    }
}
import * as Tone from 'https://esm.sh/tone';
// A simple manager for our Tone.js based music generation
export var MusicManager = /*#__PURE__*/ function() {
    "use strict";
    function MusicManager() {
        _class_call_check(this, MusicManager);
        this.polySynth = null;
        this.reverb = null;
        this.stereoDelay = null; // Add a delay effect property
        this.analyser = null; // For waveform visualization
        this.isStarted = false;
        // Use a Map to store the active arpeggio pattern for each hand
        this.activePatterns = new Map();
        // Use a Map to store the current volume (velocity) for each hand's arpeggio
        this.handVolumes = new Map();
        
        // 音乐风格预设系统 - 8音符电子琶音组合
        this.currentMusicPresetIndex = 0;
        this.musicPresets = [
            {
                name: "Minimal Groove",
                scale: ['E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3', 'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4'], // E3到A4完整半音音阶（18个音符）
                sequence: [0, 3, null, 7, 8, null, 7, null], // 完整的8拍序列音程关系，null表示空拍
                arpeggioPattern: "up", // 顺序播放序列
                tempo: 100,
                synthPreset: 2  // MARIMBA for percussive minimal feel
            },
            {
                name: "Rhythmic Drive",
                scale: ['E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3', 'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4'], // E3到A4完整半音音阶（18个音符）
                sequence: [null, 0, null, 0, null, 0, null, null, 0, null, 0, null, 0, null, null, 0], // 16拍节奏型序列
                arpeggioPattern: "up",
                tempo: 90,
                synthPreset: 1  // BRASS for punchy rhythm
            },
            {
                name: "Melodic Flow",
                scale: ['E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3', 'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4'], // E3到A4完整半音音阶（18个音符）
                sequence: [0, 7, 10, 12, 3, 2, 10, 12], // 8拍旋律性序列，更新的音程关系
                arpeggioPattern: "up",
                tempo: 105,
                synthPreset: 2  // MARIMBA for clear melodic lines
            },
            {
                name: "Groove Pulse",
                scale: ['E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3', 'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4'], // E3到A4完整半音音阶（18个音符）
                sequence: [0, 7, 2, 7, 0, 3, 7, 0, 8, 7, 0, 5, 7, 0, 7, 7], // 16拍新律动序列，根音与音程交替
                arpeggioPattern: "up",
                tempo: 110,
                synthPreset: 0  // E.PIANO for smooth rhythmic flow
            },
            {
                name: "Dark Current",
                scale: ['E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3', 'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4'], // E3到A4完整半音音阶（18个音符）
                sequence: [0, 7, 12, 0, 7, 14, 0, 7, 15, 0, 7, 14, 0, 7, 12, 0], // 16拍序列：根音-大二度-空拍-纯四度-纯五度-空拍-纯四度-空拍
                arpeggioPattern: "up",
                tempo: 90,
                synthPreset: 1  // BRASS for deep undercurrent feel
            },
            {
                name: "Light Flow",
                scale: ['E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3', 'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4'], // E3到A4完整半音音阶（18个音符）
                sequence: [-2, 0, 3, 10, -2, 0, 3, 7, -2, 0, 3, 10, -2, 0, 3, 0], // 8拍序列：根音-大三度-空拍-纯五度-大六度-空拍-纯五度-空拍
                arpeggioPattern: "up",
                tempo: 80,
                synthPreset: 0  // E.PIANO for bright flowing feel
            },
            {
                name: "Deep Space",
                scale: ['E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3', 'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4'], // E3到A4完整半音音阶（18个音符）
                sequence: [0, 5, null, 7, 10, null, 7, null], // 8拍序列：根音-纯四度-空拍-纯五度-小七度-空拍-纯五度-空拍
                arpeggioPattern: "up",
                tempo: 110,
                synthPreset: 2  // MARIMBA for spacious deep feel
            }
        ];
        
        this.currentMusicPresetIndex = 0;
        
        this.synthPresets = [
            // 1. Analog Pad - 经典模拟垫音
            {
                harmonicity: 1.0,
                modulationIndex: 1.5,
                oscillator: { type: 'sine' },
                envelope: { attack: 0.250, decay: 0.80, sustain: 0.78, release: 2.20 },
                modulation: { type: 'sine' },
                modulationEnvelope: { attack: 0.120, decay: 0.65, sustain: 0.58, release: 1.40 },
                effects: { reverbWet: 0.52, delayWet: 0.08 },
                baseVolumeDb: -8
            },
            // 2. Bell Pad - 钟声垫音（柔和长尾）
            {
                harmonicity: 3.5,
                modulationIndex: 5.2,
                oscillator: { type: 'sine' },
                envelope: { attack: 0.080, decay: 1.20, sustain: 0.55, release: 2.50 },
                modulation: { type: 'sine' },
                modulationEnvelope: { attack: 0.020, decay: 0.95, sustain: 0.35, release: 1.80 },
                effects: { reverbWet: 0.58, delayWet: 0.12 },
                baseVolumeDb: -8
            },
            // 3. Juno 80s Bell Tingle - 80年代Juno风格钟声（手风琴质感）
            {
                harmonicity: 2.8,
                modulationIndex: 4.5,
                oscillator: { type: 'sine' },
                envelope: { attack: 0.040, decay: 0.85, sustain: 0.68, release: 1.80 },
                modulation: { type: 'triangle' },
                modulationEnvelope: { attack: 0.015, decay: 0.70, sustain: 0.52, release: 1.20 },
                effects: { reverbWet: 0.48, delayWet: 0.10 },
                baseVolumeDb: -8
            },
            // 4. Phlutterphase Hang - 手盘鼓式金属共鸣
            {
                harmonicity: 5.0,
                modulationIndex: 7.0,
                oscillator: { type: 'sine' },
                envelope: { attack: 0.015, decay: 1.50, sustain: 0.45, release: 2.80 },
                modulation: { type: 'sine' },
                modulationEnvelope: { attack: 0.008, decay: 1.20, sustain: 0.28, release: 2.00 },
                effects: { reverbWet: 0.62, delayWet: 0.14 },
                baseVolumeDb: -9
            },
            // 5. Dizi C5（笛子 C5）
            { engine: 'sampler', sampler: { urls: { 'C5': 'samples/di zi-c5.wav' }, attack: 0.02, release: 2.0 }, effects: { reverbWet: 0.55, delayWet: 0.08 }, baseVolumeDb: -15 },
            // 6. Guqin C4（古琴 C4）
            { engine: 'sampler', sampler: { urls: { 'C4': 'samples/gu qin_C4.wav' }, attack: 0.02, release: 2.2 }, effects: { reverbWet: 0.50, delayWet: 0.06 }, baseVolumeDb: -15 },
            // 7. Guzheng C4（古筝 C4）
            { engine: 'sampler', sampler: { urls: { 'C4': 'samples/gu zheng--c4.wav' }, attack: 0.01, release: 1.8 }, effects: { reverbWet: 0.48, delayWet: 0.06 }, baseVolumeDb: -14 },
            // 8. Pipa E4（琵琶 E4）
            { engine: 'sampler', sampler: { urls: { 'E4': 'samples/PIPA_E4.wav' }, attack: 0.01, release: 1.8 }, effects: { reverbWet: 0.48, delayWet: 0.06 }, baseVolumeDb: -9 },
            // 9. Pipa C4-1（琵琶 C4-1）
            { engine: 'sampler', sampler: { urls: { 'C4': 'samples/pipa-c4-1.wav' }, attack: 0.01, release: 1.8 }, effects: { reverbWet: 0.48, delayWet: 0.06 }, baseVolumeDb: -9 },
            // 10. Pipa C4-2（琵琶 C4-2）
            { engine: 'sampler', sampler: { urls: { 'C4': 'samples/pipa-c4-2.wav' }, attack: 0.01, release: 1.8 }, effects: { reverbWet: 0.48, delayWet: 0.06 }, baseVolumeDb: -10 },
            // 11. Sheng E4（笙 E4）
            { engine: 'sampler', sampler: { urls: { 'E4': 'samples/Sheng-E4.wav' }, attack: 0.03, release: 2.4 }, effects: { reverbWet: 0.55, delayWet: 0.08 }, baseVolumeDb: -10 }
        ];
        this.currentSynthIndex = 0;

        // Manual delay override controls (preserved across synth changes)
        this.delayManualOverride = false;
        this.delayBeats = 0; // 0, 0.25, 0.5, 0.75, 1.0 (beats)
        this.delayWetManual = 0; // 0..1

        // Arpeggio single note length (relative to step length '16n')
        this.noteLengthLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
        this.noteLengthLevelIndex = 4; // default full step length
    }
    _create_class(MusicManager, [
        {
            key: "start",
            value: // Must be called after a user interaction
            function start() {
                var _this = this;
                return _async_to_generator(function() {
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                if (_this.isStarted) return [
                                    2
                                ];
                                return [
                                    4,
                                    Tone.start()
                                ];
                            case 1:
                                _state.sent();
                                // Install a master limiter once to prevent clipping across the entire mix
                                if (!_this._limiterInstalled) {
                                    _this.masterLimiter = new Tone.Limiter(-1);
                                    Tone.Destination.chain(_this.masterLimiter);
                                    _this._limiterInstalled = true;
                                }
                                _this.reverb = new Tone.Reverb({
                                    decay: 5,
                                    preDelay: 0.0,
                                    wet: 0.4
                                }).toDestination();
                                // Create a stereo delay and connect it to the reverb
                                _this.stereoDelay = new Tone.FeedbackDelay("8n", 0.5).connect(_this.reverb);
                                _this.stereoDelay.wet.value = 0; // Start with no delay effect
                                // Create an analyser for the waveform visualizer
                                _this.analyser = new Tone.Analyser('waveform', 1024);
                                // Use PolySynth to allow multiple arpeggios (one per hand) to play simultaneously.
                                // The synth now connects to the analyser, then to the delay, which then connects to the reverb.
                                _this.polySynth = _this._createInstrument(_this.synthPresets[_this.currentSynthIndex]);
                                _this.polySynth.connect(_this.analyser);
                                _this.analyser.connect(_this.stereoDelay);
                                // Apply base volume per preset if provided
                                try {
                                    var bv0 = (_this.synthPresets[_this.currentSynthIndex] && _this.synthPresets[_this.currentSynthIndex].baseVolumeDb);
                                    _this.polySynth.volume.value = (typeof bv0 === 'number') ? bv0 : -12;
                                } catch (e) {
                                    _this.polySynth.volume.value = -12;
                                }
                                _this.isStarted = true;
                                // Set the master tempo to 100 BPM
                                Tone.Transport.bpm.value = 100;
                                // Start the master transport
                                Tone.Transport.start();
                                console.log("Tone.js AudioContext started and PolySynth is ready.");
                                return [
                                    2
                                ];
                        }
                    });
                })();
            }
        },
        {
            key: "_createInstrument",
            value: function _createInstrument(preset) {
                // Supports FM (default) and Sampler engines; returns a poly-capable instrument
                if (preset && preset.engine === 'sampler' && Tone.Sampler) {
                    // Use Tone.Sampler for sample-based playback; DO NOT route to destination here.
                    // We will connect it to analyser -> delay -> reverb just like FM synth.
                    const sampler = new Tone.Sampler(preset.sampler || {});
                    return sampler;
                }
                // Default FM synth voice inside PolySynth
                return new Tone.PolySynth(Tone.FMSynth, preset);
            }
        },
        {
            // Starts an arpeggio for a specific hand
            key: "startArpeggio",
            value: function startArpeggio(handId, rootNote) {
                var _this = this;
                if (!this.polySynth || this.activePatterns.has(handId)) return;
                
                const currentPreset = this.getCurrentMusicPreset();
                
                // 🎵 优化的琶音生成逻辑：支持序列模式和和弦模式
                let arpeggioNotes;
                
                if (currentPreset.sequence) {
                    // 序列模式：基于根音和音程关系生成完整的8拍序列
                    arpeggioNotes = currentPreset.sequence.map(interval => {
                        if (interval === null) return null; // 保持空拍标记
                        return Tone.Frequency(rootNote).transpose(interval).toNote();
                    });
                } else if (currentPreset.chordIntervals) {
                    // 和弦模式：基于和弦音程生成琶音
                const chord = Tone.Frequency(rootNote).harmonize(currentPreset.chordIntervals);
                    arpeggioNotes = chord.map(freq => Tone.Frequency(freq).toNote());
                } else {
                    // 默认模式：使用标准小七和弦
                    const chord = Tone.Frequency(rootNote).harmonize([0, 3, 5, 7]);
                    arpeggioNotes = chord.map(freq => Tone.Frequency(freq).toNote());
                }
                
                const pattern = new Tone.Pattern((time, note) => {
                    const velocity = _this.handVolumes.get(handId) || 0.2;
                    if (note === null) {
                        return; // rest
                    }
                    var baseStepSec = Tone.Time('16n').toSeconds();
                    var lengthFactor = _this.noteLengthLevels[_this.noteLengthLevelIndex] || 1.0;
                    var durSec = Math.max(0.02, baseStepSec * lengthFactor);
                    _this.polySynth.triggerAttackRelease(note, durSec, time, velocity);
                }, arpeggioNotes, currentPreset.arpeggioPattern);
                
                pattern.interval = "16n";
                pattern.start(0);
                
                this.activePatterns.set(handId, {
                    pattern: pattern,
                    currentRoot: rootNote
                });
            }
        },
        {
            // Updates the volume (velocity) of an existing arpeggio
            key: "updateArpeggioVolume",
            value: function updateArpeggioVolume(handId, velocity) {
                // Only update if an arpeggio is active for this hand
                if (this.polySynth && this.activePatterns.has(handId)) {
                    // Clamp the velocity to be safe; use per-note velocity only to avoid clicks
                    var clampedVelocity = Math.max(0, Math.min(1, velocity));
                    this.handVolumes.set(handId, clampedVelocity);
                }
            }
        },
        {
            // Updates the notes in an existing arpeggio
            key: "updateArpeggio",
            value: function updateArpeggio(handId, newRootNote) {
                var activePattern = this.activePatterns.get(handId);
                if (!this.polySynth || !activePattern || activePattern.currentRoot === newRootNote) {
                    return; // No need to update if the note hasn't changed
                }
                
                // 🎵 根据预设类型更新琶音序列
                var currentPreset = this.getCurrentMusicPreset();
                let newNotes;
                
                if (currentPreset.sequence) {
                    // 序列模式：基于新根音重新生成完整序列
                    newNotes = currentPreset.sequence.map(interval => {
                        if (interval === null) return null; // 保持空拍标记
                        return Tone.Frequency(newRootNote).transpose(interval).toNote();
                    });
                } else if (currentPreset.chordIntervals) {
                    // 和弦模式：基于新根音生成和弦
                    var newChord = Tone.Frequency(newRootNote).harmonize(currentPreset.chordIntervals);
                    newNotes = newChord.map(freq => Tone.Frequency(freq).toNote());
                } else {
                    // 默认模式
                    var newChord = Tone.Frequency(newRootNote).harmonize([0, 3, 5, 7]);
                    newNotes = newChord.map(freq => Tone.Frequency(freq).toNote());
                }
                
                // 更新模式的音符序列
                activePattern.pattern.values = newNotes;
                activePattern.currentRoot = newRootNote;
            }
        },
        {
            // Stops and cleans up an arpeggio for a specific hand
            key: "stopArpeggio",
            value: function stopArpeggio(handId) {
                var activePattern = this.activePatterns.get(handId);
                if (activePattern) {
                    activePattern.pattern.stop(0); // Stop the pattern
                    activePattern.pattern.dispose(); // Clean up Tone.js objects
                    this.activePatterns.delete(handId); // Remove from our map
                    this.handVolumes.delete(handId); // Clean up the stored volume
                    // Leave synth level unchanged to avoid abrupt gain jumps
                }
            }
        },
        {
            // Cycles to the next synth preset
            key: "cycleSynth",
            value: function cycleSynth() {
                var _this = this;
                var _newPreset_effects, _newPreset_effects1;
                if (!this.polySynth) return;
                // Stop all currently playing notes/arpeggios before swapping
                this.activePatterns.forEach(function(value, key) {
                    _this.stopArpeggio(key);
                });
                // Dispose the old synth to free up resources
                this.polySynth.dispose();
                // Cycle to the next preset
                this.currentSynthIndex = (this.currentSynthIndex + 1) % this.synthPresets.length;
                var newPreset = this.synthPresets[this.currentSynthIndex];
                // Create the new synth but don't connect it yet
                this.polySynth = this._createInstrument(newPreset);
                // Re-establish the audio chain: synth/sampler -> analyser -> delay
                this.polySynth.connect(this.analyser);
                // Apply base volume per preset if provided
                try {
                    var bv1 = (this.synthPresets[this.currentSynthIndex] && this.synthPresets[this.currentSynthIndex].baseVolumeDb);
                    this.polySynth.volume.value = (typeof bv1 === 'number') ? bv1 : -12;
                } catch (e) {
                    this.polySynth.volume.value = -12;
                }
                var _newPreset_effects_reverbWet;
                // Adjust global effects based on the new preset's settings
                // Use optional chaining `?.` to safely access `effects` property
                this.reverb.wet.value = (_newPreset_effects_reverbWet = (_newPreset_effects = newPreset.effects) === null || _newPreset_effects === void 0 ? void 0 : _newPreset_effects.reverbWet) !== null && _newPreset_effects_reverbWet !== void 0 ? _newPreset_effects_reverbWet : 0.8; // Default to 0.8 if not specified
                var _newPreset_effects_delayWet;
                this.stereoDelay.wet.value = (_newPreset_effects_delayWet = (_newPreset_effects1 = newPreset.effects) === null || _newPreset_effects1 === void 0 ? void 0 : _newPreset_effects1.delayWet) !== null && _newPreset_effects_delayWet !== void 0 ? _newPreset_effects_delayWet : 0; // Default to 0 if not specified
                // Re-apply manual delay override if enabled
                if (this.delayManualOverride && this.stereoDelay) {
                    var bpm = Tone.Transport.bpm.value || 120;
                    var sec = (60 / bpm) * (this.delayBeats || 0);
                    this.stereoDelay.delayTime.value = sec;
                    this.stereoDelay.wet.value = this.delayWetManual;
                }
                console.log("Switched to synth preset: ".concat(this.currentSynthIndex));
            }
        },
        {
            // 更新合成器到当前索引（不循环）
            key: "_updateSynth",
            value: function _updateSynth() {
                var _this = this;
                var _newPreset_effects, _newPreset_effects1;
                if (!this.polySynth) return;
                
                // Stop all currently playing notes/arpeggios before swapping
                this.activePatterns.forEach(function(value, key) {
                    _this.stopArpeggio(key);
                });
                
                // Dispose the old synth to free up resources
                this.polySynth.dispose();
                
                // Use current preset index (don't cycle)
                var newPreset = this.synthPresets[this.currentSynthIndex];
                
                // Create the new synth but don't connect it yet
                this.polySynth = this._createInstrument(newPreset);
                
                // Re-establish the audio chain: synth/sampler -> analyser -> delay
                this.polySynth.connect(this.analyser);
                // Apply base volume per preset if provided
                try {
                    var bv2 = (this.synthPresets[this.currentSynthIndex] && this.synthPresets[this.currentSynthIndex].baseVolumeDb);
                    this.polySynth.volume.value = (typeof bv2 === 'number') ? bv2 : -12;
                } catch (e) {
                    this.polySynth.volume.value = -12;
                }
                
                var _newPreset_effects_reverbWet;
                // Adjust global effects based on the new preset's settings
                this.reverb.wet.value = (_newPreset_effects_reverbWet = (_newPreset_effects = newPreset.effects) === null || _newPreset_effects === void 0 ? void 0 : _newPreset_effects.reverbWet) !== null && _newPreset_effects_reverbWet !== void 0 ? _newPreset_effects_reverbWet : 0.8;
                
                var _newPreset_effects_delayWet;
                this.stereoDelay.wet.value = (_newPreset_effects_delayWet = (_newPreset_effects1 = newPreset.effects) === null || _newPreset_effects1 === void 0 ? void 0 : _newPreset_effects1.delayWet) !== null && _newPreset_effects_delayWet !== void 0 ? _newPreset_effects_delayWet : 0;
                // Re-apply manual delay override if enabled
                if (this.delayManualOverride && this.stereoDelay) {
                    var bpm2 = Tone.Transport.bpm.value || 120;
                    var sec2 = (60 / bpm2) * (this.delayBeats || 0);
                    this.stereoDelay.delayTime.value = sec2;
                    this.stereoDelay.wet.value = this.delayWetManual;
                }
                
                console.log("Updated to synth preset: ".concat(this.currentSynthIndex));
            }
        },
        {
            // Getter for the analyser so the game can use it
            key: "getAnalyser",
            value: function getAnalyser() {
                return this.analyser;
            }
        },
        {
            // 添加切换音乐预设的方法
            key: "cycleMusicPreset",
            value: function cycleMusicPreset() {
                // 停止所有当前琶音
                this.activePatterns.forEach((value, key) => {
                    this.stopArpeggio(key);
                });
                
                // 切换到下一个音乐预设
                this.currentMusicPresetIndex = (this.currentMusicPresetIndex + 1) % this.musicPresets.length;
                const newPreset = this.musicPresets[this.currentMusicPresetIndex];
                
                // 更新节拍速度
                Tone.Transport.bpm.value = newPreset.tempo;
                // 不再在循环预设时切换合成器音色，保持当前 synth 不变
                // Re-apply manual delay override to maintain timing with new BPM
                if (this.delayManualOverride && this.stereoDelay) {
                    var bpm3 = Tone.Transport.bpm.value || 120;
                    var sec3 = (60 / bpm3) * (this.delayBeats || 0);
                    this.stereoDelay.delayTime.value = sec3;
                    this.stereoDelay.wet.value = this.delayWetManual;
                }
                
                console.log(`切换到音乐预设: ${newPreset.name}`);
                return newPreset;
            }
        },
        {
            // 获取当前音乐预设
            key: "getCurrentMusicPreset",
            value: function getCurrentMusicPreset() {
                return this.musicPresets[this.currentMusicPresetIndex] || this.musicPresets[0];
            }
        },
        {
            // 获取当前合成器名称
            key: "getSynthName",
            value: function getSynthName() {
                const synthNames = [
                    "Analog Pad",
                    "Bell Pad",
                    "Juno 80s Bell Tingle",
                    "Phlutterphase Hang",
                    "Dizi C5 (Sampler)",
                    "Guqin C4 (Sampler)",
                    "Guzheng C4 (Sampler)",
                    "Pipa E4 (Sampler)",
                    "Pipa C4-1 (Sampler)",
                    "Pipa C4-2 (Sampler)",
                    "Sheng E4 (Sampler)"
                ];
                return synthNames[this.currentSynthIndex] || `Synth ${this.currentSynthIndex + 1}`;
            }
        },
        {
            // 设置音乐预设
            key: "setMusicPreset",
            value: function setMusicPreset(index) {
                if (index >= 0 && index < this.musicPresets.length) {
                    // 停止所有当前琶音
                    this.activePatterns.forEach((value, key) => {
                        this.stopArpeggio(key);
                    });
                    
                    this.currentMusicPresetIndex = index;
                    const newPreset = this.musicPresets[index];
                    
                    // 更新节拍速度
                    Tone.Transport.bpm.value = newPreset.tempo;
                    
                    // 切换合成器预设
                    if (newPreset.synthPreset !== this.currentSynthIndex) {
                        this.currentSynthIndex = newPreset.synthPreset;
                        this.cycleSynth();
                    }
                    // Re-apply manual delay override to maintain timing with new BPM
                    if (this.delayManualOverride && this.stereoDelay) {
                        var bpm4 = Tone.Transport.bpm.value || 120;
                        var sec4 = (60 / bpm4) * (this.delayBeats || 0);
                        this.stereoDelay.delayTime.value = sec4;
                        this.stereoDelay.wet.value = this.delayWetManual;
                    }
                    
                    console.log(`设置音乐预设: ${newPreset.name}`);
                    return newPreset;
                }
            }
        }
        ,
        {
            key: "setDelayTimeBeats",
            value: function setDelayTimeBeats(beats, options) {
                // beats: 0, 0.25, 0.5, 0.75, 1.0
                this.delayBeats = Math.max(0, beats || 0);
                if (!options || options.manual !== false) {
                    this.delayManualOverride = true;
                }
                if (this.stereoDelay) {
                    var bpm = Tone.Transport.bpm.value || 120;
                    var sec = (60 / bpm) * this.delayBeats;
                    this.stereoDelay.delayTime.value = sec;
                }
            }
        },
        {
            key: "setDelayWet",
            value: function setDelayWet(wet, options) {
                var clamped = Math.max(0, Math.min(1, wet || 0));
                this.delayWetManual = clamped;
                if (!options || options.manual !== false) {
                    this.delayManualOverride = true;
                }
                if (this.stereoDelay) {
                    this.stereoDelay.wet.value = clamped;
                }
            }
        }
        ,
        {
            key: "setNoteLengthLevel",
            value: function setNoteLengthLevel(levelIndex) {
                var idx = Math.max(0, Math.min(this.noteLengthLevels.length - 1, parseInt(levelIndex)));
                this.noteLengthLevelIndex = isNaN(idx) ? this.noteLengthLevelIndex : idx;
            }
        }
    ]);
    return MusicManager;
}();
