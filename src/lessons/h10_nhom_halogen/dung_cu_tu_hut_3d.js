// Bộ điều chế khí trong tủ hút, dựng KHỐI (27/11, chủ: "Làm tủ hút"): giá kẹp, bình cầu có nhánh, phễu nhỏ giọt, bình rửa khí, cốc NaOH.
// Thay các tấm ảnh phẳng của kit/labware_l1.js ở bàn mới của bài Halogen. Mỗi món giữ đúng userData mà kit/labset.js gọi
// (port, top, update, setFizz, setOn, setLevel, setColor) nên giáo án và bộ máy không phải đổi.
import * as T from 'three';
import { glassShell, contactShadow } from '../../kit/materials.js';
import { makeBeaker } from '../../kit/labware2.js';

const GLASS = 0xc3d9df, RIM = '#4f7480';
const solid = (color, o = {}) => new T.MeshStandardMaterial({ color, roughness: .5, ...o });
const tubeGlass = () => new T.MeshStandardMaterial({ color: '#cfe3e8', roughness: .18, transparent: true, opacity: .55, depthWrite: false });
const liquidOf = (color, opacity) => new T.MeshStandardMaterial({ color, roughness: .12, transparent: true, opacity, depthWrite: false });
const lathe = (pts, seg = 48) => new T.LatheGeometry(pts.map(([x, y]) => new T.Vector2(x, y)), seg);
function add(parent, geometry, material, x = 0, y = 0, z = 0, order = 0) {
  const m = new T.Mesh(geometry, material); m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = !material.transparent; if (order) m.renderOrder = order;
  parent.add(m); return m;
}
// Thành thuỷ tinh có độ dày: mặt trong lùi vào t so với mặt ngoài.
function shell(parent, pts, t = .014, opacity = .34) {
  const inner = pts.map(([x, y], i) => [Math.max(0, x - t), i === 0 ? y + t : y]);
  const g = glassShell(lathe(pts), lathe(inner), GLASS, opacity); parent.add(g); return g;
}
// Vòng viền sẫm ở miệng và vai: giữ dáng món thuỷ tinh trên nền sáng của vách tủ.
function rim(parent, r, y, w = .007) {
  const m = add(parent, new T.TorusGeometry(r, w, 8, 40), new T.MeshBasicMaterial({ color: RIM, transparent: true, opacity: .85 }), 0, y, 0, 5);
  m.rotation.x = Math.PI / 2; return m;
}
// Ống thuỷ tinh thẳng nối hai điểm.
function rod(parent, a, b, r, material, order = 4) {
  const A = new T.Vector3(...a), B = new T.Vector3(...b), d = B.clone().sub(A), m = add(parent, new T.CylinderGeometry(r, r, d.length(), 14), material, 0, 0, 0, order);
  m.position.copy(A).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); return m;
}
// Cột bọt khí: set(k) từ 0 tới 1, update(dt) cho bọt nổi lên.
function bubbles(parent, { x = 0, z = 0, r = .1, y0 = .08, y1 = .5, n = 18, size = .022, color = 0xffffff }) {
  const g = new T.Group(), mat = new T.MeshBasicMaterial({ color, transparent: true, opacity: .8, depthWrite: false }), geo = new T.SphereGeometry(size, 8, 6), P = [];
  for (let i = 0; i < n; i++) { const m = new T.Mesh(geo, mat); m.renderOrder = 6; g.add(m); P.push({ m, a: Math.random() * 6.28, rr: Math.random() * r, y: y0 + Math.random() * (y1 - y0), v: .25 + Math.random() * .35 }); }
  let k = 0; g.visible = false; g.position.set(x, 0, z); parent.add(g);
  return {
    set(v) { k = v || 0; },
    update(dt) { g.visible = k > .02; if (!g.visible) return; mat.opacity = .35 + .5 * k; P.forEach(p => { p.y += p.v * dt * (.5 + k); if (p.y > y1) { p.y = y0; p.a = Math.random() * 6.28; p.rr = Math.random() * r; } p.m.position.set(Math.cos(p.a) * p.rr, p.y, Math.sin(p.a) * p.rr); }); },
  };
}

