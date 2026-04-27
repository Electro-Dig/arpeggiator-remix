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
            this.initializeSequencePreviewSynth();

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

        // 鼓组编辑器的实时预览按钮现在在HTML中静态定义，通过统一的事件绑定处理
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

        // 默认显示圆形模式
        this.switchToMode('circular');
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
        console.log(`🔄 切换到${mode}模式`);

        const traditionalSequencer = document.getElementById('drum-sequencer');
        const circularContainer = document.getElementById('circular-sequencer-container');
        // 查找原始的传统模式按钮（不包括圆形模式的按钮）
        const traditionalActions = document.querySelector('#drum-editor-modal .editor-actions:not(.circular-actions)');
        const toggleBtn = document.getElementById('mode-toggle-btn');

        if (mode === 'circular') {
            // 切换到圆形模式
            console.log('📊 切换前传统模式数据:', this.getTraditionalModePatterns());

            if (traditionalSequencer) traditionalSequencer.style.display = 'none';
            if (circularContainer) circularContainer.style.display = 'block';
            if (traditionalActions) {
                traditionalActions.style.display = 'none';
                console.log('✅ 隐藏传统模式按钮');
            } else {
                console.log('❌ 找不到传统模式按钮');
            }
            if (toggleBtn) {
                toggleBtn.textContent = '📋 传统模式';
                toggleBtn.title = '切换到传统音序器';
            }

            // 创建圆形音序器（如果不存在）
            if (!this.circularSequencer) {
                console.log('🔧 创建新的圆形音序器');
                this.createCircularSequencer();
            } else {
                console.log('♻️ 使用现有的圆形音序器');
            }

            // 同步传统模式数据到圆形模式
            console.log('🔄 同步数据到圆形模式...');
            this.syncPatternsToCircular();

            this.isCircularMode = true;

        } else {
            // 切换到传统模式
            console.log('📊 切换前圆形模式数据:', this.circularSequencer ? this.circularSequencer.getPatterns() : '无');

            if (traditionalSequencer) traditionalSequencer.style.display = 'block';
            if (circularContainer) circularContainer.style.display = 'none';
            if (traditionalActions) {
                traditionalActions.style.display = 'flex';
                console.log('✅ 显示传统模式按钮');
            } else {
                console.log('❌ 找不到传统模式按钮');
            }
            if (toggleBtn) {
                toggleBtn.textContent = '🎯 圆形模式';
                toggleBtn.title = '切换到圆形音序器';
            }

            // 同步圆形模式数据到传统模式
            console.log('🔄 同步数据到传统模式...');
            this.syncPatternsFromCircular();

            // 不销毁圆形音序器，保持数据
            // if (this.circularSequencer) {
            //     this.circularSequencer.destroy();
            //     this.circularSequencer = null;
            // }
            this.isCircularMode = false;
        }

        console.log(`✅ 已切换到${mode}模式`);
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

        // 直接在圆形容器中添加操作按钮
        this.addButtonsToCircularContainer();
    }

    addButtonsToCircularContainer() {
        const container = document.getElementById('circular-sequencer-container');
        if (!container) {
            console.error('❌ 找不到圆形音序器容器');
            return;
        }

        // 检查是否已经添加了按钮
        if (container.querySelector('.circular-actions')) {
            console.log('✅ 圆形按钮已存在，跳过创建');
            return;
        }

        console.log('🔧 开始创建圆形模式按钮...');

        // 创建按钮容器
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'circular-actions editor-actions';
        buttonsDiv.style.marginTop = '20px';

        // 创建按钮HTML - 只保留实时预览、重置和应用按钮
        buttonsDiv.innerHTML = `
            <button id="realtime-circular" class="action-btn realtime">🥁 实时预览</button>
            <button id="reset-circular" class="action-btn reset">重置</button>
            <button id="apply-circular" class="action-btn apply">应用</button>
        `;

        // 添加到容器
        container.appendChild(buttonsDiv);
        console.log('✅ 圆形模式按钮已添加到容器');

        // 绑定事件 - 使用统一的按钮事件处理
        this.bindUnifiedDrumButtonEvents();
    }



    syncPatternsToCircular() {
        if (!this.circularSequencer) {
            console.log('❌ 无法同步到圆形模式：圆形音序器不存在');
            return;
        }

        // 强制从传统模式DOM获取数据，不依赖当前模式状态
        const patterns = this.getTraditionalModePatterns();
        console.log('📊 传统模式数据:', patterns);

        this.circularSequencer.setPatterns(patterns);
        console.log('✅ 数据已同步到圆形模式');

        // 验证同步结果
        const circularPatterns = this.circularSequencer.getPatterns();
        console.log('📊 圆形模式同步后数据:', circularPatterns);
    }

    syncPatternsFromCircular() {
        if (!this.circularSequencer) {
            console.log('❌ 无法从圆形模式同步：圆形音序器不存在');
            return;
        }

        const patterns = this.circularSequencer.getPatterns();
        console.log('📊 圆形模式数据:', patterns);

        this.updateDrumSequencer(patterns);
        console.log('✅ 数据已同步到传统模式');

        // 验证同步结果
        const traditionalPatterns = this.getDrumPatterns();
        console.log('📊 传统模式同步后数据:', traditionalPatterns);
    }

    // 专门从传统模式DOM获取数据的方法
    getTraditionalModePatterns() {
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

        console.log('🔄 从传统模式DOM获取模式:', patterns);
        return patterns;
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

        // 新的音序点编辑器事件
        this.setupSequenceEditorEvents();

        // 按钮事件
        const saveBtn = document.getElementById('save-arpeggio');
        const applyBtn = document.getElementById('apply-arpeggio');

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

        // 测试合成器按钮
        const testSynthBtn = document.getElementById('test-arpeggio-synth');
        if (testSynthBtn) {
            testSynthBtn.addEventListener('click', () => {
                this.testArpeggioSynth();
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

        // 统一的按钮事件处理 - 传统模式和圆形模式使用相同逻辑
        this.bindUnifiedDrumButtonEvents();
    }

    // 统一的鼓组按钮事件绑定
    bindUnifiedDrumButtonEvents() {
        // 实时预览按钮 - 支持传统模式和圆形模式
        const realtimeButtons = [
            document.getElementById('realtime-drum'),      // 传统模式
            document.getElementById('realtime-circular')   // 圆形模式
        ];

        realtimeButtons.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    this.toggleRealTimePreview('drum');
                });
            }
        });

        // 重置按钮 - 支持传统模式和圆形模式
        const resetButtons = [
            document.getElementById('reset-drum'),         // 传统模式
            document.getElementById('reset-circular')      // 圆形模式
        ];

        resetButtons.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    this.resetDrumEditor();
                });
            }
        });

        // 应用按钮 - 支持传统模式和圆形模式
        const applyButtons = [
            document.getElementById('apply-drum'),         // 传统模式
            document.getElementById('apply-circular')      // 圆形模式
        ];

        applyButtons.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    this.applyUnifiedDrumChanges();
                });
            }
        });
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
            { id: 'kick', name: 'Rimshot', emoji: '🥁', color: 'drum-kick' },
            { id: 'snare', name: 'Flam', emoji: '🥁', color: 'drum-snare' },
            { id: 'hihat', name: 'Shaker', emoji: '🎶', color: 'drum-hihat' },
            { id: 'clap', name: 'Indian_Percussion', emoji: '🪘', color: 'drum-clap' },
            { id: 'openhat', name: 'Orchestral_Drum', emoji: '🥁', color: 'drum-openhat' }
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
            console.log('✅ 琶音预览合成器已创建');
        } catch (error) {
            console.warn('❌ 无法创建预览合成器:', error);
        }
    }

    // 测试琶音合成器功能 - 使用当前编辑的序列
    testArpeggioSynth() {
        console.log('🎵 开始测试琶音合成器...');

        try {
            // 确保合成器已创建
            if (!this.previewSynth) {
                console.log('🔧 创建预览合成器...');
                this.createSequencePreviewSynth();
            }

            if (!this.previewSynth) {
                throw new Error('无法创建预览合成器');
            }

            // 获取当前编辑的序列数据
            const sequence = this.getSequenceData();
            const rootNote = this.getCurrentRootNote();

            console.log('🎼 当前序列数据:', sequence);
            console.log('🎵 根音:', rootNote);

            // 转换为音符
            const testNotes = [];
            sequence.forEach((interval, index) => {
                if (interval !== null) {
                    try {
                        const rootFreq = Tone.Frequency(rootNote + '4');
                        const targetFreq = rootFreq.transpose(interval);
                        const note = targetFreq.toNote();
                        testNotes.push({ note, step: index + 1, interval });
                    } catch (error) {
                        console.warn(`计算音符失败 (步骤 ${index + 1}, 间隔 ${interval}):`, error);
                    }
                }
            });

            if (testNotes.length === 0) {
                console.warn('⚠️ 没有有效的音符可以测试');
                alert('当前序列没有激活的音符，请先设置一些音序点');
                return;
            }

            console.log('🎼 播放测试音符序列:', testNotes);

            let noteIndex = 0;
            const playNextNote = () => {
                if (noteIndex >= testNotes.length) {
                    console.log('✅ 琶音合成器测试完成');
                    return;
                }

                const { note, step, interval } = testNotes[noteIndex];
                console.log(`🎵 播放步骤 ${step}: ${note} (间隔: ${interval})`);

                try {
                    this.previewSynth.triggerAttackRelease(note, "4n");
                    console.log(`✅ ${note} 播放成功`);
                } catch (error) {
                    console.error(`❌ ${note} 播放失败:`, error);
                }

                noteIndex++;
                setTimeout(playNextNote, 600); // 每个音符间隔600ms
            };

            playNextNote();

        } catch (error) {
            console.error('❌ 琶音合成器测试失败:', error);
            alert('琶音合成器测试失败：' + error.message);
        }
    }

    openArpeggioEditor() {
        console.log('🎵 打开琶音编辑器...');

        try {
            this.currentEditingType = 'arpeggio';

            // 检查游戏和音乐管理器是否已初始化
            if (!window.game || !window.game.musicManager) {
                console.error('❌ 游戏或音乐管理器未初始化');
                alert('琶音编辑器无法打开：游戏未正确初始化。请刷新页面重试。');
                return;
            }

            console.log('🔧 填充琶音预设选项...');
            this.populateArpeggioPresets(); // 填充预设选项

            console.log('📋 加载默认预设...');
            this.loadArpeggioPreset('0'); // 默认加载第一个预设

            const modal = document.getElementById('arpeggio-editor-modal');
            if (modal) {
                modal.style.display = 'block';
                console.log('✅ 琶音编辑器已打开');
            } else {
                console.error('❌ 找不到琶音编辑器模态框');
                alert('琶音编辑器界面未找到，请检查页面是否正确加载。');
            }
        } catch (error) {
            console.error('❌ 打开琶音编辑器时发生错误:', error);
            alert('琶音编辑器打开失败：' + error.message);
        }
    }

    openDrumEditor() {
        this.currentEditingType = 'drum';
        this.populateDrumPresets(); // 填充预设选项
        this.loadDrumPreset('0'); // 默认加载第一个预设

        // 初始化圆形音序器
        this.initCircularSequencerInModal();

        // 初始化鼓组管理
        this.initDrumGroupManagement();

        const modal = document.getElementById('drum-editor-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    closeModal(modal) {
        if (modal) {
            // 如果是鼓组编辑器，保存当前鼓组模式
            if (modal.id === 'drum-editor-modal' && this.drumGroups) {
                this.saveDrumGroupPatterns();
            }

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
        console.log('🎵 加载琶音预设:', presetIndex);

        if (presetIndex === 'custom') {
            console.log('🔧 重置为自定义模式');
            this.resetSequence();
            return;
        }

        // 从MusicManager获取预设
        if (window.game && window.game.musicManager && window.game.musicManager.musicPresets[presetIndex]) {
            const preset = window.game.musicManager.musicPresets[presetIndex];
            console.log('📋 加载的预设数据:', preset);

            // 优先使用sequence字段，如果没有则从chordIntervals生成
            let sequence = null;
            if (preset.sequence && Array.isArray(preset.sequence)) {
                sequence = preset.sequence;
                console.log('🎵 使用预设的sequence:', sequence);
            } else if (preset.chordIntervals && Array.isArray(preset.chordIntervals)) {
                // 从chordIntervals生成简单的序列
                sequence = this.generateSequenceFromIntervals(preset.chordIntervals);
                console.log('🎵 从chordIntervals生成sequence:', sequence);
            } else {
                // 使用默认序列
                sequence = [0, 3, null, 7, 8, null, 7, null];
                console.log('🎵 使用默认sequence:', sequence);
            }

            // 加载序列到编辑器
            this.loadSequenceData(sequence);

            // 更新速度
            const tempo = preset.tempo || 120;
            const tempoSlider = document.getElementById('arpeggio-tempo');
            const tempoValue = document.getElementById('tempo-value');
            if (tempoSlider && tempoValue) {
                tempoSlider.value = tempo;
                tempoValue.textContent = tempo;
                console.log('🎵 设置速度:', tempo);
            }

            console.log('✅ 琶音预设加载完成');
        } else {
            console.error('❌ 无法获取琶音预设:', presetIndex);
            console.log('🔍 可用的预设:', window.game?.musicManager?.musicPresets?.length || 0);
            this.resetSequence();
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
        console.log('🎵 更新和弦间隔输入:', intervals);

        const inputs = document.querySelectorAll('.interval-input');

        // 安全检查：确保intervals是数组
        if (!intervals || !Array.isArray(intervals)) {
            console.warn('⚠️ intervals不是有效数组，使用默认值');
            intervals = [0, 3, 5, 7]; // 默认大七和弦
        }

        // 清空所有输入框
        inputs.forEach(input => {
            input.value = '';
        });

        // 填充新的间隔值
        intervals.forEach((interval, index) => {
            if (inputs[index] && interval !== undefined && interval !== null) {
                inputs[index].value = interval;
                console.log(`✅ 设置间隔 ${index}: ${interval}`);
            }
        });

        console.log('✅ 和弦间隔输入已更新');
    }

    updateDrumSequencer(patterns) {
        // 更新传统模式的按钮
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

        // 更新圆形音序器
        if (this.circularSequencer) {
            this.circularSequencer.setPatterns(patterns);
            console.log('已更新圆形音序器预设:', patterns);
        }
    }

    toggleNote(noteBtn) {
        noteBtn.classList.toggle('active');
        this.updateArpeggioPreview();
    }

    toggleStep(stepBtn) {
        stepBtn.classList.toggle('active');

        // 测试播放这个鼓声 - 添加调试信息
        const drumType = stepBtn.dataset.drum;
        const stepIndex = stepBtn.dataset.step;
        const isActive = stepBtn.classList.contains('active');

        console.log(`🥁 点击步骤: ${drumType}[${stepIndex}], 激活状态: ${isActive}`);

        // 立即播放这个鼓声进行测试（只在激活时播放）
        if (isActive) {
            if (this.previewDrumPlayers && this.previewDrumPlayers.player(drumType)) {
                console.log(`🔊 播放 ${drumType} 音频`);
                this.previewDrumPlayers.player(drumType).start();
            } else {
                console.error(`❌ 无法播放 ${drumType}: 播放器不存在或未加载`);

                // 检查播放器状态
                if (!this.previewDrumPlayers) {
                    console.error('❌ previewDrumPlayers 未初始化');
                    // 尝试创建播放器
                    this.createPreviewDrumPlayers();
                } else if (!this.previewDrumPlayers.player(drumType)) {
                    console.error(`❌ ${drumType} 播放器不存在`);
                    console.log('🔍 可用的播放器:', Object.keys(this.previewDrumPlayers._players || {}));
                }
            }
        }
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
        console.log('🔄 重置鼓组编辑器...', { isCircularMode: this.isCircularMode });

        // 清除传统模式的步骤
        document.querySelectorAll('.step-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // 清除圆形模式的步骤
        if (this.circularSequencer) {
            this.circularSequencer.clearAll();
        }

        console.log('✅ 鼓组编辑器已重置');
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

        // 更新按钮状态 - 优先查找圆形模式按钮
        let button = null;

        // 如果是圆形模式，优先使用圆形按钮
        if (this.isCircularMode) {
            button = document.querySelector('#realtime-circular');
        }

        // 如果没找到圆形按钮，查找传统模式按钮
        if (!button) {
            const buttonSelectors = [
                `#toggle-realtime-${type}`,
                `#preview-${type}`
            ];

            for (const selector of buttonSelectors) {
                button = document.querySelector(selector);
                if (button) break;
            }
        }

        if (button) {
            button.textContent = '⏹️ 停止预览';
            button.classList.add('active');
            console.log(`✅ 实时预览按钮已激活: ${button.id} (圆形模式: ${this.isCircularMode})`);
        } else {
            console.warn('⚠️ 找不到实时预览按钮');
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

        // 重置按钮状态 - 优先处理圆形模式按钮
        let button = null;

        if (this.isCircularMode) {
            button = document.querySelector('#realtime-circular');
            if (button) {
                button.textContent = '🥁 实时预览';
                button.classList.remove('active');
                console.log(`✅ 圆形实时预览按钮已重置: ${button.id}`);
            }
        }

        // 重置传统模式按钮
        const buttonSelectors = [
            '#toggle-realtime-arpeggio',
            '#toggle-realtime-drum'
        ];

        buttonSelectors.forEach(selector => {
            const btn = document.querySelector(selector);
            if (btn) {
                if (selector.includes('arpeggio')) {
                    btn.textContent = '🎵 实时预览';
                } else {
                    btn.textContent = '🥁 实时预览';
                }
                btn.classList.remove('active');
                console.log(`✅ 传统实时预览按钮已重置: ${btn.id}`);
            }
        });

        // 清除视觉反馈
        this.clearPreviewHighlights();

        // 重置圆形编辑器的播放指针
        if (this.circularSequencer && this.isCircularMode) {
            this.circularSequencer.setPlayPosition(-1);
        }
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
        const drumSounds = ['kick', 'snare', 'hihat', 'clap', 'openhat'];

        // 验证模式数据
        console.log('🎵 开始实时鼓组预览，当前模式:', patterns);

        // 检查是否有有效的模式数据
        const hasValidPatterns = Object.keys(patterns).length > 0 &&
            drumSounds.some(drum => patterns[drum] && patterns[drum].some(step => step === true));

        if (!hasValidPatterns) {
            console.warn('⚠️ 没有有效的鼓组模式数据，使用默认模式');
            // 使用默认模式
            const defaultPatterns = this.getDefaultDrumPatterns();
            Object.assign(patterns, defaultPatterns);
        }

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

            // 更新圆形编辑器的播放指针
            if (this.circularSequencer && this.isCircularMode) {
                this.circularSequencer.setPlayPosition(stepIndex);
            }

            stepIndex = (stepIndex + 1) % 16;
        }, sixteenthNoteInterval);
    }

    createPreviewDrumPlayers() {
        // 创建与DrumManager相同的鼓声播放器
        this.previewDrumPlayers = new Tone.Players({
            urls: {
                // 与 DrumManager.js 保持一致的民族打击乐采样映射
                kick: 'assets/Rimshot.wav',
                snare: 'assets/Flam.wav',
                hihat: 'assets/Shaker.wav',
                clap: 'assets/Indian_Percussion.wav',
                openhat: 'assets/Orchestral_Drum.wav'
            },
            onload: () => {
                try {
                    // 检查每个音频是否加载成功
                    const drums = ['kick', 'snare', 'hihat', 'clap', 'openhat'];
                    drums.forEach(drum => {
                        const player = this.previewDrumPlayers.player(drum);
                        if (player && player.loaded) {
                            console.log(`✅ ${drum} 音频加载成功`);
                        } else {
                            console.error(`❌ ${drum} 音频加载失败`);
                        }
                    });

                    // 设置与原版相同的音量
                    // 重新平衡民族打击乐的默认音量（可按需再调）
                    this.previewDrumPlayers.player('kick').volume.value = -6;
                    this.previewDrumPlayers.player('snare').volume.value = -3;
                    this.previewDrumPlayers.player('hihat').volume.value = -5;
                    this.previewDrumPlayers.player('clap').volume.value = -10;
                    this.previewDrumPlayers.player('openhat').volume.value = -6;
                    this.drumPlayersLoaded = true;
                    console.log("🔊 预览鼓声样本加载完成，包括OpenHat");
                } catch (error) {
                    console.error("设置鼓声音量失败:", error);
                }
            },
            onerror: (error) => {
                console.error("预览鼓声样本加载失败:", error);
                this.drumPlayersLoaded = false;
            }
        }).toDestination();

        this.drumPlayersLoaded = false;
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
        console.log('🔧 填充琶音预设选项...');

        const select = document.getElementById('arpeggio-base-preset');
        if (!select) {
            console.error('❌ 找不到琶音预设选择器');
            return;
        }

        // 清空现有选项
        select.innerHTML = '';

        // 获取音乐预设
        if (window.game && window.game.musicManager && window.game.musicManager.musicPresets) {
            const presets = window.game.musicManager.musicPresets;
            console.log(`📋 找到 ${presets.length} 个音乐预设:`, presets.map(p => p.name));

            presets.forEach((preset, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = preset.name;
                select.appendChild(option);
                console.log(`✅ 添加预设选项 ${index}: ${preset.name}`);
            });
        } else {
            console.error('❌ 无法获取音乐预设');
            console.log('🔍 检查状态:', {
                game: !!window.game,
                musicManager: !!window.game?.musicManager,
                musicPresets: !!window.game?.musicManager?.musicPresets
            });
        }

        // 添加自定义选项
        const customOption = document.createElement('option');
        customOption.value = 'custom';
        customOption.textContent = '🎨 自定义';
        select.appendChild(customOption);
        console.log('✅ 添加自定义选项');

        console.log('✅ 琶音预设选项填充完成');
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

                // 更新圆形编辑器的播放指针
                if (this.circularSequencer && this.isCircularMode) {
                    this.circularSequencer.setPlayPosition(stepIndex);
                }

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

        // 重置圆形编辑器的播放指针
        if (this.circularSequencer && this.isCircularMode) {
            this.circularSequencer.setPlayPosition(-1);
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
        // 如果是圆形模式，从圆形音序器获取数据
        if (this.isCircularMode && this.circularSequencer) {
            const patterns = this.circularSequencer.getPatterns();
            console.log('🔄 从圆形音序器获取模式:', patterns);

            // 验证数据完整性
            const drums = ['kick', 'snare', 'hihat', 'clap', 'openhat'];
            drums.forEach(drum => {
                if (!patterns[drum] || !Array.isArray(patterns[drum])) {
                    patterns[drum] = new Array(16).fill(false);
                    console.warn(`⚠️ 修复缺失的鼓声模式: ${drum}`);
                }
            });

            return patterns;
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

        console.log('🔄 从传统模式获取模式:', patterns);
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





    // 统一的应用方法 - 传统模式和圆形模式都使用这个
    applyUnifiedDrumChanges() {
        console.log('🔄 应用鼓组变更...', {
            isCircularMode: this.isCircularMode,
            currentGroupId: this.currentDrumGroupId
        });

        // 获取当前模式的鼓组数据
        const patterns = this.getDrumPatterns();

        // 检查是否有有效的模式数据
        const hasActiveSteps = Object.values(patterns).some(pattern =>
            pattern.some(step => step === true)
        );

        if (!hasActiveSteps) {
            alert('请至少激活一个鼓点！');
            return;
        }

        // 保存到当前鼓组
        this.saveDrumGroupPatterns();

        // 如果当前鼓组是自定义鼓组，保存到本地存储
        const currentGroup = this.drumGroups.find(g => g.id === this.currentDrumGroupId);
        if (currentGroup && currentGroup.type === 'custom') {
            this.saveCustomDrumGroupsToStorage();
            console.log(`✅ 自定义鼓组 "${currentGroup.name}" 已保存`);
        }

        // 同步两种模式的数据
        if (this.isCircularMode) {
            // 圆形模式 -> 传统模式
            this.syncPatternsFromCircular();
        } else {
            // 传统模式 -> 圆形模式
            this.syncPatternsToCircular();
        }

        // 显示成功消息
        alert(`鼓组 "${currentGroup?.name || '未知'}" 的编辑已保存！`);

        console.log('✅ 统一鼓组变更已应用', {
            mode: this.isCircularMode ? '圆形' : '传统',
            groupId: this.currentDrumGroupId,
            groupName: currentGroup?.name,
            patterns: patterns
        });
    }

    // 保存自定义鼓组到本地存储
    saveCustomDrumGroupsToStorage() {
        try {
            const customGroups = this.drumGroups.filter(group => group.type === 'custom');
            localStorage.setItem('customDrumGroups', JSON.stringify(customGroups));
            console.log('✅ 自定义鼓组已保存到本地存储', customGroups);
        } catch (error) {
            console.error('❌ 保存自定义鼓组失败:', error);
        }
    }

    // 从本地存储加载自定义鼓组
    loadCustomDrumGroupsFromStorage() {
        try {
            const saved = localStorage.getItem('customDrumGroups');
            if (saved) {
                const customGroups = JSON.parse(saved);
                console.log('✅ 从本地存储加载自定义鼓组', customGroups);
                return customGroups;
            }
        } catch (error) {
            console.error('❌ 加载自定义鼓组失败:', error);
        }
        return [];
    }

    // ===== 鼓组管理功能 =====
    initDrumGroupManagement() {
        // 初始化鼓组数据，整合预设和自定义鼓组
        if (!this.drumGroups) {
            this.drumGroups = [];

            // 添加基础预设
            const drumPresets = window.drumManager?.getAllDrumPresets() || [];
            drumPresets.forEach((preset, index) => {
                this.drumGroups.push({
                    id: `preset_${index}`,
                    name: preset.name,
                    type: 'preset',
                    patterns: preset.patterns || this.getEmptyDrumPatterns(),
                    bpm: preset.bpm || 120
                });
            });

            // 加载保存的自定义鼓组
            const savedCustomGroups = this.loadCustomDrumGroupsFromStorage();
            if (savedCustomGroups.length > 0) {
                this.drumGroups.push(...savedCustomGroups);
            } else {
                // 如果没有保存的鼓组，添加默认自定义鼓组
                this.drumGroups.push(
                    { id: 'custom_default', name: '我的鼓组 1', type: 'custom', patterns: this.getDefaultDrumPatterns() }
                );
            }
        }

        this.currentDrumGroupId = this.drumGroups[0]?.id || 'custom_default';
        this.updateDrumGroupList();
        this.setupDrumGroupEvents();
        this.updatePositionButtons();
    }

    getDefaultDrumPatterns() {
        return {
            kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
            snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
            hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
            clap: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
            openhat: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
        };
    }

    getEmptyDrumPatterns() {
        return {
            kick: new Array(16).fill(false),
            snare: new Array(16).fill(false),
            hihat: new Array(16).fill(false),
            clap: new Array(16).fill(false),
            openhat: new Array(16).fill(false)
        };
    }

    updateDrumGroupList() {
        const container = document.querySelector('.group-list-container');
        if (!container) return;

        container.innerHTML = '';

        this.drumGroups.forEach(group => {
            const groupItem = document.createElement('div');
            groupItem.className = `group-item ${group.type || 'custom'}`;
            if (group.id === this.currentDrumGroupId) {
                groupItem.classList.add('active');
            }

            groupItem.innerHTML = `
                <span class="group-name">${group.name}</span>
                <span class="group-type">${group.type === 'preset' ? '预设' : '自定义'}</span>
            `;

            groupItem.addEventListener('click', () => {
                this.switchDrumGroup(group.id);
            });

            container.appendChild(groupItem);
        });
    }

    setupDrumGroupEvents() {
        // 管理按钮事件
        const addBtn = document.getElementById('add-drum-group');
        const renameBtn = document.getElementById('rename-drum-group');
        const deleteBtn = document.getElementById('delete-drum-group');
        const duplicateBtn = document.getElementById('duplicate-drum-group');
        const moveUpBtn = document.getElementById('move-up-drum-group');
        const moveDownBtn = document.getElementById('move-down-drum-group');

        if (addBtn) {
            addBtn.addEventListener('click', () => this.addDrumGroup());
        }

        if (renameBtn) {
            renameBtn.addEventListener('click', () => this.renameDrumGroup());
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteDrumGroup());
        }

        if (duplicateBtn) {
            duplicateBtn.addEventListener('click', () => this.duplicateDrumGroup());
        }

        if (moveUpBtn) {
            moveUpBtn.addEventListener('click', () => this.moveDrumGroupUp());
        }

        if (moveDownBtn) {
            moveDownBtn.addEventListener('click', () => this.moveDrumGroupDown());
        }
    }

    switchDrumGroup(groupId) {
        // 保存当前鼓组的模式
        this.saveDrumGroupPatterns();

        // 切换到新鼓组
        this.currentDrumGroupId = groupId;
        const group = this.drumGroups.find(g => g.id === groupId);

        if (group) {
            // 确保模式数据完整
            if (!group.patterns) {
                group.patterns = this.getEmptyDrumPatterns();
                console.log(`🔧 为鼓组 ${group.name} 创建空模式`);
            }

            // 验证每个鼓声的数据完整性
            const drums = ['kick', 'snare', 'hihat', 'clap', 'openhat'];
            drums.forEach(drum => {
                if (!group.patterns[drum] || !Array.isArray(group.patterns[drum]) || group.patterns[drum].length !== 16) {
                    group.patterns[drum] = new Array(16).fill(false);
                    console.warn(`⚠️ 修复鼓组 ${group.name} 的 ${drum} 数据`);
                }
            });

            this.loadDrumGroupPatterns(group.patterns);
            this.updateDrumGroupList(); // 更新列表显示
            this.updatePositionButtons(); // 更新位置按钮状态

            // 强制同步到圆形音序器
            if (this.circularSequencer) {
                this.circularSequencer.setPatterns(group.patterns);
                console.log(`🔄 已同步鼓组 ${group.name} 到圆形音序器`);
            }

            console.log(`✅ 切换到鼓组: ${group.name} (${group.type})`, group.patterns);
        } else {
            console.error(`❌ 找不到鼓组: ${groupId}`);
        }
    }

    saveDrumGroupPatterns() {
        const currentGroup = this.drumGroups.find(g => g.id === this.currentDrumGroupId);
        if (currentGroup) {
            currentGroup.patterns = this.getDrumPatterns();
        }
    }

    loadDrumGroupPatterns(patterns) {
        // 更新传统模式的按钮状态
        Object.keys(patterns).forEach(drumType => {
            patterns[drumType].forEach((active, stepIndex) => {
                const stepBtn = document.querySelector(`.step-btn[data-drum="${drumType}"][data-step="${stepIndex}"]`);
                if (stepBtn) {
                    if (active) {
                        stepBtn.classList.add('active');
                    } else {
                        stepBtn.classList.remove('active');
                    }
                }
            });
        });

        // 更新圆形模式
        if (this.circularSequencer) {
            this.circularSequencer.setPatterns(patterns);
        }
    }

    addDrumGroup() {
        const name = prompt('请输入新鼓组名称:');
        if (!name || name.trim() === '') return;

        const newId = 'custom_' + Date.now();
        const newGroup = {
            id: newId,
            name: name.trim(),
            type: 'custom',
            patterns: this.getDefaultDrumPatterns() // 使用默认模式而不是空模式，这样新鼓组有基础节拍
        };

        this.drumGroups.push(newGroup);

        // 立即更新列表显示
        this.updateDrumGroupList();

        // 切换到新鼓组
        this.switchDrumGroup(newId);

        // 保存到本地存储
        this.saveCustomDrumGroupsToStorage();

        console.log(`✅ 添加新鼓组: ${name}`, newGroup.patterns);
    }

    renameDrumGroup() {
        const currentGroup = this.drumGroups.find(g => g.id === this.currentDrumGroupId);
        if (!currentGroup) return;

        if (currentGroup.type === 'preset') {
            alert('预设鼓组不能重命名！请复制后重命名。');
            return;
        }

        const newName = prompt('请输入新名称:', currentGroup.name);
        if (!newName || newName.trim() === '') return;

        currentGroup.name = newName.trim();
        this.updateDrumGroupList();

        // 保存到本地存储
        this.saveCustomDrumGroupsToStorage();

        console.log(`重命名鼓组为: ${newName}`);
    }

    deleteDrumGroup() {
        const currentGroup = this.drumGroups.find(g => g.id === this.currentDrumGroupId);
        if (!currentGroup) return;

        if (currentGroup.type === 'preset') {
            alert('预设鼓组不能删除！');
            return;
        }

        const customGroups = this.drumGroups.filter(g => g.type === 'custom');
        if (customGroups.length <= 1) {
            alert('至少需要保留一个自定义鼓组！');
            return;
        }

        if (!confirm(`确定要删除鼓组 "${currentGroup.name}" 吗？`)) return;

        // 删除当前鼓组
        this.drumGroups = this.drumGroups.filter(g => g.id !== this.currentDrumGroupId);

        // 切换到第一个鼓组
        this.currentDrumGroupId = this.drumGroups[0].id;
        this.switchDrumGroup(this.currentDrumGroupId);

        // 保存到本地存储
        this.saveCustomDrumGroupsToStorage();

        console.log(`删除鼓组: ${currentGroup.name}`);
    }

    duplicateDrumGroup() {
        const currentGroup = this.drumGroups.find(g => g.id === this.currentDrumGroupId);
        if (!currentGroup) return;

        const newName = prompt('请输入复制鼓组的名称:', currentGroup.name + ' 副本');
        if (!newName || newName.trim() === '') return;

        // 保存当前模式
        this.saveDrumGroupPatterns();

        const newId = 'custom_' + Date.now();
        const newGroup = {
            id: newId,
            name: newName.trim(),
            type: 'custom', // 复制的都是自定义鼓组
            patterns: JSON.parse(JSON.stringify(currentGroup.patterns)) // 深拷贝
        };

        this.drumGroups.push(newGroup);
        this.switchDrumGroup(newId);

        // 保存到本地存储
        this.saveCustomDrumGroupsToStorage();

        console.log(`复制鼓组: ${newName}`);
    }

    // 新增：位置调整方法
    moveDrumGroupUp() {
        const currentIndex = this.drumGroups.findIndex(g => g.id === this.currentDrumGroupId);
        if (currentIndex <= 0) return;

        // 交换位置
        [this.drumGroups[currentIndex], this.drumGroups[currentIndex - 1]] =
        [this.drumGroups[currentIndex - 1], this.drumGroups[currentIndex]];

        this.updateDrumGroupList();
        this.updatePositionButtons();
    }

    moveDrumGroupDown() {
        const currentIndex = this.drumGroups.findIndex(g => g.id === this.currentDrumGroupId);
        if (currentIndex >= this.drumGroups.length - 1) return;

        // 交换位置
        [this.drumGroups[currentIndex], this.drumGroups[currentIndex + 1]] =
        [this.drumGroups[currentIndex + 1], this.drumGroups[currentIndex]];

        this.updateDrumGroupList();
        this.updatePositionButtons();
    }

    updatePositionButtons() {
        const currentIndex = this.drumGroups.findIndex(g => g.id === this.currentDrumGroupId);
        const moveUpBtn = document.getElementById('move-up-drum-group');
        const moveDownBtn = document.getElementById('move-down-drum-group');

        if (moveUpBtn) {
            moveUpBtn.disabled = currentIndex <= 0;
        }

        if (moveDownBtn) {
            moveDownBtn.disabled = currentIndex >= this.drumGroups.length - 1;
        }
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

// 测试所有鼓声音频
window.testAllDrumSounds = function() {
    if (!window.customEditor) {
        console.error('❌ CustomEditor 未初始化');
        return;
    }

    console.log('🔊 开始测试所有鼓声音频...');

    // 确保预览播放器已创建
    if (!window.customEditor.previewDrumPlayers) {
        console.log('🔧 创建预览播放器...');
        window.customEditor.createPreviewDrumPlayers();

        // 等待播放器加载
        setTimeout(() => {
            testDrumSoundsSequence();
        }, 1000);
    } else {
        testDrumSoundsSequence();
    }

    function testDrumSoundsSequence() {
        const drums = ['kick', 'snare', 'hihat', 'clap', 'openhat'];
        let index = 0;

        function playNext() {
            if (index >= drums.length) {
                console.log('✅ 所有鼓声测试完成');
                return;
            }

            const drum = drums[index];
            console.log(`🥁 测试 ${drum}...`);

            if (window.customEditor.previewDrumPlayers && window.customEditor.previewDrumPlayers.player(drum)) {
                window.customEditor.previewDrumPlayers.player(drum).start();
                console.log(`✅ ${drum} 播放成功`);
            } else {
                console.error(`❌ ${drum} 播放失败`);
            }

            index++;
            setTimeout(playNext, 800); // 每个鼓声间隔800ms
        }

        playNext();
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
            { id: 'kick', name: 'Rimshot', color: '#D72828', emoji: '🥁' },
            { id: 'snare', name: 'Flam', color: '#F36E2F', emoji: '🥁' },
            { id: 'hihat', name: 'Shaker', color: '#84C34E', emoji: '🎶' },
            { id: 'clap', name: 'Indian_Percussion', color: '#7B4394', emoji: '🪘' },
            { id: 'openhat', name: 'Orchestral_Drum', color: '#4A90E2', emoji: '🥁' }
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

        // 设置canvas的实际尺寸 - 简化版本
        const canvasWidth = this.config.centerX * 2;
        const canvasHeight = this.config.centerY * 2;

        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;

        // 设置CSS尺寸
        this.canvas.style.width = canvasWidth + 'px';
        this.canvas.style.height = canvasHeight + 'px';
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
        // 鼠标事件 - 移除click事件，避免与mousedown冲突
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));

        // 触摸事件（移动设备支持）
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // 防止默认的滚动行为
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.handleMouseDown(mouseEvent);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.handleMouseMove(mouseEvent);
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleMouseUp(e);
        }, { passive: false });

        this.canvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.handleMouseUp(e);
        }, { passive: false });
    }

    // 获取鼠标在canvas中的坐标 - 简化版本
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
        this.isDragging = false; // 重置拖动状态
        this.mouseDownPos = this.getMousePos(e); // 记录按下位置
        this.mouseDownTime = Date.now(); // 记录按下时间

        // 立即处理点击
        this.handleClick(e);
    }

    handleMouseMove(e) {
        if (!this.mouseDownPos) return;

        const currentPos = this.getMousePos(e);
        const distance = Math.sqrt(
            Math.pow(currentPos.x - this.mouseDownPos.x, 2) +
            Math.pow(currentPos.y - this.mouseDownPos.y, 2)
        );

        // 如果移动距离超过5像素，认为是拖动
        if (distance > 5) {
            this.isDragging = true;
            this.handleClick(e); // 拖动时也处理点击
        }
    }

    handleMouseUp(e) {
        this.isDragging = false;
        this.mouseDownPos = null;
        this.mouseDownTime = null;
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

                // 设置颜色 - 增强对比度
                let color = drumType.color;
                let alpha = isActive ? 1.0 : 0.15;  // 激活状态更亮，非激活状态更暗

                if (isCurrentPlay) {
                    alpha = Math.min(alpha + 0.2, 1.0);
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

                // 如果是激活状态，添加发光效果和边框
                if (isActive) {
                    // 发光效果
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 12;
                    ctx.fill();
                    ctx.shadowBlur = 0;

                    // 亮边框
                    ctx.strokeStyle = this.hexToRgba('#ffffff', 0.8);
                    ctx.lineWidth = 2;
                    ctx.stroke();
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

// ===== 音序点编辑器相关方法 =====
// 在CustomEditor类中添加以下方法

// 在CustomEditor类的原型上添加音序点编辑器方法
CustomEditor.prototype.setupSequenceEditorEvents = function() {
    console.log('🎵 设置音序点编辑器事件...');

    // 根音切换按钮
    const rootNoteBtn = document.getElementById('root-note-selector');
    if (rootNoteBtn) {
        rootNoteBtn.addEventListener('click', () => {
            this.cycleRootNote();
        });
    }

    // 预览按钮
    const previewBtn = document.getElementById('preview-sequence');
    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            console.log('🎵 预览按钮被点击');
            this.previewCurrentSequence();
        });
    } else {
        console.warn('⚠️ 预览按钮未找到');
    }

    // 随机按钮
    const randomBtn = document.getElementById('randomize-sequence');
    if (randomBtn) {
        randomBtn.addEventListener('click', () => {
            this.randomizeSequence();
        });
    }

    // 重置按钮
    const resetBtn = document.getElementById('reset-sequence');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            this.resetSequence();
        });
    }

    // 音序点事件
    this.setupSequenceStepEvents();

    console.log('✅ 音序点编辑器事件设置完成');
};

