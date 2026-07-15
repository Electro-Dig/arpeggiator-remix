const TRANSITIONS = Object.freeze({
  idle: Object.freeze({ START_REQUEST: 'countdown' }),
  countdown: Object.freeze({
    COUNTDOWN_DONE: 'recording',
    CANCEL_REQUEST: 'idle',
    CANCEL_TO_REVIEW: 'review',
  }),
  recording: Object.freeze({
    STOP_REQUEST: 'stopping',
    RERECORD_REQUEST: 'stopping',
    CANCEL_REQUEST: 'stopping',
  }),
  stopping: Object.freeze({
    RECORDER_STOPPED: 'review',
    RECORDER_CANCELLED: 'idle',
    RECORDER_EMPTY: 'review',
    STOP_FAILED: 'error',
  }),
  review: Object.freeze({
    PHOTO_REQUEST: 'photo-countdown',
    RERECORD_REQUEST: 'countdown',
    DISCARD_REQUEST: 'idle',
  }),
  'photo-countdown': Object.freeze({
    PHOTO_CAPTURED: 'photo-review',
    PHOTO_CAPTURE_FAILED: 'photo-review',
    DISCARD_REQUEST: 'idle',
  }),
  'photo-review': Object.freeze({
    PHOTO_ACCEPTED: 'uploading',
    PHOTO_RETAKE: 'photo-countdown',
    PHOTO_SKIPPED: 'uploading',
    DISCARD_REQUEST: 'idle',
  }),
  uploading: Object.freeze({ UPLOAD_SUCCEEDED: 'shared', UPLOAD_FAILED: 'photo-review' }),
  shared: Object.freeze({ START_REQUEST: 'countdown', DISCARD_REQUEST: 'idle' }),
  error: Object.freeze({ RESET: 'idle' }),
});

export function initialRecordingState() {
  return Object.freeze({ phase: 'idle', error: '', pendingRerecord: false });
}

export function reduceRecording(state, event) {
  let nextPhase = TRANSITIONS[state.phase]?.[event.type];
  if (!nextPhase) return state;

  const pendingRerecord = state.phase === 'recording' && event.type === 'RERECORD_REQUEST';
  if (state.phase === 'stopping' && event.type === 'RECORDER_STOPPED' && state.pendingRerecord) {
    nextPhase = 'countdown';
  }

  return Object.freeze({
    phase: nextPhase,
    error: event.error ? String(event.error) : '',
    pendingRerecord: nextPhase === 'stopping' ? pendingRerecord : false,
  });
}

export function actionForThumbIntent(phase, intent) {
  if (intent === 'both-up') {
    return ({
      idle: 'START_REQUEST',
      recording: 'STOP_REQUEST',
      review: 'PHOTO_REQUEST',
    })[phase] || null;
  }
  if (intent === 'both-down') {
    return ({
      countdown: 'CANCEL_REQUEST',
      recording: 'CANCEL_REQUEST',
      review: 'DISCARD_REQUEST',
    })[phase] || null;
  }
  return null;
}
