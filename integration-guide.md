# 琶音编辑器整合指南

## 概述

这个文档说明如何将新的示波器风格琶音编辑器整合到现有的主项目中。

## 已完成的优化

### 🎯 拖拽/点击逻辑优化
- **智能识别**: 添加了3像素的拖拽阈值，区分点击和拖拽操作
- **点击切换**: 单击音序点可以切换激活/禁用状态
- **实时拖拽**: 拖拽时音序点完全实时跟随鼠标，无延迟
- **平滑过渡**: 拖拽结束后恢复过渡动画效果

### 🎨 界面设计
- **示波器风格**: 保持原有的科技感设计
- **响应式布局**: 支持桌面和移动设备
- **右侧控制面板**: 精简的控制界面，移除了不必要的音色设置

## 整合方案

### 方案1: 替换现有模态框内容

将 `arpeggio-editor-integrated.html` 的内容整合到现有的 `index.html` 中：

```html
<!-- 替换现有的琶音编辑器模态框内容 -->
<div id="arpeggio-editor-modal" class="modal" style="display: none;">
    <div class="modal-content" style="max-width: 1200px; height: 80vh;">
        <span class="close">&times;</span>
        
        <!-- 插入整合版编辑器的主体内容 -->
        <div class="arpeggio-editor-integrated">
            <!-- ... 从 arpeggio-editor-integrated.html 复制内容 ... -->
        </div>
    </div>
</div>
```

### 方案2: 独立页面集成

创建独立的琶音编辑器页面，通过iframe或新窗口打开。

## 需要整合的功能

### 1. 与现有音色库同步

```javascript
// 在 CustomEditor.js 中修改
populateArpeggioPresets() {
    const select = document.getElementById('presetSelect');
    select.innerHTML = '<option value="">Select Preset...</option>';
    
    // 使用现有的音乐预设
    if (window.game?.musicManager?.musicPresets) {
        window.game.musicManager.musicPresets.forEach((preset, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = preset.name;
            select.appendChild(option);
        });
    }
}
```

### 2. BPM同步

```javascript
// 与主项目的BPM设置同步
applyBPM(bpm) {
    // 更新Tone.js传输BPM
    if (window.Tone?.Transport) {
        window.Tone.Transport.bpm.value = bpm;
    }
    
    // 更新音乐管理器
    if (window.game?.musicManager) {
        const currentPreset = window.game.musicManager.getCurrentMusicPreset();
        if (currentPreset) {
            currentPreset.tempo = bpm;
        }
    }
}
```

### 3. 根音设置集成

```javascript
// 与现有的根音选择器同步
syncRootNote() {
    const rootNoteSelect = document.getElementById('rootNoteSelect');
    const currentPreset = window.game?.musicManager?.getCurrentMusicPreset();
    
    if (currentPreset && currentPreset.scale) {
        // 从音阶中推断根音
        const rootNote = this.extractRootNoteFromScale(currentPreset.scale);
        rootNoteSelect.value = rootNote;
    }
}
```

## 文件结构建议

```
project/
├── index.html                          # 主页面
├── arpeggio-editor-integrated.html     # 整合版编辑器（独立测试）
├── js/
│   ├── CustomEditor.js                 # 现有编辑器逻辑
│   ├── ArpeggioEditorIntegrated.js     # 新编辑器类（从HTML中提取）
│   └── MusicManager.js                 # 现有音乐管理器
└── css/
    └── arpeggio-editor.css             # 编辑器样式（从HTML中提取）
```

## 集成步骤

### 步骤1: 提取样式和脚本

1. 将 `arpeggio-editor-integrated.html` 中的CSS提取到独立文件
2. 将JavaScript类提取到独立的JS文件
3. 在主页面中引入这些文件

### 步骤2: 修改现有模态框

1. 替换现有琶音编辑器模态框的内容
2. 调整模态框尺寸以适应新界面
3. 更新关闭和打开逻辑

### 步骤3: 集成事件处理

1. 修改 `CustomEditor.js` 中的 `openArpeggioEditor()` 方法
2. 确保新编辑器能正确访问全局的音乐管理器
3. 添加数据同步逻辑

### 步骤4: 测试集成

1. 测试预设加载和保存
2. 测试BPM同步
3. 测试音序应用到实际播放
4. 测试响应式布局

## 配置选项

### 界面配置

```javascript
const editorConfig = {
    // 是否显示音色设置（已移除）
    showSoundSettings: false,
    
    // 是否显示预设管理
    showPresetManagement: true,
    
    // 默认BPM范围
    bpmRange: { min: 60, max: 180 },
    
    // 默认音程范围
    intervalRange: { min: -24, max: 24 },
    
    // 音序点数量
    sequenceLength: 8
};
```

### 集成配置

```javascript
const integrationConfig = {
    // 是否与主项目音色库同步
    syncWithMusicManager: true,
    
    // 是否自动保存到本地存储
    autoSave: true,
    
    // 预设保存位置
    presetStorageKey: 'customArpeggioPresets'
};
```

## API接口

### 主要方法

```javascript
// 获取当前序列数据
arpeggioEditor.getSequenceData()

// 设置序列数据
arpeggioEditor.setSequenceData(sequenceArray)

// 应用设置到音乐管理器
arpeggioEditor.apply()

// 加载预设
arpeggioEditor.loadPreset(presetIndex)

// 保存当前设置为预设
arpeggioEditor.savePreset(presetName)
```

### 事件回调

```javascript
// 序列变化时的回调
arpeggioEditor.onSequenceChange = (sequenceData) => {
    console.log('序列已更改:', sequenceData);
};

// 应用设置时的回调
arpeggioEditor.onApply = (config) => {
    console.log('设置已应用:', config);
};
```

## 注意事项

1. **性能优化**: 使用 `requestAnimationFrame` 优化连接线重绘
2. **内存管理**: 确保事件监听器在组件销毁时正确移除
3. **兼容性**: 确保与现有的Tone.js版本兼容
4. **用户体验**: 保持与现有界面风格的一致性

## 下一步

1. 选择集成方案（建议方案1）
2. 按步骤进行集成
3. 测试所有功能
4. 优化用户体验
5. 添加更多高级功能（如音阶模式、节奏模式等）
