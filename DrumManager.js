function _array_like_to_array(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes(arr) {
    if (Array.isArray(arr)) return arr;
}
function _iterable_to_array_limit(arr, i) {
    var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
    if (_i == null) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _s, _e;
    try {
        for(_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true){
            _arr.push(_s.value);
            if (i && _arr.length === i) break;
        }
    } catch (err) {
        _d = true;
        _e = err;
    } finally{
        try {
            if (!_n && _i["return"] != null) _i["return"]();
        } finally{
            if (_d) throw _e;
        }
    }
    return _arr;
}
function _non_iterable_rest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _sliced_to_array(arr, i) {
    return _array_with_holes(arr) || _iterable_to_array_limit(arr, i) || _unsupported_iterable_to_array(arr, i) || _non_iterable_rest();
}
function _unsupported_iterable_to_array(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array(o, minLen);
}
import * as Tone from 'https://esm.sh/tone';
// --- Module State ---
var players = null;
var isLoaded = false;
var sequence = null;
var beatIndex = 0;
var activeDrums = new Set();
// 鼓组风格预设系统
var drumPresets = [
    // House 预设组 (2个，删除Deep House)
    {
        name: "Rhythm1",
        bpm: 124,
        patterns: {
            'kick': [true, false, false, false, true, false, false, false,
                     true, false, false, false, true, false, false, false],
            'snare': [false, false, false, false, true, false, false, false,
                      false, false, false, false, true, false, false, false],
            'hihat': [false, false, true, false, false, false, true, false,
                      false, false, true, false, false, false, true, false],
            'openhat': [false, false, false, false, false, false, false, false,
                        false, false, false, false, false, false, false, false],
            'clap': [false, false, false, false, true, false, false, false,
                     false, false, false, false, true, false, false, false]
        }
    },
    {
        name: "Rhythm2",
        bpm: 126,
        patterns: {
            'kick': [true, false, false, false, true, false, false, false,
                     true, false, false, false, true, false, false, false],
            'snare': [false, false, false, false, true, false, false, false,
                      false, false, false, false, true, false, true, true],
            'hihat': [false, false, true, false, false, false, true, false,
                      false, false, true, false, false, true, true, true],
            'openhat': [false, false, false, false, false, false, false, false,
                        false, false, false, false, false, false, false, false],
            'clap': [false, false, false, false, true, false, false, false,
                     false, false, false, false, true, false, false, false]
        }
    },
    // Techno 预设组 (2个，改进Berlin Techno)
    {
        name: "Rhythm3",
        bpm: 132,
        patterns: {
            'kick': [true, false, false, false, true, false, false, false,
                     true, false, false, false, true, false, false, false],
            'snare': [false, false, false, false, false, false, false, false,
                      false, false, false, false, true, false, false, false],
            'hihat': [false, false, true, false, false, false, true, false,
                      false, false, true, false, false, false, true, false],
            'openhat': [false, false, false, false, false, false, false, false,
                        false, false, false, false, false, false, false, false],
            'clap': [false, false, false, false, true, false, false, false,
                     false, false, false, false, false, false, false, false]
        }
    },
    {
        name: "Rhythm4",
        bpm: 128,
        patterns: {
            // 基于Attack Magazine专业模式：四四拍底鼓，拍手只在第2和第4拍，噪音在第3拍和第4拍前
            'kick': [true, false, false, false, true, false, false, false,
                     true, false, false, false, true, false, false, false],
            'snare': [false, false, false, false, true, false, false, false,
                      false, false, false, false, true, false, false, false],
            'hihat': [false, false, true, false, false, false, false, false,
                      false, false, true, false, false, false, true, false],
            'openhat': [false, false, true, false, false, false, false, false,
                        false, false, true, false, false, false, false, false],
            'clap': [false, false, false, false, true, false, true, false,
                     false, false, false, false, true, false, false, false]
        }
    },
    // Disco 预设组 (2个)
    {
        name: "Rhythm5",
        bpm: 118,
        patterns: {
            'kick': [true, false, false, false, false, true, false, false,
                     true, false, false, true, false, true, false, false],
            'snare': [false, false, false, false, true, false, false, false,
                      false, false, false, false, true, false, false, false],
            'hihat': [true, true, true, true, true, true, true, true,
                      true, true, true, true, true, true, true, true],
            'openhat': [false, false, true, false, false, false, true, false,
                        false, false, true, false, false, false, true, false],
            'clap': [false, false, false, false, true, false, false, false,
                     false, false, false, false, true, false, false, false]
        }
    },
    {
        name: "Rhythm6",
        bpm: 125,
        patterns: {
            'kick': [true, false, false, false, false, true, false, false,
                     true, false, false, true, false, true, false, false],
            'snare': [false, false, false, false, true, false, false, true,
                      false, false, false, false, true, false, false, false],
            'hihat': [true, false, true, true, false, true, true, false,
                      true, true, false, true, true, false, true, false],
            'openhat': [false, false, false, false, false, false, false, false,
                        false, false, true, false, false, false, false, false],
            'clap': [false, false, false, false, true, false, false, false,
                     false, false, false, false, true, false, false, false]
        }
    }
];
var currentDrumPresetIndex = 0;
// 更新drumPattern为当前预设
var drumPattern = drumPresets[currentDrumPresetIndex].patterns;
var fingerToDrumMap = {
    'thumb': 'openhat',
    'index': 'kick',
    'middle': 'snare',
    'ring': 'hihat',
    'pinky': 'clap'
};
// --- Exported Functions ---
/**
 * Loads all drum samples and returns a promise that resolves when loading is complete
 */ export function loadSamples() {
    return new Promise(function(resolve, reject) {
        if (isLoaded) {
            resolve();
            return;
        }
        players = new Tone.Players({
            urls: {
                kick: 'assets/kick.wav',
                snare: 'assets/snare.wav',
                hihat: 'assets/hihat.wav',
                openhat: 'assets/hihat.wav', // 使用同样的hihat音色，但播放时会处理成开放式
                clap: 'assets/clap.wav'
            },
            onload: function() {
                isLoaded = true;
                // Set volumes after loading
                players.player('kick').volume.value = -6; // Lowered kick volume
                players.player('snare').volume.value = 0;
                players.player('hihat').volume.value = -2; // Softer hi-hat
                players.player('openhat').volume.value = -1; // Open hat slightly louder
                players.player('clap').volume.value = 0;
                console.log("Drum samples loaded successfully.");
                resolve();
            },
            onerror: function(error) {
                console.error("Error loading drum samples:", error);
                reject(error);
            }
        }).toDestination();
    });
}
/**
 * Creates and starts the main 16-step drum loop.
 * Assumes Tone.Transport has been started elsewhere.
 */ export function startSequence() {
    if (!isLoaded || sequence) {
        console.warn("Drums not loaded or sequence already started. Cannot start sequence.");
        return;
    }
    sequence = new Tone.Sequence(function(time, step) {
        beatIndex = step; // Update for visualization
        Object.entries(drumPattern).forEach(function(param) {
            var _param = _sliced_to_array(param, 2), drum = _param[0], pattern = _param[1];
            // If the drum is active AND its pattern has a note on this step...
            if (activeDrums.has(drum) && pattern[step]) {
                players.player(drum).start(time);
            }
        });
    }, Array.from({
        length: 16
    }, function(_, i) {
        return i;
    }), "16n").start(0);
    console.log("Drum sequence started.");
}
/**
 * Updates which drums are active based on finger positions.
 * @param {object} fingerStates - An object with finger names as keys and boolean `isUp` as values.
 */ export function updateActiveDrums(fingerStates) {
    activeDrums.clear();
    var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
    try {
        for(var _iterator = Object.entries(fingerStates)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
            var _step_value = _sliced_to_array(_step.value, 2), finger = _step_value[0], isUp = _step_value[1];
            if (isUp) {
                var drum = fingerToDrumMap[finger];
                if (drum) {
                    activeDrums.add(drum);
                }
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally{
        try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
                _iterator.return();
            }
        } finally{
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }
}
/**
 * Returns the set of currently active drums.
 * @returns {Set<string>} A set of active drum names.
 */ export function getActiveDrums() {
    return activeDrums;
}
/**
 * Returns the mapping of fingers to drums.
 * @returns {object} The finger-to-drum map.
 */ export function getFingerToDrumMap() {
    return fingerToDrumMap;
}
/**
 * Returns the current beat index for external use (like visualization).
 * @returns {number} The current beat index (0-15).
 */ export function getCurrentBeat() {
    return beatIndex;
}
/**
 * Returns the master drum pattern object.
 * @returns {object} The drum pattern.
 */ export function getDrumPattern() {
    return drumPattern;
}
/**
 * 切换鼓组预设
 */
export function cycleDrumPreset() {
    currentDrumPresetIndex = (currentDrumPresetIndex + 1) % drumPresets.length;
    drumPattern = drumPresets[currentDrumPresetIndex].patterns;
    console.log(`切换到鼓组预设: ${drumPresets[currentDrumPresetIndex].name}`);
    return drumPresets[currentDrumPresetIndex];
}
/**
 * 获取当前鼓组预设
 */
export function getCurrentDrumPreset() {
    return drumPresets[currentDrumPresetIndex];
}
/**
 * 获取所有鼓组预设
 */
export function getAllDrumPresets() {
    return drumPresets;
}

export function setDrumPreset(index) {
    if (index >= 0 && index < drumPresets.length) {
        currentDrumPresetIndex = index;
        drumPattern = drumPresets[currentDrumPresetIndex].patterns;
        console.log(`切换到鼓组预设: ${drumPresets[currentDrumPresetIndex].name}`);
    }
}

/**
 * 获取当前鼓组预设的BPM
 */
export function getCurrentDrumBPM() {
    return drumPresets[currentDrumPresetIndex].bpm;
}

/**
 * 设置鼓组预设的BPM（支持自定义编辑）
 */
export function setDrumPresetBPM(index, bpm) {
    if (index >= 0 && index < drumPresets.length) {
        drumPresets[index].bpm = bpm;
        console.log(`鼓组预设 ${drumPresets[index].name} BPM已更新为: ${bpm}`);
    }
}

/**
 * 获取指定鼓组预设的BPM
 */
export function getDrumPresetBPM(index) {
    if (index >= 0 && index < drumPresets.length) {
        return drumPresets[index].bpm;
    }
    return 120; // 默认BPM
}

/**
 * 更新鼓组预设的模式（支持自定义编辑）
 */
export function updateDrumPresetPatterns(index, patterns) {
    if (index >= 0 && index < drumPresets.length) {
        drumPresets[index].patterns = patterns;
        // 如果更新的是当前预设，也要更新全局pattern
        if (index === currentDrumPresetIndex) {
            drumPattern = patterns;
        }
        console.log(`鼓组预设 ${drumPresets[index].name} 模式已更新`);
    }
}

/**
 * 重置鼓组预设到原始状态
 */
export function resetDrumPreset(index) {
    if (index >= 0 && index < drumPresets.length) {
        // 这里需要存储原始预设数据的备份
        const originalPresets = getOriginalDrumPresets();
        if (originalPresets[index]) {
            drumPresets[index] = { ...originalPresets[index] };
            // 如果重置的是当前预设，也要更新全局pattern
            if (index === currentDrumPresetIndex) {
                drumPattern = drumPresets[index].patterns;
            }
            console.log(`鼓组预设 ${drumPresets[index].name} 已重置到原始状态`);
        }
    }
}

/**
 * 获取原始鼓组预设数据（用于重置功能）
 */
function getOriginalDrumPresets() {
    return [
        {
            name: "Classic House",
            bpm: 124,
            patterns: {
                'kick': [true, false, false, false, true, false, false, false,
                         true, false, false, false, true, false, false, false],
                'snare': [false, false, false, false, true, false, false, false,
                          false, false, false, false, true, false, false, false],
                'hihat': [false, false, true, false, false, false, true, false,
                          false, false, true, false, false, false, true, false],
                'openhat': [false, false, false, false, false, false, false, false,
                            false, false, false, false, false, false, false, false],
                'clap': [false, false, false, false, true, false, false, false,
                         false, false, false, false, true, false, false, false]
            }
        },
        {
            name: "Tech House",
            bpm: 126,
            patterns: {
                'kick': [true, false, false, false, true, false, false, false,
                         true, false, false, false, true, false, false, false],
                'snare': [false, false, false, false, true, false, false, false,
                          false, false, false, false, true, false, true, true],
                'hihat': [false, false, true, false, false, false, true, false,
                          false, false, true, false, false, true, true, true],
                'openhat': [false, false, false, false, false, false, false, false,
                            false, false, false, false, false, false, false, false],
                'clap': [false, false, false, false, true, false, false, false,
                         false, false, false, false, true, false, false, false]
            }
        },
        {
            name: "Driving Techno",
            bpm: 132,
            patterns: {
                'kick': [true, false, false, false, true, false, false, false,
                         true, false, false, false, true, false, false, false],
                'snare': [false, false, false, false, false, false, false, false,
                          false, false, false, false, true, false, false, false],
                'hihat': [false, false, true, false, false, false, true, false,
                          false, false, true, false, false, false, true, false],
                'openhat': [false, false, false, false, false, false, false, false,
                            false, false, false, false, false, false, false, false],
                'clap': [false, false, false, false, true, false, false, false,
                         false, false, false, false, false, false, false, false]
            }
        },
        {
            name: "Berlin Techno",
            bpm: 128,
            patterns: {
                'kick': [true, false, false, false, true, false, false, false,
                         true, false, false, false, true, false, false, false],
                'snare': [false, false, false, false, true, false, false, false,
                          false, false, false, false, true, false, false, false],
                'hihat': [false, false, true, false, false, false, false, false,
                          false, false, true, false, false, false, true, false],
                'openhat': [false, false, true, false, false, false, false, false,
                            false, false, true, false, false, false, false, false],
                'clap': [false, false, false, false, true, false, true, false,
                         false, false, false, false, true, false, false, false]
            }
        },
        {
            name: "Classic Disco",
            bpm: 118,
            patterns: {
                'kick': [true, false, false, false, false, true, false, false,
                         true, false, false, true, false, true, false, false],
                'snare': [false, false, false, false, true, false, false, false,
                          false, false, false, false, true, false, false, false],
                'hihat': [true, true, true, true, true, true, true, true,
                          true, true, true, true, true, true, true, true],
                'openhat': [false, false, true, false, false, false, true, false,
                            false, false, true, false, false, false, true, false],
                'clap': [false, false, false, false, true, false, false, false,
                         false, false, false, false, true, false, false, false]
            }
        },
        {
            name: "Funky Disco",
            bpm: 125,
            patterns: {
                'kick': [true, false, false, false, false, true, false, false,
                         true, false, false, true, false, true, false, false],
                'snare': [false, false, false, false, true, false, false, true,
                          false, false, false, false, true, false, false, false],
                'hihat': [true, false, true, true, false, true, true, false,
                          true, true, false, true, true, false, true, false],
                'openhat': [false, false, false, false, false, false, false, false,
                            false, false, true, false, false, false, false, false],
                'clap': [false, false, false, false, true, false, false, false,
                         false, false, false, false, true, false, false, false]
            }
        }
    ];
}