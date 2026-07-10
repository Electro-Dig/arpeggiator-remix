const loadDefaultQr = () => import('https://esm.sh/qrcode@1.5.4');

export async function renderQr(canvas, value, loadQr = loadDefaultQr) {
  const { toCanvas } = await loadQr();
  await toCanvas(canvas, value, {
    width: 280,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#071014',
      light: '#edf7f9',
    },
  });
}
