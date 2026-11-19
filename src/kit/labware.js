// Bộ dụng cụ thí nghiệm do mã vẽ, theo kích thước thật. Đơn vị: 1 = 10 cm.
// Mỗi hàm trả về một THREE.Group đặt gốc ở đáy dụng cụ.
import * as THREE from 'three';
import { PAL, glassPair, glassShell, liquidMat, solidMat, steelMat, canvasTexture, labelTexture, contactShadow, FONT } from './materials.js';

const V2 = (p) => new THREE.Vector2(p[0], p[1]);
const lathe = (pts, seg = 48, phiStart = 0, phiLength = Math.PI * 2) => new THREE.LatheGeometry(pts.map(V2), seg, phiStart, phiLength);
const cyl = (r1, r2, h, seg = 28) => new THREE.CylinderGeometry(r1, r2, h, seg);
const lerp = THREE.MathUtils.lerp, clamp = THREE.MathUtils.clamp;

// Vạch chia in men trắng trên thân thuỷ tinh: một mảnh tròn xoay ôm sát mặt ngoài, quay về phía người nhìn.
export function gradDecal(profile, marks, { arc = 0.95, unit = 'mL', ink = '#1d3f72' } = {}) {
  const tex = canvasTexture(512, 1024, (g, w, h) => {
    g.strokeStyle = ink; g.fillStyle = ink; g.textBaseline = 'middle'; g.textAlign = 'left';
    marks.forEach(([v, label, major]) => {
      const y = h - v * h;
      g.lineWidth = major ? 14 : 8; g.beginPath(); g.moveTo(w * 0.18, y); g.lineTo(w * (major ? 0.5 : 0.36), y); g.stroke();
      if (label) { g.font = `600 ${major ? 92 : 76}px ${FONT}`; g.fillText(label, w * 0.56, y); }
    });
    if (unit) { g.font = `600 68px ${FONT}`; g.fillText(unit, w * 0.56, 52); }
  });
  const m = new THREE.Mesh(lathe(profile, 12, -arc / 2, arc), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }));
  m.renderOrder = 5;
  return m;
}

