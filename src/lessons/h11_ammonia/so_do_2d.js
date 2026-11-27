// SƠ ĐỒ NHÀ MÁY PHẲNG: mode 2D của bài Ammonia (CHEM11-04), theo desc_2d của STEMLabs ("Sơ đồ nhà máy: kéo nhiệt độ, áp suất, tỉ lệ N₂ : H₂, bật xúc tác và tách NH₃,
// xem hiệu suất và tốc độ; GV đặt mục tiêu sản lượng"). Define: DEFINE_SA_BAN.md mục 9.1.
// Là một "cảnh tự vẽ" của bộ máy 2D (flat/labset2d.js: scene2d = { attach, draw, hit }): bộ máy lo việc, lời nhắc, lần chạy; tệp này chỉ vẽ và bắt chạm.
// Cùng giáo án, cùng mô hình số, cùng phần tính kính soi với 3D. Điểm riêng của 2D: con số nằm ngay trên sơ đồ, đúng chỗ của nó.
// LUẬT ĐỒ VẬT THẬT (chủ duyệt 27/11, DEFINE_SAP_XEP_BAN.md 7.2): bình khí, máy nén, đồng hồ, tháp, khay Fe, bộ làm lạnh, bồn NH₃, van là ẢNH kho assets/flat (LAB-014);
// mã chỉ vẽ phần sống: ống và chấm khí, mực NH₃ trong cửa kính bồn, kim đồng hồ, màu nóng của tháp, con số, nhãn, nút Chạy, kính soi hạt.
import { cfgOf } from './giao_an.js';
import { xEq, pct, RUN_S, RANGE } from './mo_hinh.js';
import { pose, createUnit, mulberry, PATCHES, RAD, YFE, SLAB_R } from './be_mat_fe.js';
import { FLAT_IMG as IM, FLAT_META as META } from '../../flat/bench2d.js';

const VW = 1000, VH = 600, FONT = '"IBM Plex Sans", "Segoe UI", system-ui, sans-serif';
const COL = { N: '#3d6fe0', H: '#f4f6f9', A: '#19b89a', ink: '#14223a', muted: '#5d6675', line: '#8a94a0', loop: '#e07b2a', steel: '#c9d1d7', dark: '#2b363d', fe: '#b47c52' };
// Khối và vùng chạm (toạ độ sơ đồ 1000 × 600): [x, y, rộng, cao]
const BOX = { feed: [40, 318, 150, 172], comp: [240, 372, 120, 108], tower: [430, 140, 120, 340], catbox: [338, 508, 84, 50], cool: [620, 390, 130, 90], sep: [810, 270, 120, 210], loop: [548, 84, 104, 52], panel: [620, 510, 150, 54] };
const PIPE = { in1: [[190, 440], [240, 440]], in2: [[360, 440], [395, 440], [395, 175], [430, 175]], out1: [[550, 445], [620, 445]], out2: [[750, 445], [810, 445]], rec: [[870, 270], [870, 110], [300, 110], [300, 372]] };
const LENS = { x: 690, y: 245, r: 104 }, NEAR = { x: 500, y: 318, r: 236 };
const TANK_WIN = [0.49, 0.205, 0.71, 0.745]; // cửa kính trên ảnh storage_tank (tỉ lệ trong khung cắt: x0, y0, x1, y1), đo 27/11
const GAUGE = { cy: 0.385, r: 0.43 };
// NÚM NGAY TRÊN MÁY (27/11): kim đồng hồ áp suất ở máy nén, đồng hồ nhiệt ở tháp, vòng mức mở quanh van tuần hoàn. Kéo quanh tâm để đặt số; cung từ 0,8π tới 2,2π như mặt đồng hồ.
const A0 = 0.8 * Math.PI, A1 = 2.2 * Math.PI, angOf = (k) => A0 + (A1 - A0) * k;
const fracAt = (dx, dy) => { let a = Math.atan2(dy, dx); if (a < Math.PI * 0.5) a += 2 * Math.PI; return cl((a - A0) / (A1 - A0)); };
const ACC = '#6254f4'; // mặt đồng hồ pressure_gauge: tâm theo chiều cao, bán kính theo bề ngang
const num = (v, d = 0) => v.toLocaleString('vi-VN', { maximumFractionDigits: d });
const cl = (x) => Math.max(0, Math.min(1, x));
const mixHex = (a, b, k) => { const p = (h, i) => parseInt(h.slice(1 + 2 * i, 3 + 2 * i), 16); return `rgb(${[0, 1, 2].map((i) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * k)).join(',')})`; };

