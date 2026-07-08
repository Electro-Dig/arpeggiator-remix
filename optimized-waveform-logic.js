/**
 * 优化的波形可视化逻辑
 * 专门处理空符号（null值）的情况
 */

class OptimizedWaveformVisualizer {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            width: 800,
            height: 400,
            tension: 0.4,           // 曲线张力
            minActivePoints: 2,     // 最少激活点数
            stepWidth: 100,         // 步骤宽度
            ...options
        };
        
        this.sequence = [0, 3, null, 7, null, null, 12, null];
        this.isPlaying = false;
        this.currentStep = 0;
        this.animationId = null;
        
        this.init();
    }

    init() {
        this.createSVGElements();
        this.updateVisualization();
    }

    createSVGElements() {
        // 创建SVG容器
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('class', 'waveform-svg');
        this.svg.setAttribute('viewBox', `0 0 ${this.options.width} ${this.options.height}`);
        
        // 创建发光路径
        this.glowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.glowPath.setAttribute('class', 'waveform-glow');
        
        // 创建主路径
        this.mainPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.mainPath.setAttribute('class', 'waveform-path');
        
        this.svg.appendChild(this.glowPath);
        this.svg.appendChild(this.mainPath);
        this.container.appendChild(this.svg);
    }

    /**
     * 获取激活的音序点（跳过null值）
     */
    getActivePoints() {
        const activePoints = [];
        
        for (let i = 0; i < this.sequence.length; i++) {
            const interval = this.sequence[i];
            if (interval !== null) {
                const x = (i + 1) * this.options.stepWidth;
                const y = this.intervalToY(interval);
                activePoints.push({
                    x, y, 
                    step: i, 
                    interval
                });
            }
        }
        
        return activePoints;
    }

    /**
     * 音程值转换为Y坐标
     */
    intervalToY(interval) {
        // -12到+24映射到360-40（留边距）
        return 360 - ((interval + 12) / 36) * 320;
    }

    /**
     * 将连续的激活点分组
     */
    groupContinuousPoints(activePoints) {
        if (activePoints.length === 0) return [];
        
        const groups = [];
        let currentGroup = [activePoints[0]];
        
        for (let i = 1; i < activePoints.length; i++) {
            const prevPoint = activePoints[i - 1];
            const currPoint = activePoints[i];
            
            // 检查是否连续（步骤相差1或2）
            if (currPoint.step - prevPoint.step <= 2) {
                currentGroup.push(currPoint);
            } else {
                // 不连续，开始新组
                groups.push(currentGroup);
                currentGroup = [currPoint];
            }
        }
        
        // 添加最后一组
        groups.push(currentGroup);
        
        return groups;
    }

    /**
     * 生成单个组的贝塞尔曲线路径
     */
    generateGroupPath(points) {
        if (points.length === 0) return '';
        if (points.length === 1) {
            // 单点绘制小圆圈
            const p = points[0];
            return `M ${p.x - 3} ${p.y} A 3 3 0 1 1 ${p.x + 3} ${p.y} A 3 3 0 1 1 ${p.x - 3} ${p.y}`;
        }
        
        let path = `M ${points[0].x} ${points[0].y}`;
        
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            
            // 计算控制点
            const dx = curr.x - prev.x;
            const tension = this.options.tension;
            
            const cp1x = prev.x + dx * tension;
            const cp1y = prev.y;
            const cp2x = curr.x - dx * tension;
            const cp2y = curr.y;
            
            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
        }
        
        return path;
    }

    /**
     * 更新波形路径
     */
    updateWaveform() {
        const activePoints = this.getActivePoints();
        
        if (activePoints.length === 0) {
            // 没有激活点
            this.mainPath.setAttribute('d', '');
            this.glowPath.setAttribute('d', '');
            return;
        }
        
        // 将激活点分组
        const groups = this.groupContinuousPoints(activePoints);
        
        // 生成所有组的路径
        let fullPath = '';
        groups.forEach(group => {
            fullPath += this.generateGroupPath(group);
        });
        
        this.mainPath.setAttribute('d', fullPath);
        this.glowPath.setAttribute('d', fullPath);
        
        console.log(`🌊 波形更新: ${activePoints.length}个激活点, ${groups.length}个连续段`);
    }

    /**
     * 更新音序点显示
     */
    updateSequencePoints() {
        // 清除现有点
        const existingPoints = this.container.querySelectorAll('.sequence-point');
        existingPoints.forEach(point => point.remove());
        
        // 创建新的音序点
        for (let i = 0; i < this.sequence.length; i++) {
            const interval = this.sequence[i];
            const point = document.createElement('div');
            point.className = 'sequence-point';
            
            const x = ((i + 1) / 8) * 100; // 百分比位置
            
            if (interval !== null) {
                point.classList.add('active');
                const y = 90 - ((interval + 12) / 36) * 80;
                point.style.top = y + '%';
                
                // 添加音程值显示
                point.setAttribute('data-interval', interval);
                point.title = `步骤${i + 1}: ${interval > 0 ? '+' : ''}${interval}`;
            } else {
                point.classList.add('inactive');
                point.style.top = '50%';
                point.title = `步骤${i + 1}: 空拍`;
            }
            
            point.style.left = x + '%';
            this.container.appendChild(point);
        }
    }

    /**
     * 更新完整可视化
     */
    updateVisualization() {
        this.updateSequencePoints();
        this.updateWaveform();
    }

    /**
     * 开始播放动画
     */
    startPlayback() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.currentStep = 0;
        this.animatePlayback();
        
        console.log('▶️ 开始播放动画');
    }

    /**
     * 停止播放动画
     */
    stopPlayback() {
        this.isPlaying = false;
        if (this.animationId) {
            clearTimeout(this.animationId);
        }
        
        // 隐藏当前位置指示器
        const currentPos = this.container.querySelector('.current-position');
        if (currentPos) {
            currentPos.style.display = 'none';
        }
        
        console.log('⏹️ 停止播放动画');
    }

    /**
     * 播放动画循环
     */
    animatePlayback() {
        if (!this.isPlaying) return;
        
        const currentPos = this.container.querySelector('.current-position');
        if (!currentPos) return;
        
        const interval = this.sequence[this.currentStep];
        
        if (interval !== null) {
            // 激活点：显示光点
            const x = ((this.currentStep + 1) / 8) * 100;
            const y = 90 - ((interval + 12) / 36) * 80;
            
            currentPos.style.left = x + '%';
            currentPos.style.top = y + '%';
            currentPos.style.display = 'block';
            
            // 闪烁效果
            currentPos.style.animation = 'currentPulse 0.2s ease-out';
            setTimeout(() => {
                currentPos.style.animation = 'currentPulse 0.5s ease-in-out infinite alternate';
            }, 200);
            
        } else {
            // 空拍：隐藏光点
            currentPos.style.display = 'none';
        }
        
        // 下一步
        this.currentStep = (this.currentStep + 1) % this.sequence.length;
        
        // 继续动画（120 BPM = 500ms per step）
        this.animationId = setTimeout(() => this.animatePlayback(), 500);
    }

    /**
     * 设置新序列
     */
    setSequence(newSequence) {
        this.sequence = [...newSequence];
        this.updateVisualization();
        console.log('📝 序列已更新:', this.sequence);
    }

    /**
     * 随机生成序列
     */
    randomizeSequence() {
        const intervals = [0, 2, 3, 5, 7, 8, 10, 12];
        const newSequence = [];
        let activeCount = 0;
        
        // 第一轮：随机生成
        for (let i = 0; i < 8; i++) {
            if (Math.random() > 0.4 && activeCount < 6) {
                newSequence.push(intervals[Math.floor(Math.random() * intervals.length)]);
                activeCount++;
            } else {
                newSequence.push(null);
            }
        }
        
        // 确保至少有2个激活点
        while (activeCount < this.options.minActivePoints) {
            const randomIndex = Math.floor(Math.random() * 8);
            if (newSequence[randomIndex] === null) {
                newSequence[randomIndex] = intervals[Math.floor(Math.random() * intervals.length)];
                activeCount++;
            }
        }
        
        this.setSequence(newSequence);
    }

    /**
     * 重置为默认序列
     */
    resetSequence() {
        this.setSequence([0, 3, null, 7, null, null, 12, null]);
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OptimizedWaveformVisualizer;
} else {
    window.OptimizedWaveformVisualizer = OptimizedWaveformVisualizer;
}
