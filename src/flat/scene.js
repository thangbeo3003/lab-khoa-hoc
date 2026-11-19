// Cảnh thử "2D có chiều sâu" (chủ 19/11: "làm 2d nhưng cảm giác không gian 3d"): nền là ảnh phòng lab, dụng cụ thuỷ tinh là ảnh rời
// chụp trên nền xám 50% rồi phủ lên bằng phép trộn hard-light (xám 50% = không đổi nền, chỗ sáng làm sáng, chỗ tối làm tối),
// chất lỏng, kết tủa, dòng chảy vẽ bằng mã bên dưới lớp kính. Hoá học dùng lại nguyên sổ sách ống nghiệm (tubechem) của bản 3D.
import { newTube, add, look, pptTotal, heat, label } from '../free/tubechem.js';
import { BY_ID } from '../chem/data.js';

const META = await (await fetch('./assets/flat/meta.json?' + Date.now())).json();
const load = (f) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = './assets/flat/' + f; });
const IM = {}; for (const k of ['bg', 'tube', 'bottle', 'stopper', 'rack']) IM[k] = await load(META[k].file);
const $ = (id) => document.getElementById(id), cv = $('cv'), ctx = cv.getContext('2d');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, k) => a + (b - a) * k, ease = (k) => k * k * (3 - 2 * k);
const fm = (x, d = 1) => x.toFixed(d).replace('.', ',');
const PPT = { 'đen': '#1c1c1e', 'trắng': '#f4f6f8', 'trắng xanh': '#cfe3d6', 'trắng ngả vàng': '#f1ecd0', 'vàng': '#f0cf3a', 'xanh lam': '#2b86e0', 'nâu đỏ': '#9a4a2a', 'nâu đen': '#3a2a22', 'xám': '#8c9199' };
const PUFF = { 'keo': 1.7, 'bông': 1.5, 'vón cục': 1.1 };
const rgb = (hex) => [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16));
const rgba = (hex, a, mul = 1) => { const c = rgb(hex).map((v) => Math.round(clamp(v * mul, 0, 255))); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };

// ---------- hệ toạ độ cảnh = điểm ảnh của ảnh nền; 1 cm thật = PPC điểm ảnh ----------
const W = META.bg.w, H = META.bg.h, BASE = H * META.bg.base, PPC = (H * 0.40) / 16;
const MT = META.tube, MB = META.bottle, MS = META.stopper, MR = META.rack;
const sT = (16 * PPC) / (MT.bottom - MT.top), sB = (9.5 * PPC) / (MB.bottom - MB.top), sS = sB * MS.fit, sR = PPC / MR.ppc;
const RXC = W * 0.5, rX = (x) => RXC + (x - MR.cx) * sR, rY = (y) => BASE - (MR.bottom - y) * sR;
const TUBE_BY = rY(MR.baseTop) + 0.08 * PPC, MOUTH_Y = TUBE_BY - 16 * PPC, HB = 9.5 * PPC, RN = ((MB.neckR || 0.9 * MB.ppc) / MB.ppc) * PPC;
const IN_R = 0.7, HEMI = (2 / 3) * Math.PI * IN_R ** 3; // lòng ống Φ14 mm: đáy bán cầu 0,72 mL, thân mỗi mL cao 6,5 mm
const levelCm = (mL) => { if (mL <= 0) return 0; if (mL >= HEMI) return IN_R + (mL - HEMI) / (Math.PI * IN_R * IN_R); let lo = 0, hi = IN_R; for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if ((Math.PI * m * m * (3 * IN_R - m)) / 3 < mL) lo = m; else hi = m; } return (lo + hi) / 2; };

