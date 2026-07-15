const RECORDING_TOKEN = /^[A-Za-z0-9_-]{32,128}$/;
const POSTER_TYPES = new Set(['image/webp', 'image/jpeg']);
const MAX_POSTER_BYTES = 2 * 1024 * 1024;

function createUploadError(status, cause) {
  let message = '云端暂时不可用，请重试或下载到本机';
  if (status === 413) message = '录音文件超过 5 MB，请缩短录制时间';
  if (status === 415) message = '当前录音格式无法上传，请下载到本机';

  return Object.assign(new Error(message), { status, cause });
}

export async function uploadRecording(
  blob,
  fetchImpl = fetch,
  origin = location.origin,
) {
  let response;
  try {
    response = await fetchImpl('/recordings-api/upload', {
      method: 'POST',
      headers: { 'content-type': blob.type },
      body: blob,
    });
  } catch (cause) {
    throw createUploadError(0, cause);
  }

  if (!response.ok) throw createUploadError(response.status);

  let result;
  try {
    result = await response.json();
  } catch (cause) {
    throw Object.assign(new Error('分享响应无效，请重试或下载到本机'), { cause });
  }

  if (
    !RECORDING_TOKEN.test(String(result?.token || ''))
    || !Number.isFinite(Number(result?.expiresAt))
    || !Number.isSafeInteger(result?.checkinNumber)
    || result.checkinNumber <= 0
  ) {
    throw new Error('分享响应无效，请重试或下载到本机');
  }

  return {
    token: result.token,
    expiresAt: Number(result.expiresAt),
    checkinNumber: result.checkinNumber,
    shareUrl: new URL(`/r/${result.token}`, origin).toString(),
  };
}

export async function uploadRecordingPoster(token, blob, fetchImpl = fetch) {
  if (!RECORDING_TOKEN.test(String(token || ''))) {
    throw new Error('分享令牌无效，请重新上传录音');
  }
  if (!POSTER_TYPES.has(blob?.type)) {
    throw new Error('当前海报格式无法上传');
  }
  if (!blob.size || blob.size > MAX_POSTER_BYTES) {
    throw new Error('分享海报文件过大，请重新生成');
  }

  let response;
  try {
    response = await fetchImpl(`/recordings-api/poster/${token}`, {
      method: 'POST',
      headers: { 'content-type': blob.type },
      body: blob,
    });
  } catch (cause) {
    throw Object.assign(new Error('海报云端暂时不可用，请重试'), { status: 0, cause });
  }
  if (!response.ok) {
    throw Object.assign(new Error('海报云端暂时不可用，请重试'), { status: response.status });
  }
  try {
    return await response.json();
  } catch {
    return { ok: true };
  }
}
