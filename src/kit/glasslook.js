// KIỂU THUỶ TINH của phòng thí nghiệm bản 3. Giáo án khai decl.glass; lesson.js bản 3 mặc định 'e' (chủ 20/11 chốt "Kiểu E"), đổi bằng &kinh=a|b|c|d.
//   (không khai) = kính 3D cũ của kit/materials.js
//   b = ánh sáng viền kiểu chụp sản phẩm: phản chiếu phòng tối có dải đèn dọc, vệt sáng đặc lại, nét sẫm sát mép
//   c = khúc xạ thật (transmission): nhìn xuyên qua thành kính thấy nền bị bẻ cong
//   d = b + c
//   e = chai, lọ, bình, ống đong, ống nghiệm dùng ẢNH dụng cụ của trang Thực hành (assets/flat của Luồng 2, chỉ ĐỌC): mỗi món một tấm ảnh
//       luôn quay mặt về máy quay; dung dịch, nắp, nhãn, vạch chia vẫn là 3D. Đèn cồn và bình tia thay CẢ MÓN bằng ảnh (giữ ngọn lửa, nắp chụp, nhãn).
//       Món chưa có ảnh (xi-lanh khí, mặt kính đồng hồ) giữ kính 3D.
import * as THREE from 'three';
import { PHOTO_SORT } from './labware_l1.js'; // tấm ảnh của tủ đồ L1 khai sort (lọ ống hút, giá gỗ, chậu, cốc thải): xếp thứ tự vẽ chung với ảnh dụng cụ

const isGlass = (m) => !!m && m.isMeshPhysicalMaterial && m.envMapIntensity === 2.4 && m.depthWrite === false;
const isRim = (m) => !!m && m.isMeshPhysicalMaterial && m.envMapIntensity === 2.2 && m.transparent;

// Phòng chụp tối: hai cặp dải đèn dọc hai bên + một hộp đèn trên đầu. Thuỷ tinh soi lại thành các vệt sáng chạy dọc thân.
function studioEnv(renderer) {
  const sc = new THREE.Scene(); sc.background = new THREE.Color(0x15181c);
  const card = (w, h, az, y, d, k, c = 0xffffff) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide }));
    const a = THREE.MathUtils.degToRad(az); m.position.set(Math.sin(a) * d, y, Math.cos(a) * d); m.lookAt(0, y, 0); sc.add(m);
  };
  card(1.5, 9, 62, 1, 8, 7); card(1.5, 9, -62, 1, 8, 7);     // hai dải chính phía trước, lệch hai bên
  card(0.7, 9, 28, 1, 8, 2.2); card(0.7, 9, -28, 1, 8, 2.2); // hai dải phụ mảnh
  card(2.2, 9, 128, 1, 8, 3.5); card(2.2, 9, -128, 1, 8, 3.5); // hai dải sau lưng: sáng mép xa
  const top = new THREE.Mesh(new THREE.PlaneGeometry(9, 5), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffffff).multiplyScalar(2.6), side: THREE.DoubleSide }));
  top.position.set(0, 7, 1); top.rotation.x = Math.PI / 2; sc.add(top);
  const pm = new THREE.PMREMGenerator(renderer), tex = pm.fromScene(sc, 0.012).texture; pm.dispose();
  return tex;
}