// Đường bao lòng dụng cụ lấy từ dáng ảnh (prof = các hàng [y, mép trái, mép phải] theo điểm ảnh của ảnh rời), lùi vào một bề dày thành.
// Toạ độ tại chỗ: gốc ở giữa đáy, y âm là đi lên. Trả về vùng từ độ cao yTop (âm) xuống đáy.
function inner(m, s, yTop) {
  const rows = m.prof.filter((r) => r[0] <= m.bottom - m.floor).map((r) => [(r[0] - m.bottom) * s, (r[1] + m.wall - m.cx) * s, (r[2] - m.wall - m.cx) * s]).filter((r) => r[2] > r[1] && r[0] >= yTop);
  const p = new Path2D(); if (!rows.length) return p;
  p.moveTo(rows[0][1], yTop); for (const r of rows) p.lineTo(r[1], r[0]); for (let k = rows.length - 1; k >= 0; k--) p.lineTo(rows[k][2], rows[k][0]); p.lineTo(rows[0][2], yTop); p.closePath();
  return p;
}
const halfAt = (m, s, y) => { let best = m.prof[0]; for (const r of m.prof) if (Math.abs((r[0] - m.bottom) * s - y) < Math.abs((best[0] - m.bottom) * s - y)) best = r; return ((best[2] - best[1]) / 2 - m.wall) * s; };
const sprite = (im, m, s, alpha = 1) => { ctx.save(); ctx.globalAlpha = alpha; ctx.globalCompositeOperation = 'hard-light'; ctx.drawImage(im, -m.cx * s, -m.bottom * s, m.w * s, m.h * s); ctx.restore(); };

// ---------- trạng thái ----------
const LET = 'ABCDE';
const tubes = MR.holes.slice(0, 5).map((hx, i) => ({ i, x: rX(hx), chem: newTube(), mL: 0, col: '#dcecf5', op: 0.3, layer: 0, layerTo: 0, lcol: '#ffffff', parts: [], stream: null, flash: null }));
const SLOT = [RXC - (MR.w * sR) * 0.5 - 4.6 * PPC, RXC + (MR.w * sR) * 0.5 + 4.6 * PPC].map((x) => clamp(x, 5 * PPC, W - 5 * PPC));
const bottles = [['CuSO4', -1, 2], ['NaOH', 1, 1]].map(([id, side, dose], k) => ({ id, side, dose, home: { x: SLOT[k], y: BASE + 0.9 * PPC }, mx: SLOT[k], my: BASE + 0.9 * PPC - HB, rot: 0, fill: 0.62, stopOn: 1, lift: 0 }));
const S = { sel: null, busy: false, t: 0, hover: null, last: null };
const layerCm = (t) => { const mmol = pptTotal(t) * 1000; if (mmol <= 0) return 0; return Math.min(3, (0.012 + 0.07 * Math.sqrt(mmol) * Math.max(...t.ppt.map((p) => PUFF[p.form] || 0.8))) * 10); };
function sync(T, events = [], instant = false) {
  const L = look(T.chem); T.mLto = T.chem.vol; T.col = L.hex; T.op = L.opacity; T.layerTo = layerCm(T.chem);
  for (const e of events) if (e.kind === 'reaction') for (const m of e.made) if (m.mark === '↓') { const p = T.chem.ppt.find((q) => q.f === m.f); T.lcol = PPT[p.color] || '#eef1f4'; if (!instant) { const n = Math.round(clamp(m.mol * 1000 * 260, 8, 46)); for (let k = 0; k < n && T.parts.length < 120; k++) T.parts.push({ x: (Math.random() * 2 - 1) * 0.82, y: levelCm(T.chem.vol) * (0.35 + Math.random() * 0.6), r: 0.035 + Math.random() * 0.05, v: 0.25 + Math.random() * 0.35, w: Math.random() * 6.28, col: T.lcol }); } }
  if (T.chem.ppt.length) T.lcol = PPT[T.chem.ppt[T.chem.ppt.length - 1].color] || T.lcol;
  if (instant) { T.mL = T.mLto; T.layer = T.layerTo; }
}
function preset() { // 4 ống có sẵn để so độ rõ với bản 3D; ống A để trống cho người xem tự rót
  const put = (i, list, heated) => { const T = tubes[i]; T.chem = newTube(); T.parts = []; for (const [id, mL] of list) add(T.chem, id, { mL }); if (heated) heat(T.chem); sync(T, [], true); };
  put(0, []); put(1, [['AgNO3', 2], ['NaCl', 2]]); put(2, [['CuSO4', 2], ['NaOH', 1]], true); put(3, [['FeCl3', 3]]); put(4, [['NaCl', 3]]);
  S.sel = null; S.last = null; bottles.forEach((b) => { b.fill = 0.62; }); say(); showResult(null);
}

