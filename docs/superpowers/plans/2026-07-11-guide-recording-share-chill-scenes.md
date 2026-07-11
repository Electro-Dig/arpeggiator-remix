# Guide, Recording Share, and Chill Scenes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成现场版的轻量音频入口、三页 SVG 手势指引、录音回顾与竖版分享卡，并将音乐场景更新为六种模式。

**Architecture:** 保留现有 `Game`、`GuideController`、`RecordingController` 与 `MusicManager` 边界；静态 SVG 只负责表达动作，状态流仍由现有控制器和 `GestureLatch` 管理。二维码海报合成集中在 `share/qr.js`，桌面录音结果和手机分享页复用同一渲染函数，手机端仅在用户点击时生成。

**Tech Stack:** Vanilla ES modules、Web Audio/Tone.js、MediaRecorder、Canvas 2D、静态 SVG、Node.js `node:test`、Netlify Draft。

---

## 文件结构

- Create `assets/guide/stage-frame.svg`：中央参与者与观众干扰范围示意。
- Create `assets/guide/dual-hand-control.svg`：左手旋律与右手节奏空间示意。
- Create `assets/guide/record-thumbs.svg`：双手拇指确认/取消示意。
- Modify `guide/guide-model.js`：为三页卡片声明插图路径和准确文案。
- Modify `GuideController.js`：渲染插图并提供手势逐页前进/退出接口。
- Modify `main.js`：将双拇指手势路由到指引翻页并执行中性重置。
- Modify `game.js`：把音频激活和无摄像头提示改成非阻断、可恢复的统一提示。
- Modify `index.html`：升级指引、录音元数据与分享卡语义结构；更新六个场景按钮。
- Modify `styles.css`：实现半透明乐谱卡、无滚动竖版结果和响应式六场景布局。
- Modify `RecordingController.js`：维护 TAKE 编号、时长/格式元数据并把元数据传给海报渲染器。
- Modify `share/qr.js`：输出 1080×1440 竖版海报并支持 TAKE 元数据。
- Modify `r/index.html`：增加 TAKE 信息和“下载分享海报”操作。
- Modify `r/share-page.js`：派生公开 TAKE ID 并按需生成海报。
- Modify `r/share.css`：统一手机分享页视觉并保证可点击目标尺寸。
- Modify `music/scenes.js`：移除 Midnight Pulse，增加 Afterglow Coast 与 Blue Hour Drift。
- Modify `music/scale-utils.js`：增加 Afterglow Coast 使用的 major-pentatonic 音阶。
- Modify `MusicManager.js`：配置两种新场景的合成器音色。
- Modify `tests/guide-model.test.mjs`、`tests/guide-controller.test.mjs`：覆盖插图与手势逐页行为。
- Modify `tests/startup-contract.test.mjs`、`tests/ui-shell.test.mjs`：覆盖轻量入口、无旧编辑器、单屏卡片和六场景 UI。
- Modify `tests/recording-controller.test.mjs`：覆盖 TAKE 元数据、时长和海报参数。
- Modify `tests/qr.test.mjs`：覆盖竖版画布和动态文字。
- Modify `tests/share-page.test.mjs`：覆盖按需海报下载且首屏不合成。
- Modify `tests/music-scenes.test.mjs`：覆盖最终六场景及默认场景。
- Modify `scripts/browser-smoke.mjs`：补充指引和录音卡的 DOM smoke 断言。

### Task 1: 轻量音频入口与无摄像头恢复卡

**Files:**
- Modify: `tests/startup-contract.test.mjs`
- Modify: `tests/ui-shell.test.mjs`
- Modify: `game.js:1525-1605`
- Modify: `styles.css`

- [ ] **Step 1: 写失败的启动提示契约测试**

