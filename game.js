function _array_like_to_array(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for (var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes(arr) {
    if (Array.isArray(arr)) return arr;
}
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
    return function () {
        var self = this, args = arguments;
        return new Promise(function (resolve, reject) {
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
    for (var i = 0; i < props.length; i++) {
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
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _iterable_to_array_limit(arr, i) {
    var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
    if (_i == null) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _s, _e;
    try {
        for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
            _arr.push(_s.value);
            if (i && _arr.length === i) break;
        }
    } catch (err) {
        _d = true;
        _e = err;
    } finally {
        try {
            if (!_n && _i["return"] != null) _i["return"]();
        } finally {
            if (_d) throw _e;
        }
    }
    return _arr;
}
function _non_iterable_rest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _object_spread(target) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function (key) {
            _define_property(target, key, source[key]);
        });
    }
    return target;
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
function _ts_generator(thisArg, body) {
    var f, y, t, g, _ = {
        label: 0,
        sent: function () {
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
    }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
        return this;
    }), g;
    function verb(n) {
        return function (v) {
            return step([
                n,
                v
            ]);
        };
    }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [
                op[0] & 2,
                t.value
            ];
            switch (op[0]) {
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
        } finally {
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return {
            value: op[0] ? op[1] : void 0,
            done: true
        };
    }
}
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; // Import GLTFLoader
import { HandLandmarker, FilesetResolver } from 'https://esm.sh/@mediapipe/tasks-vision@0.10.14';
import { MusicManager } from './MusicManager.js'; // Import the MusicManager
import * as Tone from './audio/tone.js'; // Use the shared pinned Tone module.
import * as drumManager from './DrumManager.js'; // Import the new drum manager module
import { WaveformVisualizer } from './WaveformVisualizer.js'; // Import the new waveform visualizer
import { RhythmSpace } from './rhythm/RhythmSpace.js';
import { RhythmZone } from './rhythm/RhythmZone.js';
import { KitSwitchGesture } from './gesture/KitSwitchGesture.js';
import { EdgeGesture, pinchVelocity } from './music/gesture-controls.js';
export var Game = /*#__PURE__*/ function () {
    "use strict";
    function Game(renderDiv) {
        var _this = this;
        _class_call_check(this, Game);
        this.renderDiv = renderDiv;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.videoElement = null;
        this.handLandmarker = null;
        this.lastVideoTime = -1;
        this.hands = []; // Stores data about detected hands (landmarks, anchor position, line group)
        this.handsBySide = { Left: null, Right: null };
        this.interactionSuppressed = false;
        // 初始化空的手部对象作为备用，防止undefined错误
        this.handsInitialized = false;
        this.handLineMaterial = null; // Material for hand lines
        this.fingertipMaterialHand1 = null; // Material for first hand's fingertip circles (blue)
        this.fingertipMaterialHand2 = null; // Material for second hand's fingertip circles (green)
        this.fingertipLandmarkIndices = [
            0,
            4,
            8,
            12,
            16,
            20
        ]; // WRIST + TIP landmarks
        this.handConnections = null; // Landmark connection definitions
        // this.handCollisionRadius = 30; // Conceptual radius for hand collision, was 25 (sphere radius) - Not needed for template
        this.gameState = 'loading'; // loading, ready, tracking, error
        this.gameOverText = null; // Will be repurposed or simplified
        this.clock = new THREE.Clock();
        this.musicManager = new MusicManager(); // Create an instance of MusicManager
        this.rhythmSpace = new RhythmSpace({ smoothing: 0.25, hysteresis: 0.03 });
        this.rhythmZone = new RhythmZone();
        this.leftFistEdge = new EdgeGesture(700);
        this.leftFourFingerEdge = new EdgeGesture(700);
        this.rightKitGesture = new KitSwitchGesture();
        this.waveformVisualizer = null; // To be initialized
        // this.drumManager = new DrumManager(); // DrumManager is now a static module, no instance needed
        this.lastLandmarkPositions = [
            [],
            []
        ]; // Store last known smoothed positions for each hand's landmarks
        this.smoothingFactor = 0.4; // Alpha for exponential smoothing (0 < alpha <= 1). Smaller = more smoothing.
        this.loadedModels = {}; // To store loaded models if any (e.g. a generic hand model in future)
        this.beatIndicators = []; // Array to hold the 16 beat indicator meshes
        this.beatIndicatorMaterials = []; // Array to hold the base material for each indicator
        this.beatIndicatorColors = {
            kick: new THREE.Color("#D72828"),
            snare: new THREE.Color("#F36E2F"),
            clap: new THREE.Color("#7B4394"),
            hihat: new THREE.Color("#84C34E"),
            off: new THREE.Color("#ffffff") // Off state remains white
        };
        this.beatIndicatorGroup = null; // Group to hold all indicators for easy repositioning
        this.labelColors = {
            evaPurple: {
                r: 123,
                g: 67,
                b: 148,
                a: 0.9
            },
            evaGreen: {
                r: 132,
                g: 195,
                b: 78,
                a: 0.9
            },
            evaOrange: {
                r: 243,
                g: 110,
                b: 47,
                a: 0.9
            },
            evaRed: {
                r: 215,
                g: 40,
                b: 40,
                a: 0.9
            },
            white: {
                r: 255,
                g: 255,
                b: 255,
                a: 1.0
            },
            black: {
                r: 0,
                g: 0,
                b: 0,
                a: 1.0
            }
        };
        this.waveformColors = [
            new THREE.Color("#7B4394"),
            new THREE.Color("#84C34E"),
            new THREE.Color("#F36E2F"),
            new THREE.Color("#D72828"),
            new THREE.Color("#66ffff")
        ];
        // 添加手部平滑处理相关属性
        this.smoothingFactor = 0.7; // 平滑系数，值越大响应越快
        this.lastLandmarkPositions = []; // 存储上一帧的手部位置用于平滑
        this.lastVideoTime = 0; // 用于视频时间戳检查

        // 添加通知防抖相关属性
        this.notificationTimeout = null;
        this.lastNotificationTime = 0;
        this.pendingNotification = null;

        // Delay 控制状态（低开销）
        this.delayCtrl = {
            active: false,
            auto: true,
            baseline: 0,
            buffer: [], // 最近 50 次采样（约 5 秒，100ms/次）
            bufferSize: 50,
            sampleIntervalMs: 100,
            lastSampleTs: 0,
            stdThreshold: 0.01,
            maxRange: 0.35,
            hysteresis: 0.03,
            level: 0, // 0..4
            lastUpdateTs: 0,
            updateCooldownMs: 200,
            baseWet: 0.18 // UI 滑杆（最大湿度，对应 Level4）
        };
        // 简化模式：减少信息显示以提升性能
        this.simpleMode = false; // false = 详细模式，true = 简化模式
        // Initialize asynchronously
        this._init().catch(function (error) {
            console.error("Initialization failed:", error);
            _this._showError("Initialization failed. Check console.");
        });
    }
    _create_class(Game, [
        {
            key: "_init",
            value: function _init() {
                var _this = this;
                return _async_to_generator(function () {
                    return _ts_generator(this, function (_state) {
                        switch (_state.label) {
                            case 0:
                                _this._setupDOM(); // Sets up basic DOM, including speech bubble container
                                _this._setupThree();
                                return [
                                    4,
                                    _this._loadAssets()
                                ];
                            case 1:
                                _state.sent(); // Add asset loading step
                                return [
                                    4,
                                    _this._setupHandTracking()
                                ];
                            case 2:
                                _state.sent(); // This needs to complete before we can proceed
                                // Ensure webcam is playing before starting game logic dependent on it
                                return [
                                    4,
                                    _this.videoElement.play()
                                ];
                            case 3:
                                _state.sent();
                                window.addEventListener('resize', _this._onResize.bind(_this));
                                _this._startGame(); // Start the game directly
                                _this._setupEventListeners(); // Set up interaction listeners
                                _this._animate(); // Start the animation loop (it will check state)
                                return [
                                    2
                                ];
                        }
                    });
                })();
            }
        },
        {
            key: "_setupDOM",
            value: function _setupDOM() {
                this.renderDiv.style.position = 'relative';
                this.renderDiv.style.width = '100vw'; // Use viewport units for fullscreen
                this.renderDiv.style.height = '100vh';
                this.renderDiv.style.overflow = 'hidden';
                this.renderDiv.style.background = '#111'; // Fallback background
                this.videoElement = document.createElement('video');
                this.videoElement.style.position = 'absolute';
                this.videoElement.style.top = '0';
                this.videoElement.style.left = '0';
                this.videoElement.style.width = '100%';
                this.videoElement.style.height = '100%';
                this.videoElement.style.objectFit = 'cover';
                this.videoElement.style.transform = 'scaleX(-1)'; // Mirror view for intuitive control
                this.videoElement.style.filter = 'grayscale(100%)'; // Make it black and white
                this.videoElement.autoplay = true;
                this.videoElement.muted = true; // Mute video to avoid feedback loops if audio was captured
                this.videoElement.playsInline = true;
                this.videoElement.style.zIndex = '0'; // Ensure video is behind THREE canvas
                this.renderDiv.appendChild(this.videoElement);
                // Container for Status text (formerly Game Over) and restart hint
                this.gameOverContainer = document.createElement('div');
                this.gameOverContainer.style.position = 'absolute';
                this.gameOverContainer.style.top = '50%';
                this.gameOverContainer.style.left = '50%';
                this.gameOverContainer.style.transform = 'translate(-50%, -50%)';
                this.gameOverContainer.style.zIndex = '10';
                this.gameOverContainer.style.display = 'none'; // Hidden initially
                this.gameOverContainer.style.pointerEvents = 'none'; // Don't block clicks
                this.gameOverContainer.style.textAlign = 'center'; // Center text elements within
                this.gameOverContainer.style.color = 'white'; // Default color, can be changed by _showError
                this.gameOverContainer.style.textShadow = '2px 2px 4px black';
                this.gameOverContainer.style.fontFamily = '"Arial Black", Gadget, sans-serif';
                // Main Status Text (formerly Game Over Text)
                this.gameOverText = document.createElement('div'); // Will be 'gameOverText' internally
                this.gameOverText.innerText = 'STATUS'; // Generic placeholder
                this.gameOverText.style.fontSize = 'clamp(36px, 10vw, 72px)'; // Responsive font size
                this.gameOverText.style.fontWeight = 'bold';
                this.gameOverText.style.marginBottom = '10px'; // Space below main text
                this.gameOverContainer.appendChild(this.gameOverText);
                // Restart Hint Text (may or may not be shown depending on context)
                this.restartHintText = document.createElement('div');
                this.restartHintText.innerText = '(click to restart tracking)';
                this.restartHintText.style.fontSize = 'clamp(16px, 3vw, 24px)';
                this.restartHintText.style.fontWeight = 'normal';
                this.restartHintText.style.opacity = '0.8'; // Slightly faded
                this.gameOverContainer.appendChild(this.restartHintText);
                this.renderDiv.appendChild(this.gameOverContainer);
                // ScoreDisplay removed
                // Watermelon (Center Emoji Marker) setup removed
                // Chad Image Marker setup removed
            }
        },
        {
            key: "_setupThree",
            value: function _setupThree() {
                var width = this.renderDiv.clientWidth;
                var height = this.renderDiv.clientHeight;
                this.scene = new THREE.Scene();
                // Using OrthographicCamera for a 2D-like overlay effect
                this.camera = new THREE.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 1, 1000);
                this.camera.position.z = 100; // Position along Z doesn't change scale in Ortho
                this.renderer = new THREE.WebGLRenderer({
                    alpha: true,
                    antialias: true
                });
                this.renderer.setSize(width, height);
                this.renderer.setPixelRatio(window.devicePixelRatio);
                this.renderer.domElement.style.position = 'absolute';
                this.renderer.domElement.style.top = '0';
                this.renderer.domElement.style.left = '0';
                this.renderer.domElement.style.zIndex = '1'; // Canvas on top of video
                this.renderDiv.appendChild(this.renderer.domElement);
                var ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
                this.scene.add(ambientLight);
                var directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
                directionalLight.position.set(0, 0, 100); // Pointing from behind camera
                this.scene.add(directionalLight);
                // Setup hand visualization (palm circles removed, lines will be added later)
                for (var i = 0; i < 2; i++) {
                    var lineGroup = new THREE.Group();
                    lineGroup.visible = false;
                    this.scene.add(lineGroup);
                    this.hands.push({
                        landmarks: null,
                        anchorPos: new THREE.Vector3(),
                        lineGroup: lineGroup,
                        isFist: false, // Track if the hand is currently in a fist
                        wasAllFingersUp: false,
                        wasFist: false,
                        wasPalmFacingAway: false, // Track palm orientation for right hand
                        wasFourFingersVertical: false, // Track 4-finger vertical gesture state
                        lastFistTime: 0 // Track last fist time for cooldown period
                    });
                }
                // 标记hands已经正确初始化
                this.handsInitialized = true;
                console.log('✅ Hands数组初始化完成:', this.hands.length, '个手部对象');
                this.handLineMaterial = new THREE.LineBasicMaterial({
                    color: 0x00ccff,
                    linewidth: 8
                });
                this.fingertipMaterialHand1 = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    side: THREE.DoubleSide
                }); // White
                this.fingertipMaterialHand2 = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    side: THREE.DoubleSide
                }); // White
                // Define connections for MediaPipe hand landmarks
                // See: https://developers.google.com/mediapipe/solutions/vision/hand_landmarker#hand_landmarks
                this.handConnections = [
                    // Thumb
                    [
                        0,
                        1
                    ],
                    [
                        1,
                        2
                    ],
                    [
                        2,
                        3
                    ],
                    [
                        3,
                        4
                    ],
                    // Index finger
                    [
                        0,
                        5
                    ],
                    [
                        5,
                        6
                    ],
                    [
                        6,
                        7
                    ],
                    [
                        7,
                        8
                    ],
                    // Middle finger
                    [
                        0,
                        9
                    ],
                    [
                        9,
                        10
                    ],
                    [
                        10,
                        11
                    ],
                    [
                        11,
                        12
                    ],
                    // Ring finger
                    [
                        0,
                        13
                    ],
                    [
                        13,
                        14
                    ],
                    [
                        14,
                        15
                    ],
                    [
                        15,
                        16
                    ],
                    // Pinky
                    [
                        0,
                        17
                    ],
                    [
                        17,
                        18
                    ],
                    [
                        18,
                        19
                    ],
                    [
                        19,
                        20
                    ],
                    // Palm
                    [
                        5,
                        9
                    ],
                    [
                        9,
                        13
                    ],
                    [
                        13,
                        17
                    ] // Connect base of fingers
                ];
                // Particle resources removed
                // Ground line removed
                // --- Beat Indicator ---
                this.beatIndicatorGroup = new THREE.Group();
                this.scene.add(this.beatIndicatorGroup);
                this._setupBeatIndicatorMaterials(); // Create materials based on drum pattern
                var indicatorSize = 20;
                var indicatorGeometry = new THREE.PlaneGeometry(indicatorSize, indicatorSize);
                for (var i1 = 0; i1 < 16; i1++) {
                    // Use the pre-calculated material for this beat index
                    var indicator = new THREE.Mesh(indicatorGeometry, this.beatIndicatorMaterials[i1]);
                    this.beatIndicatorGroup.add(indicator);
                    this.beatIndicators.push(indicator);
                }
                this._positionBeatIndicators(); // Position them right after creation
            }
        },
        {
            key: "_loadAssets",
            value: function _loadAssets() {
                var _this = this;
                return _async_to_generator(function () {
                    var error;
                    return _ts_generator(this, function (_state) {
                        switch (_state.label) {
                            case 0:
                                console.log("Loading assets...");
                                _state.label = 1;
                            case 1:
                                _state.trys.push([
                                    1,
                                    3,
                                    ,
                                    4
                                ]);
                                // Ghost Textures loading removed
                                // Ghost GLTF Model loading removed (was already commented out)
                                return [
                                    4,
                                    drumManager.loadSamples()
                                ];
                            case 2:
                                _state.sent(); // Load drum sounds
                                console.log("No game-specific assets to load for template.");
                                return [
                                    3,
                                    4
                                ];
                            case 3:
                                error = _state.sent();
                                console.error("Error loading assets:", error);
                                _this._showError("Failed to load assets."); // Generic message
                                throw error; // Stop initialization
                            case 4:
                                return [
                                    2
                                ];
                        }
                    });
                })();
            }
        },
        {
            key: "_setupHandTracking",
            value: function _setupHandTracking() {
                var _this = this;
                return _async_to_generator(function () {
                    var vision, stream, error;
                    return _ts_generator(this, function (_state) {
                        switch (_state.label) {
                            case 0:
                                _state.trys.push([
                                    0,
                                    5,
                                    ,
                                    6
                                ]);
                                console.log("Setting up Hand Tracking...");

                                // 预检查摄像头可用性
                                return [
                                    4,
                                    _this._checkCameraAvailability()
                                ];
                            case 1:
                                _state.sent(); // 摄像头可用性检查结果
                                return [
                                    4,
                                    FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm')
                                ];
                            case 2:
                                vision = _state.sent();
                                return [
                                    4,
                                    HandLandmarker.createFromOptions(vision, {
                                        baseOptions: {
                                            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                                            delegate: 'GPU'
                                        },
                                        numHands: 2,
                                        runningMode: 'VIDEO'
                                    })
                                ];
                            case 3:
                                _this.handLandmarker = _state.sent();
                                console.log("HandLandmarker created.");
                                console.log("Requesting webcam access...");

                                // 创建带超时的摄像头访问Promise
                                var getUserMediaWithTimeout = function (constraints, timeout) {
                                    return Promise.race([
                                        navigator.mediaDevices.getUserMedia(constraints),
                                        new Promise(function (_, reject) {
                                            setTimeout(function () {
                                                reject(new Error('摄像头访问超时，请检查摄像头是否被其他应用占用'));
                                            }, timeout);
                                        })
                                    ]);
                                };

                                return [
                                    4,
                                    getUserMediaWithTimeout({
                                        video: {
                                            facingMode: 'user',
                                            width: {
                                                ideal: 640,  // 降低分辨率以提高兼容性
                                                max: 1280
                                            },
                                            height: {
                                                ideal: 480,  // 降低分辨率以提高兼容性
                                                max: 720
                                            },
                                            frameRate: {
                                                ideal: 30,
                                                max: 60
                                            }
                                        },
                                        audio: false
                                    }, 10000) // 10秒超时
                                ];
                            case 4:
                                stream = _state.sent();
                                _this.videoElement.srcObject = stream;
                                console.log("Webcam stream obtained.");

                                // 添加视频播放
                                _this.videoElement.play().catch(function (playError) {
                                    console.warn('视频自动播放失败:', playError);
                                });

                                // Wait for video metadata to load to ensure dimensions are available (with timeout)
                                return [
                                    2,
                                    new Promise(function (resolve, reject) {
                                        var metadataTimeout = setTimeout(function () {
                                            reject(new Error('视频元数据加载超时'));
                                        }, 5000); // 5秒超时

                                        _this.videoElement.onloadedmetadata = function () {
                                            clearTimeout(metadataTimeout);
                                            console.log("Webcam metadata loaded.");

                                            // 设置视频尺寸
                                            _this.videoElement.style.width = _this.renderDiv.clientWidth + 'px';
                                            _this.videoElement.style.height = _this.renderDiv.clientHeight + 'px';

                                            // 确保视频开始播放
                                            if (_this.videoElement.paused) {
                                                _this.videoElement.play().catch(function (err) {
                                                    console.warn('视频播放失败:', err);
                                                });
                                            }

                                            resolve();
                                        };

                                        // 如果元数据已经加载，直接解析
                                        if (_this.videoElement.readyState >= 1) {
                                            clearTimeout(metadataTimeout);
                                            console.log("Webcam metadata already loaded.");
                                            resolve();
                                        }
                                    })
                                ];
                            case 5:
                                error = _state.sent();
                                console.error('Error setting up Hand Tracking or Webcam:', error);

                                // 提供更友好的错误处理
                                let errorMessage = "摄像头访问失败";
                                let showNoCameraMode = false;

                                if (error.name === 'NotReadableError') {
                                    errorMessage = "摄像头被其他应用占用，请关闭其他使用摄像头的程序后重试";
                                } else if (error.name === 'NotAllowedError') {
                                    errorMessage = "请允许浏览器访问摄像头权限，然后重试";
                                } else if (error.name === 'NotFoundError') {
                                    errorMessage = "未找到摄像头设备";
                                    showNoCameraMode = true;
                                } else if (error.name === 'AbortError') {
                                    errorMessage = "摄像头启动被中断，请重试";
                                } else if (error.message && error.message.includes('超时')) {
                                    errorMessage = error.message;
                                } else if (error.name === 'OverconstrainedError') {
                                    errorMessage = "摄像头不支持请求的分辨率，正在尝试降低要求...";

                                    // 尝试使用更低的约束重新初始化
                                    setTimeout(function () {
                                        _this._setupHandTrackingFallback();
                                    }, 1000);
                                    return [2];
                                }

                                _this._showError(errorMessage, showNoCameraMode);

                                // 不要完全停止初始化，允许用户重试
                                return [2]; // 继续执行而不是抛出错误
                            case 6:
                                return [
                                    2
                                ];
                        }
                    });
                })();
            }
        },
        {
            key: "_checkCameraAvailability",
            value: function _checkCameraAvailability() {
                return _async_to_generator(function () {
                    return _ts_generator(this, function (_state) {
                        switch (_state.label) {
                            case 0:
                                console.log("🔍 检查摄像头和环境可用性...");

                                // 1. 检查安全上下文（HTTPS要求）
                                var isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
                                console.log('🔒 安全上下文状态:', isSecureContext);
                                console.log('📍 当前协议:', location.protocol);
                                console.log('🌐 当前域名:', location.hostname);

                                if (!isSecureContext) {
                                    var errorMsg = '';
                                    if (location.protocol === 'file:') {
                                        errorMsg = '本地文件访问不支持摄像头。请使用本地服务器访问（如：python -m http.server 8000）或部署到HTTPS网站';
                                    } else if (location.protocol === 'http:' && location.hostname !== 'localhost') {
                                        errorMsg = '非HTTPS环境不支持摄像头访问。请使用HTTPS协议或在localhost下运行';
                                    } else {
                                        errorMsg = '当前环境不是安全上下文，无法访问摄像头';
                                    }
                                    throw new Error(errorMsg);
                                }

                                // 2. 检查是否支持getUserMedia
                                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                                    throw new Error('浏览器不支持摄像头访问API（MediaDevices.getUserMedia）');
                                }

                                // 3. 检查权限状态
                                if (navigator.permissions && navigator.permissions.query) {
                                    return [4, navigator.permissions.query({ name: 'camera' })];
                                } else {
                                    return [3, 2]; // 跳到设备枚举
                                }
                            case 1:
                                var permissionStatus = _state.sent();
                                console.log('🎥 摄像头权限状态:', permissionStatus.state);

                                if (permissionStatus.state === 'denied') {
                                    throw new Error('摄像头权限已被拒绝。请在浏览器设置中重新允许摄像头访问权限');
                                }

                                _state.label = 2;
                            case 2:
                                // 4. 枚举可用的摄像头设备
                                return [4, navigator.mediaDevices.enumerateDevices()];
                            case 3:
                                var devices = _state.sent();
                                var videoDevices = devices.filter(function (device) {
                                    return device.kind === 'videoinput';
                                });

                                console.log('📹 发现摄像头设备:', videoDevices.length + '个');
                                videoDevices.forEach(function (device, index) {
                                    console.log(`  设备 ${index + 1}: ${device.label || '未知设备'}`);
                                });

                                if (videoDevices.length === 0) {
                                    throw new Error('未找到可用的摄像头设备。请检查摄像头是否连接并在系统中启用');
                                }

                                return [2, true];
                        }
                    });
                })();
            }
        },
        {
            key: "_setupHandTrackingFallback",
            value: function _setupHandTrackingFallback() {
                var _this = this;
                return _async_to_generator(function () {
                    var vision, stream, error;
                    return _ts_generator(this, function (_state) {
                        switch (_state.label) {
                            case 0:
                                _state.trys.push([
                                    0,
                                    4,
                                    ,
                                    5
                                ]);
                                console.log("尝试使用回退设置初始化摄像头...");

                                if (!_this.handLandmarker) {
                                    return [
                                        4,
                                        FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm')
                                    ];
                                } else {
                                    return [3, 2];
                                }
                            case 1:
                                vision = _state.sent();
                                return [
                                    4,
                                    HandLandmarker.createFromOptions(vision, {
                                        baseOptions: {
                                            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                                            delegate: 'CPU' // 使用CPU而不是GPU
                                        },
                                        numHands: 2,
                                        runningMode: 'VIDEO'
                                    })
                                ];
                            case 2:
                                if (!_this.handLandmarker) {
                                    _this.handLandmarker = _state.sent();
                                }

                                console.log("尝试获取基础摄像头访问...");
                                return [
                                    4,
                                    navigator.mediaDevices.getUserMedia({
                                        video: {
                                            width: { ideal: 320, max: 640 },  // 更低分辨率
                                            height: { ideal: 240, max: 480 }, // 更低分辨率
                                            frameRate: { ideal: 15, max: 30 } // 更低帧率
                                        },
                                        audio: false
                                    })
                                ];
                            case 3:
                                stream = _state.sent();
                                _this.videoElement.srcObject = stream;
                                console.log("回退摄像头设置成功");

                                _this.videoElement.play().catch(function (playError) {
                                    console.warn('视频播放失败:', playError);
                                });

                                // 简化的元数据加载
                                return [
                                    2,
                                    new Promise(function (resolve) {
                                        _this.videoElement.onloadedmetadata = function () {
                                            console.log("回退设置元数据加载完成");
                                            resolve();
                                        };

                                        if (_this.videoElement.readyState >= 1) {
                                            resolve();
                                        }
                                    })
                                ];
                            case 4:
                                error = _state.sent();
                                console.error('回退摄像头设置也失败:', error);
                                _this._showError("摄像头初始化完全失败，请检查设备或尝试刷新页面");
                                return [2];
                            case 5:
                                return [2];
                        }
                    });
                })();
            }
        },
        {
            key: "setInteractionSuppressed",
            value: function setInteractionSuppressed(value) {
                var nextValue = Boolean(value);
                if (nextValue === this.interactionSuppressed) return;
                this.interactionSuppressed = nextValue;
                if (nextValue) {
                    this.musicManager.stopArpeggio('Left');
                    drumManager.updateActiveDrums({});
                }
            }
        },
        {
            // _startSpawning, _scheduleNextSpawn, _stopSpawning, _spawnGhost methods removed.
            key: "_updateHands",
            value: function _updateHands() {
                var _this = this;
                // 添加hands数组的安全检查
                if (!this.handLandmarker || !this.videoElement.srcObject || this.videoElement.readyState < 2 ||
                    this.videoElement.videoWidth === 0 || !this.handsInitialized || !this.hands || this.hands.length < 2) {
                    if (!this.handsInitialized) {
                        console.debug('⏳ Hands尚未初始化，跳过更新');
                    }
                    return;
                }
                var videoTime = this.videoElement.currentTime;
                if (videoTime > this.lastVideoTime) {
                    this.lastVideoTime = videoTime;
                    try {
                        var _this1, _loop = function (i) {
                            // 额外的安全检查
                            if (!_this1.hands || !_this1.hands[i]) {
                                console.warn(`Hand ${i} not properly initialized`);
                                return "continue";
                            }
                            var hand = _this1.hands[i];
                            var wasVisible = hand.landmarks !== null;
                            var detectedHand = detectedBySlot[i];
                            if (detectedHand) {
                                var currentRawLandmarks = detectedHand.landmarks;
                                hand.side = detectedHand.side;
                                if (!_this1.lastLandmarkPositions[i] || _this1.lastLandmarkPositions[i].length !== currentRawLandmarks.length) {
                                    _this1.lastLandmarkPositions[i] = currentRawLandmarks.map(function (lm) {
                                        return _object_spread({}, lm);
                                    });
                                }
                                var smoothedLandmarks = currentRawLandmarks.map(function (lm, lmIndex) {
                                    var prevLm = _this.lastLandmarkPositions[i][lmIndex];
                                    return {
                                        x: _this.smoothingFactor * lm.x + (1 - _this.smoothingFactor) * prevLm.x,
                                        y: _this.smoothingFactor * lm.y + (1 - _this.smoothingFactor) * prevLm.y,
                                        z: _this.smoothingFactor * lm.z + (1 - _this.smoothingFactor) * prevLm.z
                                    };
                                });
                                _this1.lastLandmarkPositions[i] = smoothedLandmarks.map(function (lm) {
                                    return _object_spread({}, lm);
                                });
                                hand.landmarks = smoothedLandmarks;
                                var palm = smoothedLandmarks[9]; // MIDDLE_FINGER_MCP
                                var lmOriginalX = palm.x * videoParams.videoNaturalWidth;
                                var lmOriginalY = palm.y * videoParams.videoNaturalHeight;
                                var normX_visible = (lmOriginalX - videoParams.offsetX) / videoParams.visibleWidth;
                                var normY_visible = (lmOriginalY - videoParams.offsetY) / videoParams.visibleHeight;
                                var handX = (1 - normX_visible) * canvasWidth - canvasWidth / 2;
                                var handY = (1 - normY_visible) * canvasHeight - canvasHeight / 2;
                                hand.anchorPos.set(handX, handY, 1);
                                var interactionsEnabled = !_this1.interactionSuppressed;
                                if (hand.side === 'Left') {
                                    var now = performance.now();
                                    var isFistNow = _this1._isFist(smoothedLandmarks);
                                    var fourFingersVerticalNow = _this1._isFourFingersVertical(smoothedLandmarks);
                                    var velocity = pinchVelocity(smoothedLandmarks);
                                    var rootNote = _this1.musicManager.currentRoot;
                                    if (interactionsEnabled) {
                                        rootNote = _this1.musicManager.setRootFromPosition(normY_visible);
                                        _this1.musicManager.setBrightness(1 - normX_visible);
                                        _this1.musicManager.updateArpeggioVolume('Left', velocity);
                                        if (_this1.leftFistEdge.update(isFistNow, now)) {
                                            var toneName = _this1.musicManager.setToneVariant();
                                            _this1._showPresetChangeNotification(`音色: ${toneName}`, 'music');
                                        }
                                        if (_this1.leftFourFingerEdge.update(fourFingersVerticalNow, now)) {
                                            var newScene = _this1.musicManager.cycleScene();
                                            _this1._showPresetChangeNotification(`场景: ${newScene.name} (${newScene.bpm} BPM)`, 'music');
                                        }
                                    } else {
                                        _this1.musicManager.stopArpeggio('Left');
                                    }
                                    if (_this1.waveformVisualizer) {
                                        var colorIndex = Math.max(0, _this1.musicManager.scale.indexOf(rootNote)) % _this1.waveformColors.length;
                                        _this1.waveformVisualizer.updateColor(_this1.waveformColors[colorIndex]);
                                    }
                                    _this1._updateHandLines(i, smoothedLandmarks, videoParams, canvasWidth, canvasHeight, {
                                        note: rootNote,
                                        velocity: velocity,
                                        isFist: isFistNow
                                    });
                                } else if (hand.side === 'Right') {
                                    // Right hand: position selects a stable rhythm cell while fingers gate tracks.
                                    var fingerStates = _this1._getFingerStates(smoothedLandmarks);
                                    if (interactionsEnabled) {
                                        var zonePoint = _this1.rhythmZone.map(1 - normX_visible, normY_visible);
                                        _this1.renderDiv.dispatchEvent(new CustomEvent('rhythmpointer', {
                                            detail: zonePoint
                                        }));
                                        var cell = _this1.rhythmSpace.update(zonePoint.x, zonePoint.y);
                                        if (cell.changed) {
                                            var pendingCell = drumManager.queueRhythmCell(cell.x, cell.y);
                                            _this1.renderDiv.dispatchEvent(new CustomEvent('rhythmposition', {
                                                detail: { ...cell, label: pendingCell.label, pending: true }
                                            }));
                                        }
                                    }
                                    var isFist = _this1._isFist(smoothedLandmarks);
                                    var isOpen = ['index', 'middle', 'ring', 'pinky'].every(function(finger) {
                                        return fingerStates[finger];
                                    });
                                    var kitGesture = { armed: false, triggered: false, suppressDrums: false };
                                    if (interactionsEnabled) {
                                        kitGesture = _this1.rightKitGesture.update({
                                            isFist: isFist,
                                            isOpen: isOpen,
                                            now: performance.now()
                                        });
                                    } else {
                                        _this1.rightKitGesture.reset();
                                    }
                                    if (kitGesture.armed) _this1._showInfoTransient('KIT READY', 900);
                                    if (kitGesture.triggered) {
                                        var kitResult = drumManager.cycleDrumKit({ source: 'gesture' });
                                        if (kitResult.changed) {
                                            _this1._showInfoTransient(`DRUM KIT: ${kitResult.kit.name}`, 1600);
                                        }
                                    }
                                    drumManager.updateActiveDrums(
                                        interactionsEnabled && !kitGesture.suppressDrums ? fingerStates : {}
                                    );

                                    // 更新可视化
                                    _this1._updateHandLines(i, smoothedLandmarks, videoParams, canvasWidth, canvasHeight, {
                                        fingerStates: fingerStates
                                    });
                                }
                                hand.lineGroup.visible = true;
                            } else {
                                if (wasVisible) {
                                    if (hand.side === 'Left') {
                                        _this1.musicManager.stopArpeggio('Left');
                                    } else if (hand.side === 'Right') {
                                        // Disable all drums when hand is gone
                                        _this1.rightKitGesture.reset();
                                        drumManager.updateActiveDrums({});
                                    }

                                }
                                hand.landmarks = null;
                                if (hand.lineGroup) hand.lineGroup.visible = false;
                            }
                        };
                        var results = this.handLandmarker.detectForVideo(this.videoElement, performance.now());
                        var detectedBySlot = [null, null];
                        (results.landmarks || []).forEach(function(landmarks, detectedIndex) {
                            var side = results.handednesses && results.handednesses[detectedIndex]
                                && results.handednesses[detectedIndex][0]
                                && results.handednesses[detectedIndex][0].categoryName;
                            var slot = side === 'Left' ? 0 : side === 'Right' ? 1 : detectedIndex;
                            if (slot < 2 && !detectedBySlot[slot]) {
                                detectedBySlot[slot] = {
                                    side: slot === 0 ? 'Left' : 'Right',
                                    landmarks: landmarks
                                };
                            }
                        });
                        var videoParams = this._getVisibleVideoParameters();
                        if (!videoParams) return;
                        var canvasWidth = this.renderDiv.clientWidth;
                        var canvasHeight = this.renderDiv.clientHeight;
                        // 注意：现在使用MusicManager中的预设系统，这里的硬编码音阶已被移除
                        for (var i = 0; i < this.hands.length; i++)_this1 = this, _loop(i);
                        this.handsBySide = {
                            Left: this.hands[0] && this.hands[0].landmarks ? {
                                side: 'Left', landmarks: this.hands[0].landmarks
                            } : null,
                            Right: this.hands[1] && this.hands[1].landmarks ? {
                                side: 'Right', landmarks: this.hands[1].landmarks
                            } : null
                        };
                        this.renderDiv.dispatchEvent(new CustomEvent('handframe', {
                            detail: {
                                handsBySide: this.handsBySide,
                                now: performance.now()
                            }
                        }));
                    } catch (error) {
                        console.error("Error during hand detection:", error);
                        // 优雅降级：清理无效的手部数据
                        this.hands.forEach(function (hand) {
                            if (hand.landmarks) {
                                hand.landmarks = null;
                                if (hand.lineGroup) hand.lineGroup.visible = false;
                                // 停止相关的音频
                                if (hand.side === 'Left') {
                                    _this.musicManager.stopArpeggio('Left');
                                } else if (hand.side === 'Right') {
                                    drumManager.updateActiveDrums({});
                                }
                            }
                        });
                    }
                }
            }
        },
        {
            key: "_getVisibleVideoParameters",
            value: function _getVisibleVideoParameters() {
                if (!this.videoElement || this.videoElement.videoWidth === 0 || this.videoElement.videoHeight === 0) {
                    return null;
                }
                var vNatW = this.videoElement.videoWidth;
                var vNatH = this.videoElement.videoHeight;
                var rW = this.renderDiv.clientWidth;
                var rH = this.renderDiv.clientHeight;
                if (vNatW === 0 || vNatH === 0 || rW === 0 || rH === 0) return null;
                var videoAR = vNatW / vNatH;
                var renderDivAR = rW / rH;
                var finalVideoPixelX, finalVideoPixelY;
                var visibleVideoPixelWidth, visibleVideoPixelHeight;
                if (videoAR > renderDivAR) {
                    // Video is wider than renderDiv, scaled to fit renderDiv height, cropped horizontally.
                    var scale = rH / vNatH; // Scale factor based on height.
                    var scaledVideoWidth = vNatW * scale; // Width of video if scaled to fit renderDiv height.
                    // Total original video pixels cropped horizontally (from both sides combined).
                    var totalCroppedPixelsX = (scaledVideoWidth - rW) / scale;
                    finalVideoPixelX = totalCroppedPixelsX / 2; // Pixels cropped from the left of original video.
                    finalVideoPixelY = 0; // No vertical cropping.
                    visibleVideoPixelWidth = vNatW - totalCroppedPixelsX; // Width of the visible part in original video pixels.
                    visibleVideoPixelHeight = vNatH; // Full height is visible.
                } else {
                    // Video is taller than renderDiv (or same AR), scaled to fit renderDiv width, cropped vertically.
                    var scale1 = rW / vNatW; // Scale factor based on width.
                    var scaledVideoHeight = vNatH * scale1; // Height of video if scaled to fit renderDiv width.
                    // Total original video pixels cropped vertically (from top and bottom combined).
                    var totalCroppedPixelsY = (scaledVideoHeight - rH) / scale1;
                    finalVideoPixelX = 0; // No horizontal cropping.
                    finalVideoPixelY = totalCroppedPixelsY / 2; // Pixels cropped from the top of original video.
                    visibleVideoPixelWidth = vNatW; // Full width is visible.
                    visibleVideoPixelHeight = vNatH - totalCroppedPixelsY; // Height of the visible part in original video pixels.
                }
                // Safety check for degenerate cases (e.g., extreme aspect ratios leading to zero visible dimension)
                if (visibleVideoPixelWidth <= 0 || visibleVideoPixelHeight <= 0) {
                    // Fallback or log error, this shouldn't happen in normal scenarios
                    console.warn("Calculated visible video dimension is zero or negative.", {
                        visibleVideoPixelWidth: visibleVideoPixelWidth,
                        visibleVideoPixelHeight: visibleVideoPixelHeight
                    });
                    return {
                        offsetX: 0,
                        offsetY: 0,
                        visibleWidth: vNatW,
                        visibleHeight: vNatH,
                        videoNaturalWidth: vNatW,
                        videoNaturalHeight: vNatH
                    };
                }
                return {
                    offsetX: finalVideoPixelX,
                    offsetY: finalVideoPixelY,
                    visibleWidth: visibleVideoPixelWidth,
                    visibleHeight: visibleVideoPixelHeight,
                    videoNaturalWidth: vNatW,
                    videoNaturalHeight: vNatH
                };
            }
        },
        {
            // _updateGhosts method removed.
            key: "_showStatusScreen",
            value: function _showStatusScreen(message) {
                var color = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 'white', showRestartHint = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false;
                this.gameOverContainer.style.display = 'block';
                this.gameOverText.innerText = message;
                this.gameOverText.style.color = color;
                this.restartHintText.style.display = showRestartHint ? 'block' : 'none';
                // No spawning to stop for template
            }
        },
        {
            key: "_showError",
            value: function _showError(message, showNoCameraMode) {
                var _this = this;

                // 分析错误类型并生成对应的解决方案
                var solutions = this._generateSolutions(message);

                // 创建错误显示界面
                var errorDiv = document.createElement('div');

                // 根据是否显示无摄像头模式来决定按钮
                var buttonsHtml = '';
                if (showNoCameraMode) {
                    buttonsHtml = `
                        <button id="no-camera-mode" style="padding: 12px 24px; font-size: 16px; background: #7B4394; color: white; border: none; border-radius: 8px; cursor: pointer; margin-right: 10px;">🎵 无摄像头模式</button>
                        <button id="retry-camera" style="padding: 12px 24px; font-size: 16px; background: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer; margin-right: 10px;">🔄 重试摄像头</button>
                        <button id="reload-page" style="padding: 12px 24px; font-size: 16px; background: #2196F3; color: white; border: none; border-radius: 8px; cursor: pointer;">🔃 刷新页面</button>
                    `;
                } else {
                    buttonsHtml = `
                        <button id="retry-camera" style="padding: 12px 24px; font-size: 16px; background: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer; margin-right: 10px;">🔄 重试摄像头</button>
                        <button id="reload-page" style="padding: 12px 24px; font-size: 16px; background: #2196F3; color: white; border: none; border-radius: 8px; cursor: pointer; margin-right: 10px;">🔃 刷新页面</button>
                        <button id="copy-url" style="padding: 12px 24px; font-size: 16px; background: #9c27b0; color: white; border: none; border-radius: 8px; cursor: pointer;">📋 复制HTTPS链接</button>
                    `;
                }

                errorDiv.innerHTML = `
                    <div style="position: relative;">
                        <button id="close-error-dialog" style="position: absolute; top: -10px; right: -10px; width: 30px; height: 30px; border-radius: 50%; background: #ff6b6b; color: white; border: none; cursor: pointer; font-size: 16px; font-weight: bold; z-index: 10; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); transition: all 0.2s ease;" title="关闭" onmouseover="this.style.background='#ff5252'; this.style.transform='scale(1.1)'" onmouseout="this.style.background='#ff6b6b'; this.style.transform='scale(1)'">×</button>

                        <div style="text-align: center; margin-bottom: 30px;">
                            <h2 style="color: #ff6b6b; margin: 0;">🚫 摄像头访问失败</h2>
                            <p style="font-size: 18px; margin: 15px 0; color: #ffa500;">${message}</p>
                            ${showNoCameraMode ? '<p style="font-size: 14px; color: #4ecdc4;">💡 您可以使用无摄像头模式来编辑和测试琶音、鼓组功能</p>' : ''}
                        </div>

                        <div style="text-align: left; margin-bottom: 30px;">
                            <h3 style="color: #4ecdc4; margin-bottom: 15px;">💡 解决方案：</h3>
                            ${solutions}
                        </div>

                        <div style="text-align: center;">
                            ${buttonsHtml}
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px; font-size: 14px; text-align: left;">
                        <strong style="color: #4ecdc4;">🔧 环境信息：</strong><br>
                        📍 协议: ${location.protocol}<br>
                        🌐 域名: ${location.hostname}<br>
                        🔒 安全上下文: ${window.isSecureContext ? '✅ 是' : '❌ 否'}<br>
                        🌍 浏览器: ${navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : navigator.userAgent.includes('Safari') ? 'Safari' : '其他'}
                    </div>
                `;

                errorDiv.style.cssText = `
                    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    color: white; z-index: 2000;
                    background: linear-gradient(135deg, rgba(26, 26, 26, 0.95), rgba(42, 42, 42, 0.95));
                    padding: 30px; border-radius: 16px;
                    font-family: 'Segoe UI', sans-serif; max-width: 600px; width: 90%;
                    border: 2px solid rgba(255, 165, 0, 0.3);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(10px);
                `;

                // 添加关闭按钮事件
                errorDiv.querySelector('#close-error-dialog').onclick = function () {
                    errorDiv.remove();
                };

                // 添加无摄像头模式按钮事件
                var noCameraModeBtn = errorDiv.querySelector('#no-camera-mode');
                if (noCameraModeBtn) {
                    noCameraModeBtn.onclick = function () {
                        errorDiv.remove();
                        _this._startNoCameraMode();
                    };
                }

                // 添加重试按钮事件
                errorDiv.querySelector('#retry-camera').onclick = function () {
                    errorDiv.remove();
                    _this._setupHandTracking().then(function () {
                        console.log('✅ 摄像头重试成功');
                        _this._startGame();
                    }).catch(function (error) {
                        console.error('❌ 摄像头重试失败:', error);
                        _this._showError('摄像头重试失败，请检查设备连接或权限设置');
                    });
                };

                // 添加刷新页面按钮事件
                errorDiv.querySelector('#reload-page').onclick = function () {
                    window.location.reload();
                };

                // 添加复制HTTPS链接按钮事件
                errorDiv.querySelector('#copy-url').onclick = function () {
                    var httpsUrl = 'https://' + location.hostname + location.pathname + location.search;
                    navigator.clipboard.writeText(httpsUrl).then(function () {
                        alert('HTTPS链接已复制到剪贴板！');
                    }).catch(function () {
                        prompt('复制此HTTPS链接:', httpsUrl);
                    });
                };

                this.renderDiv.appendChild(errorDiv);

                this.gameState = 'error';
                this.hands.forEach(function (hand) {
                    if (hand.lineGroup) hand.lineGroup.visible = false;
                });
            }
        },
        {
            key: "_generateSolutions",
            value: function _generateSolutions(message) {
                var solutions = [];

                if (message.includes('本地文件访问')) {
                    solutions.push('📁 <strong>本地开发解决方案：</strong><br>• 使用 <code>python -m http.server 8000</code> 启动本地服务器<br>• 或使用 <code>npx serve .</code><br>• 然后访问 <code>http://localhost:8000</code>');
                }

                if (message.includes('非HTTPS环境') || location.protocol === 'http:') {
                    solutions.push('🔒 <strong>HTTPS解决方案：</strong><br>• 部署到支持HTTPS的服务（GitHub Pages、Netlify、Vercel等）<br>• 或在本地使用 localhost 域名');
                }

                if (message.includes('权限已被拒绝')) {
                    solutions.push('🎥 <strong>权限设置：</strong><br>• 点击地址栏左侧的摄像头图标重新允许权限<br>• 或在浏览器设置 → 隐私和安全 → 网站设置 → 摄像头中允许此网站');
                }

                if (message.includes('未找到可用的摄像头设备')) {
                    solutions.push('📷 <strong>设备检查：</strong><br>• 确保摄像头已连接并在系统中启用<br>• 关闭其他正在使用摄像头的应用程序<br>• 重新插拔摄像头设备');
                }

                if (message.includes('被其他应用占用')) {
                    solutions.push('🔧 <strong>设备占用：</strong><br>• 关闭其他使用摄像头的程序（QQ、微信、Zoom等）<br>• 重启浏览器<br>• 重新插拔摄像头');
                }

                // 通用解决方案
                solutions.push('🌐 <strong>通用解决方案：</strong><br>• 尝试使用Chrome或Firefox浏览器<br>• 清除浏览器缓存和Cookie<br>• 检查防火墙或杀毒软件是否阻止摄像头访问');

                return solutions.map(function (solution, index) {
                    return `<div style="margin-bottom: 15px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 6px; border-left: 3px solid #4ecdc4;">${solution}</div>`;
                }).join('');
            }
        },
        {
            key: "_startGame",
            value: function _startGame() {
                var _this = this;
                console.log("Starting tracking...");

                // 添加音频上下文激活提示
                this._showAudioActivationPrompt();

                // This is now called automatically, so no need to check gameState
                this.musicManager.start().then(function () {
                    drumManager.startSequence(); // Start drums *after* audio context is ready.
                    // Setup the waveform visualizer after the music manager is ready
                    var analyser = _this.musicManager.getAnalyser();
                    if (analyser) {
                        _this.waveformVisualizer = new WaveformVisualizer(_this.scene, analyser, _this.renderDiv.clientWidth, _this.renderDiv.clientHeight);
                    }

                    // 游戏初始化完成，状态面板将由main.js中的StatusUpdater处理

                    // 移除音频激活提示
                    _this._hideAudioActivationPrompt();
                }).catch(function (error) {
                    console.error('音频初始化失败:', error);
                    _this._showError('音频系统初始化失败，请刷新页面重试');
                });

                this.gameState = 'tracking'; // Changed from 'playing'
                this.lastVideoTime = -1;
                this.clock.start();
                // Removed display of score, castle, chad
                // Removed _startSpawning()
            }
        },
        {
            key: "_startNoCameraMode",
            value: function _startNoCameraMode() {
                var _this = this;
                console.log("🎵 启动无摄像头模式...");

                // 设置无摄像头模式标志
                this.noCameraMode = true;
                this.gameState = 'no-camera';

                // 隐藏摄像头相关的提示文本
                var infoText = document.getElementById('info-text');
                if (infoText) {
                    infoText.textContent = '🎵 无摄像头模式 - 使用编辑器创作音乐';
                    infoText.style.fontSize = 'clamp(18px, 3vw, 32px)';
                }

                // 添加音频上下文激活提示
                this._showAudioActivationPrompt();

                // 初始化音频系统
                this.musicManager.start().then(function () {
                    drumManager.startSequence();

                    // Setup the waveform visualizer
                    var analyser = _this.musicManager.getAnalyser();
                    if (analyser) {
                        _this.waveformVisualizer = new WaveformVisualizer(_this.scene, analyser, _this.renderDiv.clientWidth, _this.renderDiv.clientHeight);
                    }

                    // 显示无摄像头模式的特殊提示
                    _this._showNoCameraModeGuide();

                    // 移除音频激活提示
                    _this._hideAudioActivationPrompt();

                    console.log('✅ 无摄像头模式启动完成');
                }).catch(function (error) {
                    console.error('音频初始化失败:', error);
                    _this._showError('音频系统初始化失败，请刷新页面重试');
                });

                this.clock.start();
            }
        },
        {
            key: "_showNoCameraModeGuide",
            value: function _showNoCameraModeGuide() {
                var _this = this;
                document.getElementById('no-camera-guide')?.remove();
                var guideDiv = document.createElement('div');
                guideDiv.id = 'no-camera-guide';
                guideDiv.className = 'no-camera-card';
                guideDiv.innerHTML = `
                    <p class="no-camera-card__kicker">CAMERA / FALLBACK</p>
                    <h3>摄像头未连接</h3>
                    <p>已进入手动体验。你可以重试摄像头，或先继续浏览音乐场景。</p>
                    <div class="no-camera-card__actions">
                        <button id="retry-camera" type="button">重试摄像头</button>
                        <button id="continue-manual" type="button">继续手动模式</button>
                    </div>
                `;
                this.renderDiv.appendChild(guideDiv);
                guideDiv.querySelector('#retry-camera').onclick = function () {
                    guideDiv.remove();
                    _this.noCameraMode = false;
                    _this._setupHandTracking().then(function () {
                        _this._startGame();
                    }).catch(function (error) {
                        console.error('摄像头重试失败:', error);
                        _this._showNoCameraModeGuide();
                    });
                };
                guideDiv.querySelector('#continue-manual').onclick = function () {
                    guideDiv.remove();
                };
            }
        },
        {
            key: "_showAudioActivationPrompt",
            value: function _showAudioActivationPrompt() {
                if (this.audioPromptDiv) return; // 避免重复显示

                this.audioPromptDiv = document.createElement('button');
                this.audioPromptDiv.type = 'button';
                this.audioPromptDiv.className = 'audio-activation-chip';
                this.audioPromptDiv.innerHTML = '<span aria-hidden="true"></span><strong>点击画面 · 启动声音</strong>';

                this.renderDiv.appendChild(this.audioPromptDiv);

                var activateAudio = async () => {
                    try {
                        if (window.Tone && Tone.context.state !== 'running') await Tone.start();
                        this._hideAudioActivationPrompt();
                    } catch (error) {
                        console.error('音频上下文激活失败:', error);
                        this.audioPromptDiv?.classList.add('is-error');
                        var label = this.audioPromptDiv?.querySelector('strong');
                        if (label) label.textContent = '重试声音';
                    }
                };

                this.audioPromptDiv.addEventListener('click', activateAudio);
                this.renderDiv.addEventListener('pointerdown', activateAudio, { once: true });
            }
        },
        {
            key: "_hideAudioActivationPrompt",
            value: function _hideAudioActivationPrompt() {
                if (this.audioPromptDiv) {
                    this.audioPromptDiv.remove();
                    this.audioPromptDiv = null;
                }
            }
        },
        {
            key: "_restartGame",
            value: function _restartGame() {
                console.log("Restarting tracking...");
                this.gameOverContainer.style.display = 'none';
                this.hands.forEach(function (hand) {
                    if (hand.lineGroup) {
                        hand.lineGroup.visible = false;
                    }
                });
                // Ghost removal removed
                // Score reset removed
                // Visibility of game elements removed
                this.gameState = 'tracking'; // Changed from 'playing'
                this.lastVideoTime = -1;
                this.clock.start();
                // Removed _startSpawning()
            }
        },
        {
            // _updateScoreDisplay method removed.
            key: "_onResize",
            value: function _onResize() {
                var width = this.renderDiv.clientWidth;
                var height = this.renderDiv.clientHeight;
                // Update camera perspective
                this.camera.left = width / -2;
                this.camera.right = width / 2;
                this.camera.top = height / 2;
                this.camera.bottom = height / -2;
                this.camera.updateProjectionMatrix();
                // Update renderer size
                this.renderer.setSize(width, height);
                // Update video element size
                this.videoElement.style.width = width + 'px';
                this.videoElement.style.height = height + 'px';
                // Watermelon, Chad, GroundLine updates removed.
                this._positionBeatIndicators();
                if (this.waveformVisualizer) {
                    this.waveformVisualizer.updatePosition(width, height);
                }
            }
        },
        {
            key: "_positionBeatIndicators",
            value: function _positionBeatIndicators() {
                var width = this.renderDiv.clientWidth;
                var height = this.renderDiv.clientHeight;
                var totalWidth = width * 0.8; // Occupy 80% of screen width to match the waveform
                var spacing = totalWidth / 16;
                var startX = -totalWidth / 2 + spacing / 2;
                var yPos = -height / 2 + 150; // Positioned a bit higher from the bottom
                this.beatIndicators.forEach(function (indicator, i) {
                    indicator.position.set(startX + i * spacing, yPos, 1);
                });
            }
        },
        {
            key: "_setupBeatIndicatorMaterials",
            value: function _setupBeatIndicatorMaterials() {
                // All indicators start as 'off' (white)
                for (var i = 0; i < 16; i++) {
                    // We just need one material definition now and will copy it.
                    this.beatIndicatorMaterials[i] = new THREE.MeshBasicMaterial({
                        color: this.beatIndicatorColors.off,
                        transparent: true,
                        opacity: 0.5
                    });
                }
            }
        },
        {
            key: "_createTextSprite",
            value: function _createTextSprite(message, parameters) {
                parameters = parameters || {};
                var fontface = parameters.fontface || 'Arial';
                var fontsize = parameters.fontsize || 24;
                // borderColor is no longer needed
                var backgroundColor = parameters.backgroundColor || {
                    r: 255,
                    g: 255,
                    b: 255,
                    a: 0.8
                };
                var textColor = parameters.textColor || {
                    r: 0,
                    g: 0,
                    b: 0,
                    a: 1.0
                };
                var canvas = document.createElement('canvas');
                var context = canvas.getContext('2d');
                context.font = "Bold ".concat(fontsize, "px ").concat(fontface);
                // get size data (height depends only on font size)
                var metrics = context.measureText(message);
                var textWidth = metrics.width;
                var padding = 10;
                var canvasWidth = textWidth + padding * 2;
                var canvasHeight = fontsize * 1.4 + padding;
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
                // Font needs to be re-applied after resizing canvas
                context.font = "Bold ".concat(fontsize, "px ").concat(fontface);
                // background color
                context.fillStyle = "rgba(".concat(backgroundColor.r, ",").concat(backgroundColor.g, ",").concat(backgroundColor.b, ",").concat(backgroundColor.a, ")");
                context.fillRect(0, 0, canvasWidth, canvasHeight);
                // text color and position
                context.fillStyle = "rgba(".concat(textColor.r, ", ").concat(textColor.g, ", ").concat(textColor.b, ", 1.0)");
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                context.fillText(message, canvasWidth / 2, canvasHeight / 2);
                // canvas contents will be used for a texture
                var texture = new THREE.CanvasTexture(canvas);
                texture.needsUpdate = true;
                var spriteMaterial = new THREE.SpriteMaterial({
                    map: texture
                });
                var sprite = new THREE.Sprite(spriteMaterial);
                sprite.scale.set(canvas.width, canvas.height, 1.0);
                return sprite;
            }
        },
        {
            key: "_getFingerStates",
            value: function _getFingerStates(landmarks) {
                // Landmark indices for fingertips
                var fingertips = {
                    index: 8,
                    middle: 12,
                    ring: 16,
                    pinky: 20
                };
                // Stricter check using the joint below the tip (PIP joint) to avoid false positives.
                var fingerJointsBelowTip = {
                    index: 6,
                    middle: 10,
                    ring: 14,
                    pinky: 18
                };
                var states = {};
                var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                try {
                    for (var _iterator = Object.entries(fingertips)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var _step_value = _sliced_to_array(_step.value, 2), finger = _step_value[0], tipIndex = _step_value[1];
                        var jointIndex = fingerJointsBelowTip[finger];
                        if (landmarks[tipIndex] && landmarks[jointIndex]) {
                            // A finger is "up" if its tip is higher than the joint just below it.
                            states[finger] = landmarks[tipIndex].y < landmarks[jointIndex].y;
                        } else {
                            states[finger] = false;
                        }
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return != null) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
                return states;
            }
        },
        {
            key: "_isFist",
            value: function _isFist(landmarks) {
                if (!landmarks || landmarks.length < 21) return false;

                // 使用手腕(0)到中指MCP(9)的距离作为手部大小参考
                var wrist = landmarks[0];
                var palmCenter = landmarks[9]; // 中指MCP作为手掌中心
                var wristToPalmDx = palmCenter.x - wrist.x;
                var wristToPalmDy = palmCenter.y - wrist.y;
                var palmSize = Math.sqrt(wristToPalmDx * wristToPalmDx + wristToPalmDy * wristToPalmDy);

                // 如果手掌大小太小（手太远），使用最小阈值防止误判
                // 典型的手掌大小在归一化坐标中约为 0.15-0.25
                var minPalmSize = 0.05;
                if (palmSize < minPalmSize) {
                    // 手太远，无法可靠检测握拳，返回false以避免误判
                    return false;
                }

                var fingertipsIndices = [
                    4,
                    8,
                    12,
                    16,
                    20
                ]; // Thumb, Index, Middle, Ring, Pinky

                // 动态阈值：基于手掌大小的比例
                // 当手近时（palmSize大），阈值也大；手远时（palmSize小），阈值也小
                // 握拳时指尖到手掌中心的距离约为手掌大小的 60-70%
                var fistThresholdRatio = 0.65; // 指尖到手掌中心距离与手掌大小的比值阈值
                var fistThreshold = palmSize * fistThresholdRatio;

                var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                try {
                    for (var _iterator = fingertipsIndices[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var tipIndex = _step.value;
                        var tip = landmarks[tipIndex];
                        var dx = tip.x - palmCenter.x;
                        var dy = tip.y - palmCenter.y;
                        var distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance > fistThreshold) {
                            return false; // At least one finger is open
                        }
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return != null) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
                return true; // All fingertips are close to the palm
            }
        },
        {
            key: "_isPalmFacingAway",
            value: function _isPalmFacingAway(landmarks) {
                if (!landmarks || landmarks.length < 21) return false;

                // 使用手指位移模式检测手掌翻转，而不是依赖不稳定的Z坐标

                // MediaPipe 手部关键点索引
                var wrist = landmarks[0];        // 手腕
                var thumbTip = landmarks[4];     // 拇指指尖
                var indexTip = landmarks[8];     // 食指指尖
                var middleTip = landmarks[12];   // 中指指尖
                var ringTip = landmarks[16];     // 无名指指尖
                var pinkyTip = landmarks[20];    // 小指指尖

                // 方法1: 检测拇指相对于其他手指的位置关系
                var indexToMiddleX = middleTip.x - indexTip.x;
                var thumbToIndexX = indexTip.x - thumbTip.x;

                // 方法2: 检测手指排列的整体方向
                // 正常情况下，从食指到小指应该有一定的X坐标递减或递增趋势
                var fingerProgression = (ringTip.x - indexTip.x) * (pinkyTip.x - middleTip.x);

                // 方法3: 手掌中心相对于手指的位置
                var palmCenterX = (indexTip.x + middleTip.x + ringTip.x) / 3;
                var thumbRelativePos = thumbTip.x - palmCenterX;

                // 翻转检测逻辑：
                // 1. 拇指位置发生显著变化
                var thumbShiftDetected = Math.abs(thumbToIndexX) < 0.02; // 拇指和食指X坐标过于接近

                // 2. 手指排列顺序异常
                var progressionAnomaly = fingerProgression < 0; // 排列方向异常

                // 3. 手掌几何关系异常
                var geometryAnomaly = Math.abs(thumbRelativePos) > 0.15; // 拇指偏离手掌中心过远

                // 需要至少两个条件同时满足才认为是翻转
                var anomalyCount = 0;
                if (thumbShiftDetected) anomalyCount++;
                if (progressionAnomaly) anomalyCount++;
                if (geometryAnomaly) anomalyCount++;

                // 调试信息（可以在控制台查看检测过程）
                if (anomalyCount >= 2) {
                    console.log('🔄 检测到手掌翻转:', {
                        拇指位移: thumbShiftDetected,
                        排列异常: progressionAnomaly,
                        几何异常: geometryAnomaly,
                        异常计数: anomalyCount
                    });
                }

                return anomalyCount >= 2;
            }
        },
        {
            key: "_isAllFingersOpen",
            value: function _isAllFingersOpen(landmarks) {
                if (!landmarks || landmarks.length < 21) return false;

                // 更稳定的检测方式：检测所有手指是否张开
                var fingerStates = this._getFingerStates(landmarks);
                var allFingersUp = Object.values(fingerStates).every(function (isUp) {
                    return isUp;
                });

                if (allFingersUp) {
                    console.log('✋ 检测到所有手指张开');
                }

                return allFingersUp;
            }
        },
        {
            key: "_isFourFingersVertical",
            value: function _isFourFingersVertical(landmarks) {
                if (!landmarks || landmarks.length < 21) {
                    return false;
                }

                // 检测右手4个指头竖直排列的手势（朝向屏幕）
                var fingerStates = this._getFingerStates(landmarks);

                // 1. 检查4个手指（食指、中指、无名指、小指）是否都伸直
                var fourFingersUp = fingerStates.index && fingerStates.middle &&
                    fingerStates.ring && fingerStates.pinky;

                if (!fourFingersUp) {
                    return false;
                }

                // 2. 额外的手指伸直度检查 - 避免握拳后松开时的误触
                if (!this._areFingersProperlyStraight(landmarks)) {
                    return false;
                }

                // 3. **新逻辑**：检查4个手指的x坐标是否基本在同一竖直线上（竖直排列朝向屏幕）
                var indexTip = landmarks[8];   // 食指指尖
                var middleTip = landmarks[12]; // 中指指尖
                var ringTip = landmarks[16];   // 无名指指尖
                var pinkyTip = landmarks[20];  // 小指指尖

                // 收集所有手指的x坐标
                var xCoordinates = [indexTip.x, middleTip.x, ringTip.x, pinkyTip.x];

                // 计算x坐标的最大值和最小值
                var maxX = Math.max(...xCoordinates);
                var minX = Math.min(...xCoordinates);

                // 计算x坐标的差值范围
                var xSpread = maxX - minX;

                // 竖直排列阈值：如果四个手指的x坐标差值小于这个值，认为是竖直排列
                var verticalThreshold = 0.02; // 相对于视频尺寸的比例

                var fingersVertical = xSpread < verticalThreshold;

                // 可选：添加调试日志（降低频率）
                if (fingersVertical && Math.random() < 0.1) { // 只有10%的概率输出日志
                    console.log(`✅ 四指竖直排列检测成功: x坐标差值=${xSpread.toFixed(4)}, 阈值=${verticalThreshold}`);
                }

                return fingersVertical;
            }
        },

        {
            key: "_areFingersProperlyStraight",
            value: function _areFingersProperlyStraight(landmarks) {
                // 更严格的手指伸直检查，避免握拳后松开时的误触

                // 检查每个手指的多个关节点，确保真正伸直
                var fingerJoints = {
                    index: [5, 6, 7, 8],   // 食指：MCP, PIP, DIP, TIP
                    middle: [9, 10, 11, 12], // 中指：MCP, PIP, DIP, TIP  
                    ring: [13, 14, 15, 16],  // 无名指：MCP, PIP, DIP, TIP
                    pinky: [17, 18, 19, 20]  // 小指：MCP, PIP, DIP, TIP
                };

                var straightnessResults = {};
                var minStraightnessThreshold = 0.02; // 手指伸直度最小阈值

                for (var fingerName in fingerJoints) {
                    var joints = fingerJoints[fingerName];
                    var mcp = landmarks[joints[0]];   // 掌指关节
                    var pip = landmarks[joints[1]];   // 近端指间关节
                    var dip = landmarks[joints[2]];   // 远端指间关节
                    var tip = landmarks[joints[3]];   // 指尖

                    // 计算手指的整体伸直程度
                    // 真正伸直的手指，从掌指关节到指尖应该是相对直线的
                    var mcpTipDistance = Math.sqrt(
                        Math.pow(tip.x - mcp.x, 2) +
                        Math.pow(tip.y - mcp.y, 2)
                    );

                    var mcpPipDistance = Math.sqrt(
                        Math.pow(pip.x - mcp.x, 2) +
                        Math.pow(pip.y - mcp.y, 2)
                    );

                    var pipDipDistance = Math.sqrt(
                        Math.pow(dip.x - pip.x, 2) +
                        Math.pow(dip.y - pip.y, 2)
                    );

                    var dipTipDistance = Math.sqrt(
                        Math.pow(tip.x - dip.x, 2) +
                        Math.pow(tip.y - dip.y, 2)
                    );

                    // 总的关节间距离
                    var totalJointDistance = mcpPipDistance + pipDipDistance + dipTipDistance;

                    // 直线距离与关节间距离的比值，越接近1越直
                    var straightnessRatio = mcpTipDistance / totalJointDistance;

                    straightnessResults[fingerName] = {
                        ratio: straightnessRatio,
                        isStraight: straightnessRatio > (1 - minStraightnessThreshold)
                    };
                }

                // 所有4个手指都需要达到伸直度要求
                var allFingersStraight = straightnessResults.index.isStraight &&
                    straightnessResults.middle.isStraight &&
                    straightnessResults.ring.isStraight &&
                    straightnessResults.pinky.isStraight;

                return allFingersStraight;
            }
        },
        {
            key: "_updateHandLines",
            value: function _updateHandLines(handIndex, landmarks, videoParams, canvasWidth, canvasHeight, controlData) {
                var _this = this;
                // 添加安全检查
                if (!this.hands || handIndex >= this.hands.length || !this.hands[handIndex]) {
                    console.warn(`Invalid hand index ${handIndex} or hands not initialized`);
                    return;
                }
                var hand = this.hands[handIndex];
                if (!hand || !hand.lineGroup) {
                    console.warn(`Hand ${handIndex} or lineGroup not properly initialized`);
                    return;
                }
                var lineGroup = hand.lineGroup;
                // Clean up previous frame's objects
                while (lineGroup.children.length) {
                    var child = lineGroup.children[0];
                    lineGroup.remove(child);
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        // For sprites, we need to dispose the texture map as well
                        if (child.material.map) child.material.map.dispose();
                        child.material.dispose();
                    }
                }
                if (!landmarks || landmarks.length === 0 || !videoParams) {
                    lineGroup.visible = false;
                    return;
                }
                var points3D = landmarks.map(function (lm) {
                    var lmOriginalX = lm.x * videoParams.videoNaturalWidth;
                    var lmOriginalY = lm.y * videoParams.videoNaturalHeight;
                    var normX_visible = (lmOriginalX - videoParams.offsetX) / videoParams.visibleWidth;
                    var normY_visible = (lmOriginalY - videoParams.offsetY) / videoParams.visibleHeight;
                    normX_visible = Math.max(0, Math.min(1, normX_visible));
                    normY_visible = Math.max(0, Math.min(1, normY_visible));
                    var x = (1 - normX_visible) * canvasWidth - canvasWidth / 2;
                    var y = (1 - normY_visible) * canvasHeight - canvasHeight / 2;
                    return new THREE.Vector3(x, y, 1.1); // Z for fingertip circles
                });
                // --- Draw Skeleton Lines ---
                var lineZ = 1;
                this.handConnections.forEach(function (conn) {
                    var p1 = points3D[conn[0]];
                    var p2 = points3D[conn[1]];
                    if (p1 && p2) {
                        var lineP1 = p1.clone().setZ(lineZ);
                        var lineP2 = p2.clone().setZ(lineZ);
                        var geometry = new THREE.BufferGeometry().setFromPoints([
                            lineP1,
                            lineP2
                        ]);
                        var line = new THREE.Line(geometry, _this.handLineMaterial);
                        lineGroup.add(line);
                    }
                });
                // --- Draw Fingertip & Wrist Circles ---
                var fingertipRadius = 8, wristRadius = 12, circleSegments = 16;
                this.fingertipLandmarkIndices.forEach(function (index) {
                    var landmarkPosition = points3D[index];
                    if (landmarkPosition) {
                        var radius = index === 0 ? wristRadius : fingertipRadius;
                        var circleGeometry = new THREE.CircleGeometry(radius, circleSegments);
                        var material = handIndex === 0 ? _this.fingertipMaterialHand1 : _this.fingertipMaterialHand2;
                        var landmarkCircle = new THREE.Mesh(circleGeometry, material);
                        landmarkCircle.position.copy(landmarkPosition);
                        lineGroup.add(landmarkCircle);
                    }
                });
                // --- Draw Thumb-to-Index line and Labels ---
                var thumbPos = points3D[4];
                var indexPos = points3D[8];
                var wristPos = points3D[0];

                // 简化模式下跳过所有文本标签的渲染，但添加颜色方块标识
                if (this.simpleMode) {
                    // 仅在左手绘制拇指-食指连线（用于音量控制的视觉反馈）
                    if (handIndex === 0 && thumbPos && indexPos) {
                        var lineGeom = new THREE.BufferGeometry().setFromPoints([
                            thumbPos,
                            indexPos
                        ]);
                        var line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({
                            color: 0xffffff,
                            linewidth: 3
                        }));
                        lineGroup.add(line);
                    }

                    // 在手腕位置添加颜色方块标识
                    if (wristPos) {
                        var indicatorSize = 20; // 方块大小
                        var indicatorGeometry = new THREE.PlaneGeometry(indicatorSize, indicatorSize);

                        // 左手（Melody）= 绿色，右手（Drums）= 红色
                        var indicatorColor = handIndex === 0 ? 0x84C34E : 0xD72828;
                        var indicatorMaterial = new THREE.MeshBasicMaterial({
                            color: indicatorColor,
                            transparent: true,
                            opacity: 0.9
                        });

                        var indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
                        indicator.position.set(wristPos.x, wristPos.y + 35, 2);
                        lineGroup.add(indicator);
                    }

                    lineGroup.visible = true;
                    return; // 简化模式直接返回，不渲染文本标签
                }

                if (wristPos) {
                    // Labels depend on which hand it is
                    if (handIndex === 0 && thumbPos && indexPos) {
                        // Connecting line
                        var lineGeom = new THREE.BufferGeometry().setFromPoints([
                            thumbPos,
                            indexPos
                        ]);
                        var line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({
                            color: 0xffffff,
                            linewidth: 3
                        }));
                        lineGroup.add(line);
                        // Volume and Pitch labels
                        var note = controlData.note, velocity = controlData.velocity, isFist = controlData.isFist;
                        if (isFist) {
                            var fistLabel = this._createTextSprite("SYNTH ".concat(this.musicManager.currentSynthIndex + 1), {
                                fontsize: 22,
                                backgroundColor: this.labelColors.evaPurple,
                                textColor: this.labelColors.evaGreen
                            });
                            fistLabel.position.set(wristPos.x, wristPos.y + 60, 2);
                            lineGroup.add(fistLabel);
                        } else {
                            var midPoint = new THREE.Vector3().lerpVectors(thumbPos, indexPos, 0.5);
                            var volumeLabel = this._createTextSprite("Volume: ".concat(velocity.toFixed(2)), {
                                fontsize: 18,
                                backgroundColor: this.labelColors.evaOrange,
                                textColor: this.labelColors.white
                            });
                            volumeLabel.position.set(midPoint.x, midPoint.y, 2);
                            lineGroup.add(volumeLabel);
                            var pitchLabel = this._createTextSprite("Pitch: ".concat(note), {
                                fontsize: 18,
                                backgroundColor: this.labelColors.evaGreen,
                                textColor: this.labelColors.black
                            });
                            pitchLabel.position.set(wristPos.x, wristPos.y + 60, 2); // Position above the wrist
                            lineGroup.add(pitchLabel);
                        }
                    } else if (handIndex === 1) {
                        var fingerStates = controlData.fingerStates;
                        var activeDrums = Object.entries(fingerStates).filter(function (param) {
                            var _param = _sliced_to_array(param, 2), _ = _param[0], isUp = _param[1];
                            return isUp;
                        }).map(function (param) {
                            var _param = _sliced_to_array(param, 2), finger = _param[0], _ = _param[1];
                            return drumManager.getFingerToDrumMap()[finger];
                        }).join(', ');
                        var drumLabel = this._createTextSprite("Drums: ".concat(activeDrums || 'None'), {
                            fontsize: 18,
                            backgroundColor: this.labelColors.evaRed,
                            textColor: this.labelColors.white
                        });
                        drumLabel.position.set(wristPos.x, wristPos.y + 60, 2);
                        lineGroup.add(drumLabel);
                    }
                }
                lineGroup.visible = true;
            }
        },
        {
            key: "_animate",
            value: function _animate() {
                requestAnimationFrame(this._animate.bind(this));
                if (this.gameState === 'tracking') {
                    var deltaTime = this.clock.getDelta();
                    this._updateHands();
                    this._updateBeatIndicator();
                    if (this.waveformVisualizer) {
                        this.waveformVisualizer.update();
                    }
                    // 低频率采样与更新（不会影响帧率）
                    this._sampleDelayDistanceIfDue();
                    this._updateDelayLevelIfDue();
                }
                this.renderer.render(this.scene, this.camera);
            }
        },
        {
            key: "_updateBeatIndicator",
            value: function _updateBeatIndicator() {
                var _this = this;
                var currentBeat = drumManager.getCurrentBeat();
                var progress = Tone.Transport.progress;
                var beatProgress = progress * 16 % 1;
                var pulse = 1.5 + 0.5 * Math.cos(beatProgress * Math.PI * 2);
                var activeDrums = drumManager.getActiveDrums();
                var drumPattern = drumManager.getDrumPattern();
                var drumPriority = [
                    'kick',
                    'snare',
                    'clap',
                    'hihat'
                ];
                this.beatIndicators.forEach(function (indicator, i) {
                    // Determine the color for this step based on active drums
                    var stepColor = _this.beatIndicatorColors.off;
                    var isHit = false;
                    var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                    try {
                        for (var _iterator = drumPriority[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            var drum = _step.value;
                            if (activeDrums.has(drum) && drumPattern[drum][i]) {
                                stepColor = _this.beatIndicatorColors[drum];
                                isHit = true;
                                break;
                            }
                        }
                    } catch (err) {
                        _didIteratorError = true;
                        _iteratorError = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion && _iterator.return != null) {
                                _iterator.return();
                            }
                        } finally {
                            if (_didIteratorError) {
                                throw _iteratorError;
                            }
                        }
                    }
                    indicator.material.color.set(stepColor);
                    indicator.material.opacity = isHit ? 0.9 : 0.5;
                    // Apply pulse only to the current beat marker
                    if (i === currentBeat) {
                        indicator.scale.set(pulse, pulse, 1);
                    } else {
                        indicator.scale.set(1, 1, 1);
                    }
                });
            }
        },
        {
            key: "_setupEventListeners",
            value: function _setupEventListeners() {
                var _this = this;

                // 点击恢复音频上下文
                this.renderDiv.addEventListener('click', function () {
                    if (Tone.context.state !== 'running') {
                        Tone.start();
                    }
                });

                // 帮助按钮功能
                var helpToggle = document.getElementById('help-toggle');
                var helpPanel = document.getElementById('help-panel');
                if (helpToggle && helpPanel) {
                    helpToggle.addEventListener('click', function () {
                        helpPanel.classList.toggle('hidden');
                    });

                    // 点击外部关闭帮助面板
                    document.addEventListener('click', function (event) {
                        if (!helpToggle.contains(event.target) && !helpPanel.contains(event.target)) {
                            helpPanel.classList.add('hidden');
                        }
                    });
                }

                // 窗口大小变化处理
                window.addEventListener('resize', this._onResize.bind(this));

                // 初始化 Delay 控制 UI
                this._initDelayControlUI();
            }
        },
        {
            key: "_initDelayControlUI",
            value: function _initDelayControlUI() {
                var panel = document.getElementById('delay-control-panel');
                if (!panel) return;
                var autoToggle = document.getElementById('delay-auto-toggle');
                var wetSlider = document.getElementById('delay-wet-slider');
                var collapseBtn = document.getElementById('delay-collapse');
                var levelLabel = document.getElementById('delay-level-label');
                if (autoToggle) {
                    autoToggle.checked = this.delayCtrl.auto;
                    autoToggle.addEventListener('change', () => {
                        this.delayCtrl.auto = !!autoToggle.checked;
                    });
                }
                if (wetSlider) {
                    var v = parseFloat(wetSlider.value);
                    if (!isNaN(v)) this.delayCtrl.baseWet = v;
                    wetSlider.addEventListener('input', () => {
                        var val = Math.max(0, Math.min(1, parseFloat(wetSlider.value)));
                        // 限制最大 0.7，与 HTML 属性一致
                        val = Math.min(val, 0.7);
                        this.delayCtrl.baseWet = val;
                        // 立即应用当前湿度（不再随档位线性变化）
                        var wet = this.delayCtrl.baseWet;
                        if (window.game && this.musicManager && this.musicManager.setDelayWet) {
                            this.musicManager.setDelayWet(wet);
                        }
                    });
                }
                if (collapseBtn) {
                    collapseBtn.addEventListener('click', () => {
                        var collapsed = panel.getAttribute('data-collapsed') === '1';
                        if (!collapsed) {
                            // 折叠除 Level/折叠按钮 以外的控件
                            Array.from(panel.children).forEach((el) => {
                                if (el.id !== 'delay-level-label' && el.id !== 'delay-collapse') {
                                    el.style.display = 'none';
                                }
                            });
                            panel.setAttribute('data-collapsed', '1');
                            collapseBtn.textContent = '▸';
                        } else {
                            Array.from(panel.children).forEach((el) => {
                                el.style.display = '';
                            });
                            panel.setAttribute('data-collapsed', '0');
                            collapseBtn.textContent = '▾';
                        }
                    });
                }
                // 更新一次显示
                if (levelLabel) levelLabel.textContent = 'Level: ' + this.delayCtrl.level;
            }
        },
        {
            key: "_sampleDelayDistanceIfDue",
            value: function _sampleDelayDistanceIfDue() {
                if (this.interactionSuppressed) return;
                var now = performance.now();
                if (now - (this.delayCtrl.lastSampleTs || 0) < this.delayCtrl.sampleIntervalMs) return;
                this.delayCtrl.lastSampleTs = now;
                // 两只手都存在才采样（不区分左右，只取两只手）
                if (!this.hands || this.hands.length < 2) return;
                var lmA = (this.hands[0] && this.hands[0].landmarks) ? this.hands[0].landmarks : null;
                var lmB = (this.hands[1] && this.hands[1].landmarks) ? this.hands[1].landmarks : null;
                if (!lmA || !lmB || lmA.length < 21 || lmB.length < 21) return;
                var xA = (lmA && lmA[4]) ? lmA[4].x : undefined; // 拇指指尖
                var xB = (lmB && lmB[4]) ? lmB[4].x : undefined;
                if (typeof xA !== 'number' || typeof xB !== 'number') return;
                var d = Math.abs(xA - xB);
                this._updateDelayDiagnostics(d);
                // 维护环形缓冲（最大 50）
                var buf = this.delayCtrl.buffer;
                buf.push(d);
                if (buf.length > this.delayCtrl.bufferSize) buf.shift();
                // 未进入模式，检查是否满足 5s 稳定
                if (!this.delayCtrl.active && buf.length === this.delayCtrl.bufferSize) {
                    var std = this._computeStd(buf);
                    if (std < this.delayCtrl.stdThreshold) {
                        // 标定基准为中位数，初始关闭
                        this.delayCtrl.baseline = this._computeMedian(buf);
                        this.delayCtrl.active = true;
                        this.delayCtrl.level = 0;
                        if (this.musicManager && this.musicManager.setDelayTimeBeats) this.musicManager.setDelayTimeBeats(0);
                        // 不强制改动湿度，保持用户设置
                        // 提示：Delay control ready
                        this._showInfoTransient('🎚️ Delay control ready (hold both hands to adjust)', 2000);
                        var label = document.getElementById('delay-level-label');
                        if (label) label.textContent = 'Level: 0';
                    }
                }
            }
        },
        {
            key: "_updateDelayDiagnostics",
            value: function _updateDelayDiagnostics(distance) {
                var deck = document.getElementById('control-deck');
                if (!deck || deck.hidden) return;
                var level = this.delayCtrl && typeof this.delayCtrl.level === 'number' ? this.delayCtrl.level : 0;
                var beats = [0, 0.25, 0.5, 0.75, 1][level] || 0;
                var distanceValue = document.getElementById('delay-distance-value');
                var levelValue = document.getElementById('delay-level-value');
                if (distanceValue) distanceValue.textContent = Number(distance).toFixed(3);
                if (levelValue) levelValue.textContent = `L${level} / ${beats.toFixed(2)}B`;
            }
        },
        {
            key: "_showInfoTransient",
            value: function _showInfoTransient(msg, durationMs) {
                var statusElement = document.getElementById('info-text');
                if (!statusElement) return;
                var prev = statusElement.textContent;
                var prevColor = statusElement.style.color;
                statusElement.textContent = msg;
                statusElement.style.color = '#7B4394';
                setTimeout(() => {
                    statusElement.textContent = prev || '';
                    statusElement.style.color = prevColor || '#FFFFFF';
                }, Math.max(1000, durationMs || 2000));
            }
        },
        {
            key: "_updateDelayLevelIfDue",
            value: function _updateDelayLevelIfDue() {
                if (this.interactionSuppressed) return;
                if (!this.delayCtrl.active || !this.delayCtrl.auto) return;
                var now = performance.now();
                if (now - (this.delayCtrl.lastUpdateTs || 0) < this.delayCtrl.updateCooldownMs) return;
                // 取最近一次样本
                var buf = this.delayCtrl.buffer;
                if (!buf || buf.length === 0) return;
                var d = buf[buf.length - 1];
                var delta = Math.max(0, Math.min(this.delayCtrl.maxRange, d - this.delayCtrl.baseline));
                var norm = this.delayCtrl.maxRange > 0 ? (delta / this.delayCtrl.maxRange) : 0;
                var thresholds = [0.25, 0.5, 0.75, 1.0];
                var target = 0;
                for (var i = 0; i < thresholds.length; i++) {
                    if (norm >= thresholds[i] - this.delayCtrl.hysteresis) target = i + 1;
                }
                if (target === this.delayCtrl.level) return;
                // 应用
                this.delayCtrl.level = target;
                this.delayCtrl.lastUpdateTs = now;
                var beatsMap = [0, 0.25, 0.5, 0.75, 1.0];
                var beats = beatsMap[target];
                if (this.musicManager && this.musicManager.setDelayTimeBeats) this.musicManager.setDelayTimeBeats(beats);
                // 湿度随档位线性增加（不高）：Level/N * baseWet
                // 湿度不再自动随档位变化，由用户滑杆控制
                var label = document.getElementById('delay-level-label');
                if (label) label.textContent = 'Level: ' + target;
            }
        },
        {
            key: "_computeMedian",
            value: function _computeMedian(arr) {
                if (!arr || arr.length === 0) return 0;
                var a = arr.slice().sort(function (x, y) { return x - y; });
                var mid = Math.floor(a.length / 2);
                return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
            }
        },
        {
            key: "_computeStd",
            value: function _computeStd(arr) {
                if (!arr || arr.length === 0) return 0;
                var mean = 0;
                for (var i = 0; i < arr.length; i++) mean += arr[i];
                mean /= arr.length;
                var sum = 0;
                for (var j = 0; j < arr.length; j++) {
                    var d = arr[j] - mean;
                    sum += d * d;
                }
                return Math.sqrt(sum / arr.length);
            }
        },
        {
            key: "_checkInitialization",
            value: function _checkInitialization() {
                const checkInterval = setInterval(() => {
                    if (this.musicManager && this.drumManager &&
                        this.musicManager.musicPresets &&
                        typeof this.musicManager.getCurrentMusicPreset === 'function') {

                        clearInterval(checkInterval);
                        console.log('所有管理器已成功初始化，设置UI组件');
                        this._setupPresetSelectors();
                    } else {
                        console.log('等待管理器初始化...');
                    }
                }, 100);

                // 设置超时防止无限等待
                setTimeout(() => {
                    clearInterval(checkInterval);
                    console.warn('初始化超时，使用默认设置');
                    this._setupPresetSelectors();
                }, 5000);
            }
        },
        {
            key: "_setupPresetSelectors",
            value: function _setupPresetSelectors() {
                // 添加空值检查，确保管理器已正确初始化
                if (!this.musicManager || !this.drumManager) {
                    console.warn('琶音风格或鼓组管理器未初始化，跳过预设选择器设置');
                    return;
                }

                // 获取琶音风格并添加空值检查
                const musicPresets = this.musicManager.musicPresets || [];
                const musicSelect = document.getElementById('music-preset-select');

                if (musicSelect && musicPresets.length > 0) {
                    musicSelect.innerHTML = '';
                    musicPresets.forEach((preset, index) => {
                        const option = document.createElement('option');
                        option.value = index;
                        option.textContent = preset.name || `预设 ${index + 1}`;
                        musicSelect.appendChild(option);
                    });
                } else {
                    console.warn('琶音风格选择器元素未找到或预设数组为空');
                }

                // 获取鼓组预设并添加空值检查
                const drumPresets = this.drumManager.getAllDrumPresets ? this.drumManager.getAllDrumPresets() : [];
                const drumSelect = document.getElementById('drum-preset-select');

                if (drumSelect && drumPresets.length > 0) {
                    drumSelect.innerHTML = '';
                    drumPresets.forEach((preset, index) => {
                        const option = document.createElement('option');
                        option.value = index;
                        option.textContent = preset.name || `鼓组 ${index + 1}`;
                        drumSelect.appendChild(option);
                    });
                } else {
                    console.warn('鼓组预设选择器元素未找到或预设数组为空');
                }

                // 设置默认选中值和添加事件监听
                if (musicSelect) {
                    musicSelect.value = '0';
                    // 添加琶音风格选择事件
                    musicSelect.addEventListener('change', (e) => {
                        const presetIndex = parseInt(e.target.value);
                        if (this.musicManager && this.musicManager.setMusicPreset) {
                            this.musicManager.setMusicPreset(presetIndex);
                            this._updatePresetDisplay();
                            const currentPreset = this.musicManager.getCurrentMusicPreset();
                            if (currentPreset) {
                                this._showPresetChangeNotification(`琶音风格: ${currentPreset.name}`, 'music');
                            }
                        }
                    });
                }

                if (drumSelect) {
                    drumSelect.value = '0';
                    // 添加鼓组预设选择事件
                    drumSelect.addEventListener('change', (e) => {
                        const presetIndex = parseInt(e.target.value);
                        if (this.drumManager && typeof this.drumManager.setDrumPreset === 'function') {
                            this.drumManager.setDrumPreset(presetIndex);
                            this._updatePresetDisplay();
                            const currentPreset = this.drumManager.getCurrentDrumPreset();
                            if (currentPreset) {
                                this._showPresetChangeNotification(`鼓组: ${currentPreset.name}`, 'drum');
                            }
                        }
                    });
                }
            }
        },
        {
            key: "_updatePresetDisplay",
            value: function _updatePresetDisplay() {
                // 更新状态面板显示
                var musicPresetEl = document.getElementById('music-preset');
                var drumPresetEl = document.getElementById('drum-preset');

                if (musicPresetEl) {
                    musicPresetEl.textContent = `🎵 ${this.musicManager.getCurrentMusicPreset().name}`;
                }

                if (drumPresetEl) {
                    drumPresetEl.textContent = `🥁 ${drumManager.getCurrentDrumPreset().name}`;
                }



                // 同步选择器
                var musicSelect = document.getElementById('music-preset-select');
                var drumSelect = document.getElementById('drum-preset-select');

                if (musicSelect) {
                    musicSelect.value = this.musicManager.currentMusicPreset;
                }

                if (drumSelect) {
                    drumSelect.value = drumManager.currentDrumPreset;
                }
            }
        },

        {
            key: "_initPresetSelector",
            value: function _initPresetSelector() {
                var _this = this;

                // 切换菜单显示/隐藏
                var toggleButton = document.getElementById('preset-toggle');
                var menu = document.getElementById('preset-menu');

                if (toggleButton && menu) {
                    toggleButton.addEventListener('click', function () {
                        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
                    });

                    // 点击其他地方关闭菜单
                    document.addEventListener('click', function (event) {
                        if (!event.target.closest('#preset-selector')) {
                            menu.style.display = 'none';
                        }
                    });
                }

                // 生成琶音风格选项
                this._generateMusicPresetOptions();
                // 生成鼓组预设选项
                this._generateDrumPresetOptions();
            }
        },
        {
            // 生成琶音风格选项
            key: "_generateMusicPresetOptions",
            value: function _generateMusicPresetOptions() {
                var _this = this;
                var container = document.getElementById('music-presets');
                if (!container || !this.musicManager) return;

                container.innerHTML = '';
                var musicPresets = this.musicManager.musicPresets;
                var currentIndex = this.musicManager.currentMusicPresetIndex;

                musicPresets.forEach(function (preset, index) {
                    var option = document.createElement('div');
                    option.style.cssText = `
                        padding: 5px 8px;
                        cursor: pointer;
                        border-radius: 3px;
                        margin: 2px 0;
                        background-color: ${index === currentIndex ? 'rgba(123, 67, 148, 0.8)' : 'transparent'};
                        transition: background-color 0.2s;
                    `;
                    option.textContent = preset.name;

                    option.addEventListener('mouseover', function () {
                        if (index !== currentIndex) {
                            option.style.backgroundColor = 'rgba(123, 67, 148, 0.4)';
                        }
                    });

                    option.addEventListener('mouseout', function () {
                        if (index !== currentIndex) {
                            option.style.backgroundColor = 'transparent';
                        }
                    });

                    option.addEventListener('click', function () {
                        _this._selectMusicPreset(index);
                    });

                    container.appendChild(option);
                });
            }
        },
        {
            // 生成鼓组预设选项
            key: "_generateDrumPresetOptions",
            value: function _generateDrumPresetOptions() {
                var _this = this;
                var container = document.getElementById('drum-presets');
                if (!container) return;

                container.innerHTML = '';
                var drumPresets = drumManager.getAllDrumPresets();
                var currentPreset = drumManager.getCurrentDrumPreset();

                drumPresets.forEach(function (preset, index) {
                    var option = document.createElement('div');
                    option.style.cssText = `
                        padding: 5px 8px;
                        cursor: pointer;
                        border-radius: 3px;
                        margin: 2px 0;
                        background-color: ${preset.name === currentPreset.name ? 'rgba(215, 40, 40, 0.8)' : 'transparent'};
                        transition: background-color 0.2s;
                    `;
                    option.textContent = preset.name;

                    option.addEventListener('mouseover', function () {
                        if (preset.name !== currentPreset.name) {
                            option.style.backgroundColor = 'rgba(215, 40, 40, 0.4)';
                        }
                    });

                    option.addEventListener('mouseout', function () {
                        if (preset.name !== currentPreset.name) {
                            option.style.backgroundColor = 'transparent';
                        }
                    });

                    option.addEventListener('click', function () {
                        _this._selectDrumPreset(index);
                    });

                    container.appendChild(option);
                });
            }
        },
        {
            // 选择琶音风格
            key: "_selectMusicPreset",
            value: function _selectMusicPreset(index) {
                if (this.musicManager) {
                    // 设置预设索引
                    this.musicManager.currentMusicPresetIndex = index;
                    var preset = this.musicManager.getCurrentMusicPreset();

                    // 应用预设
                    Tone.Transport.bpm.value = preset.tempo;
                    this.musicManager.currentSynthIndex = preset.synthPreset;
                    // 直接设置合成器而不是循环切换
                    this.musicManager._updateSynth();

                    // 更新显示
                    this._updatePresetDisplay();
                    this._generateMusicPresetOptions();

                    // 显示通知
                    this._showPresetChangeNotification(`琶音风格: ${preset.name} (${preset.tempo} BPM)`, 'music');



                    // 关闭菜单
                    document.getElementById('preset-menu').style.display = 'none';
                }
            }
        },
        {
            // 选择鼓组预设  
            key: "_selectDrumPreset",
            value: function _selectDrumPreset(targetIndex) {
                var currentIndex = drumManager.getAllDrumPresets().findIndex(preset =>
                    preset.name === drumManager.getCurrentDrumPreset().name
                );

                // 循环到目标索引
                while (currentIndex !== targetIndex) {
                    drumManager.queueRhythmCell(currentIndex % 7, Math.floor(currentIndex / 7));
                    currentIndex = (currentIndex + 1) % drumManager.getAllDrumPresets().length;
                }

                var currentPreset = drumManager.getCurrentDrumPreset();

                // 更新BPM - 以最后切换的鼓组BPM为准
                if (currentPreset.bpm) {
                    Tone.Transport.bpm.value = currentPreset.bpm;
                    console.log(`BPM已更新为鼓组预设: ${currentPreset.bpm}`);
                }

                // 更新显示
                this._updatePresetDisplay();
                this._generateDrumPresetOptions();

                // 显示通知
                this._showPresetChangeNotification(`鼓组: ${currentPreset.name}`, 'drum');



                // 关闭菜单
                document.getElementById('preset-menu').style.display = 'none';
            }
        },
        {
            key: "_showPresetChangeNotification",
            value: function _showPresetChangeNotification(message, type) {
                var statusElement = document.getElementById('info-text');
                if (!statusElement) return;

                statusElement.textContent = message;
                statusElement.style.color = '#7B4394';
                statusElement.style.opacity = '1';
                statusElement.style.transform = 'translateX(-50%) scale(1.1)';

                setTimeout(() => {
                    statusElement.style.opacity = '0.7';
                    statusElement.style.transform = 'translateX(-50%) scale(1)';
                    statusElement.style.color = '#FFFFFF';

                    setTimeout(() => {
                        statusElement.textContent = '';
                        statusElement.style.opacity = '1';
                    }, 500);
                }, 2000);
            }
        }
    ]);
    return Game;
}();