// ---------- chuỗi động tác ----------
let seq = null;
const play = (steps, done) => { seq = { steps, i: 0, t: 0, done }; if (steps[0].start) steps[0].start(); };
function tick(dt) {
  S.t += dt;
  while (seq) { const st = seq.steps[seq.i]; seq.t += dt; if (st.hold) { if (!st.hold(dt)) break; dt = 0; } else { const k = Math.min(1, seq.t / st.dur); if (st.fn) st.fn(ease(k)); if (k < 1) break; dt = seq.t - st.dur; }
    seq.i++; seq.t = 0; if (seq.i >= seq.steps.length) { const d = seq.done; seq = null; if (d) d(); break; } if (seq.steps[seq.i].start) seq.steps[seq.i].start(); }
  for (const T of tubes) { T.mL = lerp(T.mL, T.mLto ?? T.mL, 1 - Math.exp(-dt * 10)); T.layer = lerp(T.layer, T.layerTo, 1 - Math.exp(-dt * 0.9));
    for (const p of T.parts) { p.y -= p.v * dt; p.w += dt * 2; p.x = clamp(p.x + Math.sin(p.w) * dt * 0.15, -0.85, 0.85); } T.parts = T.parts.filter((p) => p.y > T.layer * 0.8);
    if (T.flash && S.t > T.flash.until) T.flash = null; }
  for (const b of bottles) b.lift = lerp(b.lift, S.sel === b && !S.busy ? 1 : 0, 1 - Math.exp(-dt * 12));
}
// Rót: nhấc nút đặt xuống bàn, đưa lọ tới miệng ống, nghiêng quanh miệng lọ cho mép lọ nằm đúng trên miệng ống, rót theo từng 0,25 mL, trả lọ, đậy nút.
function pour(b, T, mL) {
  const th = b.side < 0 ? 1.68 : -1.68, home = { x: b.home.x, y: b.home.y - HB }, c = Math.cos(th), s = Math.sin(th);
  const M = { x: T.x - RN * 0.9 * c * Math.sign(th), y: MOUTH_Y - 0.9 * PPC - Math.abs(RN * s) }, hover = { x: M.x - Math.sign(th) * 2.2 * PPC, y: M.y - 2.6 * PPC };
  let left = mL, acc = 0, ok = true; const from = {}; S.busy = true; say();
  play([
    { dur: 0.3, fn: (k) => { b.stopOn = 1 - k; } },
    { dur: 0.6, fn: (k) => { b.mx = lerp(home.x, hover.x, k); b.my = lerp(home.y, hover.y, k) - Math.sin(Math.PI * k) * 1.2 * PPC; b.rot = th * 0.3 * k; } },
    { dur: 0.45, fn: (k) => { b.mx = lerp(hover.x, M.x, k); b.my = lerp(hover.y, M.y, k); b.rot = th * (0.3 + 0.7 * k); } },
    { hold: (dt) => { T.stream = { x: T.x, y0: M.y + Math.abs(RN * s) * 0.6, col: bottleLook(b) }; acc += 2.5 * dt; while (acc >= 0.25 && left > 1e-6 && ok) { const q = Math.min(0.25, left); acc -= 0.25; left -= q; b.fill = Math.max(0.2, b.fill - q * 0.004); const res = add(T.chem, b.id, { mL: q }); if (res.full) { ok = false; break; } sync(T, res.events); note(T, b, res.events); } return left <= 1e-6 || !ok; } },
    { dur: 0.25, start() { T.stream = null; from.x = b.mx; from.y = b.my; }, fn: (k) => { b.rot = th * (1 - 0.7 * k); b.mx = lerp(from.x, hover.x, k); b.my = lerp(from.y, hover.y, k); } },
    { dur: 0.6, fn: (k) => { b.mx = lerp(hover.x, home.x, k); b.my = lerp(hover.y, home.y, k) - Math.sin(Math.PI * k) * 1.0 * PPC; b.rot = th * 0.3 * (1 - k); } },
    { dur: 0.3, fn: (k) => { b.stopOn = k; } },
  ], () => { S.busy = false; if (T.flash) T.flash.until = S.t + 3.2; say(); });
}
function note(T, b, events) {
  const rx = events.filter((e) => e.kind === 'reaction'); if (!rx.length && S.last && S.last.T === T && S.last.rx) return; // chất kia hết giữa chừng: giữ kết quả vừa thấy
  const seen = rx.length ? [...new Set(rx.flatMap((e) => e.r.effects.map((f) => (f.type === 'ppt' ? `kết tủa ${f.color}` : f.type === 'gas' ? 'sủi khí' : f.type === 'color' ? `chuyển ${f.to}` : null)).filter(Boolean)))].join(', ') || 'có phản ứng' : events[0] ? 'không có hiện tượng' : '';
  S.last = { T, rx: rx.length > 0 }; if (seen) T.flash = { text: seen[0].toUpperCase() + seen.slice(1), until: Infinity, calm: !rx.length }; // hiện sau khi lọ rời đi, để chữ không đè lên lọ đang rót
  showResult(rx.length ? { T, seen, eq: rx.map((e) => e.r.equation).join('   ·   '), why: rx[0].r.reason } : events[0] ? { T, seen, eq: '', why: events[0].r.reason } : null);
}
function showResult(r) { const h = $('result'); h.replaceChildren(); if (!r) return; const el = (c, t) => { const n = document.createElement('div'); n.className = c; n.textContent = t; return n; }; h.append(el('seen', `Ống ${LET[r.T.i]} · ${r.seen}`)); if (r.eq) h.append(el('eq', r.eq)); h.append(el('why', r.why)); }
function say() { $('hint').textContent = S.busy ? 'Đang rót…' : S.sel ? `Chạm một ống nghiệm để rót ${S.sel.dose} mL ${label(S.sel.id)}.` : 'Chạm một lọ để chọn, rồi chạm một ống nghiệm. Thử: CuSO₄ vào ống A, sau đó NaOH vào cùng ống.'; }

