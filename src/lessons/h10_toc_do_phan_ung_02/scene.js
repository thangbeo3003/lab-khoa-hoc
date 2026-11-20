// Bàn thí nghiệm của bài "Tốc độ phản ứng" bản 2: MỘT bàn bày sẵn 4 trạm (mỗi trạm một cặp đối chứng và thí nghiệm),
// một bộ đo khí và một vòng kính soi hạt. Bước 1 nhìn toàn cảnh, các bước sau máy quay áp sát từng trạm.
// Thí nghiệm theo bài 19 Hoá 10 Kết nối tri thức (xem facts.md). Dụng cụ lấy từ bộ đồ dùng chung, không có file mô hình.
// Bố trí 19/11 tối (LUONG_1_BAI_HOC.md mục 2.12): một hàng 5 trạm sát nhau trên mặt bàn sáng, nền phòng trơn, mỗi trạm ít đồ;
// tới trạm nào thì trạm khác mờ dần đi, nhãn từng món có đường dẫn chỉ vào vật.
import * as THREE from 'three';
import { createStage } from '../../kit/stage.js';
import { makeRoom, makeIsland } from '../../kit/room.js';
import { QUALITY, PAL, solidMat, canvasTexture } from '../../kit/materials.js';
import { makeFlask, makeTestTube, makeBottle, makeSyringe, makeStand, makeWatchGlass, makeTube, makeSolid } from '../../kit/labware.js';
import { Bubbles } from '../../kit/fx.js';
import { makeSchoolRack, makeAlcoholLamp, makeDropperBottle, makeSpatula, makeChemSolid } from '../../kit/labware2.js';
import { makeXPaper, makeTimer, makeFocusRing, makeParticleLens } from '../../kit/labware_l1.js';

const Z = 0.25, PX = 0.62; // hàng trạm; nửa khoảng cách giữa hai bình của một cặp
// Màu của trạm dùng cho chấm nhãn và vòng sáng trên bàn. Dụng cụ vẫn theo bảng màu chung của phòng lab.
// Trạm không đánh số, vì số sẽ lẫn với số bước (trạm Nồng độ dùng ở bước 3).
export const STATIONS = [
  { id: 'conc', n: '', name: 'Nồng độ', color: '#087b91', x: -6.3, z: Z },
  { id: 'temp', n: '', name: 'Nhiệt độ', color: '#c2410c', x: -3.55, z: Z },
  { id: 'surf', n: '', name: 'Bề mặt', color: '#6254f4', x: -0.75, z: Z },
  { id: 'cat', n: '', name: 'Xúc tác', color: '#14624f', x: 1.75, z: Z },
  { id: 'gas', n: '', name: 'Bộ đo khí', color: '#475569', x: 4.4, z: Z },
  { id: 'lens', n: '', name: 'Vòng kính soi hạt', color: '#3b3d73', x: -2.1, z: -1.6 },
];
const put = (o, x, y, z) => { o.position.set(x, y, z); return o; };
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

