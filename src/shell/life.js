// Khuôn "Đời sống" dùng chung cho mọi bài: hai trường hợp chạy song song theo thời gian, vẽ bằng code (motion HTML).
// Mỗi bài chỉ đổi dữ liệu, không dựng cảnh mới và không cần ảnh:
//   data = { title, factor, doneText, speed, gasLabel, sides: [{ label, form: 'vien' | 'vun', seconds }, { ... }] }
// Hình là hàm của thời gian (render(r)), nên cùng khuôn này quay ra video ngắn được.
// Tốc độ được cho thấy bằng 4 thứ cùng lúc: mật độ bọt, bọt bắn khỏi mặt nước, thước "tốc độ sủi", độ dốc của hai đường đồ thị.
import { h, fmt } from './shell.js';

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ease = (k) => k * k * (3 - 2 * k);
const frac = (x) => x - Math.floor(x);
const rnd = (i, k) => frac(Math.sin(i * 127.1 + k * 311.7) * 43758.5453); // số giả ngẫu nhiên cố định theo chỉ số
const DROP = 1.0; // giây thật cho động tác thả
const COLORS = ['#6fb3ff', '#f08a24']; // màu cố định của trường hợp 1 và 2 (dùng cho số thứ tự, thanh, đường đồ thị)

function fitCanvas(cv) {
  const box = cv.getBoundingClientRect(); if (box.width < 4 || box.height < 4) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2), W = box.width, H = box.height;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
  return { g, W, H };
}

export class LifeRace {
  constructor(host, data) {
    this.data = data; this.r = 0; this.idle = 0; this.playing = false; this.done = false;
    this.speed = window.__FILM_SPEED || data.speed || 1;
    this.maxS = Math.max(...data.sides.map((s) => s.seconds)); this.minS = Math.min(...data.sides.map((s) => s.seconds));
    this.total = DROP + this.maxS / this.speed;
    this.sides = data.sides.map((s, i) => {
      const cv = h('canvas', { class: 'lf-cv' }), col = s.color || COLORS[i];
      const timer = h('span', { class: 'lf-timer', text: '0,0 s' });
      const bar = h('i', { style: `background:${col}` }), badge = h('em', { class: 'lf-badge', text: data.doneText || 'Xong' });
      const segs = [0, 1, 2, 3, 4].map(() => h('u'));
      const el = h('figure', { class: 'lf-side' },
        h('div', { class: 'lf-img' }, cv, badge, h('span', { class: 'lf-no', style: `background:${col}`, text: String(i + 1) })),
        h('figcaption', {}, h('b', { text: s.label }), timer,
          h('div', { class: 'lf-meter' }, h('span', { text: 'Tốc độ sủi' }), h('div', { class: 'lf-segs' }, segs)),
          h('div', { class: 'lf-bar' }, bar)));
      return { s, el, cv, timer, bar, badge, segs, col };
    });
    this.chart = h('canvas', { class: 'lf-cv' });
    this.caption = h('p', { class: 'lf-caption', text: '' });
    host.replaceChildren(h('div', { class: 'lf' },
      h('div', { class: 'lf-head' }, h('b', { text: data.title }), h('span', { class: 'lf-factor', text: 'Yếu tố: ' + data.factor })),
      h('div', { class: 'lf-sides' }, this.sides.map((x) => x.el), h('figure', { class: 'lf-chart' }, this.chart)), this.caption));
    new ResizeObserver(() => this.render(this.r)).observe(host);
    this.render(0);
  }
  play() { this.r = 0; this.done = false; this.playing = true; this.render(0); }
  // Gọi mỗi khung hình với khoảng thời gian thật đã trôi qua.
  advance(dt) {
    this.idle += dt;
    if (!this.playing) { if (!this.done) this.render(0); return; }
    this.r = Math.min(this.total, this.r + dt);
    if (this.r >= this.total) { this.playing = false; this.done = true; }
    this.render(this.r);
  }
  render(r) {
    const started = this.playing || this.done, T = started ? Math.max(0, r - DROP) * this.speed : 0;
    this.sides.forEach((x) => {
      const { s, timer, bar, badge, el, segs, col } = x;
      const d = started ? clamp01(r / DROP) : 0, p = clamp01(T / s.seconds), fin = p >= 1;
      // tốc độ tức thời so với lúc nhanh nhất của cả hai bên: 3(1-p)²/giây
      const rate = started && d >= 0.6 && !fin ? (Math.pow(1 - p, 2) / s.seconds) / (1 / this.minS) : 0, lit = rate > 0 ? Math.max(1, Math.round(rate * 5)) : 0;
      segs.forEach((u, i) => { u.style.background = i < lit ? col : 'rgba(255,255,255,0.14)'; });
      timer.textContent = fmt(Math.min(T, s.seconds), 1) + ' s';
      bar.style.width = (p * 100).toFixed(1) + '%';
      badge.style.opacity = fin ? '1' : '0'; badge.style.transform = fin ? 'scale(1)' : 'scale(0.8)';
      el.classList.toggle('is-done', fin);
      this.drawGlass(x, { d, p, fin, started, rate, time: r + this.idle });
    });
    this.drawChart(T, started);
    const [a, b] = this.data.sides, k = fmt(Math.max(a.seconds, b.seconds) / Math.min(a.seconds, b.seconds), 0);
    this.caption.textContent = this.done ? `${b.label} xong sau ${fmt(b.seconds, 0)} s, ${a.label.toLowerCase()} mất ${fmt(a.seconds, 0)} s: nhanh gấp ${k} lần, lượng khí bằng nhau.` : started ? 'Đường nào dốc hơn thì bên đó đang nhanh hơn.' : 'Hai cốc nước giống hệt nhau. Chỉ khác cách cho viên sủi vào.';
  }