```js
test('startup prompts use recoverable non-blocking cards without retired editors', () => {
  const audioPrompt = methodSection('_showAudioActivationPrompt');
  const noCameraPrompt = methodSection('_showNoCameraModeGuide');
  assert.match(audioPrompt, /audio-activation-chip/);
  assert.match(audioPrompt, /点击画面 · 启动声音/);
  assert.doesNotMatch(audioPrompt, /rgba\(0,\s*0,\s*0,\s*0\.8\)/);
  assert.match(noCameraPrompt, /重试摄像头/);
  assert.match(noCameraPrompt, /继续手动模式/);
  assert.doesNotMatch(noCameraPrompt, /openArpeggioEditor|openDrumEditor/);
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test tests/startup-contract.test.mjs tests/ui-shell.test.mjs`  
Expected: FAIL，提示缺少 `audio-activation-chip`、恢复按钮，且仍存在旧编辑器 API。

- [ ] **Step 3: 将两个提示改为统一的非阻断结构**

在 `game.js` 中让 `_showAudioActivationPrompt()` 创建：

```js
this.audioPromptDiv = document.createElement('button');
this.audioPromptDiv.type = 'button';
this.audioPromptDiv.className = 'audio-activation-chip';
this.audioPromptDiv.innerHTML = '<span aria-hidden="true"></span><strong>点击画面 · 启动声音</strong>';
const activateAudio = async () => {
  try {
    if (window.Tone && Tone.context.state !== 'running') await Tone.start();
    this._hideAudioActivationPrompt();
  } catch (error) {
    console.error('音频上下文激活失败:', error);
    this.audioPromptDiv?.classList.add('is-error');
    const label = this.audioPromptDiv?.querySelector('strong');
    if (label) label.textContent = '重试声音';
  }
};
this.audioPromptDiv.addEventListener('click', activateAudio);
this.renderDiv.addEventListener('pointerdown', activateAudio, { once: true });
this.renderDiv.appendChild(this.audioPromptDiv);
```

让 `_showNoCameraModeGuide()` 创建 `.no-camera-card`，只包含状态、`#retry-camera` 与 `#continue-manual`。重试按钮执行现有恢复链：

```js
guideDiv.querySelector('#retry-camera').onclick = () => {
  guideDiv.remove();
  this.noCameraMode = false;
  this._setupHandTracking()
    .then(() => this._startGame())
    .catch((error) => {
      console.error('摄像头重试失败:', error);
      this._showNoCameraModeGuide();
    });
};
guideDiv.querySelector('#continue-manual').onclick = () => guideDiv.remove();
```

- [ ] **Step 4: 添加轻量样式并运行契约测试**

```css
.audio-activation-chip {
  position: absolute;
  left: 50%;
  bottom: 108px;
  z-index: 500;
  min-height: 44px;
  padding: 10px 16px;
  border: 1px solid rgba(128, 231, 236, .48);
  background: rgba(219, 235, 231, .82);
  color: #102025;
  backdrop-filter: blur(10px);
  transform: translateX(-50%);
}
.no-camera-card {
  position: absolute;
  top: 118px;
  left: 50%;
  z-index: 500;
  width: min(420px, calc(100vw - 32px));
  padding: 20px;
  border: 1px solid rgba(128, 231, 236, .46);
  background: rgba(211, 225, 224, .88);
  color: #102025;
  transform: translateX(-50%);
}
```

Run: `node --test tests/startup-contract.test.mjs tests/ui-shell.test.mjs`  
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add game.js styles.css tests/startup-contract.test.mjs tests/ui-shell.test.mjs
git commit -m "feat: refine startup recovery prompts"
```

### Task 2: 三张 SVG 指引与控制器渲染

**Files:**
- Create: `assets/guide/stage-frame.svg`
- Create: `assets/guide/dual-hand-control.svg`
- Create: `assets/guide/record-thumbs.svg`
- Modify: `guide/guide-model.js`
- Modify: `GuideController.js`
- Modify: `index.html:129-152`
- Modify: `styles.css:536-674`
- Modify: `tests/guide-model.test.mjs`
- Modify: `tests/guide-controller.test.mjs`

- [ ] **Step 1: 写失败的插图与逐页接口测试**

```js
test('every guide card declares a cacheable local SVG', () => {
  assert.deepEqual(GUIDE_CARDS.map(({ illustration }) => illustration), [
    '/assets/guide/stage-frame.svg',
    '/assets/guide/dual-hand-control.svg',
    '/assets/guide/record-thumbs.svg',
  ]);
});

