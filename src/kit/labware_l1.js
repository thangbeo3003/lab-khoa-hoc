// Đồ dùng thêm cho Luồng 1 (bài học theo giáo án), dựng bằng mã. Đơn vị: 1 = 10 cm. Gốc mỗi món nằm trên mặt bàn.
// Ống đong, tờ giấy chữ X, đồng hồ bấm giây, vòng sáng đánh dấu trạm, vòng kính soi hạt.
// Thêm 20/11 cho phòng nhiều bàn (kit/labset.js): xi-lanh đo khí hai chiều, chậu rửa nhỏ, nhiệt kế, trụ đỡ.
import * as THREE from 'three';
import { PAL, glassMat, glassPair, glassShell, liquidMat, solidMat, steelMat, canvasTexture, contactShadow, FONT } from './materials.js';
import { gradDecal } from './labware.js';

const V2 = (p) => new THREE.Vector2(p[0], p[1]);
const lathe = (pts, seg = 48) => new THREE.LatheGeometry(pts.map(V2), seg);
const cyl = (r1, r2, h, seg = 28) => new THREE.CylinderGeometry(r1, r2, h, seg);

// ---------- Ống đong 50 mL: thân Ø 2,6 cm, cao 20 cm, đế lục giác ----------
export function makeMeasuringCylinder({ r = 0.13, h = 2.0, max = 50 } = {}) {
  const g = new THREE.Group(), T = 0.018, y0 = 0.1;
  const glass = glassShell(
    lathe([[0, y0], [r, y0], [r, h - 0.04], [r + 0.03, h]], 40),
    lathe([[0, y0 + 0.05], [r - T, y0 + 0.05], [r - T, h - 0.03], [r + 0.03, h]], 40),
  );
  const foot = new THREE.Mesh(cyl(r * 2.3, r * 2.5, y0, 6), glassMat(0xd3e3e8, 0.34)); // đế lục giác cùng chất liệu thuỷ tinh
  foot.position.y = y0 / 2; foot.renderOrder = 4;
  const yLo = y0 + 0.12, yHi = h - 0.28, marks = [];
  for (let v = 5; v <= max; v += 5) marks.push([(v / max), v % 10 === 0 ? String(v) : '', v % 10 === 0]);
  const decal = gradDecal([[r + 0.004, yLo], [r + 0.004, yHi]], marks, { arc: 1.5 });
  const liquid = new THREE.Mesh(new THREE.BufferGeometry(), liquidMat()); liquid.renderOrder = 1; liquid.visible = false;
  const setVolume = (mL) => {
    liquid.visible = mL > 0; g.userData.mL = mL; if (!liquid.visible) return;
    const l = yLo + (yHi - yLo) * Math.min(1, mL / max);
    liquid.geometry.dispose(); liquid.geometry = lathe([[0, y0 + 0.055], [r - T - 0.004, y0 + 0.055], [r - T - 0.004, l], [0, l]], 32);
  };
  g.add(contactShadow(r * 3.2), liquid, glass, foot, decal);
  g.userData = { liquid, setVolume, h, top: h, mL: 0 };
  return g;
}

// ---------- Tờ giấy trắng có chữ X đậm, lót dưới bình (thí nghiệm sodium thiosulfate) ----------
export function makeXPaper({ s = 1.15 } = {}) {
  const tex = canvasTexture(256, 256, (c, w, h) => {
    c.fillStyle = '#fbfbf8'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#111418'; c.lineWidth = 30; c.lineCap = 'round';
    c.beginPath(); c.moveTo(w * 0.3, h * 0.3); c.lineTo(w * 0.7, h * 0.7); c.moveTo(w * 0.7, h * 0.3); c.lineTo(w * 0.3, h * 0.7); c.stroke();
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.008; m.receiveShadow = true;
  const g = new THREE.Group(); g.add(m);
  return g;
}

// ---------- Đồng hồ bấm giây để bàn: hộp đen, mặt số tinh thể lỏng nghiêng về phía người nhìn ----------
export function makeTimer() {
  const g = new THREE.Group(), W = 0.72, H = 0.5, D = 0.34;
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), solidMat(0x202428, 0.5)); body.position.y = H / 2; body.castShadow = true;
  const cv = document.createElement('canvas'); cv.width = 384; cv.height = 192;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.12, H - 0.16), new THREE.MeshBasicMaterial({ map: tex }));
  face.position.set(0, H / 2 + 0.02, D / 2 + 0.004);
  const btn = new THREE.Mesh(cyl(0.05, 0.05, 0.05, 16), solidMat(0xc0392b, 0.5)); btn.position.set(W / 2 - 0.14, H + 0.02, 0);
  let shown = null;
  const setTime = (sec) => {
    const t = Number(sec).toFixed(1).replace('.', ','); if (t === shown) return; shown = t;
    const c = cv.getContext('2d');
    c.fillStyle = '#dfe8dc'; c.fillRect(0, 0, 384, 192);
    c.fillStyle = '#14181c'; c.textAlign = 'right'; c.textBaseline = 'middle';
    // Số dài (từ 100,0 s: lần đo dài nhất của bàn Bề mặt là 260,0 s) rộng hơn mặt số: thu cỡ chữ cho vừa, chừa 14 px ở mép trái. Số ngắn vẫn cỡ 124 như trước.
    let fs = 124; c.font = `700 ${fs}px ${FONT}`; const wd = c.measureText(t).width; if (wd > 286) { fs = Math.floor((fs * 286) / wd); c.font = `700 ${fs}px ${FONT}`; }
    c.fillText(t, 300, 104);
    c.font = `600 56px ${FONT}`; c.textAlign = 'left'; c.fillText('s', 312, 122);
    tex.needsUpdate = true;
  };
  setTime(0);
  g.add(contactShadow(0.55), body, face, btn);
  g.rotation.x = -0.12; // hơi ngửa cho dễ đọc
  g.userData = { setTime };
  return g;
}

