# Exhibition V2 Batch 3 Cloud Share Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upload an approved take through a signed same-origin proxy, show a QR code for a public 24-hour share page, and provide safe retry/download behavior when the network is unavailable.

**Architecture:** The browser posts raw compressed audio to a Netlify Function; the function enforces the 5 MB/MIME boundary, signs the request, and forwards it to a dedicated Node service at `43-159-132-70.sslip.io`. Only `/r/<token>` and `/r/audio/<token>` bypass the invite gate; the cloud API itself accepts only time-bounded HMAC requests. Audio and metadata live under `/srv/arpeggiator-recordings/data` and expire after 24 hours.

**Tech Stack:** Netlify Edge Functions and Functions v2, Web Crypto/Node crypto, native Node HTTP server, Caddy HTTPS, systemd, client-side dynamic QR module.

---

## File map

- Create `netlify/recording-signature.js`: canonical request hashing/signing/verifying.
- Create `netlify/functions/recordings-api.mjs`: protected upload and public token-audio proxy.
- Create `tests/recording-signature.test.mjs`, `tests/recordings-proxy.test.mjs`: signature, size, MIME, and route tests.
- Create `share/recordings-client.js`, `share/qr.js`: browser upload and lazy QR loading.
- Create `r/index.html`, `r/share.css`, `r/share-page.js`: public mobile share surface.
- Create `services/recordings-api/server.mjs`, `services/recordings-api/storage.mjs`, `services/recordings-api/storage.test.mjs`: HMAC-authenticated storage API.
- Create `ops/recordings/Caddyfile`, `ops/recordings/arpeggiator-recordings.service`, `ops/recordings/arpeggiator-recordings-cleanup.service`, `ops/recordings/arpeggiator-recordings-cleanup.timer`: deployable server configuration.
- Modify `netlify/edge-functions/invite-gate.js`, `netlify.toml`, `tests/invite-gate.test.mjs`: narrow public exception and rewrites.
- Modify `RecordingController.js`, `index.html`, `styles.css`, `package.json`, `.env.example`, `README.md`: upload/retry/QR integration and operational documentation.

### Task 1: Implement one canonical HMAC protocol

**Files:**
- Create: `tests/recording-signature.test.mjs`
- Create: `netlify/recording-signature.js`

- [ ] **Step 1: Write failing signature tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { signRecordingRequest, verifyRecordingRequest } from '../netlify/recording-signature.js';

test('verifies an untampered request inside the clock window', async () => {
  const input = { secret: 'secret', timestamp: '1000', method: 'POST', path: '/v1/recordings', body: new TextEncoder().encode('audio') };
  const signature = await signRecordingRequest(input);
  assert.equal(await verifyRecordingRequest({ ...input, signature, nowSeconds: 1005 }), true);
});

test('rejects body tampering and timestamps older than 60 seconds', async () => {
  const base = { secret: 'secret', timestamp: '1000', method: 'POST', path: '/v1/recordings', body: new TextEncoder().encode('audio') };
  const signature = await signRecordingRequest(base);
  assert.equal(await verifyRecordingRequest({ ...base, body: new TextEncoder().encode('changed'), signature, nowSeconds: 1005 }), false);
  assert.equal(await verifyRecordingRequest({ ...base, signature, nowSeconds: 1061 }), false);
});
```

- [ ] **Step 2: Run and verify missing-module failure**

Run: `node --test tests/recording-signature.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement the canonical form and constant-time verification**

```js
const encoder = new TextEncoder();
const hex = (bytes) => [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

async function sha256(body) {
  return hex(await crypto.subtle.digest('SHA-256', body));
}

async function canonical({ timestamp, method, path, body }) {
  return `${timestamp}\n${method.toUpperCase()}\n${path}\n${await sha256(body)}`;
}

export async function signRecordingRequest(input) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(input.secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, encoder.encode(await canonical(input))));
}

export async function verifyRecordingRequest({ signature, nowSeconds, ...input }) {
  if (Math.abs(Number(input.timestamp) - nowSeconds) > 60) return false;
  const expected = await signRecordingRequest(input);
  if (expected.length !== String(signature).length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return mismatch === 0;
}
```

