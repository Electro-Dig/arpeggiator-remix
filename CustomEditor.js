// 自定义编辑器模块
import * as Tone from 'https://esm.sh/tone';
import * as drumManager from './DrumManager.js';

export class CustomEditor {
    constructor() {
        this.currentEditingType = null; // 'arpeggio' 或 'drum'
        this.customArpeggioPreset = null;
        this.customDrumPreset = null;
        this.clipboardPattern = null;
        this.previewSynth = null;
        this.previewDrumPlayers = null;
        this.previewSequence = null;

        // 圆形音序器相关属性
        this.circularSequencer = null;
        this.isCircularMode = false; // 是否使用圆形模式

        this.init();
    }

    init() {
        try {
        this.setupEventListeners();
        this.generateNoteGrid();
        this.generateDrumSequencer();
        this.initPreviewSynth();
            this.initRealTimePreview();
            this.initCircularSequencer();

            console.log('✅ 自定义编辑器已初始化');
        } catch (error) {
            console.error('❌ 自定义编辑器初始化失败:', error);
        }
    }

    initRealTimePreview() {
        // 实时预览状态
        this.isRealTimePreview = false;
        this.realTimePreviewInterval = null;
        this.currentPreviewStep = 0;
        
        // 添加实时预览切换按钮
        this.addRealTimePreviewControls();
    }

    addRealTimePreviewControls() {
        // 为琶音编辑器添加实时预览控制
        const arpeggioActions = document.querySelector('#arpeggio-editor-modal .editor-actions');
        if (arpeggioActions) {
            const realTimeToggle = document.createElement('button');
            realTimeToggle.id = 'toggle-realtime-arpeggio';
            realTimeToggle.className = 'action-btn realtime';
            realTimeToggle.textContent = '🎵 实时预览';
            realTimeToggle.title = '开启/关闭实时预览';
            arpeggioActions.insertBefore(realTimeToggle, arpeggioActions.firstChild);
            
            realTimeToggle.addEventListener('click', () => {
                this.toggleRealTimePreview('arpeggio');
            });
        }

        // 为鼓组编辑器添加实时预览控制
        const drumActions = document.querySelector('#drum-editor-modal .editor-actions');
        if (drumActions) {
            const realTimeToggle = document.createElement('button');
            realTimeToggle.id = 'toggle-realtime-drum';
            realTimeToggle.className = 'action-btn realtime';
            realTimeToggle.textContent = '🥁 实时预览';
            realTimeToggle.title = '开启/关闭实时预览';
            drumActions.insertBefore(realTimeToggle, drumActions.firstChild);
            
            realTimeToggle.addEventListener('click', () => {
                this.toggleRealTimePreview('drum');
            });
        }
    }

    initCircularSequencer() {
        // 初始化圆形音序器，但不立即创建
        console.log('✅ 圆形音序器准备就绪');
    }

    initCircularSequencerInModal() {
        // 创建模式切换按钮
        this.createModeToggleButton();

        // 创建圆形音序器容器
        this.createCircularSequencerContainer();

        // 默认显示传统模式
        this.switchToMode('traditional');
    }

    createModeToggleButton() {
        const drumControls = document.querySelector('#drum-editor-modal .drum-controls');
        if (!drumControls) return;

        // 检查是否已经存在切换按钮
        if (document.getElementById('mode-toggle-btn')) return;

        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'mode-toggle-btn';
        toggleBtn.className = 'quick-btn mode-toggle';
        toggleBtn.textContent = '🎯 圆形模式';
        toggleBtn.title = '切换到圆形音序器';

        toggleBtn.addEventListener('click', () => {
            this.toggleSequencerMode();
        });

        // 插入到第一个位置
        drumControls.insertBefore(toggleBtn, drumControls.firstChild);
    }

    createCircularSequencerContainer() {
        const drumSequencer = document.getElementById('drum-sequencer');
        if (!drumSequencer) return;

        // 创建圆形音序器容器
        const circularContainer = document.createElement('div');
        circularContainer.id = 'circular-sequencer-container';
        circularContainer.style.display = 'none';
        circularContainer.style.textAlign = 'center';
        circularContainer.style.padding = '20px';

        // 插入到传统音序器之后
        drumSequencer.parentNode.insertBefore(circularContainer, drumSequencer.nextSibling);
    }

    toggleSequencerMode() {
        this.isCircularMode = !this.isCircularMode;

        if (this.isCircularMode) {
            this.switchToMode('circular');
        } else {
            this.switchToMode('traditional');
        }
    }

    switchToMode(mode) {
        const traditionalSequencer = document.getElementById('drum-sequencer');
        const circularContainer = document.getElementById('circular-sequencer-container');
        const toggleBtn = document.getElementById('mode-toggle-btn');

        if (mode === 'circular') {
            // 切换到圆形模式
            if (traditionalSequencer) traditionalSequencer.style.display = 'none';
            if (circularContainer) circularContainer.style.display = 'block';
            if (toggleBtn) {
                toggleBtn.textContent = '📋 传统模式';
                toggleBtn.title = '切换到传统音序器';
            }

            // 创建圆形音序器
            this.createCircularSequencer();
            this.isCircularMode = true;

        } else {
            // 切换到传统模式
            if (traditionalSequencer) traditionalSequencer.style.display = 'block';
            if (circularContainer) circularContainer.style.display = 'none';
            if (toggleBtn) {
                toggleBtn.textContent = '🎯 圆形模式';
                toggleBtn.title = '切换到圆形音序器';
            }

            // 销毁圆形音序器
            if (this.circularSequencer) {
                this.circularSequencer.destroy();
                this.circularSequencer = null;
            }
            this.isCircularMode = false;
        }
    }

    createCircularSequencer() {
        if (this.circularSequencer) {
            this.circularSequencer.destroy();
        }

        this.circularSequencer = new CircularSequencer('circular-sequencer-container', {
            centerX: 200,
            centerY: 200,
            innerRadius: 50,
            ringWidth: 30,
            ringGap: 2,
            segments: 16
        });

        // 同步当前的鼓组模式到圆形音序器
        this.syncPatternsToCircular();
    }

