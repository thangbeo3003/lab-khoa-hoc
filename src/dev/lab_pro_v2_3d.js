// Engine 3D LookDev + Motion Choreography + Interactive Actions cho Lab L1 Pro v2.
// Độc lập 100% (chỉ đọc model2.js & model3.js, KHÔNG sửa bất kỳ tệp nào của dự án).
// Đơn vị: 1 = 10 cm. Mặt bàn ở y = 0, sàn y = -9, trần y = 20.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { REF, CONC, tConc, tTemp, tCat, kCat, lensSetup } from '../lessons/h10_toc_do_phan_ung_02/model2.js';
import { REF3, run3, gasAt3, rateAt3, vO2Max } from '../lessons/h10_toc_do_phan_ung_03/model3.js';
import { sfx } from './lab_pro_v2_sfx.js';

export { REF, CONC, REF3, tConc, tTemp, tCat, kCat, lensSetup, run3, gasAt3, rateAt3, vO2Max };

const FONT = '"Be Vietnam Pro", -apple-system, "Segoe UI", Roboto, sans-serif';
const V2 = (p) => new THREE.Vector2(p[0], p[1]);
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const lathe = (pts, seg = 40, a0 = 0, a1 = Math.PI * 2) => new THREE.LatheGeometry(pts.map(V2), seg, a0, a1);
const cyl = (r1, r2, h, seg = 24, open = false) => new THREE.CylinderGeometry(r1, r2, h, seg, 1, open);
const put = (o, x, y, z) => { o.position.set(x, y, z); return o; };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = THREE.MathUtils.lerp;
const easeIO = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const easeOut = (k) => 1 - Math.pow(1 - k, 3);
const easeIn = (k) => k * k * k;
const lin = (k) => k;
const fmt = (n, d = 1) => Number(n).toFixed(d).replace('.', ',');

// ---------- Texture & Canvas ----------
const TEX_BASE = new URL('../../assets/tex/', import.meta.url).href;
const texLoader = new THREE.TextureLoader();
const texCache = {};

function loadTex(name, repX = 1, repY = repX, srgb = true) {
  const key = `${name}:${repX}:${repY}:${srgb}`;
  if (texCache[key]) return texCache[key];
  const t = texLoader.load(`${TEX_BASE}${name}.jpg`, (tex) => { tex.needsUpdate = true; });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repX, repY);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  texCache[key] = t;
  return t;
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function makeMicroRoughnessTex(base = 112, amp = 26) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), img = g.createImageData(128, 128);
  let s = 1337; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = clamp(Math.round(base + (rnd() - 0.5) * amp), 0, 255);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 3);
  return t;
}

// ---------- High-Contrast Studio/Lab Procedural HDRI ----------
// Bí quyết chụp ảnh thuỷ tinh & nhựa bóng: phải có dải tối (black flags) nằm cạnh đèn softbox sáng gắt
// → tạo vệt phản chiếu gương sắc lẹm trên thân thuỷ tinh, nắp nhựa và thép inox, không còn mờ đục!
function buildLabEnvMap(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x10151e);
  envScene.add(new THREE.Mesh(new THREE.BoxGeometry(40, 22, 40), new THREE.MeshBasicMaterial({ color: 0x1b222e, side: THREE.BackSide })));

  // Sàn trầm & trần xám trung tính tạo đường chân trời rõ nét trên inox
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ color: 0x0b0e14 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -9;
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ color: 0x3b4658 }));
  ceil.rotation.x = Math.PI / 2; ceil.position.y = 11;
  envScene.add(floor, ceil);

  // Dải cửa sổ softbox dọc sắc nét bên trái (vệt sáng gương chạy thẳng dọc thân bình)
  const winMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(6.2, 6.0, 5.7) });
  for (let i = -1; i <= 1; i++) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 12.5), winMat);
    w.rotation.y = Math.PI / 2; w.position.set(-19.4, 3.0, i * 10.5); envScene.add(w);
  }
  // 2 dải chặn tối (black flags) ngay cạnh cửa sổ để viền thuỷ tinh cắt nét sắc lẹm
  const flagMat = new THREE.MeshBasicMaterial({ color: 0x05070a });
  [-1, 1].forEach((s) => {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 16), flagMat);
    f.rotation.y = Math.PI / 2; f.position.set(-19.1, 2, s * 5.2); envScene.add(f);
  });

  // 4 dải đèn LED trần mảnh cường độ HDR cao → vệt highlight sắc trên vai bình & nắp nhựa
  const ledMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(7.5, 7.8, 8.4) });
  for (let i = -1; i <= 1; i += 2) for (let j = -1; j <= 1; j += 2) {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(10.5, 1.35), ledMat);
    strip.rotation.x = Math.PI / 2; strip.position.set(i * 9.5, 10.7, j * 7.2); envScene.add(strip);
  }
  // Rim softbox mảnh bên phải-sau tạo dải sáng viền phải sắc nét trên từng bình
  const rim = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 12.0), new THREE.MeshBasicMaterial({ color: new THREE.Color(4.5, 5.0, 5.8) }));
  rim.rotation.y = -Math.PI / 2; rim.position.set(19.4, 3.5, -3); envScene.add(rim);

  const rt = pmrem.fromScene(envScene, 0.008); // Độ sắc phản chiếu cao hơn 3x (trước 0.024 bị nhoè mờ)
  pmrem.dispose();
  return rt.texture;
}

// ---------- Vật liệu chuẩn PBR sắc nét (True Transmission Glass + Clearcoat Polymer + 304 Stainless) ----------
const EPOXY_TEX = loadTex('tex_epoxy', 2.4, 1.4);
const PAL = {
  benchDark: 0xe2e8f0,
  benchLight: 0x9aa6b4,
  cabinet: 0xf0f3f7,
  cabinetDoor: 0xdbe2ea,
  plinth: 0x21262e,
  wall: 0xe6ebf2,
  accent: 0x2563eb,
  rubber: 0x9b4d3e,
  amber: 0xa65416,
  water: 0xcbe8f6,
  metalDark: 0x262b33,
};

const MICRO_ROUGH = makeMicroRoughnessTex(95, 22);

// Thuỷ tinh borosilicate khúc xạ vật lý THẬT (MeshPhysicalMaterial transmission + IOR 1.50):
// - KHÔNG phủ màn sương trắng mờ (milky haze) như alpha transparency cũ
// - Khúc xạ bẻ cong thật mặt bàn, chữ X, đá vôi phía sau
// - Vệt phản chiếu trắng sắc nét từ HDRI softbox + ánh xanh ngọc cực mảnh ở đáy dày
const MAT = {
  glassFront: new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 0.96,
    transparent: false,
    opacity: 1,
    ior: 1.50,
    thickness: 0.34,
    attenuationColor: new THREE.Color(0xdaf4ee),
    attenuationDistance: 4.2,
    roughness: 0.02,
    metalness: 0,
    reflectivity: 1.0,
    specularIntensity: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.018,
    envMapIntensity: 2.1,
    side: THREE.FrontSide,
    depthWrite: false,
  }),
  glassThick: new THREE.MeshPhysicalMaterial({
    color: 0xdff5f0,
    transparent: true,
    opacity: 0.42,
    roughness: 0.02,
    metalness: 0,
    ior: 1.52,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    envMapIntensity: 2.6,
    depthWrite: false,
  }),
  // Thuỷ tinh hổ phách thật (H2O2, PP dropper): trong suốt ánh mật ong bóng loáng thay vì nhựa nâu đục
  amberFront: new THREE.MeshPhysicalMaterial({
    color: 0xc46a1c,
    transmission: 0.68,
    transparent: false,
    opacity: 1,
    ior: 1.52,
    thickness: 0.48,
    attenuationColor: new THREE.Color(0x6b2f06),
    attenuationDistance: 0.85,
    roughness: 0.035,
    metalness: 0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.025,
    envMapIntensity: 2.0,
    side: THREE.FrontSide,
    depthWrite: true,
  }),
  meniscus: new THREE.MeshPhysicalMaterial({ color: 0xf0fbff, transparent: true, opacity: 0.82, roughness: 0.015, clearcoat: 1, envMapIntensity: 2.8, depthWrite: false }),
  // Thép không gỉ 304 bóng sắc (thìa xúc, vòi nước, trụ giá đỡ, đĩa cân)
  steel: new THREE.MeshStandardMaterial({ color: 0xe4eaf0, metalness: 0.96, roughness: 0.16, roughnessMap: MICRO_ROUGH, envMapIntensity: 1.55 }),
  darkMetal: new THREE.MeshStandardMaterial({ color: PAL.metalDark, metalness: 0.62, roughness: 0.36, roughnessMap: MICRO_ROUGH, envMapIntensity: 1.15 }),
  // Nhựa phòng lab ABS/PP cao cấp có clearcoat nhẹ (cân, bếp điện, đồng hồ)
  whitePlastic: new THREE.MeshPhysicalMaterial({ color: 0xf4f7fa, roughness: 0.28, metalness: 0, clearcoat: 0.38, clearcoatRoughness: 0.22, envMapIntensity: 1.1 }),
  darkPlastic: new THREE.MeshPhysicalMaterial({ color: 0x20252e, roughness: 0.32, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.24, envMapIntensity: 1.1 }),
  cabinet: new THREE.MeshStandardMaterial({ color: PAL.cabinet, roughness: 0.56 }),
  cabinetDoor: new THREE.MeshStandardMaterial({ color: PAL.cabinetDoor, roughness: 0.48 }),
  plinth: new THREE.MeshStandardMaterial({ color: PAL.plinth, roughness: 0.72 }),
  accent: new THREE.MeshPhysicalMaterial({ color: PAL.accent, roughness: 0.26, clearcoat: 0.48, clearcoatRoughness: 0.2, envMapIntensity: 1.15 }),
  rubberRed: new THREE.MeshStandardMaterial({ map: loadTex('tex_rubber', 1), color: PAL.rubber, roughness: 0.78 }),
  wood: new THREE.MeshStandardMaterial({ map: loadTex('tex_wood', 1.4), color: 0xdec296, roughness: 0.58 }),
  limestone: new THREE.MeshStandardMaterial({ map: loadTex('tex_limestone', 1), color: 0xeae4d6, roughness: 0.9 }),
  mno2: new THREE.MeshStandardMaterial({ map: loadTex('tex_mno2', 2), color: 0x282524, roughness: 0.96 }),
  magnesium: new THREE.MeshStandardMaterial({ map: loadTex('tex_magnesium', 1), color: 0xe2e7ec, metalness: 0.94, roughness: 0.22, envMapIntensity: 1.4 }),
  silicone: new THREE.MeshPhysicalMaterial({ color: 0xeef5fa, transparent: true, opacity: 0.62, roughness: 0.16, clearcoat: 0.75, envMapIntensity: 1.7, depthWrite: false }),
  benchTop: new THREE.MeshPhysicalMaterial({
    color: PAL.benchDark, map: EPOXY_TEX, roughness: 0.32, roughnessMap: MICRO_ROUGH,
    metalness: 0.04, clearcoat: 0.22, clearcoatRoughness: 0.28, envMapIntensity: 1.15,
  }),
  tablet: new THREE.MeshStandardMaterial({ color: 0xffd79e, roughness: 0.8 }),
};

// Dùng 1 lớp vỏ FrontSide transmissive sạch sẽ (không chồng 2 lớp Back+Front gây nháy Z-sorting!)
function glassShell(outerGeo, _innerGeo, amber = false) {
  const g = new THREE.Group();
  const outer = new THREE.Mesh(outerGeo, amber ? MAT.amberFront : MAT.glassFront);
  outer.renderOrder = 4;
  g.add(outer);
  return g;
}
function glassPair(geo, amber = false) {
  const g = new THREE.Group();
  const front = new THREE.Mesh(geo, amber ? MAT.amberFront : MAT.glassFront);
  front.renderOrder = 4;
  g.add(front);
  return g;
}
function liquidMat(color = PAL.water, opacity = 0.34) {
  return new THREE.MeshPhysicalMaterial({
    color, transparent: opacity < 0.99, opacity, roughness: 0.025, metalness: 0,
    ior: 1.333, clearcoat: 1.0, clearcoatRoughness: 0.02, envMapIntensity: 1.85, depthWrite: opacity >= 0.99,
  });
}

let _aoMat = null;
function contactAO(radius) {
  if (!_aoMat) {
    const tex = canvasTex(96, 96, (g) => {
      const gr = g.createRadialGradient(48, 48, 4, 48, 48, 46);
      gr.addColorStop(0, 'rgba(6,10,16,0.90)'); gr.addColorStop(0.52, 'rgba(6,10,16,0.34)'); gr.addColorStop(1, 'rgba(6,10,16,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 96, 96);
    });
    _aoMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.45, depthWrite: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), _aoMat);
  m.rotation.x = -Math.PI / 2; m.position.y = 0.002; m.renderOrder = 0;
  return m;
}

function roundedBox(w, h, d, r = 0.05, bevel = 0.018) {
  const s = new THREE.Shape();
  const hw = w / 2 - bevel, hd = d / 2 - bevel, cr = Math.min(r, hw * 0.5, hd * 0.5);
  s.moveTo(-hw + cr, -hd); s.lineTo(hw - cr, -hd); s.quadraticCurveTo(hw, -hd, hw, -hd + cr);
  s.lineTo(hw, hd - cr); s.quadraticCurveTo(hw, hd, hw - cr, hd); s.lineTo(-hw + cr, hd);
  s.quadraticCurveTo(-hw, hd, -hw, hd - cr); s.lineTo(-hw, -hd + cr); s.quadraticCurveTo(-hw, -hd, -hw + cr, -hd);
  const geo = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.01, h - bevel * 2), bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 6 });
  geo.rotateX(-Math.PI / 2); geo.translate(0, bevel, 0); return geo;
}

function gradDecal(profile, marks, { arc = 0.95, unit = 'mL' } = {}) {
  const tex = canvasTex(384, 768, (g, w, h) => {
    g.textBaseline = 'middle'; g.textAlign = 'left';
    marks.forEach(([v, label, major]) => {
      const y = h - v * h;
      g.lineWidth = major ? 14 : 9; g.strokeStyle = 'rgba(15,28,45,0.58)';
      g.beginPath(); g.moveTo(w * 0.16, y); g.lineTo(w * (major ? 0.50 : 0.36), y); g.stroke();
      g.lineWidth = major ? 8 : 4.5; g.strokeStyle = '#ffffff';
      g.beginPath(); g.moveTo(w * 0.17, y); g.lineTo(w * (major ? 0.49 : 0.35), y); g.stroke();
      if (label) {
        g.font = `700 ${major ? 70 : 58}px ${FONT}`;
        g.lineWidth = 8; g.strokeStyle = 'rgba(15,28,45,0.62)'; g.strokeText(label, w * 0.56, y);
        g.fillStyle = '#ffffff'; g.fillText(label, w * 0.56, y);
      }
    });
    if (unit) {
      g.font = `700 50px ${FONT}`;
      g.lineWidth = 6; g.strokeStyle = 'rgba(15,28,45,0.62)'; g.strokeText(unit, w * 0.56, 44);
      g.fillStyle = '#ffffff'; g.fillText(unit, w * 0.56, 44);
    }
  });
  const m = new THREE.Mesh(
    lathe(profile, 18, -arc / 2, arc),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.96, depthWrite: false, side: THREE.FrontSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  );
  m.renderOrder = 6; return m;
}

function labelTexture(title, sub, name = '', foot = '250 mL  ·  Lab Khoa Học') {
  return canvasTex(768, 512, (g, w, h) => {
    g.fillStyle = '#fcfcfd'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2563eb'; g.fillRect(0, 0, w, 34);
    g.fillStyle = '#0f243d'; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (name) { g.font = `600 54px ${FONT}`; g.fillText(name, w / 2, 102, w - 60); }
    g.font = `800 ${name ? 156 : 184}px ${FONT}`; g.fillText(title, w / 2, name ? 244 : 220, w - 70);
    if (sub) { g.font = `700 84px ${FONT}`; g.fillStyle = '#2c4159'; g.fillText(sub, w / 2, 378, w - 70); }
    g.strokeStyle = '#cbd5e1'; g.lineWidth = 3; g.beginPath(); g.moveTo(54, 442); g.lineTo(w - 54, 442); g.stroke();
    g.fillStyle = '#64748b'; g.font = `600 32px ${FONT}`; g.fillText(foot, w / 2, 476, w - 70);
    g.strokeStyle = '#cbd5e1'; g.lineWidth = 5; g.strokeRect(2.5, 2.5, w - 5, h - 5);
  });
}

// ---------- VFX: Bọt khí, Vòng gợn sóng, Dòng rót parabol, Hơi nước, Vòng định vị 2 tầng ----------
const BUBBLE_GEO = new THREE.SphereGeometry(0.024, 7, 5);
const BUBBLE_MAT = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, roughness: 0.05, clearcoat: 1, envMapIntensity: 2.0, depthWrite: false });

class BubblesFX {
  constructor(count, { y0, y1, radius }, scale = 1) {
    this.count = count; this.y0 = y0; this.y1 = y1; this.radius = radius;
    this.mesh = new THREE.InstancedMesh(BUBBLE_GEO, BUBBLE_MAT, count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.mesh.renderOrder = 5;
    this.items = Array.from({ length: count }, () => ({
      a: Math.random() * 6.283, r: Math.sqrt(Math.random()) * 0.82,
      y: y0 + Math.random() * (y1 - y0), sp: 0.48 + Math.random() * 0.88,
      s: (0.55 + Math.random() * 0.8) * scale, wob: Math.random() * 6.28,
    }));
    this.dummy = new THREE.Object3D(); this.update(0, 0);
  }
  setTop(y1) { this.y1 = Math.max(this.y0 + 0.06, y1); }
  update(dt, intensity) {
    const active = Math.round(this.count * clamp(intensity));
    this.mesh.visible = active > 0; if (!this.mesh.visible) return;
    for (let i = 0; i < this.count; i++) {
      const p = this.items[i];
      if (i >= active) { this.dummy.scale.setScalar(0); this.dummy.updateMatrix(); this.mesh.setMatrixAt(i, this.dummy.matrix); continue; }
      p.y += dt * p.sp * (0.45 + intensity * 1.25); p.wob += dt * 4.5;
      if (p.y > this.y1) { p.y = this.y0 + Math.random() * 0.04; p.a = Math.random() * 6.283; p.r = Math.sqrt(Math.random()) * 0.82; }
      const rad = this.radius(p.y) * p.r;
      this.dummy.position.set(Math.cos(p.a) * rad + Math.sin(p.wob) * 0.012, p.y, Math.sin(p.a) * rad + Math.cos(p.wob) * 0.012);
      const grow = 0.7 + 0.5 * ((p.y - this.y0) / Math.max(0.05, this.y1 - this.y0));
      this.dummy.scale.setScalar(p.s * grow); this.dummy.updateMatrix(); this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

// Hơi nước mảnh bay lên khi đun nóng
class SteamFX {
  constructor(count = 10) {
    const tex = canvasTex(64, 64, (g) => {
      const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
      gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    });
    this.group = new THREE.Group();
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.45, depthWrite: false });
    this.puffs = Array.from({ length: count }, (_, i) => {
      const sp = new THREE.Sprite(mat.clone());
      sp.renderOrder = 6; this.group.add(sp);
      return { sp, t: i / count, ph: Math.random() * 6.28 };
    });
    this.group.visible = false;
  }
  update(dt, strength) {
    this.group.visible = strength > 0.04; if (!this.group.visible) return;
    this.puffs.forEach((p) => {
      p.t = (p.t + dt * 0.55) % 1;
      p.sp.position.set(Math.sin(p.t * 4 + p.ph) * 0.08 * p.t, p.t * 0.9, Math.cos(p.t * 3 + p.ph) * 0.06 * p.t);
      const s = 0.14 + p.t * 0.34;
      p.sp.scale.set(s, s, 1);
      p.sp.material.opacity = Math.sin(Math.PI * p.t) * 0.42 * clamp(strength);
    });
  }
}

// Vòng gợn sóng mặt thoáng khi thả đá / rót nước
function makeRippleFX() {
  const g = new THREE.Group();
  const rings = [0, 1].map(() => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.095, 28), new THREE.MeshBasicMaterial({ color: 0xeef9ff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 5; g.add(m);
    return { m, t: 1 };
  });
  let idx = 0;
  return {
    g,
    trigger(pos, maxR = 0.28) {
      const r = rings[idx++ % rings.length]; r.m.position.copy(pos); r.t = 0; r.maxR = maxR;
    },
    update(dt) {
      rings.forEach((r) => {
        if (r.t >= 1) { r.m.visible = false; return; }
        r.t = Math.min(1, r.t + dt * 2.1); r.m.visible = true;
        const sc = 0.5 + (r.maxR / 0.09) * easeOut(r.t);
        r.m.scale.setScalar(sc); r.m.material.opacity = (1 - r.t) * 0.72;
      });
    },
  };
}

// Dòng chất lỏng cong parabol theo trọng lực (thay hình trụ thẳng cứng!)
function makePourArc() {
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xdaf2fc, transparent: true, opacity: 0.78, roughness: 0.03, clearcoat: 1, envMapIntensity: 2.2, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat);
  mesh.visible = false; mesh.renderOrder = 5;
  let lastKey = '';
  return {
    mesh,
    set(from, to, r = 0.024, color = 0xdaf2fc) {
      mat.color.set(color);
      const key = `${from.x.toFixed(2)},${from.y.toFixed(2)},${to.x.toFixed(2)},${to.y.toFixed(2)},${r.toFixed(3)}`;
      if (key === lastKey && mesh.visible) return;
      lastKey = key;
      const mid1 = V3(lerp(from.x, to.x, 0.35), lerp(from.y, to.y, 0.16), lerp(from.z, to.z, 0.35));
      const mid2 = V3(lerp(from.x, to.x, 0.78), lerp(from.y, to.y, 0.52), lerp(from.z, to.z, 0.78));
      const curve = new THREE.CatmullRomCurve3([from, mid1, mid2, to]);
      mesh.geometry.dispose();
      mesh.geometry = new THREE.TubeGeometry(curve, 16, r, 10, false);
      mesh.visible = true;
    },
    hide() { mesh.visible = false; lastKey = ''; },
  };
}

// Vòng định vị 2 tầng thở nhịp (Target Beacon + Hover Glow)
function makeBeaconRing(color = '#2563eb', r = 0.55) {
  const g = new THREE.Group();
  const innerMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const outerMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const inner = new THREE.Mesh(new THREE.RingGeometry(r - 0.055, r, 48), innerMat);
  const outer = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.06, 48), outerMat);
  inner.rotation.x = outer.rotation.x = -Math.PI / 2;
  g.position.y = 0.014; inner.renderOrder = outer.renderOrder = 2;
  g.add(inner, outer);
  let target = 0, cur = 0, hover = 0, t = 0;
  g.userData = {
    setTarget(on) { target = on ? 1 : 0; },
    setHover(on) { hover = on ? 1 : 0; },
    update(dt) {
      t += dt;
      const goal = Math.max(target, hover * 1.15);
      cur += (goal - cur) * Math.min(1, dt * 10);
      g.visible = cur > 0.01;
      if (!g.visible) return;
      const pulse = (t * 0.9) % 1;
      innerMat.opacity = clamp(cur * (hover ? 0.95 : 0.72 + 0.22 * Math.sin(t * 4.2)));
      outer.scale.setScalar(1 + pulse * 0.32);
      outerMat.opacity = clamp(cur * (1 - pulse) * 0.55);
    },
  };
  return g;
}

