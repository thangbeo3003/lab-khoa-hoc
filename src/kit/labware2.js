// Bộ đồ dùng cho luồng 2 (phòng thực hành tự do), dựng bằng mã theo kích thước thật. Đơn vị: 1 = 10 cm.
// Vân bề mặt (kim loại, chất rắn, gỗ, cao su) là ảnh Codex LAB-006 trong assets/tex/; thiếu ảnh thì dùng màu phẳng.
import * as THREE from 'three';
import { PAL, glassPair, glassShell, liquidMat, solidMat, steelMat, canvasTexture, labelTexture, contactShadow, FONT } from './materials.js';
import { gradDecal, makeBottle } from './labware.js';

const V2 = (p) => new THREE.Vector2(p[0], p[1]);
const lathe = (pts, seg = 48, a0 = 0, a1 = Math.PI * 2) => new THREE.LatheGeometry(pts.map(V2), seg, a0, a1);
const cyl = (r1, r2, h, seg = 28) => new THREE.CylinderGeometry(r1, r2, h, seg);
const shadowAll = (g) => { g.traverse((o) => { if (o.isMesh && !o.material.transparent) o.castShadow = true; }); return g; };

// ---------- vân bề mặt ----------
const TEX_BASE = new URL('../../assets/tex/', import.meta.url).href;
const loader = new THREE.TextureLoader(), cache = {}, pending = [];
// Vật liệu có vân: tạo ngay với màu dự phòng, ảnh tải xong thì gắn vào. settled() chờ mọi ảnh đang tải.
export function texMat(name, { fallback = 0x999999, roughness = 0.8, metalness = 0, rep = 1, ...extra } = {}) {
  const mat = new THREE.MeshStandardMaterial({ color: fallback, roughness, metalness, ...extra });
  if (!cache[name]) cache[name] = new Promise((ok) => loader.load(`${TEX_BASE}${name}.jpg`, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; ok(t); }, undefined, () => ok(null)));
  pending.push(cache[name].then((t) => { if (!t) return; const m = t.clone(); m.repeat.set(rep, rep); m.needsUpdate = true; mat.map = m; mat.color.set(0xffffff); mat.needsUpdate = true; }));
  return mat;
}
export const settled = () => Promise.all(pending);
const METAL = { Na: ['tex_sodium', 0xc9ccd0, 0.55, 0.5], Mg: ['tex_magnesium', 0xc3c7cb, 0.85, 0.42], Al: ['tex_aluminium', 0xd6d9dc, 0.9, 0.35], Zn: ['tex_zinc', 0x9aa3ab, 0.85, 0.45], Fe: ['tex_iron', 0x6f757b, 0.85, 0.45], Cu: ['tex_copper', 0xc7713f, 0.95, 0.32], Ag: ['tex_silver', 0xe6e8ea, 1, 0.22] };
const POWDER = { CaCO3: ['tex_limestone', 0xeeeae0], CaO: ['tex_cao', 0xf5f4f0], CuO: ['tex_cuo', 0x1c1c1e], MnO2: ['tex_mno2', 0x2a2725] };
const metalMat = (id, extra = {}) => { const [n, c, m, r] = METAL[id]; return texMat(n, { fallback: c, metalness: m, roughness: r, ...extra }); };
const powderMat = (id, rep = 1) => { const [n, c] = POWDER[id]; return texMat(n, { fallback: c, roughness: 1, rep }); };

// Khối méo tự nhiên: hình cầu bị nắn theo hàm của vị trí (không hở đường nối).
function blob(r, seed = 1, k = 0.22, seg = 20) {
  const g = new THREE.SphereGeometry(r, seg, Math.round(seg * 0.7)), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) / r, y = p.getY(i) / r, z = p.getZ(i) / r;
    const f = 1 + k * (Math.sin(3.1 * x + seed) + Math.sin(4.3 * y + 2 * seed) + Math.sin(3.7 * z + 3 * seed) + Math.sin(7 * (x + y + z) + seed)) / 4;
    p.setXYZ(i, p.getX(i) * f, p.getY(i) * f, p.getZ(i) * f); }
  g.computeVertexNormals(); return g;
}
function rng(seed) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