    syncPatternsToCircular() {
        if (!this.circularSequencer) return;

        const patterns = this.getDrumPatterns();
        this.circularSequencer.setPatterns(patterns);
    }

    syncPatternsFromCircular() {
        if (!this.circularSequencer) return;

        const patterns = this.circularSequencer.getPatterns();
        this.updateDrumSequencer(patterns);
    }

    setupEventListeners() {
        // 更新为新的按钮ID
        const arpeggioBtn = document.getElementById('open-arpeggio-editor');
        const drumBtn = document.getElementById('open-drum-editor');
        
        if (arpeggioBtn) {
            arpeggioBtn.addEventListener('click', () => {
                this.openArpeggioEditor();
            });
        }
        
        if (drumBtn) {
            drumBtn.addEventListener('click', () => {
                this.openDrumEditor();
            });
        }

        // 弹窗关闭
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        // 点击外部关闭弹窗
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });

        // 琶音编辑器事件
        this.setupArpeggioEditorEvents();
        
        // 鼓组编辑器事件
        this.setupDrumEditorEvents();
        
        // 保存预设事件
        this.setupSavePresetEvents();
        
        // 预设选择器事件
        this.setupPresetSelectorEvents();
    }

    setupPresetSelectorEvents() {
        // 这些事件已经在Game类中处理，这里不需要重复设置
        console.log('CustomEditor: 预设选择器事件由Game类管理');
    }

    setupArpeggioEditorEvents() {
        // 基础预设选择
        const basePresetSelect = document.getElementById('arpeggio-base-preset');
        if (basePresetSelect) {
            basePresetSelect.addEventListener('change', (e) => {
                this.loadArpeggioPreset(e.target.value);
            });
        }

        // 速度控制
        const tempoSlider = document.getElementById('arpeggio-tempo');
        const tempoValue = document.getElementById('tempo-value');
        
        if (tempoSlider && tempoValue) {
            tempoSlider.addEventListener('input', (e) => {
                tempoValue.textContent = e.target.value;
            });
        }

        // 和弦间隔输入
        document.querySelectorAll('.interval-input').forEach(input => {
            input.addEventListener('input', () => {
                this.updateArpeggioPreview();
            });
        });

        // 琶音模式选择
        document.querySelectorAll('input[name="arpeggio-pattern"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.updateArpeggioPreview();
            });
        });

        // 按钮事件
        const previewBtn = document.getElementById('preview-arpeggio');
        const resetBtn = document.getElementById('reset-arpeggio');
        const saveBtn = document.getElementById('save-arpeggio');
        const applyBtn = document.getElementById('apply-arpeggio');
        
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                this.previewArpeggio();
            });
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetArpeggioEditor();
            });
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.openSavePresetModal('arpeggio');
            });
        }
        
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.applyArpeggioChanges();
            });
        }
    }

    setupDrumEditorEvents() {
        // 基础预设选择
        const basePresetSelect = document.getElementById('drum-base-preset');
        if (basePresetSelect) {
            basePresetSelect.addEventListener('change', (e) => {
                this.loadDrumPreset(e.target.value);
            });
        }

        // 按钮事件
        const previewBtn = document.getElementById('preview-drum');
        const resetBtn = document.getElementById('reset-drum');
        const saveBtn = document.getElementById('save-drum');
        const applyBtn = document.getElementById('apply-drum');
        
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                this.previewDrum();
            });
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetDrumEditor();
            });
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.openSavePresetModal('drum');
            });
        }
        
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.applyDrumChanges();
            });
        }
    }

    setupSavePresetEvents() {
        const confirmBtn = document.getElementById('confirm-save');
        const cancelBtn = document.getElementById('cancel-save');
        
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.savePreset();
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeModal(document.getElementById('save-preset-modal'));
            });
        }
    }

    generateNoteGrid() {
        const noteGrid = document.querySelector('.note-grid');
        if (!noteGrid) return;
        
        const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const blackKeys = ['C#', 'D#', 'F#', 'G#', 'A#'];
        
        noteGrid.innerHTML = '';
        
        chromatic.forEach((note, index) => {
            const noteBtn = document.createElement('button');
            noteBtn.className = `note-btn ${blackKeys.includes(note) ? 'black-key' : ''}`;
            noteBtn.textContent = note;
            noteBtn.dataset.note = note;
            noteBtn.dataset.index = index;
            
            noteBtn.addEventListener('click', () => {
                this.toggleNote(noteBtn);
            });
            
            noteGrid.appendChild(noteBtn);
        });
    }

    generateDrumSequencer() {
        const drumSequencer = document.getElementById('drum-sequencer');
        if (!drumSequencer) return;
        
        // 清空现有内容
        drumSequencer.innerHTML = '';
        
        const drums = [
            { id: 'kick', name: 'Kick', emoji: '🦵', color: 'drum-kick' },
            { id: 'snare', name: 'Snare', emoji: '🥁', color: 'drum-snare' },
            { id: 'hihat', name: 'Hi-hat', emoji: '🎩', color: 'drum-hihat' },
            { id: 'clap', name: 'Clap', emoji: '👏', color: 'drum-clap' }
        ];
        
        drums.forEach(drum => {
            // 创建鼓组行容器
            const drumRow = document.createElement('div');
            drumRow.className = `drum-row ${drum.color}`;
            drumRow.dataset.drum = drum.id;
            
            // 创建鼓组标签
            const drumLabel = document.createElement('div');
            drumLabel.className = 'drum-label';
            drumLabel.innerHTML = `${drum.emoji} ${drum.name}`;
            drumRow.appendChild(drumLabel);
            
            // 创建步骤容器
            const stepsContainer = document.createElement('div');
            stepsContainer.className = 'steps-container';
            
            // 创建16个步骤按钮
            for (let i = 0; i < 16; i++) {
                const stepBtn = document.createElement('button');
                stepBtn.className = `step-btn ${drum.color}-step`;
                stepBtn.dataset.drum = drum.id;
                stepBtn.dataset.step = i;
                stepBtn.textContent = i + 1;
                
                // 每4步添加重音标记
                if (i % 4 === 0) {
                    stepBtn.classList.add('beat-accent');
                }
                
                stepBtn.addEventListener('click', () => {
                    this.toggleStep(stepBtn);
                });
                
                stepsContainer.appendChild(stepBtn);
            }
            
            drumRow.appendChild(stepsContainer);
            drumSequencer.appendChild(drumRow);
        });
        
        console.log('✅ 鼓组音序器界面已生成');
    }

    initPreviewSynth() {
        // 创建用于预览的简单合成器
        if (Tone.context.state !== 'running') {
            Tone.start().then(() => {
                this.createPreviewSynth();
            });
        } else {
            this.createPreviewSynth();
        }
    }
    
    createPreviewSynth() {
        try {
            this.previewSynth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'sine' },
                envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.8 }
            }).toDestination();
            
            this.previewSynth.volume.value = -10; // 降低预览音量
        } catch (error) {
            console.warn('无法创建预览合成器:', error);
        }
    }

    openArpeggioEditor() {
        this.currentEditingType = 'arpeggio';
        this.populateArpeggioPresets(); // 填充预设选项
        this.loadArpeggioPreset('0'); // 默认加载第一个预设
        const modal = document.getElementById('arpeggio-editor-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    openDrumEditor() {
        this.currentEditingType = 'drum';
        this.populateDrumPresets(); // 填充预设选项
        this.loadDrumPreset('0'); // 默认加载第一个预设

        // 初始化圆形音序器
        this.initCircularSequencerInModal();

        const modal = document.getElementById('drum-editor-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
            this.stopPreview();
            this.stopRealTimePreview(); // 停止实时预览

            // 清理圆形音序器
            if (this.circularSequencer) {
                this.circularSequencer.destroy();
                this.circularSequencer = null;
            }
            this.isCircularMode = false;
        }
    }

    loadArpeggioPreset(presetIndex) {
        if (presetIndex === 'custom') {
            this.resetArpeggioEditor();
            return;
        }

        // 从MusicManager获取预设
        if (window.game && window.game.musicManager && window.game.musicManager.musicPresets[presetIndex]) {
            const preset = window.game.musicManager.musicPresets[presetIndex];
            
            // 更新音符选择
            this.updateNoteSelection(preset.scale);
            
            // 更新和弦间隔
            this.updateIntervalInputs(preset.chordIntervals);
            
            // 更新琶音模式
            const patternRadio = document.querySelector(`input[name="arpeggio-pattern"][value="${preset.arpeggioPattern}"]`);
            if (patternRadio) {
                patternRadio.checked = true;
            }
            
            // 更新速度
            const tempoSlider = document.getElementById('arpeggio-tempo');
            const tempoValue = document.getElementById('tempo-value');
            if (tempoSlider && tempoValue) {
                tempoSlider.value = preset.tempo;
                tempoValue.textContent = preset.tempo;
            }
        }
    }

    loadDrumPreset(presetIndex) {
        if (presetIndex === 'custom') {
            this.resetDrumEditor();
            return;
        }

        // 从DrumManager获取预设
        const drumPresets = drumManager.getAllDrumPresets();
        if (drumPresets && drumPresets[presetIndex]) {
            const preset = drumPresets[presetIndex];
            this.updateDrumSequencer(preset.patterns);
        }
    }

    updateNoteSelection(scale) {
        // 清除所有选择
        document.querySelectorAll('.note-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // 选择音阶中的音符
        scale.forEach(note => {
            const noteBase = note.replace(/\d/g, ''); // 移除八度数字
            const noteBtn = document.querySelector(`[data-note="${noteBase}"]`);
            if (noteBtn) {
                noteBtn.classList.add('active');
            }
        });
    }

    updateIntervalInputs(intervals) {
        const inputs = document.querySelectorAll('.interval-input');
        intervals.forEach((interval, index) => {
            if (inputs[index]) {
                inputs[index].value = interval;
            }
        });
    }

    updateDrumSequencer(patterns) {
        Object.entries(patterns).forEach(([drum, pattern]) => {
            const stepBtns = document.querySelectorAll(`[data-drum="${drum}"] .step-btn`);
            stepBtns.forEach((btn, index) => {
                if (pattern[index]) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        });
    }

    toggleNote(noteBtn) {
        noteBtn.classList.toggle('active');
        this.updateArpeggioPreview();
    }

    toggleStep(stepBtn) {
        stepBtn.classList.toggle('active');
    }

    resetArpeggioEditor() {
        // 清除所有音符选择
        document.querySelectorAll('.note-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 重置和弦间隔
        const defaultIntervals = [0, 3, 5, 7, 10, 12];
        this.updateIntervalInputs(defaultIntervals);
        
        // 重置模式和速度
        const defaultPattern = document.querySelector('input[name="arpeggio-pattern"][value="upDown"]');
        if (defaultPattern) {
            defaultPattern.checked = true;
        }
        
        const tempoSlider = document.getElementById('arpeggio-tempo');
        const tempoValue = document.getElementById('tempo-value');
        if (tempoSlider && tempoValue) {
            tempoSlider.value = 100;
            tempoValue.textContent = 100;
        }
    }

    resetDrumEditor() {
        // 清除所有步骤
        document.querySelectorAll('.step-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    updateArpeggioPreview() {
        // 如果实时预览开启，立即更新预览
        if (this.isRealTimePreview && this.currentEditingType === 'arpeggio') {
            this.startRealTimeArpeggioPreview();
        }
    }

    toggleRealTimePreview(type) {
        this.currentEditingType = type;
        
        if (this.isRealTimePreview) {
            this.stopRealTimePreview();
        } else {
            this.startRealTimePreview(type);
        }
    }

    startRealTimePreview(type) {
        this.isRealTimePreview = true;
        
        // 更新按钮状态
        const button = document.getElementById(`toggle-realtime-${type}`);
        if (button) {
            button.textContent = type === 'arpeggio' ? '⏹️ 停止预览' : '⏹️ 停止预览';
            button.classList.add('active');
        }
        
        if (type === 'arpeggio') {
            this.startRealTimeArpeggioPreview();
        } else if (type === 'drum') {
            this.startRealTimeDrumPreview();
        }
    }

    stopRealTimePreview() {
        this.isRealTimePreview = false;
        
        // 清除预览循环
        if (this.realTimePreviewInterval) {
            clearInterval(this.realTimePreviewInterval);
            this.realTimePreviewInterval = null;
        }
        
        // 停止预览音频
        this.stopPreview();
        
        // 重置按钮状态
        const arpeggioBtn = document.getElementById('toggle-realtime-arpeggio');
        const drumBtn = document.getElementById('toggle-realtime-drum');
        
        if (arpeggioBtn) {
            arpeggioBtn.textContent = '🎵 实时预览';
            arpeggioBtn.classList.remove('active');
        }
        
        if (drumBtn) {
            drumBtn.textContent = '🥁 实时预览';
            drumBtn.classList.remove('active');
        }
        
        // 清除视觉反馈
        this.clearPreviewHighlights();
    }

    startRealTimeArpeggioPreview() {
        if (this.realTimePreviewInterval) {
            clearInterval(this.realTimePreviewInterval);
        }
        
        const selectedNotes = this.getSelectedNotes();
        if (selectedNotes.length === 0) return;
        
        const tempo = document.getElementById('arpeggio-tempo')?.value || 100;
        const interval = (60 / tempo / 4) * 1000; // 16分音符间隔
        
        let noteIndex = 0;
        
        this.realTimePreviewInterval = setInterval(() => {
            // 播放当前音符
            const note = selectedNotes[noteIndex % selectedNotes.length];
            if (this.previewSynth && note) {
                this.previewSynth.triggerAttackRelease(note + '4', '8n');
                
                // 视觉反馈
                this.highlightCurrentNote(note);
            }
            
            noteIndex++;
        }, interval);
    }

    startRealTimeDrumPreview() {
        if (this.realTimePreviewInterval) {
            clearInterval(this.realTimePreviewInterval);
        }
        
        const patterns = this.getDrumPatterns();
        const drumSounds = ['kick', 'snare', 'hihat', 'clap'];
        
        // 确保有预览鼓声播放器
        if (!this.previewDrumPlayers) {
            this.createPreviewDrumPlayers();
        }
        
        let stepIndex = 0;
        
        // 计算与Tone.Transport相同的16分音符间隔
        const currentBPM = Tone.Transport.bpm.value;
        const sixteenthNoteInterval = (60 / currentBPM / 4) * 1000; // 转换为毫秒
        
        this.realTimePreviewInterval = setInterval(() => {
            // 播放当前步骤的鼓声
            drumSounds.forEach(drum => {
                if (patterns[drum] && patterns[drum][stepIndex]) {
                    // 使用原始鼓声样本
                    if (this.previewDrumPlayers && this.previewDrumPlayers.player(drum)) {
                        this.previewDrumPlayers.player(drum).start();
                    }
                }
            });
            
            // 视觉反馈
            this.highlightCurrentStep(stepIndex);
            
            stepIndex = (stepIndex + 1) % 16;
        }, sixteenthNoteInterval);
    }

    createPreviewDrumPlayers() {
        // 创建与DrumManager相同的鼓声播放器
        this.previewDrumPlayers = new Tone.Players({
            urls: {
                kick: 'assets/kick.wav',
                snare: 'assets/snare.wav',
                hihat: 'assets/hihat.wav',
                clap: 'assets/clap.wav'
            },
            onload: () => {
                // 设置与原版相同的音量
                this.previewDrumPlayers.player('kick').volume.value = -6;
                this.previewDrumPlayers.player('snare').volume.value = 0;
                this.previewDrumPlayers.player('hihat').volume.value = -2;
                this.previewDrumPlayers.player('clap').volume.value = 0;
                console.log("预览鼓声样本加载完成");
            },
            onerror: (error) => {
                console.error("预览鼓声样本加载失败:", error);
            }
        }).toDestination();
    }

    highlightCurrentNote(note) {
        // 清除之前的高亮
        document.querySelectorAll('.note-btn.playing').forEach(btn => {
            btn.classList.remove('playing');
        });
        
        // 高亮当前音符
        const noteBtn = document.querySelector(`.note-btn[data-note="${note}"]`);
        if (noteBtn) {
            noteBtn.classList.add('playing');
            setTimeout(() => {
                noteBtn.classList.remove('playing');
            }, 150);
        }
    }

    highlightCurrentStep(stepIndex) {
        // 清除之前的高亮
        document.querySelectorAll('.step-btn.playing').forEach(btn => {
            btn.classList.remove('playing');
        });
        
        // 高亮当前步骤
        document.querySelectorAll(`.step-btn[data-step="${stepIndex}"]`).forEach(btn => {
            btn.classList.add('playing');
            setTimeout(() => {
                btn.classList.remove('playing');
            }, 150);
        });
    }

    clearPreviewHighlights() {
        document.querySelectorAll('.note-btn.playing, .step-btn.playing').forEach(btn => {
            btn.classList.remove('playing');
        });
    }

    populateArpeggioPresets() {
        const select = document.getElementById('arpeggio-base-preset');
        if (!select) return;

        // 清空现有选项
        select.innerHTML = '';

        // 获取音乐预设
        if (window.game && window.game.musicManager && window.game.musicManager.musicPresets) {
            const presets = window.game.musicManager.musicPresets;
            presets.forEach((preset, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = preset.name;
                select.appendChild(option);
            });
        } else {
            // 默认预设（如果无法获取）
            const defaultPresets = [
                'C Minor Pentatonic',
                'G Major Pentatonic', 
                'E Minor Blues',
                'A Dorian Mode',
                'Japanese Pentatonic'
            ];
            
            defaultPresets.forEach((name, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = name;
                select.appendChild(option);
            });
        }

        // 添加自定义选项
        const customOption = document.createElement('option');
        customOption.value = 'custom';
        customOption.textContent = '🎨 自定义';
        select.appendChild(customOption);
    }

    populateDrumPresets() {
        const select = document.getElementById('drum-base-preset');
        if (!select) return;

        // 清空现有选项
        select.innerHTML = '';

        // 获取鼓组预设
        const drumPresets = drumManager.getAllDrumPresets();
        if (drumPresets && drumPresets.length > 0) {
            drumPresets.forEach((preset, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = preset.name;
                select.appendChild(option);
            });
        } else {
            // 默认预设（如果无法获取）
            const defaultPresets = [
                'Hip Hop',
                'House',
                'Techno', 
                'Funk',
                'Reggae'
            ];
            
            defaultPresets.forEach((name, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = name;
                select.appendChild(option);
            });
        }

        // 添加自定义选项
        const customOption = document.createElement('option');
        customOption.value = 'custom';
        customOption.textContent = '🎨 自定义';
        select.appendChild(customOption);
    }

    previewArpeggio() {
        this.stopPreview();
        
        const selectedNotes = this.getSelectedNotes();
        const intervals = this.getChordIntervals();
        const patternElement = document.querySelector('input[name="arpeggio-pattern"]:checked');
        const pattern = patternElement ? patternElement.value : 'upDown';
        const tempoSlider = document.getElementById('arpeggio-tempo');
        const tempo = tempoSlider ? parseInt(tempoSlider.value) : 100;
        
        if (selectedNotes.length === 0) {
            alert('请至少选择一个音符！');
            return;
        }

        if (!this.previewSynth) {
            this.createPreviewSynth();
        }

        try {
            // 创建琶音预览
            Tone.Transport.bpm.value = tempo;
            
            const rootNote = selectedNotes[0] + '3'; // 使用第一个选中的音符作为根音
            const chord = Tone.Frequency(rootNote).harmonize(intervals);
            const arpeggioNotes = chord.map(freq => Tone.Frequency(freq).toNote());
            
            this.previewSequence = new Tone.Pattern((time, note) => {
                if (this.previewSynth) {
                    this.previewSynth.triggerAttackRelease(note, "8n", time, 0.3);
                }
            }, arpeggioNotes, pattern);
            
            this.previewSequence.interval = "8n";
            this.previewSequence.start(0);
            
            // 5秒后停止预览
            setTimeout(() => {
                this.stopPreview();
            }, 5000);
        } catch (error) {
            console.warn('琶音预览失败:', error);
            alert('琶音预览失败，请检查设置');
        }
    }

    previewDrum() {
        const patterns = this.getDrumPatterns();
        
        // 检查是否有激活的步骤
        const hasActiveSteps = Object.values(patterns).some(pattern => 
            pattern.some(step => step === true)
        );
        
        if (!hasActiveSteps) {
            alert('请先设置一些鼓点！');
            return;
        }
        
        // 确保有预览鼓声播放器
        if (!this.previewDrumPlayers) {
            this.createPreviewDrumPlayers();
        }
        
        try {
            // 停止之前的预览
            this.stopPreview();
            
            let stepIndex = 0;
            this.previewSequence = new Tone.Sequence((time) => {
                Object.keys(patterns).forEach(drumType => {
                    if (patterns[drumType][stepIndex] && this.previewDrumPlayers && this.previewDrumPlayers.player(drumType)) {
                        // 使用原始鼓声样本
                        this.previewDrumPlayers.player(drumType).start(time);
                    }
                });
                stepIndex = (stepIndex + 1) % 16;
            }, new Array(16).fill(0), "16n");
            
            this.previewSequence.start(0);
            
            // 8秒后停止预览
            setTimeout(() => {
                this.stopPreview();
            }, 8000);
            
            console.log('🥁 鼓组预览开始');
        } catch (error) {
            console.warn('鼓组预览失败:', error);
            alert('鼓组预览失败，请检查设置');
        }
    }

    stopPreview() {
        if (this.previewSequence) {
            this.previewSequence.stop();
            this.previewSequence.dispose();
            this.previewSequence = null;
        }
        
        // 清理预览高亮
        this.clearPreviewHighlights();
    }

    getSelectedNotes() {
        const selectedBtns = document.querySelectorAll('.note-btn.active');
        return Array.from(selectedBtns).map(btn => btn.dataset.note);
    }

    getChordIntervals() {
        const inputs = document.querySelectorAll('.interval-input');
        return Array.from(inputs)
            .map(input => parseInt(input.value) || 0)
            .filter(val => !isNaN(val));
    }

    getDrumPatterns() {
        // 如果是圆形模式，从圆形音序器获取数据
        if (this.isCircularMode && this.circularSequencer) {
            return this.circularSequencer.getPatterns();
        }

        // 传统模式：从DOM获取数据
        const patterns = {};
        const drums = ['kick', 'snare', 'hihat', 'clap', 'openhat'];

        drums.forEach(drum => {
            const stepBtns = document.querySelectorAll(`[data-drum="${drum}"] .step-btn`);
            if (stepBtns.length > 0) {
                patterns[drum] = Array.from(stepBtns).map(btn => btn.classList.contains('active'));
            } else {
                // 如果没有找到对应的按钮，创建默认的空模式
                patterns[drum] = new Array(16).fill(false);
            }
        });

        return patterns;
    }

    openSavePresetModal(type) {
        this.currentEditingType = type;
        const nameInput = document.getElementById('preset-name');
        if (nameInput) {
            nameInput.value = '';
        }
        const modal = document.getElementById('save-preset-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    savePreset() {
        const nameInput = document.getElementById('preset-name');
        const name = nameInput ? nameInput.value.trim() : '';
        
        if (!name) {
            alert('请输入预设名称！');
            return;
        }

        let preset;
        if (this.currentEditingType === 'arpeggio') {
            preset = this.createArpeggioPreset(name);
            this.saveToLocalStorage('custom-arpeggio-presets', preset);
        } else if (this.currentEditingType === 'drum') {
            preset = this.createDrumPreset(name);
            this.saveToLocalStorage('custom-drum-presets', preset);
        }

        this.closeModal(document.getElementById('save-preset-modal'));
        alert(`预设 "${name}" 已保存！`);
    }

    createArpeggioPreset(name) {
        const patternElement = document.querySelector('input[name="arpeggio-pattern"]:checked');
        const tempoSlider = document.getElementById('arpeggio-tempo');
        
        return {
            name: name,
            scale: this.getSelectedNotes().map(note => note + '3'), // 添加八度
            chordIntervals: this.getChordIntervals(),
            arpeggioPattern: patternElement ? patternElement.value : 'upDown',
            tempo: tempoSlider ? parseInt(tempoSlider.value) : 100,
            synthPreset: 0,
            custom: true
        };
    }

    // 辅助方法：从选中的音符生成音阶
    generateScaleFromNotes(selectedNotes) {
        if (!selectedNotes || selectedNotes.length === 0) {
            return ['C', 'D', 'E', 'F', 'G', 'A', 'B']; // 默认C大调
        }
        
        // 扩展选中的音符到完整音阶
        const baseNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        // 获取选中音符的索引
        const selectedIndices = selectedNotes.map(note => {
            const cleanNote = note.replace(/[0-9]/g, ''); // 移除八度标记
            return baseNotes.indexOf(cleanNote);
        }).filter(index => index !== -1);
        
        // 如果有足够的音符，返回它们，否则填充为完整音阶
        if (selectedIndices.length >= 7) {
            return selectedNotes.slice(0, 7);
        } else {
            return selectedNotes.concat(['C', 'D', 'E', 'F', 'G', 'A', 'B'].slice(selectedNotes.length));
        }
    }

    createDrumPreset(name) {
        return {
            name: name,
            patterns: this.getDrumPatterns(),
            custom: true
        };
    }

    saveToLocalStorage(key, preset) {
        try {
            const existingPresets = JSON.parse(localStorage.getItem(key) || '[]');
            existingPresets.push(preset);
            localStorage.setItem(key, JSON.stringify(existingPresets));
        } catch (error) {
            console.warn('保存预设到本地存储失败:', error);
        }
    }

    applyArpeggioChanges() {
        const selectedNotes = this.getSelectedNotes();
        if (selectedNotes.length === 0) {
            alert('请至少选择一个音符！');
            return;
        }
        
        // 将预设应用到游戏中
        if (window.game && window.game.musicManager) {
            const musicManager = window.game.musicManager;
            const currentIndex = musicManager.currentMusicPresetIndex;
            const currentPreset = musicManager.musicPresets[currentIndex];
            
            // 获取编辑器中的设置
            const patternElement = document.querySelector('input[name="arpeggio-pattern"]:checked');
            const tempoSlider = document.getElementById('arpeggio-tempo');
            const newTempo = tempoSlider ? parseInt(tempoSlider.value) : (currentPreset ? currentPreset.tempo : 100);
            
            // 修改现有预设或创建新的
            let presetName;
            if (currentPreset) {
                // 修改现有预设
                presetName = currentPreset.name + " (已修改)";
                musicManager.musicPresets[currentIndex] = {
                    ...currentPreset,
                    name: presetName,
                    scale: selectedNotes.map(note => note + '3'),
                    chordIntervals: this.getChordIntervals(),
                    arpeggioPattern: patternElement ? patternElement.value : 'upDown',
                    tempo: newTempo,
                    modified: true
                };
            } else {
                // 创建新预设
                presetName = "自定义琶音预设";
                const newPreset = {
                    name: presetName,
                    scale: selectedNotes.map(note => note + '3'),
                    chordIntervals: this.getChordIntervals(),
                    arpeggioPattern: patternElement ? patternElement.value : 'upDown',
                    tempo: newTempo,
                    synthPreset: 0,
                    custom: true
                };
                musicManager.musicPresets.push(newPreset);
                musicManager.currentMusicPresetIndex = musicManager.musicPresets.length - 1;
            }
            
            // 应用BPM - 以最后修改的琶音BPM为准
            Tone.Transport.bpm.value = newTempo;
            console.log(`BPM已更新为琶音预设: ${newTempo}`);
            
            // 更新UI显示
            if (window.game._updatePresetDisplay) {
                window.game._updatePresetDisplay();
            }
            if (window.game._generateMusicPresetOptions) {
                window.game._generateMusicPresetOptions();
            }
            if (window.game._showPresetChangeNotification) {
                window.game._showPresetChangeNotification(`琶音风格: ${presetName} (${newTempo} BPM)`, 'music');
            }
            
            console.log('✅ 琶音预设已应用:', musicManager.musicPresets[musicManager.currentMusicPresetIndex]);
            alert('琶音设置已应用！');
        } else {
            alert('无法应用预设：游戏未正确初始化');
        }
        
        this.closeModal(document.getElementById('arpeggio-editor-modal'));
    }

    applyDrumChanges() {
        const patterns = this.getDrumPatterns();
        
        // 检查是否有激活的步骤
        const hasActiveSteps = Object.values(patterns).some(pattern => 
            pattern.some(step => step === true)
        );
        
        if (!hasActiveSteps) {
            alert('请至少激活一个鼓点！');
            return;
        }
        
        // 将预设应用到游戏中
        if (window.drumManager) {
            const drumPresets = window.drumManager.getAllDrumPresets();
            const currentIndex = window.drumManager.currentDrumPresetIndex || 0;
            const currentPreset = drumPresets[currentIndex];
            
            // 修改现有预设或创建新的
            let presetName;
            let newBPM = currentPreset ? currentPreset.bpm : 120;
            
            if (currentPreset) {
                // 修改现有预设
                presetName = currentPreset.name + " (已修改)";
                // 保持现有的BPM
                newBPM = currentPreset.bpm;
                
                // 更新现有预设
                const updatedPreset = {
                    ...currentPreset,
                    name: presetName,
                    patterns: patterns,
                    modified: true
                };
                
                // 直接修改drumPresets数组中的预设
                if (window.drumManager.updateDrumPreset) {
                    window.drumManager.updateDrumPreset(currentIndex, updatedPreset);
                } else {
                    // 如果没有更新方法，直接修改
                    window.drumManager.drumPresets[currentIndex] = updatedPreset;
                }
            } else {
                // 创建新预设
                presetName = "自定义鼓组预设";
                newBPM = 120; // 默认BPM
                
                const newPreset = {
                    name: presetName,
                    bpm: newBPM,
                    patterns: patterns,
                    custom: true
                };
                
                if (window.drumManager.addDrumPreset) {
                    window.drumManager.addDrumPreset(newPreset);
                } else {
                    window.drumManager.drumPresets.push(newPreset);
                    window.drumManager.currentDrumPresetIndex = window.drumManager.drumPresets.length - 1;
                }
            }
            
            // 应用鼓组模式
            if (window.drumManager.setDrumPreset) {
                window.drumManager.setDrumPreset(currentIndex);
            } else {
                window.drumManager.drumPattern = patterns;
            }
            
            // 应用BPM - 以最后修改的鼓组BPM为准
            Tone.Transport.bpm.value = newBPM;
            console.log(`BPM已更新为鼓组预设: ${newBPM}`);
            
            // 更新UI显示
            if (window.game && window.game._generateDrumPresetOptions) {
                window.game._generateDrumPresetOptions();
            }
            if (window.game && window.game._showPresetChangeNotification) {
                window.game._showPresetChangeNotification(`鼓组: ${presetName} (${newBPM} BPM)`, 'drum');
            }
            
            console.log('✅ 鼓组预设已应用:', { name: presetName, bpm: newBPM, patterns });
            alert('鼓组设置已应用！');
        } else {
            alert('无法应用预设：鼓组管理器未正确初始化');
        }
        
        this.closeModal(document.getElementById('drum-editor-modal'));
    }
}

// 全局快速操作函数
window.clearAllDrums = function() {
    if (window.customEditor && window.customEditor.isCircularMode && window.customEditor.circularSequencer) {
        // 圆形模式：清空圆形音序器
        window.customEditor.circularSequencer.clearAll();
    } else {
        // 传统模式：清空传统音序器
        document.querySelectorAll('.step-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }
};

window.randomizeDrums = function() {
    if (window.customEditor && window.customEditor.isCircularMode && window.customEditor.circularSequencer) {
        // 圆形模式：随机化圆形音序器
        window.customEditor.circularSequencer.randomize();
    } else {
        // 传统模式：随机化传统音序器
        document.querySelectorAll('.step-btn').forEach(btn => {
            if (Math.random() > 0.7) { // 30% 概率激活
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
};

window.copyPattern = function() {
    if (window.customEditor) {
        window.customEditor.clipboardPattern = window.customEditor.getDrumPatterns();
        alert('模式已复制到剪贴板！');
    }
};

window.pastePattern = function() {
    if (window.customEditor && window.customEditor.clipboardPattern) {
        window.customEditor.updateDrumSequencer(window.customEditor.clipboardPattern);
        alert('模式已粘贴！');
    } else {
        alert('剪贴板中没有模式！');
    }
};

// 圆形音序器类
class CircularSequencer {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);

        // 配置参数
        this.config = {
            centerX: options.centerX || 250,
            centerY: options.centerY || 250,
            innerRadius: options.innerRadius || 60,
            ringWidth: options.ringWidth || 35,
            ringGap: options.ringGap || 3,
            segments: options.segments || 16,
            ...options
        };

        // 鼓声配置
        this.drumTypes = [
            { id: 'kick', name: 'Kick', color: '#D72828', emoji: '🥁' },
            { id: 'snare', name: 'Snare', color: '#F36E2F', emoji: '🥁' },
            { id: 'hihat', name: 'Hi-hat', color: '#84C34E', emoji: '🎩' },
            { id: 'clap', name: 'Clap', color: '#7B4394', emoji: '👏' },
            { id: 'openhat', name: 'Open Hat', color: '#4A90E2', emoji: '🎩' }
        ];

        // 状态数据
        this.patterns = {};
        this.drumTypes.forEach(drum => {
            this.patterns[drum.id] = new Array(16).fill(false);
        });

        // Canvas相关
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        this.currentPlayPosition = -1;

        // 交互状态
        this.isDragging = false;
        this.lastClickedSegment = null;

        this.init();
    }

    init() {
        this.createCanvas();
        this.createLegend();
        this.setupEventListeners();
        this.render();
        console.log('✅ 圆形音序器已初始化');
    }

    createCanvas() {
        // 创建canvas元素
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.config.centerX * 2;
        this.canvas.height = this.config.centerY * 2;
        this.canvas.style.border = '1px solid #333';
        this.canvas.style.borderRadius = '50%';
        this.canvas.style.background = 'radial-gradient(circle, #1a1a1a 0%, #000 100%)';
        this.canvas.style.cursor = 'pointer';

        this.ctx = this.canvas.getContext('2d');

        // 清空容器并添加canvas
        this.container.innerHTML = '';
        this.container.appendChild(this.canvas);
    }

    createLegend() {
        const legend = document.createElement('div');
        legend.className = 'circular-legend';

        this.drumTypes.forEach((drum, index) => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';

            const colorDot = document.createElement('div');
            colorDot.className = 'legend-color';
            colorDot.style.backgroundColor = drum.color;

            const label = document.createElement('span');
            label.textContent = `${drum.emoji} ${drum.name}`;

            legendItem.appendChild(colorDot);
            legendItem.appendChild(label);
            legend.appendChild(legendItem);
        });

        this.container.appendChild(legend);
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
    }

    // 获取鼠标在canvas中的坐标
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    // 将笛卡尔坐标转换为极坐标
    cartesianToPolar(x, y) {
        const dx = x - this.config.centerX;
        const dy = y - this.config.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        let angle = Math.atan2(dy, dx);

        // 调整角度，使0度在顶部，顺时针增加
        angle = angle + Math.PI / 2;
        if (angle < 0) angle += 2 * Math.PI;

        return { distance, angle };
    }

    // 根据极坐标确定点击的环和段
    getSegmentFromPolar(distance, angle) {
        // 确定环（从外到内：0-4）
        let ring = -1;
        for (let i = 0; i < this.drumTypes.length; i++) {
            const innerR = this.config.innerRadius + i * (this.config.ringWidth + this.config.ringGap);
            const outerR = innerR + this.config.ringWidth;

            if (distance >= innerR && distance <= outerR) {
                ring = i;
                break;
            }
        }

        if (ring === -1) return null;

        // 确定段（0-15）
        const segmentAngle = (2 * Math.PI) / this.config.segments;
        const segment = Math.floor(angle / segmentAngle) % this.config.segments;

        return { ring, segment };
    }

    // 处理鼠标事件
    handleClick(e) {
        const mousePos = this.getMousePos(e);
        const polar = this.cartesianToPolar(mousePos.x, mousePos.y);
        const segment = this.getSegmentFromPolar(polar.distance, polar.angle);

        if (segment) {
            this.toggleSegment(segment.ring, segment.segment);
        }
    }

    handleMouseDown(e) {
        this.isDragging = true;
        this.handleClick(e);
    }

    handleMouseMove(e) {
        if (!this.isDragging) return;

        const mousePos = this.getMousePos(e);
        const polar = this.cartesianToPolar(mousePos.x, mousePos.y);
        const segment = this.getSegmentFromPolar(polar.distance, polar.angle);

        if (segment && this.lastClickedSegment) {
            const key = `${segment.ring}-${segment.segment}`;
            const lastKey = `${this.lastClickedSegment.ring}-${this.lastClickedSegment.segment}`;

            if (key !== lastKey) {
                this.toggleSegment(segment.ring, segment.segment);
                this.lastClickedSegment = segment;
            }
        }
    }

    handleMouseUp(e) {
        this.isDragging = false;
        this.lastClickedSegment = null;
    }

    // 切换段的激活状态
    toggleSegment(ring, segment) {
        if (ring >= 0 && ring < this.drumTypes.length && segment >= 0 && segment < this.config.segments) {
            const drumType = this.drumTypes[ring].id;
            this.patterns[drumType][segment] = !this.patterns[drumType][segment];
            this.lastClickedSegment = { ring, segment };
            this.render();
        }
    }

    // 渲染圆形音序器
    render() {
        const ctx = this.ctx;
        const { centerX, centerY, innerRadius, ringWidth, ringGap, segments } = this.config;

        // 清空画布
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制每个环
        this.drumTypes.forEach((drumType, ringIndex) => {
            const innerR = innerRadius + ringIndex * (ringWidth + ringGap);
            const outerR = innerR + ringWidth;

            // 绘制每个段
            for (let segmentIndex = 0; segmentIndex < segments; segmentIndex++) {
                const startAngle = (segmentIndex * 2 * Math.PI / segments) - Math.PI / 2;
                const endAngle = ((segmentIndex + 1) * 2 * Math.PI / segments) - Math.PI / 2;

                const isActive = this.patterns[drumType.id][segmentIndex];
                const isCurrentPlay = segmentIndex === this.currentPlayPosition;

                // 设置颜色
                let color = drumType.color;
                let alpha = isActive ? 0.8 : 0.2;

                if (isCurrentPlay) {
                    alpha = Math.min(alpha + 0.3, 1.0);
                }

                // 绘制段
                ctx.beginPath();
                ctx.arc(centerX, centerY, innerR, startAngle, endAngle);
                ctx.arc(centerX, centerY, outerR, endAngle, startAngle, true);
                ctx.closePath();

                // 填充颜色
                ctx.fillStyle = this.hexToRgba(color, alpha);
                ctx.fill();

                // 绘制边框
                ctx.strokeStyle = this.hexToRgba('#ffffff', 0.1);
                ctx.lineWidth = 1;
                ctx.stroke();

                // 如果是激活状态，添加发光效果
                if (isActive) {
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 8;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }
        });

        // 绘制中心标签
        this.drawCenterLabel();

        // 绘制播放指针
        if (this.currentPlayPosition >= 0) {
            this.drawPlayPointer();
        }
    }

    // 绘制中心标签
    drawCenterLabel() {
        const ctx = this.ctx;
        const { centerX, centerY, innerRadius } = this.config;

        // 绘制中心圆
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius - 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 绘制文字
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('DRUM', centerX, centerY - 8);
        ctx.font = '12px Arial';
        ctx.fillText('SEQUENCER', centerX, centerY + 8);
    }

    // 绘制播放指针
    drawPlayPointer() {
        const ctx = this.ctx;
        const { centerX, centerY, innerRadius, ringWidth, ringGap } = this.config;
        const totalRadius = innerRadius + this.drumTypes.length * (ringWidth + ringGap) + 10;

        const angle = (this.currentPlayPosition * 2 * Math.PI / this.config.segments) - Math.PI / 2;
        const endX = centerX + Math.cos(angle) * totalRadius;
        const endY = centerY + Math.sin(angle) * totalRadius;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // 绘制指针头
        ctx.beginPath();
        ctx.arc(endX, endY, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    }

    // 工具方法：将十六进制颜色转换为RGBA
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // 设置播放位置
    setPlayPosition(position) {
        this.currentPlayPosition = position;
        this.render();
    }

    // 获取当前模式
    getPatterns() {
        return { ...this.patterns };
    }

    // 设置模式
    setPatterns(patterns) {
        this.patterns = { ...patterns };
        this.render();
    }

    // 清空所有模式
    clearAll() {
        this.drumTypes.forEach(drum => {
            this.patterns[drum.id] = new Array(16).fill(false);
        });
        this.render();
    }

    // 随机化模式
    randomize() {
        this.drumTypes.forEach(drum => {
            this.patterns[drum.id] = new Array(16).fill(false).map(() => Math.random() > 0.7);
        });
        this.render();
    }

    // 销毁
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}