CustomEditor.prototype.setupSequenceStepEvents = function() {
    console.log('🎵 设置音序点事件...');

    // 尝试新的增强可视化器结构
    let sequenceElements = document.querySelectorAll('.sequence-column');
    let isEnhancedMode = sequenceElements.length > 0;

    // 如果没找到增强模式，使用传统模式
    if (!isEnhancedMode) {
        sequenceElements = document.querySelectorAll('.sequence-step');
        console.log('📋 使用传统音序点模式');
    } else {
        console.log('🎨 使用增强可视化器模式');
    }

    sequenceElements.forEach((stepElement, stepIndex) => {
        let stepControl;

        if (isEnhancedMode) {
            stepControl = stepElement.querySelector('.step-handle');
        } else {
            stepControl = stepElement.querySelector('.step-point');
        }

        if (!stepControl) {
            console.warn(`⚠️ 未找到步骤 ${stepIndex + 1} 的控制元素`);
            return;
        }

        // 点击切换激活状态
        stepControl.addEventListener('click', () => {
            this.toggleSequenceStep(stepIndex);
        });

        // 拖拽调整音程
        this.setupStepDragEvents(stepControl, stepIndex, isEnhancedMode);
    });

    console.log(`✅ 已设置 ${sequenceElements.length} 个音序点事件`);
};

