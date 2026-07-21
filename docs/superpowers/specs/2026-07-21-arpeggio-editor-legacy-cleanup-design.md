# Exhibition V2 琶音编辑器遗留清理设计

日期：2026-07-21

## 背景

当前线上版本以 `D:\Codex\arpeggiator-remix-exhibition-v2` 的
`feature/exhibition-v2` 分支为准。主页面已经没有琶音编辑器按钮、弹窗、导入或初始化逻辑，
但仓库根目录仍保留旧编辑器实现、独立演示页、手工测试脚本和过时说明。

Netlify 当前以仓库根目录作为发布目录，因此这些未被主页面加载的文件仍可能作为静态资源被发布。
本次工作是仓库和发布包层面的遗留清理，不是用户界面改版。

OneDrive 工作目录
`C:\Users\yunlo\OneDrive\001-Project\live coding\live\arpeggiator-remix`
不在本次范围内，保持原样。

## 目标

- 删除已经不可达的琶音编辑器实现及其专用演示、测试和说明文件。
- 修正 README 中仍声称可以打开自定义编辑器的过时内容。
- 保持当前 Exhibition V2 界面和操作方式不变。
- 用自动化契约防止旧编辑器文件或入口再次进入发布版本。

## 非目标

- 不删除或改写手势驱动的琶音演奏引擎。
- 不修改 `MusicManager.js` 中的琶音播放、音量、音色或场景逻辑。
- 不修改 `game.js` 中的现场手势映射。
- 不修改鼓机、节奏空间、录音分享、动作指引、高级控制或视觉系统。
- 不清理与编辑器无关的调试页和历史资料。
- 不删除 `docs/superpowers` 中已有的设计和实施历史。
- 不执行 Netlify 部署。
- 不修改 OneDrive 工作目录。

## 方案比较

### 方案 A：保持现状

主页面已经不会加载编辑器，因此运行风险最低，但旧代码仍留在仓库和静态发布范围内，README 也继续误导维护者。

### 方案 B：精准清理（采用）

删除明确属于已退役编辑器的实现、演示页、测试和说明；只修正包含过时编辑器描述的文档和调试检查。
同时增加一条文件级回归契约。该方案能消除遗留代码，同时把对现场功能的影响限制在零运行时变更。

### 方案 C：全面清理旧调试资产

同时删除其他旧调试页、波形实验和历史报告。虽然目录会更整洁，但范围超过本次要求，且更容易误删仍有参考价值的工具，因此不采用。

## 清理边界

### 删除的编辑器实现

- `ArpeggioEditor.js`
- `CustomEditor.js`

`CustomEditor.js` 同时包含旧鼓组编辑分支，但整个模块已经不被 `index.html`、`main.js` 或 `game.js` 导入。
当前鼓机由独立的 `DrumManager.js` 提供，并由 `main.js` 和 `game.js` 直接加载；删除这个退役模块不会改变鼓机运行。

### 删除的编辑器演示和测试

- `arpeggio-editor-fixed.html`
- `arpeggio-editor-integrated.html`
- `arpeggio-preview-test.html`
- `test-scale-modes.html`
- `test-sequence-editor.html`
- `test-sequence-functionality.js`
- `test-enhanced-visualizer.html`
- `test-enhanced-functionality.js`

### 删除的过时编辑器说明

- `ARPEGGIO_OPTIMIZATION_REPORT.md`
- `ENHANCED_VISUALIZER_SUMMARY.md`
- `integration-guide.md`

### 精准修改而非删除

- `README.md`：移除自定义编辑器、编辑器测试、预设保存和故障排除中的过时说明；保留手势琶音演奏介绍。
- `debug-main.html`：删除对已退役编辑器的按钮、函数、事件元素和父窗口对象探测；保留 Tone.js、日志与控制台调试能力。

### 明确保留

- `MusicManager.js` 以及 `music/` 下的现场演奏逻辑。
- `game.js` 中调用 `startArpeggio`、`updateArpeggioVolume` 和 `stopArpeggio` 的手势逻辑。
- `DrumManager.js`、节奏空间和鼓组切换逻辑。
- 当前 `index.html`、`main.js`、`styles.css` 的 Exhibition V2 界面。
- `docs/superpowers` 中记录编辑器退役过程的历史文档。
- 与本次编辑器清理无关的独立调试和波形实验文件。

## 验证设计

实施时先增加一个会失败的回归测试，证明上述遗留文件当前仍存在，然后再执行删除：

1. 断言主页面没有编辑器按钮、弹窗和脚本引用。
2. 断言运行入口没有 `ArpeggioEditor` 或 `CustomEditor` 导入。
3. 断言本设计列出的遗留实现、演示和测试文件不存在。
4. 断言现场琶音演奏方法和鼓机入口仍然存在。
5. 运行该定向测试，再运行完整 `npm test` 测试集。
6. 检查 Git 变更范围，确保没有触碰 OneDrive、部署配置或其他功能模块。

## 预期用户体验

线上和本地 Exhibition V2 的可见界面不发生变化。用户仍通过左手和场景预设演奏琶音，
通过右手和节奏空间控制鼓机，并继续使用录音、分享、动作指引和高级控制。
唯一变化是仓库和未来发布包不再携带已退役的编辑器文件，README 也不再描述不存在的入口。