// ---------- DỤNG CỤ TƯƠNG TÁC ĐẦY ĐỦ ----------
// Bump map gân khía nổi 3D thật cho nắp chai nhựa PP (không còn vẽ vạch phẳng 2D dễ nháy!)
const CAP_BUMP = canvasTex(256, 32, (c, w, hh) => {
  c.fillStyle = '#555555'; c.fillRect(0, 0, w, hh);
  for (let x = 0; x < w; x += 8) {
    const gr = c.createLinearGradient(x, 0, x + 6, 0);
    gr.addColorStop(0, '#555555'); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(1, '#555555');
    c.fillStyle = gr; c.fillRect(x, 0, 6, hh);
  }
});
CAP_BUMP.wrapS = THREE.RepeatWrapping; CAP_BUMP.repeat.x = 4;
const CAP_BLUE = new THREE.MeshPhysicalMaterial({ color: PAL.accent, bumpMap: CAP_BUMP, bumpScale: 0.018, roughness: 0.28, clearcoat: 0.45, clearcoatRoughness: 0.22, envMapIntensity: 1.2 });
const CAP_BLACK = new THREE.MeshPhysicalMaterial({ color: 0x1b1f26, bumpMap: CAP_BUMP, bumpScale: 0.018, roughness: 0.30, clearcoat: 0.42, clearcoatRoughness: 0.22, envMapIntensity: 1.2 });

// 1. Bình tam giác 250 mL: nâng đáy lên y = 0.009 (tách hoàn toàn khỏi mặt bàn y = 0 → 0% Z-fighting đáy!)
const FLASK_H = 1.48, FLASK_RB = 0.44, FLASK_RN = 0.175, FLASK_YS = 1.02, FLASK_T = 0.024, FLASK_BT = 0.058;
const FLASK_OUTER_GEO = lathe([[0, 0.009], [FLASK_RB - 0.04, 0.009], [FLASK_RB, 0.05], [FLASK_RN, FLASK_YS], [FLASK_RN, FLASK_H - 0.06], [FLASK_RN + 0.032, FLASK_H - 0.02], [FLASK_RN + 0.034, FLASK_H]], 48);
const FLASK_INNER_GEO = lathe([[0, FLASK_BT], [FLASK_RB - 0.045 - FLASK_T, FLASK_BT], [FLASK_RB - FLASK_T, FLASK_BT + 0.025], [FLASK_RN - FLASK_T, FLASK_YS], [FLASK_RN - FLASK_T, FLASK_H - 0.03], [FLASK_RN + 0.034, FLASK_H]], 48);
const FLASK_BASE_RING_GEO = new THREE.TorusGeometry(FLASK_RB - 0.026, 0.015, 10, 40);
const FLASK_RIM_GEO = new THREE.TorusGeometry(FLASK_RN + 0.022, 0.014, 10, 40);
const flaskRAt = (y) => lerp(FLASK_RB - FLASK_T - 0.005, FLASK_RN - FLASK_T - 0.005, clamp((y - 0.05) / (FLASK_YS - 0.05)));
const FLASK_DECAL_PROTO = (() => {
  const ys = [[0.22, '50'], [0.38, '100'], [0.54, '150'], [0.72, '200']];
  const y0 = 0.15, y1 = 0.82, rr = (y) => lerp(FLASK_RB, FLASK_RN, clamp((y - 0.05) / (FLASK_YS - 0.05))) + 0.012;
  return gradDecal([[rr(y0), y0], [rr(y1), y1]], ys.map(([y, l]) => [(y - y0) / (y1 - y0), l, true]));
})();

function makeFlaskPro() {
  const g = new THREE.Group();
  const glass = glassShell(FLASK_OUTER_GEO, FLASK_INNER_GEO, false);
  const baseRing = new THREE.Mesh(FLASK_BASE_RING_GEO, MAT.glassThick); baseRing.rotation.x = Math.PI / 2; baseRing.position.y = 0.024; baseRing.renderOrder = 4;
  const rim = new THREE.Mesh(FLASK_RIM_GEO, MAT.glassThick); rim.rotation.x = Math.PI / 2; rim.position.y = FLASK_H - 0.012; rim.renderOrder = 5;
  glass.add(baseRing, rim);

  const liqMat = liquidMat(PAL.water, 0.48);
  const liquid = new THREE.Mesh(new THREE.BufferGeometry(), liqMat); liquid.renderOrder = 1; liquid.visible = false;
  const meniscus = new THREE.Mesh(new THREE.TorusGeometry(1, 0.0085, 8, 36), MAT.meniscus);
  meniscus.rotation.x = Math.PI / 2; meniscus.renderOrder = 3; meniscus.visible = false;

  const foamMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, transparent: true, opacity: 0, depthWrite: false });
  const foam = new THREE.Mesh(cyl(1, 1, 0.045, 28), foamMat); foam.renderOrder = 3; foam.visible = false;

  const bub = new BubblesFX(54, { y0: FLASK_BT + 0.02, y1: 0.4, radius: flaskRAt }, 1);
  const solids = new THREE.Group(); solids.position.y = FLASK_BT + 0.01;
  const powder = new THREE.Mesh(cyl(0.22, 0.26, 0.04, 24), MAT.mno2); powder.position.y = FLASK_BT + 0.02; powder.visible = false;
  const steam = new SteamFX(8); steam.group.position.y = FLASK_H + 0.02;

  const MAX_LV = 0.46;
  let fill = 0, lastLv = -1;
  function setFill(k) {
    fill = clamp(k);
    const on = fill > 0.015;
    liquid.visible = meniscus.visible = on;
    if (!on) { foam.visible = false; return; }
    const lv = FLASK_BT + 0.02 + (MAX_LV - FLASK_BT - 0.02) * fill;
    if (Math.abs(lv - lastLv) > 0.006) {
      lastLv = lv;
      const rTop = flaskRAt(lv);
      liquid.geometry.dispose();
      liquid.geometry = lathe([[0, FLASK_BT + 0.004], [FLASK_RB - 0.05 - FLASK_T, FLASK_BT + 0.004], [FLASK_RB - FLASK_T - 0.005, FLASK_BT + 0.028], [rTop, lv], [rTop - 0.014, lv - 0.011], [0, lv - 0.013]], 36);
      meniscus.position.y = lv; meniscus.scale.set(rTop - 0.004, rTop - 0.004, 1);
      foam.scale.set(rTop - 0.008, 1, rTop - 0.008); foam.position.y = lv + 0.015;
      bub.setTop(lv - 0.012);
    }
  }
  const shadow = contactAO(0.68);
  g.add(shadow, liquid, meniscus, foam, solids, powder, bub.mesh, steam.group, glass, FLASK_DECAL_PROTO.clone());
  g.userData = {
    H: FLASK_H, RN: FLASK_RN, solids, powder, bub, steam, shadow,
    getFill: () => fill,
    setFill,
    surfaceY: () => g.position.y + FLASK_BT + 0.02 + (MAX_LV - FLASK_BT - 0.02) * Math.max(fill, 0.05),
    mouthWorld: () => V3(g.position.x, g.position.y + FLASK_H, g.position.z),
    setTint(colHex, k, { opacity = 0.98, rough = 0.78 } = {}) {
      liqMat.color.set(PAL.water).lerp(new THREE.Color(colHex), k);
      liqMat.opacity = 0.48 + (opacity - 0.48) * k;
      liqMat.roughness = 0.04 + (rough - 0.04) * k;
      liqMat.clearcoat = 0.85 * (1 - k * 0.75);
    },
    setFoam(k, hMul = 1) {
      foam.visible = k > 0.02 && fill > 0.02;
      foamMat.opacity = clamp(k) * 0.92;
      foam.scale.y = Math.max(0.3, hMul);
    },
    clear() {
      this.setTint(PAL.water, 0, { opacity: 0.48, rough: 0.04 });
      solids.clear(); solids.scale.setScalar(1); solids.visible = true;
      powder.visible = false; foam.visible = false; bub.update(0, 0); steam.update(0, 0);
    },
  };
  return g;
}

// 2. Ống nghiệm borosilicate có hơi nước & bọt
function makeTestTubePro({ h = 1.62, r = 0.092 } = {}) {
  const g = new THREE.Group();
  const prof = (rr) => { const p = []; for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + (Math.PI / 2) * (i / 8); p.push([rr * Math.cos(a), r + rr * Math.sin(a)]); } return p; };
  const glass = glassPair(lathe([...prof(r), [r, h - 0.025], [r + 0.022, h]], 28), false);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r + 0.012, 0.009, 8, 24), MAT.glassThick);
  rim.rotation.x = Math.PI / 2; rim.position.y = h - 0.008; rim.renderOrder = 5; glass.add(rim);

  const lv = h * 0.56;
  const liqMat = liquidMat(PAL.water, 0.46);
  const liquid = new THREE.Mesh(lathe([...prof(r - 0.013), [r - 0.013, lv], [0, lv - 0.01]], 24), liqMat); liquid.renderOrder = 1;
  const meniscus = new THREE.Mesh(new THREE.TorusGeometry(r - 0.014, 0.006, 8, 24), MAT.meniscus);
  meniscus.rotation.x = Math.PI / 2; meniscus.position.y = lv; meniscus.renderOrder = 3;
  const bub = new BubblesFX(26, { y0: r + 0.02, y1: lv - 0.01, radius: () => r * 0.72 }, 0.58);
  const solids = new THREE.Group(); solids.position.y = r + 0.02;
  const steam = new SteamFX(7); steam.group.position.y = h + 0.03;

  g.add(liquid, meniscus, solids, bub.mesh, steam.group, glass);
  g.userData = {
    H: h, RN: r, solids, bub, steam,
    surfaceY: () => g.position.y + lv,
    mouthWorld: () => V3(g.position.x, g.position.y + h, g.position.z),
    setFill(k) { liquid.visible = meniscus.visible = k > 0.02; liquid.scale.y = Math.max(0.01, k); },
    setTint(colHex, k, { opacity = 0.88 } = {}) {
      liqMat.color.set(PAL.water).lerp(new THREE.Color(colHex), k);
      liqMat.opacity = 0.46 + (opacity - 0.46) * k;
    },
    clear() { this.setTint(PAL.water, 0, { opacity: 0.46 }); solids.clear(); bub.update(0, 0); steam.update(0, 0); },
  };
  return g;
}

// 3. Lọ hoá chất Duran có NẮP VẶN TÁCH RỜI (xoay ren + nhấc bay sang đặt gọn trên bàn!)
function makeBottlePro({ title = 'HCl', sub = '0,5 M', name = '', amber = false, wide = false, powder = false, h = 1.08, r = 0.36, fill = 0.65 } = {}) {
  const g = new THREE.Group();
  const T = 0.026, rn = wide ? r * 0.68 : 0.155, ys = h * 0.78, yn = h, nt = h + 0.2;
  const outer = [[0, 0.009], [r - 0.055, 0.009], [r, 0.06], [r, ys - 0.06], [r - 0.03, ys + 0.035], [rn + 0.075, yn - 0.02], [rn, yn + 0.03], [rn, nt]];
  const inner = [[0, 0.065], [r - 0.055 - T, 0.065], [r - T, 0.098], [r - T, ys - 0.07], [r - 0.03 - T, ys + 0.01], [rn + 0.055 - T, yn - 0.04], [rn - T, yn + 0.02], [rn - T, nt]];
  const body = glassShell(lathe(outer, 40), lathe(inner, 40), amber);

  const lv = Math.min(h * fill, ys - 0.07);
  const contentGeo = lathe([[0, 0.068], [r - 0.06 - T, 0.068], [r - T - 0.008, 0.10], [r - T - 0.008, lv], [0, lv]], 36);
  const innerMesh = new THREE.Mesh(contentGeo, powder ? MAT.mno2 : liquidMat(PAL.water, 0.28));
  innerMesh.renderOrder = powder ? 0 : 2; if (amber && !powder) innerMesh.visible = false;
  if (!amber && !powder) {
    const men = new THREE.Mesh(new THREE.TorusGeometry(r - T - 0.01, 0.007, 8, 32), MAT.meniscus);
    men.rotation.x = Math.PI / 2; men.position.y = lv; men.renderOrder = 5; g.add(men);
  }

  const capR = rn + 0.055;
  const capGroup = put(new THREE.Group(), 0, nt - 0.02, 0);
  const capMesh = new THREE.Mesh(cyl(capR, capR, 0.22, 36), amber ? CAP_BLACK : CAP_BLUE); capMesh.castShadow = true;
  const capTop = new THREE.Mesh(cyl(capR - 0.016, capR, 0.022, 36), amber ? MAT.darkPlastic : MAT.accent); capTop.position.y = 0.12;
  capGroup.add(capMesh, capTop);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(rn + 0.022, 0.022, 8, 28), amber ? MAT.darkPlastic : MAT.accent);
  ring.rotation.x = Math.PI / 2; ring.position.y = yn + 0.045;

  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(r + 0.012, r + 0.012, ys * 0.64, 36, 1, true, -0.95, 1.9),
    new THREE.MeshStandardMaterial({ map: labelTexture(title, sub, name), roughness: 0.45, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  );
  label.position.y = ys * 0.47; label.renderOrder = 6;
  const shadow = contactAO(r * 1.65);

  g.add(shadow, innerMesh, body, ring, capGroup, label);
  g.userData = { cap: capGroup, capHomeY: nt - 0.02, top: nt, r, shadow };
  return g;
}

// 4. Lọ nhỏ giọt nâu (Phenolphthalein)
function makeDropperBottlePro() {
  const g = new THREE.Group(), r = 0.19, h = 0.55;
  const body = glassShell(
    lathe([[0, 0.009], [r - 0.03, 0.009], [r, 0.04], [r, h - 0.08], [0.105, h], [0.082, h + 0.02], [0.082, h + 0.12]], 36),
    lathe([[0, 0.05], [r - 0.05, 0.05], [r - 0.022, 0.068], [r - 0.022, h - 0.09], [0.088, h - 0.01], [0.065, h + 0.02], [0.065, h + 0.12]], 36), true,
  );
  const pipG = put(new THREE.Group(), 0, h + 0.10, 0);
  const cap = new THREE.Mesh(cyl(0.11, 0.11, 0.12, 24), MAT.darkPlastic); cap.castShadow = true;
  const bulb = new THREE.Mesh(lathe([[0.052, 0], [0.068, 0.08], [0.062, 0.21], [0.03, 0.28], [0, 0.29]], 20), MAT.rubberRed);
  bulb.position.y = 0.06; bulb.castShadow = true;
  const stem = new THREE.Mesh(cyl(0.018, 0.01, 0.42, 12), MAT.glassFront); stem.position.y = -0.24;
  pipG.add(cap, bulb, stem);

  const tex = canvasTex(384, 224, (c, w, hh) => {
    c.fillStyle = '#fff'; c.fillRect(0, 0, w, hh); c.fillStyle = '#2563eb'; c.fillRect(0, 0, w, 18);
    c.fillStyle = '#0f243d'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `800 72px ${FONT}`; c.fillText('PP', w / 2, 92);
    c.font = `600 34px ${FONT}`; c.fillStyle = '#334155'; c.fillText('Phenolphthalein', w / 2, 168, w - 30);
  });
  const label = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.01, r + 0.01, 0.28, 32, 1, true, -0.95, 1.9), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  label.position.y = 0.25; label.renderOrder = 6;
  const shadow = contactAO(r * 1.75);
  g.add(shadow, body, pipG, label);
  g.userData = { pipette: pipG, pipHomeY: h + 0.10, top: h + 0.42, shadow };
  return g;
}

// 5. Ống đong 100 mL có mực nước + meniscus động
function makeCylinderPro({ r = 0.165, h = 1.72, max = 100 } = {}) {
  const g = new THREE.Group(), T = 0.019, y0 = 0.11;
  const glass = glassShell(lathe([[0, y0], [r, y0], [r, h - 0.04], [r + 0.032, h]], 32), lathe([[0, y0 + 0.05], [r - T, y0 + 0.05], [r - T, h - 0.03], [r + 0.032, h]], 32), false);
  const foot = new THREE.Mesh(cyl(r * 2.1, r * 2.35, y0, 6), MAT.glassThick); foot.position.y = y0 / 2 + 0.008; foot.renderOrder = 4;
  const yLo = y0 + 0.14, yHi = h - 0.24, marks = [];
  for (let v = 10; v <= max; v += 10) marks.push([(v / max), v % 20 === 0 ? String(v) : '', v % 20 === 0]);
  const decal = gradDecal([[r + 0.011, yLo], [r + 0.011, yHi]], marks, { arc: 1.55 });

  const liq = new THREE.Mesh(new THREE.BufferGeometry(), liquidMat(PAL.water, 0.48)); liq.renderOrder = 1; liq.visible = false;
  const men = new THREE.Mesh(new THREE.TorusGeometry(r - T - 0.005, 0.007, 8, 28), MAT.meniscus); men.rotation.x = Math.PI / 2; men.renderOrder = 3; men.visible = false;
  let mL = 0, lastLv = -1;
  function setVolume(v) {
    mL = clamp(v, 0, max);
    const on = mL > 0.4; liq.visible = men.visible = on; if (!on) return;
    const lv = yLo + (yHi - yLo) * (mL / max);
    if (Math.abs(lv - lastLv) > 0.005) {
      lastLv = lv;
      liq.geometry.dispose();
      liq.geometry = lathe([[0, y0 + 0.055], [r - T - 0.004, y0 + 0.055], [r - T - 0.004, lv], [0, lv - 0.007]], 28);
      men.position.y = lv;
    }
  }
  const shadow = contactAO(r * 2.9);
  g.add(shadow, liq, men, glass, foot, decal);
  g.userData = {
    h, top: h, r, shadow,
    get mL() { return mL; },
    setVolume,
    surfaceY: () => g.position.y + yLo + (yHi - yLo) * clamp(mL / max),
    mouthWorld: () => V3(g.position.x, g.position.y + h, g.position.z),
  };
  return g;
}

// 6. Bộ đo khí (Xi-lanh vạch cong + 2 gioăng + bosshead có núm vặn + nút cao su có khớp gập mở)
const SYR_BASE_GEO = roundedBox(1.0, 0.09, 0.68, 0.06, 0.015);
const BOSS_GEO = roundedBox(0.18, 0.22, 0.22, 0.025, 0.012);

