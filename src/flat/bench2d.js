// Bàn thực hành 2D có chiều sâu (chủ 19/11): cùng giao ước với bàn 3D (src/free/bench.js) để phần điều khiển lab.js dùng chung.
// Nền là ảnh phòng lab; dụng cụ thuỷ tinh là ảnh chụp trên nền xám 50% vẽ lên bằng phép trộn hard-light (xám = trong suốt);
// chất lỏng, kết tủa, bọt khí, mẩu chất rắn, dòng chảy, ngọn lửa, giấy quỳ, que đóm, nhãn vẽ bằng mã. Mọi chuyển động chạy theo advance(dt).
import { BY_ID } from '../chem/data.js';
import { pretty } from '../chem/formula.js';

export const PPT_HEX = { 'đen': 0x1c1c1e, 'trắng': 0xf4f6f8, 'trắng xanh': 0xcfe3d6, 'trắng ngả vàng': 0xf1ecd0, 'vàng': 0xf0cf3a, 'xanh lam': 0x2b86e0, 'nâu đỏ': 0x9a4a2a, 'nâu đen': 0x3a2a22, 'xám': 0x8c9199 };
const COAT = { 'đỏ': '#b5552e', 'trắng xám': '#c9ced4', 'xám': '#7f858c', 'trắng bạc': '#d3d8de' };
const SOLID = { Zn: ['#9aa3ab', 'pebble'], Mg: ['#cfd4d9', 'strip'], Al: ['#d3d8de', 'strip'], Fe: ['#6e7379', 'nail'], Cu: ['#b5552e', 'strip'], Ag: ['#dfe3e8', 'strip'], Na: ['#cfd4d9', 'cube'], CaCO3: ['#e9e6dc', 'pebble'], CuO: ['#1c1c1e', 'powder'], MnO2: ['#2a2a2c', 'powder'], CaO: ['#f1efe8', 'powder'] };
const AMBER = new Set(['AgNO3', 'KMnO4', 'H2O2', 'KI']);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, k) => a + (b - a) * k, ease = (k) => k * k * (3 - 2 * k);
const rgb = (hex) => [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16));
const rgba = (hex, a, mul = 1) => { const c = rgb(hex).map((v) => Math.round(clamp(v * mul, 0, 255))); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
const css = (n) => (typeof n === 'string' ? n : '#' + n.toString(16).padStart(6, '0'));
const FONT = (document.documentElement.dataset.font === 'plex' ? '"IBM Plex Sans", ' : '') + '-apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif';
const META = await (await fetch('./assets/flat/meta.json?' + Date.now())).json();
const IM = {}; await Promise.all(Object.keys(META).map((k) => new Promise((res) => { const i = new Image(); i.onload = () => { IM[k] = i; res(); }; i.onerror = () => res(); i.src = './assets/flat/' + META[k].file; })));

// Nền hai lớp: lớp tường là ảnh (đã cắt tới mép bàn), mặt bàn vẽ bằng mã một màu.
// NỀN CHÍNH của trang theo design system = 'sang' (chủ chốt 19/11: "A, tường sáng"), ảnh đã nâng gấp đôi độ phân giải. Đổi thử bằng ?bg=...; ?bg=cu là ảnh nền một lớp cũ. Trang cũ (không có data-ui="ds") vẫn dùng nền cũ.
//   sang / toi / do : ba ảnh rộng 3:1 Codex vẽ theo LAB-009 (tường sáng · tường tối · tường sáng có kệ 3 món), ánh sáng đều, tường giáp thẳng mép bàn
//   thu / thu2      : ảnh chủ gửi 19/11 (tường phẳng · còn dải kệ)
// L, R0 = cột hết cửa sổ và cột bắt đầu tủ hút trong ảnh: hai khúc đó giữ tỉ lệ, khúc tường trơn ở giữa được kéo giãn cho đủ bề ngang. bench = màu mặt bàn đo từ chính ảnh.
const BGV = { sang: { file: 'bg_p_sang.jpg', L: 286, R0: 3537, bench: 'rgb(72,72,75)' }, toi: { file: 'bg_p_toi.jpg', L: 237, R0: 1771, bench: 'rgb(64,64,68)' }, do: { file: 'bg_p_do.jpg', L: 485, R0: 1688, bench: 'rgb(79,80,82)' },
  thu: { file: 'bg_thu_phang.jpg', L: 160, R0: 1195, bench: 'rgb(80,80,83)' }, thu2: { file: 'bg_thu_tuong.jpg', L: 160, R0: 1195, bench: 'rgb(80,80,83)' } };
const BGC = BGV[new URLSearchParams(location.search).get('bg') || (document.documentElement.dataset.ui === 'ds' ? 'sang' : '')] || null, BGT = BGC ? await new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = './assets/flat/' + BGC.file; }) : null;
const BGT_DIM = Number(new URLSearchParams(location.search).get('toi') || 0); // ?toi=0.15: phủ tối tường thêm 15% để so độ nổi của thuỷ tinh