// ---------- Cốc thuỷ tinh có mỏ 100 mL: Ø 5 cm, cao 7 cm ----------
export function makeBeaker({ r = 0.25, h = 0.73, max = 100 } = {}) {
  const g = new THREE.Group(), T = 0.018;
  const spout = (geo) => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < h - 0.09) continue; const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), f = Math.max(0, 1 - Math.abs(a) / 0.42) * ((y - (h - 0.09)) / 0.09); p.setX(i, x + 0.075 * f * f); p.setY(i, y - 0.012 * f); } geo.computeVertexNormals(); return geo; };
  const outer = spout(lathe([[0, 0], [r - 0.03, 0], [r, 0.03], [r, h - 0.03], [r + 0.012, h]], 64));
  const inner = spout(lathe([[0, 0.03], [r - 0.03 - T, 0.03], [r - T, 0.05], [r - T, h - 0.03], [r + 0.012 - T, h]], 64));
  const glass = glassShell(outer, inner);
  const liquid = new THREE.Mesh(new THREE.BufferGeometry(), liquidMat(PAL.water, 0.55)); liquid.renderOrder = 1;
  const yOf = (mL) => 0.035 + (mL / max) * (h * 0.76);
  const setVolume = (mL, color) => { liquid.visible = mL > 0; if (color != null) liquid.material.color.set(color); if (!liquid.visible) return; const l = yOf(mL); liquid.geometry.dispose(); liquid.geometry = lathe([[0, 0.035], [r - T - 0.034, 0.035], [r - T - 0.004, 0.055], [r - T - 0.004, l], [0, l]], 48); g.userData.mL = mL; };
  const marks = [20, 40, 60, 80, 100].map((v) => [(yOf(v) - 0.05) / (h * 0.86), String(v), v % 40 === 0 || v === 100]);
  const decal = gradDecal([[r + 0.003, 0.05], [r + 0.003, 0.05 + h * 0.86]], marks, { arc: 0.9 }); // vạch quay về phía người nhìn (+z), mỏ ở +x
  g.add(contactShadow(r * 1.9), liquid, glass, decal);
  g.userData = { liquid, setVolume, r, h, max, mL: 0 };
  setVolume(0);
  return g;
}

// ---------- Ống nhỏ giọt thuỷ tinh có quả bóp cao su, dài 15 cm. Gốc ở đầu nhỏ giọt, hướng lên +y ----------
export function makeDropper() {
  const g = new THREE.Group();
  const glass = glassPair(lathe([[0.011, 0], [0.014, 0.28], [0.04, 0.42], [0.04, 1.17], [0.05, 1.185], [0.05, 1.2]], 24), 0xd3e3e8, 0.36);
  const liquid = new THREE.Mesh(new THREE.BufferGeometry(), liquidMat(PAL.water, 0.7)); liquid.renderOrder = 1;
  const bulb = new THREE.Mesh(lathe([[0.046, 0], [0.052, 0.03], [0.05, 0.06], [0.072, 0.14], [0.08, 0.26], [0.07, 0.38], [0.04, 0.44], [0, 0.455]], 28), texMat('tex_rubber', { fallback: 0x2b2e33, roughness: 0.85 }));
  bulb.position.y = 1.15; bulb.castShadow = true;
  const setFill = (f, color) => { liquid.visible = f > 0.01; if (color != null) liquid.material.color.set(color); if (!liquid.visible) return; const l = 0.3 + f * 0.75; liquid.geometry.dispose(); liquid.geometry = lathe([[0, 0.005], [0.008, 0.005], [0.011, 0.28], [0.03, 0.42], [0.03, Math.max(l, 0.43)], [0, Math.max(l, 0.43)]], 20); g.userData.fill = f; };
  const squeeze = (s) => { bulb.scale.set(1 - 0.35 * s, 1, 1 - 0.35 * s); };
  g.add(liquid, glass, bulb);
  g.userData = { liquid, bulb, setFill, squeeze, L: 1.6, fill: 0 };
  setFill(0);
  return g;
}

