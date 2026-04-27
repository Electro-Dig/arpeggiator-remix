/**
 * 集中式状态管理器
 * 使用事件驱动模式替换轮询机制
 */
export class StateManager extends EventTarget {
    constructor() {
        super();
        this.state = {
            synthName: 'DX7 MARIMBA',
            musicPresetName: 'Minimal Groove',
            drumPresetName: 'Rhythm1',
            tempo: 122,
            isPlaying: false,
            handPosition: { left: null, right: null }
        };
        this.initialized = false;
        console.log('🔧 StateManager 初始化完成');
    }

    /**
     * 获取当前状态的副本
     */
    getState() {
        return { ...this.state };
    }

    /**
     * 更新状态并触发事件
     */
    setState(updates) {
        const oldState = { ...this.state };
        const newState = { ...this.state, ...updates };
        
        // 检查是否有实际变化
        if (this.hasStateChanged(oldState, newState)) {
            this.state = newState;
            this.dispatchEvent(new CustomEvent('stateChange', { 
                detail: { 
                    oldState, 
                    newState: { ...newState },
                    changes: this.getChanges(oldState, newState)
                } 
            }));
        }
    }

    /**
     * 订阅特定状态变化
     */
    subscribe(eventType, callback) {
        this.addEventListener(eventType, callback);
        
        // 返回取消订阅函数
        return () => this.removeEventListener(eventType, callback);
    }

    /**
     * 检查状态是否有变化
     */
    hasStateChanged(oldState, newState) {
        return Object.keys(newState).some(key => 
            oldState[key] !== newState[key]
        );
    }

    /**
     * 获取具体变化内容
     */
    getChanges(oldState, newState) {
        const changes = {};
        Object.keys(newState).forEach(key => {
            if (oldState[key] !== newState[key]) {
                changes[key] = { from: oldState[key], to: newState[key] };
            }
        });
        return changes;
    }

    /**
     * 初始化状态显示绑定
     */
    initDisplayBindings() {
        if (this.initialized) return;
        
        this.subscribe('stateChange', (event) => {
            this.updateDisplay(event.detail.changes);
        });
        
        this.initialized = true;
        console.log('🎯 状态显示绑定已初始化');
    }

    /**
     * 更新DOM显示
     */
    updateDisplay(changes) {
        Object.keys(changes).forEach(key => {
            switch (key) {
                case 'synthName':
                    this.updateElement('current-synth', changes[key].to);
                    break;
                case 'musicPresetName':
                    this.updateElement('current-music-preset', changes[key].to);
                    break;
                case 'drumPresetName':
                    this.updateElement('current-drum-preset', changes[key].to);
                    break;
                case 'tempo':
                    this.updateElement('current-tempo', changes[key].to + ' BPM');
                    break;
            }
        });
    }

    /**
     * 安全地更新DOM元素
     */
    updateElement(elementId, text) {
        const element = document.getElementById(elementId);
        if (element && element.textContent !== text) {
            element.textContent = text;
        }
    }
}

// 创建全局状态管理器实例
export const stateManager = new StateManager();