- [ ] **Step 4: Run and commit**

Run: `node --test tests/recording-signature.test.mjs`

Expected: PASS.

```bash
git add netlify/recording-signature.js tests/recording-signature.test.mjs
git commit -m "test: define recording proxy signatures"
```

### Task 2: Add the Netlify proxy and preserve the invite boundary

**Files:**
- Create: `netlify/functions/recordings-api.mjs`
- Create: `tests/recordings-proxy.test.mjs`
- Modify: `netlify/edge-functions/invite-gate.js`
- Modify: `tests/invite-gate.test.mjs`
- Modify: `netlify.toml`
- Modify: `.env.example`

- [ ] **Step 1: Add failing invite-boundary tests**

Append to `tests/invite-gate.test.mjs`:

```js
test('public share routes bypass invite while upload remains protected', async () => {
  const next = () => new Response('public');
  assert.equal((await inviteGate(new Request('https://example.test/r/token'), { next })).status, 200);
  assert.equal((await inviteGate(new Request('https://example.test/r/audio/token'), { next })).status, 200);
  assert.equal((await inviteGate(new Request('https://example.test/recordings-api/upload'), { next })).status, 303);
});
```

Run: `node --test tests/invite-gate.test.mjs`

Expected: FAIL because `/r/*` currently redirects to the invite page.

- [ ] **Step 2: Add the narrow public exception**

Immediately after the robots branch in `invite-gate.js`, add:

```js
if (url.pathname === '/r' || url.pathname.startsWith('/r/')) {
  return withSecurityHeaders(await context.next());
}
```

No other path is exempt. Run the invite test and expect PASS.

- [ ] **Step 3: Write proxy tests with injected `fetch`**

Test these exact cases through an exported `handleRecordingProxy(request, env, fetchImpl)`:

- upload over `5 * 1024 * 1024` returns 413 before upstream fetch;
- MIME outside `audio/mp4`, `audio/webm`, `audio/ogg` returns 415;
- upload maps to `/v1/recordings` and adds timestamp/signature headers;
- `/r/audio/<32-character-or-longer-base64url-token>` maps to `/v1/recordings/<token>`;
- malformed token returns 400;
- upstream 410 and 503 statuses pass through without revealing upstream headers.

Run: `node --test tests/recordings-proxy.test.mjs`

Expected: FAIL with missing function module.

- [ ] **Step 4: Implement the proxy**

```js
import { signRecordingRequest } from '../recording-signature.js';

const MAX_BYTES = 5 * 1024 * 1024;
const AUDIO_TYPES = new Set(['audio/mp4', 'audio/webm', 'audio/ogg']);
const TOKEN = /^[A-Za-z0-9_-]{32,128}$/;

export async function handleRecordingProxy(request, env, fetchImpl = fetch) {
  const url = new URL(request.url);
  const isUpload = url.pathname === '/recordings-api/upload' && request.method === 'POST';
  const token = url.pathname.startsWith('/r/audio/') ? url.pathname.slice('/r/audio/'.length) : '';
  if (!isUpload && !TOKEN.test(token)) return new Response('Bad request', { status: 400 });

  const body = isUpload ? new Uint8Array(await request.arrayBuffer()) : new Uint8Array();
  const mime = (request.headers.get('content-type') || '').split(';')[0].toLowerCase();
  if (isUpload && body.byteLength > MAX_BYTES) return new Response('Recording too large', { status: 413 });
  if (isUpload && !AUDIO_TYPES.has(mime)) return new Response('Unsupported recording type', { status: 415 });

  const upstreamPath = isUpload ? '/v1/recordings' : `/v1/recordings/${token}`;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = await signRecordingRequest({
    secret: env.RECORDINGS_PROXY_SECRET, timestamp, method: request.method, path: upstreamPath, body,
  });
  const upstream = await fetchImpl(`${env.RECORDINGS_ORIGIN}${upstreamPath}`, {
    method: request.method,
    headers: {
      'content-type': isUpload ? mime : 'application/octet-stream',
      'content-length': String(body.byteLength),
      'x-arp-timestamp': timestamp,
      'x-arp-signature': signature,
    },
    body: isUpload ? body : undefined,
  });
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') || 'application/octet-stream',
      'cache-control': isUpload ? 'no-store' : 'private, max-age=300',
      'x-content-type-options': 'nosniff',
    },
  });
}

export default (request) => handleRecordingProxy(request, {
  RECORDINGS_ORIGIN: Netlify.env.get('RECORDINGS_ORIGIN'),
  RECORDINGS_PROXY_SECRET: Netlify.env.get('RECORDINGS_PROXY_SECRET'),
});
```

