export const POSTER_SIZE = Object.freeze({ width: 1080, height: 1350 });
export const STAGE_RECT = Object.freeze({ x: 40, y: 116, width: 1000, height: 625 });
export const QR_RECT = Object.freeze({ x: 744, y: 940, size: 280 });

function sourceDimensions(source) {
  return {
    width: Number(source?.naturalWidth || source?.videoWidth || source?.width || 0),
    height: Number(source?.naturalHeight || source?.videoHeight || source?.height || 0),
  };
}

export function fitSourceWithinRect(source, rect = STAGE_RECT) {
  const dimensions = sourceDimensions(source);
  if (dimensions.width <= 0 || dimensions.height <= 0) return null;
  const scale = Math.min(
    rect.width / dimensions.width,
    rect.height / dimensions.height,
  );
  const width = Math.round(dimensions.width * scale);
  const height = Math.round(dimensions.height * scale);
  return {
    x: Math.round(rect.x + (rect.width - width) / 2),
    y: Math.round(rect.y + (rect.height - height) / 2),
    width,
    height,
  };
}

function drawImageContained(context, source, bounds) {
  const dimensions = sourceDimensions(source);
  const rect = fitSourceWithinRect(dimensions, bounds);
  if (!rect) return null;
  context.drawImage(
    source,
    0,
    0,
    dimensions.width,
    dimensions.height,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
  );
  return rect;
}

function hashSeed(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function performanceTracePoints(seed, { count = 9 } = {}) {
  let state = hashSeed(seed) || 1;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
  const total = Math.max(2, Number(count) || 9);
  return Array.from({ length: total }, (_, index) => [
    index / (total - 1),
    0.16 + next() * 0.68,
  ]);
}

function drawPaperGrid(context) {
  context.save();
  context.strokeStyle = 'rgba(23, 99, 106, 0.11)';
  context.lineWidth = 1;
  for (let x = 0; x <= POSTER_SIZE.width; x += 54) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, POSTER_SIZE.height);
    context.stroke();
  }
  for (let y = 0; y <= POSTER_SIZE.height; y += 54) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(POSTER_SIZE.width, y);
    context.stroke();
  }
  context.restore();
}

function drawAbstractStage(context, rect) {
  context.fillStyle = '#102025';
  context.fillRect(rect.x, rect.y, rect.width, rect.height);
  context.fillStyle = '#17636a';
  context.fillRect(rect.x, rect.y, Math.round(rect.width * 0.24), rect.height);
  context.fillStyle = '#e86d4c';
  context.fillRect(rect.x + Math.round(rect.width * 0.74), rect.y, Math.round(rect.width * 0.26), Math.round(rect.height * 0.31));
  context.fillStyle = '#ffba57';
  context.fillRect(rect.x + Math.round(rect.width * 0.64), rect.y + Math.round(rect.height * 0.7), Math.round(rect.width * 0.15), Math.round(rect.height * 0.3));
}

function drawStageGrid(context, rect) {
  context.save();
  context.strokeStyle = 'rgba(128, 231, 236, 0.18)';
  context.lineWidth = 1;
  for (let x = rect.x; x <= rect.x + rect.width; x += 64) {
    context.beginPath();
    context.moveTo(x, rect.y);
    context.lineTo(x, rect.y + rect.height);
    context.stroke();
  }
  for (let y = rect.y; y <= rect.y + rect.height; y += 64) {
    context.beginPath();
    context.moveTo(rect.x, y);
    context.lineTo(rect.x + rect.width, y);
    context.stroke();
  }
  context.restore();
}

function drawTrace(context, seed, rect) {
  const points = performanceTracePoints(seed);
  const left = rect.x + 42;
  const top = rect.y + rect.height * 0.46;
  const width = rect.width - 84;
  const height = Math.min(210, rect.height * 0.36);
  context.save();
  context.strokeStyle = '#80e7ec';
  context.lineWidth = 6;
  context.beginPath();
  points.forEach(([x, y], index) => {
    const px = left + x * width;
    const py = top + y * height;
    if (index === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  });
  context.stroke();
  for (const [x, y] of points) {
    context.beginPath();
    context.fillStyle = '#ff8a64';
    context.arc(left + x * width, top + y * height, 9, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

export function drawTechnicalTicket(context, {
  photo = null,
  formattedNumber = '001',
  durationMs = 0,
  seed = '',
} = {}) {
  const seconds = Math.max(0, Math.round(Number(durationMs) / 1000));
  const duration = String(seconds).padStart(2, '0');
  context.fillStyle = '#e7efea';
  context.fillRect(0, 0, POSTER_SIZE.width, POSTER_SIZE.height);
  drawPaperGrid(context);
  context.fillStyle = '#17636a';
  context.fillRect(0, 0, POSTER_SIZE.width, 18);
  context.fillStyle = '#e86d4c';
  context.fillRect(40, 780, 1000, 10);

  context.fillStyle = '#102025';
  context.fillRect(STAGE_RECT.x, STAGE_RECT.y, STAGE_RECT.width, STAGE_RECT.height);
  let stageRect = drawImageContained(context, photo, STAGE_RECT);
  if (!stageRect) {
    stageRect = STAGE_RECT;
    drawAbstractStage(context, stageRect);
  } else {
    context.fillStyle = 'rgba(8, 28, 31, 0.35)';
    context.fillRect(stageRect.x, stageRect.y, stageRect.width, stageRect.height);
  }
  drawStageGrid(context, stageRect);
  drawTrace(context, seed, stageRect);

  context.fillStyle = '#102025';
  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';
  context.font = '700 21px "Cascadia Mono", Consolas, monospace';
  context.fillText('WAIC 双手乐队 / LIVE PERFORMANCE TICKET', 48, 78);
  context.textAlign = 'right';
  context.fillText(`PLAYER ${formattedNumber} / TAKE ${formattedNumber} / ${duration} SEC`, POSTER_SIZE.width - 40, 78);
  context.textAlign = 'left';
  context.fillStyle = '#80e7ec';
  context.font = '700 18px "Cascadia Mono", Consolas, monospace';
  context.fillText('PERFORMANCE TRACE / PARAMETRIC', stageRect.x + 40, stageRect.y + 58);

  context.fillStyle = '#17636a';
  context.font = '650 46px "Microsoft YaHei", "PingFang SC", sans-serif';
  context.fillText(`本场第 ${formattedNumber} 位音乐玩家`, 56, 862);
  context.fillStyle = '#102025';
  context.font = '700 28px "Microsoft YaHei", "PingFang SC", sans-serif';
  context.fillText('扫码带走你的现场录音', 56, 930);
  context.fillStyle = '#5e7477';
  context.font = '600 22px "Microsoft YaHei", "PingFang SC", sans-serif';
  context.fillText('试听、下载录音与分享海报', 56, 980);
  context.fillText('链接 24 小时内有效', 56, 1024);
  context.fillStyle = '#e86d4c';
  context.font = '700 22px "Cascadia Mono", Consolas, monospace';
  context.fillText(`TAKE ${formattedNumber} · ${duration} SEC`, 56, 1090);
  context.fillStyle = '#5e7477';
  context.font = '600 18px "Microsoft YaHei", "PingFang SC", sans-serif';
  context.textAlign = 'center';
  context.fillText('扫码试听与下载', QR_RECT.x + QR_RECT.size / 2, 1258);
  context.textAlign = 'left';
}
