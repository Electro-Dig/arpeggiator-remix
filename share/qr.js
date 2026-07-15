const loadDefaultQr = () => import('https://esm.sh/qrcode@1.5.4');
const createDefaultCanvas = () => document.createElement('canvas');

export const POSTER_SIZE = Object.freeze({ width: 1080, height: 1440 });
export const COVER_HEIGHT = 1040;
export const QR_RECT = Object.freeze({ x: 760, y: 1110, size: 248 });
export const MAX_POSTER_BYTES = 2 * 1024 * 1024;

function sourceDimensions(source) {
  return {
    width: Number(source?.naturalWidth || source?.videoWidth || source?.width || 0),
    height: Number(source?.naturalHeight || source?.videoHeight || source?.height || 0),
  };
}

function drawImageCover(context, source, x, y, width, height) {
  const dimensions = sourceDimensions(source);
  if (dimensions.width <= 0 || dimensions.height <= 0) return false;
  const sourceRatio = dimensions.width / dimensions.height;
  const targetRatio = width / height;
  let sx = 0;
  let sy = 0;
  let sw = dimensions.width;
  let sh = dimensions.height;
  if (sourceRatio > targetRatio) {
    sw = dimensions.height * targetRatio;
    sx = (dimensions.width - sw) / 2;
  } else {
    sh = dimensions.width / targetRatio;
    sy = (dimensions.height - sh) / 2;
  }
  context.drawImage(source, sx, sy, sw, sh, x, y, width, height);
  return true;
}

function drawGrid(context) {
  context.save();
  context.strokeStyle = 'rgba(128, 231, 236, 0.2)';
  context.lineWidth = 1;
  for (let x = 0; x <= POSTER_SIZE.width; x += 72) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, COVER_HEIGHT);
    context.stroke();
  }
  for (let y = 0; y <= COVER_HEIGHT; y += 72) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(POSTER_SIZE.width, y);
    context.stroke();
  }
  context.restore();
}

function drawPerformanceFingerprint(context) {
  const points = [
    [102, 824], [220, 744], [344, 786], [474, 650],
    [610, 702], [742, 558], [880, 616], [986, 484],
  ];
  context.save();
  context.strokeStyle = '#80e7ec';
  context.lineWidth = 6;
  context.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.stroke();
  for (const [x, y] of points) {
    context.beginPath();
    context.fillStyle = '#ff8a64';
    context.arc(x, y, 12, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

function drawAbstractCover(context) {
  context.fillStyle = '#b8d8d5';
  context.fillRect(0, 0, POSTER_SIZE.width, COVER_HEIGHT);
  context.fillStyle = '#17636a';
  context.fillRect(0, 0, 278, COVER_HEIGHT);
  context.fillStyle = '#e86d4c';
  context.fillRect(808, 0, 272, 438);
  context.fillStyle = '#ffba57';
  context.fillRect(664, 652, 190, 388);
  context.fillStyle = '#102025';
  context.fillRect(334, 286, 326, 20);
  context.fillRect(334, 334, 244, 20);
}

function drawCover(context, photo, formattedNumber) {
  context.fillStyle = '#102025';
  context.fillRect(0, 0, POSTER_SIZE.width, COVER_HEIGHT);
  if (photo && drawImageCover(context, photo, 0, 0, POSTER_SIZE.width, COVER_HEIGHT)) {
    context.fillStyle = 'rgba(8, 28, 31, 0.34)';
    context.fillRect(0, 0, POSTER_SIZE.width, COVER_HEIGHT);
  } else {
    drawAbstractCover(context);
  }
  drawGrid(context);
  drawPerformanceFingerprint(context);

  context.fillStyle = '#f2efe8';
  context.textBaseline = 'alphabetic';
  context.textAlign = 'left';
  context.font = '700 24px "Cascadia Mono", Consolas, monospace';
  context.fillText('WAIC 双手乐队 / LIVE TAKE', 56, 68);
  context.textAlign = 'right';
  context.fillText(`PLAYER ${formattedNumber}`, 1024, 68);
}

function drawTicket(context, formattedNumber, durationMs) {
  const seconds = Math.max(0, Math.round(Number(durationMs) / 1000));
  const duration = String(seconds).padStart(2, '0');
  context.fillStyle = '#e7efea';
  context.fillRect(0, COVER_HEIGHT, POSTER_SIZE.width, POSTER_SIZE.height - COVER_HEIGHT);
  context.fillStyle = '#102025';
  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';
  context.font = '650 54px "Microsoft YaHei", "PingFang SC", sans-serif';
  context.fillText('这是我的现场单曲', 64, 1134);
  context.fillStyle = '#17636a';
  context.font = '650 34px "Microsoft YaHei", "PingFang SC", sans-serif';
  context.fillText(`你是本场第 ${formattedNumber} 位音乐玩家`, 64, 1202);
  context.fillStyle = '#e86d4c';
  context.font = '700 24px "Cascadia Mono", Consolas, monospace';
  context.fillText(`TAKE ${formattedNumber} · ${duration} SEC`, 64, 1270);
  context.fillStyle = '#5e7477';
  context.font = '600 22px "Microsoft YaHei", "PingFang SC", sans-serif';
  context.fillText('扫码试听与下载 · 24H', 64, 1366);
}

export async function renderQr(canvas, value, {
  loadQr = loadDefaultQr,
  createCanvas = createDefaultCanvas,
  photo = null,
  checkinNumber = 1,
  durationMs = 0,
} = {}) {
  const { toCanvas } = await loadQr();
  const context = canvas.getContext('2d');
  const qrCanvas = createCanvas();
  const number = Number.isSafeInteger(checkinNumber) && checkinNumber > 0
    ? checkinNumber
    : 1;
  const formattedNumber = String(number).padStart(3, '0');

  canvas.width = POSTER_SIZE.width;
  canvas.height = POSTER_SIZE.height;
  drawCover(context, photo, formattedNumber);
  drawTicket(context, formattedNumber, durationMs);

  await toCanvas(qrCanvas, value, {
    width: QR_RECT.size,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#102025', light: '#e7efea' },
  });
  context.drawImage(qrCanvas, QR_RECT.x, QR_RECT.y, QR_RECT.size, QR_RECT.size);
  return canvas;
}

function serializeCanvas(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    if (typeof canvas?.toBlob !== 'function') {
      reject(new Error('当前浏览器无法导出分享海报'));
      return;
    }
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('分享海报导出失败'));
    }, type, quality);
  });
}

export async function canvasToPosterBlob(canvas, {
  maxBytes = MAX_POSTER_BYTES,
} = {}) {
  let blob = await serializeCanvas(canvas, 'image/webp', 0.86);
  if (blob.size > maxBytes) blob = await serializeCanvas(canvas, 'image/webp', 0.78);
  if (blob.size > maxBytes) throw new Error('分享海报文件过大，请使用无照片封面重试');
  return blob;
}