  // Đồ thị nhỏ: lượng khí đã thoát ra theo thời gian. Hai đường cùng lên tới 100%, khác nhau ở độ dốc.
  drawChart(T, started) {
    const c = fitCanvas(this.chart); if (!c) return; const { g, W, H } = c;
    const L = 30, R = 12, Tp = 22, B = 22, pw = W - L - R, ph = H - Tp - B, X = (t) => L + (t / this.maxS) * pw, Y = (v) => Tp + ph - v * ph;
    g.fillStyle = '#141b23'; g.fillRect(0, 0, W, H);
    g.font = '11px sans-serif'; g.fillStyle = '#9fb0bf'; g.textBaseline = 'top'; g.textAlign = 'left'; g.fillText(this.data.gasLabel || 'Khí đã thoát ra', 6, 5);
    g.strokeStyle = 'rgba(255,255,255,0.1)'; g.lineWidth = 1; g.textBaseline = 'middle'; g.textAlign = 'right';
    [0, 0.5, 1].forEach((v) => { g.beginPath(); g.moveTo(L, Y(v)); g.lineTo(W - R, Y(v)); g.stroke(); g.fillText(Math.round(v * 100) + '%', L - 4, Y(v)); });
    g.textBaseline = 'top'; g.textAlign = 'center';
    for (let t = 0; t <= this.maxS; t += this.maxS > 16 ? 8 : 4) g.fillText(t + ' s', X(t), Tp + ph + 5);
    this.sides.forEach(({ s, col }, i) => {
      const val = (t) => 1 - Math.pow(1 - clamp01(t / s.seconds), 3), tEnd = started ? Math.min(T, this.maxS) : 0;
      g.strokeStyle = col; g.lineWidth = 2.5; g.lineJoin = 'round'; g.beginPath();
      for (let k = 0; k <= 60; k++) { const t = (tEnd * k) / 60; k ? g.lineTo(X(t), Y(val(t))) : g.moveTo(X(t), Y(val(t))); }
      g.stroke();
      const mx = X(tEnd), my = Y(val(tEnd));
      g.fillStyle = '#141b23'; g.beginPath(); g.arc(mx, my, 7, 0, 6.283); g.fill();
      g.fillStyle = col; g.beginPath(); g.arc(mx, my, 5.5, 0, 6.283); g.fill();
      g.fillStyle = '#0f151b'; g.font = '700 9px sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillText(String(i + 1), mx, my + 0.5); g.font = '11px sans-serif'; g.fillStyle = '#9fb0bf'; g.textBaseline = 'top';
    });
  }

