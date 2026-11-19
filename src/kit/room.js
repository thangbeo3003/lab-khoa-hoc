// Phòng thí nghiệm hiện đại, khép kín, nhìn được từ mọi phía (style S2).
// Đơn vị 1 = 10 cm. Mặt bàn ở y = 0, sàn y = -9, trần y = 19. Phòng 5,4 m x 4,4 m.
import * as THREE from 'three';
import { PAL, solidMat, steelMat, canvasTexture, glassMat, FONT } from './materials.js';

const FLOOR = -9, CEIL = 19, X0 = -26, X1 = 28, Z0 = -20, Z1 = 24;
const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
const put = (o, x, y, z) => { o.position.set(x, y, z); return o; };

// ----- Bảng tuần hoàn đủ 118 nguyên tố, vị trí tính theo số hiệu nguyên tử -----
const SY = 'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' ');
export function elementCell(z) { // -> [cột 1..18, hàng], hàng 9 và 10 là họ lanthanide, actinide
  if (z === 1) return [1, 1]; if (z === 2) return [18, 1];
  if (z <= 10) return [z <= 4 ? z - 2 : z + 8, 2];
  if (z <= 18) return [z <= 12 ? z - 10 : z, 3];
  if (z <= 36) return [z - 18, 4]; if (z <= 54) return [z - 36, 5];
  if (z <= 56) return [z - 54, 6]; if (z <= 71) return [z - 54, 9];
  if (z <= 86) return [z - 68, 6];
  if (z <= 88) return [z - 86, 7]; if (z <= 103) return [z - 86, 10];
  return [z - 100, 7];
}
function periodicTexture() {
  return canvasTexture(1800, 1100, (g, W, H) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#16324f'; g.font = `700 44px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText('BẢNG TUẦN HOÀN CÁC NGUYÊN TỐ HOÁ HỌC', 60, 62);
    const cw = 92, ch = 92, x0 = 60, y0 = 120, gap = 4;
    const tint = (c, r) => (r >= 9 ? '#e9e6f2' : c <= 2 || (c === 18 && r === 1) ? '#dfe8f3' : c <= 12 ? '#eceff1' : '#dcefee');
    for (let z = 1; z <= 118; z++) {
      const [c, r] = elementCell(z), x = x0 + (c - 1) * (cw + gap), y = y0 + (r - 1) * (ch + gap) + (r >= 9 ? -60 : 0);
      g.fillStyle = tint(c, r); g.fillRect(x, y, cw, ch);
      g.fillStyle = '#52657a'; g.font = `500 20px ${FONT}`; g.textAlign = 'left'; g.fillText(String(z), x + 7, y + 17);
      g.fillStyle = '#16324f'; g.font = `700 38px ${FONT}`; g.textAlign = 'center'; g.fillText(SY[z - 1], x + cw / 2, y + ch / 2 + 10);
    }
    g.fillStyle = '#7c8b9a'; g.font = `500 22px ${FONT}`; g.textAlign = 'center';
    g.fillText('57–71', x0 + 2 * (cw + gap) + cw / 2, y0 + 5 * (ch + gap) + ch / 2);
    g.fillText('89–103', x0 + 2 * (cw + gap) + cw / 2, y0 + 6 * (ch + gap) + ch / 2);
  });
}