// ---------- Lọ nhỏ giọt 30 mL thuỷ tinh nâu (chất chỉ thị) ----------
export function makeDropperBottle({ title = 'PP', name = '' } = {}) {
  const g = new THREE.Group(), r = 0.17, h = 0.5;
  const body = glassShell(lathe([[0, 0], [r - 0.03, 0], [r, 0.03], [r, h - 0.08], [0.1, h], [0.08, h + 0.02], [0.08, h + 0.12]], 40), lathe([[0, 0.04], [r - 0.05, 0.04], [r - 0.02, 0.06], [r - 0.02, h - 0.09], [0.085, h - 0.01], [0.065, h + 0.02], [0.065, h + 0.12]], 40), PAL.amber, 0.9);
  const cap = new THREE.Mesh(cyl(0.105, 0.105, 0.11, 32), solidMat(0x1e2124, 0.5)); cap.position.y = h + 0.1;
  const bulb = new THREE.Mesh(lathe([[0.05, 0], [0.065, 0.08], [0.06, 0.2], [0.03, 0.27], [0, 0.28]], 24), texMat('tex_rubber', { fallback: 0x2b2e33, roughness: 0.85 })); bulb.position.y = h + 0.155;
  const tex = canvasTexture(512, 300, (c, w, hh) => { c.fillStyle = '#fff'; c.fillRect(0, 0, w, hh); c.fillStyle = '#2f6fd0'; c.fillRect(0, 0, w, 22); c.fillStyle = '#16324f'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 ${name ? 96 : 120}px ${FONT}`; c.fillText(title, w / 2, name ? 120 : 160, w - 40); if (name) { c.font = `600 48px ${FONT}`; c.fillStyle = '#34495e'; c.fillText(name, w / 2, 222, w - 40); } });
  const label = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.003, r + 0.003, 0.26, 40, 1, true, -0.9, 1.8), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 })); label.position.y = 0.22; label.renderOrder = 6;
  g.add(contactShadow(r * 1.8), body, cap, bulb, label);
  g.userData = { cap, bulb, top: h + 0.43 };
  return shadowAll(g);
}

// ---------- Đũa thuỷ tinh Ø 6 mm, dài 20 cm. Gốc ở đầu dưới, hướng lên +y ----------
export function makeGlassRod({ L = 2.5, r = 0.03 } = {}) {
  const g = new THREE.Group();
  const rod = glassPair(new THREE.CapsuleGeometry(r, L - 2 * r, 8, 20), 0xcfe2e8, 0.5); rod.position.y = L / 2;
  g.add(rod); g.userData = { L };
  return g;
}

// ---------- Kẹp ống nghiệm bằng gỗ, dài 18 cm. Gốc ở tâm ngàm kẹp, cán chạy về +x, ống nghiệm lọt theo trục z ----------
export function makeTubeHolder() {
  const g = new THREE.Group(), W = 0.16, R = 0.092;
  const wood = () => texMat('tex_wood', { fallback: 0xd9bd8f, roughness: 0.7, rep: 1 });
  const arm = (len, sign) => { const s = new THREE.Shape(); // mặt bên của một má kẹp; sign = -1 má dưới, +1 má trên
    s.moveTo(-0.16, sign * 0.125); s.lineTo(0.2, sign * 0.125); s.lineTo(0.42, sign * 0.085); s.lineTo(len, sign * 0.07); s.lineTo(len, sign * 0.012); s.lineTo(R, sign * 0.012);
    s.absarc(0, 0.0, R, sign > 0 ? 0.13 : -0.13, sign > 0 ? Math.PI - 0.13 : -Math.PI + 0.13, sign > 0 ? false : true); s.lineTo(-0.16, sign * 0.012); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: W, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2, curveSegments: 18 }); geo.translate(0, 0, -W / 2);
    const m = new THREE.Mesh(geo, wood()); m.castShadow = true; return m; };
  const lower = arm(1.8, -1), upper = arm(1.15, 1);
  const pivot = new THREE.Group(); pivot.position.set(0.95, 0, 0); upper.position.x = -0.95; pivot.add(upper);
  const spring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.013, 8, 24), steelMat()); spring.position.set(0.95, 0, 0);
  const pin = new THREE.Mesh(cyl(0.02, 0.02, W + 0.03, 12), steelMat()); pin.rotation.x = Math.PI / 2; pin.position.set(0.95, 0, 0);
  const setOpen = (a) => { pivot.rotation.z = -a; };
  g.add(lower, pivot, spring, pin);
  g.userData = { setOpen, jawR: R, L: 1.95 };
  return g;
}

// ---------- Thìa xúc hoá chất bằng thuỷ tinh, dài 160 mm, thân Φ5 mm (danh mục mục 1.19). Gốc ở giữa lòng thìa, cán chạy về +x ----------
export function makeSpatula() {
  const g = new THREE.Group();
  const bowlGeo = new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const bowl = glassPair(bowlGeo, 0xcfe2e8, 0.5); bowl.scale.set(0.13, 0.035, 0.06); bowl.position.y = 0.035;
  const rod = glassPair(new THREE.CapsuleGeometry(0.025, 1.42, 6, 14), 0xcfe2e8, 0.5); rod.rotation.z = Math.PI / 2; rod.position.set(0.86, 0.036, 0);
  const holder = new THREE.Group(); holder.position.set(0, 0.012, 0); // chỗ đặt chất rắn đang xúc
  g.add(bowl, rod, holder);
  g.userData = { holder, L: 1.6 };
  return g;
}

// ---------- Đèn cồn thuỷ tinh: thân Φ75 mm, cao 84 mm, cổ Φ22 mm, nút xỏ bấc bằng sứ, nắp thuỷ tinh (danh mục mục 1.20) ----------
export function makeAlcoholLamp() {
  const g = new THREE.Group();
  const body = glassShell(lathe([[0, 0], [0.32, 0], [0.375, 0.06], [0.375, 0.4], [0.31, 0.62], [0.125, 0.74], [0.11, 0.82], [0.125, 0.84]], 56), lathe([[0, 0.04], [0.3, 0.04], [0.352, 0.08], [0.352, 0.39], [0.29, 0.6], [0.105, 0.725], [0.09, 0.82], [0.105, 0.84]], 56));
  const fuel = new THREE.Mesh(lathe([[0, 0.045], [0.295, 0.045], [0.347, 0.085], [0.347, 0.3], [0, 0.3]], 48), liquidMat(0xdfe9f2, 0.5)); fuel.renderOrder = 1;
  const collar = new THREE.Mesh(lathe([[0.155, 0], [0.16, 0.03], [0.09, 0.07], [0.055, 0.12], [0.04, 0.12], [0.04, 0]], 32), solidMat(0xf3f3f1, 0.35)); collar.position.y = 0.83;
  const wick = new THREE.Mesh(cyl(0.032, 0.032, 0.1, 14), solidMat(0xefe9dc, 1)); wick.position.y = 0.99;
  const wickTip = new THREE.Mesh(cyl(0.03, 0.032, 0.03, 14), solidMat(0x4a4038, 1)); wickTip.position.y = 1.045;
  const wickIn = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0, 0.86, 0], [0.01, 0.45, 0], [0.1, 0.13, 0.03], [0.22, 0.07, 0.05]].map((p) => new THREE.Vector3(...p))), 24, 0.028, 8), solidMat(0xefe9dc, 1));
  const flame = new THREE.Group(); flame.position.y = 1.04;
  const fm = (col, op) => new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false });
  const outer = new THREE.Mesh(lathe([[0, 0], [0.045, 0.04], [0.07, 0.14], [0.058, 0.26], [0.028, 0.38], [0, 0.47]], 24), fm(0xffb469, 0.3)); outer.renderOrder = 8;
  const core = new THREE.Mesh(lathe([[0, 0], [0.04, 0.03], [0.055, 0.12], [0.035, 0.24], [0, 0.33]], 20), fm(0x3f86ff, 0.6)); core.renderOrder = 9;
  flame.add(outer, core); flame.visible = false;
  const cap = glassPair(lathe([[0.17, 0], [0.185, 0.015], [0.185, 0.3], [0.13, 0.4], [0.04, 0.44], [0, 0.445]], 40), 0xd3e3e8, 0.34);
  const capOn = () => { cap.position.set(0, 0.83, 0); setLit(false); }, capOff = (x = 0.75) => { cap.position.set(x, 0, 0); };
  const setLit = (b) => { flame.visible = b; g.userData.lit = b; };
  const flicker = (t) => { if (!flame.visible) return; const k = 1 + 0.07 * Math.sin(t * 13) + 0.04 * Math.sin(t * 29.3); flame.scale.set(1 + 0.05 * Math.sin(t * 17), k, 1); };
  g.add(contactShadow(0.75), fuel, wickIn, body, collar, wick, wickTip, flame, cap);
  g.userData = { cap, flame, capOn, capOff, setLit, flicker, lit: false, flameY: 1.25 };
  capOn();
  return g;
}

// ---------- Bình tia nước cất 250 mL bằng nhựa mềm: Ø 6 cm, cao 12 cm, vòi cong ----------
export function makeWashBottle() {
  const g = new THREE.Group();
  const prof = [[0, 0], [0.28, 0], [0.3, 0.03], [0.3, 0.85], [0.23, 1.02], [0.13, 1.08], [0.13, 1.17]];
  const body = new THREE.Mesh(lathe(prof, 48), new THREE.MeshPhysicalMaterial({ color: 0xf6f8f9, transparent: true, opacity: 0.72, roughness: 0.42, envMapIntensity: 0.8, depthWrite: false })); body.renderOrder = 3;
  const water = new THREE.Mesh(lathe([[0, 0.02], [0.27, 0.02], [0.285, 0.04], [0.285, 0.62], [0, 0.62]], 40), liquidMat(0xc9e3f1, 0.55)); water.renderOrder = 1;
  const cap = new THREE.Mesh(cyl(0.165, 0.165, 0.13, 40), solidMat(PAL.accent, 0.5)); cap.position.y = 1.2;
  const path = new THREE.CatmullRomCurve3([[0, 1.26, 0], [0, 1.46, 0], [0.07, 1.6, 0], [0.26, 1.62, 0], [0.5, 1.5, 0], [0.66, 1.36, 0]].map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.4);
  const nozzle = new THREE.Mesh(new THREE.TubeGeometry(path, 40, 0.022, 10), solidMat(0xf1f2f3, 0.5));
  const dip = new THREE.Mesh(cyl(0.018, 0.018, 1.15, 8), solidMat(0xe9ecee, 0.6)); dip.position.y = 0.66;
  const tex = canvasTexture(768, 300, (c, w, h) => { c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.fillStyle = '#2f6fd0'; c.fillRect(0, 0, w, 26); c.fillStyle = '#16324f'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 120px ${FONT}`; c.fillText('Nước cất', w / 2, 140); c.font = `600 60px ${FONT}`; c.fillStyle = '#34495e'; c.fillText('H₂O', w / 2, 238); });
  const label = new THREE.Mesh(new THREE.CylinderGeometry(0.303, 0.303, 0.32, 40, 1, true, -0.85, 1.7), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 })); label.position.y = 0.45; label.renderOrder = 6;
  g.add(contactShadow(0.55), water, dip, body, cap, nozzle, label);
  g.userData = { tip: new THREE.Vector3(0.66, 1.36, 0), top: 1.64 };
  return g;
}

