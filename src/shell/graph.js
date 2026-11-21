// Đồ thị đường theo thời gian, dùng chung. Một trục, lưới mờ, nhãn trực tiếp, rê chuột xem số.
const DS = typeof document !== 'undefined' && document.documentElement.dataset.ui === 'ds';
const INK = DS ? '#090a2b' : '#16324f', MUTED = DS ? '#666878' : '#7c8b9a', GRID = DS ? '#e7e6ee' : '#e3ebe7', SURFACE = '#ffffff', FONT = DS ? 'Inter, sans-serif' : 'sans-serif';
const vi = (x, d = 1) => Number(x).toFixed(d).replace('.', ',');
// BẢN 3 (chủ 21/11: "cải thiện cả màu sắc biểu đồ, rồi chữ đừng đè lên"). Chỉ khi đồ thị nằm trong trang có lớp .ds.is-v3; bản 1 và bản 2 vẽ y như cũ.
// Màu: hai đường khác hẳn sắc và đậm nhạt (cam đất cho đường thứ nhất, tím cho đường thứ hai), nét dày hơn. Chữ: không còn chữ nào nằm trong vùng vẽ:
// tên đường và đường tham chiếu lên hàng chú giải ở trên, đơn vị trục dọc nằm riêng một dòng phía trên vạch số cao nhất.
const PAL3 = ['#c2410c', '#6254f4', '#087b91', '#14624f'];

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
    const z = window.__uiZoom || 1, d = Math.min((window.devicePixelRatio || 1) * z, 2), W = r.width / z; // z: trang đang được phóng bằng CSS zoom
    const cv = this.cv, g = cv.getContext('2d'), V3 = !!this.host.closest('.ds.is-v3'), L = 38, Rm = 14, { yMax, ref } = this.o;
    const colOf = (s, i) => (V3 && !s.thin && PAL3[i]) || s.color;
    // Bản 3: xếp hàng chú giải trước (tên từng đường, rồi đường tham chiếu), dài quá thì xuống dòng; vùng vẽ bắt đầu bên dưới chú giải
    const legend = []; let legRows = 0;
    if (V3) {
      g.setTransform(d, 0, 0, d, 0, 0); g.font = `600 11px ${FONT}`;
      const items = this.series.map((s, i) => (s.label && !s.thin ? { text: s.label, color: colOf(s, i) } : null)).filter(Boolean);
      if (ref != null && this.o.refLabel) items.push({ text: this.o.refLabel, color: MUTED, dash: true });
      let x = L, row = 0;
      items.forEach((it) => { const w = 22 + g.measureText(it.text).width; if (x > L && x + w > W - 4) { x = L; row++; } legend.push({ ...it, x, row }); x += w + 12; });
      legRows = items.length ? row + 1 : 0;
    }
    const T = V3 ? legRows * 16 + 26 : 12, B = V3 ? 36 : 30, H = Math.max(150, Math.min(210, W * 0.56)) + (V3 ? T - 12 + 6 : 0);
    if (cv.width !== Math.round(W * d) || cv.height !== Math.round(H * d)) { cv.width = Math.round(W * d); cv.height = Math.round(H * d); cv.style.height = H + 'px'; }
    g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, W, H);
    const pw = W - L - Rm, ph = H - T - B;
    let tMax = 20; for (const s of this.series) if (s.points.length) tMax = Math.max(tMax, s.points[s.points.length - 1][0]);
    const stepT = tMax <= 25 ? 5 : tMax <= 60 ? 10 : tMax <= 150 ? 30 : 60; tMax = Math.ceil((tMax * 1.04) / stepT) * stepT;
    const X = (t) => L + (t / tMax) * pw, Y = (v) => T + ph - (v / yMax) * ph;
    g.font = `11px ${FONT}`; g.textBaseline = 'middle';
    for (let v = 0; v <= yMax; v += 20) { g.strokeStyle = GRID; g.lineWidth = 1; g.beginPath(); g.moveTo(L, Y(v)); g.lineTo(W - Rm, Y(v)); g.stroke(); g.fillStyle = MUTED; g.textAlign = 'right'; g.fillText(String(v), L - 6, Y(v)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (let t = 0; t <= tMax; t += stepT) g.fillText(String(t), X(t), T + ph + 6);
    g.textAlign = 'right'; g.fillText(`thời gian (${this.o.xUnit})`, W - Rm, T + ph + (V3 ? 21 : 18));
    if (V3) { g.textBaseline = 'middle'; g.fillText(this.o.yTitle, L - 6, T - 14); } // đơn vị trục dọc: riêng một dòng, phía trên vạch số cao nhất
    else { g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(this.o.yTitle, 2, 0); }
    if (ref != null) {
      g.setLineDash([4, 4]); g.strokeStyle = MUTED; g.lineWidth = 1; g.beginPath(); g.moveTo(L, Y(ref)); g.lineTo(W - Rm, Y(ref)); g.stroke(); g.setLineDash([]);
      if (!V3) { g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillStyle = MUTED; g.fillText(this.o.refLabel, W - Rm, Y(ref) - 3); }
    }
    legend.forEach((it) => { // bản 3: mẫu nét + tên, nằm trên vùng vẽ
      const y = 9 + it.row * 16; g.strokeStyle = it.color; g.lineWidth = it.dash ? 1 : 2.5; g.setLineDash(it.dash ? [4, 4] : []); g.lineCap = 'round';
      g.beginPath(); g.moveTo(it.x, y); g.lineTo(it.x + 16, y); g.stroke(); g.setLineDash([]); g.lineCap = 'butt';
      g.font = `${it.dash ? 500 : 600} 11px ${FONT}`; g.fillStyle = it.dash ? MUTED : INK; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(it.text, it.x + 22, y + 0.5);
    });
    const at = (s, t) => { const p = s.points; if (!p.length) return null; if (t >= p[p.length - 1][0]) return p[p.length - 1][1]; let lo = 0, hi = p.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (p[m][0] <= t) lo = m; else hi = m; } const [t0, v0] = p[lo], [t1, v1] = p[hi]; return v0 + (v1 - v0) * ((t - t0) / Math.max(t1 - t0, 1e-9)); };
    const labels = [];
    for (const [si, s] of this.series.entries()) {
      const p = s.points, col = colOf(s, si); if (p.length < 2) continue;
      g.strokeStyle = col; g.lineWidth = s.thin ? 1.5 : V3 ? 2.5 : 2; g.globalAlpha = s.thin ? 0.75 : 1; g.lineJoin = 'round';
      g.beginPath(); p.forEach(([t, v], i) => (i ? g.lineTo(X(t), Y(v)) : g.moveTo(X(t), Y(v)))); g.stroke(); g.globalAlpha = 1;
      if (s.live) { const [t, v] = p[p.length - 1]; g.fillStyle = SURFACE; g.beginPath(); g.arc(X(t), Y(v), 6.5, 0, 6.283); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(X(t), Y(v), 4.5, 0, 6.283); g.fill(); }
      if (s.label && !s.thin && !V3) { const [t, v] = p[p.length - 1]; labels.push({ x: X(t), y: Y(v), text: s.label }); } // bản 3: tên đường đã có ở hàng chú giải
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
      const rows = this.series.map((s, i) => [s, colOf(s, i)]).filter(([s]) => s.points.length > 1 && !s.thin).map(([s, c]) => `<div><i style="background:${c}"></i>${s.label || ''}: <b>${vi(at(s, t))} ${this.o.yUnit}</b></div>`);
      this.tip.innerHTML = `<div class="lk-tip-t">t = ${vi(t)} ${this.o.xUnit}</div>${rows.join('') || `<div>${this.series.length} lần chạy</div>`}`;
      this.tip.hidden = false; this.tip.style.left = Math.min(this.hoverX + 10, W - 150) + 'px'; this.tip.style.top = '8px';
    } else this.tip.hidden = true;
  }
}