function makeGasRigPro({ dir = 1, SY = 2.28 } = {}) {
  const g = new THREE.Group();
  const L = 1.32, r = 0.175, travel = 1.12, max = 100, X0 = 0.08;
  const syr = put(new THREE.Group(), dir * 0.46, SY, 0);

  const barrelGeo = cyl(r, r, L, 32, true); barrelGeo.rotateZ(-Math.PI / 2); barrelGeo.translate(dir * L / 2, 0, 0);
  const barrel = glassPair(barrelGeo, false);

  const rotZ = (m, x) => { m.rotation.z = (Math.PI / 2) * dir; m.position.x = dir * x; return m; };
  const capL = rotZ(new THREE.Mesh(cyl(r + 0.01, r * 0.46, 0.13, 28), MAT.whitePlastic), -0.055);
  const nozzle = rotZ(new THREE.Mesh(cyl(0.042, 0.036, 0.26, 14), MAT.whitePlastic), -0.21);
  const flange = rotZ(new THREE.Mesh(cyl(r + 0.095, r + 0.095, 0.045, 28), MAT.whitePlastic), L);
  [capL, nozzle, flange].forEach((m) => { m.castShadow = true; });

  const piston = new THREE.Group();
  const head = rotZ(new THREE.Mesh(cyl(r - 0.015, r - 0.015, 0.14, 24), MAT.darkMetal), 0.06);
  const oRing1 = new THREE.Mesh(new THREE.TorusGeometry(r - 0.012, 0.015, 8, 24), MAT.darkPlastic);
  oRing1.rotation.y = Math.PI / 2; oRing1.position.x = dir * 0.025;
  const oRing2 = oRing1.clone(); oRing2.position.x = dir * 0.095;
  const rod = rotZ(new THREE.Mesh(cyl(r - 0.035, r - 0.035, L, 20), MAT.glassFront), 0.13 + L / 2);
  const handle = rotZ(new THREE.Mesh(cyl(r + 0.075, r + 0.075, 0.05, 24), MAT.whitePlastic), 0.13 + L); handle.castShadow = true;
  piston.add(head, oRing1, oRing2, rod, handle);

  const scaleTex = canvasTex(1536, 280, (c, w) => {
    const pad = (0.08 / (travel + 0.16)) * w, span = w - 2 * pad;
    c.textAlign = 'center'; c.textBaseline = 'top';
    for (let v = 0; v <= max; v += 2) {
      const x = pad + (dir > 0 ? v / max : 1 - v / max) * span;
      const big = v % 10 === 0, mid = big || v % 5 === 0;
      const len = big ? 92 : mid ? 64 : 40;
      c.strokeStyle = 'rgba(15,24,36,0.58)'; c.lineWidth = big ? 11 : 6; c.beginPath(); c.moveTo(x, 10); c.lineTo(x, 10 + len); c.stroke();
      c.strokeStyle = '#ffffff'; c.lineWidth = big ? 6 : 3; c.beginPath(); c.moveTo(x, 10); c.lineTo(x, 10 + len); c.stroke();
      if (v % 20 === 0) {
        c.font = `800 94px ${FONT}`; c.lineWidth = 10; c.strokeStyle = 'rgba(15,24,36,0.75)'; c.strokeText(String(v), x, 118);
        c.fillStyle = '#ffffff'; c.fillText(String(v), x, 118);
      }
    }
  });
  const scaleGeo = new THREE.CylinderGeometry(r + 0.011, r + 0.011, travel + 0.16, 20, 1, true, -0.58, 1.16);
  scaleGeo.rotateZ(-Math.PI / 2); scaleGeo.rotateX(Math.PI / 2);
  const scaleMesh = new THREE.Mesh(scaleGeo, new THREE.MeshBasicMaterial({ map: scaleTex, transparent: true, depthWrite: false, side: THREE.FrontSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  scaleMesh.position.set(dir * (X0 + travel / 2), 0, 0); scaleMesh.renderOrder = 7;
  syr.add(barrel, capL, nozzle, flange, piston, scaleMesh);

  const px = dir * 1.12, pz = -0.46;
  const base = new THREE.Mesh(SYR_BASE_GEO, MAT.darkMetal); base.position.set(px, 0, pz + 0.12); base.castShadow = true; base.receiveShadow = true;
  const post = new THREE.Mesh(cyl(0.042, 0.042, SY + 0.55, 14), MAT.steel); post.position.set(px, (SY + 0.55) / 2, pz); post.castShadow = true;
  const boss = new THREE.Mesh(BOSS_GEO, MAT.darkMetal); boss.position.set(px, SY - 0.11, pz); boss.castShadow = true;
  const screw = new THREE.Mesh(cyl(0.055, 0.055, 0.06, 14), MAT.darkPlastic); screw.rotation.z = Math.PI / 2; screw.position.set(px + dir * 0.15, SY, pz);
  const arm = new THREE.Mesh(cyl(0.032, 0.032, 0.34, 12), MAT.steel); arm.rotation.x = Math.PI / 2; arm.position.set(px, SY, pz + 0.22);
  const jaw = new THREE.Mesh(new THREE.TorusGeometry(r + 0.022, 0.028, 10, 24, Math.PI * 1.65), MAT.darkMetal);
  jaw.rotation.y = Math.PI / 2; jaw.rotation.x = 0.5; jaw.position.set(px, SY, 0);

  // Nút cao su + ống dẫn xoay quanh khớp đầu vòi để mở/đậy miệng bình thật!
  const piv = V3(dir * 0.15, SY, 0);
  const plug = put(new THREE.Group(), piv.x, piv.y, piv.z);
  const stopper = new THREE.Mesh(cyl(0.205, 0.155, 0.28, 24), MAT.rubberRed);
  stopper.position.set(-piv.x, 1.50 - piv.y, 0); stopper.castShadow = true;
  const curve = new THREE.CatmullRomCurve3([[0, 1.60], [0, SY - 0.36], [dir * 0.05, SY - 0.08], [dir * 0.15, SY]].map(([x, y]) => V3(x - piv.x, y - piv.y, 0)));
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 26, 0.032, 10), MAT.silicone); tube.renderOrder = 3;
  plug.add(stopper, tube);

  g.add(contactAO(0.65), syr, base, post, boss, screw, arm, jaw, plug);
  let open = 1;
  const setVolume = (mL) => { piston.position.x = dir * (X0 + travel * clamp(mL / max)); };
  const setOpen = (k) => { open = k; plug.rotation.z = dir * 0.85 * k; };
  setVolume(0); setOpen(1);
  g.userData = { setVolume, setOpen, get open() { return open; } };
  return g;
}

// 7. Cân điện tử bo góc có đĩa cân NHÚN LÒ XO + LCD dao động ổn định thật!
const BAL_BODY_GEO = roundedBox(1.24, 0.22, 1.38, 0.09, 0.025);
const BAL_BEZEL_GEO = roundedBox(1.12, 0.28, 0.34, 0.05, 0.016);

function makeBalancePro() {
  const g = new THREE.Group(), D = 1.38, H = 0.22;
  const body = new THREE.Mesh(BAL_BODY_GEO, MAT.whitePlastic); body.castShadow = true; body.receiveShadow = true;
  const bezel = new THREE.Mesh(BAL_BEZEL_GEO, MAT.darkPlastic);
  bezel.position.set(0, 0.03, D / 2 - 0.14); bezel.rotation.x = -0.22; bezel.castShadow = true;

  const cv = document.createElement('canvas'); cv.width = 360; cv.height = 120;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  let shown = null;
  const setValue = (v, stable = true) => {
    const num = v == null ? 0 : v, txt = num.toFixed(2).replace('.', ','), key = txt + stable;
    if (key === shown) return; shown = key;
    const c = cv.getContext('2d');
    const gr = c.createLinearGradient(0, 0, 0, 120); gr.addColorStop(0, '#c8dfcd'); gr.addColorStop(1, '#d8ebdc');
    c.fillStyle = gr; c.fillRect(0, 0, 360, 120);
    c.strokeStyle = 'rgba(20,40,30,0.22)'; c.lineWidth = 5; c.strokeRect(2.5, 2.5, 355, 115);
    c.fillStyle = '#0f1c18'; c.textBaseline = 'middle'; c.textAlign = 'right';
    c.font = `700 80px ${FONT}`; c.fillText(txt, 284, 66);
    c.textAlign = 'left'; c.font = `700 40px ${FONT}`; c.fillText('g', 294, 76);
    c.fillStyle = stable && v != null ? '#15803d' : '#475569';
    c.font = `700 18px ${FONT}`; c.fillText(stable && v != null ? '● STABLE' : 'TARE', 18, 22);
    tex.needsUpdate = true;
  };
  setValue(null, false);

  const lcd = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.21), new THREE.MeshStandardMaterial({ map: tex, emissive: 0x89a892, emissiveMap: tex, emissiveIntensity: 0.25, roughness: 0.14 }));
  lcd.position.set(-0.12, 0.165, D / 2 + 0.038); lcd.rotation.x = -0.22;
  const btn1 = new THREE.Mesh(cyl(0.042, 0.046, 0.025, 16), MAT.accent); btn1.rotation.x = Math.PI / 2 - 0.22; btn1.position.set(0.39, 0.17, D / 2 + 0.04);

  // Cụm đĩa cân di chuyển dọc theo trục Y khi đặt vật lên (spring dip!)
  const panGroup = put(new THREE.Group(), 0, H + 0.05, -0.14);
  const panBase = new THREE.Mesh(cyl(0.49, 0.51, 0.035, 32), MAT.darkMetal); panBase.position.y = -0.032;
  const pan = new THREE.Mesh(cyl(0.47, 0.47, 0.032, 32), MAT.steel); pan.castShadow = true; pan.receiveShadow = true;
  const panRim = new THREE.Mesh(new THREE.TorusGeometry(0.468, 0.012, 8, 36), MAT.steel); panRim.rotation.x = Math.PI / 2; panRim.position.y = 0.015;
  panGroup.add(panBase, pan, panRim);

  g.add(contactAO(0.95), body, bezel, lcd, btn1, panGroup);
  g.userData = {
    setValue,
    setDip(d) { panGroup.position.y = H + 0.05 - d * 0.035; },
    panTop: V3(0, H + 0.072, -0.14),
  };
  return g;
}

// 8. Đồng hồ bấm giây bo góc có nút START ấn lún vật lý!
const TIMER_BODY_GEO = roundedBox(0.78, 0.54, 0.36, 0.06, 0.02);
const BTN_GREEN = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.35 });
const BTN_RED = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35 });

function makeTimerPro() {
  const g = new THREE.Group(), W = 0.78, H = 0.54, D = 0.36;
  const body = new THREE.Mesh(TIMER_BODY_GEO, MAT.darkPlastic); body.castShadow = true; body.receiveShadow = true;
  const cv = document.createElement('canvas'); cv.width = 320; cv.height = 160;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  let last = '', pressAnim = 0;
  const setTime = (sec) => {
    const s = Number(sec).toFixed(1).replace('.', ','); if (s === last) return; last = s;
    const c = cv.getContext('2d');
    c.fillStyle = '#d3e7d7'; c.fillRect(0, 0, 320, 160);
    c.strokeStyle = 'rgba(15,30,22,0.24)'; c.lineWidth = 6; c.strokeRect(3, 3, 314, 154);
    c.fillStyle = '#0e1915'; c.textAlign = 'right'; c.textBaseline = 'middle';
    c.font = `700 100px ${FONT}`; c.fillText(s, 250, 86);
    c.font = `700 44px ${FONT}`; c.textAlign = 'left'; c.fillText('s', 260, 100);
    tex.needsUpdate = true;
  };
  setTime(0);

  const face = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.14, H - 0.18), new THREE.MeshStandardMaterial({ map: tex, emissive: 0x89a892, emissiveMap: tex, emissiveIntensity: 0.25, roughness: 0.14 }));
  face.position.set(0, H * 0.52, D / 2 + 0.005);
  const btnStart = new THREE.Mesh(cyl(0.055, 0.06, 0.065, 16), BTN_GREEN); btnStart.position.set(-0.16, H + 0.025, 0);
  const btnReset = new THREE.Mesh(cyl(0.055, 0.06, 0.065, 16), BTN_RED); btnReset.position.set(0.16, H + 0.025, 0);

  g.add(contactAO(0.55), body, face, btnStart, btnReset);
  g.rotation.x = -0.18;
  g.userData = {
    setTime,
    pressStart() { pressAnim = 1; sfx.click(920); },
    update(dt) {
      if (pressAnim > 0) {
        pressAnim = Math.max(0, pressAnim - dt * 5);
        btnStart.position.y = H + 0.025 - Math.sin(pressAnim * Math.PI) * 0.032;
      }
    },
  };
  return g;
}

// 9. Đá vôi hữu cơ & Mặt kính đồng hồ
function makeBlobGeo(r, seed = 1, k = 0.24) {
  const geo = new THREE.SphereGeometry(r, 14, 10), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / r, y = p.getY(i) / r, z = p.getZ(i) / r;
    const f = 1 + k * (Math.sin(3.2 * x + seed) + Math.sin(4.1 * y + 2 * seed) + Math.sin(3.8 * z + 3 * seed)) / 3;
    p.setXYZ(i, p.getX(i) * f, p.getY(i) * f * 0.72, p.getZ(i) * f);
  }
  geo.computeVertexNormals(); return geo;
}

function makeLimestone(form = 'vien', scale = 1) {
  const g = new THREE.Group();
  if (form === 'vien') {
    const m = new THREE.Mesh(makeBlobGeo(0.15 * scale, 2.3, 0.26), MAT.limestone);
    m.position.y = 0.1 * scale; m.castShadow = true; g.add(m);
  } else {
    let s = 19; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * 6.283 + rnd() * 0.4, d = (i === 0 ? 0 : 0.08 + rnd() * 0.16) * scale, r = (0.044 + rnd() * 0.025) * scale;
      const m = new THREE.Mesh(makeBlobGeo(r, i * 1.7 + 0.5, 0.28), MAT.limestone);
      m.position.set(Math.cos(a) * d, r * 0.72, Math.sin(a) * d); m.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
      m.castShadow = true; g.add(m);
    }
  }
  return g;
}

function makeMgRibbons(n = 2) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.015, 0.062), MAT.magnesium);
    ribbon.position.set((i - (n - 1) / 2) * 0.14, 0.02, (i % 2 - 0.5) * 0.14);
    ribbon.rotation.y = 0.4 + i * 0.65; ribbon.castShadow = true; g.add(ribbon);
  }
  return g;
}

const DISH_GEO = lathe([[0, 0.012], [0.28, 0.028], [0.43, 0.09], [0.46, 0.11]], 32);
function makeWatchGlassPro({ form = null, mg = false } = {}) {
  const g = new THREE.Group();
  const holder = new THREE.Group(); holder.position.y = 0.03;
  const setContent = (on) => {
    holder.clear(); if (!on) return;
    if (form) holder.add(makeLimestone(form, 1));
    if (mg) holder.add(makeMgRibbons(2));
  };
  setContent(true);
  g.add(contactAO(0.58), holder, glassPair(DISH_GEO, false));
  g.userData = { holder, setContent, form };
  return g;
}

// 10. Giá gỗ sồi + Đèn cồn có NẮP CHỤP THUỶ TINH TÁCH RỜI + Lửa 2 tầng + PointLight ấm thật
function makeWoodRackPro() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(roundedBox(1.85, 0.09, 0.68, 0.04, 0.012), MAT.wood);
  const top = new THREE.Mesh(roundedBox(1.85, 0.08, 0.68, 0.04, 0.012), MAT.wood); top.position.y = 0.84;
  [-0.78, 0.78].forEach((x) => { const s = new THREE.Mesh(roundedBox(0.09, 0.88, 0.64, 0.03, 0.01), MAT.wood); s.position.set(x, 0.04, 0); s.castShadow = true; g.add(s); });
  const holeMat = new THREE.MeshStandardMaterial({ color: 0x523b24, roughness: 0.9 });
  [-0.45, 0, 0.45].forEach((x) => { const h = new THREE.Mesh(cyl(0.11, 0.11, 0.015, 18), holeMat); h.position.set(x, 0.915, 0); g.add(h); });
  [base, top].forEach((m) => { m.castShadow = true; m.receiveShadow = true; });
  g.add(contactAO(1.15), base, top); return g;
}

function makeAlcoholLampPro() {
  const g = new THREE.Group();
  const glass = glassShell(
    lathe([[0, 0.009], [0.34, 0.009], [0.39, 0.12], [0.40, 0.36], [0.30, 0.62], [0.16, 0.74], [0.16, 0.84]], 40),
    lathe([[0, 0.055], [0.30, 0.055], [0.36, 0.14], [0.37, 0.36], [0.27, 0.60], [0.135, 0.73], [0.135, 0.84]], 40), false,
  );
  const alcohol = new THREE.Mesh(lathe([[0, 0.055], [0.295, 0.055], [0.355, 0.14], [0.365, 0.35], [0.32, 0.48], [0, 0.48]], 28), liquidMat(0xdcf0fa, 0.42)); alcohol.renderOrder = 1;
  const collar = new THREE.Mesh(cyl(0.165, 0.175, 0.14, 24), MAT.steel); collar.position.y = 0.86; collar.castShadow = true;
  const wickTube = new THREE.Mesh(cyl(0.048, 0.055, 0.14, 16), MAT.steel); wickTube.position.y = 0.96;
  const wick = new THREE.Mesh(cyl(0.028, 0.032, 0.18, 10), new THREE.MeshStandardMaterial({ color: 0xe7dfd1, roughness: 0.95 })); wick.position.y = 1.02;

  // Nắp chụp thuỷ tinh (đậy sẵn khi tắt đèn, nhấc sang bên khi châm lửa!)
  const cap = glassPair(lathe([[0.17, 0], [0.16, 0.24], [0.11, 0.36], [0, 0.39]], 24), false);
  const capHome = V3(0, 0.84, 0), capAside = V3(0.64, 0, 0.18);
  cap.position.copy(capHome);

  const flameGroup = put(new THREE.Group(), 0, 1.08, 0); flameGroup.visible = false;
  const outerFlame = new THREE.Mesh(lathe([[0, 0], [0.075, 0.08], [0.082, 0.18], [0.048, 0.32], [0, 0.44]], 18), new THREE.MeshBasicMaterial({ color: 0xffa62b, transparent: true, opacity: 0.9, depthWrite: false }));
  const innerFlame = new THREE.Mesh(lathe([[0, 0], [0.045, 0.05], [0.042, 0.14], [0, 0.24]], 16), new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.92, depthWrite: false }));
  const glowLight = new THREE.PointLight(0xff9b3d, 0, 5.5, 1.8); glowLight.position.y = 0.25;
  flameGroup.add(outerFlame, innerFlame, glowLight);

  g.add(contactAO(0.55), alcohol, glass, collar, wickTube, wick, cap, flameGroup);
  let lit = false;
  g.userData = {
    cap, capHome, capAside,
    get lit() { return lit; },
    setLit(on) { lit = !!on; flameGroup.visible = lit; glowLight.intensity = lit ? 2.2 : 0; },
    capOn() { cap.position.copy(capHome); this.setLit(false); },
    flicker(t) {
      if (!lit) return;
      const f = 1 + 0.08 * Math.sin(t * 17) + 0.05 * Math.sin(t * 29);
      outerFlame.scale.set(1 / Math.sqrt(f), f, 1 / Math.sqrt(f));
      outerFlame.rotation.z = Math.sin(t * 11) * 0.06;
      glowLight.intensity = 2.1 + 0.45 * Math.sin(t * 19);
    },
  };
  return g;
}

// 11. Bếp điện bo góc
function makeHotplatePro() {
  const g = new THREE.Group(), W = 1.48, D = 1.75, H = 0.36;
  const body = new THREE.Mesh(roundedBox(W, H, D, 0.08, 0.025), MAT.whitePlastic); body.castShadow = true; body.receiveShadow = true;
  const rim = new THREE.Mesh(cyl(0.54, 0.56, 0.028, 32), MAT.steel); rim.position.set(0, H + 0.014, -0.18);
  const plateMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f2, roughness: 0.26, emissive: 0xff4514, emissiveIntensity: 0 });
  const plate = new THREE.Mesh(cyl(0.51, 0.51, 0.036, 32), plateMat); plate.position.set(0, H + 0.024, -0.18); plate.receiveShadow = true;
  const panel = new THREE.Mesh(new THREE.BoxGeometry(W - 0.16, 0.22, 0.04), MAT.darkMetal); panel.position.set(0, 0.17, D / 2 - 0.01);
  const knob = new THREE.Mesh(cyl(0.1, 0.11, 0.09, 20), MAT.darkPlastic); knob.rotation.x = Math.PI / 2; knob.position.set(0.38, 0.17, D / 2 + 0.05);
  const led = new THREE.Mesh(new THREE.CircleGeometry(0.032, 14), new THREE.MeshBasicMaterial({ color: 0x475569 })); led.position.set(-0.42, 0.17, D / 2 + 0.032);
  g.add(contactAO(1.1), body, rim, plate, panel, knob, led);
  g.userData = {
    topY: H + 0.042, plateZ: -0.18,
    setTemp(t) { const k = clamp((t - 25) / 40); plateMat.emissiveIntensity = k * 0.55; led.material.color.set(k > 0.02 ? 0xff4a1a : 0x475569); },
  };
  return g;
}

// 12. Nhiệt kế rượu đỏ
function makeThermometerPro(h = 1.85) {
  const g = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.25 });
  const rod = new THREE.Mesh(cyl(0.024, 0.024, h, 12), MAT.glassFront); rod.position.y = h / 2; rod.renderOrder = 4;
  const backStrip = new THREE.Mesh(new THREE.BoxGeometry(0.018, h - 0.18, 0.006), MAT.whitePlastic); backStrip.position.set(0, h / 2 + 0.04, -0.006);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), red); bulb.position.y = 0.035;
  const col = new THREE.Mesh(cyl(0.01, 0.01, 1, 8), red);
  const y0 = 0.06, y1 = h - 0.12;
  const setTemp = (t) => { const len = Math.max(0.04, (y1 - y0) * clamp(t / 100)); col.scale.y = len; col.position.y = y0 + len / 2; };
  setTemp(25);
  g.add(bulb, backStrip, col, rod); g.userData = { setTemp }; return g;
}

// 13. Thìa xúc inox có lòng muỗng chứa được bột MnO2 thật!
function makeSpatulaPro() {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(cyl(0.018, 0.018, 1.35, 12), MAT.steel); shaft.rotation.z = Math.PI / 2; shaft.position.y = 0.025; shaft.castShadow = true;
  const scoop = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 8, 0, Math.PI * 2, Math.PI * 0.52, Math.PI * 0.48), MAT.steel);
  scoop.scale.set(1.5, 0.65, 0.95); scoop.position.set(-0.74, 0.05, 0);
  const grip = new THREE.Mesh(cyl(0.026, 0.026, 0.36, 14), MAT.darkPlastic); grip.rotation.z = Math.PI / 2; grip.position.set(0.55, 0.025, 0);
  const mound = new THREE.Mesh(new THREE.SphereGeometry(0.072, 12, 8), MAT.mno2);
  mound.scale.set(1.25, 0.65, 0.85); mound.position.set(-0.74, 0.058, 0); mound.visible = false;
  g.add(shaft, scoop, grip, mound);
  g.userData = { mound, setLoaded: (on) => { mound.visible = !!on; } };
  return g;
}

// 14. Tờ giấy chữ X sắc nét
const X_PAPER_MAT = new THREE.MeshStandardMaterial({
  map: canvasTex(384, 384, (c, w, h) => {
    c.fillStyle = '#fcfcf9'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#cbd5e1'; c.lineWidth = 5; c.strokeRect(2.5, 2.5, w - 5, h - 5);
    c.strokeStyle = '#0f172a'; c.lineWidth = 46; c.lineCap = 'round';
    c.beginPath(); c.moveTo(w * 0.27, h * 0.27); c.lineTo(w * 0.73, h * 0.73);
    c.moveTo(w * 0.73, h * 0.27); c.lineTo(w * 0.27, h * 0.73); c.stroke();
  }), roughness: 0.88,
});
function makeXPaperPro(s = 1.18) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), X_PAPER_MAT);
  m.rotation.x = -Math.PI / 2; m.position.y = 0.008; m.receiveShadow = true; return m;
}

// 15. Vòng kính soi hạt 3D tương tác (nhận set({count, speed, hot}) & trả về rate())
function makeParticleLensPro({ R = 0.95, y = 2.45 } = {}) {
  const g = new THREE.Group(), S = 320;
  const base = new THREE.Mesh(cyl(0.46, 0.54, 0.12, 32), MAT.darkMetal); base.position.y = 0.06; base.castShadow = true;
  const post = new THREE.Mesh(cyl(0.045, 0.045, y - R - 0.04, 16), MAT.steel); post.position.y = (y - R) / 2; post.castShadow = true;
  const rimOuter = new THREE.Mesh(new THREE.TorusGeometry(R + 0.03, 0.075, 16, 56), MAT.steel); rimOuter.position.y = y; rimOuter.castShadow = true;
  const rimInner = new THREE.Mesh(new THREE.TorusGeometry(R - 0.02, 0.024, 12, 48), MAT.accent); rimInner.position.y = y;

  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(R - 0.02, 48), new THREE.MeshBasicMaterial({ map: tex })); disc.position.set(0, y, 0.015);
  const back = new THREE.Mesh(new THREE.CircleGeometry(R - 0.02, 32), MAT.darkPlastic); back.position.set(0, y, -0.015); back.rotation.y = Math.PI;
  const dome = new THREE.Mesh(new THREE.CircleGeometry(R - 0.02, 48), MAT.glassFront); dome.position.set(0, y, 0.028); dome.renderOrder = 6;

  let seed = 7, count = 20, speedMul = 1, hits = 0, win = 0, rate = 1.2, acc = 1;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const parts = Array.from({ length: 64 }, (_, i) => {
    const a = rnd() * 6.283, d = Math.sqrt(rnd()) * 0.82, v = 0.18 + rnd() * 0.24, b = rnd() * 6.283;
    return { x: Math.cos(a) * d, y: Math.sin(a) * d, vx: Math.cos(b) * v, vy: Math.sin(b) * v, hot: i % 5 === 0, h: rnd() };
  });
  const flashes = [];

  function set({ count: n = 20, speed = 1, hot = 0.2 } = {}) {
    count = clamp(Math.round(n), 6, parts.length); speedMul = speed;
    parts.forEach((p) => { p.hot = p.h < hot; });
  }
  function draw() {
    const c = cv.getContext('2d'), h = S / 2, k = h * 0.94;
    c.fillStyle = '#0f172e'; c.fillRect(0, 0, S, S);
    flashes.forEach((f) => {
      c.strokeStyle = `rgba(255,240,180,${(1 - f.t) * 0.95})`; c.lineWidth = 3;
      c.beginPath(); c.arc(h + f.x * k, h - f.y * k, 8 + f.t * 24, 0, 6.283); c.stroke();
    });
    for (let i = 0; i < count; i++) {
      const p = parts[i], px = h + p.x * k, py = h - p.y * k;
      if (p.hot) { c.fillStyle = 'rgba(255,205,90,0.3)'; c.beginPath(); c.arc(px, py, 14, 0, 6.283); c.fill(); }
      c.fillStyle = p.hot ? '#ffe082' : '#7ea2d6'; c.beginPath(); c.arc(px, py, p.hot ? 7 : 5.5, 0, 6.283); c.fill();
    }
    tex.needsUpdate = true;
  }
  function update(dt) {
    const lim = 0.89;
    for (let i = 0; i < count; i++) {
      const p = parts[i], sp = (p.hot ? 1.85 : 1) * speedMul;
      p.x += p.vx * sp * dt; p.y += p.vy * sp * dt;
      const d = Math.hypot(p.x, p.y);
      if (d > lim) { const nx = p.x / d, ny = p.y / d, dot = p.vx * nx + p.vy * ny; if (dot > 0) { p.vx -= 2 * dot * nx; p.vy -= 2 * dot * ny; } p.x = nx * lim; p.y = ny * lim; }
    }
    for (let i = 0; i < count; i++) for (let j = i + 1; j < count; j++) {
      const a = parts[i], b = parts[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if (d > 0.09 || d === 0) continue;
      const nx = dx / d, ny = dy / d, rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (rel > 0) continue;
      a.vx += rel * nx; a.vy += rel * ny; b.vx -= rel * nx; b.vy -= rel * ny;
      if (a.hot && b.hot) { hits++; if (flashes.length < 7) flashes.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, t: 0 }); }
    }
    for (let i = flashes.length - 1; i >= 0; i--) { flashes[i].t += dt * 1.8; if (flashes[i].t >= 1) flashes.splice(i, 1); }
    win += dt; if (win >= 1.2) { rate += (hits / win - rate) * 0.65; hits = 0; win = 0; }
    acc += dt; if (acc >= 1 / 24) { acc = 0; draw(); }
  }
  draw();
  g.add(contactAO(0.75), base, post, back, disc, dome, rimOuter, rimInner);
  g.userData = { update, set, rate: () => rate };
  return g;
}

