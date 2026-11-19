// Khung "Bên trong ống" dựng 3D (chủ 19/11: "cái đó mới là cái cần dựng 3d và để làm trung tâm"): thế giới hạt trong ống nghiệm.
// Mỗi ion, phân tử là một cụm cầu theo màu nguyên tử; chạy 3 nhịp: (1) trước khi trộn, (2) các hạt gặp nhau đúng tỉ lệ phương trình ion thu gọn,
// (3) sau phản ứng: kết tủa nằm ở đáy, khí đã bay ra, ion đứng ngoài vẫn bơi trong dung dịch. Sơ đồ minh hoạ: không vẽ phân tử nước của dung môi, không theo tỉ lệ thật.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { ATOM, atomsOf, ION_PM } from './ionmodel.js';

const R = 4.5, LV = 6.8, TOP = 9.4, T1 = 3.0, GAP = 1.25;
const rnd = (a, b) => a + Math.random() * (b - a), V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const SPH = new THREE.SphereGeometry(1, 28, 18), MATS = {};
const matOf = (el) => MATS[el] || (MATS[el] = new THREE.MeshStandardMaterial({ color: (ATOM[el] || ['#9fb3c8'])[0], roughness: 0.32, metalness: 0.05 }));
const radOf = (el) => (ATOM[el] || [0, 0.55])[1];
// Dựng một hạt từ công thức: nguyên tử trung tâm (không phải H, O) ở giữa, các nguyên tử khác xếp quanh theo số lượng: thẳng, gấp khúc (H₂O), tam giác, tứ diện.
export function cluster(plain, ion = false) {
  const atoms = atomsOf(plain), g = new THREE.Group(), ball = (el, p, rr) => { const m = new THREE.Mesh(SPH, matOf(el)); m.scale.setScalar(rr || radOf(el)); m.position.copy(p); g.add(m); };
  if (atoms.length === 1) { const rr = ion && ION_PM[atoms[0]] ? Math.max(0.3, ION_PM[atoms[0]] / 292) : radOf(atoms[0]); ball(atoms[0], V3(0, 0, 0), rr); return { g, r: rr }; } // ion đơn nguyên tử: cỡ theo bán kính ion thật (Cl⁻ 181 pm ứng với 0,62)
  let ci = atoms.findIndex((a) => a !== 'H' && a !== 'O'); if (ci < 0) ci = atoms.indexOf('O'); if (ci < 0) ci = 0;
  const c = atoms[ci], rest = atoms.filter((_, i) => i !== ci).sort((a, b) => (a === 'H') - (b === 'H')), n = rest.length; ball(c, V3(0, 0, 0)); let far = radOf(c);
  const dirs = n === 1 ? [[1, 0, 0]] : n === 2 ? (c === 'O' ? [[0.79, 0.61, 0], [-0.79, 0.61, 0]] : [[1, 0, 0], [-1, 0, 0]]) : n === 3 ? [[1, 0, 0], [-0.5, 0.866, 0], [-0.5, -0.866, 0]] : n === 4 ? [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]] : rest.map((_, k) => { const y = 1 - (2 * (k + 0.5)) / n, q = Math.sqrt(1 - y * y), a = k * 2.399; return [Math.cos(a) * q, y, Math.sin(a) * q]; });
  rest.forEach((el, k) => { const d = V3(...dirs[k]).normalize().multiplyScalar((radOf(c) + radOf(el)) * 0.82); ball(el, d); far = Math.max(far, d.length() + radOf(el)); });
  return { g, r: far };
}
const TAGS = {};
export function tag(text) { let t = TAGS[text]; if (!t) { const c = document.createElement('canvas'), x = c.getContext('2d'), F = '700 44px -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif'; x.font = F; const w = Math.ceil(x.measureText(text).width) + 36; c.width = w; c.height = 64; x.font = F; x.fillStyle = 'rgba(8,14,26,0.82)'; x.beginPath(); x.roundRect(0, 0, w, 64, 20); x.fill(); x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, 34); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; t = TAGS[text] = { m: new THREE.SpriteMaterial({ map: tx, depthTest: false, transparent: true }), w }; }
  const s = new THREE.Sprite(t.m); s.scale.set((t.w / 64) * 0.62, 0.62, 1); s.renderOrder = 20; return s; }

