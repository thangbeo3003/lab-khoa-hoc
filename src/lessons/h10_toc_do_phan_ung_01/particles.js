// "Nhìn vào trong": mô hình hạt 2D minh hoạ thuyết va chạm. Không theo tỉ lệ thật.
import { ATOM } from '../../kit/materials.js';

const TEMP_MUL = { 25: 1, 35: 1.25, 45: 1.55 };
const V0 = 78, THRESH = 1.3 * V0, R = 6;

export class ParticleView {
  constructor(canvas) {
    this.cv = canvas; this.g = canvas.getContext('2d');
    this.p = { n: 28, temp: 25, pieces: 1 };
    this.parts = []; this.blocks = []; this.flashes = []; this.hits = []; this.eff = [];
    this.on = false; this.last = 0; this.W = 300; this.H = 200;
    this._tick = this._tick.bind(this);
    new ResizeObserver(() => this._resize()).observe(canvas);
  }
  setParams(p) { Object.assign(this.p, p); this._build(); }
  start() { if (this.on) return; this.on = true; this._resize(); this.last = this.now(); if (!window.__FILM) requestAnimationFrame(this._tick); }
  // Đồng hồ: thật khi dùng bình thường, ảo khi quay phim (tiến bằng step).
  now() { return window.__FILM ? (this.vt || 0) : performance.now(); }
  step(dt) { if (!this.on) return; this.vt = (this.vt || 0) + dt * 1000; this._tick(this.vt); }
  stop() { this.on = false; }
  stats() {
    const now = this.now(), win = 4000;
    this.hits = this.hits.filter((t) => now - t < win); this.eff = this.eff.filter((t) => now - t < win);
    return { hits: this.hits.length / (win / 1000), eff: this.eff.length / (win / 1000) };
  }
  _resize() {
    const r = this.cv.getBoundingClientRect(); if (!r.width) return;
    const d = Math.min(window.devicePixelRatio || 1, 2), cw = Math.round(r.width * d), ch = Math.round(r.height * d);
    if (cw === this.cv.width && ch === this.cv.height && this.parts.length) return; // cỡ không đổi: giữ nguyên hạt, không xoá hình
    this.W = r.width; this.H = r.height; this.cv.width = cw; this.cv.height = ch;
    this.g.setTransform(d, 0, 0, d, 0, 0); this._build();
    if (this.on) this._draw(this.now()); // đổi cỡ thì xoá khung vẽ, nên vẽ lại ngay
  }
  _build() {
    const { W, H } = this, { n, temp, pieces } = this.p;
    const side = Math.min(W, H) * 0.36, k = Math.sqrt(pieces), s = side / k;
    this.blocks = [];
    const spanX = pieces === 1 ? 0 : Math.min(W * 0.62, side * 2.6), spanY = pieces === 1 ? 0 : Math.min(H * 0.56, side * 1.9);
    for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) {
      const cx = W / 2 + (k === 1 ? 0 : (i / (k - 1) - 0.5) * spanX), cy = H / 2 + (k === 1 ? 0 : (j / (k - 1) - 0.5) * spanY);
      this.blocks.push({ x: cx - s / 2, y: cy - s / 2, w: s, h: s });
    }
    const mul = TEMP_MUL[temp] || 1;
    this.parts = [];
    for (let i = 0; i < n; i++) {
      const u = ((i * 0.6180339) % 1), a = (i * 2.399963) % (Math.PI * 2), sp = V0 * mul * (0.45 + 1.1 * u);
      let x, y, tries = 0;
      do { x = R + ((i * 0.7548 + tries * 0.31) % 1) * (W - 2 * R); y = R + ((i * 0.5698 + tries * 0.17) % 1) * (H - 2 * R); tries++; }
      while (tries < 30 && this.blocks.some((b) => x > b.x - R - 2 && x < b.x + b.w + R + 2 && y > b.y - R - 2 && y < b.y + b.h + R + 2));
      this.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, sp });
    }
  }
  _tick(now) {
    if (!this.on) return;
    const dt = Math.min(0.04, (now - this.last) / 1000); this.last = now;
    const { W, H } = this;
    for (const p of this.parts) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < R) { p.x = R; p.vx = Math.abs(p.vx); } else if (p.x > W - R) { p.x = W - R; p.vx = -Math.abs(p.vx); }
      if (p.y < R) { p.y = R; p.vy = Math.abs(p.vy); } else if (p.y > H - R) { p.y = H - R; p.vy = -Math.abs(p.vy); }
      for (const b of this.blocks) {
        if (p.x > b.x - R && p.x < b.x + b.w + R && p.y > b.y - R && p.y < b.y + b.h + R) {
          const dl = p.x - (b.x - R), dr = b.x + b.w + R - p.x, du = p.y - (b.y - R), dd = b.y + b.h + R - p.y, m = Math.min(dl, dr, du, dd);
          if (m === dl) { p.x = b.x - R; p.vx = -Math.abs(p.vx); } else if (m === dr) { p.x = b.x + b.w + R; p.vx = Math.abs(p.vx); }
          else if (m === du) { p.y = b.y - R; p.vy = -Math.abs(p.vy); } else { p.y = b.y + b.h + R; p.vy = Math.abs(p.vy); }
          this.hits.push(now);
          const strong = p.sp >= THRESH;
          if (strong) this.eff.push(now);
          this.flashes.push({ x: p.x, y: p.y, t: now, strong });
          break;
        }
      }
    }
    this._draw(now);
    if (!window.__FILM) requestAnimationFrame(this._tick);
  }
  _draw(now) {
    const g = this.g, { W, H } = this;
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#f4faf7'; g.fillRect(0, 0, W, H);
    for (const b of this.blocks) {
      g.fillStyle = '#cfd8d3'; g.strokeStyle = '#8fa39b'; g.lineWidth = 1.5;
      g.beginPath(); g.roundRect(b.x, b.y, b.w, b.h, Math.min(8, b.w / 5)); g.fill(); g.stroke();
      if (b.w > 54) { g.fillStyle = '#16324f'; g.font = '600 13px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CaCO₃', b.x + b.w / 2, b.y + b.h / 2); }
    }
    this.flashes = this.flashes.filter((f) => now - f.t < 450);
    for (const f of this.flashes) {
      const k = (now - f.t) / 450;
      g.strokeStyle = f.strong ? `rgba(30,158,106,${1 - k})` : `rgba(124,139,154,${0.5 * (1 - k)})`;
      g.lineWidth = f.strong ? 3 : 1.5; g.beginPath(); g.arc(f.x, f.y, (f.strong ? 8 : 5) + k * (f.strong ? 18 : 8), 0, 6.283); g.stroke();
    }
    for (const p of this.parts) {
      const strong = p.sp >= THRESH;
      g.beginPath(); g.arc(p.x, p.y, R, 0, 6.283);
      g.fillStyle = strong ? '#ffe2c2' : ATOM.H; g.fill();
      g.lineWidth = strong ? 2.6 : 1.8; g.strokeStyle = ATOM.pos; g.stroke();
      g.fillStyle = '#b55a00'; g.font = '700 10px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('+', p.x, p.y + 0.5);
    }
  }
}
