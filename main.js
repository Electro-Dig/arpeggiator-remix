import { Game } from './game.js';
import { GuideController } from './GuideController.js';
import { RecordingController } from './RecordingController.js';
import { uploadRecording } from './share/recordings-client.js';
import { audioBus } from './audio/AudioBus.js';
import * as drumManager from './DrumManager.js';
import { actionForThumbIntent } from './recording/recording-state.js';
import { combineThumbPoses, GestureLatch } from './recording/thumb-gesture.js';
import { stateManager } from './StateManager.js';
import { container, errorHandler } from './DIContainer.js';

// 改进的实时状态同步器 - 现在使用依赖注入
class RealTimeStatusSync {
    constructor(stateManager, errorHandler) {
        this.stateManager = stateManager;
        this.errorHandler = errorHandler;
        this.isRunning = false;
        this.unsubscribeFunctions = [];
        console.log('🔧 事件驱动状态同步器初始化');
    }

    start() {
        if (this.isRunning) return;

        console.log('🚀 启动事件驱动状态同步');
        this.isRunning = true;

        // 安全执行初始化
        this.errorHandler.safeExecute(() => {
            this.stateManager.initDisplayBindings();
            this.syncInitialState();
            this.setupStateListeners();
        }, '状态同步初始化');
    }

    stop() {
        this.unsubscribeFunctions.forEach(unsubscribe => {
            this.errorHandler.safeExecute(() => unsubscribe(), '取消订阅');
        });
        this.unsubscribeFunctions = [];
        this.isRunning = false;
        console.log('⏹️ 停止状态同步');
    }

    setupStateListeners() {
        // 使用容器获取依赖
        const game = container.has('game') ? container.get('game') : window.game;
        const drumMgr = container.has('drumManager') ? container.get('drumManager') : window.drumManager;

        if (game?.musicManager) {
            const unsubscribeMusic = this.observeMusicManager(game.musicManager);
            this.unsubscribeFunctions.push(unsubscribeMusic);
        }

        if (drumMgr) {
            const unsubscribeDrum = this.observeDrumManager(drumMgr);
            this.unsubscribeFunctions.push(unsubscribeDrum);
        }
    }

    observeMusicManager(musicManager) {
        let lastMusicState = null;

        const checkInterval = setInterval(() => {
            this.errorHandler.safeExecute(() => {
                const currentState = {
                    synthName: musicManager.getSynthName(),
                    preset: musicManager.getCurrentMusicPreset()
                };

                if (!lastMusicState || this.hasChanged(lastMusicState, currentState)) {
                    this.stateManager.setState({
                        synthName: currentState.synthName,
                        musicPresetName: currentState.preset.name,
                        tempo: currentState.preset.tempo
                    });
                    lastMusicState = currentState;
                }
            }, '音乐状态检查');
        }, 1000);

        return () => clearInterval(checkInterval);
    }

    observeDrumManager(drumMgr) {
        let lastDrumPreset = null;

        const checkInterval = setInterval(() => {
            this.errorHandler.safeExecute(() => {
                const currentPreset = drumMgr.getCurrentDrumPreset();

                if (!lastDrumPreset || lastDrumPreset.name !== currentPreset.name) {
                    this.stateManager.setState({
                        drumPresetName: currentPreset.name
                    });
                    lastDrumPreset = currentPreset;
                }
            }, '鼓组状态检查');
        }, 1000);

        return () => clearInterval(checkInterval);
    }

    syncInitialState() {
        const game = container.has('game') ? container.get('game') : window.game;
        const drumMgr = container.has('drumManager') ? container.get('drumManager') : window.drumManager;

        if (!game?.musicManager || !drumMgr) {
            console.warn('⚠️ 初始状态同步：缺少必要的管理器');
            return;
        }

        const synthName = game.musicManager.getSynthName();
        const musicPreset = game.musicManager.getCurrentMusicPreset();
        const drumPreset = drumMgr.getCurrentDrumPreset();

        this.stateManager.setState({
            synthName: synthName,
            musicPresetName: musicPreset.name,
            drumPresetName: drumPreset.name,
            tempo: musicPreset.tempo
        });
    }

    hasChanged(oldState, newState) {
        return (
            oldState.synthName !== newState.synthName ||
            oldState.preset?.name !== newState.preset?.name ||
            oldState.preset?.tempo !== newState.preset?.tempo
        );
    }
}

// 注册服务到容器
function registerServices() {
    container.register('stateManager', () => stateManager, { singleton: true });
    container.register('errorHandler', () => errorHandler, { singleton: true });
    container.register('statusSync', (container) => {
        return new RealTimeStatusSync(
            container.get('stateManager'),
            container.get('errorHandler')
        );
    }, { singleton: true });
}