// ---------- Bình tam giác 250 mL: đáy Ø 8,5 cm, cao 14,5 cm, cổ Ø 3,4 cm ----------
export function makeFlask() {
  const g = new THREE.Group();
  const H = 1.45, RB = 0.425, RN = 0.17, YS = 1.0, LEVEL = 0.3;
  const T = 0.022; // thành dày ~2 mm
  const glass = glassShell(
    lathe([[0, 0], [RB - 0.03, 0], [RB, 0.035], [RN, YS], [RN, H - 0.05], [RN + 0.028, H - 0.02], [RN + 0.03, H]], 64),
    lathe([[0, 0.04], [RB - 0.04 - T, 0.04], [RB - T, 0.06], [RN - T, YS], [RN - T, H - 0.03], [RN + 0.03, H]], 64),
  );
  const rim = new THREE.Mesh(new THREE.TorusGeometry(RN + 0.02, 0.014, 10, 48), new THREE.MeshPhysicalMaterial({ color: 0xcfe0e6, transparent: true, opacity: 0.75, roughness: 0.05, envMapIntensity: 2.2 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = H - 0.012; rim.renderOrder = 5; glass.add(rim);
  const rAt = (y) => lerp(RB - 0.026, RN - 0.026, clamp((y - 0.035) / (YS - 0.035), 0, 1));
  const liquid = new THREE.Mesh(lathe([[0, 0.045], [RB - 0.045, 0.045], [RB - 0.026, 0.065], [rAt(LEVEL), LEVEL], [0, LEVEL]], 64), liquidMat());
  liquid.renderOrder = 1;
  // vạch 50–200 mL theo chiều cao gần đúng của bình nón
  const ys = [[0.2, '50'], [0.36, '100'], [0.52, '150'], [0.7, '200']];
  const y0 = 0.14, y1 = 0.8, rr = (y) => lerp(RB, RN, clamp((y - 0.035) / (YS - 0.035), 0, 1)) + 0.004;
  const decal = gradDecal([[rr(y0), y0], [rr(y1), y1]], ys.map(([y, l]) => [(y - y0) / (y1 - y0), l, true]));
  g.add(contactShadow(0.7), liquid, glass, decal);
  g.userData = { liquid, level: LEVEL, rAt, H, RN, top: H };
  return g;
}

// ---------- Ống nghiệm 18 × 150 mm ----------
export function makeTestTube({ h = 1.5, r = 0.09 } = {}) {
  const g = new THREE.Group();
  const prof = (rr) => { const p = []; for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + (Math.PI / 2) * (i / 8); p.push([rr * Math.cos(a), r + rr * Math.sin(a)]); } return p; };
  const glass = glassPair(lathe([...prof(r), [r, h - 0.02], [r + 0.02, h]], 28));
  const liquid = new THREE.Mesh(new THREE.BufferGeometry(), liquidMat());
  liquid.renderOrder = 1;
  const setLevel = (l) => { liquid.geometry.dispose(); liquid.geometry = lathe([...prof(r - 0.012), [r - 0.012, l], [0, l]], 24); g.userData.level = l; };
  g.add(liquid, glass);
  g.userData = { liquid, setLevel, r, h, level: 0 };
  setLevel(h * 0.4);
  return g;
}

// ---------- Lọ hoá chất 250 mL kiểu lọ phòng thí nghiệm nắp vặn ----------
// Lọ trong nắp xanh có vòng rót cho dung dịch; lọ nâu nắp đen cho chất kị sáng; lọ miệng rộng cho chất rắn.
export function makeBottle({ title = 'HCl', sub = '', name = '', amber = false, content = PAL.water, contentOpacity = 0.5, h = 1.05, r = 0.35, fill = 0.62, wide = false, foot } = {}) {
  const g = new THREE.Group();
  const T = 0.025, rn = wide ? r * 0.7 : 0.15, ys = h * 0.8, yn = h, nt = h + 0.2; // vai bo tròn, cổ ngắn có ren
  const outer = [[0, 0], [r - 0.05, 0], [r, 0.05], [r, ys - 0.06], [r - 0.03, ys + 0.03], [rn + 0.07, yn - 0.02], [rn, yn + 0.03], [rn, nt]];
  const inner = [[0, 0.06], [r - 0.05 - T, 0.06], [r - T, 0.09], [r - T, ys - 0.07], [r - 0.03 - T, ys + 0.01], [rn + 0.05 - T, yn - 0.04], [rn - T, yn + 0.02], [rn - T, nt]];
  const body = glassShell(lathe(outer, 56), lathe(inner, 56), amber ? PAL.amber : 0xd3e3e8, amber ? 0.9 : 0.3);
  const lv = Math.min(h * fill, ys - 0.08);
  const liquidGeo = lathe([[0, 0.065], [r - 0.055 - T, 0.065], [r - T - 0.004, 0.095], [r - T - 0.004, lv], [0, lv]], 48);
  const innerM = new THREE.Mesh(liquidGeo, liquidMat(content, contentOpacity)); innerM.renderOrder = 1; innerM.visible = !amber;
  // ren cổ, vòng rót, nắp vặn có khía
  const capCol = amber ? 0x1e2124 : PAL.accent, capR = rn + 0.055;
  const capTex = canvasTexture(256, 32, (c, w, hh) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, hh); c.fillStyle = 'rgba(0,0,0,0.22)'; for (let x = 0; x < w; x += 8) c.fillRect(x, 0, 3, hh); });
  capTex.wrapS = THREE.RepeatWrapping; capTex.repeat.x = 3;
  const capM = new THREE.Mesh(cyl(capR, capR, 0.2, 48), new THREE.MeshStandardMaterial({ color: capCol, map: capTex, roughness: 0.5 }));
  capM.position.y = nt - 0.03; capM.castShadow = true;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(rn + 0.02, 0.022, 10, 40), solidMat(capCol, 0.5)); ring.rotation.x = Math.PI / 2; ring.position.y = yn + 0.045;
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(r + 0.004, r + 0.004, ys * 0.62, 48, 1, true, -0.95, 1.9),
    new THREE.MeshStandardMaterial({ map: labelTexture(title, sub, name, foot), roughness: 0.8 }),
  );
  label.position.y = ys * 0.47; label.renderOrder = 6;
  const shadow = contactShadow(r * 1.7);
  g.add(shadow, innerM, body, ring, capM, label);
  g.userData = { label, cap: capM, inner: innerM, shadow, h, top: nt, setLabel: (t, sb) => { label.material.map.dispose(); label.material.map = labelTexture(t, sb, name, foot); } };
  return g;
}