// ---------- vẽ ----------
const bottleLook = (b) => { const c = BY_ID[b.id]; return { hex: c.hex || '#dcecf5', a: c.hex ? 0.72 : 0.2 }; };
let VIEW = [1, 0, 0, 1, 0, 0];
function fit() { const r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2); cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); const sc = Math.max(cv.width / W, cv.height / H), vh = cv.height / sc, top = clamp(Math.min(MOUTH_Y - 4.6 * PPC, BASE + 2.9 * PPC - vh), 0, Math.max(0, H - vh)); VIEW = [sc, 0, 0, sc, (cv.width - W * sc) / 2, -top * sc]; }
const shadow = (x, y, rx, ry, a) => { const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.save(); ctx.translate(x, y); ctx.scale(rx, ry); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, 6.3); ctx.fill(); ctx.restore(); };
// Chất lỏng trong lòng dụng cụ: màu đậm dần về hai mép (đường đi của ánh sáng qua hình trụ dài hơn), mặt thoáng là một elip mảnh.
function liquid(m, s, top, hw, hex, a) {
  ctx.save(); ctx.clip(inner(m, s, top)); const g = ctx.createLinearGradient(-hw, 0, hw, 0);
  g.addColorStop(0, rgba(hex, Math.min(0.95, a + 0.22), 0.72)); g.addColorStop(0.22, rgba(hex, a, 0.95)); g.addColorStop(0.55, rgba(hex, a * 0.86, 1.06)); g.addColorStop(0.82, rgba(hex, a, 0.92)); g.addColorStop(1, rgba(hex, Math.min(0.95, a + 0.22), 0.68));
  ctx.fillStyle = g; ctx.fillRect(-hw * 1.2, top, hw * 2.4, -top + 4); ctx.restore();
}
function surface(y, hw, hex, a) { ctx.save(); ctx.beginPath(); ctx.ellipse(0, y, hw, hw * 0.13, 0, 0, 6.3); ctx.fillStyle = rgba(hex, Math.min(0.9, a + 0.25), 1.12); ctx.fill(); ctx.lineWidth = Math.max(0.8, hw * 0.045); ctx.strokeStyle = rgba(hex, 0.75, 0.55); ctx.stroke(); ctx.restore(); }
function drawTube(T) {
  ctx.save(); ctx.translate(T.x, TUBE_BY);
  const lv = -(MT.floor * sT + levelCm(T.mL) * PPC), a = clamp(((T.op - 0.3) / 0.57) * 0.58 + 0.2, 0.2, 0.84);
  if (T.stream) { const w = 0.2 * PPC, y0 = T.stream.y0 - TUBE_BY; ctx.fillStyle = rgba(T.stream.col.hex, Math.max(0.55, T.stream.col.a), 0.95); ctx.beginPath(); ctx.roundRect(-w / 2, y0, w, Math.max(4, lv - y0), w / 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(-w * 0.28, y0, w * 0.16, Math.max(4, lv - y0)); }
  if (T.mL > 0.02) {
    const hw = halfAt(MT, sT, lv); liquid(MT, sT, lv, hw, T.col, a);
    if (T.layer > 0.01) { const ly = -(MT.floor * sT + T.layer * PPC), lw = halfAt(MT, sT, ly); ctx.save(); ctx.clip(inner(MT, sT, ly)); ctx.fillStyle = T.lcol; ctx.fillRect(-hw * 1.2, ly, hw * 2.4, -ly + 4); const g = ctx.createLinearGradient(-lw, 0, lw, 0); g.addColorStop(0, 'rgba(0,0,0,0.28)'); g.addColorStop(0.3, 'rgba(0,0,0,0)'); g.addColorStop(0.6, 'rgba(255,255,255,0.10)'); g.addColorStop(1, 'rgba(0,0,0,0.30)'); ctx.fillStyle = g; ctx.fillRect(-hw * 1.2, ly, hw * 2.4, -ly + 4); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.ellipse(0, ly, lw, lw * 0.16, 0, 0, 6.3); ctx.fillStyle = rgba(T.lcol, 1, 1.08); ctx.fill(); ctx.restore(); }
    ctx.save(); ctx.clip(inner(MT, sT, lv)); for (const p of T.parts) { ctx.beginPath(); ctx.arc(p.x * hw, -(MT.floor * sT + p.y * PPC), p.r * PPC, 0, 6.3); ctx.fillStyle = rgba(p.col, 0.92); ctx.fill(); } ctx.restore();
    surface(lv, hw, T.col, a);
  }
  sprite(IM.tube, MT, sT); ctx.restore();
}
function drawBottle(b) {
  const L = bottleLook(b), c = Math.cos(b.rot), s = Math.sin(b.rot), px = b.mx - HB * s, py = b.my + HB * c - b.lift * 0.35 * PPC; // (px, py) = giữa đáy lọ; lọ xoay quanh miệng
  if (Math.abs(b.rot) < 0.02) { shadow(px, b.home.y + 0.1 * PPC, 3.4 * PPC, 0.62 * PPC, 0.42 * (1 - b.lift * 0.3)); if (S.sel === b && !S.busy) { ctx.save(); ctx.beginPath(); ctx.ellipse(px, b.home.y + 0.05 * PPC, 3.0 * PPC, 0.55 * PPC, 0, 0, 6.3); ctx.lineWidth = 0.14 * PPC; ctx.strokeStyle = 'rgba(64,150,255,0.95)'; ctx.stroke(); ctx.restore(); } }
  ctx.save(); ctx.translate(px, py); ctx.rotate(b.rot);
  // chất lỏng trong lọ: cắt theo lòng lọ rồi tô phần nằm dưới mặt thoáng nằm ngang của thế giới (lọ nghiêng thì mặt thoáng vẫn ngang)
  const top = -HB * 0.74 * b.fill / 0.62, hw = halfAt(MB, sB, -HB * 0.3);
  ctx.save(); ctx.clip(inner(MB, sB, -HB)); const m = ctx.getTransform(), sy = m.b * 0 + m.d * (top * 0.5) + m.f + Math.abs(s) * hw * VIEW[0] * 0.35; ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createLinearGradient(0, sy, 0, sy + HB * VIEW[0]); g.addColorStop(0, rgba(L.hex, L.a, 1.05)); g.addColorStop(1, rgba(L.hex, Math.min(0.95, L.a + 0.15), 0.8)); ctx.fillStyle = g; ctx.fillRect(0, sy, cv.width, cv.height); ctx.fillStyle = rgba(L.hex, 0.8, 0.6); ctx.fillRect(0, sy, cv.width, Math.max(1, VIEW[0] * 1.2)); ctx.restore();
  sprite(IM.bottle, MB, sB);
  // nhãn: giấy trắng, vạch xanh, công thức to
  const lw = hw * 1.62, lh = HB * 0.36, ly = -HB * 0.52; ctx.save(); ctx.beginPath(); ctx.roundRect(-lw / 2, ly, lw, lh, lh * 0.06); ctx.fillStyle = 'rgba(252,253,254,0.97)'; ctx.fill(); ctx.clip(); ctx.fillStyle = '#2f6fd0'; ctx.fillRect(-lw / 2, ly, lw, lh * 0.09);
  ctx.fillStyle = '#16324f'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; let fs = lh * 0.36; ctx.font = `700 ${fs}px -apple-system, "Helvetica Neue", Arial, sans-serif`; const tw = ctx.measureText(label(b.id)).width; if (tw > lw * 0.84) { fs *= (lw * 0.84) / tw; ctx.font = `700 ${fs}px -apple-system, "Helvetica Neue", Arial, sans-serif`; } ctx.fillText(label(b.id), 0, ly + lh * 0.5); ctx.font = `500 ${lh * 0.17}px -apple-system, "Helvetica Neue", Arial, sans-serif`; ctx.fillStyle = '#52657a'; ctx.fillText(`${String(BY_ID[b.id].conc).replace('.', ',')} M`, 0, ly + lh * 0.8);
  const sh = ctx.createLinearGradient(-lw / 2, 0, lw / 2, 0); sh.addColorStop(0, 'rgba(20,30,45,0.22)'); sh.addColorStop(0.2, 'rgba(20,30,45,0)'); sh.addColorStop(0.75, 'rgba(20,30,45,0)'); sh.addColorStop(1, 'rgba(20,30,45,0.26)'); ctx.fillStyle = sh; ctx.fillRect(-lw / 2, ly, lw, lh); ctx.restore();
  ctx.restore();
  // nút lọ: đang đậy thì ngồi trên miệng, khi rót thì nằm trên bàn cạnh chỗ lọ
  const on = { x: b.home.x, y: b.home.y - HB + MS.seat * sS - b.lift * 0.35 * PPC }, off = { x: b.home.x + b.side * 3.9 * PPC, y: b.home.y + 0.25 * PPC }, k = ease(b.stopOn);
  if (b.stopOn < 0.5) shadow(off.x, off.y, 1.5 * PPC, 0.3 * PPC, 0.35 * (1 - k));
  ctx.save(); ctx.translate(lerp(off.x, on.x, k), lerp(off.y, on.y, k) - Math.sin(Math.PI * k) * 1.4 * PPC); sprite(IM.stopper, MS, sS); ctx.restore();
}
const tag = (x, y, t1, t2, bg, fg, size) => { ctx.save(); const F = (w, k) => `${w} ${size * k}px -apple-system, "Helvetica Neue", Arial, sans-serif`; ctx.font = F(700, 1); const w = Math.max(ctx.measureText(t1).width, t2 ? size * 2.9 : 0) + size * 0.9, h = size * (t2 ? 2.75 : 1.7); ctx.beginPath(); ctx.roundRect(x - w / 2, y - size * 0.85, w, h, size * 0.5); ctx.fillStyle = bg; ctx.fill(); ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t1, x, y + size * 0.04); if (t2) { ctx.font = F(500, 0.8); ctx.globalAlpha = 0.85; ctx.fillText(t2, x, y + size * 1.12); } ctx.restore(); };
const pill = (x, y, text, bg, fg, size) => { ctx.save(); ctx.font = `700 ${size}px -apple-system, "Helvetica Neue", Arial, sans-serif`; const w = ctx.measureText(text).width + size * 1.1, h = size * 1.7; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2); ctx.fillStyle = bg; ctx.fill(); ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + size * 0.04); ctx.restore(); };
function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.setTransform(...VIEW); ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(IM.bg, 0, 0, W, H);
  const rw = MR.w * sR, rh = MR.h * sR, rx0 = rX(0), ry0 = rY(0);
  ctx.save(); ctx.beginPath(); ctx.rect(0, BASE, W, 3.2 * PPC); ctx.clip(); ctx.translate(0, 2 * BASE + 0.1 * PPC); ctx.scale(1, -1); ctx.globalAlpha = 0.10; ctx.drawImage(IM.rack, rx0, ry0, rw, rh); ctx.globalAlpha = 1;
  for (const T of tubes) { ctx.save(); ctx.translate(T.x, TUBE_BY); sprite(IM.tube, MT, sT, 0.22); ctx.restore(); }
  for (const b of bottles) if (Math.abs(b.rot) < 0.02) { ctx.save(); ctx.translate(b.home.x, b.home.y - (b.home.y - BASE) * 2); sprite(IM.bottle, MB, sB, 0.28); ctx.restore(); } ctx.restore();
  shadow(RXC, BASE + 0.15 * PPC, rw * 0.56, 1.0 * PPC, 0.5);
  ctx.drawImage(IM.rack, rx0, ry0, rw, rh);
  for (const T of tubes) drawTube(T);
  const fy = MR.frontTop, fh = MR.plateBottom - MR.frontTop; ctx.drawImage(IM.rack, 0, fy, MR.w, fh, rx0, rY(fy), rw, fh * sR); // dải mặt trước của tấm trên vẽ đè lại để ống trông như cắm xuyên qua lỗ
  for (const T of tubes) { const on = S.hover === T || (S.last && S.last.T === T); tag(T.x, BASE + 1.2 * PPC, `Ống ${LET[T.i]}`, T.chem.vol > 0.01 ? `${fm(T.chem.vol, 1)} mL` : '', on ? 'rgba(235,243,255,0.96)' : 'rgba(16,26,42,0.82)', on ? '#14223a' : '#f2f5f9', 0.5 * PPC); if (T.flash && !S.busy) pill(T.x, MOUTH_Y - 1.1 * PPC, T.flash.text, T.flash.calm ? 'rgba(16,26,42,0.85)' : 'rgba(10,122,75,0.95)', '#fff', 0.56 * PPC); }
  for (const b of bottles) if (Math.abs(b.rot) < 0.02) drawBottle(b); for (const b of bottles) if (Math.abs(b.rot) >= 0.02) drawBottle(b);
}

