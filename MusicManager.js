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
                tempo: 122,
                synthPreset: 2  // MARIMBA for percussive minimal feel
            },
            {
                name: "Rhythmic Drive",
                scale: ['E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3', 'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4'], // E3到A4完整半音音阶（18个音符）
                sequence: [null, 0, null, 0, null, 0, null, null, 0, null, 0, null, 0, null, null, 0], // 16拍节奏型序列
                arpeggioPattern: "up",
                tempo: 128,
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
                tempo: 115,
                synthPreset: 0  // E.PIANO for smooth rhythmic flow
            },
            {
                name: "Dark Current",
                scale: ['E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3', 'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4'], // E3到A4完整半音音阶（18个音符）
                sequence: [0, 2, null, 5, 7, null, 5, null], // 8拍序列：根音-大二度-空拍-纯四度-纯五度-空拍-纯四度-空拍
                arpeggioPattern: "up",
                tempo: 118,
                synthPreset: 1  // BRASS for deep undercurrent feel
            },
            {
                name: "Light Flow",
                scale: ['E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3', 'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4'], // E3到A4完整半音音阶（18个音符）
                sequence: [0, 4, null, 7, 9, null, 7, null], // 8拍序列：根音-大三度-空拍-纯五度-大六度-空拍-纯五度-空拍
                arpeggioPattern: "up",
                tempo: 125,
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
            // Preset 1: DX7 E.PIANO 1 - Classic Electric Piano
            {
                harmonicity: 14,        // M:C = 14:1 ratio from DX7 specs
                modulationIndex: 4.5,   // Moderate modulation for bell-like attack
                oscillator: {
                    type: 'sine'        // Pure sine wave carriers
                },
                envelope: {
                    attack: 0.01,       // Fast attack for percussive feel
                    decay: 0.3,         // Medium decay
                    sustain: 0.4,       // Medium sustain
                    release: 1.2        // Long release for natural piano decay
                },
                modulation: {
                    type: 'sine'        // Sine wave modulator
                },
                modulationEnvelope: {
                    attack: 0.01,       // Fast modulation attack
                    decay: 0.2,         // Quick modulation decay
                    sustain: 0.2,       // Low modulation sustain
                    release: 0.8        // Medium modulation release
                },
                effects: {
                    reverbWet: 0.2,
                    delayWet: 0.05
                }
            },
            // Preset 2: DX7 BRASS 1 - Classic Brass Sound
            {
                harmonicity: 2,         // M:C = 2:1 ratio for brass harmonics
                modulationIndex: 12,    // High modulation for bright brass
                oscillator: {
                    type: 'sine'
                },
                envelope: {
                    attack: 0.1,        // Slower attack for brass breath
                    decay: 0.2,         // Quick initial decay
                    sustain: 0.8,       // High sustain for held brass notes
                    release: 0.6        // Medium release
                },
                modulation: {
                    type: 'sine'
                },
                modulationEnvelope: {
                    attack: 0.05,       // Medium modulation attack
                    decay: 0.1,         // Quick modulation decay  
                    sustain: 0.6,       // High modulation sustain for brightness
                    release: 0.4        // Quick modulation release
                },
                effects: {
                    reverbWet: 0.15,
                    delayWet: 0.02
                }
            },
            // Preset 3: DX7 MARIMBA - Classic Mallet Percussion
            {
                harmonicity: 3,         // M:C = 3:1 ratio for wooden mallet tone
                modulationIndex: 6,     // Medium-high modulation for percussive attack
                oscillator: {
                    type: 'sine'
                },
                envelope: {
                    attack: 0.005,      // Very fast attack for mallet strike
                    decay: 0.4,         // Medium decay
                    sustain: 0.1,       // Low sustain for natural mallet decay
                    release: 0.8        // Medium release
                },
                modulation: {
                    type: 'sine'
                },
                modulationEnvelope: {
                    attack: 0.005,      // Very fast modulation attack
                    decay: 0.3,         // Quick modulation decay
                    sustain: 0.05,      // Very low modulation sustain
                    release: 0.6        // Medium modulation release
                },
                effects: {
                    reverbWet: 0.25,    // More reverb for spacious mallet sound
                    delayWet: 0.08
                }
            },
            // Preset 4: Original Clean Sine Wave (kept for compatibility)
            {
                harmonicity: 4,
                modulationIndex: 3,
                oscillator: {
                    type: 'sine'
                },
                envelope: {
                    attack: 0.01,
                    decay: 0.2,
                    sustain: 0.5,
                    release: 1.0
                },
                modulation: {
                    type: 'sine'
                },
                modulationEnvelope: {
                    attack: 0.1,
                    decay: 0.01,
                    sustain: 1,
                    release: 0.5
                }
            },
            // Preset 5: DX7 SYNTHWAVE LEAD - Cyberpunk Lead Sound
            {
                harmonicity: 1.5,       // M:C = 1.5:1 for rich harmonics
                modulationIndex: 15,    // High modulation for aggressive lead
                oscillator: {
                    type: 'sine'
                },
                envelope: {
                    attack: 0.05,       // Slightly slower attack for sweep-in
                    decay: 0.1,         // Quick decay
                    sustain: 0.7,       // High sustain for held leads
                    release: 0.8        // Medium release for tail
                },
                modulation: {
                    type: 'sine'
                },
                modulationEnvelope: {
                    attack: 0.02,       // Quick modulation attack
                    decay: 0.05,        // Very quick modulation decay
                    sustain: 0.8,       // High modulation sustain for brightness
                    release: 0.3        // Quick modulation release
                },
                effects: {
                    reverbWet: 0.1,     // Less reverb for tight lead
                    delayWet: 0.15      // More delay for synthwave feel
                }
            },
            // Preset 6: DX7 CRYSTAL PLUCK - Bright Plucked Sound
            {
                harmonicity: 7,         // M:C = 7:1 for bell-like harmonics
                modulationIndex: 8,     // Medium-high modulation for sparkle
                oscillator: {
                    type: 'sine'
                },
                envelope: {
                    attack: 0.002,      // Ultra-fast attack for pluck
                    decay: 0.3,         // Medium decay
                    sustain: 0.15,      // Low sustain for pluck character
                    release: 0.5        // Medium release
                },
                modulation: {
                    type: 'sine'
                },
                modulationEnvelope: {
                    attack: 0.001,      // Instant modulation attack
                    decay: 0.2,         // Quick modulation decay
                    sustain: 0.1,       // Low modulation sustain
                    release: 0.4        // Quick modulation release
                },
                effects: {
                    reverbWet: 0.3,     // More reverb for spacious pluck
                    delayWet: 0.12      // Moderate delay for depth
                }
            }
        ];
        this.currentSynthIndex = 0;
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
                                _this.reverb = new Tone.Reverb({
                                    decay: 5,
                                    preDelay: 0.0,
                                    wet: 0.8
                                }).toDestination();
                                // Create a stereo delay and connect it to the reverb
                                _this.stereoDelay = new Tone.FeedbackDelay("8n", 0.5).connect(_this.reverb);
                                _this.stereoDelay.wet.value = 0; // Start with no delay effect
                                // Create an analyser for the waveform visualizer
                                _this.analyser = new Tone.Analyser('waveform', 1024);
                                // Use PolySynth to allow multiple arpeggios (one per hand) to play simultaneously.
                                // The synth now connects to the analyser, then to the delay, which then connects to the reverb.
                                _this.polySynth = new Tone.PolySynth(Tone.FMSynth, _this.synthPresets[_this.currentSynthIndex]);
                                _this.polySynth.connect(_this.analyser);
                                _this.analyser.connect(_this.stereoDelay);
                                // Set a low volume to avoid clipping and create a more ambient feel
                                _this.polySynth.volume.value = 0;
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
                        // 空拍处理：降低音量但不停止琶音
                        _this.polySynth.volume.value = -20; // 降低音量到很低但不完全静音
                    } else {
                        // 正常音符：恢复音量并播放
                        _this.polySynth.volume.value = Tone.gainToDb(velocity);
                    _this.polySynth.triggerAttackRelease(note, "16n", time, velocity);
                    }
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
                    // Clamp the velocity to be safe
                    var clampedVelocity = Math.max(0, Math.min(1, velocity));
                    this.handVolumes.set(handId, clampedVelocity);
                    // IMPORTANT FIX: Also set the synth's overall volume.
                    // Since we only have one arpeggio at a time, we can map this directly.
                    // Using logarithmic scaling for a more natural volume control.
                    var volumeInDb = Tone.gainToDb(clampedVelocity);
                    this.polySynth.volume.value = volumeInDb;
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
                    // If no other hands are playing, silence the synth.
                    if (this.activePatterns.size === 0) {
                        this.polySynth.volume.value = -Infinity;
                    }
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
                this.polySynth = new Tone.PolySynth(Tone.FMSynth, newPreset);
                // Re-establish the audio chain: synth -> analyser -> delay
                this.polySynth.connect(this.analyser);
                this.polySynth.volume.value = 0; // Reset volume
                var _newPreset_effects_reverbWet;
                // Adjust global effects based on the new preset's settings
                // Use optional chaining `?.` to safely access `effects` property
                this.reverb.wet.value = (_newPreset_effects_reverbWet = (_newPreset_effects = newPreset.effects) === null || _newPreset_effects === void 0 ? void 0 : _newPreset_effects.reverbWet) !== null && _newPreset_effects_reverbWet !== void 0 ? _newPreset_effects_reverbWet : 0.8; // Default to 0.8 if not specified
                var _newPreset_effects_delayWet;
                this.stereoDelay.wet.value = (_newPreset_effects_delayWet = (_newPreset_effects1 = newPreset.effects) === null || _newPreset_effects1 === void 0 ? void 0 : _newPreset_effects1.delayWet) !== null && _newPreset_effects_delayWet !== void 0 ? _newPreset_effects_delayWet : 0; // Default to 0 if not specified
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
                this.polySynth = new Tone.PolySynth(Tone.FMSynth, newPreset);
                
                // Re-establish the audio chain: synth -> analyser -> delay
                this.polySynth.connect(this.analyser);
                this.polySynth.volume.value = 0; // Reset volume
                
                var _newPreset_effects_reverbWet;
                // Adjust global effects based on the new preset's settings
                this.reverb.wet.value = (_newPreset_effects_reverbWet = (_newPreset_effects = newPreset.effects) === null || _newPreset_effects === void 0 ? void 0 : _newPreset_effects.reverbWet) !== null && _newPreset_effects_reverbWet !== void 0 ? _newPreset_effects_reverbWet : 0.8;
                
                var _newPreset_effects_delayWet;
                this.stereoDelay.wet.value = (_newPreset_effects_delayWet = (_newPreset_effects1 = newPreset.effects) === null || _newPreset_effects1 === void 0 ? void 0 : _newPreset_effects1.delayWet) !== null && _newPreset_effects_delayWet !== void 0 ? _newPreset_effects_delayWet : 0;
                
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
                
                // 切换合成器预设
                this.currentSynthIndex = newPreset.synthPreset;
                this.cycleSynth();
                
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
                    "DX7 E.PIANO 1", 
                    "DX7 BRASS 1", 
                    "DX7 MARIMBA", 
                    "Clean Sine", 
                    "SYNTHWAVE LEAD",
                    "CRYSTAL PLUCK"
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
                    
                    console.log(`设置音乐预设: ${newPreset.name}`);
                    return newPreset;
                }
            }
        }
    ]);
    return MusicManager;
}();