// 16. Cốc thuỷ tinh nước cho Bước 9 · Đời sống (viên sủi nguyên vs bẻ vụn trong 3D!)
function makeGlassCupPro() {
  const g = new THREE.Group(), h = 1.24, r0 = 0.34, r1 = 0.42, T = 0.025;
  const glass = glassShell(lathe([[0, 0.009], [r0 - 0.02, 0.009], [r0, 0.036], [r1, h]], 44), lathe([[0, 0.088], [r0 - T - 0.02, 0.088], [r0 - T, 0.11], [r1 - T, h]], 44), false);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r1 - 0.008, 0.012, 8, 36), MAT.glassThick); rim.rotation.x = Math.PI / 2; rim.position.y = h - 0.006; rim.renderOrder = 5; glass.add(rim);
  const lv = 0.92, rAt = (y) => lerp(r0 - T - 0.005, r1 - T - 0.005, clamp(y / h));
  const liqMat = liquidMat(PAL.water, 0.46);
  const liquid = new THREE.Mesh(lathe([[0, 0.09], [rAt(0.09), 0.09], [rAt(lv), lv], [0, lv - 0.012]], 36), liqMat); liquid.renderOrder = 1;
  const men = new THREE.Mesh(new THREE.TorusGeometry(rAt(lv) - 0.004, 0.008, 8, 36), MAT.meniscus); men.rotation.x = Math.PI / 2; men.position.y = lv; men.renderOrder = 3;
  const foamMat = new THREE.MeshStandardMaterial({ color: 0xfff8ed, roughness: 0.85, transparent: true, opacity: 0, depthWrite: false });
  const foam = new THREE.Mesh(cyl(rAt(lv) - 0.01, rAt(lv) - 0.004, 0.06, 32), foamMat); foam.position.y = lv + 0.02; foam.renderOrder = 3;
  const bub = new BubblesFX(64, { y0: 0.12, y1: lv - 0.01, radius: rAt }, 0.95);
  const solids = new THREE.Group(); solids.position.y = 0.11;
  g.add(contactAO(0.62), liquid, men, foam, solids, bub.mesh, glass);
  g.userData = {
    H: h, lv, solids, bub,
    setTint(k) { liqMat.color.set(PAL.water).lerp(new THREE.Color(0xffb84d), k * 0.72); liqMat.opacity = 0.46 + k * 0.24; },
    setFoam(k) { foamMat.opacity = clamp(k) * 0.92; },
  };
  return g;
}

// ---------- BÀN ĐẢO CÓ CHẬU RỬA ÂM BÀN THẬT (có vòi chảy nước thật!) ----------
const CABINET_FRONT_TEX = canvasTex(512, 256, (c, w, h) => {
  c.fillStyle = '#eff2f6'; c.fillRect(0, 0, w, h);
  const cols = 3, pad = 6, dw = (w - pad * (cols + 1)) / cols;
  for (let i = 0; i < cols; i++) {
    const x = pad + i * (dw + pad);
    c.fillStyle = '#dce2ea'; c.fillRect(x, 8, dw, h - 16);
    c.strokeStyle = '#c5ced9'; c.lineWidth = 2; c.strokeRect(x, 8, dw, h - 16);
    c.fillStyle = '#8b95a3'; c.fillRect(i % 2 ? x + 16 : x + dw - 22, 34, 6, 48);
  }
});
const CABINET_BODY_MATS = [
  MAT.cabinet, MAT.cabinet, MAT.cabinet, MAT.cabinet,
  new THREE.MeshStandardMaterial({ map: CABINET_FRONT_TEX, roughness: 0.48 }),
  new THREE.MeshStandardMaterial({ map: CABINET_FRONT_TEX, roughness: 0.48 }),
];

function makeIslandPro({ w = 8.8, d = 4.6, sinkPos = [3.35, 1.38] } = {}) {
  const g = new THREE.Group(), TH = 0.32;
  let sinkObj = null;
  if (sinkPos) {
    const [sx, sz] = sinkPos, sw = 1.32, sd = 1.16;
    const xL = -w / 2, xR = w / 2, zB = -d / 2, zF = d / 2;
    const hx0 = sx - sw / 2, hx1 = sx + sw / 2, hz0 = sz - sd / 2, hz1 = sz + sd / 2;
    const slab = (x0, x1, z0, z1) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, TH, z1 - z0), MAT.benchTop);
      m.position.set((x0 + x1) / 2, -TH / 2, (z0 + z1) / 2); m.receiveShadow = true; m.castShadow = true; g.add(m);
    };
    slab(xL, hx0, zB, zF); slab(hx1, xR, zB, zF); slab(hx0, hx1, zB, hz0); slab(hx0, hx1, hz1, zF);

    const depth = 0.78, sinkG = put(new THREE.Group(), sx, 0, sz);
    const bowlBox = new THREE.Mesh(new THREE.BoxGeometry(sw, depth, sd), new THREE.MeshStandardMaterial({ color: 0x828c98, metalness: 0.85, roughness: 0.34, side: THREE.BackSide }));
    bowlBox.position.y = -depth / 2 + 0.005;
    const rimT = 0.075;
    [[sw + rimT * 2, rimT, 0, -sd / 2 - rimT / 2], [sw + rimT * 2, rimT, 0, sd / 2 + rimT / 2], [rimT, sd, -sw / 2 - rimT / 2, 0], [rimT, sd, sw / 2 + rimT / 2, 0]].forEach(([rw, rd, rx, rz]) => {
      const rM = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.032, rd), MAT.steel); rM.position.set(rx, 0.014, rz); rM.receiveShadow = true; sinkG.add(rM);
    });
    const drain = new THREE.Mesh(cyl(0.11, 0.11, 0.02, 20), MAT.darkMetal); drain.position.set(0, -depth + 0.02, 0);
    const zb = -sd / 2 - 0.14;
    const tapBase = new THREE.Mesh(cyl(0.09, 0.105, 0.08, 18), MAT.steel); tapBase.position.set(0, 0.04, zb);
    const curve = new THREE.CatmullRomCurve3([V3(0, 0.05, zb), V3(0, 1.48, zb), V3(0, 1.84, zb + 0.22), V3(0, 1.84, -0.05), V3(0, 1.62, 0.08)]);
    const tap = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.052, 12), MAT.steel); tap.castShadow = true;
    const lever = new THREE.Mesh(cyl(0.022, 0.026, 0.34, 10), MAT.steel); lever.rotation.z = Math.PI / 2; lever.position.set(0.20, 0.45, zb);
    const water = new THREE.Mesh(cyl(0.034, 0.024, 2.25, 10), liquidMat(0xdbf3ff, 0.72));
    water.position.set(0, 0.48, 0.08); water.visible = false; water.renderOrder = 4;
    const spray = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.22, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
    spray.rotation.x = -Math.PI / 2; spray.position.set(0, -depth + 0.04, 0.08); spray.visible = false;
    // Khối chạm vô hình lớn dễ bấm trúng vòi & chậu rửa
    const hitBox = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.9, 1.4), new THREE.MeshBasicMaterial({ visible: false }));
    hitBox.position.set(0, 0.9, 0);
    sinkG.add(bowlBox, drain, tapBase, tap, lever, water, spray, hitBox);
    sinkG.userData = {
      spout: V3(sx, 1.60, sz + 0.08),
      setFlow(on) { water.visible = spray.visible = !!on; lever.rotation.z = on ? Math.PI / 2 - 0.42 : Math.PI / 2; },
    };
    g.add(sinkG);
    sinkObj = sinkG;
  } else {
    const top = new THREE.Mesh(new THREE.BoxGeometry(w, TH, d), MAT.benchTop);
    top.position.y = -TH / 2; top.receiveShadow = true; top.castShadow = true; g.add(top);
  }
  const body = new THREE.Mesh(new THREE.BoxGeometry(w - 0.55, 7.6, d - 0.55), CABINET_BODY_MATS); body.position.y = -4.12; body.castShadow = true; body.receiveShadow = true;
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(w - 1.15, 1.05, d - 1.15), MAT.plinth); plinth.position.y = -8.47; plinth.receiveShadow = true;
  g.add(body, plinth);
  g.userData.sinkObj = sinkObj;
  return g;
}

const STOOL_SEAT_GEO = cyl(1.42, 1.35, 0.30, 28), STOOL_POST_GEO = cyl(0.13, 0.13, 5.5, 12);
const STOOL_RING_GEO = new THREE.TorusGeometry(1.02, 0.06, 8, 28), STOOL_FOOT_GEO = cyl(1.25, 1.5, 0.18, 28);
function makeStoolPro() {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(STOOL_SEAT_GEO, MAT.accent); seat.position.y = -3.15; seat.castShadow = true;
  const post = new THREE.Mesh(STOOL_POST_GEO, MAT.steel); post.position.y = -5.95;
  const ring = new THREE.Mesh(STOOL_RING_GEO, MAT.steel); ring.rotation.x = Math.PI / 2; ring.position.y = -6.7;
  const foot = new THREE.Mesh(STOOL_FOOT_GEO, MAT.darkMetal); foot.position.y = -8.9;
  g.add(seat, post, ring, foot); return g;
}

// ---------- PHÒNG LAB KIẾN TRÚC S2 ----------
function buildLabRoomPro() {
  const g = new THREE.Group();
  const FLOOR = -9, CEIL = 20, X0 = -28, X1 = 28, Z0 = -24, Z1 = 25;
  const RW = X1 - X0, RD = Z1 - Z0, RH = CEIL - FLOOR, cx = 0, cz = (Z0 + Z1) / 2, cy = (CEIL + FLOOR) / 2;

  const floorTex = canvasTex(256, 256, (c) => {
    c.fillStyle = '#cdd4dc'; c.fillRect(0, 0, 256, 256); c.strokeStyle = '#bec6d0'; c.lineWidth = 2; c.strokeRect(1, 1, 254, 254);
  });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(RW / 7, RD / 7);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.46, envMapIntensity: 0.7 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(cx, FLOOR, cz); floor.receiveShadow = true; g.add(floor);

  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), new THREE.MeshStandardMaterial({ color: 0xf4f7fa, roughness: 0.92 }));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(cx, CEIL, cz); g.add(ceil);

  const ledMat = new THREE.MeshBasicMaterial({ color: 0xfaffff });
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j += 2) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.4), ledMat); p.rotation.x = Math.PI / 2; p.position.set(i * 15, CEIL - 0.08, cz + j * 9.5); g.add(p);
  }

  const wallMat = new THREE.MeshStandardMaterial({ color: PAL.wall, roughness: 0.88 });
  const addWall = (w, x, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, RH), wallMat); m.position.set(x, cy, z); m.rotation.y = ry; m.receiveShadow = true; g.add(m); };
  addWall(RW, cx, Z0, 0); addWall(RW, cx, Z1, Math.PI); addWall(RD, X0, cz, Math.PI / 2); addWall(RD, X1, cz, -Math.PI / 2);

  // Hệ cửa sổ nắng trái
  const winTex = canvasTex(1024, 512, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#eef7ff'); gr.addColorStop(0.52, '#e1eef5'); gr.addColorStop(0.68, '#b9d4b2'); gr.addColorStop(1, '#98bc94');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 42; i++) {
      c.fillStyle = `rgba(${118 + (i * 31) % 45},${162 + (i * 47) % 40},${108 + (i * 23) % 35},0.34)`;
      c.beginPath(); c.arc((i * 97) % w, h * 0.6 + ((i * 59) % (h * 0.38)), 34 + (i * 19) % 44, 0, 6.283); c.fill();
    }
    c.fillStyle = '#333b46'; c.fillRect(0, 0, w, 16); c.fillRect(0, h - 16, w, 16);
    for (let i = 0; i <= 6; i++) c.fillRect(Math.round((i / 6) * (w - 14)), 0, i % 2 === 0 ? 18 : 9, h);
  });
  const winPane = new THREE.Mesh(new THREE.PlaneGeometry(38, 13.4), new THREE.MeshBasicMaterial({ map: winTex }));
  winPane.rotation.y = Math.PI / 2; winPane.position.set(X0 + 0.12, 8.6, cz - 1); g.add(winPane);
  g.add(put(new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.2, 38.6), MAT.cabinet), X0 + 0.35, 1.8, cz - 1));

  // Tường sau: tủ thấp + tủ hút khí độc + kệ kính instanced
  g.add(
    put(new THREE.Mesh(new THREE.BoxGeometry(RW - 4, 8.7, 4.6), CABINET_BODY_MATS), cx, FLOOR + 4.35, Z0 + 2.3),
    put(new THREE.Mesh(new THREE.BoxGeometry(RW - 4, 0.3, 4.9), MAT.darkMetal), cx, -0.15, Z0 + 2.45),
  );
  const hood = put(new THREE.Group(), 0, 0, Z0 + 2.9);
  hood.add(
    put(new THREE.Mesh(new THREE.BoxGeometry(11.6, 20, 5.6), MAT.cabinet), 0, 10, 0),
    put(new THREE.Mesh(new THREE.BoxGeometry(10.2, 8.6, 0.25), new THREE.MeshStandardMaterial({ color: 0xcbd4df, roughness: 0.72 })), 0, 5.4, 2.6),
    put(new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.35, 5.2), MAT.darkMetal), 0, 0.2, 0.2),
    put(new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.24, 0.24), MAT.steel), 0, 4.1, 2.85),
    put(new THREE.Mesh(new THREE.PlaneGeometry(10.2, 5.2), MAT.glassThick), 0, 6.7, 2.82),
  );
  g.add(hood);

  const botGeo = cyl(0.45, 0.45, 1.75, 14), capGeo = cyl(0.24, 0.24, 0.28, 12);
  const bgClearMat = new THREE.MeshPhysicalMaterial({ color: 0xe6f4f7, transparent: true, opacity: 0.34, roughness: 0.04, clearcoat: 1, envMapIntensity: 1.8 });
  const bgAmberMat = new THREE.MeshPhysicalMaterial({ color: 0x8a4714, roughness: 0.12, clearcoat: 0.9, envMapIntensity: 1.5 });
  const clearInst = new THREE.InstancedMesh(botGeo, bgClearMat, 12);
  const amberInst = new THREE.InstancedMesh(botGeo, bgAmberMat, 12);
  const capBlueInst = new THREE.InstancedMesh(capGeo, MAT.accent, 12);
  const capBlkInst = new THREE.InstancedMesh(capGeo, MAT.darkPlastic, 12);
  const dObj = new THREE.Object3D(); let ci = 0, ai = 0;
  [-16, 16].forEach((sx) => {
    g.add(
      put(new THREE.Mesh(new THREE.BoxGeometry(0.14, 9.5, 0.14), MAT.steel), sx - 6.8, 7.5, Z0 + 0.25),
      put(new THREE.Mesh(new THREE.BoxGeometry(0.14, 9.5, 0.14), MAT.steel), sx + 6.8, 7.5, Z0 + 0.25),
      put(new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.12, 2.0), MAT.glassThick), sx, 5.2, Z0 + 1.15),
      put(new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.12, 2.0), MAT.glassThick), sx, 9.4, Z0 + 1.15),
    );
    [5.2, 9.4].forEach((sy, row) => {
      for (let i = 0; i < 6; i++) {
        const bx = sx - 5.2 + i * 2.05;
        dObj.position.set(bx, sy + 0.94, Z0 + 1.15); dObj.updateMatrix();
        if (row === 0) { amberInst.setMatrixAt(ai, dObj.matrix); dObj.position.y = sy + 1.95; dObj.updateMatrix(); capBlkInst.setMatrixAt(ai++, dObj.matrix); }
        else { clearInst.setMatrixAt(ci, dObj.matrix); dObj.position.y = sy + 1.95; dObj.updateMatrix(); capBlueInst.setMatrixAt(ci++, dObj.matrix); }
      }
    });
  });
  g.add(clearInst, amberInst, capBlueInst, capBlkInst);
  g.add(put(new THREE.Mesh(new THREE.BoxGeometry(3.8, 22, 32), CABINET_BODY_MATS), X1 - 1.9, FLOOR + 11, cz));
  return g;
}

// ---------- CHOREOGRAPHY SEQUENCER ----------
function makeSeq() {
  let q = null;
  const api = {
    play(steps, onDone) { q = { steps, i: 0, t: 0, onDone }; if (steps[0] && steps[0].start) steps[0].start(); },
    tick(dt) {
      while (q) {
        const st = q.steps[q.i]; q.t += dt;
        const k = Math.min(1, q.t / Math.max(0.001, st.dur));
        if (st.fn) st.fn((st.ease || easeIO)(k));
        if (k < 1) break;
        dt = q.t - st.dur; q.i++; q.t = 0;
        if (q.i >= q.steps.length) { const d = q.onDone; q = null; if (d) d(); break; }
        if (q.steps[q.i].start) q.steps[q.i].start();
      }
    },
    flush() { let n = 0; while (q && n++ < 60) api.tick(1e3); },
    busy: () => !!q,
  };
  return api;
}

