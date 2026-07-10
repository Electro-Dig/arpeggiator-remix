import { chooseRecordingFormat } from './recording/mime.js';
import { initialRecordingState, reduceRecording } from './recording/recording-state.js';

export const RECORDING_COUNTDOWN_MS = 3_000;
export const RECORDING_MAX_MS = 60_000;

function defaultRecorderFactory(stream, options) {
  return new MediaRecorder(stream, options);
}

function defaultTriggerDownload({ url, filename }) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function stateChangeEvent(detail) {
  const event = new Event('statechange');
  Object.defineProperty(event, 'detail', { value: detail });
  return event;
}

export class RecordingController extends EventTarget {
  constructor({
    stream,
    root = typeof document === 'undefined' ? null : document,
    recorderFactory = defaultRecorderFactory,
    formatChooser = chooseRecordingFormat,
    now = () => Date.now(),
    setTimer = (callback, delay) => setTimeout(callback, delay),
    clearTimer = (id) => clearTimeout(id),
    createObjectURL = (blob) => URL.createObjectURL(blob),
    revokeObjectURL = (url) => URL.revokeObjectURL(url),
    triggerDownload = defaultTriggerDownload,
    onUploadRequest = async () => {
      throw new Error('云端分享将在下一阶段接入，当前录音仍可试听或下载');
    },
  } = {}) {
    super();
    if (!stream) throw new Error('RecordingController requires an internal audio stream');

    this.stream = stream;
    this.root = root;
    this.recorderFactory = recorderFactory;
    this.formatChooser = formatChooser;
    this.now = now;
    this.setTimer = setTimer;
    this.clearTimer = clearTimer;
    this.createObjectURL = createObjectURL;
    this.revokeObjectURL = revokeObjectURL;
    this.triggerDownload = triggerDownload;
    this.onUploadRequest = onUploadRequest;

    this.state = initialRecordingState();
    this.recorder = null;
    this.chunks = [];
    this.currentTake = null;
    this.previousTake = null;
    this.currentFormat = null;
    this.currentFilename = '';
    this.previewUrl = '';
    this.countdownTimer = null;
    this.stopTimer = null;
    this.elapsedTimer = null;
    this.countdownEndsAt = 0;
    this.recordingStartedAt = 0;
    this.countdownRemaining = 0;
    this.elapsedMs = 0;

    this.elements = this.collectElements();
    this.bind();
    this.render();
  }

  collectElements() {
    const byId = (id) => this.root?.getElementById?.(id) || null;
    return {
      primary: byId('recording-primary'),
      primaryLabel: byId('recording-primary-label'),
      dialog: byId('recording-dialog'),
      title: byId('recording-dialog-title'),
      message: byId('recording-message'),
      progress: byId('recording-hold-progress'),
      preview: byId('recording-preview'),
      confirm: byId('recording-confirm'),
      rerecord: byId('recording-rerecord'),
      cancel: byId('recording-cancel'),
      download: byId('recording-download'),
      stateLabel: byId('recording-state-label'),
      timer: byId('recording-timer'),
    };
  }

  bind() {
    this.elements.primary?.addEventListener('click', () => {
      if (this.state.phase === 'idle' || this.state.phase === 'shared') {
        this.dispatch({ type: 'START_REQUEST' });
      } else if (this.state.phase === 'countdown') {
        this.dispatch({ type: 'CANCEL_REQUEST' });
      } else if (this.state.phase === 'recording') {
        this.dispatch({ type: 'STOP_REQUEST' });
      }
    });
    this.elements.confirm?.addEventListener('click', () => {
      this.dispatch({ type: 'UPLOAD_REQUEST' });
    });
    this.elements.rerecord?.addEventListener('click', () => {
      this.dispatch({ type: 'RERECORD_REQUEST' });
    });
    this.elements.cancel?.addEventListener('click', () => {
      if (this.state.phase === 'countdown') {
        this.dispatch({ type: 'CANCEL_REQUEST' });
      } else if (this.state.phase === 'recording') {
        this.dispatch({ type: 'STOP_REQUEST' });
      } else if (this.state.phase === 'review' || this.state.phase === 'shared') {
        this.dispatch({ type: 'DISCARD_REQUEST' });
      }
    });
    this.elements.download?.addEventListener('click', () => this.downloadCurrentTake());
  }