test('gesture advance moves one page and completes only on the last page', async () => {
  const root = createRoot();
  const guide = new GuideController(root);
  guide.open();
  assert.equal(guide.advanceFromGesture(), 'advanced');
  assert.equal(guide.index, 1);
  assert.equal(guide.advanceFromGesture(), 'advanced');
  assert.equal(guide.index, 2);
  assert.equal(guide.advanceFromGesture(), 'complete');
  assert.equal(root.elements['guide-dialog'].open, false);
});
```

在测试 fake element 中增加 `src`、`alt`，并把 `guide-illustration` 加入 ID 列表。

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test tests/guide-model.test.mjs tests/guide-controller.test.mjs`  
Expected: FAIL，`illustration` 与 `advanceFromGesture` 尚不存在。

- [ ] **Step 3: 创建三张静态 SVG**

每张 SVG 使用 `viewBox="0 0 640 480"`、浅薄荷底、青色网格和红橙动作标记；使用 `<title>` 描述含义。三张图分别实现：中央有效区/旁观者边界、左右手控制映射、双拇指确认与取消。禁止外链字体、滤镜动画和嵌入位图。

- [ ] **Step 4: 扩展模型与控制器**

模型卡片增加：

```js
illustration: '/assets/guide/stage-frame.svg'
```

控制器增加：

```js
advanceFromGesture() {
  if (!this.dialog?.open) return 'ignored';
  const next = advanceGuide(this.index);
  if (next.complete) {
    this.close('gesture-complete');
    return 'complete';
  }
  this.index = next.index;
  this.render();
  return 'advanced';
}

exitFromGesture() {
  if (!this.dialog?.open) return false;
  this.close('gesture-exit');
  return true;
}
```

`render()` 设置 `guide-illustration.src`、`alt`，并继续更新进度和按钮文字。

手动前进或后退后派发统一事件：

```js
this.dispatchEvent(new CustomEvent('pagechange', {
  detail: { index: this.index, source: 'manual' },
}));
```

- [ ] **Step 5: 更新 HTML 与半透明乐谱卡布局**

```html
<figure class="guide-card__visual">
  <img id="guide-illustration" alt="" width="640" height="480">
</figure>
```

桌面卡片使用 `grid-template-columns: minmax(320px, .95fr) minmax(340px, 1.05fr)`；卡片最大高度小于 `calc(100vh - 96px)`，不设置内部滚动。移动端在 720px 以下切为一列。

- [ ] **Step 6: 运行测试并提交**

Run: `node --test tests/guide-model.test.mjs tests/guide-controller.test.mjs tests/ui-shell.test.mjs`  
Expected: PASS。

```bash
git add assets/guide guide/guide-model.js GuideController.js index.html styles.css tests/guide-model.test.mjs tests/guide-controller.test.mjs tests/ui-shell.test.mjs
git commit -m "feat: add illustrated gesture guide"
```

### Task 3: 指引中的双拇指逐页状态流

**Files:**
- Modify: `main.js:218-240`
- Modify: `tests/ui-shell.test.mjs`
- Modify: `tests/guide-controller.test.mjs`

- [ ] **Step 1: 写失败的路由契约**

```js
test('guide consumes thumbs gestures page by page and requires neutral rearming', () => {
  assert.match(main, /trigger === 'both-up'[\s\S]*guideController\.advanceFromGesture\(\)/);
  assert.match(main, /trigger === 'both-down'[\s\S]*guideController\.exitFromGesture\(\)/);
  assert.match(main, /guideController\.dialog\?\.open[\s\S]*recordingGestureLatch\.requireNeutral\(\)/);
  assert.doesNotMatch(main, /guideController\.skipFromGesture\(\)/);
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test tests/ui-shell.test.mjs tests/guide-controller.test.mjs`  
Expected: FAIL，主循环仍调用 `skipFromGesture()`。

