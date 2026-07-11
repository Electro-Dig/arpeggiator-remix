export class RhythmGridOverlay {
  constructor(root = document) {
    this.cursor = root.getElementById('rhythm-cursor');
    this.label = root.getElementById('rhythm-cell-label');
    this.kitLabel = root.getElementById('drum-kit-label');
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
