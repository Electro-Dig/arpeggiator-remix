import { chooseRecordingFormat } from './recording/mime.js';
import { initialRecordingState, reduceRecording } from './recording/recording-state.js';
import { renderQr as defaultRenderQr } from './share/qr.js';

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

function defaultCopyText(value) {
  if (!navigator?.clipboard?.writeText) throw new Error('当前浏览器不支持自动复制');
  return navigator.clipboard.writeText(value);
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
    renderQr = defaultRenderQr,
    copyText = defaultCopyText,
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
    this.renderQr = renderQr;
    this.copyText = copyText;
    this.onUploadRequest = onUploadRequest;

    this.state = initialRecordingState();
    this.recorder = null;
    this.chunks = [];
    this.currentTake = null;
    this.previousTake = null;
    this.currentFormat = null;
    this.currentFilename = '';
    this.previewUrl = '';
    this.shareResult = null;
    this.countdownTimer = null;
    this.stopTimer = null;
    this.elapsedTimer = null;
    this.countdownEndsAt = 0;
    this.recordingStartedAt = 0;
    this.countdownRemaining = 0;
    this.elapsedMs = 0;
    this.cancelOnStop = false;
    this.takeNumber = 0;
    this.takeDurationMs = 0;

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
      takeLabel: byId('recording-take-label'),
      takeMeta: byId('recording-take-meta'),
      duration: byId('recording-duration'),
      format: byId('recording-format'),
      progress: byId('recording-hold-progress'),
      preview: byId('recording-preview'),
      confirm: byId('recording-confirm'),
      rerecord: byId('recording-rerecord'),
      cancel: byId('recording-cancel'),
      cancelLabel: byId('recording-cancel-label'),
      download: byId('recording-download'),
      share: byId('recording-share'),
      qr: byId('recording-qr'),
      shareLink: byId('recording-share-link'),
      shareExpiry: byId('recording-share-expiry'),
      checkin: byId('recording-checkin'),
      copyLink: byId('recording-copy-link'),
      status: byId('recording-status'),
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
    this.elements.copyLink?.addEventListener('click', async () => {
      if (!this.shareResult?.shareUrl) return;
      try {
        await this.copyText(this.shareResult.shareUrl);
        this.elements.copyLink.textContent = '已复制链接';
      } catch {
        this.elements.copyLink.textContent = '请长按上方链接复制';
      }
    });
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
    if (normalizedEvent.type === 'START_REQUEST' || normalizedEvent.type === 'DISCARD_REQUEST') {
      this.clearShareResult();
    }
    this.render();
    this.dispatchEvent(stateChangeEvent({ state: nextState, event: normalizedEvent }));

    if (normalizedEvent.type === 'START_REQUEST') this.startCountdown();
    if (normalizedEvent.type === 'COUNTDOWN_DONE') this.beginRecording();
    if (normalizedEvent.type === 'CANCEL_REQUEST') {
      if (previousState.phase === 'countdown') this.cancelCountdown();
      if (previousState.phase === 'recording') {
        this.cancelOnStop = true;
        this.requestRecorderStop();
      }
    }
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
      this.closeDialog();
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

    if (this.cancelOnStop) {
      this.cancelOnStop = false;
      this.chunks = [];
      this.destroyPreviewUrl();
      this.currentTake = null;
      this.previousTake = null;
      this.currentFilename = '';
      this.elapsedMs = 0;
      this.dispatch({ type: 'RECORDER_CANCELLED' });
      this.closeDialog();
      this.render();
      return;
    }

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
      this.takeNumber += 1;
      this.takeDurationMs = Math.min(
        RECORDING_MAX_MS,
        Math.max(0, this.now() - this.recordingStartedAt),
      );
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

  formatDuration(milliseconds) {
    const seconds = Math.max(0, Math.round(milliseconds / 1000));
    return `00:${String(seconds).padStart(2, '0')}`;
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
        this.shareResult = result;
        this.dispatch({ type: 'UPLOAD_SUCCEEDED', result });
        await this.showShareResult();
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
    this.clearShareResult();
    this.currentTake = null;
    this.previousTake = null;
    this.currentFilename = '';
    this.closeDialog();
    this.render();
  }

  clearShareResult() {
    this.shareResult = null;
    if (this.elements.share) this.elements.share.hidden = true;
    if (this.elements.shareLink) {
      this.elements.shareLink.textContent = '';
      this.elements.shareLink.removeAttribute?.('href');
    }
    if (this.elements.shareExpiry) this.elements.shareExpiry.textContent = '';
    if (this.elements.checkin) this.elements.checkin.textContent = '';
    if (this.elements.copyLink) this.elements.copyLink.textContent = '复制链接';
  }

  formatShareExpiry(expiresAt) {
    const date = new Date(Number(expiresAt));
    if (!Number.isFinite(date.getTime())) return '链接将在上传后 24 小时失效';
    return `有效至 ${new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    }).format(date)}`;
  }

  async showShareResult() {
    const result = this.shareResult;
    if (!result?.shareUrl) return;
    this.openDialog();
    if (this.elements.share) this.elements.share.hidden = false;
    if (this.elements.shareLink) {
      this.elements.shareLink.href = result.shareUrl;
      this.elements.shareLink.textContent = result.shareUrl;
    }
    if (this.elements.shareExpiry) {
      this.elements.shareExpiry.textContent = this.formatShareExpiry(result.expiresAt);
    }
    if (this.elements.checkin) {
      this.elements.checkin.textContent = `你是本场第 ${String(result.checkinNumber).padStart(3, '0')} 位音乐玩家`;
    }
    if (!this.elements.qr) return;
    try {
      await this.renderQr(this.elements.qr, result.shareUrl, {
        checkinNumber: result.checkinNumber,
      });
    } catch {
      if (this.elements.message) {
        this.elements.message.textContent = '分享链接已生成；二维码暂时无法显示，请直接复制链接。';
      }
    }
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
    if (this.elements.status) this.elements.status.dataset.phase = phase;
    if (this.elements.primaryLabel) this.elements.primaryLabel.textContent = primaryLabels[phase];
    if (this.elements.primary) {
      this.elements.primary.disabled = ['stopping', 'review', 'uploading', 'error'].includes(phase);
      this.elements.primary.dataset.phase = phase;
    }
    if (this.elements.dialog) this.elements.dialog.dataset.phase = phase;
    if (this.elements.title) {
      this.elements.title.textContent = phase === 'shared'
        ? '扫码带走这段录音'
        : phase === 'review'
          ? '确认这段录音'
          : '内部混音录制';
    }
    if (this.elements.message) this.elements.message.textContent = messages[phase] || '';
    if (this.elements.takeLabel) {
      this.elements.takeLabel.textContent = `TAKE ${String(Math.max(1, this.takeNumber)).padStart(3, '0')}`;
    }
    if (this.elements.takeMeta) {
      this.elements.takeMeta.textContent = String(Math.max(1, this.takeNumber)).padStart(3, '0');
    }
    if (this.elements.duration) {
      this.elements.duration.textContent = this.formatDuration(this.takeDurationMs);
    }
    if (this.elements.format) {
      this.elements.format.textContent = (this.currentFormat?.extension || 'WEBM').toUpperCase();
    }
    if (this.elements.timer) {
      const seconds = phase === 'countdown'
        ? this.countdownRemaining || 3
        : phase === 'recording'
          ? Math.max(0, Math.ceil((RECORDING_MAX_MS - this.elapsedMs) / 1000))
          : Math.floor(this.elapsedMs / 1000);
      this.elements.timer.textContent = `00:${String(seconds).padStart(2, '0')}`;
    }

    const hasTake = Boolean(this.currentTake);
    if (this.elements.confirm) this.elements.confirm.hidden = phase !== 'review' || !hasTake;
    if (this.elements.rerecord) this.elements.rerecord.hidden = phase !== 'review';
    if (this.elements.download) this.elements.download.hidden = !hasTake || !['review', 'shared'].includes(phase);
    if (this.elements.cancel) {
      this.elements.cancel.hidden = !['countdown', 'recording', 'review', 'shared'].includes(phase);
      const label = phase === 'countdown'
        ? '取消'
        : phase === 'recording'
          ? '结束并试听'
          : '放弃这段';
      if (this.elements.cancelLabel) this.elements.cancelLabel.textContent = label;
      else this.elements.cancel.textContent = label;
    }
    if (this.elements.preview) this.elements.preview.hidden = !hasTake || phase !== 'review';
    if (this.elements.share) this.elements.share.hidden = phase !== 'shared' || !this.shareResult;
  }

  destroy() {
    this.clearCountdownTimer();
    this.clearStopTimer();
    this.clearElapsedTimer();
    if (this.recorder?.state === 'recording') this.recorder.stop();
    this.destroyPreviewUrl();
  }
}
