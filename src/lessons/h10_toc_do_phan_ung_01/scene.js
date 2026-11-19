// Bày bàn thí nghiệm của bài từ bộ đồ dùng chung, trong phòng lab hiện đại (style S2).
import * as THREE from 'three';
import { createStage } from '../../kit/stage.js';
import { makeRoom, makeIsland } from '../../kit/room.js';
import { makeFlask, makeTestTube, makeBottle, makeSyringe, makeStand, makeHotplate, makeWatchGlass, makeRack, makeTube, makeSolid } from '../../kit/labware.js';
import { Bubbles } from '../../kit/fx.js';
import { PAL, contactShadow, solidMat, liquidMat } from '../../kit/materials.js';
import { N0, V_MAX } from './model.js';

export const VIEWS = {
  all: { target: [0.9, 1.5, 0], w: 12.5, h: 6.6, el: 15, az: 28 },
  A: { target: [-0.9, 1.75, 0], w: 8.0, h: 5.0, el: 11, az: 14 },
  B: { target: [4.0, 1.0, 0.2], w: 4.8, h: 3.4, el: 13, az: -12 },
  sink: { target: [-3.4, 1.5, 0.2], w: 6.6, h: 4.4, el: 13, az: 20 },
};

const put = (o, x, y, z) => { o.position.set(x, y, z); return o; };
const fmtC = (c) => c.toFixed(1).replace('.', ',') + ' M';