- [ ] **Step 3: 修改 handframe 路由**

```js
if (guideController.dialog?.open) {
  game.setInteractionSuppressed(true);
  if (trigger === 'both-up') {
    guideController.advanceFromGesture();
    recordingGestureLatch.requireNeutral();
  } else if (trigger === 'both-down') {
    guideController.exitFromGesture();
    recordingGestureLatch.requireNeutral();
  }
  return;
}
```

订阅控制器的手动翻页事件，防止手势与点击重叠：

```js
guideController.addEventListener('pagechange', () => {
  recordingGestureLatch.requireNeutral();
});
```

- [ ] **Step 4: 运行测试并提交**

Run: `node --test tests/guide-controller.test.mjs tests/ui-shell.test.mjs tests/thumb-gesture.test.mjs`  
Expected: PASS。

```bash
git add main.js GuideController.js tests/guide-controller.test.mjs tests/ui-shell.test.mjs
git commit -m "feat: navigate guide with thumb gestures"
```

### Task 4: TAKE 元数据与录音回顾卡

**Files:**
- Modify: `tests/recording-controller.test.mjs`
- Modify: `RecordingController.js`
- Modify: `index.html:154-188`
- Modify: `styles.css:676-900`

- [ ] **Step 1: 写失败的 TAKE 元数据测试**

```js
test('completed takes expose incrementing review metadata', () => {
  const harness = createHarness({ withView: true });
  beginTake(harness);
  harness.advance(12_000);
  harness.controller.dispatch({ type: 'STOP_REQUEST' });
  assert.equal(harness.controller.takeNumber, 1);
  assert.equal(harness.elements['recording-take-label'].textContent, 'TAKE 001');
  assert.match(harness.elements['recording-duration'].textContent, /00:12/);
  assert.match(harness.elements['recording-format'].textContent, /WEBM/);
});
```

