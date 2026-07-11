const TEMPLATE_URL = '/assets/qr-share-template-waic-mint.webp';
const loadDefaultQr = () => import('https://esm.sh/qrcode@1.5.4');

export const POSTER_SIZE = Object.freeze({ width: 1080, height: 1440 });
export const QR_RECT = Object.freeze({ x: 96, y: 96, size: 370 });

function loadDefaultTemplate(source = TEMPLATE_URL) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.addEventListener('load', () => resolve(image), { once: true });
    image.addEventListener('error', () => reject(new Error('二维码海报模板加载失败')), { once: true });
    image.src = source;
  });
}

const createDefaultCanvas = () => document.createElement('canvas');

export async function renderQr(canvas, value, {
  loadQr = loadDefaultQr,
  loadTemplate = loadDefaultTemplate,
  createCanvas = createDefaultCanvas,
  checkinNumber = 1,
} = {}) {
  const [{ toCanvas }, template] = await Promise.all([
    loadQr(),
    loadTemplate(TEMPLATE_URL),
  ]);
  const context = canvas.getContext('2d');
  const qrCanvas = createCanvas();

  canvas.width = POSTER_SIZE.width;
  canvas.height = POSTER_SIZE.height;
  context.drawImage(template, 0, 0, POSTER_SIZE.width, POSTER_SIZE.width);
  await toCanvas(qrCanvas, value, {
    width: QR_RECT.size,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#142b30',
      light: '#e7efea',
    },
  });
  context.drawImage(
    qrCanvas,
    QR_RECT.x,
    QR_RECT.y,
    QR_RECT.size,
    QR_RECT.size,
  );
  const number = Number.isSafeInteger(checkinNumber) && checkinNumber > 0
    ? checkinNumber
    : 1;
  const formattedNumber = String(number).padStart(3, '0');
  context.fillStyle = '#e7efea';
  context.fillRect(0, 1080, 1080, 360);
  context.fillStyle = '#142b30';
  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';
  context.font = '700 44px "Microsoft YaHei", "PingFang SC", sans-serif';
  context.fillText('WAIC 双手乐队', 72, 1168);
  context.fillStyle = '#17636a';
  context.font = '700 32px "Microsoft YaHei", "PingFang SC", sans-serif';
  context.fillText('欢迎打卡', 72, 1230);
  context.fillStyle = '#142b30';
  context.font = '650 38px "Microsoft YaHei", "PingFang SC", sans-serif';
  context.fillText(`你是本场第 ${formattedNumber} 位音乐玩家`, 72, 1294);
  context.fillStyle = '#e86d4c';
  context.font = '700 28px "Cascadia Mono", Consolas, monospace';
  context.fillText(`TAKE ${formattedNumber}`, 72, 1350);
  context.fillStyle = '#17636a';
  context.font = '600 23px "Microsoft YaHei", "PingFang SC", sans-serif';
  context.fillText('扫码试听与下载 · 24H', 538, 1350);
}