export function createBench(host) {
  const stage = createStage(host);
  const { scene } = stage;
  // Phối cảnh: 4 tường dán ảnh mặt đứng do Codex vẽ, ảnh toàn cảnh làm nguồn phản chiếu; bàn và dụng cụ là 3D thật.
  const PHOTO = new URLSearchParams(location.search).get('room') === 'khoi' ? null : './assets/env/';
  const island = put(makeIsland({ sink: 'left' }), 0.5, 0, 0);
  scene.add(makeRoom({ photo: PHOTO, hd: !stage.mobile }), island);
  const SPOUT = island.userData.sink.spout.clone().add(island.position); // miệng vòi nước của bàn chính
  let curEnv = null;

  // ---------- Trạm A: đá vôi + acid, đo khí ----------
  const FX = -1.4, SY = 2.75;
  const hot = put(makeHotplate(), FX, 0, 0.3); scene.add(hot);
  const flask = put(makeFlask(), FX, hot.userData.top, 0); scene.add(flask);
  const mouthY = hot.userData.top + flask.userData.H;
  const acid = put(makeBottle({ title: 'HCl', sub: '1,0 M', name: 'Hydrochloric acid' }), -3.2, 0, -1.0); scene.add(acid);
  const DISH = new THREE.Vector3(-2.9, 0, 1.2);
  const dish = makeWatchGlass(); dish.position.copy(DISH); scene.add(dish);
  const syringe = put(makeSyringe(), FX + 1.25, SY, 0); scene.add(syringe);
  scene.add(put(makeStand({ armY: SY, armZ: 0.75 }), FX + 2.3, 0, -0.75));

  // Nút cao su + ống dẫn là một cụm, xoay quanh đầu vòi xi-lanh để mở và đậy miệng bình.
  const PIV = new THREE.Vector3(FX + 0.93, SY, 0), OPEN = -0.9;
  const plug = new THREE.Group(); plug.position.copy(PIV); scene.add(plug);
  plug.add(makeTube([[FX, mouthY + 0.1, 0], [FX, mouthY + 0.6, 0], [FX + 0.25, SY + 0.3, 0], [FX + 0.6, SY + 0.17, 0], [PIV.x - 0.12, SY + 0.02, 0], [PIV.x, SY, 0]].map((q) => [q[0] - PIV.x, q[1] - PIV.y, q[2]])));
  const stopper = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.26, 28), solidMat(PAL.rubber, 0.85));
  stopper.position.set(FX - PIV.x, mouthY + 0.04 - PIV.y, 0); stopper.castShadow = true; plug.add(stopper);

  const solids = new THREE.Group(); solids.position.y = 0.03; flask.add(solids);
  const bubA = new Bubbles(stage.mobile ? 36 : 60, { y0: 0.06, y1: flask.userData.level - 0.015, radius: flask.userData.rAt }, { size: 0.02 });
  flask.add(bubA.mesh);
  const waterCol = new THREE.Color(PAL.water), cloudCol = new THREE.Color(0xf3f2ec);

  // ---------- Trạm B: hydrogen peroxide + xúc tác ----------
  const rack = put(makeRack(), 4.0, 0, 0.3); scene.add(rack, put(contactShadow(1.1, 0.4), 4.0, 0.006, 0.35));
  const tubes = [0, 2].map((i) => { const t = put(makeTestTube(), rack.userData.slotX[i], rack.userData.slotY, 0); rack.add(t); return t; });
  const h2o2 = put(makeBottle({ title: 'H₂O₂', sub: '3%', name: 'Hydrogen peroxide', amber: true }), 2.8, 0, -0.6); scene.add(h2o2);
  const mno2 = put(makeBottle({ title: 'MnO₂', sub: 'bột', name: 'Manganese dioxide', content: 0x1a1a1c, contentOpacity: 1, h: 0.8, r: 0.33, fill: 0.5, wide: true }), 5.2, 0, 0.8); scene.add(mno2);
  const powder = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 8), solidMat(0x1a1a1c, 1)); powder.scale.set(1, 0.6, 1); powder.position.y = 0.08; powder.visible = false; tubes[1].add(powder);
  const bubB = new Bubbles(stage.mobile ? 22 : 34, { y0: 0.12, y1: tubes[1].userData.level - 0.02, radius: () => 0.07 }, { size: 0.02 });
  tubes[1].add(bubB.mesh);
  const foam = new THREE.Mesh(new THREE.CylinderGeometry(0.076, 0.076, 1, 20), solidMat(0xffffff, 1, { transparent: true, opacity: 0.9 }));
  foam.visible = false; tubes[1].add(foam);

  // ---------- Chạm chọn + nhãn ----------
  [['flask', flask], ['acid', acid], ['sample', dish], ['syringe', syringe], ['hotplate', hot], ['tube1', tubes[0]], ['tube2', tubes[1]], ['h2o2', h2o2], ['mno2', mno2]].forEach(([id, o]) => stage.pickable(o, id));
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const TAGS = {
    acid: ['Acid HCl', V3(-3.2, 1.7, -1.0), '#2f6fd0'],
    sample: ['Đá vôi CaCO₃', V3(-2.9, 0.4, 1.2), '#7c8b9a'],
    flask: ['Bình tam giác', V3(FX - 1.0, 2.25, 0), '#1e9e6a'],
    syringe: ['Xi-lanh đo khí', V3(FX + 2.1, SY + 0.45, 0), '#f08a24'],
    hotplate: ['Bếp điện · 25 °C', V3(FX + 1.3, 0.25, 1.7), '#d64545'],
    tube1: ['Ống 1', V3(4.0 + rack.userData.slotX[0], 1.85, 0.3), '#7c8b9a'],
    tube2: ['Ống 2', V3(4.0 + rack.userData.slotX[2], 1.85, 0.3), '#1e9e6a'],
    h2o2: ['Hydrogen peroxide', V3(2.8, 1.75, -0.6), '#7a4a1c'],
    mno2: ['Manganese dioxide', V3(5.2, 1.35, 0.8), '#3a3f47'],
  };
  let pickCb = null;
  Object.entries(TAGS).forEach(([id, [text, pos, color]]) => stage.addTag(id, text, pos, { color, onClick: (i) => pickCb && pickCb(i) }));
  stage.setPickHandler((id) => pickCb && pickCb(id));

  // ---------- Động tác: chuỗi nhịp chạy theo thời gian, không dùng hẹn giờ ----------
  const ease = (k) => k * k * (3 - 2 * k);
  let seq = null;
  function play(steps, onDone) { seq = { steps, i: 0, t: 0, onDone }; if (steps[0].start) steps[0].start(); }
  function tickSeq(dt) {
    while (seq) {
      const st = seq.steps[seq.i]; seq.t += dt;
      const k = Math.min(1, seq.t / st.dur);
      if (st.fn) st.fn(st.ease ? st.ease(k) : ease(k));
      if (k < 1) break;
      dt = seq.t - st.dur; seq.i++; seq.t = 0;
      if (seq.i >= seq.steps.length) { const d = seq.onDone; seq = null; if (d) d(); break; }
      if (seq.steps[seq.i].start) seq.steps[seq.i].start();
    }
  }
  const TILT = -1.75, MOUTH_L = acid.userData.top - 0.03;
  const REST = acid.position.clone();
  const POUR = new THREE.Vector3(FX - 0.06, mouthY + 0.2, 0); // điểm miệng lọ khi rót
  const HOVER = new THREE.Vector3(POUR.x + MOUTH_L * Math.sin(TILT), POUR.y - MOUTH_L * Math.cos(TILT), 0);
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.02, 1, 10), liquidMat(PAL.water, 0.75));
  stream.visible = false; stream.renderOrder = 3; scene.add(stream);
  const flyer = new THREE.Group(); flyer.visible = false; scene.add(flyer);
  const liquid = flask.userData.liquid;
  let splash = 0, shown = null;
  const setFill = (k) => { liquid.visible = k > 0.01; liquid.scale.y = Math.max(k, 0.01); };

  function setSetup({ form, conc, temp }) {
    acid.userData.setLabel('HCl', fmtC(conc));
    hot.userData.setTemp(temp);
    stage.setTag('hotplate', { text: `Bếp điện · ${temp} °C` });
    if (!shown) dish.userData.setForm(form);
  }
  // Dọn bàn. assembled = true: bộ dụng cụ đã lắp sẵn, bình có acid (dùng cho bước làm quen).
  function reset(setup, assembled = false) {
    seq = null; splash = 0; shown = null;
    acid.position.copy(REST); acid.rotation.z = 0; acid.userData.cap.visible = true; acid.userData.shadow.visible = true;
    stream.visible = false; flyer.visible = false; solids.clear(); solids.scale.setScalar(1);
    flask.position.copy(HOME); flask.rotation.z = 0; water.visible = false;
    plug.rotation.z = assembled ? 0 : OPEN; setFill(assembled ? 1 : 0);
    if (setup) dish.userData.setForm(setup.form);
    syringe.userData.setVolume(0);
    liquid.material.color.copy(waterCol); liquid.material.opacity = 0.5;
  }
  // Nhấc lọ acid, nghiêng, rót thành dòng vào bình, trả lọ về chỗ cũ.
  function pour(onDone) {
    const A = acid.userData, top = hot.userData.top;
    play([
      { dur: 0.65, start() { A.cap.visible = false; A.shadow.visible = false; }, fn: (k) => { acid.position.lerpVectors(REST, HOVER, k); acid.position.y += Math.sin(Math.PI * k) * 0.3; } },
      { dur: 0.5, fn: (k) => { acid.rotation.z = TILT * k; } },
      { dur: 1.4, ease: (k) => k, start() { stream.visible = true; }, fn: (k) => {
        const yb = top + 0.02 + flask.userData.level * k, len = Math.max(0.05, POUR.y - yb);
        stream.position.set(POUR.x, yb + len / 2, 0); stream.scale.set(1, len, 1); setFill(k);
      } },
      { dur: 0.45, start() { stream.visible = false; }, fn: (k) => { acid.rotation.z = TILT * (1 - k); } },
      { dur: 0.65, fn: (k) => { acid.position.lerpVectors(HOVER, REST, k); acid.position.y += Math.sin(Math.PI * k) * 0.3; } },
      { dur: 0.02, fn: () => { A.cap.visible = true; A.shadow.visible = true; } },
    ], onDone);
  }
  // Đá vôi bay theo đường cong vào miệng bình, rơi xuống đáy, rồi nút được đậy lại.
  function drop(run, onDone) {
    const from = DISH.clone().setY(0.1), mouth = new THREE.Vector3(FX, mouthY + 0.25, 0), bottom = new THREE.Vector3(FX, hot.userData.top + 0.05, 0);
    flyer.clear(); flyer.add(makeSolid(run.form, { size: 0.75 }));
    play([
      { dur: 0.95, start() { dish.userData.setForm(null); flyer.visible = true; }, fn: (k) => { flyer.position.lerpVectors(from, mouth, k); flyer.position.y += Math.sin(Math.PI * k) * 0.6; flyer.rotation.z = -k * 1.2; flyer.scale.setScalar(1.5 - 0.5 * k); } },
      { dur: 0.42, ease: (k) => k * k, fn: (k) => flyer.position.lerpVectors(mouth, bottom, k) },
      { dur: 0.02, fn: () => { flyer.visible = false; solids.clear(); solids.add(makeSolid(run.form, { size: 0.75 })); solids.scale.setScalar(1); shown = run.form; splash = 0.7; } },
      { dur: 0.6, fn: (k) => { plug.rotation.z = OPEN * (1 - k); } },
    ], onDone);
  }
  // Dòng nước từ vòi + rửa bình: bình rời bếp ra chậu rửa, nước chảy vào, nghiêng đổ đi, quay về bếp.
  const HOME = flask.position.clone();
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.032, 1, 12), liquidMat(PAL.water, 0.7)); water.visible = false; water.renderOrder = 3; scene.add(water);
  const tapStream = (top, bottomY) => { const len = Math.max(0.05, top.y - bottomY); water.position.set(top.x, bottomY + len / 2, top.z); water.scale.set(1, len, 1); };
  function rinse(onDone) {
    const P1 = new THREE.Vector3(HOME.x - 0.5, HOME.y + 0.5, 1.7), P2 = new THREE.Vector3(SPOUT.x, 0.7, SPOUT.z);
    solids.clear(); shown = null; setFill(0.4);
    play([
      { dur: 0.55, fn: (k) => flask.position.lerpVectors(HOME, P1, k) },
      { dur: 1.0, fn: (k) => { flask.position.lerpVectors(P1, P2, k); flask.position.y += Math.sin(Math.PI * k) * 0.5; } },
      { dur: 1.4, ease: (k) => k, start() { water.visible = true; }, fn: (k) => { const f = 0.4 + 0.6 * k; setFill(f); tapStream(SPOUT, P2.y + 0.05 + flask.userData.level * f); } },
      { dur: 0.5, start() { water.visible = false; }, fn: (k) => { flask.rotation.z = 1.9 * k; } },
      { dur: 0.6, ease: (k) => k, fn: (k) => setFill(1 - k) },
      { dur: 0.4, fn: (k) => { flask.rotation.z = 1.9 * (1 - k); } },
      { dur: 1.0, fn: (k) => { flask.position.lerpVectors(P2, P1, k); flask.position.y += Math.sin(Math.PI * k) * 0.5; } },
      { dur: 0.55, fn: (k) => flask.position.lerpVectors(P1, HOME, k) },
    ], onDone);
  }

  function setCatalyst(added) { powder.visible = added; foam.visible = false; const lm = tubes[1].userData.liquid.material; lm.color.set(added ? 0x4f565c : PAL.water); lm.opacity = added ? 0.9 : 0.5; }
  function setTags(group, done = new Set(), active = null) {
    const A = ['acid', 'sample', 'flask', 'syringe', 'hotplate'], B = ['tube1', 'tube2', 'h2o2', 'mno2'], Kt = ['cup1', 'cup2'];
    Object.keys(TAGS).forEach((id) => stage.setTag(id, { visible: group === 'all' || (group === 'A' && A.includes(id)) || (group === 'B' && B.includes(id)) || (group === 'K' && Kt.includes(id)), done: done.has(id), active: active === id }));
  }

  // Gọi mỗi khung hình: chạy động tác đang dở, rồi đưa số của mô hình lên hình.
  function update(dt, { run, running, catLevel = 0 }) {
    tickSeq(dt);
    let k = 0;
    if (run && shown) {
      const left = run.nSolid / N0;
      syringe.userData.setVolume(run.vGas);
      const s = Math.max(0.001, Math.cbrt(left)); solids.scale.setScalar(s); solids.visible = left > 0.001;
      if (running) k = Math.min(1, Math.sqrt(run.rate / 9));
      const cloud = run.form === 'bot' ? 0.75 * left : run.form === 'vun' ? 0.15 * left : 0;
      liquid.material.color.copy(waterCol).lerp(cloudCol, cloud);
      liquid.material.opacity = 0.5 + 0.4 * cloud;
    }
    if (splash > 0) { splash -= dt; k = Math.max(k, 0.85); }
    bubA.update(dt, k);
    bubB.update(dt, Math.min(1, catLevel * 1.15));
    if (powder.visible) {
      const fh = 0.03 + 0.45 * catLevel, lv = tubes[1].userData.level;
      foam.visible = catLevel > 0.03; foam.scale.y = fh; foam.position.y = lv + fh / 2;
    }
  }

  return {
    stage, setSetup, reset, pour, drop, rinse, setCatalyst, setTags, update,
    view: (name, immediate) => {
      // đổi nguồn phản chiếu theo căn phòng đang đứng
      const env = PHOTO ? PHOTO + 'pano_lab.jpg' : null;
      if (env && env !== curEnv) { curEnv = env; stage.setEnvironment(env); }
      stage.focus(VIEWS[name] || VIEWS.all, immediate);
    },
    onPick: (f) => { pickCb = f; },
    V_MAX,
  };
}
