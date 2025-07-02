import { Game } from './game.js';
import { CustomEditor } from './CustomEditor.js';
import * as drumManager from './DrumManager.js'; // 导入drumManager模块

// 简单的实时状态同步器
class RealTimeStatusSync {
    constructor() {
        this.isRunning = false;
        this.updateInterval = null;
        this.lastStatus = {};
        console.log('🔧 实时状态同步器初始化');
    }
    
    start() {
        if (this.isRunning) return;
        
        console.log('🚀 启动实时状态同步 (每500ms)');
        this.isRunning = true;
        
        // 立即执行一次
        this.syncStatus();
        
        // 设置定时器，每500ms同步一次
        this.updateInterval = setInterval(() => {
            this.syncStatus();
        }, 500);
    }
    
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.isRunning = false;
        console.log('⏹️ 停止实时状态同步');
    }
    
    syncStatus() {
        try {
            // 检查必需对象是否存在
            if (!window.game?.musicManager || !window.drumManager) {
                return;
            }
            
            // 获取当前状态
            const synthName = window.game.musicManager.getSynthName();
            const musicPreset = window.game.musicManager.getCurrentMusicPreset();
            const drumPreset = window.drumManager.getCurrentDrumPreset();
            
            const currentStatus = {
                synthName: synthName,
                musicPresetName: musicPreset.name,
                drumPresetName: drumPreset.name,
                tempo: musicPreset.tempo
            };
            
            // 检查是否有变化，只在有变化时更新DOM
            if (this.hasStatusChanged(currentStatus)) {
                this.updateStatusDisplay(currentStatus);
                this.lastStatus = { ...currentStatus };
            }
            
        } catch (error) {
            // 静默处理错误
        }
    }
    
    hasStatusChanged(newStatus) {
        return (
            this.lastStatus.synthName !== newStatus.synthName ||
            this.lastStatus.musicPresetName !== newStatus.musicPresetName ||
            this.lastStatus.drumPresetName !== newStatus.drumPresetName ||
            this.lastStatus.tempo !== newStatus.tempo
        );
    }
    
    updateStatusDisplay(status) {
        // 更新音色
        const synthElement = document.getElementById('current-synth');
        if (synthElement) {
            synthElement.textContent = status.synthName;
        }
        
        // 更新音乐预设
        const musicElement = document.getElementById('current-music-preset');
        if (musicElement) {
            musicElement.textContent = status.musicPresetName;
        }
        
        // 更新鼓组预设
        const drumElement = document.getElementById('current-drum-preset');
        if (drumElement) {
            drumElement.textContent = status.drumPresetName;
        }
        
        // 更新节拍
        const tempoElement = document.getElementById('current-tempo');
        if (tempoElement) {
            tempoElement.textContent = status.tempo + ' BPM';
        }
    }
}

// Get the render target div
var renderDiv = document.getElementById('renderDiv');
// Check if renderDiv exists
if (!renderDiv) {
    console.error('Fatal Error: renderDiv element not found.');
} else {
    // Initialize the game with the render target
    var game = new Game(renderDiv);
    
    // Initialize the custom editor
    var customEditor = new CustomEditor();
    
    // Initialize the real-time status sync
    var statusSync = new RealTimeStatusSync();
    
    // Make everything available globally
    window.game = game;
    window.customEditor = customEditor;
    window.statusSync = statusSync;
    window.drumManager = drumManager; // 设置drumManager到全局
    
    // 等待所有组件初始化完成后启动状态同步
    setTimeout(() => {
        if (window.statusSync) {
            statusSync.start();
        }
    }, 2000); // 给足够时间让所有组件完全初始化
    
    console.log('✅ 应用初始化完成：游戏引擎、自定义编辑器和实时状态同步器已加载');
}