// ---------- ENGINE PHÒNG LAB TƯƠNG TÁC ĐẦY ĐỦ 4 BÀN + VÒNG KÍNH + ĐỜI SỐNG 3D ----------
export function createProLabEngine(host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.06;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdde4ed);
  scene.fog = new THREE.FogExp2(0xdde4ed, 0.0105);
  scene.environment = buildLabEnvMap(renderer);

  // Ánh sáng 3 điểm + Spotlight hội tụ nhẹ theo bàn đang focus!
  const hemi = new THREE.HemisphereLight(0xf1f7ff, 0x454f5e, 0.72); scene.add(hemi);
  const keyLight = new THREE.DirectionalLight(0xfff7eb, 2.25);
  keyLight.castShadow = true; keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.bias = -0.00035; keyLight.shadow.normalBias = 0.025; keyLight.shadow.radius = 3.2;
  scene.add(keyLight, keyLight.target);

  const rimLight = new THREE.DirectionalLight(0xcbe2ff, 0.95); rimLight.position.set(14, 12, -12); scene.add(rimLight);
  const fillLight = new THREE.DirectionalLight(0xeef4ff, 0.42); fillLight.position.set(4, 5, 16); scene.add(fillLight);

  // Spotlight hội tụ mềm chiếu xuống đúng bàn đang đứng (tạo cảm giác sân khấu sang trọng khi focus)
  const focusSpot = new THREE.SpotLight(0xfffcf5, 0, 26, Math.PI / 4.2, 0.65, 1.1);
  focusSpot.position.set(0, 12, 0);
  scene.add(focusSpot, focusSpot.target);

  scene.add(buildLabRoomPro());

  const Z_BACK = -4.6, Z_FRONT = 4.6, X_OFF = 5.9;
  const benches = {}, pickables = [], updaters = [], cb = {};
  let activeId = null, namesOn = true, handsOn = true, handsMsg = '';
  let hoveredPick = null, uiHoverIds = new Set();

  const say = (t) => { if (cb.say) cb.say(t); };
  const emit = (B) => { syncBeacons(B); if (B.show) B.show(B); if (cb.change) cb.change(B.id); };

  // Helper đăng ký vật chạm được + hiệu ứng nhấc nhẹ khi hover
  const hoverables = new Map(); // pickId -> { obj, baseY, lift }
  function regPick(obj, pickId, canLift = true) {
    obj.userData.pickId = pickId;
    pickables.push(obj);
    if (canLift) hoverables.set(pickId, { obj, baseY: obj.position.y, lift: 0 });
  }

  // Hệ thống thẻ nhãn 3D nổi
  const tagLayer = document.createElement('div'); tagLayer.className = 'p2-tags'; host.appendChild(tagLayer);
  const tags = new Map();
  function addTag(id, text, anchor, { color = '#2563eb', onClick, isBench = false } = {}) {
    const el = document.createElement('button');
    el.type = 'button'; el.className = 'p2-tag' + (isBench ? ' is-bench' : '');
    el.innerHTML = `<i style="background:${color}"></i><span></span><em></em>`;
    el.querySelector('span').textContent = text;
    if (onClick) el.addEventListener('click', (e) => { e.stopPropagation(); onClick(id); });
    tagLayer.appendChild(el);
    tags.set(id, { el, anchor, visible: false, isBench });
    return el;
  }
  function setTag(id, { text, visible } = {}) {
    const t = tags.get(id); if (!t) return;
    if (text !== undefined) t.el.querySelector('span').textContent = text;
    if (visible !== undefined) t.visible = visible;
  }

  // Hover tooltip nhỏ bám theo vật 3D đang rê chuột
  const tipEl = document.createElement('div'); tipEl.className = 'p2-tip'; tipEl.hidden = true; host.appendChild(tipEl);

  // ---------- XÂY DỰNG TỪNG BÀN VỚI ĐỘNG TÁC CHOREOGRAPHY THẬT ----------
  const R0 = rateAt3(run3('vun', REF3.mass, REF3.vAcid), 1);
  const FULL = 100;
  const gasTag = (v) => (v >= FULL ? 'khí 100 mL (ĐẦY)' : `khí ${fmt(v, 1)} mL`);
  const fillOf = (mL) => 0.36 + 0.64 * clamp((mL - 5) / 45);
  const gasO2 = (cat, v, t) => vO2Max(v) * (1 - Math.exp(-kCat({ cat }) * t));
  const timeTo = (run, v) => {
    const p = run.points;
    for (let i = 1; i < p.length; i++) if (p[i][1] >= v) return p[i - 1][0] + ((v - p[i - 1][1]) / Math.max(p[i][1] - p[i - 1][1], 1e-12)) * (p[i][0] - p[i - 1][0]);
    return null;
  };
  const fmtT = (t) => (t >= 3600 ? `${fmt(t / 3600, 1)} giờ` : `${fmt(t, 1)} s`);
  const g2 = (m) => fmt(m, 2) + ' g';

  // Động tác chung: mở nắp lọ bay sang bên + dòng rót parabol + gợn sóng + đậy nắp lại!
  function buildPourSeq(B, bi, targets, [f0, f1], { drain = false, thin = false } = {}) {
    const bo = bi.obj, U = bo.userData, REST = bi.home.clone(), seq = [];
    const cap = U.cap, capAside = V3(U.r ? U.r + 0.34 : 0.55, 0.11, 0.16);
    const ML = (U.top || 1.25) - 0.04;
    let prev = REST.clone();

    // 1. Mở nắp lọ (nếu có nắp): xoay ren 360° rồi bay sang đặt gọn cạnh lọ
    if (cap) {
      const capStart = V3(0, U.capHomeY, 0);
      const capLift = V3(0, U.capHomeY + 0.34, 0);
      seq.push({
        dur: 0.32, ease: easeOut,
        start() { sfx.clink(); },
        fn: (k) => { cap.rotation.y = k * Math.PI * 2; cap.position.lerpVectors(capStart, capLift, k); },
      });
      seq.push({
        dur: 0.25, ease: easeIO,
        start() {
          // Chuyển nắp sang B.g để ở yên trên bàn trong lúc thân lọ nhấc đi rót!
          const wPos = cap.position.clone().add(bo.position);
          B.g.add(cap); cap.position.copy(wPos);
          B._capTarget = REST.clone().add(capAside);
          B._capLiftWorld = wPos.clone();
        },
        fn: (k) => {
          cap.position.lerpVectors(B._capLiftWorld, B._capTarget, k);
          cap.position.y += Math.sin(Math.PI * k) * 0.25;
        },
      });
    }

    // 2. Nhấc lọ/ống đong tới từng đích và rót dòng parabol
    targets.forEach((v, idx) => {
      const m = v.mouthWorld(), from = prev.clone();
      const side = m.x <= B.cx ? -1 : 1;
      const tilt = 1.68 * side;
      const POUR = V3(m.x + 0.18 * side, m.y + 0.32, m.z);
      const HOVER = V3(POUR.x + ML * Math.sin(tilt), POUR.y - ML * Math.cos(tilt), m.z);
      let v0 = 0, share = 0;

      seq.push({
        dur: 0.44, ease: easeIO,
        start() { if (U.shadow) U.shadow.visible = false; },
        fn: (k) => { bo.position.lerpVectors(from, HOVER, k); bo.position.y += Math.sin(Math.PI * k) * 0.36; },
      });
      seq.push({ dur: 0.30, ease: easeIO, fn: (k) => { bo.rotation.z = tilt * k; } });
      seq.push({
        dur: thin ? 0.55 : 0.85, ease: lin,
        start() {
          sfx.pour(thin ? 0.5 : 0.8);
          if (drain) { v0 = U.mL; share = v0 / (targets.length - idx); }
          B.ripple.trigger(V3(m.x, v.surfaceY() + 0.01, m.z), v.RN ? v.RN * 1.1 : 0.2);
        },
        fn: (k) => {
          if (!thin) v.setFill(f0 + (f1 - f0) * k);
          if (drain) U.setVolume(v0 - share * k);
          const sy = v.surfaceY();
          B.pourArc.set(POUR, V3(m.x, sy, m.z), thin ? 0.012 : 0.024);
          if (k > 0.45 && k < 0.52) B.ripple.trigger(V3(m.x, sy + 0.01, m.z), 0.24);
        },
      });
      seq.push({ dur: 0.26, ease: easeOut, start() { B.pourArc.hide(); }, fn: (k) => { bo.rotation.z = tilt * (1 - k); } });
      prev = HOVER;
    });

    // 3. Trả lọ về chỗ cũ + vặn nắp lại
    seq.push({
      dur: 0.44, ease: easeIO,
      fn: (k) => { bo.position.lerpVectors(prev, REST, k); bo.position.y += Math.sin(Math.PI * k) * 0.32; },
    });
    if (cap) {
      seq.push({
        dur: 0.34, ease: easeIO,
        start() { if (U.shadow) U.shadow.visible = true; },
        fn: (k) => {
          const topW = REST.clone().add(V3(0, U.capHomeY + 0.32, 0));
          cap.position.lerpVectors(B._capTarget, topW, k);
          cap.position.y += Math.sin(Math.PI * k) * 0.2;
        },
      });
      seq.push({
        dur: 0.24, ease: easeOut,
        start() { bo.add(cap); cap.position.set(0, U.capHomeY + 0.32, 0); sfx.clink(); },
        fn: (k) => { cap.position.y = lerp(U.capHomeY + 0.32, U.capHomeY, k); cap.rotation.y = (1 - k) * Math.PI * 2; },
      });
    } else {
      seq.push({ dur: 0.02, fn: () => { if (U.shadow) U.shadow.visible = true; } });
    }
    return seq;
  }

  // Viền phát sáng quanh mặt bàn khi rê chuột ở chế độ Toàn cảnh (Bước 1)
  function makeBenchOutline(w, d, color) {
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    const t = 0.085, y = 0.018;
    const add = (rw, rd, x, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(rw, rd), mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.renderOrder = 3; g.add(m); };
    add(w + t * 2, t, 0, -d / 2 - t / 2); add(w + t * 2, t, 0, d / 2 + t / 2);
    add(t, d, -w / 2 - t / 2, 0); add(t, d, w / 2 + t / 2, 0);
    let goal = 0, cur = 0, pulseT = 0;
    g.userData = {
      setOn(on) { goal = on ? 1 : 0; },
      update(dt) {
        pulseT += dt;
        cur += (goal - cur) * Math.min(1, dt * 11);
        g.visible = cur > 0.01;
        if (g.visible) mat.opacity = cur * (0.76 + 0.2 * Math.sin(pulseT * 5));
      },
    };
    g.visible = false;
    return g;
  }

  // Tạo khung cơ bản cho một bàn
  function makeBenchShell(id, name, color, at, cam, extra = {}) {
    const root = put(new THREE.Group(), at[0], 0, at[1]); scene.add(root);
    const island = makeIslandPro({ w: 8.8, d: 4.6, sinkPos: extra.noSink ? null : [3.35, 1.38] });
    root.add(island);
    const outline = makeBenchOutline(8.8, 4.6, color); root.add(outline);
    updaters.push((dt) => outline.userData.update(dt));
    if (!extra.noStools) root.add(put(makeStoolPro(), -1.8, 0, 3.15), put(makeStoolPro(), 1.6, 0, 3.15));
    regPick(island, id, false);

    const g = new THREE.Group(); root.add(g);
    const pourArc = makePourArc(); g.add(pourArc.mesh);
    const ripple = makeRippleFX(); g.add(ripple.g);
    updaters.push((dt) => ripple.update(dt));

    const B = {
      id, name, color, at, root, g, island, outline, pourArc, ripple,
      cam, camSolo: extra.camSolo || cam, camTop: extra.camTop || null,
      eq: extra.eq || '', cond: extra.cond || '', text: extra.text || '', note: extra.note || '',
      cols: extra.cols || [],
      items: {}, vessels: {}, rings: {}, tags: [], st: {}, level: { ...(extra.ref || {}) }, ref: { ...(extra.ref || {}) },
      want: {}, off: new Set(), steps: [], run: null, seq: makeSeq(), solo: null, loaded: false, rinsing: false, cx: 0,
      sinkObj: island.userData.sinkObj,
      addItem(itemId, obj, pos, { r = 0, tag = null, tagAt = null, of = null, vessel = false, say: hint = '', lift = true } = {}) {
        obj.position.set(pos[0], pos[1], pos[2]); g.add(obj);
        const it = { id: itemId, obj, home: obj.position.clone(), of, say: hint, touch: r > 0 };
        B.items[itemId] = it;
        if (vessel) B.vessels[itemId] = obj.userData;
        if (r > 0) {
          regPick(obj, `${id}/${itemId}`, lift);
          const ring = put(makeBeaconRing(color, r), pos[0], 0.014, pos[2]);
          g.add(ring); B.rings[itemId] = ring;
          updaters.push((dt) => ring.userData.update(dt));
        }
        if (tag) {
          const offV = tagAt ? V3(...tagAt) : V3(0, (obj.userData.top || obj.userData.H || 1.1) + 0.14, 0);
          const tmpW = V3(), tid = `${id}/${itemId}`;
          addTag(tid, tag, () => obj.getWorldPosition(tmpW).add(offV), { color, onClick: r > 0 ? () => hand(B, itemId) : undefined });
          B.tags.push([tid, itemId]);
        }
        return it;
      },
      tag(itemId, text) { setTag(`${id}/${itemId}`, { text }); },
    };

    if (B.sinkObj) {
      regPick(B.sinkObj, `${id}/sink`, false);
      const sRing = put(makeBeaconRing(color, 0.92), 3.35, 0.014, 1.38); g.add(sRing); B.rings.sink = sRing;
      updaters.push((dt) => sRing.userData.update(dt));
      const tmpW = V3();
      addTag(`${id}/sink`, 'Vòi nước · rửa dụng cụ', () => B.sinkObj.getWorldPosition(tmpW).add(V3(0, 1.92, 0)), { color, onClick: () => rinse(B) });
      B.tags.push([`${id}/sink`, 'sink']);
      B.items.sink = { id: 'sink', obj: B.sinkObj, home: B.sinkObj.position.clone(), touch: true };
    }

    addTag(id, name, V3(at[0], extra.tagY || 3.15, at[1]), { color, isBench: true, onClick: () => cb.pick && cb.pick(id) });
    benches[id] = B;
    return B;
  }

  // ---------- BÀN 1 · NỒNG ĐỘ ----------
  {
    const bx = -X_OFF, bz = Z_BACK;
    const B = makeBenchShell('conc', 'Bàn 1 · Nồng độ', '#0891b2', [bx, bz],
      { target: [bx + 0.05, 0.8, bz + 0.1], w: 8.6, h: 3.1, el: 26, az: -4, fov: 31, shadowR: 5.6 },
      {
        camTop: { target: [bx, 0.35, bz + 0.15], w: 3.8, h: 2.3, el: 68, az: 0, fov: 32, shadowR: 4.5 },
        ref: { conc: REF.conc, temp: REF.temp },
        eq: 'Na₂S₂O₃ + H₂SO₄ → Na₂SO₄ + S↓ + SO₂↑ + H₂O',
        cond: (b) => (b.level.temp !== REF.temp ? '⚠ ĐANG KHÁC HAI THỨ: nồng độ Na₂S₂O₃ và nhiệt độ!' : 'cùng lượng acid · cùng 25 °C · chỉ khác nồng độ Na₂S₂O₃'),
        text: 'Hai bình đặt trên giấy có chữ X. Rót sodium thiosulfate rồi rót sulfuric acid: dung dịch đục dần tới lúc che mờ chữ X.',
        note: 'Khí SO₂ độc: ngoài thật phải làm ở nơi thoáng.',
        cols: ['Bình thí nghiệm', 'Mất chữ X sau', 'Đối chứng', 'Nhanh gấp'],
      });
    B.addItem('pRef', makeXPaperPro(1.18), [-0.68, 0, 0.15]);
    B.addItem('pExp', makeXPaperPro(1.18), [0.68, 0, 0.15]);
    B.addItem('ref', makeFlaskPro(), [-0.68, 0.012, 0.15], { r: 0.56, tag: 'Đối chứng · bình rỗng', vessel: true });
    B.addItem('exp', makeFlaskPro(), [0.68, 0.012, 0.15], { r: 0.56, tag: 'Thí nghiệm · bình rỗng', vessel: true });
    CONC.forEach((c, n) => B.addItem('b' + n, makeBottlePro({ title: 'Na₂S₂O₃', sub: fmt(c, 2) + ' M', name: 'Sodium thiosulfate' }), [-3.45 + n * 0.9, 0, -0.9], { r: 0.46, tag: `Na₂S₂O₃ ${fmt(c, 2)} M` + (n ? '' : ' (đối chứng)') }));
    B.addItem('acid', makeBottlePro({ title: 'H₂SO₄', sub: '0,5 M', name: 'Sulfuric acid' }), [1.85, 0, -0.9], { r: 0.46, tag: 'H₂SO₄ 0,5 M' });
    const tm = makeTimerPro(); tm.rotation.y = 0.25; B.addItem('timer', tm, [-2.1, 0, 1.2], { r: 0.46, tag: 'Đồng hồ', say: 'Đồng hồ tự chạy khi rót xong H₂SO₄.', lift: false });
    updaters.push((dt) => tm.userData.update(dt));
    B.addItem('plate', makeHotplatePro(), [3.15, 0, -1.0], { r: 0.85, tag: 'Bếp điện', lift: false });
    B.off.add('temp');

    B.steps = [
      { id: 'ref', label: 'Rót Na₂S₂O₃ 0,05 M vào bình đối chứng', item: 'b0', run: () => buildPourSeq(B, B.items.b0, [B.vessels.ref], [0, 0.68]) },
      {
        id: 'conc', label: 'Chọn lọ đặc hơn, rót vào bình thí nghiệm', var: 'conc',
        options: CONC.slice(1).map((c, n) => ({ v: c, item: 'b' + (n + 1), label: fmt(c, 2) + ' M' })),
        run: (o) => buildPourSeq(B, B.items[o.item], [B.vessels.exp], [0, 0.68]),
      },
      {
        id: 'temp', label: 'Làm ấm bình thí nghiệm trên bếp điện', var: 'temp', optional: true, repeat: true, needs: ['conc'],
        offSay: 'Bếp điện chỉ mở ở bước Thao tác sai và Sát hạch. Ở bước này mỗi lần chỉ đổi một thứ: nồng độ.',
        options: [35, 45, 55, 65].map((t) => ({ v: t, label: t + ' °C' })),
        item: 'plate',
        run: (o) => {
          const f = B.items.exp.obj, pl = B.items.plate.obj, PU = pl.userData;
          const home = B.items.exp.home.clone(), on = pl.position.clone().add(V3(0, PU.topY, PU.plateZ));
          return [
            { dur: 0.55, start() { sfx.clink(); }, fn: (k) => { f.position.lerpVectors(home, on, k); f.position.y += Math.sin(Math.PI * k) * 0.55; } },
            { dur: 0.9, ease: lin, start() { PU.setTemp(o.v); sfx.flame(); }, fn: (k) => { f.userData.steam.update(0.016, k * 0.9); } },
            { dur: 0.55, start() { PU.setTemp(25); }, fn: (k) => { f.position.lerpVectors(on, home, k); f.position.y += Math.sin(Math.PI * k) * 0.55; } },
          ];
        },
      },
      {
        id: 'go', role: 'start', label: 'Rót H₂SO₄ vào cả hai bình (đồng hồ chạy)', item: 'acid',
        run: () => [...buildPourSeq(B, B.items.acid, [B.vessels.ref, B.vessels.exp], [0.68, 1.0]), { dur: 0.1, start() { tm.userData.pressStart(); } }],
      },
    ];
    B.reset = () => {
      B.st = {}; B.level = { ...B.ref }; B.run = null; B.rinsing = false; B.pourArc.hide();
      ['ref', 'exp'].forEach((k) => { B.items[k].obj.position.copy(B.items[k].home); B.items[k].obj.rotation.z = 0; B.vessels[k].clear(); B.vessels[k].setFill(0); });
      ['b0', 'b1', 'b2', 'acid'].forEach((k) => {
        const it = B.items[k], U = it.obj.userData; it.obj.position.copy(it.home); it.obj.rotation.z = 0;
        it.obj.add(U.cap); U.cap.position.set(0, U.capHomeY, 0); U.cap.rotation.y = 0; if (U.shadow) U.shadow.visible = true;
      });
      tm.userData.setTime(0); B.items.plate.obj.userData.setTemp(25); B.sinkObj.userData.setFlow(false);
    };
    B.times = () => [tConc(B.level), tConc(REF)];
    B.show = () => {
      const [te, tr] = B.times(), t = B.run ? B.run.t : -1;
      const hot = B.level.temp !== REF.temp ? ` · ${B.level.temp} °C` : '';
      B.tag('ref', t >= tr ? `Đối chứng · mất chữ X sau ${fmtT(tr)}` : B.st.ref ? 'Đối chứng · 0,05 M · 25 °C' : 'Đối chứng · bình rỗng');
      B.tag('exp', t >= te ? `Thí nghiệm · mất chữ X sau ${fmtT(te)}` : B.st.conc ? `Thí nghiệm · ${fmt(B.level.conc, 2)} M${hot || ' · 25 °C'}` : 'Thí nghiệm · bình rỗng');
    };
    B.frame = (t, dt) => {
      const [te, tr] = B.times();
      [[B.vessels.ref, tr], [B.vessels.exp, te]].forEach(([v, tx]) => {
        const p = clamp(t / tx);
        v.setTint(0xe3cf6c, easeIO(p), { opacity: 0.99, rough: 0.78 });
        v.steam.update(dt, p > 0.15 && p < 0.95 ? 0.3 : 0);
      });
      tm.userData.setTime(Math.min(t, Math.max(te, tr))); B.show();
      return t >= Math.max(te, tr) * 1.02;
    };
    B.speed = () => 14;
    B.makeRow = () => {
      const [te, tr] = B.times();
      return { key: `${B.level.conc}|${B.level.temp}`, level: { ...B.level }, te, tr, cond: fmt(B.level.conc, 2) + ' M' + (B.level.temp !== REF.temp ? ` · ${B.level.temp} °C` : ''), exp: fmtT(te), ref: fmtT(tr), ratio: fmt(tr / te, 1) + ' lần' };
    };
    B.read = () => {
      const [te, tr] = B.times(), t = B.run ? Math.min(B.run.t, Math.max(te, tr)) : 0, go = !!B.run;
      return { label: 'Đồng hồ · giây từ lúc rót H₂SO₄', big: fmt(t, 1), unit: 's', cells: [['Thí nghiệm', go && t >= te ? fmtT(te) : 'chưa mất X'], ['Đối chứng', go && t >= tr ? fmtT(tr) : 'chưa mất X'], ['Nhanh gấp', go && B.run.done ? fmt(tr / te, 1) + ' lần' : '–']] };
    };
    B.reset();
  }

  // ---------- BÀN 2 · NHIỆT ĐỘ ----------
  {
    const bx = X_OFF, bz = Z_BACK;
    const B = makeBenchShell('temp', 'Bàn 2 · Nhiệt độ', '#ea580c', [bx, bz],
      { target: [bx + 0.05, 1.45, bz + 0.1], w: 8.2, h: 3.9, el: 15, az: 5, fov: 35, shadowR: 5.6 },
      {
        ref: { temp: REF.temp }, tagY: 3.5,
        eq: 'Mg + 2H₂O → Mg(OH)₂ + H₂↑',
        cond: 'cùng lượng Mg và nước · chỉ khác nhiệt độ',
        text: 'Hai ống nghiệm đựng nước: ống đối chứng trên giá gỗ, ống thí nghiệm kẹp trên đèn cồn. Nhỏ phenolphthalein, đun nóng, thả magnesium: nước hoá hồng khi có Mg(OH)₂.',
        cols: ['Ống thí nghiệm', 'Hoá hồng sau', 'Đối chứng', 'Nhanh gấp'],
      });
    B.addItem('rack', makeWoodRackPro(), [-1.35, 0, -0.05]);
    const tRef = makeTestTubePro(); B.addItem('ref', tRef, [-1.35, 0.08, -0.05], { tag: 'Đối chứng · 25 °C', tagAt: [0, 1.98, 0], vessel: true });
    const thRef = makeThermometerPro(1.82); put(thRef, 0.02, 0.08, 0); tRef.add(thRef);

    const clampG = new THREE.Group();
    const cb0 = new THREE.Mesh(SYR_BASE_GEO, MAT.darkMetal); cb0.position.set(0.2, 0, -1.08); cb0.castShadow = true;
    const cp = new THREE.Mesh(cyl(0.042, 0.042, 3.25, 14), MAT.steel); cp.position.set(0.2, 1.62, -1.15); cp.castShadow = true;
    const cbo = new THREE.Mesh(BOSS_GEO, MAT.darkMetal); cbo.position.set(0.2, 2.55, -1.15);
    const carm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 1.25), MAT.wood); carm.position.set(0, 2.66, -0.55); carm.castShadow = true;
    const cring = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.024, 8, 24), MAT.darkMetal); cring.rotation.x = Math.PI / 2; cring.position.set(0, 2.66, 0);
    clampG.add(cb0, cp, cbo, carm, cring);
    B.addItem('clamp', clampG, [0.75, 0, 0.2]);

    const tExp = makeTestTubePro(); B.addItem('exp', tExp, [0.75, 1.52, 0.2], { tag: 'Thí nghiệm · 25 °C', tagAt: [0, 1.95, 0], vessel: true });
    const thExp = makeThermometerPro(1.82); put(thExp, 0.02, 0.08, 0); tExp.add(thExp);
    const lamp = makeAlcoholLampPro(); B.addItem('lamp', lamp, [0.75, 0, 0.2], { r: 0.48, tag: 'Đèn cồn', lift: false });
    updaters.push(() => lamp.userData.flicker(performance.now() * 0.001));
    const pp = makeDropperBottlePro(); B.addItem('pp', pp, [-2.95, 0, 0.9], { r: 0.4, tag: 'Phenolphthalein' });
    const mg = makeWatchGlassPro({ mg: true }); B.addItem('mg', mg, [-0.35, 0, 1.3], { r: 0.5, tag: 'Dây Mg (2 đoạn bằng nhau)' });
    const tm = makeTimerPro(); tm.rotation.y = -0.22; B.addItem('timer', tm, [2.15, 0, 1.0], { r: 0.46, tag: 'Đồng hồ', say: 'Đồng hồ tự chạy khi thả dây Mg.', lift: false });
    updaters.push((dt) => tm.userData.update(dt));

    B.steps = [
      {
        id: 'pp', label: 'Nhỏ phenolphthalein vào hai ống nước', item: 'pp',
        run: () => {
          // Nhấc ống nhỏ giọt rời khỏi lọ, bay tới từng ống nghiệm, nhỏ 3 giọt chất lỏng rõ nét!
          const pip = pp.userData.pipette, restL = V3(0, pp.userData.pipHomeY, 0);
          const dropMesh = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), liquidMat(0xfde6f0, 0.9));
          dropMesh.visible = false; B.g.add(dropMesh);
          const p0 = pp.position.clone().add(restL), m1 = tRef.userData.mouthWorld().add(V3(0, 0.42, 0)), m2 = tExp.userData.mouthWorld().add(V3(0, 0.42, 0));
          return [
            { dur: 0.25, start() { B.g.add(pip); pip.position.copy(p0); sfx.clink(); }, fn: (k) => { pip.position.y = p0.y + 0.5 * k; } },
            { dur: 0.42, fn: (k) => { pip.position.lerpVectors(p0.clone().add(V3(0, 0.5, 0)), m1, k); pip.position.y += Math.sin(Math.PI * k) * 0.35; } },
            {
              dur: 0.45, ease: lin, start() { dropMesh.visible = true; sfx.click(1250); },
              fn: (k) => {
                const sub = (k * 2) % 1;
                dropMesh.position.set(m1.x, lerp(m1.y - 0.36, tRef.userData.surfaceY(), sub * sub), m1.z);
                if (sub > 0.9) B.ripple.trigger(V3(m1.x, tRef.userData.surfaceY() + 0.01, m1.z), 0.08);
              },
            },
            { dur: 0.45, start() { dropMesh.visible = false; }, fn: (k) => { pip.position.lerpVectors(m1, m2, k); pip.position.y += Math.sin(Math.PI * k) * 0.35; } },
            {
              dur: 0.45, ease: lin, start() { dropMesh.visible = true; sfx.click(1250); },
              fn: (k) => {
                const sub = (k * 2) % 1;
                dropMesh.position.set(m2.x, lerp(m2.y - 0.36, tExp.userData.surfaceY(), sub * sub), m2.z);
                if (sub > 0.9) B.ripple.trigger(V3(m2.x, tExp.userData.surfaceY() + 0.01, m2.z), 0.08);
              },
            },
            { dur: 0.45, start() { B.g.remove(dropMesh); }, fn: (k) => { pip.position.lerpVectors(m2, p0.clone().add(V3(0, 0.5, 0)), k); } },
            { dur: 0.22, fn: (k) => { pip.position.y = lerp(p0.y + 0.5, p0.y, k); } },
            { dur: 0.02, fn: () => { pp.add(pip); pip.position.copy(restL); sfx.clink(); } },
          ];
        },
      },
      {
        id: 'temp', label: 'Đun ống thí nghiệm bằng đèn cồn tới', var: 'temp', repeat: true, item: 'lamp',
        options: [35, 45, 55, 65].map((t) => ({ v: t, label: t + ' °C' })),
        run: (o) => {
          const LU = lamp.userData, from = B.st.temp ? B.level.temp : 25, to = o.v;
          const seq = [];
          if (!LU.lit) {
            // Nhấc nắp chụp thuỷ tinh đặt sang cạnh đèn → bùng lửa thật!
            seq.push({
              dur: 0.42, start() { sfx.clink(); },
              fn: (k) => { LU.cap.position.lerpVectors(LU.capHome, LU.capAside, k); LU.cap.position.y += Math.sin(Math.PI * k) * 0.45; },
            });
            seq.push({ dur: 0.15, start() { LU.setLit(true); sfx.flame(); } });
          }
          seq.push({
            dur: 0.85, ease: lin,
            fn: (k) => {
              const tv = from + (to - from) * k;
              thExp.userData.setTemp(tv);
              B.tag('exp', `Thí nghiệm · ${Math.round(tv)} °C`);
              tExp.userData.steam.update(0.016, tv >= 45 ? (tv - 40) / 30 : 0);
            },
          });
          return seq;
        },
      },
      {
        id: 'go', role: 'start', label: 'Thả dây Mg vào cả hai ống (đồng hồ chạy)', item: 'mg',
        run: () => {
          const fl = [tRef, tExp].map((tu) => {
            const m = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.014, 0.042), MAT.magnesium);
            m.rotation.z = 1.2; m.visible = false; B.g.add(m);
            const mouth = tu.userData.mouthWorld();
            return { m, tu, a: mg.position.clone().add(V3(0, 0.08, 0)), mid: mouth.clone().add(V3(0, 0.25, 0)), bot: V3(mouth.x, tu.position.y + 0.12, mouth.z) };
          });
          return [
            { dur: 0.65, start() { mg.userData.setContent(false); fl.forEach((p) => { p.m.visible = true; }); sfx.clink(); }, fn: (k) => fl.forEach((p) => { p.m.position.lerpVectors(p.a, p.mid, k); p.m.position.y += Math.sin(Math.PI * k) * 0.55; p.m.rotation.x = k * 3; }) },
            { dur: 0.45, ease: easeOut, start() { sfx.fizz(); fl.forEach((p) => B.ripple.trigger(V3(p.mid.x, p.tu.userData.surfaceY() + 0.01, p.mid.z), 0.08)); }, fn: (k) => fl.forEach((p) => p.m.position.lerpVectors(p.mid, p.bot, k)) },
            { dur: 0.05, fn: () => { fl.forEach((p) => { p.m.position.set(0, 0, 0); p.tu.userData.solids.add(p.m); }); tm.userData.pressStart(); } },
          ];
        },
      },
    ];
    B.reset = () => {
      B.st = {}; B.level = { ...B.ref }; B.run = null; B.rinsing = false;
      [tRef, tExp].forEach((tu) => { tu.userData.clear(); tu.userData.setFill(1); });
      thRef.userData.setTemp(25); thExp.userData.setTemp(25);
      lamp.userData.capOn(); mg.userData.setContent(true); tm.userData.setTime(0); B.sinkObj.userData.setFlow(false);
    };
    B.times = () => [tTemp(B.level), tTemp(REF)];
    B.show = () => {
      const [te, tr] = B.times(), t = B.run ? B.run.t : -1;
      B.tag('ref', t >= tr ? `Đối chứng · hồng sau ${fmtT(tr)}` : 'Đối chứng · 25 °C');
      B.tag('exp', t >= te ? `Thí nghiệm · hồng sau ${fmtT(te)}` : B.st.temp ? `Thí nghiệm · ${B.level.temp} °C` : 'Thí nghiệm · 25 °C (chưa đun)');
    };
    B.frame = (t, dt) => {
      const [te, tr] = B.times();
      const p = (tx) => clamp((t / tx - 0.35) / 0.65);
      tRef.userData.setTint(0xf43f8e, p(tr), { opacity: 0.88 });
      tExp.userData.setTint(0xf43f8e, p(te), { opacity: 0.88 });
      tRef.userData.bub.update(dt, 0.16);
      tExp.userData.bub.update(dt, 0.65);
      tExp.userData.steam.update(dt, B.level.temp >= 45 ? 0.6 : 0);
      tm.userData.setTime(Math.min(t, Math.max(te, tr))); B.show();
      return t >= Math.max(te, tr) * 1.02;
    };
    B.speed = () => 11;
    B.makeRow = () => { const [te, tr] = B.times(); return { key: String(B.level.temp), level: { ...B.level }, te, tr, cond: B.level.temp + ' °C', exp: fmtT(te), ref: fmtT(tr), ratio: fmt(tr / te, 1) + ' lần' }; };
    B.read = () => {
      const [te, tr] = B.times(), t = B.run ? Math.min(B.run.t, Math.max(te, tr)) : 0, go = !!B.run;
      return { label: 'Đồng hồ · giây từ lúc thả dây Mg', big: fmt(t, 1), unit: 's', cells: [['Thí nghiệm', go && t >= te ? fmtT(te) : 'chưa hồng'], ['Đối chứng', go && t >= tr ? fmtT(tr) : 'chưa hồng'], ['Nhanh gấp', go && B.run.done ? fmt(tr / te, 1) + ' lần' : '–']] };
    };
    B.reset();
  }

  // ---------- BÀN 3 · BỀ MẶT (hỗ trợ solo cho bước 2 + 2 bình cho bước 5 + đong & cân tự chọn!) ----------
  {
    const bx = -X_OFF, bz = Z_FRONT;
    const B = makeBenchShell('surf', 'Bàn 3 · Bề mặt', '#6366f1', [bx, bz],
      { target: [bx + 0.05, 1.15, bz + 0.1], w: 8.6, h: 3.3, el: 15, az: -4, fov: 30, shadowR: 5.6 },
      {
        camSolo: { target: [bx - 1.15, 1.15, bz + 0.1], w: 6.2, h: 3.3, el: 15, az: -4, fov: 30, shadowR: 4.8 },
        ref: { vAcid: REF3.vAcid, mass: REF3.mass },
        eq: 'CaCO₃ + 2HCl → CaCl₂ + CO₂↑ + H₂O',
        cond: (b) => `${b.solo ? 'trong bình:' : 'mỗi bình'} ${b.st.vol ? b.level.vAcid + ' mL' : 'chưa đong'} HCl 0,5 M · ${b.st.mass ? g2(b.level.mass) : 'chưa cân'} đá vôi · 25 °C` + (b.solo ? '' : ' · chỉ khác cỡ hạt'),
        text: 'Hai bình cùng lượng HCl và cùng số gam đá vôi: bình trái đá vôi viên, bình phải đá vôi đập nhỏ. Khí CO₂ sinh ra đẩy pit-tông trong xi-lanh.',
        cols: ['Lượng mỗi bình', 'Đập nhỏ (½ khí)', 'Viên (½ khí)', 'Nhanh gấp'],
      });
    const fRef = makeFlaskPro(), fExp = makeFlaskPro();
    B.addItem('ref', fRef, [-0.66, 0, -0.1], { r: 0.56, of: 'ref', vessel: true });
    B.addItem('exp', fExp, [0.66, 0, -0.1], { r: 0.56, of: 'exp', vessel: true });
    const rigRef = makeGasRigPro({ dir: -1 }), rigExp = makeGasRigPro({ dir: 1 });
    B.addItem('rigRef', rigRef, [-0.66, 0, -0.1], { of: 'ref', tag: 'Đối chứng · khí 0,0 mL', tagAt: [-1.15, 2.55, 0] });
    B.addItem('rigExp', rigExp, [0.66, 0, -0.1], { of: 'exp', tag: 'Thí nghiệm · khí 0,0 mL', tagAt: [1.15, 2.55, 0] });
    B.addItem('hcl', makeBottlePro({ title: 'HCl', sub: '0,5 M', name: 'Hydrochloric acid' }), [-3.4, 0, 0.3], { r: 0.46, tag: 'HCl 0,5 M' });
    const cylM = makeCylinderPro(); B.addItem('cyl', cylM, [-2.42, 0, 1.0], { r: 0.4, tag: 'Ống đong · 0 mL', tagAt: [0, 1.8, 0] });
    const tm = makeTimerPro(); tm.rotation.y = 0.22; B.addItem('timer', tm, [-1.52, 0, 1.5], { r: 0.46, tag: 'Đồng hồ', say: 'Đồng hồ tự chạy khi thả đá vôi.', lift: false });
    updaters.push((dt) => tm.userData.update(dt));
    const dRef = makeWatchGlassPro({ form: 'vien' }), dExp = makeWatchGlassPro({ form: 'vun' });
    B.addItem('dRef', dRef, [-0.66, 0, 1.2], { r: 0.5, of: 'ref', tag: 'Đá vôi viên', tagAt: [0, 0.28, 0] });
    B.addItem('dExp', dExp, [0.66, 0, 1.2], { r: 0.5, of: 'exp', tag: 'Đá vôi đập nhỏ', tagAt: [0, 0.28, 0] });
    const scale = makeBalancePro(); B.addItem('scale', scale, [2.02, 0, 1.32], { r: 0.78, tag: 'Cân điện tử', tagAt: [0, 0.52, 0], lift: false });

    const inPlay = (k) => !B.solo || k === B.solo;
    B.steps = [
      {
        id: 'vol', label: 'Đong HCl vào ống đong (tự chọn lượng)', var: 'vAcid', repeat: true, until: 'fill', item: 'hcl',
        range: { min: 5, max: 50, step: 1, unit: 'mL', per: ' mỗi bình', act: 'Đong', limit: 'tối đa 50 mL (ống đong 100 mL)' },
        run: (o) => {
          const from = cylM.userData.mL, to = o.v * (B.solo ? 1 : 2);
          if (to <= from) return [{ dur: 0.35, ease: lin, start() { sfx.pour(0.3); }, fn: (k) => cylM.userData.setVolume(lerp(from, to, k)) }];
          const tgt = { mouthWorld: cylM.userData.mouthWorld, surfaceY: cylM.userData.surfaceY, RN: 0.16, setFill: (k) => cylM.userData.setVolume(lerp(from, to, k)) };
          return buildPourSeq(B, B.items.hcl, [tgt], [0, 1]);
        },
      },
      {
        id: 'fill', label: 'Rót HCl từ ống đong vào bình, chia đều', item: 'cyl',
        run: () => buildPourSeq(B, B.items.cyl, ['ref', 'exp'].filter(inPlay).map((k) => B.vessels[k]), [0, fillOf(B.level.vAcid)], { drain: true }),
      },
      {
        id: 'mass', label: 'Cân đá vôi (tự chọn số gam)', var: 'mass', repeat: true, item: 'scale',
        range: { min: 0.05, max: 2.0, step: 0.01, digits: 2, unit: 'g', per: ' mỗi bình', act: 'Cân', limit: 'tối đa 2,00 g' },
        run: (o) => {
          const panW = scale.position.clone().add(scale.userData.panTop), seq = [];
          const scMul = Math.min(1.45, Math.cbrt(o.v / REF3.mass));
          ['dRef', 'dExp'].filter((id) => inPlay(B.items[id].of)).forEach((id) => {
            const d = B.items[id], here = d.home.clone();
            seq.push({ dur: 0.42, start() { sfx.clink(); }, fn: (k) => { d.obj.position.lerpVectors(here, panW, k); d.obj.position.y += Math.sin(Math.PI * k) * 0.35; } });
            // Đĩa cân nhún lò xo + LCD dao động ổn định + tiếng bíp cân!
            seq.push({
              dur: 0.48, ease: lin,
              start() { d.obj.userData.holder.scale.setScalar(scMul); },
              fn: (k) => {
                const bounce = Math.sin(k * Math.PI * 2.5) * Math.exp(-k * 4) * 0.45 + 0.65;
                scale.userData.setDip(bounce); d.obj.position.y = panW.y - bounce * 0.035;
                scale.userData.setValue(o.v * (k < 0.72 ? (0.88 + 0.16 * Math.sin(k * 14)) : 1), k >= 0.75);
              },
            });
            seq.push({ dur: 0.05, start() { sfx.scaleBeep(); } });
            seq.push({
              dur: 0.42,
              fn: (k) => {
                scale.userData.setDip(0.65 * (1 - k));
                d.obj.position.lerpVectors(panW, here, k); d.obj.position.y += Math.sin(Math.PI * k) * 0.32;
              },
            });
          });
          return seq;
        },
      },
      {
        id: 'go', role: 'start', label: 'Thả đá vôi vào bình, đậy nút', items: ['ref', 'exp', 'dRef', 'dExp'], ring: ['dRef', 'dExp'],
        run: () => {
          const pairs = [['dRef', 'ref', 'vien', rigRef], ['dExp', 'exp', 'vun', rigExp]].filter(([, k]) => inPlay(k));
          const sc = 0.95 * Math.min(1.32, Math.cbrt(B.level.mass / REF3.mass));
          const fl = pairs.map(([did, vid, form]) => {
            const d = B.items[did], v = B.vessels[vid], obj = makeLimestone(form, sc); obj.visible = false; B.g.add(obj);
            const m = v.mouthWorld();
            return { d, v, obj, a: d.home.clone().add(V3(0, 0.08, 0)), mid: m.clone().add(V3(0, 0.28, 0)), bot: V3(m.x, 0.07, m.z) };
          });
          return [
            { dur: 0.68, start() { fl.forEach((p) => { p.d.obj.userData.setContent(false); p.obj.visible = true; }); sfx.clink(); }, fn: (k) => fl.forEach((p) => { p.obj.position.lerpVectors(p.a, p.mid, k); p.obj.position.y += Math.sin(Math.PI * k) * 0.55; p.obj.rotation.z = -k * 1.4; }) },
            { dur: 0.42, ease: easeOut, start() { sfx.fizz(); fl.forEach((p) => B.ripple.trigger(V3(p.mid.x, p.v.surfaceY() + 0.01, p.mid.z), 0.24)); }, fn: (k) => fl.forEach((p) => p.obj.position.lerpVectors(p.mid, p.bot, k)) },
            { dur: 0.02, fn: () => fl.forEach((p) => { p.obj.position.set(0, 0, 0); p.v.solids.clear(); p.v.solids.add(p.obj); }) },
            { dur: 0.42, ease: easeOut, fn: (k) => pairs.forEach(([, , , rig]) => rig.userData.setOpen(1 - k)) },
            { dur: 0.05, start() { tm.userData.pressStart(); } },
          ];
        },
      },
    ];
    B.reset = () => {
      B.st = {}; B.level = { ...B.ref }; B.run = null; B.rinsing = false; B.pourArc.hide();
      ['ref', 'exp'].forEach((k) => { B.items[k].obj.position.copy(B.items[k].home); B.items[k].obj.rotation.z = 0; B.vessels[k].clear(); B.vessels[k].setFill(0); });
      [rigRef, rigExp].forEach((r) => { r.userData.setVolume(0); r.userData.setOpen(1); });
      [dRef, dExp].forEach((d) => { d.userData.setContent(true); d.userData.holder.scale.setScalar(1); });
      const hu = B.items.hcl.obj.userData; B.items.hcl.obj.position.copy(B.items.hcl.home); B.items.hcl.obj.rotation.z = 0;
      B.items.hcl.obj.add(hu.cap); hu.cap.position.set(0, hu.capHomeY, 0);
      cylM.position.copy(B.items.cyl.home); cylM.rotation.z = 0; cylM.userData.setVolume(0);
      scale.userData.setValue(null, false); scale.userData.setDip(0); tm.userData.setTime(0); B.sinkObj.userData.setFlow(false);
    };
    B.runs = () => [run3('vun', B.level.mass, B.level.vAcid), run3('vien', B.level.mass, B.level.vAcid)];
    B.window = () => { const [e, r] = B.runs(); return Math.min(260, (B.solo ? r.tEnd : Math.max(e.tEnd, r.tEnd)) * 1.03); };
    B.speed = () => B.window() / 8.0;
    B.show = () => {
      const [e, r] = B.runs(), t = B.run ? B.run.t : 0, m = B.st.mass ? ' ' + g2(B.level.mass) : '';
      B.tag('rigRef', `${B.solo ? 'Xi-lanh' : 'Đối chứng'} · ${gasTag(gasAt3(r, t))}`);
      B.tag('rigExp', `Thí nghiệm · ${gasTag(gasAt3(e, t))}`);
      B.tag('dRef', 'Đá vôi viên' + m); B.tag('dExp', 'Đá vôi đập nhỏ' + m);
      const ml = Math.round(cylM.userData.mL), n = B.solo ? 1 : 2;
      B.tag('cyl', `Ống đong · ${ml} mL HCl` + (ml > 0 && n > 1 && ml === n * B.level.vAcid ? ` (${n} × ${B.level.vAcid} mL)` : ''));
      B.tag('scale', B.st.mass ? `Cân · ${g2(B.level.mass)} mỗi đĩa` : 'Cân điện tử');
    };
    B.frame = (t, dt) => {
      const [e, r] = B.runs();
      [['ref', r, rigRef], ['exp', e, rigExp]].forEach(([k, run, rig]) => {
        if (!inPlay(k)) return;
        const vol = gasAt3(run, t), v = B.vessels[k], left = 1 - vol / run.vMax;
        rig.userData.setVolume(vol);
        v.solids.visible = left > 0.005; v.solids.scale.setScalar(Math.max(0.1, Math.cbrt(Math.max(0, left))));
        const rate = clamp(rateAt3(run, t) / R0);
        v.bub.update(dt, rate); v.setFoam(rate * 0.85, 0.9 + rate * 0.5);
      });
      const w = B.window(); tm.userData.setTime(Math.min(t, w)); B.show();
      return t >= w;
    };
    B.makeRow = () => {
      const [e, r] = B.runs(), w = B.window(), cond = `${g2(B.level.mass)} · ${B.level.vAcid} mL`;
      const ve = gasAt3(e, w), vr = gasAt3(r, w);
      if (B.solo) return vr >= FULL ? { key: cond, solo: true, over: true, te: timeTo(r, FULL), tr: timeTo(r, FULL), vEnd: FULL, cond, exp: '(1 bình)', ref: `đầy sau ${fmtT(timeTo(r, FULL))}`, ratio: '–' } : { key: cond, solo: true, left: r.stoneLeft, te: r.tHalf, tr: r.tHalf, vEnd: vr, cond, exp: '(1 bình)', ref: fmtT(r.tHalf), ratio: '–' };
      if (ve >= FULL) { const te = timeTo(e, FULL), tr = timeTo(r, FULL); return { key: cond, over: true, te, tr: tr || te, vEnd: FULL, cond, exp: `đầy ${fmtT(te)}`, ref: tr ? `đầy ${fmtT(tr)}` : fmt(vr, 1) + ' mL', ratio: tr ? fmt(tr / te, 1) + ' lần' : '–' }; }
      return { key: cond, left: e.stoneLeft || r.stoneLeft, te: e.tHalf, tr: r.tHalf, vEnd: ve, cond, exp: fmtT(e.tHalf), ref: fmtT(r.tHalf), ratio: fmt(r.tHalf / e.tHalf, 1) + ' lần' };
    };
    B.read = () => {
      const [e, r] = B.runs(), t = B.run ? Math.min(B.run.t, B.window()) : 0, go = !!B.run, ve = gasAt3(e, t), vr = gasAt3(r, t);
      if (B.solo) return { label: 'Khí CO₂ trong xi-lanh', big: fmt(Math.min(vr, FULL), 1), unit: vr >= FULL ? 'mL (đầy)' : 'mL', cells: [['Đồng hồ', fmt(t, 1) + ' s'], ['Nửa khí sau', go && t >= r.tHalf ? fmtT(r.tHalf) : '–'], ['Tốc độ TB', go && t >= r.tHalf ? fmt(r.vEnd / 2 / r.tHalf, 2) + ' mL/s' : '–']] };
      return { label: 'Khí CO₂ xi-lanh thí nghiệm (đập nhỏ)', big: fmt(Math.min(ve, FULL), 1), unit: ve >= FULL ? 'mL (đầy)' : 'mL', cells: [['Đồng hồ', fmt(t, 1) + ' s'], ['Đối chứng', fmt(Math.min(vr, FULL), 1) + ' mL'], ['Nửa khí sau', go && t >= e.tHalf ? fmtT(e.tHalf) : '–']] };
    };
    B.rigs = [rigRef, rigExp];
    B.reset();
  }

  // ---------- BÀN 4 · XÚC TÁC ----------
  {
    const bx = X_OFF, bz = Z_FRONT, WINDOW_CAT = 26;
    const B = makeBenchShell('cat', 'Bàn 4 · Xúc tác', '#16a34a', [bx, bz],
      { target: [bx - 0.05, 1.15, bz + 0.1], w: 8.6, h: 3.3, el: 15, az: 4, fov: 30, shadowR: 5.6 },
      {
        ref: { vPerox: REF3.vPerox },
        eq: '2H₂O₂ → 2H₂O + O₂↑ (xúc tác MnO₂)',
        cond: (b) => `mỗi bình ${b.st.vol ? b.level.vPerox + ' mL' : 'chưa đong'} H₂O₂ · 25 °C · chỉ khác có hay không có MnO₂`,
        text: 'Hai bình cùng lượng hydrogen peroxide. Bình trái để nguyên, bình phải thêm một thìa bột manganese dioxide (MnO₂).',
        cols: ['Lượng H₂O₂', 'Có MnO₂ (26 s)', 'Không MnO₂', 'Nửa O₂ sau'],
      });
    const fRef = makeFlaskPro(), fExp = makeFlaskPro();
    B.addItem('ref', fRef, [-0.66, 0, -0.1], { r: 0.56, vessel: true });
    B.addItem('exp', fExp, [0.66, 0, -0.1], { r: 0.56, vessel: true });
    const rigRef = makeGasRigPro({ dir: -1 }), rigExp = makeGasRigPro({ dir: 1 });
    B.addItem('rigRef', rigRef, [-0.66, 0, -0.1], { tag: 'Đối chứng (không MnO₂) · 0,0 mL', tagAt: [-1.15, 2.55, 0] });
    B.addItem('rigExp', rigExp, [0.66, 0, -0.1], { tag: 'Thí nghiệm (sẽ thêm MnO₂) · 0,0 mL', tagAt: [1.15, 2.55, 0] });
    B.addItem('h2o2', makeBottlePro({ title: 'H₂O₂', sub: '10%', name: 'Hydrogen peroxide', amber: true }), [-3.35, 0, 0.35], { r: 0.46, tag: 'H₂O₂ (lọ nâu)' });
    const cylM = makeCylinderPro(); B.addItem('cyl', cylM, [-2.42, 0, 1.0], { r: 0.4, tag: 'Ống đong · 0 mL', tagAt: [0, 1.8, 0] });
    const tm = makeTimerPro(); tm.rotation.y = 0.22; B.addItem('timer', tm, [-1.52, 0, 1.5], { r: 0.46, tag: 'Đồng hồ', say: 'Đồng hồ tự chạy khi đổ xúc tác.', lift: false });
    updaters.push((dt) => tm.userData.update(dt));
    const mno2 = makeBottlePro({ title: 'MnO₂', sub: 'xúc tác', name: 'Manganese dioxide', wide: true, powder: true, h: 0.84, r: 0.35, fill: 0.58 });
    B.addItem('mno2', mno2, [2.05, 0, 1.2], { r: 0.48, tag: 'Bột MnO₂ (xúc tác)' });
    const spat = makeSpatulaPro(); spat.rotation.y = -0.12; B.addItem('spatula', spat, [0.78, 0, 1.38], { r: 0.45, tag: 'Thìa xúc inox', tagAt: [0, 0.24, 0] });

    B.steps = [
      {
        id: 'vol', label: 'Đong H₂O₂ vào ống đong (tự chọn lượng)', var: 'vPerox', repeat: true, until: 'fill', item: 'h2o2',
        range: { min: 5, max: 50, step: 1, unit: 'mL', per: ' mỗi bình', act: 'Đong', limit: 'tối đa 50 mL (ống đong 100 mL)' },
        run: (o) => {
          const from = cylM.userData.mL, to = o.v * 2;
          if (to <= from) return [{ dur: 0.35, ease: lin, start() { sfx.pour(0.3); }, fn: (k) => cylM.userData.setVolume(lerp(from, to, k)) }];
          const tgt = { mouthWorld: cylM.userData.mouthWorld, surfaceY: cylM.userData.surfaceY, RN: 0.16, setFill: (k) => cylM.userData.setVolume(lerp(from, to, k)) };
          return buildPourSeq(B, B.items.h2o2, [tgt], [0, 1]);
        },
      },
      {
        id: 'fill', label: 'Rót H₂O₂ từ ống đong vào hai bình, chia đều', item: 'cyl',
        run: () => buildPourSeq(B, B.items.cyl, [B.vessels.ref, B.vessels.exp], [0, fillOf(B.level.vPerox)], { drain: true }),
      },
      {
        id: 'scoop', label: 'Xúc một thìa MnO₂ cho bình thí nghiệm', item: 'mno2',
        run: () => {
          const cap = mno2.userData.cap, capS = V3(0, mno2.userData.capHomeY, 0), capOff = V3(0.58, 0.12, 0.14);
          const home = B.items.spatula.home.clone(), overJar = mno2.position.clone().add(V3(0.74, 1.35, 0)), dipJar = overJar.clone().add(V3(0, -0.52, 0));
          return [
            { dur: 0.3, start() { sfx.clink(); }, fn: (k) => { cap.rotation.y = k * Math.PI * 2; cap.position.lerpVectors(capS, capOff, k); cap.position.y += Math.sin(Math.PI * k) * 0.35; } },
            { dur: 0.45, fn: (k) => { spat.position.lerpVectors(home, overJar, k); spat.position.y += Math.sin(Math.PI * k) * 0.3; } },
            { dur: 0.28, fn: (k) => { spat.position.lerpVectors(overJar, dipJar, k); spat.rotation.z = 0.25 * k; } },
            { dur: 0.28, start() { spat.userData.setLoaded(true); B.loaded = true; sfx.click(640); }, fn: (k) => { spat.position.lerpVectors(dipJar, overJar, k); spat.rotation.z = 0.25 * (1 - k); } },
            { dur: 0.45, fn: (k) => { spat.position.lerpVectors(overJar, home, k); spat.position.y += Math.sin(Math.PI * k) * 0.25; } },
            { dur: 0.3, fn: (k) => { cap.position.lerpVectors(capOff, capS, k); cap.position.y += Math.sin(Math.PI * k) * 0.3; cap.rotation.y = (1 - k) * Math.PI * 2; } },
          ];
        },
      },
      {
        id: 'go', role: 'start', label: 'Đổ MnO₂ vào bình thí nghiệm, đậy nút', items: ['spatula', 'exp', 'timer'], ring: ['spatula', 'exp'],
        run: () => {
          const home = B.items.spatula.home.clone(), mouth = B.vessels.exp.mouthWorld(), overM = mouth.clone().add(V3(0.74, 0.26, 0));
          const grains = Array.from({ length: 6 }, () => {
            const g = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 6), MAT.mno2); g.visible = false; B.g.add(g); return g;
          });
          return [
            { dur: 0.5, fn: (k) => { spat.position.lerpVectors(home, overM, k); spat.position.y += Math.sin(Math.PI * k) * 0.4; } },
            { dur: 0.25, fn: (k) => { spat.rotation.x = 1.25 * k; } },
            {
              dur: 0.42, ease: easeIn,
              start() { spat.userData.setLoaded(false); B.loaded = false; grains.forEach((g) => { g.visible = true; }); sfx.fizz(); },
              fn: (k) => grains.forEach((g, idx) => {
                const kk = clamp((k - idx * 0.05) / 0.7);
                g.position.set(mouth.x + (idx - 2.5) * 0.018, lerp(mouth.y + 0.16, 0.08, kk), mouth.z + ((idx % 2) - 0.5) * 0.02);
              }),
            },
            { dur: 0.26, start() { grains.forEach((g) => B.g.remove(g)); B.vessels.exp.powder.visible = true; B.ripple.trigger(V3(mouth.x, B.vessels.exp.surfaceY() + 0.01, mouth.z), 0.26); }, fn: (k) => { spat.rotation.x = 1.25 * (1 - k); } },
            { dur: 0.45, fn: (k) => { spat.position.lerpVectors(overM, home, k); spat.position.y += Math.sin(Math.PI * k) * 0.3; } },
            { dur: 0.42, ease: easeOut, fn: (k) => [rigRef, rigExp].forEach((r) => r.userData.setOpen(1 - k)) },
            { dur: 0.05, start() { tm.userData.pressStart(); } },
          ];
        },
      },
    ];
    B.reset = () => {
      B.st = {}; B.level = { ...B.ref }; B.run = null; B.loaded = false; B.rinsing = false; B.pourArc.hide();
      ['ref', 'exp'].forEach((k) => { B.items[k].obj.position.copy(B.items[k].home); B.items[k].obj.rotation.z = 0; B.vessels[k].clear(); B.vessels[k].setFill(0); });
      [rigRef, rigExp].forEach((r) => { r.userData.setVolume(0); r.userData.setOpen(1); });
      const hu = B.items.h2o2.obj.userData; B.items.h2o2.obj.position.copy(B.items.h2o2.home); B.items.h2o2.obj.rotation.z = 0; B.items.h2o2.obj.add(hu.cap); hu.cap.position.set(0, hu.capHomeY, 0);
      mno2.userData.cap.position.set(0, mno2.userData.capHomeY, 0); mno2.userData.cap.rotation.y = 0;
      spat.position.copy(B.items.spatula.home); spat.rotation.set(0, -0.12, 0); spat.userData.setLoaded(false);
      cylM.position.copy(B.items.cyl.home); cylM.rotation.z = 0; cylM.userData.setVolume(0);
      tm.userData.setTime(0); B.sinkObj.userData.setFlow(false);
    };
    B.vols = (t) => [gasO2(true, B.level.vPerox, t), gasO2(false, B.level.vPerox, t)];
    B.speed = () => 3.2;
    B.show = () => {
      const [ve, vr] = B.run ? B.vols(B.run.t) : [0, 0];
      B.tag('rigRef', `Đối chứng (không MnO₂) · ${gasTag(vr)}`);
      B.tag('rigExp', `Thí nghiệm (${B.run ? 'có MnO₂' : 'sẽ thêm MnO₂'}) · ${gasTag(ve)}`);
      const ml = Math.round(cylM.userData.mL);
      B.tag('cyl', `Ống đong · ${ml} mL H₂O₂` + (ml > 0 && ml === 2 * B.level.vPerox ? ` (2 × ${B.level.vPerox} mL)` : ''));
    };
    B.frame = (t, dt) => {
      const [ve, vr] = B.vols(t), k = kCat({ cat: true }), rate = clamp(Math.exp(-k * t) * 1.15);
      rigExp.userData.setVolume(ve); rigRef.userData.setVolume(vr);
      B.vessels.exp.bub.update(dt, rate); B.vessels.exp.setFoam(rate, 2.2);
      B.vessels.ref.bub.update(dt, 0.04);
      tm.userData.setTime(Math.min(t, WINDOW_CAT)); B.show();
      return t >= WINDOW_CAT;
    };
    B.makeRow = () => {
      const [ve, vr] = B.vols(WINDOW_CAT), te = tCat({ cat: true });
      return { key: String(B.level.vPerox), level: { ...B.level }, te, tr: tCat({ cat: false }), over: ve >= FULL, cond: B.level.vPerox + ' mL H₂O₂', exp: ve >= FULL ? 'đầy 100 mL' : fmt(ve, 1) + ' mL', ref: fmt(vr, 1) + ' mL', ratio: fmtT(te) };
    };
    B.read = () => {
      const t = B.run ? Math.min(B.run.t, WINDOW_CAT) : 0, [ve, vr] = B.vols(t), te = tCat({ cat: true });
      return { label: 'Khí O₂ xi-lanh thí nghiệm (có MnO₂)', big: fmt(Math.min(ve, FULL), 1), unit: ve >= FULL ? 'mL (đầy)' : 'mL', cells: [['Đồng hồ', fmt(t, 1) + ' s'], ['Đối chứng', fmt(vr, 1) + ' mL'], ['Nửa O₂ sau', B.run && t >= te ? fmtT(te) : '–']] };
    };
    B.rigs = [rigRef, rigExp];
    B.reset();
  }

  // ---------- TRỤ VÒNG KÍNH SOI HẠT ----------
  const lensPed = put(new THREE.Group(), 0, 0, 0);
  lensPed.add(makeIslandPro({ w: 2.3, d: 2.3, sinkPos: null }));
  const lensOutline = makeBenchOutline(2.3, 2.3, '#2563eb'); lensPed.add(lensOutline);
  updaters.push((dt) => lensOutline.userData.update(dt));
  const lensMesh = makeParticleLensPro(); lensPed.add(lensMesh); scene.add(lensPed);
  updaters.push((dt) => lensMesh.userData.update(dt));
  regPick(lensPed, 'lens', false);
  addTag('lens', 'Vòng kính soi hạt', V3(0, 3.65, 0), { color: '#2563eb', isBench: true, onClick: () => cb.pick && cb.pick('lens') });
  benches.lens = {
    id: 'lens', name: 'Vòng kính soi hạt', color: '#2563eb', at: [0, 0], outline: lensOutline,
    eq: 'Va chạm hiệu quả → phản ứng xảy ra', cond: 'mô hình động học phân tử minh hoạ',
    text: 'Phóng to tới cấp độ hạt. Hạt sáng vàng là hạt đủ năng lượng; hai hạt sáng chạm nhau loé vòng trắng = 1 va chạm hiệu quả.',
    cam: { target: [0, 2.4, 0], w: 3.8, h: 3.4, el: 7, az: 0, fov: 30, shadowR: 4.5 },
    lensObj: lensMesh.userData, items: {}, rings: {}, tags: [], steps: [], seq: makeSeq(),
  };

  // ---------- TRẠM ĐỜI SỐNG 3D (BƯỚC 9 · 2 CỐC VIÊN SỦI NGUYÊN VS BẺ VỤN) ----------
  const lifeStation = (() => {
    const root = put(new THREE.Group(), 0, 0, 10.6); root.visible = false; scene.add(root);
    root.add(makeIslandPro({ w: 6.2, d: 3.4, sinkPos: null }));
    // Khay gốm sáng màu bếp đặt 2 cốc
    const tray = new THREE.Mesh(roundedBox(4.8, 0.08, 2.3, 0.14, 0.02), MAT.whitePlastic); tray.receiveShadow = true; root.add(tray);
    const cupL = put(makeGlassCupPro(), -1.05, 0.08, -0.15);
    const cupR = put(makeGlassCupPro(), 1.05, 0.08, -0.15);
    const dishL = put(makeWatchGlassPro({}), -1.05, 0.08, 0.85);
    const dishR = put(makeWatchGlassPro({}), 1.05, 0.08, 0.85);
    const tm = put(makeTimerPro(), 0, 0.08, 0.82); tm.scale.setScalar(0.85);
    const rip = makeRippleFX(); root.add(cupL, cupR, dishL, dishR, tm, rip.g);
    updaters.push((dt) => { rip.update(dt); tm.userData.update(dt); });

    const makeTabWhole = () => { const m = new THREE.Mesh(cyl(0.16, 0.16, 0.075, 24), MAT.tablet); m.position.y = 0.04; m.castShadow = true; return m; };
    const makeTabCrushed = () => {
      const g = new THREE.Group();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * 6.283, d = i ? 0.09 + (i % 2) * 0.06 : 0;
        const m = new THREE.Mesh(makeBlobGeo(0.052, i * 2.1, 0.25), MAT.tablet);
        m.position.set(Math.cos(a) * d, 0.035, Math.sin(a) * d); g.add(m);
      }
      return g;
    };
    const state = { playing: false, done: false, t: 0, seq: makeSeq() };
    function reset() {
      state.seq.flush(); state.playing = false; state.done = false; state.t = 0;
      dishL.userData.holder.clear(); dishL.userData.holder.add(makeTabWhole());
      dishR.userData.holder.clear(); dishR.userData.holder.add(makeTabCrushed());
      [cupL, cupR].forEach((c) => { c.userData.solids.clear(); c.userData.setTint(0); c.userData.setFoam(0); c.userData.bub.update(0, 0); });
      tm.userData.setTime(0);
    }
    function play() {
      if (state.playing || state.seq.busy()) return;
      reset();
      const tL = makeTabWhole(), tR = makeTabCrushed();
      [tL, tR].forEach((m) => { m.visible = false; root.add(m); });
      const pL0 = dishL.position.clone().add(V3(0, 0.06, 0)), pR0 = dishR.position.clone().add(V3(0, 0.06, 0));
      const mL = V3(-1.05, 1.55, -0.15), mR = V3(1.05, 1.55, -0.15);
      const bL = V3(-1.05, 0.22, -0.15), bR = V3(1.05, 0.22, -0.15);
      state.seq.play([
        { dur: 0.6, start() { dishL.userData.holder.clear(); dishR.userData.holder.clear(); tL.visible = tR.visible = true; sfx.clink(); }, fn: (k) => { tL.position.lerpVectors(pL0, mL, k); tL.position.y += Math.sin(Math.PI * k) * 0.45; tR.position.lerpVectors(pR0, mR, k); tR.position.y += Math.sin(Math.PI * k) * 0.45; } },
        { dur: 0.35, ease: easeOut, start() { sfx.fizz(); rip.trigger(V3(-1.05, 1.0, -0.15), 0.28); rip.trigger(V3(1.05, 1.0, -0.15), 0.28); }, fn: (k) => { tL.position.lerpVectors(mL, bL, k); tR.position.lerpVectors(mR, bR, k); } },
        { dur: 0.04, fn: () => { tL.position.set(0, 0, 0); tR.position.set(0, 0, 0); cupL.userData.solids.add(tL); cupR.userData.solids.add(tR); tm.userData.pressStart(); state.playing = true; if (cb.change) cb.change('life'); } },
      ]);
    }
    updaters.push((dt) => {
      state.seq.tick(dt);
      if (!state.playing || state.done) return;
      state.t = Math.min(24, state.t + dt * 3.0);
      const pL = clamp(state.t / 24), pR = clamp(state.t / 8);
      cupL.userData.setTint(pL); cupR.userData.setTint(pR);
      cupL.userData.solids.visible = pL < 0.98; cupL.userData.solids.scale.setScalar(Math.max(0.1, 1 - pL));
      cupR.userData.solids.visible = pR < 0.98; cupR.userData.solids.scale.setScalar(Math.max(0.1, 1 - pR));
      cupL.userData.bub.update(dt, pL < 0.98 ? 0.38 : 0); cupL.userData.setFoam(pL < 0.98 ? 0.45 : 0);
      cupR.userData.bub.update(dt, pR < 0.98 ? 1.0 : 0); cupR.userData.setFoam(pR < 0.98 ? 0.95 : 0);
      tm.userData.setTime(state.t);
      if (state.t >= 24) { state.done = true; sfx.done(); if (cb.lifeDone) cb.lifeDone(); }
    });
    const tmp1 = V3(), tmp2 = V3();
    addTag('life/L', 'Viên nguyên (24 s)', () => cupL.getWorldPosition(tmp1).add(V3(0, 1.38, 0)), { color: '#64748b' });
    addTag('life/R', 'Viên bẻ vụn (8 s)', () => cupR.getWorldPosition(tmp2).add(V3(0, 1.38, 0)), { color: '#ea580c' });
    regPick(dishL, 'life/play', true); regPick(dishR, 'life/play', true);
    reset();
    return {
      root, state, play, reset,
      cam: { target: [0, 0.72, 10.65], w: 5.4, h: 2.5, el: 19, az: 0, fov: 31, shadowR: 4.2 },
    };
  })();

  // ---------- RỬA DỤNG CỤ TẠI CHẬU RỬA ÂM BÀN THẬT ----------
  function rinse(B, instant = false) {
    if (!B || !B.sinkObj || B.seq.busy()) return false;
    if (!B.run && !Object.keys(B.st).length) { if (!instant) say('Dụng cụ đang sạch, chưa cần rửa.'); return false; }
    const finish = () => { B.reset(); emit(B); };
    if (instant) { finish(); return true; }
    B.rinsing = true;
    const S = B.sinkObj.position, rigs = (B.rigs || []).filter((r) => r.userData.open < 0.5);
    const vessels = Object.entries(B.vessels).filter(([k]) => !B.solo || k === B.solo).map(([k, v]) => ({ it: B.items[k], v, fixed: B.id === 'temp' && k === 'exp' }));
    const movable = vessels.filter((p) => !p.fixed).map((p, idx, arr) => ({
      ...p, home: p.it.home.clone(), up: p.it.home.clone().add(V3(0, 0.75, 0.6)),
      over: V3(S.x - 0.85 + (idx - (arr.length - 1) / 2) * 0.42, 0.78, S.z + 0.08),
    }));
    const seq = [];
    // Nếu đèn cồn đang cháy ở Bàn 2: đậy nắp chụp thuỷ tinh tắt lửa trước khi rửa!
    if (B.id === 'temp' && B.items.lamp?.obj.userData.lit) {
      const LU = B.items.lamp.obj.userData;
      seq.push({
        dur: 0.36,
        fn: (k) => { LU.cap.position.lerpVectors(LU.capAside, LU.capHome, k); LU.cap.position.y += Math.sin(Math.PI * k) * 0.4; },
      });
      seq.push({ dur: 0.04, start() { LU.setLit(false); sfx.clink(); } });
    }
    if (rigs.length) seq.push({ dur: 0.35, fn: (k) => rigs.forEach((r) => r.userData.setOpen(k)) });
    seq.push(
      { dur: 0.36, fn: (k) => movable.forEach((p) => p.it.obj.position.lerpVectors(p.home, p.up, k)) },
      { dur: 0.62, fn: (k) => movable.forEach((p) => { p.it.obj.position.lerpVectors(p.up, p.over, k); p.it.obj.position.y += Math.sin(Math.PI * k) * 0.35; }) },
      { dur: 0.36, start() { B.sinkObj.userData.setFlow(true); sfx.pour(0.9); }, fn: (k) => movable.forEach((p) => { p.it.obj.rotation.z = -1.65 * k; }) },
      { dur: 0.52, ease: lin, fn: (k) => vessels.forEach((p) => p.v.setFill(1 - k)) },
      { dur: 0.34, start() { vessels.forEach((p) => p.v.clear()); }, fn: (k) => movable.forEach((p) => { p.it.obj.rotation.z = -1.65 * (1 - k); }) },
      { dur: 0.62, start() { B.sinkObj.userData.setFlow(false); }, fn: (k) => movable.forEach((p) => { p.it.obj.position.lerpVectors(p.over, p.up, k); p.it.obj.position.y += Math.sin(Math.PI * k) * 0.32; }) },
      { dur: 0.36, fn: (k) => movable.forEach((p) => p.it.obj.position.lerpVectors(p.up, p.home, k)) },
    );
    B.seq.play(seq, finish); emit(B);
    return true;
  }

  // ---------- LOGIC BƯỚC & CHẠM TAY ----------
  const snap = (r, v) => +clamp(Math.round(v / r.step) * r.step, r.min, r.max).toFixed(r.digits || 0);
  const wantOf = (B, s) => snap(s.range, B.want[s.var] ?? B.ref[s.var] ?? s.range.min);
  const pickOpt = (B, s, k) => (s.options ? s.options[k ?? 0] : s.range ? { v: k ?? wantOf(B, s) } : null);
  function can(B, s) {
    if (B.seq.busy() || B.run || B.off.has(s.id)) return false;
    if ((s.needs || []).some((id) => !B.st[id]) || (s.until && B.st[s.until])) return false;
    for (const p of B.steps) { if (p === s) break; if (!p.optional && !B.off.has(p.id) && !B.st[p.id]) return false; }
    return !B.st[s.id] || !!s.repeat;
  }
  const nextStep = (B) => (B.run ? null : B.steps.find((s) => !s.optional && !B.off.has(s.id) && !B.st[s.id]) || null);
  function act(B, s, opt, instant = false) {
    if (!can(B, s)) return false;
    const o = opt || (s.options ? s.options[0] : s.range ? { v: wantOf(B, s) } : null);
    const seq = s.run(o);
    const fin = () => {
      B.st[s.id] = true;
      if (s.var && o) B.level[s.var] = o.v;
      if (s.role === 'start') B.run = { t: 0, done: false, row: null };
      renderer.shadowMap.needsUpdate = true;
      emit(B);
    };
    if (!seq || !seq.length) { fin(); return true; }
    B.seq.play(seq, fin); if (instant) B.seq.flush(); else emit(B);
    return true;
  }
  function cycle(B, s) {
    const i = s.options.findIndex((o) => o.v === B.level[s.var]);
    return !B.st[s.id] ? s.options[Math.max(i, 0)] : s.options[(i + 1) % s.options.length];
  }
  function hand(B, itemId) {
    if (activeId !== B.id) { if (cb.pick) cb.pick(B.id); return; }
    if (!handsOn) return say(handsMsg);
    if (B.seq.busy()) return say('Đang thực hiện động tác trên bàn…');
    if (itemId === 'sink') return void rinse(B);
    if (B.run) return say(B.run.done ? 'Thí nghiệm đã xong! Chạm vòi nước để rửa dụng cụ rồi thử điều kiện khác.' : 'Phản ứng đang chạy — quan sát dụng cụ đo và bảng bên phải.');
    const hits = [];
    B.steps.forEach((s) => {
      (s.options || []).forEach((o) => { if (o.item === itemId) hits.push([s, o]); });
      if (s.item === itemId || (s.items || []).includes(itemId)) hits.push([s, s.options ? cycle(B, s) : s.range ? { v: wantOf(B, s) } : null]);
    });
    const ok = hits.find(([s, o]) => can(B, s) && !(o && s.var && B.st[s.id] && B.level[s.var] === o.v));
    if (ok) return void act(B, ok[0], ok[1]);
    const same = hits.find(([s]) => s.range && can(B, s));
    if (same) return say(`Đã có đúng ${fmt(same[1].v, same[0].range.digits || 0)} ${same[0].range.unit}. Kéo thanh hoặc nhập số khác ở bảng phải rồi bấm lại.`);
    if (!hits.length) return say(B.items[itemId]?.say || 'Dụng cụ này tự hoạt động khi thí nghiệm chạy.');
    const s = hits[0][0], n = nextStep(B);
    if (B.off.has(s.id)) return say(s.offSay || 'Món này chưa dùng ở bước này.');
    say(n && n !== s && !B.st[n.id] ? `Làm việc này trước: ${n.label}.` : `Việc "${s.label}" đã làm. Chạm vòi nước nếu muốn rửa làm lại.`);
  }

  // ---------- ĐỒNG BỘ VÒNG ĐỊNH VỊ 2 TẦNG + HOVER 2 CHIỀU UI ↔ 3D ----------
  function syncBeacons(B) {
    if (!B || !B.rings) return;
    const on = new Set();
    if (handsOn && activeId === B.id && !B.seq.busy() && B.steps.length) {
      if (B.run) { if (B.run.done && B.sinkObj) on.add('sink'); }
      else {
        const n = nextStep(B);
        if (n) (n.ring || n.items || [n.item, ...(n.options || []).map((o) => o.item)]).filter(Boolean).forEach((id) => on.add(id));
      }
    }
    Object.entries(B.rings).forEach(([id, ring]) => {
      const vis = !B.items[id] || B.items[id].obj.visible;
      const fullId = `${B.id}/${id}`;
      ring.userData.setTarget(on.has(id) && vis);
      ring.userData.setHover((hoveredPick === fullId || uiHoverIds.has(fullId)) && vis);
    });
  }

  let uiHoverBench = null, speedMul = 1, topViewOn = false;
  function syncBenchOutlines() {
    const hovBench = hoveredPick ? hoveredPick.split('/')[0] : null;
    Object.values(benches).forEach((B) => {
      if (!B.outline) return;
      const show = !activeId && (hovBench === B.id || uiHoverBench === B.id);
      B.outline.userData.setOn(show);
    });
  }

  function syncSceneVisibility() {
    lifeStation.root.visible = activeId === 'life';
    setTag('life/L', { visible: namesOn && activeId === 'life' });
    setTag('life/R', { visible: namesOn && activeId === 'life' });
    Object.values(benches).forEach((B) => {
      setTag(B.id, { visible: namesOn && !activeId });
      (B.tags || []).forEach(([tid, itemId]) => {
        const vis = !B.items[itemId] || B.items[itemId].obj.visible;
        setTag(tid, { visible: namesOn && activeId === B.id && vis });
      });
      syncBeacons(B);
    });
    syncBenchOutlines();
  }

  // ---------- CAMERA RIG + 3-COLUMN SAFE AREA INSETS ----------
  const OVERVIEW = { target: [0, 0.35, 0.4], w: 22.8, h: 14.5, el: 37, az: 0, fov: 38, shadowR: 18 };
  const camera = new THREE.PerspectiveCamera(38, 1, 0.45, 95); // Tăng gấp ~4.5x độ chính xác Depth Buffer → hết sạch Z-fighting!
  const controls = new OrbitControls(camera, renderer.domElement);
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, enablePan: false, minPolarAngle: 0.25, maxPolarAngle: 1.46, rotateSpeed: 0.62, zoomSpeed: 0.78 });

  const ins = { l: 0, t: 0.08, r: 0, b: 0.1 };
  let curPreset = OVERVIEW, camGoal = null, userMoved = false, camStartPos = null;

  function applyInsets() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    const ox = ((ins.r - ins.l) / 2) * w, oy = (0.5 - ins.t - (1 - ins.t - ins.b) * 0.5) * h;
    if (Math.abs(ox) > 1 || Math.abs(oy) > 1) camera.setViewOffset(w, h, ox, oy, w, h);
    else if (camera.view && camera.view.enabled) camera.clearViewOffset();
  }
  function solveCam(p) {
    const fov = p.fov || 34, aspect = camera.aspect, tan = Math.tan(THREE.MathUtils.degToRad(fov / 2));
    const fw = Math.max(0.26, 1 - ins.l - ins.r), fh = Math.max(0.32, 1 - ins.t - ins.b);
    const dist = Math.max((p.h / 2) / (tan * fh), (p.w / 2) / (tan * aspect * fw)) * 1.06;
    const az = THREE.MathUtils.degToRad(p.az || 0), el = THREE.MathUtils.degToRad(p.el ?? 16);
    const target = V3(...p.target);
    const pos = V3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(dist).add(target);
    return { pos, target, fov, dist };
  }
  function aimShadow(center, radius) {
    keyLight.target.position.copy(center);
    keyLight.position.set(center.x - 13, 17, center.z + 10);
    Object.assign(keyLight.shadow.camera, { left: -radius, right: radius, top: radius, bottom: -radius, near: 2, far: 55 });
    keyLight.shadow.camera.updateProjectionMatrix();
    renderer.shadowMap.needsUpdate = true;
  }
  function focusCam(p, immediate = false) {
    curPreset = p; userMoved = false; camStartPos = null; if (cb.moved) cb.moved(false);
    const s = solveCam(p);
    controls.minDistance = s.dist * 0.45; controls.maxDistance = Math.min(34, s.dist * 1.65);
    aimShadow(V3(...p.target).setY(0), p.shadowR || 6);
    // Focus lighting: dịu ánh sáng nền nhẹ + rọi spotlight tập trung khi áp sát 1 bàn!
    const isClose = p !== OVERVIEW;
    hemi.intensity = isClose ? 0.56 : 0.76;
    focusSpot.intensity = isClose ? 45 : 0;
    focusSpot.position.set(p.target[0], 11.5, p.target[2] + 1.5);
    focusSpot.target.position.set(p.target[0], 0.5, p.target[2]);
    if (immediate) {
      camera.position.copy(s.pos); controls.target.copy(s.target); camera.fov = s.fov;
      applyInsets(); camera.updateProjectionMatrix(); controls.update(); camGoal = null;
    } else camGoal = s;
  }
  // Không đánh dấu userMoved chỉ vì một cú click nhẹ — chỉ kích hoạt khi kéo xoay hoặc zoom thật (> 0.14 đơn vị)!
  controls.addEventListener('start', () => { camStartPos = camera.position.clone(); });
  controls.addEventListener('change', () => {
    if (camStartPos && !userMoved && camera.position.distanceTo(camStartPos) > 0.14) {
      camGoal = null; userMoved = true; if (cb.moved) cb.moved(true);
    }
  });
  controls.addEventListener('end', () => { camStartPos = null; });

  function setInsets(v) {
    const n = { l: v.l || 0, t: v.t || 0.08, r: v.r || 0, b: v.b || 0.1 };
    if (['l', 't', 'r', 'b'].every((k) => Math.abs(n[k] - ins[k]) < 0.004)) return;
    Object.assign(ins, n); applyInsets();
    if (!userMoved) focusCam(curPreset, !camGoal);
  }

  // ---------- RAYCASTING + HOVER LIFT + TOOLTIP ----------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let down = null;
  function hitTest(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(pickables, true);
    for (const h of hits) {
      let o = h.object, vis = true;
      while (o) { if (!o.visible) { vis = false; break; } o = o.parent; }
      if (!vis) continue;
      let p = h.object; while (p && !p.userData.pickId) p = p.parent;
      if (p) return p.userData.pickId;
    }
    return null;
  }

  function hintForPick(pid) {
    if (!pid) return '';
    if (pid === 'life/play') return 'Chạm để thả hai viên sủi vào nước';
    const [bid, iid] = pid.split('/');
    // Khi đang ở Toàn cảnh: rê vào bất kỳ phần nào của bàn (mặt bàn hay lọ trên bàn) đều gợi ý chạm vào bàn đó!
    if (!activeId) return benches[bid] ? `Chạm để xem gần ${benches[bid].name}` : '';
    if (activeId !== bid) return benches[bid] ? `Chạm để chuyển sang ${benches[bid].name}` : '';
    if (!iid) return '';
    const B = benches[bid]; if (!B) return '';
    if (iid === 'sink') return 'Chạm để rửa dụng cụ & làm lại';
    if (!handsOn) return 'Đang xem bàn · bấm "Thực hành bàn này" để tự tay làm';
    const hit = B.steps.find((s) => can(B, s) && (s.item === iid || (s.items || []).includes(iid) || (s.options || []).some((o) => o.item === iid)));
    return hit ? `Chạm để: ${hit.label}` : '';
  }

  renderer.domElement.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t; down = null;
    if (moved > 8 || dt > 500) return;
    const pid = hitTest(e); if (!pid) return;
    if (pid === 'life/play') { lifeStation.play(); if (cb.change) cb.change('life'); return; }
    const [bid, iid] = pid.split('/');
    const B = benches[bid]; if (!B) return;
    if (iid && activeId === bid) hand(B, iid);
    else if (cb.pick) cb.pick(bid);
  });
  renderer.domElement.addEventListener('pointermove', (e) => {
    if (e.buttons) { tipEl.hidden = true; return; }
    const pid = hitTest(e);
    if (pid !== hoveredPick) {
      hoveredPick = pid;
      renderer.domElement.style.cursor = pid ? 'pointer' : '';
      if (activeId && benches[activeId]) syncBeacons(benches[activeId]);
      syncBenchOutlines();
      if (cb.hover) cb.hover(pid);
    }
    const hint = hintForPick(pid);
    if (hint) {
      const r = host.getBoundingClientRect();
      tipEl.textContent = hint; tipEl.hidden = false;
      tipEl.style.transform = `translate(${Math.round(e.clientX - r.left + 14)}px, ${Math.round(e.clientY - r.top - 12)}px)`;
    } else tipEl.hidden = true;
  });
  renderer.domElement.addEventListener('pointerleave', () => { hoveredPick = null; tipEl.hidden = true; syncBenchOutlines(); if (activeId && benches[activeId]) syncBeacons(benches[activeId]); if (cb.hover) cb.hover(null); });

  // ---------- LAYOUT NHÃN 3D TRONG VÙNG AN TOÀN ----------
  const tmpP = new THREE.Vector3();
  function layoutTags() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!namesOn) { tagLayer.style.display = 'none'; return; }
    tagLayer.style.display = '';
    const xMin = ins.l * w + 12, xMax = (1 - ins.r) * w - 12;
    const yMin = ins.t * h + 10, yMax = (1 - ins.b) * h - 10;
    const placed = [], list = [];
    tags.forEach((t) => {
      if (!t.visible) { t.el.style.display = 'none'; return; }
      tmpP.copy(t.anchor instanceof THREE.Vector3 ? t.anchor : t.anchor()).project(camera);
      const x = (tmpP.x * 0.5 + 0.5) * w, y = (-tmpP.y * 0.5 + 0.5) * h;
      const on = tmpP.z < 1 && x > xMin - 20 && x < xMax + 20 && y > yMin - 10 && y < yMax + 30;
      t.el.style.display = on ? '' : 'none';
      if (on) list.push({ t, x, y });
    });
    list.sort((a, b) => b.y - a.y).forEach((o) => {
      const bw = o.t.el.offsetWidth || 100, bh = (o.t.el.offsetHeight || 24) + 5;
      const cx = clamp(o.x, xMin + bw / 2, xMax - bw / 2);
      let top = o.y - bh - 18;
      for (let i = 0; i < 6; i++) {
        const hit = placed.find((p) => Math.abs(p.cx - cx) < (p.bw + bw) / 2 + 5 && Math.abs(p.top - top) < bh);
        if (!hit) break; top = hit.top - bh;
      }
      top = clamp(top, yMin, yMax - bh);
      placed.push({ cx, top, bw });
      o.t.el.style.transform = `translate(${Math.round(cx - bw / 2)}px, ${Math.round(top)}px)`;
      o.t.el.style.setProperty('--lead', Math.max(0, Math.round(o.y - (top + bh - 5))) + 'px');
      o.t.el.style.setProperty('--dx', Math.round(clamp(o.x - cx, -bw / 2 + 10, bw / 2 - 10)) + 'px');
    });
  }

  // ---------- VÒNG LẶP CHÍNH ----------
  let benchTheme = 'dark';
  function setBenchTheme(mode) {
    benchTheme = mode;
    MAT.benchTop.map = mode === 'dark' ? EPOXY_TEX : null;
    MAT.benchTop.color.set(mode === 'dark' ? PAL.benchDark : PAL.benchLight);
    MAT.benchTop.roughness = mode === 'dark' ? 0.32 : 0.44;
    MAT.benchTop.needsUpdate = true;
    MAT.glassFront.envMapIntensity = mode === 'dark' ? 2.15 : 1.85;
    MAT.glassFront.attenuationColor.set(mode === 'dark' ? 0xdaf4ee : 0x8eb8c2);
  }
  setBenchTheme('dark');

  function resize() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); applyInsets();
    if (!userMoved) focusCam(curPreset, true);
  }
  new ResizeObserver(resize).observe(host);
  resize();
  focusCam(OVERVIEW, true);
  setTimeout(() => { renderer.shadowMap.needsUpdate = true; }, 400);

  let last = performance.now(), frames = 0, fpsAcc = 0, shadowAcc = 0;
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (camGoal) {
      const k = 1 - Math.exp(-dt * 5.2);
      camera.position.lerp(camGoal.pos, k); controls.target.lerp(camGoal.target, k);
      camera.fov += (camGoal.fov - camera.fov) * k; camera.updateProjectionMatrix();
      if (camera.position.distanceTo(camGoal.pos) < 0.015 && Math.abs(camera.fov - camGoal.fov) < 0.05) {
        camera.position.copy(camGoal.pos); controls.target.copy(camGoal.target);
        camera.fov = camGoal.fov; camera.updateProjectionMatrix(); camGoal = null;
      }
    }
    controls.update();

    // Hover micro-lift tuyệt đối (không bao giờ trôi độ cao y tích luỹ!)
    hoverables.forEach((h, pid) => {
      const [bid, iid] = pid.split('/');
      const B = benches[bid];
      const it = B?.items?.[iid];
      if (!B || B.seq.busy() || (it && (Math.abs(h.obj.position.x - it.home.x) > 0.03 || Math.abs(h.obj.position.z - it.home.z) > 0.03))) {
        h.lift = 0; return;
      }
      const want = (hoveredPick === pid || uiHoverIds.has(pid)) && activeId === bid ? 1 : 0;
      const next = h.lift + (want - h.lift) * Math.min(1, dt * 14);
      if (Math.abs(next - h.lift) > 0.0005 || (want === 0 && h.lift > 0)) {
        h.lift = next < 0.002 && want === 0 ? 0 : next;
        h.obj.position.y = h.baseY + h.lift * 0.045;
      }
    });

    // Cập nhật từng bàn (action sequencer + mô phỏng hoá học)
    let needsShadow = false;
    Object.values(benches).forEach((B) => {
      if (!B.seq) return;
      const was = B.seq.busy();
      if (was) { B.seq.tick(dt); needsShadow = true; }
      if (was && !B.seq.busy()) syncBeacons(B);
      if (B.run && !B.run.done && !B.rinsing && !B.seq.busy()) {
        B.run.t += dt * B.speed() * speedMul;
        if (B.frame(B.run.t, dt)) {
          B.run.done = true; B.run.row = B.makeRow();
          sfx.done(); emit(B);
          if (cb.done) cb.done(B.id, B.run.row);
        }
        needsShadow = true;
      }
    });
    if (needsShadow) { shadowAcc += dt; if (shadowAcc > 0.16) { shadowAcc = 0; renderer.shadowMap.needsUpdate = true; } }

    updaters.forEach((f) => f(dt));
    renderer.render(scene, camera);
    layoutTags();

    frames++; fpsAcc += dt;
    if (fpsAcc >= 0.6) {
      const fps = Math.round(frames / fpsAcc); frames = 0; fpsAcc = 0;
      if (cb.stats) cb.stats({ fps, calls: renderer.info.render.calls, tris: renderer.info.render.triangles });
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  return {
    benches, lifeStation,
    on(k, fn) { cb[k] = fn; },
    setInsets,
    setNames(v) { namesOn = v; syncSceneVisibility(); },
    setHands(v, msg = '') { handsOn = v; handsMsg = msg; if (activeId && benches[activeId]) syncBeacons(benches[activeId]); },
    setBenchTheme, getBenchTheme: () => benchTheme,
    resetView() { topViewOn = false; focusCam(curPreset); },
    setSpeedMul(m) { speedMul = m || 1; },
    getSpeedMul: () => speedMul,
    toggleTopView(bid) {
      const B = benches[bid]; if (!B || !B.camTop) return false;
      topViewOn = !topViewOn;
      focusCam(topViewOn ? B.camTop : B.cam);
      return topViewOn;
    },
    isTopView: () => topViewOn,
    highlightBenchFromUI(bid) { uiHoverBench = bid || null; syncBenchOutlines(); },
    highlightFromUI(bid, itemIds = []) {
      uiHoverIds = new Set(itemIds.map((id) => `${bid}/${id}`));
      if (benches[bid]) syncBeacons(benches[bid]);
    },
    setActive(id, immediate = false) {
      if (activeId && activeId !== id && benches[activeId]?.seq) benches[activeId].seq.flush();
      activeId = id || null; topViewOn = false;
      syncSceneVisibility();
      if (id === 'life') focusCam(lifeStation.cam, immediate);
      else if (id && benches[id]) focusCam(benches[id].solo ? benches[id].camSolo : benches[id].cam, immediate);
      else focusCam(OVERVIEW, immediate);
    },
    setStepOptional(bid, sid, isOptional) {
      const B = benches[bid], s = B?.steps.find((x) => x.id === sid);
      if (s) { s.optional = !!isOptional; syncBeacons(B); }
    },
    solo(bid, key) {
      const B = benches[bid]; if (!B) return;
      B.seq.flush(); B.solo = key || null;
      Object.values(B.items).forEach((it) => { if (it.of) it.obj.visible = !B.solo || it.of === B.solo; });
      B.reset(); syncSceneVisibility(); emit(B);
    },
    enable(bid, sid, yes) {
      const B = benches[bid]; if (!B) return;
      if (yes) B.off.delete(sid); else B.off.add(sid);
      syncBeacons(B);
    },
    preset(bid, todo) {
      const B = benches[bid]; if (!B) return;
      B.seq.flush(); B.reset();
      todo.forEach(([sid, k]) => { const s = B.steps.find((x) => x.id === sid); if (s) act(B, s, pickOpt(B, s, k), true); });
      emit(B);
    },
    resetBench(bid) { const B = benches[bid]; if (!B) return; B.seq.flush(); B.reset(); emit(B); },
    setWant(bid, sid, v) {
      const B = benches[bid], s = B?.steps.find((x) => x.id === sid);
      if (!s || !s.range || !Number.isFinite(v)) return s?.range ? wantOf(B, s) : null;
      B.want[s.var] = snap(s.range, v); return B.want[s.var];
    },
    act(bid, sid, k) {
      const B = benches[bid], s = B?.steps.find((x) => x.id === sid);
      if (!s || activeId !== bid || !handsOn) return false;
      if (act(B, s, pickOpt(B, s, s.range ? undefined : k))) return true;
      if (!B.seq.busy()) {
        const n = nextStep(B);
        say(B.run ? 'Thí nghiệm đã chạy. Rửa dụng cụ rồi mới làm lại được.' : n && n !== s ? `Làm việc này trước: ${n.label}.` : `Việc "${s.label}" đã làm.`);
      }
      return false;
    },
    rinse(bid, instant = false) { return rinse(benches[bid], instant); },
    proc(bid) {
      const B = benches[bid]; if (!B) return null;
      const n = nextStep(B), busy = B.seq.busy();
      return {
        busy, run: B.run, level: B.level,
        steps: B.steps.filter((s) => !B.off.has(s.id)).map((s, i) => ({
          id: s.id, n: i + 1, label: s.label, done: !!B.st[s.id], next: n === s && !busy, can: can(B, s),
          itemIds: s.ring || s.items || [s.item, ...(s.options || []).map((o) => o.item)].filter(Boolean),
          options: s.options ? s.options.map((o, k) => ({ k, label: o.label, item: o.item, on: !!B.st[s.id] && B.level[s.var] === o.v })) : null,
          range: s.range ? { ...s.range, want: wantOf(B, s), ref: B.ref[s.var], value: B.st[s.id] ? B.level[s.var] : null } : null,
        })),
        rinse: B.sinkObj ? { label: 'Rửa dụng cụ ở vòi nước, làm lại', can: !busy && (!!B.run || Object.keys(B.st).length > 0), next: !!(B.run && B.run.done) && !busy } : null,
      };
    },
  };
}
