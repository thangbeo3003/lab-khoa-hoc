// Bản dựng thử nghiệm LookDev 3D cho Lab L1 (Tốc độ phản ứng · 4 bàn + vòng kính).
// Độc lập 100%, KHÔNG sửa bất kỳ tệp nào của bản 1 / bản 2 / bản 3 hay Luồng 2.
// Đơn vị: 1 = 10 cm. Mặt bàn ở y = 0, sàn y = -9, trần y = 19.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';

const FONT = '"Be Vietnam Pro", -apple-system, "Segoe UI", Roboto, sans-serif';
const V2 = (p) => new THREE.Vector2(p[0], p[1]);
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const lathe = (pts, seg = 40, a0 = 0, a1 = Math.PI * 2) => new THREE.LatheGeometry(pts.map(V2), seg, a0, a1);
const cyl = (r1, r2, h, seg = 24, open = false) => new THREE.CylinderGeometry(r1, r2, h, seg, 1, open);
const put = (o, x, y, z) => { o.position.set(x, y, z); return o; };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = THREE.MathUtils.lerp;

// ---------- Texture & Canvas helpers ----------
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
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function makeMicroRoughnessTex(base = 112, amp = 26) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const img = g.createImageData(128, 128);
  let s = 1337;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = clamp(Math.round(base + (rnd() - 0.5) * amp), 0, 255);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 3);
  return t;
}

// ---------- Studio/Lab Procedural HDRI Environment ----------
function buildLabEnvMap(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x2c3440);

  const room = new THREE.Mesh(
    new THREE.BoxGeometry(40, 22, 40),
    new THREE.MeshBasicMaterial({ color: 0x424c5c, side: THREE.BackSide }),
  );
  envScene.add(room);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ color: 0x1d222b }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -9;
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ color: 0x7e8c9e }));
  ceil.rotation.x = Math.PI / 2; ceil.position.y = 11;
  envScene.add(floor, ceil);

  // Cửa sổ trời sáng ấm bên trái
  const winMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.3, 3.2, 3.0) });
  for (let i = -1; i <= 1; i++) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(9.5, 9), winMat);
    w.rotation.y = Math.PI / 2; w.position.set(-19.5, 2.5, i * 11.5);
    envScene.add(w);
  }

  // 6 dải đèn LED trần cường độ HDR cao → tạo vệt highlight trắng sắc chạy dọc thân bình thuỷ tinh
  const ledMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(4.8, 5.0, 5.4) });
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j += 2) {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 1.9), ledMat);
      strip.rotation.x = Math.PI / 2;
      strip.position.set(i * 11, 10.7, j * 7.5);
      envScene.add(strip);
    }
  }

  // Dải rim light mát bên phải
  const rim = new THREE.Mesh(new THREE.PlaneGeometry(24, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.9, 2.1, 2.5) }));
  rim.rotation.y = -Math.PI / 2; rim.position.set(19.5, 4, -2);
  envScene.add(rim);

  const rt = pmrem.fromScene(envScene, 0.025);
  pmrem.dispose();
  return rt.texture;
}

// ---------- Vật liệu dùng chung (Shared Materials → tối ưu GPU & FPS 60+) ----------
const PAL = {
  benchDark: 0x2c333e,   // Đá epoxy than chì S2
  benchLight: 0x9aa6b4,  // Đá xám sáng để so sánh
  cabinet: 0xf0f3f7,
  cabinetDoor: 0xdbe2ea,
  plinth: 0x22272f,
  wall: 0xe6ebf2,
  accent: 0x2563eb,
  rubber: 0x9b4d3e,
  amber: 0x7b4314,
  water: 0xd6eef8,
  metalDark: 0x282d34,
};

const MICRO_ROUGH = makeMicroRoughnessTex();

// Shader thuỷ tinh borosilicate dùng chung (chỉ biên dịch 1 lần duy nhất!)
const sharedGlassUniforms = {
  uEdgeTint: { value: new THREE.Color(0xc9edf5) },
  uEdgeBoost: { value: 1.05 },
};