CustomEditor.prototype.setupStepDragEvents = function(stepControl, stepIndex, isEnhancedMode = false) {
    let isDragging = false;
    let startY = 0;
    let startInterval = 0;

    // 鼠标事件
    stepControl.addEventListener('mousedown', (e) => {
        if (!stepControl.classList.contains('active')) return;

        isDragging = true;
        startY = e.clientY;
        startInterval = this.getStepInterval(stepIndex);
        stepControl.classList.add('dragging');

        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const deltaY = startY - e.clientY; // 向上为正
        let sensitivity = isEnhancedMode ? 2 : 3; // 增强模式更敏感
        const newInterval = Math.max(-12, Math.min(24,
            startInterval + Math.round(deltaY / sensitivity)));

        this.updateStepInterval(stepIndex, newInterval, isEnhancedMode);
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            stepControl.classList.remove('dragging');
        }
    });

    // 触摸事件（移动端支持）
    stepControl.addEventListener('touchstart', (e) => {
        if (!stepControl.classList.contains('active')) return;

        isDragging = true;
        startY = e.touches[0].clientY;
        startInterval = this.getStepInterval(stepIndex);
        stepControl.classList.add('dragging');

        e.preventDefault();
    });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;

        const deltaY = startY - e.touches[0].clientY;
        let sensitivity = isEnhancedMode ? 2 : 3;
        const newInterval = Math.max(-12, Math.min(24,
            startInterval + Math.round(deltaY / sensitivity)));

        this.updateStepInterval(stepIndex, newInterval, isEnhancedMode);
        e.preventDefault();
    });

    document.addEventListener('touchend', () => {
        if (isDragging) {
            isDragging = false;
            stepControl.classList.remove('dragging');
        }
    });
};