- [ ] **Step 5: Configure rewrite order and environment documentation**

Add before other redirects in `netlify.toml`:

```toml
[[redirects]]
  from = "/recordings-api/*"
  to = "/.netlify/functions/recordings-api"
  status = 200
  force = true

[[redirects]]
  from = "/r/audio/*"
  to = "/.netlify/functions/recordings-api"
  status = 200
  force = true

[[redirects]]
  from = "/r/*"
  to = "/r/index.html"
  status = 200
```

Add to `.env.example` without real secrets:

```dotenv
RECORDINGS_ORIGIN=https://43-159-132-70.sslip.io
RECORDINGS_PROXY_SECRET=replace-with-at-least-32-random-bytes
```

- [ ] **Step 6: Run and commit**

Run: `npm test && git diff --check`

Expected: proxy and invite tests PASS; upload remains invite-protected.

```bash
git add netlify netlify.toml tests .env.example
git commit -m "feat: add signed recording proxy"
```

### Task 3: Build the 24-hour cloud storage service

**Files:**
- Create: `services/recordings-api/storage.mjs`
- Create: `services/recordings-api/server.mjs`
- Create: `services/recordings-api/storage.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write storage tests using a temporary directory**

Cover exact cases: token has at least 192 random bits (`32` base64url characters); accepted Blob is written with metadata; invalid MIME → 415; sixth megabyte → 413; unknown token → 404; expired token deletes audio and metadata then returns 410; cleanup deletes all expired entries and leaves live entries.

Use `mkdtemp`, `readFile`, and `rm` from `node:fs/promises`; never touch `/srv` in tests.

Run: `node --test services/recordings-api/storage.test.mjs`

Expected: FAIL with missing module.

- [ ] **Step 2: Implement atomic storage**

```js
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

export const MAX_BYTES = 5 * 1024 * 1024;
export const TTL_MS = 24 * 60 * 60 * 1000;
const EXT = new Map([['audio/mp4', 'm4a'], ['audio/webm', 'webm'], ['audio/ogg', 'ogg']]);

