import * as Tone from './tone.js';

class AudioBus {
  constructor() {
    this.ready = false;
    this.startPromise = null;

    this.input = new Tone.Gain(1);
    this.limiter = new Tone.Limiter(-1);
    this.analyser = new Tone.Analyser('waveform', 1024);
    this.mediaDestination = Tone.getContext().rawContext.createMediaStreamDestination();

    this.input.connect(this.limiter);
    this.limiter.connect(this.analyser);
    this.limiter.toDestination();
    this.limiter.connect(this.mediaDestination);
  }

  async start() {
    if (this.ready) return this;
    if (!this.startPromise) {
      this.startPromise = Tone.start()
        .then(() => {
          this.ready = true;
          return this;
        })
        .catch((error) => {
          this.startPromise = null;
          throw error;
        });
    }
    return this.startPromise;
  }

  get recordingStream() {
    return this.mediaDestination.stream;
  }
}

export const audioBus = new AudioBus();