export function createScene2d() {
  const S = { tower: {}, comp: {}, panel: {}, sep: { level: 0, to: 0 }, pipes: {}, lens: { on: false, cat: true, T: 450, gas: false, made: 0 }, k: 1, ox: 0, oy: 0, last: 0, phase: 0, near: 0, dial: {}, hot: '' };
  const rng = mulberry(11);
  let units = PATCHES.map((p, i) => ({ p, sim: createUnit(rng, 0.4 + i * 1.3) }));
  const free = Array.from({ length: 9 }, (_, i) => ({ n: i < 3, x: (rng() - 0.5) * 1.1, y: (rng() - 0.5) * 0.9, vx: (rng() - 0.5) * 0.8, vy: (rng() - 0.5) * 0.8, a: rng() * 6.28, w: (rng() - 0.5) * 4 }));
  const stub = (o) => ({ userData: o, visible: true });
  function attach(B) {
    const I = B.items, put = (id, o) => { if (I[id]) I[id].obj = stub(o); };
    put('tower', { set(s) { Object.assign(S.tower, s); } }); put('comp', { set(s) { Object.assign(S.comp, s); } }); put('panel', { set(s) { Object.assign(S.panel, s); } });
    put('sep', { setLevel(v) { S.sep.to = cl(v); } }); put('pipes', { set(s) { Object.assign(S.pipes, s); } }); put('lensfoot', { set() {} });
    put('lens', { made: () => S.lens.made, set(s) { const L = S.lens, flip = !!s.cat !== L.cat || !!s.gas !== L.gas || !!s.on !== L.on; if (flip || s.T !== L.T) L.made = 0; Object.assign(L, { on: !!s.on, cat: !!s.cat, T: s.T, gas: !!s.gas }); if (flip) units = PATCHES.map((p, i) => ({ p, sim: createUnit(rng, 0.4 + i * 1.3) })); } });
    ['base', 'feed', 'catbox', 'cool', 'loop'].forEach((id) => put(id, {}));
  }

  let c = null;
  const rr = (x, y, w, h, r, fill, stroke, lw = 1.6) => { c.beginPath(); c.roundRect(x, y, w, h, r); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); } };
  const tx = (s, x, y, { size = 15, weight = 500, color = COL.ink, align = 'center', max } = {}) => { size = Math.max(size, 11 * S.dpr / S.k); /* khung hẹp: chữ không nhỏ hơn 11 px trên màn hình */ c.font = `${weight} ${size}px ${FONT}`; c.textAlign = align; c.textBaseline = 'middle'; c.fillStyle = color; c.fillText(s, x, y, max); };
  const poly = (pts, color, w, dash) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.strokeStyle = color; c.lineWidth = w; c.lineJoin = 'round'; c.lineCap = 'round'; c.setLineDash(dash || []); c.stroke(); c.setLineDash([]); };
  const lenOf = (pts) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
  const at = (pts, d) => { for (let i = 1; i < pts.length; i++) { const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (d <= L) return [pts[i - 1][0] + ((pts[i][0] - pts[i - 1][0]) * d) / L, pts[i - 1][1] + ((pts[i][1] - pts[i - 1][1]) * d) / L]; d -= L; } return pts[pts.length - 1]; };
  const ball = (x, y, r, fill) => { c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.fillStyle = fill; c.fill(); if (fill === COL.H) { c.strokeStyle = '#7d8793'; c.lineWidth = 1; c.stroke(); } };
  // Ảnh đồ vật từ kho: canh giữa theo x, đáy tại bottom, vừa w và/hoặc h (giữ tỉ lệ). Trả khung đã vẽ để mã vẽ phần sống lên đúng chỗ.
  const pic = (key, cx, bottom, { w, h, alpha = 1, src } = {}) => {
    const im = src || IM[key], m = META[key]; if (!im || !m) return null;
    const sw = m.right - m.left, sh = m.bottom - m.top, k = w && h ? Math.min(w / sw, h / sh) : w ? w / sw : h / sh, dw = sw * k, dh = sh * k, x = cx - dw / 2, y = bottom - dh;
    c.globalAlpha = alpha; if (src) c.drawImage(src, x, y, dw, dh); else c.drawImage(im, m.left, m.top, sw, sh, x, y, dw, dh); c.globalAlpha = 1;
    return { x, y, w: dw, h: dh };
  };
  // Bản tô màu của một ảnh (giữ đúng hình, phủ màu lên phần có hình): tháp nóng dần. Cắt sẵn theo khung, thu nhỏ, nhớ theo nấc 0,1.
  const tintMemo = new Map();
  const tinted = (key, hex, a) => { const id = key + hex + a.toFixed(1); if (tintMemo.has(id)) return tintMemo.get(id); const im = IM[key], m = META[key]; if (!im || !m) return null;
    const sw = m.right - m.left, sh = m.bottom - m.top, k = Math.min(1, 640 / sh), cv = document.createElement('canvas'); cv.width = Math.round(sw * k); cv.height = Math.round(sh * k);
    const x = cv.getContext('2d'); x.drawImage(im, m.left, m.top, sw, sh, 0, 0, cv.width, cv.height); x.globalCompositeOperation = 'source-atop'; x.globalAlpha = a; x.fillStyle = hex; x.fillRect(0, 0, cv.width, cv.height);
    tintMemo.set(id, cv); return cv; };
  const chip = (s, x, y, { size = 14, weight = 600, color = COL.ink, bg = 'rgba(255,255,255,0.92)', line = '#c9d1d7' } = {}) => { size = Math.max(size, 11 * S.dpr / S.k); c.font = `${weight} ${size}px ${FONT}`; const w = c.measureText(s).width + size * 0.9, h = size * 1.55; rr(x - w / 2, y - h / 2, w, h, h / 2, bg, line, 1); tx(s, x, y + 0.5, { size, weight, color }); };
  // Ống trong + chấm khí chạy trong ống. mixOf = [phần N₂, phần H₂, phần NH₃]: cứ 12 chấm thì chia màu theo đúng tỉ lệ đó.
  function pipe(pts, mixOf, on, speed, color = '#aebcc6') {
    poly(pts, '#ffffff', 13); poly(pts, color, 13 - 3.2); poly(pts, '#f6f9fb', 13 - 6.4);
    if (!on) return; const L = lenOf(pts), gap = 22, n = Math.floor(L / gap), sum = mixOf[0] + mixOf[1] + mixOf[2] || 1, cut1 = mixOf[0] / sum, cut2 = cut1 + mixOf[1] / sum;
    for (let i = 0; i < n; i++) { const d = (i * gap + S.phase * speed) % L, [x, y] = at(pts, d), q = ((i * 5) % 12 + 0.5) / 12; ball(x, y, 4.6, q < cut1 ? COL.N : q < cut2 ? COL.H : COL.A); }
  }
  // Thanh ba màu: trong đoạn ống này có bao nhiêu N₂, H₂, NH₃
  function bar(x, y, w, mixOf) { const sum = mixOf[0] + mixOf[1] + mixOf[2] || 1; let px = x; rr(x - 1, y - 1, w + 2, 10, 5, '#ffffff', '#b8c2cb', 1); [COL.N, COL.H, COL.A].forEach((col, i) => { const ww = (w * mixOf[i]) / sum; if (ww > 0.5) { c.fillStyle = col; c.fillRect(px, y, ww, 8); } px += ww; }); }

  function lens(B, L, dt, big) {
    const St = S.lens, k = L.r * 0.96;
    c.save(); c.beginPath(); c.arc(L.x, L.y, L.r, 0, 6.2832); c.fillStyle = '#17222b'; c.fill(); c.clip();
    const P = (x, y) => [L.x + x * k, L.y - y * k];
    if (St.cat) { // tấm sắt nhìn ngang: hai hàng nguyên tử Fe
      const sp = RAD.Fe * 1.94; for (let row = 1; row >= 0; row--) for (let x = -SLAB_R - 0.04 + row * sp * 0.5; x <= SLAB_R + 0.04; x += sp) { const [px, py] = P(x, YFE - row * RAD.Fe * 1.6); ball(px, py, RAD.Fe * k, row ? '#93603c' : COL.fe); }
    }
    if (St.gas && St.cat) {
      const atoms = [];
      units.forEach((u) => { if (dt) St.made += u.sim.step(dt, St.T); if (!u.sim.shown()) return; const [cx, cz, ry] = u.p, cs = Math.cos(ry), sn = Math.sin(ry); pose(u.sim.u).atoms.forEach((a) => { if (a.a < 0.02) return; atoms.push({ x: cx + a.p[0] * cs + a.p[2] * sn, y: a.p[1], z: cz - a.p[0] * sn + a.p[2] * cs, el: a.el, a: a.a }); }); });
      atoms.sort((p, q) => p.z - q.z).forEach((a) => { const [px, py] = P(a.x, a.y); ball(px, py, RAD[a.el] * k * (0.35 + 0.65 * a.a) * (1 + a.z * 0.12), a.el === 'N' ? COL.N : COL.H); });
    } else if (St.gas) { // không có Fe: N₂ và H₂ bay tự do, va thành quả cầu thì bật lại
      free.forEach((f) => { if (dt) { f.x += f.vx * dt; f.y += f.vy * dt; f.a += f.w * dt; const r = Math.hypot(f.x, f.y); if (r > 0.78) { const nx = f.x / r, ny = f.y / r, vn = f.vx * nx + f.vy * ny; if (vn > 0) { f.vx -= 2 * vn * nx; f.vy -= 2 * vn * ny; } f.x = nx * 0.78; f.y = ny * 0.78; } }
        const d = (f.n ? 0.075 : 0.05) / 2, rad = (f.n ? RAD.N : RAD.H) * k, col = f.n ? COL.N : COL.H; [-1, 1].forEach((sg) => { const [px, py] = P(f.x + Math.cos(f.a) * d * sg, f.y + Math.sin(f.a) * d * sg); ball(px, py, rad, col); }); });
    }
    c.restore(); c.beginPath(); c.arc(L.x, L.y, L.r, 0, 6.2832); c.strokeStyle = '#c9a14a'; c.lineWidth = big ? 6 : 4; c.stroke();
    const txt = B.shown.lens || 'Kính soi hạt'; tx(txt.replace('Kính soi · ', 'Kính soi: '), L.x, L.y + L.r + (big ? 22 : 17), { size: big ? 17 : 14, weight: 600, max: big ? 560 : 250 });
    if (big) tx('quả xanh dương là N, trắng là H' + (St.cat ? ', nâu là Fe' : '') + ' · chạm kính soi để thu nhỏ', L.x, L.y + L.r + 46, { size: 14, color: COL.muted, max: 620 });
  }

  function draw(ctx, B, R, info) {
    c = ctx; const dt = Math.min(0.05, Math.max(0, info.t - S.last)); S.last = info.t; S.phase += dt * 60;
    S.dpr = info.dpr || 1; const k = (S.k = Math.min(R.w / VW, R.h / VH)), ox = (S.ox = R.x + (R.w - VW * k) / 2), oy = (S.oy = R.y + (R.h - VH * k) / 2);
    c.fillStyle = '#eef1f5'; c.fillRect(R.x, R.y, R.w, R.h); c.save(); c.setTransform(k, 0, 0, k, ox, oy);
    const D = B.data, cfg = cfgOf(B), live = D.live, last = D.last || (B.opts && B.opts.lastRow) || null, run = !!live, T = cfg.T, r = cfg.r, eq = xEq(T, cfg.p, r), out = run ? live.r.out * (D.prog || 0) : D.valve && last ? last.out : 0, step = (B.opts && B.opts.step) || 0;
    const feedMix = [1, r, 0], outMix = [(1 - out) / (1 + r), ((1 - out) * r) / (1 + r), out], recMix = cfg.sep ? [1, r, 0] : outMix, flow = run ? 1 : 0.28;
    S.sep.level += (S.sep.to - S.sep.level) * Math.min(1, dt * 1.2); S.near += ((D.near && D.cut ? 1 : 0) - S.near) * Math.min(1, dt * 5);

    // Bốn ô số ở mép trên: của lần chạy gần nhất (hoặc lần đang chạy)
    const res = run ? live.r : last, target = (B.opts && B.opts.target) || 0, hide = !!(B.opts && B.opts.hide); // hide: mode Thực tế che kết quả tới khi học sinh đoán xong
    const chips = [['Sau 60 giây', res ? pct(run ? out : res.out, (run ? out : res.out) < 0.02 ? 1 : 0) + ' NH₃' : 'chưa chạy'], ['Tốc độ phản ứng', res ? res.speed : '—'], ['Chi phí năng lượng', res ? String(res.cost) : '—'], [step === 6 && target ? `Sản lượng · mục tiêu ${num(target)}` : 'Sản lượng', res && !run ? `${num(res.tpd)} t/ngày` : '—']];
    if (hide) chips.forEach((ch) => { ch[1] = 'ẩn'; });
    chips.forEach(([label, val], i) => { const x = 40 + i * 232, hit = i === 3 && step === 6 && res && !run && target && res.tpd >= target; rr(x, 14, 222, 50, 10, hit ? '#e6f6ec' : '#ffffff', hit ? '#2f9e5b' : '#d5dbe2', 1.2); tx(label, x + 12, 29, { size: 13, color: COL.muted, align: 'left', max: 200 }); tx(val, x + 12, 49, { size: 17, weight: 600, align: 'left', max: 200 }); });

    // Đường tuần hoàn (màu cam) vòng phía trên, có van
    const recOn = !!D.loop && !!D.valve; pipe(PIPE.rec, recMix, recOn, flow * 0.9, recOn ? COL.loop : '#d9b89a');
    if (D.loop) { c.beginPath(); c.arc(600, 110, 26, 0, 6.2832); c.fillStyle = 'rgba(224,123,42,0.18)'; c.fill(); }
    { const cfgAll = (B.opts && B.opts.cfg) || cfg, kR = cl(cfgAll.rec / RANGE.rec[1]), R = 31; // vòng mức mở quanh van: xoay để đặt phần trăm khí quay lại
      c.beginPath(); c.arc(600, 110, R, A0, A1); c.strokeStyle = '#e3d5c8'; c.lineWidth = 4; c.lineCap = 'round'; c.stroke();
      c.beginPath(); c.arc(600, 110, R, A0, angOf(kR)); c.strokeStyle = D.loop ? COL.loop : '#d9b89a'; c.lineWidth = 4; c.stroke();
      const a = angOf(kR); c.beginPath(); c.arc(600 + Math.cos(a) * R, 110 + Math.sin(a) * R, 6, 0, 6.2832); c.fillStyle = D.loop ? COL.loop : '#c9a78a'; c.fill(); c.strokeStyle = '#ffffff'; c.lineWidth = 1.5; c.stroke();
      S.dial.rec = { x: 600, y: 110, r: R, k: kR, band: 10 }; ring('rec', B); }
    pic('ball_valve', 600, 124, { w: 46 }); c.beginPath(); c.arc(618, 96, 5.5, 0, 6.2832); c.fillStyle = D.loop ? '#2f9e5b' : '#c8372d'; c.fill(); c.strokeStyle = '#ffffff'; c.lineWidth = 1.5; c.stroke();
    tx(D.loop ? `Tuần hoàn: ${num(((B.opts && B.opts.cfg) || cfg).rec)} % khí chưa phản ứng quay lại` : 'Tuần hoàn: van đóng', 634, 88, { size: 14, weight: 600, align: 'left', color: D.loop ? '#a4500f' : COL.muted, max: 330 });
    if (recOn) bar(314, 200, 60, recMix);

    // Ống chính
    pipe(PIPE.in1, feedMix, !!D.valve, flow); pipe(PIPE.in2, feedMix, !!D.valve, flow); pipe(PIPE.out1, outMix, !!D.valve, flow); pipe(PIPE.out2, cfg.sep ? [1, r, 0] : outMix, !!D.valve, flow);
    if (D.valve) { bar(196, 456, 38, feedMix); bar(560, 460, 52, outMix); }

    // ① Bình khí N₂, H₂ và van
    [[79, 'gas_cyl_n2', 'N₂', COL.N, '#ffffff'], [149, 'gas_cyl_h2', 'H₂', '#ffffff', COL.ink]].forEach(([x, key, name, bg, ink]) => { pic(key, x, 486, { h: 176 }); chip(name, x, 410, { size: 18, bg, color: ink, line: '#5d6b78' }); });
    pic('ball_valve', 212, 452, { w: 40 }); c.beginPath(); c.arc(226, 428, 6, 0, 6.2832); c.fillStyle = D.valve ? '#2f9e5b' : '#c8372d'; c.fill(); c.strokeStyle = '#ffffff'; c.lineWidth = 1.6; c.stroke();
    tx('Bình khí', 115, 500, { size: 15, weight: 600 }); tx(`van ${D.valve ? 'mở' : 'đóng'} · H₂ : N₂ = ${num(r, 1)} : 1`, 115, 520, { size: 13.5, color: COL.muted, max: 190 });

    // ② Máy nén có đồng hồ áp suất
    const cp = pic('gas_compressor', 300, 482, { w: 152 });
    const gq = pic('pressure_gauge', 262, cp ? cp.y + 14 : 380, { w: 58 });
    if (gq) { const gx = gq.x + gq.w / 2, gy = gq.y + gq.h * GAUGE.cy, gr = gq.w * GAUGE.r, ang = Math.PI * (0.8 + 1.4 * cl((cfg.p - 50) / 300));
      c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + Math.cos(ang) * gr * 0.8, gy + Math.sin(ang) * gr * 0.8); c.strokeStyle = '#c8372d'; c.lineWidth = 2.6; c.lineCap = 'round'; c.stroke();
      c.beginPath(); c.arc(gx, gy, 3, 0, 6.2832); c.fillStyle = COL.dark; c.fill(); tx(`${cfg.p}`, gx, gy + gr * 0.5, { size: 12, weight: 600 });
      S.dial.p = { x: gx, y: gy, r: gq.w / 2, k: (cfg.p - RANGE.p[0]) / (RANGE.p[1] - RANGE.p[0]) }; ring('p', B); }
    tx(`Máy nén · ${cfg.p} bar`, 300, 500, { size: 15, weight: 600 });

    // ③ Tháp tổng hợp: màu theo nhiệt độ, ba tầng Fe
    const heat = cl((T - 150) / 500), hq = Math.round(heat * 10) / 10;
    if (hq > 0.05) { const g = c.createRadialGradient(490, 310, 20, 490, 310, 150); g.addColorStop(0, `rgba(244,162,58,${0.5 * hq})`); g.addColorStop(1, 'rgba(244,162,58,0)'); c.fillStyle = g; c.fillRect(340, 150, 300, 330); }
    pic('reactor_column', 490, 482, { h: 342, src: hq > 0.05 ? tinted('reactor_column', '#f08a24', 0.42 * hq) : null });
    // cửa quan sát cắt vào thân tháp: ba khay Fe (ảnh thật) nằm trong lòng tháp
    rr(458, 214, 64, 222, 8, '#1d2429', '#8a94a0', 2);
    if (cfg.cat) [246, 324, 402].forEach((y) => pic('catalyst_tray', 490, y + 22, { w: 56 }));
    if (hq > 0.05) rr(460, 216, 60, 218, 7, `rgba(240,138,36,${0.28 * hq * (run ? 1 : 0.7)})`);
    chip(cfg.cat ? '3 tầng Fe' : 'không có Fe', 490, 452, { size: 13 });
    tx('Tháp tổng hợp', 490, 126, { size: 15, weight: 600 });
    // Cửa ra tháp: hai con số đứng cạnh nhau
    tx('Cửa ra tháp', 438, 506, { size: 13.5, color: COL.muted, align: 'left' });
    tx(hide ? 'ẩn tới khi em đoán xong' : res ? `${pct(run ? out : res.out, (run ? out : res.out) < 0.02 ? 1 : 0)} NH₃ ${run ? '(đang chạy)' : `sau ${RUN_S} giây`}` : 'chưa chạy', 438, 526, { size: 15, weight: 600, align: 'left', max: 176 });
    tx(hide ? 'lúc cân bằng: ẩn' : `lúc cân bằng: ${pct(eq)}`, 438, 546, { size: 14, color: '#4d3fdc', weight: 600, align: 'left', max: 176 });

    // Đồng hồ nhiệt gắn trên thân tháp (ảnh đồng hồ thật, kim và số do mã vẽ): kéo kim để đặt nhiệt độ
    const tq = pic('pressure_gauge', 490, 210, { w: 54 });
    if (tq) { const gx = tq.x + tq.w / 2, gy = tq.y + tq.h * GAUGE.cy, gr = tq.w * GAUGE.r, kT = (T - RANGE.T[0]) / (RANGE.T[1] - RANGE.T[0]), a = angOf(kT);
      c.beginPath(); c.arc(gx, gy, gr * 0.86, angOf(0.4), angOf(0.5)); c.strokeStyle = '#49b675'; c.lineWidth = 3; c.stroke(); // vùng theo sách 400–450 °C
      c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + Math.cos(a) * gr * 0.8, gy + Math.sin(a) * gr * 0.8); c.strokeStyle = '#c8372d'; c.lineWidth = 2.6; c.lineCap = 'round'; c.stroke();
      c.beginPath(); c.arc(gx, gy, 3, 0, 6.2832); c.fillStyle = COL.dark; c.fill(); tx(`${T}°`, gx, gy + gr * 0.52, { size: 11.5, weight: 600 });
      chip(`${T} °C`, 490 + 80, gy, { size: 15, color: hq > 0.5 ? '#9a3412' : COL.ink });
      S.dial.T = { x: gx, y: gy, r: tq.w / 2, k: kT }; ring('T', B); }
    // Thùng xúc tác Fe
    pic('catalyst_tray', 380, 552, { w: 82, alpha: cfg.cat ? 0.3 : 1 }); chip('Fe', 380, 520, { size: 15 });
    tx(cfg.cat ? 'trong tháp' : 'đã rút ra', 380, 572, { size: 13, color: COL.muted });

    // ④ Làm lạnh
    if (D.sep) { const g = c.createRadialGradient(685, 449, 10, 685, 449, 90); g.addColorStop(0, 'rgba(47,143,208,0.32)'); g.addColorStop(1, 'rgba(47,143,208,0)'); c.fillStyle = g; c.fillRect(595, 380, 180, 130); }
    pic('heat_exchanger', 685, 472, { w: 152 }); tx('Làm lạnh', 685, 408, { size: 15, weight: 600 }); tx(D.sep ? 'đang tách NH₃ lỏng' : 'tắt', 685, 490, { size: 13.5, color: D.sep ? '#16669c' : COL.muted, max: 140 });
    // ⑤ Bình NH₃ lỏng
    const tk = pic('storage_tank', 856, 484, { h: 216 });
    if (tk) { const [a, b, e, f] = TANK_WIN, wx = tk.x + a * tk.w, wy = tk.y + b * tk.h, ww = (e - a) * tk.w, wh = (f - b) * tk.h, lh = wh * S.sep.level; // mực NH₃ lỏng trong cửa kính
      if (lh > 1) { c.save(); c.globalAlpha = 0.85; c.fillStyle = COL.A; c.fillRect(wx, wy + wh - lh, ww, lh); c.globalAlpha = 1; c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(wx, wy + wh - lh, ww, 1.5); c.restore(); } }
    chip('NH₃ lỏng', 900, 300, { size: 14 }); tx(S.sep.level > 0.02 ? 'đang đọng lại' : 'chưa có', 870, 500, { size: 13.5, color: COL.muted });
    // Tủ điều khiển: nút Chạy và thanh tiến độ
    rr(620, 510, 150, 54, 10, COL.dark, '#101619'); rr(632, 520, 126, 22, 11, run ? '#4bd27a' : '#2f9e5b'); tx(run ? `đang chạy · giây ${Math.round((D.prog || 0) * RUN_S)}` : `▶ Chạy ${RUN_S} giây`, 695, 531.5, { size: 13.5, weight: 600, color: '#ffffff', max: 120 });
    rr(632, 548, 126, 6, 3, '#55626b'); if (run) rr(632, 548, 126 * cl(D.prog || 0), 6, 3, '#9be7b6');

    // Kính soi hạt phẳng: hiện khi đã chạm tháp (cùng việc "mở vỏ tháp" của 3D)
    if (D.cut) {
      if (S.near < 0.5) { c.beginPath(); c.moveTo(550, 232); c.lineTo(LENS.x - LENS.r * 0.82, LENS.y - 56); c.lineTo(LENS.x - LENS.r * 0.82, LENS.y + 56); c.closePath(); c.fillStyle = 'rgba(255,212,94,0.42)'; c.fill(); lens(B, LENS, dt, false); }
      else { c.fillStyle = `rgba(238,241,245,${0.82 * S.near})`; c.fillRect(0, 70, VW, VH - 70); lens(B, NEAR, dt, true); }
    }
    c.restore();
  }
  // Viền gợi ý quanh núm đang được phép chỉnh ở bước này (nét đứt màu nhấn); đang kéo thì viền liền
  function ring(key, B) {
    const d = S.dial[key], ok = ((B.opts && B.opts.slide) || []).includes(key); if (!d || !ok) return;
    c.save(); c.beginPath(); c.arc(d.x, d.y, d.r + (d.band ? 9 : 5), 0, 6.2832); c.strokeStyle = ACC; c.lineWidth = S.hot === key ? 3 : 2; c.setLineDash(S.hot === key ? [] : [5, 5]); c.globalAlpha = S.hot === key ? 0.95 : 0.6 + 0.25 * Math.sin(S.phase / 14); c.stroke(); c.restore();
  }
  // Cử chỉ kéo: điểm chạm nằm trên một núm thì trả bộ xử lí; kéo quanh tâm núm để đặt số
  function grab(sx, sy, B, set) {
    const x = (sx - S.ox) / S.k, y = (sy - S.oy) / S.k; if (B.data.cut && B.data.near) return null;
    const key = ['p', 'T', 'rec'].find((k) => { const d = S.dial[k]; if (!d) return false; const q = Math.hypot(x - d.x, y - d.y); return d.band ? Math.abs(q - d.r) <= d.band : q <= d.r + 6; }); if (!key) return null;
    const d = S.dial[key], [min, max] = RANGE[key];
    return { move(mx, my) { S.hot = key; set(key, min + (max - min) * fracAt((mx - S.ox) / S.k - d.x, (my - S.oy) / S.k - d.y)); }, end() { S.hot = ''; } };
  }
  function hit(sx, sy, B) {
    const x = (sx - S.ox) / S.k, y = (sy - S.oy) / S.k, D = B.data;
    if (D.cut) { const L = D.near ? NEAR : LENS; if (Math.hypot(x - L.x, y - L.y) <= L.r) return 'lens'; if (D.near) return null; }
    return Object.keys(BOX).find((id) => { const [bx, by, bw, bh] = BOX[id]; return x >= bx && x <= bx + bw && y >= by && y <= by + bh; }) || null;
  }
  return { attach, draw, hit, grab };
}

// Khai báo cho mode 2D: gắn cảnh tự vẽ vào bàn, đổi lời của hai việc cho hợp với sơ đồ phẳng (không có "vỏ tháp" để mở).
const WORD2D = { cut: { label: 'Mở / đóng kính soi hạt ở tháp' }, near: { label: 'Phóng to / thu nhỏ kính soi hạt', guard: (B) => (B.data.cut ? null : 'Chạm tháp trước để mở kính soi hạt.') } };
export const declaration2d = (decl) => ({ ...decl, benches: decl.benches.map((b) => ({ ...b, island: false, scene2d: createScene2d(), steps: b.steps.map((s) => (WORD2D[s.id] ? { ...s, ...WORD2D[s.id] } : s)) })) });