// ---------- Giấy quỳ: băng giấy 7 cm × 0,8 cm. Nằm phẳng trên bàn, đầu thử ở phía -x ----------
export function makeLitmus({ color = '#8f78c9' } = {}) {
  const g = new THREE.Group(); let tex;
  const draw = (wet, frac) => canvasTexture(512, 64, (c, w, h) => { c.fillStyle = color; c.fillRect(0, 0, w, h); if (wet) { const x = w * frac, gr = c.createLinearGradient(x - 30, 0, x + 12, 0); gr.addColorStop(0, wet); gr.addColorStop(1, color); c.fillStyle = wet; c.fillRect(0, 0, x - 30, h); c.fillStyle = gr; c.fillRect(x - 30, 0, 42, h); } c.fillStyle = 'rgba(255,255,255,0.06)'; for (let i = 0; i < 260; i++) c.fillRect((i * 97) % w, (i * 53) % h, 3, 1); });
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.004, 0.08), new THREE.MeshStandardMaterial({ map: (tex = draw(null, 0)), roughness: 1 })); strip.position.y = 0.003; strip.castShadow = true;
  const setWet = (hex, frac = 0.4) => { tex.dispose(); tex = draw(hex, frac); strip.material.map = tex; strip.material.needsUpdate = true; };
  g.add(strip); g.userData = { setWet, strip };
  return g;
}