// 安全的应用初始化
function initializeApp() {
    // Get the render target div
    var renderDiv = document.getElementById('renderDiv');

    // Check if renderDiv exists
    if (!renderDiv) {
        errorHandler.logError('初始化错误', new Error('renderDiv element not found'));
        return;
    }

    errorHandler.safeExecute(() => {
        // 注册服务
        registerServices();

        // Initialize the game with the render target
        var game = new Game(renderDiv);
        const guideController = new GuideController(document);
        const recordingController = new RecordingController({
            stream: audioBus.recordingStream,
            onUploadRequest: (blob) => uploadRecording(blob),
        });
        const recordingGestureLatch = new GestureLatch({ holdMs: 800, neutralMs: 1000 });

        // 注册核心服务
        container.register('game', () => game, { singleton: true });
        container.register('guideController', () => guideController, { singleton: true });
        container.register('recordingController', () => recordingController, { singleton: true });
        container.register('drumManager', () => drumManager, { singleton: true });

        // Make everything available globally (向后兼容)
        window.game = game;
        window.guideController = guideController;
        window.recordingController = recordingController;
        window.drumManager = drumManager;
        window.stateManager = stateManager;
        window.errorHandler = errorHandler;

        document.getElementById('recording-primary')?.addEventListener('pointerdown', () => {
            audioBus.start().catch((error) => console.error('无法启动内部音频总线', error));
        });

        const updateGuideAvailability = (phase) => {
            guideController.setRecordingBusy(!['idle', 'shared'].includes(phase));
        };
        updateGuideAvailability(recordingController.state.phase);
        recordingController.addEventListener('statechange', ({ detail }) => {
            updateGuideAvailability(detail.state.phase);
        });

        guideController.addEventListener('contextchange', ({ detail }) => {
            if (detail.active) {
                game.setInteractionSuppressed(true);
            } else {
                recordingGestureLatch.requireNeutral();
            }
        });

        renderDiv.addEventListener('handframe', ({ detail }) => {
            const intent = combineThumbPoses(detail.handsBySide);
            const trigger = recordingGestureLatch.update(intent, detail.now);
            recordingController.setGestureProgress(recordingGestureLatch.progress);

            if (guideController.dialog?.open) {
                game.setInteractionSuppressed(true);
                if (trigger === 'both-up') guideController.skipFromGesture();
                return;
            }

            const gesturesEnabled = document.getElementById('recording-gestures-enabled')?.checked;
            const action = gesturesEnabled && trigger
                ? actionForThumbIntent(recordingController.state.phase, trigger)
                : null;
            game.setInteractionSuppressed(Boolean(action) || intent !== 'neutral');
            if (action) recordingController.dispatch({ type: action });
        });

        // 启动状态同步
        setTimeout(() => {
            const statusSync = container.get('statusSync');
            window.statusSync = statusSync;
            statusSync.start();
        }, 2000);

        // 设置简化模式按钮事件监听
        const simpleModeBtn = document.getElementById('toggle-simple-mode');
        const simpleModeLabel = document.getElementById('simple-mode-label');
        simpleModeBtn?.addEventListener('click', () => {
            game.simpleMode = !game.simpleMode;
            document.body.classList.toggle('simple-mode', game.simpleMode);
            simpleModeBtn.setAttribute('aria-pressed', String(game.simpleMode));
            simpleModeLabel.textContent = game.simpleMode ? '标准模式' : '简化模式';
        });

        const deckToggle = document.getElementById('control-deck-toggle');
        const deck = document.getElementById('control-deck');
        deckToggle?.addEventListener('click', () => {
            deck.hidden = !deck.hidden;
            deckToggle.setAttribute('aria-expanded', String(!deck.hidden));
        });

        // 初始化鼓组音量控制 UI
        const drumVolPanel = document.getElementById('drum-volume-panel');
        const drumVolToggle = document.getElementById('drum-volume-toggle');
        const drumVolSliders = document.getElementById('drum-volume-sliders');
        if (drumVolPanel && drumVolToggle && drumVolSliders && drumManager) {
            // 展开/收起切换
            drumVolToggle.addEventListener('click', () => {
                drumVolSliders.hidden = !drumVolSliders.hidden;
                drumVolToggle.setAttribute('aria-expanded', String(!drumVolSliders.hidden));
            });

            // 初始值从 DrumManager 获取
            try {
                const vols = drumManager.getAllDrumVolumes ? drumManager.getAllDrumVolumes() : null;
                const ids = ['kick', 'snare', 'hihat', 'clap', 'openhat'];
                ids.forEach(id => {
                    const el = document.getElementById('vol-' + id);
                    if (el && vols && typeof vols[id] === 'number') {
                        el.value = Math.round(vols[id]);
                    }
                });
            } catch (e) {
                console.warn('初始化鼓组音量失败', e);
            }

            // 绑定滑杆事件：将滑杆值(分贝)写回 DrumManager.setDrumVolume
            function bindVolSlider(id) {
                const el = document.getElementById('vol-' + id);
                if (!el) return;
                el.addEventListener('input', () => {
                    const dB = parseFloat(el.value);
                    if (drumManager && drumManager.setDrumVolume) {
                        drumManager.setDrumVolume(id, dB);
                    }
                });
            }
            ['kick', 'snare', 'hihat', 'clap', 'openhat'].forEach(bindVolSlider);
            console.log('🥁 鼓组音量控制已初始化');
        }

        console.log('✅ 应用初始化完成：所有组件已通过依赖注入容器管理');

    }, '应用初始化');
}

// 启动应用
initializeApp();
