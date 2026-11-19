// Đồ thị đường theo thời gian, dùng chung. Một trục, lưới mờ, nhãn trực tiếp, rê chuột xem số.
const DS = typeof document !== 'undefined' && document.documentElement.dataset.ui === 'ds';
const INK = DS ? '#090a2b' : '#16324f', MUTED = DS ? '#666878' : '#7c8b9a', GRID = DS ? '#e7e6ee' : '#e3ebe7', SURFACE = '#ffffff', FONT = DS ? 'Inter, sans-serif' : 'sans-serif';
const vi = (x, d = 1) => Number(x).toFixed(d).replace('.', ',');

export class RunGraph {
  constructor(host, { yMax = 80, yUnit = 'mL', xUnit = 's', yTitle = '', ref = null, refLabel = '' } = {}) {
    this.o = { yMax, yUnit, xUnit, yTitle, ref, refLabel };
    this.host = host; host.classList.add('lk-graph');
    this.cv = document.createElement('canvas'); this.tip = document.createElement('div'); this.tip.className = 'lk-tip'; this.tip.hidden = true;
    host.append(this.cv, this.tip);
    this.series = []; this.hoverX = null;
    this.cv.addEventListener('pointermove', (e) => { const r = this.cv.getBoundingClientRect(); this.hoverX = (e.clientX - r.left) / (window.__uiZoom || 1); this.draw(); });
    this.cv.addEventListener('pointerleave', () => { this.hoverX = null; this.tip.hidden = true; this.draw(); });
    new ResizeObserver(() => this.draw()).observe(host);
  }
  set(series) { this.series = series; this.draw(); }
  draw() {
    const r = this.host.getBoundingClientRect(); if (!r.width) return;
    const z = window.__uiZoom || 1, d = Math.min((window.devicePixelRatio || 1) * z, 2), W = r.width / z, H = Math.max(150, Math.min(210, W * 0.56)); // z: trang đang được phóng bằng CSS zoom
    const cv = this.cv, g = cv.getContext('2d');
    if (cv.width !== Math.round(W * d) || cv.height !== Math.round(H * d)) { cv.width = Math.round(W * d); cv.height = Math.round(H * d); cv.style.height = H + 'px'; }
    g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, W, H);
    const L = 38, Rm = 14, T = 12, B = 30, pw = W - L - Rm, ph = H - T - B, { yMax, ref } = this.o;
    let tMax = 20; for (const s of this.series) if (s.points.length) tMax = Math.max(tMax, s.points[s.points.length - 1][0]);
    const stepT = tMax <= 25 ? 5 : tMax <= 60 ? 10 : tMax <= 150 ? 30 : 60; tMax = Math.ceil((tMax * 1.04) / stepT) * stepT;
    const X = (t) => L + (t / tMax) * pw, Y = (v) => T + ph - (v / yMax) * ph;
    g.font = `11px ${FONT}`; g.textBaseline = 'middle';
    for (let v = 0; v <= yMax; v += 20) { g.strokeStyle = GRID; g.lineWidth = 1; g.beginPath(); g.moveTo(L, Y(v)); g.lineTo(W - Rm, Y(v)); g.stroke(); g.fillStyle = MUTED; g.textAlign = 'right'; g.fillText(String(v), L - 6, Y(v)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (let t = 0; t <= tMax; t += stepT) g.fillText(String(t), X(t), T + ph + 6);
    g.textAlign = 'right'; g.fillText(`thời gian (${this.o.xUnit})`, W - Rm, T + ph + 18);
    g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(this.o.yTitle, 2, 0);
    if (ref != null) {
      g.setLineDash([4, 4]); g.strokeStyle = MUTED; g.beginPath(); g.moveTo(L, Y(ref)); g.lineTo(W - Rm, Y(ref)); g.stroke(); g.setLineDash([]);
      g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillStyle = MUTED; g.fillText(this.o.refLabel, W - Rm, Y(ref) - 3);
    }
    const at = (s, t) => { const p = s.points; if (!p.length) return null; if (t >= p[p.length - 1][0]) return p[p.length - 1][1]; let lo = 0, hi = p.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (p[m][0] <= t) lo = m; else hi = m; } const [t0, v0] = p[lo], [t1, v1] = p[hi]; return v0 + (v1 - v0) * ((t - t0) / Math.max(t1 - t0, 1e-9)); };
    const labels = [];
    for (const s of this.series) {
      const p = s.points; if (p.length < 2) continue;
      g.strokeStyle = s.color; g.lineWidth = s.thin ? 1.5 : 2; g.globalAlpha = s.thin ? 0.75 : 1; g.lineJoin = 'round';
      g.beginPath(); p.forEach(([t, v], i) => (i ? g.lineTo(X(t), Y(v)) : g.moveTo(X(t), Y(v)))); g.stroke(); g.globalAlpha = 1;
      if (s.live) { const [t, v] = p[p.length - 1]; g.fillStyle = SURFACE; g.beginPath(); g.arc(X(t), Y(v), 6.5, 0, 6.283); g.fill(); g.fillStyle = s.color; g.beginPath(); g.arc(X(t), Y(v), 4.5, 0, 6.283); g.fill(); }
      if (s.label && !s.thin) { const [t, v] = p[p.length - 1]; labels.push({ x: X(t), y: Y(v), text: s.label }); }
    }
    // Nhãn trực tiếp đặt ở cuối mỗi đường, so le xuống dưới để không chồng nhau.
    labels.sort((a, b) => a.x - b.x); g.font = `600 11px ${FONT}`; g.textBaseline = 'middle';
    labels.forEach((l, i) => {
      const w = g.measureText(l.text).width, yy = Math.min(l.y + 15 + i * 14, T + ph - 8);
      let xx = l.x + 7; if (xx + w > W - 2) xx = l.x - 7 - w;
      g.fillStyle = 'rgba(255,255,255,0.88)'; g.fillRect(xx - 2, yy - 7, w + 4, 14); g.fillStyle = INK; g.textAlign = 'left'; g.fillText(l.text, xx, yy);
    });
    if (this.hoverX != null && this.series.length && this.hoverX >= L && this.hoverX <= W - Rm) {
      const t = ((this.hoverX - L) / pw) * tMax;
      g.strokeStyle = MUTED; g.lineWidth = 1; g.beginPath(); g.moveTo(this.hoverX, T); g.lineTo(this.hoverX, T + ph); g.stroke();
      const rows = this.series.filter((s) => s.points.length > 1 && !s.thin).map((s) => `<div><i style="background:${s.color}"></i>${s.label || ''}: <b>${vi(at(s, t))} ${this.o.yUnit}</b></div>`);
      this.tip.innerHTML = `<div class="lk-tip-t">t = ${vi(t)} ${this.o.xUnit}</div>${rows.join('') || `<div>${this.series.length} lần chạy</div>`}`;
      this.tip.hidden = false; this.tip.style.left = Math.min(this.hoverX + 10, W - 150) + 'px'; this.tip.style.top = '8px';
    } else this.tip.hidden = true;
  }
}