export function createFreeBench(host, { nameOf = (id) => id, theme = {} } = {}) {
  const TH = { tagOn: 'rgba(235,243,255,0.96)', tagOnInk: '#14223a', tagOnLine: null, accent: '64,150,255', chip: 'rgba(47,111,208,0.95)', ...theme }; // màu nhấn: trang theo design system truyền tông tím vào để nhãn trên bàn khớp bộ chọn ống bên dưới
  const cv = document.createElement('canvas'); cv.className = 'lk-canvas'; cv.style.cssText = 'width:100%;height:100%;display:block;touch-action:none'; host.appendChild(cv);
  let ctx = cv.getContext('2d'); // let: hàm ảnh nhỏ (thumb) mượn tạm các hàm vẽ trên một canvas khác
  // ---------- hệ toạ độ cảnh = điểm ảnh của ảnh nền; 1 cm thật = PPC điểm ảnh ----------
  const W = META.bg.w, H = META.bg.h, BASE = H * META.bg.base, PPC = (H * 0.40) / 16;
  const MT = META.tube, MB = META.bottle, MS = META.stopper, MR = META.rack, MJ = META.jar || MB, MK = META.beaker, ML = META.lamp, MD = META.dropper, MH = META.holder, MW = META.washbottle;
  const scaleOf = (m, cm) => (cm * PPC) / (m.bottom - m.top);
  const sT = scaleOf(MT, 16), sB = scaleOf(MB, 9.5), sJ = scaleOf(MJ, 9.5), sS = sB * MS.fit, sR = PPC / MR.ppc, sK = MK ? scaleOf(MK, 9.5) : 1, sL = ML ? scaleOf(ML, 8.2) : 1, sD = MD ? scaleOf(MD, 9.5) : 1, sH = MH ? (15 * PPC) / MH.w : 1, sW = MW ? scaleOf(MW, 17) : 1;
  const RXC = W * 0.5, rw = MR.w * sR, rX = (x) => RXC + (x - MR.cx) * sR, rY = (y) => BASE - (MR.bottom - y) * sR;
  const TUBE_BY = rY(MR.baseTop) + 0.08 * PPC, TL = 16 * PPC, MOUTH_Y = TUBE_BY - TL, HB = 9.5 * PPC, BY = BASE + 0.9 * PPC;
  const IN_R = 0.7, HEMI = (2 / 3) * Math.PI * IN_R ** 3;
  const levelCm = (mL) => { if (mL <= 0) return 0; if (mL >= HEMI) return IN_R + (mL - HEMI) / (Math.PI * IN_R * IN_R); let lo = 0, hi = IN_R; for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if ((Math.PI * m * m * (3 * IN_R - m)) / 3 < mL) lo = m; else hi = m; } return (lo + hi) / 2; };
  const SLOTX = [RXC - rw / 2 - 3.6 * PPC, RXC + rw / 2 + 3.6 * PPC, RXC - rw / 2 - 8.7 * PPC, RXC + rw / 2 + 8.7 * PPC, RXC + rw / 2 + 13.8 * PPC], BEAK = { x: RXC - rw / 2 - 15 * PPC, y: BY }, SPOT = BEAK; // đèn cồn hiện đúng chỗ cốc thải khi đun (cốc tạm ẩn)
  const VX0 = BEAK.x - 6.2 * PPC, /* 6,2 cm: đủ chỗ cho chân kiềng (rộng 11,4 cm) lúc đun cốc, không bị cắt ở mép trái */ VXB = RXC + rw / 2 + 11.6 * PPC; let VX1 = VXB, VCX = (VX0 + VX1) / 2, NEEDW = VX1 - VX0; // có lọ thứ 5 thì mép phải nới thêm 5,1 cm
  const SLOTS = SLOTX.map((x) => ({ x, id: null }));
  // Cốc thuỷ tinh 100 mL làm bình phản ứng (đợt 1, 19/11): dùng lại beaker.png, cao 7,7 cm theo tỉ lệ bàn. Với dáng lòng cốc trong prof, cao 7,7 cm thì
  // tới miệng chứa khoảng 130 mL và vạch 100 mL nằm ở khoảng 78% chiều sâu, đúng như cốc 100 mL thật (đường kính trong khoảng 4,7 cm). Hai chỗ đặt cốc bên phải chỗ lọ thứ 5.
  const BK_H = 7.7, sKr = MK ? scaleOf(MK, BK_H) : 1;
  const VSLOT = [0, 1, 2, 3].map((k) => RXC + rw / 2 + 19.3 * PPC + k * 6.6 * PPC); // 4 chỗ đặt bình ngoài giá, bên phải chỗ lọ thứ 5
  // Mực chất lỏng theo biên dạng lòng bình (prof): cộng dồn thể tích hình tròn xoay từ đáy lên, rồi tra ngược mL → độ cao (cm).
  function levelFromProf(m, s) { const k = s / PPC, rows = m.prof.filter((r) => r[0] <= m.bottom - m.floor).sort((a, b) => b[0] - a[0]), y0 = m.bottom - m.floor, H = [0], V = [0];
    for (let j = 1; j < rows.length; j++) { const dy = (rows[j - 1][0] - rows[j][0]) * k, r = Math.max(0, (rows[j][2] - rows[j][1]) / 2 - m.wall) * k; H.push((y0 - rows[j][0]) * k); V.push(V[j - 1] + Math.PI * r * r * dy); }
    const f = (mL) => { if (mL <= 0) return 0; let j = 1; while (j < V.length - 1 && V[j] < mL) j++; return H[j - 1] + (H[j] - H[j - 1]) * clamp((mL - V[j - 1]) / Math.max(1e-9, V[j] - V[j - 1]), 0, 1); }; f.brim = V[V.length - 1]; return f; }
  const levWaste = MK ? levelFromProf(MK, sK) : levelCm;
  const halfOut = (m, s) => (Math.max(...m.prof.map((r) => r[2])) - Math.min(...m.prof.map((r) => r[1]))) / 2 * s;

  // Đường bao lòng dụng cụ lấy từ dáng ảnh (prof = các hàng [y, mép trái, mép phải]), lùi vào một bề dày thành. Gốc ở giữa đáy, y âm là đi lên.
  const pathCache = new Map();
  function inner(m, s, yTop) {
    const key = m.file + '|' + s.toFixed(4) + '|' + Math.round(yTop); let p = pathCache.get(key); if (p) return p; if (pathCache.size > 600) pathCache.clear();
    const rows = m.prof.filter((r) => r[0] <= m.bottom - m.floor).map((r) => [(r[0] - m.bottom) * s, (r[1] + m.wall - m.cx) * s, (r[2] - m.wall - m.cx) * s]).filter((r) => r[2] > r[1] && r[0] >= yTop);
    p = new Path2D(); if (rows.length) { p.moveTo(rows[0][1], yTop); for (const r of rows) p.lineTo(r[1], r[0]); for (let k = rows.length - 1; k >= 0; k--) p.lineTo(rows[k][2], rows[k][0]); p.lineTo(rows[0][2], yTop); p.closePath(); }
    pathCache.set(key, p); return p;
  }
  const halfAt = (m, s, y) => { let best = m.prof[0]; for (const r of m.prof) if (Math.abs((r[0] - m.bottom) * s - y) < Math.abs((best[0] - m.bottom) * s - y)) best = r; return ((best[2] - best[1]) / 2 - m.wall) * s; };
  const glass = (k, m, s, alpha = 1) => { if (!IM[k]) return; ctx.save(); ctx.globalAlpha *= alpha; ctx.globalCompositeOperation = 'hard-light'; ctx.drawImage(IM[k], -m.cx * s, -m.bottom * s, m.w * s, m.h * s); ctx.restore(); };
  const solidImg = (k, m, s) => { if (IM[k]) ctx.drawImage(IM[k], -m.cx * s, -m.bottom * s, m.w * s, m.h * s); };
  const shadow = (x, y, rx, ry, a) => { const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.save(); ctx.translate(x, y); ctx.scale(rx, ry); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, 6.3); ctx.fill(); ctx.restore(); };

  // ---------- trạng thái ----------
  // Bình trên bàn: ống nghiệm cắm trong giá (luôn có) hoặc cốc đặt trên mặt bàn (lấy từ tủ Dụng cụ). Mỗi bình mang hình, tỉ lệ, chân, chiều dài, cách tính mực, sức chứa riêng.
  const GEO = { tube: { m: MT, s: sT, by: TUBE_BY, len: TL, lev: levelCm, cap: 12, key: 'tube', layerK: 1, tagY: BASE + 1.3 * PPC }, };
  GEO.tube.half = halfOut(MT, sT);
  // Bình ngoài giá, lấy từ tủ Dụng cụ (kho LAB-010): kind → [khoá ảnh trong meta.json, cao thật (cm), sức chứa (mL), tên, số cái trong tủ].
  // Cao thật chọn để thể tích tính từ prof khớp bình thật: cốc 100 mL cao 7,7 cm tới miệng chứa khoảng 130 mL; bình tam giác 11 cm (100 mL ở khoảng 2/3 chiều sâu); bình cầu 11,5 cm (100 mL tới gần cổ); ống đong 17 cm (50 mL ở khoảng 80% chiều sâu). Ảnh chưa có trong meta thì món đó chưa hiện.
  const EXTRA = [['beaker', 'beaker', BK_H, 100, 'Cốc', 2], ['erlenmeyer', 'erlenmeyer', 11, 100, 'Bình tam giác', 1], ['flask', 'flask', 11.5, 100, 'Bình cầu', 1], ['cylinder', 'cylinder', 17, 50, 'Ống đong', 1]];
  for (const [kind, key, cm, cap] of EXTRA) { const m = META[key]; if (!m || !m.prof || !IM[key]) continue; const s = scaleOf(m, cm), lev = levelFromProf(m, s), r = Math.max(...m.prof.map((q) => (q[2] - q[1]) / 2 - m.wall)) * s / PPC;
    GEO[kind] = { m, s, by: BY, len: cm * PPC, lev, cap, key, layerK: clamp(3.2 / (Math.PI * r * r), 0.15, 1), tagY: BY + 1.0 * PPC, half: halfOut(m, s), brim: lev.brim }; }
  const mouthY = (T) => T.by - T.len, floorY = (T) => T.by - T.m.floor * T.s;
  const mkTube = (hx, i, kind = 'tube', name = `Ống ${'ABCDE'[i]}`) => ({ i, kind, name, on: kind === 'tube', pop: 1, ...GEO[kind], x: kind === 'tube' ? rX(hx) : hx, mL: 0, mLto: 0, col: '#dcecf5', op: 0.3, layer: 0, layerTo: 0, lcol: '#ffffff', parts: [], bub: [], gasT: 0, gasI: 0, solids: {}, pose: null, stream: null, tag: '', spill: 1,
    setLook({ mL, hex, opacity }) { this.mLto = mL; this.col = hex; this.op = opacity; },
    precipitate(hex, form, mmol, layerH) { this.melt = 0; this.lcol = css(hex); this.layerTo = Math.max(layerH * 10 * this.layerK, Math.min(0.25, layerH * 10)); const n = Math.round(clamp(mmol * 260, 8, 46)), top = this.lev(Math.max(this.mLto, 0.3)); for (let k = 0; k < n && this.parts.length < 130; k++) this.parts.push({ x: (Math.random() * 2 - 1) * 0.82, y: top * (0.3 + Math.random() * 0.65), r: (form === 'keo' || form === 'bông' ? 0.05 : 0.032) + Math.random() * 0.045, v: 0.22 + Math.random() * 0.35, w: Math.random() * 6.28, col: this.lcol }); },
    // Kết tủa tan (21/11, U2): lớp đáy rút từ từ về mức còn lại (layerH = 0 là tan hết), KHÔNG rắc hạt mới; tan hết thì các hạt còn lơ lửng nhỏ dần rồi mất. hex = màu kết tủa còn lại (null: giữ màu cũ).
    dissolve(layerH, hex) { if (hex != null) this.lcol = css(hex); this.layerTo = layerH > 0 ? Math.max(layerH * 10 * this.layerK, Math.min(0.25, layerH * 10)) : 0; if (layerH <= 0) this.melt = 2.5; },
    gas(intensity, dur) { this.gasI = intensity; this.gasT = dur; },
    setSolid(id, frac, coat) { const s = this.solids[id] || (this.solids[id] = { k: 1, tk: 1, coat: null, seed: Math.random() * 9 }); s.tk = frac; if (coat) s.coat = COAT[coat] || '#8c9199'; },
    resuspend() { if (this.layer < 0.04) return; const n = Math.round(clamp(this.layer * 50, 10, 60)), top = this.lev(this.mL); this.layer *= 0.25; for (let k = 0; k < n; k++) this.parts.push({ x: (Math.random() * 2 - 1) * 0.82, y: top * Math.random() * 0.9, r: 0.03 + Math.random() * 0.04, v: 0.2 + Math.random() * 0.3, w: Math.random() * 6.28, col: this.lcol }); },
    reset() { this.mL = this.mLto = 0; this.col = '#dcecf5'; this.op = 0.3; this.layer = this.layerTo = 0; this.parts = []; this.bub = []; this.gasT = 0; this.solids = {}; this.pose = null; this.stream = null; this.spill = 1; } });
  const tubes = MR.holes.slice(0, 5).map((h, i) => mkTube(h, i));
  for (const [kind, , , , name, n] of EXTRA) if (GEO[kind]) for (let k = 0; k < n; k++) tubes.push(mkTube(0, tubes.length, kind, n > 1 ? `${name} ${k + 1}` : name));
  const bottles = {}; let clock = 0, active = 0, selId = null, selText = '', awaiting = false, hover = null, pickCb = null, hoverCb = null;
  const flash = { i: 0, text: '', calm: false };
  const waste = { mL: 0, col: '#dcecf5' };
  const FX = { tripod: 0, rod: null, lamp: 0, flame: 0, holder: null, dropper: null, drops: [], piece: null, tool: null, rinse: null, thermo: null, litmus: null, splint: null, pop: 0 };
  // Chuẩn chất liệu (mục 35–37, LAB-011): chỉ thị đựng lọ nhỏ giọt bóp đỏ; chất nhạy sáng đựng lọ thuỷ tinh nâu thật (thay lớp phủ nâu vẽ mã cũ).
  const kindOf = (id) => (id === 'H2O' && MW ? 'wash' : ['metal', 'solid'].includes(BY_ID[id].group) ? 'jar' : BY_ID[id].group === 'indicator' && META.dropbottle && IM.dropbottle ? 'drop' : 'bottle');
  const DB_H = 10.5 * PPC, DB_BODY = 6.6 * PPC; // lọ nhỏ giọt: cao 10,5 cm kể cả quả bóp; thân + cổ khoảng 6,6 cm
  const vesselOf = (b) => { const amb = AMBER.has(b.id); if (b.kind === 'drop') { const k = amb && IM.dropbottle_amber ? 'dropbottle_amber' : 'dropbottle'; return { key: k, m: META[k], s: scaleOf(META[k], 10.5), amberImg: amb && k === 'dropbottle_amber' }; }
    if (b.kind === 'jar') { const k = amb && IM.jar_amber ? 'jar_amber' : IM.jar ? 'jar' : 'bottle'; return { key: k, m: k === 'jar_amber' ? META.jar_amber : MJ, s: k === 'jar_amber' ? scaleOf(META.jar_amber, 9.5) : sJ, amberImg: k === 'jar_amber' }; }
    const k = amb && IM.bottle_amber ? 'bottle_amber' : 'bottle'; return { key: k, m: k === 'bottle_amber' ? META.bottle_amber : MB, s: k === 'bottle_amber' ? scaleOf(META.bottle_amber, 9.5) : sB, amberImg: k === 'bottle_amber' }; };
  // Ống nhỏ giọt: quả bóp tô đỏ cho khớp lọ nhỏ giọt (ảnh gốc quả bóp đen): đổi màu các điểm ảnh tối ở phần trên ảnh, giữ sáng tối
  if (IM.dropper && MD) { const im = IM.dropper, c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const top = Math.round(MD.top + (MD.bottom - MD.top) * 0.26), d = x.getImageData(0, 0, c.width, top);
    for (let i = 0; i < d.data.length; i += 4) { const l = (d.data[i] + d.data[i + 1] + d.data[i + 2]) / 3; if (l < 112) { d.data[i] = 120 + 1.1 * l; d.data[i + 1] = d.data[i + 2] = 10 + 0.3 * l; } } x.putImageData(d, 0, 0); IM.dropperRed = c; }
  const liquidOf = (id) => { const c = BY_ID[id]; return { hex: c.hex || '#dcecf5', a: c.hex ? 0.72 : 0.2 }; };

  // ---------- chuỗi động tác (một việc chính tại một thời điểm) + hoạt ảnh nền ----------
  let seq = null; const anims = [];
  const play = (steps, done) => { seq = { steps, i: 0, t: 0, done }; if (steps[0].start) steps[0].start(); };
  function tickSeq(dt) {
    while (seq) { const st = seq.steps[seq.i]; seq.t += dt; if (st.hold) { if (!st.hold(dt)) break; dt = 0; } else { const k = Math.min(1, seq.t / st.dur); if (st.fn) st.fn(st.lin ? k : ease(k)); if (k < 1) break; dt = seq.t - st.dur; }
      seq.i++; seq.t = 0; if (seq.i >= seq.steps.length) { const d = seq.done; seq = null; if (d) d(); break; } if (seq.steps[seq.i].start) seq.steps[seq.i].start(); }
  }
  let T0 = 0;
  function advance(dt) {
    T0 += dt; clock += dt; tickSeq(dt);
    { idleT = seq ? 0 : idleT + dt; const A = tubes[active], want = curView === 'tube' && idleT > 0.9 && !ghost && !A.pose && A.mLto > 0.02 && callouts.length ? 1 : 0; if (want !== lookWant) { lookWant = want; if (curView === 'tube') aimTube(); } lookK = lerp(lookK, want, 1 - Math.exp(-dt * (want ? 5 : 16))); if (lookK < 0.004) lookK = 0; }
    for (let k = anims.length - 1; k >= 0; k--) if (anims[k](dt)) anims.splice(k, 1);
    for (const T of tubes) {
      T.mL = lerp(T.mL, T.mLto, 1 - Math.exp(-dt * 10)); T.layer = lerp(T.layer, T.layerTo, 1 - Math.exp(-dt * 0.9));
      for (const p of T.parts) { p.y -= p.v * dt; p.w += dt * 2; p.x = clamp(p.x + Math.sin(p.w) * dt * 0.15, -0.85, 0.85); } T.parts = T.parts.filter((p) => p.y > T.layer * 0.8);
      if (T.melt > 0) { T.melt -= dt; const k = Math.exp(-dt * 2.2); for (const p of T.parts) p.r *= k; T.parts = T.parts.filter((p) => p.r > 0.012); } // kết tủa vừa tan hết: hạt lơ lửng nhỏ dần rồi mất
      if (T.gasT > 0) { T.gasT -= dt; const top = T.lev(T.mL); if (Math.random() < T.gasI * dt * 34 && T.bub.length < 46 && top > 0.2) T.bub.push({ x: (Math.random() * 2 - 1) * 0.7, y: Math.random() * top * 0.25, r: 0.03 + Math.random() * 0.05, v: 1.6 + Math.random() * 1.8 }); }
      T.pop = Math.min(1, T.pop + dt / 0.22); const top = T.lev(T.mL); for (const b of T.bub) { b.y += b.v * dt; b.x = clamp(b.x + (Math.random() - 0.5) * dt * 0.8, -0.8, 0.8); } T.bub = T.bub.filter((b) => b.y < top);
      for (const s of Object.values(T.solids)) s.k = lerp(s.k, s.tk, 1 - Math.exp(-dt * 0.8));
    }
    for (const b of Object.values(bottles)) { b.pop = Math.min(1, b.pop + dt / 0.22); b.lift = lerp(b.lift, selId === b.id && !b.busy ? 1 : 0, 1 - Math.exp(-dt * 12)); }
    { const bk = tubes.filter((T) => T.on && T.kind !== 'tube').map((T) => T.x + T.half + 0.9 * PPC), want = Math.max(SLOTS[4] && SLOTS[4].id ? VXB + 5.1 * PPC : VXB, ...bk); if (Math.abs(VX1 - want) > 0.5) { VX1 = lerp(VX1, want, 1 - Math.exp(-dt * 6)); VCX = (VX0 + VX1) / 2; NEEDW = VX1 - VX0; refit(); if (Z.tz <= 1) { Z.x = Z.tx; } } }
    FX.pop = Math.max(0, FX.pop - dt * 3); if (flash.text && !seq) { flash.hold -= dt; if (flash.hold <= 0 && flash.clear) flash.text = ''; }
    Z.z = lerp(Z.z, Z.tz, 1 - Math.exp(-dt * 9)); Z.x = lerp(Z.x, Z.tx, 1 - Math.exp(-dt * 9)); Z.y = lerp(Z.y, Z.ty, 1 - Math.exp(-dt * 9));
    draw();
  }

  // ---------- lọ trên bàn ----------
  function bringOut(id, keep = []) {
    if (bottles[id]) { bottles[id].used = clock; return { evicted: null }; }
    let slot = SLOTS.find((s) => !s.id), evicted = null;
    if (!slot) { const old = Object.values(bottles).filter((b) => b.id !== selId && !b.busy && !keep.includes(b.id)).sort((a, b) => a.used - b.used)[0]; if (!old) return { evicted: null, full: true }; evicted = old.id; slot = old.slot; putAway(old.id); }
    const kind = kindOf(id), h = kind === 'wash' ? 0 : HB; slot.id = id;
    bottles[id] = { id, kind, slot, x: slot.x, y: BY, mx: slot.x, my: BY - h, rot: 0, fill: 0.62, stopOn: 1, lift: 0, pop: 0, used: clock, busy: false };
    return { evicted };
  }
  function putAway(id) { const b = bottles[id]; if (!b || b.busy) return false; if (FX.dropper && FX.dropper.id === id) FX.dropper = null; b.slot.id = null; delete bottles[id]; if (selId === id) selId = null; return true; }
  const home = (b) => ({ x: b.x, y: b.y - HB });

  // ---------- rót ----------
  let flow = null; const RATE = 2.5, CHUNK = 0.25; // cốc rót nhanh gấp 4 (mỗi phần 1 mL) để 20–50 mL không phải chờ lâu
  function stowDropper() { const d = FX.dropper; if (!d) return; FX.dropper = null; const b = bottles[d.id]; if (b) b.stopOn = 1; }
  function pour(id, ti, { target = null, onChunk, onDone }) {
    stowDropper(); const b = bottles[id], T = tubes[ti], big = T.kind !== 'tube', rate = big ? RATE * 4 : RATE, chunk = big ? 1 : CHUNK, MOUTH_Y = mouthY(T); b.busy = true; b.used = clock; flow = { poured: 0, acc: 0, stop: false, target, full: false };
    const L = liquidOf(id), run = (dt, y0) => { const f = flow, lim = f.target ?? Infinity, d = Math.min(rate * dt, lim - f.poured); f.poured += d; f.acc += d; T.stream = { y0, col: L };
      while (f.acc >= chunk - 1e-9 && !f.full) { f.acc -= chunk; b.fill = Math.max(0.18, b.fill - 0.004); if (onChunk(chunk) === false) f.full = true; }
      const done = f.full || f.poured >= lim - 1e-9 || (f.stop && f.poured >= 0.5 - 1e-9); if (done) { if (!f.full && f.acc > 0.004) onChunk(f.acc); T.stream = null; } return done; };
    const finish = () => { const f = flow; flow = null; b.busy = false; if (onDone) onDone(f.poured, f.full); };
    if (b.kind === 'wash') { // bình tia: đưa đầu vòi tới trên miệng ống, nghiêng bình quanh đầu vòi cho thân nằm phía trên các miệng ống rồi bóp
      const tip = { x: (MW.tip[0] - MW.cx) * sW, y: (MW.tip[1] - MW.bottom) * sW }, at = { x: T.x - tip.x, y: MOUTH_Y - 0.5 * PPC - tip.y }, from = { x: b.x, y: b.y };
      play([{ dur: 0.65, fn: (k) => { b.mx = lerp(from.x, at.x, k); b.my = lerp(from.y, at.y, k) - Math.sin(Math.PI * k) * 0.8 * PPC; b.rot = -1.3 * k; } }, { hold: (dt) => run(dt, MOUTH_Y - 0.5 * PPC) }, { dur: 0.65, fn: (k) => { b.mx = lerp(at.x, from.x, k); b.my = lerp(at.y, from.y, k) - Math.sin(Math.PI * k) * 0.8 * PPC; b.rot = -1.3 * (1 - k); } }], finish); return;
    }
    const side = b.x < T.x ? -1 : 1, th = side < 0 ? 1.68 : -1.68, c = Math.cos(th), s = Math.sin(th), rn = (b.kind === 'jar' ? (MJ.neckR / MJ.ppc) : (MB.neckR / MB.ppc)) * PPC, h0 = home(b);
    const M = { x: T.x - rn * 0.9 * c * Math.sign(th), y: MOUTH_Y - 0.9 * PPC - Math.abs(rn * s) }, hv = { x: M.x - Math.sign(th) * 2.2 * PPC, y: M.y - 2.4 * PPC }, from = {};
    play([
      { dur: 0.28, fn: (k) => { b.stopOn = 1 - k; } },
      { dur: 0.6, fn: (k) => { b.mx = lerp(h0.x, hv.x, k); b.my = lerp(h0.y, hv.y, k) - Math.sin(Math.PI * k) * 1.2 * PPC; b.rot = th * 0.3 * k; } },
      { dur: 0.42, fn: (k) => { b.mx = lerp(hv.x, M.x, k); b.my = lerp(hv.y, M.y, k); b.rot = th * (0.3 + 0.7 * k); } },
      { hold: (dt) => run(dt, M.y + Math.abs(rn * s) * 0.6) },
      { dur: 0.25, start() { from.x = b.mx; from.y = b.my; }, fn: (k) => { b.rot = th * (1 - 0.7 * k); b.mx = lerp(from.x, hv.x, k); b.my = lerp(from.y, hv.y, k); } },
      { dur: 0.55, fn: (k) => { b.mx = lerp(hv.x, h0.x, k); b.my = lerp(hv.y, h0.y, k) - Math.sin(Math.PI * k) * 1.0 * PPC; b.rot = th * 0.3 * (1 - k); } },
      { dur: 0.25, fn: (k) => { b.stopOn = k; } },
    ], finish);
  }
  const stopPour = () => { if (flow) flow.stop = true; };

  // ---------- ống nhỏ giọt: hút ở lọ, treo trên miệng ống, mỗi lần gọi rơi một giọt ----------
  function arm(id, ti, onDone) {
    const b = bottles[id], T = tubes[ti], over = { x: T.x, y: mouthY(T) + 1.5 * PPC }, same = FX.dropper && FX.dropper.id === id, L = liquidOf(id);
    if (FX.dropper && !same) stowDropper();
    if (same) { const d = FX.dropper, f = { x: d.x, y: d.y }; d.armed = false; play([{ dur: 0.35, fn: (k) => { d.x = lerp(f.x, over.x, k); d.y = lerp(f.y, over.y, k) - Math.sin(Math.PI * k) * 0.8 * PPC; } }], () => { d.ti = ti; d.armed = true; if (onDone) onDone(); }); return; }
    const seat = { x: b.x, y: b.kind === 'drop' ? b.y - DB_BODY + 3.0 * PPC : b.y - HB + 3.2 * PPC }, up = { x: b.x, y: b.y - HB - 1.2 * PPC }, d = FX.dropper = { id, ti, x: seat.x, y: seat.y, fill: 0, squeeze: 0, col: L, armed: false, n: 0 };
    play([{ dur: 0.25, fn: (k) => { b.stopOn = 1 - k; } }, { dur: 0.3, lin: true, fn: (k) => { d.squeeze = k < 0.4 ? k / 0.4 : 1 - (k - 0.4) / 0.6; if (k > 0.4) d.fill = 0.75 * ((k - 0.4) / 0.6); } }, { dur: 0.26, fn: (k) => { d.x = lerp(seat.x, up.x, k); d.y = lerp(seat.y, up.y, k); } }, { dur: 0.46, fn: (k) => { d.x = lerp(up.x, over.x, k); d.y = lerp(up.y, over.y, k) - Math.sin(Math.PI * k) * 0.6 * PPC; } }], () => { d.armed = true; if (onDone) onDone(); });
  }
  function dropOne(onLand) {
    const d = FX.dropper; if (!d || !d.armed) return false; const T = tubes[d.ti], drop = { x: d.x, y: d.y, col: d.col, t: 0 }; FX.drops.push(drop); d.n++; d.fill = Math.max(0.12, d.fill - 0.02);
    anims.push((dt) => { drop.t += dt; d.squeeze = Math.sin(Math.min(1, drop.t / 0.22) * Math.PI) * 0.7; if (drop.t > 0.1) { const k = (drop.t - 0.1) / 0.22, yb = floorY(T) - T.lev(T.mL) * PPC; drop.y = lerp(d.y, yb, k * k); if (k >= 1) { FX.drops.splice(FX.drops.indexOf(drop), 1); d.squeeze = 0; if (onLand) onLand(); return true; } } return false; });
    return true;
  }
  const disarm = () => stowDropper();

  // ---------- chất rắn: mẩu chất bay từ lọ sang rồi rơi vào ống ----------
  // Chất rắn lấy bằng dụng cụ, không tự bay: kẹp gắp cho hạt, mẩu, đinh, dây; thìa cho chất bột. Dụng cụ thò vào lọ, nhấc mẩu chất lên, đưa tới trên miệng ống rồi thả.
  function addSolid(id, ti, onLand, onDone) {
    stowDropper(); const b = bottles[id], T = tubes[ti], spoon = (SOLID[id] || [0, 'pebble'])[1] === 'powder';
    const a = { x: b.x, y: b.y - HB * 0.42 }, up = { x: b.x, y: b.y - HB - 1.8 * PPC }, m = { x: T.x, y: mouthY(T) - 1.0 * PPC }, bot = { x: T.x, y: floorY(T) - Math.max(0.25, T.lev(T.mL) * 0.2) * PPC }, far = { x: b.x + 2.2 * PPC, y: b.y - HB - 6.5 * PPC };
    const tl = FX.tool = { x: far.x, y: far.y, a: 0, spoon }, p = { id, x: 0, y: 0, rot: 0 }; FX.piece = null; b.busy = true;
    play([{ dur: 0.22, fn: (k) => { b.stopOn = 1 - k; } },
      { dur: 0.42, fn: (k) => { tl.a = Math.min(1, k * 2.5); tl.x = lerp(far.x, a.x, k); tl.y = lerp(far.y, a.y, k); } },
      { dur: 0.3, start() { FX.piece = p; }, fn: (k) => { tl.x = lerp(a.x, up.x, k); tl.y = lerp(a.y, up.y, k); p.x = tl.x; p.y = tl.y; } },
      { dur: 0.58, fn: (k) => { tl.x = lerp(up.x, m.x, k); tl.y = lerp(up.y, m.y, k) - Math.sin(Math.PI * k) * 1.1 * PPC; p.x = tl.x; p.y = tl.y; } },
      { dur: 0.36, lin: true, fn: (k) => { p.x = m.x; p.y = lerp(m.y, bot.y, k * k); p.rot = k * 3; tl.a = 1 - k; tl.y = m.y - k * 1.6 * PPC; } },
      { dur: 0.25, start() { FX.piece = null; FX.tool = null; if (onLand) onLand(); }, fn: (k) => { b.stopOn = k; } }], () => { b.busy = false; if (onDone) onDone(); });
  }

  // ---------- lắc, đổ bỏ, giấy quỳ, que đóm, đun ----------
  const CLEAR_RISE = TUBE_BY - rY(0) + 0.6 * PPC; // nhấc cho đáy ống ra khỏi lỗ giá
  // Ống: nhấc khỏi giá rồi lắc. Cốc: nhấc nhẹ khỏi mặt bàn, lắc tròn nhỏ (cốc rộng, lắc mạnh sẽ sánh ra ngoài).
  function shake(ti, onDone) { stowDropper(); const T = tubes[ti], P = T.pose = { x: T.x, y: T.by, rot: 0 }, rise = T.kind === 'tube' ? CLEAR_RISE : 0.6 * PPC, amp = T.kind === 'tube' ? 1 : 0.4;
    play([{ dur: 0.38, fn: (k) => { P.y = T.by - rise * k; } }, { dur: 1.1, lin: true, start() { T.resuspend(); }, fn: (k) => { const w = Math.sin(k * Math.PI * 8) * Math.sin(k * Math.PI); P.rot = w * 0.16 * amp; P.x = T.x + w * 0.5 * PPC * amp; } }, { dur: 0.38, start() { P.rot = 0; P.x = T.x; }, fn: (k) => { P.y = T.by - rise * (1 - k); } }], () => { T.pose = null; if (onDone) onDone(); }); }
  const mouthOf = (P, len = TL) => ({ x: P.x + len * Math.sin(P.rot), y: P.y - len * Math.cos(P.rot) });
  // Đổ bỏ: nhấc bình, đưa sang cốc thải, nghiêng đổ, tráng bằng bình tia, lắc, đổ nước tráng, đặt về chỗ. Cốc nhấc cao hơn miệng các ống để không quệt qua giá.
  function discard(ti, onDone) { stowDropper(); const T = tubes[ti], TL = T.len, TUBE_BY = T.by, big = T.kind !== 'tube', P = T.pose = { x: T.x, y: TUBE_BY, rot: 0 }, th = big ? -1.75 : -1.95, r1 = -0.62, kx = BEAK.x + 0.4 * PPC, ky = BEAK.y - 9.5 * PPC - 0.6 * PPC, at = { x: kx + TL * Math.sin(-th), y: ky + TL * Math.cos(th) }, up = { x: T.x, y: big ? MOUTH_Y - 1.5 * PPC : TUBE_BY - CLEAR_RISE }, rinseML = big ? 12 : 2.5;
    const had = T.mL, col = T.col, tipOut = (c, on) => { T.stream2 = on ? { x: kx, y0: ky, y1: BEAK.y - MK.floor * sK - levWaste(waste.mL) * PPC, col: c } : null; };
    const RP = { x: kx + 0.5 * PPC - TL * Math.sin(r1), y: ky - 0.2 * PPC + TL * Math.cos(r1) }; // tư thế rửa: miệng ống ngay trên miệng cốc, ống dựng chếch lên
    const pourOut = (c, amount, keep) => ({ dur: 0.85, lin: true, fn: (k) => { const q = ease(Math.min(1, k * 1.6)); P.rot = lerp(P.rot0, th, q); P.x = lerp(P.x0, at.x, q); P.y = lerp(P.y0, at.y, q); T.spill = 1 - k; tipOut(c, amount > 0.05 && k > 0.2 && k < 0.95); waste.mL = Math.min(190, waste.mL + Math.min(2, amount / 25)); }, start() { P.rot0 = P.rot; P.x0 = P.x; P.y0 = P.y; if (amount > 0.05 && !(keep && waste.mL > 0.5)) waste.col = c; } }); // nước rửa không xoá màu chất thải đã có trong cốc
    play([{ dur: 0.4, fn: (k) => { P.y = lerp(TUBE_BY, up.y, k); } },
      { dur: 0.7, fn: (k) => { P.x = lerp(up.x, at.x, k); P.y = lerp(up.y, at.y, k); P.rot = th * 0.55 * k; } },
      pourOut(col, had),
      // rửa: dựng ống lên một chút, tia nước cất vào, lắc tráng, đổ nước rửa vào cốc
      { dur: 0.45, start() { tipOut(col, false); T.reset(); T.pose = P; T.spill = 1; T.tag = (T.tag || '').split('\n')[0] + '\nđang rửa'; }, fn: (k) => { P.rot = lerp(th, r1, k); P.x = lerp(at.x, RP.x, k); P.y = lerp(at.y, RP.y, k); } },
      { dur: 0.9, lin: true, start() { FX.rinse = { a: 0 }; T.setLook({ mL: rinseML, hex: '#dcecf5', opacity: 0.3 }); }, fn: (k) => { const mo = mouthOf(P, TL); FX.rinse.a = Math.min(1, k * 4, (1 - k) * 4); FX.rinse.x = mo.x + 0.1 * PPC; FX.rinse.y = mo.y - 0.9 * PPC; FX.rinse.on = k > 0.2 && k < 0.85; } },
      { dur: 0.5, lin: true, start() { FX.rinse = null; }, fn: (k) => { P.rot = r1 + Math.sin(k * Math.PI * 4) * 0.1; } },
      pourOut('#dcecf5', rinseML, true),
      { dur: 0.6, start() { tipOut(col, false); T.reset(); T.pose = P; }, fn: (k) => { P.x = lerp(at.x, up.x, k); P.y = lerp(at.y, up.y, k); P.rot = th * (1 - k); } },
      { dur: 0.35, fn: (k) => { P.y = lerp(up.y, TUBE_BY, k); } }], () => { T.pose = null; if (onDone) onDone(); }); }
  // Nhiệt kế: thả vào ống, cột đỏ nhích lên theo mức toả nhiệt của phản ứng gần nhất (0 không đổi, 1 nhẹ, 2 mạnh). Không có số độ.
  function thermoTest(ti, level, onDone) { stowDropper(); const T = tubes[ti], top = mouthY(T) - 11.5 * PPC, bulb = floorY(T) - Math.max(0.5, T.lev(T.mL) * 0.5) * PPC, len = 13 * PPC, P = FX.thermo = { x: T.x, y: top, len, col: 0.3, a: 0 };
    play([{ dur: 0.3, fn: (k) => { P.a = k; } }, { dur: 0.7, fn: (k) => { P.y = lerp(top, bulb - len, k); } }, { dur: 1.0, fn: (k) => { P.col = 0.3 + level * 0.19 * k; } }, { dur: 0.9 }, { dur: 0.6, fn: (k) => { P.y = lerp(bulb - len, top, k); P.a = 1 - k; } }], () => { FX.thermo = null; if (onDone) onDone(); }); }
  function litmusTest(ti, hex, onDone) { stowDropper(); const T = tubes[ti], top = mouthY(T) - 1.0 * PPC, dip = floorY(T) - T.lev(T.mL) * PPC + 0.5 * PPC, P = FX.litmus = { x: T.x, y: top - 7 * PPC, len: 9.5 * PPC, wet: null, a: 0 };
    play([{ dur: 0.35, fn: (k) => { P.a = k; P.y = lerp(top - 7 * PPC, top - 2 * PPC, k); } }, { dur: 0.7, fn: (k) => { P.y = lerp(top - 2 * PPC, dip - P.len, k); } }, { dur: 0.35, start() { P.wet = css(hex); } }, { dur: 0.7, fn: (k) => { P.y = lerp(dip - P.len, top - 5.5 * PPC - P.len * 0.5, k); } }, { dur: 0.9 }],
      () => { anims.push((dt) => { P.a -= dt * 2.5; if (P.a <= 0) { if (FX.litmus === P) FX.litmus = null; return true; } return false; }); if (onDone) onDone(); }); }
  function splintTest(ti, act, onDone) { stowDropper(); const T = tubes[ti], MOUTH_Y = mouthY(T), tip = { x: T.x + 0.2 * PPC, y: MOUTH_Y - 0.25 * PPC }, far = { x: T.x + 6.5 * PPC, y: MOUTH_Y - 6 * PPC }, P = FX.splint = { x: far.x, y: far.y, flame: 1, a: 0, smoke: 0 };
    play([{ dur: 0.7, fn: (k) => { P.a = Math.min(1, k * 3); P.x = lerp(far.x, tip.x, k); P.y = lerp(far.y, tip.y, k); } },
      { dur: 0.9, lin: true, start() { if (act === 'pop') FX.pop = 1; }, fn: (k) => { if (act === 'pop') P.flame = k < 0.25 ? 1.8 - k * 5 : 0.55 + 0.45 * Math.min(1, (k - 0.25) * 2); else if (act === 'flare') P.flame = 1 + 1.3 * Math.sin(Math.min(1, k * 1.4) * Math.PI * 0.5); else if (act === 'out') { P.flame = Math.max(0, 1 - k * 3); P.smoke = Math.min(1, k * 2); } } },
      { dur: 0.6, fn: (k) => { P.x = lerp(tip.x, far.x, k); P.y = lerp(tip.y, far.y, k); P.a = 1 - k; } }], () => { FX.splint = null; if (onDone) onDone(); }); }
  // Đun: kẹp gỗ kẹp ống, nhấc khỏi giá, đưa sang ngọn lửa đèn cồn (ống nghiêng), hơ đều tay. onHot gọi lúc đang nóng để hiện tượng xảy ra ngay trên lửa.
  // Kiềng ba chân + lưới tản nhiệt (kho LAB-010): cốc, bình không cầm bằng kẹp gỗ mà đặt lên lưới trên kiềng, kiềng đứng trùm đèn cồn ở chỗ cốc thải.
  // Kiềng cao 14 cm theo tỉ lệ bàn: đèn cồn 8,2 cm + ngọn lửa khoảng 2,5 cm, đỉnh lửa cách lưới khoảng 3 cm.
  const MTR = META.tripod, TR_H = 14 * PPC, sTr = MTR ? TR_H / (MTR.bottom - MTR.top) : 1, GZ = SPOT.y - TR_H;
  const MRD = META.rod, sRod = MRD ? (20 * PPC) / (MRD.bottom - MRD.top) : 1;
  function heatVessel(ti, onHot, onDone) { stowDropper(); const T = tubes[ti], P = T.pose = { x: T.x, y: T.by, rot: 0 }, hi = Math.min(MOUTH_Y - 1.5 * PPC, GZ - 1 * PPC), up = { x: T.x, y: hi }, over = { x: SPOT.x, y: hi }, seat = { x: SPOT.x, y: GZ + 0.1 * PPC };
    const boil = (n) => () => { if (T.mL > 0.5 && Math.random() < n && T.bub.length < 40) T.bub.push({ x: (Math.random() * 2 - 1) * 0.6, y: 0.1, r: 0.04 + Math.random() * 0.04, v: 1.2 + Math.random() }); };
    play([{ dur: 0.35, fn: (k) => { FX.lamp = k; FX.tripod = k; } }, { dur: 0.45, fn: (k) => { P.y = lerp(T.by, up.y, k); } },
      { dur: 0.8, start() { FX.flame = 1; }, fn: (k) => { P.x = lerp(up.x, over.x, k); P.y = up.y - Math.sin(Math.PI * k) * 0.6 * PPC; } }, { dur: 0.5, fn: (k) => { P.y = lerp(over.y, seat.y, k); } },
      { dur: 1.6, lin: true, fn: boil(0.25) }, { dur: 1.2, lin: true, start() { if (onHot) onHot(); }, fn: boil(0.4) },
      { dur: 0.5, start() { FX.flame = 0; }, fn: (k) => { P.y = lerp(seat.y, over.y, k); } }, { dur: 0.8, fn: (k) => { P.x = lerp(over.x, up.x, k); P.y = up.y - Math.sin(Math.PI * k) * 0.6 * PPC; } },
      { dur: 0.45, fn: (k) => { P.y = lerp(up.y, T.by, k); } }, { dur: 0.3, fn: (k) => { FX.lamp = 1 - k; FX.tripod = 1 - k; } }], () => { T.pose = null; FX.lamp = 0; FX.tripod = 0; if (onDone) onDone(); }); }
  // Đũa thuỷ tinh: thò vào bình, khuấy qua lại sát đáy, khuấy tung kết tủa lên như lắc, rồi rút ra. Cốc khuấy rộng tay; bình cổ hẹp, ống: đũa gần thẳng đứng, khuấy nhẹ.
  function stir(ti, onDone) { stowDropper(); const T = tubes[ti], wide = T.kind === 'beaker', fl = floorY(T), amp = wide ? Math.min(T.half * 0.42, 1.5 * PPC) : 0.22 * PPC, rot0 = wide ? 0.22 : 0.04, tip = fl - 0.35 * PPC, far = { x: T.x + 4 * PPC, y: mouthY(T) - 9 * PPC }, R = FX.rod = { x: far.x, y: far.y, rot: rot0, a: 0 };
    play([{ dur: 0.45, fn: (k) => { R.a = Math.min(1, k * 2); R.x = lerp(far.x, T.x, k); R.y = lerp(far.y, tip, k); } },
      { dur: 1.6, lin: true, start() { T.resuspend(); }, fn: (k) => { const w = Math.sin(k * Math.PI * 6) * Math.sin(Math.min(1, k * 4) * Math.PI / 2); R.x = T.x + w * amp; R.rot = rot0 + (wide ? 0.06 : 0.02) * Math.cos(k * Math.PI * 6); } },
      { dur: 0.45, fn: (k) => { R.x = lerp(T.x, far.x, k); R.y = lerp(tip, far.y, k); R.a = 1 - k; } }], () => { FX.rod = null; if (onDone) onDone(); }); }
  function heatTube(ti, onHot, onDone) { if (tubes[ti].kind !== 'tube') { heatVessel(ti, onHot, onDone); return; } stowDropper(); const T = tubes[ti], P = T.pose = { x: T.x, y: TUBE_BY, rot: 0 }, th = 0.85, wick = SPOT.y - 8.2 * PPC, at = { x: SPOT.x - 0.1 * PPC, y: wick - 2.3 * PPC }, up = { x: T.x, y: TUBE_BY - CLEAR_RISE };
    FX.holder = { T, a: 0 };
    play([{ dur: 0.3, fn: (k) => { FX.holder.a = k; FX.lamp = k; } }, { dur: 0.4, fn: (k) => { P.y = lerp(TUBE_BY, up.y, k); } },
      { dur: 0.75, start() { FX.flame = 1; }, fn: (k) => { P.x = lerp(up.x, at.x, k); P.y = lerp(up.y, at.y, k); P.rot = th * k; } },
      { dur: 1.5, lin: true, fn: (k) => { P.x = at.x + Math.sin(k * Math.PI * 6) * 0.45 * PPC; if (T.mL > 0.2 && Math.random() < 0.3 && T.bub.length < 20) T.bub.push({ x: (Math.random() * 2 - 1) * 0.6, y: 0.1, r: 0.03 + Math.random() * 0.03, v: 1.5 + Math.random() }); } },
      { dur: 1.1, lin: true, start() { if (onHot) onHot(); }, fn: (k) => { P.x = at.x + Math.sin(k * Math.PI * 4) * 0.45 * PPC; } },
      { dur: 0.75, fn: (k) => { P.x = lerp(at.x, up.x, k); P.y = lerp(at.y, up.y, k); P.rot = th * (1 - k); } },
      { dur: 0.4, start() { FX.flame = 0; }, fn: (k) => { P.y = lerp(up.y, TUBE_BY, k); FX.holder.a = 1 - k; FX.lamp = 1 - k; } }], () => { T.pose = null; FX.holder = null; FX.lamp = 0; if (onDone) onDone(); }); }

  // ---------- khung nhìn và zoom: z = 1 là toàn bàn; cuộn chuột hoặc chụm hai ngón để phóng, kéo để dời ----------
  const HEAD = 8.2 * PPC, NEED = BASE + 4.4 * PPC - (MOUTH_Y - HEAD); // khoảng trống trên miệng ống: đủ cho lọ đang rót, ống nhỏ giọt, ống được nhấc khỏi giá
  const ZMIN = 0.5; // thu nhỏ tối đa còn 50%: thấy nhiều phòng lab hơn
  let reserve = 0, CX = VCX, lensGeo = null; // reserve = phần bề ngang bên phải nhường cho kính lúp; lensGeo = tâm và bán kính kính lúp (theo tỉ lệ khung)
  const Z = { z: 1, tz: 1, x: VCX, y: 0, tx: VCX, ty: 0 }; let VIEW = [1, 0, 0, 1, 0, 0], sc0 = 1, vh0 = H, vw0 = W, top0 = 0, curView = 'all';
  // Dải cần thấy (từ khoảng trống trên miệng ống tới hàng nhãn) luôn nằm giữa khung; khung hẹp thì cả cảnh thu nhỏ cho vừa bề ngang.
  function fit() { const r = host.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2); cv.width = Math.max(2, Math.round(r.width * d)); cv.height = Math.max(2, Math.round(r.height * d)); refit(); }
  function refit() { sc0 = Math.min((cv.width * (1 - reserve)) / NEEDW, cv.height / NEED); vw0 = cv.width / sc0; vh0 = cv.height / sc0; CX = VCX + (cv.width * reserve) / 2 / sc0; top0 = (MOUTH_Y - HEAD + BASE + 4.4 * PPC) / 2 - vh0 / 2; if (Z.tz <= 1) { Z.tx = Z.x = CX; Z.ty = Z.y = top0 + vh0 / 2; } clampView(); }
  function clampView() { Z.tz = clamp(Z.tz, ZMIN, 4); const hw = vw0 / Z.tz / 2, hh = vh0 / Z.tz / 2; Z.tx = Z.tz <= 1 ? CX : clamp(Z.tx, VX0 - 2 * PPC + Math.min(hw, NEEDW / 2), VX1 + 2 * PPC + 2 * (CX - VCX) - Math.min(hw, NEEDW / 2)); Z.ty = Z.tz <= 1 ? top0 + vh0 / 2 : clamp(Z.ty, top0 + hh, top0 + vh0 - hh); zoomLabel(); }
  const toScene = (e) => { const r = cv.getBoundingClientRect(), d = cv.width / r.width; return [((e.clientX - r.left) * d - VIEW[4]) / VIEW[0], ((e.clientY - r.top) * d - VIEW[5]) / VIEW[3]]; };
  function zoomAt(f, sx = Z.tx, sy = Z.ty) { const z1 = Math.abs(clamp(Z.tz * f, ZMIN, 4) - 1) < 0.06 ? 1 : clamp(Z.tz * f, ZMIN, 4), k = Z.tz / z1; Z.tx = sx + (Z.tx - sx) * k; Z.ty = sy + (Z.ty - sy) * k; Z.tz = z1; curView = z1 > 1.01 ? 'zoom' : 'all'; clampView(); }
  const LIFT = TL + 1.2 * PPC; let lookK = 0, lookWant = 0, idleT = 0, callouts = [];
  // Cận cảnh: ống nằm giữa phần bàn còn trống (không chui dưới vòng kính), hơi lệch trái để chừa chỗ cho nhãn. Ống có chất và bàn đang yên thì nhấc ống lên, máy quay đi theo.
  function aimTube() { const T = tubes[active]; Z.tz = 2.4; Z.tx = T.x + (CX - VCX) / Z.tz + 2.2 * PPC + (T.half - GEO.tube.half); Z.ty = T.kind !== 'tube' ? T.by - T.len * 0.5 - 1.2 * PPC : lookWant ? MOUTH_Y - 2.4 * PPC : TUBE_BY - 3.4 * PPC; clampView(); }
  function view(name, immediate = false) { curView = name; if (name === 'tube') { aimTube(); } else { Z.tz = 1; Z.tx = CX; Z.ty = top0 + vh0 / 2; } clampView(); if (immediate) { Z.z = Z.tz; Z.x = Z.tx; Z.y = Z.ty; } }
  const zbox = document.createElement('div'); zbox.className = 'lk-zoom'; zbox.innerHTML = '<button data-z="out" aria-label="Thu nhỏ" title="Thu nhỏ">−</button><button data-z="reset" title="Về toàn bàn">100%</button><button data-z="in" aria-label="Phóng to" title="Phóng to">+</button>'; host.appendChild(zbox);
  const zoomLabel = () => { const b = zbox.querySelector('[data-z="reset"]'); if (b) b.textContent = Math.round(Z.tz * 100) + '%'; };
  zbox.addEventListener('click', (e) => { const k = e.target.dataset.z; if (!k) return; e.stopPropagation(); if (k === 'reset') view('all'); else zoomAt(k === 'in' ? 1.35 : 1 / 1.35); if (viewCb) viewCb(); });
  let viewCb = null;
  cv.addEventListener('wheel', (e) => { e.preventDefault(); const [sx, sy] = toScene(e); zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.012 : 0.0022)), sx, sy); if (viewCb) viewCb(); }, { passive: false });

  // ---------- vẽ ----------
  function liquid(m, s, top, hw, hex, a) { ctx.save(); ctx.clip(inner(m, s, top)); const g = ctx.createLinearGradient(-hw, 0, hw, 0); g.addColorStop(0, rgba(hex, Math.min(0.95, a + 0.22), 0.72)); g.addColorStop(0.22, rgba(hex, a, 0.95)); g.addColorStop(0.55, rgba(hex, a * 0.86, 1.06)); g.addColorStop(0.82, rgba(hex, a, 0.92)); g.addColorStop(1, rgba(hex, Math.min(0.95, a + 0.22), 0.68)); ctx.fillStyle = g; ctx.fillRect(-hw * 1.3, top, hw * 2.6, -top + 6); ctx.restore(); }
  const surface = (y, hw, hex, a) => { ctx.save(); ctx.beginPath(); ctx.ellipse(0, y, hw, hw * 0.13, 0, 0, 6.3); ctx.fillStyle = rgba(hex, Math.min(0.9, a + 0.25), 1.12); ctx.fill(); ctx.lineWidth = Math.max(0.8, hw * 0.045); ctx.strokeStyle = rgba(hex, 0.75, 0.55); ctx.stroke(); ctx.restore(); };
  // Nghiêng dụng cụ thì mặt thoáng vẫn nằm ngang: cắt theo lòng dụng cụ rồi tô phần nằm dưới một đường ngang của màn hình.
  function tiltedFill(m, s, yTopLocal, lx, ly, hex, a) { ctx.save(); ctx.clip(inner(m, s, yTopLocal)); const t = ctx.getTransform(), sy = t.b * lx + t.d * ly + t.f; ctx.setTransform(1, 0, 0, 1, 0, 0); const g = ctx.createLinearGradient(0, sy, 0, sy + 9 * PPC * VIEW[0]); g.addColorStop(0, rgba(hex, a, 1.05)); g.addColorStop(1, rgba(hex, Math.min(0.95, a + 0.15), 0.8)); ctx.fillStyle = g; ctx.fillRect(0, sy, cv.width, cv.height); ctx.fillStyle = rgba(hex, 0.8, 0.6); ctx.fillRect(0, sy, cv.width, Math.max(1, VIEW[0] * 1.2)); ctx.restore(); }
  function piece(kind, col, r, seed = 1, coat = null) { const c = coat || col; ctx.save(); const g = ctx.createLinearGradient(-r, -r, r, r); g.addColorStop(0, rgba(c, 1, 1.25)); g.addColorStop(1, rgba(c, 1, 0.62)); ctx.fillStyle = g; ctx.strokeStyle = rgba(c, 0.9, 0.45); ctx.lineWidth = Math.max(0.6, r * 0.08); ctx.beginPath();
    if (kind === 'strip') ctx.roundRect(-r * 0.35, -r * 1.5, r * 0.7, r * 3, r * 0.12); else if (kind === 'nail') { ctx.roundRect(-r * 0.16, -r * 1.7, r * 0.32, r * 3.4, r * 0.1); ctx.rect(-r * 0.45, -r * 1.85, r * 0.9, r * 0.22); } else if (kind === 'cube') ctx.roundRect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6, r * 0.2); else if (kind === 'powder') { ctx.moveTo(-r * 1.3, r * 0.6); ctx.quadraticCurveTo(0, -r * 1.3, r * 1.3, r * 0.6); ctx.closePath(); } else { for (let k = 0; k < 7; k++) { const a = (k / 7) * 6.283, q = r * (0.78 + 0.26 * Math.sin(seed * 7 + k * 2.3)); ctx[k ? 'lineTo' : 'moveTo'](Math.cos(a) * q, Math.sin(a) * q * 0.82); } ctx.closePath(); }
    ctx.fill(); ctx.stroke(); ctx.restore(); }
  function drawTube(T) {
    const P = T.pose || { x: T.x, y: T.by, rot: 0 }, tilted = Math.abs(P.rot) > 0.03, MT = T.m, sT = T.s, TL = T.len, e = 1 - (1 - T.pop) * (1 - T.pop);
    if (T.kind !== 'tube' && !T.pose) shadow(T.x, T.by + 0.1 * PPC, T.half * 1.15, 0.62 * PPC, 0.4 * e); // cốc đứng trên mặt bàn: bóng tiếp xúc mờ như lọ
    ctx.save(); ctx.translate(P.x, P.y); ctx.rotate(P.rot); ctx.scale(e, e);
    const fl = MT.floor * sT, lv = -(fl + T.lev(T.mL * T.spill) * PPC), a = clamp(((T.op - 0.3) / 0.57) * 0.58 + 0.2, 0.2, 0.84), hw = halfAt(MT, sT, Math.min(lv, -fl - 0.8 * PPC));
    if (T.stream) { const w = 0.2 * PPC, y0 = T.stream.y0 - T.by; ctx.fillStyle = rgba(T.stream.col.hex, Math.max(0.55, T.stream.col.a), 0.95); ctx.beginPath(); ctx.roundRect(-w / 2, y0, w, Math.max(4, lv - y0), w / 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(-w * 0.28, y0, w * 0.16, Math.max(4, lv - y0)); }
    if (T.mL * T.spill > 0.02) {
      if (tilted) tiltedFill(MT, sT, -TL, 0, lv, T.col, a); else liquid(MT, sT, lv, hw, T.col, a);
      if (T.layer > 0.01) { const ly = -(fl + T.layer * PPC), lw = halfAt(MT, sT, ly); ctx.save(); ctx.clip(inner(MT, sT, ly)); ctx.fillStyle = T.lcol; ctx.fillRect(-hw * 1.3, ly, hw * 2.6, -ly + 6); const g = ctx.createLinearGradient(-lw, 0, lw, 0); g.addColorStop(0, 'rgba(0,0,0,0.28)'); g.addColorStop(0.3, 'rgba(0,0,0,0)'); g.addColorStop(0.6, 'rgba(255,255,255,0.10)'); g.addColorStop(1, 'rgba(0,0,0,0.30)'); ctx.fillStyle = g; ctx.fillRect(-hw * 1.3, ly, hw * 2.6, -ly + 6); ctx.restore(); if (!tilted) { ctx.beginPath(); ctx.ellipse(0, ly, lw, lw * 0.16, 0, 0, 6.3); ctx.fillStyle = rgba(T.lcol, 1, 1.08); ctx.fill(); } }
      ctx.save(); ctx.clip(inner(MT, sT, lv - (tilted ? 3 * PPC : 0))); for (const p of T.parts) { ctx.beginPath(); ctx.arc(p.x * hw, -(fl + p.y * PPC), p.r * PPC, 0, 6.3); ctx.fillStyle = rgba(p.col, 0.92); ctx.fill(); }
      for (const b of T.bub) { ctx.beginPath(); ctx.arc(b.x * hw, -(fl + b.y * PPC), b.r * PPC, 0, 6.3); ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fill(); ctx.lineWidth = Math.max(0.6, 0.012 * PPC); ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.stroke(); } ctx.restore();
    }
    let n = 0; for (const [id, s] of Object.entries(T.solids)) { if (s.k < 0.03) continue; const [col, kind] = SOLID[id] || ['#9aa3ab', 'pebble'], r = 0.42 * PPC * (0.35 + 0.65 * s.k); ctx.save(); ctx.translate((n++ % 2 ? 0.16 : -0.12) * PPC, -fl - (kind === 'strip' || kind === 'nail' ? r * 1.35 : r * 0.7)); ctx.rotate(kind === 'strip' || kind === 'nail' ? 0.22 : 0); piece(kind, col, r, s.seed, s.coat); ctx.restore(); }
    if (T.mL * T.spill > 0.02 && !tilted) surface(lv, hw, T.col, a);
    glass(T.key, MT, sT);
    if (T.kind === 'cylinder') { ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = `600 ${0.42 * PPC}px ${FONT}`; ctx.textBaseline = 'middle'; const hw0 = T.half * 0.42; // vạch chia vẽ bằng mã: vạch ngắn 5 mL, vạch dài + số 10 mL
      for (let v = 5; v <= T.cap; v += 5) { const y = -(MT.floor * sT + T.lev(v) * PPC), big = v % 10 === 0; ctx.lineWidth = Math.max(1, 0.035 * PPC); ctx.beginPath(); ctx.moveTo(-hw0, y); ctx.lineTo(-hw0 + (big ? 0.55 : 0.3) * PPC, y); ctx.stroke(); if (big) ctx.fillText(String(v), -hw0 + 0.65 * PPC, y); } ctx.restore(); }
    ctx.restore();
    if (T.stream2) { const q = T.stream2, w = 0.3 * PPC; ctx.fillStyle = rgba(q.col, 0.7, 0.95); ctx.beginPath(); ctx.roundRect(q.x - w / 2, q.y0, w, q.y1 - q.y0, w / 2); ctx.fill(); }
  }
  function label(b, hw, hb) { const lw = hw * 1.62, lh = hb * 0.36, ly = -hb * 0.52, t = b.id === 'pp' ? 'PP' : pretty(BY_ID[b.id].f), c = BY_ID[b.id], sub = b.id === 'H2O' ? 'nước cất' : b.id === 'H2O2' ? '3%' : c.conc ? `${String(c.conc).replace('.', ',')} M` : b.kind === 'jar' ? 'chất rắn' : 'chỉ thị';
    ctx.save(); ctx.beginPath(); ctx.roundRect(-lw / 2, ly, lw, lh, lh * 0.06); ctx.fillStyle = 'rgba(252,253,254,0.97)'; ctx.fill(); ctx.clip(); ctx.fillStyle = '#2f6fd0'; ctx.fillRect(-lw / 2, ly, lw, lh * 0.09);
    ctx.fillStyle = '#16324f'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; let fs = lh * 0.36; ctx.font = `700 ${fs}px ${FONT}`; const tw = ctx.measureText(t).width; if (tw > lw * 0.84) { fs *= (lw * 0.84) / tw; ctx.font = `700 ${fs}px ${FONT}`; } ctx.fillText(t, 0, ly + lh * 0.5); ctx.font = `500 ${lh * 0.17}px ${FONT}`; ctx.fillStyle = '#52657a'; ctx.fillText(sub, 0, ly + lh * 0.8);
    const sh = ctx.createLinearGradient(-lw / 2, 0, lw / 2, 0); sh.addColorStop(0, 'rgba(20,30,45,0.22)'); sh.addColorStop(0.2, 'rgba(20,30,45,0)'); sh.addColorStop(0.75, 'rgba(20,30,45,0)'); sh.addColorStop(1, 'rgba(20,30,45,0.26)'); ctx.fillStyle = sh; ctx.fillRect(-lw / 2, ly, lw, lh); ctx.restore(); }
  function drawBottle(b, thumb = false) {
    const e = 1 - (1 - b.pop) * (1 - b.pop), up = b.lift * 0.35 * PPC;
    if (b.kind === 'wash') { const at = !thumb && Math.hypot(b.mx - b.x, b.my - b.y) < 2; if (at) shadow(b.x, b.y + 0.1 * PPC, 3.2 * PPC, 0.6 * PPC, 0.4 * e); ring(b); wash(b.mx + WTX, b.my - up + WTY, b.rot, e, FX.rinse ? 1 - clamp(FX.rinse.a || 0, 0, 1) : 1); return; }
    const jar = b.kind === 'jar', drop = b.kind === 'drop', V = vesselOf(b), m = V.m, s = V.s, key = V.key, BH = drop ? DB_BODY : HB, L = liquidOf(b.id), c = Math.cos(b.rot), sn = Math.sin(b.rot), px = b.mx - HB * sn, py = b.my + HB * c - up, rest = Math.abs(b.rot) < 0.02 && Math.abs(b.mx - b.x) < 2;
    if (rest && !thumb) { shadow(b.x, b.y + 0.1 * PPC, 3.4 * PPC, 0.62 * PPC, 0.42 * e * (1 - b.lift * 0.3)); ring(b); }
    ctx.save(); ctx.translate(px, py); ctx.rotate(b.rot); ctx.scale(e, e); const hw = halfAt(m, s, -BH * 0.3);
    if (AMBER.has(b.id) && !V.amberImg) { ctx.save(); ctx.clip(inner(m, s, -HB)); ctx.fillStyle = 'rgba(122,74,28,0.55)'; ctx.fillRect(-hw * 1.4, -HB, hw * 2.8, HB + 4); ctx.restore(); }
    if (jar) { const [col, kind] = SOLID[b.id] || ['#9aa3ab', 'pebble']; ctx.save(); ctx.clip(inner(m, s, -HB)); const fl = m.floor * s; if (kind === 'powder') { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-hw * 1.2, -fl + 2); ctx.lineTo(-hw * 1.2, -fl - HB * 0.2); ctx.quadraticCurveTo(0, -fl - HB * 0.34, hw * 1.2, -fl - HB * 0.2); ctx.lineTo(hw * 1.2, -fl + 2); ctx.fill(); } else for (let k = 0; k < 16; k++) { ctx.save(); ctx.translate((((k * 37) % 17) / 8.5 - 1) * hw * 0.78, -fl - 0.3 * PPC - ((k * 13) % 5) * 0.34 * PPC); ctx.rotate(k * 1.3); piece(kind, col, 0.34 * PPC, k); ctx.restore(); } ctx.restore(); }
    else tiltedFill(m, s, -BH, 0, -BH * 0.74 * (b.fill / 0.62) * 0.5 + Math.abs(sn) * hw * 0.35, L.hex, AMBER.has(b.id) ? Math.min(0.5, L.a) : L.a);
    if (drop && FX.dropper && FX.dropper.id === b.id) { ctx.save(); ctx.beginPath(); ctx.rect(-4 * PPC, -DB_H * 0.77, 8 * PPC, DB_H * 0.77 + 4); ctx.clip(); glass(key, m, s); ctx.restore(); } // ống nhỏ giọt đang được rút ra: giấu phần quả bóp (trên 77% chiều cao), giữ cổ lọ
    else glass(key, m, s);
    if (!thumb) label(b, hw, BH); ctx.restore(); // ảnh nhỏ trong tủ: không dán nhãn (quá nhỏ để đọc, che mất màu dung dịch)
    if (drop) return; // lọ nhỏ giọt không có nút rời
    const sc = (jar ? 1.12 : 1) * sS, wide = jar ? 1.7 : 1, on = { x: b.x, y: b.y - HB + MS.seat * sc * (jar ? 0.9 : 1) - up }, off = jar ? { x: b.x - 1.2 * PPC, y: b.y - HB - 2.6 * PPC } : { x: b.x + 0.2 * PPC, y: b.y + 1.5 * PPC }, k = ease(b.stopOn);
    if (b.stopOn < 0.5 && !jar) shadow(off.x, off.y, 1.5 * PPC, 0.3 * PPC, 0.35 * (1 - k));
    ctx.save(); ctx.translate(lerp(off.x, on.x, k), lerp(off.y, on.y, k) - Math.sin(Math.PI * k) * 1.4 * PPC); ctx.scale(e * wide, e); glass('stopper', MS, sc); ctx.restore();
  }
  // Bình tia vẽ theo đầu vòi: (x, y) là vị trí đầu vòi, bình xoay quanh chính điểm đó.
  const WTX = MW ? (MW.tip[0] - MW.cx) * sW : 0, WTY = MW ? (MW.tip[1] - MW.bottom) * sW : 0;
  function wash(x, y, rot, e = 1, alpha = 1) { if (!MW || !IM.washbottle) return; ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(e, e); ctx.translate(-WTX, -WTY); solidImg('washbottle', MW, sW); ctx.restore(); }
  function ring(b) { if (selId !== b.id || b.busy) return; ctx.save(); ctx.beginPath(); ctx.ellipse(b.x, b.y + 0.05 * PPC, 3.0 * PPC, 0.55 * PPC, 0, 0, 6.3); ctx.lineWidth = 0.14 * PPC; ctx.strokeStyle = `rgba(${TH.accent},0.95)`; ctx.stroke(); ctx.restore(); }
  const pill = (x, y, text, bg, fg, size) => { ctx.save(); ctx.font = `700 ${size}px ${FONT}`; const w = ctx.measureText(text).width + size * 1.1, h = size * 1.7; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2); ctx.fillStyle = bg; ctx.fill(); ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + size * 0.04); ctx.restore(); };
  const TAGY = BASE + 1.3 * PPC, TS = 0.72 * PPC;
  function tag(T) { const [t1, t2] = (T.tag || '').split('\n'), on = T.i === active, x = T.x, TAGY = T.tagY; ctx.save(); const F = (w, k) => `${w} ${TS * k}px ${FONT}`; ctx.font = F(700, 1); const w = Math.max(ctx.measureText(t1 || '').width, t2 ? TS * 2.9 : 0) + TS * 0.9, h = TS * (t2 ? 2.75 : 1.7);
    if (awaiting && !seq) { ctx.beginPath(); ctx.roundRect(x - w / 2 - 2, TAGY - TS * 0.85 - 2, w + 4, h + 4, TS * 0.55); ctx.strokeStyle = `rgba(${TH.accent},${0.55 + 0.4 * Math.sin(T0 * 4)})`; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.beginPath(); ctx.roundRect(x - w / 2, TAGY - TS * 0.85, w, h, TS * 0.5); ctx.fillStyle = on ? TH.tagOn : 'rgba(16,26,42,0.82)'; ctx.fill(); if (on && TH.tagOnLine) { ctx.lineWidth = Math.max(1.5, 0.07 * PPC); ctx.strokeStyle = TH.tagOnLine; ctx.stroke(); } ctx.fillStyle = on ? TH.tagOnInk : '#f2f5f9'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t1 || '', x, TAGY + TS * 0.04); if (t2) { ctx.font = F(500, 0.8); ctx.globalAlpha = 0.85; ctx.fillText(t2, x, TAGY + TS * 1.12); } ctx.restore(); T.tagBox = [x - w / 2, TAGY - TS * 0.85, w, h]; }
  function flame(x, y, k) { if (k <= 0.02) return; const h = 2.5 * PPC * k * (1 + 0.06 * Math.sin(T0 * 23)), w = 0.6 * PPC * Math.sqrt(k); ctx.save(); ctx.translate(x, y); ctx.globalCompositeOperation = 'screen'; for (const [q, c] of [[1, 'rgba(255,150,40,0.85)'], [0.6, 'rgba(255,225,120,0.9)'], [0.3, 'rgba(120,170,255,0.75)']]) { ctx.beginPath(); ctx.moveTo(0, -h * q); ctx.bezierCurveTo(w * q * 1.1, -h * q * 0.45, w * q, 0, 0, 0.1 * PPC); ctx.bezierCurveTo(-w * q, 0, -w * q * 1.1, -h * q * 0.45, 0, -h * q); ctx.fillStyle = c; ctx.fill(); } ctx.restore(); }
  // Chùm sáng nối ống đang chọn với kính lúp: cho thấy kính đang soi đúng chỗ nào.
  function beam() { if (!lensGeo || Math.abs(Z.z - 1) > 0.03) return; const T = tubes[active]; if (T.pose) return; const lx = (lensGeo.fx * cv.width - VIEW[4]) / VIEW[0], ly = (lensGeo.fy * cv.height - VIEW[5]) / VIEW[3], lr = (lensGeo.fr * cv.width) / VIEW[0];
    const sx = T.x, sy = TUBE_BY - MT.floor * sT - Math.max(0.5, levelCm(T.mL) * 0.5) * PPC, d = Math.hypot(sx - lx, sy - ly); if (d <= lr * 1.05) return; const a = Math.atan2(sy - ly, sx - lx), b = Math.acos(lr / d), t1 = [lx + lr * Math.cos(a + b), ly + lr * Math.sin(a + b)], t2 = [lx + lr * Math.cos(a - b), ly + lr * Math.sin(a - b)];
    ctx.save(); const g = ctx.createLinearGradient(sx, sy, lx, ly); g.addColorStop(0, 'rgba(190,225,255,0.34)'); g.addColorStop(1, 'rgba(190,225,255,0.07)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(...t1); ctx.lineTo(...t2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.42)'; ctx.lineWidth = 1.4 / Math.max(0.4, VIEW[0]) * 1; ctx.beginPath(); ctx.moveTo(...t1); ctx.lineTo(sx, sy); ctx.lineTo(...t2); ctx.stroke(); ctx.beginPath(); ctx.arc(sx, sy, 0.5 * PPC, 0, 6.3); ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2.2 / Math.max(0.4, VIEW[0]); ctx.stroke(); ctx.restore(); }
  let ghost = null; const GK = ['on', 'mL', 'col', 'op', 'layer', 'lcol', 'parts', 'bub', 'solids', 'tag', 'pose', 'stream', 'stream2', 'spill'];
  const snap = () => tubes.map((T) => ({ on: T.on, mL: T.mL * T.spill, col: T.col, op: T.op, layer: T.layer, lcol: T.lcol, parts: T.parts.map((p) => ({ ...p })), bub: T.bub.map((b) => ({ ...b })), solids: JSON.parse(JSON.stringify(T.solids)), tag: T.tag }));
  function draw() { if (!ghost) { drawNow(); return; } const keep = tubes.map((T, i) => { const k = {}; for (const f of GK) k[f] = T[f]; Object.assign(T, ghost[i], { pose: null, stream: null, stream2: null, spill: 1 }); return k; }); try { drawNow(); } finally { tubes.forEach((T, i) => Object.assign(T, keep[i])); } }
  let awayBox = null;
  // Nhãn chỉ vào từng lớp trong ống đang nhấc lên: chấm trắng ở đúng lớp, đường dẫn sang phải, ô chữ nằm trên nền trống (không đè dụng cụ nào).
  function drawCallouts(T) { if (!callouts.length || lookK < 0.5) return; const P = T.pose, fl = T.m.floor * T.s, top = T.lev(T.mL) * PPC, s = 0.5 * PPC, hP = s * 2.5, gap = hP + 0.22 * PPC;
    const yOf = { gas: P.y - fl - top - 1.4 * PPC, sol: P.y - fl - Math.max(top * 0.6, T.layer * PPC + 0.45 * PPC), solid: P.y - fl - 0.75 * PPC, bottom: P.y - fl - Math.max(0.22 * PPC, T.layer * PPC * 0.5) };
    const items = callouts.map((c) => ({ ...c, ay: yOf[c.at] })).sort((p, q) => q.ay - p.ay); let prev = P.y + 0.2 * PPC + gap - hP / 2; for (const it of items) { it.py = Math.min(it.ay, prev - gap); prev = it.py; }
    ctx.save(); ctx.globalAlpha = clamp((lookK - 0.5) * 2, 0, 1); const x0 = P.x + T.half + 0.27 * PPC, x1 = P.x + T.half + 1.42 * PPC;
    for (const it of items) { const ax = P.x + (it.at === 'gas' ? 0 : T.kind === 'tube' ? 0.28 * PPC : T.half * 0.45); ctx.font = `600 ${s * 0.8}px ${FONT}`; const w1 = ctx.measureText(it.title).width; ctx.font = `700 ${s}px ${FONT}`; const w = Math.max(w1, ctx.measureText(it.text).width) + s * 1.3;
      ctx.strokeStyle = 'rgba(255,255,255,0.92)'; ctx.lineWidth = Math.max(1, 0.05 * PPC); ctx.beginPath(); ctx.moveTo(ax, it.ay); ctx.lineTo(x0, it.ay); ctx.lineTo(x1, it.py); ctx.stroke(); ctx.beginPath(); ctx.arc(ax, it.ay, 0.12 * PPC, 0, 6.3); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.beginPath(); ctx.roundRect(x1, it.py - hP / 2, w, hP, s * 0.6); ctx.fillStyle = 'rgba(16,26,42,0.9)'; ctx.fill(); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#9fc0ea'; ctx.font = `600 ${s * 0.8}px ${FONT}`; ctx.fillText(it.title, x1 + s * 0.65, it.py - s * 0.56); ctx.fillStyle = '#fff'; ctx.font = `700 ${s}px ${FONT}`; ctx.fillText(it.text, x1 + s * 0.65, it.py + s * 0.5); }
    ctx.restore(); }
  // Nền thử hai lớp. Tường: phóng chậm hơn vật (theo z^0,35) nên zoom sâu ảnh không vỡ và có chiều sâu; ảnh hẹp hơn sân khấu nên chia ba khúc,
  // khúc giữa (tường trơn + tủ thấp) kéo giãn, khúc cửa sổ bên trái và tủ hút bên phải giữ nguyên tỉ lệ. Mặt bàn: vẽ bằng mã, kéo dài vô hạn, không đường nối.
  const HOR = BASE - 7.5 * PPC; // mép xa của mặt bàn: vật đứng thấp hơn mép này 7,5 cm nên phần dung dịch luôn nằm trên nền bàn tối
  function bg2(vx, vy, vw, vh) { const q = Math.pow(Z.z, -0.65), need = Math.max(HOR - top0, (HOR - top0 + vh0 / 2) / 1.569) * 1.03, k = need / BGT.height, cx = Z.x - (Z.x - CX) * q;
    const L = BGC.L, R0 = BGC.R0, lw = L * k, rwd = (BGT.width - R0) * k, tot = Math.max(vw0 * 1.34, BGT.width * k), mid = tot - lw - rwd;
    ctx.fillStyle = '#c9cbd0'; ctx.fillRect(vx - 4, vy - 4, vw + 8, HOR - vy + 8);
    ctx.save(); ctx.translate(cx, HOR); ctx.scale(q, q); const x0 = -tot / 2, y0 = -need;
    ctx.drawImage(BGT, 0, 0, L, BGT.height, x0, y0, lw + 1, need); ctx.drawImage(BGT, L, 0, R0 - L, BGT.height, x0 + lw, y0, mid + 1, need); ctx.drawImage(BGT, R0, 0, BGT.width - R0, BGT.height, x0 + lw + mid, y0, rwd, need); ctx.restore();
    if (BGT_DIM > 0) { ctx.fillStyle = `rgba(28,32,48,${BGT_DIM})`; ctx.fillRect(vx - 4, vy - 4, vw + 8, HOR - vy + 8); }
    // Mặt bàn vẽ bằng mã: MỘT màu tối đồng nhất từ mép tường trở xuống (chủ dặn 19/11 "cho đồng màu tối hết đi"), không dải sáng tối, không vùng sáng bên trái.
    ctx.fillStyle = BGC.bench; ctx.fillRect(vx - 4, HOR, vw + 8, vy + vh - HOR + 8); }
  function drawNow() {
    const LT = lookK > 0 && !tubes[active].pose && tubes[active].on ? tubes[active] : null; if (LT) LT.pose = { x: LT.x, y: LT.by - (LT.kind === 'tube' ? ease(lookK) * LIFT : 0), rot: 0 }; // cốc không nhấc: hai bên cốc đã là nền trống
    const sc = sc0 * Z.z; VIEW = [sc, 0, 0, sc, cv.width / 2 - Z.x * sc, cv.height / 2 - Z.y * sc];
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.setTransform(...VIEW); ctx.imageSmoothingQuality = 'high';
    // Nền: giữ gần cỡ thật để còn rõ phòng lab; hai bên lấp bằng bản lật gương, phía dưới kéo dài mặt bàn. Tính theo đúng vùng đang nhìn nên thu nhỏ dưới 100% vẫn kín.
    const vw = vw0 / Z.z, vh = vh0 / Z.z, vx = Z.x - vw / 2, vy = Z.y - vh / 2, kb = Math.max(1, (BASE - Math.min(top0, vy)) / BASE) * 1.01, bw = W * kb, bh = H * kb, by = BASE - BASE * kb, bx = CX - bw / 2;
    if (BGT) bg2(vx, vy, vw, vh); else {
    for (let n = Math.floor((vx - bx) / bw); n <= Math.floor((vx + vw - bx) / bw); n++) { const x0 = bx + n * bw; if (n % 2) { ctx.save(); ctx.translate(x0 + bw + 0.5, by); ctx.scale(-1, 1); ctx.drawImage(IM.bg, 0, 0, bw + 1, bh); ctx.restore(); } else ctx.drawImage(IM.bg, x0, by, bw + 1, bh); }
    if (by + bh < vy + vh) ctx.drawImage(IM.bg, 0, H - 24, W, 22, vx - 4, by + bh - 2, vw + 8, vy + vh - (by + bh) + 6);
    }
    const rh = MR.h * sR, rx0 = rX(0), ry0 = rY(0), rest = tubes.filter((T) => T.on && !T.pose && T.kind === 'tube'), moving = tubes.filter((T) => T.on && T.pose), cups = tubes.filter((T) => T.on && !T.pose && T.kind !== 'tube');
    shadow(RXC, BASE + 0.15 * PPC, rw * 0.56, 1.0 * PPC, 0.5);
    if (MK && IM.beaker && FX.lamp < 0.98) { ctx.save(); ctx.globalAlpha = 1 - FX.lamp; shadow(BEAK.x, BEAK.y + 0.1 * PPC, 4.4 * PPC, 0.7 * PPC, 0.4); ctx.translate(BEAK.x, BEAK.y); if (waste.mL > 0.5) { const top = -(MK.floor * sK + levWaste(waste.mL) * PPC), hw = halfAt(MK, sK, top); liquid(MK, sK, top, hw, waste.col, 0.5); surface(top, hw, waste.col, 0.5); } glass('beaker', MK, sK); ctx.restore(); }
    ctx.drawImage(IM.rack, rx0, ry0, rw, rh);
    for (const T of rest) drawTube(T);
    const fy = MR.frontTop, fh = MR.plateBottom - MR.frontTop; ctx.drawImage(IM.rack, 0, fy, MR.w, fh, rx0, rY(fy), rw, fh * sR); // dải mặt trước của tấm trên vẽ đè lại: ống trông như cắm xuyên qua lỗ
    for (const T of cups) drawTube(T);
    for (const T of tubes) if (T.on) tag(T);
    beam();
    const bs = Object.values(bottles); for (const b of bs) if (!b.busy) drawBottle(b);
    if (FX.lamp > 0.01 && ML && IM.lamp) { ctx.save(); ctx.globalAlpha = FX.lamp; shadow(SPOT.x, SPOT.y + 0.1 * PPC, 4.6 * PPC, 0.7 * PPC, 0.42); ctx.translate(SPOT.x, SPOT.y); glass('lamp', ML, sL); ctx.restore(); flame(SPOT.x, SPOT.y - 8.2 * PPC, FX.flame * FX.lamp); }
    if (FX.tripod > 0.01 && MTR && IM.tripod) { ctx.save(); ctx.globalAlpha = FX.tripod; ctx.translate(SPOT.x, SPOT.y); ctx.drawImage(IM.tripod, -MTR.cx * sTr, -MTR.bottom * sTr, MTR.w * sTr, MTR.h * sTr); ctx.restore(); } // kiềng vẽ sau ngọn lửa: lưới nằm trên lửa
    for (const T of moving) { drawTube(T); if (FX.holder && FX.holder.T === T && MH && IM.holder) { const P = T.pose, g = 0.78 * TL, gx = P.x + g * Math.sin(P.rot), gy = P.y - g * Math.cos(P.rot); ctx.save(); ctx.globalAlpha = FX.holder.a; ctx.translate(gx, gy); ctx.rotate(P.rot * 0.35); ctx.drawImage(IM.holder, -MH.jaw[0] * sH, -MH.jaw[1] * sH, MH.w * sH, MH.h * sH); ctx.restore(); } }
    for (const b of bs) if (b.busy) drawBottle(b);
    if (FX.rod && MRD && IM.rod) { const r = FX.rod; ctx.save(); ctx.globalAlpha = clamp(r.a, 0, 1); ctx.translate(r.x, r.y); ctx.rotate(r.rot); glass('rod', MRD, sRod); ctx.restore(); }
    const d = FX.dropper; if (d && MD && IM.dropper) { ctx.save(); ctx.translate(d.x, d.y); if (d.fill > 0.02) { const top = -(MD.floor * sD + d.fill * 5.5 * PPC); ctx.save(); ctx.clip(inner(MD, sD, top)); ctx.fillStyle = rgba(d.col.hex, Math.max(0.5, d.col.a)); ctx.fillRect(-PPC, top, 2 * PPC, -top + 4); ctx.restore(); } ctx.scale(1 - d.squeeze * 0.06, 1); glass(IM.dropperRed ? 'dropperRed' : 'dropper', MD, sD); ctx.restore(); }
    for (const q of FX.drops) { ctx.beginPath(); ctx.ellipse(q.x, q.y, 0.1 * PPC, 0.14 * PPC, 0, 0, 6.3); ctx.fillStyle = rgba(q.col.hex, Math.max(0.7, q.col.a)); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.02 * PPC; ctx.stroke(); }
    if (FX.piece) { const p = FX.piece, [col, kind] = SOLID[p.id] || ['#9aa3ab', 'pebble']; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); piece(kind, col, 0.42 * PPC, 2); ctx.restore(); }
    if (FX.tool) { const t = FX.tool; ctx.save(); ctx.globalAlpha = clamp(t.a, 0, 1); ctx.translate(t.x, t.y); ctx.rotate(0.42); ctx.lineCap = 'round';
      const tk = t.spoon ? 'spoon' : 'tongs', TM = META[tk];
      if (TM && IM[tk]) { const ts = ((t.spoon ? 16 : 13) * PPC) / (TM.bottom - TM.top); ctx.drawImage(IM[tk], -TM.cx * ts, -TM.bottom * ts, TM.w * ts, TM.h * ts); } // ảnh inox (LAB-011): đáy ảnh = lòng thìa / mũi kẹp
      ctx.restore(); }
    if (FX.rinse && FX.rinse.x != null) { const r = FX.rinse; if (r.on) { ctx.fillStyle = 'rgba(205,232,250,0.85)'; ctx.fillRect(r.x - 0.07 * PPC, r.y, 0.14 * PPC, 1.1 * PPC); } wash(r.x, r.y, -1.3, 1, clamp(r.a, 0, 1)); }
    const tm = FX.thermo, MTH = META.thermometer; if (tm) { const w = 0.46 * PPC, yb = tm.y + tm.len; ctx.save(); ctx.globalAlpha = clamp(tm.a, 0, 1);
      if (MTH && IM.thermometer) { const ts = tm.len / (MTH.bottom - MTH.top); ctx.save(); ctx.translate(tm.x, yb); glass('thermometer', MTH, ts); ctx.restore(); ctx.fillStyle = '#d93a3a'; ctx.fillRect(tm.x - 0.06 * PPC, yb - tm.len * tm.col, 0.12 * PPC, tm.len * tm.col - 0.9 * PPC); } // ảnh nhiệt kế (bầu đỏ); cột đỏ vẽ mã vì thay đổi theo nhiệt
      else { ctx.fillStyle = 'rgba(236,244,252,0.5)'; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 0.05 * PPC; ctx.beginPath(); ctx.roundRect(tm.x - w / 2, tm.y, w, tm.len, w / 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d93a3a'; ctx.fillRect(tm.x - w * 0.16, yb - tm.len * tm.col, w * 0.32, tm.len * tm.col - w * 0.3); ctx.beginPath(); ctx.arc(tm.x, yb - w * 0.42, w * 0.42, 0, 6.3); ctx.fill(); }
      ctx.strokeStyle = 'rgba(20,34,58,0.55)'; ctx.lineWidth = 0.03 * PPC; for (let k = 2; k < 12; k++) { const y = yb - tm.len * (k / 13); ctx.beginPath(); ctx.moveTo(tm.x + w * 0.1, y); ctx.lineTo(tm.x + w * (k % 2 ? 0.3 : 0.42), y); ctx.stroke(); } ctx.restore(); }
    const lt = FX.litmus, MLT = META.litmus; if (lt) { let w = 0.62 * PPC; ctx.save(); ctx.globalAlpha = clamp(lt.a, 0, 1);
      if (MLT && IM.litmus) { const ls = lt.len / (MLT.bottom - MLT.top); w = (MLT.right - MLT.left) * ls; ctx.drawImage(IM.litmus, lt.x - MLT.cx * ls, lt.y - MLT.top * ls, MLT.w * ls, MLT.h * ls); if (lt.wet) { ctx.globalAlpha *= 0.82; ctx.fillStyle = lt.wet; ctx.fillRect(lt.x - w / 2, lt.y + lt.len - 2.2 * PPC, w, 2.2 * PPC); } } // ảnh dải giấy quỳ; phần ướt đổi màu vẽ mã
      else { ctx.fillStyle = '#8a76bd'; ctx.fillRect(lt.x - w / 2, lt.y, w, lt.len); if (lt.wet) { ctx.fillStyle = lt.wet; ctx.fillRect(lt.x - w / 2, lt.y + lt.len - 2.2 * PPC, w, 2.2 * PPC); } ctx.strokeStyle = 'rgba(40,30,70,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(lt.x - w / 2, lt.y, w, lt.len); } ctx.restore(); }
    const sp = FX.splint; if (sp) { ctx.save(); ctx.globalAlpha = clamp(sp.a, 0, 1); ctx.translate(sp.x, sp.y); ctx.save(); ctx.rotate(-0.72); const MSP = META.splint; if (MSP && IM.splint) { const ss = (15 * PPC) / (MSP.right - MSP.left); ctx.drawImage(IM.splint, -MSP.left * ss, -MSP.midY * ss, MSP.w * ss, MSP.h * ss); } else { ctx.fillStyle = '#c9a26b'; ctx.fillRect(0, -0.22 * PPC, 15 * PPC, 0.44 * PPC); ctx.fillStyle = '#2a1c10'; ctx.fillRect(0, -0.22 * PPC, 1.3 * PPC, 0.44 * PPC); } ctx.restore(); /* ảnh que đóm gỗ thông, đầu cháy ở gốc toạ độ (chỗ ngọn lửa) */ if (sp.smoke > 0) { ctx.strokeStyle = `rgba(200,205,212,${0.5 * sp.smoke})`; ctx.lineWidth = 0.18 * PPC; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(0.6 * PPC, -1 * PPC, -0.6 * PPC, -2 * PPC, 0.3 * PPC, -3.2 * PPC * sp.smoke); ctx.stroke(); } ctx.restore(); ctx.save(); ctx.globalAlpha = clamp(sp.a, 0, 1); flame(sp.x, sp.y, 1.05 * sp.flame); ctx.restore(); }
    if (FX.pop > 0.02) { const T = tubes[active], MOUTH_Y = mouthY(T); ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(T.x, MOUTH_Y, 0, T.x, MOUTH_Y, 3 * PPC); g.addColorStop(0, `rgba(255,240,200,${FX.pop})`); g.addColorStop(1, 'rgba(255,200,120,0)'); ctx.fillStyle = g; ctx.fillRect(T.x - 3 * PPC, MOUTH_Y - 3 * PPC, 6 * PPC, 6 * PPC); ctx.restore(); }
    if (flash.text && !seq && tubes[flash.i].on) pill(tubes[flash.i].x, tubes[flash.i].tagY + TS * 3.15, flash.text, flash.calm ? 'rgba(16,26,42,0.85)' : 'rgba(10,122,75,0.95)', '#fff', 0.7 * PPC);
    const sb = selId && bottles[selId]; pill(BEAK.x, BEAK.y + 1.3 * PPC, FX.lamp > 0.5 ? 'Đèn cồn' : 'Cốc thải', 'rgba(16,26,42,0.78)', '#eef3f9', 0.66 * PPC); // cốc hứng chất đổ bỏ và nước tráng ống; lúc đun thì đèn cồn hiện ở chỗ này
    if (LT) { drawCallouts(LT); LT.pose = null; }
    awayBox = null; if (sb && !sb.busy && selText && sb.stopOn > 0.95) { pill(sb.x, sb.y + 1.3 * PPC, selText, TH.chip, '#fff', 0.66 * PPC); const s = 0.58 * PPC, y = sb.y + 2.6 * PPC, txt = '✕ Cất vào tủ'; ctx.save(); ctx.font = `700 ${s}px ${FONT}`; const w = ctx.measureText(txt).width + s * 1.1; ctx.restore(); pill(sb.x, y, txt, 'rgba(16,26,42,0.86)', '#f2f5f9', s); awayBox = [sb.x - w / 2, y - s * 0.85, w, s * 1.7, sb.id]; }
  }

  // ---------- ảnh nhỏ cho tủ (chủ 20/11 chọn "B + D") ----------
  // B: dụng cụ vẽ trên ô cùng tông mặt bàn (sáng hơn một chút để đồ sơn đen vẫn thấy), kính trộn hard-light đúng như trên bàn.
  // D: hoá chất = đúng cái lọ sẽ đứng trên bàn (dung dịch có màu, lọ nâu, lọ rộng miệng có mẩu chất, lọ nhỏ giọt), vẽ bằng chính drawBottle, không nhãn.
  const TILE = 'rgb(86,88,94)', OPAQUE = new Set(['holder', 'washbottle', 'rack', 'dish', 'stand', 'clamp', 'ring', 'tripod', 'spoon', 'tongs', 'splint', 'litmus', 'filterpaper', 'rubbertube', 'mortar']), thumbCache = new Map();
  function thumb(spec, px = 40) {
    if (spec.chem && BY_ID[spec.chem] && kindOf(spec.chem) === 'wash') spec = { img: 'washbottle' }; // nước cất: ảnh bình tia
    const key = JSON.stringify(spec) + '|' + px; if (thumbCache.has(key)) return thumbCache.get(key);
    const d = 2, c = document.createElement('canvas'); c.width = c.height = px * d; const t = c.getContext('2d'); t.fillStyle = TILE; t.fillRect(0, 0, c.width, c.height);
    const keep = ctx; ctx = t; ctx.imageSmoothingQuality = 'high';
    try {
      if (spec.img) { const m = META[spec.img], im = IM[spec.img]; if (m && im) { const sc = Math.min((c.width * 0.84) / m.w, (c.height * 0.84) / m.h); ctx.save(); ctx.translate((c.width - m.w * sc) / 2, (c.height - m.h * sc) / 2); ctx.scale(sc, sc);
        if (!OPAQUE.has(spec.img)) ctx.globalCompositeOperation = 'hard-light'; ctx.drawImage(im, 0, 0); ctx.restore(); } }
      else if (spec.chem && BY_ID[spec.chem]) { const kind = kindOf(spec.chem), hgt = kind === 'drop' ? DB_H : kind === 'wash' ? 17 * PPC : HB * 1.18, sc = (c.height * 0.86) / hgt, b = { id: spec.chem, kind, x: 0, y: 0, mx: kind === 'wash' ? -WTX + 0.6 * PPC : 0, my: kind === 'wash' ? -WTY - 17 * PPC * 0.5 : -HB, rot: 0, fill: 0.62, stopOn: 1, lift: 0, pop: 1, busy: false };
        ctx.save(); ctx.translate(c.width / 2, c.height * 0.93); ctx.scale(sc, sc); const sel = selId; selId = null; try { drawBottle(b, true); } finally { selId = sel; } ctx.restore(); }
    } finally { ctx = keep; }
    const url = c.toDataURL('image/png'); thumbCache.set(key, url); return url; }

  // ---------- chuột, chạm ----------
  const hit = (x, y) => { if (awayBox && x >= awayBox[0] && x <= awayBox[0] + awayBox[2] && y >= awayBox[1] && y <= awayBox[1] + awayBox[3]) return 'away:' + awayBox[4]; for (const T of tubes) if (T.on && T.tagBox && x >= T.tagBox[0] && x <= T.tagBox[0] + T.tagBox[2] && y >= T.tagBox[1] && y <= T.tagBox[1] + T.tagBox[3]) return 'tubetag:' + T.i;
    for (const b of Object.values(bottles)) if (Math.abs(x - b.x) < 3 * PPC && y > b.y - HB - 3 * PPC && y < b.y + 0.6 * PPC) return 'chem:' + b.id;
    for (const T of tubes) if (T.on && Math.abs(x - T.x) < Math.max(1.5 * PPC, T.half) && y > mouthY(T) - PPC && y < (T.kind === 'tube' ? BASE : T.by) + 0.6 * PPC) return 'tube:' + T.i; return null; };
  let drag = null; const ptr = new Map();
  cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); ptr.set(e.pointerId, [e.clientX, e.clientY]); drag = { x: e.clientX, y: e.clientY, moved: false, d0: ptr.size === 2 ? pinch() : 0 }; });
  const pinch = () => { const [a, b] = [...ptr.values()]; return Math.hypot(a[0] - b[0], a[1] - b[1]); };
  cv.addEventListener('pointermove', (e) => { if (ptr.has(e.pointerId)) ptr.set(e.pointerId, [e.clientX, e.clientY]);
    if (drag && ptr.size === 2) { const d = pinch(); if (drag.d0 > 0) zoomAt(d / drag.d0); drag.d0 = d; drag.moved = true; return; }
    if (drag && ptr.size === 1) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (!drag.moved && Math.hypot(dx, dy) > 5) drag.moved = true; if (drag.moved && Z.tz > 1.01) { const k = (cv.width / cv.getBoundingClientRect().width) / (sc0 * Z.tz); Z.tx -= dx * k; Z.ty -= dy * k; clampView(); Z.x = Z.tx; Z.y = Z.ty; } if (drag.moved) { drag.x = e.clientX; drag.y = e.clientY; } return; }
    const h = hit(...toScene(e)); if (h !== hover) { hover = h; cv.style.cursor = h ? 'pointer' : Z.tz > 1.01 ? 'grab' : 'default'; if (hoverCb) hoverCb(h); } });
  const up = (e) => { const was = drag; ptr.delete(e.pointerId); if (ptr.size === 0) drag = null; if (was && !was.moved && e.type === 'pointerup') { const h = hit(...toScene(e)); if (h && pickCb) pickCb(h); } };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  new ResizeObserver(fit).observe(host); fit();
  let prev = performance.now(); const frame = (now) => { advance(Math.min(0.25, (now - prev) / 1000)); prev = now; requestAnimationFrame(frame); }; requestAnimationFrame(frame);

  return { flat: true, twoPhaseHeat: true, maxBottles: SLOTS.length, stage: { advance, canvas: cv }, tubes, bottles, bringOut, putAway, snap, ghost(s) { ghost = s || null; }, setCallouts(list) { callouts = list || []; }, has: (id) => !!bottles[id], onBench: () => Object.keys(bottles),
    aspect: () => (VXB - VX0) / NEED, // bề ngang : bề cao của vùng bàn cần thấy lúc chưa thêm lọ thứ 5 hay bình ngoài giá
    setReserve(f) { reserve = clamp(f, 0, 0.7); fit(); }, setLens(g) { lensGeo = g; },
    view, currentView: () => (curView === 'tube' ? 'tube' : 'all'), zoom: () => Z.tz, zoomAt, onView: (cb) => { viewCb = cb; }, setSide() {}, setInset() {}, flashInset() {},
    setActive(i) { active = i; if (curView === 'tube') view('tube'); }, setSelected(id, text) { selId = id; selText = text || ''; }, setAwait(on) { awaiting = on; },
    setTubeTag(i, text) { tubes[i].tag = text; },
    // Cốc: đặt lên bàn / cất về tủ (chỉ cất khi cốc trống và không có động tác nào đang chạy)
    place(i) { const T = tubes[i]; if (!T || T.on) return false; const used = new Set(tubes.filter((v) => v.on && v.kind !== 'tube').map((v) => v.slot)), k = VSLOT.findIndex((x, j) => !used.has(j)); if (k < 0) return false; T.reset(); T.slot = k; T.x = VSLOT[k]; T.on = true; T.pop = 0; return true; },
    thumb, slotsFree: () => VSLOT.length - tubes.filter((v) => v.on && v.kind !== 'tube').length, assetOf: (k) => (IM[k] ? IM[k].src : null),
    stow(i) { const T = tubes[i]; if (!T || !T.on || T.kind === 'tube' || seq || T.mLto > 0.001) return false; T.on = false; T.reset(); T.tag = ''; if (active === i) active = 0; return true; }, setFlash(i, text, calm) { if (text) { flash.i = i; flash.text = text; flash.calm = !!calm; flash.hold = 2.8; flash.clear = false; } else flash.clear = true; },
    pour, stopPour, arm, dropOne, disarm, stir, armed: () => (FX.dropper && FX.dropper.armed ? { id: FX.dropper.id, ti: FX.dropper.ti } : null), addSolid, shake, discard, litmusTest, splintTest, heatTube, thermoTest,
    busy: () => !!seq, onPick(cb) { pickCb = cb; }, onHover(cb) { hoverCb = cb; }, hovered: () => hover,
    shot: async (name) => { draw(); const res = await fetch('/__shot?name=' + name, { method: 'POST', body: await (await fetch(cv.toDataURL('image/jpeg', 0.93))).blob() }); return `${name}: ${res.status} ${cv.width}x${cv.height}`; } };
}