// Giá sắt: đế, cọc, khớp, tay kẹp ôm cổ bình cầu. grip = [dx, dz]: chỗ cổ bình so với cọc.
export function makeHoodStand({ h = 2.9, clampY = .95, grip = [.5, .4] } = {}) {
  const g = new T.Group(), iron = solid('#33434b', { metalness: .55, roughness: .42 }), steel = solid('#aab7bd', { metalness: .75, roughness: .28 });
  add(g, new T.BoxGeometry(.86, .055, .46), iron, .1, .0275, -.06);
  add(g, new T.CylinderGeometry(.034, .034, h, 16), steel, 0, h / 2, 0);
  add(g, new T.SphereGeometry(.04, 12, 8), steel, 0, h, 0);
  add(g, new T.BoxGeometry(.12, .12, .12), iron, 0, clampY, 0);
  const knob = add(g, new T.CylinderGeometry(.03, .03, .1, 10), iron, 0, clampY, -.1); knob.rotation.x = Math.PI / 2;
  const L = Math.hypot(grip[0], grip[1]), ux = grip[0] / L, uz = grip[1] / L, R = .115;
  rod(g, [0, clampY, 0], [ux * (L - R), clampY, uz * (L - R)], .022, steel, 0);
  const jaw = add(g, new T.TorusGeometry(R, .02, 8, 28, Math.PI * 1.55), iron, grip[0], clampY, grip[1]);
  jaw.rotation.x = Math.PI / 2; jaw.rotation.z = Math.atan2(uz, ux) + Math.PI - Math.PI * .775 + Math.PI; // miệng kẹp quay ra xa cọc
  g.add(contactShadow(.55, .3));
  g.userData = { h };
  return g;
}

// Bình cầu có nhánh: tinh thể tím KMnO₄ dưới đáy, nút cao su có lỗ cho chuôi phễu, nhánh ngang là đầu ra của khí (port).
export function makeHoodFlask({ h = 1.45 } = {}) {
  const g = new T.Group(), R = .36, cy = R + .02, neck = .092, pts = [];
  for (let i = 0; i <= 16; i++) { const a = -Math.PI / 2 + (Math.PI * .5 + 1.22) * i / 16; pts.push([Math.max(0, R * Math.cos(a)), cy + R * Math.sin(a)]); }
  pts.push([.1, cy + R * .97 + .05], [neck, .88], [neck, h - .05], [neck + .016, h]);
  const cm = solid('#4c1d95', { roughness: .35, metalness: .2 });
  for (let i = 0; i < 16; i++) {
    const rr = Math.random() * .2, a = Math.random() * 6.28, c = add(g, new T.OctahedronGeometry(.032 + Math.random() * .024), cm, Math.cos(a) * rr, cy - Math.sqrt(R * R - rr * rr) + .04 + Math.random() * .02, Math.sin(a) * rr);
    c.rotation.set(Math.random() * 3, Math.random() * 3, 0); c.castShadow = false;
  }
  const liquid = add(g, new T.SphereGeometry(R - .02, 28, 14, 0, Math.PI * 2, Math.PI * .6, Math.PI * .4), liquidOf('#7c3aed', 0), 0, cy, 0, 3);
  const top = add(g, new T.CircleGeometry((R - .02) * Math.sin(Math.PI * .6), 28), liquidOf('#8b5cf6', 0), 0, cy + (R - .02) * Math.cos(Math.PI * .6), 0, 3); top.rotation.x = -Math.PI / 2;
  const fizz = bubbles(g, { r: .17, y0: .1, y1: cy + .05, n: 26, color: 0xe9f5c8 });
  shell(g, pts); rim(g, neck + .016, h); rim(g, neck + .004, .88, .005);
  const armY = h * .62, glass = tubeGlass();
  rod(g, [neck - .01, armY + .05, 0], [.5, armY, 0], .03, glass); // nhánh hơi chúc xuống, đầu nhánh = port
  const tip = add(g, new T.TorusGeometry(.03, .006, 6, 20), new T.MeshBasicMaterial({ color: RIM }), .5, armY, 0, 5); tip.rotation.y = Math.PI / 2;
  add(g, new T.CylinderGeometry(.1, .082, .11, 24), solid('#7a3b1d', { roughness: .8 }), 0, h + .01, 0); // nút cao su
  g.add(contactShadow(.5, .32));
  g.userData = { port: new T.Vector3(.5, armY, 0), top: h, update: fizz.update,
    setFizz(k) { fizz.set(k); liquid.material.opacity = Math.min(.5, k * .65); top.material.opacity = Math.min(.6, k * .8); } };
  return g;
}

