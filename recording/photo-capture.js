export const CAPTURE_SIZE = Object.freeze({ width: 900, height: 1125 });

export function calculateCoverCrop(sourceWidth, sourceHeight, targetWidth, targetHeight) {
  const sw = Number(sourceWidth);
  const sh = Number(sourceHeight);
  const tw = Number(targetWidth);
  const th = Number(targetHeight);
  if (![sw, sh, tw, th].every((value) => Number.isFinite(value) && value > 0)) {
    throw new Error('无法计算拍照裁切区域');
  }

  const sourceRatio = sw / sh;
  const targetRatio = tw / th;
  if (sourceRatio > targetRatio) {
    const cropWidth = sh * targetRatio;
    return {
      sx: Math.round((sw - cropWidth) / 2),
      sy: 0,
      sw: Math.round(cropWidth),
      sh: Math.round(sh),
    };
  }

  const cropHeight = sw / targetRatio;
  return {
    sx: 0,
    sy: Math.round((sh - cropHeight) / 2),
    sw: Math.round(sw),
    sh: Math.round(cropHeight),
  };
}

export function capturePhotoFrame(video, canvas, {
  width = CAPTURE_SIZE.width,
  height = CAPTURE_SIZE.height,
  mirror = true,
} = {}) {
  const sourceWidth = Number(video?.videoWidth);
  const sourceHeight = Number(video?.videoHeight);
  if (!video || sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error('摄像头画面尚未就绪');
  }
  const context = canvas?.getContext?.('2d');
  if (!context) throw new Error('当前浏览器无法生成照片');

  const crop = calculateCoverCrop(sourceWidth, sourceHeight, width, height);
  canvas.width = width;
  canvas.height = height;
  context.save();
  if (mirror) {
    context.translate(width, 0);
    context.scale(-1, 1);
  }
  context.drawImage(
    video,
    crop.sx,
    crop.sy,
    crop.sw,
    crop.sh,
    0,
    0,
    width,
    height,
  );
  context.restore();
  return canvas;
}