CustomEditor.prototype.toggleSequenceStep = function(stepIndex) {
    // 尝试增强可视化器结构
    let stepElement = document.querySelector(`.sequence-column[data-step="${stepIndex}"]`);
    let stepControl = stepElement?.querySelector('.step-handle');
    let isEnhancedMode = true;

    // 如果没找到，尝试传统结构
    if (!stepControl) {
        stepElement = document.querySelector(`.sequence-step[data-step="${stepIndex}"]`);
        stepControl = stepElement?.querySelector('.step-point');
        isEnhancedMode = false;
    }

    if (!stepControl) {
        console.warn(`⚠️ 未找到步骤 ${stepIndex + 1} 的控制元素`);
        return;
    }

    const isActive = stepControl.classList.contains('active');

    if (isActive) {
        // 切换为非激活状态
        stepControl.classList.remove('active');
        stepControl.classList.add('inactive');
        stepControl.dataset.interval = 'null';

        if (isEnhancedMode) {
            stepControl.querySelector('.interval-display').textContent = '--';
        } else {
            stepControl.querySelector('.interval-value').textContent = '--';
        }
    } else {
        // 切换为激活状态，使用默认间隔0
        stepControl.classList.remove('inactive');
        stepControl.classList.add('active');
        stepControl.dataset.interval = '0';

        if (isEnhancedMode) {
            stepControl.querySelector('.interval-display').textContent = '0';
        } else {
            stepControl.querySelector('.interval-value').textContent = '0';
        }
    }

    // 实时预览单个音符
    if (stepControl.classList.contains('active')) {
        this.previewStepNote(stepIndex);
    }

    console.log(`🎵 步骤 ${stepIndex + 1} ${isActive ? '关闭' : '激活'}`);
};

