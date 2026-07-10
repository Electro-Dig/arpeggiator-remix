const TRANSITIONS = Object.freeze({
  idle: Object.freeze({ START_REQUEST: 'countdown' }),
  countdown: Object.freeze({
    COUNTDOWN_DONE: 'recording',
    CANCEL_REQUEST: 'idle',
    CANCEL_TO_REVIEW: 'review',
  }),
  recording: Object.freeze({ STOP_REQUEST: 'stopping', RERECORD_REQUEST: 'stopping' }),
  stopping: Object.freeze({
    RECORDER_STOPPED: 'review',
    RECORDER_EMPTY: 'review',
    STOP_FAILED: 'error',
  }),
  review: Object.freeze({
    UPLOAD_REQUEST: 'uploading',
    RERECORD_REQUEST: 'countdown',
    DISCARD_REQUEST: 'idle',
  }),
  uploading: Object.freeze({ UPLOAD_SUCCEEDED: 'shared', UPLOAD_FAILED: 'review' }),
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
      review: 'UPLOAD_REQUEST',
    })[phase] || null;
  }
  if (intent === 'both-down') {
    return ({
      countdown: 'CANCEL_REQUEST',
      recording: 'RERECORD_REQUEST',
      review: 'RERECORD_REQUEST',
    })[phase] || null;
  }
  return null;
}