把 `recording-take-label`、`recording-duration`、`recording-format` 和四个动作按钮加入测试视图 ID。

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test tests/recording-controller.test.mjs`  
Expected: FAIL，控制器尚无 TAKE 元数据元素。

- [ ] **Step 3: 在控制器维护录次元数据**

构造函数增加：

```js
this.takeNumber = 0;
this.takeDurationMs = 0;
```

有效非空录音停止时执行：

```js
this.takeNumber += 1;
this.takeDurationMs = Math.min(RECORDING_MAX_MS, Math.max(0, this.now() - this.recordingStartedAt));
```

增加格式化函数：

```js
formatDuration(milliseconds) {
  const seconds = Math.max(0, Math.round(milliseconds / 1000));
  return `00:${String(seconds).padStart(2, '0')}`;
}
```

`render()` 更新 TAKE、时长与扩展名；`showShareResult()` 调用：

```js
await this.renderQr(this.elements.qr, result.shareUrl, {
  takeLabel: `TAKE ${String(this.takeNumber).padStart(3, '0')}`,
  projectName: 'ARPEGGIATOR REMIX',
});
```

- [ ] **Step 4: 更新录音回顾结构和按钮**

新增 `.recording-meta` 三项信息；确认按钮内显示 `👍👍`，放弃按钮内显示 `👎👎`。所有 `.recording-action` 使用 `min-height: 48px`，确认按钮为青色实心，放弃按钮使用红橙描边，播放器占满内容列。录音进行时仍关闭 dialog，只显示既有 `REC` HUD。

- [ ] **Step 5: 运行测试并提交**

Run: `node --test tests/recording-controller.test.mjs tests/recording-state.test.mjs tests/ui-shell.test.mjs`  
Expected: PASS。

```bash
git add RecordingController.js index.html styles.css tests/recording-controller.test.mjs tests/ui-shell.test.mjs
git commit -m "feat: enrich recording review card"
```

### Task 5: 竖版二维码海报与桌面单屏结果

**Files:**
- Modify: `tests/qr.test.mjs`
- Modify: `share/qr.js`
- Modify: `RecordingController.js`
- Modify: `index.html`
- Modify: `styles.css`

- [ ] **Step 1: 写失败的竖版海报测试**

```js
test('renders a portrait poster with project and take metadata', async () => {
  await renderQr(canvas, 'https://example.test/r/token', {
    loadQr,
    loadTemplate,
    createCanvas,
    takeLabel: 'TAKE 007',
    projectName: 'ARPEGGIATOR REMIX',
  });
  assert.equal(canvas.width, 1080);
  assert.equal(canvas.height, 1440);
  assert.ok(fillTexts.some(([value]) => value === 'TAKE 007'));
  assert.ok(fillTexts.some(([value]) => value === 'ARPEGGIATOR REMIX'));
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test tests/qr.test.mjs`  
Expected: FAIL，当前画布仍为 1254×1254。

- [ ] **Step 3: 改造统一海报渲染函数**

```js
export const POSTER_SIZE = Object.freeze({ width: 1080, height: 1440 });
export const QR_RECT = Object.freeze({ x: 96, y: 96, size: 370 });

export async function renderQr(canvas, value, {
  loadQr = loadDefaultQr,
  loadTemplate = loadDefaultTemplate,
  createCanvas = createDefaultCanvas,
  takeLabel = 'LIVE TAKE',
  projectName = 'ARPEGGIATOR REMIX',
} = {}) {
  const [{ toCanvas }, template] = await Promise.all([
    loadQr(),
    loadTemplate(TEMPLATE_URL),
  ]);
  const context = canvas.getContext('2d');
  const qrCanvas = createCanvas();
  canvas.width = POSTER_SIZE.width;
  canvas.height = POSTER_SIZE.height;
  context.drawImage(template, 0, 0, POSTER_SIZE.width, POSTER_SIZE.width);
  await toCanvas(qrCanvas, value, {
    width: QR_RECT.size,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#11120f', light: '#f5e2b8' },
  });
  context.drawImage(qrCanvas, QR_RECT.x, QR_RECT.y, QR_RECT.size, QR_RECT.size);
  context.fillStyle = '#f5e2b8';
  context.fillRect(0, 1080, 1080, 360);
  context.fillStyle = '#11120f';
  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';
  context.font = '700 52px "Arial Black", "Segoe UI", sans-serif';
  context.fillText(projectName, 72, 1200);
  context.font = '700 34px "Cascadia Mono", Consolas, monospace';
  context.fillText(takeLabel, 72, 1280);
  context.font = '600 26px "Cascadia Mono", Consolas, monospace';
  context.fillText('SCAN TO LISTEN / DOWNLOAD · 24H', 72, 1360);
}
```

二维码仍使用 `margin: 2`、纠错等级 `M` 和浅色静区。模板加载或二维码失败必须抛出清晰错误，交由控制器回退到复制链接。

- [ ] **Step 4: 将桌面 shared 状态收成单屏竖卡**

将 canvas 属性改为 `width="1080" height="1440"`。shared 状态移除 `overflow:auto` 和 620px body；海报视觉宽度约 300px，整张 dialog 使用 `max-height: calc(100vh - 32px)`，按钮横向或两列排列，1920×1080 不出现内部滚动。

- [ ] **Step 5: 运行测试并提交**

Run: `node --test tests/qr.test.mjs tests/recording-controller.test.mjs tests/ui-shell.test.mjs`  
Expected: PASS。

```bash
git add share/qr.js RecordingController.js index.html styles.css tests/qr.test.mjs tests/recording-controller.test.mjs tests/ui-shell.test.mjs
git commit -m "feat: render portrait recording share poster"
```

### Task 6: 手机分享页按需下载海报

**Files:**
- Modify: `tests/share-page.test.mjs`
- Modify: `r/index.html`
- Modify: `r/share-page.js`
- Modify: `r/share.css`

- [ ] **Step 1: 写失败的公开 TAKE 与懒生成测试**

```js
test('derives a stable public take label without exposing the full token', () => {
  assert.equal(takeLabelForToken('AbCd1234'.repeat(4)), 'TAKE CD12');
});

test('public page offers lazy poster download', async () => {
  const html = await readFile(new URL('../r/index.html', import.meta.url), 'utf8');
  const script = await readFile(new URL('../r/share-page.js', import.meta.url), 'utf8');
  assert.match(html, /id="download-poster"/);
  assert.match(script, /addEventListener\('click'[\s\S]*renderQr/);
  assert.doesNotMatch(script, /await renderQr[\s\S]*probeSharedRecording/);
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test tests/share-page.test.mjs`  
Expected: FAIL，页面尚无海报下载按钮和 TAKE 派生函数。

- [ ] **Step 3: 增加稳定短标识和点击生成**

```js
export function takeLabelForToken(token) {
  return `TAKE ${String(token || '').slice(2, 6).toUpperCase()}`;
}

async function downloadPoster({ token, url, render = renderQr }) {
  const canvas = document.createElement('canvas');
  await render(canvas, url, {
    takeLabel: takeLabelForToken(token),
    projectName: 'ARPEGGIATOR REMIX',
  });
  const link = document.createElement('a');
  link.download = `arpeggiator-remix-${takeLabelForToken(token).replace(' ', '-').toLowerCase()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
```

只在 `#download-poster` 点击事件内调用该函数；首屏依旧只做 1 byte 音频探测。点击处理包含独立回退，不改变播放器状态：

```js
posterButton.addEventListener('click', async () => {
  posterButton.disabled = true;
  try {
    await downloadPoster({ token, url: location.href });
    posterButton.textContent = '分享海报已下载';
  } catch (error) {
    console.error('分享海报生成失败:', error);
    posterButton.textContent = '海报生成失败 · 重试';
  } finally {
    posterButton.disabled = false;
  }
});
```

- [ ] **Step 4: 更新手机卡片样式**

加入 TAKE 标签和两个等宽下载按钮；最小高度 48px。采用浅雾灰内容面、青色细线与红色 signal，手机 320px 宽不横向溢出。

- [ ] **Step 5: 运行测试并提交**

Run: `node --test tests/share-page.test.mjs tests/qr.test.mjs`  
Expected: PASS。

```bash
git add r/index.html r/share-page.js r/share.css tests/share-page.test.mjs
git commit -m "feat: add on-demand mobile share poster"
```

### Task 7: 六种音乐场景与完整标签

**Files:**
- Modify: `tests/music-scenes.test.mjs`
- Modify: `tests/ui-shell.test.mjs`
- Modify: `music/scenes.js`
- Modify: `music/scale-utils.js`
- Modify: `MusicManager.js:20-30`
- Modify: `index.html:109-117`
- Modify: `styles.css:288-325, 1046-1055`

- [ ] **Step 1: 写失败的六场景测试**

```js
test('ships six approved scenes and defaults to Groove Pulse', () => {
  assert.equal(DEFAULT_SCENE_ID, 'groove-pulse');
  assert.deepEqual(SCENES.map(({ id }) => id), [
    'minimal-groove', 'groove-pulse', 'neon-drive', 'arcade-horizon',
    'afterglow-coast', 'blue-hour-drift',
  ]);
  assert.deepEqual(SCENES.map(({ bpm }) => bpm), [122, 115, 120, 126, 96, 90]);
  assert.ok(!SCENES.some(({ id }) => id === 'midnight-pulse'));
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test tests/music-scenes.test.mjs tests/ui-shell.test.mjs`  
Expected: FAIL，仍存在 Midnight Pulse，且只有五个场景。

- [ ] **Step 3: 更新场景与音色**

新增配置：

```js
scene({
  id: 'afterglow-coast', name: 'Afterglow Coast', tonic: 'D', mode: 'major-pentatonic', bpm: 96,
  sequence: [0, 4, 7, 11, 7, 4, 2, null, 0, 4, 9, 11, 7, 4, 2, null],
  bass: [0, null, null, 0, 5, null, 7, null],
  variants: ['AFTERGLOW PAD', 'COASTAL PLUCK'],
}),
scene({
  id: 'blue-hour-drift', name: 'Blue Hour Drift', tonic: 'A', mode: 'natural-minor', bpm: 90,
  sequence: [0, null, 3, 7, null, 10, 7, 3, 0, null, 5, 7, 10, null, 7, 3],
  bass: [0, null, null, null, 5, null, null, 7],
  variants: ['BLUE HOUR KEYS', 'TAPE CHOIR'],
}),
```

在 `SYNTH_VARIANTS` 增加对应四个 `fm(...)` 配置，并删除两个 Midnight 配置。

在 `music/scale-utils.js` 的 `MODES` 中增加：

```js
'major-pentatonic': [0, 2, 4, 7, 9],
```

并在 `tests/scale-utils.test.mjs` 断言 `buildScale('D', 'major-pentatonic', 3, 4)` 只生成 D、E、F#、A、B 音级。

- [ ] **Step 4: 更新场景按钮和响应式布局**

场景条按六项输出完整名称，不使用 `text-overflow: ellipsis`。桌面使用六列；620px 以下使用两列三行，保持下方工具不重叠。

- [ ] **Step 5: 运行测试并提交**

Run: `node --test tests/music-scenes.test.mjs tests/music-routing-contract.test.mjs tests/ui-shell.test.mjs tests/scale-utils.test.mjs`  
Expected: PASS。

```bash
git add music/scenes.js music/scale-utils.js MusicManager.js index.html styles.css tests/music-scenes.test.mjs tests/scale-utils.test.mjs tests/ui-shell.test.mjs
git commit -m "feat: add two chill music scenes"
```

### Task 8: 全量回归、浏览器调试与 Draft 发布

**Files:**
- Modify: `scripts/browser-smoke.mjs`
- Modify: `docs/verification/2026-07-11-exhibition-v2-preview.md`

- [ ] **Step 1: 扩展浏览器 smoke 断言**

在现有 Playwright smoke 流程中检查：

```js
await page.click('#open-guide');
assert.equal(await page.locator('#guide-dialog').getAttribute('open'), '');
assert.match(await page.locator('#guide-illustration').getAttribute('src'), /stage-frame\.svg/);
await page.click('#guide-next');
assert.equal(await page.locator('#guide-step').textContent(), '02');
await page.click('#guide-skip');
assert.equal(await page.locator('#guide-dialog').getAttribute('open'), null);
```

- [ ] **Step 2: 运行全量自动化测试**

Run: `npm test`  
Expected: 全部测试 PASS，无失败、跳过或未处理 rejection。

- [ ] **Step 3: 本地浏览器 smoke**

Run: `node scripts/browser-smoke.mjs`  
Expected: 摄像头权限允许或使用既有 fallback；控制台无新的 error；三个 SVG、六场景、录音流程与分享结果均能打开。

- [ ] **Step 4: 人工视觉验收**

在 1920×1080 检查：音频 chip 不遮挡、指引和 shared dialog 无内部滚动、六个场景名称完整。切换移动视口检查 `/r/<token>`：播放器优先出现，两个下载按钮可见，点击海报按钮后才生成 PNG。

- [ ] **Step 5: 更新验证记录并提交**

在 `docs/verification/2026-07-11-exhibition-v2-preview.md` 记录测试命令、通过数量、浏览器分辨率、已验证流程和生产未触碰声明。

```bash
git add scripts/browser-smoke.mjs docs/verification/2026-07-11-exhibition-v2-preview.md
git commit -m "test: verify guided recording refresh"
```

- [ ] **Step 6: 推送测试分支并发布 Netlify Draft**

Run: `git push origin feature/exhibition-v2`  
Expected: 远端分支更新成功。

Run: `npx netlify deploy --dir . --site arpeggiator-remix-2`  
Expected: 返回新的 Draft URL，不使用 `--prod`。

- [ ] **Step 7: 最终 Draft smoke**

打开 Draft URL，检查邀请码入口未受影响；进入后重复动作指引、六场景、录音、二维码与手机分享页检查。生产 URL `https://arpeggiator-remix-2.netlify.app/` 的部署 ID 保持不变。
