export class RhythmGridOverlay {
  constructor(root = document) {
    this.cursor = root.getElementById('rhythm-cursor');
    this.pointer = root.getElementById('rhythm-pointer');
    this.label = root.getElementById('rhythm-cell-label');
    this.kitLabel = root.getElementById('drum-kit-label');
  }

  updatePointer({ x, y }) {
    if (!this.pointer) return;
    const normalizedX = Math.max(0, Math.min(1, Number(x) || 0));
    const normalizedY = Math.max(0, Math.min(1, Number(y) || 0));
    this.pointer.style.transform = `translate3d(${normalizedX * 100}%, ${normalizedY * 100}%, 0)`;
    this.pointer.style.opacity = '1';
  }

  updatePosition({ x, y }) {
    if (!this.cursor) return;
    const column = Math.max(0, Math.min(6, Number(x) || 0));
    const row = 6 - Math.max(0, Math.min(6, Number(y) || 0));
    this.cursor.style.transform = `translate3d(${column * 100}%, ${row * 100}%, 0)`;
  }

  confirm({ label }) {
    if (this.label && label) this.label.textContent = label;
  }

  updateKit({ name } = {}) {
    if (this.kitLabel && name) this.kitLabel.textContent = `KIT / ${name}`;
  }
}
