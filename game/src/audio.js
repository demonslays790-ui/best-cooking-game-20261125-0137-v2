// audio.js — every sound is synthesised with WebAudio: no audio files, no network.
// One clear job: bleeps, sizzles and a tiny kitchen music loop.
export class KitchenAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicOn = false;
    this._musicTimer = null;
    this._sizzleNodes = null;
  }

  // Browsers only let audio start after a user gesture; call from the first key/click.
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext ?? window.webkitAudioContext;
      this.ctx = new AC();
      this._startMusic();
    } catch {
      this.ctx = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this._sizzleNodes) this._sizzleNodes.gain.gain.value = 0;
    return this.muted;
  }

  _tone(freq, dur, type = 'sine', vol = 0.16, slideTo = null, when = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  _noise(dur, vol = 0.12, filterFreq = 1800, when = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(gain).connect(this.ctx.destination);
    src.start(t0);
  }

  chop() { this._noise(0.09, 0.22, 900); this._tone(180, 0.07, 'triangle', 0.12, 90); }
  pick() { this._tone(620, 0.08, 'sine', 0.14, 880); }
  drop() { this._tone(340, 0.08, 'sine', 0.12, 240); }
  plate() { this._tone(520, 0.1, 'triangle', 0.14, 700); this._tone(780, 0.12, 'sine', 0.1, 0, 0.05); }
  ding() { this._tone(1046, 0.35, 'sine', 0.16); this._tone(1568, 0.4, 'sine', 0.1, 0, 0.08); }
  serve() {
    [523, 659, 784, 1046].forEach((f, i) => this._tone(f, 0.22, 'triangle', 0.14, 0, i * 0.07));
  }
  error() { this._tone(160, 0.22, 'sawtooth', 0.1, 110); }
  burn() { this._noise(0.5, 0.1, 500); this._tone(220, 0.4, 'sawtooth', 0.08, 90); }
  walkout() { this._tone(392, 0.3, 'triangle', 0.12, 196); this._tone(311, 0.4, 'triangle', 0.1, 0, 0.15); }
  rush() { [440, 554, 659].forEach((f, i) => this._tone(f, 0.18, 'square', 0.07, 0, i * 0.09)); }
  click() { this._tone(880, 0.05, 'sine', 0.1); }

  // A looping frying-pan hiss while any stove is cooking.
  sizzleStart() {
    if (!this.ctx || this.muted || this._sizzleNodes) return;
    const len = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3200;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.035;
    src.connect(filter).connect(gain).connect(this.ctx.destination);
    src.start();
    this._sizzleNodes = { src, gain };
  }

  sizzleStop() {
    if (!this._sizzleNodes) return;
    try { this._sizzleNodes.src.stop(); } catch { /* already stopped */ }
    this._sizzleNodes = null;
  }

  // Cheerful 8-bar pluck loop: bass + melody, quiet enough to sit under the SFX.
  _startMusic() {
    if (!this.ctx || this._musicTimer) return;
    const melody = [523, 659, 784, 659, 587, 698, 880, 698, 523, 659, 784, 1046, 880, 784, 659, 587];
    const bass = [131, 165, 196, 165, 131, 165, 196, 247];
    let step = 0;
    this._musicTimer = setInterval(() => {
      if (this.muted || !this.ctx) return;
      const m = melody[step % melody.length];
      const b = bass[Math.floor(step / 2) % bass.length];
      this._tone(m, 0.24, 'triangle', 0.045);
      if (step % 2 === 0) this._tone(b, 0.4, 'sine', 0.06);
      step += 1;
    }, 300);
  }
}