// ---------- Chất rắn theo đúng hình dạng thường dùng trong phòng thí nghiệm. Gốc nằm trên mặt đặt ----------
export function makeChemSolid(id) {
  const g = new THREE.Group(), rand = rng(11);
  const add = (geo, mat, x = 0, y = 0, z = 0, rot = null) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (rot) m.rotation.set(...rot); g.add(m); return m; };
  const heap = (mid, R = 0.2, H = 0.075) => { const geo = lathe([[0, H], [R * 0.25, H * 0.93], [R * 0.6, H * 0.5], [R * 0.9, H * 0.12], [R, 0]], 40), p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), k = 1 + 0.1 * Math.sin(9 * x + 3) * Math.sin(11 * z + 1); p.setXYZ(i, x * k, p.getY(i) * (1 + 0.18 * Math.sin(17 * x) * Math.cos(13 * z)), z * k); } geo.computeVertexNormals(); add(geo, powderMat(mid, 2)); };
  if (id === 'Na') { const m = add(blob(0.06, 3, 0.12, 36), metalMat('Na'), 0, 0.045, 0); m.scale.set(1.2, 0.8, 1); }
  else if (id === 'Mg') { const geo = new THREE.PlaneGeometry(0.4, 0.035, 24, 1), p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, 0.02 + 0.03 * Math.sin(x * 9) + 0.5 * x * x); } geo.computeVertexNormals(); add(geo, metalMat('Mg', { side: THREE.DoubleSide }), 0, 0, 0, [-Math.PI / 2, 0, 0]); }
  else if (id === 'Al') { const geo = new THREE.PlaneGeometry(0.3, 0.22, 14, 10), p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.012 + 0.01 * Math.sin(p.getX(i) * 31 + 1) * Math.cos(p.getY(i) * 27)); geo.computeVertexNormals(); add(geo, metalMat('Al', { side: THREE.DoubleSide }), 0, 0, 0, [-Math.PI / 2, 0, 0.3]); }
  else if (id === 'Zn') { for (let i = 0; i < 6; i++) { const a = i * 1.05 + rand(), d = i === 0 ? 0 : 0.07 + rand() * 0.06, s = 0.028 + rand() * 0.014; const m = add(blob(s, i + 2, 0.3, 14), metalMat('Zn'), Math.cos(a) * d, s * 0.7, Math.sin(a) * d, [rand() * 3, rand() * 3, 0]); m.scale.y = 0.75; } }
  else if (id === 'Fe') { for (const [z, ry] of [[-0.03, 0.15], [0.035, -0.25]]) { const nail = new THREE.Group(); const b = new THREE.Mesh(cyl(0.012, 0.012, 0.3, 12), metalMat('Fe')), hd = new THREE.Mesh(cyl(0.03, 0.03, 0.008, 16), metalMat('Fe')), tp = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.035, 12), metalMat('Fe')); hd.position.y = 0.154; tp.position.y = -0.167; tp.rotation.x = Math.PI; nail.add(b, hd, tp); nail.rotation.set(0, ry, Math.PI / 2); nail.position.set(0, 0.03, z); nail.rotation.order = 'YXZ'; g.add(nail); } }
  else if (id === 'Cu' || id === 'Ag') { const pts = []; if (id === 'Cu') for (let i = 0; i <= 120; i++) { const t = i / 120, a = t * Math.PI * 2 * 6; pts.push(new THREE.Vector3(-0.15 + 0.3 * t, 0.05 + 0.04 * Math.sin(a), 0.04 * Math.cos(a))); } else for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push(new THREE.Vector3(-0.17 + 0.34 * t, 0.009 + 0.03 * Math.sin(t * Math.PI) ** 2, 0.03 * Math.sin(t * 7))); }
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), id === 'Cu' ? 360 : 80, 0.008, 8), metalMat(id)); }
  else if (id === 'CaCO3' || id === 'CaO') { const n = id === 'CaCO3' ? 6 : 4; for (let i = 0; i < n; i++) { const a = i * (6.28 / n) + rand(), d = i === 0 ? 0 : 0.09 + rand() * 0.05, s = (id === 'CaCO3' ? 0.04 : 0.055) + rand() * 0.02; const m = add(blob(s, i * 3 + 1, 0.32, 12), powderMat(id), Math.cos(a) * d, s * 0.72, Math.sin(a) * d, [rand() * 3, rand() * 3, 0]); m.scale.y = 0.8; } }
  else heap(id);
  return shadowAll(g);
}

