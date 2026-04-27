// 琶音编辑器 - 示波器风格界面
export class ArpeggioEditor {
    constructor() {
        this.sequenceData = [];
        this.isDragging = false;
        this.dragTarget = null;
        this.dragIndex = null;
        this.dragStartY = 0;
        this.dragStartX = 0;
        this.dragStartTime = 0;
        this.hasMoved = false;
        this.bpm = 120;
        this.rootNote = 'C';
        this.octave = 4;
        this.lastDragPlayTime = 0;
        this.dragSynth = null;
        
        // 新增：音阶模式 (7-note 或 12-note)
        this.scaleType = '7-note'; // 默认为7音模式，对新手更友好

        // 预览播放状态
        this.isPlaying = false;
        this.previewSynth = null;
        this.playTimeout = null;

        this.init();
    }

    init() {
        this.initializeSequenceData();
        this.setupEventListeners();
        this.setDefaultSettings();
    }

    // 设置默认音色和琶音风格
    setDefaultSettings() {
        // 延迟设置，确保DOM已加载
        setTimeout(() => {
            this.checkToneAvailability();
            this.setDefaultSynthPreset();
            this.setDefaultArpeggioStyle();
        }, 100);
    }

    // 检查 Tone.js 可用性
    checkToneAvailability() {
        if (!window.Tone) {
            console.error('❌ Tone.js 未加载！音频功能将不可用');
        }
    }

    // 设置默认音色为 DX7 E.PIANO 1
    setDefaultSynthPreset() {
        const synthSelect = document.getElementById('synthPresetSelect');
        if (synthSelect) {
            // DX7 E.PIANO 1 是第一个选项，索引为0
            synthSelect.value = '0';
            this.setSynthPreset(0);
        }
    }

    // 设置默认琶音风格为 Minimal Groove
    setDefaultArpeggioStyle() {
        const presetSelect = document.getElementById('presetSelect');
        if (presetSelect) {
            // Minimal Groove 是第一个选项，索引为0
            presetSelect.value = '0';
            this.loadPresetByIndex(0);
        }
    }

    initializeSequenceData() {
        // 初始化8个音序点数据
        this.sequenceData = [];
        for (let i = 0; i < 8; i++) {
            this.sequenceData.push({
                active: i < 5, // 前5个默认激活
                interval: this.getDefaultInterval(i) // 根据模式设置默认间隔
            });
        }
    }

    // 根据当前模式获取默认间隔
    getDefaultInterval(index) {
        if (this.scaleType === '7-note') {
            // 7音模式：使用大调音阶模式 (C大调: 0, 2, 4, 5, 7)
            const defaultPattern = [0, 2, 4, 5, 7, 9, 11, 12]; // 大调音阶 + 高八度
            return defaultPattern[index] || 0;
        } else {
            // 12音模式：原始默认和弦
            return index === 0 ? 0 : (index === 1 ? 3 : (index === 2 ? 7 : (index === 3 ? 12 : (index === 4 ? 15 : 0))));
        }
    }

    setupEventListeners() {
        // 模态框打开/关闭
        const openBtn = document.getElementById('open-arpeggio-editor');
        const modal = document.getElementById('arpeggio-editor-modal');
        const closeBtn = modal.querySelector('.close');
        const closeBtnAction = document.getElementById('closeBtn');

        if (openBtn) {
            openBtn.addEventListener('click', () => this.openEditor());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeEditor());
        }

        if (closeBtnAction) {
            closeBtnAction.addEventListener('click', () => this.closeEditor());
        }

