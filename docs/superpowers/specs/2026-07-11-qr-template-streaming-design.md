# QR 海报模板与流式播放设计

## 已批准视觉

采用用户选定的“四色积木节奏”方形海报：暖米色纸张、蓝红黄绿几何块、左右手势、琶音阶梯与鼓点网格。左上蓝色方框是唯一二维码安全区，底部米色横条用于确定性绘制状态和有效期。运行时不得用生成模型绘制二维码或文字。

## 二维码合成

- 模板作为静态项目资产保存为 `assets/qr-share-template-bauhaus.png`。
- `share/qr.js` 延迟加载二维码库和模板图片。
- 先把模板绘制到 1254×1254 主 Canvas，再在左上安全区绘制独立 QR Canvas。
- QR 使用黑色模块和与模板一致的暖米白底色，保留标准 quiet zone。
- 分享链接、复制按钮和有效期放在海报 Canvas 下方，不再与二维码并排。

## 流式播放

- 分享页不再下载完整 Blob 后创建 Object URL。
- 页面先发送 `Range: bytes=0-0` 预检，以极小响应确认 token、MIME 和有效期。
- 预检成功后 `<audio>` 与下载链接直接指向 `/r/audio/<token>`。
- Netlify 代理转发 Range，并只透传 `Accept-Ranges`、`Content-Range`、`Content-Length`、MIME 和有效期等安全响应头。
- Node 服务支持单段 byte range：正常范围返回 206，无效范围返回 416，普通 GET 保持 200。

## 用户状态

- 预检阶段：`正在连接录音…`
- 已设置直接音频 URL但尚未获得 metadata：`正在准备播放…`
- `loadedmetadata`/`canplay`：`录音已就绪`
- 404/410：明确显示失效；网络问题保留重试语义。

## 验收

- 录制结果弹窗在桌面尺寸无文字/二维码重叠。
- 二维码仍能扫描到当前分享 URL。
- 手机首次加载只需一字节预检，不再等待完整音频 Blob。
- 浏览器对音频发出 Range 请求，能够拖动时间轴；若个别 WebM 仍不可 seek，再单独处理容器 duration metadata。
- 所有变更只部署到 `feature/exhibition-v2` 的 Draft Deploy。