// Phễu nhỏ giọt: bầu thuỷ tinh chứa HCl đặc, khoá nhám ở cuống (tay khoá cam: nằm ngang = khoá, dựng đứng = mở), chuôi cắm qua nút bình cầu.
export function makeHoodFunnel({ h = 1.35 } = {}) {
  const g = new T.Group(), tapY = h * .3, glass = tubeGlass();
  rod(g, [0, -.34, 0], [0, tapY + .08, 0], .024, glass); // chuôi dài xuống trong cổ bình
  const body = [[.03, tapY + .06], [.05, tapY + .1], [.16, tapY + .27], [.195, tapY + .42], [.195, h - .36], [.16, h - .24], [.075, h - .16], [.068, h - .06], [.082, h - .04]];
  const acid = body.slice(0, 5).map(([x, y]) => [Math.max(0, x - .022), y + .012]); acid.unshift([0, acid[0][1]]); acid.push([0, acid[acid.length - 1][1]]);
  add(g, lathe(acid, 40), liquidOf('#e6ecb8', .72), 0, 0, 0, 3);
  shell(g, body, .012, .44); rim(g, .082, h - .04); rim(g, .19, acid[acid.length - 1][1], .005); rim(g, .197, h - .36, .005); rim(g, .078, h - .16, .005);
  add(g, new T.CylinderGeometry(.07, .055, .1, 20), solid('#d8e4e7', { roughness: .2, transparent: true, opacity: .8 }), 0, h + .005, 0, 4); // nút nhám
  const barrel = add(g, new T.CylinderGeometry(.04, .034, .2, 16), solid('#dfe9ec', { roughness: .25 }), 0, tapY, .02); barrel.rotation.x = Math.PI / 2;
  const tap = add(g, new T.BoxGeometry(.32, .06, .05), solid('#e2590f', { roughness: .45 }), 0, tapY, .15);
  const drop = add(g, new T.SphereGeometry(.026, 10, 8), liquidOf('#f2f3d4', .9), 0, 0, 0, 6); drop.visible = false;
  let open = false, t = 0;
  g.userData = { top: h, on: false,
    setOn(v) { open = !!v; g.userData.on = open; tap.rotation.z = open ? Math.PI / 2 : 0; },
    update(dt) { drop.visible = open; if (!open) return; t = (t + dt * 1.6) % 1; drop.position.set(0, -.36 - t * .5, 0); } };
  return g;
}

// Bình rửa khí: ống dài dẫn khí xuống dưới mặt chất lỏng (bọt nổi lên), ống ngắn lấy khí đã rửa ra (port).
export function makeHoodWash({ h = 1.15 } = {}) {
  const g = new T.Group(), r = .25, sh = h * .62, glass = tubeGlass(), level = h * .42;
  add(g, new T.CylinderGeometry(r - .02, r - .02, level - .03, 32), liquidOf('#cfe6f2', .5), 0, .03 + (level - .03) / 2, 0, 3);
  const surf = add(g, new T.CircleGeometry(r - .02, 32), liquidOf('#e4f2f8', .7), 0, level, 0, 3); surf.rotation.x = -Math.PI / 2;
  const fizz = bubbles(g, { r: .06, y0: .12, y1: level, n: 18 });
  shell(g, [[0, 0], [r - .03, 0], [r, .03], [r, sh], [r - .03, sh + .09], [.12, sh + .17], [.11, h - .2], [.125, h - .18]]);
  rim(g, .125, h - .18); rim(g, r, sh, .005);
  add(g, new T.CylinderGeometry(.118, .1, .12, 24), solid('#7a3b1d', { roughness: .8 }), 0, h - .14, 0);
  rod(g, [0, .1, 0], [0, h - .03, 0], .026, glass);        // ống dài: khí vào, đầu dưới ngập trong chất lỏng
  rod(g, [.07, sh + .02, 0], [.07, h - .06, 0], .026, glass); // ống ngắn: khí ra
  g.add(contactShadow(.4, .32));
  g.userData = { top: h, port: new T.Vector3(.07, h - .06, 0), update: fizz.update, setFizz: fizz.set };
  return g;
}

// Cốc NaOH: cốc thuỷ tinh dựng khối của bàn thực hành, thêm ống dẫn khí cắm xuống dung dịch và bọt khi khí thừa sục vào.
export function makeHoodTrap({ h = .85, fill = .55 } = {}) {
  const g = makeBeaker({ h, r: .3 * h / .85 }), u = g.userData;
  const setLevel = k => u.setVolume(Math.max(0, Math.min(1, k / .8)) * u.max); setLevel(fill);
  const fizz = bubbles(g, { r: .1, y0: .1, y1: h * Math.max(fill, .1), n: 18 });
  rod(g, [0, .1, 0], [0, h + .1, 0], .026, tubeGlass());
  Object.assign(u, { top: h, update: fizz.update, setFizz: fizz.set, setLevel, setColor: hex => u.liquid.material.color.set(hex) });
  return g;
}
