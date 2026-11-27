// BỘ BỐI CẢNH DÙNG CHUNG cho các bài SA BÀN (DEFINE_SA_BAN.md mục 10, chủ 27/11: "define kĩ logic- tỉ lệ- làm cho chuẩn nhé-phù hợp bối cảnh bài chủ để sa bàn").
// MỘT THƯỚC cho cả cảnh: 1 đơn vị bàn = 8 m. Mọi món ở đây thuộc hạng B (bối cảnh, đúng tỉ lệ, lấy người 1,7 m làm thước): người 0,21 · cây 0,8–1,1 · đường rộng 0,9 · xe bồn dài 1,4…
// Dựng khối ít mặt bằng mã, không ảnh ngoài. Món bối cảnh KHÔNG chạm được, không thẻ tên; màu nhạt hơn thiết bị một nấc. Bài chỉ khai bảng "món gì, ở đâu".
import * as T from 'three';

export const M_PER_U = 8;
export const u = (metres) => metres / M_PER_U; // đổi mét thật sang đơn vị bàn
const std = (color, o = {}) => new T.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0, flatShading: true, ...o });
const add = (g, geo, mat, x = 0, y = 0, z = 0) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; m.raycast = () => {}; g.add(m); return m; };
const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const MAT = {
  // cây theo 10.9: màu nhạt, hơi xám, mặt mịn (không góc cạnh), để lùi về sau thiết bị và tan vào sương
  trunk: std('#9a8a78', { flatShading: false }), leaf: [std('#a9c0a2', { flatShading: false }), std('#9fb69a', { flatShading: false }), std('#b3c8ad', { flatShading: false })], palm: std('#a3b99c', { flatShading: false }), bush: std('#b0c4a8', { flatShading: false }), cone: std('#9db39a', { flatShading: false }),
  skin: std('#e6c2a3'), helmet: std('#f2b631', { roughness: 0.5 }), cloth: [std('#4d78b8'), std('#d8763a'), std('#5b6b7a')],
  white: std('#eef1f3', { roughness: 0.6 }), cab: std('#6f8798', { roughness: 0.55 }), tyre: std('#2f3438'), steel: std('#aab4bc', { roughness: 0.5, metalness: 0.3 }),
  wall: std('#e7ebee'), roof: std('#86a9cc', { roughness: 0.6 }), dark: std('#4a545c'), lamp: new T.MeshStandardMaterial({ color: '#fff7dd', emissive: '#ffe9a8', emissiveIntensity: 0.6 }),
};