        // 点击模态框外部关闭
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeEditor();
            }
        });

        // 控制按钮
        this.setupControlButtons();
        
        // 设置面板控件
        this.setupSettingsPanel();
    }

    setupControlButtons() {
        const previewBtn = document.getElementById('previewBtn');
        const randomBtn = document.getElementById('randomBtn');
        const resetBtn = document.getElementById('resetBtn');
        const testBtn = document.getElementById('testBtn');
        const applyBtn = document.getElementById('applyBtn');

        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.preview());
        }

        if (randomBtn) {
            randomBtn.addEventListener('click', () => this.randomize());
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }

        if (testBtn) {
            testBtn.addEventListener('click', () => this.test());
        }

        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.apply());
        }
    }

    setupSettingsPanel() {
        // 合成器音色选择
        const synthPresetSelect = document.getElementById('synthPresetSelect');
        if (synthPresetSelect) {
            synthPresetSelect.addEventListener('change', (e) => {
                this.setSynthPreset(parseInt(e.target.value));
            });
        }

        // BPM滑块
        const bpmSlider = document.getElementById('bpmSlider');
        const bpmValue = document.getElementById('bpmValue');

        if (bpmSlider && bpmValue) {
            bpmSlider.addEventListener('input', (e) => {
                this.bpm = parseInt(e.target.value);
                bpmValue.textContent = this.bpm;
                // 实时更新Tone.js的BPM
                if (window.Tone && window.Tone.Transport) {
                    window.Tone.Transport.bpm.value = this.bpm;
                }
            });
        }

        // 根音选择
        const rootNoteSelect = document.getElementById('rootNoteSelect');
        if (rootNoteSelect) {
            rootNoteSelect.addEventListener('change', (e) => {
                this.rootNote = e.target.value;
                console.log('🎵 根音已更改为:', this.rootNote);
            });
        }

        // 八度选择
        const octaveSlider = document.getElementById('octaveSlider');
        const octaveValue = document.getElementById('octaveValue');

        if (octaveSlider && octaveValue) {
            octaveSlider.addEventListener('input', (e) => {
                this.octave = parseInt(e.target.value);
                octaveValue.textContent = this.octave;
                console.log('🎵 八度已更改为:', this.octave);
            });
        }

        // 音阶模式选择
        const scaleTypeSelect = document.getElementById('scaleTypeSelect');
        if (scaleTypeSelect) {
            scaleTypeSelect.addEventListener('change', (e) => {
                this.scaleType = e.target.value;
                console.log('🎵 音阶模式已更改为:', this.scaleType);
                
                // 更新Y轴标签
                this.updateYAxisLabels();
                
                // 重新渲染序列点以适应新的模式
                this.renderAll();
            });
        }

        // 预设管理
        this.setupPresetManagement();
    }

    setupPresetManagement() {
        const presetSelect = document.getElementById('arpeggioStyleSelect');
        const savePresetBtn = document.getElementById('savePresetBtn');
        const loadPresetBtn = document.getElementById('loadPresetBtn');

        if (presetSelect) {
            this.populatePresets();
            this.populateSynthPresets();
            presetSelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    this.loadPresetByIndex(parseInt(e.target.value));
                }
            });
        }

        if (savePresetBtn) {
            savePresetBtn.addEventListener('click', () => this.savePreset());
        }

        if (loadPresetBtn) {
            loadPresetBtn.addEventListener('click', () => this.loadPreset());
        }
    }

    openEditor() {
        const modal = document.getElementById('arpeggio-editor-modal');
        if (modal) {
            modal.style.display = 'block';
            this.setupOscilloscopeInteraction();
            this.loadCurrentSettings();
            this.populatePresets();
            this.populateSynthPresets();
            
            // 初始化音阶模式选择器
            this.initializeScaleTypeSelector();
            
            // 更新Y轴标签
            this.updateYAxisLabels();
            
            this.renderAll();

            // 确保设置默认值
            setTimeout(() => {
                this.setDefaultSynthPreset();
                this.setDefaultArpeggioStyle();
            }, 200);
        }
    }

    // 初始化音阶模式选择器
    initializeScaleTypeSelector() {
        const scaleTypeSelect = document.getElementById('scaleTypeSelect');
        if (scaleTypeSelect) {
            scaleTypeSelect.value = this.scaleType;
            console.log('🎵 音阶模式初始化为:', this.scaleType);
        }
    }

    loadCurrentSettings() {
        // 从音乐管理器加载当前设置
        if (window.game && window.game.musicManager) {
            const musicManager = window.game.musicManager;
            const currentPreset = musicManager.getCurrentMusicPreset();

            // 更新BPM
            this.bpm = currentPreset.tempo || 120;
            const bpmSlider = document.getElementById('bpmSlider');
            const bpmValue = document.getElementById('bpmValue');
            if (bpmSlider && bpmValue) {
                bpmSlider.value = this.bpm;
                bpmValue.textContent = this.bpm;
            }

            // 更新合成器预设选择
            const synthSelect = document.getElementById('synthPresetSelect');
            if (synthSelect) {
                synthSelect.value = musicManager.currentSynthIndex || 0;
            }

            // 如果当前预设有序列数据，加载它
            if (currentPreset.sequence) {
                this.loadSequenceFromPreset(currentPreset);
            }

            console.log('🎵 已加载当前设置:', {
                bpm: this.bpm,
                synthIndex: musicManager.currentSynthIndex,
                preset: currentPreset.name
            });
        }
    }

    closeEditor() {
        const modal = document.getElementById('arpeggio-editor-modal');
        if (modal) {
            modal.style.display = 'none';
        }

        // 停止预览播放
        this.stopPreview();

        // 清理拖动合成器资源
        if (this.dragSynth) {
            this.dragSynth.dispose();
            this.dragSynth = null;
        }
    }

    setupOscilloscopeInteraction() {
        const container = document.getElementById('sequencePointsContainer');
        if (!container) return;

        // 清除现有事件监听器
        container.innerHTML = '';

        // 移除之前的事件监听器（如果存在）
        if (this.boundHandlers) {
            document.removeEventListener('mousemove', this.boundHandlers.mouseMove);
            document.removeEventListener('mouseup', this.boundHandlers.mouseUp);
            document.removeEventListener('touchmove', this.boundHandlers.touchMove);
            document.removeEventListener('touchend', this.boundHandlers.touchEnd);
        }

        // 绑定事件处理器
        this.boundHandlers = {
            mouseMove: (e) => this.handleMouseMove(e),
            mouseUp: (e) => this.handleMouseUp(e),
            touchMove: (e) => this.handleTouchMove(e),
            touchEnd: (e) => this.handleTouchEnd(e)
        };

        // 鼠标事件
        container.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mousemove', this.boundHandlers.mouseMove);
        document.addEventListener('mouseup', this.boundHandlers.mouseUp);

        // 触摸事件
        container.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        document.addEventListener('touchmove', this.boundHandlers.touchMove);
        document.addEventListener('touchend', this.boundHandlers.touchEnd);
    }

    renderAll() {
        this.renderSequencePoints();
        this.renderConnections();
    }

    renderSequencePoints() {
        const container = document.getElementById('sequencePointsContainer');
        if (!container) return;

        container.innerHTML = '';

        this.sequenceData.forEach((point, index) => {
            const pointElement = document.createElement('div');
            pointElement.className = `sequence-point ${point.active ? 'active' : 'inactive'}`;
            pointElement.dataset.index = index;

            // 修正X位置计算，确保与底部标签对齐
            // 10条竖轴：0%, 10%, 20%, 30%, 40%, 50%, 60%, 70%, 80%, 90%
            // 8个序列点应该在中间8条轴上：10%, 20%, 30%, 40%, 50%, 60%, 70%, 80%
            const positions = [10, 20, 30, 40, 50, 60, 70, 80];
            const x = positions[index];
            const y = this.intervalToY(point.interval); // Y位置基于音程

            pointElement.style.left = `${x}%`;
            pointElement.style.top = `${y}%`;

            container.appendChild(pointElement);
        });
    }

    renderConnections() {
        const svg = document.getElementById('connectionsSvg');
        if (!svg) return;

        // 清除现有路径
        svg.innerHTML = '';

        // 设置SVG尺寸
        const container = svg.parentElement;
        const rect = container.getBoundingClientRect();
        svg.setAttribute('width', rect.width);
        svg.setAttribute('height', rect.height);
        svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);

        // 绘制连接线
        const activePoints = this.sequenceData
            .map((point, index) => ({ ...point, index }))
            .filter(point => point.active);

        if (activePoints.length < 2) return;

        let pathData = '';
        const positions = [10, 20, 30, 40, 50, 60, 70, 80];

        activePoints.forEach((point, i) => {
            const x = (positions[point.index] / 100) * rect.width;
            const y = (this.intervalToY(point.interval) / 100) * rect.height;

            if (i === 0) {
                pathData += `M ${x} ${y}`;
            } else {
                const prevPoint = activePoints[i - 1];
                const prevX = (positions[prevPoint.index] / 100) * rect.width;
                const prevY = (this.intervalToY(prevPoint.interval) / 100) * rect.height;

                // 使用贝塞尔曲线创建平滑连接
                const controlX1 = prevX + (x - prevX) * 0.5;
                const controlY1 = prevY;
                const controlX2 = prevX + (x - prevX) * 0.5;
                const controlY2 = y;

                pathData += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${x} ${y}`;
            }
        });

        if (pathData) {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('class', 'connection-line');
            svg.appendChild(path);
        }
    }

    // 将音程值转换为Y坐标百分比
    intervalToY(interval) {
        if (this.scaleType === '7-note') {
            // 7音模式：音程范围 -14 到 +14
            // Y坐标: 0% (顶部) 到 100% (底部)
            const normalizedInterval = (interval + 14) / 28; // 归一化到 0-1
            return (1 - normalizedInterval) * 100; // 反转Y轴 (顶部是高音程)
        } else {
            // 12音模式：音程范围 -24 到 +24 (原始逻辑)
            const normalizedInterval = (interval + 24) / 48; // 归一化到 0-1
            return (1 - normalizedInterval) * 100; // 反转Y轴 (顶部是高音程)
        }
    }

    yToInterval(y) {
        if (this.scaleType === '7-note') {
            // 7音模式：将Y坐标百分比转换为音程值
            const normalizedY = (100 - y) / 100; // 反转Y轴
            const rawInterval = Math.round(normalizedY * 28 - 14); // 转换到 -14 到 +14 范围
            
            // 将间隔映射到7音阶度数，然后转换为半音程
            return this.mapTo7NoteScale(rawInterval);
        } else {
            // 12音模式：将Y坐标百分比转换为音程值 (原始逻辑)
            const normalizedY = (100 - y) / 100; // 反转Y轴
            return Math.round(normalizedY * 48 - 24); // 转换到 -24 到 +24 范围
        }
    }

    // 将间隔映射到7音阶并转换为半音程
    mapTo7NoteScale(interval) {
        // 7音阶的半音程模式 (大调音阶)
        const majorScalePattern = [0, 2, 4, 5, 7, 9, 11]; // C大调的半音程间隔
        
        // 计算八度和音阶度数
        const octave = Math.floor(interval / 7);
        const degree = ((interval % 7) + 7) % 7; // 确保度数为正数
        
        // 计算实际的半音程
        const semitone = octave * 12 + majorScalePattern[degree];
        
        // 限制在合理范围内 (-24 到 +24)
        return Math.max(-24, Math.min(24, semitone));
    }

    // 将半音程转换回7音阶间隔 (用于显示)
    semitoneTo7NoteInterval(semitone) {
        const majorScalePattern = [0, 2, 4, 5, 7, 9, 11];
        
        // 找到最接近的音阶度数
        const octave = Math.floor(semitone / 12);
        const noteInOctave = ((semitone % 12) + 12) % 12;
        
        // 找到最接近的大调音阶度数
        let closestDegree = 0;
        let minDistance = Math.abs(noteInOctave - majorScalePattern[0]);
        
        for (let i = 1; i < majorScalePattern.length; i++) {
            const distance = Math.abs(noteInOctave - majorScalePattern[i]);
            if (distance < minDistance) {
                minDistance = distance;
                closestDegree = i;
            }
        }
        
        return octave * 7 + closestDegree;
    }

    // 更新Y轴标签以反映当前音阶模式
    updateYAxisLabels() {
        const yAxisLabels = document.querySelector('.y-axis-labels');
        if (!yAxisLabels) return;

        // 清除现有标签
        yAxisLabels.innerHTML = '';

        if (this.scaleType === '7-note') {
            // 7音模式标签：-14 到 +14，但显示为音阶度数
            const labels = [
                { position: 0, text: '+2八度' },
                { position: 25, text: '+1八度' },
                { position: 50, text: '根音' },
                { position: 75, text: '-1八度' },
                { position: 100, text: '-2八度' }
            ];

            labels.forEach(label => {
                const labelDiv = document.createElement('div');
                labelDiv.className = 'y-label';
                labelDiv.style.top = label.position + '%';
                labelDiv.textContent = label.text;
                yAxisLabels.appendChild(labelDiv);
            });
        } else {
            // 12音模式标签：-24 到 +24 (原始标签)
            const labels = [
                { position: 0, text: '+24' },
                { position: 25, text: '+12' },
                { position: 50, text: '0' },
                { position: 75, text: '-12' },
                { position: 100, text: '-24' }
            ];

            labels.forEach(label => {
                const labelDiv = document.createElement('div');
                labelDiv.className = 'y-label';
                labelDiv.style.top = label.position + '%';
                labelDiv.textContent = label.text;
                yAxisLabels.appendChild(labelDiv);
            });
        }
    }

    // 鼠标和触摸事件处理
    handleMouseDown(e) {
        this.startDrag(e.clientX, e.clientY, e.target);
    }

    handleMouseMove(e) {
        this.updateDrag(e.clientX, e.clientY);
    }

    handleMouseUp() {
        this.endDrag();
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.startDrag(touch.clientX, touch.clientY, e.target);
    }

    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.updateDrag(touch.clientX, touch.clientY);
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.endDrag();
    }

    startDrag(clientX, clientY, target) {
        if (!target.classList.contains('sequence-point')) return;

        this.isDragging = true;
        this.dragTarget = target;
        this.dragIndex = parseInt(target.dataset.index);
        this.dragStartX = clientX;
        this.dragStartY = clientY;
        this.dragStartTime = Date.now();
        this.hasMoved = false;

        target.style.zIndex = '10';
    }

    updateDrag(clientX, clientY) {
        if (!this.isDragging || !this.dragTarget) return;

        const deltaX = clientX - this.dragStartX;
        const deltaY = clientY - this.dragStartY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > 5) {
            this.hasMoved = true;
        }

        // 获取容器边界
        const container = document.getElementById('oscilloscope-grid');
        const rect = container.getBoundingClientRect();

        // 计算相对位置
        const relativeY = ((clientY - rect.top) / rect.height) * 100;
        const clampedY = Math.max(0, Math.min(100, relativeY));

        // 更新音程值
        const newInterval = this.yToInterval(clampedY);
        this.sequenceData[this.dragIndex].interval = newInterval;
        this.sequenceData[this.dragIndex].active = true;

        // 播放当前音符进行实时反馈
        this.playDragNote(newInterval);

        // 重新渲染
        this.renderAll();
    }

    endDrag() {
        if (!this.isDragging) return;

        if (this.dragTarget) {
            this.dragTarget.style.zIndex = '';

            // 如果没有移动，切换激活状态
            if (!this.hasMoved) {
                const index = this.dragIndex;
                this.sequenceData[index].active = !this.sequenceData[index].active;
                this.renderAll();
            }
        }

        this.isDragging = false;
        this.dragTarget = null;
        this.dragIndex = null;
        this.hasMoved = false;
    }

    // 拖动时播放音符进行实时反馈
    async playDragNote(interval) {
        try {
            // 防止过于频繁的播放
            if (this.lastDragPlayTime && Date.now() - this.lastDragPlayTime < 100) {
                return;
            }
            this.lastDragPlayTime = Date.now();

            // 检查Tone.js是否可用
            if (!window.Tone) return;

            // 启动音频上下文
            if (window.Tone.context.state !== 'running') {
                await window.Tone.start();
            }

            // 计算音符
            const rootNote = this.rootNote + this.octave;
            const baseMidi = this.noteToMidi(rootNote);
            const targetMidi = baseMidi + interval;
            const note = this.midiToNote(targetMidi);

            // 创建临时合成器播放音符，使用当前选择的音色
            if (!this.dragSynth) {
                const synthSelect = document.getElementById('synthPresetSelect');
                const currentSynthIndex = synthSelect ? parseInt(synthSelect.value) || 0 : 0;
                this.dragSynth = this.createSynthByIndex(currentSynthIndex);
            }

            // 播放音符
            this.dragSynth.triggerAttackRelease(note, '16n');

        } catch (error) {
            console.error('❌ 拖动音符播放失败:', error);
        }
    }

    // 控制方法
    preview() {
        if (this.isPlaying) {
            this.stopPreview();
        } else {
            this.startPreview();
        }
    }

    async startPreview() {
        try {
            // 检查Tone.js是否可用
            if (!window.Tone) {
                console.error('❌ Tone.js 未加载');
                alert('音频系统未就绪，请稍后再试');
                return;
            }

            // 启动音频上下文
            if (window.Tone.context.state !== 'running') {
                await window.Tone.start();
            }

            // 获取激活的序列点
            const activePoints = this.sequenceData
                .slice(0, 8)
                .map((point, index) => ({ ...point, index }))
                .filter(point => point.active);

            if (activePoints.length === 0) {
                alert('请先设置一些序列点');
                return;
            }

            // 计算音符
            const rootNote = this.rootNote + this.octave;
            const notes = activePoints.map(point => {
                const baseMidi = this.noteToMidi(rootNote);
                const targetMidi = baseMidi + point.interval;
                return this.midiToNote(targetMidi);
            });

            // 创建合成器，使用当前选择的音色
            if (this.previewSynth) {
                this.previewSynth.dispose();
            }

            // 获取当前音色设置
            const synthSelect = document.getElementById('synthPresetSelect');
            const currentSynthIndex = synthSelect ? parseInt(synthSelect.value) || 0 : 0;

            // 根据音色索引创建不同的合成器
            this.previewSynth = this.createSynthByIndex(currentSynthIndex);

            // 开始循环播放
            this.isPlaying = true;
            this.updatePreviewButton();
            this.playLoop(notes);

        } catch (error) {
            console.error('❌ 预览启动失败:', error);
            alert('预览功能出现错误: ' + error.message);
        }
    }

    playLoop(notes) {
        if (!this.isPlaying) return;

        const noteInterval = (60 / this.bpm) * 250; // 16分音符间隔
        let currentIndex = 0;

        const playNext = () => {
            if (!this.isPlaying) return;

            this.previewSynth.triggerAttackRelease(notes[currentIndex], '8n');
            currentIndex = (currentIndex + 1) % notes.length;

            this.playTimeout = setTimeout(playNext, noteInterval);
        };

        playNext();
    }

    stopPreview() {
        this.isPlaying = false;

        if (this.playTimeout) {
            clearTimeout(this.playTimeout);
            this.playTimeout = null;
        }

        if (this.previewSynth) {
            this.previewSynth.dispose();
            this.previewSynth = null;
        }

        this.updatePreviewButton();
    }

    updatePreviewButton() {
        const previewBtn = document.getElementById('previewBtn');
        if (previewBtn) {
            previewBtn.textContent = this.isPlaying ? '停止预览' : '预览';
            previewBtn.style.backgroundColor = this.isPlaying ? '#ff4444' : '';
        }
    }

    createSynthByIndex(index) {
        // 根据音色索引创建不同的合成器
        switch (index) {
            case 0: // DX7 E.PIANO 1
                return new window.Tone.FMSynth({
                    harmonicity: 2,
                    modulationIndex: 10,
                    envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 1.5 }
                }).toDestination();

            case 1: // DX7 BRASS 1
                return new window.Tone.FMSynth({
                    harmonicity: 1,
                    modulationIndex: 30,
                    envelope: { attack: 0.1, decay: 0.3, sustain: 0.7, release: 0.8 }
                }).toDestination();

            case 2: // DX7 MARIMBA
                return new window.Tone.FMSynth({
                    harmonicity: 3.5,
                    modulationIndex: 14,
                    envelope: { attack: 0.001, decay: 1.2, sustain: 0, release: 1.2 }
                }).toDestination();

            case 3: // Clean Sine
                return new window.Tone.Synth({
                    oscillator: { type: 'sine' },
                    envelope: { attack: 0.1, decay: 0.3, sustain: 0.5, release: 1 }
                }).toDestination();

            case 4: // SYNTHWAVE LEAD
                return new window.Tone.Synth({
                    oscillator: { type: 'sawtooth' },
                    envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.5 }
                }).toDestination();

            case 5: // CRYSTAL PLUCK
                return new window.Tone.PluckSynth({
                    attackNoise: 1,
                    dampening: 4000,
                    resonance: 0.7
                }).toDestination();

            default:
                return new window.Tone.Synth().toDestination();
        }
    }



    noteToMidi(note) {
        try {
            const noteMap = {
                'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
                'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
            };

            // 处理不同的音符格式
            let noteName, octave;
            if (note.includes('#')) {
                noteName = note.slice(0, -1); // 例如 "C#4" -> "C#"
                octave = parseInt(note.slice(-1)); // 例如 "C#4" -> 4
            } else {
                noteName = note.slice(0, -1); // 例如 "C4" -> "C"
                octave = parseInt(note.slice(-1)); // 例如 "C4" -> 4
            }

            if (isNaN(octave) || !noteMap.hasOwnProperty(noteName)) {
                console.error(`❌ 无效的音符格式: ${note}`);
                return 60; // 返回C4作为默认值
            }

            return (octave + 1) * 12 + noteMap[noteName];
        } catch (error) {
            console.error(`❌ noteToMidi转换错误: ${note}`, error);
            return 60; // 返回C4作为默认值
        }
    }

    midiToNote(midi) {
        try {
            const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            const octave = Math.floor(midi / 12) - 1;
            const note = notes[midi % 12];

            if (octave < 0 || octave > 9) {
                console.warn(`⚠️ 音符超出范围: MIDI ${midi} -> 八度 ${octave}`);
            }

            return note + octave;
        } catch (error) {
            console.error(`❌ midiToNote转换错误: ${midi}`, error);
            return 'C4'; // 返回C4作为默认值
        }
    }

    randomize() {
        console.log('🎲 随机化序列');
        this.sequenceData.forEach(point => {
            point.active = Math.random() > 0.3;
            if (point.active) {
                point.interval = Math.floor(Math.random() * 49) - 24; // -24 到 +24
            }
        });
        this.renderAll();
    }

    reset() {
        console.log('🔄 重置序列');
        this.initializeSequenceData();
        this.renderAll();
    }

    test() {
        console.log('🔧 测试功能');
        console.log('序列数据:', this.sequenceData);
        console.log('BPM:', this.bpm);
        console.log('根音:', this.rootNote + this.octave);

        // 验证DOM元素
        const elements = [
            'oscilloscope-grid',
            'sequencePointsContainer',
            'connectionsSvg'
        ];

        elements.forEach(id => {
            const element = document.getElementById(id);
            console.log(`${id}:`, element ? '✅ 存在' : '❌ 缺失');
        });

        // 测试简单的音频播放
        this.testSimpleAudio();

        // 强制重新渲染
        this.renderAll();
    }

    // 简单的音频测试 - 使用验证过的方法
    async testSimpleAudio() {
        console.log('🎵 测试简单音频播放...');

        try {
            if (!window.Tone) {
                console.error('❌ Tone.js 未加载');
                return;
            }

            // 启动音频上下文
            if (window.Tone.context.state !== 'running') {
                console.log('🎵 启动音频上下文...');
                await window.Tone.start();
                console.log('✅ 音频上下文已启动');
            }

            // 创建一个简单的合成器来测试
            const testSynth = new window.Tone.Synth().toDestination();
            console.log('🎵 播放测试音符 C4...');
            testSynth.triggerAttackRelease('C4', '8n');

            // 清理
            setTimeout(() => {
                testSynth.dispose();
                console.log('✅ 测试音符播放完成');
            }, 1000);

        } catch (error) {
            console.error('❌ 音频测试失败:', error);
        }
    }

    apply() {
        console.log('✅ 应用琶音设置');
        // TODO: 将设置应用到音乐管理器
        this.closeEditor();
    }

    populatePresets() {
        const select = document.getElementById('presetSelect');
        if (!select) return;

        select.innerHTML = '<option value="">选择预设...</option>';

        // 从MusicManager加载预设
        if (window.game && window.game.musicManager && window.game.musicManager.musicPresets) {
            const musicPresets = window.game.musicManager.musicPresets;

            musicPresets.forEach((preset, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = preset.name;
                select.appendChild(option);
            });

            console.log(`🎵 已加载 ${musicPresets.length} 个琶音预设`);
        } else {
            console.warn('⚠️ 无法访问音乐管理器或预设数据');
        }
    }

    populateSynthPresets() {
        const synthSelect = document.getElementById('synthPresetSelect');
        if (!synthSelect) return;

        synthSelect.innerHTML = '<option value="">选择音色...</option>';

        // 从MusicManager加载合成器预设
        if (window.game && window.game.musicManager) {
            const synthNames = [
                "DX7 E.PIANO 1",
                "DX7 BRASS 1",
                "DX7 MARIMBA",
                "Clean Sine",
                "SYNTHWAVE LEAD",
                "CRYSTAL PLUCK"
            ];

            synthNames.forEach((name, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = name;
                synthSelect.appendChild(option);
            });

            console.log(`🎵 已加载 ${synthNames.length} 个合成器音色`);
        }
    }

    setSynthPreset(index) {
        if (window.game && window.game.musicManager) {
            const musicManager = window.game.musicManager;
            musicManager.currentSynthIndex = index;
            musicManager._updateSynth();
            console.log(`🎵 切换到合成器音色: ${musicManager.getSynthName()}`);
        }

        // 重新创建拖动合成器以使用新音色
        if (this.dragSynth) {
            this.dragSynth.dispose();
            this.dragSynth = null;
        }

        // 如果正在预览，重新创建预览合成器
        if (this.isPlaying && this.previewSynth) {
            this.previewSynth.dispose();
            this.previewSynth = this.createSynthByIndex(index);
        }
    }

    loadPresetByIndex(index) {
        if (window.game && window.game.musicManager && window.game.musicManager.musicPresets[index]) {
            const preset = window.game.musicManager.musicPresets[index];
            console.log('📁 加载预设:', preset.name);

            this.loadSequenceFromPreset(preset);

            // 更新BPM
            if (preset.tempo) {
                this.bpm = preset.tempo;
                const bpmSlider = document.getElementById('bpmSlider');
                const bpmValue = document.getElementById('bpmValue');
                if (bpmSlider && bpmValue) {
                    bpmSlider.value = this.bpm;
                    bpmValue.textContent = this.bpm;
                }

                // 更新Tone.js的BPM
                if (window.Tone && window.Tone.Transport) {
                    window.Tone.Transport.bpm.value = this.bpm;
                }
            }

            // 更新合成器预设
            if (preset.synthPreset !== undefined) {
                const synthSelect = document.getElementById('synthPresetSelect');
                if (synthSelect) {
                    synthSelect.value = preset.synthPreset;
                }
                this.setSynthPreset(preset.synthPreset);
            }

            this.renderAll();
        }
    }

    loadSequenceFromPreset(preset) {
        if (preset.sequence && Array.isArray(preset.sequence)) {
            // 直接使用预设的序列数据
            preset.sequence.forEach((interval, index) => {
                if (index < this.sequenceData.length) {
                    if (interval !== null) {
                        this.sequenceData[index].active = true;
                        this.sequenceData[index].interval = interval;
                    } else {
                        this.sequenceData[index].active = false;
                        this.sequenceData[index].interval = 0;
                    }
                }
            });

            console.log('🎵 已加载序列数据:', preset.sequence);
        }
    }

    savePreset() {
        console.log('💾 保存预设');

        if (window.game && window.game.musicManager) {
            const musicManager = window.game.musicManager;

            // 创建新的预设
            const newPreset = {
                name: `自定义预设 ${new Date().toLocaleTimeString()}`,
                scale: this.generateScale(this.rootNote),
                sequence: this.getSequenceData(),
                arpeggioPattern: "up",
                tempo: this.bpm,
                synthPreset: musicManager.currentSynthIndex || 0,
                custom: true
            };

            // 添加到预设列表
            musicManager.musicPresets.push(newPreset);

            // 重新填充预设列表
            this.populatePresets();

            // 选择新创建的预设
            const presetSelect = document.getElementById('presetSelect');
            if (presetSelect) {
                presetSelect.value = musicManager.musicPresets.length - 1;
            }

            console.log('✅ 预设已保存:', newPreset);
        }
    }

    getSequenceData() {
        return this.sequenceData.map(point => point.active ? point.interval : null);
    }

    generateScale(rootNote) {
        // 生成基于根音的音阶
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const rootIndex = notes.indexOf(rootNote);
        const scale = [];

        for (let octave = 3; octave <= 5; octave++) {
            for (let i = 0; i < 12; i++) {
                const noteIndex = (rootIndex + i) % 12;
                scale.push(notes[noteIndex] + octave);
            }
        }

        return scale;
    }

    loadPreset() {
        console.log('📁 加载预设');
        const select = document.getElementById('presetSelect');
        if (!select || !select.value) return;

        this.loadPresetByIndex(parseInt(select.value));
    }
}
