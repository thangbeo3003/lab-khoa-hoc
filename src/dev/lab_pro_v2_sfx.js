// Bộ âm thanh phòng thí nghiệm siêu nhẹ bằng Web Audio API (0 KB tài nguyên ngoài).
// Tạo âm thanh tinh tế: bấm nút, đặt cân, rót chất lỏng, sủi bọt, hoàn thành bước.
class LabSFX {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }
  _ensure() {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  }
  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) this.click();
    return this.enabled;
  }
  // Tiếng click cơ học nhẹ (bấm đồng hồ, chọn nút)
  click(freq = 760) {
    const c = this._ensure(); if (!c) return;
    const t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * 0.45, t + 0.045);
    g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.055);
  }
  // Tiếng thuỷ tinh chạm nhẹ (mở nắp, đặt đĩa lên cân)
  clink() {
    const c = this._ensure(); if (!c) return;
    const t = c.currentTime;
    [1840, 2780].forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(i === 0 ? 0.045 : 0.02, t); g.gain.exponentialRampToValueAtTime(0.0008, t + 0.14);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.15);
    });
  }
  // Tiếng bíp nhẹ khi cân điện tử ổn định số gam
  scaleBeep() {
    const c = this._ensure(); if (!c) return;
    const t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(1320, t);
    g.gain.setValueAtTime(0.04, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.095);
  }
  // Tiếng rót chất lỏng (nhiễu lọc băng thông dâng cao dần theo mực nước)
  pour(dur = 0.85) {
    const c = this._ensure(); if (!c) return;
    const t = c.currentTime, sr = c.sampleRate, len = Math.floor(sr * dur);
    const buf = c.createBuffer(1, len, sr), data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass';
    f.frequency.setValueAtTime(620, t); f.frequency.exponentialRampToValueAtTime(1450, t + dur); f.Q.value = 3.2;
    const g = c.createGain();
    g.gain.setValueAtTime(0.001, t); g.gain.linearRampToValueAtTime(0.055, t + 0.12);
    g.gain.setValueAtTime(0.05, t + Math.max(0.15, dur - 0.15)); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(c.destination); src.start(t); src.stop(t + dur + 0.02);
  }
  // Tiếng mồi đèn cồn nhẹ
  flame() {
    const c = this._ensure(); if (!c) return;
    const t = c.currentTime, sr = c.sampleRate, len = Math.floor(sr * 0.25);
    const buf = c.createBuffer(1, len, sr), data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(420, t); f.frequency.exponentialRampToValueAtTime(140, t + 0.25);
    const g = c.createGain(); g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    src.connect(f).connect(g).connect(c.destination); src.start(t); src.stop(t + 0.26);
  }
  // Tiếng bọt sủi nhẹ lúc phản ứng bắt đầu
  fizz() {
    const c = this._ensure(); if (!c) return;
    const t = c.currentTime, sr = c.sampleRate, len = Math.floor(sr * 0.55);
    const buf = c.createBuffer(1, len, sr), data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.7 ? 1 : 0.25);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.setValueAtTime(2400, t);
    const g = c.createGain(); g.gain.setValueAtTime(0.032, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    src.connect(f).connect(g).connect(c.destination); src.start(t); src.stop(t + 0.56);
  }
  // Tiếng chuông thanh khi xong lần chạy hoặc đạt bước
  done() {
    const c = this._ensure(); if (!c) return;
    const t = c.currentTime;
    [587.33, 880, 1174.66].forEach((freq, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(freq, t + i * 0.07);
      g.gain.setValueAtTime(0.001, t + i * 0.07);
      g.gain.linearRampToValueAtTime(0.045, t + i * 0.07 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0008, t + i * 0.07 + 0.34);
      o.connect(g).connect(c.destination); o.start(t + i * 0.07); o.stop(t + i * 0.07 + 0.36);
    });
  }
}

export const sfx = new LabSFX();
