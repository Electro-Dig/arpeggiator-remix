# Recording HUD and Cancel Gesture Design

## Goal

正式录音时不遮挡演奏画面，只在左上角 HUD 显示轻量录制状态和 60 秒倒计时；双手拇指向下统一表示取消并回到自由模式，不再触发自动重录。

## Root cause

`RecordingController.startCountdown()` 打开 `recording-dialog`，但进入 `recording` 阶段时 `beginRecording()` 没有关闭它。因此倒计时弹层继续保持 modal 状态，遮挡摄像头画面和演奏反馈。

## Interaction lifecycle

| 阶段 | 中央弹层 | 左上角 HUD | 👍👍 | 👎👎 |
| --- | --- | --- | --- | --- |
| `idle` | 无 | `READY 00:00` | 开始倒计时 | 无动作 |
| `countdown` | 显示 `3 → 2 → 1` | `COUNTDOWN 00:03…` | 无动作 | 取消，回到 `idle` |
| `recording` | 无 | 红色 `● REC 00:60…00:00` | 结束并进入试听 | 取消、丢弃本次录音并回到 `idle` |
| `stopping` | 无 | `SAVING` | 禁用 | 禁用 |
| `review` | 显示试听界面 | `REVIEW` | 确认分享 | 丢弃并回到 `idle` |

试听页中的“重新录制”按钮继续保留，方便不使用手势时主动重录；手势不再承担“重录”语义。

## Visual treatment

- 复用现有 `.rec-status`，不新增浮层或大型组件。
- 录制阶段将状态灯和 `REC` 文字切换为 `--record` 红色。
- 只为状态灯增加克制的明暗呼吸，遵守 `prefers-reduced-motion`。
- 倒计时显示剩余时间，而不是已录制时间；开始时为 `00:60`。
- 中央录音弹层只用于倒计时和录后试听。

## State and Blob behavior

- `recording + CANCEL_REQUEST` 进入 `stopping`，调用一次 `MediaRecorder.stop()`。
- stop 事件返回后不创建试听 Blob、不创建 object URL，清除当前和上一条 take，关闭弹层并回到 `idle`。
- 正常停止仍保留 Blob 并打开试听页。
- 60 秒自动停止等同正常停止，进入试听页。

## Tests

- 状态机：录制中的 `both-down` 映射为 `CANCEL_REQUEST`；试听中的 `both-down` 映射为 `DISCARD_REQUEST`。
- 控制器：倒计时结束后弹层关闭；正常停止后弹层重新打开。
- 控制器：录制中取消只调用一次 recorder stop，丢弃 Blob 并回到 `idle`。
- UI 契约：现有录音状态区暴露 `data-phase="recording"`，样式包含 REC 状态和 reduced-motion 保护。
- 全量回归：试听、下载、MIME、邀请保护、指引和既有 HUD 测试继续通过。