// ---------- Lọ đựng cho từng chất trong kho 40 chất ----------
const LIGHT_SENSITIVE = new Set(['AgNO3', 'KMnO4', 'KI', 'H2O2', 'HNO3']);
const SOLID_HEX = { Na: 0xc9ccd0, Mg: 0xc3c7cb, Al: 0xd6d9dc, Zn: 0x9aa3ab, Fe: 0x6f757b, Cu: 0xc7713f, Ag: 0xe6e8ea, CaCO3: 0xeeeae0, CaO: 0xf5f4f0, CuO: 0x1c1c1e, MnO2: 0x2a2725 };
const sub2 = (f) => f.replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[d]);
// small = lọ 150 mL đặt trên bàn thực hành (Ø 54 mm, cao 10 cm kể cả nắp); mặc định là lọ 250 mL.
export function makeChemContainer(chem, { small = false } = {}) {
  // Theo danh mục thiết bị tối thiểu THPT môn Hoá: lọ miệng hẹp 100 mL thân Φ45 mm, cao 95 mm (mục 1.8); lọ miệng rộng thân Φ50 mm, cao 95 mm (mục 1.9).
  const solid = chem.group === 'metal' || chem.group === 'solid';
  const size = {};
  const short = chem.name.replace(/\s+\([^)]*\)$/, ''); // bỏ chú thích cuối tên, giữ số hoá trị như (II)
  if (chem.id === 'H2O') return makeWashBottle();
  if (chem.id === 'quy') return makeLitmus();
  if (small) { // lọ thật của phòng thí nghiệm phổ thông: nút nhám, lọ dung dịch kèm ống hút nhỏ giọt
    if (solid) { const b = makeStopperBottle({ wide: true, title: sub2(chem.f), sub: chem.id === 'Na' ? 'trong dầu hoả' : 'chất rắn', name: short, content: chem.id === 'Na' ? 0xe3cf7a : SOLID_HEX[chem.id], contentOpacity: chem.id === 'Na' ? 0.55 : 1, fill: chem.id === 'Na' ? 0.6 : 0.45 });
      if (chem.id === 'Na') { for (const [x, z] of [[-0.07, 0.03], [0.07, -0.03]]) { const p = makeChemSolid('Na'); p.scale.setScalar(0.8); p.position.set(x, 0.07, z); b.add(p); } } else b.userData.inner.material = METAL[chem.id] ? metalMat(chem.id, { rep: 2 }) : powderMat(chem.id, 3);
      return b; }
    return makeStopperBottle({ title: chem.id === 'pp' ? 'PP' : sub2(chem.f), sub: chem.id === 'pp' ? 'chỉ thị' : chem.id === 'H2O2' ? '3%' : `${String(chem.conc).replace('.', ',')} M`, name: short, amber: LIGHT_SENSITIVE.has(chem.id), content: chem.hex ? new THREE.Color(chem.hex).getHex() : PAL.water, contentOpacity: chem.hex ? 0.78 : 0.5 });
  }
  if (chem.id === 'pp') return makeDropperBottle({ title: 'PP', name: 'Phenolphthalein' });
  if (chem.group === 'metal' || chem.group === 'solid') {
    const b = makeBottle({ ...size, title: sub2(chem.f), sub: chem.id === 'Na' ? 'trong dầu hoả' : 'chất rắn', name: short, wide: true, content: chem.id === 'Na' ? 0xe3cf7a : SOLID_HEX[chem.id], contentOpacity: chem.id === 'Na' ? 0.55 : 1, fill: chem.id === 'Na' ? 0.6 : 0.42 });
    if (chem.id === 'Na') { for (const [x, z] of [[-0.1, 0.05], [0.09, -0.04], [0.0, 0.12]]) { const s = makeChemSolid('Na'); s.position.set(x, 0.08, z); b.add(s); } }
    else b.userData.inner.material = METAL[chem.id] ? metalMat(chem.id, { rep: 2 }) : powderMat(chem.id, 3);
    return b;
  }
  const conc = chem.id === 'H2O2' ? '3%' : `${String(chem.conc).replace('.', ',')} M`;
  return makeBottle({ ...size, title: sub2(chem.f), sub: conc, name: short, amber: LIGHT_SENSITIVE.has(chem.id), content: chem.hex ? new THREE.Color(chem.hex).getHex() : PAL.water, contentOpacity: chem.hex ? 0.78 : 0.5 });
}

