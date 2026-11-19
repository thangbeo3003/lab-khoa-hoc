// Sân khấu 3D dùng chung: bộ vẽ, máy quay tự lia, nhãn dụng cụ, chạm chọn vật.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';
import { PAL, QUALITY } from './materials.js';
import { addLights } from './room.js';

export function createStage(host) {
  const mobile = matchMedia('(max-width: 899px)').matches || navigator.maxTouchPoints > 1;
  QUALITY.mobile = mobile;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  const FILM = /[?&]film=1/.test(location.search); // chế độ quay phim: không tự chạy, vẽ dày gấp ba để phóng to vẫn nét
  renderer.setPixelRatio(FILM ? 3 : Math.min(window.devicePixelRatio || 1, 2)); // vẽ đủ điểm ảnh của màn hình
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
  let preset = null, goal = null, userMoved = false;
  const tmp = new THREE.Vector3();
  function solve(p) {
    const aspect = camera.aspect, t = Math.tan(THREE.MathUtils.degToRad(VFOV / 2));
    const dist = Math.max((p.h / 2) / t, (p.w / 2) / (t * aspect)) * 1.04;
    const az = THREE.MathUtils.degToRad(p.az || 0), el = THREE.MathUtils.degToRad(p.el ?? 16);
    const target = new THREE.Vector3(...p.target);
    const pos = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(dist).add(target);
    return { pos, target, dist };
  }
  function focus(p, immediate = false) {
    preset = p; userMoved = false;
    const s = solve(p);
    controls.minDistance = s.dist * 0.4; controls.maxDistance = Math.min(Math.max(s.dist * 1.6, 12), 16.5); // không lùi xuyên tường, tủ
    if (immediate) { camera.position.copy(s.pos); controls.target.copy(s.target); goal = null; controls.update(); } else goal = s;
  }
  controls.addEventListener('start', () => { goal = null; userMoved = true; });

  // ----- Nhãn dụng cụ (HTML nổi trên cảnh) -----
  const tagLayer = document.createElement('div'); tagLayer.className = 'lk-tags'; host.appendChild(tagLayer);
  const tags = new Map();
  function addTag(id, text, anchor, { color = '#1f6feb', onClick } = {}) {
    const el = document.createElement('button');
    el.className = 'lk-tag'; el.type = 'button'; el.dataset.tag = id;
    el.innerHTML = `<i style="background:${color}"></i><span></span>`;
    el.querySelector('span').textContent = text;
    if (onClick) el.addEventListener('click', () => onClick(id));
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
      const on = tmp.z < 1 && x > 8 && x < w - 8 && y > 8 && y < h - 4;
      t.el.style.display = on ? '' : 'none';
      if (on) list.push({ t, x, y });
    });
    // Nhãn không được chồng lên nhau: nhãn nào đụng nhãn đã đặt thì đẩy lên trên.
    list.sort((a, b) => b.y - a.y).forEach((o) => {
      const bw = o.t.el.offsetWidth || 90, bh = (o.t.el.offsetHeight || 24) + 4;
      const cx = Math.min(Math.max(o.x, bw / 2 + 4), w - bw / 2 - 4);
      let top = o.y - bh - 4;
      for (let i = 0; i < 6; i++) {
        const hit = placed.find((p) => Math.abs(p.cx - cx) < (p.bw + bw) / 2 + 4 && Math.abs(p.top - top) < bh);
        if (!hit) break;
        top = hit.top - bh;
      }
      top = Math.max(2, top);
      placed.push({ cx, top, bw });
      o.t.el.style.transform = `translate(${Math.round(cx - bw / 2)}px, ${Math.round(top)}px)`;
    });
  }

  // ----- Chạm chọn vật -----
  const pickables = []; let onPick = null;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
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
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    if (preset && !userMoved) focus(preset, true);
    if (FILM) { controls.update(); renderer.render(scene, camera); layoutTags(); } // đổi cỡ xoá khung vẽ: chế độ quay phim không có vòng tự vẽ nên vẽ lại ngay
  }
  new ResizeObserver(resize).observe(host);
  function advance(dt) {
    if (goal) {
      const k = 1 - Math.exp(-dt * 4.5);
      camera.position.lerp(goal.pos, k); controls.target.lerp(goal.target, k);
      if (camera.position.distanceTo(goal.pos) < 0.01) goal = null;
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
    setEnvironment, THREE, scene, camera, renderer, controls, mobile, focus, addTag, setTag, pickable, unpickable,
    onFrame: (f) => frames.push(f), onAfterRender: (f) => after.push(f), setHoverHandler: (f) => { onHover = f; }, hovered: () => hoverId, setPickHandler: (f) => { onPick = f; },
    advance, // tiến một khoảng thời gian cho trước: dùng để kiểm thử và quay video
    renderOnce: () => advance(0),
  };
}
