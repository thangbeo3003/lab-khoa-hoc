// SƠ ĐỒ NHÀ MÁY PHẲNG: mode 2D của bài Ammonia (CHEM11-04), theo desc_2d của STEMLabs ("Sơ đồ nhà máy: kéo nhiệt độ, áp suất, tỉ lệ N₂ : H₂, bật xúc tác và tách NH₃,
// xem hiệu suất và tốc độ; GV đặt mục tiêu sản lượng"). Define: DEFINE_SA_BAN.md mục 9.1.
// Là một "cảnh tự vẽ" của bộ máy 2D (flat/labset2d.js: scene2d = { attach, draw, hit }): bộ máy lo việc, lời nhắc, lần chạy; tệp này chỉ vẽ và bắt chạm.
// Cùng giáo án, cùng mô hình số, cùng phần tính kính soi với 3D. Điểm riêng của 2D: con số nằm ngay trên sơ đồ, đúng chỗ của nó.
import { cfgOf } from './giao_an.js';
import { xEq, pct, RUN_S } from './mo_hinh.js';
import { pose, createUnit, mulberry, PATCHES, RAD, YFE, SLAB_R } from './be_mat_fe.js';

const VW = 1000, VH = 600, FONT = '"IBM Plex Sans", "Segoe UI", system-ui, sans-serif';
const COL = { N: '#3d6fe0', H: '#f4f6f9', A: '#19b89a', ink: '#14223a', muted: '#5d6675', line: '#8a94a0', loop: '#e07b2a', steel: '#c9d1d7', dark: '#2b363d', fe: '#b47c52' };
// Khối và vùng chạm (toạ độ sơ đồ 1000 × 600): [x, y, rộng, cao]
const BOX = { feed: [40, 318, 150, 172], comp: [240, 372, 120, 108], tower: [430, 140, 120, 340], catbox: [338, 508, 84, 50], cool: [620, 390, 130, 90], sep: [810, 270, 120, 210], loop: [548, 84, 104, 52], panel: [620, 510, 150, 54] };
const PIPE = { in1: [[190, 440], [240, 440]], in2: [[360, 440], [395, 440], [395, 175], [430, 175]], out1: [[550, 445], [620, 445]], out2: [[750, 445], [810, 445]], rec: [[870, 270], [870, 110], [300, 110], [300, 372]] };
const LENS = { x: 690, y: 245, r: 104 }, NEAR = { x: 500, y: 318, r: 236 };
const num = (v, d = 0) => v.toLocaleString('vi-VN', { maximumFractionDigits: d });
const cl = (x) => Math.max(0, Math.min(1, x));
const mixHex = (a, b, k) => { const p = (h, i) => parseInt(h.slice(1 + 2 * i, 3 + 2 * i), 16); return `rgb(${[0, 1, 2].map((i) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * k)).join(',')})`; };