// ---------- Cốc thuỷ tinh uống nước (màn đời sống) ----------
export function makeCup({ h = 1.15, r0 = 0.3, r1 = 0.36 } = {}) {
  const g = new THREE.Group(), T = 0.025;
  const glass = glassShell(lathe([[0, 0], [r0 - 0.02, 0], [r0, 0.03], [r1, h]], 56), lathe([[0, 0.09], [r0 - T - 0.02, 0.09], [r0 - T, 0.11], [r1 - T, h]], 56));
  const rAt = (y) => lerp(r0 - T - 0.004, r1 - T - 0.004, clamp(y / h, 0, 1));
  const liquid = new THREE.Mesh(new THREE.BufferGeometry(), liquidMat(PAL.water, 0.55)); liquid.renderOrder = 1; liquid.visible = false;
  const setLevel = (l) => { liquid.visible = l > 0.11; if (!liquid.visible) return; liquid.geometry.dispose(); liquid.geometry = lathe([[0, 0.095], [rAt(0.095), 0.095], [rAt(l), l], [0, l]], 40); g.userData.level = l; };
  g.add(contactShadow(0.55), liquid, glass);
  g.userData = { liquid, setLevel, rAt, h, level: 0 };
  return g;
}

// ---------- Xi-lanh thuỷ tinh đo khí 100 mL (nằm ngang, trục +x, gốc ở đầu vòi) ----------
export function makeSyringe({ L = 1.8, r = 0.19, travel = 1.35, max = 100 } = {}) {
  const g = new THREE.Group();
  const barrelGeo = new THREE.CylinderGeometry(r, r, L, 36, 1, true); barrelGeo.rotateZ(-Math.PI / 2); barrelGeo.translate(L / 2, 0, 0);
  const barrel = glassPair(barrelGeo, 0xd3e3e8, 0.3);
  const white = solidMat(PAL.plastic, 0.4), rotZ = (m) => { m.rotation.z = Math.PI / 2; return m; };
  const capL = rotZ(new THREE.Mesh(cyl(r + 0.008, r * 0.45, 0.12, 32), white)); capL.position.x = -0.05;
  const nozzle = rotZ(new THREE.Mesh(cyl(0.04, 0.04, 0.24, 12), white)); nozzle.position.x = -0.2;
  const flange = rotZ(new THREE.Mesh(cyl(r + 0.09, r + 0.09, 0.04, 32), white)); flange.position.x = L;
  [capL, nozzle, flange].forEach((m) => { m.castShadow = true; });

  const piston = new THREE.Group();
  const head = rotZ(new THREE.Mesh(cyl(r - 0.012, r - 0.012, 0.1, 28), solidMat(0x2c3035, 0.7))); head.position.x = 0.05;
  const rod = rotZ(new THREE.Mesh(cyl(r - 0.03, r - 0.03, L, 28), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 0.25, depthWrite: false }))); rod.position.x = 0.1 + L / 2; rod.renderOrder = 3;
  const handle = rotZ(new THREE.Mesh(cyl(r + 0.07, r + 0.07, 0.05, 28), white)); handle.position.x = 0.1 + L; handle.castShadow = true;
  piston.add(head, rod, handle);

  const X0 = 0.08;
  const scale = new THREE.Mesh(
    new THREE.PlaneGeometry(travel + 0.16, 0.24),
    new THREE.MeshBasicMaterial({
      transparent: true, depthWrite: false,
      map: canvasTexture(2048, 320, (c, w) => {
        const pad = (0.08 / (travel + 0.16)) * w, span = w - 2 * pad;
        c.strokeStyle = '#1b2733'; c.fillStyle = '#1b2733'; c.textAlign = 'center'; c.textBaseline = 'top';
        for (let v = 0; v <= max; v += 2) {
          const x = pad + (v / max) * span, big = v % 10 === 0, mid = v % 10 === 0 || v % 5 === 0;
          c.lineWidth = big ? 8 : 4; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, big ? 116 : mid ? 80 : 52); c.stroke();
          if (v % 20 === 0) { c.font = `700 116px ${FONT}`; c.fillText(String(v), x, 152); }
        }
      }),
    }),
  );
  scale.position.set(X0 + travel / 2, -0.02, r + 0.004); scale.renderOrder = 7;
  g.add(barrel, capL, nozzle, flange, piston, scale);
  const setVolume = (mL) => { piston.position.x = X0 + travel * clamp(mL / max, 0, 1); };
  setVolume(0);
  g.userData = { setVolume, L, r, piston };
  return g;
}

