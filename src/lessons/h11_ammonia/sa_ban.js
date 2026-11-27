// SA BÀN nhà máy tổng hợp ammonia (CHEM11-04), dựng KHỐI bằng mã. Hướng chủ duyệt 27/11 (DEFINE_SA_BAN.md):
// mô hình trưng bày đặt trên bàn trong phòng lab, có việc làm bằng tay ngay trên mô hình, ống trong suốt để thấy dòng khí.
// Các khu theo tài liệu STEMLabs (docs/research/hoa-hoc.md mục CHEM11-04): bình N₂, bình H₂ · máy nén · tháp tổng hợp có xúc tác Fe · làm lạnh ngưng tụ NH₃ · đường tuần hoàn.
// CHẤT LIỆU (chủ 27/11 "Làm cách ghép"): bình khí, tháp, bồn NH₃, bộ làm lạnh là khối tròn xoay dựng theo đường viền ẢNH KHO 2D và dán chính ảnh đó
// (kit/khoi_tu_anh.js), nên 3D và 2D là cùng một món đồ thật; máy nén, van, khung phủ vân kim loại (phuVan) và thêm bu lông, mặt bích.
// Hình dáng là sơ đồ dạy học, không theo bản vẽ nhà máy nào. Mỗi khu là một món của bàn (kit/labset.js), trạng thái đặt qua userData.set(...) do lesson.js gọi.
import * as T from 'three';
import { canvasTexture } from '../../kit/materials.js';
import { pose, createUnit, mulberry, PATCHES, SLAB_R, RAD, YFE } from './be_mat_fe.js';
import { khoiTuAnh, coKhoi, phuVan } from '../../kit/khoi_tu_anh.js';

export const PL = 0.3; // chiều cao đế trưng bày; mọi khu đứng trên mặt đế
export const AT = { base: [0, 0, 0], feed: [-3.45, PL, 0.05], comp: [-1.9, PL, 0.55], tower: [0, PL, -0.05], catbox: [-0.95, PL, 1.15], cool: [1.7, PL, 0.55], sep: [3.25, PL, 0.05], loop: [1.0, PL, -1.2], panel: [2.55, PL, 1.3], pipes: [0, PL, 0], lens: [1.45, PL + 3.0, 1.45] };
export const LENS = { R: 0.95, H: 3.0, bed: [0.3, 0.22 + 2.34 + 0.2, 0.33] }; // kính soi hạt: bán kính quả cầu · tâm cao hơn mặt đế (cao hơn các thẻ tên của khu làm lạnh, tuần hoàn để không bị chữ đè) · điểm trên tầng xúc tác trên cùng (toạ độ của tháp) mà kính đang soi
const FONT = '"IBM Plex Sans", "Segoe UI", system-ui, sans-serif';
const COL = { N: '#3d6fe0', H: '#f4f6f9', A: '#19b89a' }; // N₂ xanh dương, H₂ trắng (cùng bảng màu nguyên tử của Lab), NH₃ xanh ngọc
export const LEGEND = [['N₂', COL.N], ['H₂', COL.H], ['NH₃', COL.A]];