// ---------- Nút nhám liền ống hút nhỏ giọt của lọ miệng hẹp (danh mục mục 1.8): phần nhám cao 20 mm, Φ15 đến Φ18 mm; ống thuỷ tinh Φ8 mm vuốt nhọn đầu; quả bóp cao su.
// Gốc ở đầu nhỏ giọt, hướng lên +y. Khi cắm trong lọ, đầu ống cách đáy lọ 3 mm. Cũng chính là dụng cụ nhỏ giọt khi rút ra khỏi lọ. ----------
export function makeStopperDropper() {
  const g = new THREE.Group();
  const tube = glassPair(lathe([[0.011, 0], [0.014, 0.16], [0.04, 0.28], [0.04, 0.99]], 20), 0xd3e3e8, 0.36);
  const plug = new THREE.Mesh(lathe([[0.04, 0.72], [0.075, 0.72], [0.09, 0.92], [0.115, 0.925], [0.115, 0.955], [0.04, 0.955]], 28), new THREE.MeshPhysicalMaterial({ color: 0xf2f6f7, transparent: true, opacity: 0.72, roughness: 0.75, depthWrite: false })); plug.renderOrder = 5; // thuỷ tinh mài nhám
  const bulb = new THREE.Mesh(lathe([[0.05, 0], [0.058, 0.03], [0.055, 0.06], [0.075, 0.13], [0.082, 0.24], [0.07, 0.34], [0.04, 0.39], [0, 0.4]], 26), texMat('tex_rubber', { fallback: 0x2b2e33, roughness: 0.85 })); bulb.position.y = 0.955;
  const liquid = new THREE.Mesh(new THREE.BufferGeometry(), liquidMat(PAL.water, 0.7)); liquid.renderOrder = 1; liquid.visible = false;
  const setFill = (f, color) => { liquid.visible = f > 0.01; if (color != null) liquid.material.color.set(color); g.userData.fill = f; if (!liquid.visible) return; const l = Math.max(0.3, 0.28 + f * 0.6); liquid.geometry.dispose(); liquid.geometry = lathe([[0, 0.005], [0.008, 0.005], [0.011, 0.16], [0.036, 0.28], [0.036, l], [0, l]], 18); };
  const squeeze = (k) => { bulb.scale.set(1 - 0.35 * k, 1, 1 - 0.35 * k); };
  g.add(liquid, tube, plug, bulb);
  g.userData = { liquid, bulb, setFill, squeeze, L: 1.36, fill: 0 };
  return g;
}

