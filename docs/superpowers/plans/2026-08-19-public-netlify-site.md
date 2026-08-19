# 无邀请码公开站点 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建 `https://arpeggiator-remix.netlify.app/`，完整复用当前应用但匿名访问无需邀请码，同时保持 `arpeggiator-remix-2` 的门禁不变。

**Architecture:** 现有 `invite-gate` 增加默认关闭、严格匹配的 `PUBLIC_ACCESS=true` 服务端开关；只在新 Netlify Site 设置该变量。两个站点继续复用同一份代码、重写规则和录音函数，分享页返回链接改为站点相对地址。

**Tech Stack:** JavaScript ES modules, Node.js test runner, Netlify Edge Functions, Netlify CLI.

## Global Constraints

- `PUBLIC_ACCESS` 只有精确值 `true` 才放行；缺失或其他值必须 fail closed。
- 不修改或重新部署 `arpeggiator-remix-2`。
- 新站只通过显式 Site ID 部署，不改项目现有 `.netlify/state.json`。
- 不在命令输出、文件或提交中暴露任何环境变量值。
- 公开站继续发送 `noindex` 与现有安全响应头。

---

### Task 1: 公开访问与站点相对链接契约

**Files:**
- Modify: `tests/invite-gate.test.mjs`
- Modify: `tests/share-page.test.mjs`

**Interfaces:**
- Consumes: `inviteGate(request, { next }) -> Promise<Response>`；`Netlify.env.get(name) -> string`。
- Produces: 对 `PUBLIC_ACCESS` 严格开关和分享页相对首页链接的回归契约。

- [ ] **Step 1: 写入公开访问失败测试**

在 `tests/invite-gate.test.mjs` 的环境桩中增加可变的 `publicAccess`，并增加：

```js
let publicAccess = '';

// Netlify.env.get 内：
if (name === 'PUBLIC_ACCESS') return publicAccess;

test('public access bypasses the invite boundary only for the exact true value', async () => {
  const next = () => new Response('app');
  publicAccess = 'true';
  try {
    const response = await inviteGate(new Request('https://example.test/'), { next });
    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'app');
  } finally {
    publicAccess = '';
  }

  publicAccess = 'TRUE';
  try {
    const response = await inviteGate(new Request('https://example.test/'), { next });
    assert.equal(response.status, 303);
    assert.match(response.headers.get('location'), /\/__invite/);
  } finally {
    publicAccess = '';
  }
});
```

- [ ] **Step 2: 写入分享页链接失败测试**

在现有 `public page stays lightweight...` 测试中增加：

```js
assert.match(html, /<a href="\/"[^>]*>WAIC 双手乐队<\/a>/);
assert.doesNotMatch(html, /arpeggiator-remix-2\.netlify\.app/);
```

- [ ] **Step 3: 运行测试并确认 RED**

Run: `node --test tests/invite-gate.test.mjs tests/share-page.test.mjs`

Expected: FAIL，因为 `PUBLIC_ACCESS=true` 仍重定向到邀请码页，且分享页仍硬编码旧站域名。

### Task 2: 最小公开模式实现

**Files:**
- Modify: `netlify/edge-functions/invite-gate.js`
- Modify: `r/index.html`
- Test: `tests/invite-gate.test.mjs`
- Test: `tests/share-page.test.mjs`

**Interfaces:**
- Consumes: `getEnv(name) -> string` 与 `withSecurityHeaders(Response) -> Response`。
- Produces: `PUBLIC_ACCESS=true` 的匿名放行行为；站点相对返回链接 `/`。

- [ ] **Step 1: 在 robots 响应之后增加严格公开开关**

在 `invite-gate.js` 的 robots 分支之后、其他路径判断之前加入：

```js
if (getEnv('PUBLIC_ACCESS') === 'true') {
  return withSecurityHeaders(await context.next());
}
```

这样 robots 仍保持 `Disallow: /`，公开页面继续获得统一安全响应头。

- [ ] **Step 2: 将分享页返回链接改为相对首页**

在 `r/index.html` 中把：

```html
<a href="https://arpeggiator-remix-2.netlify.app/" rel="noreferrer">WAIC 双手乐队</a>
```

替换为：

```html
<a href="/">WAIC 双手乐队</a>
```

- [ ] **Step 3: 运行聚焦测试并确认 GREEN**

Run: `node --test tests/invite-gate.test.mjs tests/share-page.test.mjs`

Expected: 全部 PASS。

- [ ] **Step 4: 运行完整测试与差异检查**

Run: `npm.cmd test`

Expected: 0 failures。

Run: `git diff --check`

Expected: exit 0。