const std = (color, o = {}) => new T.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0, ...o });
const M = {
  steel: std('#c2ccd1', { metalness: 0.85, roughness: 0.26 }), dark: std('#2b363d', { metalness: 0.45, roughness: 0.5 }), shell: std('#8ea3ad', { metalness: 0.55, roughness: 0.38, side: T.DoubleSide }),
  blue: std('#2f6fb7', { metalness: 0.25, roughness: 0.4 }), white: std('#eef2f4', { metalness: 0.2, roughness: 0.38 }), red: std('#c8372d', { roughness: 0.45 }), green: std('#2f9e5b', { roughness: 0.45 }),
  yellow: std('#e3b23c', { roughness: 0.5 }), concrete: std('#aeb6b8', { roughness: 0.9 }), wood: std('#3b2f27', { roughness: 0.6 }), top: std('#e4e8ea', { roughness: 0.8 }), brass: std('#c9a14a', { metalness: 0.8, roughness: 0.35 }),
  glass: new T.MeshStandardMaterial({ color: '#8fb4c6', roughness: 0.12, transparent: true, opacity: 0.46, depthWrite: false }), teal: std('#12a089', { roughness: 0.42, metalness: 0.2 }),
};
['steel', 'dark', 'shell', 'blue', 'white', 'teal', 'yellow', 'brass'].forEach((k) => phuVan(M[k]));
const BOLT = std('#9aa6ad', { metalness: 0.9, roughness: 0.3 });
function add(parent, geo, mat, x = 0, y = 0, z = 0) { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = !mat.transparent; parent.add(m); return m; }
const cyl = (r, h, seg = 32, r2 = r) => new T.CylinderGeometry(r2, r, h, seg);
// Chữ trên khối vẽ bằng canvas: phải chờ IBM Plex nạp xong, nếu không trình duyệt vẽ bằng phông hệ thống (đậm giả, lệch kiểu: chủ 27/11 chê "trông hơi tệ").
// Vẽ ngay một lần, rồi vẽ lại khi ba độ đậm 400/500/600 đã sẵn sàng.
const FONT_READY = typeof document !== 'undefined' && document.fonts ? Promise.all(['400', '500', '600'].map((w) => document.fonts.load(`${w} 40px "IBM Plex Sans"`, 'ĐNH₃'))).catch(() => {}) : null;
function textTexture(w, h, draw) { const t = canvasTexture(w, h, draw); if (FONT_READY) FONT_READY.then(() => { const c = t.image.getContext('2d'); c.clearRect(0, 0, w, h); draw(c, w, h); t.needsUpdate = true; }); return t; }
// Huy hiệu số của khu: chấm tròn màu khu, số trắng (thay ký tự ①②, vốn vẽ bằng phông khác)
function badge(c, x, y, r, no, color) { c.fillStyle = color; c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.fill(); c.fillStyle = '#ffffff'; c.font = `600 ${r * 1.15}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(no, x, y + r * 0.06); }
const safe = (dt) => (dt > 0 && dt < 1 ? dt : 0); // bộ máy có lúc gọi update không kèm dt (dựng lại bàn): coi như không trôi thời gian
function plate(text, w, h, { bg = '#1c2a33', fg = '#f4f7f8', size = 0.56, sub = '' } = {}) {
  const tex = textTexture(Math.round(512 * (w / h)), 512, (c, W, H) => { c.fillStyle = bg; c.fillRect(0, 0, W, H); c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `600 ${H * size}px ${FONT}`; c.fillText(text, W / 2, sub ? H * 0.42 : H / 2, W * 0.94); if (sub) { c.font = `500 ${H * 0.22}px ${FONT}`; c.fillText(sub, W / 2, H * 0.8, W * 0.94); } });
  return new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, toneMapped: false }));
}
// Vỏ bình đứng: thân trụ + hai chỏm cầu
function vessel(parent, r, h, mat, y0 = 0) {
  add(parent, cyl(r, h), mat, 0, y0 + h / 2, 0);
  const top = add(parent, new T.SphereGeometry(r, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat, 0, y0 + h, 0); top.scale.y = 0.55;
  const bot = add(parent, new T.SphereGeometry(r, 32, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat, 0, y0, 0); bot.scale.y = 0.55;
}
// Vòng bu lông quanh mặt bích (trục đứng; xoay nhóm để đặt nằm)
function bolts(parent, r, y, n = 10, size = 0.028) { const g = new T.Group(); g.position.y = y; parent.add(g); for (let i = 0; i < n; i++) { const a = (i / n) * 6.2832; add(g, cyl(size, size * 0.9, 6), BOLT, Math.cos(a) * r, 0, Math.sin(a) * r); } return g; }
function legs(parent, r, h, n = 3) { for (let i = 0; i < n; i++) { const a = (i / n) * 6.283 + 0.5; add(parent, cyl(0.035, h, 10), M.dark, Math.cos(a) * r, h / 2, Math.sin(a) * r); } }
// Tay van: vô lăng trên trục; set(k) xoay theo mức mở, đèn báo xanh khi mở
function valveWheel(parent, x, y, z, color) {
  const g = new T.Group(); g.position.set(x, y, z); parent.add(g);
  add(g, cyl(0.022, 0.2, 10), M.steel, 0, 0.1, 0);
  const wheel = new T.Group(); wheel.position.y = 0.2; g.add(wheel);
  const rim = add(wheel, new T.TorusGeometry(0.13, 0.024, 10, 28), color); rim.rotation.x = Math.PI / 2;
  [0, 1, 2].forEach((i) => { const s = add(wheel, cyl(0.014, 0.25, 8), color); s.rotation.z = Math.PI / 2; s.rotation.y = (i / 3) * Math.PI; });
  const lamp = add(g, new T.SphereGeometry(0.045, 14, 10), new T.MeshStandardMaterial({ color: '#7b8a90', emissive: '#000000', roughness: 0.3 }), 0.17, 0.06, 0);
  const ring = new T.Mesh(new T.TorusGeometry(0.21, 0.014, 8, 40), new T.MeshBasicMaterial({ color: '#6254f4', toneMapped: false })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.2; ring.visible = false; g.add(ring);
  const hit = new T.Mesh(new T.SphereGeometry(0.24, 14, 10), new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); hit.position.y = 0.2; g.add(hit);
  let k = 0, to = 0, turn = 1; // turn: mức mở 0..1 (vặn vô lăng để đặt phần trăm tuần hoàn)
  return { hit, ring, setTurn(v) { turn = Math.max(0, Math.min(1, v)); }, set(open) { to = open ? 1 : 0; lamp.material.color.set(open ? '#49e08a' : '#d45a4e'); lamp.material.emissive.set(open ? '#1fae5c' : '#8c2a20'); }, update(dt) { dt = safe(dt); k += (to - k) * Math.min(1, dt * 5); wheel.rotation.y += ((k * (1.2 + 4.2 * turn)) - wheel.rotation.y) * Math.min(1, dt * 10 || 1); } };
}

// ĐỒNG HỒ KIM dùng chung (áp suất ở máy nén, nhiệt độ ở tháp): mặt số vẽ bằng canvas, viền đồng, có VÒNG GỢI Ý màu nhấn (hiện khi bước cho chỉnh)
// và một đĩa trong suốt rộng hơn mặt số để bắt chuột, ngón tay (27/11: kéo kim ngay trên máy để đặt số, xem connectDials).
function makeGauge({ min, max, unit, zones, r = 0.2 }) {
  const g = new T.Group(), cv = document.createElement('canvas'); cv.width = cv.height = 256; const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 8;
  const A = (v) => Math.PI * (0.8 + 1.4 * (v - min) / (max - min));
  const back = add(g, cyl(r * 1.04, 0.05, 32), M.dark, 0, 0, -0.03); back.rotation.x = Math.PI / 2;
  const face = add(g, new T.CircleGeometry(r, 40), new T.MeshBasicMaterial({ map: tex, toneMapped: false })); face.castShadow = false;
  add(g, new T.TorusGeometry(r, r * 0.11, 8, 36), M.brass);
  const ring = new T.Mesh(new T.TorusGeometry(r * 1.34, r * 0.06, 8, 44), new T.MeshBasicMaterial({ color: '#6254f4', toneMapped: false })); ring.visible = false; g.add(ring);
  const hit = new T.Mesh(new T.CircleGeometry(r * 1.5, 24), new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); hit.position.z = 0.014; g.add(hit);
  let cur = null;
  function draw(v) {
    const c = cv.getContext('2d'); c.fillStyle = '#fbfcfc'; c.fillRect(0, 0, 256, 256); c.lineWidth = 16; c.lineCap = 'butt';
    zones.forEach(([a, b, col]) => { c.strokeStyle = col; c.beginPath(); c.arc(128, 136, 92, A(a), A(b)); c.stroke(); });
    const a = A(v); c.strokeStyle = '#16232b'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(128, 136); c.lineTo(128 + Math.cos(a) * 76, 136 + Math.sin(a) * 76); c.stroke();
    c.fillStyle = '#16232b'; c.font = `600 44px ${FONT}`; c.textAlign = 'center'; c.fillText(String(v), 128, 214); c.font = `500 24px ${FONT}`; c.fillText(unit, 128, 240); tex.needsUpdate = true;
  }
  if (FONT_READY) FONT_READY.then(() => { if (cur != null) draw(cur); });
  return { g, hit, ring, set(v) { if (v !== cur) { cur = v; draw(v); } } };
}

// ---------- ĐẾ TRƯNG BÀY: gỗ sẫm, mặt đế sáng có mảng màu và SỐ của từng khu; TÊN KHU nằm trên dải nghiêng ở mép trước ----------
// Chủ 27/11 (chỉ vào chữ in trên mặt đế): "kiểu ghi tên ở nền thế này có hợp lý k" → không: chữ bị món che, bị dẹt theo góc nhìn và trùng với thẻ tên.
// Sửa: mặt đế chỉ còn mảng màu + con số ở mép trước (chỗ không có món nào đứng); tên khu ra dải nghiêng quay về phía người xem, như bảng chú thích ở tủ trưng bày.
export function makeBase({ w = 9.4, d = 4.0, studio = true } = {}) {
  const g = new T.Group();
  add(g, new T.BoxGeometry(w, PL - 0.04, d), M.wood, 0, (PL - 0.04) / 2, 0);
  // [số, tên, tâm x, bề rộng khu, màu nền nhạt trên mặt đế, màu nhấn của khu (huy hiệu số, vạch dưới tên)]
  const zones = [['1', 'Khí nguyên liệu', -3.45, 1.7, '#e3ecf7', '#3d6fe0'], ['2', 'Nén', -1.9, 1.25, '#e7eaee', '#6b7884'], ['3', 'Tháp tổng hợp', 0, 2.1, '#f7e8dc', '#e07b2a'], ['4', 'Làm lạnh', 1.7, 1.25, '#e0f1f6', '#2f8fd0'], ['5', 'Tách NH₃ lỏng', 3.25, 1.75, '#ddf4ec', '#139f86']];
  const RIM = 0.17, tw = w - 2 * RIM, td = d - 2 * RIM; // viền gỗ quanh mặt đế: trên nền trơn vẫn thấy rõ đây là một tấm đế
  const tex = textTexture(2048, Math.round((2048 * td) / tw), (c, W, H) => {
    const px = (x) => ((x + tw / 2) / tw) * W, s = W / tw; c.fillStyle = '#f4f6f7'; c.fillRect(0, 0, W, H);
    zones.forEach(([no, , x, zw, color, acc]) => { c.fillStyle = color; c.beginPath(); c.roundRect(px(x - zw / 2), H * 0.2, zw * s, H * 0.76, 22); c.fill(); badge(c, px(x), H * 0.9, H * 0.042, no, acc); });
  });
  const top = add(g, new T.BoxGeometry(tw, 0.04, td), [M.top, M.top, new T.MeshStandardMaterial({ map: tex, roughness: 0.82 }), M.top, M.top, M.top], 0, PL - 0.015, 0); top.castShadow = false;
  // Dải nghiêng mép trước: mặt ngả ra sau 40 độ nên nhìn từ khung chuẩn gần như thẳng góc, chữ to gấp đôi so với in trên mặt đứng của đế
  const slant = 0.4, tilt = (40 * Math.PI) / 180, a = slant * Math.sin(tilt), bH = slant * Math.cos(tilt);
  const wedge = new T.ExtrudeGeometry(new T.Shape([new T.Vector2(0, PL - 0.005), new T.Vector2(a, PL - bH), new T.Vector2(0, PL - bH)]), { depth: w, bevelEnabled: false });
  wedge.rotateY(-Math.PI / 2); wedge.translate(w / 2, 0, d / 2); add(g, wedge, M.wood);
  const names = textTexture(4096, Math.round((4096 * slant) / w), (c, W, H) => {
    // Dải tên kiểu bảng chú thích tủ trưng bày: nền gỗ sẫm đều màu, viền sáng mảnh ở mép trên; mỗi khu = huy hiệu số + tên chữ kem, một cỡ, một độ đậm, canh giữa khu
    const px = (x) => ((x + w / 2) / w) * W, s = W / w, g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3a3027'); g.addColorStop(1, '#2a221b'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,240,220,0.16)'; c.fillRect(0, 0, W, Math.max(2, H * 0.03));
    zones.forEach(([no, name, x, zw, , acc]) => {
      const fs = H * 0.47, r = H * 0.22, gap = H * 0.15; c.font = `500 ${fs}px ${FONT}`; const tw2 = Math.min(c.measureText(name).width, zw * s - 2 * r - gap - H * 0.5), total = 2 * r + gap + tw2, x0 = px(x) - total / 2, cy = H * 0.5;
      badge(c, x0 + r, cy, r, no, acc);
      c.font = `500 ${fs}px ${FONT}`; c.fillStyle = '#f3ece2'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(name, x0 + 2 * r + gap, cy + fs * 0.04, tw2);
      c.fillStyle = acc; c.globalAlpha = 0.85; c.fillRect(x0 + 2 * r + gap, cy + fs * 0.62, Math.min(tw2, fs * 1.6), Math.max(2, H * 0.035)); c.globalAlpha = 1; // vạch màu khu ngắn dưới tên
    });
  });
  const rail = new T.Mesh(new T.PlaneGeometry(w, slant), new T.MeshBasicMaterial({ map: names, toneMapped: false }));
  rail.position.set(0, PL - bH / 2 + 0.002, d / 2 + a / 2 + 0.002); rail.rotation.x = -tilt; g.add(rail);
  // Nền trơn (không phòng, không bàn): một vệt sáng tròn mờ dần dưới đế để mô hình không lơ lửng và có chỗ đổ bóng
  const pool = canvasTexture(512, 512, (c) => { const gr = c.createRadialGradient(256, 256, 30, 256, 256, 254); gr.addColorStop(0, 'rgba(255,255,255,0.6)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.3)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 512, 512); });
  const floor = new T.Mesh(new T.CircleGeometry(9.5, 64), new T.MeshStandardMaterial({ map: pool, transparent: true, roughness: 0.95, depthWrite: false })); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.004; floor.receiveShadow = true; floor.renderOrder = -1; floor.raycast = () => {}; floor.visible = !!studio; g.add(floor);
  g.userData = { top: PL };
  return g;
}

// ---------- ① Hai bình khí nguyên liệu N₂ và H₂, chung một ống góp có van ----------
export function makeFeed() {
  const g = new T.Group();
  [[-0.45, M.blue, 'N₂'], [0.45, M.white, 'H₂']].forEach(([x, mat, name]) => {
    const t = new T.Group(); t.position.set(x, 0, 0); g.add(t); const key = name === 'N₂' ? 'gas_cyl_n2' : 'gas_cyl_h2';
    if (coKhoi(key)) { // bình khí thật (ảnh LAB-014): cao 1,95, nong 1,6 lần cho vừa ống góp của sa bàn
      const K = khoiTuAnh(key, 1.95, { rScale: 1.6, mat: { metalness: 0.3, roughness: 0.42 } }); t.add(K.mesh);
      const lab = plate(name, 0.3, 0.22, { bg: name === 'N₂' ? COL.N : '#ffffff', fg: name === 'N₂' ? '#ffffff' : '#16324f', size: 0.7 }); lab.position.set(0, 0.95, K.r + 0.012); t.add(lab);
    } else {
      legs(t, 0.26, 0.2); const b = new T.Group(); b.position.y = 0.26; t.add(b); vessel(b, 0.34, 1.15, mat);
      const lab = plate(name, 0.42, 0.3, { bg: '#ffffff', fg: '#16324f', size: 0.7 }); lab.position.set(0, 0.92, 0.345); t.add(lab);
      add(t, cyl(0.045, 0.34, 12), M.steel, 0, 0.26 + 1.15 + 0.3, 0);
    }
    const out = add(t, cyl(0.045, 0.5, 12), M.steel, 0, 0.42, 0.42); out.rotation.x = Math.PI / 2;
  });
  const man = add(g, cyl(0.05, 1.2, 12), M.steel, 0, 0.42, 0.66); man.rotation.z = Math.PI / 2;
  const v = valveWheel(g, 0, 0.42, 0.66, M.red);
  g.userData = { top: 2.0, setOn: (on) => v.set(on), update: (dt) => v.update(dt) };
  g.userData.setOn(false);
  return g;
}

// ---------- ② Máy nén: động cơ, khối nén, bánh đà quay, đồng hồ áp suất ----------
export function makeComp() {
  const g = new T.Group();
  add(g, new T.BoxGeometry(1.35, 0.1, 0.8), M.dark, 0, 0.05, 0);
  const motor = add(g, cyl(0.24, 0.55, 28), M.blue, -0.36, 0.38, 0); motor.rotation.z = Math.PI / 2;
  for (let i = 0; i < 5; i++) { const f = add(g, new T.TorusGeometry(0.245, 0.012, 6, 28), M.dark, -0.56 + i * 0.1, 0.38, 0); f.rotation.y = Math.PI / 2; }
  add(g, new T.BoxGeometry(0.52, 0.56, 0.56), M.teal, 0.3, 0.38, 0);
  add(g, cyl(0.16, 0.34, 24), M.steel, 0.3, 0.8, 0); add(g, cyl(0.19, 0.05, 28), M.dark, 0.3, 0.98, 0); const cb = bolts(g, 0.165, 1.01, 8, 0.022); cb.position.x = 0.3;
  [[-0.6, 0.35], [0.6, 0.35], [-0.6, -0.35], [0.6, -0.35]].forEach(([x, z]) => add(g, cyl(0.03, 0.04, 6), BOLT, x, 0.12, z));
  const fly = new T.Group(); fly.position.set(0.3, 0.38, 0.33); g.add(fly);
  const disc = add(fly, cyl(0.26, 0.06, 32), M.dark); disc.rotation.x = Math.PI / 2;
  [0, 1, 2].forEach((i) => { const s = add(fly, new T.BoxGeometry(0.46, 0.05, 0.02), M.yellow, 0, 0, 0.035); s.rotation.z = (i / 3) * Math.PI; });
  const G = makeGauge({ min: 50, max: 350, unit: 'bar', zones: [[50, 150, '#8fb3d9'], [150, 200, '#49b675'], [200, 350, '#e0823a']] }); G.g.position.set(-0.36, 0.86, 0.02); g.add(G.g); add(g, cyl(0.03, 0.26, 10), M.steel, -0.36, 0.72, -0.01);
  let p = -1, run = false, spin = 0;
  g.userData = { top: 1.15, dial: { key: 'p', mode: 'abs', hit: G.hit, ring: G.ring }, set(s) { run = !!s.run; if (s.p !== p) { p = s.p; G.set(p); } }, update(dt) { dt = safe(dt); spin += dt * (run ? 4 + p / 40 : 0); fly.rotation.z = -spin; } };
  g.userData.set({ p: 200, run: false });
  return g;
}

// ---------- ③ Tháp tổng hợp: nửa vỏ trước mở ra như cánh cửa, bên trong ba tầng xúc tác Fe nóng sáng theo nhiệt độ ----------
export function makeTower({ h = 3.0 } = {}) {
  const g = new T.Group(), r = 0.46, y0 = 0.22;
  const door = new T.Group(); door.position.set(-r, 0, 0); g.add(door);                    // bản lề ở mép trái
  if (coKhoi('reactor_column')) { // tháp thật (ảnh reactor_column): hai nửa vỏ dựng theo đường viền ảnh, cao trọn 3,62; lòng vỏ sơn tối để thấy rõ ba tầng Fe khi mở
    const size = y0 + h + 0.4, rs = r / (khoiTuAnh('reactor_column', size).r || r) * 1.0;
    const back = khoiTuAnh('reactor_column', size, { phiStart: Math.PI / 2, phiLength: Math.PI, rScale: rs, mat: { side: T.DoubleSide, metalness: 0.35, roughness: 0.42 } }); g.add(back.mesh);
    const front = khoiTuAnh('reactor_column', size, { phiStart: -Math.PI / 2, phiLength: Math.PI, rScale: rs, mat: { side: T.DoubleSide, metalness: 0.35, roughness: 0.42 } }); front.mesh.position.x = r; door.add(front.mesh);
    const lining = std('#2a3238', { roughness: 0.8, side: T.BackSide }); [[back, g, 0], [front, door, r]].forEach(([K, par, x]) => { const L = new T.Mesh(K.geo, lining); L.scale.set(0.985, 1, 0.985); L.position.x = x; par.add(L); });
  } else {
    add(g, cyl(0.56, y0, 36, 0.5), M.concrete, 0, y0 / 2, 0);
    const half = (start) => new T.CylinderGeometry(r, r, h, 40, 1, true, start, Math.PI);
    add(g, half(Math.PI / 2), M.shell, 0, y0 + h / 2, 0);                                   // nửa vỏ sau: đứng yên
    const dome = add(g, new T.SphereGeometry(r, 36, 14, 0, Math.PI * 2, 0, Math.PI / 2), M.shell, 0, y0 + h, 0); dome.scale.y = 0.6;
    add(g, cyl(0.07, 0.3, 14), M.steel, 0, y0 + h + 0.36, 0);
    add(door, half(-Math.PI / 2), M.shell, r, y0 + h / 2, 0);
    [0.5, 1.45, 2.4].forEach((y) => { const a = add(g, new T.TorusGeometry(r + 0.012, 0.035, 8, 28, Math.PI), M.steel, 0, y0 + y, 0); a.rotation.x = Math.PI / 2; a.rotation.z = Math.PI; const b = add(door, new T.TorusGeometry(r + 0.012, 0.035, 8, 28, Math.PI), M.steel, r, y0 + y, 0); b.rotation.x = Math.PI / 2; });
  }
  const handle = add(door, new T.BoxGeometry(0.05, 0.4, 0.08), M.yellow, r * 2 + 0.02, y0 + 1.5, 0.06); void handle;
  const hot = new T.MeshStandardMaterial({ color: '#3a3f44', roughness: 0.95, emissive: '#ff5a12', emissiveIntensity: 0 });
  const beds = [0.62, 1.48, 2.34].map((y) => { add(g, cyl(r - 0.03, 0.03, 32), M.steel, 0, y0 + y - 0.27, 0); const b = add(g, cyl(r - 0.05, 0.5, 32), hot, 0, y0 + y, 0); b.castShadow = false; return b; });
  const pellets = new T.Group(); g.add(pellets); // hạt xúc tác rải trên mặt mỗi tầng để thấy đây là lớp hạt chứ không phải khối đặc
  beds.forEach((b) => { for (let i = 0; i < 26; i++) { const a = i * 2.4, q = 0.36 * Math.sqrt((i + 0.5) / 26); const m = add(pellets, new T.SphereGeometry(0.035, 8, 6), hot, Math.cos(a) * q, b.position.y + 0.255, Math.sin(a) * q); m.castShadow = false; } });
  add(g, cyl(0.045, h - 0.2, 12), M.steel, 0, y0 + h / 2, 0); // ống giữa
  const plat = add(g, new T.TorusGeometry(r + 0.2, 0.025, 8, 36, Math.PI), M.yellow, 0, y0 + 1.95, 0); plat.rotation.x = Math.PI / 2; plat.rotation.z = Math.PI;
  [-0.1, 0.1].forEach((dx) => add(g, cyl(0.015, 1.95, 8), M.yellow, r + 0.12 + dx * 0.5, y0 + 0.98, -0.3 + dx));
  // Đồng hồ nhiệt của tháp: gắn trên một giá ngắn bên phải thân tháp (không gắn lên nửa vỏ mở được), quay mặt về phía người xem; kéo kim để đặt nhiệt độ
  const TG = makeGauge({ min: 200, max: 700, unit: '°C', zones: [[200, 400, '#8fb3d9'], [400, 450, '#49b675'], [450, 700, '#e0823a']], r: 0.2 }); TG.g.position.set(r + 0.34, y0 + 2.25, 0.16); g.add(TG.g); // cao hơn trạm van tuần hoàn để hai núm không chồng nhau trên màn hình
  const arm = add(g, cyl(0.025, 0.36, 10), M.steel, r + 0.16, y0 + 2.25, 0.1); arm.rotation.z = Math.PI / 2;
  let cut = 0, to = 0, heat = 0, heatTo = 0, run = false, t = 0;
  const tint = new T.Color();
  g.userData = { top: y0 + h + 0.55, dial: { key: 'T', mode: 'abs', hit: TG.hit, ring: TG.ring },
    set(s) { TG.set(s.T); to = s.cut ? 1 : 0; run = !!s.run; beds.forEach((b) => { b.visible = !!s.cat; }); pellets.visible = !!s.cat; heatTo = Math.max(0, Math.min(1, (s.T - 150) / 500)); tint.set('#7a1f08').lerp(new T.Color('#ffc46b'), heatTo); hot.emissive.copy(tint); },
    update(dt) { dt = safe(dt); t += dt; cut += (to - cut) * Math.min(1, dt * 2.4); door.rotation.y = -cut * 1.95; heat += (heatTo - heat) * Math.min(1, dt * 2); hot.emissiveIntensity = (0.25 + 1.5 * heat) * (run ? 1 + 0.18 * Math.sin(t * 7) : 0.8); } };
  g.userData.set({ T: 450, cat: true, cut: false, run: false });
  return g;
}

// ---------- Thùng hạt xúc tác Fe đặt cạnh tháp (chạm để đặt vào / rút ra) ----------
export function makeCatBox() {
  const g = new T.Group();
  add(g, new T.BoxGeometry(0.62, 0.3, 0.44), M.yellow, 0, 0.15, 0);
  const hill = add(g, new T.SphereGeometry(0.27, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), std('#3a3f44', { roughness: 0.95 }), 0, 0.28, 0); hill.scale.set(1, 0.42, 0.7);
  const lab = plate('Fe', 0.3, 0.2, { bg: '#1c2a33', size: 0.72 }); lab.position.set(0, 0.15, 0.222); g.add(lab);
  g.userData = { top: 0.6, setOn(inTower) { hill.visible = !inTower; } };
  return g;
}

// ---------- ④ Thiết bị làm lạnh ngưng tụ: ống chùm nằm ngang, hai ống nước lạnh; bật thì phủ sương ----------
export function makeCool() {
  const g = new T.Group(), mat = phuVan(std('#b9c8cf', { metalness: 0.7, roughness: 0.3 }));
  [-0.36, 0.36].forEach((x) => add(g, new T.BoxGeometry(0.1, 0.34, 0.44), M.dark, x, 0.17, 0));
  let R = 0.25, Y = 0.56;
  if (coKhoi('heat_exchanger')) { // bộ làm lạnh thật (ảnh LAB-014): ống chùm nằm ngang dài 1,5, nong 1,7 lần
    const K = khoiTuAnh('heat_exchanger', 1.5, { rScale: 1.7, mat: { metalness: 0.3, roughness: 0.42 } }); R = K.r; Y = 0.34 + R + 0.02; K.mesh.position.y = Y; g.add(K.mesh);
  } else {
    const body = add(g, cyl(0.25, 1.15, 32), mat, 0, 0.56, 0); body.rotation.z = Math.PI / 2;
    [-0.6, 0.6].forEach((x) => { const c = add(g, new T.SphereGeometry(0.25, 28, 12), mat, x, 0.56, 0); c.scale.x = 0.45; });
  }
  [-0.28, 0.28].forEach((x) => add(g, cyl(0.04, 0.42, 12), std('#3f8fd0', { metalness: 0.3 }), x, Y + R + 0.18, 0));
  const frost = add(g, cyl(R * 1.05, 1.0, 32), new T.MeshStandardMaterial({ color: '#eaf7ff', roughness: 0.9, transparent: true, opacity: 0, depthWrite: false }), 0, Y, 0); frost.rotation.z = Math.PI / 2;
  let k = 0, to = 0;
  g.userData = { top: 1.3, setOn(on) { to = on ? 1 : 0; }, update(dt) { dt = safe(dt); k += (to - k) * Math.min(1, dt * 1.5); frost.material.opacity = 0.62 * k; } };
  return g;
}

// ---------- ⑤ Bình tách và chứa NH₃ lỏng, có ống thuỷ nhìn mực ----------
export function makeSep() {
  const g = new T.Group(); let win = { x: 0, z: 0.4, y0: 0.42, hh: 0.76, w: 0.08 };
  if (coKhoi('storage_tank')) { // bồn thật (ảnh LAB-014, có cửa kính): cao 1,95, nong 1,5 lần; chân rời dựng bằng mã đúng độ cao chân trong ảnh
    const K = khoiTuAnh('storage_tank', 1.95, { rScale: 1.5, mat: { metalness: 0.25, roughness: 0.45 } }); g.add(K.mesh); legs(g, K.r * 0.72, K.y0 + 0.02, 4);
    // cửa kính trên ảnh (đo 27/11): x 206–298 px, y 232–842 px; mực NH₃ lỏng dâng trong đúng khung đó, sát mặt cong của bồn
    const x0 = K.toX(206), x1 = K.toX(298), xc = (x0 + x1) / 2; win = { x: xc, z: Math.sqrt(Math.max(0, K.r * K.r - xc * xc)) + 0.012, y0: K.toY(842), hh: K.toY(232) - K.toY(842), w: (x1 - x0) * 0.8 };
  } else {
    legs(g, 0.28, 0.22); const b = new T.Group(); b.position.y = 0.3; g.add(b); vessel(b, 0.38, 1.0, M.white);
    add(g, new T.BoxGeometry(0.12, 0.8, 0.03), M.dark, 0, 0.8, 0.385); add(g, cyl(0.045, 0.3, 12), M.steel, 0, 1.62, 0);
  }
  const liq = add(g, new T.BoxGeometry(win.w, 1, 0.02), new T.MeshStandardMaterial({ color: '#7fd6f2', emissive: '#2aa9d6', emissiveIntensity: 0.5, roughness: 0.2 }), win.x, win.y0, win.z); liq.geometry.translate(0, 0.5, 0); liq.castShadow = false; liq.rotation.y = Math.atan2(win.x, win.z); // áp theo mặt cong của bồn ở chỗ cửa kính
  const lab = plate('NH₃ lỏng', 0.52, 0.2, { bg: '#ffffff', fg: '#0d5c50', size: 0.62 }); lab.position.set(0, 2.05, 0.2); lab.rotation.x = -0.25; g.add(lab);
  let k = 0, to = 0;
  g.userData = { top: 1.9, setLevel(v) { to = Math.max(0, Math.min(1, v)); }, update(dt) { dt = safe(dt); k += (to - k) * Math.min(1, dt * 1.2); liq.scale.y = Math.max(0.001, win.hh * k); liq.visible = k > 0.01; } };
  return g;
}

// ---------- Trạm van tuần hoàn: bơm nhỏ + tay van xanh, nằm trên đường ống sau tháp ----------
export function makeLoop() {
  const g = new T.Group();
  add(g, new T.BoxGeometry(0.5, 0.16, 0.36), M.dark, 0, 0.08, 0);
  const pump = add(g, cyl(0.17, 0.3, 24), M.teal, 0, 0.36, 0); pump.rotation.x = Math.PI / 2;
  const v = valveWheel(g, 0.42, 0.44, 0, M.green);
  g.userData = { top: 1.0, dial: { key: 'rec', mode: 'turn', hit: v.hit, ring: v.ring, tap: true }, setOn: (on) => v.set(on), setRec: (pc) => v.setTurn(pc / 95), update: (dt) => v.update(dt) };
  g.userData.setOn(false);
  return g;
}

// ---------- Tủ điều khiển: nút chạy tháp, đèn trạng thái, thanh tiến độ 60 giây ----------
export function makePanel() {
  const g = new T.Group();
  add(g, new T.BoxGeometry(0.62, 0.74, 0.3), std('#d7dde0', { metalness: 0.3, roughness: 0.5 }), 0, 0.37, 0);
  const face = new T.Group(); face.position.set(0, 0.5, 0.152); face.rotation.x = -0.32; g.add(face);
  add(face, new T.BoxGeometry(0.56, 0.4, 0.03), M.dark);
  const btn = add(face, cyl(0.075, 0.05, 24), new T.MeshStandardMaterial({ color: '#2fbf6b', emissive: '#0c7a3a', emissiveIntensity: 0.6, roughness: 0.35 }), -0.14, 0.04, 0.035); btn.rotation.x = Math.PI / 2;
  add(face, new T.BoxGeometry(0.24, 0.05, 0.01), std('#0f171c'), 0.12, 0.06, 0.02);
  const bar = add(face, new T.BoxGeometry(0.24, 0.05, 0.012), new T.MeshBasicMaterial({ color: '#49e08a' }), 0.0, 0.06, 0.024); bar.geometry.translate(0.12, 0, 0);
  const txt = plate('CHẠY 60 s', 0.44, 0.1, { bg: '#2b363d', size: 0.6 }); txt.position.set(0, -0.12, 0.02); face.add(txt);
  let run = false, t = 0;
  g.userData = { top: 0.95, set(s) { run = !!s.run; bar.scale.x = Math.max(0.001, s.prog || 0); bar.visible = (s.prog || 0) > 0.005; }, update(dt) { dt = safe(dt); t += dt; btn.material.emissiveIntensity = run ? 1.2 + 0.5 * Math.sin(t * 9) : 0.6; } };
  g.userData.set({ run: false, prog: 0 });
  return g;
}

// ---------- ĐƯỜNG ỐNG trong suốt và các hạt khí chạy bên trong. Toạ độ theo bàn (đã trừ chiều cao đế ở chỗ đặt món). ----------
export function makePipes() {
  const g = new T.Group(), y = (v) => v - PL, V = (x, yy, z) => new T.Vector3(x, y(yy), z);
  const ROUTES = {
    a: [V(-3.45, 0.72, 0.71), V(-2.9, 0.72, 0.75), V(-2.55, 0.68, 0.55)],                                                   // bình khí → máy nén
    b: [V(-1.6, 1.25, 0.55), V(-1.6, 1.9, 0.5), V(-0.75, 3.55, 0.1), V(-0.2, 3.86, -0.05), V(0, 3.7, -0.05)],                // máy nén → đỉnh tháp
    c: [V(0.5, 0.62, -0.05), V(0.85, 0.62, 0.3), V(1.1, 0.86, 0.55)],                                                         // đáy tháp → làm lạnh
    d: [V(2.3, 0.86, 0.55), V(2.7, 0.95, 0.4), V(2.9, 1.1, 0.12)],                                                            // làm lạnh → bình tách
    r: [V(3.25, 2.22, 0.05), V(3.25, 2.4, -0.6), V(2.6, 1.0, -1.2), V(1.0, 0.72, -1.2), V(-1.2, 0.72, -1.2), V(-1.9, 0.72, -0.6), V(-1.9, 0.72, 0.15)], // tuần hoàn: bình tách → sau tháp → máy nén
  };
  const beadGeo = new T.SphereGeometry(0.05, 12, 8), bm = Object.fromEntries(Object.entries(COL).map(([k, c]) => [k, new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.35, roughness: 0.3 })]));
  const P = {};
  Object.entries(ROUTES).forEach(([key, pts]) => {
    const curve = new T.CatmullRomCurve3(pts, false, 'centripetal'), len = curve.getLength(), n = Math.max(4, Math.round(len / 0.3));
    const tube = new T.Mesh(new T.TubeGeometry(curve, 60, 0.085, 14), M.glass); tube.renderOrder = 4; g.add(tube);
    [0, 1].forEach((k) => { const f = add(g, new T.TorusGeometry(0.095, 0.022, 8, 20), M.steel); f.position.copy(curve.getPointAt(k)); f.lookAt(curve.getPointAt(k ? 0.98 : 0.02)); });
    const beads = []; for (let i = 0; i < n; i++) { const m = new T.Mesh(beadGeo, bm.H); m.visible = false; m.renderOrder = 3; g.add(m); beads.push(m); }
    P[key] = { curve, beads, n, t: 0 };
  });
  let S = { on: false, flow: 0, nh3: 0, rec: 0, sep: false, r: 3 };
  const kindOf = (i, frac, r) => (((i * 0.618034) % 1) < frac ? 'A' : i % (Math.max(1, Math.round(r)) + 1) === 0 ? 'N' : 'H');
  function paint() { ['a', 'b'].forEach((k) => P[k].beads.forEach((m, i) => { m.material = bm[kindOf(i, 0, S.r)]; })); ['c', 'd'].forEach((k) => P[k].beads.forEach((m, i) => { m.material = bm[kindOf(i, S.nh3, S.r)]; })); P.r.beads.forEach((m, i) => { m.material = bm[kindOf(i, S.sep ? 0 : S.nh3, S.r)]; }); }
  g.userData = { top: 3.6,
    set(s) { S = { ...S, ...s }; paint(); },
    update(dt) { dt = safe(dt); Object.entries(P).forEach(([key, p]) => { const live = S.on && (key !== 'r' || S.rec > 0), dens = key === 'r' ? S.rec : 1; p.t = (p.t + dt * (0.1 + 0.32 * S.flow) * (live ? 1 : 0)) % 1;
      p.beads.forEach((m, i) => { m.visible = live && i / p.n < dens + 0.001; if (m.visible) m.position.copy(p.curve.getPointAt((p.t + i / p.n) % 1)); }); }); } };
  paint();
  return g;
}

// ---------- KÍNH SOI HẠT: quả cầu kính trên chân đỡ, bên trong là bề mặt một hạt sắt phóng to (lớp hạt · 27/11) ----------
// Là một món dựng khối của sa bàn (không phải ô chữ đè lên cảnh): xoay sa bàn thì nhìn được quả cầu từ mọi phía. Chỉ hiện khi vỏ tháp đang mở.
// Có Fe và có khí: ba ô phản ứng chạy theo be_mat_fe.js. Không có Fe: N₂ và H₂ bay trong khoảng trống, va nhau rồi bật ra. Chưa mở van khí: chỉ có tấm sắt.
// Chân đỡ và chùm soi là một món riêng (cùng gốc toạ độ với quả cầu), để khi "nhìn gần" khung chỉ ôm quả cầu.
export function makeLensFoot() {
  const g = new T.Group(), R = LENS.R, H = LENS.H;
  add(g, cyl(0.2, 0.05, 28), M.dark, 0, -H + 0.025, 0);
  add(g, cyl(0.03, H - R, 12), M.steel, 0, -R - (H - R) / 2, 0);
  // Chùm soi: từ quả cầu thu nhỏ dần về tầng xúc tác trên cùng của tháp
  const to = new T.Vector3(AT.tower[0] + LENS.bed[0] - AT.lens[0], AT.tower[1] + LENS.bed[1] - AT.lens[1], AT.tower[2] + LENS.bed[2] - AT.lens[2]), len = to.length() - R, dir = to.clone().normalize();
  const beam = new T.Mesh(new T.CylinderGeometry(0.03, 0.34, len, 24, 1, true), new T.MeshBasicMaterial({ color: '#ffd45e', transparent: true, opacity: 0.34, depthWrite: false, side: T.DoubleSide }));
  beam.position.copy(dir).multiplyScalar(R * 0.96 + len / 2); beam.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir); beam.renderOrder = 7; g.add(beam);
  g.visible = false; g.scale.setScalar(0.001);
  g.userData = { top: 0, set(s) { g.visible = !!s.on; g.scale.setScalar(s.on ? 1 : 0.001); } };
  return g;
}
export function makeLens() {
  const g = new T.Group(), R = LENS.R;
  add(g, cyl(0.1, 0.14, 24, 0.26), M.brass, 0, -R + 0.0, 0);
  const wall = new T.Mesh(new T.SphereGeometry(R * 0.985, 48, 32), new T.MeshStandardMaterial({ color: '#1a2833', roughness: 1, side: T.BackSide })); g.add(wall); // nửa trong phía xa: nền tối để hạt nổi lên
  const glass = new T.Mesh(new T.SphereGeometry(R, 48, 32), new T.MeshStandardMaterial({ color: '#d7ecf5', roughness: 0.05, transparent: true, opacity: 0.12, depthWrite: false })); glass.renderOrder = 8; g.add(glass);
  const inn = new T.Group(); inn.scale.setScalar(R * 0.985); g.add(inn);
  const glow = (color, emissive, k, o = {}) => std(color, { roughness: 0.4, emissive, emissiveIntensity: k, ...o });
  const feMat = glow('#b47c52', '#5a3219', 0.3, { metalness: 0.3, roughness: 0.55 }), nMat = glow('#3d6fe0', '#1c3fae', 0.4), hMat = glow('#f4f6f9', '#8f9aa3', 0.4);
  const bare = (m) => { m.castShadow = m.receiveShadow = false; return m; };
  // Tấm bề mặt: hai lớp nguyên tử Fe xếp khít, nằm trên một đĩa tối
  const cells = [], sp = RAD.Fe * 1.94;
  for (let L = 0; L < 2; L++) for (let i = -9; i <= 9; i++) for (let j = -9; j <= 9; j++) { const x = (i + (j & 1) * 0.5 + L * 0.5) * sp, z = (j * 0.866 + L * 0.29) * sp; if (Math.hypot(x, z) <= SLAB_R + 0.05) cells.push([x, YFE - L * RAD.Fe * 1.6, z]); }
  const slab = bare(new T.InstancedMesh(new T.SphereGeometry(RAD.Fe, 14, 10), feMat, cells.length)), m4 = new T.Matrix4();
  cells.forEach((c, k) => { m4.makeTranslation(c[0], c[1], c[2]); slab.setMatrixAt(k, m4); }); inn.add(slab);
  const disc = bare(new T.Mesh(cyl(SLAB_R + 0.08, 0.1, 40), std('#3a2a20', { roughness: 0.9 }))); disc.position.y = YFE - RAD.Fe * 1.6 - 0.1; inn.add(disc);
  const nGeo = new T.SphereGeometry(RAD.N, 18, 14), hGeo = new T.SphereGeometry(RAD.H, 14, 10), rng = mulberry(11);
  const units = PATCHES.map(([x, z, ry], i) => {
    const grp = new T.Group(); grp.position.set(x, 0, z); grp.rotation.y = ry; inn.add(grp);
    const atoms = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => { const m = bare(new T.Mesh(k < 2 ? nGeo : hGeo, k < 2 ? nMat : hMat)); m.visible = false; grp.add(m); return m; });
    return { atoms, sim: createUnit(rng, 0.4 + i * 1.3), i };
  });
  // Không có Fe: 3 phân tử N₂ và 6 phân tử H₂ bay tự do trong quả cầu
  const free = []; for (let k = 0; k < 9; k++) {
    const isN = k < 3, grp = new T.Group(), d = (isN ? 0.075 : 0.05) / 2; [-1, 1].forEach((sg) => { const m = bare(new T.Mesh(isN ? nGeo : hGeo, isN ? nMat : hMat)); m.position.x = sg * d; grp.add(m); });
    const a = rng() * 6.283, q = 0.15 + rng() * 0.45, v = new T.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize().multiplyScalar(isN ? 0.3 : 0.5);
    grp.position.set(Math.cos(a) * q, (rng() - 0.5) * 0.7, Math.sin(a) * q); grp.visible = false; inn.add(grp); free.push({ grp, v, w: new T.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).multiplyScalar(3) });
  }
  const S = { on: false, cat: true, T: 450, gas: false, made: 0 }, nrm = new T.Vector3(), rv = new T.Vector3();
  const hideUnits = () => units.forEach((u) => { u.atoms.forEach((m) => { m.visible = false; }); u.sim = createUnit(rng, 0.4 + u.i * 1.3); });
  g.visible = false; g.scale.setScalar(0.001);
  g.userData = { top: R + 0.1, made: () => S.made, state: () => S,
    set(s) {
      const flip = !!s.cat !== S.cat || !!s.gas !== S.gas || !!s.on !== S.on;
      if (flip || s.T !== S.T) S.made = 0;
      Object.assign(S, { on: !!s.on, cat: !!s.cat, T: s.T, gas: !!s.gas }); g.visible = S.on; g.scale.setScalar(S.on ? 1 : 0.001); slab.visible = disc.visible = S.cat; // đang ẩn thì thu nhỏ hẳn để không chắn cú chạm vào món phía sau
      if (flip) { hideUnits(); free.forEach((f) => { f.grp.visible = S.gas && !S.cat; }); }
    },
    update(dt) {
      if (!g.visible) return; dt = Math.min(safe(dt), 0.05); if (!dt || !S.gas) return;
      if (S.cat) units.forEach((u) => { S.made += u.sim.step(dt, S.T); const P = pose(u.sim.u).atoms, shown = u.sim.shown(); u.atoms.forEach((m, k) => { const a = shown ? P[k].a : 0; m.visible = a > 0.02; if (m.visible) { m.position.set(P[k].p[0], P[k].p[1], P[k].p[2]); m.scale.setScalar(0.35 + 0.65 * a); } }); });
      else {
        const sp2 = 0.7 + 0.6 * Math.max(0, Math.min(1, (S.T - 200) / 500)), LIM = 0.74;
        free.forEach((f) => { f.grp.position.addScaledVector(f.v, dt * sp2); f.grp.rotation.x += f.w.x * dt; f.grp.rotation.y += f.w.y * dt; f.grp.rotation.z += f.w.z * dt; const r = f.grp.position.length(); if (r > LIM) { nrm.copy(f.grp.position).divideScalar(r); const vn = f.v.dot(nrm); if (vn > 0) f.v.addScaledVector(nrm, -2 * vn); f.grp.position.copy(nrm).multiplyScalar(LIM); } });
        for (let a = 0; a < free.length; a++) for (let b = a + 1; b < free.length; b++) { // va nhau thì bật ra, không phân tử nào tách
          nrm.copy(free[b].grp.position).sub(free[a].grp.position); const dd = nrm.length(); if (dd > 0.17 || dd < 1e-6) continue; nrm.divideScalar(dd);
          const closing = rv.copy(free[b].v).sub(free[a].v).dot(nrm); if (closing < 0) { free[a].v.addScaledVector(nrm, closing); free[b].v.addScaledVector(nrm, -closing); }
        }
      }
    } };
  return g;
}

// Gắn hình dựng khối vào khai báo của giáo án (giáo án không biết gì về 3D): món nào dựng bằng hàm nào.
const MAKE = { base: makeBase, feed: makeFeed, comp: makeComp, tower: makeTower, catbox: makeCatBox, cool: makeCool, sep: makeSep, loop: makeLoop, panel: makePanel, pipes: makePipes, lens: makeLens, lensfoot: makeLensFoot };
// NỀN (chủ 27/11: "có cần để background bàn đằng sau thế kia k- sao k dựng 3d nền canvas như mẫu"): mặc định NỀN TRƠN, chỉ có sa bàn trên một vệt sáng,
// không phòng lab, không mặt bàn phía sau (tủ và tay nắm tủ lẫn vào tháp, ống). Thêm &nen=phong vào địa chỉ để xem lại bản đặt trên bàn trong phòng.
const STUDIO = typeof location === 'undefined' || new URLSearchParams(location.search).get('nen') !== 'phong';
export const declaration = (decl) => ({ ...decl, benches: decl.benches.map((b) => ({ ...b, ...(STUDIO ? { backdrop: 0xcfd9df, island: false } : {}),
  items: b.items.map((it) => (MAKE[it.id] ? { ...it, make3d: MAKE[it.id], ...(it.id === 'base' ? { opts: { studio: STUDIO } } : {}) } : it)) })) });

// ---------- KÉO NÚM NGAY TRÊN SA BÀN (27/11, chủ: "thao tác các nút ở màn hình chính chứ k phải panel") ----------
// Món nào khai userData.dial = { key, mode, hit, ring, tap? } thì kéo được: 'abs' = kéo kim quanh tâm mặt đồng hồ (góc → số), 'turn' = vặn vô lăng (góc quay cộng dồn → số).
// Bắt cử chỉ ở pha capture của khung sân khấu nên máy quay không xoay khi đang kéo núm. Chạm mà không kéo trên món có tap thì vẫn là "chạm" của bài (lab.hand).
// set(key, value) → true/false do bài quyết (bước nào cho chỉnh); get(key) = số hiện tại; range(key) = [min, max]. Trả sync(slide) để bật vòng gợi ý theo bước.
export function connectDials(lab, bid, { set, get, range }) {
  const { camera, renderer } = lab.stage, cv = renderer.domElement, host = cv.parentElement, ray = new T.Raycaster(), ndc = new T.Vector2(), w = new T.Vector3();
  const A0 = 0.8 * Math.PI, A1 = 2.2 * Math.PI, frac = (dx, dy) => { let a = Math.atan2(dy, dx); if (a < Math.PI * 0.5) a += 2 * Math.PI; return Math.max(0, Math.min(1, (a - A0) / (A1 - A0))); };
  const dials = () => Object.entries(lab.benches[bid].items).map(([id, it]) => it.obj && it.obj.userData.dial && it.obj.visible ? { id, ...it.obj.userData.dial } : null).filter(Boolean);
  const pick = (e) => { const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); camera.updateMatrixWorld(); ray.setFromCamera(ndc, camera);
    let best = null; dials().forEach((d) => { const hit = ray.intersectObject(d.hit, false)[0]; if (hit && (!best || hit.distance < best.dist)) best = { d, dist: hit.distance }; }); return best && best.d; };
  const centre = (d) => { d.hit.getWorldPosition(w).project(camera); const r = cv.getBoundingClientRect(); return [r.left + ((w.x + 1) / 2) * r.width, r.top + ((1 - w.y) / 2) * r.height]; };
  let drag = null;
  host.addEventListener('pointerdown', (e) => {
    if (e.button > 0 || lab.active() !== bid) return; const d = pick(e); if (!d) return;
    e.stopPropagation(); e.preventDefault(); drag = { d, id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false, a: null, v0: get(d.key), acc: 0 }; d.ring.scale.setScalar(1.12);
  }, true);
  window.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return; if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 5) return; drag.moved = true;
    const { d } = drag, [cx, cy] = centre(d), dx = e.clientX - cx, dy = e.clientY - cy, [min, max] = range(d.key);
    if (d.mode === 'abs') { set(d.key, min + (max - min) * frac(dx, dy)); return; }
    const a = Math.atan2(dy, dx); if (drag.a == null) drag.a = a; let da = a - drag.a; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI; drag.a = a; drag.acc += da;
    set(d.key, drag.v0 + (drag.acc / (1.5 * Math.PI)) * (max - min)); // vặn ba phần tư vòng là đi hết thang
  });
  ['pointerup', 'pointercancel'].forEach((n) => window.addEventListener(n, (e) => { if (!drag || e.pointerId !== drag.id) return; const { d, moved } = drag; drag = null; d.ring.scale.setScalar(1); if (!moved && d.tap && n === 'pointerup') lab.hand(bid, d.id); }));
  return { sync(slide = []) { dials().forEach((d) => { d.ring.visible = slide.includes(d.key); }); } };
}
