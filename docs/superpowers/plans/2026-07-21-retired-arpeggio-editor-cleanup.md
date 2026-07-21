# Retired Arpeggio Editor Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove unreachable arpeggio-editor artifacts from Exhibition V2 without changing its visible interface or live performance behavior.

**Architecture:** Treat the current Exhibition V2 runtime as the protected system and the old editor as an unreachable static artifact set. Add a Node test contract that checks both halves of that boundary: retired files and references must be absent, while the live arpeggio and drum entry points must remain. Delete only the enumerated artifacts, then clean the two surviving documentation/debug references.

**Tech Stack:** HTML, JavaScript ES modules, Node.js built-in `node:test`, Git worktrees, Netlify static publishing.

---

## File map

- Create `tests/retired-editor-artifacts.test.mjs`: owns the file-absence and protected-runtime regression contract.
- Modify `README.md`: removes current instructions and changelog bullets for the retired custom editors.
- Modify `debug-main.html`: keeps Tone.js and console diagnostics while removing editor-only probes.
- Delete `ArpeggioEditor.js` and `CustomEditor.js`: unreachable editor implementations.
- Delete the eight dedicated editor demos/tests listed in Task 1.
- Delete the three obsolete editor reports/guides listed in Task 1.
- Do not modify `MusicManager.js`, `game.js`, `DrumManager.js`, `index.html`, `main.js`, `styles.css`, or `netlify.toml`.
- Do not modify the OneDrive worktree and do not deploy to Netlify.

### Task 1: Lock the runtime boundary and remove retired artifacts

**Files:**
- Create: `tests/retired-editor-artifacts.test.mjs`
- Delete: `ArpeggioEditor.js`
- Delete: `CustomEditor.js`
- Delete: `arpeggio-editor-fixed.html`
- Delete: `arpeggio-editor-integrated.html`
- Delete: `arpeggio-preview-test.html`
- Delete: `test-scale-modes.html`
- Delete: `test-sequence-editor.html`
- Delete: `test-sequence-functionality.js`
- Delete: `test-enhanced-visualizer.html`
- Delete: `test-enhanced-functionality.js`
- Delete: `ARPEGGIO_OPTIMIZATION_REPORT.md`
- Delete: `ENHANCED_VISUALIZER_SUMMARY.md`
- Delete: `integration-guide.md`

- [ ] **Step 1: Write the failing artifact and protected-runtime contract**

Create `tests/retired-editor-artifacts.test.mjs` with:

```js
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const projectRoot = new URL('../', import.meta.url);
const retiredArtifacts = [
  'ArpeggioEditor.js',
  'CustomEditor.js',
  'arpeggio-editor-fixed.html',
  'arpeggio-editor-integrated.html',
  'arpeggio-preview-test.html',
  'test-scale-modes.html',
  'test-sequence-editor.html',
  'test-sequence-functionality.js',
  'test-enhanced-visualizer.html',
  'test-enhanced-functionality.js',
  'ARPEGGIO_OPTIMIZATION_REPORT.md',
  'ENHANCED_VISUALIZER_SUMMARY.md',
  'integration-guide.md',
];

async function exists(relativePath) {
  try {
    await access(new URL(relativePath, projectRoot));
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

const [html, main, game, music, drum] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../main.js', import.meta.url), 'utf8'),
  readFile(new URL('../game.js', import.meta.url), 'utf8'),
  readFile(new URL('../MusicManager.js', import.meta.url), 'utf8'),
  readFile(new URL('../DrumManager.js', import.meta.url), 'utf8'),
]);

test('retired editor artifacts are absent from the publish root', async () => {
  const checks = await Promise.all(
    retiredArtifacts.map(async (relativePath) => ({
      relativePath,
      present: await exists(relativePath),
    })),
  );
  const present = checks.filter((item) => item.present).map((item) => item.relativePath);
  assert.deepEqual(present, []);
});

test('live arpeggio and drum entry points remain while editor runtime surfaces stay absent', () => {
  assert.doesNotMatch(html, /arpeggio-editor-modal|open-arpeggio-editor/);
  assert.doesNotMatch(main, /ArpeggioEditor|CustomEditor/);

  for (const method of ['startArpeggio', 'updateArpeggioVolume', 'stopArpeggio']) {
    assert.match(music, new RegExp(`${method}\\(`));
  }
  assert.match(game, /musicManager\.updateArpeggioVolume\('Left', velocity\)/);
  assert.match(game, /musicManager\.stopArpeggio\('Left'\)/);
  assert.match(main, /import \* as drumManager from '\.\/DrumManager\.js'/);
  assert.match(game, /import \* as drumManager from '\.\/DrumManager\.js'/);
  assert.match(drum, /export function startSequence\(/);
});
```

- [ ] **Step 2: Run the focused test and verify the RED state**

Run:

```powershell
node --test tests/retired-editor-artifacts.test.mjs
```

Expected: exit code `1`; the first test reports the 13 existing artifact paths, while the protected-runtime test passes.

- [ ] **Step 3: Delete exactly the retired artifacts**

Run from `D:\Codex\arpeggiator-remix-exhibition-v2`:

```powershell
git rm -- ArpeggioEditor.js CustomEditor.js arpeggio-editor-fixed.html arpeggio-editor-integrated.html arpeggio-preview-test.html test-scale-modes.html test-sequence-editor.html test-sequence-functionality.js test-enhanced-visualizer.html test-enhanced-functionality.js ARPEGGIO_OPTIMIZATION_REPORT.md ENHANCED_VISUALIZER_SUMMARY.md integration-guide.md
```

Expected: Git stages deletion of exactly the 13 paths listed above.

- [ ] **Step 4: Run the focused test and verify the GREEN state**

Run:

```powershell
node --test tests/retired-editor-artifacts.test.mjs
```

Expected: exit code `0`; `2` tests pass and `0` fail.

- [ ] **Step 5: Inspect and commit the artifact removal**

Run:

```powershell
git diff --check
git diff --cached --name-status
git add -- tests/retired-editor-artifacts.test.mjs
git commit -m "refactor: remove retired editor artifacts"
```

Expected: the staged list contains one added contract test and exactly 13 deleted files; the commit succeeds.

### Task 2: Remove surviving editor references from docs and diagnostics

**Files:**
- Modify: `tests/retired-editor-artifacts.test.mjs`
- Modify: `README.md`
- Modify: `debug-main.html`

- [ ] **Step 1: Extend the contract with failing documentation and diagnostic checks**

Add this source loading immediately after the existing `Promise.all` block in `tests/retired-editor-artifacts.test.mjs`:

```js
const [readme, debugMain] = await Promise.all([
  readFile(new URL('../README.md', import.meta.url), 'utf8'),
  readFile(new URL('../debug-main.html', import.meta.url), 'utf8'),
]);
```

Append this test:

```js
test('docs and diagnostics do not advertise or probe retired editors', () => {
  assert.doesNotMatch(
    readme,
    /自定义编辑器|琶音编辑器测试|鼓组编辑器测试|保存预设|编辑鼓组/,
  );
  assert.doesNotMatch(
    debugMain,
    /checkArpeggio|checkEvents|arpeggioEditor|arpeggio-editor-modal|sequencePointsContainer/,
  );
  assert.match(debugMain, /function checkTone\(\)/);
  assert.match(debugMain, /function clearLog\(\)/);
});
```

- [ ] **Step 2: Run the focused test and verify the second RED state**

Run:

```powershell
node --test tests/retired-editor-artifacts.test.mjs
```

Expected: exit code `1`; the new test finds retired editor language in `README.md` and retired probes in `debug-main.html`.

- [ ] **Step 3: Remove obsolete README claims and instructions**

Apply these exact removals to `README.md`:

```diff
@@
 - **实时手势识别**：使用 MediaPipe 进行精确的手部跟踪
 - **双手控制**：左手控制琶音（音高、音量、音色），右手控制鼓机节拍
-- **自定义编辑器**：可视化编辑琶音模式和鼓组节拍
 - **实时波形显示**：可视化音频输出
 - **预设管理**：内置多种音乐风格预设
@@
-## 🎛️ 自定义编辑器功能测试
-
-### 琶音编辑器测试
-1. 点击右下角的"自定义编辑器"按钮
-2. 选择"编辑琶音"
-3. **音符选择**：点击音符按钮来选择琶音中要使用的音符
-4. **和弦间隔**：设置和弦的音程间隔
-5. **琶音模式**：选择上行、下行或上下行模式
-6. **速度控制**：调整琶音播放速度
-7. 点击"预览"测试效果
-8. 点击"应用"将设置应用到实时演奏中
-
-### 鼓组编辑器测试
-1. 在自定义编辑器中选择"编辑鼓组"
-2. **16步音序器**：
-   - Kick（踢鼓）：点击对应步骤来激活/关闭
-   - Snare（军鼓）：设置军鼓的节拍模式
-   - Hi-hat（踩镲）：创建踩镲节奏
-   - Clap（拍手）：添加拍手音效
-3. 使用快速操作：
-   - **清空所有**：一键清除所有鼓点
-   - **随机化**：自动生成随机节拍模式
-4. 点击"应用"将鼓组模式应用到实时演奏
-
-### 预设保存测试
-1. 在编辑器中创建自定义设置
-2. 点击"保存预设"
-3. 输入预设名称
-4. 预设将保存到本地存储，下次访问时自动加载
-
 ## 🔧 技术架构
@@
-### 自定义编辑器无响应
-- 确保游戏已完全加载
-- 检查浏览器控制台是否有错误信息
-- 刷新页面重试
-
 ## 📝 更新日志
@@
 - ✅ 修复初始化错误
 - ✅ 优化手势识别平滑度
 - ✅ 解决通知显示重叠问题
-- ✅ 完善自定义编辑器功能
 - ✅ 增强错误处理机制
@@
 ### v1.1.0
-- 🆕 添加自定义编辑器
-- 🆕 支持预设保存/加载
 - 🔧 优化性能
```

Preserve all left-hand arpeggio instructions, built-in scene/preset descriptions, Exhibition V2 notes, and upstream credits.

- [ ] **Step 4: Remove editor-only controls and probes from `debug-main.html`**

Remove these two buttons, leaving the Tone.js and clear-log buttons adjacent:

```html
<button onclick="checkArpeggio()">检查琶音编辑器</button>
<button onclick="checkEvents()">检查事件</button>
```

Remove the complete `checkArpeggio` and `checkEvents` functions:

```js
function checkArpeggio() {
    addDebugLog('=== 检查琶音编辑器 ===');

    if (window.arpeggioEditor) {
        addDebugLog('✅ 琶音编辑器已加载', 'success');

        const methods = ['playDragNote', 'updateDrag', 'startDrag', 'noteToMidi', 'midiToNote'];
        methods.forEach(method => {
            if (typeof window.arpeggioEditor[method] === 'function') {
                addDebugLog(`✅ 方法 ${method} 存在`, 'success');
            } else {
                addDebugLog(`❌ 方法 ${method} 不存在`, 'error');
            }
        });

        addDebugLog(`🎵 根音符: ${window.arpeggioEditor.rootNote}${window.arpeggioEditor.octave}`, 'info');
        addDebugLog(`🎵 BPM: ${window.arpeggioEditor.bpm}`, 'info');

    } else {
        addDebugLog('❌ 琶音编辑器未加载', 'error');
    }
}

function checkEvents() {
    addDebugLog('=== 检查事件监听器 ===');

    const arpeggioBtn = document.querySelector('[onclick*="arpeggioEditor"]');
    if (arpeggioBtn) {
        addDebugLog('✅ 琶音编辑器按钮找到', 'success');
    } else {
        addDebugLog('❌ 琶音编辑器按钮未找到', 'error');
    }

    const modal = document.getElementById('arpeggio-editor-modal');
    if (modal) {
        addDebugLog('✅ 琶音编辑器模态框找到', 'success');
    } else {
        addDebugLog('❌ 琶音编辑器模态框未找到', 'error');
    }

    const container = document.getElementById('sequencePointsContainer');
    if (container) {
        addDebugLog('✅ 序列点容器找到', 'success');
        const points = container.querySelectorAll('.sequence-point');
        addDebugLog(`🎯 序列点数量: ${points.length}`, 'info');
    } else {
        addDebugLog('❌ 序列点容器未找到', 'error');
    }
}
```

Also remove the editor-only parent-window synchronization block at the end of the script:

```js
setTimeout(() => {
    addDebugLog('🔄 尝试访问主页面对象...');

    if (window.parent && window.parent !== window) {
        if (window.parent.arpeggioEditor) {
            window.arpeggioEditor = window.parent.arpeggioEditor;
            addDebugLog('✅ 从父窗口获取琶音编辑器', 'success');
        }
    }
}, 1000);
```

- [ ] **Step 5: Run the focused test and verify the final GREEN state**

Run:

```powershell
node --test tests/retired-editor-artifacts.test.mjs
```

Expected: exit code `0`; `3` tests pass and `0` fail.

- [ ] **Step 6: Inspect and commit the surviving-reference cleanup**

Run:

```powershell
git diff --check
git diff -- README.md debug-main.html tests/retired-editor-artifacts.test.mjs
git add -- README.md debug-main.html tests/retired-editor-artifacts.test.mjs docs/superpowers/specs/2026-07-21-arpeggio-editor-legacy-cleanup-design.md
git commit -m "docs: remove retired editor references"
```

Expected: only the two surviving text/debug files, the contract test, and the clarified design sentence are included.

### Task 3: Run complete regression and scope verification

**Files:**
- Verify only; no production files should change.

- [ ] **Step 1: Run the complete automated test suite**

Run:

```powershell
npm test
```

Expected: exit code `0`, all tests pass, and the summary reports `0` failures.

- [ ] **Step 2: Verify protected runtime files are byte-for-byte unchanged from the approved design baseline**

Run:

```powershell
git diff --exit-code 769e4e8 -- MusicManager.js game.js DrumManager.js index.html main.js styles.css netlify.toml
```

Expected: no output and exit code `0`.

- [ ] **Step 3: Verify no retired editor implementation references remain outside tests and historical design records**

Run:

```powershell
git grep -n -I -e ArpeggioEditor -e CustomEditor -e arpeggio-editor-modal -e open-arpeggio-editor -- ':!docs/superpowers/**' ':!tests/**'
```

Expected: no matches and exit code `1` from `git grep` because the result set is empty.

- [ ] **Step 4: Verify the OneDrive worktree and deployment configuration were untouched**

Run:

```powershell
git -C "C:\Users\yunlo\OneDrive\001-Project\live coding\live\arpeggiator-remix" branch --show-current
git -C "C:\Users\yunlo\OneDrive\001-Project\live coding\live\arpeggiator-remix" rev-parse HEAD
git diff --exit-code 769e4e8 -- netlify.toml .netlifyignore
```

Expected: the OneDrive worktree remains on `main` at `703f540135f68ea5d161940d7b9327533d75258a`; both deployment files produce no diff.

- [ ] **Step 5: Perform final whitespace and worktree checks**

Run:

```powershell
git diff --check
git status --short
git log -3 --oneline
```

Expected: `git diff --check` and `git status --short` produce no output. The log shows the plan/docs commit followed by the two implementation commits. Do not run a Netlify deployment command.