function makeBoroMat(opacity, side, amber = false) {
  const m = new THREE.MeshPhysicalMaterial({
    color: amber ? PAL.amber : 0xe4f3f6,
    transparent: true,
    opacity: amber ? 0.88 : opacity,
    roughness: amber ? 0.08 : 0.03,
    metalness: 0,
    ior: 1.52,
    reflectivity: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    specularIntensity: 1.0,
    envMapIntensity: amber ? 1.85 : 2.9,
    side,
    depthWrite: false,
  });
  if (!amber) {
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uEdgeTint = sharedGlassUniforms.uEdgeTint;
      sh.uniforms.uEdgeBoost = sharedGlassUniforms.uEdgeBoost;
      sh.fragmentShader = 'uniform vec3 uEdgeTint;\nuniform float uEdgeBoost;\n' + sh.fragmentShader;
      sh.fragmentShader = sh.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
        vec3 nV = normalize(vNormal);
        vec3 vD = normalize(vViewPosition);
        float ndv = abs(dot(nV, vD));
        float fres = pow(1.0 - ndv, 2.5);
        float rim = pow(1.0 - ndv, 4.4);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * 0.5 + uEdgeTint * 0.76, fres * 0.56 * uEdgeBoost);
        gl_FragColor.rgb += vec3(0.46, 0.54, 0.60) * rim * uEdgeBoost;
        gl_FragColor.a = clamp(gl_FragColor.a * mix(0.20, 3.8, fres) + rim * 0.36, 0.04, 0.94);
        #include <dithering_fragment>
        `,
      );
    };
    m.customProgramCacheKey = () => 'pro_boro_shared_v2';
  }
  return m;
}

const MAT = {
  glassFront: makeBoroMat(0.22, THREE.FrontSide, false),
  glassBack: makeBoroMat(0.14, THREE.BackSide, false),
  glassThick: new THREE.MeshPhysicalMaterial({ color: 0xd5eff6, transparent: true, opacity: 0.68, roughness: 0.03, clearcoat: 1, envMapIntensity: 3.0, depthWrite: false }),
  amberFront: makeBoroMat(0.88, THREE.FrontSide, true),
  amberBack: makeBoroMat(0.55, THREE.BackSide, true),
  meniscus: new THREE.MeshPhysicalMaterial({ color: 0xeaf7fc, transparent: true, opacity: 0.68, roughness: 0.03, clearcoat: 1, envMapIntensity: 2.6, depthWrite: false }),
  steel: new THREE.MeshStandardMaterial({ color: 0xd0d7df, metalness: 0.92, roughness: 0.24, roughnessMap: MICRO_ROUGH, envMapIntensity: 1.35 }),
  bowlSteel: new THREE.MeshStandardMaterial({ color: 0x8a939e, metalness: 0.88, roughness: 0.32, roughnessMap: MICRO_ROUGH }),
  darkMetal: new THREE.MeshStandardMaterial({ color: PAL.metalDark, metalness: 0.55, roughness: 0.44, roughnessMap: MICRO_ROUGH }),
  whitePlastic: new THREE.MeshStandardMaterial({ color: 0xf1f4f8, roughness: 0.34, metalness: 0 }),
  darkPlastic: new THREE.MeshStandardMaterial({ color: 0x222730, roughness: 0.42, metalness: 0 }),
  cabinet: new THREE.MeshStandardMaterial({ color: PAL.cabinet, roughness: 0.56 }),
  cabinetDoor: new THREE.MeshStandardMaterial({ color: PAL.cabinetDoor, roughness: 0.48 }),
  plinth: new THREE.MeshStandardMaterial({ color: PAL.plinth, roughness: 0.72 }),
  accent: new THREE.MeshStandardMaterial({ color: PAL.accent, roughness: 0.42 }),
  rubberRed: new THREE.MeshStandardMaterial({ map: loadTex('tex_rubber', 1), color: PAL.rubber, roughness: 0.82 }),
  wood: new THREE.MeshStandardMaterial({ map: loadTex('tex_wood', 1.4), color: 0xdec296, roughness: 0.62 }),
  limestone: new THREE.MeshStandardMaterial({ map: loadTex('tex_limestone', 1), color: 0xe8e2d4, roughness: 0.92 }),
  mno2: new THREE.MeshStandardMaterial({ map: loadTex('tex_mno2', 2), color: 0x2e2b29, roughness: 0.96 }),
  magnesium: new THREE.MeshStandardMaterial({ map: loadTex('tex_magnesium', 1), color: 0xdbe0e6, metalness: 0.9, roughness: 0.3 }),
  silicone: new THREE.MeshPhysicalMaterial({ color: 0xeaf2f7, transparent: true, opacity: 0.68, roughness: 0.2, clearcoat: 0.6, envMapIntensity: 1.5, depthWrite: false }),
  benchTop: new THREE.MeshPhysicalMaterial({
    color: PAL.benchDark,
    map: loadTex('tex_epoxy', 2.4, 1.4),
    roughness: 0.36,
    roughnessMap: MICRO_ROUGH,
    metalness: 0.04,
    clearcoat: 0.16,
    clearcoatRoughness: 0.34,
    envMapIntensity: 1.05,
  }),
};

function setGlassTheme(theme) {
  if (theme === 'dark') {
    sharedGlassUniforms.uEdgeTint.value.set(0xc9edf5);
    sharedGlassUniforms.uEdgeBoost.value = 1.08;
  } else {
    sharedGlassUniforms.uEdgeTint.value.set(0x3a5266);
    sharedGlassUniforms.uEdgeBoost.value = 0.88;
  }
}

function glassShell(outerGeo, innerGeo, amber = false) {
  const g = new THREE.Group();
  const inner = new THREE.Mesh(innerGeo, amber ? MAT.amberBack : MAT.glassBack); inner.renderOrder = 2;
  const outer = new THREE.Mesh(outerGeo, amber ? MAT.amberFront : MAT.glassFront); outer.renderOrder = 4;
  g.add(inner, outer);
  return g;
}

function glassPair(geo, amber = false) {
  const g = new THREE.Group();
  const back = new THREE.Mesh(geo, amber ? MAT.amberBack : MAT.glassBack); back.renderOrder = 2;
  const front = new THREE.Mesh(geo, amber ? MAT.amberFront : MAT.glassFront); front.renderOrder = 4;
  g.add(back, front);
  return g;
}

function liquidMat(color = PAL.water, opacity = 0.48) {
  return new THREE.MeshPhysicalMaterial({
    color, transparent: opacity < 0.99, opacity, roughness: 0.04, metalness: 0,
    ior: 1.333, clearcoat: 0.85, clearcoatRoughness: 0.04, envMapIntensity: 1.65, depthWrite: opacity >= 0.99,
  });
}

function makeMeniscus(radius, y) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.0085, 8, 36), MAT.meniscus);
  m.rotation.x = Math.PI / 2; m.position.y = y; m.renderOrder = 3;
  return m;
}

let _aoMat = null;
function contactAO(radius, strength = 0.46) {
  if (!_aoMat) {
    const tex = canvasTex(96, 96, (g) => {
      const gr = g.createRadialGradient(48, 48, 4, 48, 48, 46);
      gr.addColorStop(0, 'rgba(6,10,16,0.92)');
      gr.addColorStop(0.52, 'rgba(6,10,16,0.36)');
      gr.addColorStop(1, 'rgba(6,10,16,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 96, 96);
    });
    _aoMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: strength, depthWrite: false });
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), _aoMat);
  m.rotation.x = -Math.PI / 2; m.position.y = 0.004;
  return m;
}

function roundedBox(w, h, d, r = 0.05, bevel = 0.018) {
  const s = new THREE.Shape();
  const hw = w / 2 - bevel, hd = d / 2 - bevel, cr = Math.min(r, hw * 0.5, hd * 0.5);
  s.moveTo(-hw + cr, -hd);
  s.lineTo(hw - cr, -hd); s.quadraticCurveTo(hw, -hd, hw, -hd + cr);
  s.lineTo(hw, hd - cr); s.quadraticCurveTo(hw, hd, hw - cr, hd);
  s.lineTo(-hw + cr, hd); s.quadraticCurveTo(-hw, hd, -hw, hd - cr);
  s.lineTo(-hw, -hd + cr); s.quadraticCurveTo(-hw, -hd, -hw + cr, -hd);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: Math.max(0.01, h - bevel * 2), bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 6,
  });
  geo.rotateX(-Math.PI / 2); geo.translate(0, bevel, 0);
  return geo;
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
    lathe(profile, 14, -arc / 2, arc),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide }),
  );
  m.renderOrder = 5;
  return m;
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

// ---------- Hiệu ứng Bọt khí ----------
const BUBBLE_GEO = new THREE.SphereGeometry(0.024, 7, 5);
const BUBBLE_MAT = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.88, roughness: 0.05, clearcoat: 1, envMapIntensity: 2.0, depthWrite: false });

class BubblesFX {
  constructor(count, { y0, y1, radius }, scale = 1) {
    this.count = count; this.y0 = y0; this.y1 = y1; this.radius = radius; this.scale = scale;
    this.mesh = new THREE.InstancedMesh(BUBBLE_GEO, BUBBLE_MAT, count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.renderOrder = 5;
    this.items = Array.from({ length: count }, () => ({
      a: Math.random() * Math.PI * 2, r: Math.sqrt(Math.random()) * 0.82,
      y: y0 + Math.random() * (y1 - y0), sp: 0.45 + Math.random() * 0.85,
      s: (0.55 + Math.random() * 0.8) * scale, wob: Math.random() * 6.28,
    }));
    this.dummy = new THREE.Object3D();
    this.update(0, 0);
  }
  update(dt, intensity) {
    const active = Math.round(this.count * clamp(intensity));
    this.mesh.visible = active > 0;
    if (!this.mesh.visible) return;
    for (let i = 0; i < this.count; i++) {
      const p = this.items[i];
      if (i >= active) { this.dummy.scale.setScalar(0); this.dummy.updateMatrix(); this.mesh.setMatrixAt(i, this.dummy.matrix); continue; }
      p.y += dt * p.sp * (0.45 + intensity * 1.15);
      p.wob += dt * 4.5;
      if (p.y > this.y1) { p.y = this.y0 + Math.random() * 0.05; p.a = Math.random() * Math.PI * 2; p.r = Math.sqrt(Math.random()) * 0.82; }
      const rad = this.radius(p.y) * p.r;
      this.dummy.position.set(Math.cos(p.a) * rad + Math.sin(p.wob) * 0.012, p.y, Math.sin(p.a) * rad + Math.cos(p.wob) * 0.012);
      const grow = 0.7 + 0.5 * ((p.y - this.y0) / Math.max(0.05, this.y1 - this.y0));
      this.dummy.scale.setScalar(p.s * grow);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

// ---------- DỤNG CỤ THÍ NGHIỆM NÂNG CẤP ----------
const CAP_TEX = canvasTex(256, 32, (c, w, hh) => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, hh);
  c.fillStyle = 'rgba(0,0,0,0.26)';
  for (let x = 0; x < w; x += 8) c.fillRect(x, 0, 3, hh);
});
CAP_TEX.wrapS = THREE.RepeatWrapping; CAP_TEX.repeat.x = 3;
const CAP_BLUE = new THREE.MeshStandardMaterial({ color: PAL.accent, map: CAP_TEX, roughness: 0.42 });
const CAP_BLACK = new THREE.MeshStandardMaterial({ color: 0x1e2228, map: CAP_TEX, roughness: 0.42 });

// 1. Bình tam giác 250 mL
const FLASK_H = 1.48, FLASK_RB = 0.44, FLASK_RN = 0.175, FLASK_YS = 1.02, FLASK_T = 0.024, FLASK_BT = 0.055;
const FLASK_OUTER_GEO = lathe([[0, 0], [FLASK_RB - 0.04, 0], [FLASK_RB, 0.045], [FLASK_RN, FLASK_YS], [FLASK_RN, FLASK_H - 0.06], [FLASK_RN + 0.032, FLASK_H - 0.02], [FLASK_RN + 0.034, FLASK_H]], 44);
const FLASK_INNER_GEO = lathe([[0, FLASK_BT], [FLASK_RB - 0.045 - FLASK_T, FLASK_BT], [FLASK_RB - FLASK_T, FLASK_BT + 0.025], [FLASK_RN - FLASK_T, FLASK_YS], [FLASK_RN - FLASK_T, FLASK_H - 0.03], [FLASK_RN + 0.034, FLASK_H]], 44);
const FLASK_BASE_RING_GEO = new THREE.TorusGeometry(FLASK_RB - 0.025, 0.016, 10, 36);
const FLASK_RIM_GEO = new THREE.TorusGeometry(FLASK_RN + 0.022, 0.015, 10, 36);
const flaskRAt = (y) => lerp(FLASK_RB - FLASK_T - 0.005, FLASK_RN - FLASK_T - 0.005, clamp((y - 0.045) / (FLASK_YS - 0.045)));
const FLASK_DECAL_PROTO = (() => {
  const ys = [[0.22, '50'], [0.38, '100'], [0.54, '150'], [0.72, '200']];
  const y0 = 0.15, y1 = 0.82, rr = (y) => lerp(FLASK_RB, FLASK_RN, clamp((y - 0.045) / (FLASK_YS - 0.045))) + 0.005;
  return gradDecal([[rr(y0), y0], [rr(y1), y1]], ys.map(([y, l]) => [(y - y0) / (y1 - y0), l, true]));
})();

function makeFlaskPro({ fill = 0.65 } = {}) {
  const g = new THREE.Group();
  const glass = glassShell(FLASK_OUTER_GEO, FLASK_INNER_GEO, false);
  const baseRing = new THREE.Mesh(FLASK_BASE_RING_GEO, MAT.glassThick);
  baseRing.rotation.x = Math.PI / 2; baseRing.position.y = 0.024; baseRing.renderOrder = 4;
  const rim = new THREE.Mesh(FLASK_RIM_GEO, MAT.glassThick);
  rim.rotation.x = Math.PI / 2; rim.position.y = FLASK_H - 0.012; rim.renderOrder = 5;
  glass.add(baseRing, rim);

  const lv = FLASK_BT + 0.02 + (0.44 - FLASK_BT - 0.02) * fill;
  const liqMat = liquidMat(PAL.water, 0.48);
  const liquid = new THREE.Mesh(
    lathe([[0, FLASK_BT + 0.005], [FLASK_RB - 0.05 - FLASK_T, FLASK_BT + 0.005], [FLASK_RB - FLASK_T - 0.005, FLASK_BT + 0.028], [flaskRAt(lv), lv], [flaskRAt(lv) - 0.015, lv - 0.012], [0, lv - 0.014]], 40),
    liqMat,
  );
  liquid.renderOrder = 1;

  const meniscus = makeMeniscus(flaskRAt(lv) - 0.004, lv);
  const foamMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, transparent: true, opacity: 0, depthWrite: false });
  const foam = new THREE.Mesh(cyl(flaskRAt(lv) - 0.008, flaskRAt(lv) - 0.002, 0.045, 32), foamMat);
  foam.position.y = lv + 0.01; foam.renderOrder = 3;

  const bub = new BubblesFX(48, { y0: FLASK_BT + 0.02, y1: lv - 0.01, radius: flaskRAt }, 1);
  const solids = new THREE.Group(); solids.position.y = FLASK_BT + 0.01;

  g.add(contactAO(0.68), liquid, meniscus, foam, solids, bub.mesh, glass, FLASK_DECAL_PROTO.clone());
  g.userData = {
    liquid, liqMat, bub, solids,
    setTint(colHex, k, { opacity = 0.96, rough = 0.78 } = {}) {
      liqMat.color.set(PAL.water).lerp(new THREE.Color(colHex), k);
      liqMat.opacity = 0.48 + (opacity - 0.48) * k;
      liqMat.roughness = 0.04 + (rough - 0.04) * k;
      liqMat.clearcoat = 0.85 * (1 - k * 0.7);
    },
    setFoam(k, height = 0.04) {
      foamMat.opacity = clamp(k) * 0.92;
      foam.scale.y = Math.max(0.2, height / 0.045);
      foam.position.y = lv + height * 0.45;
    },
  };
  return g;
}

// 2. Ống nghiệm borosilicate
function makeTestTubePro({ h = 1.62, r = 0.092, fill = 0.56 } = {}) {
  const g = new THREE.Group();
  const prof = (rr) => {
    const p = [];
    for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + (Math.PI / 2) * (i / 8); p.push([rr * Math.cos(a), r + rr * Math.sin(a)]); }
    return p;
  };
  const glass = glassPair(lathe([...prof(r), [r, h - 0.025], [r + 0.022, h]], 28), false);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r + 0.012, 0.009, 8, 24), MAT.glassThick);
  rim.rotation.x = Math.PI / 2; rim.position.y = h - 0.008; rim.renderOrder = 5;
  glass.add(rim);

  const lv = h * fill;
  const liqMat = liquidMat(PAL.water, 0.46);
  const liquid = new THREE.Mesh(lathe([...prof(r - 0.013), [r - 0.013, lv], [0, lv - 0.01]], 24), liqMat);
  liquid.renderOrder = 1;
  const meniscus = makeMeniscus(r - 0.014, lv);
  const bub = new BubblesFX(24, { y0: r + 0.02, y1: lv - 0.01, radius: () => r * 0.72 }, 0.58);

  g.add(liquid, meniscus, bub.mesh, glass);
  g.userData = {
    bub,
    setTint(colHex, k, { opacity = 0.85 } = {}) {
      liqMat.color.set(PAL.water).lerp(new THREE.Color(colHex), k);
      liqMat.opacity = 0.46 + (opacity - 0.46) * k;
    },
  };
  return g;
}

// 3. Lọ hoá chất Duran
function makeBottlePro({ title = 'HCl', sub = '0,5 M', name = '', amber = false, wide = false, powder = false, h = 1.08, r = 0.36, fill = 0.65 } = {}) {
  const g = new THREE.Group();
  const T = 0.026, rn = wide ? r * 0.68 : 0.155, ys = h * 0.78, yn = h, nt = h + 0.2;
  const outer = [[0, 0], [r - 0.055, 0], [r, 0.055], [r, ys - 0.06], [r - 0.03, ys + 0.035], [rn + 0.075, yn - 0.02], [rn, yn + 0.03], [rn, nt]];
  const inner = [[0, 0.06], [r - 0.055 - T, 0.06], [r - T, 0.095], [r - T, ys - 0.07], [r - 0.03 - T, ys + 0.01], [rn + 0.055 - T, yn - 0.04], [rn - T, yn + 0.02], [rn - T, nt]];
  const body = glassShell(lathe(outer, 36), lathe(inner, 36), amber);

  const lv = Math.min(h * fill, ys - 0.07);
  const contentGeo = lathe([[0, 0.065], [r - 0.06 - T, 0.065], [r - T - 0.005, 0.098], [r - T - 0.005, lv], [0, lv]], 32);
  let innerMesh;
  if (powder) {
    innerMesh = new THREE.Mesh(contentGeo, MAT.mno2);
  } else {
    innerMesh = new THREE.Mesh(contentGeo, liquidMat(PAL.water, 0.44));
    innerMesh.visible = !amber;
  }
  innerMesh.renderOrder = 1;
  if (!amber && !powder) g.add(makeMeniscus(r - T - 0.007, lv));

  const capR = rn + 0.055;
  const cap = new THREE.Mesh(cyl(capR, capR, 0.22, 32), amber ? CAP_BLACK : CAP_BLUE);
  cap.position.y = nt - 0.02; cap.castShadow = true;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(rn + 0.022, 0.022, 8, 28), amber ? MAT.darkPlastic : MAT.accent);
  ring.rotation.x = Math.PI / 2; ring.position.y = yn + 0.045;

  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(r + 0.005, r + 0.005, ys * 0.64, 32, 1, true, -0.95, 1.9),
    new THREE.MeshStandardMaterial({ map: labelTexture(title, sub, name), roughness: 0.65 }),
  );
  label.position.y = ys * 0.47; label.renderOrder = 6;

  g.add(contactAO(r * 1.65), innerMesh, body, ring, cap, label);
  return g;
}

// 4. Lọ nhỏ giọt hổ phách
function makeDropperBottlePro() {
  const g = new THREE.Group(), r = 0.19, h = 0.55;
  const body = glassShell(
    lathe([[0, 0], [r - 0.03, 0], [r, 0.035], [r, h - 0.08], [0.105, h], [0.082, h + 0.02], [0.082, h + 0.12]], 32),
    lathe([[0, 0.045], [r - 0.05, 0.045], [r - 0.022, 0.065], [r - 0.022, h - 0.09], [0.088, h - 0.01], [0.065, h + 0.02], [0.065, h + 0.12]], 32),
    true,
  );
  const cap = new THREE.Mesh(cyl(0.11, 0.11, 0.12, 24), MAT.darkPlastic); cap.position.y = h + 0.10; cap.castShadow = true;
  const bulb = new THREE.Mesh(lathe([[0.052, 0], [0.068, 0.08], [0.062, 0.21], [0.03, 0.28], [0, 0.29]], 20), MAT.rubberRed);
  bulb.position.y = h + 0.16; bulb.castShadow = true;
  const tex = canvasTex(384, 224, (c, w, hh) => {
    c.fillStyle = '#fff'; c.fillRect(0, 0, w, hh); c.fillStyle = '#2563eb'; c.fillRect(0, 0, w, 18);
    c.fillStyle = '#0f243d'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `800 72px ${FONT}`; c.fillText('PP', w / 2, 92);
    c.font = `600 34px ${FONT}`; c.fillStyle = '#334155'; c.fillText('Phenolphthalein', w / 2, 168, w - 30);
  });
  const label = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.004, r + 0.004, 0.28, 28, 1, true, -0.95, 1.9), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.65 }));
  label.position.y = 0.25; label.renderOrder = 6;
  g.add(contactAO(r * 1.75), body, cap, bulb, label);
  return g;
}

// 5. Ống đong 100 mL
function makeCylinderPro({ r = 0.165, h = 1.72, max = 100, mL = 40 } = {}) {
  const g = new THREE.Group(), T = 0.019, y0 = 0.11;
  const glass = glassShell(
    lathe([[0, y0], [r, y0], [r, h - 0.04], [r + 0.032, h]], 32),
    lathe([[0, y0 + 0.05], [r - T, y0 + 0.05], [r - T, h - 0.03], [r + 0.032, h]], 32),
    false,
  );
  const foot = new THREE.Mesh(cyl(r * 2.1, r * 2.35, y0, 6), MAT.glassThick);
  foot.position.y = y0 / 2; foot.renderOrder = 4;
  const yLo = y0 + 0.14, yHi = h - 0.24, marks = [];
  for (let v = 10; v <= max; v += 10) marks.push([(v / max), v % 20 === 0 ? String(v) : '', v % 20 === 0]);
  const decal = gradDecal([[r + 0.004, yLo], [r + 0.004, yHi]], marks, { arc: 1.55 });

  const lv = yLo + (yHi - yLo) * clamp(mL / max);
  const liq = new THREE.Mesh(lathe([[0, y0 + 0.055], [r - T - 0.004, y0 + 0.055], [r - T - 0.004, lv], [0, lv - 0.008]], 28), liquidMat(PAL.water, 0.48));
  liq.renderOrder = 1;
  g.add(contactAO(r * 2.9), liq, makeMeniscus(r - T - 0.005, lv), glass, foot, decal);
  return g;
}

// 6. Xi-lanh đo khí 100 mL + thang chia CONG ôm thân trụ + 2 gioăng cao su + bosshead có núm vặn
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
      c.strokeStyle = 'rgba(15,24,36,0.58)'; c.lineWidth = big ? 11 : 6;
      c.beginPath(); c.moveTo(x, 10); c.lineTo(x, 10 + len); c.stroke();
      c.strokeStyle = '#ffffff'; c.lineWidth = big ? 6 : 3;
      c.beginPath(); c.moveTo(x, 10); c.lineTo(x, 10 + len); c.stroke();
      if (v % 20 === 0) {
        c.font = `800 94px ${FONT}`;
        c.lineWidth = 10; c.strokeStyle = 'rgba(15,24,36,0.75)'; c.strokeText(String(v), x, 118);
        c.fillStyle = '#ffffff'; c.fillText(String(v), x, 118);
      }
    }
  });
  const scaleGeo = new THREE.CylinderGeometry(r + 0.005, r + 0.005, travel + 0.16, 18, 1, true, -0.58, 1.16);
  scaleGeo.rotateZ(-Math.PI / 2); scaleGeo.rotateX(Math.PI / 2);
  const scaleMesh = new THREE.Mesh(scaleGeo, new THREE.MeshBasicMaterial({ map: scaleTex, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
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

  const stopper = new THREE.Mesh(cyl(0.205, 0.155, 0.28, 24), MAT.rubberRed); stopper.position.set(0, 1.50, 0); stopper.castShadow = true;
  const curve = new THREE.CatmullRomCurve3([V3(0, 1.60, 0), V3(0, SY - 0.36, 0), V3(dir * 0.05, SY - 0.08, 0), V3(dir * 0.15, SY, 0)]);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.032, 10), MAT.silicone); tube.renderOrder = 3;

  g.add(contactAO(0.65), syr, base, post, boss, screw, arm, jaw, stopper, tube);
  const setVolume = (mL) => { piston.position.x = dir * (X0 + travel * clamp(mL / max)); };
  setVolume(0);
  g.userData = { setVolume };
  return g;
}

// 7. Cân điện tử bo góc có màn LCD lõm kính bóng
const BAL_BODY_GEO = roundedBox(1.24, 0.22, 1.38, 0.09, 0.025);
const BAL_BEZEL_GEO = roundedBox(1.12, 0.28, 0.34, 0.05, 0.016);

function makeBalancePro(initialG = 0.25) {
  const g = new THREE.Group(), W = 1.24, D = 1.38, H = 0.22;
  const body = new THREE.Mesh(BAL_BODY_GEO, MAT.whitePlastic); body.castShadow = true; body.receiveShadow = true;
  const bezel = new THREE.Mesh(BAL_BEZEL_GEO, MAT.darkPlastic);
  bezel.position.set(0, 0.03, D / 2 - 0.14); bezel.rotation.x = -0.22; bezel.castShadow = true;

  const cv = document.createElement('canvas'); cv.width = 360; cv.height = 120;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const c = cv.getContext('2d');
  const gr = c.createLinearGradient(0, 0, 0, 120); gr.addColorStop(0, '#c8dfcd'); gr.addColorStop(1, '#d8ebdc');
  c.fillStyle = gr; c.fillRect(0, 0, 360, 120);
  c.strokeStyle = 'rgba(20,40,30,0.22)'; c.lineWidth = 5; c.strokeRect(2.5, 2.5, 355, 115);
  c.fillStyle = '#0f1c18'; c.textBaseline = 'middle'; c.textAlign = 'right';
  c.font = `700 80px ${FONT}`; c.fillText(initialG.toFixed(2).replace('.', ','), 284, 64);
  c.textAlign = 'left'; c.font = `700 40px ${FONT}`; c.fillText('g', 294, 74);
  c.fillStyle = '#335547'; c.font = `700 18px ${FONT}`; c.fillText('TARE', 18, 22);

  const lcd = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.21), new THREE.MeshStandardMaterial({ map: tex, emissive: 0x89a892, emissiveMap: tex, emissiveIntensity: 0.25, roughness: 0.14 }));
  lcd.position.set(-0.12, 0.165, D / 2 + 0.038); lcd.rotation.x = -0.22;
  const btn1 = new THREE.Mesh(cyl(0.042, 0.046, 0.025, 16), MAT.accent);
  btn1.rotation.x = Math.PI / 2 - 0.22; btn1.position.set(0.39, 0.17, D / 2 + 0.04);
  const panBase = new THREE.Mesh(cyl(0.49, 0.51, 0.035, 32), MAT.darkMetal); panBase.position.set(0, H + 0.018, -0.14);
  const pan = new THREE.Mesh(cyl(0.47, 0.47, 0.032, 32), MAT.steel); pan.position.set(0, H + 0.05, -0.14); pan.castShadow = true; pan.receiveShadow = true;
  const panRim = new THREE.Mesh(new THREE.TorusGeometry(0.468, 0.012, 8, 36), MAT.steel); panRim.rotation.x = Math.PI / 2; panRim.position.set(0, H + 0.065, -0.14);

  g.add(contactAO(0.95), body, bezel, lcd, btn1, panBase, pan, panRim);
  return g;
}

// 8. Đồng hồ bấm giây bo góc
const TIMER_BODY_GEO = roundedBox(0.78, 0.54, 0.36, 0.06, 0.02);
const BTN_GREEN = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.35 });
const BTN_RED = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35 });

function makeTimerPro() {
  const g = new THREE.Group(), W = 0.78, H = 0.54, D = 0.36;
  const body = new THREE.Mesh(TIMER_BODY_GEO, MAT.darkPlastic); body.castShadow = true; body.receiveShadow = true;

  const cv = document.createElement('canvas'); cv.width = 320; cv.height = 160;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  let last = '';
  const setTime = (sec) => {
    const s = sec.toFixed(1).replace('.', ','); if (s === last) return; last = s;
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
  g.userData = { setTime };
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
      const a = (i / 9) * Math.PI * 2 + rnd() * 0.4, d = (i === 0 ? 0 : 0.08 + rnd() * 0.16) * scale, r = (0.044 + rnd() * 0.025) * scale;
      const m = new THREE.Mesh(makeBlobGeo(r, i * 1.7 + 0.5, 0.28), MAT.limestone);
      m.position.set(Math.cos(a) * d, r * 0.72, Math.sin(a) * d);
      m.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
      m.castShadow = true; g.add(m);
    }
  }
  return g;
}

const DISH_GEO = lathe([[0, 0.012], [0.28, 0.028], [0.43, 0.09], [0.46, 0.11]], 32);
function makeWatchGlassPro({ form = null, mg = false } = {}) {
  const g = new THREE.Group();
  const holder = new THREE.Group(); holder.position.y = 0.03;
  if (form) holder.add(makeLimestone(form, 1));
  if (mg) {
    for (let i = 0; i < 2; i++) {
      const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.015, 0.065), MAT.magnesium);
      ribbon.position.set((i - 0.5) * 0.12, 0.02, (i - 0.5) * 0.16);
      ribbon.rotation.y = 0.4 + i * 0.6; ribbon.castShadow = true; holder.add(ribbon);
    }
  }
  g.add(contactAO(0.58), holder, glassPair(DISH_GEO, false));
  return g;
}

// 10. Giá gỗ sồi + Đèn cồn lửa 2 tầng + PointLight ấm thật
function makeWoodRackPro() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(roundedBox(1.85, 0.09, 0.68, 0.04, 0.012), MAT.wood);
  const top = new THREE.Mesh(roundedBox(1.85, 0.08, 0.68, 0.04, 0.012), MAT.wood); top.position.y = 0.84;
  [-0.78, 0.78].forEach((x) => {
    const side = new THREE.Mesh(roundedBox(0.09, 0.88, 0.64, 0.03, 0.01), MAT.wood);
    side.position.set(x, 0.04, 0); side.castShadow = true; g.add(side);
  });
  const holeMat = new THREE.MeshStandardMaterial({ color: 0x523b24, roughness: 0.9 });
  [-0.45, 0, 0.45].forEach((x) => { const h = new THREE.Mesh(cyl(0.11, 0.11, 0.015, 18), holeMat); h.position.set(x, 0.915, 0); g.add(h); });
  [base, top].forEach((m) => { m.castShadow = true; m.receiveShadow = true; });
  g.add(contactAO(1.15), base, top);
  return g;
}

function makeAlcoholLampPro() {
  const g = new THREE.Group();
  const glass = glassShell(
    lathe([[0, 0], [0.34, 0], [0.39, 0.12], [0.40, 0.36], [0.30, 0.62], [0.16, 0.74], [0.16, 0.84]], 36),
    lathe([[0, 0.05], [0.30, 0.05], [0.36, 0.14], [0.37, 0.36], [0.27, 0.60], [0.135, 0.73], [0.135, 0.84]], 36),
    false,
  );
  const alcohol = new THREE.Mesh(lathe([[0, 0.055], [0.295, 0.055], [0.355, 0.14], [0.365, 0.35], [0.32, 0.48], [0, 0.48]], 28), liquidMat(0xdcf0fa, 0.42));
  alcohol.renderOrder = 1;
  const collar = new THREE.Mesh(cyl(0.165, 0.175, 0.14, 24), MAT.steel); collar.position.y = 0.86; collar.castShadow = true;
  const wickTube = new THREE.Mesh(cyl(0.048, 0.055, 0.14, 16), MAT.steel); wickTube.position.y = 0.96;
  const wick = new THREE.Mesh(cyl(0.028, 0.032, 0.18, 10), new THREE.MeshStandardMaterial({ color: 0xe7dfd1, roughness: 0.95 })); wick.position.y = 1.02;

  const flameGroup = put(new THREE.Group(), 0, 1.08, 0);
  const outerFlame = new THREE.Mesh(lathe([[0, 0], [0.075, 0.08], [0.082, 0.18], [0.048, 0.32], [0, 0.44]], 18), new THREE.MeshBasicMaterial({ color: 0xffa62b, transparent: true, opacity: 0.9, depthWrite: false }));
  const innerFlame = new THREE.Mesh(lathe([[0, 0], [0.045, 0.05], [0.042, 0.14], [0, 0.24]], 16), new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.92, depthWrite: false }));
  const glowLight = new THREE.PointLight(0xff9b3d, 2.2, 5.5, 1.8); glowLight.position.y = 0.25;
  flameGroup.add(outerFlame, innerFlame, glowLight);

  g.add(contactAO(0.55), alcohol, glass, collar, wickTube, wick, flameGroup);
  g.userData = {
    flicker(t) {
      const f = 1 + 0.08 * Math.sin(t * 17) + 0.05 * Math.sin(t * 29);
      outerFlame.scale.set(1 / Math.sqrt(f), f, 1 / Math.sqrt(f));
      outerFlame.rotation.z = Math.sin(t * 11) * 0.06;
      glowLight.intensity = 2.0 + 0.45 * Math.sin(t * 19);
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
  g.userData = { setHot(k) { plateMat.emissiveIntensity = clamp(k) * 0.45; led.material.color.set(k > 0.05 ? 0xff4a1a : 0x475569); } };
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
  g.add(bulb, backStrip, col, rod);
  g.userData = { setTemp };
  return g;
}

// 13. Thìa xúc inox
function makeSpatulaPro() {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(cyl(0.018, 0.018, 1.35, 12), MAT.steel); shaft.rotation.z = Math.PI / 2; shaft.position.y = 0.025; shaft.castShadow = true;
  const scoop = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 8, 0, Math.PI * 2, Math.PI * 0.52, Math.PI * 0.48), MAT.steel);
  scoop.scale.set(1.5, 0.65, 0.95); scoop.position.set(-0.74, 0.05, 0);
  const grip = new THREE.Mesh(cyl(0.026, 0.026, 0.36, 14), MAT.darkPlastic); grip.rotation.z = Math.PI / 2; grip.position.set(0.55, 0.025, 0);
  g.add(shaft, scoop, grip);
  return g;
}

// 14. Tờ giấy chữ X sắc nét
const X_PAPER_MAT = new THREE.MeshStandardMaterial({
  map: canvasTex(384, 384, (c, w, h) => {
    c.fillStyle = '#fcfcf9'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#cbd5e1'; c.lineWidth = 5; c.strokeRect(2.5, 2.5, w - 5, h - 5);
    c.strokeStyle = '#0f172a'; c.lineWidth = 44; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(w * 0.27, h * 0.27); c.lineTo(w * 0.73, h * 0.73);
    c.moveTo(w * 0.73, h * 0.27); c.lineTo(w * 0.27, h * 0.73);
    c.stroke();
  }),
  roughness: 0.88,
});
function makeXPaperPro(s = 1.18) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), X_PAPER_MAT);
  m.rotation.x = -Math.PI / 2; m.position.y = 0.008; m.receiveShadow = true;
  return m;
}

// 15. Vòng kính soi hạt
function makeParticleLensPro({ R = 0.95, y = 2.45 } = {}) {
  const g = new THREE.Group(), S = 320;
  const base = new THREE.Mesh(cyl(0.46, 0.54, 0.12, 32), MAT.darkMetal); base.position.y = 0.06; base.castShadow = true;
  const post = new THREE.Mesh(cyl(0.045, 0.045, y - R - 0.04, 16), MAT.steel); post.position.y = (y - R) / 2; post.castShadow = true;
  const rimOuter = new THREE.Mesh(new THREE.TorusGeometry(R + 0.03, 0.075, 16, 56), MAT.steel); rimOuter.position.y = y; rimOuter.castShadow = true;
  const rimInner = new THREE.Mesh(new THREE.TorusGeometry(R - 0.02, 0.024, 12, 48), MAT.accent); rimInner.position.y = y;

  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(R - 0.02, 48), new THREE.MeshBasicMaterial({ map: tex }));
  disc.position.set(0, y, 0.015);
  const back = new THREE.Mesh(new THREE.CircleGeometry(R - 0.02, 32), MAT.darkPlastic);
  back.position.set(0, y, -0.015); back.rotation.y = Math.PI;
  const dome = new THREE.Mesh(new THREE.CircleGeometry(R - 0.02, 48), MAT.glassFront);
  dome.position.set(0, y, 0.028); dome.renderOrder = 6;

  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const parts = Array.from({ length: 30 }, (_, i) => {
    const a = rnd() * 6.283, d = Math.sqrt(rnd()) * 0.82, v = 0.22 + rnd() * 0.26, b = rnd() * 6.283;
    return { x: Math.cos(a) * d, y: Math.sin(a) * d, vx: Math.cos(b) * v, vy: Math.sin(b) * v, hot: i % 3 === 0 };
  });
  const flashes = []; let acc = 1;

  function draw() {
    const c = cv.getContext('2d'), h = S / 2, k = h * 0.94;
    c.fillStyle = '#0f172e'; c.fillRect(0, 0, S, S);
    flashes.forEach((f) => {
      c.strokeStyle = `rgba(255,240,180,${(1 - f.t) * 0.95})`; c.lineWidth = 3;
      c.beginPath(); c.arc(h + f.x * k, h - f.y * k, 8 + f.t * 24, 0, 6.283); c.stroke();
    });
    parts.forEach((p) => {
      const px = h + p.x * k, py = h - p.y * k;
      if (p.hot) {
        c.fillStyle = 'rgba(255,205,90,0.28)'; c.beginPath(); c.arc(px, py, 14, 0, 6.283); c.fill();
      }
      c.fillStyle = p.hot ? '#ffe082' : '#7ea2d6';
      c.beginPath(); c.arc(px, py, p.hot ? 7 : 5.5, 0, 6.283); c.fill();
    });
    tex.needsUpdate = true;
  }

  function update(dt, speedMul = 1) {
    const lim = 0.89;
    parts.forEach((p) => {
      const sp = (p.hot ? 1.85 : 1) * speedMul;
      p.x += p.vx * sp * dt; p.y += p.vy * sp * dt;
      const d = Math.hypot(p.x, p.y);
      if (d > lim) { const nx = p.x / d, ny = p.y / d, dot = p.vx * nx + p.vy * ny; if (dot > 0) { p.vx -= 2 * dot * nx; p.vy -= 2 * dot * ny; } p.x = nx * lim; p.y = ny * lim; }
    });
    for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
      const a = parts[i], b = parts[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if (d > 0.095 || d === 0) continue;
      const nx = dx / d, ny = dy / d, rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (rel > 0) continue;
      a.vx += rel * nx; a.vy += rel * ny; b.vx -= rel * nx; b.vy -= rel * ny;
      if (a.hot && b.hot && flashes.length < 6) flashes.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, t: 0 });
    }
    for (let i = flashes.length - 1; i >= 0; i--) { flashes[i].t += dt * 1.8; if (flashes[i].t >= 1) flashes.splice(i, 1); }
    acc += dt; if (acc >= 1 / 24) { acc = 0; draw(); }
  }
  draw();
  g.add(contactAO(0.75), base, post, back, disc, dome, rimOuter, rimInner);
  g.userData = { update };
  return g;
}

// ---------- BÀN ĐẢO THÍ NGHIỆM CÓ CHẬU RỬA ÂM BÀN THẬT ----------
// Dùng 1 texture mặt cánh tủ cho thân bàn đảo để giảm mạnh số draw calls
const CABINET_FRONT_TEX = canvasTex(512, 256, (c, w, h) => {
  c.fillStyle = '#eff2f6'; c.fillRect(0, 0, w, h);
  const cols = 3, pad = 6, dw = (w - pad * (cols + 1)) / cols;
  for (let i = 0; i < cols; i++) {
    const x = pad + i * (dw + pad);
    c.fillStyle = '#dce2ea'; c.fillRect(x, 8, dw, h - 16);
    c.strokeStyle = '#c5ced9'; c.lineWidth = 2; c.strokeRect(x, 8, dw, h - 16);
    // Tay nắm inox tinh tế
    const hx = i % 2 ? x + 16 : x + dw - 22;
    c.fillStyle = '#8b95a3'; c.fillRect(hx, 34, 6, 48);
  }
});
const CABINET_BODY_MATS = [
  MAT.cabinet, MAT.cabinet, MAT.cabinet, MAT.cabinet,
  new THREE.MeshStandardMaterial({ map: CABINET_FRONT_TEX, roughness: 0.48 }),
  new THREE.MeshStandardMaterial({ map: CABINET_FRONT_TEX, roughness: 0.48 }),
];

function makeIslandPro({ w = 8.8, d = 4.6, sinkPos = [3.35, 1.38] } = {}) {
  const g = new THREE.Group();
  const TH = 0.32;
  if (sinkPos) {
    const [sx, sz] = sinkPos, sw = 1.32, sd = 1.16;
    const xL = -w / 2, xR = w / 2, zB = -d / 2, zF = d / 2;
    const hx0 = sx - sw / 2, hx1 = sx + sw / 2, hz0 = sz - sd / 2, hz1 = sz + sd / 2;
    const slab = (x0, x1, z0, z1) => {
      const mw = x1 - x0, md = z1 - z0;
      const m = new THREE.Mesh(new THREE.BoxGeometry(mw, TH, md), MAT.benchTop);
      m.position.set((x0 + x1) / 2, -TH / 2, (z0 + z1) / 2);
      m.receiveShadow = true; m.castShadow = true; g.add(m);
    };
    slab(xL, hx0, zB, zF); slab(hx1, xR, zB, zF); slab(hx0, hx1, zB, hz0); slab(hx0, hx1, hz1, zF);

    // Chậu rửa inox âm bàn lõm sâu thật
    const depth = 0.78, sinkG = put(new THREE.Group(), sx, 0, sz);
    const rim = new THREE.Mesh(new THREE.BoxGeometry(sw + 0.14, 0.025, sd + 0.14), MAT.steel);
    rim.position.y = 0.01;
    // Lòng chậu lõm: hộp rỗng mặt trên (5 mặt trong dùng BackSide box = chỉ 1 draw call!)
    const bowlBox = new THREE.Mesh(new THREE.BoxGeometry(sw, depth, sd), new THREE.MeshStandardMaterial({ color: 0x828c98, metalness: 0.85, roughness: 0.34, side: THREE.BackSide }));
    bowlBox.position.y = -depth / 2 + 0.005;
    // Khung viền 4 mảnh mỏng che mép trên
    const rimT = 0.075;
    [[sw + rimT * 2, rimT, 0, -sd / 2 - rimT / 2], [sw + rimT * 2, rimT, 0, sd / 2 + rimT / 2], [rimT, sd, -sw / 2 - rimT / 2, 0], [rimT, sd, sw / 2 + rimT / 2, 0]].forEach(([rw, rd, rx, rz]) => {
      const rM = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.032, rd), MAT.steel);
      rM.position.set(rx, 0.014, rz); rM.receiveShadow = true; sinkG.add(rM);
    });
    const drain = new THREE.Mesh(cyl(0.11, 0.11, 0.02, 20), MAT.darkMetal); drain.position.set(0, -depth + 0.02, 0);

    const zb = -sd / 2 - 0.14;
    const tapBase = new THREE.Mesh(cyl(0.09, 0.105, 0.08, 18), MAT.steel); tapBase.position.set(0, 0.04, zb);
    const curve = new THREE.CatmullRomCurve3([V3(0, 0.05, zb), V3(0, 1.48, zb), V3(0, 1.84, zb + 0.22), V3(0, 1.84, -0.05), V3(0, 1.62, 0.08)]);
    const tap = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.052, 12), MAT.steel); tap.castShadow = true;
    const lever = new THREE.Mesh(cyl(0.022, 0.026, 0.34, 10), MAT.steel); lever.rotation.z = Math.PI / 2; lever.position.set(0.20, 0.45, zb);
    sinkG.add(bowlBox, drain, tapBase, tap, lever);
    g.add(sinkG);
  } else {
    const top = new THREE.Mesh(new THREE.BoxGeometry(w, TH, d), MAT.benchTop);
    top.position.y = -TH / 2; top.receiveShadow = true; top.castShadow = true; g.add(top);
  }

  const body = new THREE.Mesh(new THREE.BoxGeometry(w - 0.55, 7.6, d - 0.55), CABINET_BODY_MATS);
  body.position.y = -4.12; body.castShadow = true; body.receiveShadow = true;
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(w - 1.15, 1.05, d - 1.15), MAT.plinth);
  plinth.position.y = -8.47; plinth.receiveShadow = true;
  g.add(body, plinth);
  return g;
}

// Ghế đẩu xanh lam S2
const STOOL_SEAT_GEO = cyl(1.42, 1.35, 0.30, 28);
const STOOL_POST_GEO = cyl(0.13, 0.13, 5.5, 12);
const STOOL_RING_GEO = new THREE.TorusGeometry(1.02, 0.06, 8, 28);
const STOOL_FOOT_GEO = cyl(1.25, 1.5, 0.18, 28);

function makeStoolPro() {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(STOOL_SEAT_GEO, MAT.accent); seat.position.y = -3.15; seat.castShadow = true;
  const post = new THREE.Mesh(STOOL_POST_GEO, MAT.steel); post.position.y = -5.95;
  const ring = new THREE.Mesh(STOOL_RING_GEO, MAT.steel); ring.rotation.x = Math.PI / 2; ring.position.y = -6.7;
  const foot = new THREE.Mesh(STOOL_FOOT_GEO, MAT.darkMetal); foot.position.y = -8.9;
  g.add(seat, post, ring, foot);
  return g;
}

// ---------- KIẾN TRÚC PHÒNG LAB S2 (nhẹ draw calls, chiều sâu thực tế) ----------
function buildLabRoomPro() {
  const g = new THREE.Group();
  const FLOOR = -9, CEIL = 20, X0 = -28, X1 = 28, Z0 = -24, Z1 = 25;
  const RW = X1 - X0, RD = Z1 - Z0, RH = CEIL - FLOOR, cx = 0, cz = (Z0 + Z1) / 2, cy = (CEIL + FLOOR) / 2;

  const floorTex = canvasTex(256, 256, (c) => {
    c.fillStyle = '#cdd4dc'; c.fillRect(0, 0, 256, 256);
    c.strokeStyle = '#bec6d0'; c.lineWidth = 2; c.strokeRect(1, 1, 254, 254);
  });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(RW / 7, RD / 7);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.46, envMapIntensity: 0.7 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(cx, FLOOR, cz); floor.receiveShadow = true; g.add(floor);

  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), new THREE.MeshStandardMaterial({ color: 0xf4f7fa, roughness: 0.92 }));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(cx, CEIL, cz); g.add(ceil);

  // Đèn LED trần
  const ledMat = new THREE.MeshBasicMaterial({ color: 0xfaffff });
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j += 2) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.4), ledMat);
    p.rotation.x = Math.PI / 2; p.position.set(i * 15, CEIL - 0.08, cz + j * 9.5); g.add(p);
  }

  // 4 tường
  const wallMat = new THREE.MeshStandardMaterial({ color: PAL.wall, roughness: 0.88 });
  const addWall = (w, x, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, RH), wallMat); m.position.set(x, cy, z); m.rotation.y = ry; m.receiveShadow = true; g.add(m); };
  addWall(RW, cx, Z0, 0); addWall(RW, cx, Z1, Math.PI); addWall(RD, X0, cz, Math.PI / 2); addWall(RD, X1, cz, -Math.PI / 2);

  // Cửa sổ trời sáng bên trái (1 bức tường cửa sổ liên hoàn vẽ bằng canvas sắc nét + 3 khung nhôm nổi → ít draw calls!)
  const winTex = canvasTex(1024, 512, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#eef7ff'); gr.addColorStop(0.52, '#e1eef5'); gr.addColorStop(0.68, '#b9d4b2'); gr.addColorStop(1, '#98bc94');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 42; i++) {
      c.fillStyle = `rgba(${118 + (i * 31) % 45},${162 + (i * 47) % 40},${108 + (i * 23) % 35},0.34)`;
      c.beginPath(); c.arc((i * 97) % w, h * 0.6 + ((i * 59) % (h * 0.38)), 34 + (i * 19) % 44, 0, 6.283); c.fill();
    }
    // Khung nhôm đứng & ngang
    c.fillStyle = '#333b46';
    c.fillRect(0, 0, w, 16); c.fillRect(0, h - 16, w, 16);
    for (let i = 0; i <= 6; i++) c.fillRect(Math.round((i / 6) * (w - 14)), 0, i % 2 === 0 ? 18 : 9, h);
  });
  const winPane = new THREE.Mesh(new THREE.PlaneGeometry(38, 13.4), new THREE.MeshBasicMaterial({ map: winTex }));
  winPane.rotation.y = Math.PI / 2; winPane.position.set(X0 + 0.12, 8.6, cz - 1); g.add(winPane);
  g.add(put(new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.2, 38.6), MAT.cabinet), X0 + 0.35, 1.8, cz - 1));

  // Tường sau: dãy tủ thấp mặt epoxy + tủ hút khí độc ở tâm
  const run = put(new THREE.Mesh(new THREE.BoxGeometry(RW - 4, 8.7, 4.6), CABINET_BODY_MATS), cx, FLOOR + 4.35, Z0 + 2.3);
  const runTop = put(new THREE.Mesh(new THREE.BoxGeometry(RW - 4, 0.3, 4.9), MAT.darkMetal), cx, -0.15, Z0 + 2.45);
  g.add(run, runTop);

  const hood = put(new THREE.Group(), 0, 0, Z0 + 2.9);
  hood.add(
    put(new THREE.Mesh(new THREE.BoxGeometry(11.6, 20, 5.6), MAT.cabinet), 0, 10, 0),
    put(new THREE.Mesh(new THREE.BoxGeometry(10.2, 8.6, 0.25), new THREE.MeshStandardMaterial({ color: 0xcbd4df, roughness: 0.72 })), 0, 5.4, 2.6),
    put(new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.35, 5.2), MAT.darkMetal), 0, 0.2, 0.2),
    put(new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.24, 0.24), MAT.steel), 0, 4.1, 2.85),
    put(new THREE.Mesh(new THREE.PlaneGeometry(10.2, 5.2), MAT.glassFront), 0, 6.7, 2.82),
  );
  g.add(hood);

  // Kệ kính hai bên tủ hút + InstancedMesh lọ trưng bày (chỉ 2 draw calls cho 24 lọ!)
  const botGeo = cyl(0.45, 0.45, 1.75, 14), capGeo = cyl(0.24, 0.24, 0.28, 12);
  const clearInst = new THREE.InstancedMesh(botGeo, MAT.glassFront, 12);
  const amberInst = new THREE.InstancedMesh(botGeo, MAT.amberFront, 12);
  const capBlueInst = new THREE.InstancedMesh(capGeo, MAT.accent, 12);
  const capBlkInst = new THREE.InstancedMesh(capGeo, MAT.darkPlastic, 12);
  const dObj = new THREE.Object3D();
  let ci = 0, ai = 0;
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
        if (row === 0) {
          amberInst.setMatrixAt(ai, dObj.matrix);
          dObj.position.y = sy + 1.95; dObj.updateMatrix();
          capBlkInst.setMatrixAt(ai++, dObj.matrix);
        } else {
          clearInst.setMatrixAt(ci, dObj.matrix);
          dObj.position.y = sy + 1.95; dObj.updateMatrix();
          capBlueInst.setMatrixAt(ci++, dObj.matrix);
        }
      }
    });
  });
  g.add(clearInst, amberInst, capBlueInst, capBlkInst);

  // Tủ cao tường phải (1 khối gọn)
  g.add(put(new THREE.Mesh(new THREE.BoxGeometry(3.8, 22, 32), CABINET_BODY_MATS), X1 - 1.9, FLOOR + 11, cz));
  return g;
}

// ---------- KHỞI TẠO LAB PRO ----------
export function initProLabDemo(host, ui) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; // Chỉ tính lại shadow khi đổi góc nhìn / tải xong → tăng gấp đôi FPS!
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdde4ed);
  scene.fog = new THREE.FogExp2(0xdde4ed, 0.011);
  scene.environment = buildLabEnvMap(renderer);

  // Ánh sáng 3 điểm chuẩn LookDev
  scene.add(new THREE.HemisphereLight(0xf1f7ff, 0x454f5e, 0.72));

  const keyLight = new THREE.DirectionalLight(0xfff7eb, 2.25);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.bias = -0.00035;
  keyLight.shadow.normalBias = 0.025;
  keyLight.shadow.radius = 3.2;
  scene.add(keyLight, keyLight.target);

  const rimLight = new THREE.DirectionalLight(0xcbe2ff, 0.95);
  rimLight.position.set(14, 12, -12);
  scene.add(rimLight);

  const fillLight = new THREE.DirectionalLight(0xeef4ff, 0.42);
  fillLight.position.set(4, 5, 16);
  scene.add(fillLight);

  function aimShadow(center, radius) {
    keyLight.target.position.copy(center);
    keyLight.position.set(center.x - 13, 17, center.z + 10);
    Object.assign(keyLight.shadow.camera, { left: -radius, right: radius, top: radius, bottom: -radius, near: 2, far: 55 });
    keyLight.shadow.camera.updateProjectionMatrix();
    renderer.shadowMap.needsUpdate = true;
  }

  scene.add(buildLabRoomPro());

  // Bố trí 4 bàn với lối đi rộng giữa 2 hàng (z = -4.6 và z = +4.6) để camera cận cảnh hàng sau KHÔNG BAO GIỜ bị hàng trước che!
  const Z_BACK = -4.6, Z_FRONT = 4.6, X_OFF = 5.9;
  const benchMeta = {};
  const animHooks = [];

  // ----- BÀN 1 · NỒNG ĐỘ -----
  {
    const bx = -X_OFF, bz = Z_BACK;
    const root = put(new THREE.Group(), bx, 0, bz); scene.add(root);
    root.add(makeIslandPro({ w: 8.8, d: 4.6, sinkPos: [3.35, 1.38] }));
    root.add(put(makeStoolPro(), -1.8, 0, 3.15), put(makeStoolPro(), 1.6, 0, 3.15));

    const pRef = put(makeXPaperPro(1.18), -0.68, 0, 0.15);
    const pExp = put(makeXPaperPro(1.18), 0.68, 0, 0.15);
    const fRef = put(makeFlaskPro({ fill: 0.72 }), -0.68, 0.012, 0.15);
    const fExp = put(makeFlaskPro({ fill: 0.72 }), 0.68, 0.012, 0.15);
    const b0 = put(makeBottlePro({ title: 'Na₂S₂O₃', sub: '0,05 M', name: 'Sodium thiosulfate' }), -3.45, 0, -0.9);
    const b1 = put(makeBottlePro({ title: 'Na₂S₂O₃', sub: '0,10 M', name: 'Sodium thiosulfate' }), -2.55, 0, -0.9);
    const b2 = put(makeBottlePro({ title: 'Na₂S₂O₃', sub: '0,30 M', name: 'Sodium thiosulfate' }), -1.65, 0, -0.9);
    const acid = put(makeBottlePro({ title: 'H₂SO₄', sub: '0,5 M', name: 'Sulfuric acid' }), 1.85, 0, -0.9);
    const timer = put(makeTimerPro(), -2.1, 0, 1.2); timer.rotation.y = 0.25;
    const plate = put(makeHotplatePro(), 3.15, 0, -1.0);
    root.add(pRef, pExp, fRef, fExp, b0, b1, b2, acid, timer, plate);

    animHooks.push((t, dt, running) => {
      fExp.userData.setTint(0xe3cf6c, running ? clamp(t / 4.2) : 0, { opacity: 0.98, rough: 0.75 });
      fRef.userData.setTint(0xe3cf6c, running ? clamp(t / 12.5) : 0, { opacity: 0.98, rough: 0.75 });
      timer.userData.setTime(running ? Math.min(t * 4.8, 60) : 0);
      plate.userData.setHot(running ? 0.55 : 0);
    });

    benchMeta.conc = {
      name: 'Bàn 1 · Nồng độ', color: '#0891b2',
      eq: 'Na₂S₂O₃ + H₂SO₄ → Na₂SO₄ + S↓ + SO₂↑ + H₂O',
      desc: 'Góc nhìn 27° nhìn xuyên đáy bình thấy rõ chữ X đen trên giấy trắng, rồi mờ đục vàng lưu huỳnh dần.',
      cam: { pos: [bx - 0.3, 3.9, bz + 6.1], target: [bx + 0.05, 0.78, bz + 0.1], fov: 33, shadowCenter: V3(bx, 0, bz), shadowR: 5.5 },
      tags: [
        ['Đối chứng · 0,05 M', V3(bx - 0.68, 1.55, bz + 0.15)],
        ['Thí nghiệm · 0,30 M', V3(bx + 0.68, 1.55, bz + 0.15)],
        ['H₂SO₄ 0,5 M', V3(bx + 1.85, 1.4, bz - 0.9)],
        ['Đồng hồ', V3(bx - 2.1, 0.74, bz + 1.2)],
        ['Bếp điện', V3(bx + 3.15, 0.58, bz - 1.0)],
        ['Chậu rửa âm bàn', V3(bx + 3.35, 1.9, bz + 1.38)],
      ],
    };
  }

  // ----- BÀN 2 · NHIỆT ĐỘ -----
  {
    const bx = X_OFF, bz = Z_BACK;
    const root = put(new THREE.Group(), bx, 0, bz); scene.add(root);
    root.add(makeIslandPro({ w: 8.8, d: 4.6, sinkPos: [3.35, 1.38] }));
    root.add(put(makeStoolPro(), -1.6, 0, 3.15), put(makeStoolPro(), 1.8, 0, 3.15));

    const rack = put(makeWoodRackPro(), -1.35, 0, -0.05);
    const tRef = put(makeTestTubePro({ fill: 0.56 }), -1.35, 0.08, -0.05);
    const thRef = put(makeThermometerPro(1.85), -1.33, 0.16, -0.05);

    const clampBase = new THREE.Mesh(SYR_BASE_GEO, MAT.darkMetal); clampBase.position.set(0.95, 0, -0.88); clampBase.castShadow = true;
    const clampPost = new THREE.Mesh(cyl(0.042, 0.042, 3.25, 14), MAT.steel); clampPost.position.set(0.95, 1.62, -0.95); clampPost.castShadow = true;
    const clampBoss = new THREE.Mesh(BOSS_GEO, MAT.darkMetal); clampBoss.position.set(0.95, 2.55, -0.95);
    const clampArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 1.25), MAT.wood); clampArm.position.set(0.75, 2.66, -0.35); clampArm.castShadow = true;
    const clampRing = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.024, 8, 24), MAT.darkMetal); clampRing.rotation.x = Math.PI / 2; clampRing.position.set(0.75, 2.66, 0.2);

    const tExp = put(makeTestTubePro({ fill: 0.56 }), 0.75, 1.52, 0.2);
    const thExp = put(makeThermometerPro(1.85), 0.77, 1.60, 0.2);
    const lamp = put(makeAlcoholLampPro(), 0.75, 0, 0.2);
    const pp = put(makeDropperBottlePro(), -2.95, 0, 0.9);
    const mg = put(makeWatchGlassPro({ mg: true }), -0.35, 0, 1.3);
    const timer = put(makeTimerPro(), 2.15, 0, 1.0); timer.rotation.y = -0.22;

    root.add(rack, tRef, thRef, clampBase, clampPost, clampBoss, clampArm, clampRing, tExp, thExp, lamp, pp, mg, timer);

    animHooks.push((t, dt, running) => {
      lamp.userData.flicker(performance.now() * 0.001);
      thExp.userData.setTemp(running ? 25 + 42 * clamp(t / 2.2) : 55);
      tExp.userData.setTint(0xf43f8e, running ? clamp(t / 4.5) : 0, { opacity: 0.86 });
      tRef.userData.setTint(0xf43f8e, running ? clamp(t / 15.0) : 0, { opacity: 0.86 });
      tExp.userData.bub.update(dt, running ? 0.65 : 0.14);
      tRef.userData.bub.update(dt, running ? 0.12 : 0);
      timer.userData.setTime(running ? Math.min(t * 3.2, 40) : 0);
    });

    benchMeta.temp = {
      name: 'Bàn 2 · Nhiệt độ', color: '#ea580c',
      eq: 'Mg + 2H₂O → Mg(OH)₂ + H₂↑ (phenolphthalein)',
      desc: 'Giá gỗ sồi ấm + đèn cồn cháy hắt ánh sáng cam thật lên ống nghiệm và kẹp gỗ, cân bằng nóng-lạnh.',
      cam: { pos: [bx + 0.3, 3.35, bz + 6.35], target: [bx, 1.45, bz + 0.1], fov: 39, shadowCenter: V3(bx, 0, bz), shadowR: 5.5 },
      tags: [
        ['Đối chứng · 25 °C', V3(bx - 1.35, 2.02, bz - 0.05)],
        ['Thí nghiệm · Đun nóng', V3(bx + 0.75, 3.22, bz + 0.2)],
        ['Đèn cồn', V3(bx + 0.75, 1.15, bz + 0.2)],
        ['Phenolphthalein', V3(bx - 2.95, 1.05, bz + 0.9)],
        ['Dây Mg', V3(bx - 0.35, 0.32, bz + 1.3)],
      ],
    };
  }

  // ----- BÀN 3 · BỀ MẶT -----
  {
    const bx = -X_OFF, bz = Z_FRONT;
    const root = put(new THREE.Group(), bx, 0, bz); scene.add(root);
    root.add(makeIslandPro({ w: 8.8, d: 4.6, sinkPos: [3.35, 1.38] }));
    root.add(put(makeStoolPro(), -1.8, 0, 3.15), put(makeStoolPro(), 1.6, 0, 3.15));

    const fRef = put(makeFlaskPro({ fill: 0.62 }), -0.66, 0, -0.1);
    const fExp = put(makeFlaskPro({ fill: 0.62 }), 0.66, 0, -0.1);
    const stRef = makeLimestone('vien', 0.95); fRef.userData.solids.add(stRef);
    const stExp = makeLimestone('vun', 0.95); fExp.userData.solids.add(stExp);

    const rigRef = put(makeGasRigPro({ dir: -1 }), -0.66, 0, -0.1);
    const rigExp = put(makeGasRigPro({ dir: 1 }), 0.66, 0, -0.1);
    const hcl = put(makeBottlePro({ title: 'HCl', sub: '0,5 M', name: 'Hydrochloric acid' }), -3.4, 0, 0.3);
    const cylM = put(makeCylinderPro({ mL: 60 }), -2.42, 0, 1.0);
    const timer = put(makeTimerPro(), -1.52, 0, 1.5); timer.rotation.y = 0.22;
    const dRef = put(makeWatchGlassPro({ form: 'vien' }), -0.66, 0, 1.2);
    const dExp = put(makeWatchGlassPro({ form: 'vun' }), 0.66, 0, 1.2);
    const balance = put(makeBalancePro(0.25), 2.02, 0, 1.32);

    root.add(fRef, fExp, rigRef, rigExp, hcl, cylM, timer, dRef, dExp, balance);

    animHooks.push((t, dt, running) => {
      const vMax = 62;
      const vExp = running ? vMax * (1 - Math.exp(-t * 0.55)) : 0;
      const vRef = running ? vMax * (1 - Math.exp(-t * 0.18)) : 0;
      rigExp.userData.setVolume(vExp); rigRef.userData.setVolume(vRef);
      const rateExp = running ? Math.exp(-t * 0.55) : 0;
      const rateRef = running ? Math.exp(-t * 0.18) * 0.45 : 0;
      fExp.userData.bub.update(dt, rateExp); fRef.userData.bub.update(dt, rateRef);
      fExp.userData.setFoam(rateExp * 0.9, 0.055); fRef.userData.setFoam(rateRef * 0.6, 0.032);
      stExp.scale.setScalar(Math.max(0.12, Math.cbrt(Math.max(0.01, 1 - vExp / vMax))));
      stRef.scale.setScalar(Math.max(0.12, Math.cbrt(Math.max(0.01, 1 - vRef / vMax))));
      timer.userData.setTime(running ? Math.min(t * 4.5, 50) : 0);
    });

    benchMeta.surf = {
      name: 'Bàn 3 · Bề mặt', color: '#6366f1',
      eq: 'CaCO₃ + 2HCl → CaCl₂ + CO₂↑ + H₂O',
      desc: 'Đá vôi hữu cơ, xi-lanh vạch chia cong + 2 gioăng cao su + bosshead có núm vặn, cân bo góc màn LCD, chậu rửa âm bàn thật.',
      cam: { pos: [bx - 0.25, 3.15, bz + 7.1], target: [bx + 0.05, 1.15, bz + 0.1], fov: 31, shadowCenter: V3(bx, 0, bz), shadowR: 5.5 },
      tags: [
        ['Đối chứng (đá viên)', V3(bx - 1.65, 2.52, bz - 0.1)],
        ['Thí nghiệm (đập nhỏ)', V3(bx + 1.65, 2.52, bz - 0.1)],
        ['HCl 0,5 M', V3(bx - 3.4, 1.42, bz + 0.3)],
        ['Ống đong 100 mL', V3(bx - 2.42, 1.78, bz + 1.0)],
        ['Cân điện tử · 0,25 g', V3(bx + 2.02, 0.55, bz + 1.32)],
        ['Chậu rửa âm bàn', V3(bx + 3.35, 1.9, bz + 1.38)],
      ],
    };
  }

  // ----- BÀN 4 · XÚC TÁC -----
  {
    const bx = X_OFF, bz = Z_FRONT;
    const root = put(new THREE.Group(), bx, 0, bz); scene.add(root);
    root.add(makeIslandPro({ w: 8.8, d: 4.6, sinkPos: [3.35, 1.38] }));
    root.add(put(makeStoolPro(), -1.6, 0, 3.15), put(makeStoolPro(), 1.8, 0, 3.15));

    const fRef = put(makeFlaskPro({ fill: 0.56 }), -0.66, 0, -0.1);
    const fExp = put(makeFlaskPro({ fill: 0.56 }), 0.66, 0, -0.1);
    const powder = new THREE.Mesh(cyl(0.24, 0.28, 0.04, 24), MAT.mno2);
    powder.position.y = 0.015; fExp.userData.solids.add(powder);

    const rigRef = put(makeGasRigPro({ dir: -1 }), -0.66, 0, -0.1);
    const rigExp = put(makeGasRigPro({ dir: 1 }), 0.66, 0, -0.1);
    const h2o2 = put(makeBottlePro({ title: 'H₂O₂', sub: '10%', name: 'Hydrogen peroxide', amber: true }), -3.35, 0, 0.35);
    const cylM = put(makeCylinderPro({ mL: 40 }), -2.42, 0, 1.0);
    const timer = put(makeTimerPro(), -1.52, 0, 1.5); timer.rotation.y = 0.22;
    const mno2 = put(makeBottlePro({ title: 'MnO₂', sub: 'xúc tác', name: 'Manganese dioxide', wide: true, powder: true, h: 0.84, r: 0.35, fill: 0.58 }), 1.98, 0, 1.2);
    const spatula = put(makeSpatulaPro(), 0.72, 0, 1.32); spatula.rotation.y = -0.12;

    root.add(fRef, fExp, rigRef, rigExp, h2o2, cylM, timer, mno2, spatula);

    animHooks.push((t, dt, running) => {
      rigExp.userData.setVolume(running ? 84 * (1 - Math.exp(-t * 0.75)) : 0);
      rigRef.userData.setVolume(running ? Math.min(1.2, t * 0.1) : 0);
      const rate = running ? Math.exp(-t * 0.45) : 0;
      fExp.userData.bub.update(dt, rate);
      fExp.userData.setFoam(rate, 0.12);
      timer.userData.setTime(running ? Math.min(t * 2.8, 26) : 0);
    });

    benchMeta.cat = {
      name: 'Bàn 4 · Xúc tác', color: '#16a34a',
      eq: '2H₂O₂ → 2H₂O + O₂↑ (xúc tác MnO₂)',
      desc: 'Lọ H₂O₂ hổ phách, lọ miệng rộng chứa bột MnO₂ vân thật, thìa xúc inox có lòng muỗng, bọt O₂ trào mạnh.',
      cam: { pos: [bx + 0.25, 3.15, bz + 7.1], target: [bx - 0.05, 1.15, bz + 0.1], fov: 31, shadowCenter: V3(bx, 0, bz), shadowR: 5.5 },
      tags: [
        ['Đối chứng (không MnO₂)', V3(bx - 1.65, 2.52, bz - 0.1)],
        ['Thí nghiệm (có MnO₂)', V3(bx + 1.65, 2.52, bz - 0.1)],
        ['H₂O₂ (lọ nâu)', V3(bx - 3.35, 1.42, bz + 0.35)],
        ['Bột MnO₂', V3(bx + 1.98, 1.15, bz + 1.2)],
        ['Thìa inox', V3(bx + 0.72, 0.25, bz + 1.32)],
      ],
    };
  }

  // ----- TRỤ VÒNG KÍNH SOI HẠT -----
  const pedestal = put(new THREE.Group(), 0, 0, 0);
  pedestal.add(makeIslandPro({ w: 2.3, d: 2.3, sinkPos: null }));
  const lens = makeParticleLensPro();
  pedestal.add(lens);
  scene.add(pedestal);
  animHooks.push((t, dt, running) => lens.userData.update(dt, running ? 2.1 : 1.0));

  benchMeta.lens = {
    name: 'Vòng kính soi hạt', color: '#2563eb',
    eq: 'Va chạm hiệu quả · thuyết động học phân tử',
    desc: 'Vành nhôm phay xước + thấu kính phủ bóng clearcoat + hạt năng lượng cao loé sáng khi va chạm.',
    cam: { pos: [0, 3.0, 5.2], target: [0, 2.4, 0], fov: 30, shadowCenter: V3(0, 0, 0), shadowR: 4 },
    tags: [['Mô hình va chạm hiệu quả', V3(0, 3.55, 0)]],
  };

  benchMeta.all = {
    name: 'Toàn cảnh phòng Lab (4 bàn)', color: '#2563eb',
    eq: 'Phòng thí nghiệm Hoá 10 · 4 trạm thí nghiệm song song',
    desc: 'Kiến trúc phòng S2 hiện đại: cửa sổ nắng trái, tủ hút + kệ kính tường sau, 4 bàn đảo mặt đá epoxy than chì, ánh sáng 3 điểm + HDRI lab.',
    cam: { pos: [0, 12.2, 19.6], target: [0, 0.4, 0.4], fov: 38, shadowCenter: V3(0, 0, 0), shadowR: 18 },
    tags: [
      ['① Bàn 1 · Nồng độ', V3(-X_OFF, 3.0, Z_BACK), 'conc'],
      ['② Bàn 2 · Nhiệt độ', V3(X_OFF, 3.4, Z_BACK), 'temp'],
      ['③ Bàn 3 · Bề mặt', V3(-X_OFF, 3.1, Z_FRONT), 'surf'],
      ['④ Bàn 4 · Xúc tác', V3(X_OFF, 3.1, Z_FRONT), 'cat'],
      ['Vòng kính soi hạt', V3(0, 3.65, 0), 'lens'],
    ],
  };

  // ---------- Camera & OrbitControls ----------
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 140);
  const controls = new OrbitControls(camera, renderer.domElement);
  Object.assign(controls, {
    enableDamping: true, dampingFactor: 0.08, enablePan: true,
    minPolarAngle: 0.22, maxPolarAngle: 1.48, minDistance: 2.4, maxDistance: 30,
    rotateSpeed: 0.65, zoomSpeed: 0.8,
  });

  // ---------- Nhãn 3D ----------
  const tagLayer = document.createElement('div');
  tagLayer.className = 'pro-tags';
  host.appendChild(tagLayer);
  let activeTags = [], showTags = true;

  function rebuildTags(key) {
    tagLayer.innerHTML = ''; activeTags = [];
    const m = benchMeta[key]; if (!m) return;
    (m.tags || []).forEach(([text, pos, jumpTo]) => {
      const el = document.createElement('button');
      el.type = 'button'; el.className = 'pro-tag' + (jumpTo ? ' is-bench' : '');
      el.innerHTML = `<i style="background:${jumpTo ? benchMeta[jumpTo].color : m.color}"></i><span>${text}</span><em></em>`;
      if (jumpTo) el.addEventListener('click', () => goView(jumpTo));
      tagLayer.appendChild(el);
      activeTags.push({ el, pos });
    });
  }

  const tmp = new THREE.Vector3();
  function layoutTags() {
    const w = host.clientWidth, h = host.clientHeight;
    tagLayer.style.display = showTags ? '' : 'none';
    if (!showTags) return;
    const topSafe = (document.querySelector('.topbar')?.getBoundingClientRect().bottom || 64) + 10;
    const botSafe = h - 108;
    const placed = [], list = [];
    activeTags.forEach((t) => {
      tmp.copy(t.pos).project(camera);
      const x = (tmp.x * 0.5 + 0.5) * w, y = (-tmp.y * 0.5 + 0.5) * h;
      const on = tmp.z < 1 && x > 14 && x < w - 14 && y > topSafe - 16 && y < botSafe + 24;
      t.el.style.display = on ? '' : 'none';
      if (on) list.push({ t, x, y });
    });
    list.sort((a, b) => b.y - a.y).forEach((o) => {
      const bw = o.t.el.offsetWidth || 100, bh = (o.t.el.offsetHeight || 26) + 6;
      const cx = clamp(o.x, bw / 2 + 12, w - bw / 2 - 12);
      let top = o.y - bh - 18;
      for (let i = 0; i < 6; i++) {
        const hit = placed.find((p) => Math.abs(p.cx - cx) < (p.bw + bw) / 2 + 6 && Math.abs(p.top - top) < bh);
        if (!hit) break;
        top = hit.top - bh;
      }
      top = clamp(top, topSafe, botSafe - bh);
      placed.push({ cx, top, bw });
      o.t.el.style.transform = `translate(${Math.round(cx - bw / 2)}px, ${Math.round(top)}px)`;
      o.t.el.style.setProperty('--lead', Math.max(0, Math.round(o.y - (top + bh - 6))) + 'px');
      o.t.el.style.setProperty('--dx', Math.round(clamp(o.x - cx, -bw / 2 + 10, bw / 2 - 10)) + 'px');
    });
  }

  let currentKey = 'all', goal = null;
  function goView(key, immediate = false) {
    const m = benchMeta[key]; if (!m) return;
    currentKey = key;
    const c = m.cam;
    aimShadow(c.shadowCenter, c.shadowR);
    rebuildTags(key);
    if (ui.onViewChange) ui.onViewChange(key, m);
    if (immediate) {
      camera.position.set(...c.pos); controls.target.set(...c.target);
      camera.fov = c.fov; camera.updateProjectionMatrix(); controls.update(); goal = null;
    } else {
      goal = { pos: V3(...c.pos), target: V3(...c.target), fov: c.fov };
    }
  }
  controls.addEventListener('start', () => { goal = null; });

  let benchTheme = 'dark';
  function setBenchTheme(mode) {
    benchTheme = mode;
    MAT.benchTop.color.set(mode === 'dark' ? PAL.benchDark : PAL.benchLight);
    MAT.benchTop.roughness = mode === 'dark' ? 0.36 : 0.46;
    MAT.benchTop.needsUpdate = true;
    setGlassTheme(mode);
  }
  setBenchTheme('dark');

  let running = true, simTime = 0;
  function setRunning(on) { running = on; if (on) simTime = 0; }

  function resize() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);
  resize();
  goView('all', true);
  // Render shadow một lần sau khi texture đã sẵn sàng
  setTimeout(() => { renderer.shadowMap.needsUpdate = true; }, 400);

  let last = performance.now(), frames = 0, fpsAcc = 0, fps = 60, shadowTick = 0;
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (running) {
      simTime += dt;
      if (simTime > 16) simTime = 0;
      shadowTick += dt;
      if (shadowTick > 0.25) { shadowTick = 0; renderer.shadowMap.needsUpdate = true; } // Cập nhật shadow 4Hz cho pit-tông di chuyển → cực mượt!
    }
    if (goal) {
      const k = 1 - Math.exp(-dt * 5.2);
      camera.position.lerp(goal.pos, k); controls.target.lerp(goal.target, k);
      camera.fov += (goal.fov - camera.fov) * k; camera.updateProjectionMatrix();
      if (camera.position.distanceTo(goal.pos) < 0.015 && Math.abs(camera.fov - goal.fov) < 0.05) {
        camera.position.copy(goal.pos); controls.target.copy(goal.target);
        camera.fov = goal.fov; camera.updateProjectionMatrix(); goal = null;
      }
    }
    controls.update();
    animHooks.forEach((fn) => fn(simTime, dt, running));
    renderer.render(scene, camera);
    layoutTags();

    frames++; fpsAcc += dt;
    if (fpsAcc >= 0.5) {
      fps = Math.round(frames / fpsAcc); frames = 0; fpsAcc = 0;
      if (ui.onStats) ui.onStats({ fps, calls: renderer.info.render.calls, tris: renderer.info.render.triangles });
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  return {
    goView, resetView: () => goView(currentKey), setBenchTheme, getBenchTheme: () => benchTheme,
    setRunning, isRunning: () => running, setShowTags: (v) => { showTags = v; }, benchMeta,
  };
}