// ---------- MẶT ĐẤT có vân: vẽ lên canvas (x: −w/2 → w/2 từ trái sang phải; z: −d/2 ở mép trên → d/2 ở mép dưới = phía người xem) ----------
// zones: [{ x, z0, z1, w, fill, line, no }] viền khu đậm màu · roads: [{ z0, z1 }] · grass: [{ z0, z1 }] · badge(c, x, y, r, no, color): hàm vẽ huy hiệu số của bài
export function veMatDat(c, W, H, { w, d, zones = [], roads = [], grass = [], badge = null, font = 'sans-serif', seed = 5 }) {
  const s = W / w, X = (x) => (x + w / 2) * s, Z = (z) => (z + d / 2) * s, R = rng(seed);
  c.fillStyle = '#ece8e1'; c.fillRect(0, 0, W, H); // nền đất ấm (DEFINE_SA_BAN 10.8)
  // tấm bê tông 1 đơn vị (8 m): mỗi tấm sáng tối hơi khác nhau, mạch ghép mảnh
  for (let ix = 0; ix < Math.ceil(w); ix++) for (let iz = 0; iz < Math.ceil(d); iz++) { const k = (R() - 0.5) * 0.045; c.fillStyle = k > 0 ? `rgba(255,255,255,${k * 4})` : `rgba(60,70,80,${-k * 2.2})`; c.fillRect(ix * s, iz * s, s, s); }
  c.strokeStyle = 'rgba(150,140,128,0.3)'; c.lineWidth = Math.max(1.5, s * 0.012);
  for (let x = 0; x <= w; x++) { c.beginPath(); c.moveTo(x * s, 0); c.lineTo(x * s, H); c.stroke(); }
  for (let z = 0; z <= d; z++) { c.beginPath(); c.moveTo(0, z * s); c.lineTo(W, z * s); c.stroke(); }
  // vệt loang: nước mưa, dầu, vết bánh xe
  for (let i = 0; i < 70; i++) { const x = R() * W, y = R() * H, r = s * (0.15 + R() * 0.55), g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(70,78,86,${0.05 + R() * 0.07})`); g.addColorStop(1, 'rgba(70,78,86,0)'); c.fillStyle = g; c.save(); c.translate(x, y); c.scale(1 + R() * 1.6, 1); c.translate(-x, -y); c.fillRect(x - r * 3, y - r, r * 6, r * 2); c.restore(); }
  // dải cỏ
  grass.forEach(({ z0, z1 }) => { c.fillStyle = '#d2e3c6'; c.fillRect(0, Z(z0), W, Z(z1) - Z(z0)); for (let i = 0; i < 900; i++) { c.fillStyle = R() > 0.5 ? 'rgba(120,170,100,0.35)' : 'rgba(235,245,225,0.5)'; c.fillRect(R() * W, Z(z0) + R() * (Z(z1) - Z(z0)), s * 0.03, s * 0.015); } });
  // đường nhựa: hai vạch mép liền, vạch tim đứt
  roads.forEach(({ z0, z1 }) => { const y0 = Z(z0), y1 = Z(z1), hh = y1 - y0; c.fillStyle = '#7a8189'; c.fillRect(0, y0, W, hh);
    for (let i = 0; i < 1600; i++) { c.fillStyle = R() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'; c.fillRect(R() * W, y0 + R() * hh, s * 0.04, s * 0.012); }
    c.fillStyle = '#eef1f2'; c.fillRect(0, y0 + hh * 0.07, W, hh * 0.025); c.fillRect(0, y1 - hh * 0.095, W, hh * 0.025);
    c.fillStyle = '#f3e7b0'; for (let x = 0; x < W; x += s * 0.75) c.fillRect(x, y0 + hh * 0.49, s * 0.4, hh * 0.03); });
  // khu của bài: lòng sáng hơn nền, viền đậm màu khu
  // Tên khu: nhãn nhỏ nằm trên mặt đất ở góc trước bên trái của khu (huy hiệu số + tên, chữ cao 0,16 đơn vị), nền trắng mờ để đọc được trên vân đất
  zones.forEach(({ x, z0, z1, w: zw, fill = 'rgba(255,255,255,0.6)', line, no, name }) => { const x0 = X(x - zw / 2), y0 = Z(z0), ww = zw * s, hh = Z(z1) - y0, lw = s * 0.07;
    c.fillStyle = fill; c.fillRect(x0, y0, ww, hh); c.strokeStyle = line; c.lineWidth = lw; c.lineJoin = 'miter'; c.strokeRect(x0 + lw / 2, y0 + lw / 2, ww - lw, hh - lw);
    if (!no) return; const fs = s * 0.16, r = fs * 0.62, cy = y0 + hh - lw - s * 0.2, bx = x0 + lw + s * 0.12 + r;
    c.font = `600 ${fs}px ${font}`; const tw = name ? Math.min(c.measureText(name).width, ww - lw * 2 - r * 2 - s * 0.36) : 0;
    c.fillStyle = 'rgba(255,255,255,0.88)'; c.beginPath(); c.roundRect(bx - r - s * 0.06, cy - r - s * 0.05, r * 2 + (tw ? tw + s * 0.2 : 0) + s * 0.12, r * 2 + s * 0.1, r + s * 0.05); c.fill();
    if (badge) badge(c, bx, cy, r, no, line);
    if (name) { c.font = `600 ${fs}px ${font}`; c.fillStyle = '#26323a'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(name, bx + r + s * 0.08, cy + fs * 0.04, tw); } });
}

// ---------- Cây, bụi ----------
export function cayTan({ h = 0.95, seed = 1 } = {}) { // cây tán tròn (bàng, xà cừ): thân + ba khối tán
  const g = new T.Group(), R = rng(seed * 97);
  add(g, new T.CylinderGeometry(h * 0.03, h * 0.045, h * 0.5, 6), MAT.trunk, 0, h * 0.25, 0);
  [[0, 0.66, 0, 0.3], [0.13, 0.56, 0.06, 0.22], [-0.12, 0.58, -0.07, 0.24]].forEach(([x, y, z, r], i) => { const m = add(g, new T.SphereGeometry(h * r, 14, 10), MAT.leaf[(i + seed) % 3], h * x, h * y, h * z); m.scale.y = 0.86; });
  g.rotation.y = R() * 6.28; return g;
}
export function cayDua({ h = 1.05, seed = 1 } = {}) { // cây dừa: thân hơi cong, tàu lá rủ
  const g = new T.Group(), R = rng(seed * 131), lean = (R() - 0.5) * 0.3; let x = 0, y = 0;
  for (let i = 0; i < 4; i++) { const seg = h * 0.2, m = add(g, new T.CylinderGeometry(h * 0.022, h * 0.03, seg, 6), MAT.trunk, x, y + seg / 2, 0); m.rotation.z = -lean * (i / 3); x += Math.sin(lean * (i / 3)) * seg; y += seg * 0.98; }
  for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.283 + R(), L = h * (0.3 + R() * 0.08), leaf = add(g, new T.BoxGeometry(L, h * 0.012, h * 0.085), MAT.palm, x + Math.cos(a) * L * 0.42, y - h * 0.035, Math.sin(a) * L * 0.42); leaf.rotation.y = -a; leaf.rotation.z = -0.42; leaf.rotateY(0); }
  add(g, new T.SphereGeometry(h * 0.035, 6, 5), MAT.trunk, x, y - h * 0.01, 0); g.rotation.y = R() * 6.28; return g;
}
export function buiCo({ r = 0.14, seed = 1 } = {}) { const g = new T.Group(), R = rng(seed * 53); [[0, 0, 1], [0.8, 0.3, 0.7], [-0.7, -0.4, 0.75]].forEach(([x, z, k]) => { const m = add(g, new T.SphereGeometry(r * k, 12, 8), MAT.bush, x * r, r * k * 0.55, z * r); m.scale.y = 0.62; m.rotation.y = R() * 6; }); return g; }
// cây nón (cây lá kim, kiểu sa bàn trưng bày): thân ngắn + nón nhạt, mặt mịn
export function cayNon({ h = 0.9, seed = 1 } = {}) { const g = new T.Group(), R = rng(seed * 71); add(g, new T.CylinderGeometry(h * 0.025, h * 0.035, h * 0.18, 8), MAT.trunk, 0, h * 0.09, 0); const c = add(g, new T.ConeGeometry(h * 0.24, h * 0.82, 16), MAT.cone, 0, h * 0.18 + h * 0.41, 0); c.rotation.y = R() * 6; return g; }

// ---------- Người (thước 1,7 m), xe bồn, nhà kho, cột đèn, hàng rào ----------
export function nguoi({ seed = 1, ry = 0 } = {}) {
  const g = new T.Group(), h = u(1.7);
  add(g, new T.CylinderGeometry(h * 0.13, h * 0.11, h * 0.46, 6), MAT.dark, 0, h * 0.23, 0);                 // chân
  add(g, new T.CylinderGeometry(h * 0.15, h * 0.14, h * 0.36, 6), MAT.cloth[seed % 3], 0, h * 0.64, 0);       // áo
  add(g, new T.SphereGeometry(h * 0.085, 8, 6), MAT.skin, 0, h * 0.9, 0);
  const hat = add(g, new T.SphereGeometry(h * 0.1, 8, 5, 0, 6.283, 0, 1.7), MAT.helmet, 0, h * 0.93, 0); hat.scale.y = 0.8; // mũ bảo hộ vàng
  g.rotation.y = ry; return g;
}
export function xeBon({ ry = 0 } = {}) { // xe bồn dài 11 m: cabin + bồn trụ nằm
  const g = new T.Group(), L = u(11), wd = u(2.5);
  add(g, new T.BoxGeometry(L, u(0.4), wd * 0.8), MAT.dark, 0, u(1.0), 0);
  add(g, new T.BoxGeometry(u(2.3), u(2.5), wd), MAT.cab, L / 2 - u(1.15), u(2.2), 0);
  add(g, new T.BoxGeometry(u(0.1), u(1.0), wd * 0.84), MAT.dark, L / 2 + u(0.02), u(2.75), 0);                 // kính lái
  const tank = add(g, new T.CylinderGeometry(u(1.15), u(1.15), u(7.4), 14), MAT.white, -u(1.25), u(2.35), 0); tank.rotation.z = Math.PI / 2;
  [-1, 1].forEach((sd) => { const cap = add(g, new T.SphereGeometry(u(1.15), 12, 8), MAT.white, -u(1.25) + sd * u(3.7), u(2.35), 0); cap.scale.x = 0.35; });
  const band = add(g, new T.CylinderGeometry(u(1.17), u(1.17), u(0.5), 14), MAT.cab, -u(1.25), u(2.35), 0); band.rotation.z = Math.PI / 2;
  [L / 2 - u(1.4), -u(0.4), -u(3.2), -u(4.4)].forEach((x) => [-1, 1].forEach((sd) => { const wl = add(g, new T.CylinderGeometry(u(0.52), u(0.52), u(0.35), 10), MAT.tyre, x, u(0.52), sd * wd * 0.42); wl.rotation.x = Math.PI / 2; }));
  g.rotation.y = ry; return g;
}
export function nhaKho({ w = 3.0, d = 1.6, h = 1.0 } = {}) { // nhà kho mái dốc hai phía
  const g = new T.Group(), hw = h * 0.68;
  add(g, new T.BoxGeometry(w, hw, d), MAT.wall, 0, hw / 2, 0);
  const tri = new T.Shape([new T.Vector2(-d / 2 - 0.04, 0), new T.Vector2(d / 2 + 0.04, 0), new T.Vector2(0, h - hw)]), roof = new T.ExtrudeGeometry(tri, { depth: w + 0.08, bevelEnabled: false });
  roof.rotateY(Math.PI / 2); roof.translate(-(w + 0.08) / 2, hw, 0); add(g, roof, MAT.roof);
  [-0.3, 0.3].forEach((k) => add(g, new T.BoxGeometry(w * 0.16, hw * 0.72, 0.02), MAT.dark, w * k, hw * 0.36, d / 2 + 0.006)); // hai cửa cuốn
  for (let i = 0; i < 5; i++) add(g, new T.BoxGeometry(w * 0.07, hw * 0.14, 0.02), MAT.dark, -w * 0.4 + i * w * 0.2, hw * 0.86, d / 2 + 0.006); // dãy cửa sổ cao
  return g;
}
export function cotDen({ h = 1.1, ry = 0 } = {}) { const g = new T.Group(); add(g, new T.CylinderGeometry(0.012, 0.018, h, 6), MAT.steel, 0, h / 2, 0); const arm = add(g, new T.BoxGeometry(0.16, 0.012, 0.012), MAT.steel, 0.07, h, 0); void arm; add(g, new T.BoxGeometry(0.08, 0.018, 0.04), MAT.lamp, 0.14, h - 0.012, 0); g.rotation.y = ry; return g; }
export function hangRao({ len = 10, h = 0.28, gap = 0.5 } = {}) { const g = new T.Group(), n = Math.round(len / gap); for (let i = 0; i <= n; i++) add(g, new T.BoxGeometry(0.02, h, 0.02), MAT.steel, -len / 2 + (i * len) / n, h / 2, 0); [0.92, 0.5].forEach((k) => add(g, new T.BoxGeometry(len, 0.012, 0.012), MAT.steel, 0, h * k, 0)); return g; }

// ---------- PHÔNG XA: tấm phông cong ôm sau đế. Trời nhạt, hai lớp núi thấp mờ dần, một dải nước; không nhận sương, không đổ bóng ----------
export function phongXa({ R = 21, h = 11, y0 = -1.2, span = 3.9, seed = 9, water = true, base = '#ece8e1' } = {}) {
  const cv = document.createElement('canvas'); cv.width = 4096; cv.height = 768; const c = cv.getContext('2d'), W = cv.width, H = cv.height, rr = rng(seed), hz = H * 0.8; // đường chân trời
  const sky = c.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, '#bfd9ff'); sky.addColorStop(0.55, '#dce9ff'); sky.addColorStop(1, '#f2f6ff'); // trời theo bảng 10.8 c.fillStyle = sky; c.fillRect(0, 0, W, hz);
  const ridge = (amp, y, col, n) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, hz); let x = 0, yy = y; while (x <= W) { c.lineTo(x, yy); x += W / n * (0.6 + rr() * 0.8); yy = y - amp * (0.25 + rr() * 0.75); } c.lineTo(W, hz); c.closePath(); c.fill(); };
  ridge(H * 0.2, hz - H * 0.04, '#d5dde6', 26); ridge(H * 0.12, hz - H * 0.015, '#c3cfc8', 34);
  if (water) { const wg = c.createLinearGradient(0, hz, 0, hz + H * 0.06); wg.addColorStop(0, '#c4d6dd'); wg.addColorStop(1, '#d6e2e3'); c.fillStyle = wg; c.fillRect(0, hz, W, H * 0.06); }
  const gd = c.createLinearGradient(0, hz + (water ? H * 0.06 : 0), 0, H); gd.addColorStop(0, '#d9e4d6'); gd.addColorStop(1, base); c.fillStyle = gd; c.fillRect(0, hz + (water ? H * 0.06 : 0), W, H);
  const haze = c.createLinearGradient(0, hz - H * 0.3, 0, hz + H * 0.1); haze.addColorStop(0, 'rgba(243,242,240,0)'); haze.addColorStop(0.8, 'rgba(243,242,240,0.6)'); haze.addColorStop(1, 'rgba(243,242,240,0)'); c.fillStyle = haze; c.fillRect(0, hz - H * 0.3, W, H * 0.4);
  const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 8;
  const m = new T.Mesh(new T.CylinderGeometry(R, R, h, 64, 1, true, Math.PI - span / 2, span), new T.MeshBasicMaterial({ map: tex, side: T.BackSide, fog: false, toneMapped: false }));
  m.position.y = y0 + h / 2; m.raycast = () => {}; m.renderOrder = -2; return m;
}

// ---------- Rải bối cảnh theo bảng của bài: [[loại, x, z, tuỳ chọn], …]. y = mặt đất của đế ----------
// Hộp kĩ thuật (tủ điện, hộp đấu dây) trên hai chân ngắn: chi tiết nhỏ của khu thiết bị, cao 1,5 m
export function hopKT({ ry = 0 } = {}) { const g = new T.Group(); [-0.04, 0.04].forEach((x) => add(g, new T.BoxGeometry(0.012, 0.08, 0.012), MAT.steel, x, 0.04, 0)); add(g, new T.BoxGeometry(0.14, 0.14, 0.07), MAT.wall, 0, 0.15, 0); add(g, new T.BoxGeometry(0.1, 0.02, 0.005), MAT.dark, 0, 0.19, 0.036); g.rotation.y = ry; return g; }
const MAKE = { 'hop-kt': hopKT, 'cay-tan': cayTan, 'cay-dua': cayDua, 'cay-non': cayNon, bui: buiCo, nguoi, 'xe-bon': xeBon, 'nha-kho': nhaKho, 'cot-den': cotDen, 'hang-rao': hangRao };
export function raiBoiCanh(table, y = 0) {
  const g = new T.Group(); g.name = 'boi-canh';
  table.forEach(([kind, x, z, o = {}], i) => { const f = MAKE[kind]; if (!f) return; const m = f({ seed: i + 1, ...o }); m.position.set(x, y, z); g.add(m); });
  return g;
}
