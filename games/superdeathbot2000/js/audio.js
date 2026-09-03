'use strict';
/* ============================================================
   Synthesized sound effects. No audio files. Global: SFX
   Everything is built from oscillators + a shared noise buffer.
   ============================================================ */

const SFX = {
  ctx: null,
  master: null,
  noise: null,
  muted: false,
  _last: {},   // per-sound throttle timestamps

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.34;
    this.master.connect(this.ctx.destination);

    // 2 seconds of white noise, reused by every percussive sound
    const len = this.ctx.sampleRate * 2;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.34;
    return this.muted;
  },

  ok() { return this.ctx && !this.muted; },

  // limit how often a given sound may retrigger (machine gun spam, etc.)
  throttle(key, ms) {
    const t = performance.now();
    if (this._last[key] && t - this._last[key] < ms) return false;
    this._last[key] = t;
    return true;
  },

  _env(node, vol, attack, decay) {
    const t = this.ctx.currentTime;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    node.connect(g);
    g.connect(this.master);
    return { g, stopAt: t + attack + decay + 0.02 };
  },

  _noiseBurst(vol, decay, filterType, freq, q) {
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = U.rand(0.8, 1.25);
    const f = this.ctx.createBiquadFilter();
    f.type = filterType; f.frequency.value = freq; f.Q.value = q || 1;
    src.connect(f);
    const e = this._env(f, vol, 0.004, decay);
    src.start(t);
    src.stop(e.stopAt);
    return f;
  },

  _tone(type, f0, f1, vol, dur) {
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const e = this._env(o, vol, 0.006, dur);
    o.start(t);
    o.stop(e.stopAt);
  },

  /* ---------------- the actual sounds ---------------- */

  shoot() {
    if (!this.ok() || !this.throttle('shoot', 45)) return;
    this._noiseBurst(0.16, 0.05, 'highpass', 1400, 0.8);
    this._tone('square', 340, 120, 0.05, 0.05);
  },

  droneShot() {
    if (!this.ok() || !this.throttle('drone', 70)) return;
    this._tone('square', 900, 420, 0.045, 0.055);
  },

  missile() {
    if (!this.ok() || !this.throttle('missile', 60)) return;
    this._noiseBurst(0.13, 0.22, 'bandpass', 700, 1.4);
    this._tone('sawtooth', 180, 480, 0.05, 0.25);
  },

  laser() {
    if (!this.ok()) return;
    this._tone('sawtooth', 1500, 180, 0.16, 0.22);
    this._tone('sine', 2400, 300, 0.09, 0.18);
  },

  bazooka() {
    if (!this.ok()) return;
    this._noiseBurst(0.30, 0.18, 'lowpass', 900, 1);
    this._tone('square', 200, 60, 0.14, 0.2);
  },

  explode(scale) {
    if (!this.ok() || !this.throttle('explode', 30)) return;
    const s = U.clamp(scale || 1, 0.4, 3);
    this._noiseBurst(0.22 * s, 0.34 * s, 'lowpass', 520 / s, 1);
    this._tone('sine', 150 / s, 32, 0.14 * s, 0.32 * s);
  },

  nuke() {
    if (!this.ok()) return;
    this._noiseBurst(0.55, 2.4, 'lowpass', 320, 1);
    this._tone('sine', 90, 22, 0.34, 2.0);
    this._tone('sawtooth', 240, 40, 0.14, 1.4);
  },

  smash() {
    if (!this.ok()) return;
    this._noiseBurst(0.34, 0.5, 'lowpass', 380, 1);
    this._tone('sine', 130, 30, 0.24, 0.42);
  },

  // the chomp chomp chomp chomp
  chomp(i) {
    if (!this.ok()) return;
    const p = 1 + (i || 0) * 0.16;
    this._noiseBurst(0.24, 0.11, 'bandpass', 400 * p, 3.5);
    this._tone('square', 130 * p, 52 * p, 0.10, 0.10);
  },

  crumble() {
    if (!this.ok() || !this.throttle('crumble', 55)) return;
    this._noiseBurst(0.20, 0.62, 'lowpass', 700, 0.7);
  },

  levelup() {
    if (!this.ok()) return;
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => { if (this.ok()) this._tone('triangle', f, f * 1.01, 0.15, 0.24); }, i * 78);
    });
  },

  pick() {
    if (!this.ok()) return;
    this._tone('triangle', 700, 1300, 0.16, 0.16);
  },

  hurt() {
    if (!this.ok() || !this.throttle('hurt', 130)) return;
    this._tone('sawtooth', 260, 70, 0.16, 0.2);
    this._noiseBurst(0.14, 0.14, 'bandpass', 240, 2);
  },

  die() {
    if (!this.ok()) return;
    this._tone('sawtooth', 420, 40, 0.3, 1.5);
    this._noiseBurst(0.34, 1.3, 'lowpass', 340, 1);
  },

  teleport() {
    if (!this.ok()) return;
    this._tone('sine', 160, 2200, 0.22, 1.1);
    this._tone('sawtooth', 80, 900, 0.11, 1.1);
  },

  warn() {
    if (!this.ok() || !this.throttle('warn', 400)) return;
    this._tone('square', 880, 880, 0.10, 0.14);
  },
};