// ----- Bàn đảo: mặt epoxy đen mờ, thân trắng, cánh tủ xám nhạt, tay nắm inox -----
export function makeIsland({ w = 16, d = 7.5, sink = false } = {}) {
  const g = new THREE.Group(), steel = steelMat();
  const top = put(box(w, 0.3, d, solidMat(PAL.benchTop, 0.55)), 0, -0.15, 0); top.receiveShadow = true; top.castShadow = true;
  const body = put(box(w - 0.6, 7.8, d - 0.6, solidMat(PAL.cabinet, 0.6)), 0, -4.2, 0); body.castShadow = true; body.receiveShadow = true;
  const plinth = put(box(w - 1.0, 0.9, d - 1.0, solidMat(PAL.plinth, 0.7)), 0, -8.55, 0);
  g.add(top, body, plinth);
  const n = Math.round((w - 0.6) / 3.85), dw = (w - 0.6) / n;
  [1, -1].forEach((s) => {
    for (let i = 0; i < n; i++) {
      const x = -(w - 0.6) / 2 + dw * (i + 0.5), z = s * ((d - 0.6) / 2 + 0.02);
      g.add(put(box(dw - 0.12, 7.4, 0.04, solidMat(PAL.cabinetFront, 0.5)), x, -4.2, z));
      g.add(put(box(0.06, 1.4, 0.06, steel), x + (i % 2 ? -1 : 1) * (dw / 2 - 0.35), -1.6, z + s * 0.06));
    }
  });
  if (sink) {
    // Chậu rửa inox + vòi cổ ngỗng, miệng vòi nằm ngay trên lòng chậu. sink: 'left' | 'right' | true
    const sx = (sink === 'left' ? -1 : 1) * (w / 2 - 2.0), tz = -1.55;
    g.add(put(box(3.4, 0.05, 2.6, steel), sx, 0.01, 0));
    g.add(put(box(2.9, 0.04, 2.1, solidMat(0x6f777f, 0.35, { metalness: 0.8 })), sx, 0.03, 0));
    const curve = new THREE.CatmullRomCurve3([[0, 0, 0], [0, 2.5, 0], [0, 3.0, 0.3], [0, 3.0, 1.0], [0, 2.65, 1.35]].map((q) => new THREE.Vector3(...q)));
    const tap = new THREE.Mesh(new THREE.TubeGeometry(curve, 36, 0.09, 14), steel); tap.castShadow = true;
    const lever = put(box(0.5, 0.08, 0.12, steel), 0.3, 1.0, 0);
    const tapG = new THREE.Group(); tapG.add(tap, lever); g.add(put(tapG, sx, 0, tz));
    g.userData.sink = { x: sx, z: 0, spout: new THREE.Vector3(sx, 2.6, tz + 1.35) };
  }
  return g;
}
function makeStool() {
  const g = new THREE.Group(), steel = steelMat();
  const seat = put(new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.35, 32), solidMat(PAL.accent, 0.6)), 0, -3.0, 0); seat.castShadow = true;
  const post = put(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 5.4, 12), steel), 0, -5.9, 0);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.07, 8, 32), steel); ring.rotation.x = Math.PI / 2; ring.position.y = -6.6;
  const foot = put(new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 0.2, 32), solidMat(PAL.metalDark, 0.5)), 0, -8.9, 0);
  g.add(seat, post, ring, foot);
  return g;
}

