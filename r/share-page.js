import { renderQr } from '../share/qr.js';

const TOKEN = /^[A-Za-z0-9_-]{32,128}$/;

function sharedRecordingError(status) {
  const message = status === 410 || status === 404
    ? '这段录音已失效或不存在。'
    : '录音暂时无法读取，请稍后重试。';
  return Object.assign(new Error(message), { status });
}

export function parseShareToken(pathname) {
  const match = String(pathname).match(/^\/r\/([A-Za-z0-9_-]{32,128})\/?$/);
  return match && TOKEN.test(match[1]) ? match[1] : null;
}

export function takeLabelForToken(token) {
  return `TAKE ${String(token || '').slice(2, 6).toUpperCase()}`;
}

export async function downloadPoster({
  token,
  url,
  render = renderQr,
  root = document,
} = {}) {
  const canvas = root.createElement('canvas');
  await render(canvas, url, {
    takeLabel: takeLabelForToken(token),
    projectName: 'ARPEGGIATOR REMIX',
  });
  const link = root.createElement('a');
  link.download = `arpeggiator-remix-${takeLabelForToken(token).replace(' ', '-').toLowerCase()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.hidden = true;
  root.body.appendChild(link);
  link.click();
  link.remove();
}

export async function probeSharedRecording(token, fetchImpl = fetch) {
  if (!TOKEN.test(String(token))) throw sharedRecordingError(400);

  const audioUrl = `/r/audio/${token}`;

  let response;
  try {
    response = await fetchImpl(audioUrl, {
      headers: { range: 'bytes=0-0' },
    });
  } catch (cause) {
    throw Object.assign(sharedRecordingError(503), { cause });
  }

  if (!response.ok) throw sharedRecordingError(response.status);
  const expiresAt = Number(response.headers.get('x-recording-expires-at'));
  return {
    audioUrl,
    expiresAt: Number.isFinite(expiresAt) && expiresAt > 0 ? expiresAt : null,
    mime: (response.headers.get('content-type') || 'audio/webm').split(';')[0],
  };
}

function formatExpiry(expiresAt) {
  if (!expiresAt) return '录音将在上传后 24 小时内自动失效';
  return `有效至 ${new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(expiresAt))}`;
}

function extensionFor(type) {
  if (type.includes('mp4')) return 'm4a';
  if (type.includes('ogg')) return 'ogg';
  return 'webm';
}

async function initSharePage() {
  const status = document.querySelector('#share-status');
  const player = document.querySelector('#shared-recording');
  const download = document.querySelector('#download-recording');
  const expiry = document.querySelector('#recording-expiry');
  const takeLabel = document.querySelector('#share-take-label');
  const posterButton = document.querySelector('#download-poster');
  const token = parseShareToken(location.pathname);

  if (!token) {
    status.textContent = '分享链接无效。';
    status.dataset.state = 'error';
    return;
  }

  try {
    takeLabel.textContent = takeLabelForToken(token);
    const result = await probeSharedRecording(token);
    player.src = result.audioUrl;
    player.hidden = false;
    download.href = result.audioUrl;
    download.download = `arpeggiator-remix.${extensionFor(result.mime)}`;
    download.hidden = false;
    posterButton.hidden = false;
    expiry.textContent = formatExpiry(result.expiresAt);
    status.textContent = '正在准备播放…';
    status.dataset.state = 'loading';

    const markReady = () => {
      status.textContent = '录音已就绪';
      status.dataset.state = 'ready';
    };
    player.addEventListener('loadedmetadata', markReady, { once: true });
    player.addEventListener('canplay', markReady, { once: true });
    player.addEventListener('error', () => {
      status.textContent = '音频加载失败，请刷新后重试。';
      status.dataset.state = 'error';
    });
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
  } catch (error) {
    status.textContent = error.message;
    status.dataset.state = 'error';
    expiry.textContent = error.status === 410 ? '该链接已超过 24 小时有效期' : '';
  }
}

if (typeof document !== 'undefined') {
  initSharePage();
}
