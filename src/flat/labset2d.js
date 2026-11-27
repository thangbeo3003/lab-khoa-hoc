// BỘ MÁY 2D của bài học (25/11, chủ: "Duyệt, dựng đi"; 26/11 mở rộng cho cả bài "Nhóm halogen"): dựng các bàn của giáo án lên canvas 2D bằng kho ảnh
// assets/flat của trang Thực hành, cấp cho giáo án ĐÚNG bảng lệnh B như bộ máy 3D (kit/labset.js, đầu tệp), nên cùng một tệp giao_an.js chạy được ở cả hai mode.
//   B.tag · B.clock · B.read · B.gas · B.vessel[id].tint / solid / bubbles / look · B.switch · B.fizz · B.haze · B.flow · B.meter · B.screen · B.say · B.data
//   B.level, B.st, B.run, B.solo, B.opts (chỉ đọc)
// Đối tượng trả về có cùng tên hàm, cùng sự kiện, cùng ý nghĩa với createLab của 3D (act, rinse, reset, preset, setup, solo, setWant, enable, proc, update, on,
// hand, setActive, view, snapshot…), nên lesson.js dùng thay được. Thứ chỉ có nghĩa ở 3D (máy quay, xoay, thanh zoom) là hàm rỗng hoặc giá trị giả cùng tên
// (lab.stage là một "sân khấu giả": onFrame, setInsets, resetView, camera.position…).
// XEM CẢ PHÒNG (setActive(null)): các bàn hiện thành ô thu nhỏ cạnh nhau, bấm một ô thì vào bàn đó (sự kiện 'pick' như 3D).
//
// VỊ TRÍ: toạ độ ngang at[0] của món chỉ dùng làm THỨ TỰ trái → phải; bề ngang thật của từng ảnh quyết định khoảng cách, nên không món nào đè món nào.
// Các món cùng at[0]: món cùng chiều sâu (hoặc khai độ cao, at có 3 số) đứng chồng tại một chỗ (bình trên giấy, ống trên giá, phễu trên bình cầu);
// món khác chiều sâu đứng cạnh bên phải. at[1] (chiều sâu) chỉ để xếp lớp trước sau. Ống nghiệm đứng trên giá thì vào đúng lỗ giá (tính từ at[0]).
// Tủ hút (hood) là phông nền: phủ mọi món của bàn trừ đồng hồ khí độc; món nằm trên sàn tủ. Bộ đo khí (gasrig) gắn vào bình cùng chỗ.
// BỐ CỤC THEO VAI TRÒ (27/11, DEFINE_SAP_XEP_BAN.md mục 7): bàn khai bo_cuc (cùng bảng bàn 3D đọc, kit/bo_cuc_ban.js) thì bỏ thứ tự at[0] cho các món có tên trong bảng:
// khay lọ mẫu (ngoài cùng trái) → khay lọ thuốc thử → đế ống (giá xám rack_grey nếu kho có) có bảng tên dưới từng ống → các món còn lại theo at[0] (cốc thải, bình tia, chậu…).
// Muốn chỉnh riêng cho 2D thì khai ở bàn: mode2d = { x: { idMón: cm }, gap: cm } (không bắt buộc).
// Đơn vị cảnh: cm thật; mặt bàn ở y = 0, y âm là đi lên.
// LUẬT THAO TÁC 26/11 (LUAT_THAO_TAC.md, cùng nghĩa với khối luật đầu kit/labset.js): vessel.mL(x) theo thể tích thật (ống 15 mL ở mức đầy hình);
// lọ 'dropper' khai opts.pip có ống hút rời (lọ đứng yên, ống hút thẳng đứng tới trên miệng ống, từng giọt, bộ đếm, trả về đúng lọ), opts.clear = lọ trong;
// rinse.waste = cốc thải (Làm lại: đổ vào cốc thải → vòi nước chảy, hứng đổ 2 lần → bình tia tráng nước cất → về giá); bàn khai closeup = cận cảnh tự phóng
// tới cụm đang dùng (cả màn hẹp), xong thì lùi ra.
import { cachXep, xepBan2d } from '../kit/bo_cuc_ban.js';
import { FLAT_META as META, FLAT_IMG as IM, drawFlatImg, flatInner, drawFlatLiquid, drawFlatPiece, flatRgba as rgba, FLAT_FONT as FONT, FLAT_SOLID, PPT_HEX, isGlassImg } from './bench2d.js';

// ---------- BẢNG ÁNH XẠ kind của giáo án → ảnh trong assets/flat ----------
// img: khoá trong meta.json. h hoặc w: chiều cao hoặc bề ngang thật (cm). r: chạm được (như CABINET[kind].r của 3D). vessel: món chứa phản ứng.
// lcd: ô màn hình số trên ảnh (tỉ lệ x0, y0, x1, y1), số do mã vẽ. Món chưa có ảnh: box = [rộng, cao] cm, vẽ khung chữ nhật có tên.
export const KIND2D = {
  flask: { img: 'erlenmeyer', h: 14, r: true, vessel: true, lmax: 0.42 },
  tube: { img: 'tube', h: 16, r: true, vessel: true, lmax: 0.3, ml: 15 }, // ml: thể tích ở mức đầy hình (như CABINET.tube.ml của 3D), dùng cho vessel.mL(x)
  bottle: { img: 'bottle', h: 12.5, r: true, label: true },
  jar: { img: 'jar', h: 11, r: true, label: true },
  dropper: { img: 'dropbottle_amber', h: 9, r: true, label: true }, // lọ nhỏ giọt: lọ nâu như bản 3D
  dish: { img: 'dish', w: 9, r: true },
  spatula: { img: 'spoon', h: 15, r: true },
  lamp: { img: 'lamp', h: 8.2, r: true },
  hotplate: { img: 'hotplate', w: 20, r: true },
  timer: { img: 'stopwatch', h: 7.5, r: true, lcd: [0.17, 0.315, 0.83, 0.57] },
  wash: { img: 'washbottle', h: 15, r: true },
  cylinder: { img: 'cylinder', h: 17, r: true },
  balance: { img: 'balance', w: 22, r: true, lcd: [0.285, 0.49, 0.71, 0.75], pan: 0.17 },
  gasrig: { img: 'gas_syringe', w: 22 },
  thermo: { img: 'thermometer', h: 18 },
  rack: { img: 'rack', w: 24 },
  clamp: { img: 'clamp', w: 12 },
  sink: { img: 'sink', w: 22, r: true, name: 'Vòi nước' },
  // bài Nhóm halogen (26/11)
  hood: { img: 'hood', r: true, backdrop: true, name: 'Tủ hút' },
  stand: { img: 'stand', h: 40 },
  sideflask: { img: 'distill_flask', h: 24, r: true },
  dropfunnel: { img: 'dropping_funnel', h: 20, r: true },
  gaswash: { img: 'gas_wash_bottle', h: 18, r: true },
  beaker: { img: 'beaker', h: 10, r: true },
  shelf: { box: [27, 6], shelf: true, name: 'Kệ xếp hạng', labels: ['mạnh nhất', 'giữa', 'yếu nhất'] }, // kệ 3 ô vẽ bằng mã, sáng lime khi xếp đúng (B.switch)
  gasmeter: { img: 'meter', h: 13 },
  redoxtv: { box: [64, 40], tv: true, name: 'Tivi' },
  xpaper: { box: [9, 0.25], name: 'Giấy chữ X' },
  lens: { box: [20, 14], name: 'Mô hình hạt' },
  tv: { box: [30, 18], name: 'Tivi mô hình hạt' },
};
// Vùng trên ảnh (tỉ lệ rộng, cao của ảnh) mà mã vẽ thêm lên: lòng tủ hút, sàn tủ, đèn quạt · mặt đồng hồ khí độc · ống nhánh, ống vào ra · vòi nước
const HOOD = { x0: 0.07, x1: 0.93, y0: 0.22, floor: 0.875, lamp: [0.955, 0.335], duct: [0.5, 0.03] };
const DIAL = { x0: 0.1, x1: 0.9, y0: 0.07, y1: 0.76, c: [0.5, 0.64], r: 0.3 };
const PORT = { sideflask: { out: [1333, 603] }, gaswash: { in: [19, 130], out: [923, 130] } }; // điểm ảnh gốc
const SPOUT = [0.36, 0.3]; // miệng vòi nước trên ảnh sink
// Ống hút của lọ (opts.pip), đo trên ảnh lọ nhỏ giọt (điểm ảnh gốc): bóp cao su ở hàng 0 tới cut; vành cổ lọ hàng [collar0, collar1), chỗ chân bóp ngồi trong vành
// cột [seat0, seat1); thân ống hút thuỷ tinh cột [stem0, stem1) từ cổ lọ tới đầu ống hút ở hàng tip. Ống hút rút ra thì lọ vẽ không có bóp, chỗ thân ống hút
// được phủ bằng một dải thuỷ tinh ngay cạnh (cột strip ở vành, cột fill ở thân lọ) kéo giãn; ống hút vẽ riêng: bóp lấy từ ảnh, thân thuỷ tinh bằng mã.
const PIPG = {
  dropbottle: { cut: 393, collar: [393, 458], seat: [150, 316], strip: [100, 124], stem: [186, 278], fill: [160, 184], tip: 1386 },
  dropbottle_amber: { cut: 386, collar: [386, 458], seat: [150, 320], strip: [100, 124], stem: [194, 276], fill: [168, 192], tip: 1384 },
};
// Thời điểm từng giọt rời đầu ống hút (giây), như dropTimes của 3D: 5 giọt đầu cách nhau 0,28 s (đủ đếm), sau nhanh dần; các giọt sau giọt 6 gói trong 1 s
function dropTimes(n) {
  const T = []; let t = 0;
  for (let i = 0; i < n; i++) { T.push(t); t += i < 4 ? 0.28 : Math.max(0.04, 0.28 * Math.pow(0.8, i - 3)); }
  if (n > 6 && T[n - 1] - T[5] > 1) { const t5 = T[5], sc = 1 / (T[n - 1] - t5); for (let i = 6; i < n; i++) T[i] = t5 + (T[i] - t5) * sc; }
  return T;
}
const fmtMl = (x) => (Math.abs(x - Math.round(x)) < 0.05 ? String(Math.round(x)) : x.toFixed(1).replace('.', ','));
const MISSING = Object.entries(KIND2D).filter(([, K]) => !K.img || !IM[K.img]).map(([k]) => k); // kind chưa có ảnh: vẽ khung chữ nhật

// Xi-lanh đo khí (gas_syringe.webp, 2070 × 435, đo 25/11): vòi ở cột 254, mặt trong đầu xi-lanh (0 mL) cột 326, đầu pit-tông khi đầy 100 mL ở cột 1544,
// đầu pit-tông [1544, 1603), vành [1603, 1628), tay kéo [1967, 2070); trục ở hàng 215.
const SYR = { tip: 254, zero: 326, full: 1544, head: [1544, 1603], flange: [1603, 1628], handle: [1967, 2070], axis: 215, fill: [1465, 1503], rodFill: [1640, 1665] };
// Cán trong ảnh ngắn hơn thân, nên ở 0 mL tay kéo sẽ nằm lọt trong thân. Như xi-lanh thật, cán vẽ dài ROD (điểm ảnh gốc, từ mặt đầu pit-tông tới tay kéo):
// ở 0 mL tay kéo vừa ra khỏi vành, ở 100 mL tay kéo chìa xa ra ngoài. ROD_MAX: mép xa nhất của tay kéo khi đầy.
const ROD = 1340, ROD_MAX = SYR.full + ROD + (SYR.handle[1] - SYR.handle[0]);
const WATER = '#dcecf5', STREAM = '#a9cbe6', RUBBER = '#2e2f33', STONE = '#8d8676', LCD = '#dfe8dc', INK = '#14181c', GLASSTUBE = 'rgba(210,222,232,0.95)';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, k) => a + (b - a) * k;
const ease = (k) => k * k * (3 - 2 * k), lin = (k) => k;
const hex = (c) => (typeof c === 'string' ? c : '#' + (c >>> 0).toString(16).padStart(6, '0'));
const mix = (a, b, k) => { const p = (h) => [1, 3, 5].map((i) => parseInt(hex(h).slice(i, i + 2), 16)), x = p(a), y = p(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * clamp(k, 0, 1)).toString(16).padStart(2, '0')).join(''); };
const fmt = (x, d = 1) => Number(x).toFixed(d).replace('.', ',');
// Màu kết tủa theo tên màu kho trả về (bench2d PPT_HEX); tên chưa có trong bảng thì đoán theo từ chính
const pptHex = (name) => hex(PPT_HEX[name] ?? (/đen/.test(name) ? 0x2c2c33 : /nâu/.test(name) ? 0x7a3a22 : /vàng/.test(name) ? 0xf0cf3a : /xanh/.test(name) ? 0x2b86e0 : 0xeeeeee));

// Chuỗi động tác chạy theo thời gian (như makeSeq của 3D). flush(): làm xong ngay phần còn lại.
function makeSeq() {
  let q = null;
  const api = {
    play(steps, onDone) { q = { steps, i: 0, t: 0, onDone }; if (steps[0].start) steps[0].start(); },
    tick(dt) {
      while (q) {
        const st = q.steps[q.i]; q.t += dt;
        const k = Math.min(1, q.t / st.dur); if (st.fn) st.fn((st.ease || ease)(k));
        if (k < 1) break;
        dt = q.t - st.dur; q.i++; q.t = 0;
        if (q.i >= q.steps.length) { const d = q.onDone; q = null; if (d) d(); break; }
        if (q.steps[q.i].start) q.steps[q.i].start();
      }
    },
    flush() { let n = 0; while (q && n++ < 80) api.tick(1e3); },
    busy: () => !!q,
  };
  return api;
}