CustomEditor.prototype.getStepInterval = function(stepIndex) {
    // 尝试增强可视化器结构
    let stepElement = document.querySelector(`.sequence-column[data-step="${stepIndex}"]`);
    let stepControl = stepElement?.querySelector('.step-handle');

    // 如果没找到，尝试传统结构
    if (!stepControl) {
        stepElement = document.querySelector(`.sequence-step[data-step="${stepIndex}"]`);
        stepControl = stepElement?.querySelector('.step-point');
    }

    if (!stepControl) return 0;

    const interval = stepControl.dataset.interval;
    return interval === 'null' ? 0 : parseInt(interval) || 0;
};

CustomEditor.prototype.updateStepInterval = function(stepIndex, newInterval, isEnhancedMode = false) {
    // 尝试增强可视化器结构
    let stepElement = document.querySelector(`.sequence-column[data-step="${stepIndex}"]`);
    let stepControl = stepElement?.querySelector('.step-handle');

    // 如果没找到，尝试传统结构
    if (!stepControl) {
        stepElement = document.querySelector(`.sequence-step[data-step="${stepIndex}"]`);
        stepControl = stepElement?.querySelector('.step-point');
        isEnhancedMode = false;
    }

    if (!stepControl || !stepControl.classList.contains('active')) return;

    // 更新数据和显示
    stepControl.dataset.interval = newInterval.toString();

    // 选择正确的显示元素
    const displayElement = isEnhancedMode ?
        stepControl.querySelector('.interval-display') :
        stepControl.querySelector('.interval-value');

    if (displayElement) {
        if (newInterval === 0) {
            displayElement.textContent = '0';
        } else if (newInterval > 0) {
            displayElement.textContent = '+' + newInterval;
        } else {
            displayElement.textContent = newInterval.toString();
        }
    }

    // 增强模式下更新位置
    if (isEnhancedMode && stepControl) {
        const percentage = ((newInterval + 12) / 36) * 100; // -12到+24映射到0-100%
        stepControl.style.bottom = percentage + '%';
    }

    // 实时预览音符
    this.previewStepNote(stepIndex);
};