// ---------- thao tác ----------
const toScene = (e) => { const r = cv.getBoundingClientRect(), d = cv.width / r.width; return [((e.clientX - r.left) * d - VIEW[4]) / VIEW[0], ((e.clientY - r.top) * d - VIEW[5]) / VIEW[3]]; };
const hit = (x, y) => bottles.find((b) => Math.abs(x - b.home.x) < 3 * PPC && y > b.home.y - HB - 2.5 * PPC && y < b.home.y + 0.5 * PPC) || tubes.find((T) => Math.abs(x - T.x) < 1.45 * PPC && y > MOUTH_Y - PPC && y < BASE + 2 * PPC) || null;
cv.addEventListener('pointermove', (e) => { const h = hit(...toScene(e)); S.hover = h; cv.style.cursor = h && !S.busy ? 'pointer' : 'default'; });
cv.addEventListener('click', (e) => { if (S.busy) return; const h = hit(...toScene(e)); if (!h) { S.sel = null; say(); return; } if (h.id) { S.sel = S.sel === h ? null : h; say(); return; } if (!S.sel) { $('hint').textContent = 'Chọn một lọ trước đã.'; return; } pour(S.sel, h, S.sel.dose); });
$('bReset').addEventListener('click', () => { if (!S.busy) preset(); });
new ResizeObserver(fit).observe(cv); fit(); preset();
let prev = performance.now(); const frame = (now) => { tick(Math.min(0.25, (now - prev) / 1000)); prev = now; draw(); requestAnimationFrame(frame); }; requestAnimationFrame(frame);
// Cửa cho kiểm thử: chạy từng bước thời gian thay cho đồng hồ thật.
window.__flat = { S, tubes, bottles, pour, preset, run: (sec, step = 1 / 30) => { for (let t = 0; t < sec; t += step) tick(step); draw(); }, shot: async (name) => { draw(); const res = await fetch('/__shot?name=' + name, { method: 'POST', body: await (await fetch(cv.toDataURL('image/jpeg', 0.93))).blob() }); return name + ': ' + res.status + ' ' + cv.width + 'x' + cv.height; } };
