# 无邀请码公开站点设计

## 目标

创建独立的 `https://arpeggiator-remix.netlify.app/`，完整复用当前 `arpeggiator-remix-2` 的应用功能与界面，但不要求邀请码。现有 `arpeggiator-remix-2` 继续使用邀请码保护，部署和访问行为不得改变。

## 架构

- 保留现有 `netlify.toml`、录音 API 重写、分享页重写及安全响应头，两个站点继续使用同一份部署配置。
- 在 `invite-gate` Edge Function 增加严格的站点级开关：只有 `PUBLIC_ACCESS` 的值精确等于字符串 `true` 时才直接放行请求；变量缺失、拼写错误或任何其他值都继续执行现有邀请码门禁。
- 新站使用独立 Netlify Site ID，站点名称固定为 `arpeggiator-remix`。
- 从 `arpeggiator-remix-2` 安全克隆站点环境变量，使录音上传、二维码和 24 小时分享链路保持可用；克隆后从新站删除 `INVITE_CODE`、`INVITE_CODES` 和 `INVITE_SECRET`，再只给新站设置 `PUBLIC_ACCESS=true`。
- 发布新站时必须显式指定新站 Site ID，避免修改当前工作区的默认链接或误部署到旧站。
- 将分享页中硬编码的旧站返回地址改为相对路径 `/`，确保两个站点分别返回各自首页。

## 行为与安全边界

- 新站根路径直接加载演奏界面，不重定向到 `/__invite`。
- 新站保留 `X-Robots-Tag: noindex, nofollow, noarchive` 及现有安全响应头。
- `/recordings-api/*`、`/r/audio/*`、`/r/poster/*` 和 `/r/*` 继续使用原有重写规则。
- 公开站允许访客使用录音上传功能；后端仍执行文件大小、MIME、签名和过期清理校验。
- 旧站不设置 `PUBLIC_ACCESS`，继续执行邀请码函数；旧站环境变量和生产部署均不修改。

## 验证

1. 门禁单元测试证明 `PUBLIC_ACCESS=true` 时匿名根请求直接放行。
2. 门禁单元测试证明变量缺失及非精确值时仍执行现有邀请码门禁。
3. 页面契约测试证明分享页返回链接为 `/`，没有硬编码任一 Netlify 站点。
4. 完整自动化测试必须通过。
5. 新站生产部署后，匿名请求 `/` 返回应用页面而非邀请码页面。
6. 新站关键静态资源返回 200；旧站匿名访问仍进入邀请码门禁。

## 发布与回滚

- 先创建名为 `arpeggiator-remix` 的独立 Netlify 站点以占用子域名。
- 克隆 `arpeggiator-remix-2` 的环境变量到新站，不在日志中输出变量值；随后删除新站的邀请码变量。
- 使用同一份项目配置部署到新 Site ID，并记录 deploy ID。
- 若验证失败，仅回滚或停用新站；旧站不受影响。