// ---------- Vòng sáng trên mặt bàn đánh dấu trạm đang xem ----------
export function makeFocusRing(color = '#087b91', r = 1.5) {
  const m = new THREE.Mesh(new THREE.RingGeometry(r - 0.045, r, 72), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.012; m.renderOrder = 1;
  let goal = 0, level = 0, t = 0;
  m.userData = {
    show: (on) => { goal = on ? 1 : 0; },
    update: (dt) => { t += dt; level += (goal - level) * Math.min(1, dt * 8); m.material.opacity = level * (0.78 + 0.16 * Math.sin(t * 3.2)); m.visible = level > 0.01; },
  };
  return m;
}

// ---------- Vòng kính soi hạt: một thấu kính tròn trên chân đế, bên trong là mô hình hạt đang chuyển động (minh hoạ) ----------
// Hạt mờ = hạt thường, hạt sáng = hạt đủ năng lượng. Hai hạt sáng chạm nhau thì loé vòng: va chạm hiệu quả.
// userData.set({ count, speed, hot }) đổi số hạt, độ nhanh, tỉ lệ hạt đủ năng lượng; userData.rate() trả số va chạm hiệu quả mỗi giây (trung bình trượt).
export function makeParticleLens({ R = 0.85, y = 2.3, n = 26, max = 60 } = {}) {
  const g = new THREE.Group(), S = 320;
  const steel = steelMat(), white = solidMat(0xf4f5f6, 0.35);
  const base = new THREE.Mesh(cyl(0.42, 0.48, 0.08, 36), solidMat(0x30343a, 0.55)); base.position.y = 0.04; base.castShadow = true;
  const post = new THREE.Mesh(cyl(0.04, 0.04, y - R, 14), steel); post.position.y = (y - R) / 2; post.castShadow = true;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.075, 16, 72), white); rim.position.y = y; rim.castShadow = true;
  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(R - 0.02, 64), new THREE.MeshBasicMaterial({ map: tex })); disc.position.y = y; disc.position.z = 0.01;
  const back = new THREE.Mesh(new THREE.CircleGeometry(R - 0.02, 48), solidMat(0x17182d, 0.6)); back.position.y = y; back.rotation.y = Math.PI; back.position.z = -0.01;
  let seed = 5; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const parts = Array.from({ length: Math.max(n, max) }, (_, i) => { const a = rnd() * 6.283, d = Math.sqrt(rnd()) * 0.82, v = 0.16 + rnd() * 0.2, b = rnd() * 6.283; return { x: Math.cos(a) * d, y: Math.sin(a) * d, vx: Math.cos(b) * v, vy: Math.sin(b) * v, hot: i % 4 === 0, h: rnd() }; });
  let speedMul = 1, hits = 0, win = 0, rate = 0;
  const set = ({ count = n, speed = 1, hot = 0.25 } = {}) => { n = Math.max(4, Math.min(parts.length, Math.round(count))); speedMul = speed; parts.forEach((q) => { q.hot = q.h < hot; }); };
  const flashes = []; let acc = 1;
  function draw() {
    const c = cv.getContext('2d'), h = S / 2, k = h * 0.94;
    c.fillStyle = '#17182d'; c.fillRect(0, 0, S, S);
    flashes.forEach((f) => { c.strokeStyle = `rgba(255,255,255,${(1 - f.t) * 0.9})`; c.lineWidth = 3; c.beginPath(); c.arc(h + f.x * k, h - f.y * k, 8 + f.t * 26, 0, 6.283); c.stroke(); });
    parts.slice(0, n).forEach((p) => {
      const px = h + p.x * k, py = h - p.y * k;
      if (p.hot) { const gr = c.createRadialGradient(px, py, 1, px, py, 15); gr.addColorStop(0, 'rgba(255,214,120,0.95)'); gr.addColorStop(1, 'rgba(255,214,120,0)'); c.fillStyle = gr; c.beginPath(); c.arc(px, py, 15, 0, 6.283); c.fill(); }
      c.fillStyle = p.hot ? '#ffd27a' : '#8f9ac0'; c.beginPath(); c.arc(px, py, p.hot ? 7 : 6, 0, 6.283); c.fill();
    });
    tex.needsUpdate = true;
  }
  function update(dt) {
    const lim = 0.9;
    parts.slice(0, n).forEach((p) => {
      const sp = (p.hot ? 1.9 : 1) * speedMul; p.x += p.vx * sp * dt; p.y += p.vy * sp * dt;
      const d = Math.hypot(p.x, p.y); if (d > lim) { const nx = p.x / d, ny = p.y / d, dot = p.vx * nx + p.vy * ny; if (dot > 0) { p.vx -= 2 * dot * nx; p.vy -= 2 * dot * ny; } p.x = nx * lim; p.y = ny * lim; }
    });
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const a = parts[i], b = parts[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if (d > 0.085 || d === 0) continue;
      const nx = dx / d, ny = dy / d, rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny; if (rel > 0) continue;
      a.vx += rel * nx; a.vy += rel * ny; b.vx -= rel * nx; b.vy -= rel * ny;
      if (a.hot && b.hot) { hits++; if (flashes.length < 6) flashes.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, t: 0 }); }
    }
    for (let i = flashes.length - 1; i >= 0; i--) { flashes[i].t += dt * 1.6; if (flashes[i].t >= 1) flashes.splice(i, 1); }
    win += dt; if (win >= 1.5) { rate += (hits / win - rate) * 0.6; hits = 0; win = 0; }
    acc += dt; if (acc >= 1 / 30) { acc = 0; draw(); } // vẽ lại mặt kính tối đa 30 lần mỗi giây
  }
  draw();
  g.add(contactShadow(0.7), base, post, back, disc, rim);
  g.userData = { update, set, rate: () => rate, center: new THREE.Vector3(0, y, 0), R, canvas: cv }; // canvas: để món khác (tivi) chiếu lại đúng mô hình này
  return g;
}

// ---------- Xi-lanh thuỷ tinh đo khí 100 mL nằm ngang cho bộ hai bình: dir = 1 thân chạy về +x, dir = -1 chạy về −x (số trên thang vẫn đọc xuôi). Gốc ở sau đầu vòi ----------
export function makeGasSyringe({ L = 1.25, r = 0.17, travel = 1.1, max = 100, dir = 1 } = {}) {
  const g = new THREE.Group(), X0 = 0.08;
  const barrelGeo = new THREE.CylinderGeometry(r, r, L, 36, 1, true); barrelGeo.rotateZ(-Math.PI / 2); barrelGeo.translate(dir * L / 2, 0, 0);
  const barrel = glassPair(barrelGeo, 0xd3e3e8, 0.3);
  const white = solidMat(PAL.plastic, 0.4), rotZ = (m, x) => { m.rotation.z = (Math.PI / 2) * dir; m.position.x = dir * x; return m; };
  const capL = rotZ(new THREE.Mesh(cyl(r + 0.008, r * 0.45, 0.12, 32), white), -0.05);
  const nozzle = rotZ(new THREE.Mesh(cyl(0.04, 0.04, 0.24, 12), white), -0.2);
  const flange = rotZ(new THREE.Mesh(cyl(r + 0.09, r + 0.09, 0.04, 32), white), L);
  [capL, nozzle, flange].forEach((m) => { m.castShadow = true; });
  const piston = new THREE.Group();
  const head = rotZ(new THREE.Mesh(cyl(r - 0.012, r - 0.012, 0.1, 28), solidMat(0x2c3035, 0.7)), 0.05);
  const rod = rotZ(new THREE.Mesh(cyl(r - 0.03, r - 0.03, L, 28), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 0.25, depthWrite: false })), 0.1 + L / 2); rod.renderOrder = 3;
  const handle = rotZ(new THREE.Mesh(cyl(r + 0.07, r + 0.07, 0.05, 28), white), 0.1 + L); handle.castShadow = true;
  piston.add(head, rod, handle);
  const scale = new THREE.Mesh(new THREE.PlaneGeometry(travel + 0.16, 0.24), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false,
    map: canvasTexture(2048, 320, (c, w) => {
      const pad = (0.08 / (travel + 0.16)) * w, span = w - 2 * pad;
      c.strokeStyle = '#1b2733'; c.fillStyle = '#1b2733'; c.textAlign = 'center'; c.textBaseline = 'top';
      for (let v = 0; v <= max; v += 2) {
        const x = pad + (dir > 0 ? v / max : 1 - v / max) * span, big = v % 10 === 0, mid = big || v % 5 === 0;
        c.lineWidth = big ? 8 : 4; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, big ? 116 : mid ? 80 : 52); c.stroke();
        if (v % 20 === 0) { c.font = `700 116px ${FONT}`; c.fillText(String(v), x, 152); }
      }
    }) }));
  scale.position.set(dir * (X0 + travel / 2), -0.02, r + 0.004); scale.renderOrder = 7;
  g.add(barrel, capL, nozzle, flange, piston, scale);
  const setVolume = (mL) => { piston.position.x = dir * (X0 + travel * Math.min(1, Math.max(0, mL / max))); g.userData.mL = mL; };
  g.userData = { setVolume, L, r, dir, mL: 0, tipX: -0.32 * dir };
  setVolume(0);
  return g;
}

// ---------- Chậu rửa inox nhỏ đặt trên bàn + vòi cổ ngỗng. userData.setFlow(true) cho nước chảy ----------
export function makeSink({ w = 1.4, d = 1.25 } = {}) {
  const g = new THREE.Group(), steel = steelMat(), box = (a, b, c, m) => new THREE.Mesh(new THREE.BoxGeometry(a, b, c), m);
  const rim = box(w, 0.06, d, steel); rim.position.y = 0.03; rim.receiveShadow = true;
  const bowl = box(w - 0.2, 0.02, d - 0.2, solidMat(0x565d66, 0.35, { metalness: 0.8 })); bowl.position.y = 0.065;
  const zb = -d / 2 + 0.13;
  const curve = new THREE.CatmullRomCurve3([[0, 0, zb], [0, 1.45, zb], [0, 1.8, zb + 0.2], [0, 1.8, -0.12], [0, 1.6, 0.04]].map((q) => new THREE.Vector3(...q)));
  const tap = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.05, 12), steel); tap.castShadow = true;
  const lever = box(0.3, 0.05, 0.08, steel); lever.position.set(0.18, 0.6, zb);
  const water = new THREE.Mesh(cyl(0.03, 0.026, 1.5, 10), liquidMat(PAL.water, 0.7)); water.position.set(0, 0.84, 0.04); water.visible = false; water.renderOrder = 3;
  g.add(rim, bowl, tap, lever, water);
  g.userData = { spout: new THREE.Vector3(0, 1.6, 0.04), setFlow: (on) => { water.visible = !!on; } };
  return g;
}

