// Bàn thực hành tự do (luồng 2): phòng lab S2, giá 4 ống nghiệm, kệ 12 lọ, ống nhỏ giọt, thìa, chậu rửa.
// Mọi chuyển động chạy theo stage.advance(dt): kiểm thử và quay phim điều khiển được từng khung.
import * as THREE from 'three';
import { createStage } from '../kit/stage.js';
import { makeRoom, makeIsland } from '../kit/room.js';
import { makeTestTube } from '../kit/labware.js';
import { makeChemContainer, makeChemSolid, makeStopperDropper, makeSpatula, makeSchoolRack, makeStopperBottle, makeBeaker, makeGlassRod, makeLitmus, makeAlcoholLamp, makeTubeHolder, texMat } from '../kit/labware2.js';
import { Bubbles } from '../kit/fx.js';
import { PAL, QUALITY, contactShadow, solidMat, liquidMat } from '../kit/materials.js';
import { BY_ID } from '../chem/data.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const put = (o, x, y, z) => { o.position.set(x, y, z); return o; };
const ease = (k) => k * k * (3 - 2 * k), clamp = THREE.MathUtils.clamp;
const lathe = (pts, seg = 24) => new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg);
export const PPT_HEX = { 'đen': 0x1c1c1e, 'trắng': 0xf4f6f8, 'trắng xanh': 0xcfe3d6, 'trắng ngả vàng': 0xf1ecd0, 'vàng': 0xf0cf3a, 'xanh lam': 0x2b86e0, 'nâu đỏ': 0x9a4a2a, 'nâu đen': 0x3a2a22, 'xám': 0x8c9199 };
const COAT_HEX = { 'đỏ': 0xb5552e, 'trắng xám': 0xc9ced4, 'xám': 0x7f858c, 'trắng bạc': 0xd3d8de };
// Kiểu hạt kết tủa theo dạng: [cỡ nhỏ nhất, cỡ lớn nhất, tốc độ lắng, độ phồng của lớp lắng]
const FORM = { 'keo': [0.014, 0.025, 0.05, 1.7], 'bông': [0.013, 0.022, 0.06, 1.5], 'vón cục': [0.014, 0.027, 0.13, 1.1], 'mịn': [0.007, 0.012, 0.07, 0.8], 'tinh thể': [0.008, 0.014, 0.11, 0.8], 'vẩn đục nhẹ': [0.005, 0.008, 0.03, 0.5] };

