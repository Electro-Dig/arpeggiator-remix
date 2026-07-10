const TEMPLATE_URL = '/assets/qr-share-template-bauhaus.png';
const loadDefaultQr = () => import('https://esm.sh/qrcode@1.5.4');

export const QR_RECT = Object.freeze({ x: 112, y: 112, size: 430 });

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
} = {}) {
  const [{ toCanvas }, template] = await Promise.all([
    loadQr(),
    loadTemplate(TEMPLATE_URL),
  ]);
  const width = template.naturalWidth || template.width;
  const height = template.naturalHeight || template.height;
  const context = canvas.getContext('2d');
  const qrCanvas = createCanvas();

  canvas.width = width;
  canvas.height = height;
  context.drawImage(template, 0, 0, width, height);
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
}
