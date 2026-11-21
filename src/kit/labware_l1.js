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
