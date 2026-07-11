const TEMPLATE_URL = '/assets/qr-share-template-bauhaus.webp';
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
  takeLabel = 'LIVE TAKE',
  projectName = 'ARPEGGIATOR REMIX',
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
      dark: '#11120f',
      light: '#f5e2b8',
    },
  });
  context.drawImage(
    qrCanvas,
    QR_RECT.x,
    QR_RECT.y,
    QR_RECT.size,
    QR_RECT.size,
  );
  context.fillStyle = '#f5e2b8';
  context.fillRect(0, 1080, 1080, 360);
  context.fillStyle = '#11120f';
  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';
  context.font = '700 52px "Arial Black", "Segoe UI", sans-serif';
  context.fillText(projectName, 72, 1200);
  context.font = '700 34px "Cascadia Mono", Consolas, monospace';
  context.fillText(takeLabel, 72, 1280);
  context.font = '600 26px "Cascadia Mono", Consolas, monospace';
  context.fillText('SCAN TO LISTEN / DOWNLOAD · 24H', 72, 1360);
}
