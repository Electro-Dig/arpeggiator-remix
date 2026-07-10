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

export async function fetchSharedRecording(token, fetchImpl = fetch) {
  if (!TOKEN.test(String(token))) throw sharedRecordingError(400);

  let response;
  try {
    response = await fetchImpl(`/r/audio/${token}`);
  } catch (cause) {
    throw Object.assign(sharedRecordingError(503), { cause });
  }

  if (!response.ok) throw sharedRecordingError(response.status);
  const expiresAt = Number(response.headers.get('x-recording-expires-at'));
  return {
    blob: await response.blob(),
    expiresAt: Number.isFinite(expiresAt) && expiresAt > 0 ? expiresAt : null,
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
  const token = parseShareToken(location.pathname);

  if (!token) {
    status.textContent = '分享链接无效。';
    status.dataset.state = 'error';
    return;
  }

  try {
    const result = await fetchSharedRecording(token);
    const objectUrl = URL.createObjectURL(result.blob);
    player.src = objectUrl;
    player.hidden = false;
    download.href = objectUrl;
    download.download = `arpeggiator-remix.${extensionFor(result.blob.type)}`;
    download.hidden = false;
    expiry.textContent = formatExpiry(result.expiresAt);
    status.textContent = '录音已就绪';
    status.dataset.state = 'ready';
    addEventListener('pagehide', () => URL.revokeObjectURL(objectUrl), { once: true });
  } catch (error) {
    status.textContent = error.message;
    status.dataset.state = 'error';
    expiry.textContent = error.status === 410 ? '该链接已超过 24 小时有效期' : '';
  }
}

if (typeof document !== 'undefined') {
  initSharePage();
}
