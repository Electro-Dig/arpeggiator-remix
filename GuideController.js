import {
  GUIDE_CARDS,
  GUIDE_NEUTRAL_LOCK_MS,
  advanceGuide,
  retreatGuide,
} from './guide/guide-model.js';

export class GuideController extends EventTarget {
  constructor(root = document) {
    super();
    this.root = root;
    this.dialog = root.getElementById('guide-dialog');
    this.index = 0;
    this.recordingBusy = false;
    this.bind();
    this.render();
  }

  bind() {
    this.root.getElementById('open-guide')?.addEventListener('click', () => this.open());
    this.root.getElementById('guide-previous')?.addEventListener('click', () => {
      this.index = retreatGuide(this.index).index;
      this.render();
    });
    this.root.getElementById('guide-next')?.addEventListener('click', () => {
      const next = advanceGuide(this.index);
      if (next.complete) {
        this.close('complete');
        return;
      }
      this.index = next.index;
      this.render();
    });
    this.root.getElementById('guide-skip')?.addEventListener('click', () => this.close('skip'));
  }

  open() {
    if (this.recordingBusy || !this.dialog || this.dialog.open) return false;
    this.index = 0;
    this.render();
    this.dialog.showModal();
    this.dispatchEvent(new CustomEvent('contextchange', { detail: { active: true } }));
    return true;
  }

  close(reason) {
    if (!this.dialog?.open) return;
    this.dialog.close();
    this.dispatchEvent(new CustomEvent('contextchange', {
      detail: {
        active: false,
        reason,
        neutralUntil: performance.now() + GUIDE_NEUTRAL_LOCK_MS,
      },
    }));
  }

  skipFromGesture() {
    if (this.dialog?.open) this.close('gesture-skip');
  }

  setRecordingBusy(busy) {
    this.recordingBusy = Boolean(busy);
    const button = this.root.getElementById('open-guide');
    if (button) button.disabled = this.recordingBusy;
  }

  render() {
    const card = GUIDE_CARDS[this.index];
    if (!card) return;
    this.root.getElementById('guide-kicker').textContent = card.kicker;
    this.root.getElementById('guide-title').textContent = card.title;
    this.root.getElementById('guide-body').textContent = card.body;
    this.root.getElementById('guide-progress').textContent = `${this.index + 1} / ${GUIDE_CARDS.length}`;
    this.root.getElementById('guide-previous').disabled = this.index === 0;
    this.root.getElementById('guide-next').textContent = this.index === GUIDE_CARDS.length - 1
      ? '开始体验'
      : '下一张';
  }
}