// host: phần tử chứa canvas. decl: lab của giáo án. opts.bench: chỉ dựng MỘT bàn (trang thử); không có thì dựng cả bài (mọi bàn + xem cả phòng).
// opts.loop = false: không tự chạy vòng vẽ (gọi update / draw tay).
export function createLab2d(host, decl, opts = {}) {
  const ONE = opts.bench ? (decl.benches || []).find((b) => b.id === opts.bench) : null;
  if (opts.bench && !ONE) throw new Error('labset2d: giáo án không có bàn ' + opts.bench);
  const decls = ONE ? [ONE] : decl.benches || [];
  const cv = document.createElement('canvas'); cv.className = 'lk2d-canvas'; cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:manipulation'; host.appendChild(cv);
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  const ctx = cv.getContext('2d');
  const cb = {}, benches = {}, list = [];
  let active = ONE ? ONE.id : null, names = true, hands = true, handsMsg = '', T0 = 0;
  const say = (t) => { if (cb.say) cb.say(t); }, say0 = say;
  const emit = (B) => { if (B.d.chem && B.d.chem.show) B.d.chem.show(B); if (cb.change) cb.change(B.id); };
  // Sân khấu giả: cùng tên với stage của 3D để lesson.js và shell/labui.js không phải rẽ nhánh
  const frameCbs = [];
  const stage = {
    mobile: matchMedia('(max-width:820px)').matches, insets: null, controls: null,
    camera: { position: { clone() { return this; }, distanceTo() { return 0; }, copy() { return this; } } },
    onFrame(f) { frameCbs.push(f); }, setMoveHandler() {}, setHoverHandler() {}, setPickHandler() {}, setInsets(v) { stage.insets = v; },
    resetView() { api.view(active || 'all'); }, focus() {}, renderOnce() { draw(); }, setTag() {}, addTag() { return document.createElement('span'); },
  };

  // ---------- Dựng món ----------
  function sizeOf(it) {
    const K = it.K, o = it.spec.opts || {}, key = K.img === 'bottle' && o.amber ? 'bottle_amber' : it.kind === 'dropper' && o.clear ? 'dropbottle' : K.img === 'rack' && it.B.d.bo_cuc && META.rack_grey && IM.rack_grey ? 'rack_grey' : K.img, m = key && META[key];
    if (m && IM[key]) {
      const ch = m.bottom - (m.top || 0), cw = 'left' in m ? m.right - m.left : m.w, hcm = it.kind === 'stand' && o.h ? o.h * 12 : it.kind === 'beaker' && o.h ? o.h * 13 : K.h, wcm = it.kind === 'sink' && o.w ? o.w * 13 : K.w, s = hcm ? hcm / ch : (wcm || 10) / cw; // cốc (opts.h) và chậu (opts.w) theo cỡ khai của 3D
      return { img: key, m, s, w: m.w * s, h: ch * s, L: (m.cx - ('left' in m ? m.left : 0)) * s, R: (('right' in m ? m.right : m.w) - m.cx) * s };
    }
    const [w, h] = K.box || [8, 8]; return { img: null, m: null, s: 1, w, h, L: w / 2, R: w / 2 };
  }
  function build(d) {
    const B = { id: d.id, d, items: {}, vessel: {}, st: {}, level: { ...(d.ref || {}) }, off: new Set((d.steps || []).filter((s) => s.off).map((s) => s.id)), run: null, seq: makeSeq(), loaded: false, rinsing: false,
      solo: null, want: {}, pulse: {}, fly: [], stream: null, sinkFlow: false, data: {}, opts: {}, pipes: [], flowK: 0, flowHex: '#b5d334', shown: {}, lift: 0, view: null, bounds: { x0: 0, x1: 100, top: 40 }, drops: [], counter: null, focus: null, focusHold: 0, zoomK: 0, fcur: null, streams: [], tap: null, waste: null };
    B.tag = (id, text) => { B.shown[id] = text; };
    B.clock = (t) => { const it = Object.values(B.items).find((x) => x.kind === 'timer'); if (it) it.time = t; };
    B.read = (id) => { const it = B.items[id]; return (it && it.mL) || 0; };
    B.gas = (id, mL) => { const it = B.items[id]; if (it) it.vol = mL; };
    B.switch = (id, on) => { const it = B.items[id]; if (it) it.on = !!on; };
    B.fizz = (id, k) => { const it = B.items[id]; if (it) it.fizz = clamp(k || 0, 0, 1); };
    B.haze = (id, k, h) => { const it = B.items[id]; if (it) it.haze = { k: clamp(k || 0, 0, 1), hex: h ? hex(h) : (it.haze && it.haze.hex) || '#b5d334' }; };
    B.flow = (k, h) => { B.flowK = clamp(k || 0, 0, 1); if (h) B.flowHex = hex(h); };
    B.meter = (id, k) => { const it = B.items[id]; if (it) it.k = clamp(k || 0, 0, 1); };
    B.screen = (id, sc) => { const it = B.items[id]; if (it) { it.scene = sc || null; it.sceneT = 0; } };
    B.say = (t) => say(t);
    // 26/11: ống dẫn khí nối từng đoạn, kết tủa, đưa món về chỗ, bỏ dấu đã làm (xem đầu kit/labset.js)
    B.pipe = (a, b, on) => { const p = B.pipes.find((x) => x.a.id === a && x.b.id === b); if (p) p.on = !!on; };
    B.home = (...ids) => ids.forEach((id) => { const it = B.items[id]; if (it) { it.pos.x = it.home.x; it.pos.y = it.home.y; it.pos.rot = 0; it.out = false; it.placed = false; } });
    B.undo = (...sids) => sids.forEach((sid) => { delete B.st[sid]; });
    d.items.forEach((spec) => {
      const K = KIND2D[spec.kind] || { box: [8, 8], name: spec.kind }, it = { id: spec.id, kind: spec.kind, spec, K, B, touch: !!K.r && spec.pick !== false, visible: true, z: spec.at.length === 3 ? spec.at[2] : spec.at[1], elev: d.island === false ? 0 : spec.at.length === 3 ? spec.at[1] * 10 : 0, bub: [] };
      Object.assign(it, sizeOf(it)); it.pos = { x: 0, y: -it.elev, rot: 0 }; it.home = { x: 0, y: -it.elev };
      if (spec.kind === 'dropper' && spec.opts && spec.opts.pip && PIPG[it.img]) it.pip = { out: false, x: 0, y: 0, load: 0, hex: WATER }; // lọ có ống hút rời
      B.items[spec.id] = it;
      if (K.vessel) B.vessel[spec.id] = makeVessel(it);
    });
    Object.values(B.items).forEach((it) => {
      if (it.kind === 'gasrig') { const v = Object.values(B.vessel).find((x) => (it.spec.of && x.item.spec.of === it.spec.of) || Math.abs(x.item.spec.at[0] - it.spec.at[0]) < 0.05); if (v) { it.host = v.item; v.rig = it; it.dir = (it.spec.opts && it.spec.opts.dir) || 1; } }
      if (it.spec.in && B.items[it.spec.in]) it.host = B.items[it.spec.in];
    });
    (d.pipes || []).forEach(([a, b]) => { if (B.items[a] && B.items[b]) B.pipes.push({ a: B.items[a], b: B.items[b], on: !d.pipesOff }); });
    if (d.scene2d && d.scene2d.attach) d.scene2d.attach(B); // CẢNH TỰ VẼ (sa bàn · 27/11): xem drawBench
    if (d.scene2d && d.scene2d.grab) cv.style.touchAction = 'none'; // có núm kéo: ngón tay kéo trên cảnh không cuộn trang
    benches[d.id] = B; list.push(B);
    layout(B); reset(B);
  }

  function makeVessel(item) {
    const v = {
      item, fill: 0, tintC: WATER, tintK: 0, alphaHint: 0.5, solids: [], solidK: 1, powder: false, bubbles: 0, bub: [], rig: null,
      setFill(k) { v.fill = k; },
      // mực theo thể tích thật x mL (luật H2: không phóng to thể tích): K.ml mL ở mức đầy hình (miệng ống), như mL(x) của 3D
      mL(x) { v.setFill(v.fillOf(x)); },
      fillOf: (x) => (item.K.ml ? ((x / item.K.ml) * (item.h - v.floor())) / (item.K.lmax * item.h) : x / 15),
      tint(color, k, { opacity = 0.5 } = {}) { v.tintC = hex(color); v.tintK = clamp(k, 0, 1); v.alphaHint = opacity; v.lookA = null; },
      look(h, opacity = 0.5) { v.tintC = hex(h); v.tintK = 1; v.lookA = clamp(opacity, 0.35, 0.92); }, // màu theo kho hoá học (như look của 3D)
      solid(k) { v.solidK = k; },
      ppt(k, h) { v.pptK = clamp(k || 0, 0, 1); if (h) v.pptHex = hex(h); }, // lớp kết tủa lắng dưới đáy (k từ 0 tới 1)
      clear() { v.tintC = WATER; v.tintK = 0; v.lookA = null; v.solids = []; v.solidK = 1; v.powder = false; v.bubbles = 0; v.bub = []; v.pptK = 0; },
      floor: () => (item.m ? (item.m.floor || 0) * item.s : 0.5),
      level: () => v.floor() + v.fill * item.K.lmax * item.h, // độ cao mặt thoáng so với đáy ngoài (cm)
      mouth: () => ({ x: item.pos.x, y: item.pos.y - item.h }),
      surfaceY: () => item.pos.y - v.level(),
      halfIn: () => { const m = item.m; if (!m || !m.prof) return 1; const r = m.prof.filter((p) => p[0] <= m.bottom - m.floor).pop(); return ((r[2] - r[1]) / 2 - (m.wall || 0)) * item.s; },
    };
    return v;
  }

  // ---------- Xếp theo vai trò (bàn khai bo_cuc) ----------
  const KHAY = { day: 0.45, cao: 1.7, le: 1.3, cach: 1.6 }; // cm: đáy lòng khay, cao thành khay, lề hai đầu khay, khe giữa hai khay
  function placeBoCuc(B, free, GAP) {
    const L = B.d.bo_cuc; B.khay = []; B.bang = [];
    if (!L || B.solo) return false;
    const X = xepBan2d(L[cachXep(L, B.opts.step)]), byId = (id) => free.find((it) => it.id === id), used = new Set();
    free.forEach((it) => { if (it.elev0 == null) it.elev0 = it.elev; it.elev = it.elev0; it.tray = false; });
    let cur = 0;
    X.khay.forEach((ids) => {
      const its = ids.map(byId).filter(Boolean); if (!its.length) return;
      const half = Math.max(...its.map((i) => Math.max(i.L, i.R))), pitch = 2 * half + 1.1, x0 = cur;
      its.forEach((it, k) => { it.home.x = x0 + KHAY.le + half + k * pitch; it.elev = KHAY.day; it.tray = true; used.add(it); });
      const x1 = x0 + 2 * KHAY.le + 2 * half + (its.length - 1) * pitch; B.khay.push({ x0, x1 }); cur = x1 + KHAY.cach;
    });
    const rack = free.find((it) => it.kind === 'rack');
    if (rack && rack.m && rack.m.holes) {
      cur += Math.max(0, GAP - KHAY.cach); rack.home.x = cur + rack.L; rack.elev = 0; used.add(rack);
      const tubes = [...X.ong.map(byId).filter(Boolean), ...free.filter((t) => t.kind === 'tube' && !X.ong.includes(t.id))], nH = rack.m.holes.length;
      // ống cách một lỗ khi đế còn chỗ: bảng tên dưới từng ống đủ rộng để đọc (2 ống: lỗ 1, 3 · 3 ống: lỗ 0, 2, 4); nhiều ống hơn thì lỗ liền nhau
      const step = tubes.length * 2 - 1 <= nH ? 2 : 1, s0 = Math.max(0, Math.floor((nH - ((tubes.length - 1) * step + 1)) / 2));
      tubes.forEach((t, k) => { t.rack = rack; t.hole = Math.min(nH - 1, s0 + k * step); used.add(t); });
      B.bang = X.bang.filter((p) => byId(p.id));
      cur = rack.home.x + rack.R + GAP;
    } else cur += GAP - KHAY.cach;
    // còn lại theo at[0]; cụm rửa (cốc thải, bình tia, chậu) luôn ở mép phải (luật mục 2.5)
    const wasteId = B.d.rinse && B.d.rinse.waste, wash = (it) => it.id === wasteId || it.kind === 'wash' || it.kind === 'sink';
    const rest = free.filter((it) => !used.has(it)).sort((a, b) => wash(a) - wash(b) || a.spec.at[0] - b.spec.at[0] || a.z - b.z);
    rest.forEach((it) => { it.home.x = cur + it.L; cur = it.home.x + it.R + GAP; });
    return true;
  }
  // Khay nông: ảnh tray_shallow kéo giãn phần giữa, giữ hai đầu bo (ảnh chưa có thì vẽ dải xám tạm, chờ LAB-014)
  function drawTrays(B) {
    (B.khay || []).forEach(({ x0, x1 }) => {
      const w = x1 - x0, h = KHAY.cao, im = IM.tray_shallow, m = META.tray_shallow;
      if (im && m) { const sw = m.w, sh = m.h, cap = sh * 0.9, k = h / sh, capW = Math.min(cap * k, w / 3);
        c.drawImage(im, 0, 0, cap, sh, x0, -h, capW, h); c.drawImage(im, cap, 0, sw - 2 * cap, sh, x0 + capW, -h, w - 2 * capW, h); c.drawImage(im, sw - cap, 0, cap, sh, x1 - capW, -h, capW, h); return; }
      c.save(); c.fillStyle = '#9da8b1'; c.strokeStyle = 'rgba(40,52,64,0.35)'; c.lineWidth = 0.08; c.beginPath(); c.roundRect(x0, -h, w, h, 0.5); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x0 + 0.4, -h + 0.12, w - 0.8, 0.16); c.restore();
    });
  }
  // Bảng tên dưới từng ống (mép trước đế), cỡ chữ theo màn hình để đọc được ở mọi khung
  function drawPlates(B, V, dpr) {
    if (!(B.bang || []).length) return;
    const rack = Object.values(B.items).find((it) => it.kind === 'rack' && it.visible); if (!rack) return;
    const fs = Math.round(11.5 * dpr), ph = Math.round(fs * 1.65), y = V.OY - Math.min(rack.h * 0.08, 1.2) * V.SC - ph / 2;
    c.save(); c.font = `600 ${fs}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    B.bang.forEach(({ id, chu }) => {
      const t = B.items[id]; if (!t || !t.visible) return;
      const x = V.OX + t.home.x * V.SC, w = c.measureText(chu).width + fs * 1.1;
      c.fillStyle = '#f4efe2'; c.strokeStyle = 'rgba(20,34,58,0.28)'; c.lineWidth = dpr; c.beginPath(); c.roundRect(x - w / 2, y - ph / 2, w, ph, ph * 0.3); c.fill(); c.stroke();
      c.fillStyle = '#2b2f36'; c.fillText(chu, x, y + dpr * 0.5);
    });
    c.restore();
  }

  // ---------- Xếp chỗ: at[0] là thứ tự trái → phải ----------
  function layout(B) {
    const d = B.d, M2 = d.mode2d || {}, GAP = M2.gap ?? 3, GAP_IN = 2;
    const back = Object.values(B.items).find((it) => it.K.backdrop && it.visible);
    const outside = (it) => back && it.kind === 'gasmeter'; // đồng hồ khí độc đo khí trong PHÒNG: đứng ngoài tủ hút
    const free = Object.values(B.items).filter((it) => it.visible && !it.host && !it.K.backdrop && !outside(it));
    const groups = [];
    free.slice().sort((a, b) => a.spec.at[0] - b.spec.at[0] || a.z - b.z).forEach((it) => { const g = groups.find((x) => Math.abs(x.x - it.spec.at[0]) < 0.05); if (g) g.list.push(it); else groups.push({ x: it.spec.at[0], list: [it] }); });
    // Ống nghiệm cắm trên giá: vào lỗ gần at[0] nhất (giá của bài mẫu có lỗ cách nhau 0,32 tính từ tâm giá)
    free.filter((it) => it.kind === 'tube').forEach((t) => { const rack = free.find((r) => r.kind === 'rack' && Math.abs(r.spec.at[0] - t.spec.at[0]) < 0.75 && t.spec.at.length === 3); if (rack) { t.rack = rack; t.hole = clamp(Math.round((t.spec.at[0] - rack.spec.at[0]) / 0.32 + 2), 0, 4); } });
    let cur = 0;
    if (!placeBoCuc(B, free, GAP)) groups.forEach((g) => {
      const list = g.list.filter((it) => !it.rack);
      if (!list.length) return;
      const base = list.slice().sort((a, b) => a.z - b.z || a.elev - b.elev)[0];
      const over = list.filter((it) => it === base || it.elev > 0 || Math.abs(it.z - base.z) < 0.3), side = list.filter((it) => !over.includes(it));
      const L = Math.max(...over.map((it) => it.L)), R = Math.max(...over.map((it) => it.R));
      const x = M2.x && M2.x[base.id] != null ? M2.x[base.id] : cur + L;
      over.forEach((it) => { it.home.x = x; });
      // phễu nhỏ giọt đứng trên bình cầu: cuống cắm sâu 5 cm vào cổ bình
      over.filter((it) => it.kind === 'dropfunnel').forEach((f) => { const fl = over.find((o) => o.kind === 'sideflask' || (o.K.vessel && o !== f)); if (fl) f.elev = fl.elev + fl.h - 5; });
      cur = x + R;
      side.forEach((it) => { cur += GAP_IN; it.home.x = M2.x && M2.x[it.id] != null ? M2.x[it.id] : cur + it.L; cur = it.home.x + it.R; });
      cur += GAP;
    });
    // ống trên giá: đúng lỗ, đáy ống đứng trên đế giá
    free.filter((t) => t.rack).forEach((t) => { const r = t.rack, m = r.m; t.home.x = r.home.x + ((m.holes[t.hole] - m.cx) * r.s); t.elev = r.elev + (m.bottom - m.baseTop) * r.s; });
    // Tủ hút: phủ mọi món còn lại, món đứng trên sàn tủ
    B.lift = 0;
    if (back) {
      let x0 = Infinity, x1 = -Infinity, top = 0;
      free.forEach((it) => { x0 = Math.min(x0, it.home.x - it.L); x1 = Math.max(x1, it.home.x + it.R); top = Math.max(top, it.elev + it.h); });
      const m = back.m; let sx = (x1 - x0 + 7) / ((HOOD.x1 - HOOD.x0) * m.w), sy = (top + 6) / ((HOOD.floor - HOOD.y0) * (m.bottom - m.top));
      if (sx > sy * 1.9) sy = sx / 1.9; else if (sy > sx * 1.45) sx = sy / 1.45; // ảnh tủ (khung hộp) được giãn ngang tối đa 1,9 lần, dọc 1,45 lần: lòng tủ vừa bộ dụng cụ
      Object.assign(back, { s: sx, sy, w: m.w * sx, h: (m.bottom - m.top) * sy, L: (m.cx - m.left) * sx, R: (m.right - m.cx) * sx });
      back.home.x = (x0 + x1) / 2; back.elev = 0; B.lift = (1 - HOOD.floor) * back.h;
      free.forEach((it) => { it.elev += B.lift; });
      cur = back.home.x + back.R + GAP;
      Object.values(B.items).filter((it) => it.spec.away && free.includes(it)).forEach((it) => { it.awayX = cur + it.L; cur = it.awayX + it.R + GAP; }); // chỗ đặt cốc khi nhấc ra khỏi tủ
      Object.values(B.items).filter((it) => outside(it) && it.visible).forEach((it) => { it.home.x = cur + it.L; cur = it.home.x + it.R + GAP; });
    }
    Object.values(B.items).forEach((it) => { it.home.y = -it.elev; });
    // Món gắn kèm: xi-lanh nằm ngang phía trên bình, nhiệt kế đứng trong ống
    Object.values(B.items).forEach((it) => {
      if (!it.host) return;
      if (it.kind === 'gasrig') { const h = it.host; it.axisY = -(h.elev + h.h + 8); it.tipX = h.home.x + it.dir * 2.6; it.reach = (ROD_MAX - SYR.tip) * it.s; it.home.x = it.tipX + it.dir * (it.reach / 2); it.home.y = it.axisY; }
      else { it.home.x = it.host.home.x + 0.3; it.home.y = it.host.home.y - 1; }
    });
    Object.values(B.items).forEach((it) => { if (!B.seq.busy()) { it.pos.x = it.home.x; it.pos.y = it.home.y; } });
    let x0 = Infinity, x1 = -Infinity, top = 0;
    Object.values(B.items).forEach((it) => {
      if (!it.visible) return;
      const [a, b] = it.kind === 'gasrig' ? [Math.min(it.tipX, it.tipX + it.dir * it.reach), Math.max(it.tipX, it.tipX + it.dir * it.reach)] : [it.home.x - it.L, it.home.x + it.R];
      x0 = Math.min(x0, a); x1 = Math.max(x1, b); top = Math.max(top, it.kind === 'gasrig' ? -it.axisY + 3 : it.elev + it.h);
    });
    if (B.pipes.length) top += 3;
    B.bounds = { x0: x0 - 3, x1: x1 + 3, top: top + 4 };
  }

  // ---------- Trạng thái một bàn (như reset của 3D) ----------
  function reset(B) {
    const d = B.d;
    B.st = {}; B.level = { ...(d.ref || {}) }; B.run = null; B.loaded = false; B.rinsing = false; B.pulse = {}; B.fly = []; B.stream = null; B.sinkFlow = false; B.drops = []; B.flowK = 0; B.counter = null; B.streams = []; B.tap = null; B.focus = null;
    Object.keys(B.shown).forEach((k) => delete B.shown[k]);
    Object.values(B.items).forEach((it) => {
      it.pos.x = it.home.x; it.pos.y = it.home.y; it.pos.rot = 0; it.done = false; it.pop = 0; it.out = false; it.placed = false;
      if (it.K.label) it.cap = true;
      if (it.kind === 'dish') { it.content = true; it.holder = 1; }
      if (it.kind === 'cylinder') it.mL = 0;
      if (it.kind === 'balance') it.value = null;
      if (it.kind === 'spatula') it.powder = false;
      if (it.kind === 'lamp') it.lit = false;
      if (it.kind === 'gasrig') { it.vol = 0; it.open = 1; }
      if (it.kind === 'timer') it.time = 0;
      if (it.kind === 'thermo' || it.kind === 'hotplate') it.temp = 25;
      it.on = false; it.fizz = 0; it.bub = []; it.k = 0; it.scene = null; it.haze = null; it.flip = false;
      if (it.pip) Object.assign(it.pip, { out: false, load: 0 });
    });
    Object.values(B.vessel).forEach((v) => { v.clear(); v.setFill(d.prefill ? 1 : 0); });
    B.pipes.forEach((p) => { p.on = !d.pipesOff; });
    B.data = {}; if (d.init) d.init(B);
    // món chỉ dùng ở bước khác thì cất đi (show(B) theo B.opts.step của bài); món khai of thì theo chế độ một bình
    let moved = false;
    Object.values(B.items).forEach((it) => { const vis = (!it.spec.show || !!it.spec.show(B)) && (!it.spec.of || !B.solo || it.spec.of === B.solo); if (vis !== it.visible) { it.visible = vis; moved = true; } });
    if (moved || d.bo_cuc) { layout(B); Object.values(B.items).forEach((it) => { it.pos.x = it.home.x; it.pos.y = it.home.y; }); }
  }

  // ---------- Việc (cùng luật với 3D) ----------
  const optsOf = (s) => s.options || [{ v: true, item: s.item }];
  const snap = (r, v) => +Math.min(r.max, Math.max(r.min, Math.round(v / r.step) * r.step)).toFixed(r.digits || 0);
  const wantOf = (B, s) => snap(s.range, B.want[s.var] ?? (B.d.ref || {})[s.var] ?? s.range.min);
  const pickOpt = (B, s, k) => (s.options ? s.options[k ?? 0] : s.range ? { v: k ?? wantOf(B, s) } : null);
  function can(B, s) {
    if (B.seq.busy() || (B.run && !s.free) || B.off.has(s.id)) return false; // free: việc làm được cả khi đang chạy (bật/tắt quạt, nhấc cốc)
    if ((s.needs || []).some((id) => !B.st[id]) || (s.until && B.st[s.until])) return false;
    for (const p of B.d.steps) { if (p === s) break; if (!p.optional && !B.off.has(p.id) && !B.st[p.id]) return false; }
    return !B.st[s.id] || !!s.repeat;
  }
  const nextStep = (B) => (B.run ? null : B.d.steps.find((s) => !s.optional && !B.off.has(s.id) && !B.st[s.id]) || null);
  function act(B, s, opt, instant) {
    if (!can(B, s)) return false;
    const o = opt || optsOf(s)[0];
    if (s.guard) { const m = s.guard(B, o); if (m) { if (!instant) say(m); return false; } } // giáo án chặn việc kèm lời nhắc (o: lựa chọn đang làm, ví dụ lọ đặt lên kệ)
    const seq = VERBS[s.verb](B, s, o);
    // thứ tự khi việc xong (như 3D): đánh dấu đã làm → ghi mức → apply → báo 'act' (k = số thứ tự lựa chọn hoặc con số tự chọn) → mở lần chạy
    const fin = () => { B.st[s.id] = true; if (s.var) B.level[s.var] = o.v; if (s.apply) s.apply(B, o); if (cb.act) cb.act(B.id, s.id, s.options ? s.options.indexOf(o) : s.range ? o.v : undefined); if (s.role === 'start') B.run = { t: 0, done: false, row: null, marks: B.d.chem && B.d.chem.marks ? B.d.chem.marks(B).filter((m) => m.at != null) : [] }; emit(B); };
    if (!seq.length) { fin(); return true; }
    B.seq.play(seq, fin); if (instant) { B.seq.flush(); B.focus = null; B.zoomK = 0; B.counter = null; } else emit(B);
    return true;
  }
  function cycle(B, s) { const i = s.options.findIndex((o) => o.v === B.level[s.var]); return !B.st[s.id] ? s.options[Math.max(i, 0)] : s.options[(i + 1) % s.options.length]; }
  // Chạm một món: làm việc đầu tiên đang làm được mà món này tham gia; không thì nói việc cần làm trước (cùng lời với 3D).
  function hand(B, itemId) {
    if (active !== B.id) { if (cb.pick) cb.pick(B.id); return; }
    const sp = B.items[itemId] && B.items[itemId].spec, info = sp && sp.role ? `${sp.tag || sp.id}: ${sp.role}` : '';
    const say = (t) => say0(info && t ? `${info}. ${t}` : t || info); // chạm món nào cũng hiện tên và vai trò của nó (DEFINE 3b), như 3D
    if (!hands) return say(handsMsg);
    if (B.seq.busy()) return say('Đang thao tác, chờ một chút.');
    if (B.d.rinse && (itemId === B.d.rinse.sink || itemId === B.d.rinse.wash)) return void rinse(B);
    if (B.d.touch) { const m = B.d.touch(B, itemId); if (m) return say(m); }
    if (B.run && !B.d.steps.some((s) => s.free && (s.item === itemId || (s.items || []).includes(itemId)) && can(B, s))) return say(B.run.done ? 'Thí nghiệm đã xong. Chạm vòi nước để rửa dụng cụ, rồi làm lại với điều kiện khác.' : 'Đang phản ứng: nhìn dụng cụ đo và số ở bảng bên phải.');
    const hits = [];
    B.d.steps.forEach((s) => {
      (s.options || []).forEach((o) => { if (o.item === itemId) hits.push([s, o]); });
      if (s.item === itemId || (s.items || []).includes(itemId)) hits.push([s, s.options ? cycle(B, s) : s.range ? { v: wantOf(B, s) } : null]);
    });
    const ok = hits.find(([s, o]) => can(B, s) && !(o && s.var && B.st[s.id] && B.level[s.var] === o.v));
    if (ok) { if (info) say0(info); return void act(B, ok[0], ok[1]); }
    const same = hits.find(([s]) => s.range && can(B, s));
    if (same) return say(`Đang có đúng ${String(same[1].v).replace('.', ',')} ${same[0].range.unit}. Muốn đổi thì kéo thanh hoặc nhập số khác ở bảng bên phải, rồi chạm lại.`);
    const it = B.items[itemId];
    if (!hits.length) return say(it.spec.say || 'Món này không cần chạm: nó tự làm việc khi thí nghiệm chạy.');
    const s = hits[0][0], n = nextStep(B);
    if (B.off.has(s.id)) return say(s.offSay || 'Món này chưa dùng ở bước này.');
    say(n && n !== s && !B.st[n.id] && B.d.steps.indexOf(n) < B.d.steps.indexOf(s) ? `Làm việc này trước: ${n.label}.` : `Việc "${s.label}" đã làm. Muốn đổi thì chạm vòi nước để rửa dụng cụ trước.`);
  }

  // ---------- ĐỘNG TÁC (bản 2D của VERBS trong kit/labset.js) ----------
  const inPlay = (B, key) => !B.solo || key === B.solo;
  const vesselsOf = (B, keys) => keys.filter((k) => inPlay(B, k)).map((k) => B.vessel[k]);
  const rigsOf = (B, ids) => (ids || []).filter((id) => B.items[id] && inPlay(B, B.items[id].spec.of)).map((id) => B.items[id]);
  const hop = (it, p, q, up = 3) => (k) => { it.pos.x = lerp(p.x, q.x, k); it.pos.y = lerp(p.y, q.y, k) - Math.sin(Math.PI * k) * up; };
  const at = (it) => ({ x: it.pos.x, y: it.pos.y });
  // Rót: nhấc món nguồn tới cạnh miệng bình đích, nghiêng (chân luôn ở trên miệng bình) cho tới khi miệng món nguồn nằm trên miệng bình, rót, dựng lại, về chỗ.
  // Thân món nguồn ngả về phía KHÔNG có xi-lanh của bình đích; bình không có xi-lanh thì ngả về phía món nguồn đứng.
  function pourSeq(B, src, targets, [f0, f1], { thin = false, drain = false } = {}) {
    const seq = [], H = src.h, TH = 1.85, home = { ...src.home };
    let prev = home;
    targets.forEach((v, n) => {
      const mo = v.mouth(), side = v.rig ? -v.rig.dir : (home.x < mo.x ? -1 : 1), th = -side * TH, A = { x: mo.x - side * 0.25, y: mo.y - 1.4 };
      const P0 = { x: A.x + side * (v.item ? v.item.w * 0.5 + src.w * 0.5 + 0.5 : 4), y: mo.y - 2 }, P1 = { x: A.x - H * Math.sin(th), y: A.y + H * Math.cos(th) };
      const pose = (k) => ({ x: lerp(P0.x, P1.x, k), y: lerp(P0.y, P1.y, k) }), from = prev, hover = pose(0);
      let v0 = 0, share = 0;
      seq.push(
        { dur: 0.5, start() { src.cap = false; }, fn: hop(src, from, hover, 2.5) },
        { dur: 0.35, fn: (k) => { const p = pose(k); src.pos.x = p.x; src.pos.y = p.y; src.pos.rot = th * k; } },
        { dur: thin ? 0.6 : 0.9, ease: lin, start() { B.stream = { x: A.x, y: A.y, to: v, w: thin ? 0.12 : 0.32, color: STREAM }; if (drain) { v0 = src.mL || 0; share = v0 / (targets.length - n); } },
          fn: (k) => { if (!thin) v.setFill(f0 + (f1 - f0) * k); if (drain) src.mL = v0 - share * k; } },
        { dur: 0.3, start() { B.stream = null; }, fn: (k) => { const p = pose(1 - k); src.pos.x = p.x; src.pos.y = p.y; src.pos.rot = th * (1 - k); } });
      prev = hover;
    });
    const last = prev;
    seq.push({ dur: 0.5, fn: hop(src, last, home, 2.5) }, { dur: 0.02, fn: () => { src.pos.rot = 0; src.cap = true; } });
    return seq;
  }
  function cylTarget(cyl, from, to) {
    return { rig: null, item: cyl, mouth: () => ({ x: cyl.pos.x, y: cyl.pos.y - cyl.h }), setFill: (k) => { cyl.mL = from + (to - from) * k; }, surfaceY: () => cyl.pos.y - cylLevel(cyl) };
  }
  function pieces(B, S, form) {
    const size = typeof S.size === 'function' ? S.size(B) : S.size ?? 1, col = S.color != null ? hex(S.color) : S.chem && FLAT_SOLID[S.chem] ? FLAT_SOLID[S.chem][0] : STONE, kind = S.chem && FLAT_SOLID[S.chem] ? FLAT_SOLID[S.chem][1] : 'pebble';
    if (!S.chem && (form || S.form) === 'vun') return Array.from({ length: 9 }, (_, i) => ({ kind: 'pebble', col, r: 0.34 * size * (0.8 + 0.35 * ((i * 37) % 7) / 7), dx: (i - 4) * 0.42 * size, seed: i + 2 }));
    return [{ kind, col, r: (S.chem ? 0.55 : 0.95) * size, dx: 0, seed: 1 }];
  }

  // ---------- LUẬT THAO TÁC 26/11: ống hút, bộ đếm, cận cảnh, làm lại đúng thứ tự (cùng nghĩa với pipSeq, rinseT8, setFocus của kit/labset.js) ----------
  // CẬN CẢNH (H1, H2, H8): bàn khai closeup thì lúc đang thao tác khung tự phóng tới cụm đang dùng: các món ids (theo chỗ đang đứng) và các điểm pts (toạ độ cảnh,
  // hoặc hàm trả điểm); xong thao tác và lần chạy ngắn sau nó thì lùi về khung cả bàn (update). Cả màn hẹp: khung luôn vừa cụm, không thu cả bàn.
  function setFocus(B, ids, pts = []) { if (!B.d.closeup) return; B.focus = { ids: ids.filter((id) => B.items[id]), pts }; B.focusHold = 0.8; }
  const pipSeat = (src) => { const G = PIPG[src.img]; return { x: src.home.x, y: src.home.y - (src.m.bottom - G.tip) * src.s }; };
  const pipTop = (src) => (PIPG[src.img].tip) * src.s; // từ đầu ống hút tới đỉnh bóp (cm)
  // Ống hút của lọ (opts.pip): lọ ĐỨNG YÊN; rút ống hút thẳng lên khỏi lọ, đi ngang ở độ cao ngay trên miệng các ống (không chạm ống nào trên giá), hạ tới ngay trên
  // miệng ống into[0] (thẳng đứng, đầu ống hút cách miệng 0,7 cm), rồi: việc nhỏ giọt: từng giọt rơi (dropTimes), bộ đếm "Tên lọ · 7/20 giọt", mực dâng theo từng
  // giọt (dropMl mL mỗi giọt, mặc định 0,05); việc khai ml: hút rồi bóp từng lần drawMl mL (mặc định 1), bộ đếm "1 mL", "2 mL"; xong trả ống hút về ĐÚNG lọ.
  // Mỗi khi lượng trong ống đổi gọi during(B, o, k) của việc (k từ 0 tới 1) để giáo án đổi màu dần theo kho hoá học.
  function pipSeq(B, s, o) {
    const src = B.items[s.item], P = src.pip, v = B.vessel[s.into[0]], col = s.drop ? hex(s.drop) : WATER, label = src.spec.tag || '', tube = v.item;
    const seat = pipSeat(src), m = v.mouth(), over = { x: m.x, y: m.y - 0.7 }, neck = src.home.y - src.h - 0.4, up = { x: seat.x, y: Math.min(over.y, neck) }, across = { x: over.x, y: up.y };
    const to = (a, b, hop = 0) => (k) => { P.x = lerp(a.x, b.x, k); P.y = lerp(a.y, b.y, k) - Math.sin(Math.PI * k) * hop; };
    const out = (on) => { P.out = on; if (on) { P.x = seat.x; P.y = seat.y; } };
    const lifted = { x: seat.x, y: neck }, top = pipTop(src);
    const wide = () => setFocus(B, [s.item, s.into[0]], [{ x: seat.x, y: neck - top }]); // nấc rộng: lọ đứng yên và ống hút được rút ra
    const tight = () => setFocus(B, [s.into[0]], [{ x: over.x, y: over.y - 2 }]); // nấc sát: ống nghiệm và đầu ống hút, giọt rơi và màu đổi thấy rõ
    const flash = (txt) => { B.counter = txt ? { id: tube.id, text: txt, side: src.home.x > tube.home.x ? -1 : 1 } : null; }; // bộ đếm ở phía không có lọ: ống hút về lọ không đi qua bộ đếm
    wide();
    if (s.ml) {
      const per = s.drawMl || 1, draws = Math.max(1, Math.round(s.ml / per)), seq = [];
      setFocus(B, [s.item, s.into[0]], [{ x: over.x, y: over.y - 2.5 }]); // lọ, ống và đoạn cuối ống hút trên miệng ống: dòng dung dịch thấy rõ
      let f0 = 0;
      for (let d = 0; d < draws; d++) seq.push(
        { dur: 0.2, start() { out(true); P.load = 0.6; P.hex = col; if (!d) flash(`${label} · 0 mL`); } }, // bóp rồi thả bóp khi đầu ống hút trong dung dịch: dung dịch vào ống hút
        { dur: 0.3, fn: to(seat, lifted) },
        { dur: 0.45, fn: (k) => (k < 0.5 ? to(lifted, up)(k * 2) : to(up, across)((k - 0.5) * 2)) },
        { dur: 0.15, fn: to(across, over) },
        { dur: 0.5, ease: lin, start() { f0 = v.fill; },
          fn: (k) => { v.setFill(f0 + v.fillOf(per) * k); P.load = 0.6 * (1 - k); B.streams = [{ x0: over.x, y0: over.y, x1: over.x, y1: () => v.surfaceY(), col, w: 0.12 }]; flash(`${label} · ${fmtMl((d + k) * per)} mL`); if (s.during) s.during(B, o, (d + k) / draws); } },
        { dur: 0.3, start() { B.streams = []; flash(`${label} · ${fmtMl((d + 1) * per)} mL`); }, fn: (k) => (k < 0.3 ? to(over, across)(k / 0.3) : to(across, lifted)((k - 0.3) / 0.7)) },
        { dur: 0.25, fn: to(lifted, seat) },
        { dur: 0.02, fn: () => { P.out = false; P.load = 0; } });
      seq.push({ dur: 0.4, fn: (k) => { if (k >= 1) flash(null); } });
      return seq;
    }
    const n = Math.max(1, Math.round(s.range ? o.v : s.count ? s.count(B) : s.n || 3)), T = dropTimes(n), FALL = 0.22, Td = T[n - 1] + FALL + 0.12, per = s.dropMl ?? 0.05;
    let f0 = 0, landed = -1;
    return [
      { dur: 0.45, start() { out(true); P.load = 1; P.hex = col; }, fn: to(seat, lifted) },
      { dur: 0.55, start() { tight(); }, fn: (k) => (k < 0.4 ? to(lifted, up)(k / 0.4) : k < 0.85 ? to(up, across)((k - 0.4) / 0.45) : to(across, over)((k - 0.85) / 0.15)) },
      { dur: Td, ease: lin, start() { f0 = v.fill; landed = -1; flash(`${label} · 0/${n} giọt`); },
        fn: (k) => {
          const t = k * Td, yb = v.surfaceY(); let L = 0; B.drops = [];
          for (let i = 0; i < n; i++) { const q = (t - T[i]) / FALL; if (q >= 1) { L++; continue; } if (q < 0) continue; B.drops.push({ x: over.x, y: lerp(over.y + 0.1, yb, q * q), col }); }
          if (L !== landed) { landed = L; v.setFill(f0 + v.fillOf(per) * L); P.load = 1 - 0.75 * (L / n); flash(`${label} · ${L}/${n} giọt`); if (s.during) s.during(B, o, L / n); }
        } },
      { dur: 0.5, start() { B.drops = []; wide(); }, fn: (k) => (k < 0.15 ? to(over, across)(k / 0.15) : k < 0.6 ? to(across, up)((k - 0.15) / 0.45) : to(up, lifted)((k - 0.6) / 0.4)) },
      { dur: 0.35, fn: to(lifted, seat) },
      { dur: 0.02, fn: () => { P.out = false; P.load = 0; } },
      { dur: 0.6, fn: (k) => { if (k >= 1) flash(null); } }, // bộ đếm đứng thêm một chút cho kịp đọc
    ];
  }
  // LÀM LẠI theo T8 (bàn khai rinse.waste = id cốc thải): (1) nhấc các ống có dung dịch khỏi giá, đổ vào CỐC THẢI (dòng đúng màu, mực cốc thải dâng, màu hoà theo
  // thể tích; cốc thải giữ qua các lần làm lại, sức chứa rinse.wasteMl mặc định 50 mL); (2) mang ra vòi, mở nước, hứng nước máy rồi đổ đi hai lần (thấy dòng nước chảy);
  // (3) tráng nước cất bằng bình tia, đổ đi; (4) đặt lại lên giá. Không đổ hoá chất xuống chậu rửa.
  function rinseT8(B, done) {
    const R = B.d.rinse, sink = B.items[R.sink], waste = B.items[R.waste], wash = R.wash && B.items[R.wash];
    const mv = Object.values(B.vessel).filter((v) => inPlay(B, v.item.id) && v.item.visible && !v.item.spec.fixed && v.fill > 0.004);
    if (!mv.length) { done(); return true; }
    B.rinsing = true;
    const N = mv.length, H = mv[0].item.h, wst = B.waste || (B.waste = { mL: 0, hex: WATER }), cap = R.wasteMl || 50;
    const P = mv.map((v, i) => ({ v, it: v.item, f0: v.fill, hex: v.lookA != null ? v.tintC : mix(WATER, v.tintC, v.tintK), off: i - (N - 1) / 2, m: v.mouth(), a: 0 }));
    // Đặt ống theo MIỆNG ống: miệng ở điểm m, ống nghiêng góc a (chiều kim đồng hồ, gốc xoay ở đáy ống)
    const pose = (p, m, a) => { p.it.pos.rot = a; p.it.pos.x = m.x - p.it.h * Math.sin(a); p.it.pos.y = m.y + p.it.h * Math.cos(a); };
    const bot = (m, a) => ({ x: m.x - H * Math.sin(a), y: m.y + H * Math.cos(a) });
    const go = (to, a1, hop = 0) => { let from = null; return { start() { from = P.map((p) => [{ ...p.m }, p.a]); }, fn: (k) => P.forEach((p, i) => { const t = to(p), [m0, a0] = from[i], m = { x: lerp(m0.x, t.x, k), y: lerp(m0.y, t.y, k) - Math.sin(Math.PI * k) * hop }, a = lerp(a0, typeof a1 === 'function' ? a1(p) : a1, k); pose(p, m, a); if (k >= 1) { p.m = m; p.a = a; } }) }; };
    const sgn = P[0].it.home.x < waste.home.x ? 1 : -1, rim = waste.home.y - waste.h, wl = (x) => Math.min(0.8, (0.8 * x) / cap);
    const wSurf = () => waste.home.y - (waste.m.floor || 0) * waste.s - wl(wst.mL) * (waste.h - (waste.m.floor || 0) * waste.s) - 0.05;
    const wm = (p) => ({ x: waste.home.x - sgn * waste.w * 0.12 + p.off * 0.7, y: rim - 0.4 + p.off * 0.35 }), wT = (p) => ({ x: wm(p).x, y: rim - 3 + p.off * 0.35 });
    const lift = (p) => ({ x: p.it.home.x, y: p.it.home.y - p.it.h - 9.5 });
    const sm = sink.m, sp = { x: sink.home.x + (sm.w * SPOUT[0] - sm.cx) * sink.s, y: sink.home.y - (sm.bottom - sm.h * SPOUT[1]) * sink.s }, basin = sink.home.y - sink.h * 0.12;
    const AT = -1.0, AD = -2.1, AH = -0.9; // dưới vòi: miệng ngả sang trái (thân ống nằm trong lòng chậu); đổ đi: miệng chúc xuống; cầm tráng nước cất
    const tm = (p) => ({ x: sp.x + 0.35 + p.off * 1.2, y: sp.y + 0.8 + p.off * 0.5 }), td = (p) => ({ x: tm(p).x - 0.3, y: tm(p).y + 0.6 });
    const hm = (p) => ({ x: sink.home.x - sink.w * 0.05 + p.off * 2.2, y: sp.y + 1.4 + p.off * 0.5 }), pre = (p) => ({ x: tm(p).x + 6, y: tm(p).y - 9.5 }); // tới vòi từ phía phải (không xuyên cần vòi)
    const stage = (ids, pts) => ({ dur: 0.01, start() { setFocus(B, ids, pts); } });
    const also = (g, f) => ({ fn: g.fn, start() { f(); g.start(); } }); // thêm việc lúc bắt đầu một chặng go()
    const tubeIds = P.map((p) => p.it.id);
    const seq = [
      stage([R.waste, ...tubeIds], P.flatMap((p) => [lift(p), { x: wm(p).x, y: lift(p).y }])),
      { dur: 0.45, ...go(lift, 0) },                                                      // nhấc ống thẳng lên khỏi giá
      { dur: 0.55, ...go((p) => ({ x: wm(p).x - sgn, y: lift(p).y }), 0) },               // mang tới trên cốc thải (thẳng đứng, cao hơn các lọ)
      stage([R.waste], P.flatMap((p) => [wm(p), bot(wT(p), sgn * 2.0), bot(wm(p), sgn * 2.0)])), // cận cảnh cốc thải: thấy dòng đổ và mực cốc dâng
      { dur: 0.45, ...go(wT, sgn * 2.0) },                                                // vừa hạ vừa nghiêng: miệng ống tới trên miệng cốc
      { dur: 0.2, ...go(wm, sgn * 2.0) },                                                 // miệng ống vào trong miệng cốc, đổ
      { dur: 0.8, ease: lin, start() { // (1) dung dịch vào cốc thải: mực dâng, màu hoà theo lượng
        const vol = (p) => p.f0 / p.v.fillOf(1), add = P.reduce((a, p) => a + vol(p), 0), tot = wst.mL + add;
        let h0 = wst.hex; P.forEach((p) => { const w = vol(p) / Math.max(1e-6, wst.mL + vol(p)); h0 = mix(h0, p.hex, wst.mL > 0 ? w : 1); }); this.m0 = wst.mL; this.m1 = tot; wst.hex = h0; },
        fn(k) { wst.mL = this.m0 + (this.m1 - this.m0) * k; P.forEach((p) => p.v.setFill(p.f0 * (1 - k))); B.streams = P.map((p) => ({ x0: p.m.x, y0: p.m.y + 0.1, x1: p.m.x + sgn * 0.15, y1: wSurf, col: p.hex, w: 0.22 * (1 - 0.6 * k) })); } },
      { dur: 0.01, start() { B.streams = []; P.forEach((p) => p.v.clear()); } },        // ống đã cạn: hết màu, hết dòng
      { dur: 0.2, ...go(wT, sgn * 2.0) },
      { dur: 0.45, ...go((p) => ({ x: wm(p).x, y: lift(p).y }), 0) },                    // dựng ống, nhấc cao
      stage([R.sink], P.flatMap((p) => [tm(p), bot(tm(p), AT), bot(td(p), AD), { x: sp.x, y: sp.y - 2 }])),
      { dur: 0.7, ...go(pre, AT, 0.6) },                                                  // (2) mang ra vòi nước, tới từ phía phải
      { dur: 0.4, ...go(tm, AT) },                                                        // miệng ống tới ngay dưới miệng vòi, thân ống nằm trong lòng chậu
      { dur: 0.25, start() { B.tap = { to: () => P[0].m.y - 0.2 }; } },
    ];
    for (let r = 0; r < 2; r++) seq.push(
      { dur: 0.45, ease: lin, start() { P.forEach((p) => { p.v.clear(); p.v.look(STREAM, 0.4); }); B.tap = { to: () => P[0].m.y - 0.2 }; }, fn: (k) => P.forEach((p) => p.v.setFill(0.3 * k)) }, // hứng nước máy
      { dur: 0.35, ...also(go(td, AD), () => { B.tap = { to: () => basin }; }) },                // đổ nước đi (xuống chậu)
      { dur: 0.3, start() { B.streams = P.map((p) => ({ x0: () => p.m.x, y0: () => p.m.y + 0.1, x1: () => p.m.x - 0.2, y1: basin, col: STREAM, w: 0.2 })); }, fn: (k) => P.forEach((p) => p.v.setFill(0.3 * (1 - k))) },
      { dur: 0.3, ...also(go(tm, AT), () => { B.streams = []; B.tap = { to: () => P[0].m.y - 0.2 }; }) });
    seq.push({ dur: 0.2, start() { B.tap = null; } });
    if (wash) { // (3) tráng nước cất: bình tia (quay vòi sang phải) tới từng ống, tia nước cất vào lòng ống
      const W0 = wash.m, ws = wash.s, tipOff = { x: (W0.cx - W0.tip[0]) * ws, y: -(W0.bottom - W0.tip[1]) * ws }; // vòi bình tia khi lật ngang
      let from = null;
      seq.push(stage([R.sink, R.wash], P.flatMap((p) => [hm(p), bot(hm(p), AH), bot(hm(p), AD)]).concat(P.map((p) => ({ x: hm(p).x - 1.2 - tipOff.x, y: hm(p).y - 1.8 - tipOff.y })))),
        { dur: 0.5, ...go(hm, AH) });
      P.forEach((p) => {
        let a = null, at = null;
        seq.push(
          { dur: 0.45, start() { wash.flip = true; a = from || { ...wash.home }; at = { x: hm(p).x - 1.2 - tipOff.x, y: hm(p).y - 1.8 - tipOff.y }; from = at; }, fn: (k) => { hop(wash, a, at, 2)(k); } },
          { dur: 0.5, ease: lin, start() { p.v.clear(); p.v.look(STREAM, 0.4); const t = { x: at.x + tipOff.x, y: at.y + tipOff.y }; B.streams = [{ x0: t.x, y0: t.y, x1: p.m.x, y1: p.m.y + 0.2, col: '#6fa6d8', w: 0.16, arc: 0.6 }]; }, fn: (k) => p.v.setFill(0.12 * k) },
          { dur: 0.02, fn: () => { B.streams = []; } });
      });
      seq.push({ dur: 0.45, start() { this.a = { x: wash.pos.x, y: wash.pos.y }; }, fn(k) { hop(wash, this.a, wash.home, 2)(k); if (k >= 1) wash.flip = false; } },
        { dur: 0.35, ...go(td, AD) }, { dur: 0.25, start() { B.streams = P.map((p) => ({ x0: () => p.m.x, y0: () => p.m.y + 0.1, x1: () => p.m.x - 0.2, y1: basin, col: STREAM, w: 0.14 })); }, fn: (k) => P.forEach((p) => p.v.setFill(0.12 * (1 - k))) },
        { dur: 0.02, fn: () => { B.streams = []; } });
    }
    seq.push(stage(tubeIds, P.flatMap((p) => [lift(p), { x: p.it.home.x, y: p.it.home.y }])),
      { dur: 0.9, ...go(lift, 0, 1) },                                                   // (4) về trên giá
      { dur: 0.6, ...go((p) => ({ x: p.it.home.x, y: p.it.home.y - p.it.h }), 0) });
    B.seq.play(seq, done); emit(B);
    return true;
  }
  const VERBS = {
    none: () => [],
    // Bấm công tắc của món (quạt tủ hút, khoá phễu): món lún xuống một chút rồi trở lại; giáo án đổi trạng thái trong apply
    press(B, s) { const it = B.items[s.item], y0 = it.home.y; return [{ dur: 0.18, fn: (k) => { it.pos.y = y0 + 0.3 * Math.sin(Math.PI * k); } }]; },
    // Nhấc món ra khỏi tủ hút (chỗ dành sẵn bên phải tủ) hoặc đặt lại chỗ cũ
    move(B, s) {
      const it = B.items[s.item], away = { x: it.awayX ?? it.home.x + it.w + 3, y: 0 }, out = !it.out, from = at(it), to = out ? away : { ...it.home };
      return [{ dur: 0.6, fn: hop(it, from, to, 4) }, { dur: 0.02, fn: () => { it.out = out; } }];
    },
    // Nhỏ giọt. Lọ có ống hút (opts.pip): theo luật thao tác T1, T2 (pipSeq ở trên). Lọ nhỏ giọt cũ: lọ bay tới trên miệng ống, ba giọt rơi xuống, lọ về chỗ.
    drip(B, s, o) {
      if (B.items[s.item].pip) return pipSeq(B, s, o);
      const src = B.items[s.item], v = B.vessel[s.into[0]], m = v.mouth(), home = { ...src.home }, over = { x: m.x, y: m.y - 2.5 };
      return [
        { dur: 0.55, fn: hop(src, home, over, 3) },
        { dur: 0.9, ease: lin, start() { B.drops = [{ x: m.x, y0: over.y - src.h, to: v, k: 0 }]; }, fn: (k) => { B.drops[0].k = (k * 3) % 1; } },
        { dur: 0.5, start() { B.drops = []; }, fn: hop(src, over, home, 3) },
      ];
    },
    pour: (B, s, o) => pourSeq(B, B.items[(o && o.item) || s.item], vesselsOf(B, s.into), typeof s.fill === 'function' ? s.fill(B) : s.fill || [0, 1], { thin: s.thin, drain: s.drain }),
    measure(B, s, o) {
      const cyl = B.items[s.tool], from = cyl.mL || 0, to = o.v * (B.solo ? 1 : s.n || 2);
      if (to <= from) return [{ dur: 0.3, ease: lin, fn: (k) => { cyl.mL = from + (to - from) * k; } }];
      return pourSeq(B, B.items[s.item], [cylTarget(cyl, from, to)], [0, 1]);
    },
    weigh(B, s, o) {
      const sc = B.items[s.item], ref = (B.d.ref || {})[s.var] || o.v, seq = [];
      s.dishes.filter((id) => inPlay(B, B.items[id].spec.of)).forEach((id) => {
        const dd = B.items[id], here = { ...dd.home }, pan = { x: sc.pos.x, y: sc.pos.y - sc.h * (1 - sc.K.pan) + 0.15 };
        seq.push({ dur: 0.45, fn: hop(dd, here, pan, 3) }, { dur: 0.35, start() { sc.value = o.v; dd.holder = Math.min(1.45, Math.cbrt(o.v / ref)); } }, { dur: 0.45, fn: hop(dd, pan, here, 3) });
      });
      return seq;
    },
    drop(B, s) {
      const lst = (typeof s.pieces === 'function' ? s.pieces(B) : s.pieces).filter(([, into]) => inPlay(B, into));
      const fl = lst.map(([from, into, form]) => ({ src: B.items[from], v: B.vessel[into], ps: pieces(B, s.solid || {}, form), f: { x: 0, y: 0 } }));
      const rigs = rigsOf(B, s.rigs);
      const seq = [
        { dur: 0.9, start() { fl.forEach((p) => { p.a = { x: p.src.pos.x, y: p.src.pos.y - 1.6 }; const m = p.v.mouth(); p.m = { x: m.x, y: m.y - 2.5 }; p.b = { x: m.x, y: p.v.item.pos.y - p.v.floor() - 0.6 }; p.src.content = false; B.fly.push(p); }); },
          fn: (k) => fl.forEach((p) => { p.f.x = lerp(p.a.x, p.m.x, k); p.f.y = lerp(p.a.y, p.m.y, k) - Math.sin(Math.PI * k) * 5; }) },
        { dur: 0.4, ease: (k) => k * k, fn: (k) => fl.forEach((p) => { p.f.x = p.m.x; p.f.y = lerp(p.m.y, p.b.y, k); }) },
        { dur: 0.02, fn: () => { fl.forEach((p) => { p.v.solids = p.ps; }); B.fly = []; } },
      ];
      if (rigs.length) seq.push({ dur: 0.5, fn: (k) => rigs.forEach((r) => { r.open = 1 - k; }) });
      return seq;
    },
    slide(B, s, o) {
      const it = B.items[o.item], pv = B.st[s.id] ? B.items[optsOf(s).find((x) => x.v === B.level[s.var]).item] : null, prev = pv !== it ? pv : null;
      const shelf = Object.values(B.items).find((x) => x.K.shelf && x.visible);
      if (shelf) { // ô của kệ tính từ slot của việc (3D: toạ độ ô trên bàn), lọ đứng trên mặt kệ
        const n = shelf.K.labels.length, i = clamp(Math.round((s.slot[0] - shelf.spec.at[0]) / 0.7) + (n - 1) / 2, 0, n - 1), cw = shelf.w / n, to = { x: shelf.home.x - shelf.w / 2 + cw * (i + 0.5), y: shelf.home.y - shelf.h }, a = at(it), pa = prev && at(prev);
        return [{ dur: 0.6, fn: (k) => { hop(it, a, to, 5)(k); if (prev) hop(prev, pa, prev.home, 4)(k); } }, { dur: 0.02, fn: () => { it.placed = true; if (prev) prev.placed = false; } }];
      }
      const near = Object.values(B.vessel).sort((a, b) => Math.abs(a.item.spec.at[0] - s.slot[0]) - Math.abs(b.item.spec.at[0] - s.slot[0]))[0], slot = { x: near ? near.item.home.x + near.item.w * 0.8 : it.home.x, y: 0 }, a = at(it), pa = prev && at(prev);
      return [{ dur: 0.55, fn: (k) => { hop(it, a, slot, 2)(k); if (prev) hop(prev, pa, prev.home, 2)(k); } }];
    },
    scoop(B, s, o) {
      if (!!o.v === B.loaded) return [];
      const T = B.items[s.tool], jar = B.items[s.item], top = { x: jar.pos.x, y: jar.pos.y - jar.h - 3 }, dip = { x: top.x, y: top.y + 5 }, park = { ...T.home };
      return [
        { dur: 0.6, start() { jar.cap = false; }, fn: hop(T, park, top, 2) },
        { dur: 0.3, fn: hop(T, top, dip, 0) },
        { dur: 0.3, start() { T.powder = !!o.v; B.loaded = !!o.v; }, fn: hop(T, dip, top, 0) },
        { dur: 0.6, fn: hop(T, top, park, 2) },
        { dur: 0.02, fn: () => { jar.cap = true; } },
      ];
    },
    tip(B, s) {
      const rigs = rigsOf(B, s.rigs), seq = [];
      if (B.loaded) {
        const T = B.items[s.tool], v = B.vessel[s.into], m = v.mouth(), over = { x: m.x, y: m.y - 2 }, park = { ...T.home };
        seq.push({ dur: 0.7, fn: hop(T, park, over, 3) }, { dur: 0.3, fn: (k) => { T.pos.rot = 1.2 * k; } },
          { dur: 0.4, start() { T.powder = false; B.loaded = false; }, fn: () => {} },
          { dur: 0.3, start() { v.powder = true; }, fn: (k) => { T.pos.rot = 1.2 * (1 - k); } },
          { dur: 0.6, fn: hop(T, over, park, 3) });
      }
      if (rigs.length) seq.push({ dur: 0.5, fn: (k) => rigs.forEach((r) => { r.open = 1 - k; }) });
      return seq.length ? seq : [{ dur: 0.05 }];
    },
    heat(B, s, o) {
      const lamp = B.items[s.item], th = s.thermo && B.items[s.thermo], ref = (B.d.ref || {})[s.var] ?? 25, from = B.st[s.id] ? B.level[s.var] : ref, to = o.v, hot = to > ref;
      return [
        { dur: 0.3, start() { if (hot) lamp.lit = true; } },
        { dur: 0.8, ease: lin, fn: (k) => { const t = from + (to - from) * k; if (th) th.temp = t; if (s.show) s.show(B, t); } },
        { dur: 0.02, fn: () => { if (!hot) lamp.lit = false; } },
      ];
    },
    warm(B, s, o) {
      const v = B.vessel[s.vessel], plate = B.items[s.item], it = v.item, home = { ...it.home }, ref = (B.d.ref || {})[s.var] ?? 25, from = B.st[s.id] ? B.level[s.var] : ref, to = o.v;
      if (to <= from) return [{ dur: 0.05, fn: () => { if (s.show) s.show(B, to); } }];
      const on = { x: plate.pos.x, y: plate.pos.y - plate.h * 0.42 };
      return [
        { dur: 0.8, fn: hop(it, home, on, 5) },
        { dur: 1.0, ease: lin, start() { plate.temp = to; }, fn: (k) => { if (s.show) s.show(B, from + (to - from) * k); } },
        { dur: 0.8, start() { plate.temp = 25; }, fn: hop(it, on, home, 5) },
      ];
    },
  };
  // Làm lại: mở nút, mang bình tới vòi nước, đổ bỏ, tráng nước cất, đặt lại; bàn về trạng thái đầu.
  function rinse(B, instant) {
    if (B.seq.busy()) return false;
    if (!B.run && !Object.keys(B.st).length) { if (!instant) say('Dụng cụ đang sạch, chưa cần rửa.'); return false; }
    const done = () => { reset(B); emit(B); };
    if (cb.rinse) cb.rinse(B.id);
    if (instant || !B.d.rinse) { done(); return true; }
    if (B.d.rinse.waste && B.items[B.d.rinse.waste]) return rinseT8(B, done); // làm lại đúng luật T8 (cốc thải → vòi → bình tia → giá)
    B.rinsing = true;
    const sink = B.items[B.d.rinse.sink], rigs = rigsOf(B, B.d.rinse.rigs).filter((r) => r.open < 0.5), all = Object.values(B.vessel).filter((v) => inPlay(B, v.item.id)).map((v) => ({ v, f0: v.fill }));
    const mv = all.filter((p) => !p.v.item.spec.fixed).map((p, n, arr) => ({ ...p, home: { ...p.v.item.home }, over: { x: sink.pos.x + sink.w * 0.08 + (n - (arr.length - 1) / 2) * 3.2, y: sink.pos.y - sink.h * 0.72 } }));
    const tilt = (a, b) => (k) => mv.forEach((p) => { p.v.item.pos.rot = 1.4 * (a + (b - a) * k); });
    const seq = [];
    if (rigs.length) seq.push({ dur: 0.4, fn: (k) => rigs.forEach((r) => { r.open = k; }) });
    seq.push(
      { dur: 0.8, fn: (k) => mv.forEach((p) => hop(p.v.item, p.home, p.over, 6)(k)) },
      { dur: 0.4, start() { B.sinkFlow = true; }, fn: tilt(0, 1) },
      { dur: 0.5, ease: lin, fn: (k) => all.forEach((p) => p.v.setFill(p.f0 * (1 - k))) },
      { dur: 0.35, start() { all.forEach((p) => p.v.clear()); B.sinkFlow = false; }, fn: tilt(1, 0) });
    const wash = B.d.rinse.wash && B.items[B.d.rinse.wash];
    if (wash && mv.length) {
      let from = { ...wash.home };
      mv.forEach((p) => {
        const to = { x: p.over.x + 3, y: p.over.y - p.v.item.h - 1 }, a = from;
        seq.push({ dur: 0.4, fn: hop(wash, a, to, 2) },
          { dur: 0.4, ease: lin, start() { const m = p.v.mouth(); B.stream = { x: m.x + 0.6, y: m.y - 0.8, to: p.v, w: 0.12, color: STREAM }; }, fn: (k) => p.v.setFill(0.14 * k) },
          { dur: 0.02, fn: () => { B.stream = null; } });
        from = to;
      });
      const last = from;
      seq.push({ dur: 0.4, fn: hop(wash, last, wash.home, 2) }, { dur: 0.35, fn: tilt(0, 1) }, { dur: 0.35, ease: lin, fn: (k) => mv.forEach((p) => p.v.setFill(0.14 * (1 - k))) }, { dur: 0.3, fn: tilt(1, 0) });
    }
    seq.push({ dur: 0.8, fn: (k) => mv.forEach((p) => hop(p.v.item, p.over, p.home, 6)(k)) });
    B.seq.play(seq, done); emit(B);
    return true;
  }

  // ---------- VẼ ----------
  let c = ctx; // canvas đang vẽ (canvas chính, hoặc canvas ảnh nhỏ của snapshot)
  const cylLevel = (cyl) => { const m = cyl.m, fl = (m.floor || 0) * cyl.s; return fl + clamp((cyl.mL || 0) / 100, 0, 1.08) * (cyl.h - fl) * 0.83; };
  const P = (it, px, py) => ({ x: it.pos.x + (px - it.m.cx) * it.s, y: it.pos.y - (it.m.bottom - py) * it.s }); // điểm ảnh gốc → toạ độ cảnh
  const Ph = (it, px, py) => ({ x: it.home.x + (px - it.m.cx) * it.s, y: it.home.y - (it.m.bottom - py) * it.s });
  function placeItem(it, f) { c.save(); c.translate(it.pos.x, it.pos.y); if (it.pos.rot) c.rotate(it.pos.rot); f(); c.restore(); }
  function placeholder(it) {
    const [w, h] = [it.w, it.h]; c.save(); c.fillStyle = 'rgba(255,255,255,0.55)'; c.strokeStyle = 'rgba(20,34,58,0.55)'; c.lineWidth = 0.12; c.setLineDash([0.5, 0.35]);
    c.beginPath(); c.roundRect(-w / 2, -h, w, h, Math.min(1, h / 3)); c.fill(); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#14223a'; c.font = `600 ${Math.max(1.1, Math.min(1.6, w / 8))}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; if (h > 2.5) c.fillText(it.K.name || it.kind, 0, -h * 0.55);
    c.restore();
  }
  function lcdText(it, text, unit) {
    const [a, b, cc, e] = it.K.lcd, m = it.m, s = it.s, x0 = (m.w * a - m.cx) * s, x1 = (m.w * cc - m.cx) * s, y0 = (m.h * b - m.bottom) * s, y1 = (m.h * e - m.bottom) * s, h = y1 - y0;
    c.fillStyle = LCD; c.beginPath(); c.roundRect(x0, y0, x1 - x0, h, h * 0.12); c.fill();
    c.fillStyle = INK; c.textBaseline = 'middle'; c.textAlign = 'right'; let fs = h * 0.62; c.font = `700 ${fs}px ${FONT}`; const room = (x1 - x0) * 0.72, wd = c.measureText(text).width; if (wd > room) { fs *= room / wd; c.font = `700 ${fs}px ${FONT}`; }
    c.fillText(text, x0 + (x1 - x0) * 0.8, y0 + h * 0.55); c.font = `600 ${h * 0.32}px ${FONT}`; c.textAlign = 'left'; c.fillText(unit, x0 + (x1 - x0) * 0.83, y0 + h * 0.62);
  }
  // Bọt khí trong lòng một món (bình, ống, bình cầu, bình rửa khí, cốc): hạt bọt cập nhật ở update(), vẽ cắt theo lòng dụng cụ
  function drawBubbles(it, list) {
    if (!list.length || !it.m || !it.m.prof) return;
    c.save(); c.clip(flatInner(it.m, it.s, -it.h));
    list.forEach((b) => { c.beginPath(); c.arc(b.x, b.y, b.r, 0, 6.3); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fill(); c.lineWidth = 0.05; c.strokeStyle = 'rgba(255,255,255,0.92)'; c.stroke(); });
    c.restore();
  }
  function drawVessel(v) {
    const it = v.item, m = it.m, s = it.s;
    if (!m) { placeholder(it); return; }
    const lev = v.level(), top = -lev, a = v.lookA != null ? v.lookA : 0.3 + (Math.min(0.85, v.alphaHint) - 0.3) * v.tintK, col = v.lookA != null ? v.tintC : mix(WATER, v.tintC, v.tintK);
    const rot = it.pos.rot || 0;
    if (v.fill > 0.01 && Math.abs(rot) > 0.03) { // ống đang nghiêng (đổ, rửa): mặt chất lỏng nằm ngang, dồn về đầu thấp hơn (miệng ống khi chúc xuống)
      const ys = Math.cos(rot) >= 0 ? top : -it.h + (lev - v.floor()); c.save(); c.clip(flatInner(m, s, -it.h)); c.translate(0, ys); c.rotate(-rot); c.fillStyle = rgba(col, Math.min(0.92, a + 0.1)); c.fillRect(-40, 0, 80, 40); c.restore();
    } else if (v.fill > 0.01) { drawFlatLiquid(c, m, s, top, col, a); c.save(); c.clip(flatInner(m, s, top - 0.01)); c.fillStyle = rgba(col, Math.min(0.92, a + 0.25), 1.1); c.fillRect(-it.w, top - 0.06, it.w * 2, 0.14); c.restore(); }
    c.save(); c.clip(flatInner(m, s, -it.h));
    if (v.pptK > 0.01) { const hw = v.halfIn(), y0 = -v.floor(), hh = 0.5 + 2.4 * v.pptK, col = v.pptHex || '#2f2a33'; c.fillStyle = rgba(col, 0.96); c.beginPath(); c.moveTo(-hw * 1.05, y0 + 0.2); c.lineTo(-hw * 1.05, y0 - hh * 0.7); c.quadraticCurveTo(0, y0 - hh * 1.15, hw * 1.05, y0 - hh * 0.7); c.lineTo(hw * 1.05, y0 + 0.2); c.closePath(); c.fill(); for (let k = 0; k < 9; k++) { c.fillStyle = rgba(col, 1, k % 2 ? 0.6 : 1.5); c.beginPath(); c.arc(((k * 37) % 13 / 13 - 0.5) * hw * 1.5, y0 - 0.15 - ((k * 17) % 5) / 5 * hh * 0.7, 0.07 + (k % 3) * 0.03, 0, 6.3); c.fill(); } } // lớp kết tủa lắng ở đáy (B.vessel[id].ppt)
    if (v.powder) { c.fillStyle = '#1c1c1e'; c.beginPath(); c.ellipse(0, -v.floor() - 0.15, 1.1, 0.28, 0, 0, 6.3); c.fill(); }
    if (v.solids.length && v.solidK > 0.004) { const k = Math.max(0.08, Math.cbrt(v.solidK)); v.solids.forEach((p) => { c.save(); c.translate(p.dx * Math.max(0.6, k), -v.floor() - p.r * k * 0.75); drawFlatPiece(c, p.kind, p.col, p.r * k, p.seed); c.restore(); }); }
    c.restore();
    drawBubbles(it, v.bub);
    drawFlatImg(c, it.img, s);
  }
  function drawBottleLike(it) {
    const m = it.m, s = it.s, o = it.spec.opts || {};
    if (m.prof && it.kind !== 'jar') drawFlatLiquid(c, m, s, -it.h * 0.55, o.content != null ? hex(o.content) : WATER, 0.34);
    if (it.kind === 'jar') drawHaze(it); // bình thu khí: khí màu đầy dần
    if (it.pip && it.pip.out) drawOpenBottle(it); else drawFlatImg(c, it.img, s);
    const title = o.title != null ? o.title : null;
    if (title && o.label !== false) { const lw = it.w * 0.62, lh = it.h * 0.3, ly = -it.h * 0.52; c.fillStyle = 'rgba(255,255,255,0.94)'; c.strokeStyle = 'rgba(20,34,58,0.25)'; c.lineWidth = 0.05; c.beginPath(); c.roundRect(-lw / 2, ly, lw, lh, 0.25); c.fill(); c.stroke();
      c.fillStyle = '#16324f'; c.textAlign = 'center'; c.textBaseline = 'middle'; let fs = lh * 0.42; c.font = `700 ${fs}px ${FONT}`; const wd = c.measureText(title).width; if (wd > lw * 0.86) { fs *= (lw * 0.86) / wd; c.font = `700 ${fs}px ${FONT}`; } c.fillText(title, 0, ly + lh * (o.sub ? 0.4 : 0.52));
      if (o.sub) { c.font = `500 ${lh * 0.22}px ${FONT}`; c.fillStyle = '#52657a'; c.fillText(o.sub, 0, ly + lh * 0.78); } }
    if (it.kind === 'jar' && it.spec.opts && it.spec.opts.label === false) { c.fillStyle = 'rgba(200,215,225,0.55)'; c.strokeStyle = 'rgba(80,95,110,0.6)'; c.lineWidth = 0.08; c.fillRect(-it.w * 0.42, -it.h - 0.25, it.w * 0.84, 0.3); c.strokeRect(-it.w * 0.42, -it.h - 0.25, it.w * 0.84, 0.3); } // tấm kính che miệng bình thu
    if (it.cap && it.kind !== 'jar' && META.stopper && IM.stopper && m.neckW) { const MS = META.stopper, ss = (m.neckW * s * 1.08) / MS.body; c.save(); c.translate(0, -it.h + (MS.bottom - MS.seat) * ss * 0.2); drawFlatImg(c, 'stopper', ss); c.restore(); }
  }
  // Một mảnh ảnh (hàng sy tới sy + sh, cột sx tới sx + sw của ảnh gốc) vẽ vào cột dx tới dx + dw cùng hàng: để vẽ lọ khi ống hút đã rút ra
  function imgPart(k, s, sx, sy, sw, sh, dx, dw) {
    const m = META[k], im = IM[k]; c.save(); if (isGlassImg(k)) c.globalCompositeOperation = 'hard-light';
    c.drawImage(im, sx, sy, sw, sh, (dx - m.cx) * s, (sy - m.bottom) * s, dw * s, sh * s); c.restore();
  }
  // Lọ đã rút ống hút: không có bóp cao su; vành cổ lọ và thân lọ vẽ lại, chỗ ống hút được phủ bằng dải thuỷ tinh cạnh đó (xem PIPG)
  function drawOpenBottle(it) {
    const k = it.img, G = PIPG[k], m = it.m, s = it.s, W = m.w, [a0, a1] = G.collar, b0 = a1, b1 = Math.min(m.h, G.tip + 14);
    imgPart(k, s, 0, a0, G.seat[0], a1 - a0, 0, G.seat[0]); imgPart(k, s, G.seat[1], a0, W - G.seat[1], a1 - a0, G.seat[1], W - G.seat[1]);
    imgPart(k, s, G.strip[0], a0, G.strip[1] - G.strip[0], a1 - a0, G.seat[0], G.seat[1] - G.seat[0]);
    imgPart(k, s, 0, b0, G.stem[0], b1 - b0, 0, G.stem[0]); imgPart(k, s, G.stem[1], b0, W - G.stem[1], b1 - b0, G.stem[1], W - G.stem[1]);
    imgPart(k, s, G.fill[0], b0, G.fill[1] - G.fill[0], b1 - b0, G.stem[0], G.stem[1] - G.stem[0]);
    imgPart(k, s, 0, b1, W, m.h - b1, 0, W);
  }
  // Ống hút đang ở ngoài lọ: đầu ống hút ở (pip.x, pip.y) toạ độ cảnh, luôn thẳng đứng; thân thuỷ tinh vẽ bằng mã (có cột dung dịch khi đang chứa), bóp đỏ lấy từ ảnh lọ
  function drawPipette(it) {
    const P = it.pip, G = PIPG[it.img], m = it.m, s = it.s; if (!P || !P.out || !G) return;
    const top = (G.cut - G.tip) * s + 0.08, hw = (G.stem[1] - G.stem[0]) * s * 0.4, tw = hw * 0.32, tl = 0.6;
    c.save(); c.translate(P.x, P.y);
    const body = new Path2D(); body.moveTo(-hw, top); body.lineTo(-hw, -tl); body.lineTo(-tw, 0); body.lineTo(tw, 0); body.lineTo(hw, -tl); body.lineTo(hw, top); body.closePath();
    c.fillStyle = 'rgba(236,243,248,0.5)'; c.fill(body);
    if (P.load > 0.01) { const lh = -top * 0.42 * P.load; c.save(); c.clip(body); c.fillStyle = rgba(P.hex, 0.88); c.fillRect(-hw, -lh, hw * 2, lh); c.restore(); }
    c.strokeStyle = 'rgba(64,84,100,0.85)'; c.lineWidth = 0.05; c.stroke(body);
    c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 0.04; c.beginPath(); c.moveTo(-hw * 0.4, top + 0.3); c.lineTo(-hw * 0.4, -tl - 0.1); c.stroke();
    c.save(); c.globalCompositeOperation = 'hard-light'; c.drawImage(IM[it.img], 0, 0, m.w, G.cut, -m.cx * s, -G.tip * s, m.w * s, G.cut * s); c.restore();
    c.restore();
  }
  function drawHaze(it) {
    const hz = it.haze; if (!hz || hz.k < 0.01 || !it.m || !it.m.prof) return;
    c.save(); c.clip(flatInner(it.m, it.s, -it.h * 0.98)); const g = c.createLinearGradient(0, -it.h, 0, 0); g.addColorStop(0, rgba(hz.hex, 0.28 * hz.k)); g.addColorStop(1, rgba(hz.hex, 0.62 * hz.k)); c.fillStyle = g; c.fillRect(-it.w, -it.h, it.w * 2, it.h); c.restore();
  }
  function drawCylinder(it) { if ((it.mL || 0) > 0.05) drawFlatLiquid(c, it.m, it.s, -cylLevel(it), WATER, 0.42); drawFlatImg(c, it.img, it.s); }
  function drawDish(it) {
    drawFlatImg(c, it.img, it.s);
    if (!it.content) return;
    const o = it.spec.opts || {}, k = it.holder || 1;
    if (o.chem) { const [col, kind] = FLAT_SOLID[o.chem] || ['#cfd4d9', 'strip']; for (let i = 0; i < (o.n || 1); i++) { c.save(); c.translate((i - ((o.n || 1) - 1) / 2) * 1.6, -2.3); c.rotate(1.45); drawFlatPiece(c, kind, col, 0.55, i + 1); c.restore(); } return; }
    if (o.form === 'vun') for (let i = 0; i < 9; i++) { c.save(); c.translate((i - 4) * 0.62 * k, -2.25 - (i % 2) * 0.35 * k); drawFlatPiece(c, 'pebble', STONE, 0.36 * k, i + 2); c.restore(); }
    else { c.save(); c.translate(0, -2.5 - 0.3 * k); drawFlatPiece(c, 'pebble', STONE, 0.95 * k, 1); c.restore(); }
  }
  // Tủ hút: ảnh khung tủ, đèn công tắc quạt (xanh khi chạy), cánh quạt trên ống thoát quay khi chạy, khí thoát ra thì phủ màu khí lên lòng tủ
  function drawHood(it) {
    const m = it.m, s = it.s, sy = it.sy || s;
    c.save(); c.scale(1, sy / s); drawFlatImg(c, it.img, s); c.restore(); // ảnh tủ co giãn riêng theo chiều dọc (layout)
    const L = { x: (m.w * HOOD.lamp[0] - m.cx) * s, y: (m.h * HOOD.lamp[1] - m.bottom) * sy };
    // phủ kín đèn vẽ sẵn trong ảnh: tắt quạt thì đèn xám, bật thì xanh và có quầng
    c.save(); c.beginPath(); c.arc(L.x, L.y, 1.25, 0, 6.3); c.fillStyle = it.on ? '#22c55e' : '#9ca3af'; c.fill(); c.lineWidth = 0.2; c.strokeStyle = 'rgba(40,46,54,0.6)'; c.stroke();
    if (it.on) { c.globalAlpha = 0.35 + 0.15 * Math.sin(T0 * 5); c.beginPath(); c.arc(L.x, L.y, 1.9, 0, 6.3); c.fillStyle = '#22c55e'; c.fill(); }
    c.restore();
    const D = { x: (m.w * HOOD.duct[0] - m.cx) * s, y: (m.h * HOOD.duct[1] - m.bottom) * sy }, r = 2.3, a0 = it.on ? T0 * 9 : 0;
    c.save(); c.translate(D.x, D.y); c.fillStyle = 'rgba(60,66,74,0.85)'; for (let k = 0; k < 3; k++) { c.save(); c.rotate(a0 + (k * Math.PI * 2) / 3); c.beginPath(); c.ellipse(r * 0.5, 0, r * 0.5, r * 0.18, 0, 0, 6.3); c.fill(); c.restore(); } c.beginPath(); c.arc(0, 0, 0.35, 0, 6.3); c.fill(); c.restore();
    if (it.on) { c.save(); c.strokeStyle = 'rgba(70,120,170,0.45)'; c.lineWidth = 0.22; c.lineCap = 'round'; for (let k = 0; k < 3; k++) { const x = (m.w * (0.35 + k * 0.15) - m.cx) * s, y0 = (m.h * 0.42 - m.bottom) * sy, ph = (T0 * 0.8 + k * 0.33) % 1, y = y0 - ph * 6; c.globalAlpha = 1 - ph; c.beginPath(); c.moveTo(x, y + 1.6); c.lineTo(x, y); c.lineTo(x - 0.6, y + 0.7); c.moveTo(x, y); c.lineTo(x + 0.6, y + 0.7); c.stroke(); } c.restore(); }
  }
  function drawHoodHaze(it) { const hz = it.haze; if (!hz || hz.k < 0.01) return; const m = it.m, s = it.s, sy = it.sy || s; c.save(); c.translate(it.pos.x, it.pos.y); c.fillStyle = rgba(hz.hex, 0.45 * hz.k); c.fillRect((m.w * HOOD.x0 - m.cx) * s, (m.h * HOOD.y0 - m.bottom) * sy, m.w * (HOOD.x1 - HOOD.x0) * s, m.h * (HOOD.floor - HOOD.y0) * sy); c.restore(); }
  // Đồng hồ khí độc: mặt trống của ảnh meter, mã vẽ cung ba vùng màu (An toàn · Cảnh báo · Nguy hiểm), kim theo B.meter, chữ của vùng đang đứng
  function drawMeter(it) {
    const m = it.m, s = it.s; drawFlatImg(c, it.img, s);
    const cx = (m.w * DIAL.c[0] - m.cx) * s, cy = (m.h * DIAL.c[1] - m.bottom) * s, R = m.w * DIAL.r * s, A0 = Math.PI * 1.15, A1 = Math.PI * 1.85, ang = (k) => A0 + (A1 - A0) * k;
    c.save(); c.lineWidth = R * 0.16; [[0, 0.4, '#16a34a'], [0.4, 0.75, '#d97706'], [0.75, 1, '#dc2626']].forEach(([a, b, col]) => { c.strokeStyle = col; c.beginPath(); c.arc(cx, cy, R, ang(a), ang(b)); c.stroke(); });
    const k = it.k || 0, a = ang(k); c.strokeStyle = '#111827'; c.lineWidth = R * 0.06; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * R * 0.92, cy + Math.sin(a) * R * 0.92); c.stroke(); c.fillStyle = '#111827'; c.beginPath(); c.arc(cx, cy, R * 0.09, 0, 6.3); c.fill();
    const zone = k < 0.4 ? 'An toàn' : k < 0.75 ? 'Cảnh báo' : 'Nguy hiểm'; c.fillStyle = k < 0.4 ? '#14532d' : k < 0.75 ? '#78350f' : '#7f1d1d'; c.font = `700 ${R * 0.3}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(zone, cx, cy + R * 0.38);
    c.restore();
  }
  function drawFunnel(it) {
    const m = it.m, s = it.s;
    drawFlatLiquid(c, m, s, -(m.bottom - m.h * 0.18) * s, '#eef2e6', 0.42); // HCl đặc trong bầu phễu (không ghi lượng)
    drawFlatImg(c, it.img, s);
    const ky = (m.h * 0.62 - m.bottom) * s, kx = 0; // khoá phễu: vạch chỉ hướng tay khoá (dọc = mở, ngang = khoá)
    c.save(); c.strokeStyle = it.on ? '#16a34a' : '#b91c1c'; c.lineWidth = 0.32; c.lineCap = 'round'; c.beginPath(); if (it.on) { c.moveTo(kx + 1.2, ky - 0.9); c.lineTo(kx + 1.2, ky + 0.9); } else { c.moveTo(kx + 0.4, ky); c.lineTo(kx + 2.2, ky); } c.stroke(); c.restore();
  }
  function drawSideFlask(it) {
    const m = it.m, s = it.s, bx = (m.cx - m.cx) * s;
    if (it.fizz > 0.02) drawFlatLiquid(c, m, s, -(m.floor * s + 2.2), '#5b2a6e', 0.55); // khi HCl nhỏ xuống: lớp chất lỏng tím sẫm sủi bọt (không ghi lượng)
    if (IM.kmno4_pile && META.kmno4_pile) { const k = META.kmno4_pile, ks = 5.2 / (k.right - k.left); c.save(); c.translate(bx, -(m.floor || 0) * s - 0.1); drawFlatImg(c, 'kmno4_pile', ks); c.restore(); }
    drawBubbles(it, it.bub);
    drawFlatImg(c, it.img, s);
  }
  function drawGasWash(it) { const m = it.m, s = it.s; drawFlatLiquid(c, m, s, -it.h * 0.45, WATER, 0.36); drawBubbles(it, it.bub); drawFlatImg(c, it.img, s); }
  function drawBeaker(it) {
    const m = it.m, s = it.s, o = it.spec.opts || {}, B = B_cur;
    if (o.fill == null) drawFlatLiquid(c, m, s, -it.h * 0.5, WATER, 0.36);
    else { const R = B.d.rinse, w = R && R.waste === it.id ? B.waste : null, ml = w ? w.mL : 0, fl = (m.floor || 0) * s; // cốc thải: mực theo lượng đã đổ vào, màu hoà
      const k = w ? Math.min(0.8, (0.8 * ml) / ((R && R.wasteMl) || 50)) : o.fill; if (k > 0.004) drawFlatLiquid(c, m, s, -(fl + k * (it.h - fl)), w ? w.hex : WATER, 0.55); }
    drawBubbles(it, it.bub); drawFlatImg(c, it.img, s);
  }
  function drawSink(it) {
    drawFlatImg(c, it.img, it.s);
    if (B_cur.sinkFlow && it.m) { const x = (it.m.w * SPOUT[0] - it.m.cx) * it.s, y = (it.m.h * SPOUT[1] - it.m.bottom) * it.s; c.save(); c.strokeStyle = 'rgba(120,175,225,0.85)'; c.lineWidth = 0.35; c.beginPath(); c.moveTo(x, y); c.lineTo(x, -it.h * 0.25); c.stroke(); c.restore(); }
    const tp = B_cur.tap; if (tp && it.m && B_cur.d.rinse && B_cur.d.rinse.sink === it.id) { // nước máy chảy từ miệng vòi tới miệng ống (hoặc xuống lòng chậu)
      const x = (it.m.w * SPOUT[0] - it.m.cx) * it.s, y = (it.m.h * SPOUT[1] - it.m.bottom) * it.s, yb = (typeof tp.to === 'function' ? tp.to() : tp.to) - it.pos.y;
      c.save(); const g = c.createLinearGradient(0, y, 0, yb); g.addColorStop(0, 'rgba(150,195,235,0.95)'); g.addColorStop(1, 'rgba(120,175,225,0.8)'); c.strokeStyle = g; c.lineCap = 'round';
      c.lineWidth = 0.3; c.beginPath(); c.moveTo(x, y + 0.1); c.lineTo(x + 0.03 * Math.sin(T0 * 31), yb); c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 0.07; c.beginPath(); c.moveTo(x - 0.06, y + 0.2); c.lineTo(x - 0.06, yb - 0.1); c.stroke(); c.restore(); }
  }
  // Giá sắt: ảnh giá + kẹp vươn từ cán giá tới cổ bình cầu đứng bên phải
  function drawStand(it) {
    drawFlatImg(c, it.img, it.s);
  }
  function drawClampOf(st) {
    const fl = Object.values(st.B.items).find((x) => x.kind === 'sideflask'); if (!fl || !IM.clamp || !META.clamp) return;
    const m = st.m, rodX = st.pos.x + (741 - m.cx) * st.s, neck = { x: fl.pos.x, y: fl.pos.y - fl.h * 0.72 }, C = META.clamp, dist = neck.x - rodX; if (dist < 2) return;
    // ảnh kẹp: hàm kẹp ở mép trái (tâm hàm ~12% bề ngang), khớp gắn vào cán ở ~88%. Lật ngang để hàm kẹp nằm ở cổ bình bên phải, khớp ở cán giá bên trái
    const cs = dist / ((0.88 - 0.12) * C.w); c.save(); c.translate(rodX + (0.88 * C.w - C.cx) * cs, neck.y + (C.bottom - C.h / 2) * cs); c.scale(-1, 1); drawFlatImg(c, 'clamp', cs); c.restore();
  }
  // Ống dẫn khí giữa hai món (bàn khai pipes): ống thuỷ tinh vẽ bằng mã; khí màu chạy dọc ống theo B.flow
  function outPort(it) {
    if (it.kind === 'sideflask') return P(it, ...PORT.sideflask.out);
    if (it.kind === 'gaswash') return P(it, ...PORT.gaswash.out);
    return { x: it.pos.x + it.w * 0.12, y: it.pos.y - it.h - 0.2, up: true };
  }
  function inPort(it) {
    if (it.kind === 'gaswash') return { ...P(it, ...PORT.gaswash.in), side: true };
    const h = it.home; return { x: h.x - it.w * 0.12, y: h.y - it.h - 0.2, deep: h.y - it.h * (it.kind === 'jar' ? 0.3 : 0.16) }; // ống cắm vào miệng, xuống gần đáy (cốc nhấc ra thì ống vẫn ở chỗ cũ)
  }
  function pipePath(a, b) {
    const A = outPort(a), T = inPort(b), pts = [A];
    if (T.side) { const mx = (A.x + T.x) / 2; pts.push({ x: mx, y: A.y }, { x: mx, y: T.y }, T); }
    else {
      const yTop = Math.min(A.y, T.y) - 3;
      if (A.up) pts.push({ x: A.x, y: yTop }); else pts.push({ x: A.x + 1.2, y: A.y }, { x: A.x + 1.2, y: yTop });
      pts.push({ x: T.x, y: yTop }, T, { x: T.x, y: T.deep });
    }
    return pts;
  }
  function strokePath(pts, upto) {
    c.beginPath(); c.moveTo(pts[0].x, pts[0].y); let left = upto;
    for (let i = 1; i < pts.length && left > 0; i++) { const p = pts[i - 1], q = pts[i], d = Math.hypot(q.x - p.x, q.y - p.y), k = Math.min(1, left / Math.max(d, 1e-6)); c.lineTo(p.x + (q.x - p.x) * k, p.y + (q.y - p.y) * k); left -= d; }
    c.stroke();
  }
  function drawPipes(B) {
    const on = B.pipes.filter((p) => p.on && p.a.visible && p.b.visible); if (!on.length) return; // chỉ vẽ đoạn đã nối (B.pipe / pipesOff)
    const paths = on.map((p) => pipePath(p.a, p.b)), lens = paths.map((p) => p.reduce((s, q, i) => s + (i ? Math.hypot(q.x - p[i - 1].x, q.y - p[i - 1].y) : 0), 0)), total = lens.reduce((s, l) => s + l, 0);
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    paths.forEach((p) => { c.strokeStyle = 'rgba(90,104,118,0.55)'; c.lineWidth = 0.62; strokePath(p, 1e9); c.strokeStyle = GLASSTUBE; c.lineWidth = 0.44; strokePath(p, 1e9); });
    if (B.flowK > 0.001) { // khí chạy lần lượt qua từng đoạn ống theo thứ tự nối
      let left = B.flowK * total;
      paths.forEach((p, i) => { const use = Math.min(lens[i], left); left -= use; if (use <= 0) return;
        c.strokeStyle = rgba(B.flowHex, 0.9); c.lineWidth = 0.3; strokePath(p, use);
        c.setLineDash([0.5, 0.7]); c.lineDashOffset = -T0 * 6; c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 0.14; strokePath(p, use); c.setLineDash([]); });
    }
    paths.forEach((p) => { c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 0.08; strokePath(p, 1e9); });
    c.restore();
  }
  // Bộ đo khí của bài mẫu: xi-lanh nằm ngang (pit-tông theo lượng khí), trụ đỡ, nút cao su + ống dẫn từ miệng bình lên vòi xi-lanh. open = 1: nút nhấc khỏi miệng bình.
  const rigPostX = (it) => it.tipX + it.dir * (SYR.full - SYR.tip) * it.s * 0.78;
  function drawPost(it) { const px = rigPostX(it); c.save(); c.strokeStyle = '#8a9099'; c.lineWidth = 0.55; c.beginPath(); c.moveTo(px, -it.host.elev); c.lineTo(px, it.axisY + 1.4); c.stroke(); c.fillStyle = '#6b7178'; c.fillRect(px - 2.2, -it.host.elev - 0.45, 4.4, 0.45); c.restore(); }
  function drawRig(it) {
    const h = it.host, m = it.m, s = it.s, dir = it.dir, axis = it.axisY, tipX = it.tipX;
    const vol = clamp(it.vol || 0, 0, 100), xh = SYR.zero + (SYR.full - SYR.zero) * (vol / 100), dpx = SYR.full - xh;
    const ox = tipX - dir * (SYR.tip - m.cx) * s, oy = axis + (m.bottom - SYR.axis) * s;
    const px = rigPostX(it); c.save(); c.lineWidth = 0.35; c.strokeStyle = '#5b6168'; c.beginPath(); c.ellipse(px, axis, 0.5, (SYR.axis - 38) * s * 0.75, 0, 0, 6.3); c.stroke(); c.restore();
    c.save(); c.translate(ox, oy); if (dir < 0) c.scale(-1, 1);
    drawFlatImg(c, it.img, s, { sx: 0, sw: SYR.full });
    for (let x = SYR.full; x < SYR.head[1]; x += SYR.fill[1] - SYR.fill[0]) { c.save(); c.translate((x - SYR.fill[0]) * s, 0); c.beginPath(); c.rect((SYR.fill[0] - m.cx) * s, -m.bottom * s, Math.min(SYR.fill[1] - SYR.fill[0], SYR.head[1] - x) * s, m.h * s); c.clip(); drawFlatImg(c, it.img, s, { sx: SYR.fill[0], sw: SYR.fill[1] - SYR.fill[0] }); c.restore(); }
    drawFlatImg(c, it.img, s, { sx: SYR.flange[0], sw: SYR.flange[1] - SYR.flange[0] });
    if (vol > 0.05) { c.fillStyle = 'rgba(214,232,246,0.35)'; c.fillRect((SYR.zero - m.cx) * s, (SYR.axis - 150 - m.bottom) * s, (xh - SYR.zero) * s, 300 * s); }
    const rw = SYR.rodFill[1] - SYR.rodFill[0], hs = xh + ROD;
    for (let x = xh + (SYR.head[1] - SYR.head[0]); x < hs; x += rw) { c.save(); c.translate((x - SYR.rodFill[0]) * s, 0); c.beginPath(); c.rect((SYR.rodFill[0] - m.cx) * s, -m.bottom * s, Math.min(rw, hs - x) * s, m.h * s); c.clip(); drawFlatImg(c, it.img, s, { sx: SYR.rodFill[0], sw: rw }); c.restore(); }
    c.save(); c.translate((hs - SYR.handle[0]) * s, 0); drawFlatImg(c, it.img, s, { sx: SYR.handle[0], sw: SYR.handle[1] - SYR.handle[0] }); c.restore();
    c.save(); c.translate(-dpx * s, 0); drawFlatImg(c, it.img, s, { sx: SYR.head[0], sw: SYR.head[1] - SYR.head[0] }); c.restore();
    c.restore();
    const k = clamp(it.open ?? 1, 0, 1), mo = k > 0.02 ? { x: h.home.x, y: h.home.y - h.h } : { x: h.pos.x, y: h.pos.y - h.h }, nw = h.m && h.m.prof ? (h.m.prof[0][2] - h.m.prof[0][1]) * h.s : 2.2;
    const sx = mo.x + dir * 1.9 * k, sy = mo.y - 3.2 * k, rot = dir * 0.55 * k, sh = 1.5;
    c.save(); c.strokeStyle = RUBBER; c.lineWidth = 0.42; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); const r = 1.6; c.moveTo(sx, sy - sh * 0.9); c.lineTo(sx, axis + r); c.quadraticCurveTo(sx, axis, sx + dir * r, axis); c.lineTo(tipX, axis); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = 0.1; c.stroke(); c.restore();
    c.save(); c.translate(sx, sy); c.rotate(rot); c.fillStyle = RUBBER; c.beginPath(); c.moveTo(-nw * 0.62, -sh); c.lineTo(nw * 0.62, -sh); c.lineTo(nw * 0.47, 0.45); c.lineTo(-nw * 0.47, 0.45); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(-nw * 0.55, -sh, nw * 1.1, 0.22); c.restore();
  }
  // Tivi phản ứng (bước "Nhìn vào trong"): phân tử halogen gặp hai ion halide. react: electron đi từ ion sang phân tử, thành ion mới và phân tử mới; không thì bật ra, không đổi.
  function drawTV(it) {
    const w = it.w, h = it.h, sc = it.scene;
    c.save(); c.fillStyle = '#111827'; c.beginPath(); c.roundRect(-w / 2, -h, w, h, 2.2); c.fill();
    const sx = -w / 2 + 1.6, sy = -h + 1.6, sw = w - 3.2, shh = h - 3.2; c.fillStyle = '#17182d'; c.beginPath(); c.roundRect(sx, sy, sw, shh, 1.2); c.fill();
    c.beginPath(); c.roundRect(sx, sy, sw, shh, 1.2); c.clip();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    if (!sc) { c.fillStyle = '#c1c0d6'; c.font = `500 2.2px ${FONT}`; c.fillText('Chọn một cặp chất ở bảng bên phải', 0, sy + shh / 2); c.restore(); return; }
    c.fillStyle = '#f1f5fb'; c.font = `600 2.4px ${FONT}`; { const t = sc.title || '', wd = c.measureText(t).width; if (wd > sw * 0.9) c.font = `600 ${2.4 * (sw * 0.9) / wd}px ${FONT}`; c.fillText(t, 0, sy + 3); }
    const atom = (x, y, r, col, lab) => { c.beginPath(); c.arc(x, y, r, 0, 6.3); const g = c.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r); g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, col); g.addColorStop(1, rgba(col, 1, 0.55)); c.fillStyle = g; c.fill(); if (lab) { c.fillStyle = '#0b1020'; c.font = `700 ${r * 0.62}px ${FONT}`; c.fillText(lab, x, y + r * 0.04); } };
    const sym = (t) => String(t || '').replace(/[₀-₉⁰-⁹⁺⁻]/g, ''), A = sym(sc.a), Bs = sym(sc.b), COL = { Cl: '#b5d334', Br: '#d9772b', I: '#7c3aed' }, ca = COL[A] || '#9ca3af', cbc = COL[Bs] || '#9ca3af';
    const p = (it.sceneT % 6) / 6, y = sy + shh * 0.52, ra = 2.6, rb = 3.1, mid = 0;
    const appr = clamp(p / 0.35, 0, 1), react = !!sc.react, after = react && p > 0.55, back = !react && p > 0.45;
    const ax = lerp(-sw * 0.32, mid - 4.2, appr), bx = lerp(sw * 0.32, mid + 4.6, appr);
    if (!after) {
      const sep = back ? lerp(0, 1, clamp((p - 0.45) / 0.3, 0, 1)) : 0, axx = back ? lerp(mid - 4.2, -sw * 0.3, sep) : ax, bxx = back ? lerp(mid + 4.6, sw * 0.3, sep) : bx;
      atom(axx, y - ra * 0.95, ra, ca, A); atom(axx, y + ra * 0.95, ra, ca, A); // phân tử halogen: hai nguyên tử dính nhau
      atom(bxx, y - rb * 1.4, rb, cbc, Bs + '⁻'); atom(bxx, y + rb * 1.4, rb, cbc, Bs + '⁻');
      if (react && p > 0.4) { const q = (p - 0.4) / 0.15; [-1, 1].forEach((sg) => { c.beginPath(); c.arc(lerp(bx, ax, q), y + sg * lerp(rb * 1.4, ra * 0.95, q), 0.6, 0, 6.3); c.fillStyle = '#facc15'; c.fill(); }); } // electron đi từ ion halide sang phân tử halogen
    } else {
      const q = clamp((p - 0.55) / 0.3, 0, 1), prods = (sc.products || []).map((t) => String(t).trim());
      const ionLab = (prods.find((t) => /⁻/.test(t)) || A + '⁻').replace(/^\d+/, ''), molLab = sym((prods.find((t) => !/⁻/.test(t)) || Bs + '₂').replace(/^\d+/, ''));
      atom(lerp(mid - 4.2, -sw * 0.3, q), y - 4.5, ra * 1.05, ca, sym(ionLab) + '⁻'); atom(lerp(mid - 4.2, -sw * 0.3, q), y + 4.5, ra * 1.05, ca, sym(ionLab) + '⁻');
      atom(lerp(mid + 4.6, sw * 0.28, q), y - rb * 0.9, rb * 0.92, cbc, molLab); atom(lerp(mid + 4.6, sw * 0.28, q), y + rb * 0.9, rb * 0.92, cbc, molLab);
    }
    const fit = (t, size, weight, y) => { let f = size; c.font = `${weight} ${f}px ${FONT}`; const wd = c.measureText(t).width; if (wd > sw * 0.9) { f *= (sw * 0.9) / wd; c.font = `${weight} ${f}px ${FONT}`; } c.fillText(t, 0, y); };
    if (sc.note) { c.fillStyle = '#c1c0d6'; fit(sc.note, 1.9, 500, sy + shh - 2.6); }
    c.restore();
  }
  // Kệ xếp hạng: hai chân, mặt kệ chia ô, chữ của từng ô trên mặt trước kệ; xếp đúng (B.switch) thì mặt kệ sáng lime
  function drawShelf(it) {
    const w = it.w, h = it.h, n = it.K.labels.length, cw = w / n, bh = 1.6;
    c.save(); c.fillStyle = '#8a9099'; c.fillRect(-w / 2 + 1, -h, 0.8, h); c.fillRect(w / 2 - 1.8, -h, 0.8, h);
    c.fillStyle = it.on ? '#c1ff24' : '#f1f5f9'; c.strokeStyle = it.on ? '#14624f' : '#94a3b8'; c.lineWidth = 0.15; c.beginPath(); c.roundRect(-w / 2, -h, w, bh, 0.3); c.fill(); c.stroke();
    c.fillStyle = '#0f172a'; c.textAlign = 'center'; c.textBaseline = 'middle';
    it.K.labels.forEach((t, i) => { let f = 1.05; c.font = `700 ${f}px ${FONT}`; const wd = c.measureText(t).width; if (wd > cw * 0.86) { f *= (cw * 0.86) / wd; c.font = `700 ${f}px ${FONT}`; } c.fillText(t, -w / 2 + cw * (i + 0.5), -h + bh / 2); if (i) { c.fillStyle = '#94a3b8'; c.fillRect(-w / 2 + cw * i - 0.06, -h + 0.15, 0.12, bh - 0.3); c.fillStyle = '#0f172a'; } });
    c.restore();
  }
  let B_cur = null;
  function drawItem(it) {
    if (!it.visible) return;
    if (it.kind === 'gasrig') { if (it.host && it.m) drawRig(it); return; }
    placeItem(it, () => {
      if (B_cur.vessel[it.id]) return drawVessel(B_cur.vessel[it.id]);
      if (it.K.tv) return drawTV(it);
      if (it.K.shelf) return drawShelf(it);
      if (!it.img) return placeholder(it);
      if (it.K.label) return drawBottleLike(it);
      switch (it.kind) {
        case 'cylinder': return drawCylinder(it);
        case 'dish': return drawDish(it);
        case 'hood': return drawHood(it);
        case 'gasmeter': return drawMeter(it);
        case 'dropfunnel': return drawFunnel(it);
        case 'sideflask': return drawSideFlask(it);
        case 'gaswash': return drawGasWash(it);
        case 'beaker': return drawBeaker(it);
        case 'sink': return drawSink(it);
        case 'stand': return drawStand(it);
        case 'spatula': drawFlatImg(c, it.img, it.s); if (it.powder) { c.fillStyle = '#1c1c1e'; c.beginPath(); c.ellipse(0, -it.h * 0.94, 0.55, 0.3, 0, 0, 6.3); c.fill(); } return;
        default: break;
      }
      drawFlatImg(c, it.img, it.s, { flip: !!it.flip });
      if (it.kind === 'timer') lcdText(it, fmt(it.time || 0, 1), 's');
      if (it.kind === 'balance') lcdText(it, fmt(it.value ?? 0, 2), 'g');
      if (it.kind === 'lamp' && it.lit) { const fh = 2.4 * (1 + 0.06 * Math.sin(T0 * 23)); c.save(); c.globalCompositeOperation = 'screen'; const g = c.createRadialGradient(0, -it.h - fh * 0.4, 0.1, 0, -it.h - fh * 0.4, fh); g.addColorStop(0, 'rgba(255,240,170,0.95)'); g.addColorStop(1, 'rgba(255,120,20,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(0, -it.h - fh * 0.45, 0.6, fh * 0.6, 0, 0, 6.3); c.fill(); c.restore(); }
      if (it.kind === 'hotplate' && (it.temp || 25) > 26) { c.fillStyle = 'rgba(255,90,40,0.35)'; c.fillRect(-it.w * 0.32, -it.h * 0.72, it.w * 0.64, 0.5); }
    });
  }
  function drawStream(B) { const st = B.stream; if (!st) return; const yb = st.to.surfaceY(); c.save(); c.strokeStyle = rgba(st.color, 0.85); c.lineWidth = st.w; c.lineCap = 'round'; c.beginPath(); c.moveTo(st.x, st.y); c.lineTo(st.x + 0.05 * Math.sin(T0 * 30), Math.max(st.y + 0.2, yb)); c.stroke(); c.restore(); }
  // Các dòng chảy rời (đổ vào cốc thải, đổ nước đi, tia bình tia): mỗi dòng từ (x0, y0) tới (x1, y1), số hoặc hàm; arc: dòng cong như tia nước
  function drawStreams(B) {
    const f = (v) => (typeof v === 'function' ? v() : v);
    B.streams.forEach((st) => { const x0 = f(st.x0), y0 = f(st.y0), x1 = f(st.x1), y1 = Math.max(y0 + 0.1, f(st.y1)); c.save(); c.strokeStyle = rgba(st.col, 0.85, 0.95); c.lineWidth = st.w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0);
      if (st.arc) c.quadraticCurveTo((x0 + x1) / 2, Math.min(y0, y1) - st.arc, x1, y1); else c.quadraticCurveTo(x0 + (x1 - x0) * 0.2, (y0 + y1) / 2, x1 + 0.03 * Math.sin(T0 * 29), y1); c.stroke(); c.restore(); });
  }
  function drawDrops(B) {
    B.drops.forEach((d) => { const y = d.to ? lerp(d.y0, d.to.surfaceY(), d.k) : d.y; c.save(); c.fillStyle = d.col ? rgba(d.col, 0.95, 0.92) : 'rgba(170,200,225,0.95)'; c.strokeStyle = 'rgba(40,60,80,0.45)'; c.lineWidth = 0.03;
      c.beginPath(); c.moveTo(d.x, y - 0.3); c.quadraticCurveTo(d.x + 0.16, y - 0.02, d.x, y + 0.13); c.quadraticCurveTo(d.x - 0.16, y - 0.02, d.x, y - 0.3); c.fill(); c.stroke(); c.restore(); }); // giọt hình hạt, đúng màu thuốc thử
    // phễu nhỏ giọt đang mở: giọt HCl đặc rơi từ cuống xuống bình cầu
    Object.values(B.items).forEach((it) => { if (it.kind !== 'dropfunnel' || !it.on || !it.m) return; const tip = { x: it.pos.x, y: it.pos.y }, fl = Object.values(B.items).find((x) => x.kind === 'sideflask'), yb = fl ? fl.pos.y - (fl.m.floor || 0) * fl.s - 2 : tip.y + 6;
      for (let k = 0; k < 2; k++) { const ph = (T0 * 1.6 + k * 0.5) % 1; c.save(); c.fillStyle = 'rgba(200,214,190,0.95)'; c.beginPath(); c.ellipse(tip.x, lerp(tip.y + 0.2, yb, ph), 0.16, 0.24, 0, 0, 6.3); c.fill(); c.restore(); } });
  }
  function ringsOn(B) {
    const on = new Set();
    if (hands && active === B.id && !B.seq.busy() && B.d.steps && B.d.steps.length) {
      if (B.run) { if (B.run.done && B.d.rinse) on.add(B.d.rinse.sink); }
      else { const n = nextStep(B); if (n) (n.ring || n.items || [n.item, ...(n.options || []).map((o) => o.item)]).filter(Boolean).forEach((id) => on.add(id)); }
    }
    Object.keys(B.pulse).forEach((id) => on.add(id));
    return on;
  }
  function drawRings(B) {
    const on = ringsOn(B), col = B.d.color || '#6254f4';
    on.forEach((id) => { const it = B.items[id]; if (!it || !it.visible || !it.touch || it.K.backdrop) return; const pulse = B.pulse[id] ? 0.5 + 0.5 * Math.sin(T0 * 9) : 0.55 + 0.25 * Math.sin(T0 * 4);
      c.save(); c.strokeStyle = rgba(col, 0.35 + 0.5 * pulse); c.lineWidth = 0.32; c.beginPath(); c.ellipse(it.home.x, it.home.y + 0.35, (it.L + it.R) * 0.5 + 0.9, 0.8, 0, 0, 6.3); c.stroke(); c.restore(); });
    // tủ hút đến lượt (bật quạt): khung sáng quanh đèn công tắc
    const hood = Object.values(B.items).find((it) => it.K.backdrop && on.has(it.id));
    if (hood) { const m = hood.m, x = hood.pos.x + (m.w * HOOD.lamp[0] - m.cx) * hood.s, y = hood.pos.y + (m.h * HOOD.lamp[1] - m.bottom) * (hood.sy || hood.s); c.save(); c.strokeStyle = rgba(col, 0.6 + 0.3 * Math.sin(T0 * 4)); c.lineWidth = 0.35; c.beginPath(); c.arc(x, y + 1.5, 3, 0, 6.3); c.stroke(); c.restore(); }
  }
  // NHÃN theo điểm ảnh màn hình. Món đứng trên bàn có nhãn ở dải mặt trước bàn (dưới chân món); xi-lanh, ống nghiệm trên giá, tủ hút có nhãn phía trên món.
  // Nhãn trùng chỗ nhau thì xuống (hoặc lên) hàng. Đường mảnh nối nhãn với chân món.
  const highTag = (it) => it.kind === 'gasrig' || it.kind === 'tube' || it.K.backdrop;
  function drawTags(B, V, dpr, obs = []) {
    const boxes = []; if (!names) return boxes;
    // Số hàng nhãn có hạn theo chiều cao khung (màn hẹp, khung thấp): nhãn của món đến lượt và món vừa XONG được xếp trước, nhãn không còn hàng thì không vẽ
    const narrow = V.rw < 620 * dpr, fs = (narrow ? 11 : 12) * dpr, padX = (narrow ? 6 : 8) * dpr, th = (narrow ? 20 : 22) * dpr, gapR = 4 * dpr, col = B.d.color || '#6254f4', toS = (x, y) => [V.OX + x * V.SC, V.OY + y * V.SC];
    // số hàng dải trước bàn theo chỗ còn lại dưới mặt bàn (cận cảnh: mặt bàn ở thấp, ít hàng hoặc không hàng nào)
    const lowFit = Math.floor((V.rh * 0.3 - 10 * dpr) / (th + gapR)), lowMax = B.zoomK > 0.01 ? clamp(Math.min(lowFit, Math.floor((V.ry + V.rh - V.OY - 12 * dpr) / (th + gapR))), 0, 6) : clamp(lowFit, 1, 6), highMax = clamp(Math.floor((V.rh * 0.24) / (th + gapR)), 1, 5), rows = Array.from({ length: lowMax }, () => []), up = [], hot = ringsOn(B);
    c.font = `600 ${fs}px ${FONT}`;
    const lst = Object.values(B.items).filter((it) => it.visible && it.spec.tag && !it.K.tv).map((it) => {
      const text = B.shown[it.id] ?? it.spec.tag, w = c.measureText(text).width + padX * 2;
      const [ax, ay] = it.kind === 'gasrig' ? toS(it.tipX + it.dir * (SYR.full - SYR.tip) * it.s * 0.5, it.axisY - 2.4) : it.K.backdrop ? toS(it.home.x, it.home.y - it.h) : highTag(it) ? toS(it.pos.x, it.pos.y - it.h - 0.6) : toS(it.placed || it.out ? it.pos.x : it.home.x, 0);
      return { it, text, w, ax, ay, high: highTag(it), pri: it.done || it.pop > 0 ? 0 : hot.has(it.id) ? 1 : 2 };
    }).sort((a, b) => a.pri - b.pri || a.ax - b.ax);
    const free = (row, l, r) => row.every(([a, b]) => r + 4 * dpr < a || l - 4 * dpr > b);
    const clear = (l, r, y) => obs.every((o) => r + 3 * dpr < o.l || l - 3 * dpr > o.r || y + th + 2 * dpr < o.t || y - 2 * dpr > o.b); // không đè ống hút, bộ đếm
    const inView = (t) => t.ax >= V.rx - 2 && t.ax <= V.rx + V.rw + 2 && t.ay >= V.ry - 2 && t.ay <= V.ry + V.rh + 2;
    const X0 = V.rx + 2, X1 = V.rx + V.rw - 2;
    lst.forEach((t) => {
      const l = clamp(t.ax - t.w / 2, X0, Math.max(X0, X1 - t.w)), r = l + t.w; let y;
      if (!inView(t) || (B.rinsing && (Math.abs(t.it.pos.x - t.it.home.x) > 0.05 || Math.abs(t.it.pos.y - t.it.home.y) > 0.05 || t.it.flip))) { t.skip = true; return; } // món ngoài khung (cận cảnh), món đang được mang đi rửa: không nhãn
      if (t.high) { const yk = (k) => t.ay - th - 4 * dpr - k * (th + gapR); let k = 0; while (k < highMax && yk(k) >= V.ry + 2 && !(free(up.filter((u) => u[2] === k), l, r) && clear(l, r, yk(k)))) k++; if (k < highMax && yk(k) < V.ry + 2) k = highMax; if (k >= highMax) { t.skip = true; return; } up.push([l, r, k]); y = yk(k); }
      else { // dải trước bàn: thử ngay dưới chân món, rồi lệch trái phải nửa nhãn, một nhãn; hết chỗ mới xuống hàng
        let k = 0, ll = null;
        for (; k < rows.length && ll == null; k++) for (const off of [0, -0.55, 0.55, -1.1, 1.1]) { const a = clamp(t.ax - t.w / 2 + off * t.w, X0, Math.max(X0, X1 - t.w)); if (free(rows[k], a, a + t.w) && clear(a, a + t.w, t.ay + 10 * dpr + k * (th + gapR))) { ll = a; break; } }
        if (ll == null) { t.skip = true; return; } k--; rows[k].push([ll, ll + t.w]); t.l = ll; t.y = t.ay + 10 * dpr + k * (th + gapR); return; }
      t.l = l; t.y = y;
    });
    lst.filter((t) => !t.skip).forEach((t) => {
      const done = t.it.done, pop = t.it.pop > 0 ? 1 + 0.08 * Math.sin(t.it.pop * 12) : 1;
      c.save(); c.strokeStyle = rgba(done ? '#14624f' : col, 0.55); c.lineWidth = 1 * dpr; c.beginPath(); if (t.high) { c.moveTo(t.l + t.w / 2, t.y + th); c.lineTo(t.ax, t.ay); } else { c.moveTo(t.l + t.w / 2, t.y); c.lineTo(t.ax, t.ay + 2 * dpr); } if (t.it.kind !== 'gasrig') c.stroke(); c.restore();
      c.save(); c.translate(t.l + t.w / 2, t.y + th / 2); c.scale(pop, pop);
      c.fillStyle = done ? '#c1ff24' : 'rgba(255,255,255,0.95)'; c.strokeStyle = done ? '#14624f' : rgba(col, 0.75); c.lineWidth = 1.2 * dpr; c.beginPath(); c.roundRect(-t.w / 2, -th / 2, t.w, th, th / 2); c.fill(); c.stroke();
      c.fillStyle = done ? '#102839' : '#14223a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t.text, 0, 0.5 * dpr); c.restore();
      boxes.push({ id: t.it.id, l: t.l, t: t.y, r: t.l + t.w, b: t.y + th, touch: t.it.touch });
    });
    B.tagRows = { low: rows.filter((r) => r.length).length, high: up.length ? Math.max(...up.map((u) => u[2])) + 1 : 0 };
    return boxes;
  }
  // Vẽ MỘT bàn vào khung R (điểm ảnh canvas): tường, mặt bàn, dụng cụ, ống dẫn, nhãn. tags = false: ảnh nhỏ (xem cả phòng, snapshot)
  // CẢNH TỰ VẼ (27/11, bài sa bàn không có ảnh dụng cụ sẵn): bàn khai scene2d = { attach(B), draw(c, B, R, info), hit(sx, sy, B) } thì cả phần hình của bàn do scene2d vẽ
  // (sơ đồ nhà máy, mặt cắt lò…) và tự bắt chạm (hit trả về id món). Việc, lời nhắc, lần chạy, nút sinh đôi vẫn do bộ máy này lo như mọi bàn. Bàn không khai thì như cũ.
  function drawBench(B, R, { tags = true, dpr = 1 } = {}) {
    B_cur = B;
    if (B.d.scene2d) { c.save(); c.beginPath(); c.rect(R.x, R.y, R.w, R.h); c.clip(); B.d.scene2d.draw(c, B, R, { dpr, t: T0, names, tags }); c.restore(); B.view = { SC: 1, OX: 0, OY: 0, rx: R.x, ry: R.y, rw: R.w, rh: R.h }; return []; }
    const rows = B.tagRows || { low: 1, high: 0 }, rowH = R.w < 620 * dpr ? 24 : 26, FRONT = tags ? (14 + Math.max(1, rows.low) * rowH) * dpr : 6 * dpr, TOP = tags ? (rows.high ? rows.high * rowH + 10 : 6) * dpr : 4 * dpr;
    const bd = B.bounds, sw = bd.x1 - bd.x0, SC0 = Math.min(R.w / sw, Math.max(10, R.h - FRONT - TOP) / bd.top), OX0 = R.x + (R.w - sw * SC0) / 2 - bd.x0 * SC0;
    const island = B.d.island !== false, OY0 = island ? Math.max(R.y + TOP + bd.top * SC0, R.y + (R.h - bd.top * SC0 - FRONT - TOP) / 2 + TOP + bd.top * SC0) : R.y + (R.h + bd.top * SC0) / 2;
    const { SC, OX, OY } = tags ? closeView(B, R, SC0, OX0, OY0, TOP, FRONT, dpr) : { SC: SC0, OX: OX0, OY: OY0 };
    const V = { SC, OX, OY, rx: R.x, ry: R.y, rw: R.w, rh: R.h }; B.view = V;
    c.save(); c.beginPath(); c.rect(R.x, R.y, R.w, R.h); c.clip();
    const g = c.createLinearGradient(0, R.y, 0, OY); g.addColorStop(0, '#eef1f5'); g.addColorStop(1, '#d6dce4'); c.fillStyle = g; c.fillRect(R.x, R.y, R.w, (island ? OY : R.y + R.h) - R.y);
    if (island) { c.fillStyle = 'rgb(84,85,90)'; c.fillRect(R.x, OY, R.w, 1.2 * SC); c.fillStyle = 'rgb(62,63,68)'; c.fillRect(R.x, OY + 1.2 * SC, R.w, R.y + R.h - OY); }
    c.setTransform(SC, 0, 0, SC, OX, OY);
    const back = Object.values(B.items).filter((it) => it.visible && it.K.backdrop);
    back.forEach(drawItem);
    drawRings(B);
    const order = Object.values(B.items).filter((it) => it.visible && !it.K.backdrop).sort((a, b) => (a.kind === 'gasrig') - (b.kind === 'gasrig') || (a.kind === 'rack') - (b.kind === 'rack') || a.z - b.z || a.elev - b.elev);
    order.forEach((it) => { if (it.kind === 'gasrig' && it.host && it.m) drawPost(it); });
    order.forEach((it) => { if (it.kind === 'stand') drawClampOf(it); });
    order.forEach((it) => { if (it.kind !== 'gasrig' && it.kind !== 'rack') drawItem(it); });
    drawTrays(B); // thành trước của khay che chân lọ như thật
    order.forEach((it) => { if (it.kind === 'rack') drawItem(it); }); // giá ống vẽ sau ống: tấm trước của giá che chân ống như thật
    drawPipes(B);
    B.fly.forEach((p) => p.ps.forEach((q) => { c.save(); c.translate(p.f.x + q.dx * 0.6, p.f.y); drawFlatPiece(c, q.kind, q.col, q.r, q.seed); c.restore(); }));
    order.forEach((it) => { if (it.kind === 'gasrig') drawItem(it); });
    Object.values(B.items).forEach((it) => { if (it.visible && it.kind !== 'gasrig' && !it.K.backdrop && (Math.abs(it.pos.x - it.home.x) > 0.01 || Math.abs(it.pos.y - it.home.y) > 0.01) && !it.out) drawItem(it); }); // món đang được cầm vẽ trên cùng
    back.forEach((it) => drawHoodHaze(it));
    order.forEach((it) => { if (it.pip && it.pip.out) drawPipette(it); }); // ống hút đang ngoài lọ: vẽ trên cùng
    drawStream(B); drawStreams(B); drawDrops(B);
    c.setTransform(1, 0, 0, 1, 0, 0);
    drawPlates(B, V, dpr);
    const cnt = tags ? counterBox(B, V, dpr) : null, obs = tags ? pipBoxes(B, V, dpr) : [];
    if (cnt) obs.push(cnt);
    const boxes = tags ? drawTags(B, V, dpr, obs) : [];
    if (cnt) drawCounter(B, cnt, dpr);
    c.restore();
    return boxes;
  }
  // CẬN CẢNH: khung cả bàn (SC0, OX0, OY0) chuyển dần (B.zoomK, update) sang khung vừa cụm đang dùng (B.focus): vừa cả bề ngang lẫn bề cao vùng vẽ;
  // còn dư bề cao thì hạ khung cho mặt bàn nằm ở đáy vùng vẽ (không để mặt bàn trống chiếm chỗ). Khung cụm đi theo món đang chạy (mềm, không giật).
  function focusBox(B) {
    const F = B.focus; let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; const add = (x, y) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); };
    F.ids.forEach((id) => { const it = B.items[id]; if (!it || !it.visible) return; add(it.pos.x - it.L, it.pos.y - it.h); add(it.pos.x + it.R, it.pos.y); });
    F.pts.forEach((p) => { const q = typeof p === 'function' ? p() : p; if (q) add(q.x, q.y); });
    if (!Number.isFinite(x0)) return null;
    const pad = 0.8; return { x0: x0 - pad, x1: x1 + pad, y0: y0 - pad, y1: Math.min(y1 + pad, Math.max(y1, 0.4)) };
  }
  function closeView(B, R, SC0, OX0, OY0, TOP, FRONT, dpr) {
    const dt = clamp(T0 - (B.fT ?? T0), 0, 0.1); B.fT = T0;
    const tb = B.focus ? focusBox(B) : null;
    if (tb) { if (!B.fcur || B.zoomK < 0.002) B.fcur = tb; else { const k = 1 - Math.exp(-dt * 4.5); ['x0', 'x1', 'y0', 'y1'].forEach((q) => { B.fcur[q] = lerp(B.fcur[q], tb[q], k); }); } }
    if (!B.fcur || B.zoomK < 0.002) return { SC: SC0, OX: OX0, OY: OY0 };
    // cận cảnh không chừa dải nhãn trên (nhãn của món trong khung vẽ ngay trong khoảng trống phía trên món), dải trước bàn chừa đúng một hàng nhãn
    const fb = B.fcur, pad = 10 * dpr, low = Math.min(FRONT, (R.w < 620 * dpr ? 34 : 38) * dpr), A = { x: R.x + pad, y: R.y + 6 * dpr, w: R.w - 2 * pad, h: Math.max(10, R.h - 6 * dpr - low) };
    const scf = Math.max(SC0, Math.min(A.w / (fb.x1 - fb.x0), A.h / (fb.y1 - fb.y0))), oxf = A.x + A.w / 2 - ((fb.x0 + fb.x1) / 2) * scf;
    const oyc = A.y + A.h / 2 - ((fb.y0 + fb.y1) / 2) * scf, oyf = Math.max(oyc, Math.min(A.y + A.h, A.y - fb.y0 * scf));
    const cx = (sc, ox) => (A.x + A.w / 2 - ox) / sc, cy = (sc, oy) => (A.y + A.h / 2 - oy) / sc, k = ease(B.zoomK);
    const SC = Math.exp(lerp(Math.log(SC0), Math.log(scf), k)), X = lerp(cx(SC0, OX0), cx(scf, oxf), k), Y = lerp(cy(SC0, OY0), cy(scf, oyf), k);
    return { SC, OX: A.x + A.w / 2 - X * SC, OY: A.y + A.h / 2 - Y * SC };
  }
  // Ống hút đang ngoài lọ: khung trên màn (nhãn tránh ra)
  function pipBoxes(B, V, dpr) {
    return Object.values(B.items).filter((it) => it.pip && it.pip.out).map((it) => { const P = it.pip, hw = 0.75; return { l: V.OX + (P.x - hw) * V.SC, r: V.OX + (P.x + hw) * V.SC, t: V.OY + (P.y - pipTop(it)) * V.SC, b: V.OY + P.y * V.SC }; });
  }
  // BỘ ĐẾM cạnh ống đang nhận chất ("Nước chlorine · 7/20 giọt", "Sodium bromide · 1 mL"): bên phải ống, ngay trên miệng các ống (không đè ống, không đè ống hút)
  function counterBox(B, V, dpr) {
    const C = B.counter, it = C && B.items[C.id]; if (!it) return null;
    const fs = (V.rw < 620 * dpr ? 12 : 13) * dpr, th = (V.rw < 620 * dpr ? 24 : 26) * dpr; c.font = `700 ${fs}px ${FONT}`; const w = c.measureText(C.text).width + 18 * dpr;
    const xs = V.OX + it.pos.x * V.SC, half = Math.max(it.R * 0.75, 0.75) * V.SC, yc = V.OY + (it.pos.y - it.h - 1.6) * V.SC;
    const R0 = xs + half + 10 * dpr, L0 = xs - half - 10 * dpr - w; let l = C.side < 0 ? L0 : R0; if (l + w > V.rx + V.rw - 4 * dpr) l = L0; else if (l < V.rx + 4 * dpr) l = R0; l = clamp(l, V.rx + 4 * dpr, V.rx + V.rw - w - 4 * dpr);
    const t = clamp(yc - th / 2, V.ry + 4 * dpr, V.ry + V.rh - th - 4 * dpr);
    return { l, r: l + w, t, b: t + th, fs, th, ax: xs + (l > xs ? half * 0.4 : -half * 0.4), ay: V.OY + (it.pos.y - it.h) * V.SC };
  }
  function drawCounter(B, k, dpr) {
    const col = B.d.color || '#6254f4';
    c.save(); c.strokeStyle = rgba(col, 0.7); c.lineWidth = 1.2 * dpr; c.beginPath(); c.moveTo(k.l > k.ax ? k.l : k.r, k.t + k.th / 2); c.lineTo(k.ax, k.ay - 2 * dpr); c.stroke();
    c.fillStyle = col; c.beginPath(); c.roundRect(k.l, k.t, k.r - k.l, k.th, k.th / 2); c.fill();
    c.fillStyle = '#ffffff'; c.font = `700 ${k.fs}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(B.counter.text, (k.l + k.r) / 2, k.t + k.th / 2 + 0.5 * dpr); c.restore();
  }
  // Ô thu nhỏ của các bàn (xem cả phòng): lưới tự chia theo bề ngang, tên bàn dưới mỗi ô
  let tiles = [], tagBoxes = [];
  function safeRect(dpr) {
    const W = cv.width, H = cv.height, ins = stage.insets || { l: 0, r: 0, t: 0, b: 0 };
    let top = H * (ins.t || 0), bot = H * (ins.b || 0);
    const hr = host.getBoundingClientRect(), k = W / Math.max(1, hr.width);
    host.querySelectorAll(':scope > .lk-eqcard:not([hidden]), :scope > .lk-modes').forEach((el) => { // thẻ phương trình, cụm nút 2D · 3D · Thực tế nằm trong sân khấu: chừa dải trống, bàn không vẽ dưới chúng
      const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
      if (r.top - hr.top < hr.height * 0.45) { top = Math.max(top, (r.bottom - hr.top + 6) * k); if (el.classList.contains('lk-eqcard')) bot = H * 0.03; } // thẻ phương trình đang ở trên: dải đáy labui chừa cho thẻ không cần nữa
      else bot = Math.max(bot, (hr.bottom - r.top + 6) * k);
    });
    const x = Math.round(W * (ins.l || 0)), y = Math.round(top), w = Math.max(10, W - x - Math.round(W * (ins.r || 0))), h = Math.max(10, H - y - Math.round(bot));
    return { x, y, w, h, dpr };
  }
  function drawOverview(R, dpr) {
    const n = list.length, asp = R.w / R.h, cols = Math.min(n, asp > 2.6 ? n : asp > 0.9 ? 2 : 1), rowsN = Math.ceil(n / cols), pad = 10 * dpr, cap = 30 * dpr;
    const tw = (R.w - pad * (cols + 1)) / cols, th = (R.h - pad * (rowsN + 1)) / rowsN; tiles = [];
    c.fillStyle = '#e9edf2'; c.fillRect(R.x, R.y, R.w, R.h);
    list.forEach((B, i) => {
      const x = R.x + pad + (i % cols) * (tw + pad), y = R.y + pad + Math.floor(i / cols) * (th + pad), r = { x, y, w: tw, h: th - cap };
      c.save(); c.beginPath(); c.roundRect(x, y, tw, th, 12 * dpr); c.fillStyle = '#ffffff'; c.fill(); c.strokeStyle = rgba(B.d.color || '#6254f4', 0.55); c.lineWidth = 2 * dpr; c.stroke(); c.clip();
      drawBench(B, r, { tags: false, dpr }); c.restore();
      c.save(); let fsz = 13 * dpr; c.font = `600 ${fsz}px ${FONT}`; const room = tw - 30 * dpr, wd = c.measureText(B.d.name).width; if (wd > room) { fsz = Math.max(9 * dpr, fsz * room / wd); c.font = `600 ${fsz}px ${FONT}`; } // tên bàn co lại cho vừa ô (màn hẹp)
      const nw = Math.min(room, c.measureText(B.d.name).width); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = B.d.color || '#6254f4'; c.beginPath(); c.arc(x + tw / 2 - nw / 2 - 9 * dpr, y + th - cap / 2, 4 * dpr, 0, 6.3); c.fill(); c.fillStyle = '#14223a'; c.fillText(B.d.name, x + tw / 2, y + th - cap / 2, room); c.restore();
      tiles.push({ id: B.id, l: x, t: y, r: x + tw, b: y + th });
    });
  }
  function draw() {
    const r = host.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2), W = Math.max(2, Math.round(r.width * dpr)), H = Math.max(2, Math.round(r.height * dpr));
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    c = ctx; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
    const R = safeRect(dpr);
    ctx.fillStyle = '#e9edf2'; ctx.fillRect(0, 0, W, H);
    if (active && benches[active]) { tiles = []; tagBoxes = drawBench(benches[active], R, { tags: true, dpr }); }
    else { tagBoxes = []; drawOverview(R, dpr); }
  }

  // ---------- Cập nhật theo thời gian (như update của 3D) ----------
  function bubblesIn(it, list, k, dt, fromY, topY, hw) {
    it._acc = (it._acc || 0) + dt * k * 55;
    while (it._acc >= 1) { it._acc -= 1; list.push({ x: (Math.random() * 2 - 1) * hw, y: fromY, r: 0.08 + Math.random() * 0.16, vy: 3 + Math.random() * 3 }); }
    list.forEach((b) => { b.y -= b.vy * dt; b.x += Math.sin(T0 * 6 + b.vy) * 0.01; });
    const keep = list.filter((b) => b.y > topY); list.length = 0; list.push(...keep.slice(-160));
  }
  function update(dt) {
    T0 += dt;
    list.forEach((B) => {
      const was = B.seq.busy(); B.seq.tick(dt); if (was && !B.seq.busy()) B.rinsing = false;
      if (B.run && !B.run.done && !B.rinsing && !B.seq.busy() && B.d.chem && B.d.chem.frame) {
        const sp = B.d.chem.speed; B.run.t += dt * (typeof sp === 'function' ? B.d.chem.speed(B) : sp || 1);
        const r = B.d.chem.frame(B, B.run.t);
        (B.run && B.run.marks || []).forEach((m) => { if (m.fired || B.run.t < m.at) return; m.fired = true; const it = B.items[m.tag]; if (it) { it.done = true; it.pop = 0.6; } if (m.ring) B.pulse[m.ring] = 2.4; if (cb.mark) cb.mark(B.id, m); });
        if (r && r.done && r.end) { B.run = null; emit(B); } // lần chạy kết thúc hẳn (bàn tự khoá phễu khi khí thoát ra): làm tiếp được, không cần rửa
        else if (r && r.done) { B.run.done = true; B.run.row = B.d.chem.row ? B.d.chem.row(B) : null; emit(B); if (cb.done) cb.done(B.id, B.run.row); }
      }
      Object.keys(B.pulse).forEach((id) => { B.pulse[id] -= dt; if (B.pulse[id] <= 0) delete B.pulse[id]; });
      if (B.focus) { if (B.seq.busy() || (B.run && !B.run.done)) B.focusHold = 0.8; else if ((B.focusHold -= dt) <= 0) B.focus = null; } // xong thao tác (và lần chạy ngắn sau nó) thì lùi ra
      B.zoomK = clamp(B.zoomK + (B.focus && active === B.id ? dt : -dt) / 0.7, 0, 1);
      Object.values(B.items).forEach((it) => {
        if (it.pop > 0) it.pop = Math.max(0, it.pop - dt);
        if (it.scene) it.sceneT = (it.sceneT || 0) + dt;
        if (it.m && it.m.prof && (it.fizz > 0 || it.bub.length) && !B.vessel[it.id]) { // sủi bọt của món không phải bình phản ứng (bình cầu, bình rửa khí, cốc)
          const lv = it.kind === 'sideflask' ? (it.m.floor || 0) * it.s + 2.2 : it.kind === 'gaswash' ? it.h * 0.45 : it.h * 0.5, hw = it.kind === 'sideflask' ? 2.2 : it.w * 0.18;
          bubblesIn(it, it.bub, it.fizz || 0, dt, -(it.m.floor || 0) * it.s - 0.4, -lv + 0.2, hw);
        }
      });
      Object.values(B.vessel).forEach((v) => { const k = v.fill > 0.05 ? v.bubbles : 0; if (k > 0 || v.bub.length) bubblesIn(v.item, v.bub, k, dt, -v.floor() - 0.4, -v.level() + 0.2, v.halfIn() * 0.62); });
    });
  }

  // Chạy xong ngay một lần chạy đang mở (preset): bước thời gian 0,25 s, mốc XONG đánh dấu, kết thúc như update()
  function finishRun(B) {
    for (let n = 0; B.run && !B.run.done && n < 400; n++) {
      B.run.t += 0.25; const r = B.d.chem.frame(B, B.run.t);
      (B.run && B.run.marks || []).forEach((m) => { if (!m.fired && B.run.t >= m.at) { m.fired = true; const it = B.items[m.tag]; if (it) it.done = true; } });
      if (r && r.done) { if (r.end) B.run = null; else { B.run.done = true; B.run.row = B.d.chem.row ? B.d.chem.row(B) : null; } }
    }
  }
  // ---------- Chạm ----------
  const toCanvas = (e) => { const r = cv.getBoundingClientRect(), k = cv.width / Math.max(1, r.width); return { sx: (e.clientX - r.left) * k, sy: (e.clientY - r.top) * k }; };
  function itemAt(p) {
    const B = active && benches[active]; if (!B || !B.view) return null;
    if (B.d.scene2d) { const id = B.d.scene2d.hit(p.sx, p.sy, B); return (id && B.items[id]) || null; }
    const tg = tagBoxes.find((b) => p.sx >= b.l && p.sx <= b.r && p.sy >= b.t && p.sy <= b.b); if (tg) return B.items[tg.id];
    const V = B.view, x = (p.sx - V.OX) / V.SC, y = (p.sy - V.OY) / V.SC;
    const hit = Object.values(B.items).filter((it) => it.visible && it.touch && it.kind !== 'gasrig' && !it.K.backdrop).filter((it) => { const pad = 0.6; return x >= it.pos.x - it.L - pad && x <= it.pos.x + it.R + pad && y >= it.pos.y - it.h - pad && y <= it.pos.y + 1.2; });
    if (hit.length) return hit.sort((a, b) => (a.L + a.R) * a.h - (b.L + b.R) * b.h)[0]; // nhiều món chồng nhau (phễu trên bình cầu): lấy món nhỏ nhất
    const hood = Object.values(B.items).find((it) => it.K.backdrop && it.visible && it.touch); // tủ hút: chạm vào khung tủ (ngoài các món) để bật/tắt quạt
    if (hood && x >= hood.pos.x - hood.L && x <= hood.pos.x + hood.R && y >= hood.pos.y - hood.h && y <= hood.pos.y) return hood;
    return null;
  }
  // KÉO TRÊN CẢNH TỰ VẼ (27/11, chủ: chỉnh ngay trên máy, không chỉ ở bảng): cảnh khai grab(sx, sy, B, set) trả { move(sx, sy), end(moved) } nếu điểm chạm là một núm;
  // set(key, value) báo ra ngoài qua sự kiện 'knob' (bài tự kiểm bước nào được chỉnh). Kéo quá 5 px mới tính là kéo; có kéo thì không tính là chạm.
  let grab = null, grabMoved = false, noClick = false;
  cv.addEventListener('pointerdown', (e) => {
    const B = active && benches[active]; if (!B || !B.d.scene2d || !B.d.scene2d.grab || e.button > 0) return;
    const p = toCanvas(e), g = B.d.scene2d.grab(p.sx, p.sy, B, (key, v) => { if (cb.knob) cb.knob(B.id, key, v); }); if (!g) return;
    grab = Object.assign(g, { x0: e.clientX, y0: e.clientY }); grabMoved = false; try { cv.setPointerCapture(e.pointerId); } catch (err) { /* trình duyệt cũ */ }
    e.preventDefault();
  });
  cv.addEventListener('pointermove', (e) => { if (!grab) return; if (!grabMoved && Math.hypot(e.clientX - grab.x0, e.clientY - grab.y0) < 5) return; grabMoved = true; const p = toCanvas(e); grab.move(p.sx, p.sy); });
  ['pointerup', 'pointercancel'].forEach((n) => cv.addEventListener(n, () => { if (!grab) return; if (grab.end) grab.end(grabMoved); noClick = grabMoved; grab = null; }));
  cv.addEventListener('click', (e) => {
    if (noClick) { noClick = false; return; }
    const p = toCanvas(e);
    if (!active) { const t = tiles.find((q) => p.sx >= q.l && p.sx <= q.r && p.sy >= q.t && p.sy <= q.b); if (t && cb.pick) cb.pick(t.id); return; }
    const it = itemAt(p); if (it && it.touch) hand(benches[active], it.id);
  });
  cv.addEventListener('pointermove', (e) => { const p = toCanvas(e); const ok = active ? (itemAt(p) || {}).touch : tiles.some((q) => p.sx >= q.l && p.sx <= q.r && p.sy >= q.t && p.sy <= q.b); cv.style.cursor = ok ? 'pointer' : 'default'; });

  decls.forEach(build);
  let raf = 0, last = 0, ticked = false;
  if (opts.loop !== false) {
    const loop = (t) => { const dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t; ticked = false; frameCbs.forEach((f) => f(dt)); if (!ticked) update(dt); draw(); raf = requestAnimationFrame(loop); }; // bài học tự gọi lab.update trong onFrame; trang thử thì bộ máy tự gọi
    raf = requestAnimationFrame(loop);
  }
  new ResizeObserver(() => { if (opts.loop === false) draw(); }).observe(host);
  list.forEach(emit);

  const noop = () => {};
  const api = {
    mode: '2d', stage, benches, CABINET: KIND2D, missing: MISSING.filter((k) => decls.some((d) => d.items.some((it) => it.kind === k))), canvas: cv,
    view: noop, frame: noop, zoomBy: noop, zoomReset() { stage.resetView(); }, zoomPct: () => 100, dragMode: () => 'none', // chỉ có nghĩa ở 3D
    setActive(id) { if (active && active !== id && benches[active]) { const A = benches[active]; A.seq.flush(); A.focus = null; A.zoomK = 0; } active = id && benches[id] ? id : ONE ? ONE.id : null; },
    active: () => active,
    setNames(on) { names = on; },
    setHands(on, msg = '') { hands = on; handsMsg = msg; },
    on(name, f) { cb[name] = f; },
    hand: (bid, itemId) => (benches[bid] ? hand(benches[bid], itemId) : undefined),
    act(bid, sid, k) {
      const B = benches[bid], s = B && B.d.steps.find((x) => x.id === sid); if (!s) return false;
      if (active !== bid || !hands) return false;
      const g = s.guard && can(B, s) && s.guard(B, pickOpt(B, s, s.range ? undefined : k) || optsOf(s)[0]); if (g) { say(g); return false; }
      if (act(B, s, pickOpt(B, s, s.range ? undefined : k))) return true;
      if (!B.seq.busy()) { const n = nextStep(B); say(B.run ? 'Thí nghiệm đã chạy. Rửa dụng cụ rồi mới làm lại được.' : n && n !== s ? `Làm việc này trước: ${n.label}.` : `Việc "${s.label}" đã làm.`); }
      return false;
    },
    rinse: (bid, instant) => (benches[bid] ? rinse(benches[bid], instant) : false),
    reset(bid) { const B = benches[bid]; if (!B) return; B.seq.flush(); reset(B); emit(B); },
    // Đặt sẵn bàn (dựng lại khi nạp trang): làm ngay các việc, chạy xong luôn từng lần chạy; 'rinse' = bàn về đầu (như 3D)
    preset(bid, todo) { const B = benches[bid]; if (!B) return; B.seq.flush(); reset(B); todo.forEach(([sid, k]) => { if (sid === 'rinse') { reset(B); return; } const s = B.d.steps.find((x) => x.id === sid); if (!s) return; act(B, s, pickOpt(B, s, k), true); finishRun(B); }); emit(B); },
    setup(bid, o) { const B = benches[bid]; if (!B) return; B.seq.flush(); B.opts = { ...(o || {}) }; reset(B); emit(B); },
    solo(bid, key) { const B = benches[bid]; if (!B) return; B.seq.flush(); B.solo = key || null; Object.values(B.items).forEach((it) => { if (it.spec.of) it.visible = !B.solo || it.spec.of === B.solo; }); layout(B); reset(B); emit(B); },
    setWant(bid, sid, v) { const B = benches[bid], s = B && B.d.steps.find((x) => x.id === sid); if (!s || !s.range || !Number.isFinite(v)) return s && s.range ? wantOf(B, s) : null; B.want[s.var] = snap(s.range, v); return B.want[s.var]; },
    enable(bid, sid, yes) { const B = benches[bid]; if (!B) return; if (yes) B.off.delete(sid); else B.off.add(sid); },
    // Ảnh nhỏ của một bàn (thẻ hình ở bước Xem cả phòng), vẽ trên một canvas riêng
    snapshot(id, ins = {}, tw = 312, th = 198) {
      const B = benches[id]; if (!B) return '';
      const off = document.createElement('canvas'); off.width = tw; off.height = th; const save = c; c = off.getContext('2d');
      c.fillStyle = '#e9edf2'; c.fillRect(0, 0, tw, th); drawBench(B, { x: 0, y: 0, w: tw, h: th }, { tags: false, dpr: 1 }); c = save;
      return off.toDataURL('image/jpeg', 0.86);
    },
    proc(bid) {
      const B = benches[bid]; if (!B) return null; const n = nextStep(B), busy = B.seq.busy();
      return {
        busy, run: B.run, level: B.level,
        steps: B.d.steps.filter((s) => !B.off.has(s.id)).map((s, i) => ({ id: s.id, n: i + 1, label: s.label, role: s.role, done: !!B.st[s.id], next: n === s && !busy, can: can(B, s),
          options: s.options ? s.options.map((o, k) => ({ k, label: o.label, on: !!B.st[s.id] && B.level[s.var] === o.v })) : null,
          range: s.range ? { ...s.range, want: wantOf(B, s), ref: (B.d.ref || {})[s.var], value: B.st[s.id] ? B.level[s.var] : null } : null })),
        rinse: B.d.rinse ? { label: B.d.rinse.label || 'Rửa dụng cụ, làm lại', can: !busy && (!!B.run || Object.keys(B.st).length > 0), next: !!(B.run && B.run.done) && !busy } : null,
      };
    },
    update(dt) { ticked = true; update(dt); }, draw,
    // Toạ độ màn hình (CSS px) của giữa thân một món ở bàn đang xem: để kiểm thử bấm chuột thật vào món
    screenOf(id, bid = active) { const B = benches[bid], it = B && B.items[id]; if (!it || !B.view) return null; const r = cv.getBoundingClientRect(), k = r.width / cv.width, V = B.view; return { x: r.left + (V.OX + it.pos.x * V.SC) * k, y: r.top + (V.OY + (it.pos.y - it.h / 2) * V.SC) * k }; },
    tileOf(id) { const t = tiles.find((q) => q.id === id); if (!t) return null; const r = cv.getBoundingClientRect(), k = r.width / cv.width; return { x: r.left + ((t.l + t.r) / 2) * k, y: r.top + ((t.t + t.b) / 2) * k }; },
    // Đọc nhanh trạng thái để kiểm thử
    peek(bid = active) {
      const B = benches[bid]; if (!B) return null;
      return { tags: { ...B.shown }, items: Object.fromEntries(Object.values(B.items).map((it) => [it.id, { x: +it.home.x.toFixed(2), w: +it.w.toFixed(2), h: +it.h.toFixed(2), vol: it.vol, mL: it.mL, value: it.value, time: it.time, open: it.open, done: it.done, visible: it.visible, on: it.on, fizz: it.fizz, k: it.k, out: it.out, haze: it.haze && it.haze.k, scene: !!it.scene }])),
        vessels: Object.fromEntries(Object.entries(B.vessel).map(([k, v]) => [k, { ppt: +(v.pptK || 0).toFixed(2), fill: +v.fill.toFixed(3), solidK: +v.solidK.toFixed(3), bubbles: +v.bubbles.toFixed(3), nBub: v.bub.length, solids: v.solids.length, tint: v.tintC, tintK: v.tintK }])),
        flow: B.flowK, tagBoxes: tagBoxes.map((b) => ({ ...b })), bounds: B.bounds };
    },
    destroy() { cancelAnimationFrame(raf); cv.remove(); },
  };
  return api;
}