  dispatch(event) {
    const normalizedEvent = event.type === 'CANCEL_REQUEST'
      && this.state.phase === 'countdown'
      && this.currentTake
      ? { ...event, type: 'CANCEL_TO_REVIEW' }
      : event;
    const previousState = this.state;
    const nextState = reduceRecording(previousState, normalizedEvent);
    if (nextState === previousState) return false;

    this.state = nextState;
    this.render();
    this.dispatchEvent(stateChangeEvent({ state: nextState, event: normalizedEvent }));

    if (normalizedEvent.type === 'START_REQUEST') this.startCountdown();
    if (normalizedEvent.type === 'COUNTDOWN_DONE') this.beginRecording();
    if (normalizedEvent.type === 'CANCEL_REQUEST') this.cancelCountdown();
    if (normalizedEvent.type === 'CANCEL_TO_REVIEW') {
      this.clearCountdownTimer();
      this.countdownRemaining = 0;
      this.render();
    }
    if (normalizedEvent.type === 'STOP_REQUEST' || normalizedEvent.type === 'RERECORD_REQUEST') {
      if (previousState.phase === 'recording') this.requestRecorderStop();
      if (previousState.phase === 'review') this.startCountdown();
    }
    if (normalizedEvent.type === 'UPLOAD_REQUEST') return this.uploadCurrentTake();
    if (normalizedEvent.type === 'DISCARD_REQUEST') this.discardCurrentTake();
    return true;
  }

  openDialog() {
    const dialog = this.elements.dialog;
    if (dialog && !dialog.open && typeof dialog.showModal === 'function') dialog.showModal();
  }

  closeDialog() {
    const dialog = this.elements.dialog;
    if (dialog?.open && typeof dialog.close === 'function') dialog.close();
  }

  startCountdown() {
    this.clearCountdownTimer();
    this.openDialog();
    this.countdownEndsAt = this.now() + RECORDING_COUNTDOWN_MS;
    this.countdownRemaining = 3;
    this.render();

    const tick = () => {
      if (this.state.phase !== 'countdown') return;
      const remainingMs = Math.max(0, this.countdownEndsAt - this.now());
      this.countdownRemaining = Math.ceil(remainingMs / 1000);
      this.render();
      if (remainingMs === 0) {
        this.countdownTimer = null;
        this.dispatch({ type: 'COUNTDOWN_DONE' });
        return;
      }
      this.countdownTimer = this.setTimer(tick, Math.min(1000, remainingMs));
    };
    this.countdownTimer = this.setTimer(tick, 1000);
  }

  cancelCountdown() {
    this.clearCountdownTimer();
    this.countdownRemaining = 0;
    this.closeDialog();
    this.render();
  }

  clearCountdownTimer() {
    if (this.countdownTimer !== null) this.clearTimer(this.countdownTimer);
    this.countdownTimer = null;
  }

  beginRecording() {
    this.clearCountdownTimer();
    this.currentFormat = this.formatChooser();
    const options = this.currentFormat.mimeType
      ? { mimeType: this.currentFormat.mimeType }
      : {};

    try {
      this.recorder = this.recorderFactory(this.stream, options);
      this.chunks = [];
      this.recorder.addEventListener('dataavailable', ({ data }) => {
        if (data?.size) this.chunks.push(data);
      });
      this.recorder.addEventListener('stop', () => this.handleRecorderStopped(), { once: true });
      this.recorder.addEventListener('error', ({ error }) => {
        if (this.state.phase === 'recording') this.dispatch({ type: 'STOP_REQUEST' });
        this.dispatch({ type: 'STOP_FAILED', error: error?.message || '录音设备错误' });
      }, { once: true });
      this.recordingStartedAt = this.now();
      this.elapsedMs = 0;
      this.recorder.start(250);
      this.stopTimer = this.setTimer(() => {
        if (this.state.phase === 'recording') this.dispatch({ type: 'STOP_REQUEST' });
      }, RECORDING_MAX_MS);
      this.scheduleElapsedTick();
      this.render();
    } catch (error) {
      this.dispatch({ type: 'STOP_REQUEST' });
      this.dispatch({ type: 'STOP_FAILED', error: error.message });
    }
  }

