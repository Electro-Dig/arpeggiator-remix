# Arpeggiator Remix

> A browser-based gesture-controlled arpeggiator, drum machine, and real-time visualizer.

[中文说明](#中文说明)

## Demo

- Live demo: not published yet
- Local demo: run the project locally and open it in a browser with camera access
- Media to add: a short performance GIF showing both-hand control

## Overview

Arpeggiator Remix turns webcam hand tracking into a small browser instrument. One hand performs a melodic arpeggiator, while the other hand shapes drum patterns and rhythmic energy. The project explores how simple hand gestures can become a playable interface for Web Audio, real-time visuals, and generative music sketches.

The current version is a prototype for performance, teaching, and experimentation rather than a polished product.

## Interaction Model

| Input | Effect |
|---|---|
| Left hand height | Moves the arpeggio through pitch/register space |
| Left thumb-index pinch | Controls arpeggio volume/intensity |
| Left fist | Cycles synth / music presets |
| Right index finger | Controls the kick drum voice |
| Right middle finger | Controls the snare drum voice |
| Right ring finger | Controls the hi-hat voice |
| Right pinky finger | Controls the clap voice |
| Four-finger vertical gesture | Switches arpeggio style |
| Right fist | Cycles drum presets |

## Features

- Real-time two-hand tracking with MediaPipe
- Browser-based arpeggiator and drum machine
- Tone.js / Web Audio sound generation
- Visual feedback for hand movement and audio activity
- Preset switching for synth and drum behavior
- Custom arpeggio and drum pattern editors
- Camera fallback / no-camera mode for editing patterns

## Tech Stack

- JavaScript / HTML / CSS
- MediaPipe Tasks Vision for hand tracking
- Tone.js and Web Audio for synthesis and sequencing
- Three.js-style visual interaction layer
- Express local server for development

## Run Locally

```bash
npm install
npm run dev
```

Then open:

```text
https://localhost:8000
```

The development server uses a local HTTPS setup for camera access. Your browser may show a self-signed certificate warning.

## Camera and Privacy

The app requires camera permission for hand tracking. Camera frames are used locally in the browser for MediaPipe hand landmark detection. The project does not intentionally upload camera video to a backend.

## Project Status

Prototype / active experiment.

Recommended next improvements:

- Publish a live demo
- Add screenshots and a short performance GIF
- Remove committed `node_modules` from the repository and rely on `npm install`
- Document the custom editor workflow in more detail

## Credits

This repository directly references and remixes [collidingScopes/arpeggiator](https://github.com/collidingScopes/arpeggiator), a hand-controlled arpeggiator, drum machine, and audio-reactive visualizer built with MediaPipe, Three.js, and Tone.js.

This remix adapts the idea into the Electro-Dig context with custom pattern editors, additional preset workflows, bilingual documentation, and ongoing experiments around gesture-controlled music interfaces.

Built with MediaPipe, Tone.js, browser Web Audio, and the creative-coding tradition of turning everyday gestures into musical control signals.

## License

No license has been specified yet. The directly referenced upstream repository also does not currently expose a GitHub-detected license, so clarify licensing before broader redistribution or reuse.

---

# 中文说明

> 一个基于浏览器的手势控制琶音器、鼓机与实时可视化乐器原型。

## 演示

- 在线演示：暂未发布
- 本地演示：本地运行后在浏览器中打开，并允许摄像头权限
- 建议补充素材：一段展示双手控制的 10-30 秒 GIF

## 项目概述

Arpeggiator Remix 把摄像头手势识别变成一个小型浏览器乐器：一只手控制旋律琶音，另一只手控制鼓机节奏。项目探索的是：如何用简单、直觉化的身体动作控制 Web Audio、实时视觉和生成音乐。

当前版本更接近可演示的创意编码原型，适合表演实验、教学展示和交互音乐研究。

## 交互方式

| 输入 | 效果 |
|---|---|
| 左手高度 | 控制琶音的音高 / 音区 |
| 左手拇指与食指捏合 | 控制琶音音量 / 强度 |
| 左手握拳 | 切换合成器或音乐预设 |
| 右手食指 | 控制 Kick / 底鼓 |
| 右手中指 | 控制 Snare / 军鼓 |
| 右手无名指 | 控制 Hi-hat / 踩镲 |
| 右手小指 | 控制 Clap / 拍手声 |
| 右手四指竖直手势 | 切换琶音风格 |
| 右手握拳 | 切换鼓组预设 |

## 功能

- 使用 MediaPipe 进行实时双手追踪
- 浏览器内置琶音器与鼓机
- 使用 Tone.js / Web Audio 生成声音
- 手势与音频活动的实时视觉反馈
- 合成器与鼓组预设切换
- 自定义琶音与鼓机 pattern 编辑器
- 摄像头异常时的无摄像头编辑模式

## 技术栈

- JavaScript / HTML / CSS
- MediaPipe Tasks Vision 手势识别
- Tone.js 与 Web Audio 音频合成和 sequencing
- Three.js 风格的视觉交互层
- Express 本地开发服务器

## 本地运行

```bash
npm install
npm run dev
```

然后打开：

```text
https://localhost:8000
```

为了让摄像头权限正常工作，开发服务器会尝试使用本地 HTTPS。浏览器可能会提示自签名证书警告。

## 摄像头与隐私

项目需要摄像头权限来识别手势。摄像头画面只用于浏览器本地的 MediaPipe 手部关键点检测；项目本身不会主动把摄像头视频上传到后端。

## 项目状态

原型 / 持续实验中。

建议下一步：

- 发布在线 demo
- 增加截图和表演 GIF
- 从仓库中移除已提交的 `node_modules`，改为依赖 `npm install`
- 更详细地说明自定义编辑器的使用流程

## 致谢

本仓库直接参考并改编自 [collidingScopes/arpeggiator](https://github.com/collidingScopes/arpeggiator)。原项目是一个基于 MediaPipe、Three.js 和 Tone.js 的手势控制琶音器、鼓机与音频响应可视化器。

这个 remix 版本将其放入 Electro-Dig 的创作语境中，加入了自定义 pattern 编辑器、更多 preset 工作流、中英双语文档，以及围绕手势控制音乐界面的持续实验。

项目使用 MediaPipe、Tone.js、Web Audio，并延续了 creative coding 中“把日常身体动作转化为音乐控制信号”的创作思路。

## License

暂未指定 license。直接参考的上游仓库目前也没有 GitHub 识别到的 license，因此在更广泛分发或复用代码前，需要进一步确认授权方式。