// ---------- Nhiệt kế rượu màu đỏ, thang 0 đến 100 °C. Gốc ở bầu ----------
export function makeThermometer({ h = 1.9 } = {}) {
  const g = new THREE.Group(), red = new THREE.MeshBasicMaterial({ color: 0xd62f2f });
  const rod = new THREE.Mesh(cyl(0.022, 0.022, h, 12), glassMat(0xe8f1f4, 0.4)); rod.position.y = h / 2; rod.renderOrder = 4;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 10), red); bulb.position.y = 0.03;
  const col = new THREE.Mesh(cyl(0.009, 0.009, 1, 8), red);
  const y0 = 0.06, y1 = h - 0.12;
  const setTemp = (t) => { const len = Math.max(0.02, (y1 - y0) * Math.min(1, Math.max(0, t / 100))); col.scale.y = len; col.position.y = y0 + len / 2; g.userData.temp = t; };
  g.add(bulb, col, rod);
  g.userData = { setTemp, temp: 25, h };
  setTemp(25);
  return g;
}

// ---------- Trụ đỡ: đế thép sơn đen + trụ inox ----------
export function makePost({ h = 3.0 } = {}) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.08, 0.62), solidMat(PAL.metalDark, 0.55)); base.position.set(0, 0.04, 0.12);
  const rod = new THREE.Mesh(cyl(0.04, 0.04, h, 14), steelMat()); rod.position.y = h / 2;
  [base, rod].forEach((m) => { m.castShadow = true; m.receiveShadow = true; });
  g.add(base, rod);
  return g;
}

// ---------- Cân điện tử để bàn: thân trắng, đĩa cân inox, màn hình số ở mặt trước. userData.setValue(gam) hoặc setValue(null) để về 0 ----------
export function makeBalance() {
  const g = new THREE.Group(), W = 1.15, D = 1.3, H = 0.2, box = (a, b, c, m) => new THREE.Mesh(new THREE.BoxGeometry(a, b, c), m);
  const body = box(W, H, D, solidMat(PAL.plastic, 0.45)); body.position.y = H / 2;
  const desk = box(W, 0.34, 0.3, solidMat(PAL.plastic, 0.45)); desk.position.set(0, 0.17, D / 2 - 0.15);
  const pan = new THREE.Mesh(cyl(0.46, 0.46, 0.03, 40), steelMat()); pan.position.set(0, H + 0.055, -0.16);
  const neck = new THREE.Mesh(cyl(0.08, 0.08, 0.05, 16), solidMat(PAL.metalDark, 0.5)); neck.position.set(0, H + 0.02, -0.16);
  [body, desk, pan].forEach((m) => { m.castShadow = true; m.receiveShadow = true; });
  const cv = document.createElement('canvas'); cv.width = 384; cv.height = 128;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.26), new THREE.MeshBasicMaterial({ map: tex })); face.position.set(0, 0.18, D / 2 + 0.004);
  let shown;
  const setValue = (v) => {
    const t = (v == null ? 0 : v).toFixed(2).replace('.', ','); if (t === shown) return; shown = t;
    const c = cv.getContext('2d'); c.fillStyle = '#dfe8dc'; c.fillRect(0, 0, 384, 128);
    c.fillStyle = '#14181c'; c.textBaseline = 'middle'; c.textAlign = 'right'; c.font = `700 92px ${FONT}`; c.fillText(t, 300, 68);
    c.textAlign = 'left'; c.font = `600 48px ${FONT}`; c.fillText('g', 312, 80); tex.needsUpdate = true; g.userData.value = v;
  };
  g.add(contactShadow(0.9), body, desk, neck, pan, face);
  g.userData = { setValue, value: null, panTop: new THREE.Vector3(0, H + 0.075, -0.16) };
  setValue(null);
  return g;
}

// =====================================================================================
// ĐỒ TẠO KHÔNG KHÍ PHÒNG LAB (thêm 20/11): đặt quanh phòng, KHÔNG chạm được, không nằm trên bàn thí nghiệm.
// Gốc mỗi món nằm trên SÀN (bộ máy đặt chúng ở độ cao sàn). Đơn vị: 1 = 10 cm.
// =====================================================================================
const shade = (g) => { g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };

// ---------- Ghế đẩu phòng lab: mặt ghế tròn xanh, trụ inox, vòng gác chân, đế tròn ----------
export function makeStool({ color = PAL.accent } = {}) {
  const g = new THREE.Group(), steel = steelMat();
  const seat = new THREE.Mesh(cyl(1.55, 1.5, 0.34, 32), solidMat(color, 0.6)); seat.position.y = 5.95;
  const post = new THREE.Mesh(cyl(0.14, 0.14, 5.6, 12), steel); post.position.y = 3.0;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.07, 8, 32), steel); ring.rotation.x = Math.PI / 2; ring.position.y = 2.3;
  const spokes = [0, 1, 2].map((i) => { const m = new THREE.Mesh(cyl(0.05, 0.05, 2.3, 8), steel); m.rotation.z = Math.PI / 2; m.rotation.y = (i * Math.PI) / 3; m.position.y = 2.3; return m; });
  const foot = new THREE.Mesh(cyl(1.5, 1.7, 0.2, 32), solidMat(PAL.metalDark, 0.5)); foot.position.y = 0.1;
  g.add(seat, post, ring, ...spokes, foot);
  return shade(g);
}

// ---------- Cây treo áo: trụ inox trên đế tròn, hai áo blouse trắng treo hai bên ----------
export function makeCoatStand() {
  const g = new THREE.Group(), steel = steelMat(), cloth = solidMat(0xf4f5f6, 0.92), H = 17.2;
  const base = new THREE.Mesh(cyl(1.7, 1.9, 0.25, 32), solidMat(PAL.metalDark, 0.5)); base.position.y = 0.125;
  const pole = new THREE.Mesh(cyl(0.13, 0.13, H, 12), steel); pole.position.y = H / 2;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), steel); knob.position.y = H + 0.1;
  g.add(base, pole, knob);
  [0, 1, 2, 3].forEach((i) => { const a = (i * Math.PI) / 2 + 0.4, hook = new THREE.Mesh(cyl(0.05, 0.05, 1.3, 8), steel); hook.position.set(Math.cos(a) * 0.5, H - 1.3, Math.sin(a) * 0.5); hook.rotation.z = -Math.cos(a) * 0.9; hook.rotation.x = Math.sin(a) * 0.9; g.add(hook); });
  // Một áo blouse: thân dẹt, hai vai bo, hai tay áo buông
  const coat = (a) => {
    const c = new THREE.Group(), body = new THREE.Mesh(cyl(1.65, 1.95, 8.6, 20), cloth); body.scale.z = 0.3; body.position.y = -4.9;
    const yoke = new THREE.Mesh(new THREE.SphereGeometry(1.7, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), cloth); yoke.scale.set(1, 0.42, 0.32); yoke.position.y = -0.62;
    const sleeve = (sx) => { const m = new THREE.Mesh(cyl(0.42, 0.5, 6.2, 12), cloth); m.position.set(sx * 1.85, -3.7, 0); m.rotation.z = sx * 0.09; return m; };
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.5, 0.12), solidMat(0xdfe3e6, 0.9)); collar.position.set(0, -1.3, 0.52);
    c.add(body, yoke, sleeve(-1), sleeve(1), collar);
    c.position.set(Math.cos(a) * 1.05, H - 1.2, Math.sin(a) * 1.05); c.rotation.y = -a + Math.PI / 2;
    return c;
  };
  g.add(coat(0.4), coat(0.4 + Math.PI));
  return shade(g);
}