// ---------- Giá sắt: đế 20 × 13 cm, trụ 50 cm, kẹp ba càng (vẽ gọn thành vòng kẹp) ----------
export function makeStand({ h = 5.0, armZ = 0.7, armY = 2.05, ringR = 0.23 } = {}) {
  const g = new THREE.Group();
  const steel = steelMat(), dark = solidMat(PAL.metalDark, 0.55);
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 2.0), dark); base.position.set(0, 0.05, 0.55);
  const rod = new THREE.Mesh(cyl(0.05, 0.05, h, 16), steel); rod.position.y = h / 2;
  const boss = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), dark); boss.position.y = armY;
  const arm = new THREE.Mesh(cyl(0.035, 0.035, armZ, 12), steel); arm.rotation.x = Math.PI / 2; arm.position.set(0, armY, armZ / 2);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(ringR, 0.04, 12, 32), dark); ring.rotation.y = Math.PI / 2; ring.position.set(0, armY, armZ);
  [base, rod, boss, arm, ring].forEach((m) => { m.castShadow = true; m.receiveShadow = true; });
  g.add(base, rod, boss, arm, ring);
  return g;
}

// ---------- Bếp điện phòng thí nghiệm: thân trắng, mặt gốm tròn, một núm vặn ----------
export function makeHotplate() {
  const g = new THREE.Group();
  const W = 1.9, D = 2.4, Hh = 0.5;
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, Hh, D), solidMat(PAL.plastic, 0.45)); body.position.y = Hh / 2;
  const rim = new THREE.Mesh(cyl(0.74, 0.74, 0.03, 48), steelMat()); rim.position.set(0, Hh + 0.015, -0.3);
  const plateMat = solidMat(0xf6f6f3, 0.3, { emissive: 0xff4a1a, emissiveIntensity: 0 });
  const plate = new THREE.Mesh(cyl(0.7, 0.7, 0.04, 48), plateMat); plate.position.set(0, Hh + 0.03, -0.3);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, 0.3, 0.02), solidMat(PAL.metalDark, 0.5)); panel.position.set(0, Hh / 2, D / 2 + 0.011);
  const knob = new THREE.Mesh(cyl(0.13, 0.13, 0.11, 28), solidMat(0x1f2226, 0.45)); knob.rotation.x = Math.PI / 2; knob.position.set(0.5, Hh / 2, D / 2 + 0.06);
  const led = new THREE.Mesh(new THREE.CircleGeometry(0.035, 16), new THREE.MeshBasicMaterial({ color: 0x5a6068 })); led.position.set(-0.6, Hh / 2, D / 2 + 0.023);
  [body, plate, knob].forEach((m) => { m.castShadow = true; m.receiveShadow = true; });
  g.add(body, rim, plate, panel, knob, led);
  const setTemp = (t) => { const k = clamp((t - 25) / 20, 0, 1); plateMat.emissiveIntensity = k * 0.35; led.material.color.set(k > 0 ? 0xff4a1a : 0x5a6068); };
  g.userData = { setTemp, top: Hh + 0.05, plateZ: -0.3 };
  return g;
}