export function createScene2d() {
  const S = { tower: {}, comp: {}, panel: {}, sep: { level: 0, to: 0 }, pipes: {}, lens: { on: false, cat: true, T: 450, gas: false, made: 0 }, k: 1, ox: 0, oy: 0, last: 0, phase: 0, near: 0 };
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
    rr(578, 92, 44, 36, 8, D.loop ? '#fff1e2' : '#ffffff', COL.loop, 2); c.beginPath(); c.moveTo(588, 100); c.lineTo(612, 120); c.lineTo(612, 100); c.lineTo(588, 120); c.closePath(); c.fillStyle = D.loop ? COL.loop : '#e9c7a8'; c.fill();
    tx(D.loop ? `Tuần hoàn: ${num(((B.opts && B.opts.cfg) || cfg).rec)} % khí chưa phản ứng quay lại` : 'Tuần hoàn: van đóng', 634, 88, { size: 14, weight: 600, align: 'left', color: D.loop ? '#a4500f' : COL.muted, max: 330 });
    if (recOn) bar(314, 200, 60, recMix);

    // Ống chính
    pipe(PIPE.in1, feedMix, !!D.valve, flow); pipe(PIPE.in2, feedMix, !!D.valve, flow); pipe(PIPE.out1, outMix, !!D.valve, flow); pipe(PIPE.out2, cfg.sep ? [1, r, 0] : outMix, !!D.valve, flow);
    if (D.valve) { bar(196, 456, 38, feedMix); bar(560, 460, 52, outMix); }

    // ① Bình khí N₂, H₂ và van
    [[48, COL.N, 'N₂', '#ffffff'], [118, '#eef2f4', 'H₂', COL.ink]].forEach(([x, col, name, ink]) => { rr(x, 330, 62, 150, 26, col, '#5d6b78'); rr(x + 24, 316, 14, 16, 3, COL.steel, '#5d6b78', 1.2); tx(name, x + 31, 405, { size: 20, weight: 600, color: ink }); });
    c.beginPath(); c.arc(204, 440, 11, 0, 6.2832); c.fillStyle = D.valve ? '#2f9e5b' : '#c8372d'; c.fill(); c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.stroke();
    tx('Bình khí', 115, 500, { size: 15, weight: 600 }); tx(`van ${D.valve ? 'mở' : 'đóng'} · H₂ : N₂ = ${num(r, 1)} : 1`, 115, 520, { size: 13.5, color: COL.muted, max: 190 });

    // ② Máy nén có đồng hồ áp suất
    rr(240, 372, 120, 108, 12, '#3fb5a3', '#1f6f64'); c.beginPath(); c.arc(300, 424, 34, 0, 6.2832); c.fillStyle = '#ffffff'; c.fill(); c.strokeStyle = COL.dark; c.lineWidth = 2.5; c.stroke();
    const ang = Math.PI * (0.8 + 1.4 * cl((cfg.p - 50) / 300)); c.beginPath(); c.moveTo(300, 424); c.lineTo(300 + Math.cos(ang) * 26, 424 + Math.sin(ang) * 26); c.strokeStyle = '#c8372d'; c.lineWidth = 3; c.stroke();
    tx(`${cfg.p}`, 300, 440, { size: 13, weight: 600 }); tx(`Máy nén · ${cfg.p} bar`, 300, 500, { size: 15, weight: 600 });

    // ③ Tháp tổng hợp: màu theo nhiệt độ, ba tầng Fe
    const heat = cl((T - 150) / 500); rr(430, 140, 120, 340, 26, mixHex('#c3ccd2', '#f4a23a', heat), '#5d6b78', 2);
    [205, 290, 375].forEach((y) => { rr(446, y, 88, 52, 6, cfg.cat ? mixHex('#4a4f55', '#b3541a', heat * (run ? 1 : 0.7)) : 'rgba(255,255,255,0.45)', cfg.cat ? '#2b2f33' : '#8a94a0', 1.2); if (cfg.cat) for (let i = 0; i < 7; i++) ball(454 + i * 12, y + 8, 3, '#22262a'); });
    tx(cfg.cat ? '3 tầng Fe' : 'không có Fe', 490, 316, { size: 13.5, weight: 600, color: cfg.cat ? '#ffffff' : COL.ink });
    tx(`${T} °C`, 490, 172, { size: 19, weight: 600 }); tx('Tháp tổng hợp', 490, 128, { size: 15, weight: 600 });
    // Cửa ra tháp: hai con số đứng cạnh nhau
    tx('Cửa ra tháp', 438, 506, { size: 13.5, color: COL.muted, align: 'left' });
    tx(hide ? 'ẩn tới khi em đoán xong' : res ? `${pct(run ? out : res.out, (run ? out : res.out) < 0.02 ? 1 : 0)} NH₃ ${run ? '(đang chạy)' : `sau ${RUN_S} giây`}` : 'chưa chạy', 438, 526, { size: 15, weight: 600, align: 'left', max: 176 });
    tx(hide ? 'lúc cân bằng: ẩn' : `lúc cân bằng: ${pct(eq)}`, 438, 546, { size: 14, color: '#4d3fdc', weight: 600, align: 'left', max: 176 });

    // Thùng xúc tác Fe
    rr(338, 508, 84, 50, 8, '#e3b23c', '#8a6a12'); if (!cfg.cat) { c.beginPath(); c.ellipse(380, 510, 30, 11, 0, Math.PI, 0); c.fillStyle = '#3a3f44'; c.fill(); }
    tx('Fe', 380, 535, { size: 17, weight: 600 }); tx(cfg.cat ? 'trong tháp' : 'đã rút ra', 380, 572, { size: 13, color: COL.muted });

    // ④ Làm lạnh
    rr(620, 390, 130, 90, 14, D.sep ? '#dff0fb' : '#e2e7eb', D.sep ? '#2f8fd0' : '#5d6b78', D.sep ? 2.4 : 1.6); tx('Làm lạnh', 685, 422, { size: 15, weight: 600 }); tx(D.sep ? 'đang tách NH₃ lỏng' : 'tắt', 685, 444, { size: 13.5, color: D.sep ? '#16669c' : COL.muted, max: 120 });
    // ⑤ Bình NH₃ lỏng
    rr(810, 270, 120, 210, 26, '#f7fafb', '#5d6b78', 2); const lh = 180 * S.sep.level; if (lh > 2) { c.save(); c.beginPath(); c.roundRect(816, 276, 108, 198, 22); c.clip(); c.fillStyle = COL.A; c.globalAlpha = 0.8; c.fillRect(816, 474 - lh, 108, lh); c.restore(); }
    tx('NH₃ lỏng', 870, 300, { size: 15, weight: 600 }); tx(S.sep.level > 0.02 ? 'đang đọng lại' : 'chưa có', 870, 500, { size: 13.5, color: COL.muted });
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
  function hit(sx, sy, B) {
    const x = (sx - S.ox) / S.k, y = (sy - S.oy) / S.k, D = B.data;
    if (D.cut) { const L = D.near ? NEAR : LENS; if (Math.hypot(x - L.x, y - L.y) <= L.r) return 'lens'; if (D.near) return null; }
    return Object.keys(BOX).find((id) => { const [bx, by, bw, bh] = BOX[id]; return x >= bx && x <= bx + bw && y >= by && y <= by + bh; }) || null;
  }
  return { attach, draw, hit };
}

// Khai báo cho mode 2D: gắn cảnh tự vẽ vào bàn, đổi lời của hai việc cho hợp với sơ đồ phẳng (không có "vỏ tháp" để mở).
const WORD2D = { cut: { label: 'Mở / đóng kính soi hạt ở tháp' }, near: { label: 'Phóng to / thu nhỏ kính soi hạt', guard: (B) => (B.data.cut ? null : 'Chạm tháp trước để mở kính soi hạt.') } };
export const declaration2d = (decl) => ({ ...decl, benches: decl.benches.map((b) => ({ ...b, island: false, scene2d: createScene2d(), steps: b.steps.map((s) => (WORD2D[s.id] ? { ...s, ...WORD2D[s.id] } : s)) })) });