// ---------- Xe đẩy inox hai tầng: tầng trên có hai kính bảo hộ và một hộp găng tay ----------
export function makeTrolley() {
  const g = new THREE.Group(), steel = steelMat(), W = 6.2, D = 3.8, box = (a, b, c, m) => new THREE.Mesh(new THREE.BoxGeometry(a, b, c), m);
  [3.0, 7.4].forEach((y) => { const s = box(W, 0.14, D, steel); s.position.y = y; const lip = box(W, 0.3, 0.08, steel); lip.position.set(0, y + 0.15, -D / 2 + 0.04); g.add(s, lip); });
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => { const leg = new THREE.Mesh(cyl(0.1, 0.1, 7.6, 10), steel); leg.position.set(sx * (W / 2 - 0.15), 4.0, sz * (D / 2 - 0.15)); const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), solidMat(0x2a2d31, 0.6)); wheel.position.set(sx * (W / 2 - 0.15), 0.28, sz * (D / 2 - 0.15)); g.add(leg, wheel); });
  const handle = new THREE.Mesh(cyl(0.08, 0.08, D - 0.3, 10), steel); handle.rotation.x = Math.PI / 2; handle.position.set(W / 2 + 0.25, 8.3, 0); g.add(handle);
  [-1, 1].forEach((sz) => { const arm = new THREE.Mesh(cyl(0.07, 0.07, 1.0, 8), steel); arm.position.set(W / 2 + 0.1, 7.9, sz * (D / 2 - 0.2)); arm.rotation.z = -0.3; g.add(arm); });
  // Kính bảo hộ: mắt kính nhựa trong, gọng trên sẫm màu, dây đeo
  const goggles = (x, z, ry) => {
    const k = new THREE.Group(), lens = box(1.45, 0.55, 0.5, glassMat(0xcfe6f2, 0.45)); lens.position.y = 0.3; lens.renderOrder = 4;
    const rim = box(1.55, 0.1, 0.56, solidMat(0x2f6fd0, 0.5)); rim.position.y = 0.6;
    const strap = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.045, 8, 24, Math.PI), solidMat(0x30343a, 0.8)); strap.rotation.x = Math.PI / 2; strap.rotation.z = Math.PI; strap.position.set(0, 0.32, -0.25);
    k.add(lens, rim, strap); k.position.set(x, 7.47, z); k.rotation.y = ry; return k;
  };
  const gloves = box(2.0, 0.85, 1.15, solidMat(0x3c7fd6, 0.7)); gloves.position.set(1.7, 7.9, -0.6);
  const label = box(1.2, 0.5, 0.02, solidMat(0xffffff, 0.8)); label.position.set(1.7, 7.9, -0.015);
  const tray = box(2.6, 0.5, 2.0, solidMat(0xe9ecee, 0.7)); tray.position.set(-0.6, 3.32, 0.2); // khay nhựa ở tầng dưới
  g.add(goggles(-1.9, 0.5, 0.25), goggles(-0.3, 0.75, -0.2), gloves, label, tray);
  return shade(g);
}

// ---------- ĐÁM HẠT 3D cho tivi (chủ 21/11: "làm cái ở tivi trông giống kiểu 3d ... các hạt bên lap 2") ----------
// Hạt là KHỐI CẦU thật, cùng chất liệu và cùng bộ đèn với hạt của trang Thực hành (MeshStandardMaterial nhám 0,32 + đèn trời + một đèn chiếu),
// bay hỗn loạn trong một quả cầu; cả đám xoay chậm để thấy chiều sâu, hạt ở xa mờ dần. Luật như mô hình phẳng cũ: hạt thường, hạt đủ năng lượng
// (vàng, có quầng), hai hạt đủ năng lượng chạm nhau = một va chạm hiệu quả (loé sáng, cộng vào số đếm).
// Cảnh riêng, vẽ vào một tấm ảnh (render target) rồi dán lên màn tivi: render(renderer) gọi từ onBeforeRender của tấm màn.
function makeParticleCloud({ n = 26, max = 60, size = 768 } = {}) {
  const BG = 0x0b0c1f, scene = new THREE.Scene(); scene.background = new THREE.Color(BG); scene.fog = new THREE.Fog(BG, 3.6, 6.4);
  const cam = new THREE.PerspectiveCamera(32, 1, 0.5, 12); cam.position.set(0, 0, 3.75);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x18263a, 1.3)); const sun = new THREE.DirectionalLight(0xffffff, 1.9); sun.position.set(5, 12, 10); scene.add(sun);
  const world = new THREE.Group(); scene.add(world);
  const RP = 0.095, LIM = 0.89, GEO = new THREE.SphereGeometry(1, 28, 18);
  const coldM = new THREE.MeshStandardMaterial({ color: 0x9aa7d6, roughness: 0.32, metalness: 0.05 });
  const hotM = new THREE.MeshStandardMaterial({ color: 0xffd27a, roughness: 0.32, metalness: 0.05, emissive: 0xff8a1e, emissiveIntensity: 0.35 });
  const haloM = new THREE.MeshBasicMaterial({ color: 0xffc866, transparent: true, opacity: 0.11, depthWrite: false, blending: THREE.AdditiveBlending });
  // vỏ quả cầu: một lớp kính rất mờ để thấy các hạt nằm TRONG một khối, không phải trên mặt phẳng
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1.02, 48, 32), new THREE.MeshPhysicalMaterial({ color: 0xbcd3ea, transparent: true, opacity: 0.07, roughness: 0.08, side: THREE.BackSide, depthWrite: false, fog: false }));
  scene.add(shell);
  let seed = 5; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const parts = Array.from({ length: Math.max(n, max) }, () => {
    let x, y, z; do { x = rnd() * 2 - 1; y = rnd() * 2 - 1; z = rnd() * 2 - 1; } while (x * x + y * y + z * z > 0.72);
    const a = rnd() * 6.283, u = rnd() * 2 - 1, q = Math.sqrt(1 - u * u), v = 0.16 + rnd() * 0.2;
    const m = new THREE.Mesh(GEO, coldM); m.scale.setScalar(RP); const halo = new THREE.Mesh(GEO, haloM); halo.scale.setScalar(1.7); halo.visible = false; m.add(halo); world.add(m);
    return { x, y, z, vx: Math.cos(a) * q * v, vy: Math.sin(a) * q * v, vz: u * v, hot: false, h: rnd(), m, halo };
  });
  const flashes = Array.from({ length: 6 }, () => { const m = new THREE.Mesh(GEO, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); m.visible = false; world.add(m); return { m, t: 1 }; });
  let speedMul = 1, hits = 0, win = 0, rate = 0;
  const set = ({ count = n, speed = 1, hot = 0.25 } = {}) => {
    n = Math.max(4, Math.min(parts.length, Math.round(count))); speedMul = speed;
    parts.forEach((q, i) => { q.hot = q.h < hot; q.m.visible = i < n; q.m.material = q.hot ? hotM : coldM; q.halo.visible = q.hot; });
  };
  function update(dt) {
    dt = Math.min(dt, 0.05);
    for (let i = 0; i < n; i++) {
      const p = parts[i], sp = (p.hot ? 1.9 : 1) * speedMul; p.x += p.vx * sp * dt; p.y += p.vy * sp * dt; p.z += p.vz * sp * dt;
      const d = Math.hypot(p.x, p.y, p.z); if (d > LIM) { const nx = p.x / d, ny = p.y / d, nz = p.z / d, dot = p.vx * nx + p.vy * ny + p.vz * nz; if (dot > 0) { p.vx -= 2 * dot * nx; p.vy -= 2 * dot * ny; p.vz -= 2 * dot * nz; } p.x = nx * LIM; p.y = ny * LIM; p.z = nz * LIM; }
    }
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const a = parts[i], b = parts[j], dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, d = Math.hypot(dx, dy, dz);
      if (d > 2 * RP || d === 0) continue; // hai khối cầu chạm nhau
      const nx = dx / d, ny = dy / d, nz = dz / d, rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny + (b.vz - a.vz) * nz; if (rel > 0) continue;
      a.vx += rel * nx; a.vy += rel * ny; a.vz += rel * nz; b.vx -= rel * nx; b.vy -= rel * ny; b.vz -= rel * nz;
      if (a.hot && b.hot) { hits++; const f = flashes.find((q) => q.t >= 1); if (f) { f.t = 0; f.m.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); f.m.visible = true; } }
    }
    for (let i = 0; i < n; i++) { const p = parts[i]; p.m.position.set(p.x, p.y, p.z); }
    flashes.forEach((f) => { if (f.t >= 1) return; f.t += dt * 1.6; if (f.t >= 1) { f.m.visible = false; return; } f.m.scale.setScalar(0.1 + f.t * 0.2); f.m.material.opacity = (1 - f.t) * (1 - f.t) * 0.8; });
    world.rotation.y += dt * 0.12; // cả đám xoay chậm: thấy rõ hạt nào gần, hạt nào xa
    win += dt; if (win >= 1.5) { rate += (hits / win - rate) * 0.6; hits = 0; win = 0; }
  }
  const rt = new THREE.WebGLRenderTarget(size, size, { samples: 4 });
  function render(renderer) { // vẽ cảnh hạt vào tấm ảnh, rồi trả bộ vẽ về đúng trạng thái đang có
    const prev = renderer.getRenderTarget(), xr = renderer.xr.enabled, sh = renderer.shadowMap.autoUpdate;
    renderer.xr.enabled = false; renderer.shadowMap.autoUpdate = false;
    renderer.setRenderTarget(rt); renderer.render(scene, cam);
    renderer.xr.enabled = xr; renderer.shadowMap.autoUpdate = sh; renderer.setRenderTarget(prev);
  }
  set({});
  return { update, set, rate: () => rate, render, texture: rt.texture };
}