  // Vẽ một cốc thuỷ tinh nhìn hơi từ trên xuống: miệng và đáy bầu dục, đáy dày, thành hai nét, vệt sáng.
  drawGlass({ cv, s, col }, { d, p, fin, started, rate, time }) {
    const c = fitCanvas(cv); if (!c) return; const { g, W, H } = c;
    const crushed = s.form === 'vun', left = Math.pow(1 - p, 3);
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1d2935'); bg.addColorStop(1, '#141b23');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const by = H * 0.9, gh = Math.min(H * 0.68, W * 0.95), u = gh / 220, cx = W / 2, top = by - gh;
    const wt = gh * 0.66, wb = gh * 0.5, half = (y) => (wb + (wt - wb) * ((by - y) / gh)) / 2, ry = (y) => half(y) * 0.2;
    const baseH = 16 * u, bot = by - baseH, wl = top + gh * 0.2;
    const ell = (y, k = 1, a0 = 0, a1 = 6.2832) => { g.beginPath(); g.ellipse(cx, y, half(y) * k, ry(y) * k, 0, a0, a1); };
    // Nền kiểu khoa học, vẽ một lần trong khuôn nên bài nào cũng có: tường kẻ ô như giấy kỹ thuật,
    // quầng sáng sau cốc, mặt bàn kẻ lưới phối cảnh để có chiều sâu, vạch đo cạnh cốc.
    const hz = by - gh * 0.14, cell = Math.max(14, 20 * u);
    g.lineWidth = 1; g.strokeStyle = 'rgba(140,190,230,0.075)';
    for (let x = cx % cell; x < W; x += cell) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, hz); g.stroke(); }
    for (let y = hz % cell; y < hz; y += cell) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    const glow = g.createRadialGradient(cx, top + gh * 0.45, 4, cx, top + gh * 0.45, gh * 0.95); glow.addColorStop(0, 'rgba(120,180,235,0.22)'); glow.addColorStop(1, 'rgba(120,180,235,0)');
    g.fillStyle = glow; g.fillRect(0, 0, W, hz);
    const fl = g.createLinearGradient(0, hz, 0, H); fl.addColorStop(0, '#17212b'); fl.addColorStop(1, '#0c1116'); g.fillStyle = fl; g.fillRect(0, hz, W, H - hz);
    g.strokeStyle = 'rgba(140,190,230,0.14)';
    for (let k = -10; k <= 10; k++) { g.beginPath(); g.moveTo(cx + k * cell * 0.9, hz); g.lineTo(cx + k * cell * 4.4, H); g.stroke(); }
    for (let k = 1; k <= 6; k++) { const y = hz + (H - hz) * Math.pow(k / 6, 1.8); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.strokeStyle = 'rgba(180,215,240,0.4)'; g.lineWidth = 1.2 * u; g.beginPath(); g.moveTo(0, hz); g.lineTo(W, hz); g.stroke();
    g.strokeStyle = 'rgba(180,215,240,0.55)'; g.fillStyle = 'rgba(180,215,240,0.7)'; g.lineWidth = 1 * u; g.font = `${Math.max(8, 9 * u)}px sans-serif`; g.textAlign = 'left'; g.textBaseline = 'middle';
    [50, 100, 150, 200].forEach((v) => { const y = bot - (v / 250) * (bot - top); g.beginPath(); g.moveTo(cx + half(y) + 7 * u, y); g.lineTo(cx + half(y) + (v % 100 ? 13 : 18) * u, y); g.stroke(); if (u > 0.6 && v % 100 === 0) g.fillText(v + ' mL', cx + half(y) + 21 * u, y); });
    const sh = g.createRadialGradient(cx + 10 * u, by + 3 * u, 2, cx + 10 * u, by + 3 * u, wb * 0.95); sh.addColorStop(0, 'rgba(0,0,0,0.55)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sh; g.beginPath(); g.ellipse(cx + 10 * u, by + 3 * u, wb * 0.95, ry(by) * 1.5, 0, 0, 6.2832); g.fill();
    // thân cốc phía sau + nửa sau của miệng cốc
    const body = () => { g.beginPath(); g.moveTo(cx - half(top), top); g.lineTo(cx - half(by), by); g.ellipse(cx, by, half(by), ry(by), 0, Math.PI, 0, true); g.lineTo(cx + half(top), top); g.ellipse(cx, top, half(top), ry(top), 0, 0, Math.PI, true); g.closePath(); };
    body(); g.fillStyle = 'rgba(214,236,246,0.05)'; g.fill();
    g.strokeStyle = 'rgba(214,236,246,0.4)'; g.lineWidth = 1.4 * u; ell(top, 1, Math.PI, 6.2832); g.stroke();
    // nước: mặt bên có sáng tối như khối trụ, mặt thoáng là một bầu dục sáng hơn
    // nước đổi màu dần theo lượng viên sủi đã tan: trong xanh → cam tươi (cam bão hoà + đậm dần để không ra nâu đục trên nền tối)
    // đi qua màu vàng nhạt ở giữa (xanh → vàng → cam) để lúc tan dở không bị xám nâu
    const tint = started ? 1 - left : 0, k1 = Math.min(1, tint * 2), k2 = Math.max(0, tint * 2 - 1), lp = (a, b, k) => a + (b - a) * k;
    const ch = (a, b, c) => Math.round(lp(lp(a, b, k1), c, k2));
    const wc = (al) => `rgba(${ch(120, 255, 255)},${ch(195, 222, 158)},${ch(238, 120, 38)},${Math.min(0.94, al * (1 + 0.85 * tint)).toFixed(3)})`;
    const wg = g.createLinearGradient(cx - half(wl), 0, cx + half(wl), 0); wg.addColorStop(0, wc(0.62)); wg.addColorStop(0.3, wc(0.34)); wg.addColorStop(0.7, wc(0.3)); wg.addColorStop(1, wc(0.6));
    const water = () => { g.beginPath(); g.moveTo(cx - half(wl) + 3 * u, wl); g.lineTo(cx - half(bot) + 3 * u, bot); g.ellipse(cx, bot, half(bot) - 3 * u, ry(bot), 0, Math.PI, 0, true); g.lineTo(cx + half(wl) - 3 * u, wl); g.ellipse(cx, wl, half(wl) - 3 * u, ry(wl), 0, 0, Math.PI, true); g.closePath(); };
    water(); g.fillStyle = wg; g.fill();
    // viên sủi và bọt chỉ vẽ trong lòng nước
    g.save(); g.beginPath(); g.rect(0, 0, W, H); g.restore();
    const tw = wb * 0.46, th = tw * 0.24, startY = top - gh * 0.17, restY = bot - th * 0.2;
    const fall = (k) => (k < 0.5 ? startY + (wl - startY) * Math.pow(k / 0.5, 2) : wl + (restY - wl) * ease((k - 0.5) / 0.5));
    const sc = Math.max(0, Math.cbrt(left));
    const disc = (x, y, w, t, rot) => { // viên sủi nhìn nghiêng: hai mặt bầu dục + thân
      g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc);
      g.fillStyle = '#d9cdb2'; g.beginPath(); g.ellipse(0, t / 2, w / 2, w * 0.17, 0, 0, Math.PI); g.lineTo(-w / 2, -t / 2); g.lineTo(w / 2, -t / 2); g.closePath(); g.fill();
      g.fillStyle = '#f8f0df'; g.strokeStyle = '#c9bb9b'; g.lineWidth = 1.2 * u; g.beginPath(); g.ellipse(0, -t / 2, w / 2, w * 0.17, 0, 0, 6.2832); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(170,155,125,0.8)'; g.beginPath(); g.moveTo(-w * 0.3, -t / 2); g.lineTo(w * 0.3, -t / 2); g.stroke(); g.restore();
    };
    if (!fin) {
      if (!crushed) disc(cx, started ? fall(d) : startY + Math.sin(time * 2) * 3 * u, tw, th, started ? (1 - ease(d)) * 0.5 : 0.1);
      else for (let i = 0; i < 10; i++) {
        const k = started ? clamp01(d * 1.25 - rnd(i, 1) * 0.25) : 0, ox = (rnd(i, 2) - 0.5) * (started ? half(restY) * 1.5 * ease(k) + tw * 0.5 : tw * 0.95);
        const fs = tw * (0.14 + rnd(i, 3) * 0.1), y = started ? fall(k) + (1 - k) * (rnd(i, 4) - 0.5) * 20 * u - (k >= 1 ? rnd(i, 5) * 4 * u : 0) : startY + (rnd(i, 4) - 0.5) * 12 * u + Math.sin(time * 2 + i) * 2 * u;
        g.save(); g.translate(cx + ox, Math.min(y, restY + th * 0.4)); g.rotate(rnd(i, 6) * 6 + (1 - k) * 3); g.scale(sc, sc);
        g.fillStyle = '#f8f0df'; g.strokeStyle = '#c9bb9b'; g.lineWidth = 1.1 * u; g.beginPath(); g.moveTo(-fs / 2, -fs * 0.3); g.lineTo(fs * 0.4, -fs * 0.45); g.lineTo(fs / 2, fs * 0.25); g.lineTo(-fs * 0.3, fs * 0.4); g.closePath(); g.fill(); g.stroke(); g.restore();
      }
    }
    // bọt trong nước: càng nhanh càng dày và càng vọt
    const N = Math.round(80 * rate);
    for (let i = 0; i < N; i++) {
      const ph = frac(rnd(i, 7) + time * (0.4 + rnd(i, 8) * 0.5) * (0.7 + 0.9 * rate)), y = bot - 3 * u - Math.pow(ph, 0.85) * (bot - wl - 5 * u);
      const spread = crushed ? half(y) * 1.75 : tw * (0.75 + ph * 1.2), x = cx + (rnd(i, 9) - 0.5) * spread + Math.sin(time * 4 + i) * 1.6 * u;
      if (Math.abs(x - cx) > half(y) - 6 * u) continue;
      const rr = (1.4 + rnd(i, 10) * 2.8) * u * (0.7 + 0.5 * ph), al = (ph < 0.08 ? ph / 0.08 : ph > 0.92 ? (1 - ph) / 0.08 : 1) * 0.9;
      g.strokeStyle = `rgba(255,255,255,${al})`; g.fillStyle = `rgba(255,255,255,${al * 0.18})`; g.lineWidth = 1.1 * u; g.beginPath(); g.arc(x, y, rr, 0, 6.2832); g.fill(); g.stroke();
      g.strokeStyle = `rgba(255,255,255,${al * 0.9})`; g.beginPath(); g.arc(x, y, rr * 0.55, 3.6, 4.6); g.stroke();
    }
    // mặt thoáng + bọt đọng + bọt bắn lên khỏi mặt nước
    ell(wl, 1); g.save(); g.clip(); ell(wl, 0.985); g.fillStyle = wc(0.5); g.fill(); g.restore();
    g.strokeStyle = 'rgba(232,246,252,0.75)'; g.lineWidth = 1.3 * u; ell(wl, 0.985); g.stroke();
    if (started && d > 0.5 && d < 0.95) { const k = (d - 0.5) / 0.45; g.strokeStyle = `rgba(255,255,255,${0.85 * (1 - k)})`; g.lineWidth = 2 * u; ell(wl, 0.25 + 0.7 * k); g.stroke(); }
    const M = Math.round(26 * rate);
    for (let i = 0; i < M; i++) { const a = rnd(i, 11) * 6.2832, q = Math.sqrt(rnd(i, 12)) * 0.9, rr = (1.8 + rnd(i, 13) * 2.4) * u; g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(cx + Math.cos(a) * half(wl) * q, wl + Math.sin(a) * ry(wl) * q - rr * 0.3 + Math.sin(time * 6 + i) * 0.8 * u, rr, 0, 6.2832); g.fill(); }
    const S = Math.round(22 * rate);
    for (let i = 0; i < S; i++) { const ph = frac(rnd(i, 14) + time * (1.1 + rnd(i, 15) * 0.9)), x0 = cx + (rnd(i, 16) - 0.5) * half(wl) * 1.5, hgt = (14 + rnd(i, 17) * 34) * u * (0.5 + rate); g.fillStyle = `rgba(255,255,255,${0.85 * (1 - ph)})`; g.beginPath(); g.arc(x0 + (rnd(i, 18) - 0.5) * 14 * u * ph, wl - 4 * u * ph * (1 - ph) * 4 * (hgt / (16 * u)), (1 + rnd(i, 19) * 1.4) * u, 0, 6.2832); g.fill(); }
    // kính phía trước: đáy dày, thành hai nét, miệng cốc, vệt sáng
    g.beginPath(); g.moveTo(cx - half(bot), bot); g.lineTo(cx - half(by), by); g.ellipse(cx, by, half(by), ry(by), 0, Math.PI, 0, true); g.lineTo(cx + half(bot), bot); g.ellipse(cx, bot, half(bot), ry(bot), 0, 0, Math.PI, false); g.closePath();
    const bgd = g.createLinearGradient(cx - half(by), 0, cx + half(by), 0); bgd.addColorStop(0, 'rgba(225,242,250,0.5)'); bgd.addColorStop(0.5, 'rgba(225,242,250,0.16)'); bgd.addColorStop(1, 'rgba(225,242,250,0.42)'); g.fillStyle = bgd; g.fill();
    g.strokeStyle = 'rgba(225,242,250,0.55)'; g.lineWidth = 1.2 * u; ell(bot, 1, 0, Math.PI); g.stroke();
    g.strokeStyle = 'rgba(232,246,252,0.95)'; g.lineWidth = 2.6 * u; g.lineJoin = 'round'; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx - half(top), top); g.lineTo(cx - half(by), by); g.ellipse(cx, by, half(by), ry(by), 0, Math.PI, 0, true); g.lineTo(cx + half(top), top); g.stroke();
    g.strokeStyle = 'rgba(232,246,252,0.35)'; g.lineWidth = 1 * u; g.beginPath(); g.moveTo(cx - half(top) + 5 * u, top + 3 * u); g.lineTo(cx - half(bot) + 5 * u, bot); g.moveTo(cx + half(top) - 5 * u, top + 3 * u); g.lineTo(cx + half(bot) - 5 * u, bot); g.stroke();
    g.strokeStyle = 'rgba(240,250,255,0.98)'; g.lineWidth = 2.4 * u; ell(top, 1); g.stroke();
    g.strokeStyle = 'rgba(232,246,252,0.4)'; g.lineWidth = 1 * u; ell(top, 0.93); g.stroke();
    const hl = g.createLinearGradient(0, top, 0, by); hl.addColorStop(0, 'rgba(255,255,255,0.5)'); hl.addColorStop(1, 'rgba(255,255,255,0.08)');
    g.fillStyle = hl; g.beginPath(); g.moveTo(cx - half(top) * 0.74, top + gh * 0.1); g.lineTo(cx - half(top) * 0.6, top + gh * 0.1); g.lineTo(cx - half(by) * 0.62, by - gh * 0.14); g.lineTo(cx - half(by) * 0.76, by - gh * 0.14); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.16)'; g.beginPath(); g.moveTo(cx + half(top) * 0.62, top + gh * 0.14); g.lineTo(cx + half(top) * 0.68, top + gh * 0.14); g.lineTo(cx + half(by) * 0.7, by - gh * 0.3); g.lineTo(cx + half(by) * 0.64, by - gh * 0.3); g.closePath(); g.fill();
    void col;
  }
}
