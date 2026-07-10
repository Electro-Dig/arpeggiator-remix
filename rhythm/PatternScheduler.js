export class PatternScheduler {
  constructor(initial) {
    this.current = initial;
    this.pending = null;
  }

  queue(pattern) {
    this.pending = pattern;
  }

  onStep(step) {
    if (step === 0 && this.pending !== null) {
      this.current = this.pending;
      this.pending = null;
    }
    return this.current;
  }
}