export function mountProcess3D(stage, { onPhase } = {}) {
  const cv = document.createElement('canvas'); cv.className = 'p3-cv'; stage.prepend(cv);
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200), controls = new OrbitControls(camera, cv);
  camera.position.set(0, 7.0, 31); controls.target.set(0, 4.2, 0); Object.assign(controls, { enablePan: false, enableDamping: true, dampingFactor: 0.08, autoRotate: true, autoRotateSpeed: 0.9, minDistance: 12, maxDistance: 46, minPolarAngle: 0.5, maxPolarAngle: 1.75 });
  scene.add(new THREE.HemisphereLight(0xffffff, 0x1a2638, 1.25)); const sun = new THREE.DirectionalLight(0xffffff, 1.9); sun.position.set(6, 14, 10); scene.add(sun);
  // ống nghiệm sơ đồ: thành trong mờ, mặt chất lỏng, miệng ống
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xbcd3ea, transparent: true, opacity: 0.11, roughness: 0.08, side: THREE.DoubleSide, depthWrite: false });
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, TOP, 56, 1, true), glass); wall.position.y = TOP / 2; const cap = new THREE.Mesh(new THREE.SphereGeometry(R, 56, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), glass);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.07, 10, 64), new THREE.MeshBasicMaterial({ color: 0xdbe8f6, transparent: true, opacity: 0.8 })); rim.rotation.x = Math.PI / 2; rim.position.y = TOP;
  const liqMat = new THREE.MeshBasicMaterial({ color: 0x9cc4ea, transparent: true, opacity: 0.13, depthWrite: false, side: THREE.DoubleSide });
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.06, R - 0.06, LV, 48, 1, true), liqMat); liq.position.y = LV / 2; const liqB = new THREE.Mesh(new THREE.SphereGeometry(R - 0.06, 48, 18, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), liqMat);
  const surf = new THREE.Mesh(new THREE.CircleGeometry(R - 0.06, 48), new THREE.MeshBasicMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide })); surf.rotation.x = -Math.PI / 2; surf.position.y = LV;
  scene.add(wall, cap, rim, liq, liqB, surf); const world = new THREE.Group(); scene.add(world);

  let M = null, caps = [], parts = [], time = 0, phase = 0, done = 0, total = 0, nextEvt = 0, rest = 0, T2 = 99, tagged = {};
  const inLiquid = () => { const a = rnd(0, 6.283), q = Math.sqrt(Math.random()) * (R - 1.0); return V3(Math.cos(a) * q, rnd(-0.6, LV - 0.9), Math.sin(a) * q); };
  function spawn(label, pos, state) { const sp = M.species[label], { g, r } = cluster(sp.plain), o = new THREE.Group(); o.add(g); o.position.copy(pos); world.add(o);
    const p = { sp, label, o, g, r, state, v: V3(rnd(-0.4, 0.4), rnd(-0.3, 0.3), rnd(-0.4, 0.4)), spin: V3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)), born: time, delay: 0 };
    if ((tagged[label] = (tagged[label] || 0) + 1) <= (sp.kind === 'ion' || sp.kind === 'mol' ? 1 : 2)) { const t = tag(label + (sp.kind === 'ppt' ? '↓' : sp.kind === 'gas' ? '↑' : '')); t.position.y = r + 0.62; o.add(t); }
    if (sp.kind === 'gas') { const b = new THREE.Mesh(SPH, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false })); b.scale.setScalar(r + 0.45); o.add(b); }
    parts.push(p); return p; }
  function reset() { world.clear(); parts = []; time = 0; done = 0; rest = 0; tagged = {}; phase = 0; if (!M) return; let solidN = 0, wait = 0;
    liqMat.color.set(M.liquid || '#9cc4ea');
    M.terms.forEach((tm, ti) => { for (const q of tm.parts) { const n = q.n * M.nr + Math.round((q.n / tm.coef) * M.excess[ti]);
      for (let k = 0; k < n; k++) { if (M.species[q.label].kind === 'solid') { const i = solidN++, a = i * 2.4, rr = 0.72 * Math.sqrt(i); spawn(q.label, V3(Math.cos(a) * rr, -R + 0.95 + (i > 6 ? 0.7 : 0), Math.sin(a) * rr), 'solid'); }
        else if (tm.source === 'add') { const p = spawn(q.label, V3(rnd(-2.4, 2.4), TOP + 1.7 + rnd(-0.9, 0.9), rnd(-2.4, 2.4)), 'wait'); p.delay = (wait++) * 0.06; p.to = inLiquid(); }
        else spawn(q.label, inLiquid(), 'free'); } } });
    total = Math.min(8, M.nr * M.perEq); nextEvt = T1 + 1.7; T2 = T1 + 1.7 + total * GAP + 2.6; setPhase(1); }
  function setPhase(k) { if (k === phase) return; phase = k; stage.dataset.phase = k; if (onPhase) onPhase(k, caps[k - 1] || ''); }
  function react() { const pick = []; let host = null;
    for (const x of M.lhs) { const c = parts.filter((p) => p.label === x.label && (p.state === 'free' || p.state === 'solid') && !p.claim); if (c.length < x.n) return false; c.sort((a, b) => a.o.position.y - b.o.position.y + rnd(-2, 2)); for (let k = 0; k < x.n; k++) { pick.push(c[k]); if (c[k].state === 'solid') host = c[k]; } }
    const at = host ? host.o.position.clone() : V3(rnd(-2.4, 2.4), rnd(0.4, LV - 1.5), rnd(-2.4, 2.4));
    pick.forEach((p, k) => { p.claim = true; if (p === host) { p.state = 'hold'; return; } const a = (k / pick.length) * 6.283; p.state = 'meet'; p.from = p.o.position.clone(); p.to = at.clone().add(V3(Math.cos(a) * 0.62, Math.sin(a) * 0.5, Math.sin(a * 1.7) * 0.5)); p.t = 0; });
    pick.t = 0; pick.at = at; meets.push(pick); return true; }
  const meets = [];
  function product(pick) { const at = pick.at, ions = pick.every((p) => p.sp.kind === 'ion'), one = M.rhs.length === 1 && M.rhs[0].kind === 'ppt' && M.rhs[0].n === 1;
    if (one && ions) { // kết tủa: chính các ion vừa gặp nhau dính lại thành một hạt rắn rồi chìm xuống
      const x = M.rhs[0], sp = M.species[x.label], o = new THREE.Group(); o.position.copy(at); world.add(o); let r = 0.6;
      pick.forEach((p) => { p.o.children.filter((c) => c.isSprite).forEach((c) => p.o.remove(c)); const d = p.o.position.clone().sub(at); world.remove(p.o); p.g.position.copy(d); o.add(p.g); r = Math.max(r, d.length() + p.r); });
      const halo = new THREE.Mesh(SPH, new THREE.MeshBasicMaterial({ color: (M.tint && M.tint[x.label]) || sp.color, transparent: true, opacity: 0.3, depthWrite: false })); halo.scale.setScalar(r + 0.12); o.add(halo);
      if ((tagged[x.label] = (tagged[x.label] || 0) + 1) <= 2) { const t = tag(x.label + '↓'); t.position.y = r + 0.62; o.add(t); }
      parts = parts.filter((p) => !pick.includes(p)); parts.push({ sp, label: x.label, o, g: o, r, state: 'sink', v: V3(0, 0, 0), spin: V3(0, 0, 0), born: time, slot: rest++ }); return; }
    pick.forEach((p) => world.remove(p.o)); parts = parts.filter((p) => !pick.includes(p)); let k = 0;
    for (const x of M.rhs) for (let i = 0; i < x.n; i++) { const a = (k++) * 2.1, p = spawn(x.label, at.clone().add(V3(Math.cos(a) * 0.5, 0.2 * i, Math.sin(a) * 0.5)), x.kind === 'ppt' ? 'sink' : x.kind === 'gas' ? 'rise' : 'free'); if (x.kind === 'ppt') p.slot = rest++; p.v.set(Math.cos(a) * 1.2, 0.4, Math.sin(a) * 1.2); } }
  const slotPos = (k) => { if (k === 0) return V3(0, -R + 0.95, 0); const ring = k <= 6 ? 1 : 2, i = ring === 1 ? k - 1 : k - 7, n = ring === 1 ? 6 : 10, a = (i / n) * 6.283 + ring; return V3(Math.cos(a) * 1.45 * ring * 0.9, -R + 0.95 + ring * 0.32 + (k > 16 ? 0.9 : 0), Math.sin(a) * 1.45 * ring * 0.9); };
  function sim(dt) { if (!M) return; time += dt;
    if (time >= T1 && phase < 2) setPhase(2); if (time >= T2 && phase < 3) setPhase(3);
    if (time >= nextEvt && done < total) { react(); done++; nextEvt += GAP; }
    for (let i = meets.length - 1; i >= 0; i--) { const m = meets[i]; m.t += dt / 0.85; for (const p of m) if (p.state === 'meet') p.o.position.lerpVectors(p.from, p.to, Math.min(1, m.t) ** 2 * (3 - 2 * Math.min(1, m.t))); if (m.t >= 1) { meets.splice(i, 1); product(m); } }
    for (const p of parts) { p.g.rotation.x += p.spin.x * dt * 0.6; p.g.rotation.y += p.spin.y * dt * 0.6; const s = Math.min(1, (time - p.born) / 0.3); if (p.born > 0.01) p.o.scale.setScalar(0.4 + 0.6 * s); const P = p.o.position;
      if (p.state === 'wait') { P.y += Math.sin(time * 2 + p.delay * 20) * dt * 0.25; if (time >= T1 + p.delay) { p.state = 'fall'; p.from = P.clone(); p.t = 0; } }
      else if (p.state === 'fall') { p.t += dt / 1.1; const k = Math.min(1, p.t); P.lerpVectors(p.from, p.to, k * k * (3 - 2 * k)); if (k >= 1) p.state = 'free'; }
      else if (p.state === 'free') { p.v.x += rnd(-1, 1) * dt * 2.2; p.v.y += rnd(-1, 1) * dt * 1.6; p.v.z += rnd(-1, 1) * dt * 2.2; p.v.multiplyScalar(1 - dt * 0.9); P.addScaledVector(p.v, dt);
        const lim = R - 0.75 - p.r * 0.3, q = Math.hypot(P.x, P.z); if (q > lim) { P.x *= lim / q; P.z *= lim / q; p.v.x *= -0.5; p.v.z *= -0.5; } if (P.y > LV - 0.6) { P.y = LV - 0.6; p.v.y = -Math.abs(p.v.y); } if (P.y < 0) { const d = P.length(); if (d > lim) { P.multiplyScalar(lim / d); p.v.y = Math.abs(p.v.y); } } }
      else if (p.state === 'sink') { const to = slotPos(p.slot || 0); P.x += (to.x - P.x) * dt * 0.9; P.z += (to.z - P.z) * dt * 0.9; P.y -= dt * 1.5; if (P.y <= to.y) { P.y = to.y; p.state = 'rest'; } }
      else if (p.state === 'rise') { P.y += dt * 2.3; P.x += Math.sin(time * 4 + p.born * 7) * dt * 0.5; if (P.y > TOP + 4.5) { p.state = 'gone'; world.remove(p.o); } } }
    parts = parts.filter((p) => p.state !== 'gone'); }
  function size() { const r = stage.getBoundingClientRect(); if (r.width < 20 || r.height < 20) return false; const d = Math.min(window.devicePixelRatio || 1, 2), w = Math.round(r.width * d), h = Math.round(r.height * d); if (cv.width !== w || cv.height !== h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = camera.aspect < 0.9 ? 40 : 30; camera.updateProjectionMatrix(); } return true; }
  const render = () => { if (!size()) return; controls.update(); renderer.render(scene, camera); };
  let prev = 0; const loop = (now) => { const dt = Math.min(0.1, (now - prev) / 1000 || 0); prev = now; sim(dt); render(); requestAnimationFrame(loop); }; requestAnimationFrame(loop);
  const run = (sec) => { for (let t = 0; t < sec; t += 1 / 30) sim(1 / 30); render(); };
  return { set(model, captions = []) { const key = model ? model.key : ''; caps = captions; stage.dataset.empty = model ? '' : '1'; if ((M ? M.key : '') === key) { if (onPhase && phase) onPhase(phase, caps[phase - 1] || ''); return; } M = model; meets.length = 0; reset(); },
    replay() { meets.length = 0; reset(); }, goto(k) { meets.length = 0; reset(); if (k > 1) run(k === 2 ? T1 + 0.05 : T2 + 2.5); }, run,
    shot: async (name) => { render(); const res = await fetch('/__shot?name=' + name, { method: 'POST', body: await (await fetch(cv.toDataURL('image/jpeg', 0.93))).blob() }); return `${name}: ${res.status}`; } };
}