// ---------- Tivi treo tường chiếu MÔ HÌNH HẠT (thêm 20/11, thay vòng kính đứng giữa phòng; 21/11: hạt là khối cầu 3D) ----------
// Màn hình 16:9: bên trái là quả cầu chứa đám hạt 3D (makeParticleCloud), bên phải là tên, số đếm và chú thích (vẽ bằng canvas).
// Gốc ở tâm màn hình, mặt quay về +z. userData: update(dt), set({ count, speed, hot }), rate(), setLive(bật/tắt chuyển động).
export function makeParticleTV({ w = 11, h = 6.2 } = {}) {
  const g = new THREE.Group(), CU = makeParticleCloud(), CW = 1024, CH = Math.round((1024 * h) / w);
  const body = new THREE.Mesh(new THREE.BoxGeometry(w + 0.34, h + 0.34, 0.26), solidMat(0x15171a, 0.45)); body.position.z = 0.13; body.castShadow = true;
  const mount = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 0.12), solidMat(PAL.metalDark, 0.6)); mount.position.z = 0.02;
  const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex })); screen.position.z = 0.265;
  // quả cầu hạt: một tấm tròn dán ảnh của cảnh hạt 3D, nằm ngay trước màn, lọt trong vòng viền vẽ trên canvas
  const R = CH * 0.42, cx = CH * 0.52, cy = CH * 0.5, U = w / CW;
  const ballM = new THREE.MeshBasicMaterial({ map: CU.texture, toneMapped: false });
  const ball = new THREE.Mesh(new THREE.CircleGeometry((R - 2) * U, 72), ballM); ball.position.set((cx - CW / 2) * U, (CH / 2 - cy) * U, 0.27);
  let live = true, acc = 1, dirty = true;
  ball.onBeforeRender = (renderer) => { if (!dirty) return; dirty = false; CU.render(renderer); }; // chỉ vẽ lại cảnh hạt khi tivi đang nằm trong khung hình
  function draw() {
    const c = cv.getContext('2d');
    c.fillStyle = '#12132a'; c.fillRect(0, 0, CW, CH);
    c.fillStyle = '#0b0c1f'; c.beginPath(); c.arc(cx, cy, R, 0, 6.283); c.fill();
    c.strokeStyle = '#c9cdf5'; c.lineWidth = 6; c.beginPath(); c.arc(cx, cy, R, 0, 6.283); c.stroke();
    const x = CH * 1.08; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    c.fillStyle = '#ffffff'; c.font = `700 ${CH * 0.085}px ${FONT}`; c.fillText('Mô hình hạt', x, CH * 0.2);
    c.fillStyle = '#aeb4e6'; c.font = `500 ${CH * 0.05}px ${FONT}`; c.fillText('Va chạm hiệu quả mỗi giây', x, CH * 0.36);
    c.fillStyle = '#c1ff24'; c.font = `700 ${CH * 0.2}px ${FONT}`; c.fillText(CU.rate().toFixed(1).replace('.', ','), x, CH * 0.58);
    // chú thích: mỗi dòng một viên bi nhỏ có khối (sáng ở góc trên trái) cho khớp với hạt 3D
    const dot = (col, lite, text, y) => { const r = CH * 0.02, bx = x + CH * 0.02, by = y - CH * 0.016, gr = c.createRadialGradient(bx - r * 0.35, by - r * 0.4, r * 0.1, bx, by, r); gr.addColorStop(0, lite); gr.addColorStop(1, col); c.fillStyle = gr; c.beginPath(); c.arc(bx, by, r, 0, 6.283); c.fill(); c.fillStyle = '#d5d8f3'; c.font = `500 ${CH * 0.045}px ${FONT}`; c.fillText(text, x + CH * 0.06, y); };
    dot('#e0a23c', '#fff1c9', 'hạt đủ năng lượng', CH * 0.72); dot('#6f7cb0', '#dfe5ff', 'hạt thường', CH * 0.8); dot('#c9cbd6', '#ffffff', 'loé sáng: va chạm hiệu quả', CH * 0.88);
    if (!live) { c.fillStyle = 'rgba(18,19,42,0.55)'; c.fillRect(0, 0, CW, CH); }
    tex.needsUpdate = true;
  }
  const update = (dt) => { if (live) { CU.update(dt); dirty = true; } acc += dt; if (acc >= (live ? 1 / 20 : 1)) { acc = 0; draw(); } };
  draw();
  g.add(mount, body, screen, ball);
  g.userData = { update, set: (o) => { CU.set(o); dirty = true; }, rate: CU.rate, setLive: (on) => { live = !!on; acc = 9; ballM.color.setScalar(live ? 1 : 0.45); dirty = true; }, w, h };
  return g;
}

// ======================================================================================================
// TỦ ĐỒ THÊM 26/11 cho bài "Nhóm halogen" (CHEM10-05): tủ hút, giá sắt, bình cầu có nhánh, phễu nhỏ giọt, bình rửa khí, cốc, đồng hồ khí độc, tivi phản ứng.
// Đồ thuỷ tinh dùng ẢNH của trang Thực hành (assets/flat, kiểu E, chỉ đọc): một tấm ảnh luôn quay mặt về máy quay, đứng trên đáy món.
// Ảnh nền xám 50% hoà kiểu hard-light (giống kit/glasslook.js); ảnh nền trong suốt (giá sắt, kẹp) vẽ thẳng màu ảnh.
// ======================================================================================================
const FLAT_DIR = './assets/flat/';
let _metaP = null;
const flatMeta = () => _metaP || (_metaP = fetch(FLAT_DIR + 'meta.json').then((r) => r.json()).catch(() => ({})));
const PB_VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const PB_FRAG = 'uniform sampler2D map; uniform float pass; uniform float k; uniform float ok; varying vec2 vUv; void main() { vec3 s = ok > 0.5 ? texture2D(map, vUv).rgb : vec3(0.5); gl_FragColor = pass < 0.5 ? vec4(mix(vec3(1.0), min(2.0 * s, 1.0), k), 1.0) : vec4(max(2.0 * s - 1.0, 0.0) * k, 1.0); }';
const _PB = new THREE.Vector3();
// key: tên ảnh trong meta.json. H: chiều cao món (từ đáy tới đỉnh ảnh). alpha: ảnh nền trong suốt. z: tấm ảnh lùi ra trước tâm món bao nhiêu (để đồ bên trong nằm sau ảnh).
// Thêm 26/11 (luật thao tác): crop = [hàng đầu, hàng cuối] (điểm ảnh gốc) chỉ vẽ một dải của ảnh, cùng tỉ lệ với ảnh đủ; base = hàng ảnh nằm ở gốc món (mặc định đáy ảnh).
//   sort = số: tấm ảnh vào danh sách PHOTO_SORT để kit/glasslook.js (kiểu E) xếp thứ tự vẽ theo khoảng cách cùng ảnh dụng cụ; số âm = vẽ sau (coi như gần máy quay hơn).
export const PHOTO_SORT = [];
export function photoBoard(key, H, { alpha = false, z = 0, flip = false, crop = null, base = null, sort = null } = {}) {
  const g = new THREE.Group(), pivot = new THREE.Group(); g.add(pivot); pivot.rotation.order = 'YXZ';
  const mats = [];
  if (alpha) mats.push(new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, opacity: 1 }));
  else [0, 1].forEach((pass) => mats.push(new THREE.ShaderMaterial({
    uniforms: { map: { value: null }, pass: { value: pass }, k: { value: 1 }, ok: { value: 0 } }, vertexShader: PB_VERT, fragmentShader: PB_FRAG, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: pass ? THREE.OneMinusDstColorFactor : THREE.DstColorFactor, blendDst: pass ? THREE.OneFactor : THREE.ZeroFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor })));
  const meshes = mats.map((m, i) => { const me = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); me.renderOrder = 7 + i; me.visible = false; pivot.add(me);
    me.onBeforeRender = (r, s, cam) => { if (m.uniforms) m.uniforms.k.value = m.opacity; pivot.parent.worldToLocal(_PB.copy(cam.position)); pivot.rotation.y = Math.atan2(_PB.x, _PB.z); };
    return me; });
  const info = { w: 0.4, h: H, k: 0, M: null, pivot, meshes };
  g.userData.board = info;
  if (sort != null) { info.rec = { obj: g, pair: pivot, y0: 0, tops: [], bias: sort, tilt: false }; PHOTO_SORT.push(info.rec); }
  info.ready = flatMeta().then((META) => {
    const M = META[key]; if (!M) return null;
    const k = H / (M.bottom - (M.top || 0)), y0 = crop ? crop[0] : 0, y1 = crop && crop[1] != null ? crop[1] : M.h, b0 = base ?? M.bottom, w = M.w * k, hh = (y1 - y0) * k; Object.assign(info, { k, w, M });
    meshes.forEach((me) => {
      if (crop) { const uv = me.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) > 0.5 ? 1 - y0 / M.h : 1 - y1 / M.h); uv.needsUpdate = true; }
      me.scale.set(w, hh, 1); me.position.set((flip ? M.cx - M.w / 2 : M.w / 2 - M.cx) * k, (b0 - (y0 + y1) / 2) * k, z);
    });
    new THREE.TextureLoader().load(FLAT_DIR + M.file, (t) => {
      if (alpha) t.colorSpace = THREE.SRGBColorSpace;
      if (flip) { t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; t.offset.x = 1; }
      t.anisotropy = 8;
      mats.forEach((m) => { if (m.uniforms) { m.uniforms.map.value = t; m.uniforms.ok.value = 1; } else { m.map = t; m.needsUpdate = true; } });
      meshes.forEach((me) => { me.visible = true; });
    });
    return info;
  });
  return g;
}