// ---------- Lọ thuỷ tinh nút nhám 100 mL theo danh mục thiết bị tối thiểu THPT môn Hoá.
// Lọ miệng hẹp (mục 1.8): cao 95 mm, thân Φ45, miệng Φ18, nút nhám kèm ống hút nhỏ giọt; có lọ nâu và lọ trắng.
// Lọ miệng rộng (mục 1.9): cao 95 mm, thân Φ50, miệng Φ40, nút nhám có 3 nấc (phần nhám Φ32 đến Φ42, nắp Φ50). ----------
export function makeStopperBottle({ title = 'HCl', sub = '', name = '', amber = false, content = PAL.water, contentOpacity = 0.5, wide = false, fill = 0.62 } = {}) {
  const g = new THREE.Group(), T = 0.02, r = wide ? 0.25 : 0.225, rn = wide ? 0.2 : 0.09, top = 0.95, foot = '100 mL  ·  phòng thí nghiệm';
  const outer = wide ? [[0, 0], [r - 0.035, 0], [r, 0.035], [r, 0.62], [r - 0.015, 0.69], [rn, 0.72], [rn, 0.93], [rn + 0.015, top]] : [[0, 0], [r - 0.035, 0], [r, 0.035], [r, 0.58], [r - 0.03, 0.67], [rn + 0.01, 0.735], [rn, 0.76], [rn, 0.93], [rn + 0.015, top]];
  const inner = outer.map(([x, y], i) => (i === 0 ? [0, 0.04] : [Math.max(0, x - T), i < 3 ? y + 0.04 : y]));
  const body = glassShell(lathe(outer, 56), lathe(inner, 56), amber ? PAL.amber : 0xd3e3e8, amber ? 0.9 : 0.3);
  const lv = wide ? 0.62 * fill + 0.05 : Math.min(0.56, 0.9 * fill);
  const innerM = new THREE.Mesh(lathe([[0, 0.045], [r - 0.035 - T, 0.045], [r - T - 0.004, 0.08], [r - T - 0.004, lv], [0, lv]], 48), liquidMat(content, contentOpacity)); innerM.renderOrder = 1; innerM.visible = !amber;
  let cap;
  if (wide) { // nút nhám 3 nấc
    cap = new THREE.Group();
    const plug = new THREE.Mesh(lathe([[0, 0.73], [0.16, 0.73], [0.195, 0.93], [0, 0.93]], 36), new THREE.MeshPhysicalMaterial({ color: 0xf2f6f7, transparent: true, opacity: 0.6, roughness: 0.75, depthWrite: false })); plug.renderOrder = 5;
    const lid = glassPair(lathe([[0, 0.93], [0.21, 0.93], [0.21, 0.955], [0.25, 0.955], [0.25, 1.0], [0.12, 1.0], [0.1, 1.07], [0, 1.075]], 40), 0xd3e3e8, 0.4);
    cap.add(plug, lid);
  } else { cap = makeStopperDropper(); cap.position.y = 0.03; }
  const label = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.004, r + 0.004, 0.36, 48, 1, true, -0.95, 1.9), new THREE.MeshStandardMaterial({ map: labelTexture(title, sub, name, foot), roughness: 0.8 })); label.position.y = 0.32; label.renderOrder = 6;
  const shadow = contactShadow(r * 1.7);
  g.add(shadow, innerM, body, cap, label);
  g.userData = { label, cap, inner: innerM, shadow, h: top, top, wide };
  return g;
}

// ---------- Giá để ống nghiệm (danh mục mục 1.38): nhựa hai tầng, 180 × 110 × 56 mm, dày 2,5 mm, 5 lỗ Φ19 mm và 5 cọc cắm.
// Mặt trước để hở nên thấy được chất trong ống. Màu xám đậm (danh mục không quy định màu) để dung dịch không màu, kết tủa trắng, bọt khí nổi rõ. ----------
export function makeSchoolRack() {
  const g = new THREE.Group(), mat = solidMat(0x3a3f45, 0.55), W = 1.8, D = 1.1, H = 0.56, T = 0.025, pitch = 0.32, HOLE_Z = 0.22, xs = [];
  for (let i = 0; i < 5; i++) xs.push((i - 2) * pitch);
  const sh = new THREE.Shape(); sh.moveTo(-W / 2, -D / 2); sh.lineTo(W / 2, -D / 2); sh.lineTo(W / 2, D / 2); sh.lineTo(-W / 2, D / 2); sh.closePath();
  xs.forEach((x) => { const hole = new THREE.Path(); hole.absarc(x, -HOLE_Z, 0.095, 0, Math.PI * 2, true); sh.holes.push(hole); }); // hình phẳng (x, y) → sau khi xoay, y thành -z
  const top = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: T, bevelEnabled: false, curveSegments: 24 }), mat); top.rotation.x = -Math.PI / 2; top.position.y = H - T;
  const base = new THREE.Mesh(new THREE.BoxGeometry(W, T, D), mat); base.position.y = T / 2;
  const ends = [-1, 1].map((sgn) => { const m = new THREE.Mesh(new THREE.BoxGeometry(T, H, D), mat); m.position.set(sgn * (W / 2 - T / 2), H / 2, 0); return m; });
  const pegs = xs.map((x) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.4, 14), mat); m.position.set(x, H + 0.2, -0.32); return m; }); // cọc cắm hình côn (Φ7 đến Φ10 mm) để úp ống nghiệm cho ráo
  [top, base, ...ends, ...pegs].forEach((m) => { m.castShadow = true; m.receiveShadow = true; }); g.add(top, base, ...ends, ...pegs);
  g.userData = { slotX: xs, slotY: T, slotZ: HOLE_Z, tube: { h: 1.6, r: 0.08, wall: 0.01 } };
  return g;
}
