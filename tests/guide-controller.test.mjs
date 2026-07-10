import assert from 'node:assert/strict';
import test from 'node:test';

class FakeElement extends EventTarget {
  constructor() {
    super();
    this.textContent = '';
    this.disabled = false;
    this.open = false;
  }

  click() {
    this.dispatchEvent(new Event('click'));
  }

  showModal() {
    this.open = true;
  }

  close() {
    this.open = false;
  }
}

function createRoot() {
  const ids = [
    'guide-dialog', 'open-guide', 'guide-previous', 'guide-next', 'guide-skip',
    'guide-kicker', 'guide-title', 'guide-body', 'guide-progress',
  ];
  const elements = Object.fromEntries(ids.map((id) => [id, new FakeElement()]));
  return {
    elements,
    getElementById(id) {
      return elements[id] || null;
    },
  };
}

test('guide opens only on demand and navigates all three cards', async () => {
  const root = createRoot();
  globalThis.document = root;
  const { GuideController } = await import('../GuideController.js');
  const guide = new GuideController(root);

  assert.equal(root.elements['guide-dialog'].open, false);
  root.elements['open-guide'].click();
  assert.equal(root.elements['guide-dialog'].open, true);
  assert.equal(root.elements['guide-progress'].textContent, '1 / 3');

  root.elements['guide-next'].click();
  root.elements['guide-next'].click();
  assert.equal(root.elements['guide-progress'].textContent, '3 / 3');
  assert.equal(root.elements['guide-next'].textContent, '开始体验');

  root.elements['guide-next'].click();
  assert.equal(root.elements['guide-dialog'].open, false);
  assert.equal(guide.index, 2);
});

test('recording busy blocks opening and skip emits a neutral lock', async () => {
  const root = createRoot();
  globalThis.document = root;
  const { GuideController } = await import('../GuideController.js');
  const guide = new GuideController(root);
  guide.setRecordingBusy(true);
  assert.equal(guide.open(), false);
  assert.equal(root.elements['open-guide'].disabled, true);

  guide.setRecordingBusy(false);
  let detail;
  guide.addEventListener('contextchange', (event) => { detail = event.detail; });
  guide.open();
  guide.skipFromGesture();
  assert.equal(detail.reason, 'gesture-skip');
  assert.ok(detail.neutralUntil >= performance.now());
});