// photo = đường dẫn thư mục ảnh: 4 tường dán ảnh mặt đứng (wall_back/left/right/front.jpg) thay cho đồ dựng bằng khối.
// kind = 'lab' | 'kitchen' (bếp: không có bảng tuần hoàn, bàn đảo thứ hai, ghế đẩu). hd = dùng ảnh tường 4K.
export function makeRoom({ photo = null, kind = 'lab', hd = false } = {}) {
  const g = new THREE.Group(), steel = steelMat();
  const wallMat = solidMat(PAL.wall, 0.95), white = solidMat(PAL.cabinet, 0.6);
  const cx = (X0 + X1) / 2, cz = (Z0 + Z1) / 2, RW = X1 - X0, RD = Z1 - Z0, RH = CEIL - FLOOR, cy = (CEIL + FLOOR) / 2;

  // Sàn vinyl xám có đường ron mảnh, trần trắng có 6 tấm đèn
  const floorTex = canvasTexture(256, 256, (c) => { c.fillStyle = '#d3d7da'; c.fillRect(0, 0, 256, 256); c.strokeStyle = '#c5cace'; c.lineWidth = 2; c.strokeRect(0, 0, 256, 256); });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(RW / 6, RD / 6);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.55 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(cx, FLOOR, cz); floor.receiveShadow = true; g.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), solidMat(PAL.ceiling, 1)); ceil.rotation.x = Math.PI / 2; ceil.position.set(cx, CEIL, cz); g.add(ceil);
  const ledMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(12, 3), ledMat); p.rotation.x = Math.PI / 2; p.position.set(X0 + 10 + i * 17, CEIL - 0.02, Z0 + 12 + j * 20); g.add(p); }

  // Bốn bức tường
  const loader = new THREE.TextureLoader();
  const photoMat = (key, w) => new THREE.MeshBasicMaterial({ color: 0xf2f2f2, map: loader.load(photo + key + (hd ? '_4k' : '') + '.jpg', (t) => {
    // cắt giữa ảnh cho khớp tỉ lệ bức tường, không kéo méo
    const ia = t.image.width / t.image.height, wa = w / RH;
    if (ia > wa) { t.repeat.x = wa / ia; t.offset.x = (1 - t.repeat.x) / 2; } else { t.repeat.y = ia / wa; t.offset.y = (1 - t.repeat.y) / 2; }
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; t.needsUpdate = true;
  }) });
  const wall = (w, x, z, ry, key) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, RH), photo ? photoMat(key, w) : wallMat); m.position.set(x, cy, z); m.rotation.y = ry; m.receiveShadow = !photo; g.add(m); };
  wall(RW, cx, Z0, 0, 'wall_back'); wall(RW, cx, Z1, Math.PI, 'wall_front'); wall(RD, X0, cz, Math.PI / 2, 'wall_left'); wall(RD, X1, cz, -Math.PI / 2, 'wall_right');
  g.add(put(box(RW, 1, 0.1, solidMat(PAL.cabinetFront, 0.7)), cx, FLOOR + 0.5, Z0 + 0.06), put(box(RW, 1, 0.1, solidMat(PAL.cabinetFront, 0.7)), cx, FLOOR + 0.5, Z1 - 0.06));

  if (!photo) {
  // Tường trái: ba cửa sổ lớn, ánh sáng ban ngày
  // Ngoài cửa sổ: trời sáng phía trên, tán cây mờ phía dưới
  const skyTex = canvasTexture(256, 256, (c) => {
    const gr = c.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#f4f9fd'); gr.addColorStop(0.45, '#e3eef2'); gr.addColorStop(0.62, '#bcd3b4'); gr.addColorStop(1, '#9fbf98');
    c.fillStyle = gr; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 26; i++) { c.fillStyle = `rgba(${120 + (i * 37) % 50},${165 + (i * 53) % 40},${110 + (i * 29) % 40},0.35)`; c.beginPath(); c.arc((i * 71) % 256, 150 + ((i * 47) % 100), 22 + (i * 13) % 26, 0, 6.283); c.fill(); }
  });
  const sky = new THREE.MeshBasicMaterial({ map: skyTex }), frame = solidMat(PAL.metalDark, 0.5);
  for (let i = 0; i < 3; i++) {
    const z = Z0 + 8 + i * 14;
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(11, 12), sky); pane.rotation.y = Math.PI / 2; pane.position.set(X0 + 0.05, 8, z); g.add(pane);
    g.add(put(box(0.2, 12.4, 0.3, frame), X0 + 0.12, 8, z - 5.6), put(box(0.2, 12.4, 0.3, frame), X0 + 0.12, 8, z + 5.6), put(box(0.2, 12.4, 0.16, frame), X0 + 0.12, 8, z));
    g.add(put(box(0.2, 0.3, 11.5, frame), X0 + 0.12, 14.1, z), put(box(0.2, 0.3, 11.5, frame), X0 + 0.12, 1.9, z), put(box(0.5, 0.12, 11.8, white), X0 + 0.3, 1.7, z));
  }

  // Tường sau: dãy tủ thấp mặt đen, tủ hút, kệ kính đựng lọ, bảng tuần hoàn
  const run = put(box(RW - 14, 8.7, 5, white), cx + 6, FLOOR + 4.35, Z0 + 2.5); run.receiveShadow = true;
  const runTop = put(box(RW - 14, 0.3, 5.3, solidMat(PAL.benchTop, 0.55)), cx + 6, -0.15, Z0 + 2.65); runTop.receiveShadow = true;
  g.add(run, runTop);
  for (let i = 0; i < 9; i++) g.add(put(box(4.2, 7.6, 0.05, solidMat(PAL.cabinetFront, 0.5)), X0 + 15.3 + i * 4.4, FLOOR + 4.6, Z0 + 5.03));
  const hood = new THREE.Group();
  hood.add(put(box(11, 28, 6, white), 0, 5, 0), put(box(9.6, 9.5, 0.2, solidMat(0x23272b, 0.8)), 0, 5.2, 2.92));
  const sash = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 6.2), glassMat(0xdfeef5, 0.25, THREE.DoubleSide)); sash.position.set(0, 6.8, 3.06); sash.renderOrder = 3;
  hood.add(sash, put(box(9.8, 0.25, 0.25, steel), 0, 3.7, 3.1), put(box(9.6, 0.3, 5.6, solidMat(PAL.benchTop, 0.55)), 0, 0.3, 0));
  g.add(put(hood, X0 + 6.5, 0, Z0 + 3.05));
  for (let s = 0; s < 2; s++) {
    const y = 5 + s * 4.2, shelf = new THREE.Mesh(new THREE.BoxGeometry(20, 0.12, 2.2), glassMat(0xdfeef5, 0.3, THREE.DoubleSide)); shelf.renderOrder = 3;
    g.add(put(shelf, -6, y, Z0 + 1.3));
    for (let i = 0; i < 9; i++) {
      const amber = (i + s) % 4 === 3, b = new THREE.Group(), h = 1.9;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, h, 20), amber ? solidMat(PAL.amber, 0.25) : glassMat(0xffffff, 0.3)); body.position.y = h / 2; body.renderOrder = 3;
      const cap = put(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.3, 16), solidMat(amber ? 0x202326 : PAL.accent, 0.5)), 0, h + 0.15, 0);
      const lab = put(box(0.8, 0.8, 0.02, solidMat(0xffffff, 0.9)), 0, h * 0.45, 0.56);
      b.add(body, cap, lab); g.add(put(b, -14.5 + i * 2.1, y + 0.06, Z0 + 1.3));
    }
    g.add(put(box(0.12, 9, 0.12, steel), -16, 6.5, Z0 + 0.3), put(box(0.12, 9, 0.12, steel), 4, 6.5, Z0 + 0.3));
  }
  }
  if (kind === 'lab') {
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(14.4, 8.8), new THREE.MeshStandardMaterial({ map: periodicTexture(), roughness: 0.9 }));
  g.add(put(poster, 16.5, 8.4, Z0 + 0.12), put(box(14.8, 9.2, 0.1, steel), 16.5, 8.4, Z0 + 0.05));

  if (!photo) {
  // Tường phải: tủ cao; tường trước: bảng trắng
  for (let i = 0; i < 4; i++) { const c = put(box(4, 24, 7.6, white), X1 - 2, FLOOR + 12, Z0 + 9 + i * 7.9); c.castShadow = true; g.add(c, put(box(0.05, 23.2, 7.2, solidMat(PAL.cabinetFront, 0.5)), X1 - 4.03, FLOOR + 12, Z0 + 9 + i * 7.9), put(box(0.07, 1.6, 0.07, steel), X1 - 4.1, 1, Z0 + 6 + i * 7.9)); }
  g.add(put(box(24, 11, 0.12, solidMat(0xfafbfb, 0.35)), cx - 2, 7.5, Z1 - 0.1), put(box(24.4, 11.4, 0.08, steel), cx - 2, 7.5, Z1 - 0.05));

  }
  // Bàn đảo thứ hai phía sau có chậu rửa, ghế đẩu xanh
  g.add(put(makeIsland({ sink: true }), 0.5, 0, -10.5));
  [[-5, -5.2], [1, -5.2], [7, -5.2], [-4, 6.4], [6, 6.4]].forEach(([x, z]) => g.add(put(makeStool(), x, 0, z)));
  }
  return g;
}

export function addLights(scene, mobile) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9dde1, 1.7));
  const sun = new THREE.DirectionalLight(0xfff8ee, 2.1);
  sun.position.set(-13, 15, 9); sun.castShadow = true;
  const s = mobile ? 1024 : 2048; sun.shadow.mapSize.set(s, s);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 50 });
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03; sun.shadow.radius = 5;
  scene.add(sun);
}