export function createBench(host) {
  QUALITY.fresnel = true; QUALITY.edge = true; // thuỷ tinh: giữa thân trong, mép đậm nên đọc được hình dáng trên mặt bàn và tường sáng
  const stage = createStage(host, { leader: true });
  const { scene } = stage;
  // Nền gọn và tối hơn dụng cụ (chủ 19/11: "để môi trường xung quanh tối hơn xíu để dụng cụ dễ nhìn hơn"): tường trơn xám lam vừa,
  // mặt bàn sáng hơn tường một bậc. Kính, nhãn trắng, giấy chữ X và vệt phản chiếu nổi lên; bóng đổ trên bàn vẫn thấy.
  const WALL = 0x768297;
  scene.background.set(WALL);
  scene.add(makeRoom({ kind: 'plain', wall: WALL }), makeIsland({ w: 16.6, d: 5.4, sink: false, top: 0x929dab }));
  stage.setEnvironment('./assets/env/pano_lab.jpg');

  // Đá vôi màu xám be (đá vôi thật không trắng tinh): trên mặt bàn và trong dung dịch đều thấy rõ
  const STONE = 0x8d8676, stone = (form, size) => makeSolid(form, { size, color: STONE });
  const stoneTint = (o) => { o.traverse((m) => { if (m.isMesh && m.material && m.material.flatShading) m.material.color.set(STONE); }); return o; };
  const groups = {}, rings = {}, updaters = [], parts = []; // parts: nhãn từng món của một trạm { id, st }
  const station = (id) => STATIONS.find((s) => s.id === id);
  STATIONS.forEach((s) => {
    const g = put(new THREE.Group(), s.x, 0, s.z); scene.add(g); groups[s.id] = g;
    const ring = makeFocusRing(s.color, s.id === 'gas' ? 1.7 : s.id === 'lens' ? 0.75 : 1.22);
    put(ring, s.x + (s.id === 'gas' ? 1.15 : 0), 0.012, s.z + (s.id === 'lens' ? 0 : 0.1)); scene.add(ring); rings[s.id] = ring;
    stage.pickable(g, s.id);
  });
  const pair = (g, z = 0) => [-PX, PX].map((x) => { const f = put(makeFlask(), x, 0, z); g.add(f); return f; });
  // Nhãn một món của trạm: chỉ hiện khi đang xem gần trạm đó. p = toạ độ trong trạm (đỉnh của vật).
  const part = (st, text, p, anchorFn) => { const s = station(st), id = `${st}:${parts.length}`; const el = stage.addTag(id, text, anchorFn || V3(s.x + p[0], p[1], s.z + p[2]), { color: s.color }); el.classList.add('is-part'); el.tabIndex = -1; parts.push({ id, st }); };

  // Mỗi trạm có một cặp: bình ĐỐI CHỨNG (bên trái, đứng yên) và bình THÍ NGHIỆM (bên phải, đổi theo núm). live.* là chỗ bài học đẩy trạng thái vào từng khung hình.
  const live = {}, labels = {}; // labels[st] = [id nhãn đối chứng, id nhãn thí nghiệm]
  const mix = (m, base, to, k) => { m.color.copy(base).lerp(to, k); };
  const WATER = new THREE.Color(PAL.water);
  const bubbler = (vessel, n, region, size = 0.03) => { const b = new Bubbles(stage.mobile ? Math.round(n * 0.6) : n, region, { size }); b.mesh.renderOrder = 5; b.mesh.material.opacity = 0.95; vessel.add(b.mesh); return b; };
  const flaskBub = (f, n = 44) => bubbler(f, n, { y0: 0.08, y1: f.userData.level - 0.01, radius: f.userData.rAt });

  // ---------- Nồng độ: Na₂S₂O₃ trên giấy chữ X, cùng rót H₂SO₄. Bình đục dần (lưu huỳnh), tới lúc không còn thấy chữ X ----------
  {
    const g = groups.conc, MILK = new THREE.Color(0xd8c56a); // lưu huỳnh sinh ra làm dung dịch đục vàng nhạt
    [-PX, PX].forEach((x) => g.add(put(makeXPaper({ s: 1.12 }), x, 0, 0.05)));
    const flasks = pair(g, 0.05); flasks.forEach((f) => { f.position.y = 0.012; });
    const timer = put(makeTimer(), -1.5, 0, 0.3); timer.rotation.y = 0.22; // đứng bên trái cặp bình, không chắn bình và chữ X
    g.add(put(makeBottle({ title: 'H₂SO₄', sub: '0,5 M', name: 'Sulfuric acid' }), 0, 0, -1.0), timer);
    part('conc', 'Đối chứng · 0,05 M', [-PX, 1.47, 0.05]); part('conc', 'Thí nghiệm · 0,05 M', [PX, 1.47, 0.05]); labels.conc = parts.slice(-2).map((q) => q.id);
    part('conc', 'Giấy có chữ X', [PX + 0.42, 0.02, 0.5]); part('conc', 'Đồng hồ bấm giây', [-1.5, 0.52, 0.3]);
    // p: 0 = trong, 1 = đục hẳn (không còn thấy chữ X)
    flasks.forEach((f) => { const m = f.userData.liquid.material; m.transparent = true; f.userData.liquid.renderOrder = 3; });
    live.conc = (k, p) => { const m = flasks[k].userData.liquid.material, e = p * p * (3 - 2 * p); mix(m, WATER, MILK, e); m.opacity = 0.5 + 0.5 * e; m.roughness = 0.05 + 0.8 * e; m.envMapIntensity = 1.2 - 1.0 * e; };
    live.timer = (sec) => timer.userData.setTime(sec);
  }
  // ---------- Nhiệt độ: Mg + nước có phenolphthalein. Ống thí nghiệm được đun, hoá hồng sớm hơn ----------
  {
    const g = groups.temp, RX = -0.3, rack = put(makeSchoolRack(), RX, 0, 0), R = rack.userData, PINK = new THREE.Color(0xff5c9f); // giá lệch trái, đèn cồn đứng bên phải giá: không món nào chắn ống
    g.add(rack);
    const tubes = [1, 3].map((n) => { const t = put(makeTestTube({ h: R.tube.h, r: R.tube.r }), RX + R.slotX[n], R.slotY, R.slotZ); t.userData.setLevel(0.55); g.add(t); return t; });
    const dish = put(makeWatchGlass(), -0.05, 0, 1.05); const mg = makeChemSolid('Mg'); mg.position.y = 0.03; dish.add(mg);
    const lamp = put(makeAlcoholLamp(), 1.02, 0, 0.1);
    g.add(dish, lamp, put(makeDropperBottle({ title: 'PP', name: 'Phenolphthalein' }), -1.0, 0, 0.95));
    part('temp', 'Đối chứng · 25 °C', [RX + R.slotX[1], R.slotY + R.tube.h, R.slotZ]); part('temp', 'Thí nghiệm · 25 °C', [RX + R.slotX[3], R.slotY + R.tube.h, R.slotZ]); labels.temp = parts.slice(-2).map((q) => q.id);
    part('temp', 'Magnesium (Mg)', [-0.05, 0.1, 1.05]); part('temp', 'Đèn cồn', [1.02, 0.78, 0.1]); part('temp', 'Phenolphthalein', [-1.0, 0.72, 0.95]);
    let lit = null, tt = 0;
    // p: 0 = không màu, 1 = hồng. hot: ống thí nghiệm đang được đun (đèn cồn cháy)
    live.temp = (k, p, hot) => {
      const m = tubes[k].userData.liquid.material; mix(m, WATER, PINK, p); m.opacity = 0.5 + 0.35 * p;
      if (k === 1 && hot !== lit) { lit = hot; if (hot) { lamp.userData.capOff(0.5); lamp.userData.setLit(true); } else lamp.userData.capOn(); }
    };
    updaters.push((dt) => { tt += dt; lamp.userData.flicker(tt); });
  }
  // ---------- Bề mặt: cùng lượng HCl, bình đối chứng đá vôi viên, bình thí nghiệm đổi cỡ hạt ----------
  {
    const g = groups.surf, flasks = pair(g);
    const rig = flasks.map((f, k) => {
      const x = k ? PX : -PX, dish = put(makeWatchGlass(), x, 0, 1.0); g.add(dish);
      const solids = new THREE.Group(); solids.position.y = 0.055; f.add(solids);
      return { f, dish, solids, bub: flaskBub(f, 54), form: null, level: 0 };
    });
    g.add(put(makeBottle({ title: 'HCl', sub: '0,5 M', name: 'Hydrochloric acid' }), 0, 0, -1.0));
    part('surf', 'Đối chứng · đá vôi viên', [-PX, 1.47, 0]); part('surf', 'Thí nghiệm · đá vôi viên', [PX, 1.47, 0]); labels.surf = parts.slice(-2).map((q) => q.id);
    part('surf', 'HCl 0,5 M (hai bình như nhau)', [0, 1.3, -1.0]);
    // form: 'vien' | 'vun'; frac: phần đá còn lại (0..1); level: độ mạnh của bọt (0..1)
    live.surf = (k, form, frac, level) => {
      const r = rig[k];
      if (r.form !== form) { r.form = form; r.solids.clear(); r.solids.add(stone(form, 0.95)); r.dish.userData.setForm(form); stoneTint(r.dish); }
      r.level = level; r.solids.visible = frac > 0.004; r.solids.scale.setScalar(Math.max(0.08, Math.cbrt(Math.max(frac, 0))));
    };
    updaters.push((dt) => rig.forEach((r) => r.bub.update(dt, r.level)));
  }
  // ---------- Xúc tác: hai bình H₂O₂, bình thí nghiệm thêm MnO₂ ----------
  {
    const g = groups.cat, flasks = pair(g);
    const spatula = makeSpatula(); spatula.rotation.y = -0.35; put(spatula, PX, 0, 1.0);
    g.add( // lọ H₂O₂ đứng giữa phía sau (như lọ acid của trạm Bề mặt), lọ MnO₂ đứng bên phải cặp bình: không lọ nào nằm sau lưng bình
      put(makeBottle({ title: 'H₂O₂', sub: '10%', name: 'Hydrogen peroxide', amber: true }), 0, 0, -1.0),
      put(makeBottle({ title: 'MnO₂', sub: 'bột', name: 'Manganese dioxide', content: 0x1a1a1c, contentOpacity: 1, h: 0.8, r: 0.33, fill: 0.5, wide: true }), PX + 0.98, 0, 0.3),
      spatula,
    );
    const rig = flasks.map((f) => {
      const pow = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.035, 24), solidMat(0x1c1c1e, 1)); pow.position.y = 0.065; pow.visible = false; f.add(pow);
      return { f, pow, bub: flaskBub(f, 60), level: 0 };
    });
    part('cat', 'Đối chứng · chỉ có H₂O₂', [-PX, 1.47, 0]); part('cat', 'Thí nghiệm · chỉ có H₂O₂', [PX, 1.47, 0]); labels.cat = parts.slice(-2).map((q) => q.id);
    part('cat', 'Bột MnO₂ (xúc tác)', [PX + 0.98, 0.98, 0.3]);
    live.cat = (k, has, level) => { rig[k].pow.visible = !!has; rig[k].level = level; };
    updaters.push((dt) => rig.forEach((r) => r.bub.update(dt, r.level)));
  }
  // ---------- Bộ đo khí: bình tam giác nối xi-lanh, thước đo của cả bài ----------
  const SY = 2.2;
  {
    const g = groups.gas, flask = makeFlask(), mouthY = flask.userData.H;
    const syringe = put(makeSyringe(), 1.25, SY, 0);
    const stopper = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.26, 28), solidMat(PAL.rubber, 0.85)); put(stopper, 0, mouthY + 0.04, 0); stopper.castShadow = true;
    const dish = put(makeWatchGlass(), -0.15, 0, 1.0); dish.userData.setForm('vien'); stoneTint(dish);
    const solids = new THREE.Group(); solids.position.y = 0.055; solids.add(stone('vien', 0.95)); solids.visible = false; flask.add(solids);
    const bub = flaskBub(flask, 50); let level = 0, inFlask = null;
    const G0 = station('gas'), onDish = V3(G0.x - 0.15, 0.14, G0.z + 1.0), inBottle = V3(G0.x + 0.25, 0.2, G0.z + 0.3); // nhãn đá vôi đi theo viên đá
    g.add(flask, syringe, stopper, dish, put(makeStand({ h: 3.3, armY: SY, armZ: 0.75 }), 2.3, 0, -0.75),
      makeTube([[0, mouthY + 0.1, 0], [0, mouthY + 0.55, 0], [0.25, SY + 0.3, 0], [0.6, SY + 0.17, 0], [0.81, SY + 0.02, 0], [0.93, SY, 0]]));
    part('gas', 'Xi-lanh: đọc thể tích khí', [1.25, SY + 0.22, 0]); part('gas', 'Bình phản ứng (HCl 0,5 M)', [-0.3, 0.9, 0.3]); part('gas', 'Đá vôi viên', [0, 0, 0], () => (inFlask ? inBottle : onDish));
    // dropped: đá vôi đã thả vào bình chưa; frac: phần đá còn lại; lvl: độ mạnh của bọt; mL: thể tích khí trong xi-lanh
    live.gas = (dropped, frac, lvl, mL) => {
      if (dropped !== inFlask) { inFlask = dropped; dish.userData.setForm(dropped ? null : 'vien'); if (!dropped) stoneTint(dish); }
      solids.visible = dropped && frac > 0.004; solids.scale.setScalar(Math.max(0.08, Math.cbrt(Math.max(frac, 0)))); level = dropped ? lvl : 0; syringe.userData.setVolume(mL);
    };
    updaters.push((dt) => bub.update(dt, level));
  }
  // ---------- Vòng kính soi hạt (minh hoạ) + nét chấm nối từ kính xuống ống đang soi ----------
  const lens = makeParticleLens({ y: 2.75 }); groups.lens.add(lens); updaters.push((dt) => lens.userData.update(dt));
  live.lens = (o) => lens.userData.set(o); live.lensRate = () => lens.userData.rate();
  const LS = station('lens'), LC = lens.userData.center.y, LR = lens.userData.R;
  const dots = (() => {
    const T = station('temp'), a = V3(LS.x - 0.3, LC - LR - 0.06, LS.z + 0.05), b = V3(T.x + 0.02, 1.72, T.z + 0.22), N = 13, pos = [];
    for (let i = 0; i < N; i++) { const p = a.clone().lerp(b, i / (N - 1)); pos.push(p.x, p.y, p.z); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const tex = canvasTexture(32, 32, (c) => { c.fillStyle = '#fff'; c.beginPath(); c.arc(16, 16, 13, 0, 6.283); c.fill(); });
    const m = new THREE.Points(geo, new THREE.PointsMaterial({ color: LS.color, size: 6 * (window.devicePixelRatio || 1), sizeAttenuation: false, map: tex, transparent: true, alphaTest: 0.4, depthTest: false }));
    m.renderOrder = 6; m.visible = false; scene.add(m); return m;
  })();
  live.label = (st, text) => stage.setTag(labels[st][1], { text }); // đổi chữ trên nhãn bình thí nghiệm theo núm

  // ---------- Nhãn trạm (toàn cảnh): đứng trên đỉnh dụng cụ, có đường dẫn chỉ xuống ----------
  const top = { conc: 1.5, temp: 1.68, surf: 1.5, cat: 1.5 };
  const anchor = (s) => (s.id === 'gas' ? V3(s.x + 1.25, SY + 0.25, s.z) : s.id === 'lens' ? V3(s.x, LC + LR + 0.08, s.z) : V3(s.x, top[s.id], s.z));
  let pickCb = null;
  STATIONS.forEach((s) => stage.addTag(s.id, (s.n ? s.n + ' ' : '') + s.name, anchor(s), { color: s.color, onClick: (id) => pickCb && pickCb(id) }));
  stage.setPickHandler((id) => pickCb && pickCb(id));

  // ---------- Vòng sáng: trạm đang xem hoặc đang rê chuột tới ----------
  let active = null, hover = null;
  const syncRings = () => STATIONS.forEach((s) => rings[s.id].userData.show(s.id === active || (!active && s.id === hover)));
  stage.setHoverHandler((id) => { hover = id; syncRings(); });

  // ---------- Trạm khác mờ dần khi áp sát một trạm (để khung chỉ còn đúng thứ cần nhìn) ----------
  const seen = new Map(); // vật liệu -> trạm đầu tiên dùng nó; vật liệu dùng chung nhiều trạm thì không làm mờ (ẩn hiện cùng cả trạm)
  STATIONS.forEach((s) => groups[s.id].traverse((o) => [].concat(o.material || []).forEach((m) => { seen.set(m, seen.has(m) && seen.get(m) !== s.id ? null : s.id); })));
  const fades = {};
  STATIONS.forEach((s) => { fades[s.id] = { k: 1, goal: 1, mats: [...seen].filter(([, id]) => id === s.id).map(([m]) => ({ m, o: m.opacity, tr: m.transparent })) }; });
  const applyFade = (id) => {
    const f = fades[id], k = f.k, full = k > 0.995;
    groups[id].visible = k > 0.02;
    f.mats.forEach((e) => { e.m.opacity = e.o * k; const tr = e.tr || !full; if (e.m.transparent !== tr) { e.m.transparent = tr; e.m.needsUpdate = true; } });
  };
  let far = false; // đang ở cỡ cận mà người dùng lùi máy quay ra xa: cho các trạm khác hiện lại để còn thấy mình đang ở đâu trên bàn
  const syncFades = () => STATIONS.forEach((s) => { fades[s.id].goal = !active || far || active === s.id || active === 'lens' ? 1 : 0; });

  // ---------- Góc máy: toàn cảnh (ống kính 40 độ), rồi áp sát từng trạm (ống kính hẹp 28 độ, thấp gần ngang tầm bàn) ----------
  const VIEWS = {
    all: { target: [0, 1.2, 0], w: 15.4, h: 4.6, el: 24, az: 5, fov: 40, maxDist: 36, cy: 0.62 }, // bàn nằm ở nửa dưới khung: bớt cánh tủ, chừa tường cho nhãn
    // khung giữa hẹp (hai bảng nổi chiếm hai bên): nhìn chéo dọc theo hàng trạm để cả bàn vẫn nằm trong khung và dụng cụ không bị bé
    all2: { target: [0.5, 0.9, 0.2], w: 12.0, h: 6.6, el: 27, az: 52, fov: 36, maxDist: 40, cy: 0.56 },
    gas: { target: [station('gas').x + 1.2, 1.3, Z], w: 5.3, h: 3.3, el: 11, az: -7, fov: 28 },
    lens: { target: [LS.x - 0.45, 2.15, -0.6], w: 4.4, h: 3.5, el: 8, az: 5, fov: 28 },
  };
  STATIONS.slice(0, 4).forEach((s) => { VIEWS[s.id] = { target: [s.x, 0.66, s.z + 0.15], w: 3.0, h: 2.25, el: 11, az: s.x < -2 ? -7 : 7, fov: 28 }; });
  Object.assign(VIEWS.conc, { target: [station('conc').x - 0.3, 0.66, Z + 0.15], w: 3.7, el: 15 }); // rộng hơn để lấy cả đồng hồ, cao hơn để thấy chữ X dưới đáy bình
  Object.assign(VIEWS.cat, { target: [station('cat').x + 0.4, 0.66, Z + 0.15], w: 3.7 });
  Object.assign(VIEWS.surf, { el: 13 });
  Object.assign(VIEWS.temp, { target: [station('temp').x + 0.1, 0.8, Z + 0.15], w: 3.3, h: 2.7, el: 12 });

  // Xoay tay chỉ trong một góc quanh khung chuẩn: không lạc ra sau bàn, không chui xuống dưới mặt bàn
  Object.values(VIEWS).forEach((v) => Object.assign(v, { swing: 38, elMin: 5, elMax: 58 }));

  return {
    stage, groups, STATIONS, VIEWS, live,
    view: (name, immediate) => stage.focus(VIEWS[name] || VIEWS.all, immediate),
    setActive: (id) => { active = id; dots.visible = id === 'lens'; syncRings(); syncFades(); },
    // mode: 'all' = nhãn cả 6 điểm; id trạm = nhãn từng món của trạm đó; null = ẩn hết
    setTags: (mode, done = new Set(), act = null) => {
      STATIONS.forEach((s) => stage.setTag(s.id, { visible: mode === 'all', done: done.has(s.id), active: act === s.id }));
      parts.forEach((p) => stage.setTag(p.id, { visible: mode === p.st }));
    },
    onPick: (f) => { pickCb = f; },
    update: (dt) => {
      const f2 = !!active && stage.zoom() > 1.3; if (f2 !== far) { far = f2; syncFades(); }
      STATIONS.forEach((s) => { rings[s.id].userData.update(dt); const f = fades[s.id]; if (f.k !== f.goal) { f.k += (f.goal - f.k) * Math.min(1, dt * 7); if (Math.abs(f.goal - f.k) < 0.01) f.k = f.goal; applyFade(s.id); } });
      updaters.forEach((f) => f(dt));
    },
  };
}
