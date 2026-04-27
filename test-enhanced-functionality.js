/**
 * 增强琶音可视化器功能测试脚本
 * 测试所有核心功能是否正常工作
 */

class EnhancedVisualizerTester {
    constructor() {
        this.editor = null;
        this.testResults = [];
    }

    async init() {
        console.log('🧪 初始化增强可视化器测试器...');
        
        // 等待Tone.js加载
        if (typeof Tone === 'undefined') {
            console.error('❌ Tone.js未加载');
            return false;
        }

        // 创建编辑器实例
        this.editor = new CustomEditor();
        
        // 初始化音频
        await this.editor.initializeSequencePreviewSynth();
        
        console.log('✅ 测试器初始化完成');
        return true;
    }

    // 测试增强可视化器DOM结构
    testDOMStructure() {
        console.log('🔍 测试DOM结构...');
        
        const tests = [
            {
                name: '序列可视化器容器',
                selector: '.sequence-visualizer',
                expected: 1
            },
            {
                name: '音程刻度',
                selector: '.interval-scale',
                expected: 1
            },
            {
                name: '序列列',
                selector: '.sequence-column',
                expected: 8
            },
            {
                name: '步骤控制器',
                selector: '.step-handle',
                expected: 8
            },
            {
                name: '音程显示',
                selector: '.interval-display',
                expected: 8
            }
        ];

        let passed = 0;
        tests.forEach(test => {
            const elements = document.querySelectorAll(test.selector);
            const success = elements.length === test.expected;
            
            console.log(`${success ? '✅' : '❌'} ${test.name}: ${elements.length}/${test.expected}`);
            
            if (success) passed++;
            this.testResults.push({
                category: 'DOM结构',
                test: test.name,
                passed: success,
                details: `找到 ${elements.length} 个元素，期望 ${test.expected} 个`
            });
        });

        console.log(`📊 DOM结构测试: ${passed}/${tests.length} 通过`);
        return passed === tests.length;
    }

    // 测试事件设置
    testEventSetup() {
        console.log('🔧 测试事件设置...');
        
        if (!this.editor) {
            console.error('❌ 编辑器未初始化');
            return false;
        }

        try {
            this.editor.setupSequenceStepEvents();
            console.log('✅ 事件设置成功');
            
            this.testResults.push({
                category: '事件设置',
                test: '音序点事件',
                passed: true,
                details: '事件设置无错误'
            });
            
            return true;
        } catch (error) {
            console.error('❌ 事件设置失败:', error);
            
            this.testResults.push({
                category: '事件设置',
                test: '音序点事件',
                passed: false,
                details: error.message
            });
            
            return false;
        }
    }

    // 测试序列数据操作
    testSequenceOperations() {
        console.log('📊 测试序列数据操作...');
        
        if (!this.editor) {
            console.error('❌ 编辑器未初始化');
            return false;
        }

        let passed = 0;
        const totalTests = 4;

        try {
            // 测试获取序列数据
            const sequence = this.editor.getSequenceData();
            const isValidSequence = Array.isArray(sequence) && sequence.length === 8;
            console.log(`${isValidSequence ? '✅' : '❌'} 获取序列数据: ${sequence}`);
            
            this.testResults.push({
                category: '序列操作',
                test: '获取序列数据',
                passed: isValidSequence,
                details: `序列: ${JSON.stringify(sequence)}`
            });
            
            if (isValidSequence) passed++;

            // 测试加载序列数据
            const testSequence = [0, 3, 5, 7, null, -2, 12, null];
            this.editor.loadSequenceData(testSequence);
            const loadedSequence = this.editor.getSequenceData();
            const loadSuccess = JSON.stringify(loadedSequence) === JSON.stringify(testSequence);
            console.log(`${loadSuccess ? '✅' : '❌'} 加载序列数据`);
            
            this.testResults.push({
                category: '序列操作',
                test: '加载序列数据',
                passed: loadSuccess,
                details: `加载: ${JSON.stringify(testSequence)}, 获取: ${JSON.stringify(loadedSequence)}`
            });
            
            if (loadSuccess) passed++;

            // 测试切换步骤
            const originalState = this.editor.getStepInterval(0);
            this.editor.toggleSequenceStep(0);
            const newState = this.editor.getStepInterval(0);
            const toggleSuccess = originalState !== newState;
            console.log(`${toggleSuccess ? '✅' : '❌'} 切换步骤状态`);
            
            this.testResults.push({
                category: '序列操作',
                test: '切换步骤状态',
                passed: toggleSuccess,
                details: `原始: ${originalState}, 新状态: ${newState}`
            });
            
            if (toggleSuccess) passed++;

            // 测试更新音程
            this.editor.updateStepInterval(1, 10, true);
            const updatedInterval = this.editor.getStepInterval(1);
            const updateSuccess = updatedInterval === 10;
            console.log(`${updateSuccess ? '✅' : '❌'} 更新音程`);
            
            this.testResults.push({
                category: '序列操作',
                test: '更新音程',
                passed: updateSuccess,
                details: `设置: 10, 获取: ${updatedInterval}`
            });
            
            if (updateSuccess) passed++;

        } catch (error) {
            console.error('❌ 序列操作测试失败:', error);
        }

        console.log(`📊 序列操作测试: ${passed}/${totalTests} 通过`);
        return passed === totalTests;
    }