  scheduleElapsedTick() {
    this.clearElapsedTimer();
    const tick = () => {
      if (this.state.phase !== 'recording') return;
      this.elapsedMs = Math.min(RECORDING_MAX_MS, this.now() - this.recordingStartedAt);
      this.render();
      this.elapsedTimer = this.setTimer(tick, 1000);
    };
    this.elapsedTimer = this.setTimer(tick, 1000);
  }

  requestRecorderStop() {
    this.clearStopTimer();
    this.clearElapsedTimer();
    if (this.recorder?.state === 'recording') this.recorder.stop();
  }

  handleRecorderStopped() {
    this.clearStopTimer();
    this.clearElapsedTimer();
    const discardAndRestart = this.state.pendingRerecord;
    const mimeType = this.recorder?.mimeType || this.currentFormat?.mimeType || '';
    const stoppedBlob = new Blob(this.chunks, { type: mimeType });

    if (!discardAndRestart && stoppedBlob.size === 0) {
      this.dispatch({ type: 'RECORDER_EMPTY', error: '未捕获到内部声音，请确认音乐正在播放后重录' });
      if (this.currentTake) this.showReview();
      else this.openDialog();
      this.render();
      return;
    }

    if (!discardAndRestart) {
      this.destroyPreviewUrl();
      this.previousTake = this.currentTake;
      this.currentTake = stoppedBlob;
      this.currentFilename = this.buildFilename(this.currentFormat?.extension || 'webm');
    }

    this.dispatch({ type: 'RECORDER_STOPPED' });
    if (discardAndRestart) {
      this.startCountdown();
      return;
    }
    this.showReview();
  }

  clearStopTimer() {
    if (this.stopTimer !== null) this.clearTimer(this.stopTimer);
    this.stopTimer = null;
  }

  clearElapsedTimer() {
    if (this.elapsedTimer !== null) this.clearTimer(this.elapsedTimer);
    this.elapsedTimer = null;
  }

  buildFilename(extension) {
    const timestamp = new Date(this.now()).toISOString().replace(/[:.]/g, '-');
    return `arpeggiator-remix-${timestamp}.${extension}`;
  }

  showReview() {
    if (!this.currentTake) return;
    this.openDialog();
    this.previewUrl = this.createObjectURL(this.currentTake);
    if (this.elements.preview) {
      this.elements.preview.src = this.previewUrl;
      this.elements.preview.hidden = false;
    }
    this.render();
  }

  async uploadCurrentTake() {
    const take = this.currentTake;
    if (!take) {
      this.dispatch({ type: 'UPLOAD_FAILED', error: '没有可分享的录音' });
      return null;
    }
    try {
      const result = await this.onUploadRequest(take, {
        filename: this.currentFilename,
        mimeType: take.type,
      });
      if (this.state.phase === 'uploading') {
        this.dispatch({ type: 'UPLOAD_SUCCEEDED', result });
      }
      return result;
    } catch (error) {
      if (this.state.phase === 'uploading') {
        this.dispatch({ type: 'UPLOAD_FAILED', error: error.message || String(error) });
      }
      return null;
    }
  }

  downloadCurrentTake() {
    if (!this.currentTake) return false;
    const url = this.createObjectURL(this.currentTake);
    try {
      this.triggerDownload({ url, filename: this.currentFilename });
    } finally {
      this.revokeObjectURL(url);
    }
    return true;
  }