// ---------- Đồ theo LUẬT THAO TÁC 26/11 (lab_khoa_hoc_20261118/LUAT_THAO_TAC.md): cùng bộ ảnh với bản 2D (H7) ----------
// Lọ nhỏ giọt có ỐNG HÚT RÚT RA ĐƯỢC (T1, T2): lọ đứng yên trên bàn, chỉ ống hút (bóp cao su đỏ + nắp + ống thuỷ tinh) được nhấc ra.
// Ảnh dropbottle(_amber) cắt làm hai: phần nắp + bóp (hàng 0 tới CUT) gắn vào ống hút, phần cổ + thân lọ đứng yên.
// Gốc ống hút ở mép dưới nắp; ống thuỷ tinh dài STEM chĩa xuống, chỉ hiện khi ống hút đã ra khỏi lọ. userData: pip, seat, tipY, setOut(bật), setLoad(k, màu).
const DROP_IMG = { amber: { key: 'dropbottle_amber', cut: 456, top: 10.5, bottom: 1506.5 }, clear: { key: 'dropbottle', cut: 450, top: 10.3, bottom: 1509.0 } }; // số đo từ assets/flat/meta.json và ảnh (hàng mép dưới nắp)
export function makeDropPip({ title = '', name = '', clear = false, H = 0.93 } = {}) {
  const I = clear ? DROP_IMG.clear : DROP_IMG.amber, k = H / (I.bottom - I.top), seat = (I.bottom - I.cut) * k, STEM = 0.56;
  const g = new THREE.Group();
  const bottle = photoBoard(I.key, H, { crop: [I.cut, null], z: 0.15, sort: 0 });
  const pip = new THREE.Group(); pip.position.y = seat;
  const capB = photoBoard(I.key, H, { crop: [0, I.cut], base: I.cut, z: 0.06, sort: -0.02 });
  const glass = new THREE.MeshStandardMaterial({ color: 0xe6f0f4, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.6, depthWrite: false });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.013, STEM, 16, 1, true), glass); stem.position.y = -STEM / 2; stem.renderOrder = 4;
  const load = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.009, 1, 12), new THREE.MeshBasicMaterial({ color: 0xdcecf5, transparent: true, opacity: 0.9, depthWrite: false }));
  load.geometry.translate(0, 0.5, 0); load.position.y = -STEM + 0.01; load.renderOrder = 5; load.visible = false;
  const stemG = new THREE.Group(); stemG.add(stem, load); stemG.visible = false;
  pip.add(capB, stemG);
  // nhãn lọ: tấm phẳng trên mặt trước thân lọ, quay theo tấm ảnh
  const tex = canvasTexture(512, 300, (c, w, hh) => { c.fillStyle = '#fff'; c.fillRect(0, 0, w, hh); c.fillStyle = clear ? '#0e7490' : '#2f6fd0'; c.fillRect(0, 0, w, 22); c.fillStyle = '#16324f'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 ${name ? 96 : 120}px ${FONT}`; c.fillText(title, w / 2, name ? 120 : 160, w - 40); if (name) { c.font = `600 48px ${FONT}`; c.fillStyle = '#34495e'; c.fillText(name, w / 2, 222, w - 40); } });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.141), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  label.position.set(0, 0.3, 0.17); label.renderOrder = 9; bottle.userData.board.pivot.add(label); // nằm trong tấm ảnh thân lọ: quay theo
  if (bottle.userData.board.rec) bottle.userData.board.rec.tops.push(label);
  g.add(contactShadow(0.3), bottle, pip);
  const STEMLEN = STEM;
  g.userData = {
    pip, seat, stemLen: STEMLEN, tipY: -STEMLEN - 0.01, top: H + 0.02, cap: pip, label,
    setOut: (on) => { stemG.visible = !!on; },
    setLoad: (kk, hex) => { load.visible = kk > 0.02; load.scale.y = Math.max(0.001, kk * (STEMLEN - 0.06)); if (hex) load.material.color.set(hex); },
  };
  return g;
}
// Giá ống nghiệm GỖ (ảnh rack): 5 lỗ cách nhau 0,32 như makeSchoolRack. Tấm ảnh nằm TRƯỚC hàng ống (z) và vẽ sau ống (sort âm): tấm gỗ trước che chân ống như thật.
export function makeRackPhoto() {
  const k = 0.32 / 370, g = new THREE.Group(); // 370 điểm ảnh giữa hai lỗ (meta.json holes)
  g.add(contactShadow(1.0, 0.25), photoBoard('rack', 745 * k, { alpha: true, z: 0.3, sort: -0.45 }));
  g.userData = { top: 0.66 };
  return g;
}
// Chậu rửa có vòi (ảnh sink, như bản 2D): rộng w. setFlow(bật): dòng nước máy chảy từ miệng vòi xuống lòng chậu. spout: miệng vòi (toạ độ của món).
export function makeSinkPhoto({ w = 2.2 } = {}) {
  const k = w / 1400, g = new THREE.Group(), board = photoBoard('sink', 970 * k, { alpha: true, z: 0, sort: 0.05 });
  const spout = new THREE.Vector3((0.375 * 1400 - 699.5) * k, (971 - 292) * k, 0.02), floor = 0.18;
  const water = new THREE.Mesh(cyl(0.03, 0.024, 1, 12), new THREE.MeshBasicMaterial({ color: 0xcfe6f5, transparent: true, opacity: 0.8, depthWrite: false }));
  water.scale.y = spout.y - floor; water.position.set(spout.x, (spout.y + floor) / 2, spout.z + 0.05); water.visible = false; water.renderOrder = 9;
  const shine = new THREE.Mesh(cyl(0.012, 0.01, 1, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false }));
  shine.scale.y = spout.y - floor; shine.position.set(spout.x + 0.012, (spout.y + floor) / 2, spout.z + 0.08); shine.visible = false; shine.renderOrder = 9;
  if (board.userData.board.rec) board.userData.board.rec.tops.push(water, shine);
  let t = 0; const update = (dt) => { if (!water.visible) return; t += dt; shine.material.opacity = 0.55 + 0.35 * Math.abs(Math.sin(t * 9)); };
  g.add(board, water, shine);
  g.userData = { spout, top: 1.5, update, setFlow: (on) => { water.visible = shine.visible = !!on; } };
  return g;
}

// Bọt khí nhỏ nổi lên trong một khối trụ (bình cầu, bình rửa khí, cốc). set(k): 0 = tắt, 1 = sủi mạnh.
function bubbleColumn({ r = 0.2, y0 = 0.08, y1 = 0.5, n = 22, size = 0.022, color = 0xffffff } = {}) {
  const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, depthWrite: false }), geo = new THREE.SphereGeometry(size, 8, 6);
  const P = []; for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, mat); m.renderOrder = 6; g.add(m); P.push({ m, a: Math.random() * 6.28, rr: Math.random() * r, y: y0 + Math.random() * (y1 - y0), v: 0.25 + Math.random() * 0.35 }); }
  let k = 0;
  const update = (dt) => { g.visible = k > 0.02; if (!g.visible) return; P.forEach((p) => { p.y += p.v * dt * (0.5 + k); if (p.y > y1) { p.y = y0; p.a = Math.random() * 6.28; p.rr = Math.random() * r; } p.m.position.set(Math.cos(p.a) * p.rr, p.y, Math.sin(p.a) * p.rr); }); mat.opacity = 0.35 + 0.5 * k; };
  g.visible = false;
  return { g, update, set: (v) => { k = v; } };
}

// Tủ hút: vách sau, hai vách bên, nóc có quạt, cửa kính kéo lên một nửa, đèn công tắc quạt (xanh = bật). setOn(bật/tắt).
export function makeHood({ w = 7.4, d = 3.2, h = 5.2 } = {}) {
  const g = new THREE.Group(), frame = solidMat(0xe9ecef, 0.6), dark = solidMat(0x2b2f35, 0.5);
  const back = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), solidMat(0xf3f5f7, 0.8)); back.position.set(0, h / 2, -d / 2);
  const sides = [-1, 1].map((s) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, h, d), frame); m.position.set((s * w) / 2, h / 2, 0); return m; });
  const top = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, 0.5, d + 0.1), frame); top.position.set(0, h + 0.25, 0);
  const sash = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.14, h * 0.32), glassMat(0xdfe9ee, 0.18, THREE.DoubleSide)); sash.position.set(0, h * 0.82, d / 2); sash.renderOrder = 2;
  const rail = new THREE.Mesh(new THREE.BoxGeometry(w - 0.1, 0.07, 0.07), dark); rail.position.set(0, h * 0.66, d / 2);
  const grille = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 28), dark); grille.position.set(0, h + 0.52, -0.2);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.36, 0.06), dark); panel.position.set(w / 2 - 0.45, h * 0.6, d / 2 + 0.02);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), new THREE.MeshBasicMaterial({ color: 0x6b7280 })); lamp.position.set(w / 2 - 0.45, h * 0.6, d / 2 + 0.08);
  g.add(back, ...sides, top, sash, rail, grille, panel, lamp);
  let spin = 0, on = false;
  g.userData = { on: false, setOn(v) { on = !!v; g.userData.on = on; lamp.material.color.set(on ? 0x22c55e : 0x6b7280); }, update(dt) { if (on) { spin += dt * 8; grille.rotation.y = spin; } }, w, d, h };
  return g;
}

// Giá sắt có kẹp (ảnh nền trong suốt): kẹp đặt ở độ cao clampY.
export function makeStand({ h = 3.0, clampY = 1.05, clampW = 1.0 } = {}) {
  const g = new THREE.Group(), st = photoBoard('stand', h, { alpha: true }), cl = photoBoard('clamp', clampW * (239 / 1200), { alpha: true, z: 0.02 });
  cl.position.y = clampY; g.add(contactShadow(0.6, 0.35), st, cl);
  g.userData = { h };
  return g;
}

// Bình cầu có nhánh (ảnh distill_flask) có tinh thể tím KMnO₄ dưới đáy; setFizz(k) cho sủi bọt khi HCl nhỏ xuống. port = đầu nhánh để nối ống dẫn khí.
export function makeSideFlask({ h = 1.45 } = {}) {
  const g = new THREE.Group(), board = photoBoard('distill_flask', h, { z: 0.36 });
  const crystals = new THREE.Group(), cm = solidMat(0x4c1d95, 0.35, { metalness: 0.2 });
  for (let i = 0; i < 14; i++) { const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.035 + Math.random() * 0.025), cm); c.position.set((Math.random() - 0.5) * 0.36, 0.06 + Math.random() * 0.03, (Math.random() - 0.5) * 0.2); c.rotation.set(Math.random() * 3, Math.random() * 3, 0); crystals.add(c); }
  const liquid = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 16, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45), liquidMat(0x7c3aed, 0.0)); liquid.position.y = 0.3; liquid.renderOrder = 3;
  const fizz = bubbleColumn({ r: 0.18, y0: 0.08, y1: 0.42, n: 26, color: 0xe9f5c8 });
  g.add(contactShadow(0.45, 0.35), crystals, liquid, fizz.g, board);
  g.userData = { port: new THREE.Vector3(0.5, h * 0.62, 0), top: h, update: fizz.update, setFizz(k) { fizz.set(k); liquid.material.opacity = Math.min(0.45, k * 0.6); } };
  return g;
}

// Phễu nhỏ giọt (ảnh dropping_funnel) chứa HCl đặc; setOn(mở/khoá): tay khoá xoay ngang/dọc, giọt rơi khỏi chuôi khi mở.
export function makeDropFunnel({ h = 1.35 } = {}) {
  const g = new THREE.Group(), board = photoBoard('dropping_funnel', h, { z: 0.12 });
  const tapY = h * 0.3, tap = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.06), solidMat(0xc2410c, 0.5)); tap.position.set(0, tapY, 0.16);
  const drop = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), liquidMat(0xf5f5dc, 0.8)); drop.visible = false; drop.renderOrder = 6; g.add(drop);
  g.add(board, tap);
  let open = false, t = 0;
  g.userData = { top: h, on: false, setOn(v) { open = !!v; g.userData.on = open; tap.rotation.z = open ? Math.PI / 2 : 0; },
    update(dt) { drop.visible = open; if (!open) return; t = (t + dt * 1.6) % 1; drop.position.set(0, -0.02 - t * 0.28, 0.02); } };
  return g;
}

// Bình rửa khí (ảnh gas_wash_bottle) có chất lỏng bên trong; setFizz(k) khi khí đi qua.
export function makeGasWash({ h = 1.15 } = {}) {
  const g = new THREE.Group(), board = photoBoard('gas_wash_bottle', h, { z: 0.3 });
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, h * 0.42, 28), liquidMat(0xdcecf5, 0.35)); liquid.position.y = h * 0.25; liquid.renderOrder = 3;
  const fizz = bubbleColumn({ r: 0.14, y0: 0.08, y1: h * 0.45, n: 18 });
  g.add(contactShadow(0.35, 0.35), liquid, fizz.g, board);
  g.userData = { top: h, port: new THREE.Vector3(0, h * 0.95, 0), update: fizz.update, setFizz: fizz.set };
  return g;
}

// Cốc thuỷ tinh (ảnh beaker) đựng dung dịch; setFizz(k) khi khí thừa sục vào.
export function makeBeakerPhoto({ h = 0.85, fill = 0.55, color = 0xdcecf5, sort = null } = {}) {
  const q = h / 0.85, g = new THREE.Group(), board = photoBoard('beaker', h, { z: 0.36 * q, sort });
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * q, 0.3 * q, 1, 32), liquidMat(color, 0.4)); liquid.geometry.translate(0, 0.5, 0); liquid.position.y = 0.04 * q; liquid.renderOrder = 3;
  const setLevel = (k) => { liquid.visible = k > 0.002; liquid.scale.y = Math.max(0.001, h * k); }; setLevel(fill);
  const fizz = bubbleColumn({ r: 0.2 * q, y0: 0.06 * q, y1: h * Math.max(fill, 0.1), n: 18 });
  g.add(contactShadow(0.45 * q, 0.35), liquid, fizz.g, board);
  // setLevel(k): mực chất lỏng (phần của chiều cao cốc); setColor(màu): màu chất lỏng (cốc thải: màu hoà của các dung dịch đã đổ vào)
  g.userData = { top: h, update: fizz.update, setFizz: fizz.set, setLevel, setColor: (hex) => liquid.material.color.set(hex) };
  return g;
}

// Đồng hồ "khí độc trong phòng": mặt số vẽ bằng code, ba vùng An toàn · Cảnh báo · Nguy hiểm, kim theo set(k) (0 tới 1).
export function makeGasMeter({ s = 1.1 } = {}) {
  const g = new THREE.Group(), CW = 512, CH = 400;
  const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const body = new THREE.Mesh(new THREE.BoxGeometry(s + 0.1, s * 0.8 + 0.1, 0.14), solidMat(0x1f2937, 0.5)); body.position.set(0, s * 0.4 + 0.75, 0); body.castShadow = true;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(s, s * 0.78), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); face.position.set(0, s * 0.4 + 0.75, 0.075);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.75, 12), solidMat(PAL.metalDark, 0.5)); pole.position.y = 0.375;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.05, 24), solidMat(PAL.metalDark, 0.5)); foot.position.y = 0.025;
  let k = 0, shown = -1;
  const ZONES = [[0, 0.4, '#22c55e', 'An toàn'], [0.4, 0.75, '#f59e0b', 'Cảnh báo'], [0.75, 1, '#ef4444', 'Nguy hiểm']];
  function draw() {
    const c = cv.getContext('2d'), cx = CW / 2, cy = CH * 0.78, R = CH * 0.58, a0 = Math.PI * 1.08, a1 = Math.PI * 1.92;
    c.fillStyle = '#f8fafc'; c.fillRect(0, 0, CW, CH);
    ZONES.forEach(([f0, f1, col]) => { c.strokeStyle = col; c.lineWidth = 34; c.beginPath(); c.arc(cx, cy, R, a0 + (a1 - a0) * f0, a0 + (a1 - a0) * f1); c.stroke(); });
    c.fillStyle = '#0f172a'; c.textAlign = 'center'; c.font = `700 34px ${FONT}`; c.fillText('Khí độc trong phòng', cx, 46);
    const z = ZONES.find(([f0, f1]) => k >= f0 && k <= f1) || ZONES[0];
    c.fillStyle = z[2]; c.font = `700 40px ${FONT}`; c.fillText(z[3], cx, CH * 0.95);
    const a = a0 + (a1 - a0) * Math.min(1, Math.max(0, k));
    c.strokeStyle = '#0f172a'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * R * 0.86, cy + Math.sin(a) * R * 0.86); c.stroke();
    c.fillStyle = '#0f172a'; c.beginPath(); c.arc(cx, cy, 14, 0, 6.283); c.fill();
    tex.needsUpdate = true;
  }
  draw();
  g.add(foot, pole, body, face);
  g.userData = { top: s * 0.8 + 0.85, set(v) { k = v; const q = Math.round(k * 100); if (q !== shown) { shown = q; draw(); } }, level: () => k, zone: () => (ZONES.find(([f0, f1]) => k >= f0 && k <= f1) || ZONES[0])[3] };
  return g;
}

// Tivi phản ứng: màn hình vẽ bằng code chiếu MỘT cặp chất gặp nhau trong dung dịch (dùng ở bước "Nhìn vào trong" của bài halogen).
// setScene({ a, b, react, products, title, note }): a = phân tử halogen (ví dụ 'Cl₂'), b = ion halide ('Br⁻'), react = có lấy được electron không,
// products = các hạt sau phản ứng. Không có cảnh thì hiện lời mời chọn một cặp.
export function makeRedoxTV({ w = 11, h = 6.2 } = {}) {
  const g = new THREE.Group(), CW = 1024, CH = Math.round((1024 * h) / w);
  const body = new THREE.Mesh(new THREE.BoxGeometry(w + 0.34, h + 0.34, 0.26), solidMat(0x15171a, 0.45)); body.position.z = 0.13; body.castShadow = true;
  const mount = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 0.12), solidMat(PAL.metalDark, 0.6)); mount.position.z = 0.02;
  const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); screen.position.z = 0.265;
  const COL = { Cl: '#7ccf4a', Br: '#c2410c', I: '#6d28d9', e: '#fde047' };
  const el = (s) => (s.startsWith('Cl') ? 'Cl' : s.startsWith('Br') ? 'Br' : 'I');
  let scene = null, t = 0, acc = 1, live = true;
  function ball(c, x, y, r, col, text) {
    const gr = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.25, col); gr.addColorStop(1, col);
    c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill();
    if (text) { c.fillStyle = '#0b0c1f'; c.font = `700 ${r * 0.62}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y + 1); }
  }
  function draw() {
    const c = cv.getContext('2d'); c.fillStyle = '#12132a'; c.fillRect(0, 0, CW, CH); c.textBaseline = 'alphabetic';
    c.fillStyle = '#ffffff'; c.textAlign = 'left'; c.font = `700 ${CH * 0.075}px ${FONT}`; c.fillText('Nhìn vào trong ống nghiệm', CW * 0.04, CH * 0.12);
    if (!scene) { c.fillStyle = '#aeb4e6'; c.font = `500 ${CH * 0.055}px ${FONT}`; c.fillText('Chọn một cặp chất ở bảng bên phải', CW * 0.04, CH * 0.24); tex.needsUpdate = true; return; }
    const S = scene, cyc = 5.5, p = (t % cyc) / cyc, r = CH * 0.075, ya = CH * 0.52;
    c.fillStyle = '#aeb4e6'; c.font = `500 ${CH * 0.055}px ${FONT}`; c.fillText(S.title || '', CW * 0.04, CH * 0.22);
    // phân tử halogen (hai hạt dính nhau) đi từ trái vào giữa; hai ion halide đứng chờ ở giữa phải
    const meet = Math.min(1, p / 0.4), ax = CW * 0.12 + (CW * 0.42 - CW * 0.12) * meet, A = el(S.a), Bx = CW * 0.6, B = el(S.b);
    const after = S.react && p > 0.55, back = !S.react && p > 0.45;
    if (!after) {
      const bx = back ? ax - (p - 0.45) * CW * 0.5 : ax;
      ball(c, bx - r * 0.75, ya, r, COL[A], A); ball(c, bx + r * 0.75, ya, r, COL[A], A);
      [-1, 1].forEach((s) => ball(c, Bx + (back ? (p - 0.45) * CW * 0.3 : 0), ya + s * r * 2.3, r * 1.08, COL[B], B + '⁻'));
      if (S.react && p > 0.4) { const q = (p - 0.4) / 0.15; [-1, 1].forEach((s) => ball(c, Bx + (ax - Bx) * q, ya + s * r * 2.3 * (1 - q), r * 0.28, COL.e, '')); } // electron đi từ ion halide sang phân tử halogen
    } else {
      const q = Math.min(1, (p - 0.55) / 0.25);
      [-1, 1].forEach((s) => ball(c, CW * 0.42 + s * q * CW * 0.08, ya + s * q * CH * 0.16, r * 1.08, COL[A], A + '⁻'));
      ball(c, Bx + CW * 0.1 * q - r * 0.75, ya, r, COL[B], B); ball(c, Bx + CW * 0.1 * q + r * 0.75, ya, r, COL[B], B);
    }
    c.fillStyle = S.react ? '#c1ff24' : '#fca5a5'; c.font = `700 ${CH * 0.06}px ${FONT}`; c.textAlign = 'left';
    c.fillText(S.react ? (p > 0.55 ? 'Lấy được electron: ' + (S.products || []).join(' + ') : 'Gặp nhau…') : (p > 0.45 ? 'Va chạm rồi bật ra: không đổi' : 'Gặp nhau…'), CW * 0.04, CH * 0.86);
    if (S.note) { c.fillStyle = '#aeb4e6'; c.font = `500 ${CH * 0.042}px ${FONT}`; c.fillText(S.note, CW * 0.04, CH * 0.94); }
    if (!live) { c.fillStyle = 'rgba(18,19,42,0.55)'; c.fillRect(0, 0, CW, CH); }
    tex.needsUpdate = true;
  }
  draw();
  g.add(mount, body, screen);
  g.userData = { w, h, update(dt) { if (live && scene) t += dt; acc += dt; if (acc >= 1 / 20) { acc = 0; draw(); } }, setScene(s) { scene = s || null; t = 0; draw(); }, setLive(v) { live = !!v; draw(); } };
  return g;
}