    // 测试音频功能
    async testAudioFunctions() {
        console.log('🎵 测试音频功能...');
        
        if (!this.editor) {
            console.error('❌ 编辑器未初始化');
            return false;
        }

        let passed = 0;
        const totalTests = 2;

        try {
            // 测试预览序列
            console.log('🔊 测试序列预览...');
            await this.editor.previewCurrentSequence();
            console.log('✅ 序列预览成功');
            
            this.testResults.push({
                category: '音频功能',
                test: '序列预览',
                passed: true,
                details: '预览执行无错误'
            });
            
            passed++;

            // 测试合成器
            console.log('🎹 测试合成器...');
            await this.editor.testArpeggioSynth();
            console.log('✅ 合成器测试成功');
            
            this.testResults.push({
                category: '音频功能',
                test: '合成器测试',
                passed: true,
                details: '合成器执行无错误'
            });
            
            passed++;

        } catch (error) {
            console.error('❌ 音频功能测试失败:', error);
            
            this.testResults.push({
                category: '音频功能',
                test: '音频测试',
                passed: false,
                details: error.message
            });
        }

        console.log(`📊 音频功能测试: ${passed}/${totalTests} 通过`);
        return passed === totalTests;
    }

    // 运行所有测试
    async runAllTests() {
        console.log('🚀 开始运行所有测试...');
        
        const initSuccess = await this.init();
        if (!initSuccess) {
            console.error('❌ 初始化失败，停止测试');
            return;
        }

        const results = {
            dom: this.testDOMStructure(),
            events: this.testEventSetup(),
            sequence: this.testSequenceOperations(),
            audio: await this.testAudioFunctions()
        };

        // 生成测试报告
        this.generateReport(results);
    }

    // 生成测试报告
    generateReport(results) {
        console.log('\n📋 ===== 测试报告 =====');
        
        const categories = Object.keys(results);
        let totalPassed = 0;
        let totalTests = categories.length;

        categories.forEach(category => {
            const status = results[category] ? '✅ 通过' : '❌ 失败';
            console.log(`${status} ${category.toUpperCase()}`);
            if (results[category]) totalPassed++;
        });

        console.log(`\n📊 总体结果: ${totalPassed}/${totalTests} 通过`);
        
        // 详细结果
        console.log('\n📝 详细结果:');
        this.testResults.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} [${result.category}] ${result.test}: ${result.details}`);
        });

        // 建议
        if (totalPassed === totalTests) {
            console.log('\n🎉 所有测试通过！增强可视化器功能正常。');
        } else {
            console.log('\n⚠️ 部分测试失败，请检查相关功能。');
        }
    }
}

// 导出测试器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedVisualizerTester;
} else {
    window.EnhancedVisualizerTester = EnhancedVisualizerTester;
}
