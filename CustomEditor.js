// 自定义编辑器模块
import * as Tone from 'https://esm.sh/tone';

export class CustomEditor {
    constructor() {
        this.currentEditingType = null; // 'arpeggio' 或 'drum'
        this.customArpeggioPreset = null;
        this.customDrumPreset = null;
        this.clipboardPattern = null;
        this.previewSynth = null;
        this.previewSequence = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.generateNoteGrid();
        this.generateDrumSequencer();
        this.initPreviewSynth();
    }

    setupEventListeners() {
        // 编辑器按钮
        document.getElementById('open-arpeggio-editor').addEventListener('click', () => {
            this.openArpeggioEditor();
        });
        
        document.getElementById('open-drum-editor').addEventListener('click', () => {
            this.openDrumEditor();
        });

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
    }

    setupArpeggioEditorEvents() {
        // 基础预设选择
        document.getElementById('arpeggio-base-preset').addEventListener('change', (e) => {
            this.loadArpeggioPreset(e.target.value);
        });

        // 速度控制
        const tempoSlider = document.getElementById('arpeggio-tempo');
        const tempoValue = document.getElementById('tempo-value');
        
        tempoSlider.addEventListener('input', (e) => {
            tempoValue.textContent = e.target.value;
        });

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
        document.getElementById('preview-arpeggio').addEventListener('click', () => {
            this.previewArpeggio();
        });
        
        document.getElementById('save-arpeggio').addEventListener('click', () => {
            this.openSavePresetModal('arpeggio');
        });
        
        document.getElementById('apply-arpeggio').addEventListener('click', () => {
            this.applyArpeggioChanges();
        });
    }

    setupDrumEditorEvents() {
        // 基础预设选择
        document.getElementById('drum-base-preset').addEventListener('change', (e) => {
            this.loadDrumPreset(e.target.value);
        });

        // 按钮事件
        document.getElementById('preview-drum').addEventListener('click', () => {
            this.previewDrum();
        });
        
        document.getElementById('save-drum').addEventListener('click', () => {
            this.openSavePresetModal('drum');
        });
        
        document.getElementById('apply-drum').addEventListener('click', () => {
            this.applyDrumChanges();
        });
    }

    setupSavePresetEvents() {
        document.getElementById('confirm-save').addEventListener('click', () => {
            this.savePreset();
        });
        
        document.getElementById('cancel-save').addEventListener('click', () => {
            this.closeModal(document.getElementById('save-preset-modal'));
        });
    }

    generateNoteGrid() {
        const noteGrid = document.querySelector('.note-grid');
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
        const drums = ['kick', 'snare', 'hihat', 'clap'];
        
        drums.forEach(drum => {
            const stepRow = document.querySelector(`[data-drum="${drum}"]`);
            stepRow.innerHTML = '';
            
            for (let i = 0; i < 16; i++) {
                const stepBtn = document.createElement('button');
                stepBtn.className = 'step-btn';
                stepBtn.dataset.drum = drum;
                stepBtn.dataset.step = i;
                
                stepBtn.addEventListener('click', () => {
                    this.toggleStep(stepBtn);
                });
                
                stepRow.appendChild(stepBtn);
            }
        });
    }