// Kệ xếp hạng 3 ô (bài Nhóm halogen, bước 6): tấm kệ thấp có ba ô ghi "mạnh nhất · giữa · yếu nhất"; setOn(true) khi xếp đúng thì kệ sáng lime.
// slots = toạ độ x của ba ô (so với tâm kệ), để giáo án khai chỗ đặt lọ.
export function makeShelf({ w = 2.1, d = 0.62, labels = ['mạnh nhất', 'giữa', 'yếu nhất'] } = {}) {
  const g = new THREE.Group(), n = labels.length, CW = 1024, CH = Math.round((1024 * 0.26) / (w / d) * (w / d) / 2.2);
  const cv = document.createElement('canvas'); cv.width = CW; cv.height = 140;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  let lit = false;
  function draw() {
    const c = cv.getContext('2d'); c.fillStyle = lit ? '#c1ff24' : '#f1f5f9'; c.fillRect(0, 0, CW, 140);
    c.fillStyle = '#0f172a'; c.font = `700 52px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    labels.forEach((t, i) => { c.fillText(t, (CW / n) * (i + 0.5), 70); if (i) { c.fillStyle = '#94a3b8'; c.fillRect((CW / n) * i - 2, 18, 4, 104); c.fillStyle = '#0f172a'; } });
    tex.needsUpdate = true;
  }
  draw();
  const board = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), solidMat(0xd6dbe1, 0.6)); board.position.y = 0.025; board.receiveShadow = true;
  const front = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 140 / CW), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); front.position.set(0, (w * 140 / CW) / 2 + 0.01, d / 2 + 0.005);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(w, w * 140 / CW + 0.02, 0.02), solidMat(0x94a3b8, 0.6)); lip.position.set(0, (w * 140 / CW) / 2, d / 2 - 0.006);
  g.add(board, lip, front);
  g.userData = { slots: labels.map((_, i) => (i - (n - 1) / 2) * (w / n)), setOn(v) { lit = !!v; draw(); } };
  return g;
}
