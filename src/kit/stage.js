// Sân khấu 3D dùng chung: bộ vẽ, máy quay tự lia, nhãn dụng cụ, chạm chọn vật.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';
import { PAL, QUALITY } from './materials.js';
import { addLights } from './room.js';

// leader = true: nhãn đứng cao hơn điểm neo và có đường dẫn + chấm neo chỉ vào vật (mặc định tắt, giữ nguyên cách cũ).
// oversample > 1: vẽ dày hơn số điểm ảnh thật của màn hình chừng đó lần rồi thu lại (viền thuỷ tinh mảnh bớt răng cưa, bớt lấp lánh; có tác dụng trên màn hình thường
// và khi trình duyệt đang thu nhỏ trang). Vẫn bị chặn ở 2 lần điểm ảnh CSS như cũ. Mặc định 1 = như cũ. Không áp cho điện thoại.
// smooth (27/11, đối chiếu Lab-SML): máy quay lia tới khung mới theo kiểu rời chậm, đi nhanh ở giữa, hãm trước đích, thời lượng cố định (p.dur, mặc định 0,7 giây).
// maxRatio: chặn trên của tỉ lệ điểm ảnh vẽ. Cả hai mặc định như cũ, nên bản 1 và bản 2 không đổi; bộ máy bài học (kit/labset.js) mới bật.
export function createStage(host, { leader = false, oversample = 1, smooth = false, maxRatio = 2 } = {}) {
  const mobile = matchMedia('(max-width: 899px)').matches || navigator.maxTouchPoints > 1;
  QUALITY.mobile = mobile;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  const FILM = /[?&]film=1/.test(location.search); // chế độ quay phim: không tự chạy, vẽ dày gấp ba để phóng to vẫn nét
  const ratio = () => (FILM ? 3 : Math.min((window.devicePixelRatio || 1) * (window.__uiZoom || 1) * (mobile ? 1 : oversample), maxRatio)); // vẽ đủ điểm ảnh của màn hình, kể cả khi trang được phóng bằng CSS zoom
  renderer.setPixelRatio(ratio());
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3;
  renderer.domElement.className = 'lk-canvas';
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PAL.wall);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  addLights(scene, mobile);
  // Dùng một ảnh toàn cảnh 360 làm nguồn phản chiếu cho kính và kim loại.
  function setEnvironment(url) {
    new THREE.TextureLoader().load(url, (t) => { t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; scene.environment = pmrem.fromEquirectangular(t).texture; t.dispose(); });
  }

  const VFOV = 40;
  const camera = new THREE.PerspectiveCamera(VFOV, 1, 0.1, 120);
  const controls = new OrbitControls(camera, renderer.domElement);
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, enablePan: false, minPolarAngle: 0.35, maxPolarAngle: 1.5, rotateSpeed: 0.6, zoomSpeed: 0.7 }); // xoay đủ 360 độ quanh bàn

  // ----- Máy quay tự lia tới khung cần nhìn -----
  let preset = null, goal = null, userMoved = false, tween = null;
  const tmp = new THREE.Vector3();
  // Vùng an toàn: phần khung KHÔNG bị bảng nổi che (tỉ lệ 0..1 tính từ mỗi mép). Mặc định 0 = cả khung, giữ nguyên cách cũ.
  // Khi có vùng an toàn, khung cần nhìn được canh vừa và nằm giữa vùng đó (dời tâm chiếu, không đổi vị trí vật).
  const ins = { l: 0, t: 0, r: 0, b: 0 };
  let cy = 0.5; // điểm nhìn nằm ở đâu theo chiều dọc của vùng an toàn (0 = đỉnh, 1 = đáy); khung nhìn đặt bằng p.cy
  function applyInsets() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    const ox = ((ins.r - ins.l) / 2) * w, oy = (0.5 - ins.t - (1 - ins.t - ins.b) * cy) * h;
    if (Math.abs(ox) > 0.5 || Math.abs(oy) > 0.5) camera.setViewOffset(w, h, ox, oy, w, h); else if (camera.view && camera.view.enabled) camera.clearViewOffset();
  }
  function setInsets(v = {}) {
    const n = { l: v.l || 0, t: v.t || 0, r: v.r || 0, b: v.b || 0 };
    if (['l', 't', 'r', 'b'].every((k) => Math.abs(n[k] - ins[k]) < 0.004)) return;
    Object.assign(ins, n); applyInsets();
    if (preset && !userMoved) focus(preset, !goal); // đang lia thì lia tiếp tới đích mới, đang đứng yên thì canh lại ngay
  }
  function solve(p) {
    const fov = p.fov || VFOV; // khung nhìn có thể tự đặt góc mở ống kính (hẹp hơn = áp sát, ít méo)
    const aspect = camera.aspect, t = Math.tan(THREE.MathUtils.degToRad(fov / 2));
    const fw = Math.max(0.2, 1 - ins.l - ins.r), fh = Math.max(0.2, 1 - ins.t - ins.b);
    const dist = Math.max((p.h / 2) / (t * fh), (p.w / 2) / (t * aspect * fw)) * 1.04;
    const az = THREE.MathUtils.degToRad(p.az || 0), el = THREE.MathUtils.degToRad(p.el ?? 16);
    const target = new THREE.Vector3(...p.target);
    const pos = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(dist).add(target);
    return { pos, target, dist, fov, cy: p.cy ?? 0.5 };
  }
  // Giới hạn xoay tay quanh khung chuẩn (p.swing = số độ được xoay sang mỗi bên; p.elMin / p.elMax = góc ngẩng thấp nhất, cao nhất).
  // Khung không khai swing thì giữ cách cũ: xoay đủ 360 độ. Đang lia thì thả giới hạn, tới nơi mới siết để máy quay không bị giật.
  const D2R = THREE.MathUtils.degToRad;
  let kept = null; // giới hạn có sẵn trước khi khung chuẩn siết (bài khác có thể tự đặt giới hạn riêng: không đụng tới)
  const LIM = ['minAzimuthAngle', 'maxAzimuthAngle', 'minPolarAngle', 'maxPolarAngle'];
  function limit(p, on) {
    if (!on || !p || p.swing == null) { if (kept) { LIM.forEach((k) => { controls[k] = kept[k]; }); kept = null; } return; }
    if (!kept) { kept = {}; LIM.forEach((k) => { kept[k] = controls[k]; }); }
    const az = D2R(p.az || 0);
    controls.minAzimuthAngle = az - D2R(p.swing); controls.maxAzimuthAngle = az + D2R(p.swing);
    controls.minPolarAngle = D2R(90 - (p.elMax ?? 48)); controls.maxPolarAngle = D2R(90 - (p.elMin ?? 4));
  }
  let presetDist = 1, onMove = null;
  const setMoved = (v) => { if (userMoved !== v) { userMoved = v; if (onMove) onMove(v); } };
  function focus(p, immediate = false) {
    preset = p; setMoved(false);
    const s = solve(p); presetDist = s.dist;
    controls.minDistance = s.dist * 0.4; controls.maxDistance = Math.min(Math.max(s.dist * 1.6, 12), p.maxDist || 16.5); // không lùi xuyên tường, tủ (khung nhìn có thể tự nới bằng maxDist khi phòng trống)
    limit(p, false);
    if (immediate) { camera.position.copy(s.pos); controls.target.copy(s.target); camera.fov = s.fov; cy = s.cy; applyInsets(); camera.updateProjectionMatrix(); goal = null; tween = null; limit(p, true); controls.update(); }
    else { goal = s; tween = smooth ? { p: camera.position.clone(), t: controls.target.clone(), f: camera.fov, c: cy, u: 0, dur: p.dur || 0.7 } : null; }
  }
  controls.addEventListener('start', () => { if (goal) { goal = null; tween = null; limit(preset, true); } setMoved(true); });

  // ----- Nhãn dụng cụ (HTML nổi trên cảnh) -----
  const tagLayer = document.createElement('div'); tagLayer.className = 'lk-tags'; host.appendChild(tagLayer);
  const tags = new Map();
  function addTag(id, text, anchor, { color = '#1f6feb', onClick } = {}) {
    const el = document.createElement('button');
    el.className = 'lk-tag'; el.type = 'button'; el.dataset.tag = id;
    el.innerHTML = `<i style="background:${color}"></i><span></span>`;
    el.querySelector('span').textContent = text;
    if (onClick) el.addEventListener('click', () => onClick(id));
    if (leader) { const ln = document.createElement('em'); ln.className = 'lk-lead'; el.appendChild(ln); el.style.setProperty('--c', color); }
    tagLayer.appendChild(el);
    tags.set(id, { el, anchor, visible: true });
    return el;
  }
  function setTag(id, { text, visible, active, done } = {}) {
    const t = tags.get(id); if (!t) return;
    if (text !== undefined) t.el.querySelector('span').textContent = text;
    if (visible !== undefined) t.visible = visible;
    if (active !== undefined) t.el.classList.toggle('is-active', active);
    if (done !== undefined) t.el.classList.toggle('is-done', done);
  }
  function layoutTags() {
    const w = host.clientWidth, h = host.clientHeight, placed = [];
    const list = [];
    tags.forEach((t) => {
      if (!t.visible) { t.el.style.display = 'none'; return; }
      tmp.copy(t.anchor instanceof THREE.Vector3 ? t.anchor : t.anchor()).project(camera);
      const x = (tmp.x * 0.5 + 0.5) * w, y = (-tmp.y * 0.5 + 0.5) * h;
      const on = tmp.z < 1 && x > ins.l * w + 8 && x < w - ins.r * w - 8 && y > 8 && y < h - 4;
      t.el.style.display = on ? '' : 'none';
      if (on) list.push({ t, x, y });
    });
    // Nhãn không được chồng lên nhau: nhãn nào đụng nhãn đã đặt thì đẩy lên trên.
    list.sort((a, b) => b.y - a.y).forEach((o) => {
      const bw = o.t.el.offsetWidth || 90, bh = (o.t.el.offsetHeight || 24) + 4;
      const cx = Math.min(Math.max(o.x, ins.l * w + bw / 2 + 4), w - ins.r * w - bw / 2 - 4);
      let top = o.y - bh - (leader ? 22 : 4);
      for (let i = 0; i < 6; i++) {
        const hit = placed.find((p) => Math.abs(p.cx - cx) < (p.bw + bw) / 2 + 4 && Math.abs(p.top - top) < bh);
        if (!hit) break;
        top = hit.top - bh;
      }
      top = Math.max(ins.t * h + 2, top); // không chui lên vùng đã dành cho thẻ nổi ở đỉnh khung
      placed.push({ cx, top, bw });
      o.t.el.style.transform = `translate(${Math.round(cx - bw / 2)}px, ${Math.round(top)}px)`;
      if (leader) { o.t.el.style.setProperty('--lead', Math.max(0, Math.round(o.y - (top + bh - 4))) + 'px'); o.t.el.style.setProperty('--dx', Math.round(Math.max(-bw / 2 + 8, Math.min(bw / 2 - 8, o.x - cx))) + 'px'); }
    });
  }

  // ----- Chạm chọn vật -----
  const pickables = []; let onPick = null;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { down = e.button === 0 ? { x: e.clientX, y: e.clientY, t: performance.now() } : null; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!down || !onPick) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t; down = null;
    if (moved > 7 || dt > 500) return;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables, true)[0]; if (!hit) return;
    let o = hit.object; while (o && !o.userData.pickId) o = o.parent;
    if (o) onPick(o.userData.pickId);
  });
  function pickable(obj, id) { obj.userData.pickId = id; pickables.push(obj); }
  function unpickable(obj) { const i = pickables.indexOf(obj); if (i >= 0) pickables.splice(i, 1); }
  // Rê chuột: báo vật đang nằm dưới con trỏ (để sáng viền, đổi con trỏ thành bàn tay).
  let onHover = null, hoverId = null;
  const setHover = (id) => { if (id === hoverId) return; hoverId = id; renderer.domElement.style.cursor = id ? 'pointer' : ''; if (onHover) onHover(id); };
  renderer.domElement.addEventListener('pointermove', (e) => {
    if (!onHover || e.buttons) return;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables, true)[0]; let o = hit && hit.object; while (o && !o.userData.pickId) o = o.parent;
    setHover(o ? o.userData.pickId : null);
  });
  renderer.domElement.addEventListener('pointerleave', () => setHover(null));

  // ----- Vòng lặp -----
  const frames = [], after = []; let last = performance.now(), running = true;
  function resize() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setPixelRatio(ratio()); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); applyInsets();
    if (preset && !userMoved) focus(preset, true);
    if (FILM) { controls.update(); renderer.render(scene, camera); layoutTags(); } // đổi cỡ xoá khung vẽ: chế độ quay phim không có vòng tự vẽ nên vẽ lại ngay
  }
  new ResizeObserver(resize).observe(host);
  function advance(dt) {
    if (goal && tween) { // lia có tăng tốc và hãm: nội suy cả vị trí máy lẫn tâm nhìn theo đường bậc hai
      const g = tween; g.u = Math.min(1, g.u + dt / g.dur); const e = g.u < 0.5 ? 2 * g.u * g.u : 1 - Math.pow(-2 * g.u + 2, 2) / 2;
      camera.position.lerpVectors(g.p, goal.pos, e); controls.target.lerpVectors(g.t, goal.target, e);
      if (Math.abs(g.f - goal.fov) > 0.01) { camera.fov = g.f + (goal.fov - g.f) * e; camera.updateProjectionMatrix(); }
      if (Math.abs(g.c - goal.cy) > 0.001) { cy = g.c + (goal.cy - g.c) * e; applyInsets(); }
      if (g.u >= 1) { camera.fov = goal.fov; cy = goal.cy; applyInsets(); camera.updateProjectionMatrix(); goal = null; tween = null; limit(preset, true); }
    } else if (goal) {
      const k = 1 - Math.exp(-dt * 4.5);
      camera.position.lerp(goal.pos, k); controls.target.lerp(goal.target, k);
      if (Math.abs(camera.fov - goal.fov) > 0.01) { camera.fov += (goal.fov - camera.fov) * k; camera.updateProjectionMatrix(); }
      if (Math.abs(cy - goal.cy) > 0.001) { cy += (goal.cy - cy) * k; applyInsets(); }
      if (camera.position.distanceTo(goal.pos) < 0.01 && Math.abs(camera.fov - goal.fov) < 0.05) { camera.fov = goal.fov; cy = goal.cy; applyInsets(); camera.updateProjectionMatrix(); goal = null; limit(preset, true); }
    }
    controls.update();
    frames.forEach((f) => f(dt));
    renderer.render(scene, camera);
    after.forEach((f) => f(dt)); // vẽ thêm sau khung chính (ví dụ khung cận cảnh)
    layoutTags();
  }
  function tick(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    advance(dt);
    requestAnimationFrame(tick);
  }
  resize(); if (!FILM) requestAnimationFrame(tick);

  return {
    setEnvironment, THREE, scene, camera, renderer, controls, mobile, focus, setInsets, addTag, setTag, pickable, unpickable,
    onFrame: (f) => frames.push(f), onAfterRender: (f) => after.push(f), setHoverHandler: (f) => { onHover = f; }, hovered: () => hoverId, setPickHandler: (f) => { onPick = f; },
    // Biên dịch sẵn shader của mọi vật liệu trong cảnh (kể cả món đang ẩn) để lần đầu một món hiện ra không bị khựng
    precompile: () => { try { const r = renderer.compileAsync ? renderer.compileAsync(scene, camera) : renderer.compile(scene, camera); if (r && r.catch) r.catch(() => {}); } catch (e) { /* không biên dịch trước được thì vẽ như thường */ } },
    resetView: () => { if (preset) focus(preset); }, // lia về khung chuẩn của bước
    setMoveHandler: (f) => { onMove = f; }, // báo khi người dùng tự xoay, phóng (true) và khi máy quay về khung chuẩn (false)
    zoom: () => (goal ? 1 : camera.position.distanceTo(controls.target) / presetDist), // 1 = đúng khung chuẩn, lớn hơn 1 = đã lùi ra xa
    advance, // tiến một khoảng thời gian cho trước: dùng để kiểm thử và quay video
    renderOnce: () => advance(0),
  };
}