// ---------- Mẩu chất rắn theo dạng: viên, vụn, bột ----------
function rng(seed) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }
export function makeSolid(form, { size = 1, color = PAL.stone } = {}) {
  const g = new THREE.Group();
  const mat = solidMat(color, 0.95, { flatShading: true });
  const rand = rng(7);
  if (form === 'vien') {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16 * size, 0), mat); m.scale.set(1.2, 0.75, 1); m.position.y = 0.11 * size; m.rotation.y = 0.5; g.add(m);
  } else if (form === 'vun') {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + rand(), d = (i === 0 ? 0 : 0.1 + rand() * 0.12) * size, s = (0.055 + rand() * 0.03) * size;
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), mat); m.position.set(Math.cos(a) * d, s * 0.8, Math.sin(a) * d); m.rotation.set(rand() * 3, rand() * 3, rand() * 3); g.add(m);
    }
  } else {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.24 * size, 24, 12), solidMat(color, 1)); m.scale.set(1, 0.22, 1); m.position.y = 0.03 * size; g.add(m);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// ---------- Mặt kính đồng hồ Ø 9 cm ----------
export function makeWatchGlass() {
  const g = new THREE.Group();
  const dish = glassPair(lathe([[0, 0.015], [0.3, 0.03], [0.43, 0.09], [0.45, 0.11]], 40), 0xd3e3e8, 0.34);
  const holder = new THREE.Group(); holder.position.y = 0.03;
  g.add(contactShadow(0.6), holder, dish);
  const setForm = (form) => { holder.clear(); if (form) holder.add(makeSolid(form)); };
  g.userData = { setForm, holder };
  return g;
}

// ---------- Giá ống nghiệm nhựa trắng ----------
export function makeRack({ slots = 4, gap = 0.36 } = {}) {
  const g = new THREE.Group();
  const mat = solidMat(PAL.plastic, 0.5);
  const w = gap * slots + 0.3, d = 0.6;
  const base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), mat); base.position.y = 0.03;
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), mat); top.position.y = 0.85;
  const mid = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), mat); mid.position.y = 0.42;
  const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.9, d), mat); sideL.position.set(-w / 2 + 0.025, 0.45, 0);
  const sideR = sideL.clone(); sideR.position.x = w / 2 - 0.025;
  [base, top, mid, sideL, sideR].forEach((m) => { m.castShadow = true; m.receiveShadow = true; });
  g.add(base, top, mid, sideL, sideR);
  const xs = []; for (let i = 0; i < slots; i++) xs.push((i - (slots - 1) / 2) * gap);
  g.userData = { slotX: xs, slotY: 0.07 };
  return g;
}

// ---------- Ống dẫn khí bằng silicone trong ----------
export function makeTube(points, radius = 0.03) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.35);
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 56, radius, 12), new THREE.MeshPhysicalMaterial({ color: 0xeef2f5, transparent: true, opacity: 0.62, roughness: 0.25, envMapIntensity: 1.5, depthWrite: false }));
  m.renderOrder = 3; m.castShadow = true;
  return m;
}