CustomEditor.prototype.previewStepNote = function(stepIndex) {
    if (!this.previewSynth) return;

    const interval = this.getStepInterval(stepIndex);
    const rootNote = this.getCurrentRootNote();

    try {
        // 计算目标音符
        const rootFreq = Tone.Frequency(rootNote + '4');
        const targetFreq = rootFreq.transpose(interval);
        const targetNote = targetFreq.toNote();

        // 播放音符
        this.previewSynth.triggerAttackRelease(targetNote, '8n');
        console.log(`🎵 预览音符: ${targetNote} (根音: ${rootNote}, 间隔: ${interval})`);
    } catch (error) {
        console.warn('预览音符失败:', error);
    }
};

CustomEditor.prototype.getCurrentRootNote = function() {
    const rootNoteBtn = document.getElementById('root-note-selector');
    if (!rootNoteBtn) return 'C';

    const text = rootNoteBtn.textContent;
    const match = text.match(/根音:\s*([A-G][#b]?)/);
    return match ? match[1] : 'C';
};

CustomEditor.prototype.cycleRootNote = function() {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const currentNote = this.getCurrentRootNote();
    const currentIndex = notes.indexOf(currentNote);
    const nextIndex = (currentIndex + 1) % notes.length;
    const nextNote = notes[nextIndex];

    const rootNoteBtn = document.getElementById('root-note-selector');
    if (rootNoteBtn) {
        rootNoteBtn.textContent = `根音: ${nextNote}4`;
    }

    console.log(`🎵 根音切换: ${currentNote} → ${nextNote}`);
};

CustomEditor.prototype.previewCurrentSequence = function() {
    console.log('🎵 预览完整序列...');

    try {
        // 确保合成器存在
        if (!this.previewSynth) {
            console.log('🔧 创建预览合成器...');
            this.createSequencePreviewSynth();
        }

        if (!this.previewSynth) {
            throw new Error('无法创建预览合成器');
        }

        const sequence = this.getSequenceData();
        const rootNote = this.getCurrentRootNote();
        const tempo = document.getElementById('arpeggio-tempo')?.value || 120;

        console.log('📊 序列数据:', sequence);
        console.log('🎵 根音:', rootNote);
        console.log('⏱️ 速度:', tempo);

        // 检查是否有有效音符
        const hasActiveNotes = sequence.some(interval => interval !== null);
        if (!hasActiveNotes) {
            console.warn('⚠️ 序列中没有激活的音符');
            alert('当前序列没有激活的音符，请先设置一些音序点');
            return;
        }

        // 过滤出有效的音符
        const validNotes = sequence.map((interval, index) => {
            if (interval === null) return null;

            try {
                const rootFreq = Tone.Frequency(rootNote + '4');
                const targetFreq = rootFreq.transpose(interval);
                return targetFreq.toNote();
            } catch (error) {
                console.warn(`计算音符失败 (步骤 ${index + 1}, 间隔 ${interval}):`, error);
                return null;
            }
        });

        console.log('🎼 序列音符:', validNotes);

        // 播放序列
        let stepIndex = 0;
        const stepInterval = (60 / tempo / 4) * 1000; // 16分音符间隔

        const playStep = () => {
            if (stepIndex >= sequence.length) {
                console.log('✅ 序列预览完成');
                return;
            }

            const note = validNotes[stepIndex];
            if (note) {
                try {
                    this.previewSynth.triggerAttackRelease(note, '8n');
                    console.log(`🎵 播放步骤 ${stepIndex + 1}: ${note}`);
                } catch (error) {
                    console.error(`❌ 播放音符失败 (步骤 ${stepIndex + 1}):`, error);
                }
            } else {
                console.log(`⏸️ 步骤 ${stepIndex + 1}: 静音`);
            }

            stepIndex++;
            setTimeout(playStep, stepInterval);
        };

        playStep();

    } catch (error) {
        console.error('❌ 序列预览失败:', error);
        alert('序列预览失败: ' + error.message);
    }
};

CustomEditor.prototype.randomizeSequence = function() {
    console.log('🎲 随机生成序列...');

    const commonIntervals = [0, 2, 3, 5, 7, 8, 10, 12]; // 常用音程

    // 生成随机序列数组
    const randomSequence = [];
    for (let i = 0; i < 8; i++) {
        // 70%概率激活，30%概率为空拍
        if (Math.random() > 0.3) {
            // 随机选择音程
            const randomInterval = commonIntervals[Math.floor(Math.random() * commonIntervals.length)];
            randomSequence.push(randomInterval);
        } else {
            randomSequence.push(null);
        }
    }

    // 使用loadSequenceData方法加载，这样可以自动支持增强可视化器
    this.loadSequenceData(randomSequence);

    console.log('✅ 随机序列生成完成');
};

CustomEditor.prototype.resetSequence = function() {
    console.log('🔄 重置序列...');

    // 默认序列：[0, 3, null, 7, 8, null, 7, null]
    const defaultSequence = [0, 3, null, 7, 8, null, 7, null];

    // 使用loadSequenceData方法加载，这样可以自动支持增强可视化器
    this.loadSequenceData(defaultSequence);

    console.log('✅ 序列已重置为默认值');
};

CustomEditor.prototype.getSequenceData = function() {
    const sequence = [];

    for (let i = 0; i < 8; i++) {
        // 尝试增强可视化器结构
        let stepElement = document.querySelector(`.sequence-column[data-step="${i}"]`);
        let stepControl = stepElement?.querySelector('.step-handle');

        // 如果没找到，尝试传统结构
        if (!stepControl) {
            stepElement = document.querySelector(`.sequence-step[data-step="${i}"]`);
            stepControl = stepElement?.querySelector('.step-point');
        }

        if (!stepControl) {
            sequence.push(null);
            continue;
        }

        if (stepControl.classList.contains('active')) {
            const interval = stepControl.dataset.interval;
            sequence.push(interval === 'null' ? null : parseInt(interval) || 0);
        } else {
            sequence.push(null);
        }
    }

    console.log('📊 当前序列数据:', sequence);
    return sequence;
};

CustomEditor.prototype.loadSequenceData = function(sequenceArray) {
    console.log('📋 加载序列数据:', sequenceArray);

    if (!sequenceArray || !Array.isArray(sequenceArray)) {
        console.warn('⚠️ 无效的序列数据，使用默认序列');
        sequenceArray = [0, 3, null, 7, 8, null, 7, null];
    }

    // 确保有8个步骤
    while (sequenceArray.length < 8) {
        sequenceArray.push(null);
    }

    for (let i = 0; i < 8; i++) {
        // 尝试增强可视化器结构
        let stepElement = document.querySelector(`.sequence-column[data-step="${i}"]`);
        let stepControl = stepElement?.querySelector('.step-handle');
        let isEnhancedMode = true;

        // 如果没找到，尝试传统结构
        if (!stepControl) {
            stepElement = document.querySelector(`.sequence-step[data-step="${i}"]`);
            stepControl = stepElement?.querySelector('.step-point');
            isEnhancedMode = false;
        }

        if (!stepControl) {
            console.warn(`⚠️ 未找到步骤 ${i + 1} 的控制元素`);
            continue;
        }

        const interval = sequenceArray[i];

        if (interval === null || interval === undefined) {
            stepControl.classList.remove('active');
            stepControl.classList.add('inactive');
            stepControl.dataset.interval = 'null';

            const displayElement = isEnhancedMode ?
                stepControl.querySelector('.interval-display') :
                stepControl.querySelector('.interval-value');

            if (displayElement) {
                displayElement.textContent = '--';
            }

            // 增强模式下重置位置
            if (isEnhancedMode) {
                stepControl.style.bottom = '50%'; // 中间位置
            }
        } else {
            stepControl.classList.remove('inactive');
            stepControl.classList.add('active');
            stepControl.dataset.interval = interval.toString();

            const displayElement = isEnhancedMode ?
                stepControl.querySelector('.interval-display') :
                stepControl.querySelector('.interval-value');

            if (displayElement) {
                if (interval === 0) {
                    displayElement.textContent = '0';
                } else if (interval > 0) {
                    displayElement.textContent = '+' + interval;
                } else {
                    displayElement.textContent = interval.toString();
                }
            }

            // 增强模式下设置位置
            if (isEnhancedMode) {
                const percentage = ((interval + 12) / 36) * 100; // -12到+24映射到0-100%
                stepControl.style.bottom = percentage + '%';
            }
        }
    }

    console.log('✅ 序列数据加载完成');
};

// 更新现有的loadArpeggioPreset方法以支持新的序列编辑器
CustomEditor.prototype.loadArpeggioPresetWithSequence = function(presetIndex) {
    console.log('🎵 加载琶音预设到序列编辑器:', presetIndex);

    if (presetIndex === 'custom') {
        console.log('🔧 重置为自定义模式');
        this.resetSequence();
        return;
    }

    // 从MusicManager获取预设
    if (window.game && window.game.musicManager && window.game.musicManager.musicPresets[presetIndex]) {
        const preset = window.game.musicManager.musicPresets[presetIndex];
        console.log('📋 加载的预设数据:', preset);

        // 优先使用sequence字段，如果没有则从chordIntervals生成
        let sequence = null;
        if (preset.sequence && Array.isArray(preset.sequence)) {
            sequence = preset.sequence;
            console.log('🎵 使用预设的sequence:', sequence);
        } else if (preset.chordIntervals && Array.isArray(preset.chordIntervals)) {
            // 从chordIntervals生成简单的序列
            sequence = this.generateSequenceFromIntervals(preset.chordIntervals);
            console.log('🎵 从chordIntervals生成sequence:', sequence);
        } else {
            // 使用默认序列
            sequence = [0, 3, null, 7, 8, null, 7, null];
            console.log('🎵 使用默认sequence:', sequence);
        }

        // 加载序列到编辑器
        this.loadSequenceData(sequence);

        // 更新速度
        const tempo = preset.tempo || 120;
        const tempoSlider = document.getElementById('arpeggio-tempo');
        const tempoValue = document.getElementById('tempo-value');
        if (tempoSlider && tempoValue) {
            tempoSlider.value = tempo;
            tempoValue.textContent = tempo;
            console.log('🎵 设置速度:', tempo);
        }

        console.log('✅ 琶音预设加载到序列编辑器完成');
    } else {
        console.error('❌ 无法获取琶音预设:', presetIndex);
        this.resetSequence();
    }
};

CustomEditor.prototype.generateSequenceFromIntervals = function(intervals) {
    // 从和弦间隔生成8步序列
    const sequence = new Array(8).fill(null);

    if (!intervals || intervals.length === 0) {
        return [0, 3, null, 7, 8, null, 7, null]; // 默认序列
    }

    // 简单的模式：在偶数步骤放置间隔
    let intervalIndex = 0;
    for (let i = 0; i < 8; i += 2) {
        if (intervalIndex < intervals.length) {
            sequence[i] = intervals[intervalIndex];
            intervalIndex++;
        }
    }

    return sequence;
};

// 为音序点编辑器创建预览合成器
CustomEditor.prototype.createSequencePreviewSynth = function() {
    if (this.previewSynth) {
        this.previewSynth.dispose();
    }

    try {
        // 创建简单的合成器用于预览
        this.previewSynth = new Tone.Synth({
            oscillator: {
                type: 'triangle'
            },
            envelope: {
                attack: 0.01,
                decay: 0.1,
                sustain: 0.3,
                release: 0.5
            }
        }).toDestination();

        console.log('🎵 音序点预览合成器创建成功');
    } catch (error) {
        console.error('❌ 创建音序点预览合成器失败:', error);
    }
};

// 在CustomEditor构造函数中初始化预览合成器
CustomEditor.prototype.initializeSequencePreviewSynth = function() {
    // 延迟创建，确保Tone.js已加载
    setTimeout(() => {
        if (typeof Tone !== 'undefined') {
            this.createSequencePreviewSynth();
        } else {
            console.warn('⚠️ Tone.js未加载，无法创建音序点预览合成器');
        }
    }, 100);
};