  destroyPreviewUrl() {
    if (!this.previewUrl) return;
    this.revokeObjectURL(this.previewUrl);
    this.previewUrl = '';
    if (this.elements.preview) {
      this.elements.preview.removeAttribute('src');
      this.elements.preview.hidden = true;
    }
  }

  discardCurrentTake() {
    this.destroyPreviewUrl();
    this.currentTake = null;
    this.previousTake = null;
    this.currentFilename = '';
    this.closeDialog();
    this.render();
  }

  setGestureProgress(progress) {
    if (!this.elements.progress) return;
    const clamped = Math.max(0, Math.min(1, Number(progress) || 0));
    this.elements.progress.style.setProperty('--hold-progress', String(clamped));
    this.elements.progress.hidden = clamped === 0;
  }

  render() {
    const phase = this.state.phase;
    const stateLabels = {
      idle: 'READY', countdown: 'COUNTDOWN', recording: 'REC', stopping: 'SAVING',
      review: 'REVIEW', uploading: 'UPLOADING', shared: 'SHARED', error: 'ERROR',
    };
    const primaryLabels = {
      idle: '开始录音', countdown: '取消倒计时', recording: '结束录音', stopping: '正在保存',
      review: '录音待确认', uploading: '正在上传', shared: '再录一段', error: '录音错误',
    };
    const messages = {
      idle: '录制项目内部声音，不包含麦克风。',
      countdown: `${this.countdownRemaining || 3}`,
      recording: '正在录制内部混音，最长 01:00。',
      stopping: '正在生成试听文件…',
      review: this.state.error || '试听后确认、重录，或下载到当前电脑。',
      uploading: '正在生成分享链接…',
      shared: '分享链接已生成。',
      error: this.state.error || '录音失败，请重试。',
    };

    if (this.elements.stateLabel) this.elements.stateLabel.textContent = stateLabels[phase];
    if (this.elements.primaryLabel) this.elements.primaryLabel.textContent = primaryLabels[phase];
    if (this.elements.primary) {
      this.elements.primary.disabled = ['stopping', 'review', 'uploading', 'error'].includes(phase);
      this.elements.primary.dataset.phase = phase;
    }
    if (this.elements.dialog) this.elements.dialog.dataset.phase = phase;
    if (this.elements.title) {
      this.elements.title.textContent = phase === 'review' ? '确认这段录音' : '内部混音录制';
    }
    if (this.elements.message) this.elements.message.textContent = messages[phase] || '';
    if (this.elements.timer) {
      const displayedMs = phase === 'countdown'
        ? (this.countdownRemaining || 3) * 1000
        : this.elapsedMs;
      const seconds = Math.floor(displayedMs / 1000);
      this.elements.timer.textContent = `00:${String(seconds).padStart(2, '0')}`;
    }

    const hasTake = Boolean(this.currentTake);
    if (this.elements.confirm) this.elements.confirm.hidden = phase !== 'review' || !hasTake;
    if (this.elements.rerecord) this.elements.rerecord.hidden = phase !== 'review';
    if (this.elements.download) this.elements.download.hidden = !hasTake || !['review', 'shared'].includes(phase);
    if (this.elements.cancel) {
      this.elements.cancel.hidden = !['countdown', 'recording', 'review', 'shared'].includes(phase);
      this.elements.cancel.textContent = phase === 'countdown'
        ? '取消'
        : phase === 'recording'
          ? '结束并试听'
          : '放弃这段';
    }
    if (this.elements.preview) this.elements.preview.hidden = !hasTake || phase !== 'review';
  }

  destroy() {
    this.clearCountdownTimer();
    this.clearStopTimer();
    this.clearElapsedTimer();
    if (this.recorder?.state === 'recording') this.recorder.stop();
    this.destroyPreviewUrl();
  }
}