export class RecordingStore {
  constructor(root, now = Date.now) { this.root = root; this.now = now; }
  async init() { await mkdir(this.root, { recursive: true, mode: 0o750 }); }
  async put(body, mime) {
    if (!EXT.has(mime)) throw Object.assign(new Error('Unsupported type'), { status: 415 });
    if (body.byteLength > MAX_BYTES) throw Object.assign(new Error('Too large'), { status: 413 });
    const token = randomBytes(24).toString('base64url');
    const expiresAt = this.now() + TTL_MS;
    const audio = join(this.root, `${token}.${EXT.get(mime)}`);
    const temp = `${audio}.tmp`;
    await writeFile(temp, body, { mode: 0o640 });
    await rename(temp, audio);
    await writeFile(join(this.root, `${token}.json`), JSON.stringify({ token, mime, audio, expiresAt }), { mode: 0o640 });
    return { token, expiresAt };
  }
  async get(token) {
    let meta;
    try { meta = JSON.parse(await readFile(join(this.root, `${token}.json`), 'utf8')); }
    catch { throw Object.assign(new Error('Not found'), { status: 404 }); }
    if (meta.expiresAt <= this.now()) {
      await Promise.allSettled([rm(meta.audio), rm(join(this.root, `${token}.json`))]);
      throw Object.assign(new Error('Expired'), { status: 410 });
    }
    return { ...meta, body: await readFile(meta.audio) };
  }
  async cleanup() {
    const names = await readdir(this.root);
    for (const name of names.filter((value) => value.endsWith('.json'))) {
      const token = name.slice(0, -5);
      try { await this.get(token); } catch (error) { if (![404, 410].includes(error.status)) throw error; }
    }
  }
}
```

- [ ] **Step 3: Implement the authenticated HTTP routes**

`server.mjs` must read a maximum of `MAX_BYTES + 1`, verify `x-arp-timestamp` and `x-arp-signature` before mutation, and expose only:

```text
POST /v1/recordings          -> 201 { token, expiresAt }
GET  /v1/recordings/:token   -> 200 audio bytes, or 404/410
GET  /health                 -> 200 { ok: true } (localhost/Caddy health only)
```

Reuse `verifyRecordingRequest` from `netlify/recording-signature.js`; take secret from `RECORDINGS_PROXY_SECRET`, root from `RECORDINGS_DATA_DIR`, and bind to `127.0.0.1:8787`. For `node server.mjs --cleanup`, initialize the store, call `cleanup()`, and exit without listening.

- [ ] **Step 4: Include service tests in the standard suite**

Change `package.json`:

```json
"test": "node --test tests/*.test.mjs services/recordings-api/*.test.mjs"
```

Run: `npm test`

Expected: all browser logic, invite, proxy, and storage tests PASS.

- [ ] **Step 5: Commit**

```bash
git add services/recordings-api netlify/recording-signature.js package.json package-lock.json
git commit -m "feat: add expiring recording storage service"
```

### Task 4: Add the public mobile share page and lazy QR generation

**Files:**
- Create: `share/recordings-client.js`
- Create: `share/qr.js`
- Create: `r/index.html`
- Create: `r/share.css`
- Create: `r/share-page.js`
- Modify: `RecordingController.js`
- Modify: `index.html`

- [ ] **Step 1: Add browser client tests**

Test `uploadRecording(blob, fetchImpl)` sends the native Blob to `/recordings-api/upload`, returns `{ token, expiresAt, shareUrl }`, maps 413/415/503 to Chinese actionable errors, and never drops the Blob reference on rejection.

- [ ] **Step 2: Implement upload and share URL creation**

```js
export async function uploadRecording(blob, fetchImpl = fetch, origin = location.origin) {
  const response = await fetchImpl('/recordings-api/upload', {
    method: 'POST', headers: { 'content-type': blob.type }, body: blob,
  });
  if (!response.ok) {
    const message = response.status === 413 ? '录音文件超过 5 MB'
      : response.status === 415 ? '当前录音格式无法上传'
      : '云端暂时不可用，请重试或下载到本机';
    throw Object.assign(new Error(message), { status: response.status });
  }
  const result = await response.json();
  return { ...result, shareUrl: `${origin}/r/${result.token}` };
}
```

- [ ] **Step 3: Lazy-load QR only after upload success**

```js
export async function renderQr(canvas, value) {
  const { toCanvas } = await import('https://esm.sh/qrcode@1.5.4');
  await toCanvas(canvas, value, { width: 280, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#071014', light: '#edf7f9' } });
}
```

Call this only from `RecordingController` after `UPLOAD_SUCCEEDED`. Show token expiry time, a retry button on failure, the QR canvas, and a copy-link button. Keep local download visible throughout review/failure.

- [ ] **Step 4: Implement the share page**

`r/share-page.js` must extract and validate the token from `location.pathname`, set the audio source to `/r/audio/${token}`, display “链接已过期” on HTTP/media 410, display a retry action on transient failures, and render a standard `<audio controls preload="metadata">`. `r/index.html` must contain no camera, MediaPipe, Tone, or tracking imports.

- [ ] **Step 5: Run automated and mobile viewport smoke tests**

Run: `npm test && npm run start`

Expected: upload success renders QR only after response; offline upload keeps preview/download/retry; `/r/<token>` fits a 390×844 viewport; Android Chrome and iOS Safari can play/download a supported take; expired token clearly shows 410 state.

- [ ] **Step 6: Commit**

```bash
git add share r RecordingController.js index.html styles.css tests
git commit -m "feat: add qr recording share flow"
```

### Task 5: Version and deploy the isolated server service

**Files:**
- Create: `ops/recordings/Caddyfile`
- Create: `ops/recordings/arpeggiator-recordings.service`
- Create: `ops/recordings/arpeggiator-recordings-cleanup.service`
- Create: `ops/recordings/arpeggiator-recordings-cleanup.timer`
- Modify: `README.md`

- [ ] **Step 1: Add exact service configuration**

`ops/recordings/Caddyfile`:

```caddy
43-159-132-70.sslip.io {
  encode zstd gzip
  reverse_proxy 127.0.0.1:8787
  header -Server
}
```

`ops/recordings/arpeggiator-recordings.service`:

```ini
[Unit]
Description=Arpeggiator temporary recording API
After=network-online.target

[Service]
Type=simple
User=arprec
Group=arprec
WorkingDirectory=/srv/arpeggiator-recordings/app
EnvironmentFile=/etc/arpeggiator-recordings.env
Environment=RECORDINGS_DATA_DIR=/srv/arpeggiator-recordings/data
ExecStart=/usr/bin/node services/recordings-api/server.mjs
Restart=on-failure
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/srv/arpeggiator-recordings/data

[Install]
WantedBy=multi-user.target
```

Cleanup service runs the same entrypoint with `--cleanup`; timer uses `OnCalendar=hourly`, `Persistent=true`, and `RandomizedDelaySec=300`.

- [ ] **Step 2: Prepare the server without touching the podcast workspace**

Over SSH to `ubuntu@43.159.132.70`, create user `arprec`, `/srv/arpeggiator-recordings/{app,data}`, and `/etc/arpeggiator-recordings.env`; copy only the committed app/service files. Generate one 32-byte-or-longer secret and set the same value in the server environment and Netlify `RECORDINGS_PROXY_SECRET`. Do not reuse podcast credentials and do not place any file under `/home/ubuntu/podcast-knowledge`.

- [ ] **Step 3: Validate HTTPS and service isolation**

Run on server:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now arpeggiator-recordings.service arpeggiator-recordings-cleanup.timer caddy
curl --fail https://43-159-132-70.sslip.io/health
sudo systemctl --no-pager status arpeggiator-recordings.service
sudo systemctl --no-pager list-timers arpeggiator-recordings-cleanup.timer
```

Expected: health returns `{"ok":true}`; service and Caddy are active; timer has a next run; unsigned `/v1/recordings` requests return 401.

- [ ] **Step 4: Configure a Netlify branch preview only**

Set `RECORDINGS_ORIGIN` and `RECORDINGS_PROXY_SECRET` in the test deploy context, deploy `feature/exhibition-v2`, and do not promote to production.

Expected: protected app upload works after invite entry; QR share page works without invite; token is unguessable; server address/signature secret never appears in browser JavaScript or response headers.

- [ ] **Step 5: Perform expiry and outage acceptance tests**

Upload a test object with an injected short expiry in staging, verify 410 and deletion after expiry, stop the service temporarily, verify the app retains Blob/retry/download, then restart it. Check a normal 24-hour object remains available.

- [ ] **Step 6: Document and commit the operational checkpoint**

```md
## Exhibition V2 — Batch 3 checkpoint

- Public URL shape: `/r/<192-bit-token>`; no participant identity is stored.
- Maximum upload: 5 MB; allowed formats: MP4/M4A, WebM/Opus, OGG/Opus.
- Retention: 24 hours, enforced on read and by hourly cleanup.
- Browser → Netlify → cloud requests are signed; the cloud API rejects unsigned calls.
- The recording Blob remains available for retry or manual download during outages.
```

Run: `npm test && git diff --check`

Expected: all tests PASS.

```bash
git add ops/recordings README.md
git commit -m "ops: add recording service deployment"
```
