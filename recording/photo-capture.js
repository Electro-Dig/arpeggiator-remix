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

function getSourceSize(source) {
  const width = Number(source?.videoWidth)
    || Number(source?.naturalWidth)
    || Number(source?.width);
  const height = Number(source?.videoHeight)
    || Number(source?.naturalHeight)
    || Number(source?.height);
  if (![width, height].every((value) => Number.isFinite(value) && value > 0)) {
    throw new Error('拍照图层尚未就绪');
  }
  return { width, height };
}

function resolveTargetSize(video, captureSource, width, height) {
  const source = captureSource || video;
  const sourceSize = getSourceSize(source);
  const requestedWidth = Number(width);
  const requestedHeight = Number(height);
  const hasWidth = Number.isFinite(requestedWidth) && requestedWidth > 0;
  const hasHeight = Number.isFinite(requestedHeight) && requestedHeight > 0;
  if (hasWidth && hasHeight) {
    return { width: Math.round(requestedWidth), height: Math.round(requestedHeight) };
  }
  if (hasWidth) {
    return {
      width: Math.round(requestedWidth),
      height: Math.round(requestedWidth * sourceSize.height / sourceSize.width),
    };
  }
  if (hasHeight) {
    return {
      width: Math.round(requestedHeight * sourceSize.width / sourceSize.height),
      height: Math.round(requestedHeight),
    };
  }
  return { width: Math.round(sourceSize.width), height: Math.round(sourceSize.height) };
}

function normalizeLayer(layer, fallbackFit = 'cover') {
  if (layer?.source) return { fit: fallbackFit, ...layer };
  return { source: layer, fit: fallbackFit };
}

function drawLayer(context, layer, targetWidth, targetHeight) {
  const { source, fit = 'cover', mirror = false } = layer;
  const { width: sourceWidth, height: sourceHeight } = getSourceSize(source);
  context.save();
  if (Number.isFinite(Number(layer.opacity))) {
    context.globalAlpha = Math.max(0, Math.min(1, Number(layer.opacity)));
  }
  if (typeof layer.blendMode === 'string' && layer.blendMode) {
    context.globalCompositeOperation = layer.blendMode;
  }
  if (mirror) {
    context.translate(targetWidth, 0);
    context.scale(-1, 1);
  }

  if (fit === 'contain') {
    const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    context.drawImage(
      source,
      0,
      0,
      sourceWidth,
      sourceHeight,
      (targetWidth - drawWidth) / 2,
      (targetHeight - drawHeight) / 2,
      drawWidth,
      drawHeight,
    );
  } else {
    const crop = calculateCoverCrop(sourceWidth, sourceHeight, targetWidth, targetHeight);
    context.drawImage(
      source,
      crop.sx,
      crop.sy,
      crop.sw,
      crop.sh,
      0,
      0,
      targetWidth,
      targetHeight,
    );
  }
  context.restore();
}

export function capturePhotoFrame(video, canvas, {
  width = null,
  height = null,
  mirror = false,
  captureSource = null,
  overlays = [],
} = {}) {
  const sourceWidth = Number(video?.videoWidth);
  const sourceHeight = Number(video?.videoHeight);
  const hasCameraFrame = Boolean(video && sourceWidth > 0 && sourceHeight > 0);
  if (!captureSource && !hasCameraFrame) {
    throw new Error('摄像头画面尚未就绪');
  }
  const context = canvas?.getContext?.('2d');
  if (!context) throw new Error('当前浏览器无法生成照片');

  const target = resolveTargetSize(video, captureSource, width, height);
  canvas.width = target.width;
  canvas.height = target.height;
  if (hasCameraFrame) {
    drawLayer(context, { source: video, mirror }, target.width, target.height);
  }
  if (captureSource) {
    drawLayer(context, normalizeLayer(captureSource, 'contain'), target.width, target.height);
  }
  for (const overlay of Array.isArray(overlays) ? overlays : []) {
    if (!overlay) continue;
    drawLayer(context, normalizeLayer(overlay), target.width, target.height);
  }
  return canvas;
}