- [ ] **Step 5: 提交实现**

```powershell
git add netlify/edge-functions/invite-gate.js r/index.html tests/invite-gate.test.mjs tests/share-page.test.mjs docs/superpowers/plans/2026-08-19-public-netlify-site.md
git commit -m "feat: add isolated public site access"
```

### Task 3: 创建并配置独立 Netlify 站点

**Files:**
- Remote create: Netlify site `arpeggiator-remix`
- Remote configure: site environment variables

**Interfaces:**
- Consumes: protected site ID `73fb80cc-cf94-46f6-8d1c-e8f11318b8e2`。
- Produces: PowerShell 变量 `$newSiteId`；新站包含录音代理变量、没有邀请码变量，并设置 `PUBLIC_ACCESS=true`。

- [ ] **Step 1: 从项目目录外创建精确站点名**

Run from `D:\Codex`:

```powershell
$site = netlify.cmd sites:create --name arpeggiator-remix --account-slug electro-dig --json | ConvertFrom-Json
if ($site.name -ne 'arpeggiator-remix') { throw 'Netlify 未返回预期站点名' }
$newSiteId = $site.id
```

Expected: 返回新 Site ID，URL 为 `https://arpeggiator-remix.netlify.app`；若名称已被抢占则停止，不改用其他名称。

- [ ] **Step 2: 不显示值地克隆环境变量**

```powershell
netlify.cmd env:clone --from 73fb80cc-cf94-46f6-8d1c-e8f11318b8e2 --to $newSiteId --force
```

Expected: clone success，不输出具体变量值。

- [ ] **Step 3: 在 D 盘临时控制目录链接新站**

创建 `D:\Codex\arpeggiator-remix-public-site-control`，从该目录执行：

```powershell
New-Item -ItemType Directory -Force 'D:\Codex\arpeggiator-remix-public-site-control' | Out-Null
Push-Location 'D:\Codex\arpeggiator-remix-public-site-control'
netlify.cmd link --id $newSiteId
```

Expected: 只在控制目录写入 `.netlify/state.json`，项目原有链接不变。

- [ ] **Step 4: 删除邀请码变量并设置公开开关**

从控制目录逐条执行：

```powershell
netlify.cmd env:unset INVITE_CODE --force
netlify.cmd env:unset INVITE_CODES --force
netlify.cmd env:unset INVITE_SECRET --force
netlify.cmd env:set PUBLIC_ACCESS true
```

Expected: 三个邀请码变量不存在，`PUBLIC_ACCESS` 设置成功；命令输出不得包含其他变量值。

- [ ] **Step 5: 仅输出环境变量名称进行核对**

捕获 `netlify env:list --json` 到 PowerShell 变量并解析，只输出 key 名称。Expected keys include `PUBLIC_ACCESS`, `RECORDINGS_ORIGIN`, `RECORDINGS_PROXY_SECRET`; expected keys exclude `INVITE_CODE`, `INVITE_CODES`, `INVITE_SECRET`。

### Task 4: 显式部署与双站烟雾验证

**Files:**
- Deploy source: repository root
- Deploy target: 从控制目录 `.netlify/state.json` 读取的新站 Site ID

**Interfaces:**
- Consumes: Task 2 的提交与 Task 3 的新 Site ID。
- Produces: 新站生产 deploy ID 和可访问的公开 URL。

- [ ] **Step 1: 显式部署到新 Site ID**

Run from repository root:

```powershell
$newSiteId = (Get-Content 'D:\Codex\arpeggiator-remix-public-site-control\.netlify\state.json' -Raw | ConvertFrom-Json).siteId
netlify.cmd deploy --prod --dir . --site $newSiteId --json
```

Expected: deploy state ready，生产 URL 为 `https://arpeggiator-remix.netlify.app`。

- [ ] **Step 2: 验证新站无需邀请码**

匿名请求 `/`、`/main.js`、`/r/index.html`：Expected status 200；根页面标题不是“请输入邀请码”，且无 `/__invite` 重定向。

- [ ] **Step 3: 验证新站公开录音路由存在**

向 `/recordings-api/upload` 发送空 POST：Expected status 400 `Empty recording`，证明路由无需邀请码且函数正常执行；不创建录音数据。

- [ ] **Step 4: 验证旧站仍受保护**

匿名请求 `https://arpeggiator-remix-2.netlify.app/` 且不跟随重定向：Expected status 303，`Location` 指向 `/__invite`。

- [ ] **Step 5: 核对 Git 与部署结果**

Run: `git status -sb`

Expected: 工作区干净；记录新站 Site ID、deploy ID、生产 URL和 0 失败的测试结果。