// Kính b: vệt phản chiếu sáng thì đặc lại (không bị độ trong của thân nuốt mất), sát mép có một nét sẫm, giữa thân vẫn trong.
function rimLook(m, env) {
  m.envMap = env; m.envMapIntensity = 1.25; m.userData.lkGlass = 1;
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `
      float lkE = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 1.35);
      float lkL = dot(outgoingLight, vec3(0.2126, 0.7152, 0.0722));
      float lkLine = smoothstep(0.58, 0.92, lkE);
      float lkA = diffuseColor.a * mix(0.10, 2.6, lkE);
      outgoingLight = mix(outgoingLight, vec3(0.04, 0.07, 0.09), lkLine * 0.8);
      diffuseColor.a = clamp(max(max(lkA, lkLine * 0.8), smoothstep(0.45, 2.0, lkL) * 0.94), 0.0, 0.96);
      #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => 'lkglassB'; m.needsUpdate = true;
}

function refractMat(color, soft) {
  const m = new THREE.MeshPhysicalMaterial({
    color, roughness: 0.03, metalness: 0, transmission: 1, thickness: 0.28, ior: 1.5, transparent: false, depthWrite: false,
    clearcoat: soft ? 0 : 1, specularIntensity: soft ? 0.25 : 1, envMapIntensity: soft ? 0.35 : 1.6, side: THREE.FrontSide,
  });
  m.userData.lkGlass = 1;
  return m;
}

// ---------- e: ảnh dụng cụ của trang Thực hành ----------
const FLAT = './assets/flat/';
const KIND_IMG = { flask: 'erlenmeyer', tube: 'tube', bottle: 'bottle', jar: 'jar', dropper: 'dropbottle', cylinder: 'cylinder' };
const VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
// Ảnh nền xám 50% hoà kiểu hard-light như trang Thực hành: nửa tối nhân vào nền, nửa sáng cộng kiểu screen. WebGL không có hard-light nên vẽ hai lượt.
const FRAG = 'uniform sampler2D map; uniform float pass; uniform float k; varying vec2 vUv; void main() { vec3 s = texture2D(map, vUv).rgb; gl_FragColor = pass < 0.5 ? vec4(mix(vec3(1.0), min(2.0 * s, 1.0), k), 1.0) : vec4(max(2.0 * s - 1.0, 0.0) * k, 1.0); }';
function flatPair(tex, w, h) {
  const g = new THREE.Group(), geo = new THREE.PlaneGeometry(w, h);
  [0, 1].forEach((pass) => {
    const m = new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, pass: { value: pass }, k: { value: 1 } }, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: pass ? THREE.OneMinusDstColorFactor : THREE.DstColorFactor, blendDst: pass ? THREE.OneFactor : THREE.ZeroFactor,
      blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    });
    const mesh = new THREE.Mesh(geo, m); mesh.renderOrder = 7 + pass; mesh.onBeforeRender = () => { m.uniforms.k.value = m.opacity; }; // m.opacity do phần làm mờ bàn của labset điều khiển
    g.add(mesh);
  });
  return g;
}

// Ảnh có nền trong suốt (đồ nhựa): một tấm phẳng vẽ đúng màu ảnh, không qua bộ chỉnh tông của cảnh
function alphaPlane(w, h) {
  const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); mesh.renderOrder = 7; g.add(mesh);
  return g;
}

export function applyGlassLook(mode, { stage, list }) {
  const { renderer, camera } = stage;
  const meshes = [];
  list.forEach((B) => B.g.traverse((o) => { if (o.isMesh && isGlass(o.material)) meshes.push(o); }));

  if (mode === 'b' || mode === 'd') {
    const env = studioEnv(renderer);
    if (mode === 'd') meshes.filter((o) => o.material.side === THREE.FrontSide).forEach((o) => {
      const t = new THREE.Mesh(o.geometry, refractMat(o.material.color.clone().lerp(new THREE.Color(0xffffff), 0.6), true));
      t.position.copy(o.position); t.quaternion.copy(o.quaternion); t.scale.copy(o.scale); t.userData.lkNoPick = true; o.parent.add(t);
    });
    meshes.forEach((o) => rimLook(o.material, env));
  } else if (mode === 'c') {
    meshes.forEach((o) => {
      if (o.material.side === THREE.BackSide) { o.material.colorWrite = false; return; }
      const old = o.material; o.material = refractMat(old.color.clone().lerp(new THREE.Color(0xffffff), 0.6), false); old.dispose();
    });
  } else if (mode === 'e') {
    fetch(FLAT + 'meta.json').then((r) => r.json()).then((META) => {
      const loader = new THREE.TextureLoader(), cache = {}, boards = [];
      // Ảnh tải xong mới ẩn kính 3D và hiện tấm ảnh: tải hỏng thì món đó giữ nguyên kính 3D cũ
      const texOf = (key, ready, { srgb = false, flip = false } = {}) => {
        const c = cache[key] || (cache[key] = { waits: [], ok: false, tex: null });
        if (!c.tex) {
          c.tex = loader.load(FLAT + META[key].file, (t) => { t.anisotropy = renderer.capabilities.getMaxAnisotropy(); t.needsUpdate = true; c.ok = true; c.waits.splice(0).forEach((f) => f()); });
          if (srgb) c.tex.colorSpace = THREE.SRGBColorSpace;
          if (flip) { c.tex.wrapS = THREE.RepeatWrapping; c.tex.repeat.x = -1; c.tex.offset.x = 1; } // lật ngang: vòi của ảnh quay sang trái, vòi của món 3D quay sang phải
        }
        if (c.ok) ready(); else c.waits.push(ready);
        return c.tex;
      };
      const fadeOf = (B, m) => B.fade && B.fade.mats.find((e) => e.m === m);
      const P = new THREE.Vector3(), INV = new THREE.Matrix4(), BOX = new THREE.Box3(), TB = new THREE.Box3(), REL = new THREE.Matrix4();
      // MÓN THAY CẢ BẰNG ẢNH (ảnh đã vẽ đủ thân, chất lỏng, nắp, bấc): đèn cồn và bình tia. Phần 3D chỉ giữ lại thứ có chuyển động hoặc có chữ.
      const WHOLE = {
        // đèn cồn: ảnh cao tới ngọn bấc (1,06 như bản 3D, để ngọn lửa và nắp chụp đặt đúng chỗ cũ); giữ ngọn lửa và nắp chụp thuỷ tinh
        lamp: { key: 'lamp', H: 1.06, R: 0.45, keep: (obj) => [obj.userData.flame, obj.userData.cap],
          after: (obj, M, k, B, rec) => obj.userData.cap.traverse((o) => { if (o.isMesh) rec.tops.push(o); }) }, // nắp chụp vẽ sau tấm ảnh: nó nằm ngoài bấc
        // bình tia: ảnh nhựa có nền trong suốt, lật ngang cho vòi quay về phía chậu; giữ nhãn "Nước cất"; đầu vòi (userData.tip) dời theo ảnh để tia nước ra đúng đầu vòi
        wash: { key: 'washbottle', H: 1.64, R: 0.28, alpha: true, flip: true,
          keep: (obj) => [obj.children.find((c) => c.isMesh && c.material.map && c.renderOrder === 6)],
          after: (obj, M, k, B, rec) => {
            obj.userData.tip.set((M.cx - M.tip[0]) * k, (M.bottom - M.tip[1]) * k, 0);
            const label = obj.children.find((c) => c.isMesh && c.material.map && c.renderOrder === 6);
            if (label) { const q = (240.5 * k) / 0.303; label.scale.set(q, 1, q); label.material.transparent = true; rec.tops.push(label); label.material.needsUpdate = true; const e = fadeOf(B, label.material); if (e) e.tr = true; } // 240,5 px = nửa bề ngang thân bình trong ảnh
          } },
      };
      list.forEach((B) => Object.values(B.items).forEach((it) => {
        const spec = WHOLE[it.kind], M = spec && META[spec.key]; if (!M) return;
        const obj = it.obj, k = spec.H / (M.bottom - M.top);
        const pair = spec.alpha ? alphaPlane(M.w * k, M.h * k) : flatPair(null, M.w * k, M.h * k); pair.rotation.order = 'YXZ'; pair.visible = false;
        pair.children.forEach((m) => m.position.set((spec.flip ? M.cx - M.w / 2 : M.w / 2 - M.cx) * k, (M.bottom - M.h / 2) * k, spec.R));
        const rec = { obj, pair, y0: 0, tops: [] }; obj.add(pair); boards.push(rec);
        pair.children.forEach((m) => { if (B.fade && !fadeOf(B, m.material)) B.fade.mats.push({ m: m.material, o: 1, tr: true }); });
        const tex = texOf(spec.key, () => {
          const keep = new Set([obj.children[0], pair, ...spec.keep(obj)]); // children[0] = bóng đổ dưới chân món
          obj.children.forEach((c) => { if (!keep.has(c)) c.visible = false; }); pair.visible = true; if (spec.after) spec.after(obj, M, k, B, rec);
        }, { srgb: !!spec.alpha, flip: !!spec.flip });
        pair.children.forEach((m) => { if (m.material.uniforms) m.material.uniforms.map.value = tex; else { m.material.map = tex; m.material.needsUpdate = true; } });
      }));
      list.forEach((B) => Object.values(B.items).forEach((it) => {
        let key = KIND_IMG[it.kind]; if (!key) return;
        const obj = it.obj, U = obj.userData, gl = []; obj.updateWorldMatrix(true, true);
        obj.traverse((o) => { if (o.isMesh && (isGlass(o.material) || isRim(o.material))) gl.push(o); });
        if (!gl.length) return;
        const c = gl[0].material.color; if (c.r > c.b * 2.5 && META[key + '_amber']) key += '_amber'; // thuỷ tinh nâu (màu lưu ở hệ tuyến tính nên so theo tỉ lệ đỏ / lam)
        const M = META[key]; if (!M) return;
        INV.copy(obj.matrixWorld).invert(); BOX.makeEmpty();
        gl.forEach((o) => { o.geometry.computeBoundingBox(); REL.multiplyMatrices(INV, o.matrixWorld); BOX.union(TB.copy(o.geometry.boundingBox).applyMatrix4(REL)); });
        const y0 = BOX.min.y, H = BOX.max.y - y0, R = Math.max(BOX.max.x, -BOX.min.x, BOX.max.z, -BOX.min.z);
        const sy = H / (M.bottom - M.top); let sx = (2 * R) / M.body;
        if (it.kind === 'cylinder' && M.prof) { // ống đong: khớp theo THÂN ống (ảnh có đế riêng, rộng hơn thân), không theo đế
          let rt = 0; gl.forEach((o) => { if (o.geometry.type !== 'LatheGeometry') return; const a = o.geometry.attributes.position; for (let i = 0; i < a.count; i++) { const y = a.getY(i); if (y > y0 + 0.03 * H && y < y0 + 0.9 * H) rt = Math.max(rt, Math.hypot(a.getX(i), a.getZ(i))); } });
          const mid = M.prof[Math.floor(M.prof.length / 2)]; if (rt > 0) sx = (2 * rt) / (mid[2] - mid[1]);
        }
        // Tấm ảnh đứng trên đáy món, áp vào mặt trước (phủ lên dung dịch bên trong); trục xoay đặt ở đáy để ngả theo góc nhìn
        const pair = flatPair(null, M.w * sx, M.h * sy); pair.position.y = y0; pair.rotation.order = 'YXZ'; pair.visible = false;
        pair.children.forEach((m) => m.position.set((M.w / 2 - M.cx) * sx, (M.bottom - M.h / 2) * sy, R * 0.96));
        const rec = { obj, pair, y0, tops: [] }; obj.add(pair); boards.push(rec);
        pair.children.forEach((m) => { if (B.fade && !fadeOf(B, m.material)) B.fade.mats.push({ m: m.material, o: 1, tr: true }); });
        const tex = texOf(key, () => {
          gl.forEach((o) => { o.material.colorWrite = false; }); pair.visible = true;
          // Nắp và nhãn nằm NGOÀI thuỷ tinh: vẽ sau tấm ảnh để không bị nét kính đè lên
          [U.cap, U.label].forEach((top) => { if (top && top.traverse) top.traverse((o) => { if (!o.isMesh || isGlass(o.material) || o.material.transparent) return; o.material.transparent = true; rec.tops.push(o); o.material.needsUpdate = true; const e = fadeOf(B, o.material); if (e) e.tr = true; }); });
        });
        pair.children.forEach((m) => { m.material.uniforms.map.value = tex; });
        // Dung dịch trong bình phản ứng: dựng lại theo đúng biên dạng trong của ảnh, cao tới đâu ôm thành tới đó (không co giãn khối cũ nữa)
        const v = B.vessel[it.id];
        if (v && it.kind === 'flask' && M.prof) {
          const prof = M.prof, wall = M.wall || 0, yF = y0 + (M.floor || 0) * sy + 0.004;
          const rIn = (y) => { // bán kính lòng bình ở độ cao y (toạ độ của món)
            const py = M.bottom - (y - y0) / sy; let a = 0, b = prof.length - 1; if (py <= prof[0][0]) b = 0; else if (py >= prof[b][0]) a = b; else { while (b - a > 1) { const m = (a + b) >> 1; if (prof[m][0] <= py) a = m; else b = m; } }
            const q = a === b ? 0 : (py - prof[a][0]) / (prof[b][0] - prof[a][0]), w = (prof[a][2] - prof[a][1]) * (1 - q) + (prof[b][2] - prof[b][1]) * q;
            return Math.max(0.01, (w / 2 - wall) * sx);
          };
          const build = (k) => {
            const yT = Math.max(yF + 0.006, v.level * k), n = 10, pts = [new THREE.Vector2(0, yF), new THREE.Vector2(Math.max(0.01, rIn(yF + 0.02) - 0.03), yF)];
            for (let i = 0; i <= n; i++) { const y = yF + 0.02 + (yT - yF - 0.02) * (i / n); if (y > yF) pts.push(new THREE.Vector2(rIn(y), Math.min(y, yT))); }
            pts.push(new THREE.Vector2(0, yT));
            v.liquid.geometry.dispose(); v.liquid.geometry = new THREE.LatheGeometry(pts, 48); v.liquid.scale.y = 1;
          };
          let shown = -1;
          v.setFill = (k) => { v.fill = k; v.liquid.visible = k > 0.01; const q = Math.round(Math.max(k, 0.01) * 400); if (q !== shown) { shown = q; build(q / 400); } };
          v.setFill(v.fill);
        }
      }));
      // Tấm ảnh xoay quanh trục đứng của món để luôn quay mặt về máy quay (món nghiêng khi rót thì tấm ảnh nghiêng theo);
      // nhìn từ trên cao thì tấm ảnh ngả ra sau một phần để không bị dẹt lại.
      // THỨ TỰ VẼ theo khoảng cách (chủ 21/11: nhãn "Nước cất" của bình phía sau hiện đè lên lọ MnO₂ phía trước): tấm ảnh không ghi độ sâu, nên mỗi khung hình
      // xếp các món từ xa tới gần rồi vẽ đúng thứ tự đó: ảnh của món → nắp, nhãn của chính nó → mới tới món gần hơn. Đồ phía sau chỉ còn thấy mờ QUA lớp kính.
      const order = [];
      stage.onFrame(() => {
        boards.forEach((r) => {
          r.obj.worldToLocal(P.copy(camera.position)); r.d = P.length(); r.pair.rotation.y = Math.atan2(P.x, P.z);
          const el = Math.atan2(P.y - r.y0, Math.hypot(P.x, P.z)); r.pair.rotation.x = -Math.max(0, Math.min(0.75, (el - 0.24) * 0.8));
        });
        PHOTO_SORT.forEach((r) => { r.obj.worldToLocal(P.copy(camera.position)); r.d = P.length() + (r.bias || 0); });
        if (order.length !== boards.length + PHOTO_SORT.length) { order.length = 0; order.push(...boards, ...PHOTO_SORT); }
        order.sort((a, b) => b.d - a.d);
        order.forEach((r, n) => { const base = 20 + n * 3; r.pair.children.forEach((m, i) => { m.renderOrder = base + i; }); r.tops.forEach((o) => { o.renderOrder = base + 2; }); });
      });
      window.__glassReady = true;
    });
  }
}
