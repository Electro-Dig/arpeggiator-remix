# Rhythm Grid V2 与五场景 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付更跟手的双层节奏光标、听感差异明确的 7×7 节奏网格、五个独立音乐场景和完整可读的现场 HUD。

**Architecture:** 视觉位置与音乐量化状态分离：`rhythmpointer` 传输连续归一化坐标，`rhythmposition`/节奏回调传输量化格。节奏内容继续由 Node 脚本离线生成并冻结为 JSON；场景定义集中在 `music/scenes.js`，UI 只消费场景状态。

**Tech Stack:** 原生 ES modules、Node test runner、Tone.js、CSS Grid、MediaPipe hand landmarks。

---

### Task 1: 五个独立音乐场景

**Files:**
- Modify: `tests/music-scenes.test.mjs`
- Modify: `tests/ui-shell.test.mjs`
- Modify: `music/scenes.js`
- Modify: `MusicManager.js`
- Modify: `index.html`
- Modify: `main.js`

- [ ] **Step 1: 写失败测试**

更新断言为 `minimal-groove`、`groove-pulse`、`neon-drive`、`midnight-pulse`、`arcade-horizon` 五场景，默认 `groove-pulse`，并断言 HTML/JS 中不存在 Classic 下拉框与 `setClassicPreset`。

- [ ] **Step 2: 验证测试失败**

Run: `node --test tests/music-scenes.test.mjs tests/ui-shell.test.mjs`
Expected: FAIL，旧场景数组和 Classic 控件断言不匹配。

- [ ] **Step 3: 最小实现**

把两个保留的 Classic preset 转成 `music/scenes.js` 的一级定义；删除 `CLASSIC_PRESETS`、`classicPresetIndex`、`setClassicPreset()` 和 UI 下拉框事件；场景条改成五项并默认选中 Groove Pulse。

- [ ] **Step 4: 验证通过**

Run: `node --test tests/music-scenes.test.mjs tests/ui-shell.test.mjs`
Expected: PASS。

### Task 2: 连续圆点与量化方格分层

**Files:**
- Modify: `tests/rhythm-grid-overlay.test.mjs`
- Modify: `tests/rhythm-integration-contract.test.mjs`
- Modify: `index.html`
- Modify: `RhythmGridOverlay.js`
- Modify: `game.js`
- Modify: `main.js`
- Modify: `styles.css`

- [ ] **Step 1: 写失败测试**

新增 `rhythm-pointer` DOM、归一化连续坐标 transform、逐帧 `rhythmpointer` 事件和保留量化 `rhythmposition` 事件的断言。

- [ ] **Step 2: 验证测试失败**

Run: `node --test tests/rhythm-grid-overlay.test.mjs tests/rhythm-integration-contract.test.mjs tests/ui-shell.test.mjs`
Expected: FAIL，连续指针尚不存在。

- [ ] **Step 3: 最小实现**

`game.js` 在右手有效区每帧发送归一化连续坐标；`main.js` 分别处理 pointer/cell；overlay 添加 `updatePointer()`，CSS 用一个无 transition 的圆点和一个轻微过渡的量化方格。

- [ ] **Step 4: 验证通过**

Run: `node --test tests/rhythm-grid-overlay.test.mjs tests/rhythm-integration-contract.test.mjs tests/ui-shell.test.mjs`
Expected: PASS。

### Task 3: 受约束节奏网格 V2

**Files:**
- Modify: `tests/rhythm-grid.test.mjs`
- Modify: `scripts/build-rhythm-grid.mjs`
- Regenerate: `rhythm/rhythm-grid.json`

- [ ] **Step 1: 写失败测试**

加入每行平均密度逐级上升、水平相邻汉明距离至少 5、垂直相邻汉明距离至少 5、上三行相邻差异不退化的测试。

- [ ] **Step 2: 验证测试失败**

Run: `node --test tests/rhythm-grid.test.mjs`
Expected: FAIL，旧网格在高能行出现密度平台和距离 2 的相邻格。

- [ ] **Step 3: 最小实现**

将生成脚本改为目标密度、结构性横向变异、能量层级纵向变异与确定性邻格距离修正；继续执行同时发声数和 backbeat 约束，然后运行 `node scripts/build-rhythm-grid.mjs` 生成稳定 JSON。

- [ ] **Step 4: 验证通过**

Run: `node --test tests/rhythm-grid.test.mjs`
Expected: PASS。

### Task 4: HUD 与节奏网格布局

**Files:**
- Modify: `tests/ui-shell.test.mjs`
- Modify: `styles.css`

- [ ] **Step 1: 写失败测试**

断言 performance status 使用五列网格、HUD 值不使用 ellipsis、节奏网格宽度增大并从底部上移。

- [ ] **Step 2: 验证测试失败**

Run: `node --test tests/ui-shell.test.mjs`
Expected: FAIL，当前仍为 flex、150px ellipsis 和 bottom 22px。

- [ ] **Step 3: 最小实现**

使用 `grid-template-columns: minmax(...)` 分配五项宽度；移除文本截断；将节奏空间定位到右侧中上部并将网格提升至约 182px。

- [ ] **Step 4: 验证通过**

Run: `node --test tests/ui-shell.test.mjs`
Expected: PASS。

### Task 5: 全量验证与浏览器检查

**Files:**
- Modify if required: `scripts/browser-smoke.mjs`

- [ ] **Step 1: 运行全量自动测试**

Run: `npm test`
Expected: 所有测试 PASS，0 failures。

- [ ] **Step 2: 运行浏览器 smoke**

Run: `node scripts/browser-smoke.mjs`
Expected: 页面加载、默认场景、五场景按钮、HUD、摄像头启动和关键控制无 console error。

- [ ] **Step 3: 1920×1080 视觉核验**

在本地页面截图并检查：长名称完整、网格与 16 步方块无重叠、圆点和方格同时可辨识。

- [ ] **Step 4: 检查变更范围**

Run: `git diff --check && git status --short`
Expected: 无 whitespace error，只有本计划涉及文件。
