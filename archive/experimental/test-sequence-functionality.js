// 音序点编辑器功能测试脚本
// 在浏览器控制台中运行此脚本来测试功能

console.log('🧪 开始测试音序点编辑器功能...');

// 测试1: 检查HTML元素是否存在
function testHTMLElements() {
    console.log('📋 测试1: 检查HTML元素...');
    
    const elements = [
        'root-note-selector',
        'preview-sequence', 
        'randomize-sequence',
        'reset-sequence'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`✅ ${id} 元素存在`);
        } else {
            console.error(`❌ ${id} 元素不存在`);
        }
    });
    
    // 检查音序点
    for (let i = 0; i < 8; i++) {
        const stepElement = document.querySelector(`[data-step="${i}"]`);
        if (stepElement) {
            console.log(`✅ 音序点 ${i + 1} 存在`);
        } else {
            console.error(`❌ 音序点 ${i + 1} 不存在`);
        }
    }
}

// 测试2: 检查CustomEditor类和方法
function testCustomEditorMethods() {
    console.log('📋 测试2: 检查CustomEditor方法...');
    
    if (typeof window.game !== 'undefined' && window.game.customEditor) {
        const editor = window.game.customEditor;
        
        const methods = [
            'setupSequenceEditorEvents',
            'toggleSequenceStep',
            'getSequenceData',
            'loadSequenceData',
            'previewSequence',
            'randomizeSequence',
            'resetSequence'
        ];
        
        methods.forEach(method => {
            if (typeof editor[method] === 'function') {
                console.log(`✅ ${method} 方法存在`);
            } else {
                console.error(`❌ ${method} 方法不存在`);
            }
        });
    } else {
        console.error('❌ CustomEditor实例不存在');
    }
}

// 测试3: 测试数据获取和设置
function testDataOperations() {
    console.log('📋 测试3: 测试数据操作...');
    
    if (window.game && window.game.customEditor) {
        const editor = window.game.customEditor;
        
        try {
            // 测试获取当前序列数据
            const currentData = editor.getSequenceData();
            console.log('📊 当前序列数据:', currentData);
            
            // 测试加载测试数据
            const testData = [0, 5, null, 12, -3, null, 7, 2];
            editor.loadSequenceData(testData);
            console.log('📋 测试数据已加载:', testData);
            
            // 验证数据是否正确加载
            const loadedData = editor.getSequenceData();
            console.log('📊 加载后的数据:', loadedData);
            
            // 比较数据
            const isEqual = JSON.stringify(testData) === JSON.stringify(loadedData);
            if (isEqual) {
                console.log('✅ 数据加载测试通过');
            } else {
                console.error('❌ 数据加载测试失败');
            }
            
        } catch (error) {
            console.error('❌ 数据操作测试失败:', error);
        }
    }
}

// 测试4: 测试UI交互
function testUIInteractions() {
    console.log('📋 测试4: 测试UI交互...');
    
    try {
        // 测试点击第一个音序点
        const firstStep = document.querySelector('[data-step="0"] .step-point');
        if (firstStep) {
            const wasActive = firstStep.classList.contains('active');
            firstStep.click();
            const isActive = firstStep.classList.contains('active');
            
            if (wasActive !== isActive) {
                console.log('✅ 音序点点击切换测试通过');
            } else {
                console.error('❌ 音序点点击切换测试失败');
            }
        }
        
        // 测试根音切换按钮
        const rootNoteBtn = document.getElementById('root-note-selector');
        if (rootNoteBtn) {
            const originalText = rootNoteBtn.textContent;
            rootNoteBtn.click();
            const newText = rootNoteBtn.textContent;
            
            if (originalText !== newText) {
                console.log('✅ 根音切换测试通过');
            } else {
                console.error('❌ 根音切换测试失败');
            }
        }
        
    } catch (error) {
        console.error('❌ UI交互测试失败:', error);
    }
}

// 测试5: 测试音频功能
function testAudioFunctions() {
    console.log('📋 测试5: 测试音频功能...');
    
    if (window.game && window.game.customEditor) {
        const editor = window.game.customEditor;
        
        try {
            // 检查预览合成器
            if (editor.previewSynth) {
                console.log('✅ 预览合成器存在');
                
                // 测试单个音符预览
                editor.previewStepNote(0);
                console.log('✅ 单个音符预览测试完成');
                
            } else {
                console.warn('⚠️ 预览合成器不存在，尝试创建...');
                editor.createSequencePreviewSynth();
            }
            
        } catch (error) {
            console.error('❌ 音频功能测试失败:', error);
        }
    }
}

// 运行所有测试
function runAllTests() {
    console.log('🚀 开始运行所有测试...');
    
    testHTMLElements();
    testCustomEditorMethods();
    testDataOperations();
    testUIInteractions();
    testAudioFunctions();
    
    console.log('✅ 所有测试完成！');
}

// 导出测试函数
window.testSequenceEditor = {
    runAllTests,
    testHTMLElements,
    testCustomEditorMethods,
    testDataOperations,
    testUIInteractions,
    testAudioFunctions
};

console.log('📋 测试脚本已加载。运行 testSequenceEditor.runAllTests() 来执行所有测试。');
