# Arpeggiator Remix

在摄像头前用双手演奏的音视频乐器：左手弹琶音旋律，右手推动鼓机节奏，双手手势控制混音效果。

**在线体验：** https://arpeggiator-remix.netlify.app/

该项目受邀参展 2026 WAIC 世界人工智能大会。

## 玩法

站在屏幕正前方，让双手完整进入画面。

| 手 | 动作 | 控制 |
|---|---|---|
| 左手 | 上下移动 | 琶音根音（HUD 上的 ROOT） |
| 左手 | 左右移动 | 音色明暗 |
| 左手 | 拇指与食指捏合 | 旋律音量 |
| 左手 | 拇指与中指捏合 | Delay |
| 左手 | 拇指与无名指捏合 | Glitch |
| 左手 | 握拳 | 切换旋律音色 |
| 左手 | 四指并拢竖直 | 切换音乐场景 |
| 右手 | 在画面中移动 | 二维节奏空间：横向 STRAIGHT → BROKEN，纵向 MINIMAL → ENERGY |
| 右手 | 五根手指开合 | 拇指 Open Hat、食指 Kick、中指 Snare、无名指 Hi-hat、小指 Clap |
| 右手 | 握拳约 0.5 秒后张开 | 切换鼓组（Acoustic / Electronic / Synthwave） |
| 双手 | 两手间距 | 低通滤波，靠近变闷 |
| 双手 | 同步上举 | Reverb 渐强 |
| 双手 | 上举后快速下压 | Drop |
| 双手 | 大拇指向上 / 向下，保持 0.8 秒 | 录音的开始、停止、确认 / 取消 |

界面底部也可以直接点选六个音乐场景：Minimal Groove、Groove Pulse、Neon Drive、Arcade Horizon、Afterglow Coast、Blue Hour Drift。右上角的「高级控制」里可以选旋律音色、鼓组和各路鼓的音量，也可以关闭录音手势或鼓组切换手势。

### 录音与分享

每次最长录 60 秒，录完可以试听、重录或下载。上传后会生成带二维码的分享海报，扫码打开 `/r/<token>` 页面就能播放。服务端不保存参与者身份，录音 24 小时后自动删除，单个文件上限 5 MB。

## 本地运行

```bash
npm install
npm start
```

然后打开 http://localhost:8000/ 。不装依赖也可以用任意静态服务器，例如 `python -m http.server 8000`。

- 摄像头只在 `localhost` 或 HTTPS 下可用，推荐 Chrome 或 Edge，戴耳机效果更好。
- 录音上传和分享页依赖 Netlify 函数与录音服务，本地运行时只能下载录音。
- 运行测试：`npm test`（Node.js 自带测试运行器）。

## 目录结构

| 路径 | 内容 |
|---|---|
| `index.html`、`styles.css`、`main.js` | 页面、HUD 样式和启动入口 |
| `game.js` | 手部追踪、Three.js 画面与主循环 |
| `MusicManager.js`、`DrumManager.js` | 琶音合成与鼓机（Tone.js） |
| `music/` | 音乐场景、音色、手势到效果的映射 |
| `rhythm/` | 二维节奏空间与节奏型 |
| `drums/`、`assets/drums/` | 鼓组定义与采样 |
| `gesture/`、`recording/` | 鼓组切换手势、录音状态与拇指手势 |
| `guide/`、`assets/guide/` | 开场三步操作指引 |
| `share/`、`r/` | 二维码海报与分享页 |
| `netlify/` | 边缘函数（邀请码门禁）和录音代理函数 |
| `services/recordings-api/`、`ops/recordings/` | 录音存储服务及其服务器配置 |
| `scripts/` | 鼓组、节奏网格的生成脚本和冒烟测试 |
| `tests/` | 单元测试与契约测试 |
| `docs/` | 设计文档与开发计划 |

## 部署

站点托管在 Netlify，配置见 `netlify.toml`，环境变量示例见 `.env.example`。

- `netlify/edge-functions/invite-gate.js` 是邀请码门禁，需要 `INVITE_SECRET` 和 `INVITE_CODE`（或 `INVITE_CODES`）。站点设置 `PUBLIC_ACCESS=true` 时跳过门禁，直接公开访问。
- `/recordings-api/*` 由 `netlify/functions/recordings-api.mjs` 转发到录音服务，需要 `RECORDINGS_ORIGIN` 和 `RECORDINGS_PROXY_SECRET`。
- 录音服务部署在独立服务器上，systemd 与 Nginx 配置在 `ops/recordings/`。

## 致谢

本项目改编自 Alan（[collidingScopes](https://github.com/collidingScopes)）的开源项目 [Hand Gesture Arpeggiator](https://github.com/collidingScopes/arpeggiator)（MIT License），在其基础上重做了音乐系统、节奏空间、手势效果、录音分享和展陈界面。

- 手部追踪：[MediaPipe](https://ai.google.dev/edge/mediapipe)
- 画面：[Three.js](https://threejs.org/)
- 声音：[Tone.js](https://tonejs.github.io/)

## 作者

Built by [Electro-Dig](https://github.com/Electro-Dig) · [Instagram](https://www.instagram.com/yunlonggong1/) · [哔哩哔哩](https://space.bilibili.com/52370877) · [小红书 · 电子音乐考古小分队](https://www.xiaohongshu.com/search_result?keyword=%E7%94%B5%E5%AD%90%E9%9F%B3%E4%B9%90%E8%80%83%E5%8F%A4%E5%B0%8F%E5%88%86%E9%98%9F)

## License

MIT