export function createFreeBench(host, { nameOf = (id) => id } = {}) {
  QUALITY.fresnel = true; // thuỷ tinh rõ mép, trong ở giữa
  // Bản thử cách nhìn (chưa chốt), bật bằng ?look=: d = hậu cảnh lùi (tường tối và mờ), w = phông và tấm lót sáng, k = phông tối, g = viền kính sẫm.
  const LOOK = new URLSearchParams(location.search).get('look') || '';
  QUALITY.edge = LOOK.includes('g');
  const stage = createStage(host), { scene } = stage;
  const island = makeIsland({ sink: 'left' }), room = makeRoom({ photo: './assets/env/', hd: !stage.mobile });
  scene.add(room, island);
  if (LOOK.includes('d')) {
    const walls = []; room.traverse((o) => { if (o.isMesh && o.material.isMeshBasicMaterial && o.material.map) walls.push(o); });
    const soften = (m) => { const t = m.material.map, im = t.image; if (!im || !im.width) return false; const W = 1024, H = Math.round(W * im.height / im.width), c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.filter = 'blur(4px) saturate(0.75)'; x.drawImage(im, 0, 0, W, H);
      const nt = new THREE.CanvasTexture(c); nt.colorSpace = t.colorSpace; nt.wrapS = t.wrapS; nt.wrapT = t.wrapT; nt.repeat.copy(t.repeat); nt.offset.copy(t.offset); m.material.map = nt; m.material.color.setScalar(0.42); m.material.needsUpdate = true; return true; };
    const iv = setInterval(() => { for (let k = walls.length - 1; k >= 0; k--) if (soften(walls[k])) walls.splice(k, 1); if (!walls.length) clearInterval(iv); }, 200);
  }
  if (LOOK.includes('t')) { // bàn kê sát tường tối (chủ gợi ý 19/11): tường đứng ngay sau mép bàn làm nền cho thuỷ tinh; kệ lọ hai bên giữ cảm giác phòng lab, khoảng tường sau giá ống để trống
    const WZ = -3.86, wm = new THREE.MeshStandardMaterial({ color: 0x252b33, roughness: 0.94, metalness: 0, envMapIntensity: 0.08 }), white = solidMat(PAL.cabinet, 0.6);
    const mesh = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.receiveShadow = true; m.traverse((o) => o.layers.set(1)); scene.add(m); return m; };
    mesh(new THREE.PlaneGeometry(54, 28), wm, 1, 5, WZ);
    mesh(new THREE.BoxGeometry(16, 0.45, 0.08), solidMat(PAL.benchTop, 0.55), 0, 0.225, WZ + 0.05); // gờ chắn nước sau bàn
    mesh(new THREE.BoxGeometry(17, 0.06, 0.95), white, 0.3, 1.8, WZ + 0.48); // kệ treo tường
    const shelf = (x, o) => { o.position.set(x, 1.83, WZ + 0.5); o.traverse((q) => q.layers.set(1)); scene.add(o); };
    [-6.9, -6.2, -5.5, -4.1, -3.4, 4.1, 4.8, 6.2, 6.9, 7.6].forEach((x, k) => shelf(x, makeStopperBottle({ title: '', amber: k % 3 !== 1, wide: k % 4 === 3, content: k % 3 === 1 ? PAL.water : 0x5a3410, contentOpacity: k % 3 === 1 ? 0.35 : 0.75 })));
    [-4.8, 5.5].forEach((x) => shelf(x, makeBeaker()));
    stage.controls.minAzimuthAngle = -1.15; stage.controls.maxAzimuthAngle = 1.15; // không xoay ra sau tường
  }
  const TONE = LOOK.includes('w') ? 0xf1f2ef : LOOK.includes('k') ? 0x14171b : null;
  if (TONE != null) { // vách phông đứng sau vùng thao tác + tấm lót trong giá; bản sáng thêm tấm lót bàn
    const bm = new THREE.MeshStandardMaterial({ color: TONE, roughness: 0.96, metalness: 0, envMapIntensity: 0.12 });
    const add = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bm); m.position.set(x, y, z); m.receiveShadow = true; m.traverse((o) => o.layers.set(1)); scene.add(m); return m; };
    add(5.6, 1.9, 0.04, 0.6 - 0.28, 0.95, 1.5 - 1.02); add(1.74, 0.006, 1.04, 0.6, 0.028, 1.5);
    if (LOOK.includes('w')) add(5.6, 0.012, 2.3, 0.6 - 0.28, 0.006, 1.5 + 0.15);
  }
  stage.setEnvironment('./assets/env/pano_lab.jpg');
  const SINK = V3(island.userData.sink.x + 0.2, 2.3, 0.35);

  // ---------- chuỗi động tác ----------
  let seq = null; const anims = [];
  function play(steps, onDone) { seq = { steps, i: 0, t: 0, onDone }; if (steps[0].start) steps[0].start(); }
  function tickSeq(dt) {
    while (seq) {
      const st = seq.steps[seq.i]; seq.t += dt;
      if (st.hold) { if (!st.hold(dt)) break; dt = 0; } // nhịp kéo dài tới khi hold báo xong (đang rót)
      else { const k = Math.min(1, seq.t / st.dur); if (st.fn) st.fn(st.ease ? st.ease(k) : ease(k)); if (k < 1) break; dt = seq.t - st.dur; }
      seq.i++; seq.t = 0;
      if (seq.i >= seq.steps.length) { const d = seq.onDone; seq = null; if (d) d(); break; }
      if (seq.steps[seq.i].start) seq.steps[seq.i].start();
    }
  }
  const arc = (o, a, b, k, h = 0.4) => { o.position.lerpVectors(a, b, k); o.position.y += Math.sin(Math.PI * k) * h; };

  // ---------- ống nghiệm: chất lỏng, lớp kết tủa, hạt lơ lửng, bọt khí, mẩu chất rắn ----------
  const RX = 0.6, RZ = 1.5;
  const TUBE = { h: 1.6, r: 0.08, wall: 0.01 }; // ống nghiệm Φ16 mm, cao 160 mm, bo miệng (danh mục mục 1.6); thành dày 1,0 mm
  const rack = put(makeSchoolRack(), RX, 0, RZ); scene.add(rack, put(contactShadow(1.25, 0.4), RX, 0.006, RZ + 0.05));
  function makeTubeView(i, home) {
    const g = makeTestTube({ h: TUBE.h, r: TUBE.r }); g.position.copy(home); scene.add(g);
    g.traverse((o) => { if (o.isMesh && o.material.isMeshPhysicalMaterial && o !== g.userData.liquid) o.material.opacity *= 1.45; }); // thành ống rõ hơn trên nền bàn đen
    const U = g.userData, RL = U.r - TUBE.wall, Y0 = U.r - RL; // bán kính lòng ống, đáy lòng ống
    const fillGeo = (h, R = RL) => { const pts = [[0, U.r - R]]; for (let k = 1; k <= 8; k++) { const a = -Math.PI / 2 + (Math.PI / 2) * (k / 8), y = U.r + R * Math.sin(a); if (y >= h) break; pts.push([R * Math.cos(a), y]); } pts.push([h < U.r ? Math.sqrt(Math.max(0, R * R - (U.r - h) ** 2)) : R, h], [0, h]); return lathe(pts); };
    // Mực chất lỏng tính đúng theo hình học lòng ống (1 đơn vị = 10 cm nên 1 đơn vị khối = 1000 mL): đáy bán cầu rồi tới thân trụ.
    // Với lòng ống Φ14 mm: đáy bán cầu chứa 0,72 mL; phần thân mỗi mL cao 6,5 mm.
    const VH = (2 / 3) * Math.PI * RL ** 3 * 1000, PER_ML = 1 / (Math.PI * RL * RL * 1000);
    const capH = (mL) => { let lo = 0, hi = RL; for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if ((Math.PI * m * m * (3 * RL - m) / 3) * 1000 < mL) lo = m; else hi = m; } return (lo + hi) / 2; };
    const yOf = (mL) => (mL <= 0 ? Y0 : mL < VH ? Y0 + capH(mL) : U.r + (mL - VH) * PER_ML);
    const liquid = U.liquid; liquid.visible = false;
    const layer = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 })); layer.visible = false; g.add(layer);
    const N = stage.mobile ? 44 : 80, dots = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 7, 5), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }), N); dots.frustumCulled = false; g.add(dots);
    const P = Array.from({ length: N }, () => ({ live: false, x: 0, y: 0, z: 0, vy: 0, s: 0, ph: 0 })), M = new THREE.Matrix4(), C = new THREE.Color();
    for (let k = 0; k < N; k++) { dots.setColorAt(k, C.set(0xffffff)); dots.setMatrixAt(k, M.makeScale(0, 0, 0)); }
    const bub = new Bubbles(stage.mobile ? 22 : 38, { y0: 0.06, y1: 0.3, radius: () => RL * 0.9 }, { size: 0.013 }); g.add(bub.mesh);
    const solids = new THREE.Group(); solids.position.y = Y0 + 0.004; g.add(solids);
    const S = { mL: 0, tmL: 0, col: new THREE.Color(0xdcecf5), tcol: new THREE.Color(0xdcecf5), op: 0.42, top: 0.42, slow: 0, layerH: 0, tLayerH: 0, lcol: new THREE.Color(0xffffff), queue: [], gasI: 0, gasT: 0, gasDur: 1, t: 0, shownLevel: -1, shownLayer: -1 };
    const solidMap = {};
    const level = () => yOf(S.mL);
    function update(dt) {
      S.t += dt;
      S.mL += (S.tmL - S.mL) * (1 - Math.exp(-dt * 9)); if (Math.abs(S.tmL - S.mL) < 0.002) S.mL = S.tmL;
      const lv = level();
      if (Math.abs(lv - S.shownLevel) > 0.0008) { liquid.geometry.dispose(); liquid.geometry = fillGeo(Math.max(lv, Y0 + 0.004)); S.shownLevel = lv; U.level = lv; }
      liquid.visible = S.mL > 0.004;
      // hạt kết tủa: sinh ra gần mặt thoáng (chỗ hai dung dịch gặp nhau), lắng dần xuống lớp đáy
      let born = Math.min(S.queue.length, Math.ceil(dt * 40));
      for (let k = 0; k < N && born > 0; k++) { const p = P[k]; if (p.live) continue; const q = S.queue.shift(), a = Math.random() * 6.283, d = Math.sqrt(Math.random()) * RL * 0.82, f = FORM[q.form] || FORM['mịn'];
        Object.assign(p, { live: true, x: Math.cos(a) * d, z: Math.sin(a) * d, y: q.low ? Y0 + 0.05 + Math.random() * 0.1 : Math.max(Y0 + 0.03, lv - 0.02 - Math.random() * Math.min(0.16, lv * 0.5)), vy: f[2] * (0.7 + Math.random() * 0.6), s: f[0] + Math.random() * (f[1] - f[0]), ph: Math.random() * 6 });
        dots.setColorAt(k, C.set(q.hex)); born--; }
      let alive = 0; const floor = Y0 + S.layerH;
      for (let k = 0; k < N; k++) { const p = P[k]; if (!p.live) { dots.setMatrixAt(k, M.makeScale(0, 0, 0)); continue; }
        p.y -= p.vy * dt; if (p.y <= floor + p.s * 0.6 || p.y > lv) { p.live = false; dots.setMatrixAt(k, M.makeScale(0, 0, 0)); continue; }
        alive++; const w = Math.sin(S.t * 1.7 + p.ph) * 0.004; dots.setMatrixAt(k, M.makeScale(p.s, p.s * 0.8, p.s).setPosition(p.x + w, p.y, p.z)); }
      dots.instanceMatrix.needsUpdate = true; if (dots.instanceColor) dots.instanceColor.needsUpdate = true;
      const turb = Math.min(1, (alive + S.queue.length) / (N * 0.5));
      // lớp kết tủa dày dần khi hạt lắng xuống
      S.layerH += (S.tLayerH - S.layerH) * (1 - Math.exp(-dt * (S.queue.length || alive > 6 ? 0.35 : 1.2)));
      if (Math.abs(S.layerH - S.shownLayer) > 0.002) { layer.geometry.dispose(); layer.geometry = fillGeo(Y0 + Math.max(S.layerH, 0.002), RL - 0.002); S.shownLayer = S.layerH; }
      layer.visible = S.layerH > 0.004; layer.material.color.lerp(S.lcol, 1 - Math.exp(-dt * 3));
      // màu dung dịch: chuyển nhanh với phản ứng trong dung dịch, chậm khi do chất rắn tan dần
      const kc = 1 - Math.exp(-dt * (S.slow > 0 ? 0.35 : 2.6)); S.slow = Math.max(0, S.slow - dt);
      S.col.lerp(S.tcol, kc); S.op += (S.top - S.op) * kc;
      liquid.material.color.copy(S.col).lerp(S.lcol, turb * 0.7); liquid.material.opacity = Math.min(0.92, S.op + turb * 0.3); // đang vẩn đục thì dung dịch ngả hẳn sang màu kết tủa
      // bọt khí
      S.gasT = Math.max(0, S.gasT - dt); bub.region.y1 = Math.max(0.08, lv - 0.012); bub.region.y0 = Y0 + 0.03;
      bub.update(dt, S.mL > 0.3 ? S.gasI * Math.min(1, S.gasT / (S.gasDur * 0.6)) : 0);
      // chất rắn mòn dần, lớp kim loại bám dần
      for (const s of Object.values(solidMap)) { s.k += (s.tk - s.k) * (1 - Math.exp(-dt * 0.4)); s.obj.scale.setScalar(s.base * Math.max(0.05, Math.cbrt(s.k))); s.obj.visible = s.k > 0.01;
        if (s.coat != null) s.obj.traverse((o) => { if (o.isMesh) { if (o.material.map) { o.material.map = null; o.material.needsUpdate = true; } o.material.color.lerp(C.set(s.coat), 1 - Math.exp(-dt * 0.5)); o.material.metalness = 0.6; } }); }
    }
    return {
      i, g, home, U, update, level, yOf,
      mouth: () => V3(g.position.x, g.position.y + U.h, g.position.z),
      surfaceY: () => g.position.y + level(),
      setLook({ mL, hex, opacity }, slow = false) { S.tmL = mL; S.tcol.set(hex); S.top = opacity; if (slow) S.slow = 9; },
      precipitate(hex, form, mmolNew, layerH, low = false) { const n = Math.round(clamp(mmolNew * 340, 7, 40)); for (let k = 0; k < n && S.queue.length < 90; k++) S.queue.push({ hex, form, low }); S.tLayerH = layerH; S.lcol.set(hex); },
      gas(intensity, dur) { S.gasI = intensity; S.gasT = dur; S.gasDur = dur; },
      setSolid(id, frac, coat) { let s = solidMap[id]; if (!s) { const obj = onePiece(id), base = obj.scale.x; solids.add(obj); s = solidMap[id] = { obj, base, k: 1, tk: 1, coat: null }; } s.tk = frac; if (coat) s.coat = COAT_HEX[coat] ?? 0x8c9199; },
      resuspend() { const h = S.layerH; if (h < 0.004) return; const n = Math.round(clamp(h * 500, 10, 60)); S.layerH = h * 0.25; for (let k = 0; k < n; k++) S.queue.push({ hex: S.lcol.getHex(), form: 'mịn', low: Math.random() < 0.5 }); },
      reset() { S.mL = S.tmL = 0; S.tcol.set(0xdcecf5); S.col.set(0xdcecf5); S.op = S.top = 0.42; S.layerH = S.tLayerH = 0; S.queue.length = 0; S.gasT = 0; S.gasI = 0; P.forEach((p) => { p.live = false; }); for (const id of Object.keys(solidMap)) { solids.remove(solidMap[id].obj); delete solidMap[id]; } },
      state: S,
    };
  }
  const onePiece = (id) => { const o = makeChemSolid(id); while (o.children.length > 1) o.remove(o.children[o.children.length - 1]); if (o.children[0]) o.children[0].position.x = o.children[0].position.z = 0; o.scale.setScalar(id === 'Zn' ? 1.5 : 0.95); return o; };
  const tubes = rack.userData.slotX.map((sx, i) => makeTubeView(i, V3(RX + sx, rack.userData.slotY, RZ + rack.userData.slotZ)));

  // ---------- lọ hoá chất: bàn chỉ có lọ đang dùng. Chọn một chất trong tủ thì lọ đó mới ra đứng cạnh giá ống ----------
  // 5 chỗ đặt lọ: 3 bên trái giá ống, 2 bên phải. Hết chỗ thì lọ lâu chưa dùng nhất được cất đi.
  const SLOTS = [-1.3, -1.86, 1.3, -2.42, 1.86].map((dx) => ({ pos: V3(RX + dx, 0, RZ + 0.1), id: null }));
  const bottles = {};
  let dropOut = null; // lọ đang bị rút nút-ống hút ra để nhỏ giọt
  const capOf = (b, on) => { const u = b.obj.userData; if (u.cap) u.cap.visible = on && dropOut !== b.id; if (u.bulb) u.bulb.visible = on; if (u.shadow) u.shadow.visible = on; };

  // ---------- dụng cụ ----------
  // Ống hút nhỏ giọt không nằm riêng trên bàn: nó chính là nút nhám của lọ. Khi cần nhỏ giọt thì rút nút của lọ đó ra.
  const dropper = makeStopperDropper(); dropper.visible = false; scene.add(dropper);
  const SPAT_REST = V3(RX - 1.7, 0, RZ + 1.2); const spatula = makeSpatula(); spatula.position.copy(SPAT_REST); scene.add(spatula);
  dropper.traverse((o) => o.layers.set(1)); spatula.traverse((o) => o.layers.set(1));
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.016, 1, 10), liquidMat(PAL.water, 0.78)); stream.visible = false; stream.renderOrder = 3; scene.add(stream);
  const dropPool = Array.from({ length: 4 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), liquidMat(PAL.water, 0.85)); m.visible = false; m.renderOrder = 3; scene.add(m); return m; });
  const flyer = new THREE.Group(); flyer.visible = false; scene.add(flyer);
  const setStream = (x, yTop, yBot, z, hex) => { const len = Math.max(0.03, yTop - yBot); stream.position.set(x, yBot + len / 2, z); stream.scale.set(1, len, 1); if (hex != null) stream.material.color.set(hex); };
  const liquidHex = (id) => (BY_ID[id].hex ? new THREE.Color(BY_ID[id].hex).getHex() : PAL.water);

  // ---------- nhãn, vòng sáng, chạm chọn ----------
  let pickCb = null, hoverCb = null, insetCb = null, active = 0, selId = null, hov = null, awaiting = false, clock = 0;
  // Ống nghiệm mảnh (rộng chừng 20 điểm ảnh) nên rất khó bấm trúng: bọc mỗi ống một khối vô hình to hơn để nhận chạm.
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  tubes.forEach((t) => { const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.155, 1.85, 12), hitMat); hit.position.y = 0.9; t.g.add(hit); });
  // Nhãn ống nằm dưới chân ống, trước giá (theo bố cục chốt). Bấm nhãn = chỉ chọn ống; bấm thân ống = cho chất đang chọn vào.
  tubes.forEach((t) => { stage.pickable(t.g, 'tube:' + t.i); stage.addTag('tube' + t.i, `Ống ${'ABCDE'[t.i]}`, () => V3(t.home.x, 0, t.home.z + 0.66), { color: '#7c8b9a', onClick: () => pickCb && pickCb('tubetag:' + t.i) }); });
  let flashAt = 0; stage.addTag('flash', '', () => tubes[flashAt].mouth().add(V3(0, 0.1, 0))); stage.setTag('flash', { visible: false });
  const boxOf = (id) => bottles[id];
  const LIFT = 0.15, restOf = (id) => { const b = boxOf(id); return selId === id ? b.rest.clone().add(V3(0, LIFT, 0)) : b.rest; }; // lọ đang chọn nhấc lên như đang cầm
  const topOf = (id) => (boxOf(id) ? boxOf(id).obj.position.clone().add(V3(0, (id === 'H2O' ? 1.7 : boxOf(id).top || 1.2) + 0.12, 0)) : V3(0, -50, 0));
  stage.addTag('sel', '', () => (selId ? topOf(selId) : V3(0, -50, 0)), { color: '#1f6feb', onClick: () => pickCb && selId && pickCb('chem:' + selId) }); stage.setTag('sel', { visible: false });
  stage.addTag('hov', '', () => (hov && hov.startsWith('chem:') ? topOf(hov.slice(5)) : V3(0, -50, 0)), { color: '#7c8b9a' }); stage.setTag('hov', { visible: false });
  // Vòng sáng trên mặt bàn: dưới vật đang rê chuột, dưới ống đang làm, và nhấp nháy dưới cả 4 ống khi chờ chọn ống.
  const ring = (r, op) => { const g = new THREE.RingGeometry(r, r + 0.035, 44); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x2f7df6, transparent: true, opacity: op, depthWrite: false })); m.renderOrder = 1; scene.add(m); return m; };
  const hoverRing = ring(0.43, 0.75); hoverRing.visible = false;
  const tubeRings = tubes.map((t) => put(ring(0.1, 0), t.home.x, t.home.y + 0.004, t.home.z));
  const footOf = (pid) => { if (pid.startsWith('tube:')) { const t = tubes[Number(pid.slice(5))]; return [V3(t.home.x, t.home.y + 0.006, t.home.z), 0.3]; } const id = pid.slice(5), b = boxOf(id); return [V3(b.rest.x, b.rest.y + 0.012, b.rest.z), id === 'pp' ? 0.5 : id === 'H2O' ? 0.85 : 0.66]; };
  stage.setHoverHandler((pid) => {
    hov = pid; hoverRing.visible = !!pid;
    if (pid && pid.startsWith('chem:') && !boxOf(pid.slice(5))) { hov = null; hoverRing.visible = false; return; }
    if (pid) { const [p, s] = footOf(pid); hoverRing.position.copy(p); hoverRing.scale.setScalar(s); }
    const chem = pid && pid.startsWith('chem:') && pid.slice(5) !== selId;
    stage.setTag('hov', { visible: !!chem, text: chem ? nameOf(pid.slice(5)) : '' });
    if (hoverCb) hoverCb(pid);
  });
  stage.setPickHandler((id) => pickCb && pickCb(id));
  const VIEWS = { all: { target: [RX - 0.28, 0.98, RZ + 0.25], w: 5.6, h: 3.5, el: 14, az: 0 }, tube: (i) => { const lv = tubes[i].yOf(tubes[i].state.tmL), h = clamp(lv * 2.4 + 0.38, 0.72, 1.7); return { target: [tubes[i].home.x, tubes[i].home.y + h * 0.4, tubes[i].home.z], w: h * 0.9, h, el: 20, az: 16 }; } };
  let curView = 'all';
  // Bảng nổi che hai mép cảnh: khung nhìn phải lọt vào phần giữa còn trống (side = số điểm ảnh bị che mỗi bên).
  let side = 0;
  function view(name, immediate = false) {
    curView = name; const p = { ...(name === 'tube' ? VIEWS.tube(active) : VIEWS[name]) }, W = host.clientWidth || 1;
    p.w *= W / Math.max(240, W - 2 * side);
    stage.focus(p, immediate); stage.controls.maxDistance = name === 'tube' ? 6 : 12; // không cho lùi xa tới mức phòng bé tí
  }
  function setActive(i) { active = i; tubes.forEach((t) => stage.setTag('tube' + t.i, { active: t.i === i })); if (curView === 'tube') view('tube'); }

  // ---------- vật tự về chỗ ở nền sau, không chặn thao tác kế ----------
  // Mỗi vật (lọ, ống nhỏ giọt, thìa) có một "người dẫn về": mỗi khung kéo vật về tư thế nghỉ hiện tại của nó.
  // Động tác chính lấy vật thì huỷ người dẫn về; xong việc thì gọi lại. Nhờ vậy rót xong là làm tiếp được ngay.
  const inUse = new Set();
  // Vật đang bay không nhận chạm: nếu không, lọ bay ngang trước lọ khác sẽ hứng mất cú bấm và chọn nhầm chất.
  stage.camera.layers.enable(1);
  const flying = (obj, on) => obj.traverse((o) => o.layers.set(on ? 1 : 0));
  const cancel = (key) => { for (let k = anims.length - 1; k >= 0; k--) if (anims[k].key === key) anims.splice(k, 1); };
  function settle(key, obj, target, onArrive) {
    cancel(key); if (inUse.has(key)) return;
    anims.push({ key, step(dt) { const tg = target(), kp = 1 - Math.exp(-dt * 8), kr = 1 - Math.exp(-dt * 13); let rot = 0;
      obj.position.lerp(tg.pos, kp); for (const a of ['x', 'y', 'z']) { const want = tg['r' + a] || 0; obj.rotation[a] += (want - obj.rotation[a]) * kr; rot += Math.abs(want - obj.rotation[a]); }
      if (obj.position.distanceTo(tg.pos) < 0.006 && rot < 0.012) { obj.position.copy(tg.pos); for (const a of ['x', 'y', 'z']) obj.rotation[a] = tg['r' + a] || 0; if (onArrive) onArrive(); return true; } return false; } });
  }
  const homeBottle = (id) => { const b = boxOf(id); if (!b) return; settle('b:' + id, b.obj, () => ({ pos: restOf(id) }), () => { capOf(b, true); flying(b.obj, false); }); };
  function setSelected(id, text) { const prev = selId; selId = id; if (id && boxOf(id)) boxOf(id).used = clock; stage.setTag('sel', { visible: !!id, text: text || '' }); if (prev && prev !== id) homeBottle(prev); if (id) homeBottle(id); stage.setTag('hov', { visible: false }); }

  // Lấy một chất ra bàn: lọ hiện lên ở chỗ trống; hết chỗ thì cất lọ lâu chưa dùng nhất (không cất lọ đang chọn, đang rót).
  function putAway(id) {
    const b = bottles[id]; if (!b || inUse.has('b:' + id)) return false;
    if (dropOut === id) dropAway();
    cancel('b:' + id); cancel('pop:' + id); stage.unpickable(b.obj); b.slot.id = null; delete bottles[id]; if (selId === id) { selId = null; stage.setTag('sel', { visible: false }); }
    anims.push({ key: 'out:' + id, t: 0, step(dt) { this.t += dt; const k = Math.min(1, this.t / 0.18); b.obj.scale.setScalar(1 - k); if (k >= 1) { scene.remove(b.obj); return true; } return false; } });
    return true;
  }
  function bringOut(id, keep = []) {
    if (bottles[id]) { bottles[id].used = clock; return { evicted: null }; }
    let slot = SLOTS.find((x) => !x.id), evicted = null;
    if (!slot) { const old = Object.values(bottles).filter((b) => b.id !== selId && !inUse.has('b:' + b.id) && !keep.includes(b.id)).sort((x, y) => x.used - y.used)[0]; if (!old) return { evicted: null, full: true }; evicted = old.id; slot = old.slot; putAway(old.id); }
    const obj = makeChemContainer(BY_ID[id], { small: true }); obj.position.copy(slot.pos); obj.scale.setScalar(0.01); scene.add(obj); stage.pickable(obj, 'chem:' + id);
    slot.id = id; bottles[id] = { id, obj, rest: slot.pos.clone(), top: id === 'H2O' ? 1.36 : obj.userData.top, slot, used: clock };
    anims.push({ key: 'pop:' + id, t: 0, step(dt) { this.t += dt; const k = Math.min(1, this.t / 0.22), e = 1 - (1 - k) * (1 - k); obj.scale.setScalar(0.01 + 0.99 * e * (1 + 0.12 * Math.sin(k * Math.PI))); return k >= 1; } });
    return { evicted };
  }

  // ---------- rót từ lọ: lọ bay vòng ra PHÍA SAU giá ống, nghiêng về phía người nhìn, rót, rồi tự về kệ ----------
  let flow = null; const TILT = 1.75, RATE = 2.5, CHUNK = 0.25;
  function pour(id, ti, { target = null, onChunk, onDone }) {
    if (dropOut === id) dropAway(); else if (armed && armed.ti === ti) disarm();
    const T = tubes[ti], isWash = id === 'H2O', B = boxOf(id), key = 'b:' + id; cancel(key); inUse.add(key); flying(B.obj, true); B.used = clock;
    const P0 = T.mouth().add(V3(0, 0.2, -0.02)), L = B.top - 0.03;
    // lọ: đáy lùi ra sau miệng ống một đoạn L, miệng lọ nằm đúng trên miệng ống. Bình tia: xoay vòi về phía trước.
    const hover = isWash ? V3(P0.x, P0.y - 1.36 + 0.04, P0.z - 0.66) : V3(P0.x, P0.y - L * Math.cos(TILT), P0.z - L * Math.sin(TILT));
    const from = B.obj.position.clone(), rx0 = B.obj.rotation.x, ry0 = B.obj.rotation.y, hex = liquidHex(id);
    flow = { poured: 0, acc: 0, stop: false, target, full: false };
    play([
      { dur: 0.62, start() { capOf(B, false); }, fn: (k) => { arc(B.obj, from, hover, k, 0.45); const q = ease(clamp((k - 0.4) / 0.6, 0, 1)); if (isWash) B.obj.rotation.y = ry0 + (-Math.PI / 2 - ry0) * k; else B.obj.rotation.x = rx0 + (TILT - rx0) * q; } },
      { start() { stream.visible = true; }, hold(dt) {
        const f = flow, lim = f.target ?? Infinity, d = Math.min(RATE * dt, lim - f.poured); f.poured += d; f.acc += d;
        while (f.acc >= CHUNK - 1e-9 && !f.full) { f.acc -= CHUNK; if (onChunk(CHUNK) === false) f.full = true; }
        setStream(P0.x, P0.y, T.surfaceY(), P0.z, hex);
        const done = f.full || f.poured >= lim - 1e-9 || (f.stop && f.poured >= 0.5 - 1e-9);
        if (done) { if (!f.full && f.acc > 0.004) onChunk(f.acc); stream.visible = false; }
        return done;
      } },
    ], () => { const f = flow; flow = null; inUse.delete(key); homeBottle(id); if (onDone) onDone(f.poured, f.full); });
  }
  const stopPour = () => { if (flow) flow.stop = true; };

  // ---------- ống nhỏ giọt: hút ở lọ, treo trên miệng ống, mỗi lần gọi rơi một giọt ----------
  let armed = null;
  const seatOf = (id) => bottles[id].obj.position.clone().add(V3(0, 0.03, 0));
  const dropAway = () => { cancel('dropper'); inUse.delete('dropper'); armed = null; dropper.visible = false; dropper.userData.setFill(0); const b = dropOut && bottles[dropOut]; dropOut = null; return b; };
  function arm(id, ti, onDone) {
    const B = bottles[id], T = tubes[ti], over = T.mouth().add(V3(0, 0.16, 0)), hex = liquidHex(id), D = dropper.userData, same = dropOut === id && dropper.visible;
    cancel('dropper'); inUse.add('dropper'); const steps = [];
    if (!same) { // rút nút-ống hút của lọ này ra: bóp, hút, nhấc lên, đưa sang miệng ống
      const prev = dropAway(); if (prev && !inUse.has('b:' + prev.id)) capOf(prev, true);
      inUse.add('dropper'); dropOut = id; B.obj.userData.cap.visible = false; const seat = seatOf(id), above = seat.clone().add(V3(0, 1.0, 0));
      dropper.position.copy(seat); dropper.rotation.set(0, 0, 0); dropper.visible = true; D.setFill(0.2, hex);
      steps.push({ dur: 0.3, ease: (k) => k, fn: (k) => { D.squeeze(k < 0.4 ? k / 0.4 : 1 - (k - 0.4) / 0.6); if (k > 0.4) D.setFill(0.2 + 0.55 * ((k - 0.4) / 0.6), hex); } },
        { dur: 0.26, fn: (k) => dropper.position.lerpVectors(seat, above, k) },
        { dur: 0.44, fn: (k) => arc(dropper, above, over, k, 0.15) });
    } else { const from = dropper.position.clone(); steps.push({ dur: 0.35, fn: (k) => arc(dropper, from, over, k, 0.25) }); }
    armed = null;
    play(steps, () => { armed = { id, ti, hex, n: 0 }; if (onDone) onDone(); });
  }
  function dropOne(onLand) {
    if (!armed) return false; const T = tubes[armed.ti], D = dropper.userData, m = dropPool.find((x) => !x.visible) || dropPool[0], tip = dropper.position.clone().add(V3(0, -0.02, 0)), hex = armed.hex;
    m.material.color.set(hex); m.visible = true; m.position.copy(tip); m.scale.setScalar(0.2);
    armed.n++; D.setFill(Math.max(0.16, D.fill - 0.02), hex);
    anims.push({ t: 0, step(dt) { this.t += dt; const a = Math.min(1, this.t / 0.1); D.squeeze(Math.sin(Math.min(1, this.t / 0.22) * Math.PI) * 0.7); m.scale.setScalar(0.2 + 0.8 * a);
      if (this.t > 0.1) { const k = (this.t - 0.1) / 0.2, yb = T.surfaceY(); m.position.y = tip.y - (tip.y - yb) * k * k; m.scale.set(0.85, 1.2, 0.85); if (k >= 1) { m.visible = false; D.squeeze(0); if (onLand) onLand(); return true; } } return false; } });
    return true;
  }
  // Trả ống hút về lọ của nó: bay lên trên miệng lọ rồi cắm xuống; tới nơi thì nó lại là nút của lọ.
  function disarm() {
    if (!dropOut) { armed = null; return; } const id = dropOut; armed = null; inUse.delete('dropper');
    if (!bottles[id]) { dropAway(); return; }
    settle('dropper', dropper, () => { if (!bottles[id]) return { pos: dropper.position }; const seat = seatOf(id), dx = Math.hypot(dropper.position.x - seat.x, dropper.position.z - seat.z); return { pos: dx > 0.04 ? seat.add(V3(0, 1.0, 0)) : seat }; },
      () => { const b = dropAway(); if (b && !inUse.has('b:' + b.id)) capOf(b, true); });
  }

  // ---------- chất rắn: xúc bằng thìa, thả vào ống; thìa tự về chỗ ----------
  function addSolid(id, ti, onLand, onDone) {
    if (armed && armed.ti === ti) disarm();
    const B = bottles[id], T = tubes[ti], above = B.obj.position.clone().add(V3(0, B.top + 0.35, 0)), dip = B.obj.position.clone().add(V3(0, B.top - 0.25, 0)), over = T.mouth().add(V3(0.02, 0.2, 0));
    cancel('spatula'); inUse.add('spatula');
    const from = spatula.position.clone(), piece = onePiece(id), H = spatula.userData.holder, bottom = V3(T.g.position.x, T.g.position.y + 0.05, T.g.position.z), mouth = T.mouth();
    play([
      { dur: 0.45, start() { capOf(B, false); }, fn: (k) => arc(spatula, from, above, k, 0.5) },
      { dur: 0.2, fn: (k) => { spatula.position.lerpVectors(above, dip, k); spatula.rotation.z = -0.35 * k; } },
      { dur: 0.2, start() { H.add(piece); }, fn: (k) => { spatula.position.lerpVectors(dip, above, k); spatula.rotation.z = -0.35 * (1 - k); } },
      { dur: 0.5, start() { capOf(B, true); }, fn: (k) => arc(spatula, above, over, k, 0.25) },
      { dur: 0.2, fn: (k) => { spatula.rotation.z = 0.7 * k; } },
      { dur: 0.4, ease: (k) => k * k, start() { H.remove(piece); flyer.clear(); flyer.add(piece); flyer.visible = true; }, fn: (k) => { const sy = T.surfaceY(); flyer.position.lerpVectors(mouth, bottom, k); if (flyer.position.y < sy) flyer.position.y = sy - (sy - bottom.y) * Math.min(1, (k - 0.5) * 2); } },
      { dur: 0.02, start() { flyer.visible = false; flyer.clear(); if (onLand) onLand(); } }, // start chỉ chạy một lần; fn có thể chạy hai khung
    ], () => { inUse.delete('spatula'); settle('spatula', spatula, () => ({ pos: SPAT_REST })); if (onDone) onDone(); });
  }

  // ---------- lắc, đổ bỏ ----------
  function shake(ti, onDone) {
    if (armed && armed.ti === ti) disarm();
    const T = tubes[ti], up = T.home.clone().add(V3(0, 0.55, 0.25));
    play([
      { dur: 0.25, fn: (k) => T.g.position.lerpVectors(T.home, up, k) },
      { dur: 1.1, ease: (k) => k, start() { T.resuspend(); }, fn: (k) => { T.g.rotation.z = Math.sin(k * Math.PI * 8) * 0.3 * Math.sin(k * Math.PI); T.g.position.x = up.x + Math.sin(k * Math.PI * 8) * 0.05 * Math.sin(k * Math.PI); } },
      { dur: 0.25, start() { T.g.rotation.z = 0; }, fn: (k) => T.g.position.lerpVectors(up, T.home, k) },
    ], onDone);
  }
  function discard(ti, onDone) {
    if (armed && armed.ti === ti) disarm();
    const T = tubes[ti], up = T.home.clone().add(V3(0, 0.9, 0)), at = SINK.clone();
    play([
      { dur: 0.25, fn: (k) => T.g.position.lerpVectors(T.home, up, k) },
      { dur: 0.6, fn: (k) => arc(T.g, up, at, k, 0.5) },
      { dur: 0.3, fn: (k) => { T.g.rotation.z = 2.0 * k; } },
      { dur: 0.6, ease: (k) => k, start() { stream.visible = T.state.mL > 0.05; stream.material.color.copy(T.state.col); T.setLook({ mL: 0, hex: '#dcecf5', opacity: 0.3 }); }, fn: () => { const m = T.mouth(); m.x = T.g.position.x - Math.sin(2.0) * T.U.h; m.y = T.g.position.y + Math.cos(2.0) * T.U.h; setStream(m.x, m.y, 0.06, m.z, null); } },
      { dur: 0.3, start() { stream.visible = false; T.reset(); }, fn: (k) => { T.g.rotation.z = 2.0 * (1 - k); } },
      { dur: 0.6, fn: (k) => arc(T.g, at, up, k, 0.5) },
      { dur: 0.25, fn: (k) => T.g.position.lerpVectors(up, T.home, k) },
    ], onDone);
  }

  // ---------- thử giấy quỳ: đũa thuỷ tinh chấm dung dịch trong ống rồi chấm lên băng giấy đặt trên bàn ----------
  // (Giấy quỳ dài 7 cm không với tới chất lỏng ở đáy ống 16 cm, nên ngoài thật cũng phải dùng đũa chấm.)
  const ROD_REST = V3(RX + 0.4, 0.03, RZ + 1.45); const rod = makeGlassRod(); rod.visible = false; rod.traverse((o) => o.layers.set(1)); scene.add(rod);
  const papers = []; let paperN = 0;
  function litmusTest(ti, hex, onDone) {
    if (armed && armed.ti === ti) disarm();
    const T = tubes[ti], slot = paperN++ % 5; if (papers[slot]) scene.remove(papers[slot]);
    const paper = makeLitmus(); paper.position.set(RX + 1.35, 0, RZ + 0.72 + slot * 0.12); // nằm bên phải giá, không chui dưới nhãn chân ống paper.traverse((o) => o.layers.set(1)); scene.add(paper); papers[slot] = paper;
    const above = T.mouth().add(V3(0, 0.25, 0)), dip = V3(above.x, Math.max(T.surfaceY() - 0.06, T.g.position.y + 0.04), above.z), touch = paper.position.clone().add(V3(-0.2, 0.01, 0)), hover = touch.clone().add(V3(0, 0.5, 0));
    cancel('rod'); rod.visible = true; rod.position.copy(ROD_REST); rod.rotation.set(0, 0, -Math.PI / 2);
    play([
      { dur: 0.4, fn: (k) => { arc(rod, ROD_REST, above, k, 0.3); rod.rotation.z = -Math.PI / 2 * (1 - k); } },
      { dur: 0.3, fn: (k) => rod.position.lerpVectors(above, dip, k) },
      { dur: 0.25, fn: (k) => rod.position.lerpVectors(dip, above, k) },
      { dur: 0.45, fn: (k) => { arc(rod, above, hover, k, 0.1); rod.rotation.z = -0.45 * k; } },
      { dur: 0.16, fn: (k) => rod.position.lerpVectors(hover, touch, k) },
      { dur: 0.3, start() { paper.userData.setWet(hex, 0.42); }, fn: (k) => rod.position.lerpVectors(touch, hover, k) },
    ], () => { settle('rod', rod, () => ({ pos: ROD_REST, rz: -Math.PI / 2 }), () => { rod.visible = false; }); if (onDone) onDone(); });
  }

  // ---------- thử que đóm đang cháy ở miệng ống: 'pop' nổ nhẹ rồi tắt, 'flare' cháy bùng, 'out' tắt, 'none' không đổi ----------
  const splint = new THREE.Group(); splint.visible = false; scene.add(splint);
  { const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.3, 8), texMat('tex_wood', { fallback: 0xd9bd8f, roughness: 0.8 })); stick.rotation.z = -Math.PI / 2; stick.position.x = 0.66; splint.add(stick);
    const ember = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), new THREE.MeshBasicMaterial({ color: 0x8a2a12 })); splint.add(ember); splint.rotation.z = 0.22; splint.traverse((o) => o.layers.set(1)); }
  const sFlame = new THREE.Mesh(lathe([[0, 0], [0.035, 0.03], [0.05, 0.1], [0.03, 0.2], [0, 0.28]], 16), new THREE.MeshBasicMaterial({ color: 0xffa23a, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })); sFlame.renderOrder = 9; sFlame.layers.set(1); sFlame.visible = false; scene.add(sFlame);
  function splintTest(ti, act, onDone) {
    const T = tubes[ti], far = T.mouth().add(V3(0.9, 0.6, 0.25)), near = T.mouth().add(V3(0.03, 0.06, 0));
    splint.visible = true; sFlame.visible = true; let t0 = 0;
    const put2 = (p, sc) => { splint.position.copy(p); sFlame.position.copy(p); sFlame.scale.set(sc, sc * (1 + 0.12 * Math.sin(clock * 31)), sc); };
    play([
      { dur: 0.55, fn: (k) => put2(far.clone().lerp(near, k), 1) },
      { dur: 0.8, ease: (k) => k, fn: (k) => { t0 = k; const sc = act === 'pop' ? (k < 0.3 ? 1 + 2.4 * Math.sin((k / 0.3) * Math.PI) : 0) : act === 'flare' ? 1 + 1.4 * Math.min(1, k * 2.5) : act === 'out' ? Math.max(0, 1 - k * 2.6) : 1; put2(near, sc); sFlame.visible = sc > 0.02; } },
      { dur: 0.4, fn: (k) => { const p = near.clone().lerp(far, k); splint.position.copy(p); sFlame.position.copy(p); } },
    ], () => { splint.visible = false; sFlame.visible = false; if (onDone) onDone(); });
  }

  // ---------- đun nóng trên đèn cồn: kẹp gỗ giữ ống ở 1/3 từ miệng, ống nghiêng, hơ đều ----------
  const LAMP = V3(RX + 0.75, 0, RZ + 0.95); let lamp = null; // đèn cồn chỉ ra bàn lúc đun, đun xong thì cất
  const holder = makeTubeHolder(); holder.rotation.x = -Math.PI / 2; holder.position.y = 1.15; holder.visible = false; holder.traverse((o) => o.layers.set(1));
  function heatTube(ti, onDone) {
    if (armed && armed.ti === ti) disarm();
    if (!lamp) { lamp = makeAlcoholLamp(); lamp.position.copy(LAMP); lamp.traverse((o) => o.layers.set(1)); scene.add(lamp); }
    cancel('lamp'); lamp.visible = true; lamp.scale.setScalar(1);
    const T = tubes[ti], up = T.home.clone().add(V3(0, 0.75, 0)), TILT = 0.72, at = LAMP.clone().add(V3(0.02, lamp.userData.flameY + 0.04, 0));
    T.g.add(holder); holder.visible = true; lamp.userData.capOff(0.6); lamp.userData.setLit(true);
    play([
      { dur: 0.25, fn: (k) => T.g.position.lerpVectors(T.home, up, k) },
      { dur: 0.5, fn: (k) => { arc(T.g, up, at, k, 0.2); T.g.rotation.z = TILT * k; } },
      { dur: 2.3, ease: (k) => k, start() { if (T.state.mL > 0.3) T.gas(0.22, 2.6); }, fn: (k) => { T.g.position.x = at.x + Math.sin(k * Math.PI * 7) * 0.05; T.g.position.y = at.y + Math.abs(Math.sin(k * Math.PI * 7)) * 0.05; } }, // hơ đều dọc ống rồi mới đun
      { dur: 0.5, fn: (k) => { arc(T.g, at, up, k, 0.2); T.g.rotation.z = TILT * (1 - k); } },
      { dur: 0.25, fn: (k) => T.g.position.lerpVectors(up, T.home, k) },
    ], () => { T.g.rotation.z = 0; T.g.remove(holder); holder.visible = false; lamp.userData.capOn();
      anims.push({ key: 'lamp', t: 0, step(dt) { this.t += dt; if (this.t < 0.6) return false; const k = Math.min(1, (this.t - 0.6) / 0.2); lamp.scale.setScalar(1 - k); if (k >= 1) { lamp.visible = false; return true; } return false; } });
      if (onDone) onDone(); });
  }

  // ---------- khung cận cảnh luôn bật: máy quay phụ bám theo ống đang làm, vẽ vào một góc của cảnh ----------
  // Nhờ vậy cảnh chính đứng yên để thao tác, còn hiện tượng trong ống vẫn nhìn rõ (kể cả lúc lắc, lúc mang ra chậu rửa).
  const inset = { cam: new THREE.PerspectiveCamera(30, 0.8, 0.05, 60), h: 0.9, on: false, flash: 0 }; inset.cam.layers.enable(1);
  const insetEl = document.createElement('button'); insetEl.type = 'button'; insetEl.className = 'fr-inset'; insetEl.title = 'Bấm để phóng to cận cảnh'; insetEl.innerHTML = '<span></span>'; host.appendChild(insetEl);
  insetEl.addEventListener('pointerdown', (e) => e.stopPropagation()); insetEl.addEventListener('click', () => insetCb && insetCb());
  stage.onAfterRender((dt) => {
    insetEl.style.display = inset.on ? '' : 'none'; if (!inset.on) return;
    const W = host.clientWidth, H = host.clientHeight, small = W < 700, w = Math.round(small ? W * 0.3 : clamp(W * 0.19, 200, 380)), h = Math.round(w * 1.25);
    const x = small ? 8 : side ? side - 24 : 12, top = small ? 8 : H - h - 12, T = tubes[active];
    inset.flash = Math.max(0, inset.flash - dt);
    Object.assign(insetEl.style, { left: `${x}px`, top: `${top}px`, width: `${w}px`, height: `${h}px`, borderColor: inset.flash > 0 ? '#2f7df6' : '#fff' }); insetEl.firstChild.textContent = `Ống ${active + 1} · cận cảnh`;
    const want = clamp(T.yOf(T.state.mL) * 2.3 + 0.45, 0.78, 1.75); inset.h += (want - inset.h) * (1 - Math.exp(-dt * 3));
    const az = 0.28, el = 0.3, d = (inset.h / 2) / Math.tan(THREE.MathUtils.degToRad(15)), tx = T.g.position.x, ty = T.g.position.y + inset.h * 0.42, tz = T.g.position.z;
    inset.cam.aspect = w / h; inset.cam.position.set(tx + Math.sin(az) * Math.cos(el) * d, ty + Math.sin(el) * d, tz + Math.cos(az) * Math.cos(el) * d); inset.cam.lookAt(tx, ty, tz); inset.cam.updateProjectionMatrix();
    hoverRing.visible = false; tubeRings.forEach((r) => { r.visible = false; }); // vòng sáng chỉ thuộc cảnh chính
    const r = stage.renderer; r.setScissorTest(true); r.setViewport(x, H - top - h, w, h); r.setScissor(x, H - top - h, w, h); r.render(scene, inset.cam); r.setScissorTest(false); r.setViewport(0, 0, W, H);
  });

  stage.onFrame((dt) => {
    clock += dt; tickSeq(dt); for (let k = anims.length - 1; k >= 0; k--) if (anims[k].step(dt)) anims.splice(k, 1);
    tubes.forEach((t) => t.update(dt)); if (lamp) lamp.userData.flicker(clock);
    hoverRing.visible = !!hov;
    tubeRings.forEach((r, i) => { const op = i === active ? 0.9 : awaiting ? 0.3 + 0.28 * Math.sin(clock * 6) : 0; r.material.opacity = op; r.visible = op > 0.01; r.scale.setScalar(i === active ? 1 : 1.15); });
  });
  view('all', true); setActive(0);
  return { stage, tubes, bottles, bringOut, putAway, has: (id) => !!bottles[id], onBench: () => Object.keys(bottles), view, setSide: (px) => { side = px; }, setInset: (on) => { inset.on = on; }, flashInset: () => { inset.flash = 0.9; }, setActive, setSelected, setAwait: (on) => { awaiting = on; }, setTubeTag: (i, text) => stage.setTag('tube' + i, { text }), setFlash: (i, text, calm) => { flashAt = i; stage.setTag('flash', { visible: !!text, text: text || '' }); const n = host.querySelector('[data-tag="flash"]'); if (n) n.classList.toggle('calm', !!calm); },
    pour, stopPour, arm, dropOne, disarm, addSolid, shake, discard, litmusTest, splintTest, heatTube, busy: () => !!seq, armed: () => armed, onPick: (f) => { pickCb = f; }, onHover: (f) => { hoverCb = f; }, onInsetClick: (f) => { insetCb = f; }, hovered: () => hov, currentView: () => curView, anchorOf: (pid) => (pid.startsWith('tube:') ? tubes[Number(pid.slice(5))].mouth().add(V3(0, 0.45, 0)) : topOf(pid.slice(5)).add(V3(0, 0.3, 0))) };
}
