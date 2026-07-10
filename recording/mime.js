const CANDIDATES = Object.freeze([
  Object.freeze({ mimeType: 'audio/mp4;codecs=mp4a.40.2', extension: 'm4a' }),
  Object.freeze({ mimeType: 'audio/mp4', extension: 'm4a' }),
  Object.freeze({ mimeType: 'audio/webm;codecs=opus', extension: 'webm' }),
  Object.freeze({ mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' }),
]);

function defaultSupport(mimeType) {
  return typeof MediaRecorder !== 'undefined'
    && typeof MediaRecorder.isTypeSupported === 'function'
    && MediaRecorder.isTypeSupported(mimeType);
}

export function chooseRecordingFormat(isTypeSupported = defaultSupport) {
  return CANDIDATES.find(({ mimeType }) => isTypeSupported(mimeType))
    || { mimeType: '', extension: 'webm' };
}