    initPreviewSynth() {
        // 创建用于预览的简单合成器
        this.previewSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'sine' },
            envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.8 }
        }).toDestination();
        
        this.previewSynth.volume.value = -10; // 降低预览音量
    }

    openArpeggioEditor() {
        this.currentEditingType = 'arpeggio';
        this.loadArpeggioPreset('0'); // 默认加载第一个预设
        document.getElementById('arpeggio-editor-modal').style.display = 'block';
    }

    openDrumEditor() {
        this.currentEditingType = 'drum';
        this.loadDrumPreset('0'); // 默认加载第一个预设
        document.getElementById('drum-editor-modal').style.display = 'block';
    }

    closeModal(modal) {
        modal.style.display = 'none';
        this.stopPreview();
    }

    loadArpeggioPreset(presetIndex) {
        if (presetIndex === 'custom') {
            // 加载自定义预设或创建空白预设
            this.resetArpeggioEditor();
            return;
        }

        // 从MusicManager获取预设（需要传递window.musicManager）
        if (window.musicManager && window.musicManager.musicPresets[presetIndex]) {
            const preset = window.musicManager.musicPresets[presetIndex];
            
            // 更新音符选择
            this.updateNoteSelection(preset.scale);
            
            // 更新和弦间隔
            this.updateIntervalInputs(preset.chordIntervals);
            
            // 更新琶音模式
            document.querySelector(`input[name="arpeggio-pattern"][value="${preset.arpeggioPattern}"]`).checked = true;
            
            // 更新速度
            document.getElementById('arpeggio-tempo').value = preset.tempo;
            document.getElementById('tempo-value').textContent = preset.tempo;
        }
    }

    loadDrumPreset(presetIndex) {
        if (presetIndex === 'custom') {
            this.resetDrumEditor();
            return;
        }

        // 从DrumManager获取预设（需要传递window.drumManager）
        if (window.drumPresets && window.drumPresets[presetIndex]) {
            const preset = window.drumPresets[presetIndex];
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
            const stepBtns = document.querySelectorAll(`[data-drum="${drum}"]`);
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
        document.querySelector('input[name="arpeggio-pattern"][value="upDown"]').checked = true;
        document.getElementById('arpeggio-tempo').value = 100;
        document.getElementById('tempo-value').textContent = 100;
    }

    resetDrumEditor() {
        // 清除所有步骤
        document.querySelectorAll('.step-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    updateArpeggioPreview() {
        // 实时更新预览（可选功能）
        // 这里可以添加实时预览逻辑
    }

    previewArpeggio() {
        this.stopPreview();
        
        const selectedNotes = this.getSelectedNotes();
        const intervals = this.getChordIntervals();
        const pattern = document.querySelector('input[name="arpeggio-pattern"]:checked').value;
        const tempo = parseInt(document.getElementById('arpeggio-tempo').value);
        
        if (selectedNotes.length === 0) {
            alert('请至少选择一个音符！');
            return;
        }

        // 创建琶音预览
        Tone.Transport.bpm.value = tempo;
        
        const rootNote = selectedNotes[0] + '3'; // 使用第一个选中的音符作为根音
        const chord = Tone.Frequency(rootNote).harmonize(intervals);
        const arpeggioNotes = chord.map(freq => Tone.Frequency(freq).toNote());
        
        this.previewSequence = new Tone.Pattern((time, note) => {
            this.previewSynth.triggerAttackRelease(note, "8n", time, 0.3);
        }, arpeggioNotes, pattern);
        
        this.previewSequence.interval = "8n";
        this.previewSequence.start(0);
        
        // 5秒后停止预览
        setTimeout(() => {
            this.stopPreview();
        }, 5000);
    }

    previewDrum() {
        // 鼓组预览功能
        alert('鼓组预览功能开发中...');
    }

    stopPreview() {
        if (this.previewSequence) {
            this.previewSequence.stop();
            this.previewSequence.dispose();
            this.previewSequence = null;
        }
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
        const patterns = {};
        const drums = ['kick', 'snare', 'hihat', 'clap'];
        
        drums.forEach(drum => {
            const stepBtns = document.querySelectorAll(`[data-drum="${drum}"] .step-btn`);
            patterns[drum] = Array.from(stepBtns).map(btn => btn.classList.contains('active'));
        });
        
        return patterns;
    }

    openSavePresetModal(type) {
        this.currentEditingType = type;
        document.getElementById('preset-name').value = '';
        document.getElementById('save-preset-modal').style.display = 'block';
    }

    savePreset() {
        const name = document.getElementById('preset-name').value.trim();
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
        return {
            name: name,
            scale: this.getSelectedNotes().map(note => note + '3'), // 添加八度
            chordIntervals: this.getChordIntervals(),
            arpeggioPattern: document.querySelector('input[name="arpeggio-pattern"]:checked').value,
            tempo: parseInt(document.getElementById('arpeggio-tempo').value),
            synthPreset: 0,
            custom: true
        };
    }

    createDrumPreset(name) {
        return {
            name: name,
            patterns: this.getDrumPatterns(),
            custom: true
        };
    }

    saveToLocalStorage(key, preset) {
        const existingPresets = JSON.parse(localStorage.getItem(key) || '[]');
        existingPresets.push(preset);
        localStorage.setItem(key, JSON.stringify(existingPresets));
    }

    applyArpeggioChanges() {
        const preset = this.createArpeggioPreset('临时预设');
        
        // 将预设应用到游戏中
        if (window.musicManager) {
            window.musicManager.applyCustomPreset(preset);
            alert('琶音设置已应用！');
        }
        
        this.closeModal(document.getElementById('arpeggio-editor-modal'));
    }

    applyDrumChanges() {
        const preset = this.createDrumPreset('临时预设');
        
        // 将预设应用到游戏中
        if (window.drumManager) {
            window.drumManager.applyCustomPreset(preset);
            alert('鼓组设置已应用！');
        }
        
        this.closeModal(document.getElementById('drum-editor-modal'));
    }
}

// 全局快速操作函数
window.clearAllDrums = function() {
    document.querySelectorAll('.step-btn').forEach(btn => {
        btn.classList.remove('active');
    });
};

window.randomizeDrums = function() {
    document.querySelectorAll('.step-btn').forEach(btn => {
        if (Math.random() > 0.7) { // 30% 概率激活
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
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