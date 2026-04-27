import { Game } from './game.js';
import { CustomEditor } from './CustomEditor.js';
import { ArpeggioEditor } from './ArpeggioEditor.js';
import * as drumManager from './DrumManager.js';
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
        
        // Initialize the custom editor
        var customEditor = new CustomEditor();

        // Check Tone.js availability
        if (window.Tone) {
            console.log('🎵 [MAIN] Tone.js 已加载，版本:', window.Tone.version || 'unknown');
            console.log('🎵 [MAIN] 音频上下文状态:', window.Tone.context.state);
        } else {
            console.error('❌ [MAIN] Tone.js 未加载！音频功能将不可用');
        }

        // Initialize the arpeggio editor
        var arpeggioEditor = new ArpeggioEditor();

        // 注册核心服务
        container.register('game', () => game, { singleton: true });
        container.register('customEditor', () => customEditor, { singleton: true });
        container.register('arpeggioEditor', () => arpeggioEditor, { singleton: true });
        container.register('drumManager', () => drumManager, { singleton: true });

        // Make everything available globally (向后兼容)
        window.game = game;
        window.customEditor = customEditor;
        window.arpeggioEditor = arpeggioEditor;
        window.drumManager = drumManager;
        window.stateManager = stateManager;
        window.errorHandler = errorHandler;
        
        // 启动状态同步
        setTimeout(() => {
            const statusSync = container.get('statusSync');
            window.statusSync = statusSync;
            statusSync.start();
        }, 2000);
        
        console.log('✅ 应用初始化完成：所有组件已通过依赖注入容器管理');
        
    }, '应用初始化');
}

// 启动应用
initializeApp();
